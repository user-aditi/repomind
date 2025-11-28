// components/ProjectOverview.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Clock,
  FileCode,
  GitBranch,
  Mic,
  Loader2,
  Play,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface ProjectStats {
  projectId: string;
  status: 'completed' | 'pending' | 'indexing';
  filesIndexed: number;
  commitsIndexed: number;
  meetingsIndexed: number;
}

export function ProjectOverview({ projectId }: { projectId: string }) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchStats();
    
    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [projectId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/index`);
      const data = await response.json();
      
      const newStats = data.data as ProjectStats;
      setStats(newStats);
      
      // Stop polling if completed
      if (newStats.status === 'completed' && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setIsIndexing(false);
      }
    } catch (error) {
      toast.error('Failed to load project stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndex = async () => {
    setIsIndexing(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/index`, {
        method: 'POST'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start indexing');
      }

      toast.success('Indexing started! This may take a few minutes.');
      
      // Start polling every 5 seconds
      pollIntervalRef.current = setInterval(async () => {
        await fetchStats();
      }, 5000);

      // Stop polling after 10 minutes (safety)
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setIsIndexing(false);
          toast.info('Indexing is still in progress. Please refresh the page.');
        }
      }, 10 * 60 * 1000);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start indexing');
      setIsIndexing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px]" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[180px]" />
        </div>
      </div>
    );
  }

  const completionPercentage = stats?.status === 'completed' ? 100 : 0;
  const totalItems =
    (stats?.filesIndexed || 0) +
    (stats?.commitsIndexed || 0) +
    (stats?.meetingsIndexed || 0);

  return (
    <div className="space-y-6">
      {/* Hero Status Card */}
      <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Repository Status</CardTitle>
                {stats?.status === 'completed' ? (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Indexed
                  </Badge>
                ) : isIndexing ? (
                  <Badge variant="secondary">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Indexing...
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    Not Indexed
                  </Badge>
                )}
              </div>
              <CardDescription>
                {stats?.status === 'completed'
                  ? 'Your repository is ready for AI-powered analysis'
                  : 'Index your repository to unlock AI features'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {stats?.status === 'pending' && !isIndexing ? (
            /* Not Indexed State */
            <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to Unlock AI Power</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Start indexing to analyze your code, enable intelligent search, and chat with your
                codebase
              </p>
              <Button size="lg" onClick={handleIndex} disabled={isIndexing} className="shadow-lg">
                <Play className="mr-2 h-5 w-5" />
                Start Indexing Now
              </Button>
            </div>
          ) : isIndexing ? (
            /* Indexing in Progress */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium">Indexing in Progress</p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing repository... This may take several minutes
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{stats?.filesIndexed || 0} files processed</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>
          ) : (
            /* Indexed Successfully */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Repository Indexed Successfully</p>
                    <p className="text-sm text-muted-foreground">All features are now available</p>
                  </div>
                </div>
                <Button onClick={handleIndex} variant="outline" disabled={isIndexing}>
                  {isIndexing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Re-index
                </Button>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Indexing Progress</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards - Only show if indexed */}
      {(stats?.filesIndexed || 0) > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Files Card */}
          <Card className="border-blue-500/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Indexed</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileCode className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.filesIndexed || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Source code files</p>
            </CardContent>
          </Card>

          {/* Commits Card */}
          <Card className="border-purple-500/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commits Indexed</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.commitsIndexed || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Git commit history</p>
            </CardContent>
          </Card>

          {/* Meetings Card */}
          <Card className="border-orange-500/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meetings</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Mic className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.meetingsIndexed || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Transcribed meetings</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
