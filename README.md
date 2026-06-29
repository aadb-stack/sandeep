# AI Sales Engineer

Ingests your product docs & APIs, answers prospects' technical questions
(grounded via RAG), and generates runnable demo code rendered live in the
browser. B2B SaaS scaffold built with Next.js 15.

> **Runs with zero secrets.** Every integration is feature-flagged on its
> credentials and falls back to an in-memory / deterministic mock, so the whole
> app boots and works end-to-end for local dev and CI without any API keys.

## Stack

| Concern        | Real provider                     | Mock fallback (no key)            |
| -------------- | --------------------------------- | --------------------------------- |
| Framework      | Next.js 15 (App Router), Tailwind | —                                 |
| Auth & orgs    | Clerk                             | deterministic mock org/user       |
| Database       | Postgres + pgvector (Drizzle)     | in-memory store                   |
| Embeddings     | Voyage AI (`voyage-3`)            | deterministic hash embeddings     |
| LLM            | Anthropic Claude (`claude-opus-4-8`) via Vercel AI SDK | canned streamed answer |
| Code sandbox   | Sandpack (in-browser)             | (client-only, no key needed)      |
| Rate limit     | Upstash Redis                     | in-memory fixed window            |
| Billing        | Stripe                            | mock checkout/webhook             |

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000  — works with no .env at all
```

Then:
- `/` — marketing landing
- `/dashboard` — workspace overview
- `/dashboard/knowledge` — ingest docs / OpenAPI (use the "Use sample" button)
- `/chat` — start a prospect conversation; ask a question, watch the answer
  stream and a demo render in the Sandpack panel.

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build (passes with no env — mock mode)
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run test        # vitest (chunking, embeddings, retrieval, plans, env)
npm run db:generate # drizzle-kit: generate SQL migrations
npm run db:push     # drizzle-kit: push schema to Postgres
```

## Project layout

```
src/
  app/                 # App Router pages + API routes
    api/chat           # streaming RAG chat (Vercel AI SDK + Claude/mock)
    api/ingest         # ingestion endpoint
    api/billing        # Stripe checkout
    api/webhooks       # clerk + stripe receivers
  components/          # Chat UI, Sandpack sandbox, ingest/checkout forms
  db/                  # Drizzle schema + client
  lib/
    ai/                # model selection + prompts
    rag/               # chunk, embed, parse, ingest, retrieve, math
    data/              # repository (real DB or in-memory mock)
    billing/           # plans + Stripe
    auth.ts redis.ts env.ts
docs/                  # PRD.md, DEPLOY.md
```

## Going live

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for wiring real providers, deploying to
Vercel, and repository protection. Copy `.env.example` to `.env.local` and fill
in only the integrations you want to activate — the rest stay in mock mode.
