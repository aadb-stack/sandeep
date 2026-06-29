# Product Requirements Document — AI Sales Engineer

## 1. Problem

Technical B2B products (APIs, dev tools, infrastructure) lose deals in the
evaluation phase. Prospects — engineers — have deep technical questions and want
to *see it work* before they commit. Human sales engineers (SEs) are expensive,
slow to schedule, and don't scale: a prospect's question at 11pm goes unanswered
until the next demo call, and momentum dies.

## 2. Solution

An **AI Sales Engineer**: a hosted product that ingests a company's product docs
and API specs, then answers prospects' technical questions accurately (grounded
in those docs via RAG) and generates **runnable demo code** the prospect can try
in the browser — 24/7, instantly, in the prospect's own words.

## 3. Target customer (ICP)

- **Company type:** developer-first / API-first / infrastructure SaaS (payments,
  data, observability, auth, AI tooling).
- **Size:** Series A–C, 20–500 employees, PLG or hybrid GTM motion.
- **Buyer:** VP Sales / Head of Sales Engineering / Head of DevRel.
- **User of the output:** the prospect's engineers during evaluation.

## 4. Jobs to be done

1. *When a prospect has a technical question during evaluation,* answer it
   immediately and accurately so the deal keeps momentum.
2. *When a prospect wants proof,* show working, tailored demo code without
   waiting for a human SE.
3. *When sales wants to understand intent,* capture every conversation so reps
   see blockers and expansion signals.

## 5. Personas

- **Priya (Prospect engineer):** evaluating the API; wants fast, correct answers
  and copy-pasteable examples.
- **Sam (Sales/SE leader, buyer):** wants pipeline velocity and SE leverage.
- **Devin (Customer's DevRel/eng):** owns the docs; wants ingestion to be trivial
  and answers to never hallucinate.

## 6. Core features (v1)

1. **Knowledge ingestion** — upload/paste docs, page text, or OpenAPI specs;
   chunked, embedded (Voyage `voyage-3`), and stored in pgvector.
2. **Grounded chat** — RAG retrieval + Claude (`claude-opus-4-8`) answers, with
   source citations; refuses to invent capabilities not in the docs.
3. **Demo code generation** — Claude emits tailored, runnable snippets rendered
   live in an in-browser sandbox (Sandpack) the prospect can edit.

Supporting: multi-tenant orgs (Clerk), usage-based plans (Stripe), rate limiting
(Upstash), conversation capture for sales visibility.

## 7. Success metrics

- **Activation:** % of new workspaces that ingest ≥1 source and run ≥1 chat.
- **Engagement:** prospect conversations / workspace / week.
- **Outcome:** self-reported "this helped me evaluate" + design-partner win-rate
  lift.
- **Business:** logo count × ARPA → ARR (see §8).

## 8. Pricing & the path to $5M ARR

| Plan       | Price       | Target segment                         |
| ---------- | ----------- | -------------------------------------- |
| Starter    | $99/mo      | small teams, 1 product, self-serve     |
| Team       | $499/mo     | growth-stage, multiple products        |
| Enterprise | Custom      | SSO, on-prem/VPC, SLAs                  |

Illustrative path to ~$5M ARR (blended ARPA ≈ $1,000/mo):
- ~250 Team accounts ($499) ≈ $1.5M ARR
- ~70 Enterprise accounts (~$3.5k/mo avg) ≈ $2.9M ARR
- Starter long tail ≈ $0.6M ARR

→ Land with self-serve Starter/Team (PLG), expand into Enterprise via design
partners. Net-revenue retention from seat + product expansion is the lever.

## 9. Non-goals (v1)

- Full website crawling / PDF OCR (basic txt/md/JSON/OpenAPI only at first).
- Voice or video demos.
- Replacing human SEs for complex, bespoke POCs.

## 10. Architecture

Next.js 15 (App Router) · Drizzle/Postgres + pgvector · Upstash Redis · Clerk ·
Stripe · Vercel AI SDK + Claude · Voyage embeddings · Sandpack · Tailwind.

Every external integration is feature-flagged on its credentials and ships with a
mock adapter, so the product runs end-to-end with zero secrets for local dev,
CI, and preview.

## 11. Milestones

1. **M0 — Scaffold (this build):** PRD, schema, auth/orgs, RAG pipeline, chat +
   sandbox, CI, keyless mock mode.
2. **M1 — Real providers:** wire live Clerk/Stripe/Postgres/Voyage/Anthropic;
   deploy to Vercel.
3. **M2 — Ingestion depth:** URL crawling, PDF, incremental re-index.
4. **M3 — Sales surface:** conversation analytics, CRM export, lead routing.
5. **M4 — Enterprise:** SSO/SAML, VPC deploy, audit logs.
