import type { Account } from "../lib/types.js";

// PostgREST via fetch — no SDK dependency. Service key is server-side only (Trigger.dev tasks).
const sb = (path: string, init: RequestInit = {}) =>
  fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

/** Publish routed accounts so the Slack path can look them up (batch pipeline → Slack path). */
export async function upsertAccounts(accounts: Account[]): Promise<void> {
  const rows = accounts.map((a) => ({
    domain: a.domain,
    tier: a.tier,
    score: a.account_score,
    rep: a.routing?.rep,
    data: a,
  }));
  const r = await sb("accounts?on_conflict=domain", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`supabase upsert accounts: ${r.status} ${await r.text()}`);
}

export async function getAccount(domain: string): Promise<Account | null> {
  const r = await sb(`accounts?domain=eq.${encodeURIComponent(domain)}&select=data`);
  if (!r.ok) throw new Error(`supabase getAccount: ${r.status} ${await r.text()}`);
  const rows = (await r.json()) as { data: Account }[];
  return rows[0]?.data ?? null;
}

/** Ledger row — the "data table". Card md/html stored here (cloud filesystems are ephemeral). */
export async function insertCard(row: Record<string, unknown>): Promise<void> {
  const r = await sb("battle_cards", { method: "POST", body: JSON.stringify(row) });
  if (!r.ok) throw new Error(`supabase insertCard: ${r.status} ${await r.text()}`);
}
