// lib/file-utils.ts

import { ALLOWED_FILE_EXTENSIONS, IGNORED_DIRECTORIES, IGNORED_FILES } from './constants';
import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, extname } from 'path';

export async function getAllFiles(
  dirPath: string,
  arrayOfFiles: string[] = []
): Promise<string[]> {
  const files = await readdir(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      // Skip ignored directories - use type assertion
      if ((IGNORED_DIRECTORIES as readonly string[]).includes(file)) {
        continue;
      }
      arrayOfFiles = await getAllFiles(filePath, arrayOfFiles);
    } else {
      // Skip ignored files - use type assertion
      if ((IGNORED_FILES as readonly string[]).includes(file)) {
        continue;
      }

      // Check if file extension is allowed - use type assertion
      const ext = extname(file);
      if ((ALLOWED_FILE_EXTENSIONS as readonly string[]).includes(ext)) {
        arrayOfFiles.push(filePath);
      }
    }
  }

  return arrayOfFiles;
}

export function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  
  const languageMap: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript React',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript React',
    '.py': 'Python',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.h': 'C/C++ Header',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.css': 'CSS',
    '.html': 'HTML',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.md': 'Markdown',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.prisma': 'Prisma',
    '.sql': 'SQL',
    '.sh': 'Shell',
    '.bat': 'Batch',
    '.kt': 'Kotlin',
    '.swift': 'Swift',
  };

  return languageMap[ext] || 'Unknown';
}

export async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

export function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico',
    '.pdf', '.zip', '.tar', '.gz', '.rar',
    '.exe', '.dll', '.so', '.dylib',
    '.woff', '.woff2', '.ttf', '.eot',
  ];

  const ext = extname(filePath).toLowerCase();
  return binaryExtensions.includes(ext);
}

export function getRelativePath(basePath: string, filePath: string): string {
  return relative(basePath, filePath);
}
