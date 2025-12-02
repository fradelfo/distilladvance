import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';

/**
 * Context available to all tRPC procedures.
 */
export interface Context {
  prisma: typeof prisma;
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  userId?: string;
}

/**
 * Context with authenticated user (for authedProcedure).
 */
export interface AuthedContext extends Context {
  userId: string;
}

/**
 * Validate session by calling the web app's session endpoint.
 * This is the most reliable approach as it uses NextAuth's own validation.
 */
async function validateSession(
  cookieHeader: string
): Promise<{ id?: string; email?: string } | null> {
  try {
    const response = await fetch(`${env.WEB_URL}/api/auth/session`, {
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return null;
    }

    const session = (await response.json()) as {
      user?: { id?: string; email?: string };
    };

    // NextAuth returns { user: { id, email, ... } } or {} if not authenticated
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email,
      };
    }

    return null;
  } catch (error) {
    console.error('[Context] Failed to validate session:', error);
    return null;
  }
}

/**
 * Creates context for each tRPC request.
 */
export async function createContext({ req, res }: CreateExpressContextOptions): Promise<Context> {
  let userId: string | undefined;

  // Try to validate session via web app
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const session = await validateSession(cookieHeader);
    if (session?.id) {
      userId = session.id;
    }
  }

  // Fallback: check Authorization header
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      // Simple user ID from header (for extension/API clients)
      const token = authHeader.slice(7);
      // In production, validate this token properly
      userId = token;
    }
  }

  return {
    prisma,
    req,
    res,
    userId,
  };
}

export type CreateContext = typeof createContext;
