import { z } from "zod";
import { getCurrentOrg } from "@/lib/auth";
import { createConversation } from "@/lib/data/repo";

const schema = z.object({
  title: z.string().max(200).optional(),
  prospect: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const org = await getCurrentOrg();
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const input = parsed.success ? parsed.data : {};

  const conversation = await createConversation({
    organizationId: org.organizationId,
    title: input.title,
    prospect: input.prospect,
  });
  return Response.json({ id: conversation.id });
}
