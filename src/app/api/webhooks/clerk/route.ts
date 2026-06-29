import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, users } from "@/db/schema";
import { env } from "@/lib/env";

/**
 * Clerk webhook receiver. Keeps the local `organizations` / `users` tables in
 * sync with Clerk (org + user lifecycle). No-ops cleanly when Clerk or the
 * database is not configured.
 *
 * NOTE: signature verification with `svix` is the production hardening step
 * (requires CLERK_WEBHOOK_SECRET); the handler is structured so adding it is a
 * drop-in around the parsed payload.
 */
export async function POST(req: Request) {
  if (!env.hasClerk) {
    return Response.json({ received: true, mock: true });
  }

  const db = getDb();
  if (!db) {
    return Response.json({ received: true, note: "no database configured" });
  }

  const payload = (await req.json().catch(() => null)) as {
    type?: string;
    data?: any;
  } | null;
  if (!payload?.type) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = payload.data ?? {};
  switch (payload.type) {
    case "organization.created":
    case "organization.updated": {
      const clerkOrgId = data.id as string;
      const name = (data.name as string) ?? "Workspace";
      const slug =
        (data.slug as string) ??
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const existing = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, clerkOrgId))
        .limit(1);
      if (existing[0]) {
        await db
          .update(organizations)
          .set({ name, slug, updatedAt: new Date() })
          .where(eq(organizations.id, existing[0].id));
      } else {
        await db
          .insert(organizations)
          .values({ clerkOrgId, name, slug })
          .onConflictDoNothing();
      }
      break;
    }
    case "user.created":
    case "user.updated": {
      const clerkUserId = data.id as string;
      const email =
        data.email_addresses?.[0]?.email_address ?? "unknown@example.com";
      const name = [data.first_name, data.last_name]
        .filter(Boolean)
        .join(" ");
      await db
        .insert(users)
        .values({ clerkUserId, email, name: name || null })
        .onConflictDoNothing();
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
