import { initTRPC, TRPCError } from "@trpc/server";
import type { Context, AuthedContext } from "./context.js";

/**
 * Initialize tRPC with the context type.
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Export reusable router and procedure helpers.
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Middleware that requires the request to have a valid session/auth.
 * Throws UNAUTHORIZED error if no userId in context.
 */
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    } as AuthedContext,
  });
});
