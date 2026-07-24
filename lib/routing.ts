import rules from "../config/routing-rules.json" with { type: "json" };
import { registrableDomain } from "./domain.js";
import type { Account, Lead, Routing } from "./types.js";

/** Account-first: group leads by registrable domain; account score = MAX (committee-best). */
export function groupAccounts(leads: Lead[]): Account[] {
  const byDomain = new Map<string, Lead[]>();
  for (const lead of leads) {
    const key = registrableDomain(lead.domain);
    byDomain.set(key, [...(byDomain.get(key) ?? []), lead]);
  }
  return [...byDomain.entries()].map(([domain, group]) => {
    const best = group.reduce((a, b) => ((a.score?.total ?? 0) >= (b.score?.total ?? 0) ? a : b));
    return {
      domain,
      leads: group,
      account_score: best.score?.total ?? 0,
      tier: best.score?.tier ?? "cold",
      committee_depth: group.length,
      existing_customer: false,
    };
  });
}

import type { OwnershipLedger } from "./ownership.js";

/**
 * Route the ACCOUNT; every lead at it inherits. Zero unrouted is a run invariant.
 * Ownership rule: an OWNED account's new leads attach to the account owner — territory
 * rules apply only to unowned accounts. (A stale owner whose rep left config falls
 * through to fresh assignment.)
 */
export function routeAccount(account: Account, owners: OwnershipLedger = {}): Routing {
  const prio = rules.priority_map.find((p) => p.tier === account.tier)!;

  const owned = owners[account.domain];
  if (owned && rules.reps.some((r) => r.id === owned.rep_id)) {
    const rep = rules.reps.find((r) => r.id === owned.rep_id)!;
    return {
      rep_id: rep.id,
      rep: rep.name,
      priority: prio.priority,
      sla: prio.sla,
      owner_status: "existing_owner",
      reason: `account owned by ${rep.id} since ${owned.assigned_at} — new leads attach to owner, never re-routed; tier ${account.tier} → ${prio.priority}`,
    };
  }

  const d = account.domain.toLowerCase();
  const repId = rules.match_order.find((id) =>
    rules.reps.find((r) => r.id === id)!.keywords.some((k) => d.includes(k)),
  );
  const rep = rules.reps.find((r) => r.id === (repId ?? rules.fallback.rep))!;
  return {
    rep_id: rep.id,
    rep: rep.name,
    priority: prio.priority,
    sla: prio.sla,
    owner_status: "new_assignment",
    reason: repId
      ? `vertical match → ${rep.id}; tier ${account.tier} → ${prio.priority}`
      : `${rules.fallback.flag_reason} → ${rules.fallback.rep}; tier ${account.tier} → ${prio.priority}`,
  };
}
