# Architecture — One Page

30 mock leads → suppress → enrich → score → route → enable. **Deterministic pipeline
(0-100-0 core) with two gated language leaves** — the LLM appears only where language
is the deliverable or the world is genuinely ambiguous; code decides everything a
metric tracks.

```
data/leads.csv ─► ingest ─► GATE 0 suppress ─► account-resolve ─► enrich ─► score ─► route ─► enable
                            (34 customers →     (group by domain,  cascade    rubric   rules +  battle cards (LLM,
                             expansion book)     ownership ledger)                     ledger   eval'd + rep-gated)
                                                                                                + decision brief
```

## Step by step

| # | Stage | What happens | Executor / API | Tier | Decision source | Output / invariant |
|---|---|---|---|---|---|---|
| 1 | **Ingest** | Parse 30 leads; identity fields (name/email/domain/title) never mutated | `lib/csv.ts` | SYMBOLIC | — | `Lead` objects; 30/30 identity intact |
| 2 | **Gate 0 — suppress** | Registrable-domain match vs. known-customer list → expansion book; never enriched on acquisition spend | `lib/suppression.ts` + `data/socure-customer-list.csv` | SYMBOLIC | customer list (set membership) | Suppressed accounts routed to expansion, never dropped |
| 3 | **Account resolution** | Group leads → accounts by registrable domain; `account.score = MAX(leads)`; ownership-ledger check | `lib/domain.ts`, `lib/ownership.ts`, `memory/account-owners.json` | SYMBOLIC | ownership ledger | Accounts; owned accounts keep their owner |
| 4 | **Enrich — cascade** | Bitscale (0.9) → nRev (0.85) → DNS MX/RDAP (0.75, free/keyless) → symbolic (0.6) → **LLM residue** (≤0.6, code-clamped; classifies, never scores; fires only when all sources miss or confidence <0.5) | `connections/*`, `lib/enrich.ts` | SYMBOLIC + bounded NEURAL | `config/enrichment.json` | Every field carries `source` + `confidence`; contract asserted in code (`assertEnrichmentContract`) |
| 5 | **Score** | 4-dimension rubric, 0–100; hot ≥75 · warm 50–74 · cold <50; vertical matches domain evidence first, so LLM labels never override a domain keyword | `lib/scoring.ts` | SYMBOLIC (hard rule: feeds tracked metrics) | `config/icp-rubric.json` | Every score ships `breakdown`; every DQ ships `dq_reason` |
| 6 | **Route** | Owned → owner (never reassigned); unowned → vertical→rep rules; tier → P1/P2/P3; unmatched vertical → Rep C, flagged | `lib/routing.ts` | SYMBOLIC | `config/routing-rules.json` | **Zero unrouted** — run fails loudly otherwise |
| 7 | **Enable — battle cards** | Hot/warm accounts only; 7-section card; approved proof points only; Langfuse groundedness eval (uncited claim = failed card) | `tools/battle-card.ts` + `prompts/battle-card.md` | NEURAL → **HUMAN gate** | grounding corpus + blocklist/allowlist | `battle_cards/<domain>.md`; rep reviews before use (never-graduate: outward-facing) |
| 8 | **Decision brief** | Code computes deltas vs. prior run, enrichment trust score, projections, 4Ws recommendations; LLM optionally narrates the computed numbers — never computes | `tools/decision-brief.ts` + `memory/runs/` | SYMBOLIC (0-100-5) | prior-run snapshot | `decision_brief.md` + `brief.json` |

## Architecture note — tools/APIs, hosting, data model, why

| Concern | Choice | Why |
|---|---|---|
| Hosting & orchestration | **Trigger.dev** (TypeScript tasks, cloud-deployed); local `npm run pipeline` needs zero keys | Per-stage retries, structured logs, shareable run link — "it runs" is a live artifact, and pipeline-health instrumentation comes free |
| Enrichment APIs | **Bitscale** (0.9) → **nRev** (0.85) → **DNS MX + RDAP** (0.75, free/keyless) → symbolic → LLM residue | Brief asks for a free/public method — DNS/RDAP return live truth even on mock domains. Vendors are env-gated and probe-first (verify response shape on 1 lead before spending on 30); a fallback is never dressed as vendor data |
| LLM | **Claude Haiku** (Anthropic API) at exactly 3 touchpoints: enrichment residue, battle cards, brief narration | Cards and narration are language deliverables; everything a metric tracks stays in cheaper, testable code |
| LLM observability | **Langfuse** — traces every call (prompt, tokens, cost, latency) + groundedness eval per battle card | An uncited claim fails the card before a rep sees it; LLM spend is a dashboard number, not a surprise |
| Delivery & alerting | **Slack** (via Trigger.dev task — production rail, not in the demo run): P1 hot-lead alert + battle card to the routed rep, run summary + threshold alerts (unrouted lead, tier skew, rep imbalance) to ops; Part 2 reuses the same rail for CSM expansion alerts | Reps live in Slack, not in CSV files — the routed lead has to land where the SLA clock starts |
| Decision logic | All in `config/` (`icp-rubric.json`, `routing-rules.json`, `enrichment.json`) | Changing the ICP or territories is a config edit, never a code edit; the rubric carries its evidence citations inline |
| Outputs | `routed_leads.csv/.json` · `battle_cards/*.md` · `decision_brief.md` + `brief.json` | CSV for the brief's deliverable, JSON for machines, cards for reps, brief for the operator |

## Data model

One `Lead` accretes (source fields never mutated), grouped into `Account`:
`{lead → enrichment{source,confidence} → score{total,breakdown,tier} → routing{rep,priority,owner_status}}` —
the same account shape serves both bowtie sides (Part 2 re-points enrich→score→route at the expansion book).

## Measured neural authority (live run)

LLM-touched enrichment: **26/30 leads** (mock domains — vendors/public sources miss; rare on real data).
Neural authority over tracked outputs: **0/30 tiers, 0/30 routes**; one within-tier score nudge where the
domain carried no evidence; in its only conflict with a domain keyword, the LLM lost. Coverage ≠ authority.

**Patterns deliberately not used:** ReAct / plan-and-execute / orchestrator–worker / ToT / ensemble /
reflexion — the full flowchart is drawable before runtime, so model-driven control flow adds only cost
and failure modes. Learning loop (rep accept/decline ledger retuning weights) is a documented extension.
