/**
 * Embedding tRPC Router
 *
 * Handles vector embedding generation and retrieval for prompts.
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '../../lib/env.js';
import {
  createEmbeddingUsageLogEntry,
  deleteEmbedding,
  embedBatch,
  embedPrompt,
  generateEmbedding,
  getEmbedding,
  hasEmbedding,
} from '../../services/embedding.js';
import { authedProcedure, router } from '../index.js';

// ============================================================================
// Validation Schemas
// ============================================================================

const embedPromptInputSchema = z.object({
  promptId: z.string().min(1, 'Prompt ID is required'),
  model: z.string().optional(),
  dimensions: z.number().positive().optional(),
});

const embedBatchInputSchema = z.object({
  promptIds: z
    .array(z.string().min(1))
    .min(1, 'At least one prompt ID is required')
    .max(100, 'Maximum 100 prompts per batch'),
  model: z.string().optional(),
  dimensions: z.number().positive().optional(),
});

const getEmbeddingInputSchema = z.object({
  promptId: z.string().min(1, 'Prompt ID is required'),
  model: z.string().optional(),
});

const generateEmbeddingInputSchema = z.object({
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
  model: z.string().optional(),
  dimensions: z.number().positive().optional(),
});

const semanticSearchInputSchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000, 'Query too long'),
  limit: z.number().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  workspaceId: z.string().optional(),
  includePublic: z.boolean().default(true),
});

// ============================================================================
// Vector Math Helpers
// ============================================================================

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ============================================================================
// Router Definition
// ============================================================================

export const embeddingRouter = router({
  /**
   * Generate and store an embedding for a single prompt.
   *
   * This will fetch the prompt content, generate an embedding using OpenAI,
   * and store the result in the PromptEmbedding table.
   */
  embedPrompt: authedProcedure.input(embedPromptInputSchema).mutation(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;

    // Verify the prompt exists and user has access
    const prompt = await ctx.prisma.prompt.findUnique({
      where: { id: input.promptId },
      select: { id: true, userId: true, isPublic: true },
    });

    if (!prompt) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Prompt not found',
      });
    }

    // Check access - user owns it or it's public
    if (prompt.userId !== userId && !prompt.isPublic) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this prompt',
      });
    }

    try {
      const startTime = Date.now();
      const result = await embedPrompt(input.promptId, {
        model: input.model,
        dimensions: input.dimensions,
      });

      if (!result) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate embedding',
        });
      }

      // Log usage to database
      if (userId) {
        try {
          await ctx.prisma.aiUsageLog.create({
            data: {
              userId,
              model: input.model ?? env.OPENAI_EMBEDDING_MODEL,
              provider: 'openai',
              promptTokens: 0, // Will be updated when we track tokens properly
              completionTokens: 0,
              totalTokens: 0,
              cost: 0,
              operation: 'embed',
              metadata: {
                promptId: input.promptId,
                durationMs: Date.now() - startTime,
              },
            },
          });
        } catch (logError) {
          console.error('[Embedding] Failed to log usage:', logError);
        }
      }

      return {
        success: true,
        embedding: {
          id: result.id,
          promptId: result.promptId,
          model: result.model,
          dimensions: result.vector.length,
          createdAt: result.createdAt,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to generate embedding: ${message}`,
      });
    }
  }),

  /**
   * Generate and store embeddings for multiple prompts.
   *
   * Processes prompts in batches to respect rate limits.
   * Returns detailed results for each prompt.
   */
  embedBatch: authedProcedure.input(embedBatchInputSchema).mutation(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to batch embed prompts',
      });
    }

    // Verify all prompts exist and user has access
    const prompts = await ctx.prisma.prompt.findMany({
      where: {
        id: { in: input.promptIds },
        OR: [{ userId: userId }, { isPublic: true }],
      },
      select: { id: true },
    });

    const accessibleIds = new Set(prompts.map((p) => p.id));
    const inaccessibleIds = input.promptIds.filter((id) => !accessibleIds.has(id));

    if (inaccessibleIds.length > 0) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You do not have access to some prompts: ${inaccessibleIds.slice(0, 3).join(', ')}${inaccessibleIds.length > 3 ? '...' : ''}`,
      });
    }

    try {
      const result = await embedBatch(input.promptIds, {
        model: input.model,
        dimensions: input.dimensions,
      });

      // Log usage to database
      try {
        const usageEntry = createEmbeddingUsageLogEntry(result, 'embed_batch', userId);
        await ctx.prisma.aiUsageLog.create({
          data: {
            userId: usageEntry.userId,
            model: usageEntry.model,
            provider: usageEntry.provider,
            promptTokens: usageEntry.promptTokens,
            completionTokens: usageEntry.completionTokens,
            totalTokens: usageEntry.totalTokens,
            cost: usageEntry.cost,
            operation: usageEntry.operation,
            metadata: usageEntry.metadata as object,
          },
        });
      } catch (logError) {
        console.error('[Embedding Batch] Failed to log usage:', logError);
      }

      return {
        success: result.success,
        results: result.results,
        summary: {
          totalProcessed: result.totalProcessed,
          totalSuccessful: result.totalSuccessful,
          totalFailed: result.totalFailed,
          durationMs: result.durationMs,
        },
        usage: {
          model: result.usage.model,
          totalTokens: result.usage.totalTokens,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to batch embed prompts: ${message}`,
      });
    }
  }),

  /**
   * Retrieve an existing embedding for a prompt.
   *
   * Returns the embedding vector if it exists, or null if not found.
   * Note: The full vector is returned - consider adding pagination
   * or limiting dimensions for large vectors in production.
   */
  getEmbedding: authedProcedure.input(getEmbeddingInputSchema).query(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;

    // Verify the prompt exists and user has access
    const prompt = await ctx.prisma.prompt.findUnique({
      where: { id: input.promptId },
      select: { id: true, userId: true, isPublic: true },
    });

    if (!prompt) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Prompt not found',
      });
    }

    // Check access
    if (prompt.userId !== userId && !prompt.isPublic) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this prompt',
      });
    }

    const embedding = await getEmbedding(input.promptId, input.model);

    if (!embedding) {
      return {
        success: true,
        embedding: null,
        exists: false,
      };
    }

    return {
      success: true,
      embedding: {
        id: embedding.id,
        promptId: embedding.promptId,
        model: embedding.model,
        dimensions: embedding.vector.length,
        vector: embedding.vector,
        createdAt: embedding.createdAt,
      },
      exists: true,
    };
  }),

  /**
   * Check if a prompt has an embedding.
   *
   * Lightweight check without retrieving the full vector.
   */
  hasEmbedding: authedProcedure.input(getEmbeddingInputSchema).query(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;

    // Verify the prompt exists and user has access
    const prompt = await ctx.prisma.prompt.findUnique({
      where: { id: input.promptId },
      select: { id: true, userId: true, isPublic: true },
    });

    if (!prompt) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Prompt not found',
      });
    }

    // Check access
    if (prompt.userId !== userId && !prompt.isPublic) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this prompt',
      });
    }

    const exists = await hasEmbedding(input.promptId, input.model);

    return {
      success: true,
      exists,
      promptId: input.promptId,
      model: input.model ?? env.OPENAI_EMBEDDING_MODEL,
    };
  }),

  /**
   * Delete an embedding for a prompt.
   */
  deleteEmbedding: authedProcedure
    .input(getEmbeddingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to delete embeddings',
        });
      }

      // Verify the prompt exists and user owns it
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
        select: { id: true, userId: true },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      if (prompt.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this embedding',
        });
      }

      const deleted = await deleteEmbedding(input.promptId, input.model);

      return {
        success: deleted,
        message: deleted ? 'Embedding deleted successfully' : 'No embedding found to delete',
      };
    }),

  /**
   * Generate an embedding for arbitrary text content.
   *
   * This does NOT store the embedding - useful for search queries
   * or testing. The embedding is returned directly.
   */
  generateEmbedding: authedProcedure
    .input(generateEmbeddingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      try {
        const result = await generateEmbedding(input.content, {
          model: input.model,
          dimensions: input.dimensions,
        });

        // Log usage to database
        if (userId) {
          try {
            const usageEntry = createEmbeddingUsageLogEntry(result, 'embed', userId);
            await ctx.prisma.aiUsageLog.create({
              data: {
                userId: usageEntry.userId,
                model: usageEntry.model,
                provider: usageEntry.provider,
                promptTokens: usageEntry.promptTokens,
                completionTokens: usageEntry.completionTokens,
                totalTokens: usageEntry.totalTokens,
                cost: usageEntry.cost,
                operation: 'embed_query',
                metadata: {
                  contentLength: input.content.length,
                  durationMs: result.durationMs,
                },
              },
            });
          } catch (logError) {
            console.error('[Embedding] Failed to log usage:', logError);
          }
        }

        if (!result.success || !result.embedding) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'Failed to generate embedding',
          });
        }

        return {
          success: true,
          embedding: result.embedding,
          dimensions: result.embedding.length,
          usage: {
            model: result.usage.model,
            tokens: result.usage.totalTokens,
          },
          durationMs: result.durationMs,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to generate embedding: ${message}`,
        });
      }
    }),

  /**
   * Get embedding statistics for a user.
   */
  getStats: authedProcedure.query(async ({ ctx }) => {
    const userId = (ctx as { userId?: string }).userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view stats',
      });
    }

    // Count user's prompts and embedded prompts
    const [totalPrompts, embeddedPrompts, recentUsage] = await Promise.all([
      ctx.prisma.prompt.count({
        where: { userId },
      }),
      ctx.prisma.promptEmbedding.count({
        where: {
          prompt: { userId },
        },
      }),
      ctx.prisma.aiUsageLog.aggregate({
        where: {
          userId,
          operation: { in: ['embed', 'embed_batch', 'embed_query'] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: {
          totalTokens: true,
          cost: true,
        },
        _count: true,
      }),
    ]);

    return {
      success: true,
      stats: {
        totalPrompts,
        embeddedPrompts,
        embeddingCoverage:
          totalPrompts > 0 ? Math.round((embeddedPrompts / totalPrompts) * 100) : 0,
        last30Days: {
          operations: recentUsage._count,
          totalTokens: recentUsage._sum.totalTokens ?? 0,
          estimatedCost: recentUsage._sum.cost ?? 0,
        },
      },
    };
  }),

  /**
   * Semantic search for similar prompts.
   *
   * Takes a natural language query, generates an embedding,
   * and finds the most similar prompts using cosine similarity.
   */
  search: authedProcedure.input(semanticSearchInputSchema).mutation(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;
    const startTime = Date.now();

    // Generate embedding for the search query
    const queryResult = await generateEmbedding(input.query);

    if (!queryResult.success || !queryResult.embedding) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: queryResult.error || 'Failed to generate query embedding',
      });
    }

    const queryVector = queryResult.embedding;

    // Build where clause for accessible prompts
    const accessConditions: Array<{ userId?: string; isPublic?: boolean; workspaceId?: string }> =
      [];

    if (userId) {
      accessConditions.push({ userId });
    }

    if (input.includePublic) {
      accessConditions.push({ isPublic: true });
    }

    if (input.workspaceId) {
      accessConditions.push({ workspaceId: input.workspaceId });
    }

    // Fetch all embeddings for accessible prompts
    const embeddings = await ctx.prisma.promptEmbedding.findMany({
      where: {
        prompt: {
          OR: accessConditions.length > 0 ? accessConditions : [{ isPublic: true }],
        },
      },
      include: {
        prompt: {
          select: {
            id: true,
            title: true,
            content: true,
            tags: true,
            isPublic: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate similarity scores
    const scoredResults = embeddings
      .map((emb) => ({
        prompt: emb.prompt,
        similarity: cosineSimilarity(queryVector, emb.vector),
        embeddingId: emb.id,
        model: emb.model,
      }))
      .filter((r) => r.similarity >= input.threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, input.limit);

    const durationMs = Date.now() - startTime;

    // Log search usage
    if (userId) {
      try {
        await ctx.prisma.aiUsageLog.create({
          data: {
            userId,
            model: queryResult.usage.model,
            provider: 'openai',
            promptTokens: queryResult.usage.promptTokens,
            completionTokens: 0,
            totalTokens: queryResult.usage.totalTokens,
            cost: 0,
            operation: 'semantic_search',
            metadata: {
              query: input.query.slice(0, 100),
              resultsCount: scoredResults.length,
              threshold: input.threshold,
              durationMs,
            },
          },
        });
      } catch (logError) {
        console.error('[Semantic Search] Failed to log usage:', logError);
      }
    }

    return {
      success: true,
      results: scoredResults.map((r) => ({
        prompt: {
          id: r.prompt.id,
          title: r.prompt.title,
          content: r.prompt.content.slice(0, 200) + (r.prompt.content.length > 200 ? '...' : ''),
          tags: r.prompt.tags,
          isPublic: r.prompt.isPublic,
          createdAt: r.prompt.createdAt,
          author: r.prompt.user?.name ?? 'Unknown',
          isOwner: r.prompt.userId === userId,
        },
        similarity: Math.round(r.similarity * 1000) / 1000,
      })),
      meta: {
        query: input.query,
        totalCandidates: embeddings.length,
        resultsReturned: scoredResults.length,
        threshold: input.threshold,
        durationMs,
      },
    };
  }),

  /**
   * Find prompts similar to a given prompt.
   *
   * Uses the prompt's existing embedding to find similar prompts.
   */
  findSimilar: authedProcedure
    .input(
      z.object({
        promptId: z.string().min(1, 'Prompt ID is required'),
        limit: z.number().min(1).max(20).default(5),
        threshold: z.number().min(0).max(1).default(0.75),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      // Get the source prompt's embedding
      const sourceEmbedding = await ctx.prisma.promptEmbedding.findFirst({
        where: { promptId: input.promptId },
        include: {
          prompt: {
            select: { userId: true, isPublic: true },
          },
        },
      });

      if (!sourceEmbedding) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt embedding not found. Generate an embedding first.',
        });
      }

      // Check access
      if (sourceEmbedding.prompt.userId !== userId && !sourceEmbedding.prompt.isPublic) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this prompt',
        });
      }

      const sourceVector = sourceEmbedding.vector;

      // Fetch embeddings for comparison (exclude the source prompt)
      const embeddings = await ctx.prisma.promptEmbedding.findMany({
        where: {
          promptId: { not: input.promptId },
          prompt: {
            OR: [{ userId: userId ?? undefined }, { isPublic: true }],
          },
        },
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
              content: true,
              tags: true,
              isPublic: true,
              userId: true,
            },
          },
        },
      });

      // Calculate and sort by similarity
      const similar = embeddings
        .map((emb) => ({
          prompt: emb.prompt,
          similarity: cosineSimilarity(sourceVector, emb.vector),
        }))
        .filter((r) => r.similarity >= input.threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, input.limit);

      return {
        success: true,
        sourcePromptId: input.promptId,
        similar: similar.map((r) => ({
          prompt: {
            id: r.prompt.id,
            title: r.prompt.title,
            content: r.prompt.content.slice(0, 150) + (r.prompt.content.length > 150 ? '...' : ''),
            tags: r.prompt.tags,
            isPublic: r.prompt.isPublic,
            isOwner: r.prompt.userId === userId,
          },
          similarity: Math.round(r.similarity * 1000) / 1000,
        })),
      };
    }),
});
