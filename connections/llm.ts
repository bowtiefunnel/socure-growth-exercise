import Anthropic from "@anthropic-ai/sdk";
import { Langfuse } from "langfuse";

// Cheap model on purpose — cards/narration are the residue, not the reasoning (cost-routing).
export const CHEAP_MODEL = "claude-haiku-4-5";

const langfuse =
  process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY ? new Langfuse() : null;

export function llmAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** One traced completion. Langfuse records prompt/tokens/cost when keys exist; no-op otherwise. */
export async function tracedCompletion(name: string, system: string, user: string): Promise<string> {
  const client = new Anthropic();
  const trace = langfuse?.trace({ name });
  const gen = trace?.generation({ name, model: CHEAP_MODEL, input: { system, user } });
  const res = await client.messages.create({
    model: CHEAP_MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  gen?.end({ output: text, usage: { input: res.usage.input_tokens, output: res.usage.output_tokens } });
  await langfuse?.flushAsync();
  return text;
}

/**
 * Traced completion WITH live web research (Anthropic server-side web_search tool).
 * Haiku supports the basic web_search_20250305 variant; max_uses bounds cost
 * (~$10/1k searches). Handles one pause_turn resume (server search loop limit).
 */
export async function tracedResearch(name: string, system: string, user: string): Promise<string> {
  const client = new Anthropic();
  const trace = langfuse?.trace({ name });
  const gen = trace?.generation({ name, model: CHEAP_MODEL, input: { system, user } });
  const tools = [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 2 }];
  let res = await client.messages.create({
    model: CHEAP_MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
    tools,
  });
  if (res.stop_reason === "pause_turn") {
    res = await client.messages.create({
      model: CHEAP_MODEL,
      max_tokens: 1024,
      system,
      messages: [
        { role: "user", content: user },
        { role: "assistant", content: res.content },
      ],
      tools,
    });
  }
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  gen?.end({ output: text, usage: { input: res.usage.input_tokens, output: res.usage.output_tokens } });
  await langfuse?.flushAsync();
  return text;
}
