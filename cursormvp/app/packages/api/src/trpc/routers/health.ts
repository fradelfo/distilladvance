import { publicProcedure, router } from "../index.js";

/**
 * Health check router for monitoring and debugging.
 */
export const healthRouter = router({
  /**
   * Basic health check endpoint.
   */
  check: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Database connectivity check.
   */
  db: publicProcedure.query(async ({ ctx }) => {
    try {
      // Simple query to verify database connection
      await ctx.prisma.$queryRaw`SELECT 1`;
      return {
        status: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }),
});
