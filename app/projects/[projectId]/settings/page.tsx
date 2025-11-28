// app/projects/[projectId]/settings/page.tsx

import { ProjectSettings } from '@/components/ProjectSettings';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <ProjectSettings projectId={projectId} />;
}
