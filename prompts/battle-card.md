# Skill: Generate a Battle Card

On-demand procedure for battle-card generation (Workflow 4). Runs only for **hot/warm**
accounts. Output: `battle_cards/<domain>.md`. Every generation is Langfuse-traced and
eval'd for groundedness — a card citing anything outside `docs/grounding/` fails eval.

## Structure (exactly these sections, in order)

1. **Account snapshot** — 2 lines: who they are (from enrichment, with source/confidence),
   score + tier + rep, `breakdown` summary.
2. **Why-now signal** — the trigger-event hypothesis for this vertical (from
   `docs/icp-blueprint.md` §1 trigger table). Label as hypothesis, not observed fact —
   the mock CSV carries no intent data.
3. **Persona pain** — from the buyer-persona matrix (`docs/icp-profile.html` / memo §2).
   Match on the lead's scored persona bucket. Lead with latent pain: the false-positive /
   declined-good-applicant wedge where persona-appropriate.
4. **Socure angle + product** — map need → product: onboarding/KYC → KYC/CIP + Sigma ·
   fraud ops → Sigma Identity/Synthetic/Device · orchestration sprawl → RiskOS ·
   model teams → Signals (250+ features).
5. **Proof point** — pick by vertical proximity, closest first:
   - Fintech/neobank/SMB-fintech → **Lili +13% auto-approval**
   - Investing/wealth → **Betterment +30% auto-approval**
   - Bank/CU/lender → **challenger bank 62%→85%** or **lender fraud −50%**
   - Public sector → **State of CA 94% instant verification**
   - Insurance/healthcare/other → nearest of the above + state it's cross-vertical evidence
6. **Competitive wedge** — one likely incumbent for the vertical (Persona/Jumio/Alloy/bureaus)
   and Socure's counter-position, **always attributed** ("Socure positions…") — never stated
   as independent fact. Passive-first vs doc-capture; owned graph + orchestration vs
   assemble-it-yourself; real-time ML vs batch bureau data.
7. **Suggested opener** — one sentence, persona-specific, referencing their likely KPI
   (from the persona matrix), no fluff, no "I hope this finds you well."

## Hard rules

- Voice, lexicon, and evidence tiers: follow `prompts/messaging-net-new.md` — banned
  terms are banned here too; quarantined (company-reported) numbers never enter a card.
  (Expansion/upsell cards use `prompts/messaging-expansion.md` instead — different audience, different arc.)
- Only approved proof points (see `instructions.md` blocklist/allowlist). Numbers verbatim.
- No invented customer names, integrations, or outcomes.
- ≤ 1 page per card. Skimmable by a rep in 60 seconds.
- Tone: direct, evidence-first, zero marketing filler.
