// components/ChatInterface.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Send, Bot, User, Loader2, FileCode, Mic, X, GitCommit } from 'lucide-react';
import { toast } from 'sonner';

// Simple loading skeleton used while the chat component is lazy-loaded
const ChatSkeleton = () => <div className="p-4">Loading chat...</div>;

const ChatComponent = dynamic(() => import('./ChatComponent').then((mod) => mod.ChatComponent), {
  loading: () => <ChatSkeleton />,
  ssr: false,
});

interface Message {
  role: 'user' | 'ai';
  content: string;
  sources?: { filePath: string; content: string }[];
}

interface FileItem {
  id: string;
  fileName: string;
  filePath: string;
  language: string | null;
}

interface MeetingItem {
  id: string;
  title: string;
  meetingDate: string;
}

interface CommitItem {
  id: string;
  commitHash: string;
  commitMessage: string;
  commitAuthor?: string;
  commitDate?: string;
}

export function ChatInterface({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Context state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [commits, setCommits] = useState<CommitItem[]>([]);

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);

  useEffect(() => {
    // Pre-select file or meeting or commit from URL params if present
    const fileId = searchParams?.get('file');
    const meetingId = searchParams?.get('meeting');
    const commitId = searchParams?.get('commit');

    if (fileId) setSelectedFiles([fileId]);
    if (meetingId) setSelectedMeetings([meetingId]);
    if (commitId) setSelectedCommits([commitId]);

    fetchFiles();
    fetchMeetings();
    fetchCommits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files?pageSize=100`);
      const data = await response.json();
      setFiles(data.data?.files || []);
    } catch (error) {
      console.error('Failed to load files', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/meetings`);
      const data = await response.json();
      setMeetings(data.data?.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings', error);
    }
  };

  const fetchCommits = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/commits`);
      const data = await response.json();
      // data.data should be an array of commits — map if necessary
      setCommits(data.data || []);
    } catch (error) {
      console.error('Failed to load commits', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          fileContext: selectedFiles.length > 0 ? selectedFiles : undefined,
          meetingContext: selectedMeetings.length > 0 ? selectedMeetings : undefined,
          commitContext: selectedCommits.length > 0 ? selectedCommits : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to fetch AI response');

      const aiMessage: Message = {
        role: 'ai',
        content: data.data?.answer ?? 'No answer returned.',
        sources: data.data?.sources ?? undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      toast.error(message);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, I encountered an error. Please make sure the project is indexed first.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFile = (id: string) =>
    setSelectedFiles((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleMeeting = (id: string) =>
    setSelectedMeetings((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleCommit = (id: string) =>
    setSelectedCommits((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const clearAllSelections = () => {
    setSelectedFiles([]);
    setSelectedMeetings([]);
    setSelectedCommits([]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-12rem)]">
      {/* Chat Area */}
      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Assistant</CardTitle>

            {/* Context Selector Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileCode className="mr-2 h-4 w-4" />
                  Context ({selectedFiles.length + selectedMeetings.length + selectedCommits.length})
                </Button>
              </SheetTrigger>

              {/* REPLACED: New SheetContent with sticky headers, scrollable middle section and fixed footer */}
              <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0 gap-0">
                <SheetHeader className="p-6 border-b shrink-0">
                  <SheetTitle>Select Context</SheetTitle>
                </SheetHeader>
                
                {/* Scrollable Middle Section */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Files Selection */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center sticky top-0 bg-background z-10 py-1">
                      <FileCode className="mr-2 h-4 w-4" />
                      Code Files ({selectedFiles.length})
                    </h3>
                    <div className="border rounded-md divide-y">
                      {files.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">No files indexed</p>
                      ) : (
                        files.map((file) => (
                          <div key={file.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50">
                            <Checkbox
                              id={file.id}
                              checked={selectedFiles.includes(file.id)}
                              onCheckedChange={() => toggleFile(file.id)}
                            />
                            <label
                              htmlFor={file.id}
                              className="text-sm cursor-pointer flex-1 flex items-center justify-between min-w-0"
                            >
                              <span className="truncate pr-2">{file.fileName}</span>
                              {file.language && (
                                <Badge variant="outline" className="ml-2 text-[10px] shrink-0">
                                  {file.language}
                                </Badge>
                              )}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Commits Selection */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center sticky top-0 bg-background z-10 py-1">
                      <GitCommit className="mr-2 h-4 w-4" />
                      Commits ({selectedCommits.length})
                    </h3>
                    <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                      {commits.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">No commits found</p>
                      ) : (
                        commits.map((commit) => (
                          <div key={commit.id} className="flex items-start space-x-2 p-2 hover:bg-muted/50">
                            <Checkbox
                              id={`c-${commit.id}`}
                              checked={selectedCommits.includes(commit.id)}
                              onCheckedChange={() => toggleCommit(commit.id)}
                              className="mt-1"
                            />
                            <label
                              htmlFor={`c-${commit.id}`}
                              className="text-sm cursor-pointer flex-1 grid gap-0.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] bg-muted px-1 rounded">
                                  {commit.commitHash.substring(0, 7)}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {commit.commitDate ? new Date(commit.commitDate).toLocaleDateString() : ''}
                                </span>
                              </div>
                              <span className="line-clamp-2 text-xs">{commit.commitMessage}</span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Meetings Selection */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center sticky top-0 bg-background z-10 py-1">
                      <Mic className="mr-2 h-4 w-4" />
                      Meetings ({selectedMeetings.length})
                    </h3>
                    <div className="border rounded-md divide-y">
                       {meetings.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">No meetings recorded</p>
                      ) : (
                        meetings.map((meeting) => (
                          <div key={meeting.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50">
                            <Checkbox
                              id={meeting.id}
                              checked={selectedMeetings.includes(meeting.id)}
                              onCheckedChange={() => toggleMeeting(meeting.id)}
                            />
                            <label htmlFor={meeting.id} className="text-sm cursor-pointer flex-1 min-w-0">
                              <div className="truncate">{meeting.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(meeting.meetingDate).toLocaleDateString()}
                              </div>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-6 border-t bg-background shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFiles([]);
                      setSelectedMeetings([]);
                      setSelectedCommits([]);
                    }}
                    className="w-full"
                  >
                    Clear All Selection
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Selected Context Pills */}
          {(selectedFiles.length > 0 || selectedMeetings.length > 0 || selectedCommits.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {selectedFiles.slice(0, 3).map((fileId) => {
                const file = files.find((f) => f.id === fileId);
                return file ? (
                  <Badge key={fileId} variant="secondary" className="gap-1">
                    <FileCode className="h-3 w-3" />
                    {file.fileName}
                    <button onClick={() => toggleFile(fileId)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              {selectedFiles.length > 3 && <Badge variant="secondary">+{selectedFiles.length - 3} more files</Badge>}

              {selectedMeetings.slice(0, 2).map((meetingId) => {
                const meeting = meetings.find((m) => m.id === meetingId);
                return meeting ? (
                  <Badge key={meetingId} variant="secondary" className="gap-1">
                    <Mic className="h-3 w-3" />
                    {meeting.title}
                    <button onClick={() => toggleMeeting(meetingId)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}

              {selectedCommits.slice(0, 3).map((commitId) => {
                const commit = commits.find((c) => c.id === commitId);
                return commit ? (
                  <Badge key={commitId} variant="secondary" className="gap-1">
                    <GitCommit className="h-3 w-3" />
                    {commit.commitHash?.substring(0, 7)}
                    <button onClick={() => toggleCommit(commitId)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              {selectedCommits.length > 3 && <Badge variant="secondary">+{selectedCommits.length - 3} more commits</Badge>}
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground">Ask questions about your codebase, commits or meetings</p>
                  <p className="text-xs text-muted-foreground mt-2">Tip: Select specific files, commits or meetings for more focused answers</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.sources && message.sources.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {source.filePath}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              placeholder="Ask about your code, commits or meetings..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
              className="min-h-[60px] resize-none"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="h-[60px] w-[60px]">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Example Questions Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-2">
              {[
                'How does authentication work?',
                'Explain the database schema',
                'What API endpoints are available?',
                'Summarize the recent meeting',
                'What were the action items discussed?',
                'How is error handling implemented?',
                'Show me the routing structure',
                'What dependencies are used?',
              ].map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => setInput(q)}
                  disabled={isLoading}
                >
                  <span className="text-sm">{q}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
