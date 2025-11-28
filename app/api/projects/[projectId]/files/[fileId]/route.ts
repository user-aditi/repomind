import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  createErrorResponse,
  validateProjectOwnership,
} from '@/lib/api-utils';
import type { PageProps } from '@/types';

export const GET = withErrorHandling(async (req: Request, { params }: PageProps<{ projectId: string; fileId: string }>) => {
  const session = await requireAuth();
  const { projectId, fileId } = await params;

  // Validate that the user owns the project
  await validateProjectOwnership(projectId, session.user.id, db);

  const file = await db.sourceCode.findUnique({
    where: { id: fileId },
  });

  if (!file || file.projectId !== projectId) {
    return createErrorResponse('File not found', 404);
  }

  return createResponse(file);
});
