# Part 2 — Converting Product-A Usage into Product-B Pipeline

**Frame.** The Bowtie model unifies acquisition (left side) with retention and
expansion (right side) around measurable customer impact at the commitment knot.
Expansion fires only after the customer has realized **sustained, recurring value
from Product A** — never on adoption alone.

**The readiness signal.** An account in Segment X is expansion-ready when it
sustains **>85% active paid-license capacity utilization** alongside **daily admin
workflow engagement** over a rolling 30-day window — recurring operational impact,
not a usage spike. **The trigger** fires automatically when the threshold holds
across **two consecutive bi-weekly evaluation cycles**.

**Who executes — dual-track, sales and marketing aligned.**
- **Sales (CSM/AM):** the assigned owner initiates direct 1:1 outreach using
  curated messaging.
- **Marketing air cover (contact-based ads):** qualified account and contact
  lists sync to ad platforms (LinkedIn Matched Audiences) so key decision-makers
  see Product-B case studies and value propositions in parallel with the outreach.

Product Marketing + RevOps curate the central templates, battlecards, ad
creatives, and communication guides — one consistent message across both the 1:1
CSM channel and the digital campaigns.

**Zero-tooling setup.** No RevOps or PLG platform purchased: a **scheduled SQL
query** extracts usage metrics + admin contacts for qualified accounts to CSV; a
**lightweight Zapier flow** uploads/updates the ad-platform audiences, generates
prioritized discovery tasks in the CRM, and posts an alert to a **private Slack
channel** so the account owner is notified immediately.

**Instrumentation — bridge performance.**

| Bowtie bridge metric | Measures | Target |
|---|---|---|
| Signal-to-execution rate | Signal detection → CSM outreach + ad launch within 48h | >90% |
| Outreach-to-qualified discovery | Engaged accounts → completed Product-B discovery calls | >25% |
| Product-B pipeline generated ($) | Net-new annualized recurring revenue pipeline | Tracked monthly |
| Expansion velocity | Days from signal trigger to closed-won | <30 days |

---

*Operationally this is the Part 1 engine re-pointed at the right side of the
bowtie: the readiness signal is the ICP rubric recomputed over usage data, and
routing resolves to the account owner via the same ownership ledger.*
