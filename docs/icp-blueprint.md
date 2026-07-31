# TargetCo — Battle-Tested ICP Blueprint

**Prepared:** 2026-07-24 · **Role:** Principal RevOps Architect / B2B GTM
**Grounding:** `docs/grounding/icp-research-memo.md` (105-agent deep research, adversarially verified) · `data/socure-customer-list.csv` (43 accounts) · `data/leads.csv` (30-lead exercise set)
**Evidence discipline:** figures from research are cited as-is; bands/thresholds the research does not contain are marked `[assumed]` — operator-calibratable, not vendor fact.

---

## 1 · Firmographics & Technical Environment

### Company size (band × motion)

| Segment | Headcount | Revenue band | Motion |
|---|---|---|---|
| **Core growth (the scored-outbound ICP)** | **100–5,000 FTE** (derived from customer-base reverse-ICP, n=36 — see `grounding/customer-base-reverse-icp.md`) | $20M–$500M `[assumed]`; late-private/newly-public if fintech | Outbound + inbound scoring — this pipeline |
| Enterprise / Tier-1 FI | 10k+ FTE | $1B+ | Named-account, not scored outbound ("18 of top 20 banks" is self-reported — the whales are largely taken) |
| Public sector | N/A — sized by **program volume**, not headcount | Benefits/DMV/student-aid program scale | Procurement-led (FedRAMP Moderate, StateRAMP APL) |

The real sizing variable is not headcount — it's **digital identity-decision volume**. Floor: ~50k+ identity decisions/yr `[assumed]` for per-verification economics to clear contract minimums.

### Primary verticals (ranked by fit — mirrors the scoring rubric)

1. **Fintech / Neobanks** — high-volume KYC/CIP, synthetic-ID, auto-approval lift (Chime, SoFi, Lili: **+13% auto-approval**, verified)
2. **Banks / Lenders / Credit Unions / Payments** — account-opening fraud, manual-review reduction
3. **Investing / Crypto / Wealth** — onboarding fraud, age/eligibility (Betterment: **+30% auto-approval**, verified)
4. **iGaming / Sports Betting** — age/identity/geo-eligibility, AML (DraftKings, Fanatics)
5. **Insurance** — claims fraud, underwriting identity, first-party fraud
6. **Public Sector** — benefits fraud, IAL2 remote proofing (CA: 94% instant verification; Login.gov, FSA)
7. **Healthcare (patient access/identity)** — patient identity proofing, revenue-cycle fraud
8. **Marketplaces / eCommerce / HR** — seller/buyer trust, worker onboarding (Uber, Gusto)

### Tech-stack prerequisites (MUST already exist)

- **A digital onboarding funnel** — web/mobile account opening at volume. No digital origination = no use case. Period.
- **A real-time decision point** — either an in-house rules engine straining under change-latency, or an incumbent to displace (Alloy, Persona, Jumio/Onfido, or batch bureau checks). Greenfield *or* rip-and-replace both qualify; *nothing to decision* disqualifies.
- **API-capable engineering org** — REST integration capacity; cloud-hosted stack (on-prem-only procurement is a red flag, §4).
- **A regulatory obligation** — KYC/CIP (BSA), age/eligibility mandate, or NIST 800-63 IAL2 (gov). The obligation is what makes budget non-discretionary.

### Trigger events (why they shop NOW)

| Trigger | Detectable via |
|---|---|
| Fraud spike — synthetic, first-party, ATO postmortem | Fraud-analyst job postings, exec LinkedIn posts |
| Regulatory heat — exam finding, MRA, consent order | Public enforcement records |
| Conversion pain — auto-approval below peers, onboarding drop-off | Growth-team hiring, A/B tooling adoption |
| New regulated product launch — fintech adds banking/credit | Press, product pages |
| Market entry — iGaming new-state license | State gaming-commission approvals (public) |
| Gov modernization budget cycle | RFP/procurement portals, StateRAMP solicitations |
| Incumbent contract renewal window | Tech-stack detection, procurement filings |
| In-house decision logic hit scale ceiling | Eng blog posts, rules-engine job reqs |

---

## 2 · Economic Buyer & Stakeholder Mapping

### Primary champion
**VP/Director of Fraud & Risk** (variants: Head of Fraud Ops, Head of Trust & Safety, Fraud Operations Lead)
- **Core KPIs:** fraud-loss bps · false-positive ratio · manual-review rate · synthetic-ID capture
- **Daily pain:** review-queue backlog and SLA breaches, weeks-long rule-change cycles, analyst attrition, being blamed for both fraud losses *and* declined good customers

### Economic buyer

| Deal shape | Buyer | Budget authority | Success metric |
|---|---|---|---|
| Risk-led | **CRO** | Fraud-loss P&L offset | Fraud-loss bps down without approval-rate damage |
| Compliance-led | **CCO** | Compliance opex | CIP auto-approval/pass rate, exam readiness, audit trail consolidation |
| Conversion-led (co-sign) | **VP Product/Growth** | Growth budget | Auto-approval lift, step-up friction removed, time-to-yes |
| Public sector | Program Director / Agency CIO | Program modernization budget | Verification rate, benefits-fraud reduction, IAL2 compliance |

### Blockers / skeptics — and the neutralizer

| Blocker | Why they resist | Neutralize with |
|---|---|---|
| **CTO / Head of Eng** | "Another vendor integration to babysit" | RiskOS consolidation pitch: one integration replaces N point vendors; rule changes ship "in minutes vs. weeks" (verified claim) |
| **In-house data-science team** | NIH — "our models are fine" | You can't replicate the consortium: 4B+ known outcomes, 314M recurring identities feeding labeled ground truth. Position Signals (250+ features via API) as *augmenting* their models, not replacing the team |
| **InfoSec / Privacy** | PII flowing into a shared cross-industry graph | SOC 2 Type 2, ISO 27001/17/18, FedRAMP Moderate, Kantara IAL2; consortium contribution controls in DPA |
| **Procurement / CFO** | Per-verification pricing at volume looks expensive | Reframe unit cost against: fraud-loss bps + manual-review FTE cost + recovered LTV of falsely-declined good applicants (Betterment +30%, challenger bank 62→85% auto-acceptance) |
| **Incumbent's internal owner** | Sunk political capital in Alloy/Jumio/bureau contract | Run passive-first POC on their decline queue — recovered good applicants are numbers their incumbent can't produce |

---

## 3 · Qualitative Pain & Behavioral Signals

### Active pain (said out loud in meetings)
- Fraud-spike postmortems with board visibility
- Exam-finding remediation on a regulator's clock
- Manual-review backlog blowing SLA; hiring reqs to throw bodies at the queue
- Growth team escalating onboarding drop-off at the identity step

### Latent pain (silent operational drag — the wedge)
- **False-positive declines**: good applicants rejected, lost LTV that never shows on a dashboard — the single best discovery question ("what % of your declines are actually good?")
- **Step-up-everyone friction**: doc capture forced on all users because passive signal is too weak to segment
- **Multi-vendor sprawl**: each vendor a separate contract, audit trail, and failure mode
- **Rule-change latency**: risk logic shipping on eng release cycles, not risk team's clock
- **Review-team burnout**: scaling fraud ops linearly with account growth

### High-intent digital signals (measurable, in-market)

| Signal | Source | Weight |
|---|---|---|
| Fraud/risk/identity job postings (esp. "Fraud Analyst," "Head of Fraud") | Job boards, LinkedIn | Strong |
| Competitor SDK detected (Jumio/Onfido/Persona) or bureau-batch stack | Tech-detection (BuiltWith-class) | Strong — displacement-ready |
| Consent order / enforcement action published | Regulator sites (public record) | Very strong, time-bound |
| New state gaming license approved | Gaming commission filings | Very strong (iGaming) |
| Gov RFP for identity proofing / StateRAMP solicitation | Procurement portals | Very strong (public sector) |
| Funding round + stated account-growth targets | Press, Crunchbase | Moderate |
| Risk-team headcount growth trend | LinkedIn | Moderate |
| IDV-category research activity; pricing/docs page visits | G2, website de-anonymization | Moderate |

> **Pipeline note:** none of these signals exist in the 30-lead mock CSV — they are the documented **intent dimension** extension (DESIGN.md §2.4), scored when present, never a dead always-zero column.

---

## 4 · Negative ICP — Disqualify Hard

| # | Red flag | Why it's fatal | In the exercise dataset |
|---|---|---|---|
| 1 | **No regulated digital onboarding** — no KYC/CIP, age, or identity-proofing obligation | No use case, no non-discretionary budget; any deal is a science project that churns | Ferroway Manufacturing (IT Mgr), Vertex Fleet Logistics (Ops Mgr), Meridian State U (Registrar) — all score <30 and land Tier 3 |
| 2 | **Sub-scale volume** — <~50k identity decisions/yr `[assumed]` | Per-check economics never clear contract minimums; high-touch, low-expansion, churn-prone | Not detectable from CSV — enrichment-stage check |
| 3 | **No US applicant base** | The Identity Graph is US-centric depth (research-flagged weakness vs. Trulioo). Customer evidence refines this: international HQ is fine (Nubank, Revolut, TikTok all bought — for their **US flows**); it's the absence of a US applicant flow that disqualifies | Enrichment-stage check |
| 4 | **Buyer outside risk/compliance/product mandate** — generic IT/infra titles | Becomes a committee tool-evaluation with no P&L owner; dies in procurement | "IT Manager," "Director of IT Security," "Operations Manager" titles → persona score ≤15 |
| 5 | **On-prem-only / no-cloud procurement posture** | Cannot consume the API or contribute to the consortium; endless security-review drag | Enrichment-stage check |

**Not a disqualifier — a reroute:** an account already in `socure-customer-list.csv` (43 accounts) is suppressed from acquisition and **handed to the expansion pipeline** (Gate 0 below). Existing usage is the Part 2 signal, not waste.

---

## 5 · Operationalization & Scoring Blueprint

### Gate 0 — Suppression (before any scoring or enrichment spend)
`registrable_domain(lead) ∈ customer_domain_set` → tag `existing_customer`, route to **expansion pipeline**, skip acquisition. Pure set-membership, zero LLM.

### Base weighting matrix (runs today on CSV fields — deterministic, ships `breakdown`)

| Dimension | Weight | Scoring logic |
|---|---|---|
| **Vertical fit** | 0–35 | FinServ/Fintech/Payments **35** · Gov/Healthcare/Insurance **30** · Retail/eCommerce/Marketplace **20** · other **5** |
| **Buyer persona** | 0–30 | Fraud/Risk/Identity **30** · Compliance/AML **28** · Underwriting/Claims/Trust&Safety **22** · Product/Growth **18** · IT/Eng **15** · other **5** |
| **Seniority** | 0–20 | C-level **20** · VP/SVP/Head/Director **15** · Manager **8** · other **3** |
| **Fit-signal keywords** | 0–15 | fraud/risk/compliance/identity/trust/KYC in title or domain → graduated |

### Extension modifiers (documented; activate when enrichment/intent data exists)

| Modifier | Points | Trigger |
|---|---|---|
| Trigger event live (consent order, new license, fraud spike) | +10 | §1 trigger table |
| High-intent signal (job postings, RFP, competitor SDK) | +8 to +15 | §3 signal table |
| Negative-ICP flag #2/#3/#5 confirmed at enrichment | −20 each | §4 |
| Cap | 100 | — |

### Tier mapping

| Tier | Score | Meaning | Routing |
|---|---|---|---|
| **Tier 1 — Must-Win** | ≥ 75 | Rubric-perfect persona in a core vertical | P1, same-day SLA, battle card generated |
| **Tier 2 — Standard Fit** | 50–74 | Right company, adjacent persona — or right persona, adjacent vertical | P2, sequenced outreach, battle card generated |
| **Tier 3 — Disqualified/Nurture** | < 50 **or any §4 hard flag** | No use case or no mandate | P3 nurture; `dq_reason` recorded for transparency |

### Calibration rows (from the actual 30-lead set)

| Lead | Title @ domain | Approx. score | Tier |
|---|---|---|---|
| Rachel Ferro | VP of Fraud & Risk @ brightlanefinancial.com | ~92 (35+30+15+~12) | **1** |
| Priya Chandrasekar | CCO @ vantagepoint-insurance.com | ~86 (30+28+20+~8) | **1** |
| Zara Whitlock | Chief Digital Officer @ fernhollowbank.com | ~78 (35+18+20+~5) | **1** (borderline) |
| Jamal Okonkwo | IT Manager @ ferrowaymanufacturing.com | ~28 (5+15+8+0) | **3** |
| Anika Solberg | Registrar @ meridianstateu.edu | ~13 (5+5+3+0) | **3** |

The rubric sinks negative-ICP leads on its own (they score <30); the explicit §4 gates exist to attach a **`dq_reason`** — a scored zero and a *reasoned* zero are different products.

---

*Everything above either traces to the adversarially-verified research memo or is marked `[assumed]`. Refuted claims (latency SLAs, "90% acceptance," head-to-head competitive facts) are excluded per the memo's evidence discipline.*
