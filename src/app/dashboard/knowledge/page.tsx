import { getCurrentOrg } from "@/lib/auth";
import { listKnowledgeSources } from "@/lib/data/repo";
import { IngestForm } from "@/components/IngestForm";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const org = await getCurrentOrg();
  const sources = await listKnowledgeSources(org.organizationId);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Knowledge</h1>
      <p className="mt-1 mb-8 text-sm text-slate-400">
        Ingest product docs and API specs. They&apos;re chunked, embedded, and
        used to ground every answer the AI Sales Engineer gives.
      </p>

      <IngestForm />

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Sources</h2>
        {sources.length === 0 ? (
          <p className="text-sm text-slate-400">No sources yet.</p>
        ) : (
          <ul className="space-y-2">
            {sources.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm"
              >
                <span>{s.title}</span>
                <span className="text-xs text-slate-500">
                  {s.kind} ·{" "}
                  <span
                    className={
                      s.status === "ready"
                        ? "text-emerald-400"
                        : s.status === "failed"
                          ? "text-red-400"
                          : "text-amber-400"
                    }
                  >
                    {s.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
