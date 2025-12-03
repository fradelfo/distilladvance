import Redis from 'ioredis';
import { env } from './env.js';

/**
 * Redis Client singleton to prevent multiple instances during development.
 * In development, we store the client on globalThis to survive hot reloads.
 */

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/**
 * Create Redis client with connection handling.
 * Returns null if REDIS_URL is not configured.
 */
function createRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    console.warn('[Redis] REDIS_URL not configured, caching disabled');
    return null;
  }

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('close', () => {
    console.log('[Redis] Connection closed');
  });

  return client;
}

export const redis: Redis | null =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis;
}

/**
 * Check if Redis is available and connected.
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Graceful shutdown handler for Redis client.
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
  }
}
