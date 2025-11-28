// components/FilesBrowser.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileCode, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface FileItem {
  id: string;
  fileName: string;
  filePath: string;
  language: string | null;
  summary: string | null;
  createdAt: string;
}

interface FileContent extends FileItem {
  content: string;
}

// Helper function to clean file paths
const cleanFilePath = (path: string): string => {
  // Split by both forward and backslash
  const parts = path.split(/[\/\\]/);
  
  // Find 'repos' in the path
  const reposIndex = parts.findIndex(part => part === 'repos');
  
  if (reposIndex !== -1 && parts.length > reposIndex + 2) {
    // Return everything after repos/[uuid]/
    return parts.slice(reposIndex + 2).join('/');
  }
  
  // If no 'repos' found, return last 3 parts for context
  return parts.slice(-3).join('/');
};

// Get just the filename
const getFileName = (path: string): string => {
  const parts = path.split(/[\/\\]/);
  return parts[parts.length - 1];
};

export function FilesBrowser({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [projectId, selectedLanguage, searchQuery, currentPage]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
      });

      if (selectedLanguage !== 'all') {
        params.append('language', selectedLanguage);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `/api/projects/${projectId}/files?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load files');
      }

      setFiles(data.data.files);
      setLanguages(data.data.filters.languages);
      setTotalPages(data.data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = async (fileId: string) => {
    setIsLoadingFile(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/files/${fileId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load file');
      }

      setSelectedFile(data.data);
    } catch (error) {
      toast.error('Failed to load file content');
    } finally {
      setIsLoadingFile(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Source Code Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileCode className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No files found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or index the project first
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => openFile(file.id)}
                    className="w-full p-4 hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <FileCode className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium group-hover:text-primary transition-colors">
                            {getFileName(file.filePath)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cleanFilePath(file.filePath)}
                          </p>
                          {file.summary && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {file.summary}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {file.language || 'Unknown'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* File Viewer Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="p-4 border-b bg-background shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileCode className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-lg truncate">
                  {selectedFile ? getFileName(selectedFile.filePath) : ''}
                </div>
                <div className="text-xs text-muted-foreground font-normal truncate">
                  {selectedFile ? selectedFile.filePath : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedFile?.language && (
                <Badge variant="secondary">{selectedFile.language}</Badge>
              )}
              <Button
                size="sm"
                onClick={() => {
                   // Redirect to chat with this file as context
                   if (selectedFile) {
                      window.location.href = `/projects/${projectId}/chat?file=${selectedFile.id}`;
                   }
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask AI
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
          {isLoadingFile ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/3 bg-slate-800" />
              <Skeleton className="h-4 w-2/3 bg-slate-800" />
            </div>
          ) : selectedFile ? (
            <div>
              {selectedFile.summary && (
                <div className="mb-6 p-4 rounded-md bg-slate-900 border border-slate-800">
                  <p className="text-sm font-semibold text-slate-200 mb-1">AI Summary:</p>
                  <p className="text-sm text-slate-400">{selectedFile.summary}</p>
                </div>
              )}
              <pre className="text-sm font-mono text-slate-50 leading-relaxed whitespace-pre-wrap break-all">
                {selectedFile.content}
              </pre>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
