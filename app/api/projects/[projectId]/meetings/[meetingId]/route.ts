// app/api/projects/[projectId]/meetings/[meetingId]/route.ts

import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  validateProjectOwnership,
  ApiError,
} from '@/lib/api-utils';
import { rm } from 'fs/promises';
import { join } from 'path';
import { API_MESSAGES } from '@/lib/constants';
import type { PageProps } from '@/types';

/**
 * GET /api/projects/[projectId]/meetings/[meetingId]
 * Get full meeting details including transcript
 */
export const GET = withErrorHandling(
  async (
    req: Request,
    { params }: PageProps<{ projectId: string; meetingId: string }>
  ) => {
    const session = await requireAuth();
    const { projectId, meetingId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Get meeting
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new ApiError(API_MESSAGES.NOT_FOUND, 404);
    }

    // Verify meeting belongs to project
    if (meeting.projectId !== projectId) {
      throw new ApiError(API_MESSAGES.FORBIDDEN, 403);
    }

    return createResponse({
      ...meeting,
      status: meeting.transcript ? 'completed' : 'processing',
    });
  }
);

/**
 * DELETE /api/projects/[projectId]/meetings/[meetingId]
 * Delete a meeting
 */
export const DELETE = withErrorHandling(
  async (
    req: Request,
    { params }: PageProps<{ projectId: string; meetingId: string }>
  ) => {
    const session = await requireAuth();
    const { projectId, meetingId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Get meeting to verify and get audio path
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new ApiError(API_MESSAGES.NOT_FOUND, 404);
    }

    if (meeting.projectId !== projectId) {
      throw new ApiError(API_MESSAGES.FORBIDDEN, 403);
    }

    // Delete audio file if present (best-effort)
    if (meeting.audioUrl) {
      try {
        await rm(join(process.cwd(), meeting.audioUrl), { force: true });
      } catch (err) {
        console.warn('Failed to delete meeting audio file:', err);
      }
    }

    // Delete meeting record
    await db.meeting.delete({
      where: { id: meetingId },
    });

    return createResponse(null, 'Meeting deleted successfully');
  }
);
