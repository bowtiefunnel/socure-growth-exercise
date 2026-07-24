import { parseCsv } from "./csv.js";
import { registrableDomain } from "./domain.js";
import type { Lead } from "./types.js";

/** Gate 0 — build the owned-account set from the customer list (rows with a domain). */
export function buildSuppressionSet(customersCsvText: string): Set<string> {
  return new Set(
    parseCsv(customersCsvText)
      .map((r) => r.domain)
      .filter(Boolean)
      .map(registrableDomain),
  );
}

/** Matched = existing customer → expansion book, never acquisition spend. */
export function isSuppressed(lead: Lead, set: Set<string>): boolean {
  return set.has(registrableDomain(lead.domain)) || set.has(registrableDomain(lead.email));
}
