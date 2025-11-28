// components/MeetingsManager.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Mic, Clock, Loader2, FileAudio, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Meeting {
  id: string;
  title: string;
  meetingDate: string;
  status: 'completed' | 'processing';
  hasTranscript: boolean;
  transcriptPreview?: string;
}

interface MeetingDetail extends Meeting {
  transcript: string;
  summary: string;
}

export function MeetingsManager({ projectId }: { projectId: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDetail | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchMeetings();
  }, [projectId]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/meetings`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load meetings');
      }

      setMeetings(data.data.meetings);
    } catch (error) {
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title || 'Untitled Meeting');
    formData.append('meetingDate', new Date().toISOString());

    try {
      const response = await fetch(
        `/api/projects/${projectId}/meetings/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload meeting');
      }

      toast.success('Meeting uploaded! Transcription is being processed.');
      setShowUpload(false);
      setUploadForm({ title: '', file: null });
      fetchMeetings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const openMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/meetings/${meetingId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load meeting');
      }

      setSelectedMeeting(data.data);
    } catch (error) {
      toast.error('Failed to load meeting details');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Meeting Transcripts</CardTitle>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Meeting
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Meetings List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Mic className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No meetings yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Upload meeting recordings to get AI-powered transcriptions
              </p>
              <Button onClick={() => setShowUpload(true)} className="mt-4">
                <Upload className="mr-2 h-4 w-4" />
                Upload First Meeting
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => openMeeting(meeting.id)}
                  className="w-full p-4 hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <FileAudio className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{meeting.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {new Date(meeting.meetingDate).toLocaleDateString()}
                          </p>
                        </div>
                        {meeting.transcriptPreview && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {meeting.transcriptPreview}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={meeting.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {meeting.status === 'completed' ? 'Ready' : 'Processing'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Meeting Recording</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="Team Standup - Nov 21"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Audio File</Label>
              <Input
                id="file"
                type="file"
                accept=".wav,.mp3,.m4a,.flac,.ogg"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUploadForm({ ...uploadForm, file });
                }}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: WAV, MP3, M4A, FLAC, OGG (Max 25MB)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpload(false)}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || !uploadForm.file} className="flex-1">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Meeting Detail Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedMeeting?.title}</span>
              <Button
                size="sm"
                onClick={() => {
                  window.location.href = `/projects/${projectId}/chat?meeting=${selectedMeeting?.id}`;
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask AI
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedMeeting && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                {/* Summary Section */}
                {selectedMeeting.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedMeeting.summary}</p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Transcript Section */}
                {selectedMeeting.transcript ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Full Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedMeeting.transcript}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Transcript is being processed...</p>
                      <Button
                        className="mt-4"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `/api/projects/${projectId}/meetings/${selectedMeeting.id}/transcribe`,
                              { method: 'POST' }
                            );
                            if (response.ok) {
                              toast.success('Transcription completed!');
                              setTimeout(() => openMeeting(selectedMeeting.id), 1000);
                            }
                          } catch (error) {
                            toast.error('Failed to transcribe');
                          }
                        }}
                      >
                        Generate Transcript Now
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
