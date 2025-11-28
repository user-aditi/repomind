// components/CommitsBrowser.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  GitCommit, 
  Calendar, 
  User as UserIcon, 
  Search,
  MessageSquare,
  ChevronRight,
  GitBranch
} from 'lucide-react';
import { toast } from 'sonner';

interface Commit {
  id: string;
  commitHash: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  createdAt: string;
}

export function CommitsBrowser({ projectId }: { projectId: string }) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCommits();
  }, [projectId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = commits.filter(commit =>
        commit.commitMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commit.commitAuthor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commit.commitHash.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCommits(filtered);
    } else {
      setFilteredCommits(commits);
    }
  }, [searchQuery, commits]);

  const fetchCommits = async () => {
    setIsLoading(true);
    try {
      // We'll need to create this API endpoint
      const response = await fetch(`/api/projects/${projectId}/commits`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load commits');
      }

      const commitsList = Array.isArray(data.data) ? data.data : (data.data.commits || []);
      setCommits(commitsList);
      setFilteredCommits(commitsList);
    } catch (error) {
      toast.error('Failed to load commits');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-purple-500/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">Git Commits</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {commits.length} commits analyzed
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commits by message, author, or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Commits List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filteredCommits.length === 0 ? (
            <div className="text-center py-12 px-4">
              <GitCommit className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchQuery ? 'No commits found' : 'No commits yet'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Index the project to see commit history'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="divide-y">
                {filteredCommits.map((commit) => (
                  <button
                    key={commit.id}
                    onClick={() => setSelectedCommit(commit)}
                    className="w-full p-4 hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Commit Icon */}
                      <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                        <GitCommit className="h-5 w-5 text-purple-500" />
                      </div>

                      {/* Commit Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                          {commit.commitMessage}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            <span>{commit.commitAuthor}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(commit.commitDate)}</span>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs">
                            {commit.commitHash.substring(0, 7)}
                          </Badge>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Commit Detail Dialog */}
      <Dialog open={!!selectedCommit} onOpenChange={() => setSelectedCommit(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <GitCommit className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Commit Details</div>
                <div className="text-xs text-muted-foreground font-normal font-mono">
                  {selectedCommit?.commitHash}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedCommit && (
            <div className="space-y-4">
              {/* Commit Message */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">Commit Message:</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedCommit.commitMessage}
                  </p>
                </CardContent>
              </Card>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Author</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedCommit.commitAuthor}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Date</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedCommit.commitDate)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    window.location.href = `/projects/${projectId}/chat?commit=${selectedCommit.id}`;
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask AI About This Commit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
