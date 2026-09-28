import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set — add it to your environment to enable AI roles.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Confirm this model id is still current for your account before relying on it in production.
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export type RunAgentInput = {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
};

export async function runAgent({ systemPrompt, userPrompt, maxTokens = 1500 }: RunAgentInput): Promise<string> {
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Agent response contained no text content.");
  }
  return textBlock.text;
}

export function parseJsonResponse<T>(raw: string): T {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Agent response did not contain a JSON object.");
  }
  const jsonSlice = trimmed.slice(start, end + 1);
  return JSON.parse(jsonSlice) as T;
}

export { DEFAULT_MODEL };
