// app/projects/[projectId]/commits/page.tsx

import { CommitsBrowser } from '@/components/CommitsBrowser';

export default async function CommitsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <CommitsBrowser projectId={projectId} />;
}
