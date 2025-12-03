import { redis, isRedisAvailable } from './redis.js';

/**
 * Cache configuration defaults
 */
export const CACHE_TTL = {
  /** Short-lived cache (1 minute) - for frequently changing data */
  SHORT: 60,
  /** Medium cache (5 minutes) - for search results */
  MEDIUM: 300,
  /** Long cache (15 minutes) - for rarely changing data */
  LONG: 900,
  /** User stats cache (1 minute) */
  STATS: 60,
  /** Search results cache (5 minutes) */
  SEARCH: 300,
} as const;

/**
 * Cache key prefixes for namespacing
 */
export const CACHE_PREFIX = {
  SEARCH: 'search:',
  STATS: 'stats:',
  USER: 'user:',
  PROMPT: 'prompt:',
  WORKSPACE: 'workspace:',
} as const;

/**
 * Generate a cache key from prefix and identifiers
 */
export function cacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}${parts.join(':')}`;
}

/**
 * Get a value from cache
 * @returns The cached value or null if not found/expired
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return null;
  }
}

/**
 * Set a value in cache with TTL
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttl - Time to live in seconds (default: 5 minutes)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
    return true;
  } catch (error) {
    console.error('[Cache] Set error:', error);
    return false;
  }
}

/**
 * Delete a specific cache key
 */
export async function cacheDelete(key: string): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('[Cache] Delete error:', error);
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 * @param pattern - Pattern to match (e.g., "search:user123:*")
 */
export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  if (!redis) return false;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('[Cache] Delete pattern error:', error);
    return false;
  }
}

/**
 * Invalidate all caches for a user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    cacheDeletePattern(`${CACHE_PREFIX.STATS}${userId}:*`),
    cacheDeletePattern(`${CACHE_PREFIX.SEARCH}${userId}:*`),
    cacheDeletePattern(`${CACHE_PREFIX.USER}${userId}:*`),
  ]);
}

/**
 * Invalidate search caches for a user (called when prompts change)
 */
export async function invalidateSearchCache(userId: string): Promise<void> {
  await cacheDeletePattern(`${CACHE_PREFIX.SEARCH}${userId}:*`);
}

/**
 * Invalidate stats cache for a user (called when prompts/workspaces change)
 */
export async function invalidateStatsCache(userId: string): Promise<void> {
  await cacheDeletePattern(`${CACHE_PREFIX.STATS}${userId}:*`);
}

/**
 * Wrapper for caching async function results
 * If cache miss, executes fn and caches result
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await cacheSet(key, result, ttl);
  return result;
}

/**
 * Check cache health
 */
export async function getCacheHealth(): Promise<{
  available: boolean;
  latencyMs?: number;
}> {
  const available = await isRedisAvailable();
  if (!available || !redis) {
    return { available: false };
  }

  const start = Date.now();
  await redis.ping();
  const latencyMs = Date.now() - start;

  return { available: true, latencyMs };
}
