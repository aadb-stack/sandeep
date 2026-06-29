import type { RetrievedChunk } from "@/lib/rag/retrieve";
import { formatContext } from "@/lib/rag/retrieve";

/**
 * System prompt for the AI Sales Engineer. It is grounded in the org's ingested
 * documentation (the retrieved context) and is instructed to call the
 * `generate_demo_code` tool whenever a runnable example would help the prospect.
 */
export function buildSystemPrompt(
  organizationName: string,
  chunks: RetrievedChunk[],
): string {
  return `You are an AI Sales Engineer representing ${organizationName}.
Your job is to answer a prospect's technical questions about the product and,
when useful, generate small runnable demo code that shows the product in action.

Rules:
- Answer using ONLY the product documentation provided below. If the docs do not
  cover something, say so plainly rather than inventing details.
- Be concise, technically precise, and helpful — you are talking to an engineer
  evaluating the product.
- When a code example would help, call the \`generate_demo_code\` tool with a
  small, self-contained, runnable snippet. Prefer the simplest template that
  demonstrates the point.
- Cite the source documents by their bracketed numbers when relevant.

Product documentation:
${formatContext(chunks)}`;
}

/** Build the deterministic mock answer used when no Anthropic key is set. */
export function buildMockAnswer(
  organizationName: string,
  question: string,
  chunks: RetrievedChunk[],
): string {
  const top = chunks[0];
  const grounding = top
    ? `Based on ${organizationName}'s documentation (source: "${top.documentTitle}"), here's the short version:\n\n${truncate(
        top.content,
        400,
      )}`
    : `No product documentation has been ingested for ${organizationName} yet, so this is a generic demo response. Add a knowledge source on the dashboard to ground answers in real docs.`;

  return `Thanks for the question — "${truncate(question, 120)}".

${grounding}

I've put together a small runnable demo on the right so you can see it in action. (This is a mock response: set ANTHROPIC_API_KEY to get real, doc-grounded answers and live code generation from Claude.)`;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

/** Default demo snippet rendered in the sandbox when no tool call is present. */
export const DEFAULT_DEMO = {
  language: "javascript",
  template: "vanilla" as const,
  filename: "demo.js",
  code: `// Quick demo: call the product API and print the result.
// In real mode, Claude generates this tailored to your question.

async function main() {
  const res = await fetch("https://api.example.com/v1/hello", {
    headers: { Authorization: "Bearer YOUR_API_KEY" },
  });
  const data = await res.json();
  console.log("Response:", data);
}

main();
`,
};
