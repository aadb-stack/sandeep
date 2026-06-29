import { convertToCoreMessages, streamText, tool, type Message } from "ai";
import { z } from "zod";
import { getCurrentOrg } from "@/lib/auth";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/redis";
import { getClaudeModel, mockTextModel } from "@/lib/ai/model";
import { buildMockAnswer, buildSystemPrompt } from "@/lib/ai/prompt";
import { retrieveContext } from "@/lib/rag/retrieve";
import { appendMessage } from "@/lib/data/repo";

export const maxDuration = 30;

const demoCodeTool = tool({
  description:
    "Generate a small, self-contained, runnable demo code snippet that " +
    "demonstrates the product for the prospect. Render-ready for a sandbox.",
  parameters: z.object({
    language: z.string().describe("Programming language, e.g. javascript, typescript, python"),
    template: z
      .enum(["vanilla", "react", "node"])
      .describe("Sandpack template the snippet should run in"),
    filename: z.string().describe("Filename for the snippet, e.g. demo.js"),
    code: z.string().describe("The complete runnable source code"),
    explanation: z.string().describe("One or two sentences explaining the demo"),
  }),
  execute: async (args) => ({ accepted: true, filename: args.filename }),
});

export async function POST(req: Request) {
  const org = await getCurrentOrg();

  const limit = await rateLimit(`chat:${org.organizationId}`);
  if (!limit.success) {
    return new Response("Rate limit exceeded. Please slow down.", {
      status: 429,
    });
  }

  const body = (await req.json()) as {
    messages: Message[];
    conversationId?: string;
  };
  const messages = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const question = lastUser?.content ?? "";

  const chunks = await retrieveContext(org.organizationId, question, 5);

  // Best-effort persistence of the prospect's question.
  if (body.conversationId && question) {
    void appendMessage({
      conversationId: body.conversationId,
      role: "user",
      content: question,
    }).catch(() => {});
  }

  if (!env.hasAnthropic) {
    const answer = buildMockAnswer(org.organizationName, question, chunks);
    const result = streamText({
      model: mockTextModel(answer),
      messages: convertToCoreMessages(messages),
    });
    return result.toDataStreamResponse();
  }

  const model = await getClaudeModel();
  const result = streamText({
    model,
    system: buildSystemPrompt(org.organizationName, chunks),
    messages: convertToCoreMessages(messages),
    tools: { generate_demo_code: demoCodeTool },
    maxSteps: 3,
    onFinish: async ({ text }) => {
      if (body.conversationId && text) {
        await appendMessage({
          conversationId: body.conversationId,
          role: "assistant",
          content: text,
        }).catch(() => {});
      }
    },
  });
  return result.toDataStreamResponse();
}
