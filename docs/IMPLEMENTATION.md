# Implementation Plan — Phased by Capability

The build order (DESIGN.md §5) covers construction. Implementation is phased by
capability: the deterministic core ships first and proves itself, then the LLM
enablement layer, then the decision layer and full team adoption. Implementation
isn't done when the code runs — it's done when the team runs on it.

## Phase 0 — Build (complete)

Blocks 1–7 per `DESIGN.md` §5. Exit: live Trigger.dev run link, `npm run check` green.

## Phase 1 — Core pipeline live: enrichment · ICP scoring · routing (week 1)

The zero-LLM path (`npm run pipeline` logic as Trigger.dev tasks) — no model, no
vendor key required to deliver value.

- Deploy the core tasks to Trigger.dev prod; env vars set (never committed).
- Enrichment cascade live (vendors env-gated, probe-first; DNS/RDAP + symbolic floor).
- Create **#lead-pipeline-ops** in Slack: run summaries + threshold alerts
  (unrouted lead, tier skew, rep imbalance, enrichment trust).
- Run against the real book; verify invariants live: zero unrouted, breakdown on
  every score, `dq_reason` on every DQ, idempotent re-run (ownership ledger stable).
- Ops owner reviews the routed book + run stats; routing disputes → config edits.

**Exit:** routed book delivered with reasons on every decision; re-run produces the
identical book; ops sees alerts in Slack.

## Phase 2 — Enablement live: battle cards (week 2)

The first LLM capability — gated, eval'd, and rep-facing.

- `ANTHROPIC_API_KEY` + Langfuse keys into prod env; groundedness eval active
  (a card citing anything outside `docs/grounding/` fails before a rep sees it).
- Per-rep Slack delivery: P1 hot-lead alert carries score, breakdown, reason, and
  battle-card link — **the alert is where the SLA clock starts**.
- **Slack verification — don't assume they see it, prove it:** every rep joins
  their channel, notifications checked (not muted, mobile push on), and each rep
  ✅-reacts to a **test P1 alert**. No ack, no go-live for that book.
- **Training session (45 min, recorded):** how a routed lead arrives · reading the
  score `breakdown` and `dq_reason` · reading a battle card in 60 seconds · SLAs
  (P1 same-day, P2 48h, P3 nurture) · **accept/decline with a reason** — the
  decline reason is structured data that retunes the rubric, so "junk" is not a reason.
- Rep cheat-sheet (one page): tiers, priorities, where outputs live, dispute path.
- **Shadow week:** alerts + cards flow, no quota consequences; collect confusion
  points, fix config/copy, not habits.

**Exit:** every rep has ack'd a test alert; cards passing eval; first real P1
touched within SLA.

## Phase 3 — Decision layer & adoption (weeks 3–4)

- Decision brief live: deltas vs. prior run, enrichment trust score, projections,
  recommendations; LLM narration on (numbers computed by code only).
- **Adoption metrics:** alert-ack rate · time-to-first-touch vs. SLA · ledger
  fill rate (a decline without a reason counts as unfilled).
- Weekly 15-min review (first month) runs on the brief, not on opinions; changes
  ship as shadow-diffed config edits per `OPERATIONS.md`.
- Then hand off to the standing `OPERATIONS.md` cadence (weekly/monthly/quarterly).

## Instrumentation per phase — what's tracked, and how we'd know it's working

Same metrics as the standing plan (`OPERATIONS.md` §1), staged by when they first matter:

| Phase | What's tracked | "It's actually working" when |
|---|---|---|
| 1 — Core | Per-stage success/retries/duration (Trigger.dev) · tier distribution + rep load vs. alert thresholds · enrichment trust score (% live-signal vs. fallback) | 30/30 routed with a rep + score + human-readable reason, zero unrouted, re-run produces the identical book, all thresholds quiet |
| 2 — Cards | Langfuse cost/tokens/latency per card · groundedness eval pass-rate · rep alert-ack rate | 100% of shipped cards pass eval, every rep has ack'd, first real P1 touched within SLA |
| 3 — Adoption | Time-to-first-touch vs. SLA by priority · ledger fill rate · **reply/meeting rate by tier** | ≥90% P1 within SLA, 100% of declines carry reasons, and hot outperforms warm — if it doesn't, the rubric is decoration and Phase 3 feeds the recalibration loop |

The tier-conversion test is the plan's real success metric: everything before it
proves the machine runs; that one proves the scoring means something.

## Roles

| Role | Owns |
|---|---|
| Growth engineer | Pipeline, config changes, shadow-diff promotion, vendor health |
| Ops owner | Slack alerting, SLA tracking, adoption metrics, weekly review |
| Reps | Their book: touch within SLA, accept/decline with reasons |
| Escalation | Routing dispute → ops owner; unresolved >48h → growth engineer edits config |

## Definition of "implemented"

1. Core: routed book delivered, zero unrouted, idempotent re-runs verified in prod.
2. Every rep has ✅-ack'd a test alert in their own channel (seen ≠ assumed).
3. ≥90% of P1 alerts touched within SLA from week 3 on.
4. 100% of declines carry a reason in the ledger.
5. Weekly review runs on the decision brief, not on opinions.
