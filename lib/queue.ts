// lib/queue.ts

import { db } from './db';
import { transcribeAudio, generateMeetingSummary } from './transcription';
import { indexRepository } from './repo-processor';
import { ChatOllama } from '@langchain/ollama';
import { rm } from 'fs/promises';

export type JobType = 'transcription' | 'indexing';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  data: any;
  error?: string;
}

// In-memory job queue (for simple implementation)
// In production, use Redis + BullMQ
const jobQueue: Job[] = [];
const activeJobs = new Map<string, Job>();

/**
 * Add a job to the queue
 */
export function queueJob(type: JobType, data: any): string {
  const job: Job = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    status: 'pending',
    data,
  };

  jobQueue.push(job);
  console.log(`Job queued: ${job.id} (${type})`);

  // Start processing if not already running
  processNextJob();

  return job.id;
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): Job | undefined {
  return activeJobs.get(jobId) || jobQueue.find(j => j.id === jobId);
}

/**
 * Process jobs from the queue
 */
async function processNextJob() {
  if (jobQueue.length === 0) {
    return;
  }

  const job = jobQueue.shift();
  if (!job) return;

  job.status = 'processing';
  activeJobs.set(job.id, job);

  console.log(`Processing job: ${job.id} (${job.type})`);

  try {
    if (job.type === 'transcription') {
      await processTranscriptionJob(job);
    } else if (job.type === 'indexing') {
      await processIndexingJob(job);
    }

    job.status = 'completed';
    console.log(`Job completed: ${job.id}`);
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Job failed: ${job.id}`, error);
  } finally {
    // Keep in active jobs for status checking
    setTimeout(() => {
      activeJobs.delete(job.id);
    }, 5 * 60 * 1000); // Keep for 5 minutes
  }

  // Process next job
  if (jobQueue.length > 0) {
    processNextJob();
  }
}

/**
 * Process transcription job
 */
async function processTranscriptionJob(job: Job): Promise<void> {
  const { meetingId, audioPath, projectId } = job.data;

  console.log(`Transcribing meeting ${meetingId}...`);

  // Transcribe audio
  const transcript = await transcribeAudio(audioPath);

  // Generate summary
  const llm = new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    temperature: 0.3,
  });

  const summary = await generateMeetingSummary(transcript, llm);

  // Update meeting in database
  await db.meeting.update({
    where: { id: meetingId },
    data: {
      transcript,
      summary,
    },
  });

  // Clean up audio file
  try {
    await rm(audioPath, { force: true });
    console.log(`Cleaned up audio file: ${audioPath}`);
  } catch (error) {
    console.error(`Failed to clean up audio file: ${audioPath}`, error);
  }

  console.log(`Meeting ${meetingId} transcribed successfully`);
}

/**
 * Process indexing job
 */
async function processIndexingJob(job: Job): Promise<void> {
  const { projectId, githubUrl } = job.data;

  console.log(`Indexing project ${projectId}...`);

  const result = await indexRepository(projectId, githubUrl);

  if (!result.success) {
    throw new Error(result.error || 'Indexing failed');
  }

  console.log(`Project ${projectId} indexed successfully: ${result.summary}`);
}
