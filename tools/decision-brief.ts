import { task } from "@trigger.dev/sdk/v3";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { llmAvailable, tracedCompletion } from "../connections/llm.js";
import type { Account } from "../lib/types.js";

// ponytail: operator-calibratable assumptions, not data — stated in the brief itself.
const CONV = { hot: 0.25, warm: 0.1, cold: 0.02 } as const;
const ACV = 150_000;
const SCENARIOS = { conservative: 0.6, base: 1, optimistic: 1.4 } as const;

interface Snapshot {
  runId: string;
  at: string;
  tiers: Record<string, number>;
  reps: Record<string, number>;
  enrichmentSources: Record<string, number>;
}

const RUNS_DIR = join(process.cwd(), "memory", "runs");

function loadBaseline(): Snapshot | null {
  try {
    const files = readdirSync(RUNS_DIR).filter((f) => f.endsWith(".json")).sort();
    if (!files.length) return null;
    return JSON.parse(readFileSync(join(RUNS_DIR, files[files.length - 1]), "utf8"));
  } catch {
    return null;
  }
}

/** Workflow 5 — the 4Ws over the routed book. Symbolic computes; LLM only narrates computed numbers. */
export const decisionBrief = task({
  id: "decision-brief",
  run: async (payload: { runId: string; accounts: Account[]; suppressedCount: number }) => {
    const { accounts } = payload;
    const count = (fn: (a: Account) => string) =>
      accounts.reduce<Record<string, number>>((m, a) => ((m[fn(a)] = (m[fn(a)] ?? 0) + 1), m), {});

    const tiers = count((a) => a.tier);
    const reps = count((a) => a.routing?.rep_id ?? "unrouted");
    const enrichmentSources = count((a) => a.leads[0].enrichment?.source ?? "none");
    const trustScore = Math.round(((enrichmentSources["bitscale"] ?? 0) / accounts.length) * 100);

    const baseline = loadBaseline();
    const delta = (k: string) => (baseline ? (tiers[k] ?? 0) - (baseline.tiers[k] ?? 0) : null);

    const basePipeline = Object.entries(tiers).reduce(
      (sum, [tier, n]) => sum + n * (CONV[tier as keyof typeof CONV] ?? 0) * ACV, 0);
    const projections = Object.fromEntries(
      Object.entries(SCENARIOS).map(([k, m]) => [k, Math.round(basePipeline * m)]));

    // prescriptive triggers — symbolic rules, each with options
    const actions: string[] = [];
    const maxRepShare = Math.max(...Object.values(reps)) / accounts.length;
    if (maxRepShare > 0.5) actions.push(`Rep overload: one rep holds ${Math.round(maxRepShare * 100)}% of the book → rebalance territories, or stagger P2 SLA.`);
    if ((tiers["hot"] ?? 0) === 0) actions.push("Zero hot accounts → revisit rubric cutoffs or source a tighter list.");
    if (trustScore < 50) actions.push(`Enrichment trust ${trustScore}% (mostly fallback) → wire Bitscale before trusting vertical mix.`);
    if (!actions.length) actions.push("Book is balanced; work P1s same-day and re-run after first-touch outcomes land.");

    const brief = {
      what_happened: {
        tiers,
        vs_baseline: baseline
          ? Object.fromEntries(Object.keys(tiers).map((k) => [k, delta(k)]))
          : "first run — baseline is ICP-research priors; next run diffs against this snapshot",
      },
      current_state: { accounts: accounts.length, suppressed_to_expansion: payload.suppressedCount, reps, enrichment_trust_pct: trustScore, unrouted: reps["unrouted"] ?? 0 },
      whats_next: { assumptions: { conv: CONV, acv: ACV }, projected_pipeline_usd: projections },
      what_to_do: actions,
    };

    let md =
      `# Decision Brief — run ${payload.runId}\n\n` +
      `## 1 · What happened & why\nTiers: ${JSON.stringify(tiers)} · vs baseline: ${JSON.stringify(brief.what_happened.vs_baseline)}\n\n` +
      `## 2 · Current state\n${accounts.length} accounts routed (${brief.current_state.unrouted} unrouted) · ${payload.suppressedCount} suppressed → expansion book · rep load ${JSON.stringify(reps)} · enrichment trust ${trustScore}%\n\n` +
      `## 3 · What's likely next\nProjected pipeline (conv ${JSON.stringify(CONV)}, ACV $${ACV.toLocaleString()}): ${JSON.stringify(projections)}\n\n` +
      `## 4 · What to do\n${actions.map((a) => `- ${a}`).join("\n")}\n`;

    if (llmAvailable()) {
      md += `\n---\n${await tracedCompletion(
        "brief-narration",
        "Narrate this decision brief in 4 short sentences for a sales leader. Cite ONLY the numbers provided — inventing a number is a failure.",
        JSON.stringify(brief),
      )}\n`;
    }

    mkdirSync(RUNS_DIR, { recursive: true });
    const snapshot: Snapshot = { runId: payload.runId, at: new Date().toISOString(), tiers, reps, enrichmentSources };
    writeFileSync(join(RUNS_DIR, `${payload.runId}.json`), JSON.stringify(snapshot, null, 2));

    return { brief, md };
  },
});
