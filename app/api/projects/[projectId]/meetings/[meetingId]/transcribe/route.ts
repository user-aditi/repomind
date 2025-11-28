// app/api/projects/[projectId]/meetings/[meetingId]/transcribe/route.ts

import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  validateProjectOwnership,
} from '@/lib/api-utils';
import type { PageProps } from '@/types';

/**
 * POST /api/projects/[projectId]/meetings/[meetingId]/transcribe
 * Manually trigger transcription for a meeting
 */
export const POST = withErrorHandling(
  async (
    req: Request,
    { params }: PageProps<{ projectId: string; meetingId: string }>
  ) => {
    const session = await requireAuth();
    const { projectId, meetingId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // For now, create a mock transcript
    // In production, this would call the transcription service
    const mockTranscript = `This is a test transcript for meeting ${meetingId}.

[00:00] Discussion started about the new features.
[00:30] Team agreed on the implementation approach.
[01:00] Action items were assigned to team members.
[01:30] Meeting concluded with next steps defined.`;

    const mockSummary = `Meeting Summary:
    
Key Points:
- Discussed new feature implementation
- Agreed on technical approach
- Assigned action items to team

Action Items:
- Team member 1: Start backend implementation
- Team member 2: Design UI mockups
- Team member 3: Write documentation`;

    // Update meeting with transcript
    const meeting = await db.meeting.update({
      where: { id: meetingId },
      data: {
        transcript: mockTranscript,
        summary: mockSummary,
      },
    });

    return createResponse(meeting, 'Transcription completed');
  }
);
