// lib/repo-processor.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import { rm, mkdir } from 'fs/promises';
import { join, relative, sep } from 'path';
import * as path from 'path';
import { db } from './db';
import { emitIndexingProgress } from './websocket';
import {
  getAllFiles,
  readFileContent,
  detectLanguage,
  isBinaryFile,
} from './file-utils';
import { addDocuments, deleteProjectEmbeddings } from './vector-store';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { CHUNK_CONFIG } from './constants';
import type { EmbeddingMetadata, IndexingResult } from '@/types';

const execAsync = promisify(exec);

// Helper to normalize Windows paths to DB friendly format (forward slashes)
function normalizePath(p: string): string {
  return p.split(sep).join('/');
}

// Helper to safely get relative path
function getSafeRelativePath(base: string, file: string): string {
  const rel = relative(base, file);
  return normalizePath(rel);
}

async function cloneRepository(
  githubUrl: string,
  targetPath: string
): Promise<void> {
  try {
    await rm(targetPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }

  await mkdir(join(targetPath, '..'), { recursive: true });
  console.log(`Cloning ${githubUrl} to ${targetPath}...`);
  // Quote paths for Windows
  await execAsync(`git clone "${githubUrl}" "${targetPath}"`);
}

async function getCommitHistory(repoPath: string): Promise<any[]> {
  try {
    // Windows-safe git log command
    const { stdout } = await execAsync(
      `git log -n 50 --date=iso --pretty=format:"%H|%an|%ae|%ad|%s"`,
      { cwd: repoPath }
    );

    if (!stdout.trim()) {
      console.warn('No commits found in git log output');
      return [];
    }

    return stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split('|');
        if (parts.length < 5) return null;
        
        const [hash, author, email, date] = parts;
        const message = parts.slice(4).join('|'); // Re-join message in case it had pipes

        return {
          commitHash: hash,
          commitAuthor: author,
          commitDate: new Date(date),
          commitMessage: message,
        };
      })
      .filter(Boolean); // Remove nulls
  } catch (error) {
    console.error('Error getting commit history:', error);
    return [];
  }
}

async function splitIntoChunks(
  content: string,
  fileType: 'CODE' | 'DOCUMENTATION' | 'MEETING'
): Promise<string[]> {
  const config = CHUNK_CONFIG[fileType];
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: ['\n\n', '\n', ' ', ''],
  });
  return await splitter.splitText(content);
}

async function processFile(
  filePath: string,
  repoPath: string,
  projectId: string
): Promise<Document<EmbeddingMetadata>[]> {
  if (isBinaryFile(filePath)) return [];

  const relativePath = getSafeRelativePath(repoPath, filePath);
  const content = await readFileContent(filePath);

  if (!content || content.trim().length === 0) return [];

  const extension = filePath.split('.').pop()?.toLowerCase();
  const isDocumentation = ['md', 'txt', 'rst'].includes(extension || '');
  const fileType = isDocumentation ? 'DOCUMENTATION' : 'CODE';

  const chunks = await splitIntoChunks(content, fileType);

  return chunks.map((chunk, index) => new Document({
    pageContent: chunk,
    metadata: {
      projectId,
      filePath: relativePath,
      source: 'repository',
      chunkIndex: index,
    },
  }));
}

async function saveFileToDatabase(
  filePath: string,
  repoPath: string,
  projectId: string
): Promise<void> {
  // CRITICAL FIX: Clean the path
  const relativePath = getSafeRelativePath(repoPath, filePath);
  const content = await readFileContent(filePath);
  const language = detectLanguage(filePath);
  const fileName = path.basename(filePath);

  const existing = await db.sourceCode.findFirst({
    where: {
      projectId,
      filePath: relativePath,
    },
  });

  if (existing) {
    await db.sourceCode.update({
      where: { id: existing.id },
      data: { content, language, fileName },
    });
  } else {
    await db.sourceCode.create({
      data: {
        projectId,
        fileName,
        filePath: relativePath,
        language,
        content,
      },
    });
  }
}

export async function indexRepository(
  projectId: string,
  githubUrl: string
): Promise<IndexingResult> {
  const startTime = Date.now();
  const repoPath = join(process.cwd(), 'temp', 'repos', projectId);

  try {
    console.log(`Starting indexing for ${projectId}`);
    emitIndexingProgress(projectId, { status: 'cloning', progress: 10 });
    
    await cloneRepository(githubUrl, repoPath);

    emitIndexingProgress(projectId, { status: 'processing', progress: 30 });
    const commits = await getCommitHistory(repoPath);
    console.log(`Found ${commits.length} commits`);

    for (const commit of commits) {
      await db.commit.upsert({
        where: {
          projectId_commitHash: {
            projectId,
            commitHash: commit.commitHash,
          },
        },
        update: commit,
        create: {
          ...commit,
          projectId,
        },
      });
    }

    emitIndexingProgress(projectId, { status: 'scanning', progress: 45 });
    const allFiles = await getAllFiles(repoPath);

    emitIndexingProgress(projectId, { status: 'processing', progress: 60 });
    let filesProcessed = 0;
    const allDocuments: Document<EmbeddingMetadata>[] = [];

    for (const filePath of allFiles) {
      try {
        await saveFileToDatabase(filePath, repoPath, projectId);
        const documents = await processFile(filePath, repoPath, projectId);
        allDocuments.push(...documents);
        filesProcessed++;
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    emitIndexingProgress(projectId, { status: 'clearing_embeddings', progress: 80 });
    await deleteProjectEmbeddings(projectId);

    emitIndexingProgress(projectId, { status: 'creating_embeddings', progress: 90 });
    await addDocuments(allDocuments);

    emitIndexingProgress(projectId, { status: 'cleaning', progress: 95 });
    await rm(repoPath, { recursive: true, force: true });

    const duration = (Date.now() - startTime) / 1000;
    emitIndexingProgress(projectId, { status: 'complete', progress: 100 });

    return {
      success: true,
      chunksCreated: allDocuments.length,
      filesIndexed: filesProcessed,
      summary: `Indexed ${filesProcessed} files and ${commits.length} commits`,
    };
  } catch (error) {
    console.error('Error indexing repository:', error);
    try {
      await rm(repoPath, { recursive: true, force: true });
    } catch (cleanupError) {}

    return {
      success: false,
      chunksCreated: 0,
      filesIndexed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}