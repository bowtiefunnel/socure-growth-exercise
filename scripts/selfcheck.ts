/**
 * Offline invariant check — no network, no keys, no Trigger.dev.
 * Fails loudly if scoring, routing, or suppression logic breaks. `npm run check`
 */
import assert from "node:assert";
import { parseCsv } from "../lib/csv.js";
import { leadsCsv, customersCsv } from "../lib/assets.js";
import { buildSuppressionSet, isSuppressed } from "../lib/suppression.js";
import { scoreLead } from "../lib/scoring.js";
import { assertEnrichmentContract } from "../lib/enrich.js";
import { groupAccounts, routeAccount } from "../lib/routing.js";
import type { Lead } from "../lib/types.js";

const leads: Lead[] = parseCsv(leadsCsv()).map((r) => ({
  id: Number(r.id), name: r.name, email: r.email, domain: r.domain, title: r.title,
}));
assert.equal(leads.length, 30, `expected 30 leads, got ${leads.length}`);

// Gate 0 — suppression
const owned = buildSuppressionSet(customersCsv());
assert.equal(owned.size, 34, `suppression set: 43 accounts − 9 without a clean domain = 34, got ${owned.size}`);
assert.equal(leads.filter((l) => isSuppressed(l, owned)).length, 0, "no mock lead should match a real customer");
const synthetic: Lead = { id: 99, name: "Test", email: "x@chime.com", domain: "chime.com", title: "CRO" };
assert.ok(isSuppressed(synthetic, owned), "known customer domain must suppress");

// Scoring — calibration leads from the ICP blueprint
for (const lead of leads) {
  lead.score = scoreLead(lead);
  const sum = Object.values(lead.score.breakdown).reduce((s, b) => s + b.points, 0);
  assert.equal(sum, lead.score.total, `breakdown != total for ${lead.domain}`);
}
const byId = (id: number) => leads.find((l) => l.id === id)!;
assert.equal(byId(1).score!.tier, "hot", "Rachel Ferro (VP Fraud & Risk @ financial) must be hot");
assert.ok(byId(1).score!.total >= 85, `Rachel expected ≥85, got ${byId(1).score!.total}`);
assert.equal(byId(8).score!.tier, "cold", "IT Manager @ manufacturing must be cold");
assert.ok(byId(8).score!.dq_reason, "manufacturing must carry dq_reason");
assert.equal(byId(7).score!.tier, "cold", "Registrar @ .edu must be cold");
assert.ok(byId(7).score!.dq_reason, ".edu must carry dq_reason");

// Routing — account-first, zero unrouted
const accounts = groupAccounts(leads);
assert.equal(accounts.length, 30, "30 unique domains → 30 accounts");
for (const a of accounts) a.routing = routeAccount(a);
assert.equal(accounts.filter((a) => !a.routing).length, 0, "zero unrouted is a run invariant");
const ferroway = accounts.find((a) => a.domain.includes("ferroway"))!;
assert.ok(ferroway.routing!.reason.includes("unmatched_vertical"), "ferroway must route via flagged fallback");
assert.equal(ferroway.routing!.rep_id, "rep_c", "fallback rep is rep_c");

// Data contract — the brief's required properties, enforced per lead
const contractLead: Lead = {
  ...leads[0],
  enrichment: {
    industry: "finserv_fintech_payments", sub_vertical: "financial",
    employee_range: "unknown", est_revenue: "unknown",
    tech_signals: [], source: "symbolic", confidence: 0.6,
  },
};
assertEnrichmentContract(contractLead); // complete record passes
assert.throws(
  () => assertEnrichmentContract({ ...contractLead, enrichment: { ...contractLead.enrichment!, source: "" as never } }),
  /data contract violated/, "missing provenance must throw");
assert.throws(
  () => assertEnrichmentContract({ ...contractLead, email: "" }),
  /data contract violated/, "missing identity field must throw");

// Ownership — owned account routes to owner, NOT territory/new-lead rep
const ferrowayOwned = routeAccount(ferroway, {
  [ferroway.domain]: { rep_id: "rep_a", assigned_at: "2026-07-01", run_id: "run_prior" },
});
assert.equal(ferrowayOwned.rep_id, "rep_a", "owned account must route to its owner, not fallback rep_c");
assert.equal(ferrowayOwned.owner_status, "existing_owner");
assert.equal(routeAccount(ferroway, {}).owner_status, "new_assignment", "unowned account gets territory assignment");
// stale owner (rep left config) falls through to fresh assignment
assert.equal(
  routeAccount(ferroway, { [ferroway.domain]: { rep_id: "rep_gone", assigned_at: "2026-07-01", run_id: "x" } }).owner_status,
  "new_assignment", "stale owner must fall through");

// Buying committee — two leads, same account: one owner, depth 2, committee-best score
const committee = groupAccounts([
  { id: 90, name: "A", email: "a@corestonebank.com", domain: "corestonebank.com", title: "CRO", score: { total: 90, breakdown: {}, tier: "hot" } },
  { id: 91, name: "B", email: "b@corestonebank.com", domain: "corestonebank.com", title: "IT Manager", score: { total: 28, breakdown: {}, tier: "cold" } },
] as Lead[]);
assert.equal(committee.length, 1, "same domain → one account");
assert.equal(committee[0].committee_depth, 2, "buying committee detected");
assert.equal(committee[0].account_score, 90, "account score = committee-best (MAX), not avg/sum");
assert.equal(committee[0].tier, "hot", "account tier follows best committee member");

// Distribution report
const dist = (key: (l: Lead) => string) =>
  leads.reduce<Record<string, number>>((m, l) => ((m[key(l)] = (m[key(l)] ?? 0) + 1), m), {});
console.log("tiers:", dist((l) => l.score!.tier));
console.log("reps :", Object.fromEntries(accounts.reduce<Map<string, number>>((m, a) => m.set(a.routing!.rep_id, (m.get(a.routing!.rep_id) ?? 0) + 1), new Map())));
console.log("hot leads:", leads.filter((l) => l.score!.tier === "hot").map((l) => `${l.name} (${l.score!.total})`).join(", "));
console.log("\n✓ all invariants hold — 30 leads, 0 suppressed, 0 unrouted, calibration leads score as designed");
