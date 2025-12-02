import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { authedProcedure, publicProcedure, router } from '../index.js';

/**
 * Collection router for managing prompt collections.
 */
export const collectionRouter = router({
  /**
   * List collections for the current user.
   */
  list: authedProcedure
    .input(
      z
        .object({
          workspaceId: z.string().optional(),
          includePublic: z.boolean().optional().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const whereClause: {
        OR?: Array<{ userId?: string; isPublic?: boolean; workspaceId?: string | null }>;
        userId?: string;
        workspaceId?: string | null;
      } = {};

      if (input?.includePublic) {
        whereClause.OR = [{ userId }, { isPublic: true }];
      } else {
        whereClause.userId = userId;
      }

      if (input?.workspaceId) {
        whereClause.workspaceId = input.workspaceId;
      }

      const collections = await ctx.prisma.collection.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { prompts: true },
          },
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return {
        success: true,
        collections: collections.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          isPublic: c.isPublic,
          workspaceId: c.workspaceId,
          promptCount: c._count.prompts,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          user: c.user,
        })),
      };
    }),

  /**
   * Get collection by ID with its prompts.
   */
  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;

    const collection = await ctx.prisma.collection.findUnique({
      where: { id: input.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        prompts: {
          include: {
            prompt: {
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
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!collection) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Collection not found',
      });
    }

    // Check access permissions
    if (!collection.isPublic && collection.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: "You don't have access to this collection",
      });
    }

    return {
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic,
        workspaceId: collection.workspaceId,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
        user: collection.user,
        isOwner: collection.userId === userId,
        prompts: collection.prompts.map((cp) => ({
          id: cp.prompt.id,
          title: cp.prompt.title,
          content: cp.prompt.content,
          tags: cp.prompt.tags,
          isPublic: cp.prompt.isPublic,
          usageCount: cp.prompt.usageCount,
          createdAt: cp.prompt.createdAt.toISOString(),
          updatedAt: cp.prompt.updatedAt.toISOString(),
          order: cp.order,
        })),
      },
    };
  }),

  /**
   * Create a new collection.
   */
  create: authedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        isPublic: z.boolean().optional().default(false),
        workspaceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      // If workspaceId is provided, verify user has access
      if (input.workspaceId) {
        const membership = await ctx.prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: input.workspaceId,
              userId,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have access to this workspace",
          });
        }
      }

      const collection = await ctx.prisma.collection.create({
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
          userId,
          workspaceId: input.workspaceId,
        },
      });

      return {
        success: true,
        collection: {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          isPublic: collection.isPublic,
          workspaceId: collection.workspaceId,
          createdAt: collection.createdAt.toISOString(),
          updatedAt: collection.updatedAt.toISOString(),
        },
      };
    }),

  /**
   * Update a collection.
   */
  update: authedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional().nullable(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      // Verify ownership
      const existing = await ctx.prisma.collection.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      if (existing.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have permission to update this collection",
        });
      }

      const { id, ...updateData } = input;
      const collection = await ctx.prisma.collection.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        collection: {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          isPublic: collection.isPublic,
          workspaceId: collection.workspaceId,
          createdAt: collection.createdAt.toISOString(),
          updatedAt: collection.updatedAt.toISOString(),
        },
      };
    }),

  /**
   * Delete a collection.
   */
  delete: authedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const userId = (ctx as { userId?: string }).userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Verify ownership
    const existing = await ctx.prisma.collection.findUnique({
      where: { id: input.id },
      select: { userId: true },
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Collection not found',
      });
    }

    if (existing.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: "You don't have permission to delete this collection",
      });
    }

    await ctx.prisma.collection.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),

  /**
   * Add a prompt to a collection.
   */
  addPrompt: authedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        promptId: z.string(),
        order: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      // Verify collection ownership
      const collection = await ctx.prisma.collection.findUnique({
        where: { id: input.collectionId },
        select: { userId: true },
      });

      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      if (collection.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have permission to modify this collection",
        });
      }

      // Verify prompt exists and user has access
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
        select: { userId: true, isPublic: true },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      if (!prompt.isPublic && prompt.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have access to this prompt",
        });
      }

      // Check if prompt is already in collection
      const existing = await ctx.prisma.collectionPrompt.findUnique({
        where: {
          collectionId_promptId: {
            collectionId: input.collectionId,
            promptId: input.promptId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Prompt is already in this collection',
        });
      }

      // Get the next order value if not provided
      let order = input.order;
      if (order === undefined) {
        const lastPrompt = await ctx.prisma.collectionPrompt.findFirst({
          where: { collectionId: input.collectionId },
          orderBy: { order: 'desc' },
        });
        order = lastPrompt ? lastPrompt.order + 1 : 0;
      }

      const collectionPrompt = await ctx.prisma.collectionPrompt.create({
        data: {
          collectionId: input.collectionId,
          promptId: input.promptId,
          order,
        },
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
              tags: true,
            },
          },
        },
      });

      return {
        success: true,
        collectionPrompt: {
          id: collectionPrompt.id,
          promptId: collectionPrompt.promptId,
          order: collectionPrompt.order,
          prompt: collectionPrompt.prompt,
        },
      };
    }),

  /**
   * Remove a prompt from a collection.
   */
  removePrompt: authedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        promptId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      // Verify collection ownership
      const collection = await ctx.prisma.collection.findUnique({
        where: { id: input.collectionId },
        select: { userId: true },
      });

      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      if (collection.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have permission to modify this collection",
        });
      }

      // Check if prompt is in collection
      const existing = await ctx.prisma.collectionPrompt.findUnique({
        where: {
          collectionId_promptId: {
            collectionId: input.collectionId,
            promptId: input.promptId,
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt is not in this collection',
        });
      }

      await ctx.prisma.collectionPrompt.delete({
        where: {
          collectionId_promptId: {
            collectionId: input.collectionId,
            promptId: input.promptId,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Reorder prompts in a collection.
   */
  reorderPrompts: authedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        promptIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as { userId?: string }).userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      // Verify collection ownership
      const collection = await ctx.prisma.collection.findUnique({
        where: { id: input.collectionId },
        select: { userId: true },
      });

      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      if (collection.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have permission to modify this collection",
        });
      }

      // Update order for each prompt
      const updates = input.promptIds.map((promptId, index) =>
        ctx.prisma.collectionPrompt.update({
          where: {
            collectionId_promptId: {
              collectionId: input.collectionId,
              promptId,
            },
          },
          data: { order: index },
        })
      );

      await ctx.prisma.$transaction(updates);

      return { success: true };
    }),
});
