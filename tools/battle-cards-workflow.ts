import { task } from "@trigger.dev/sdk/v3";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { battleCard } from "./battle-card.js";
import type { Account } from "../lib/types.js";

/**
 * Workflow 4, decoupled — Phase 2 capability, separate from the deterministic
 * part-1-assignment run so cards can be (re)generated on their own schedule
 * without re-running the pipeline. `accounts` is required (not read from disk):
 * Trigger.dev cloud runs get an isolated, ephemeral filesystem per run, so a run
 * of this task can never see what part-1-assignment wrote in its own run — pass
 * the `accounts` array from that run's output/routed_leads.json explicitly.
 */
export const battleCardsWorkflow = task({
  id: "battle-cards-workflow",
  maxDuration: 600,
  run: async (payload: { accounts: Account[] }) => {
    const targets = payload.accounts.filter((a) => a.tier !== "cold");

    const outDir = join(process.cwd(), "output", "battle_cards");
    mkdirSync(outDir, { recursive: true });

    const cards = await battleCard.batchTriggerAndWait(
      targets.map((account) => ({ payload: { account } })),
    );

    let generated = 0;
    let skipped = 0;
    const domains: string[] = [];
    for (const r of cards.runs) {
      if (!r.ok) continue;
      if (r.output.skipped) {
        skipped++;
        continue;
      }
      writeFileSync(join(outDir, `${r.output.domain}.md`), r.output.card!);
      domains.push(r.output.domain);
      generated++;
    }

    return { targeted: targets.length, generated, skipped, domains };
  },
});
