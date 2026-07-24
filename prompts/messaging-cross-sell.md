# Skill: Socure Messaging — Cross-Sell (New Products into Owned Accounts)

Voice standard for introducing a pillar the account does NOT yet own.
Inherits evidence tiers/lexicon/pillars from `prompts/messaging-net-new.md` and
the existing-customer rules (readiness signals, guardrail, renewal honesty) from
`prompts/messaging-expansion.md`. This file defines only the cross-sell deltas.
The operational motion (signal → roles → touch templates → instrumentation)
lives in `docs/playbook-cross-sell.md`.

## The core dynamic: warm account, cold persona

Cross-sell is a mini net-new sale INSIDE an owned account. The platform is
trusted; the specific product — and often the specific buyer — has no history.

| | Upsell | Cross-sell |
|---|---|---|
| Product | deepen an owned pillar | introduce an unowned pillar |
| Buyer | same persona who bought Product A | often a DIFFERENT committee member (CCO bought KYC; the CRO owns fraud budget) |
| Trust | full — they use the thing daily | account-level only; product credibility starts near zero |
| Evidence mix | their usage data | **hybrid: their data proves the GAP · case studies prove the PRODUCT** |

Never presume relationship tone with a persona who has never talked to Socure —
to them the message is first contact, arriving with a warm intro.

## Product-bridge plays (pillar taxonomy → who owns the budget)

| Owned (Product A) | Bridge to (Product B) | New buyer to address |
|---|---|---|
| KYC/CIP onboarding | Sigma transaction fraud / RiskOS | CRO, VP Fraud |
| Sigma fraud scores | Account Intelligence (payment/first-party) | VP Payments, Risk Ops |
| DocV + KYC | Device & Behavior (ATO defense) | Head of Trust & Safety / Security |
| KYC (consumer) | KYB + Watchlist monitoring | CCO, AML/Compliance |

The pipeline's committee data feeds this: `committee_depth` and per-lead personas
identify whether the Product-B owner is already in the map or must be reached
through the champion.

## The cross-sell arc (hybrid by design)

1. **Gap observed in THEIR data** (expansion evidence) — "verified accounts are
   passing onboarding, then chargebacks rise downstream"
2. **New persona's KPI framing** (net-new discipline) — translate the gap into
   THEIR metric (fraud-loss bps, false-positive ratio), not the champion's
3. **Product-B mechanism** — which pillar closes the gap, one sentence
4. **Verified proof for the unfamiliar product** — Lili / Betterment full-stack
   outcomes; their own Product-A results as platform credibility
5. **Champion referral path** — the existing owner/user makes the intro; never
   cold-email around them
6. **Low-friction next step** — pilot on their own decline or chargeback queue,
   not a contract conversation

## Hard rules (beyond inherited ones)

- The champion's credibility is borrowed capital — an oversold Product B burns
  the Product-A relationship. Claims stay inside the verified tier, always.
- Address the new persona's KPI, not the platform relationship ("you already
  love Socure" is champion logic, not buyer logic).
- One bridge per play. Stacking three products in one message reads as a
  price-sheet, not a solution.
- Guardrail inherits: Product-A health check passes before any cross-sell fires.
