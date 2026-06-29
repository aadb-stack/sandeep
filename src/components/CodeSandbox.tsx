"use client";

import dynamic from "next/dynamic";

// Sandpack is heavy and browser-only; load it client-side without SSR.
const Sandpack = dynamic(
  () => import("@codesandbox/sandpack-react").then((m) => m.Sandpack),
  { ssr: false, loading: () => <SandboxSkeleton /> },
);

export interface DemoCode {
  language: string;
  template: "vanilla" | "react" | "node";
  filename: string;
  code: string;
  explanation?: string;
}

export function CodeSandbox({ demo }: { demo: DemoCode }) {
  const sandpackTemplate =
    demo.template === "react"
      ? "react"
      : demo.template === "node"
        ? "node"
        : "vanilla";
  const entry = demo.template === "react" ? "/App.js" : "/index.js";

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Live demo</h2>
        {demo.explanation && (
          <p className="mt-1 text-xs text-slate-400">{demo.explanation}</p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-800">
        <Sandpack
          template={sandpackTemplate}
          theme="dark"
          files={{ [entry]: demo.code }}
          options={{ editorHeight: "100%", showTabs: true }}
        />
      </div>
    </div>
  );
}

function SandboxSkeleton() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-slate-800 text-sm text-slate-500">
      Loading sandbox…
    </div>
  );
}
