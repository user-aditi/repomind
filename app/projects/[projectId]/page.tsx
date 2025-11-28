// app/projects/[projectId]/page.tsx
import { ProjectOverview } from '@/components/ProjectOverview';

export default async function ProjectPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  
  return (
    <div>
      <ProjectOverview projectId={projectId} key={projectId} />
    </div>
  );
}
