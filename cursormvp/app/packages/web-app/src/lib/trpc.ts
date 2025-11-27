/**
 * tRPC Client Setup
 *
 * Configures the tRPC client for connecting to the API server
 * with React Query integration for data fetching and caching.
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@distill/api';

/**
 * tRPC React hooks for type-safe API calls.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get the API base URL based on environment.
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser - use relative URL or environment variable
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  // Server-side - use environment variable
  return process.env.API_URL || 'http://localhost:3001';
}

/**
 * Create tRPC client configuration.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/trpc`,
        // Include credentials for auth cookies
        fetch(url: URL | RequestInfo, options?: RequestInit) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
      }),
    ],
  });
}

/**
 * Type helper for inferring router types.
 */
export type { AppRouter };
