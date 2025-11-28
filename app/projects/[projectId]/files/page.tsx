// app/projects/[projectId]/files/page.tsx

import { FilesBrowser } from '@/components/FilesBrowser';

export default async function FilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <FilesBrowser projectId={projectId} />;
}
