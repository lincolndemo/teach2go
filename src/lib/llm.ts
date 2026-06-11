import Anthropic from "@anthropic-ai/sdk";
import type { Msg } from "@/lib/types";
import type { SystemBlocks } from "@/lib/prompt";

// Sonnet class per Technical PRD §3; thinking disabled + low effort for the
// latency budget (first streamed token ~1.2s). Stable system block is cached.
const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.");
  }
  return (client ??= new Anthropic());
}

export async function* claudeStream({ system, messages }: { system: SystemBlocks; messages: Msg[] }): AsyncIterable<string> {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: [
      { type: "text", text: system.stable, cache_control: { type: "ephemeral" } },
      { type: "text", text: system.volatile },
    ],
    messages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}
