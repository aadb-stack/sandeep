import Link from "next/link";
import { getCurrentOrg } from "@/lib/auth";
import { countOrgStats, listKnowledgeSources } from "@/lib/data/repo";
import { getPlan } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const org = await getCurrentOrg();
  const [stats, sources] = await Promise.all([
    countOrgStats(org.organizationId),
    listKnowledgeSources(org.organizationId),
  ]);
  const plan = getPlan("starter");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="mt-1 text-sm text-slate-400">
        Workspace: {org.organizationName}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Knowledge sources" value={stats.sources} />
        <Stat label="Conversations" value={stats.conversations} />
        <Stat label="Plan" value={plan.name} />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent knowledge sources</h2>
          <Link
            href="/dashboard/knowledge"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Manage →
          </Link>
        </div>
        {sources.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            No sources yet. Add your product docs or an OpenAPI spec to ground
            the AI&apos;s answers.
          </p>
        ) : (
          <ul className="space-y-2">
            {sources.slice(0, 5).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm"
              >
                <span>{s.title}</span>
                <span className="text-xs text-slate-500">
                  {s.kind} · {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
