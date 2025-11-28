// lib/validations.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters'),
  githubUrl: z
    .string()
    .url('Invalid URL format')
    .regex(
      /^https:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+$/,
      'Must be a valid GitHub repository URL (e.g., https://github.com/user/repo)'
    )
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  githubUrl: z
    .string()
    .url()
    .regex(/^https:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+$/)
    .optional()
});

export const chatRequestSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty'),
  fileContext: z.array(z.string()).optional(),
  meetingContext: z.array(z.string()).optional(),
  // ADDED: commitContext
  commitContext: z.array(z.string()).optional()
});