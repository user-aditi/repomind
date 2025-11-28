// app/projects/[projectId]/summary/page.tsx

import { ProjectSummary } from '@/components/ProjectSummary';

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <ProjectSummary projectId={projectId} />;
}
