import { task } from "@trigger.dev/sdk/v3";
import { instructions, battleCardSkill, messagingNetNew } from "../lib/assets.js";
import { llmAvailable, tracedCompletion } from "../connections/llm.js";
import type { Account } from "../lib/types.js";

/** Workflow 4 — hot/warm accounts only. Gated: a human reads every card before a rep uses it. */
export const battleCard = task({
  id: "battle-card",
  retry: { maxAttempts: 3 },
  run: async (payload: { account: Account }) => {
    const { account } = payload;
    if (!llmAvailable()) {
      return { domain: account.domain, skipped: true as const, reason: "no ANTHROPIC_API_KEY" };
    }
    const lead = account.leads.find((l) => l.score?.total === account.account_score)!;
    const card = await tracedCompletion(
      `battle-card:${account.domain}`,
      `${instructions()}\n\n---\n\n${battleCardSkill()}\n\n---\n\n${messagingNetNew()}`,
      `Generate the battle card for this account. Follow the skill structure exactly.\n\n` +
        JSON.stringify({ account: { domain: account.domain, score: account.account_score, tier: account.tier, routing: account.routing }, lead }, null, 2),
    );
    return { domain: account.domain, skipped: false as const, card };
  },
});
