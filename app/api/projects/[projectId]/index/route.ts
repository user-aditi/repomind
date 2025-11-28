// app/api/projects/[projectId]/index/route.ts

import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  createErrorResponse,
  validateProjectOwnership,
} from '@/lib/api-utils';
import { queueJob } from '@/lib/queue';
import type { PageProps } from '@/types';

/**
 * POST /api/projects/[projectId]/index
 * Trigger repository indexing (queued as background job)
 */
export const POST = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Get project
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return createErrorResponse('Project not found', 404);
    }

    // Queue indexing job
    const jobId = queueJob('indexing', {
      projectId,
      githubUrl: project.githubUrl,
    });

    console.log(`Queued indexing job ${jobId} for project ${projectId}`);

    return createResponse(
      {
        projectId,
        jobId,
        status: 'queued',
        message: 'Indexing job has been queued. This may take several minutes.',
      },
      'Indexing queued successfully',
      202 // Accepted
    );
  }
);

/**
 * GET /api/projects/[projectId]/index
 * Get indexing status for a project
 */
export const GET = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {  // FIX: Add generic parameter
    const session = await requireAuth();
    const { projectId } = await params;

    await validateProjectOwnership(projectId, session.user.id, db);

    // Get counts
    const counts = await db.project.findUnique({
      where: { id: projectId },
      select: {
        _count: {
          select: {
            sourceCode: true,
            commits: true,
            meetings: true
          }
        }
      }
    });

    const filesIndexed = counts?._count.sourceCode ?? 0;
    const commitsIndexed = counts?._count.commits ?? 0;
    const meetingsIndexed = counts?._count.meetings ?? 0;

    // Determine status
    let status: 'completed' | 'pending' | 'indexing' = 'pending';
    
    if (filesIndexed > 0 || commitsIndexed > 0) {
      status = 'completed';
    }

    return createResponse({
      projectId,
      status,
      filesIndexed,
      commitsIndexed,
      meetingsIndexed
    });
  }
);
