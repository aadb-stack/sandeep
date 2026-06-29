"use client";

/**
 * Extracts bracketed citation markers (e.g. "[1]", "[2]") from the latest
 * assistant answer and lists them, reinforcing that answers are grounded in the
 * ingested documentation.
 */
export function SourceCitations({ text }: { text: string }) {
  const refs = Array.from(new Set(text.match(/\[\d+\]/g) ?? [])).sort();
  if (refs.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span>Grounded in sources:</span>
      {refs.map((r) => (
        <span
          key={r}
          className="rounded border border-slate-700 px-1.5 py-0.5 text-slate-400"
        >
          {r}
        </span>
      ))}
    </div>
  );
}
