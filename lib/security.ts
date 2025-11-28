// lib/security.ts
import path from 'path';

export function sanitizeFilePath(filePath: string): string {
  // Prevent path traversal
  const normalized = path.normalize(filePath);
  if (normalized.includes('..')) {
    throw new Error('Invalid file path');
  }
  return normalized;
}

export function sanitizeGitUrl(url: string): string {
  const urlPattern = /^https:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+$/;
  if (!urlPattern.test(url)) {
    throw new Error('Invalid GitHub URL');
  }
  return url;
}
