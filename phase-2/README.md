# Phase 2 — Battle Card on Demand (Slack → deep research → writers → HTML → Slack)

Reference implementation bundle for the on-demand battle-card workflow. Part 1 (the
lead pipeline) ships cold-lead → enrich → score → route → cards in batch. Phase 2 adds
a **Slack-triggered, single-account** path: a rep asks for a card, Claude runs live deep
research (`web_search` + `web_fetch`), three writer agents draft it against the locked
template, it's rendered to HTML, logged to Supabase, and delivered back in the Slack thread.

All files here mirror their **real destination paths** — each drops straight into the repo
at the location in the table below. Nothing in this folder is imported at runtime; it's a
reviewable staging bundle. Relative imports (`../lib/assets.js`) are written for the
destination, not for `phase-2/`.

## The 12-step flow

| # | Step | Where |
|---|------|-------|
| 1 | Slack Trigger — Battle Card Mention (`app_mention`) | Slack app |
| 2 | Webhook Relay — verify HMAC, ack <3s, dedupe on `event_id` | `integrations/slack-webhook/worker.js` |
| 3 | Lead Extractor — regex → Haiku fallback | `tools/slack-battle-card.ts` |
| 4 | Account Lookup — from Supabase | `tools/slack-battle-card.ts` + `connections/supabase.ts` |
| 5 | High-Intent Gate — `tier !== "cold"` | `tools/slack-battle-card.ts` |
| 6 | Deep Research Agent — Sonnet 4.6, web_search ≤8 + web_fetch ≤4 | `connections/llm.ts` + `prompts/battle-card-research.md` |
| 7 | Writer Agents ×3 — parallel Haiku, template section ownership | `tools/battle-card.ts` |
| 8 | Card Assembler — deterministic stitch + blocklist gate | `tools/battle-card.ts` + `lib/card-html.ts` |
| 9 | HTML Renderer + Groundedness Eval | `lib/card-html.ts` + `tools/battle-card.ts` |
| 10 | Ledger Writer — `battle_cards` row | `tools/slack-battle-card.ts` + `connections/supabase.ts` |
| 11 | Slack Delivery — thread reply + `.html` upload | `connections/slack.ts` |
| 12 | Trace & Groundedness Eval — one Langfuse trace per card | existing `llm.ts` wiring |

## Drop-in map

| Bundle file | Destination | Action |
|---|---|---|
| `connections/llm.ts` | `connections/llm.ts` | **replace** (adds `tracedResearch` opts + loop; `tracedCompletion` unchanged) |
| `connections/supabase.ts` | `connections/supabase.ts` | new |
| `connections/slack.ts` | `connections/slack.ts` | new |
| `lib/card-html.ts` | `lib/card-html.ts` | new |
| `tools/battle-card.ts` | `tools/battle-card.ts` | **replace** (research → writers → assemble → eval → html) |
| `tools/slack-battle-card.ts` | `tools/slack-battle-card.ts` | new |
| `prompts/battle-card-research.md` | `prompts/battle-card-research.md` | new |
| `sql/schema.sql` | run once in Supabase SQL editor | — |
| `integrations/slack-webhook/worker.js` | deploy as Cloudflare Worker | — |
| `_edits/assets.additions.ts` | append to `lib/assets.ts` | 2 lines |
| `_edits/run-lead-pipeline.additions.md` | edit `tools/run-lead-pipeline.ts` | 3 lines |

## Build order (phases 1–4 need no Slack creds)

1. **Deep Research Agent** — `connections/llm.ts`, `prompts/battle-card-research.md`
2. **Writers + Assembler + HTML** — `tools/battle-card.ts`, `lib/card-html.ts`, template amendments
3. **Database** — `sql/schema.sql`, `connections/supabase.ts`, pipeline upsert
4. **Trace & Eval** — one trace per card, blocklist + Haiku judge → `groundedness` 0/1
5. **Slack trigger** — Slack app, `integrations/slack-webhook/worker.js`, `tools/slack-battle-card.ts`
6. **Slack delivery** — `connections/slack.ts`

## Env vars (`.env` locally, Trigger.dev dashboard for cloud runs)

```
ANTHROPIC_API_KEY=
LANGFUSE_PUBLIC_KEY=      LANGFUSE_SECRET_KEY=      LANGFUSE_BASEURL=
SUPABASE_URL=            SUPABASE_SERVICE_KEY=
SLACK_BOT_TOKEN=        SLACK_SIGNING_SECRET=
TRIGGER_SECRET_KEY=      # Worker only, to call the Trigger.dev API
```

## Boundaries

- **Only inbound door is the Worker** — Slack never calls Trigger.dev directly; signature
  check + `<3s` ack + retry dedupe (`idempotencyKey = event_id`) live there.
- **Supabase is the only cross-run state** — accounts written by the batch pipeline, read by
  the Slack path; cards persisted as ledger rows because Trigger.dev cloud filesystems are
  ephemeral.
- **Langfuse is observe-only** — traces + scores flow in, nothing reads back at runtime, so
  an outage there can't block delivery.

Topology diagram: `../docs/topology.html`.
