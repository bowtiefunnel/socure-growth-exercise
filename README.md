# Socure Growth Engineering Exercise — Lead Enrichment & Routing Pipeline

30 mock leads → suppress → enrich → score → route → enable. Deterministic core,
LLM only where language is the deliverable. Part 2 written case: [`PART2.md`](PART2.md).

## Run it

```bash
npm install
npm run pipeline   # full run, zero keys → output/routed_leads.csv + .json
npm run check      # offline invariant tests (scoring, routing, suppression, ownership)
```

Optional: `npm run dev` / `npm run deploy` run the same pipeline as Trigger.dev tasks
(retries, per-stage observability, run dashboard). LLM battle cards + brief narration
activate when `ANTHROPIC_API_KEY` is set (`.env.example`).

## Architecture (one page)

```
data/leads.csv ──► ingest ──► GATE 0 suppress ──► enrich ──► score ──► route ──► enable
                              (customer list:      cascade    rubric    account   battle cards
                               owned accounts ──► expansion   JSON      JSON      (LLM, gated)
                               book, Part 2)                                      + decision brief
```

**Design rule: JSON when code executes it · MD when the LLM reads it · CSV when it's records.**
All decision logic lives in `config/` — changing the ICP or territories is a config edit,
never a code edit. Prompts live in `instructions.md` + `prompts/`. `tools/` are dumb executors.

| Concern | Choice | Why |
|---|---|---|
| Enrichment | Waterfall: **Bitscale** (0.9, grid API) → **nRev** (0.85, webhook Play) → **DNS MX/A + RDAP** (0.75, free/keyless) → **symbolic** (0.6) → **LLM residue** (≤0.6, only <0.5-confidence leads, skill-governed) | Brief asks for a free/public method; DNS/RDAP return live truth even on mock domains (4/30 resolved — two run Google Workspace). Both vendors probe-first (Block-1 rule: verify response shape on 1 lead), env-gated, degrade gracefully. Every field carries `source` + `confidence` — a fallback is never dressed as vendor data. |
| Scoring | Symbolic rubric (`config/icp-rubric.json`), 0–100, 4 dimensions | Scores feed tracked metrics; an LLM-judged score drifts week-over-week. Every score ships its `breakdown`; DQs ship `dq_reason`. Rubric derives from a 43-account reverse-ICP of Socure's real customer base (`docs/grounding/`). |
| Routing | Account-first (`config/routing-rules.json`) + ownership ledger | The buyer is a committee — leads group to accounts (score = MAX), the account routes, leads inherit. Owned accounts route to their owner, never re-assigned; territory rules touch only unowned accounts. Zero-unrouted is a run invariant. |
| Suppression | Gate 0 set-membership vs. 34 known-customer domains | Existing customers aren't waste — they're the expansion book (Part 2), and they never burn acquisition spend. |
| LLM | Claude Haiku at exactly 3 touchpoints; Langfuse-traced | Battle cards + narration are language deliverables; everything else is code. Groundedness rule: cards may only cite adversarially-verified proof points (`prompts/messaging-net-new.md` evidence tiers). |
| Hosting | Trigger.dev cloud (TypeScript tasks) | Per-stage retries, structured logs, shareable run links; local `npm run pipeline` keeps the build runnable with zero setup. |
| Data model | One `Lead` object accretes (source fields never mutated) → grouped into `Account` | `{lead → enrichment{source,confidence} → score{total,breakdown,tier} → routing{rep,priority,owner_status}}`; same account shape serves both bowtie sides. |

## Data contract — every property the brief names, with live coverage

| Property | Category | Filled by | Coverage (live run) |
|---|---|---|---|
| `name` / `email` / `domain` / `title` | Identity (from the dataset) | CSV ingest, never mutated | 30/30 each |
| `industry`, `sub_vertical` | Firmographic | any layer — symbolic floor guarantees 100% | 30/30 |
| `employee_range` | Firmographic | Bitscale / nRev / LLM research | 10/30 |
| `est_revenue` | Firmographic | Bitscale / nRev / LLM research | 8/30 |
| `tech_signals[]` | Technographic | DNS MX (email stack), RDAP (domain age), vendor, research evidence | 30/30 |
| `source`, `confidence` | Provenance | code-stamped, LLM confidence code-clamped | 30/30 |

The 10/30 and 8/30 rows are **data-reality gaps, not pipeline gaps**: those fields
are only fillable for companies that exist. The research layer filled them for the
~10 mock domains that turned out to be real and honestly returned `unknown` for
the fictional ones — a pipeline reporting 30/30 there would be fabricating. On
real prospect data the vendor layers (0.9/0.85) push these toward full coverage.

## Instrumentation plan

**Per run (built):** tier distribution + rep load printed and written to
`output/`; decision brief computes deltas vs. prior run (`memory/runs/`), enrichment
trust score (% live-signal vs. fallback), and rules-triggered recommendations (4Ws).

**Pipeline health (Trigger.dev):** per-stage success/retries/duration; a failed
enrichment degrades one lead's confidence, never blocks the run.

**LLM (Langfuse):** cost, tokens, latency per call; groundedness eval on every
battle card — a card citing an unverified number fails.

**Alert thresholds:** any unrouted lead (invariant breach — run fails loudly) ·
tier skew (0 hot or >40% hot → rubric miscalibrated) · rep imbalance (>50% one rep) ·
enrichment trust <50% (don't trust vertical mix until sources improve).

**How I'd know it's actually working:** short-term — 30/30 exit with rep + score +
human-readable reason, zero unrouted, re-runs idempotent (ownership ledger stable,
no duplicate outputs). Real signal — reply/meeting rate by tier: if hot doesn't
outperform warm, the rubric is decoration; feed outcomes back as weight updates
(the CSM/rep accept-decline ledger is the training data).
