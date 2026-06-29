import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations } from "@/db/schema";
import { env } from "./env";

/**
 * Resolved tenant identity for the current request. `organizationId` is the
 * opaque key every data function is scoped by.
 */
export interface OrgContext {
  organizationId: string;
  organizationName: string;
  userId: string;
  isMock: boolean;
}

// Stable identity used in keyless / mock mode so data persists across requests
// within a process. A real UUID so it is also valid against a real Postgres row.
const MOCK_ORG_ID = "00000000-0000-4000-8000-000000000001";
const MOCK_USER_ID = "00000000-0000-4000-8000-000000000002";

/**
 * Resolve the current organization. With Clerk configured we read the active
 * org/user from the session and (when a database is present) upsert a matching
 * `organizations` row so the Clerk org maps to a real UUID. Without Clerk we
 * return a deterministic mock org so the app is fully usable with no secrets.
 */
export async function getCurrentOrg(): Promise<OrgContext> {
  if (!env.hasClerk) {
    return {
      organizationId: MOCK_ORG_ID,
      organizationName: "Acme Dev Tools (demo)",
      userId: MOCK_USER_ID,
      isMock: true,
    };
  }

  // Imported lazily so the Clerk SDK is only loaded when configured.
  const { auth } = await import("@clerk/nextjs/server");
  const { userId, orgId, orgSlug } = await auth();

  const effectiveUser = userId ?? MOCK_USER_ID;
  const clerkOrgKey = orgId ?? `personal_${effectiveUser}`;
  const name = orgSlug ?? "Workspace";

  const organizationId = await resolveOrgId(clerkOrgKey, name);
  return {
    organizationId,
    organizationName: name,
    userId: effectiveUser,
    isMock: false,
  };
}

async function resolveOrgId(clerkOrgKey: string, name: string): Promise<string> {
  const db = getDb();
  if (!db) {
    // No DB: use the Clerk org key directly as the opaque scope id.
    return clerkOrgKey;
  }
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, clerkOrgKey))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const [created] = await db
    .insert(organizations)
    .values({
      clerkOrgId: clerkOrgKey,
      name,
      slug: `${clerkOrgKey}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    })
    .returning({ id: organizations.id });
  return created.id;
}
