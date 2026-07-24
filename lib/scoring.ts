import rubric from "../config/icp-rubric.json" with { type: "json" };
import type { Lead, Score } from "./types.js";

interface Bucket { name: string; points: number; keywords: string[] }

// first matching bucket wins (order = priority, per rubric $tie_break); empty keyword list = catch-all
function matchBucket(text: string, buckets: Bucket[]): Bucket {
  const t = text.toLowerCase();
  return buckets.find((b) => b.keywords.length === 0 || b.keywords.some((k) => t.includes(k)))!;
}

export function scoreLead(lead: Lead): Score {
  const d = rubric.dimensions;
  // vertical matches domain + enrichment.industry (per rubric match_on) — so an
  // LLM-classified residue lead can still land its true bucket; scoring stays symbolic.
  const vertical = matchBucket(
    `${lead.domain} ${lead.enrichment?.industry ?? ""}`,
    d.vertical_fit.buckets as Bucket[],
  );
  const persona = matchBucket(lead.title, d.buyer_persona.buckets as Bucket[]);
  const seniority = matchBucket(lead.title, d.seniority.buckets as Bucket[]);

  const fitText = `${lead.title} ${lead.domain}`.toLowerCase();
  const fitHits = d.fit_keywords.keywords.filter((k: string) => fitText.includes(k));
  const fitPoints = Math.min(fitHits.length * d.fit_keywords.points_per_distinct_match, d.fit_keywords.max);

  const total = vertical.points + persona.points + seniority.points + fitPoints;
  const tierDef = rubric.tiers.find((t) => total >= t.min)!;

  const dq = rubric.disqualifiers.flags.find((f) =>
    f.keywords.some((k: string) => lead.domain.toLowerCase().includes(k)),
  );

  return {
    total,
    breakdown: {
      vertical_fit: { bucket: vertical.name, points: vertical.points },
      buyer_persona: { bucket: persona.name, points: persona.points },
      seniority: { bucket: seniority.name, points: seniority.points },
      fit_keywords: { bucket: fitHits.join("+") || "none", points: fitPoints },
    },
    tier: tierDef.name as Score["tier"],
    ...(dq ? { dq_reason: dq.reason } : {}),
  };
}
