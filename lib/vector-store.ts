// lib/vector-store.ts

import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OllamaEmbeddings } from '@langchain/ollama';
import { Document } from '@langchain/core/documents';
import { VECTOR_STORE_CONFIG } from './constants';
import type { EmbeddingMetadata } from '@/types';

let vectorStoreInstance: Chroma | null = null;

// Simple in-memory cache for search results
const searchCache = new Map<string, { results: Array<Document & { metadata: EmbeddingMetadata }>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const makeCacheKey = (projectId: string, query: string, options?: { k?: number; filter?: Record<string, any> }) => {
  const filterKey = options?.filter ? JSON.stringify(options.filter) : '';
  const kKey = options?.k ?? '';
  return `${projectId}::${query}::k=${kKey}::f=${filterKey}`;
};

const clearCacheForProject = (projectId: string) => {
  for (const key of Array.from(searchCache.keys())) {
    if (key.startsWith(`${projectId}::`)) {
      searchCache.delete(key);
    }
  }
};

/**
 * Get or create vector store instance (singleton pattern)
 */
export async function getVectorStore(): Promise<Chroma> {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  });

  vectorStoreInstance = await Chroma.fromExistingCollection(embeddings, {
    collectionName: VECTOR_STORE_CONFIG.collectionName,
    url: process.env.CHROMADB_URL || 'http://localhost:8000',
  });

  return vectorStoreInstance;
}

/**
 * Create embeddings for documents and store them
 */
export async function addDocuments(
  documents: Document<EmbeddingMetadata>[]
): Promise<void> {
  if (documents.length === 0) {
    return;
  }

  const vectorStore = await getVectorStore();
  
  // Add documents in batches to avoid overwhelming the system
  const batchSize = 50;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    await vectorStore.addDocuments(batch);
    console.log(`Added batch ${i / batchSize + 1}, documents ${i + 1}-${Math.min(i + batchSize, documents.length)}`);
  }
  // Invalidate cache for affected projects (best-effort)
  // Documents may contain metadata.projectId
  const projectIds = new Set<string>();
  for (const doc of documents) {
    if (doc.metadata?.projectId) projectIds.add(doc.metadata.projectId);
  }
  for (const pid of projectIds) clearCacheForProject(pid);
}

/**
 * Search for similar documents
 * Returns documents with proper type casting
 */
export async function searchDocuments(
  query: string,
  projectId: string,
  options?: {
    k?: number;
    filter?: Record<string, any>;
  }
): Promise<Array<Document & { metadata: EmbeddingMetadata }>> {
  // Try cache first
  const cacheKey = makeCacheKey(projectId, query, options);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }

  const vectorStore = await getVectorStore();
  const filter = {
    projectId,
    ...options?.filter,
  };

  const results = await vectorStore.similaritySearch(
    query,
    options?.k || VECTOR_STORE_CONFIG.maxResults,
    filter
  );

  // Cast results to proper type
  const typed = results as Array<Document & { metadata: EmbeddingMetadata }>;

  // Cache results
  try {
    searchCache.set(cacheKey, { results: typed, timestamp: Date.now() });
  } catch (e) {
    // ignore cache errors
  }

  return typed;
}

/**
 * Delete all embeddings for a project
 */
export async function deleteProjectEmbeddings(projectId: string): Promise<void> {
  const vectorStore = await getVectorStore();
  
  try {
    // Query all documents for this project
    const results = await vectorStore.similaritySearch(
      '', // Empty query to get all
      1000, // Large number to get all
      { projectId }
    );

    // Extract IDs and delete
    const ids = results
      .map(doc => (doc.metadata as any).id)
      .filter(Boolean) as string[];

    if (ids.length > 0) {
      await vectorStore.delete({ ids });
      console.log(`Deleted ${ids.length} embeddings for project ${projectId}`);
    }
  } catch (error) {
    console.error('Error deleting project embeddings:', error);
    throw error;
  }
  // Invalidate cache for this project
  clearCacheForProject(projectId);
}

/**
 * Delete embeddings for specific files
 */
export async function deleteFileEmbeddings(
  projectId: string,
  filePaths: string[]
): Promise<void> {
  const vectorStore = await getVectorStore();

  for (const filePath of filePaths) {
    try {
      const results = await vectorStore.similaritySearch(
        '',
        1000,
        { projectId, filePath }
      );

      const ids = results
        .map(doc => (doc.metadata as any).id)
        .filter(Boolean) as string[];

      if (ids.length > 0) {
        await vectorStore.delete({ ids });
        console.log(`Deleted ${ids.length} embeddings for file ${filePath}`);
      }
    } catch (error) {
      console.error(`Error deleting embeddings for file ${filePath}:`, error);
    }
  }
  // Invalidate cache for the project
  clearCacheForProject(projectId);
}

/**
 * Initialize vector store (create collection if it doesn't exist)
 */
export async function initializeVectorStore(): Promise<void> {
  try {
    const embeddings = new OllamaEmbeddings({
      model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    });

    // Try to create new collection (will use existing if already present)
    vectorStoreInstance = await Chroma.fromDocuments(
      [], // Empty documents array
      embeddings,
      {
        collectionName: VECTOR_STORE_CONFIG.collectionName,
        url: process.env.CHROMADB_URL || 'http://localhost:8000',
      }
    );

    console.log('Vector store initialized successfully');
  } catch (error) {
    console.error('Error initializing vector store:', error);
    throw error;
  }
}
