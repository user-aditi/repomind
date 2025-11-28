// lib/env.ts (new file)
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  OLLAMA_BASE_URL: z.string().url(),
  OLLAMA_MODEL: z.string(),
  CHROMADB_URL: z.string().url(),
  EMBEDDING_MODEL: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  MAX_FILE_SIZE_MB: z.coerce.number().positive()
});

export const env = envSchema.parse(process.env);
