// app/api/projects/[projectId]/route.ts

import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  createErrorResponse,
  validateProjectOwnership,
  ApiError,
} from '@/lib/api-utils';
import { updateProjectSchema } from '@/lib/validations';
import { API_MESSAGES } from '@/lib/constants';
import type { PageProps } from '@/types';

/**
 * GET /api/projects/[projectId]
 * Get a single project with details
 */
export const GET = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Get project with all related data
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            commits: true,
            meetings: true,
            sourceCode: true,
          },
        },
        commits: {
          take: 10,
          orderBy: { commitDate: 'desc' },
        },
        meetings: {
          take: 5,
          orderBy: { meetingDate: 'desc' },
        },
      },
    });

    return createResponse(project, 'Project retrieved successfully');
  }
);

/**
 * PATCH /api/projects/[projectId]
 * Update a project
 */
export const PATCH = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Validate input
    const body = await req.json();
    const validation = updateProjectSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        validation.error.issues[0].message, // Changed from .errors to .issues
        400
      );
    }

    // Update project
    const project = await db.project.update({
      where: { id: projectId },
      data: validation.data,
      include: {
        _count: {
          select: {
            commits: true,
            meetings: true,
            sourceCode: true,
          },
        },
      },
    });

    return createResponse(project, 'Project updated successfully');
  }
);

/**
 * DELETE /api/projects/[projectId]
 * Delete a project (cascades to all related data)
 */
export const DELETE = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Delete project (cascades to commits, meetings, sourceCode)
    await db.project.delete({
      where: { id: projectId },
    });

    // TODO: Also delete from vector store
    // await deleteProjectFromVectorStore(projectId);

    return createResponse(
      null,
      'Project deleted successfully'
    );
  }
);
