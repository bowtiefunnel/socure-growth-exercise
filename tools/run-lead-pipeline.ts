import { task } from "@trigger.dev/sdk/v3";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv, toCsv } from "../lib/csv.js";
import { leadsCsv, customersCsv } from "../lib/assets.js";
import { buildSuppressionSet, isSuppressed } from "../lib/suppression.js";
import { enrichLead, assertEnrichmentContract } from "../lib/enrich.js";
import { scoreLead } from "../lib/scoring.js";
import { groupAccounts, routeAccount } from "../lib/routing.js";
import { loadOwners, saveOwners } from "../lib/ownership.js";
import { battleCard } from "./battle-card.js";
import { decisionBrief } from "./decision-brief.js";
import type { Account, Lead } from "../lib/types.js";

/**
 * Orchestrator: ingest → Gate 0 suppress → enrich → score → route (account-first) →
 * battle cards (hot/warm, subtask = per-card retry) → decision brief.
 * Idempotent: outputs are deterministic filenames — a re-run overwrites, never duplicates.
 */
export const runLeadPipeline = task({
  id: "run-lead-pipeline",
  maxDuration: 600,
  run: async (payload: { battleCards?: boolean }, { ctx }) => {
    // 1 · ingest
    const leads: Lead[] = parseCsv(leadsCsv()).map((r) => ({
      id: Number(r.id), name: r.name, email: r.email, domain: r.domain, title: r.title,
    }));

    // 2 · Gate 0 — suppress vs owned accounts BEFORE any enrichment spend
    const owned = buildSuppressionSet(customersCsv());
    const expansion = leads.filter((l) => isSuppressed(l, owned));
    const acquisition = leads.filter((l) => !isSuppressed(l, owned));
    // expansion book is Part 2's input — handed off, never dropped
    expansion.forEach((l) => (l.suppressed = true));

    // 3 · enrich (cascade) + 4 · score (symbolic, breakdown always ships)
    for (const lead of acquisition) {
      lead.enrichment = await enrichLead(lead);
      assertEnrichmentContract(lead); // brief's required properties, enforced per lead
      lead.score = scoreLead(lead);
    }

    // 5 · route account-first; leads inherit. Owned accounts → owner; only unowned hit territory rules.
    const owners = loadOwners();
    const accounts: Account[] = groupAccounts(acquisition);
    for (const account of accounts) {
      account.routing = routeAccount(account, owners);
      account.leads.forEach((l) => (l.routing = account.routing));
      if (account.routing.owner_status === "new_assignment") {
        owners[account.domain] = { rep_id: account.routing.rep_id, assigned_at: new Date().toISOString(), run_id: ctx.run.id };
      }
    }
    saveOwners(owners);

    // 6 · battle cards — hot/warm only, human-gated downstream. OPT-IN via payload
    // { battleCards: true } so test runs never spend LLM tokens by accident (Phase 2 capability).
    const outDir = join(process.cwd(), "output");
    mkdirSync(join(outDir, "battle_cards"), { recursive: true });
    let cardCount = 0;
    if (payload.battleCards) {
      const cardTargets = accounts.filter((a) => a.tier !== "cold");
      const cards = await battleCard.batchTriggerAndWait(cardTargets.map((a) => ({ payload: { account: a } })));
      for (const r of cards.runs) {
        if (r.ok && !r.output.skipped) {
          writeFileSync(join(outDir, "battle_cards", `${r.output.domain}.md`), r.output.card!);
          const acct = accounts.find((a) => a.domain === r.output.domain);
          acct?.leads.forEach((l) => (l.battle_card_path = `battle_cards/${r.output.domain}.md`));
          cardCount++;
        }
      }
    }

    // 7 · decision brief (4Ws) — reads/writes memory/runs baseline
    const brief = await decisionBrief.triggerAndWait({
      runId: ctx.run.id, accounts, suppressedCount: expansion.length,
    });

    // 8 · outputs
    const rows = acquisition.map((l) => ({
      id: l.id, name: l.name, email: l.email, domain: l.domain, title: l.title,
      industry: l.enrichment?.industry, enrichment_source: l.enrichment?.source,
      enrichment_confidence: l.enrichment?.confidence, score: l.score?.total,
      tier: l.score?.tier, dq_reason: l.score?.dq_reason ?? "",
      rep: l.routing?.rep, priority: l.routing?.priority, sla: l.routing?.sla,
      owner_status: l.routing?.owner_status,
      buying_committee: (accounts.find((a) => a.leads.includes(l))?.committee_depth ?? 1) > 1 ? "yes" : "no",
      committee_depth: accounts.find((a) => a.leads.includes(l))?.committee_depth ?? 1,
      reason: l.routing?.reason, battle_card: l.battle_card_path ?? "",
    }));
    writeFileSync(join(outDir, "routed_leads.csv"), toCsv(rows));
    writeFileSync(join(outDir, "routed_leads.json"), JSON.stringify({ accounts, expansion }, null, 2));
    if (brief.ok) writeFileSync(join(outDir, "decision_brief.md"), brief.output.md);

    // invariant: zero unrouted
    const unrouted = acquisition.filter((l) => !l.routing).length;
    if (unrouted > 0) throw new Error(`${unrouted} leads unrouted — run invariant violated`);

    return {
      leads: leads.length,
      suppressed_to_expansion: expansion.length,
      routed: acquisition.length,
      tiers: brief.ok ? brief.output.brief.what_happened.tiers : undefined,
      battle_cards: cardCount,
    };
  },
});
