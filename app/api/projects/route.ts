// app/api/projects/route.ts
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { 
  withErrorHandling, 
  requireAuth, 
  createResponse, 
  createErrorResponse,
  getPaginationParams,
  createPaginationMeta,
  createResponseWithPagination  // ADD THIS LINE
} from '@/lib/api-utils';
import { createProjectSchema } from '@/lib/validations';
import { DB_LIMITS } from '@/lib/constants';
import { queueJob } from '@/lib/queue';

export const GET = withErrorHandling(async (req: Request) => {
  const session = await requireAuth();
  const url = new URL(req.url);
  const { skip, take, page } = getPaginationParams(url);

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: {
            commits: true,
            meetings: true,
            sourceCode: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    db.project.count({ where: { userId: session.user.id } })
  ]);

  // This will now work
  return createResponseWithPagination(
    { projects },
    createPaginationMeta(total, page, take),
    'Projects retrieved successfully'
  );
});

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireAuth();
  
  try {
    const body = await req.json();
    
    // Validate input
    const validation = createProjectSchema.safeParse(body);
    
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Validation failed';
      return createErrorResponse(errorMessage, 400);
    }

    const { name, githubUrl } = validation.data;

    // Check for duplicate
    const existingProject = await db.project.findFirst({
      where: {
        userId: session.user.id,
        githubUrl
      }
    });

    if (existingProject) {
      return createErrorResponse(
        'You already have a project with this GitHub URL',
        409
      );
    }

    // Create project
    const project = await db.project.create({
      data: {
        name,
        githubUrl,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            commits: true,
            meetings: true,
            sourceCode: true
          }
        }
      }
    });

    // Queue indexing job
    const jobId = queueJob('indexing', {
      projectId: project.id,
      githubUrl: project.githubUrl
    });

    console.log(`Queued indexing job ${jobId} for project ${project.id}`);

    return createResponse(
      { 
        project,
        jobId,
        status: 'indexing',
        message: 'Project created successfully. Indexing has been queued.'
      },
      'Project created successfully',
      201
    );
  } catch (error) {
    console.error('Project creation error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return createErrorResponse('A project with this URL already exists', 409);
      }
    }
    
    throw error; // Re-throw to be caught by withErrorHandling
  }
});
