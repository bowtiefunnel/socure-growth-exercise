# Skill: Deep Research for a Battle Card

Procedure for the Deep Research Agent (Workflow 4, step 6). Runs once per hot/warm
account, BEFORE the writer agents. You have the `web_search` and `web_fetch` tools —
Claude runs an agentic loop: search, read results, fetch key pages, follow up,
synthesize. Output feeds the writers as `researched_signals`; you research and cite,
you never write card sections and never score.

## Task

Given `{domain, enrichment, tier}`, gather live evidence across four angles (the four
Perplexity/Jina nodes this replaces), then return a compact evidence-cited digest:

1. **Why-now / trigger events** — recent funding, launches, expansion, breaches,
   leadership changes, hiring in risk/compliance. Feeds card §3.
2. **Incumbent identity/fraud vendor** — any mention of Persona, Jumio, Alloy, TargetCo,
   bureaus, or in-house KYC in docs, careers pages, changelogs, reviews. Feeds card §7.
3. **Product & onboarding surface** — what they sell, how users sign up, KYC/fraud
   exposure. Feeds card §4–5.
4. **Reviews & sentiment** — G2/Trustpilot/Reddit complaints about onboarding friction,
   false declines, fraud. Feeds card §3–4.

## Search budget

- **≤8 searches, ≤4 fetches.** Fetch the company's own site (`{domain}`) first — it's the
  highest-signal source for angles 2 and 3.
- Stop early once each angle has evidence or is confirmed empty. Don't burn the budget.

## Output — return this shape, nothing else

```json
{
  "why_now": [{ "signal": "...", "source": "url", "date": "YYYY-MM", "confidence": 0.7 }],
  "incumbent": { "vendor": "Alloy | none | unknown", "source": "url", "confidence": 0.7 },
  "product_surface": ["onboarding/KYC facts, each with a source"],
  "sentiment": [{ "theme": "...", "source": "url" }],
  "notes": "one line: coverage + what came up empty"
}
```

## Hard rules

- **Evidence or omit** — every non-empty field cites a search result or fetched page.
  No source = leave it out. A fabricated signal poisons the card; an honest gap costs
  nothing (the writer falls back to the vertical trigger-table hypothesis).
- **Confidence ceiling 0.8** — live research never outranks a Bitscale data-provider hit
  (0.9). Cap each `confidence` at 0.8.
- **Fictional domains stay honest** — this exercise runs on mock CSV data. If search finds
  nothing about the company and the domain doesn't resolve, return empty arrays and
  `notes: "no web presence — fictional domain"`. Do not invent a company.
- **Never write a card section, score, tier, or opener** — you produce evidence; the
  writers and the rubric own everything else.
- **No TargetCo claims** — you research the PROSPECT only. TargetCo proof points and competitive
  positioning come from `docs/grounding/`, never from your searches.
