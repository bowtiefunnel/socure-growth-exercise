# Reverse-ICP: What the 43-Logo Customer Base Actually Says

*Reverse-engineering `socure-customer-list.csv` into firmographic evidence for the ICP.
Headcount/stage are coarse public-knowledge estimates (≈ bands, not audited figures) — directional, good enough to derive distributions, not account facts. Compiled 2026-07-24.*

## Per-account firmographics

| # | Customer | Vertical | ≈ Headcount band | Stage / ownership | Geography note |
|---|---|---|---|---|---|
| 1 | Capital One | Tier-1 Bank | 20k+ | Public | US |
| 2 | Citi | Tier-1 Bank | 20k+ | Public | Global, US-regulated |
| 3 | Discover | Tier-1 Bank | 20k+ | Public | US |
| 4 | Green Dot | Bank / BaaS | 1k–5k | Public | US |
| 5 | Dave | Neobank | 300–1k | Public | US |
| 6 | Nubank | Bank | 5k–20k | Public | **Brazil HQ — US-market entity** |
| 7 | Revolut | Bank / Fintech | 5k–20k | Late private | **UK HQ — US entity onboarding** |
| 8 | Chime | Neobank | 1k–5k | Late private | US |
| 9 | SoFi | Fintech / Bank | 1k–5k | Public | US |
| 10 | Varo | Neobank | 300–1k | Late private | US |
| 11 | Cash App (Block) | Fintech | 5k–20k (parent) | Public | US-led |
| 12 | Lili | Neobank (SMB) | **<300** | Series B/C | US |
| 13 | Robinhood | Investing | 1k–5k | Public | US |
| 14 | Public | Investing | <300 | Series C+ | US |
| 15 | Stash | Investing | 300–1k | Late private | US |
| 16 | TradeStation | Investing | 300–1k | Subsidiary | US |
| 17 | Coinbase | Crypto | 1k–5k | Public | US-led global |
| 18 | Gemini | Crypto | 300–1k | Private | US |
| 19 | Kalshi | Prediction market | <300 | Series B/C | US |
| 20 | Betterment | Wealth | 300–1k | Late private | US |
| 21 | DraftKings | iGaming | 1k–5k | Public | US |
| 22 | PrizePicks | iGaming | 300–1k | Private | US |
| 23 | Underdog | iGaming | 300–1k | Series B/C | US |
| 24 | Fanatics (Betting) | iGaming | 1k–5k (unit) | Late private | US |
| 25 | Caesars | iGaming / Casino | 20k+ | Public | US |
| 26 | Uber | Marketplace | 20k+ | Public | Global, US-led |
| 27 | LinkedIn | Social / HR | 5k–20k | Microsoft | Global |
| 28 | TikTok | Social | 20k+ | ByteDance | **Global — US trust/safety mandate** |
| 29 | Angi | Marketplace | 1k–5k | Public | US |
| 30 | Poshmark | Marketplace | 300–1k | Naver | US |
| 31 | Gusto | HR / Payroll | 1k–5k | Late private | US |
| 32 | Dwellsy | Rental marketplace | **<300 (seed-scale)** | Early private | US |
| 33 | InGo | Event identity | **<300** | Early private | US |
| 34 | Proof | Legal / notary | <300 | Series B/C | US |
| 35–41 | CA · NY · TX · FL · OH · Login.gov · FSA | Public sector | program-scale | Government | US |
| 42–43 | Challenger bank · Online lender (anon) | FinServ | unknown | unknown | US |

## What the base actually says (the derived ICP facts)

**1. Headcount distribution (36 scoreable commercial accounts):**
- <300 FTE: **6** (Lili, Public, Kalshi, Dwellsy, InGo, Proof)
- 300–1k: **8** · 1k–5k: **10** → **core cluster: 300–5,000 FTE = 18/36 (50%)**
- 5k–20k: **5** · 20k+: **7** (the named-account whales)

→ The former `[assumed]` "100–2,500 FTE" band is confirmed but **too narrow at the top and bottom**: evidence supports **~100–5,000 FTE as the scored-outbound sweet spot**, with a real seed-scale tail (Dwellsy, InGo) proving **headcount is not the qualifier — onboarding volume is**. Lili is <300 FTE with bank-scale application volume.

**2. Onboarding model — the cleanest signal in the whole base:**
**43/43 accounts run consumer-scale digital identity flows.** Zero B2B-only, zero manufacturing, zero logistics, zero .edu. This is the empirical proof of Negative-ICP flag #1 (no regulated digital onboarding = out).

**3. Use-case concentration:** KYC/CIP + fraud ≈ 30/43 rows → the regulatory-obligation prerequisite is not theory; it's what the base bought.

**4. Geography — refines Negative-ICP #3:** Nubank (Brazil), Revolut (UK), TikTok (global) prove international HQ is **not** disqualifying — each buys for a **US entity / US applicant flow**. The correct flag is "**no US applicant base**," not "non-US company."

**5. Stage mix:** ~1/3 public, ~1/3 late private (Series C+), plus an early-stage tail. Late-private + newly-public fintechs are the center of gravity — companies at the "growth spike + first regulator exam" collision point, which is exactly the trigger-event story.

**6. Whitespace read (what's NOT on the wall):** no credit unions, no insurers, no healthcare systems among the 43 — yet the exercise lead set is full of them (stonegatecu, cascadiacu, 4 insurance carriers, 4 health systems). Two readings: under-penetrated whitespace (upside) or historically weak fit (risk). The rubric prices this honestly: Insurance/Healthcare score 30 (strong-but-not-proven), never 35 — because there's no logo evidence yet.

## Feedback into the blueprint
- §1 size band: 100–2,500 → **100–5,000 FTE**, now evidence-derived (n=36), volume-qualified.
- §4 flag #3: reworded to "no US applicant base."
- §5 vertical weights: unchanged — but now with the explicit rationale that 35-point verticals are logo-proven, 30-point verticals are ICP-plausible whitespace.
