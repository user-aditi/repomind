// app/api/jobs/[jobId]/route.ts

import {
  withErrorHandling,
  requireAuth,
  createResponse,
  createErrorResponse,
} from '@/lib/api-utils';
import { getJobStatus } from '@/lib/queue';
import type { PageProps } from '@/types';

/**
 * GET /api/jobs/[jobId]
 * Get status of a background job
 */
export const GET = withErrorHandling(
  async (req: Request, { params }: PageProps<{ jobId: string }>) => {
    await requireAuth();
    const { jobId } = await params;

    const job = getJobStatus(jobId);

    if (!job) {
      return createErrorResponse('Job not found', 404);
    }

    return createResponse({
      id: job.id,
      type: job.type,
      status: job.status,
      error: job.error,
    });
  }
);
