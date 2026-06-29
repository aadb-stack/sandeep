"use client";

import { useChat } from "@ai-sdk/react";
import { CodeSandbox, type DemoCode } from "./CodeSandbox";
import { SourceCitations } from "./SourceCitations";

// Local default so this client bundle never imports server-only modules.
const DEFAULT_DEMO: DemoCode = {
  language: "javascript",
  template: "vanilla",
  filename: "demo.js",
  explanation:
    "A placeholder demo. Ask a question — generated code appears here.",
  code: `// Quick demo: call the product API and print the result.
async function main() {
  const res = await fetch("https://api.example.com/v1/hello", {
    headers: { Authorization: "Bearer YOUR_API_KEY" },
  });
  console.log("Response:", await res.json());
}
main();
`,
};

export function ChatExperience({ conversationId }: { conversationId: string }) {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
    body: { conversationId },
  });

  // The most recent generated snippet drives the sandbox.
  let demo: DemoCode = DEFAULT_DEMO;
  for (const m of messages) {
    for (const inv of m.toolInvocations ?? []) {
      if (inv.toolName === "generate_demo_code" && inv.args) {
        demo = inv.args as DemoCode;
      }
    }
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
      {/* Chat column */}
      <section className="flex h-screen flex-col border-r border-slate-800">
        <header className="border-b border-slate-800 px-6 py-4">
          <h1 className="text-sm font-semibold">AI Sales Engineer — demo</h1>
          <p className="text-xs text-slate-500">
            Ask a technical question about the product.
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {messages.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              Try: <em>&quot;How do I create a charge with your API?&quot;</em>{" "}
              or <em>&quot;Show me a code example to authenticate.&quot;</em>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id}>
              <div
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-indigo-500/90 px-4 py-2 text-sm text-white"
                    : "mr-auto max-w-[85%] rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100"
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.role === "assistant" && (
                <SourceCitations text={m.content} />
              )}
            </div>
          ))}
          {busy && (
            <p className="text-xs text-slate-500">AI Sales Engineer is typing…</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-800 p-4"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a technical question…"
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || input.trim().length === 0}
              className="rounded-md bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </section>

      {/* Sandbox column */}
      <section className="hidden h-screen flex-col p-6 lg:flex">
        <CodeSandbox demo={demo} />
        {lastAssistant && (
          <p className="mt-3 text-xs text-slate-600">
            Code updates as the AI generates tailored demos.
          </p>
        )}
      </section>
    </div>
  );
}
