# Socure Growth Engineering Exercise — Design Spec

**Author:** Jomar Ebalida · **Date:** 2026-07-24
**Deliverable:** Technical exercise (Part 1 build + Part 2 written case)

---

## 0. Thesis — one engine, both sides of the bowtie

The exercise is two motions that are the *same machine*:

- **Part 1 (acquisition / left side of the bowtie):** cold lead → enriched → scored → routed → enabled.
- **Part 2 (expansion / right side of the bowtie):** existing account → readiness-scored → upsell play.

The Part 2 mechanic is the Part 1 engine re-pointed (ICP-fit → expansion-readiness). This reuse is the core narrative for the walkthrough.

On top of both books sits a **Decision Intelligence layer** (Workflow 5) that answers the four decision questions — what happened & why (variance attribution + root cause), current state (trustworthy nowcast + confidence ledger), what's likely next (forward projection under alternative assumptions), what to do (decision-ready options + recommendation). This is the instrumentation plan leveled up from descriptive to prescriptive, and it runs over both the acquisition book and the expansion book.

**Grounding assets already in hand:**
- Socure ICP research (`_agency-ops/business/clients/socure/`) → the scoring rubric + battle-card knowledge base (competitive counter-positioning, case-study proof points, persona pains).
- Bitscale playbooks (`.firecrawl/bitscale-playbooks.md`) → "Salesforce ICP Account" ≈ Part 1, "Active Customers SPOC" ≈ Part 2.
- labs.bowtiefunnel.com `agent-models` → house signal taxonomy (Signal/Intent, Expansion Signal, Churn Signal agents) that Part 2 cites as already-built.

---

## 1. Stack & rationale (seed for the one-page architecture note)

| Concern | Choice | Why |
|---|---|---|
| Orchestration | **Trigger.dev** (TypeScript tasks) | Built-in retries, structured logging, error handling, and a run dashboard → "it runs" becomes a live artifact, and the instrumentation plan writes itself. Matches existing production experience (BTF SEO agent). |
| Enrichment data | **Bitscale** (primary) | Enrichment-waterfall orchestrator (HubSpot/Salesforce/LinkedIn/Apollo/Lusha/Cognism behind one API). "Salesforce ICP Account" playbook = this exact motion. |
| Classify / score / route | **Symbolic rules** | Deterministic, transparent, testable, 100% reproducible for the demo. Every score ships its `breakdown`. |
| LLM (residue + battle card) | **Cheap model via llm-switchboard cost-routing** | Only the ambiguous residue and the generative battle card hit an LLM. labs cost-optimization best practice ("cheap work to cheap models"). |
| LLM observability | **Langfuse** | Traces prompt/version, tokens, **cost**, latency, and **evals** on output quality. Second instrumentation layer complementing Trigger.dev. |
| Knowledge base | Socure client research | Grounds the battle card (proof points + competitive wedge). |
| Secrets | `.env` + Trigger.dev env vars | `BITSCALE_API_KEY`, `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST`. Never committed; `.env` gitignored. |

**labs best-practices applied:** architecture-first (this doc + diagram), anti-over-engineering (symbolic core, LLM only where it earns its place), tool selection grounded in real usage, cost-routing visible in Langfuse.

---

## 2. Part 1 — Lead Enrichment & Routing Pipeline (the build)

### 2.1 Architecture

```
leads.csv
   │
   ▼ (Trigger.dev orchestrator: runLeadPipeline, fan-out per lead)
[1 ENRICH] ─► [2 SCORE] ─► [3 ROUTE] ─► [4 BATTLE CARD] ─► [5 DECISION BRIEF]
 Bitscale +    symbolic     vertical→rep   LLM, grounded in    symbolic compute
 symbolic +    ICP rubric   score→priority Socure research     + confidence ledger
 LLM residue   0–100+tier                  (hot/warm only)     → LLM narration
     │                                          │                    │
     └────── Langfuse traces LLM touchpoints ───┴────────────────────┘
             (residue + battle card + decision narration: prompt, tokens, cost, eval)
   ▼
routed_leads.csv/.json · battle_cards/*.md · decision_brief.md + brief.json · Trigger.dev run · Langfuse dashboard
```

Each workflow is its own task with retries + logging. Chained (not monolithic) so per-stage retry granularity and observability are preserved — that granularity *is* why Trigger.dev is the right pick.

### 2.2 Data model

One `Lead` object accretes fields (source never mutated):

```ts
{
  // source (CSV)
  name, email, domain, title,
  // enrichment (Bitscale → symbolic normalize → LLM residue)
  enrichment: { industry, sub_vertical, employee_range, est_revenue,
                tech_signals[], source: "bitscale"|"symbolic"|"llm", confidence },
  // classification (symbolic)
  icp: { vertical, buyer_persona, seniority, is_target_buyer },
  // scoring
  score: { total: 0-100, breakdown: {...}, tier: "hot"|"warm"|"cold" },
  // routing
  routing: { rep, vertical_bucket, priority, reason },
  // enablement (hot/warm only)
  battle_card_path
}
```

`source` + `confidence` per enrichment field make Bitscale-hit vs. fallback transparent per lead.

### 2.3 Workflow 1 — Enrichment
- **Step 0 (build-time):** probe ONE lead against Bitscale, confirm response shape + coverage, size the fallback from reality (not assumption).
- Bitscale lookup by domain/email → firmographic + technographic fields.
- On empty/low-confidence: symbolic rules from domain/TLD + title keywords; final residue → cheap LLM (Langfuse-traced).
- Output: `enrichment` block with `source` + `confidence`.

### 2.4 Workflow 2 — Scoring (symbolic ICP rubric, 0–100)

Grounded in the Socure ICP research. **Runnable rubric on the 30-lead dataset:**

| Dimension | Points | Logic |
|---|---|---|
| Vertical fit | 0–35 | FinServ/Fintech/Payments 35 · Gov/Healthcare/Insurance 30 · Retail/eCommerce/Marketplace 20 · other 5 |
| Buyer persona | 0–30 | Fraud/Risk/Identity 30 · Compliance/AML 28 · Underwriting/Claims/Trust&Safety 22 · Product/Growth 18 · IT/Eng 15 · other 5 |
| Seniority | 0–20 | C-level 20 · VP/SVP/Head/Director 15 · Manager 8 · other 3 |
| Fit-signal keywords | 0–15 | fraud/risk/compliance/identity/trust/KYC in title or domain → graduated |

**Tiers:** hot ≥75 · warm 50–74 · cold <50. Output matches the house "scored signal + suggested play" shape.

> **Designed-for extension (documented, not in the demo path):** a 5th **intent** dimension (competitor G2 review, LinkedIn engagement, 1st/2nd/3rd-party signals — the Signal/Intent Agent inputs). Scored when present; the mock CSV has none, so it stays an architecture note, not a dead always-zero column.

### 2.5 Workflow 3 — Routing (symbolic; account-first, vertical → rep, score → priority)

**Account-based, not lead-based** — Socure's buyer is a committee (CRO/CCO/VP Product/CTO),
so leads group to accounts by registrable domain BEFORE routing; the account routes and
every lead at it inherits rep + priority. `account.score = MAX(lead scores)` (committee-best —
sum rewards spam, avg lets an IT manager dilute a CRO); multi-lead accounts get committee-depth
flagged as a tiebreaker, never score inflation. Mirrors Socure's real motion: vertical pods +
named-account enterprise + lead-to-account matching. Gate 0 suppression is the same
account-resolution step run against *owned* accounts (→ expansion book).
In this 30-lead CSV every domain is unique (1 lead = 1 account), so output still satisfies the
brief's "route each lead" verbatim.

```
Rep A "Banking, Fintech & Payments"  ← bank, lending, financial, payments, capital, credit union
Rep B "Healthcare & Insurance"        ← health, insurance, care, patient
Rep C "Public Sector, Retail & Commerce" ← .gov, lottery, municipal, retail, commerce, logistics
Priority: hot → P1 (same-day SLA) · warm → P2 · cold → P3 (nurture)
Fallback: unmatched vertical → Rep C with flagged reason
```

### 2.6 Workflow 4 — Battle card (LLM, grounded; hot/warm only)

Structure (grounded in `_agency-ops/business/clients/socure/`):
> Account snapshot → Why-now signal → Persona pain (ICP research) → Socure angle + product (Sigma/RiskOS/KYC) → **Proof point** (case study matched to lead's vertical — fintech → Lili/Betterment) → **Competitive wedge** (vs Persona/Jumio/Alloy/bureaus; Bitscale "Competitors Prospecting" pattern) → suggested opener line.

Langfuse traces the generation + runs an eval (groundedness/quality).

### 2.7 Workflow 5 — Decision Intelligence Brief (descriptive → prescriptive)

Answers the four decision questions over the routed book. Symbolic computes the numbers + confidence ledger (trustworthy, deterministic); a cheap LLM narrates and drafts options — Langfuse-traced and **eval'd for groundedness** (must cite computed numbers, not invent).

| Question | Tier | Output |
|---|---|---|
| **What happened & why?** | Descriptive + diagnostic | Run vs. baseline deltas (tier/vertical mix, enrichment hit-rate, rep load) → **variance attributed by rubric dimension** → root-cause line. Baseline: run #1 = ICP-research priors (expected mix); later runs = prior run. |
| **Current state (nowcast)?** | Nowcast + confidence ledger | Operational: leads by tier/rep/vertical, P1 SLA load, unrouted=0. Financial: projected pipeline $ = Σ(tier × conv × ACV). **Trust score** = % of book on Bitscale-hit vs. fallback. |
| **What's likely next?** | Predictive | Scenario projection (meetings/opps/pipeline) under {conservative, base, optimistic} tier→conversion assumptions; assumptions + rep-capacity constraints stated. |
| **What should we do?** | Prescriptive | Rules detect triggers (rep overload, tier skew, low enrichment confidence) → 2–3 options each with trade-offs + recommended action + why. |

Output: `decision_brief.md` + `brief.json`. Same layer runs over the Part 2 expansion book (both sides of the bowtie). Embodies the tier-3 principle: **report = pipeline + confidence ledger**.

### 2.8 Instrumentation plan (Deliverable 3)

- **Pipeline health (Trigger.dev):** per-stage success/failure, retries, run duration, error traces — screen-shareable.
- **Enrichment quality:** % Bitscale hit vs. fallback; avg confidence.
- **Scoring distribution:** counts by tier; skew alert if one bucket dominates.
- **Routing balance:** leads per rep; lopsided-load alert.
- **LLM (Langfuse):** cost/tokens/latency per call; eval score on battle cards; residue-call frequency (should be low if Bitscale covers well).
- **Decision-grade layer (Workflow 5):** the four-question brief turns raw run metrics into variance attribution, a confidence-scored nowcast, forward projections, and recommended actions — the mature "how you'd know it worked."
- **"Did it work":** all 30 exit with rep + score + reason, zero unrouted, run green. Real-world extension: reply/meeting rate per tier proves the score predicts conversion.

### 2.9 Output
`routed_leads.csv` + `.json` + `battle_cards/*.md` + `decision_brief.md`/`brief.json` (reliable). Best-effort Google Sheet push (⚠️ agency Sheets token dead 2026-07-15 — non-blocking).

---

## 3. Part 2 — Expansion (written case, ~half page) + cite real agents

**Format:** `PART2.md`, half a page. Content = the approved mechanics:

- **Setup:** Segment X = mid-market fintechs on Product A (KYC/onboarding). Product B = RiskOS transaction fraud. Lifecycle = expansion.
- **Signal (ready):** composite expansion-readiness score from data already held — Product-A usage plateau, fraud leaking past the front door (chargebacks/ATO/manual-review growth/first-party+synthetic on verified accounts), scale threshold, renewal window. (= house **Expansion Signal Agent**: rules flag against usage/billing/seat criteria.)
- **Trigger:** nightly job recomputes; threshold-crossing fires one debounced event → CRM task + Slack alert + expansion play, carrying the evidence.
- **Who:** CSM/AM runs it (warm) with an auto-generated upsell battle card; growth engineer owns the signal job; SE scopes larger fits.
- **Zero tooling:** no CDP/MAP purchase — one nightly job joins usage + tickets + billing → events table → score → fire. Same enrich→score→route architecture as Part 1.
- **Instrument:** funnel (flagged → CSM-accepted → booked → opp → closed-won → Product-B ARR) + signal precision (false-positive rate, feed back to retune weights) + guardrail (no dent to Product-A retention/NPS; = **Churn Signal Agent**) + north-star (Product-B ARR attributable to signal; NDR lift).

**Close (the flex):** "Not theoretical — productionized as agents: **Expansion Signal**, **Active Customers SPOC** (coverage/multi-thread), **Churn Signal** (guardrail)." Optionally one screenshot / agent-model link. **No new sim built.**

---

## 4. Deliverables & submission

1. **GitHub repo** — runnable Trigger.dev project + README (one-page arch note) + this design doc.
2. **Live Trigger.dev run link** — deployed to cloud/prod env (NOT local `trigger.dev dev` — long runs stall on the 5-min heartbeat), executed on all 30 leads.
3. **`PART2.md`** — half-page written case + agent citations.
4. Optional Loom; 20-min working session covers the rest.

**Repo location:** own top-level `socure-growth-exercise/` (clean public GitHub link), separate from the agency OS but *reads* `_agency-ops/business/clients/socure/` for battle-card grounding at build time (grounding text is copied into the repo so it's self-contained for reviewers).

---

## 5. Build order (time-boxed; protects the core)

| Block | ~Time | What | Gate |
|---|---|---|---|
| 1 | 20m | Scaffold Trigger.dev, ingest CSV, **probe Bitscale on lead #1** | — |
| 2 | 60m | Workflows 1–3 green on all 30 | **Part 1 core DONE** |
| 3 | 30m | Wire Langfuse + Workflow 4 battle card | — |
| 4 | 30m | Workflow 5 decision brief (symbolic compute + confidence ledger + LLM narration) | Decision layer done |
| 5 | 30m | README arch note + instrumentation plan | **Part 1 shippable** |
| 6 | 25m | `PART2.md` written case + agent citations | **Part 2 done** |
| 7 | 20m | Deploy to cloud, capture run link, final pass | **Submittable** |

Battle card, Langfuse, and the decision brief are above-and-beyond; if time compresses, Workflows 1–3 + the 3 deliverables fully satisfy Part 1. Build order protects the core first (labs anti-over-engineering).

---

## 6. Risks & caveats

- **Bitscale coverage on mock domains** — verified empirically at Block 1; fallback is a safety net, not a prediction.
- **"Firmographic/technographic" on mock data** — where Bitscale misses, fields come from symbolic + LLM residue; `source`/`confidence` keeps it honest.
- **Google Sheet output** — dead token; CSV/JSON + Trigger.dev run are the reliable artifacts.
- **Secrets** — `.env` gitignored; keys set as Trigger.dev env vars before deploy.
- **Workspace is not a git repo** — `git init` happens inside `socure-growth-exercise/` for the submission.
