/**
 * Distillation tRPC Router
 *
 * Handles AI conversation distillation and prompt saving.
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  type ConversationMessage,
  createUsageLogEntry,
  distillConversation,
} from '../../services/distillation.js';
import { authedProcedure, router } from '../index.js';

// ============================================================================
// Validation Schemas
// ============================================================================

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.string().optional(),
});

const distillInputSchema = z.object({
  messages: z
    .array(messageSchema)
    .min(1, 'At least one message is required')
    .max(100, 'Maximum 100 messages allowed'),
  source: z.string().optional(), // e.g., "chatgpt", "claude"
  sourceUrl: z.string().url().optional(),
  conversationId: z.string().optional(), // If already saved
});

const savePromptInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  template: z.string().min(1, 'Template cannot be empty'),
  variables: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      example: z.string(),
      required: z.boolean(),
    })
  ),
  tags: z.array(z.string()).max(10).optional(),
  conversationId: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const updatePromptInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  template: z.string().min(1).optional(),
  variables: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        example: z.string(),
        required: z.boolean(),
      })
    )
    .optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().optional(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const distillRouter = router({
  /**
   * Distill a conversation into a reusable prompt template.
   *
   * Takes an array of messages and returns a structured prompt
   * with title, description, template, variables, and tags.
   */
  distill: authedProcedure.input(distillInputSchema).mutation(async ({ ctx, input }) => {
    // Get user ID from context (when auth is implemented)
    const userId = (ctx as { userId?: string }).userId;

    // Convert input messages to service format
    const messages: ConversationMessage[] = input.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    // Perform distillation
    const result = await distillConversation(messages);

    // Log usage to database
    if (userId) {
      try {
        const usageEntry = createUsageLogEntry(result, userId);
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
        // Log error but don't fail the request
        console.error('[Distill] Failed to log usage:', logError);
      }
    }

    if (!result.success || !result.prompt) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: result.error || 'Failed to distill conversation',
      });
    }

    return {
      success: true,
      prompt: result.prompt,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
        estimatedCost: result.usage.estimatedCost,
        durationMs: result.durationMs,
      },
      // Include source info for potential conversation saving
      source: input.source,
      sourceUrl: input.sourceUrl,
    };
  }),

  /**
   * Save a distilled prompt to the database.
   */
  savePrompt: authedProcedure.input(savePromptInputSchema).mutation(async ({ ctx, input }) => {
    // Get user ID from context
    const userId = (ctx as { userId?: string }).userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to save prompts',
      });
    }

    // Build metadata with variables
    const metadata = {
      variables: input.variables,
      version: 1,
    };

    // Create the prompt
    const prompt = await ctx.prisma.prompt.create({
      data: {
        userId,
        conversationId: input.conversationId || null,
        title: input.title,
        content: input.template,
        distilledFrom: null, // Could store original conversation excerpt
        model: 'claude-distilled',
        tags: input.tags || [],
        isPublic: input.isPublic,
        metadata,
      },
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        metadata: true,
      },
    });

    return {
      success: true,
      prompt: {
        ...prompt,
        description: input.description,
        variables: input.variables,
      },
    };
  }),

  /**
   * Update an existing prompt.
   */
  updatePrompt: authedProcedure.input(updatePromptInputSchema).mutation(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to update prompts',
      });
    }

    // Verify ownership
    const existing = await ctx.prisma.prompt.findUnique({
      where: { id: input.id },
      select: { userId: true, metadata: true },
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Prompt not found',
      });
    }

    if (existing.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this prompt',
      });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.template !== undefined) updateData.content = input.template;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

    // Update metadata with new variables if provided
    if (input.variables !== undefined || input.description !== undefined) {
      const currentMetadata = (existing.metadata as Record<string, unknown>) || {};
      updateData.metadata = {
        ...currentMetadata,
        ...(input.variables && { variables: input.variables }),
        ...(input.description && { description: input.description }),
        version: ((currentMetadata.version as number) || 0) + 1,
      };
    }

    const updated = await ctx.prisma.prompt.update({
      where: { id: input.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        isPublic: true,
        updatedAt: true,
        metadata: true,
      },
    });

    return {
      success: true,
      prompt: updated,
    };
  }),

  /**
   * Get a prompt by ID.
   */
  getPrompt: authedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;

    const prompt = await ctx.prisma.prompt.findUnique({
      where: { id: input.id },
      include: {
        user: {
          select: { id: true, name: true },
        },
        conversation: {
          select: { id: true, title: true, source: true },
        },
      },
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

    return {
      success: true,
      prompt,
    };
  }),

  /**
   * List user's prompts with pagination.
   */
  listPrompts: authedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to list prompts',
        });
      }

      const where: Record<string, unknown> = {
        userId,
      };

      // Tag filtering
      if (input.tags && input.tags.length > 0) {
        where.tags = { hasSome: input.tags };
      }

      // Search in title
      if (input.search) {
        where.title = { contains: input.search, mode: 'insensitive' };
      }

      const prompts = await ctx.prisma.prompt.findMany({
        where,
        take: input.limit + 1, // Get one extra to check for more
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          tags: true,
          isPublic: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Check if there are more results
      let nextCursor: string | undefined;
      if (prompts.length > input.limit) {
        const nextItem = prompts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        success: true,
        prompts,
        nextCursor,
      };
    }),

  /**
   * Get prompt statistics for the current user.
   */
  stats: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view stats',
      });
    }

    const [total, byPublic] = await Promise.all([
      ctx.prisma.prompt.count({
        where: { userId },
      }),
      ctx.prisma.prompt.groupBy({
        by: ['isPublic'],
        where: { userId },
        _count: { isPublic: true },
      }),
    ]);

    return {
      success: true,
      stats: {
        total,
        publicCount: byPublic.find((p) => p.isPublic)?._count.isPublic ?? 0,
        privateCount: byPublic.find((p) => !p.isPublic)?._count.isPublic ?? 0,
      },
    };
  }),

  /**
   * Delete a prompt.
   */
  deletePrompt: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to delete prompts',
        });
      }

      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.id },
        select: { userId: true },
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
          message: 'You do not have permission to delete this prompt',
        });
      }

      await ctx.prisma.prompt.delete({
        where: { id: input.id },
      });

      return {
        success: true,
      };
    }),

  /**
   * Increment usage count for a prompt.
   */
  trackUsage: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.id },
        select: { id: true, isPublic: true, userId: true },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      await ctx.prisma.prompt.update({
        where: { id: input.id },
        data: { usageCount: { increment: 1 } },
      });

      return { success: true };
    }),

  /**
   * Increment usage count for a prompt and return the updated prompt.
   */
  incrementUsage: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      const updatedPrompt = await ctx.prisma.prompt.update({
        where: { id: input.id },
        data: { usageCount: { increment: 1 } },
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          isPublic: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedPrompt;
    }),

  /**
   * Distill a saved conversation into a prompt.
   *
   * This fetches a conversation from the database, extracts its messages,
   * distills them into a prompt, and saves the prompt linked to the conversation.
   */
  distillFromConversation: authedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to distill conversations',
        });
      }

      // Fetch the conversation
      const conversation = await ctx.prisma.conversation.findUnique({
        where: { id: input.conversationId },
        select: {
          id: true,
          userId: true,
          title: true,
          source: true,
          sourceUrl: true,
          privacyMode: true,
          rawContent: true,
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }

      // Verify ownership
      if (conversation.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this conversation',
        });
      }

      // Check privacy mode
      if (conversation.privacyMode !== 'FULL') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            "Cannot distill this conversation. Only conversations saved in 'Full' privacy mode can be distilled.",
        });
      }

      // Check for raw content
      if (!conversation.rawContent) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Conversation has no content to distill',
        });
      }

      // Extract messages from rawContent
      const rawMessages = conversation.rawContent as Array<{
        role: string;
        content: string;
      }>;

      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Conversation has no valid messages to distill',
        });
      }

      // Convert to ConversationMessage format
      const messages: ConversationMessage[] = rawMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Perform distillation
      const result = await distillConversation(messages);

      // Log usage
      try {
        const usageEntry = createUsageLogEntry(result, userId);
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
        console.error('[Distill] Failed to log usage:', logError);
      }

      if (!result.success || !result.prompt) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error || 'Failed to distill conversation',
        });
      }

      // Save the prompt with conversationId link
      // Convert variables to plain JSON to satisfy Prisma's type requirements
      const variablesJson = (result.prompt.variables || []).map((v) => ({
        name: v.name,
        description: v.description,
        example: v.example,
        required: v.required,
      }));

      const savedPrompt = await ctx.prisma.prompt.create({
        data: {
          userId,
          conversationId: conversation.id,
          title: result.prompt.title,
          content: result.prompt.template,
          distilledFrom: null,
          model: 'claude-distilled',
          tags: result.prompt.tags || [],
          isPublic: false,
          metadata: {
            variables: variablesJson,
            version: 1,
            distilledFrom: {
              conversationId: conversation.id,
              source: conversation.source,
            },
          },
        },
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        promptId: savedPrompt.id,
        prompt: {
          ...savedPrompt,
          description: result.prompt.description,
          variables: result.prompt.variables,
        },
        usage: {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          estimatedCost: result.usage.estimatedCost,
          durationMs: result.durationMs,
        },
      };
    }),
});
