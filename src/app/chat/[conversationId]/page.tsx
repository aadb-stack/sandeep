import { ChatExperience } from "@/components/ChatExperience";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatExperience conversationId={conversationId} />;
}
