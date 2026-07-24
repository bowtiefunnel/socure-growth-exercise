import type { Enrichment, Lead } from "../lib/types.js";
import { mapVendorOutput } from "../lib/vendor-map.js";

/**
 * nRev enrichment — third-party vendor #2 in the waterfall (after Bitscale).
 * nRev has no public REST API; integration is a UI-built Play with a WEBHOOK trigger
 * (docs: "source table, webhook, or connected app"). Build the Play per
 * docs/nrev-play-spec.md §enrichment-service, paste its webhook URL into .env.
 * Block-1 discipline: on first activation, probe ONE lead and verify the response
 * shape below matches what the Play actually returns before trusting the batch.
 */
export async function tryNrev(lead: Lead): Promise<Enrichment | null> {
  const url = process.env.NREV_WEBHOOK_URL;
  if (!url) return null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: lead.name, email: lead.email, domain: lead.domain, title: lead.title }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const out: Record<string, unknown> = await res.json();
    return mapVendorOutput(out, "nrev"); // aliases/confidence: config/enrichment.json
  } catch {
    return null; // timeout/async-only Play/network — degrade to next layer, never block
  }
}
