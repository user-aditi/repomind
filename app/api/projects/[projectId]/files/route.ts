// app/api/projects/[projectId]/files/route.ts

import { db } from '@/lib/db';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  validateProjectOwnership,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-utils';
import { DB_LIMITS } from '@/lib/constants';
import type { PageProps } from '@/types';

/**
 * GET /api/projects/[projectId]/files
 * List all source code files for a project with pagination
 */
export const GET = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    const url = new URL(req.url);
    const { skip, take, page } = getPaginationParams(url);
    
    // Optional filters
    const language = url.searchParams.get('language');
    const search = url.searchParams.get('search');

    // Build where clause
    const where: any = { projectId };
    
    if (language) {
      where.language = language;
    }
    
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { filePath: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get files with pagination
    const [files, total] = await Promise.all([
      db.sourceCode.findMany({
        where,
        select: {
          id: true,
          fileName: true,
          filePath: true,
          language: true,
          summary: true,
          createdAt: true,
          // Exclude content for list view (too large)
        },
        orderBy: { filePath: 'asc' },
        skip,
        take,
      }),
      db.sourceCode.count({ where }),
    ]);

    // Get unique languages for filter options
    const languages = await db.sourceCode.findMany({
      where: { projectId },
      select: { language: true },
      distinct: ['language'],
    });

    return createResponse({
      files,
      pagination: createPaginationMeta(total, page, take),
      filters: {
        languages: languages.map(l => l.language).filter(Boolean),
      },
    });
  }
);
