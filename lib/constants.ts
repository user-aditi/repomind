// lib/constants.ts

/**
 * Application-wide constants
 * Centralizes all magic strings and configuration values
 */

// File Processing
export const ALLOWED_FILE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.java', '.c', '.cpp', '.h',
  '.go', '.rs', '.rb', '.php',
  '.css', '.html', '.vue', '.svelte',
  '.md', '.txt', '.json', '.yaml', '.yml',
  '.prisma', '.sql', '.sh', '.bat',
  '.kt', '.swift'
] as const;

export const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.cache',
  'vendor',
  '__pycache__'
] as const;

export const IGNORED_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env',
  '.env.local'
] as const;

// Chunking Configuration
export const CHUNK_CONFIG = {
  CODE: {
    chunkSize: 1500,
    chunkOverlap: 200,
  },
  DOCUMENTATION: {
    chunkSize: 1000,
    chunkOverlap: 100,
  },
  MEETING: {
    chunkSize: 800,
    chunkOverlap: 150,
  }
} as const;

// Vector Store
export const VECTOR_STORE_CONFIG = {
  collectionName: 'repo-code',
  similarityThreshold: 0.7,
  maxResults: 5,
} as const;

// LLM Configuration
export const LLM_CONFIG = {
  temperature: 0.3,
  maxTokens: 2000,
  topP: 0.9,
} as const;

// API Response Messages
export const API_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'Internal server error',
  SUCCESS: 'Operation completed successfully',
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '25'),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '25') * 1024 * 1024,
  allowedAudioFormats: ['.wav', '.mp3', '.m4a', '.flac', '.ogg'],
} as const;

// Whisper Configuration
export const WHISPER_CONFIG = {
  model: 'Xenova/whisper-small.en',
  sampleRate: 16000,
  bitDepth: '32f',
  language: 'en',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  SETTINGS: '/settings',
} as const;

// Database Query Limits
export const DB_LIMITS = {
  projectsPerPage: 12,
  filesPerPage: 50,
  meetingsPerPage: 20,
  recentProjectsCount: 3,
} as const;
