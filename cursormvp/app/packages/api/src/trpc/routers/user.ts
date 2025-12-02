import { z } from 'zod';
import { publicProcedure, router } from '../index.js';

/**
 * User router for user-related operations.
 */
export const userRouter = router({
  /**
   * Get all users (for testing - remove or protect in production).
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      take: 10,
    });
    return users;
  }),

  /**
   * Get a user by ID.
   */
  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });
    return user;
  }),

  /**
   * Get user stats (prompts count, conversations count, etc.).
   */
  stats: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ ctx, input }) => {
    const [promptsCount, conversationsCount, collectionsCount] = await Promise.all([
      ctx.prisma.prompt.count({ where: { userId: input.userId } }),
      ctx.prisma.conversation.count({ where: { userId: input.userId } }),
      ctx.prisma.collection.count({ where: { userId: input.userId } }),
    ]);

    return {
      prompts: promptsCount,
      conversations: conversationsCount,
      collections: collectionsCount,
    };
  }),
});
