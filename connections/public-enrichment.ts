import { resolve4, resolveMx } from "node:dns/promises";

/**
 * Free/public enrichment — no keys, no cost. What you'd reach for on the job first:
 *  - DNS A/MX: does the domain resolve; who runs their email (technographic)
 *  - RDAP (rdap.org): registration date → domain age (firmographic maturity signal)
 * Mock domains mostly won't resolve — that's honest data, carried as source/confidence.
 */
export interface PublicSignals {
  resolves: boolean;
  mx_provider?: string;
  registered?: string;
  tech_signals: string[];
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p.catch(() => null),
    new Promise<null>((r) => setTimeout(() => r(null), ms)),
  ]);
}

function mxProvider(hosts: string[]): string {
  const h = hosts.join(" ").toLowerCase();
  if (h.includes("google")) return "google-workspace";
  if (h.includes("outlook") || h.includes("microsoft")) return "microsoft-365";
  if (h.includes("proofpoint")) return "proofpoint";
  if (h.includes("mimecast")) return "mimecast";
  return hosts[0] ?? "unknown";
}

export async function probePublic(domain: string): Promise<PublicSignals> {
  const [a, mx, rdap] = await Promise.all([
    withTimeout(resolve4(domain), 2500),
    withTimeout(resolveMx(domain), 2500),
    withTimeout(
      fetch(`https://rdap.org/domain/${domain}`, { redirect: "follow" }).then((r) =>
        r.ok ? (r.json() as Promise<{ events?: { eventAction: string; eventDate: string }[] }>) : null,
      ),
      4000,
    ),
  ]);

  const signals: string[] = [];
  const out: PublicSignals = { resolves: Boolean(a?.length), tech_signals: signals };

  if (a?.length) signals.push("dns:resolves");
  if (mx?.length) {
    out.mx_provider = mxProvider(mx.map((m) => m.exchange));
    signals.push(`email:${out.mx_provider}`);
  }
  const reg = rdap?.events?.find((e) => e.eventAction === "registration")?.eventDate;
  if (reg) {
    out.registered = reg.slice(0, 10);
    signals.push(`domain-age:${out.registered}`);
  }
  return out;
}
