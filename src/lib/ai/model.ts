import { simulateReadableStream } from "ai";
import { MockLanguageModelV1 } from "ai/test";
import { env } from "@/lib/env";

/**
 * Chat/codegen model selection.
 *
 * Real mode uses Anthropic Claude (default `claude-opus-4-8`) through the Vercel
 * AI SDK. Mock mode returns a `MockLanguageModelV1` that streams a precomputed
 * answer word-by-word, so the chat UI works end-to-end with no API key.
 */

export async function getClaudeModel() {
  const { anthropic } = await import("@ai-sdk/anthropic");
  return anthropic(env.ANTHROPIC_MODEL);
}

/** A mock model that streams `answer` as text deltas, then finishes. */
export function mockTextModel(answer: string) {
  const tokens = answer.match(/\S+\s*/g) ?? [answer];
  return new MockLanguageModelV1({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunkDelayInMs: 8,
        chunks: [
          ...tokens.map((t) => ({ type: "text-delta" as const, textDelta: t })),
          {
            type: "finish" as const,
            finishReason: "stop" as const,
            usage: { promptTokens: 0, completionTokens: tokens.length },
          },
        ],
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  });
}
