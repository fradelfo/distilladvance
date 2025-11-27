import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { prisma } from "../lib/prisma.js";

/**
 * Context available to all tRPC procedures.
 */
export interface Context {
  prisma: typeof prisma;
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  userId?: string;
}

/**
 * Context with authenticated user (for authedProcedure).
 */
export interface AuthedContext extends Context {
  userId: string;
}

/**
 * Creates context for each tRPC request.
 * This is where you'd add authentication, session data, etc.
 */
export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<Context> {
  // TODO: Extract userId from session/JWT when auth is fully implemented
  // For now, check for a simple auth header or cookie
  const authHeader = req.headers.authorization;
  let userId: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    // TODO: Validate JWT and extract userId
    // For now, this is a placeholder
  }

  return {
    prisma,
    req,
    res,
    userId,
  };
}

export type CreateContext = typeof createContext;
