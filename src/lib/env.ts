/**
 * Central environment reader.
 *
 * Every external integration is feature-flagged on the presence of its
 * credentials. When a flag is false, the corresponding adapter falls back to an
 * in-memory / deterministic mock so the whole app boots and runs end-to-end
 * with zero secrets. This keeps local dev, CI, and the keyless preview build
 * working while the real wiring sits behind the same interface.
 */

function present(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export const env = {
  // Database (Postgres + pgvector)
  DATABASE_URL: process.env.DATABASE_URL,
  get hasDatabase() {
    return present(this.DATABASE_URL);
  },

  // Auth & orgs (Clerk)
  CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  get hasClerk() {
    return present(this.CLERK_PUBLISHABLE_KEY) && present(this.CLERK_SECRET_KEY);
  },

  // LLM (Anthropic Claude)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
  get hasAnthropic() {
    return present(this.ANTHROPIC_API_KEY);
  },

  // Embeddings (Voyage AI)
  VOYAGE_API_KEY: process.env.VOYAGE_API_KEY,
  VOYAGE_MODEL: process.env.VOYAGE_MODEL ?? "voyage-3",
  get hasVoyage() {
    return present(this.VOYAGE_API_KEY);
  },

  // Rate limiting / cache (Upstash Redis)
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  get hasRedis() {
    return (
      present(this.UPSTASH_REDIS_REST_URL) &&
      present(this.UPSTASH_REDIS_REST_TOKEN)
    );
  },

  // Billing (Stripe)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  get hasStripe() {
    return present(this.STRIPE_SECRET_KEY);
  },

  // App
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

/** Embedding vector dimensionality (voyage-3). Mock embeddings match this. */
export const EMBEDDING_DIMENSIONS = 1024;
