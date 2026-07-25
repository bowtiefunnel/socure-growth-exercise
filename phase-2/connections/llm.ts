import Anthropic from "@anthropic-ai/sdk";
import { Langfuse } from "langfuse";

// Cheap model on purpose — cards/narration are the residue, not the reasoning (cost-routing).
export const CHEAP_MODEL = "claude-haiku-4-5";
// Deep research needs a model that supports the _20260209 tool variants (dynamic filtering).
export const RESEARCH_MODEL = "claude-sonnet-4-6";

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

export interface ResearchOpts {
  /** RESEARCH_MODEL = deep mode (web_search + web_fetch); default CHEAP_MODEL = basic search only. */
  model?: string;
  maxSearches?: number;
  maxFetches?: number;
  maxTokens?: number;
}

/**
 * Traced completion WITH live deep research (Anthropic server-side tools).
 * Deep mode (Sonnet 4.6): web_search_20260209 + web_fetch_20260209 with dynamic filtering.
 * Basic mode (Haiku): web_search_20250305 only — keeps the cheap enrichment-residue call.
 * Loops pause_turn up to 5× (the server search loop pauses ~every 10 iterations).
 */
export async function tracedResearch(
  name: string,
  system: string,
  user: string,
  opts: ResearchOpts = {},
): Promise<string> {
  const client = new Anthropic();
  const model = opts.model ?? CHEAP_MODEL;
  const maxTokens = opts.maxTokens ?? 1024;
  const deep = model !== CHEAP_MODEL;

  // Repo idiom: inline `as const` tool literals (matches Part 1's tracedResearch).
  const tools = deep
    ? [
        { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: opts.maxSearches ?? 8 },
        { type: "web_fetch_20260209" as const, name: "web_fetch" as const, max_uses: opts.maxFetches ?? 4, max_content_tokens: 20000 },
      ]
    : [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: opts.maxSearches ?? 2 }];

  const trace = langfuse?.trace({ name });
  const gen = trace?.generation({ name, model, input: { system, user } });
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];

  let res = await client.messages.create({ model, max_tokens: maxTokens, system, messages, tools });
  // ponytail: cap 5 resumes — bounds a runaway server loop without a config knob.
  for (let i = 0; res.stop_reason === "pause_turn" && i < 5; i++) {
    messages.push({ role: "assistant", content: res.content });
    res = await client.messages.create({ model, max_tokens: maxTokens, system, messages, tools });
  }

  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  gen?.end({ output: text, usage: { input: res.usage.input_tokens, output: res.usage.output_tokens } });
  await langfuse?.flushAsync();
  return text;
}
