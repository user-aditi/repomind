// app/api/projects/[projectId]/meetings/route.ts

import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  validateProjectOwnership,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-utils';
import type { PageProps } from '@/types';

/**
 * GET /api/projects/[projectId]/meetings
 * List all meetings for a project with pagination
 */
export const GET = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    const url = new URL(req.url);
    const { skip, take, page } = getPaginationParams(url);

    // Get meetings with pagination
    const [meetings, total] = await Promise.all([
      db.meeting.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          meetingDate: true,
          audioUrl: true,
          summary: true,
          createdAt: true,
          // Include transcript status
          transcript: true,
        },
        orderBy: { meetingDate: 'desc' },
        skip,
        take,
      }),
      db.meeting.count({ where: { projectId } }),
    ]);

    // Add processing status to each meeting
    const meetingsWithStatus = meetings.map(meeting => ({
      ...meeting,
      status: meeting.transcript ? 'completed' : 'processing',
      hasTranscript: !!meeting.transcript,
      transcriptPreview: meeting.transcript?.substring(0, 200),
    }));

    return createResponse({
      meetings: meetingsWithStatus,
      pagination: createPaginationMeta(total, page, take),
    });
  }
);
