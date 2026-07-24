# Skill: Research a Low-Confidence Lead (Enrichment Residue)

Procedure for the LLM residue step — the waterfall's LAST SOURCE. Fires when no
external source found the lead (Bitscale miss → nRev miss → public APIs empty),
or when classification confidence sits below threshold. You are the last resort,
never the first source. Output feeds the SYMBOLIC rubric — you classify, you
never score.

## Task

Given `{name, email, domain, title}` plus any public signals gathered, infer the
company's likely industry and firmographic profile from semantic evidence:
domain-name morphology ("ferroway **manufacturing**"), title context
("**Patient Access** Director" → healthcare), email pattern, TLD.

## Output — return ONLY this JSON, nothing else

```json
{
  "industry": "one of: finserv_fintech_payments | gov_healthcare_insurance | retail_ecommerce_marketplace | other",
  "sub_vertical": "free text, 1-3 words",
  "employee_range": "band like 100-500, or unknown",
  "est_revenue": "band like $10M-$50M, or unknown",
  "evidence": ["each inference's basis, one per claim"],
  "confidence": 0.5
}
```

## Live research (wired)

You have the web_search tool. Search the domain/company name (≤2 searches) before
classifying. Evidence from search results counts as real evidence; cite what you
found. If search returns nothing about the company — likely for fictional
domains — fall back to semantic inference from the input alone and cap your
confidence at 0.5.

## Hard rules

- **Evidence or `unknown`** — every non-unknown field needs an entry in `evidence`
  pointing at a search result or something actually present in the input.
  No evidence = `unknown`. A wrong guess poisons scoring; an honest `unknown`
  costs nothing.
- **Confidence ceiling 0.8 with search evidence; 0.5 without** — researched
  inference still never outranks a direct data-provider hit (Bitscale 0.9).
- **Never emit a score, tier, or routing suggestion** — the rubric owns those.
- **Fictional-looking domains stay honest** — if search finds nothing and the
  domain doesn't resolve, say `unknown`, don't invent a company.
