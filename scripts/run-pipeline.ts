/**
 * Local full-pipeline run — the "it should run" deliverable. No Trigger.dev, no keys:
 *   npm run pipeline
 * ingest → Gate 0 suppress → enrich (public APIs + symbolic) → score → route (account-first,
 * ownership ledger) → output/routed_leads.csv/.json + brief stats. Battle cards + LLM
 * narration run only in the Trigger.dev tasks (they need ANTHROPIC_API_KEY).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv, toCsv } from "../lib/csv.js";
import { leadsCsv, customersCsv } from "../lib/assets.js";
import { buildSuppressionSet, isSuppressed } from "../lib/suppression.js";
import { enrichLead, assertEnrichmentContract } from "../lib/enrich.js";
import { scoreLead } from "../lib/scoring.js";
import { groupAccounts, routeAccount } from "../lib/routing.js";
import { loadOwners, saveOwners } from "../lib/ownership.js";
import type { Account, Lead } from "../lib/types.js";

const leads: Lead[] = parseCsv(leadsCsv()).map((r) => ({
  id: Number(r.id), name: r.name, email: r.email, domain: r.domain, title: r.title,
}));

const owned = buildSuppressionSet(customersCsv());
const expansion = leads.filter((l) => isSuppressed(l, owned));
const acquisition = leads.filter((l) => !isSuppressed(l, owned));
console.log(`ingested ${leads.length} · suppressed→expansion ${expansion.length} · acquisition ${acquisition.length}`);

console.log("enriching (DNS/RDAP public probes, ~seconds)...");
await Promise.all(acquisition.map(async (l) => {
  l.enrichment = await enrichLead(l);
  assertEnrichmentContract(l); // brief's required properties, enforced per lead
  l.score = scoreLead(l);
}));

const owners = loadOwners();
const accounts: Account[] = groupAccounts(acquisition);
for (const a of accounts) {
  a.routing = routeAccount(a, owners);
  a.leads.forEach((l) => (l.routing = a.routing));
  if (a.routing.owner_status === "new_assignment") {
    owners[a.domain] = { rep_id: a.routing.rep_id, assigned_at: new Date().toISOString(), run_id: "local" };
  }
}
saveOwners(owners);

const outDir = join(process.cwd(), "output");
mkdirSync(outDir, { recursive: true });
const rows = acquisition.map((l) => ({
  id: l.id, name: l.name, email: l.email, domain: l.domain, title: l.title,
  industry: l.enrichment?.industry, tech_signals: l.enrichment?.tech_signals.join("|"),
  enrichment_source: l.enrichment?.source, enrichment_confidence: l.enrichment?.confidence,
  score: l.score?.total, tier: l.score?.tier, dq_reason: l.score?.dq_reason ?? "",
  rep: l.routing?.rep, priority: l.routing?.priority, sla: l.routing?.sla,
  owner_status: l.routing?.owner_status,
  committee_depth: accounts.find((a) => a.leads.includes(l))?.committee_depth ?? 1,
  reason: l.routing?.reason,
}));
writeFileSync(join(outDir, "routed_leads.csv"), toCsv(rows));
writeFileSync(join(outDir, "routed_leads.json"), JSON.stringify({ accounts, expansion }, null, 2));

const count = (f: (l: Lead) => string) =>
  acquisition.reduce<Record<string, number>>((m, l) => ((m[f(l)] = (m[f(l)] ?? 0) + 1), m), {});
const tiers = count((l) => l.score!.tier);
const reps = count((l) => l.routing!.rep_id);
const sources = count((l) => l.enrichment!.source);
const unrouted = acquisition.filter((l) => !l.routing).length;

console.log("\ntiers  :", tiers);
console.log("reps   :", reps);
console.log("enrich :", sources);
console.log(`\n${unrouted === 0 ? "✓" : "✗"} ${acquisition.length}/${acquisition.length} routed, ${unrouted} unrouted → output/routed_leads.csv + .json`);
if (unrouted > 0) process.exit(1);
