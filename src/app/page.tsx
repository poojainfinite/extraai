import { ChatInterface } from "@/components/chat-interface";

export const dynamic = "force-dynamic";

export default function HomePage() {
  // No database — sidebar loads from browser localStorage
  return <ChatInterface conversations={[]} />;
}
