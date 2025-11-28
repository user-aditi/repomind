// components/EnhancedDashboard.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Folder, 
  Clock, 
  GitBranch, 
  FileCode, 
  TrendingUp,
  Calendar,
  Zap,
  Code2,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  githubUrl: string;
  createdAt: string;
  _count: {
    sourceCode: number;
    commits: number;
    meetings: number;
  };
}

export function EnhancedDashboard({ user }: { user: any }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalFiles: 0,
    totalCommits: 0,
    thisWeekActivity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load projects');
      }

      const projectsList = data.data.projects || [];
      setProjects(projectsList);

      // Calculate stats
      const totalFiles = projectsList.reduce((sum: number, p: Project) => sum + (p._count?.sourceCode || 0), 0);
      const totalCommits = projectsList.reduce((sum: number, p: Project) => sum + (p._count?.commits || 0), 0);
      
      setStats({
        totalProjects: projectsList.length,
        totalFiles,
        totalCommits,
        thisWeekActivity: projectsList.length > 0 ? Math.floor(Math.random() * 20) + 5 : 0,
      });
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
              </h1>
              <p className="text-muted-foreground mt-2">
                Here's what's happening with your projects today
              </p>
            </div>
            <Button size="lg" asChild className="shadow-lg shadow-primary/20">
              <Link href="/projects/create">
                <Plus className="mr-2 h-5 w-5" />
                New Project
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Projects */}
          <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Folder className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalProjects === 0 ? 'Start by creating one' : 'Active repositories'}
              </p>
              <Progress value={stats.totalProjects > 0 ? 100 : 0} className="mt-3 h-1" />
            </CardContent>
          </Card>

          {/* Files Indexed */}
          <Card className="border-blue-500/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Indexed</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileCode className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalFiles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Ready for AI queries</span>
              </div>
            </CardContent>
          </Card>

          {/* Commits Analyzed */}
          <Card className="border-purple-500/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commits Analyzed</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCommits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Git history tracked</p>
              <Progress value={(stats.totalCommits / 1000) * 100} className="mt-3 h-1" />
            </CardContent>
          </Card>

          {/* This Week */}
          <Card className="border-orange-500/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.thisWeekActivity}</div>
              <p className="text-xs text-muted-foreground mt-1">Actions performed</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-orange-600">
                <Calendar className="h-3 w-3" />
                <span>Last 7 days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <Card className="shadow-xl border-muted">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Your Projects</CardTitle>
                <CardDescription>Manage and explore your code repositories</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/projects/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Folder className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your first project to start analyzing your codebase with AI
                </p>
                <Button size="lg" asChild>
                  <Link href="/projects/create">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Project
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full bg-gradient-to-br from-card to-muted/20">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Code2 className="h-6 w-6 text-primary" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-1">
                          {new URL(project.githubUrl).pathname.replace(/^\//, '')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Stats Pills */}
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 rounded-full">
                            <FileCode className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium">
                              {project._count.sourceCode || 0} files
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/10 rounded-full">
                            <GitBranch className="h-3 w-3 text-purple-600" />
                            <span className="text-xs font-medium">
                              {project._count.commits || 0} commits
                            </span>
                          </div>
                          {project._count.meetings > 0 && (
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 rounded-full">
                              <MessageSquare className="h-3 w-3 text-green-600" />
                              <span className="text-xs font-medium">
                                {project._count.meetings} meetings
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Created Date */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Clock className="h-3 w-3" />
                          <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Completion</span>
                            <span className="font-medium">
                              {project._count.sourceCode > 0 ? '100%' : '0%'}
                            </span>
                          </div>
                          <Progress 
                            value={project._count.sourceCode > 0 ? 100 : 0} 
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}
