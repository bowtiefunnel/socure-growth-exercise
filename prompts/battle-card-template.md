# Battle Card Template — LOCKED

Output contract for Workflow 4 (battle-card generation). The Card Assembler emits
exactly this structure — sections, order, and tables are fixed. Writers fill
content only; they never add, remove, reorder, or rename sections. Rendered 1:1
to HTML by `lib/card-html.ts`.

Section owners: ① ② ③ = writer agents (LLM) · CODE = deterministic, no LLM.

---

# Battle Card — {{company_name}} ({{domain}})

**Generated:** {{date}} · run `{{run_id}}` · requested by {{requested_by}} in {{slack_channel}} · **human review required before use**

| § | Section | Content |
|---|---------|---------|
| 1 | **Account snapshot** ① | • {{who_they_are — industry, sub_vertical, employee_range, est_revenue}} (source: {{enrichment_source}}, conf {{enrichment_confidence}})<br>• Score **{{score}} / {{tier}}** → {{rep}}, {{sla}} SLA<br>• Breakdown: {{score_breakdown_summary}} |
| 2 | **Contacts — buying committee** CODE | See contact table below (from `account.leads`, committee depth {{committee_depth}}) |
| 3 | **Why-now signal** ① | • **Observed** ({{research_tool}} · {{source}}, {{source_date}}): {{observed_signal}} (conf ≤0.8) — only if `researched_signals` carries evidence<br>• {{signal_to_pain_bridge — why this signal creates identity/KYC pressure}}<br>• Fallback hypothesis ({{icp-blueprint §1 trigger table}}): {{vertical_trigger_hypothesis}} — always labeled hypothesis, never fact |
| 4 | **Persona pain** ② | • Primary persona bucket: **{{persona_bucket}}** ({{primary_title}})<br>• Lead with latent pain: {{false_positive_or_declined_good_applicant_wedge}}<br>• {{persona_kpi_framing — the number this persona owns}} |
| 5 | **Socure angle + product** ② | • {{need}} → **{{product — KYC/CIP + Sigma / Sigma Identity/Synthetic/Device / RiskOS / Signals}}**<br>• One bullet per need→product mapping; only map needs with evidence in §1/§3/§7 |
| 6 | **Proof point** ② | • {{vertical_proximity}} → **{{approved_proof_point — allowlist only, number verbatim}}**<br>• If cross-vertical: state it's cross-vertical evidence |
| 7 | **Competitive wedge** ③ | • Research ({{research_tool}}, {{source}}, conf {{confidence}}): {{incumbent_evidence}} — or "no incumbent observed; likely {{vertical_default — Persona/Jumio/Alloy/bureaus}}"<br>• Socure positions: {{counter_position — passive-first vs doc-capture / owned graph + orchestration vs assemble-it-yourself / real-time ML vs batch bureau}}<br>• Always attributed as Socure's framing — never stated as fact |
| 8 | **Suggested opener** ③ | • "{{one_sentence — persona-specific, references their likely KPI, no fluff, no 'hope this finds you well'}}" |

### Contacts

| Name | Title | Email | Persona bucket | Lead score | Role in deal |
|------|-------|-------|----------------|-----------|--------------|
| {{name}} | {{title}} | {{email}} | {{persona_bucket}} | {{score}} | {{primary_champion / influencer / technical_evaluator — from persona matrix}} |

<!-- one row per lead at the domain, sorted by score desc; first row = primary -->

| Meta | |
|---|---|
| Sources | enrichment ({{source}} {{conf}}) · researched_signals (web_search/web_fetch, conf ≤0.8) · proof points from `docs/grounding/` allowlist · contacts from `account.leads` (deterministic) |
| Blocklist check | {{pass/fail — assembler-enforced against instructions.md refuted-claims list}} |
| Writers | ① §1, 3 · ② §4–6 · ③ §7–8 · contacts + assembly = code |

---

## Fill rules (locked — assembler rejects violations)

1. **Every sentence is its own bullet.** No paragraphs inside cells.
2. **Numbers verbatim** from the allowlist; any figure not in `docs/grounding/` fails the card.
3. **Two evidence classes, never mixed:** account facts carry source + confidence
   (enrichment or research, cap 0.8); Socure claims come only from `docs/grounding/`.
4. **Competitive statements always attributed** ("Socure positions…").
5. **Observed vs hypothesis:** §3 leads with observed research when the digest has
   evidence; otherwise hypothesis-labeled fallback. Never present hypothesis as observed.
6. **≤1 page rendered.** Skimmable by a rep in 60 seconds.
7. **Voice:** `prompts/messaging-net-new.md` — banned terms banned here too.
8. **No invented contacts, customers, integrations, or outcomes.** Contact rows come
   from account data only.
