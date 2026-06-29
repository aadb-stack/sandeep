"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SAMPLE = `# Acme API Quickstart

Acme is a payments API. Authenticate with a Bearer token.

## Create a charge
POST /v1/charges
Body: { "amount": 1000, "currency": "usd", "source": "tok_visa" }
Returns a charge object with an id and status.

## Retrieve a charge
GET /v1/charges/{id}
Returns the charge object.`;

export function IngestForm() {
  const router = useRouter();
  const [kind, setKind] = useState<"doc" | "url" | "openapi">("doc");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ingestion failed");
      setStatus(`Ingested "${title}" into ${json.chunkCount} chunks.`);
      setTitle("");
      setContent("");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
    >
      <h2 className="mb-4 text-lg font-semibold">Add a knowledge source</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="doc">Doc / Markdown</option>
            <option value="url">Page text</option>
            <option value="openapi">OpenAPI (JSON)</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="API Quickstart"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>
      </div>
      <label className="mt-4 block text-sm">
        <span className="mb-1 flex items-center justify-between text-slate-400">
          <span>Content</span>
          <button
            type="button"
            onClick={() => {
              setTitle("Acme API Quickstart");
              setContent(SAMPLE);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Use sample
          </button>
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          placeholder="Paste your docs, page text, or OpenAPI JSON…"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs"
        />
      </label>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {busy ? "Ingesting…" : "Ingest"}
        </button>
        {status && <span className="text-sm text-slate-400">{status}</span>}
      </div>
    </form>
  );
}
