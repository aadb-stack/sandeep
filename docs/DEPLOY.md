# Deployment & Going Live

The scaffold runs fully in mock mode with no secrets. To go to production, wire
each provider (independently — flip them on one at a time) and deploy to Vercel.

## 1. Provision providers & collect keys

| Provider | What to create | Env vars |
| --- | --- | --- |
| **Postgres + pgvector** | A Postgres DB (Neon, Supabase, RDS) with the `vector` extension enabled | `DATABASE_URL` |
| **Clerk** | Application with **Organizations** enabled | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| **Anthropic** | API key | `ANTHROPIC_API_KEY` (optional `ANTHROPIC_MODEL`, default `claude-opus-4-8`) |
| **Voyage AI** | API key | `VOYAGE_API_KEY` (optional `VOYAGE_MODEL`, default `voyage-3`) |
| **Upstash Redis** | Redis database (REST) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Stripe** | Products + recurring Prices for Starter / Team | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`, `NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID` |

Copy `.env.example` → `.env.local` for local testing.

## 2. Initialize the database

Enable pgvector once on the database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then push the Drizzle schema:

```bash
DATABASE_URL=postgres://… npm run db:push
# or generate SQL migrations to review/commit:
DATABASE_URL=postgres://… npm run db:generate
```

This creates all tables plus the HNSW cosine index on `document_chunks.embedding`.

## 3. Deploy to Vercel

1. Import the GitHub repo into Vercel (framework auto-detected as Next.js via
   `vercel.json`).
2. Add every env var from step 1 in **Project → Settings → Environment
   Variables** (Production + Preview).
3. Deploy. Vercel builds a **Preview** deployment per pull request and a
   **Production** deployment on the default branch.

> The build itself needs no secrets (it succeeds in mock mode), so a preview will
> deploy even before keys are added — it just runs with mock adapters until you
> set the env vars.

## 4. Configure webhooks (after first deploy, once the URL exists)

- **Clerk** → add a webhook to `https://<app>/api/webhooks/clerk` for
  `organization.*` and `user.*` events; set `CLERK_WEBHOOK_SECRET`.
  (Signature verification with `svix` is the documented hardening step in the
  handler.)
- **Stripe** → add an endpoint at `https://<app>/api/webhooks/stripe` for
  `checkout.session.completed` and `customer.subscription.*`; set
  `STRIPE_WEBHOOK_SECRET`.

## 5. Repository protection & branches

These require GitHub repo-admin permissions and are done in the GitHub UI/API
(not available from the build environment):

1. Create a long-lived `dev` branch from the default branch.
2. **Settings → Branches → Branch protection rules** for `main`:
   - Require a pull request before merging.
   - Require the **CI** workflow (`lint · typecheck · test · build`) to pass.
   - (Optional) require review approvals; restrict who can push.
3. Point Vercel **Production** at `main` and use `dev` / PRs for previews.

## 6. Verify

- App loads, sign-in works (Clerk), an org is created.
- Ingest a doc on `/dashboard/knowledge` → status `ready`, chunks stored in
  Postgres.
- Ask a question on `/chat` → grounded, streamed Claude answer with citations and
  a generated demo in the sandbox.
- Stripe checkout opens a real session; webhook updates plan state.

## Notes / current scope

- This build's branch is `claude/ai-sales-engineer-saas-nhqp5f` (the designated
  development branch). Retarget to `dev`/`main` per your branch strategy.
- Ingestion parsers cover txt/markdown/JSON/OpenAPI; URL crawling and PDF are
  post-scaffold (see PRD milestone M2).
