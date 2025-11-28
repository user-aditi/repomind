// lib/api-client.ts
import { Project, Meeting, SourceCode, Commit } from '@prisma/client';

// Type Definitions
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface PaginatedResponse<T> {
  projects?: T;
  files?: T;
  meetings?: T;
  pagination: PaginationMeta;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    filePath: string;
    content: string;
  }>;
}

interface ProjectWithStats extends Project {
  _count: {
    commits: number;
    meetings: number;
    sourceCode: number;
  };
}

type FetchOptions = RequestInit & { 
  params?: Record<string, string | number> 
};

class ApiClient {
  private baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
  
  private async request<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    const url = new URL(`${this.baseUrl}/api${endpoint}`);
    
    // Convert params to strings
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }
    
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }
  
  // Projects
  projects = {
    list: (params?: { page?: number; pageSize?: number }) =>
      this.request<ApiResponse<PaginatedResponse<ProjectWithStats[]>>>(
        '/projects', 
        { params: params as Record<string, string> }
      ),
    
    get: (id: string) =>
      this.request<ApiResponse<ProjectWithStats>>(`/projects/${id}`),
    
    create: (data: { name: string; githubUrl: string }) =>
      this.request<ApiResponse<ProjectWithStats>>('/projects', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<ApiResponse<null>>(`/projects/${id}`, { 
        method: 'DELETE' 
      }),
    
    chat: (id: string, question: string, fileContext?: string[]) =>
      this.request<ChatResponse>(`/projects/${id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question, fileContext })
      }),
    
    index: (id: string) =>
      this.request<ApiResponse<{ jobId: string; status: string }>>(
        `/projects/${id}/index`,
        { method: 'POST' }
      )
  };
  
  // Files
  files = {
    list: (projectId: string, params?: { 
      page?: number; 
      pageSize?: number;
      language?: string;
      search?: string;
    }) =>
      this.request<ApiResponse<PaginatedResponse<SourceCode[]>>>(
        `/projects/${projectId}/files`,
        { params: params as Record<string, string> }
      ),
    
    get: (projectId: string, fileId: string) =>
      this.request<ApiResponse<SourceCode>>(
        `/projects/${projectId}/files/${fileId}`
      )
  };
  
  // Meetings
  meetings = {
    list: (projectId: string, params?: { page?: number; pageSize?: number }) =>
      this.request<ApiResponse<PaginatedResponse<Meeting[]>>>(
        `/projects/${projectId}/meetings`,
        { params: params as Record<string, string> }
      ),
    
    get: (projectId: string, meetingId: string) =>
      this.request<ApiResponse<Meeting>>(
        `/projects/${projectId}/meetings/${meetingId}`
      ),
    
    upload: async (projectId: string, file: File, title?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      
      const response = await fetch(
        `/api/projects/${projectId}/meetings/upload`, 
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    
    delete: (projectId: string, meetingId: string) =>
      this.request<ApiResponse<null>>(
        `/projects/${projectId}/meetings/${meetingId}`,
        { method: 'DELETE' }
      )
  };
  
  // Commits
  commits = {
    list: (projectId: string) =>
      this.request<ApiResponse<Commit[]>>(
        `/projects/${projectId}/commits`
      )
  };
}

export const apiClient = new ApiClient();
