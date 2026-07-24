# Operations — Instrumentation · Maintenance · Change Management

## 1 · Instrumentation plan — what's tracked, and how I'd know it's working

**Per run (built):** tier distribution + rep load, written to `output/` and compared
against the prior run (`memory/runs/`) by the decision brief — deltas, enrichment
trust score (% live-signal vs. fallback), and rules-triggered recommendations.

**Pipeline health (Trigger.dev):** per-stage success/retries/duration; a failed
enrichment degrades one lead's confidence, never blocks the run.

**LLM (Langfuse):** cost, tokens, latency per call; groundedness eval on every
battle card — a card citing an unverified number fails before a rep sees it.

**Alert thresholds (Slack, ops channel):**
- any unrouted lead → invariant breach, run fails loudly
- tier skew: 0 hot, or hot >40% → rubric miscalibrated
- rep imbalance: >50% of book on one rep
- enrichment trust <50% → don't trust the vertical mix until sources improve

**How I'd know it's actually working:**
- *Day one:* 30/30 exit with rep + score + human-readable reason, zero unrouted,
  re-runs idempotent (`npm run check` — offline invariant tests for scoring,
  routing, suppression, ownership).
- *Real signal:* reply/meeting rate **by tier**. If hot doesn't outperform warm,
  the rubric is decoration. Rep accept/decline decisions (with reasons) are the
  training data that retunes weights — the loop learns in data, not vibes.

## 2 · Maintenance plan — what needs regular attention

| Cadence | Task | Trigger to act early |
|---|---|---|
| Weekly | Review Langfuse spend + eval pass-rate; triage any failed runs (per-stage retry logs) | Eval pass-rate drops, cost spike |
| Weekly | Sync `data/socure-customer-list.csv` from CRM — suppression is only as good as this list | New closed-won logo |
| Monthly | Vendor coverage check: Bitscale/nRev hit-rate vs. the DNS/RDAP + symbolic floor | Enrichment trust score trending down |
| Monthly | Reconcile ownership ledger vs. CRM account owners | Rep change, territory change |
| Quarterly | Refresh grounding corpus: new Socure case studies enter the allowlist **only after adversarial verification**; retired claims join the blocklist | New press release cited in a card draft |
| Quarterly | Rubric recalibration: re-run the reverse-ICP on the current customer base; retune weights from the rep accept/decline ledger | Hot-tier reply rate ≤ warm-tier |
| As released | Pin bumps: Trigger.dev SDK, Anthropic model version (Haiku deprecations), Langfuse | Deprecation notices |

Failure runbook: every stage retries independently (Trigger.dev); an invariant
breach (unrouted lead, contract violation) fails the run loudly by design — fix
config or data, re-run; idempotency guarantees no duplicate rows, cards, or events.

## 3 · Change management plan — how changes ship safely

**All decision logic is config, so every change is a diff.** The ICP, territories,
and confidence ceilings live in `config/*.json` (rubric carries a `version` field
and inline evidence citations). No weights or thresholds hide in code or prompts —
a change is a reviewable one-file PR, and rollback is `git revert` + re-run
(idempotent, so regeneration is safe).

**Shadow before promote.** A rubric or routing change is re-run against the current
book before it goes live; the decision brief diffs the result vs. the prior
snapshot (`memory/runs/`) — tier migrations and rep-load shifts are visible
*before* any rep's book actually moves. Promote only when the diff is intended.

**Evidence gate on content changes.** New proof points, competitive claims, or
persona pains enter `docs/grounding/` only through verification; the battle-card
eval enforces it downstream, so an unverified claim can't ship even if it sneaks
into a prompt.

**Prompt changes are versioned and eval'd.** Prompts live in `prompts/` (files, so
they diff like code); Langfuse traces which version produced which output, and the
groundedness eval must hold before a new prompt version becomes the default.

**Human gates only loosen by evidence, and some never do.** Autonomy changes follow
the graduated-trust ladder (per-category confidence ≥ ~90% over ≥ 20 decided items
to batch review; rolling-window demotion below ~80%). Battle cards are
outward-facing → permanent per-item rep review, regardless of confidence.

**People side:** reps get a Slack note when territories or the rubric change
(their book shifts); the decision brief's next run quantifies exactly what moved
and why (variance attributed by rubric dimension), so the change explains itself.
