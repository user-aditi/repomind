// components/ProjectSummary.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileCode, GitBranch, Mic, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface CodeSummary {
  totalFiles: number;
  languages: { name: string; count: number }[];
  recentFiles: { name: string; path: string; language: string }[];
}

interface MeetingSummary {
  totalMeetings: number;
  recentMeetings: { id: string; title: string; summary: string; date: string }[];
}

export function ProjectSummary({ projectId }: { projectId: string }) {
  const [codeSummary, setCodeSummary] = useState<CodeSummary | null>(null);
  const [meetingSummary, setMeetingSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummaries();
  }, [projectId]);

  const fetchSummaries = async () => {
    try {
      // Fetch code summary
      const filesResponse = await fetch(`/api/projects/${projectId}/files?pageSize=100`);
      const filesData = await filesResponse.json();
      
      const files = filesData.data?.files || [];
      const languageCounts = files.reduce((acc: any, file: any) => {
        const lang = file.language || 'Unknown';
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {});

      setCodeSummary({
        totalFiles: files.length,
        languages: Object.entries(languageCounts).map(([name, count]) => ({
          name,
          count: count as number,
        })),
        recentFiles: files.slice(0, 10),
      });

      // Fetch meetings summary
      const meetingsResponse = await fetch(`/api/projects/${projectId}/meetings`);
      const meetingsData = await meetingsResponse.json();
      
      const meetings = meetingsData.data?.meetings || [];
      setMeetingSummary({
        totalMeetings: meetings.length,
        recentMeetings: meetings.slice(0, 5),
      });

    } catch (error) {
      toast.error('Failed to load summaries');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project Summary</h1>
        <p className="text-muted-foreground">
          Overview of your codebase and meeting insights
        </p>
      </div>

      <Tabs defaultValue="code" className="space-y-4">
        <TabsList>
          <TabsTrigger value="code">
            <FileCode className="mr-2 h-4 w-4" />
            Codebase
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Mic className="mr-2 h-4 w-4" />
            Meetings
          </TabsTrigger>
        </TabsList>

        {/* Codebase Summary */}
        <TabsContent value="code" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>File Statistics</CardTitle>
                <CardDescription>Overview of your codebase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{codeSummary?.totalFiles || 0}</div>
                <p className="text-sm text-muted-foreground">Total files indexed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Languages Used</CardTitle>
                <CardDescription>Distribution of programming languages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {codeSummary?.languages.slice(0, 5).map((lang) => (
                    <div key={lang.name} className="flex items-center justify-between">
                      <span className="text-sm">{lang.name}</span>
                      <Badge variant="secondary">{lang.count} files</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Files</CardTitle>
              <CardDescription>Latest indexed code files</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {codeSummary?.recentFiles.map((file: any, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">{file.filePath}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{file.language}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Summary */}
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Statistics</CardTitle>
              <CardDescription>Overview of your meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{meetingSummary?.totalMeetings || 0}</div>
              <p className="text-sm text-muted-foreground">Total meetings transcribed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Meetings</CardTitle>
              <CardDescription>Latest meeting summaries</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {meetingSummary?.recentMeetings.map((meeting: any) => (
                    <div key={meeting.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium">{meeting.title}</h3>
                        <Badge variant="outline">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(meeting.meetingDate).toLocaleDateString()}
                        </Badge>
                      </div>
                      {meeting.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {meeting.summary}
                        </p>
                      )}
                    </div>
                  ))}
                  {meetingSummary?.recentMeetings.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No meetings yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
