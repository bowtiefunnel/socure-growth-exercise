import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface OwnershipLedger {
  [domain: string]: { rep_id: string; assigned_at: string; run_id: string };
}

// ponytail: file ledger covers dev + demo; cloud run containers are ephemeral, so
// production ownership continuity needs a durable store (CRM or Supabase) — deliberately deferred.
const LEDGER = join(process.cwd(), "memory", "account-owners.json");

export function loadOwners(): OwnershipLedger {
  try {
    return JSON.parse(readFileSync(LEDGER, "utf8"));
  } catch {
    return {};
  }
}

export function saveOwners(owners: OwnershipLedger): void {
  mkdirSync(dirname(LEDGER), { recursive: true });
  writeFileSync(LEDGER, JSON.stringify(owners, null, 2));
}
