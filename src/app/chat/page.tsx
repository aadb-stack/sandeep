import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { createConversation } from "@/lib/data/repo";

export const dynamic = "force-dynamic";

export default async function ChatStartPage() {
  const org = await getCurrentOrg();
  const { id } = await createConversation({
    organizationId: org.organizationId,
    title: "Demo conversation",
  });
  redirect(`/chat/${id}`);
}
