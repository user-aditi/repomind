// app/api/projects/[projectId]/meetings/upload/route.ts

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  createErrorResponse,
  validateProjectOwnership,
} from '@/lib/api-utils';
import { UPLOAD_LIMITS } from '@/lib/constants';
import { queueJob } from '@/lib/queue'; // Import queue
import type { PageProps } from '@/types';

/**
 * POST /api/projects/[projectId]/meetings/upload
 * Upload and process meeting audio file
 */
export const POST = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const meetingDate = formData.get('meetingDate') as string;

    // Validate file
    if (!file) {
      return createErrorResponse('No file provided', 400);
    }

    // Check file size
    if (file.size > UPLOAD_LIMITS.maxFileSizeBytes) {
      return createErrorResponse(
        `File size exceeds ${UPLOAD_LIMITS.maxFileSizeMB}MB limit`,
        400
      );
    }

    // Check file format
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const allowedFormats = UPLOAD_LIMITS.allowedAudioFormats as readonly string[];
    
    if (!allowedFormats.includes(fileExtension)) {
      return createErrorResponse(
        `Invalid file format. Allowed: ${UPLOAD_LIMITS.allowedAudioFormats.join(', ')}`,
        400
      );
    }

    // Create temp directory
    const tempDir = join(process.cwd(), 'temp', 'meetings');
    await mkdir(tempDir, { recursive: true });

    // Save file
    const fileName = `${projectId}-${Date.now()}${fileExtension}`;
    const filePath = join(tempDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Create meeting record
    const meeting = await db.meeting.create({
      data: {
        projectId,
        title: title || `Meeting ${new Date().toLocaleDateString()}`,
        meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
        audioUrl: `/temp/meetings/${fileName}`,
        transcript: null,
        summary: null,
      },
    });

    // Queue transcription job
    const jobId = queueJob('transcription', {
      meetingId: meeting.id,
      audioPath: filePath,
      projectId,
    });

    console.log(`Queued transcription job ${jobId} for meeting ${meeting.id}`);

    return createResponse(
      {
        meeting,
        jobId,
        message: 'File uploaded successfully. Transcription is being processed.',
      },
      'Meeting uploaded successfully',
      201
    );
  }
);
