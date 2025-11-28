// app/api/projects/[projectId]/commits/route.ts

import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  validateProjectOwnership,
} from '@/lib/api-utils';
import type { PageProps } from '@/types';

/**
 * GET /api/projects/[projectId]/commits
 * Get all commits for a project
 */
export const GET = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Get commits
    const commits = await db.commit.findMany({
      where: { projectId },
      orderBy: { commitDate: 'desc' },
      take: 50, // Limit to most recent 50
    });

    return createResponse(commits, 'Commits retrieved successfully');
  }
);
