/**
 * Conversation tRPC Router
 *
 * Handles conversation CRUD operations with privacy mode support.
 * Privacy modes:
 * - PROMPT_ONLY: Only store metadata, not full conversation content
 * - FULL: Store the complete conversation including rawContent
 */

import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { authedProcedure, router } from '../index.js';

// ============================================================================
// Validation Schemas
// ============================================================================

const privacyModeSchema = z.enum(['PROMPT_ONLY', 'FULL']);

const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  source: z.string().min(1, 'Source is required'), // e.g., "chatgpt", "claude", "gemini"
  sourceUrl: z.string().url().optional(),
  privacyMode: privacyModeSchema.default('PROMPT_ONLY'),
  rawContent: z.any().optional(), // JSON content of the conversation
  metadata: z.record(z.unknown()).optional(),
});

const updateConversationSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const listConversationsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  source: z.string().optional(), // Filter by source
  privacyMode: privacyModeSchema.optional(), // Filter by privacy mode
});

// ============================================================================
// Router Definition
// ============================================================================

export const conversationRouter = router({
  /**
   * Create a new conversation.
   *
   * If privacyMode is PROMPT_ONLY, rawContent will not be stored.
   * If privacyMode is FULL, rawContent will be stored.
   */
  create: authedProcedure.input(createConversationSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.userId;

    // Determine what to store based on privacy mode
    // Use Prisma.DbNull for null JSON values
    const rawContent: Prisma.InputJsonValue | typeof Prisma.DbNull =
      input.privacyMode === 'FULL' && input.rawContent
        ? (input.rawContent as Prisma.InputJsonValue)
        : Prisma.DbNull;

    const metadata: Prisma.InputJsonValue | typeof Prisma.DbNull = input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.DbNull;

    const conversation = await ctx.prisma.conversation.create({
      data: {
        userId,
        title: input.title,
        source: input.source,
        sourceUrl: input.sourceUrl || null,
        privacyMode: input.privacyMode,
        rawContent,
        metadata,
      },
      select: {
        id: true,
        title: true,
        source: true,
        sourceUrl: true,
        privacyMode: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      conversation,
    };
  }),

  /**
   * Get a conversation by ID.
   *
   * Returns rawContent only if the conversation has FULL privacy mode.
   */
  byId: authedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const userId = ctx.userId;

    const conversation = await ctx.prisma.conversation.findUnique({
      where: { id: input.id },
      include: {
        prompts: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
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

    // Only include rawContent if privacy mode is FULL
    const { rawContent, ...rest } = conversation;
    const result =
      conversation.privacyMode === 'FULL' ? conversation : { ...rest, rawContent: null };

    return {
      success: true,
      conversation: result,
    };
  }),

  /**
   * List user's conversations with pagination and filtering.
   */
  list: authedProcedure.input(listConversationsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.userId;

    const where: Record<string, unknown> = {
      userId,
    };

    // Filter by source
    if (input.source) {
      where.source = input.source;
    }

    // Filter by privacy mode
    if (input.privacyMode) {
      where.privacyMode = input.privacyMode;
    }

    const conversations = await ctx.prisma.conversation.findMany({
      where,
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        source: true,
        sourceUrl: true,
        privacyMode: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { prompts: true },
        },
      },
    });

    // Check if there are more results
    let nextCursor: string | undefined;
    if (conversations.length > input.limit) {
      const nextItem = conversations.pop();
      nextCursor = nextItem?.id;
    }

    return {
      success: true,
      conversations,
      nextCursor,
    };
  }),

  /**
   * Update a conversation.
   *
   * Note: privacyMode cannot be changed after creation to prevent
   * accidental data exposure.
   */
  update: authedProcedure.input(updateConversationSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.userId;

    // Verify ownership
    const existing = await ctx.prisma.conversation.findUnique({
      where: { id: input.id },
      select: { userId: true },
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    if (existing.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this conversation',
      });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const conversation = await ctx.prisma.conversation.update({
      where: { id: input.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        source: true,
        sourceUrl: true,
        privacyMode: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      conversation,
    };
  }),

  /**
   * Delete a conversation.
   *
   * Associated prompts will have their conversationId set to null
   * (as defined by onDelete: SetNull in schema).
   */
  delete: authedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const userId = ctx.userId;

    // Verify ownership
    const existing = await ctx.prisma.conversation.findUnique({
      where: { id: input.id },
      select: { userId: true },
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    if (existing.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this conversation',
      });
    }

    await ctx.prisma.conversation.delete({
      where: { id: input.id },
    });

    return {
      success: true,
    };
  }),

  /**
   * Get conversation statistics for the current user.
   */
  stats: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const [total, bySource, byPrivacyMode] = await Promise.all([
      ctx.prisma.conversation.count({
        where: { userId },
      }),
      ctx.prisma.conversation.groupBy({
        by: ['source'],
        where: { userId },
        _count: { source: true },
      }),
      ctx.prisma.conversation.groupBy({
        by: ['privacyMode'],
        where: { userId },
        _count: { privacyMode: true },
      }),
    ]);

    return {
      success: true,
      stats: {
        total,
        bySource: bySource.map((s) => ({
          source: s.source,
          count: s._count.source,
        })),
        byPrivacyMode: byPrivacyMode.map((p) => ({
          mode: p.privacyMode,
          count: p._count.privacyMode,
        })),
      },
    };
  }),
});
