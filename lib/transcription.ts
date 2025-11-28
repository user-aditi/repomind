// lib/transcription.ts

import { pipeline } from '@xenova/transformers';
import { readFile } from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { join } from 'path';
import { WHISPER_CONFIG } from './constants';

// Cache the model to avoid reloading
let whisperPipeline: any = null;

/**
 * Initialize Whisper model
 */
async function getWhisperPipeline() {
  if (!whisperPipeline) {
    console.log('Loading Whisper model...');
    whisperPipeline = await pipeline(
      'automatic-speech-recognition',
      WHISPER_CONFIG.model
    );
    console.log('Whisper model loaded successfully');
  }
  return whisperPipeline;
}

/**
 * Convert audio file to WAV format using FFmpeg
 */
async function convertToWav(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioFrequency(WHISPER_CONFIG.sampleRate)
      .audioChannels(1) // Mono
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

/**
 * Transcribe audio file to text
 */
export async function transcribeAudio(
  audioPath: string
): Promise<string> {
  try {
    console.log(`Starting transcription for ${audioPath}`);
    
    // Convert to WAV if needed
    const isWav = audioPath.toLowerCase().endsWith('.wav');
    let wavPath = audioPath;
    
    if (!isWav) {
      wavPath = audioPath.replace(/\.[^.]+$/, '.wav');
      console.log('Converting audio to WAV format...');
      await convertToWav(audioPath, wavPath);
    }

    // Load the pipeline
    const transcriber = await getWhisperPipeline();

    // Read audio file
    const audioBuffer = await readFile(wavPath);

    // Transcribe
    console.log('Transcribing audio...');
    const result = await transcriber(audioBuffer, {
      language: WHISPER_CONFIG.language,
      task: 'transcribe',
      return_timestamps: true,
    });

    // Extract text from result
    const transcript = typeof result === 'string' 
      ? result 
      : result.text || JSON.stringify(result);

    console.log(`Transcription completed: ${transcript.length} characters`);
    return transcript;

  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate summary from transcript using LLM
 */
export async function generateMeetingSummary(
  transcript: string,
  llmModel?: any
): Promise<string> {
  if (!llmModel) {
    // If no LLM provided, return a simple summary
    const lines = transcript.split('\n').filter(line => line.trim());
    const preview = lines.slice(0, 5).join('\n');
    return `Meeting Summary:\n\nTotal lines: ${lines.length}\nPreview:\n${preview}...`;
  }

  try {
    const prompt = `Summarize the following meeting transcript in a concise manner. 
Include key discussion points, decisions made, and action items.

Transcript:
${transcript}

Summary:`;

    const summary = await llmModel.invoke(prompt);
    return typeof summary === 'string' ? summary : summary.text || summary.content;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Summary generation failed';
  }
}
