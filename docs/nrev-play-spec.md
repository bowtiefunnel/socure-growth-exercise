# nRev Play Spec — TargetCo Lead Pipeline (Lite Mirror)

Node-by-node spec to rebuild the pipeline as a no-code nRev Play — the same logic
a RevOps owner could iterate without engineering. Source of truth stays
`config/icp-rubric.json` + `config/routing-rules.json`; values are inlined below
so the Play can be built straight from this page. Test in nRev's zero-credit test
mode against the 30 leads before flipping to Production.

## Play: "TargetCo — Enrich, Score & Route Inbound"

| # | Node | Type | Config |
|---|---|---|---|
| 1 | New lead | Trigger — Google Sheets *new row* (or CSV import) | columns: `name, email, domain, title` |
| 2 | Customer check | Lookup vs. sheet `customer-domains` (34 rows from `data/socure-customer-list.csv` domain column) | match on domain → set `existing_customer = yes` |
| 3 | Expansion exit | Branch: `existing_customer = yes` | → write to `expansion-book` tab + Slack `#expansion` alert · **exit Play** (no acquisition spend on owned accounts) |
| 4 | Enrich | nRev company-enrichment node (auto-fill size, industry, tech stack) | on miss → continue; enrichment absence never blocks |
| 5 | Score — vertical | Branch on `domain contains` | bank/financial/lending/capital/payment/fintech/credit/invest/wealth/crypto/cu.org → **35** · .gov/gov./municipal/lottery/state/health/patient/care/insurance/insure/benefits → **30** · retail/commerce/marketplace/shop → **20** · else → **5** |
| 6 | Score — persona | Branch on `title contains` | fraud/risk/identity/loss prevention → **30** · compliance/aml → **28** · underwriting/claims/trust → **22** · product/growth/digital/ecommerce → **18** · it/cio/cto/engineering → **15** · else → **5** (first match wins, this order) |
| 7 | Score — seniority | Branch on `title contains` | chief/CxO → **20** · vp/svp/head/director → **15** · manager/lead → **8** · else → **3** |
| 8 | Score — keywords | Count distinct of fraud/risk/compliance/identity/trust/kyc/aml in title+domain | × **5**, cap **15** |
| 9 | Total + tier | Formula node: sum 5–8 | ≥ **75** hot/P1 · ≥ **50** warm/P2 · else cold/P3 |
| 10 | DQ flag | Branch: `domain contains` manufacturing/logistics/fleet/.edu | set `dq_reason` (still routed — zero unrouted) |
| 11 | Route | Branch on `domain contains`, first match wins | bank/lending/financial/payments/capital/cu.org → **Rep A** · health/insurance/insure/care/patient → **Rep B** · .gov/lottery/municipal/state/retail/commerce/logistics → **Rep C** · no match → **Rep C** + flag `unmatched_vertical` |
| 12 | Output | Google Sheets write — `routed-leads` tab | all fields + score + tier + rep + reason |
| 13 | Hot alert | Branch: tier = hot → Slack `#sales-p1` | same-day SLA ping with score breakdown |

## What the code build has that the Play doesn't (say so in the walkthrough)

Ownership ledger (owner beats territory on re-inbound) · account grouping /
buying-committee detection · LLM battle cards with groundedness eval · decision
brief (4Ws) · self-check invariants. The Play is the *routing core* a RevOps
person owns; the code build is the production system around it.

## Play 2: "Enrichment Service" (webhook — waterfall vendor #2)

Small second Play that turns nRev into an enrichment API for the code build
(`connections/nrev.ts`, gated on `NREV_WEBHOOK_URL`):

| # | Node | Config |
|---|---|---|
| 1 | Webhook trigger | receives `{name, email, domain, title}` |
| 2 | Company enrichment | nRev enrichment node on `domain` |
| 3 | Respond | return JSON: `industry, sub_vertical, employee_range, est_revenue, tech_*` fields |

Block-1 rule applies: after building, probe ONE lead and check the actual response
shape against the mapper in `connections/nrev.ts` before running the batch.
If the Play can only write to Sheets (no synchronous respond node), leave
`NREV_WEBHOOK_URL` unset — the cascade degrades gracefully and nRev stays
UI-side only.

## Keep in sync

Any change to `config/*.json` = update the matching node values here. The configs
are the source of truth; this spec is their no-code projection.
