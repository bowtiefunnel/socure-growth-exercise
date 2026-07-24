# Part 2 — Converting Product-A Usage into Product-B Pipeline

**Setup:** Segment X = mid-market fintechs with strong usage of Product A (KYC/
onboarding). Product B = transaction-fraud decisioning. Starting tooling: none.

**The signal.** Readiness is a composite score computed nightly from data already
held — no new instrumentation: Product-A usage plateau (healthy but flat = fully
deployed), fraud leaking past the front door (chargeback/ATO/manual-review growth
on *verified* accounts — the strongest signal, because it's Product B's exact gap),
a scale threshold, and the renewal window. One debounced threshold-crossing event
per account, max one play per quarter. No signal → no play.

**The trigger.** A nightly job (a script + a cron — zero purchased tooling) joins
usage, support tickets, and billing into an events table, recomputes scores, and
on threshold-crossing fires: CRM task + Slack alert to the account's CSM, carrying
the evidence and an auto-generated upsell battle card grounded in verified
multi-product proof (Betterment +30% auto-approval running the fuller stack).

**Who executes.** The CSM/AM runs it — warm motion, not cold outreach. Where the
Product-B budget owner differs from the Product-A champion (CCO bought KYC; the
CRO owns fraud), the champion makes the intro; nobody gets cold-emailed around
their own relationship. A growth engineer owns the signal job and weight tuning;
an SE scopes larger fits. Guardrail: a Product-A health check (retention/NPS)
gates every play — at-risk accounts get a save motion, not an upsell.

**Instrumentation.** Funnel: flagged → CSM-accepted → meeting → opp → closed-won
Product-B ARR. Signal precision: CSM decline rate = false-positive rate, and
decline *reasons* are structured data that retune the weights — the loop learns
in data. Guardrail metric: Product-A retention/NPS delta on played accounts stays
zero. North star: Product-B ARR attributable to the signal, and NDR lift.

**How I'd know it worked:** within two quarters, signal-sourced Product-B
pipeline exists with CSM acceptance >60% (the signal is credible to humans), and
played accounts show no Product-A degradation. If acceptance is high but nothing
closes, the signal is right and the play is wrong; if acceptance is low, the
signal is wrong — the funnel tells me which half to fix.

---

*This is the acquisition engine re-pointed: the same enrich → score → route
pipeline from Part 1, where "enrichment" is usage/billing joins, the "ICP rubric"
is the readiness score, and "routing" resolves to the account owner — the
ownership ledger and account-first routing are already built into the Part 1
system. Full operational detail: `docs/playbook-cross-sell.md` (touch templates,
role definitions) and `prompts/messaging-expansion.md` / `messaging-cross-sell.md`
(voice standards for existing-customer vs. new-stakeholder motions).*
