import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Real Drizzle client, instantiated lazily and only when DATABASE_URL is set.
 * When there is no database, this stays null and callers fall back to the
 * in-memory store in `@/lib/rag/store` / `@/lib/data/mock-store`.
 */
type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | null = null;
let dbInstance: DrizzleClient | null = null;

export function getDb(): DrizzleClient | null {
  if (!env.hasDatabase) return null;
  if (!dbInstance) {
    client = postgres(env.DATABASE_URL as string, { prepare: false });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

export { schema };
