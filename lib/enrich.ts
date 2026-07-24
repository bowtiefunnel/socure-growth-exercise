import rubric from "../config/icp-rubric.json" with { type: "json" };
import cfg from "../config/enrichment.json" with { type: "json" };
import type { Enrichment, Lead } from "./types.js";
import { tryBitscale } from "../connections/bitscale.js";
import { tryNrev } from "../connections/nrev.js";
import { probePublic } from "../connections/public-enrichment.js";
import { llmAvailable, tracedResearch } from "../connections/llm.js";
import { researchLeadSkill } from "./assets.js";

function symbolicEnrich(lead: Lead): Enrichment {
  const d = lead.domain.toLowerCase();
  const bucket = rubric.dimensions.vertical_fit.buckets.find(
    (b) => b.keywords.length === 0 || b.keywords.some((k: string) => d.includes(k)),
  )!;
  const hit = bucket.keywords.find((k: string) => d.includes(k));
  return {
    industry: bucket.name,
    sub_vertical: hit ?? "unclassified",
    employee_range: "unknown", // mock domains carry no firmographic signal
    est_revenue: "unknown",
    tech_signals: [],
    source: "symbolic",
    confidence: bucket.name === "other" ? cfg.confidence.symbolic_other : cfg.confidence.symbolic_known_vertical,
  };
}

/**
 * Data-contract assertion — the brief's required properties, enforced per lead.
 * Identity (name/email/domain/title) intact + full enrichment block present
 * (firmographic fields may be "unknown" but must EXIST; provenance mandatory).
 * Throws → run fails loudly; a silent partial record never ships.
 */
export function assertEnrichmentContract(lead: Lead): void {
  const missing: string[] = [];
  for (const f of ["name", "email", "domain", "title"] as const) if (!lead[f]) missing.push(f);
  const e = lead.enrichment;
  if (!e) missing.push("enrichment");
  else {
    for (const f of ["industry", "sub_vertical", "employee_range", "est_revenue", "source"] as const)
      if (!e[f]) missing.push(`enrichment.${f}`);
    if (!Array.isArray(e.tech_signals)) missing.push("enrichment.tech_signals");
    if (!(e.confidence > 0 && e.confidence <= 0.9)) missing.push("enrichment.confidence");
  }
  if (missing.length) throw new Error(`data contract violated for lead ${lead.id} (${lead.domain}): missing ${missing.join(", ")}`);
}

/** Cascade: Bitscale → nRev (webhook Play) → free public APIs (DNS/RDAP) → symbolic → LLM residue. */
export async function enrichLead(lead: Lead): Promise<Enrichment> {
  const bitscale = await tryBitscale(lead);
  if (bitscale) return bitscale;
  const nrev = await tryNrev(lead);
  if (nrev) return nrev;

  const symbolic = symbolicEnrich(lead);
  const pub = await probePublic(lead.domain);
  const found = pub.tech_signals.length > 0;
  const base: Enrichment = found
    ? {
        ...symbolic,
        tech_signals: pub.tech_signals,
        source: "public+symbolic",
        confidence: Math.min(
          symbolic.confidence + (pub.resolves ? cfg.confidence.public_boost_resolves : cfg.confidence.public_boost_no_resolve),
          cfg.confidence.public_cap,
        ),
      }
    : symbolic;

  // LLM residue — the waterfall's last SOURCE: fires when no external source found
  // the lead (vendors + public all missed), or classification is still low-confidence.
  // LLM classifies, never scores. Gated on key; skipped otherwise.
  if ((!found && cfg.llm_fire_on_unfound) || base.confidence < cfg.llm_residue_threshold) {
    const llm = await tryLlmResidue(lead);
    if (llm) {
      // agreement between independent methods raises trust; disagreement keeps the LLM's own (ceilinged) confidence
      const agrees = llm.industry === base.industry;
      return {
        ...llm,
        tech_signals: [...base.tech_signals, ...llm.tech_signals],
        confidence: agrees ? Math.max(llm.confidence, base.confidence) : llm.confidence,
      };
    }
  }
  return base;
}

async function tryLlmResidue(lead: Lead): Promise<Enrichment | null> {
  if (!llmAvailable()) return null;
  try {
    const raw = await tracedResearch(
      `enrich-residue:${lead.domain}`,
      researchLeadSkill(),
      JSON.stringify({ name: lead.name, email: lead.email, domain: lead.domain, title: lead.title }),
    );
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    if (!parsed.industry) return null;
    return {
      industry: String(parsed.industry),
      sub_vertical: String(parsed.sub_vertical ?? "unclassified"),
      employee_range: String(parsed.employee_range ?? "unknown"),
      est_revenue: String(parsed.est_revenue ?? "unknown"),
      tech_signals: Array.isArray(parsed.evidence) ? parsed.evidence.map((e: unknown) => `evidence:${e}`) : [],
      source: "llm",
      confidence: Math.min(Number(parsed.confidence) || 0.4, cfg.confidence.llm_web_ceiling), // web-research ceiling, enforced in code too
    };
  } catch {
    return null; // unparseable → keep symbolic; residue never blocks a lead
  }
}
