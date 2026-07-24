import type { Enrichment, Lead } from "../lib/types.js";
import { mapVendorOutput } from "../lib/vendor-map.js";

/**
 * Bitscale enrichment — real API contract, learned from the Block-1 probe (2026-07-24):
 *   base https://api.bitscale.ai/api/v1 · auth X-API-KEY · 5 req/s per workspace
 *   Grid-based: enrichment runs a UI-built grid via POST /grids/:id/run (sync|async).
 *   Grid must have a "BitScale API" source to be API-runnable; grids can't be created via API.
 * Probe findings: key valid (Growth plan, ~1k credits left) · no firmographic grid exists yet.
 * → Activates when BITSCALE_GRID_ID is set. Until then the cascade uses free public + symbolic.
 * ponytail: per-lead sync calls; when enabling for real volume, throttle to <5 rps.
 */
const BASE = "https://api.bitscale.ai/api/v1";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function tryBitscale(lead: Lead): Promise<Enrichment | null> {
  const key = process.env.BITSCALE_API_KEY;
  const gridId = process.env.BITSCALE_GRID_ID;
  if (!key || !gridId) return null;

  const headers = { "X-API-KEY": key, "Content-Type": "application/json" };
  try {
    const res = await fetch(`${BASE}/grids/${gridId}/run`, {
      method: "POST",
      headers,
      body: JSON.stringify({ mode: "sync", inputs: { company_domain: lead.domain, email: lead.email } }),
    });
    if (!res.ok) return null;
    let data: any = await res.json();

    // async fallback: poll status (2–5s interval per docs; polling counts toward rate limit)
    if (data?.request_id && !data?.outputs) {
      for (let i = 0; i < 10 && !data?.outputs; i++) {
        await sleep(3000);
        const s = await fetch(`${BASE}/run/status/${data.request_id}`, { headers });
        if (!s.ok) return null;
        data = await s.json();
        if (data?.status === "failed") return null;
      }
    }
    const out: Record<string, unknown> | null = data?.outputs ?? data?.result ?? null;
    if (!out) return null;
    return mapVendorOutput(out, "bitscale"); // aliases/confidence: config/enrichment.json
  } catch {
    return null; // graceful degradation — one failed source never blocks the lead
  }
}
