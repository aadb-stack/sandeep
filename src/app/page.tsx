import Link from "next/link";
import { PLAN_LIST } from "@/lib/billing/plans";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <nav className="mb-20 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">
          AI Sales Engineer
        </span>
        <div className="flex items-center gap-6 text-sm text-slate-300">
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <Link
            href="/chat"
            className="rounded-md bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400"
          >
            Try the demo
          </Link>
        </div>
      </nav>

      <section className="mb-24">
        <p className="mb-4 inline-block rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
          For developer-first & API companies
        </p>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight">
          Your best sales engineer, available 24/7 for every prospect.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Ingest your product docs and API specs once. The AI Sales Engineer
          answers prospects&apos; deep technical questions, grounded in your
          documentation, and generates runnable demo code they can try in the
          browser — turning evaluations into closed deals.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/chat"
            className="rounded-md bg-indigo-500 px-6 py-3 font-medium text-white hover:bg-indigo-400"
          >
            Launch the live demo
          </Link>
          <Link
            href="/dashboard/knowledge"
            className="rounded-md border border-slate-700 px-6 py-3 font-medium text-slate-200 hover:border-slate-500"
          >
            Add your docs
          </Link>
        </div>
      </section>

      <section className="mb-24 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Grounded answers",
            body: "RAG over your docs & OpenAPI specs means accurate, citeable answers — never hallucinated capabilities.",
          },
          {
            title: "Live demo code",
            body: "Generates tailored, runnable snippets and renders them in an in-browser sandbox the prospect can edit.",
          },
          {
            title: "Built for revenue",
            body: "Every conversation is captured so your team sees intent, blockers, and the path to expansion.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>

      <section id="pricing" className="mb-16">
        <h2 className="mb-8 text-2xl font-semibold">Pricing</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {PLAN_LIST.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-6"
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold">
                {plan.priceMonthly === null
                  ? "Custom"
                  : `$${plan.priceMonthly}`}
                {plan.priceMonthly !== null && (
                  <span className="text-base font-normal text-slate-400">
                    /mo
                  </span>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-400">
                {plan.features.map((feat) => (
                  <li key={feat}>• {feat}</li>
                ))}
              </ul>
              <Link
                href="/dashboard/billing"
                className="mt-6 rounded-md border border-slate-700 px-4 py-2 text-center text-sm font-medium hover:border-slate-500"
              >
                {plan.priceMonthly === null ? "Contact sales" : "Start"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 pt-8 text-sm text-slate-500">
        AI Sales Engineer — scaffold build. Set provider keys to enable live
        auth, RAG embeddings, Claude answers, and billing.
      </footer>
    </main>
  );
}
