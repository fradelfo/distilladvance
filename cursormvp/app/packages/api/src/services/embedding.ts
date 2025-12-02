/**
 * Vector Embedding Service
 *
 * Generates embeddings for prompts using OpenAI's embedding API
 * and stores them in the database for semantic search.
 */

import OpenAI from 'openai';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';

// ============================================================================
// Types
// ============================================================================

export interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  error?: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
    model: string;
    provider: 'openai';
  };
  durationMs: number;
}

export interface StoredEmbedding {
  id: string;
  promptId: string;
  model: string;
  vector: number[];
  createdAt: Date;
}

export interface BatchEmbeddingResult {
  success: boolean;
  results: Array<{
    promptId: string;
    success: boolean;
    error?: string;
  }>;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  usage: {
    promptTokens: number;
    totalTokens: number;
    model: string;
    provider: 'openai';
  };
  durationMs: number;
}

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
  }
): Promise<T> {
  let lastError: Error | null = null;
  let delay = options.initialDelayMs;

  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable = isRetryableError(lastError);

      if (!isRetryable || attempt === options.maxRetries) {
        throw lastError;
      }

      // Calculate delay with jitter
      const jitter = Math.random() * 0.1 * delay;
      const actualDelay = Math.min(delay + jitter, options.maxDelayMs);

      options.onRetry?.(attempt, lastError, actualDelay);

      await sleep(actualDelay);

      // Exponential backoff
      delay = Math.min(delay * 2, options.maxDelayMs);
    }
  }

  throw lastError ?? new Error('Unknown error in retry loop');
}

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Rate limit errors
  if (message.includes('rate_limit') || message.includes('429')) {
    return true;
  }

  // Temporary server errors
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504')
  ) {
    return true;
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnreset')
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// OpenAI Client
// ============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Cost per 1K tokens for text-embedding-3-small
 * As of 2024: $0.00002 per 1K tokens
 */
const EMBEDDING_COST_PER_1K_TOKENS: Record<string, number> = {
  'text-embedding-3-small': 0.00002,
  'text-embedding-3-large': 0.00013,
  'text-embedding-ada-002': 0.0001,
};

export function estimateEmbeddingCost(tokens: number, model = 'text-embedding-3-small'): number {
  const costPer1K = EMBEDDING_COST_PER_1K_TOKENS[model] ?? 0.00002;
  return (tokens / 1000) * costPer1K;
}

// ============================================================================
// Main Embedding Functions
// ============================================================================

const DEFAULT_OPTIONS: Required<EmbeddingOptions> = {
  model: env.OPENAI_EMBEDDING_MODEL,
  dimensions: env.EMBEDDING_DIMENSIONS,
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Generate an embedding vector for the given text content.
 */
export async function generateEmbedding(
  content: string,
  options: EmbeddingOptions = {}
): Promise<EmbeddingResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate input
  if (!content || content.trim().length === 0) {
    return {
      success: false,
      error: 'Content cannot be empty',
      usage: {
        promptTokens: 0,
        totalTokens: 0,
        model: opts.model,
        provider: 'openai',
      },
      durationMs: Date.now() - startTime,
    };
  }

  try {
    const client = getOpenAIClient();

    const response = await withRetry(
      async () => {
        return client.embeddings.create({
          model: opts.model,
          input: content.trim(),
          dimensions: opts.dimensions,
        });
      },
      {
        maxRetries: opts.maxRetries,
        initialDelayMs: opts.initialDelayMs,
        maxDelayMs: opts.maxDelayMs,
        onRetry: (attempt, error, delayMs) => {
          console.warn(
            `[Embedding] Retry ${attempt}/${opts.maxRetries} after ${delayMs}ms: ${error.message}`
          );
        },
      }
    );

    const embedding = response.data[0]?.embedding;

    if (!embedding || embedding.length === 0) {
      throw new Error('No embedding data in response');
    }

    const tokens = response.usage?.prompt_tokens ?? 0;

    console.log(
      `[Embedding] Success - Model: ${opts.model}, Tokens: ${tokens}, Dimensions: ${embedding.length}`
    );

    return {
      success: true,
      embedding,
      usage: {
        promptTokens: tokens,
        totalTokens: tokens,
        model: opts.model,
        provider: 'openai',
      },
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[Embedding] Failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      usage: {
        promptTokens: 0,
        totalTokens: 0,
        model: opts.model,
        provider: 'openai',
      },
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Generate and store an embedding for a prompt.
 */
export async function embedPrompt(
  promptId: string,
  options: EmbeddingOptions = {}
): Promise<StoredEmbedding | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Fetch the prompt content
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { id: true, title: true, content: true, tags: true },
  });

  if (!prompt) {
    throw new Error(`Prompt not found: ${promptId}`);
  }

  // Combine title, content, and tags for richer embedding
  const textToEmbed = [prompt.title, prompt.content, prompt.tags.join(' ')]
    .filter(Boolean)
    .join('\n\n');

  // Generate the embedding
  const result = await generateEmbedding(textToEmbed, opts);

  if (!result.success || !result.embedding) {
    throw new Error(result.error || 'Failed to generate embedding');
  }

  // Store or update the embedding in the database
  const stored = await prisma.promptEmbedding.upsert({
    where: {
      promptId_model: {
        promptId: promptId,
        model: opts.model,
      },
    },
    create: {
      promptId: promptId,
      model: opts.model,
      vector: result.embedding,
    },
    update: {
      vector: result.embedding,
      createdAt: new Date(),
    },
  });

  return {
    id: stored.id,
    promptId: stored.promptId,
    model: stored.model,
    vector: stored.vector,
    createdAt: stored.createdAt,
  };
}

/**
 * Batch process multiple prompts to generate and store embeddings.
 */
export async function embedBatch(
  promptIds: string[],
  options: EmbeddingOptions = {}
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const batchSize = env.EMBEDDING_BATCH_SIZE;

  const results: Array<{
    promptId: string;
    success: boolean;
    error?: string;
  }> = [];

  let totalTokens = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;

  // Process in batches to avoid rate limits
  for (let i = 0; i < promptIds.length; i += batchSize) {
    const batch = promptIds.slice(i, i + batchSize);

    // Process batch concurrently
    const batchResults = await Promise.allSettled(
      batch.map(async (promptId) => {
        const prompt = await prisma.prompt.findUnique({
          where: { id: promptId },
          select: { id: true, title: true, content: true, tags: true },
        });

        if (!prompt) {
          return { promptId, success: false, error: 'Prompt not found' };
        }

        const textToEmbed = [prompt.title, prompt.content, prompt.tags.join(' ')]
          .filter(Boolean)
          .join('\n\n');

        const result = await generateEmbedding(textToEmbed, opts);

        if (!result.success || !result.embedding) {
          return {
            promptId,
            success: false,
            error: result.error || 'Failed to generate embedding',
          };
        }

        // Store the embedding
        await prisma.promptEmbedding.upsert({
          where: {
            promptId_model: {
              promptId: promptId,
              model: opts.model,
            },
          },
          create: {
            promptId: promptId,
            model: opts.model,
            vector: result.embedding,
          },
          update: {
            vector: result.embedding,
            createdAt: new Date(),
          },
        });

        totalTokens += result.usage.promptTokens;

        return { promptId, success: true };
      })
    );

    // Collect results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (result.value.success) {
          totalSuccessful++;
        } else {
          totalFailed++;
        }
      } else {
        // Handle rejected promises
        const errorMessage =
          result.reason instanceof Error ? result.reason.message : 'Unknown error';
        results.push({
          promptId: 'unknown',
          success: false,
          error: errorMessage,
        });
        totalFailed++;
      }
    }

    // Add delay between batches to avoid rate limits
    if (i + batchSize < promptIds.length) {
      await sleep(100);
    }
  }

  const durationMs = Date.now() - startTime;

  console.log(
    `[Embedding Batch] Completed - Total: ${promptIds.length}, Success: ${totalSuccessful}, Failed: ${totalFailed}, Duration: ${durationMs}ms`
  );

  return {
    success: totalFailed === 0,
    results,
    totalProcessed: promptIds.length,
    totalSuccessful,
    totalFailed,
    usage: {
      promptTokens: totalTokens,
      totalTokens: totalTokens,
      model: opts.model,
      provider: 'openai',
    },
    durationMs,
  };
}

/**
 * Get existing embedding for a prompt.
 */
export async function getEmbedding(
  promptId: string,
  model?: string
): Promise<StoredEmbedding | null> {
  const embeddingModel = model ?? env.OPENAI_EMBEDDING_MODEL;

  const embedding = await prisma.promptEmbedding.findUnique({
    where: {
      promptId_model: {
        promptId: promptId,
        model: embeddingModel,
      },
    },
  });

  if (!embedding) {
    return null;
  }

  return {
    id: embedding.id,
    promptId: embedding.promptId,
    model: embedding.model,
    vector: embedding.vector,
    createdAt: embedding.createdAt,
  };
}

/**
 * Check if a prompt has an embedding.
 */
export async function hasEmbedding(promptId: string, model?: string): Promise<boolean> {
  const embeddingModel = model ?? env.OPENAI_EMBEDDING_MODEL;

  const count = await prisma.promptEmbedding.count({
    where: {
      promptId: promptId,
      model: embeddingModel,
    },
  });

  return count > 0;
}

/**
 * Delete embedding for a prompt.
 */
export async function deleteEmbedding(promptId: string, model?: string): Promise<boolean> {
  const embeddingModel = model ?? env.OPENAI_EMBEDDING_MODEL;

  try {
    await prisma.promptEmbedding.delete({
      where: {
        promptId_model: {
          promptId: promptId,
          model: embeddingModel,
        },
      },
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Usage Logging
// ============================================================================

export interface EmbeddingUsageLogEntry {
  userId?: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  operation: string;
  metadata?: Record<string, unknown>;
}

export function createEmbeddingUsageLogEntry(
  result: EmbeddingResult | BatchEmbeddingResult,
  operation: 'embed' | 'embed_batch',
  userId?: string
): EmbeddingUsageLogEntry {
  const cost = estimateEmbeddingCost(result.usage.totalTokens, result.usage.model);

  return {
    userId,
    model: result.usage.model,
    provider: result.usage.provider,
    promptTokens: result.usage.promptTokens,
    completionTokens: 0, // Embeddings don't have completion tokens
    totalTokens: result.usage.totalTokens,
    cost,
    operation,
    metadata: {
      success: result.success,
      durationMs: result.durationMs,
      ...('totalProcessed' in result && {
        totalProcessed: result.totalProcessed,
        totalSuccessful: result.totalSuccessful,
        totalFailed: result.totalFailed,
      }),
    },
  };
}
