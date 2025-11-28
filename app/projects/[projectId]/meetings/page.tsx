// app/projects/[projectId]/meetings/page.tsx

import { MeetingsManager } from '@/components/MeetingsManager';

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <MeetingsManager projectId={projectId} />;
}
