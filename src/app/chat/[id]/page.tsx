import { ChatInterface } from "@/components/chat-interface";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  // Messages load client-side from localStorage inside the component
  return (
    <ChatInterface
      conversations={[]}
      activeConversationId={id}
    />
  );
}
