import { z } from "zod";
import { getCurrentOrg } from "@/lib/auth";
import { rateLimit } from "@/lib/redis";
import { ingestSource } from "@/lib/rag/ingest";

const ingestSchema = z.object({
  kind: z.enum(["doc", "url", "openapi"]),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  location: z.string().optional(),
});

export async function POST(req: Request) {
  const org = await getCurrentOrg();

  const limit = await rateLimit(`ingest:${org.organizationId}`);
  if (!limit.success) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const parsed = ingestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await ingestSource({
      organizationId: org.organizationId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      content: parsed.data.content,
      location: parsed.data.location,
    });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}
