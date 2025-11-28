// lib/api-utils.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create a successful API response
 */
export function createResponse<T>(
  data: T,
  message: string = 'Success',
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status }
  );
}

/**
 * Create response with pagination metadata
 */
export function createResponseWithPagination<T>(
  data: T,
  pagination: ReturnType<typeof createPaginationMeta>,
  message: string = 'Success',
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data: {
        ...data,
        pagination
      },
      message
    },
    { status }
  );
}

/**
 * Higher-order function to wrap API handlers with error handling
 */
export function withErrorHandling(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API_ERROR:', error);
      
      if (error instanceof ApiError) {
        return createErrorResponse(error.message, error.statusCode);
      }
      
      return createErrorResponse(
        'Internal server error',
        500
      );
    }
  };
}

/**
 * Middleware to check authentication
 * Returns session with guaranteed user property
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    throw new ApiError('Authentication required', 401);
  }
  
  return {
    ...session,
    user: {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || null,
      image: session.user.image || null
    }
  };
}

/**
 * Validate that a project belongs to the authenticated user
 */
export async function validateProjectOwnership(
  projectId: string,
  userId: string,
  db: any
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { userId: true }
  });
  
  if (!project) {
    throw new ApiError('Project not found', 404);
  }
  
  if (project.userId !== userId) {
    throw new ApiError('Access denied', 403);
  }
  
  return project;
}

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new ApiError('Invalid JSON in request body', 400);
  }
}

/**
 * Get pagination parameters from URL
 */
export function getPaginationParams(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get('pageSize') || '10'))
  );
  
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

/**
 * Create pagination metadata for responses
 */
export function createPaginationMeta(
  total: number,
  page: number,
  pageSize: number
) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    hasMore: page * pageSize < total
  };
}
