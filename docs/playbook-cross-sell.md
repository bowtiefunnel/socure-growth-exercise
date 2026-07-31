# Playbook: Cross-Sell Motion (Product A → Product B)

Operational playbook for running a cross-sell play against an owned account.
Voice/claims: `prompts/messaging-cross-sell.md` governs every message here.
Canonical play used throughout: **KYC/onboarding (owned) → Sigma transaction
fraud / RiskOS (unowned)** — swap the bridge from the product-bridge table for
other pillars.

## 1 · Scope

Segment: accounts owning Product A with ≥6 months usage history.
Target: the unowned pillar the readiness signal points at.
Zero new tooling: one nightly job joins usage + tickets + billing → events
table → score → fire. Same enrich→score→route engine as acquisition, re-pointed.

## 2 · Signal (when does the play fire?)

Composite readiness score, recomputed nightly from data already held:

| Component | Example threshold |
|---|---|
| Product-A usage plateau | <5% decision-volume growth, 2 consecutive months |
| Downstream fraud leakage | chargeback/ATO/manual-review growth on VERIFIED accounts, 3-month trend |
| Scale threshold | decision volume crosses pilot-worthy floor |
| Renewal window | inside 90 days (named honestly in any message sent) |

Threshold-crossing fires ONE debounced event → CRM task + Slack alert + play
packet with the evidence attached. No signal → no play. Ever.

## 3 · Roles

| Who | Does |
|---|---|
| **CSM/AM** | owns the play; accepts/declines in 48h (decline reason → ledger) |
| **Champion** (existing Product-A owner/user) | makes the intro to the Product-B persona — never bypassed |
| **Growth engineer** | owns the signal job + weight retuning |
| **SE** | scopes fits above pilot size |

## 4 · Touch sequence (messaging is the play)

**Touch 1 — Champion ping** (CSM → existing contact, Slack/email, informal-warm):

> {{first_name}} — flagged something in the {{account}} data worth a look:
> chargeback rate on verified accounts is up {{signal_metric}} over the last
> {{window}}. Onboarding's doing its job — this pattern is downstream of it.
> Worth 15 minutes with whoever owns transaction fraud on your side? Happy to
> bring the analysis.

**Touch 2 — Intro email to the Product-B persona** (after champion intro; this
persona has never talked to TargetCo — full cross-sell arc):

> Subject: {{signal_metric}} chargeback trend on verified {{account}} accounts
>
> {{new_persona_name}} — {{champion_name}} suggested I share this. Accounts
> clearing identity verification at onboarding show a {{signal_metric}} rise in
> downstream chargebacks over {{window}} — a pattern front-door verification
> can't see by design.
>
> Sigma scores transaction-time risk against 4B+ known outcomes on the platform
> {{account}} already runs for onboarding. Betterment runs the fuller stack and
> lifted auto-approval 30% while holding fraud flat.
>
> Low-friction way to test it: score last quarter's chargeback queue offline —
> no integration, results against your own labels. Worth a look?

**Touch 3 — Follow-up w/ pilot** (+5 business days, one nudge only):

> Circling once — the offline scoring run on {{account}}'s chargeback queue takes
> about a week and shows exactly what the front door missed. If the capture rate
> doesn't earn the meeting, that's the answer too. Should I set it up with
> {{champion_name}}?

Rules across all touches: one bridge per play · verified numbers only ·
renewal window named if inside 90 days · no touch 4 — silence means retune the
signal, not more email.

## 5 · Enablement

Expansion battle card generated per fired play (7-section structure in
`messaging-expansion.md`), reviewed by the CSM before any touch — per-item human
gate, never auto-sent.

## 6 · Guardrails

- **Product-A health gate:** retention/NPS check passes or the play doesn't fire
  (churn-risk accounts get a save motion, not an upsell).
- **Champion protection:** no cold outreach around the champion; claims stay
  verified-tier — their credibility is borrowed capital.
- **Debounce:** one play per account per quarter, max.

## 7 · Instrumentation (how we know it worked)

| Metric | Reads |
|---|---|
| Funnel | flagged → CSM-accepted → intro made → meeting → opp → closed-won Product-B ARR |
| Signal precision | CSM decline rate = false-positive rate → feeds weight retuning |
| Guardrail | Product-A retention/NPS delta on played accounts = 0 |
| North star | Product-B ARR attributable to the signal · NDR lift |

The CSM accept/decline ledger is the learning loop: decline reasons are
structured data the next weight-tuning pass reads — learning in data, not vibes.
