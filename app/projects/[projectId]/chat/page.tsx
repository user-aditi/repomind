// app/projects/[projectId]/chat/page.tsx

import { ChatInterface } from '@/components/ChatInterface';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <ChatInterface projectId={projectId} />;
}
