// types/index.ts

import { User, Project, Meeting, SourceCode, Commit } from '@prisma/client';

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Authentication Types
 */
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/**
 * Project Types
 */
export interface ProjectWithStats extends Project {
  _count: {
    commits: number;
    meetings: number;
    sourceCode: number;
  };
}

export interface ProjectCreateInput {
  name: string;
  githubUrl: string;
}

/**
 * Chat Types
 */
export interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp?: Date;
  sources?: string[];
}

export interface ChatRequest {
  question: string;
  fileContext?: string[];
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sources: {
    filePath: string;
    content: string;
    relevanceScore: number;
  }[];
  tokensUsed?: number;
}

/**
 * File Processing Types
 */
export interface FileMetadata {
  projectId: string;
  filePath: string;
  source: string;
  commitHash?: string;
  language?: string;
  fileType?: string;
}

export interface ProcessedDocument {
  content: string;
  metadata: FileMetadata;
}

/**
 * Meeting Types
 */
export interface MeetingUploadRequest {
  file: File;
  projectId: string;
  title?: string;
}

export interface MeetingWithTranscript extends Meeting {
  transcript: string;
  summary: string;
}

/**
 * Indexing Types
 */
export interface IndexingProgress {
  status: 'pending' | 'cloning' | 'processing' | 'embedding' | 'complete' | 'error';
  filesProcessed: number;
  totalFiles: number;
  currentFile?: string;
  error?: string;
}

export interface IndexingResult {
  success: boolean;
  chunksCreated: number;
  filesIndexed: number;
  summary?: string;
  error?: string;
}

/**
 * Vector Store Types
 */
export interface EmbeddingMetadata {
  projectId: string;
  filePath: string;
  source: string;
  chunkIndex: number;
  commitHash?: string;
}

export interface SearchResult {
  content: string;
  metadata: EmbeddingMetadata;
  score: number;
}

/**
 * Form Validation Types
 */
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData extends LoginFormData {
  name: string;
  confirmPassword?: string;
}

/**
 * Component Prop Types
 */
export interface PageProps<T = {}> {
  params: Promise<T>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface LayoutProps {
  children: React.ReactNode;
  params?: Promise<any>;
}

// API Response with Pagination
export interface PaginatedApiResponse<T> {
  success: boolean;
  data: {
    projects?: T;
    files?: T;
    meetings?: T;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  message?: string;
}

// Chat Response
export interface ChatApiResponse {
  success: boolean;
  data: {
    answer: string;
    sources: Array<{
      filePath: string;
      content: string;
    }>;
  };
}

// Project with Stats
export interface ProjectWithStats extends Project {
  _count: {
    commits: number;
    meetings: number;
    sourceCode: number;
  };
}
