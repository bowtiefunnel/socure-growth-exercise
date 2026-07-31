# TargetCo Growth Engineering Exercise

30 mock leads → suppress → enrich → score → route → enable. Deterministic core,
LLM only where language is the deliverable. The repo is organized by the
assignment's structure: **Part 1** (build + architecture note + instrumentation
plan) and **Part 2** (applied case).

---

## Part 1 — Build: Lead Enrichment & Routing Pipeline

### Deliverable 1 · The working build — it runs

```bash
npm install
npm run pipeline   # full local run, ZERO keys → output/routed_leads.csv + .json
npm run check      # offline invariant tests (scoring, routing, suppression, ownership)
```

Cloud: deployed to **Trigger.dev** as task **`part-1-assignment`** (`npm run deploy`).
Payload `{}` runs enrichment → scoring → routing → decision brief. Verified prod run:
30/30 routed, 0 unrouted, tiers 8 hot / 19 warm / 3 cold — identical to the local run.

Battle cards are **Phase 2** and live in their own repo:
[`bowtiefunnel/new-lead-account-battle-cards`](https://github.com/bowtiefunnel/new-lead-account-battle-cards) —
a separate Trigger.dev project (own deploy, own history), not a task in this one.
Its `battle-cards-workflow` task takes `{ accounts: Account[] }` — pass the `accounts`
array from this repo's `output/routed_leads.json` (Trigger.dev cloud runs each get an
isolated, ephemeral filesystem, so it can't read this repo's output off disk).

Per the brief's three bullets:

- **Enriches** each lead with firmographic/technographic data — free/public method
  first: waterfall **Bitscale** (0.9) → **nRev** (0.85) → **DNS MX + RDAP** (0.75,
  free/keyless, live truth even on mock domains) → **symbolic** (0.6) → **LLM
  residue** (≤0.6 code-clamped; classifies, never scores). Every field carries
  `source` + `confidence` — a fallback is never dressed as vendor data.
- **Scores** each lead against a defined ICP — symbolic rubric
  ([`config/icp-rubric.json`](config/icp-rubric.json)), 0–100 across 4 dimensions,
  derived from a 43-account reverse-ICP of TargetCo's real customer base
  ([`docs/grounding/`](docs/grounding/)). Every score ships its `breakdown`;
  every DQ ships its `dq_reason`.
- **Routes** each lead to one of three mock reps by written rules
  ([`config/routing-rules.json`](config/routing-rules.json)) — account-first
  (the buyer is a committee), ownership ledger beats territory rules, zero
  unrouted is a run invariant.

**Data contract — every property the brief names, with live coverage:**

| Property | Category | Filled by | Coverage (live run) |
|---|---|---|---|
| `name` / `email` / `domain` / `title` | Identity (from the dataset) | CSV ingest, never mutated | 30/30 each |
| `industry`, `sub_vertical` | Firmographic | any layer — symbolic floor guarantees 100% | 30/30 |
| `employee_range` | Firmographic | Bitscale / nRev / LLM research | 10/30 |
| `est_revenue` | Firmographic | Bitscale / nRev / LLM research | 8/30 |
| `tech_signals[]` | Technographic | DNS MX (email stack), RDAP (domain age), research evidence | 30/30 |
| `source`, `confidence` | Provenance | code-stamped, LLM confidence code-clamped | 30/30 |

The 10/30 and 8/30 rows are **data-reality gaps, not pipeline gaps**: those fields
are only fillable for companies that exist. On real prospect data the vendor
layers (0.9/0.85) push these toward full coverage.

### Deliverable 2 · One-page architecture note

**→ [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — tools/APIs,
hosting, data model, and why, with the step-by-step SYMBOLIC/NEURAL/HUMAN table.
Rendered: [`docs/architecture.html`](docs/architecture.html) ·
visual topography: [`docs/topography.html`](docs/topography.html).

The one-paragraph version: **Trigger.dev** hosts the pipeline (per-stage retries,
structured logs, shareable run link); enrichment cascades from vendors through
free public APIs to a bounded LLM residue; all decision logic lives in `config/`
(changing the ICP or territories is a config edit, never a code edit); **Claude
Haiku** appears at exactly three touchpoints (residue, battle cards, brief
narration), each **Langfuse**-traced; **Slack** is the production delivery rail.
Data model: one `Lead` accretes `enrichment → score → routing`, grouped into
`Account` — the same shape serves both bowtie sides.

### Deliverable 3 · Short instrumentation plan

**→ [`docs/OPERATIONS.md`](docs/OPERATIONS.md)** (standing plan) ·
[`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) (staged per rollout phase).

What's tracked: per-run tier distribution + rep load + deltas vs. prior run;
per-stage success/retries/duration (Trigger.dev); LLM cost/tokens/latency +
groundedness eval per card (Langfuse). Alerts: any unrouted lead (run fails
loudly) · 0 hot or >40% hot · >50% of book on one rep · enrichment trust <50%.

**How I'd know it's actually working:** day one — 30/30 exit with rep + score +
human-readable reason, zero unrouted, idempotent re-runs. Real signal —
**reply/meeting rate by tier**: if hot doesn't outperform warm, the rubric is
decoration; rep accept/decline reasons are the data that retunes it.

---

## Part 2 — Applied Case

**→ [`PART2.md`](PART2.md)** — converting Product-A usage into Product-B pipeline
across the Bowtie expansion bridge: readiness = **>85% license utilization +
daily admin engagement over a rolling 30-day window**, trigger on two consecutive
bi-weekly cycles; dual-track execution (CSM 1:1 + contact-based ad air cover);
zero-tooling stack (scheduled SQL → CSV → Zapier → CRM tasks + private Slack
alert); instrumented by four bridge metrics (signal-to-execution >90% in 48h,
discovery conversion >25%, pipeline $, expansion velocity <30 days).

---

## Supporting documents

| Doc | What it is |
|---|---|
| [`docs/SYSTEM-DESIGN.md`](docs/SYSTEM-DESIGN.md) ([html](docs/system-design.html)) | Component-by-component design: contracts, invariants, alternatives considered |
| [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) ([html](docs/implementation.html)) | Phased rollout: core → battle cards → adoption, incl. team training + Slack verification |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md) ([html](docs/operations.html)) | Instrumentation · maintenance · change management |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Original design spec + time-boxed build order |
| [`docs/icp-blueprint.md`](docs/icp-blueprint.md) · [`docs/grounding/`](docs/grounding/) | The ICP evidence chain: 43-logo reverse-ICP, adversarially-verified research memo |
