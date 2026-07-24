import cfg from "../config/enrichment.json" with { type: "json" };
import type { Enrichment } from "./types.js";

/** Shared vendor-output mapper — aliases + confidences come from config/enrichment.json. */
export function mapVendorOutput(
  out: Record<string, unknown>,
  source: "bitscale" | "nrev",
): Enrichment | null {
  const pick = (aliases: string[]) =>
    aliases.map((k) => out[k]).find((v) => typeof v === "string" && v) as string | undefined;

  const industry = pick(cfg.field_aliases.industry);
  const employee_range = pick(cfg.field_aliases.employee_range);
  const est_revenue = pick(cfg.field_aliases.est_revenue);
  if (!industry && !employee_range && !est_revenue) return null; // nothing enriched → miss

  const techRe = new RegExp(cfg.tech_signal_key_pattern, "i");
  return {
    industry: industry ?? "unknown",
    sub_vertical: pick(cfg.field_aliases.sub_vertical) ?? "unclassified",
    employee_range: employee_range ?? "unknown",
    est_revenue: est_revenue ?? "unknown",
    tech_signals: Object.entries(out)
      .filter(([k, v]) => techRe.test(k) && typeof v === "string" && v)
      .map(([k, v]) => `${k}:${v}`),
    source,
    confidence: cfg.confidence[source],
  };
}
