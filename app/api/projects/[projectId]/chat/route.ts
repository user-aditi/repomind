// app/api/projects/[projectId]/chat/route.ts

import { db } from '@/lib/db';
import { searchDocuments } from '@/lib/vector-store';
import {
  withErrorHandling,
  requireAuth,
  createResponse,
  createErrorResponse,
  validateProjectOwnership,
} from '@/lib/api-utils';
import { chatRequestSchema } from '@/lib/validations';
import { LLM_CONFIG, VECTOR_STORE_CONFIG } from '@/lib/constants';
import { ChatOllama } from '@langchain/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import type { PageProps } from '@/types';

export const POST = withErrorHandling(
  async (req: Request, { params }: PageProps<{ projectId: string }>) => {
    console.log("1. Chat request received");
    const session = await requireAuth();
    const { projectId } = await params;

    // Validate ownership
    await validateProjectOwnership(projectId, session.user.id, db);

    // Parse and validate request
    const body = await req.json();
    const validation = chatRequestSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.issues[0].message, 400);
    }

    const { question, fileContext, commitContext } = validation.data;
    console.log("2. Validated request. Question:", question);

    // 1. Search for relevant code chunks (Vector Search)
    const filter = fileContext && fileContext.length > 0
      ? { filePath: { $in: fileContext } }
      : undefined;

    console.log("3. Starting Vector Search...");
    const results = await searchDocuments(question, projectId, {
      k: VECTOR_STORE_CONFIG.maxResults,
      filter,
    });
    console.log(`4. Vector Search Complete. Found ${results.length} chunks.`);

    // 2. Fetch Explicit Commit Context (Database Query)
    let explicitCommitContext = '';
    if (commitContext && commitContext.length > 0) {
        console.log("5. Fetching Commit Context...");
        const commits = await db.commit.findMany({
            where: {
                id: { in: commitContext },
                projectId: projectId
            }
        });
        
        if (commits.length > 0) {
            explicitCommitContext = `
--- SELECTED COMMITS (High Priority Context) ---
${commits.map(c => `
Commit: ${c.commitHash.substring(0, 7)}
Author: ${c.commitAuthor}
Date: ${c.commitDate.toISOString()}
Message: ${c.commitMessage}
`).join('\n')}
------------------------------------------------
`;
        }
    }

    // 3. Format context
    const vectorContext = results
      .map((doc, idx) => {
        const filePath = doc.metadata.filePath || 'unknown';
        return `--- File: ${filePath} ---\n${doc.pageContent}`;
      })
      .join('\n\n');

    const finalContext = `${explicitCommitContext}\n\n${vectorContext}`;

    // 4. Build prompt
    const prompt = PromptTemplate.fromTemplate(`
You are an expert code assistant helping developers understand their codebase.

Context provided:
{context}

User Question: {question}

Instructions:
- If "SELECTED COMMITS" are provided above, prioritize them to explain *why* changes were made.
- Reference specific file names and commit messages when relevant.
- If the context doesn't contain enough information, say so.
- Format code snippets with markdown.
- Be helpful and precise.

Answer:`);

    // Initialize LLM
    const model = new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      temperature: LLM_CONFIG.temperature,
    });

    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    console.log("6. Sending prompt to LLM (This might take time)...");
    
    // Generate answer
    const answer = await chain.invoke({
      context: finalContext || 'No relevant code found.',
      question,
    });

    console.log("7. LLM Response received");

    // Extract sources
    const sources = results.map(doc => ({
      filePath: doc.metadata.filePath || 'unknown',
      content: doc.pageContent.substring(0, 200) + '...',
      relevanceScore: 0.8, 
    }));

    return createResponse({
      answer: answer.trim(),
      sources,
    });
  }
);