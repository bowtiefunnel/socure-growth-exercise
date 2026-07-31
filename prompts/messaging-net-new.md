# Skill: TargetCo Messaging & Voice

Voice and lexicon standard for anything prospect-facing the pipeline generates —
battle-card angles, opener lines, outreach copy. Layers ON TOP of
`prompts/battle-card.md` (structure) and `instructions.md` (evidence discipline).
Refined 2026-07-24 from messaging research, reconciled against the adversarially
verified memo (`docs/grounding/icp-research-memo.md`).

## Evidence tiers — which numbers may be used

| Tier | Numbers | Usage |
|---|---|---|
| **VERIFIED — free to cite** | Lili **+13% auto-approval** · Betterment **+30% auto-approval** · challenger bank **62%→85% auto-acceptance** · online lender **fraud −50% / auto-accept +20%** · State of CA **94% instant verification** · **4B+ known outcomes** · **314M recurring identities** · **3,000+ customers** · RiskOS **50+ pre-integrated solutions** · Signals **250+ features** · FedRAMP Moderate, SOC 2 Type 2, ISO 27001/17/18, Kantara IAL2 | battle cards, outreach, anywhere |
| **COMPANY-REPORTED — quarantined** | 97.44% AUC · 74% capture @ 3% risk depth · $27M annual savings · 210M contributed identities · 1,400 watchlists · 95% FP reduction · 98%/94% auto-approval splits · Underdog 20%→5% review rate | NOT in battle cards (groundedness eval fails them). Marketing copy only, with "company-reported" attribution, after verification |
| **REFUTED — never** | sub-150ms / 1,000+ QPS SLAs · "40B+ outcomes" (verified figure is 4B+) · "90% acceptance" · "$200M revenue / $18.5M profit" · "largest consortium" · any head-to-head competitive claim stated as fact | nowhere, ever |

Math rule: a rate that fell from 20% to 5% is a **75% reduction** (or "4× fewer") —
never "reduced by 300%." Percentages of reduction cannot exceed 100.

## The five product pillars (taxonomy — no metrics attached)

1. **Fraud & Risk** — Sigma suite (Identity, Synthetic, Device) + Predictive PII RiskScores
2. **Compliance** — KYC/CIP (eCBSV), KYB, Global Watchlist screening + monitoring
3. **ID + Biometric** — Predictive DocV with Liveness
4. **Account Intelligence** — bank-account status/ownership validation
5. **Device & Behavior** — Digital Intelligence, behavioral signals

Orchestration above all five: **RiskOS**. Feature-store access: **TargetCo Signals**.

## Voice pillars

**1 · Mathematically precise** — quantified claims from the VERIFIED tier only.
- DO: "Betterment lifted auto-approval 30% with Sigma Identity + KYC."
- DON'T: "unparalleled accuracy," "best-in-class," any superlative without a number.

**2 · Enterprise-grade authoritative** — compliance officers are peers, not prospects to hype.
- DO: cite frameworks by name — NIST SP 800-63 IAL2, FedRAMP Moderate, BSA/AML.
- DON'T: startup slang, exclamation points, "super excited."

**3 · Operationally candid** — fraud is an engineering problem, not a moral panic.
- DO: "Generative AI lowers the cost of producing synthetic identities; detection has to price that in."
- DON'T: "terrifying cyberthreats," "devastating wave," fear vocabulary.

**4 · Radically inclusive** — thin-file verification is a revenue opportunity, not charity.
- DO: "Alternative-data verification converts thin-file Gen Z applicants legacy checks decline."
- DON'T: frame inclusion as goodwill; never imply loosened fraud thresholds.

## Competitive positioning — attribution is mandatory

No head-to-head claim survived independent verification. Every competitive line
must be framed as TargetCo's positioning ("TargetCo positions…", "vs. the
assemble-it-yourself model"), never as market fact.

| vs. | TargetCo's claimed counter-position |
|---|---|
| Persona (workflow builder) | pre-built identity graph + models vs. assemble-it-yourself |
| Jumio (doc-capture-first) | passive PII verification first — less onboarding friction |
| Alloy (open middleware) | owns the graph AND the orchestration |
| Legacy bureaus | real-time ML decisioning vs. static batch lookups |

## Lexicon

**Preferred terms:** consortium intelligence · identity manipulation · explainable
AI · persistent profile · auto-decisioning rate · entity resolution.

**Banned → replacement:**
- "seamless onboarding" → "low-friction onboarding"
- "next-gen AI" → "models trained on 4B+ known outcomes"
- "stop the bad guys" → "prevent third-party, synthetic, and first-party fraud"
- "game-changer" → name the specific operational shift
- "zero-code compliance" → "no-code rule orchestration via RiskOS"

**Inline definitions:** define technical terms in-flow with an appositive —
"eCBSV — the SSA's direct consent-based SSN validation service — …" Never assume
the reader knows the acronym; never stop the prose for a glossary.

## Structure per channel

| Channel | Spec |
|---|---|
| Battle-card copy lines | active voice · [pain → mechanism → verified metric] arc · opener references the persona's KPI |
| Short-form (LinkedIn/ads) | <800 chars · ≥1 verified metric · lead with the operational problem |
| Outreach email | 3 paragraphs · subject names an operational metric, not a pitch · one verified case outcome · low-friction CTA |
| Long-form | plain markdown headers (no bold inside headers) · bold only metrics, certs, product names · tables break up prose |

**Pronoun rule (prospect-facing copy only):** avoid "we/our" hype framing; prefer
"the platform," "TargetCo," or the mechanism as subject. Internal card notes for
reps may address the rep directly.

**The arc every copy block follows:**
acknowledge the operational pain (empathy) → name the mechanism (candor) →
land the verified metric (authority).

## Worked example — deficient vs. standard

Deficient: "Our platform uses AI to stop synthetic fraud so you can trust users at sign-up."

Standard: "Synthetic profiles build clean histories for months before busting out —
point-in-time checks can't see them. Sigma Synthetic scores identities against
4B+ known outcomes at account opening; Betterment lifted auto-approval **30%**
without adding document friction."
