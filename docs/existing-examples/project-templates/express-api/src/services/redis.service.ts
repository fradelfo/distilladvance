/**
 * Redis Service
 * Singleton service for Redis operations including caching, session management, and rate limiting
 */

import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config/environment';
import { logger, performanceLogger } from '../utils/logger';

/**
 * Redis service class with connection management and operations
 */
export class RedisService {
  private static instance: RedisService;
  private client: Redis;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetryAttempts = 3;
  private keyPrefix: string;

  constructor() {
    const redisConfig = config.getRedisConfig();
    this.keyPrefix = redisConfig.keyPrefix;

    const options: RedisOptions = {
      ...redisConfig,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      commandTimeout: 5000,
      // Connection events
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    };

    this.client = new Redis(options);
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Setup Redis event listeners
   */
  private setupEventListeners(): void {
    this.client.on('connect', () => {
      logger.info('Redis connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info('Redis connected successfully', {
        host: config.getRedisConfig().host,
        port: config.getRedisConfig().port,
        db: config.getRedisConfig().db
      });
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis connection error', { error: error.message });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', (delay) => {
      logger.info('Redis reconnecting...', { delay });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis connection ended');
    });
  }

  /**
   * Connect to Redis with retry logic
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    while (this.connectionAttempts < this.maxRetryAttempts) {
      try {
        await this.client.connect();

        // Test the connection
        await this.healthCheck();

        return;
      } catch (error) {
        this.connectionAttempts++;

        logger.error(`Redis connection attempt ${this.connectionAttempts} failed`, {
          error: error.message,
          maxAttempts: this.maxRetryAttempts
        });

        if (this.connectionAttempts >= this.maxRetryAttempts) {
          throw new Error(`Failed to connect to Redis after ${this.maxRetryAttempts} attempts: ${error.message}`);
        }

        // Wait before retrying
        await this.delay(1000 * this.connectionAttempts);
      }
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from Redis', { error: error.message });
      throw error;
    }
  }

  /**
   * Check Redis health
   */
  public async healthCheck(): Promise<{ status: string; latency: number; memory?: string }> {
    try {
      const start = Date.now();

      // Test basic connectivity
      await this.client.ping();

      const latency = Date.now() - start;

      // Get Redis info
      let memory: string | undefined;
      try {
        const info = await this.client.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        memory = memoryMatch?.[1]?.trim();
      } catch (error) {
        // Info command might be disabled, ignore
      }

      return {
        status: 'healthy',
        latency,
        memory
      };
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Set key with expiration
   */
  public async setex(key: string, seconds: number, value: string): Promise<string> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.setex(fullKey, seconds, value);

      logger.debug('Redis SETEX', { key: fullKey, ttl: seconds });
      return result;
    } catch (error) {
      logger.error('Redis SETEX failed', { key, seconds, error: error.message });
      throw error;
    }
  }

  /**
   * Set key without expiration
   */
  public async set(key: string, value: string, ttl?: number): Promise<string> {
    try {
      const fullKey = this.getFullKey(key);
      let result: string;

      if (ttl) {
        result = await this.client.setex(fullKey, ttl, value);
      } else {
        result = await this.client.set(fullKey, value);
      }

      logger.debug('Redis SET', { key: fullKey, ttl });
      return result;
    } catch (error) {
      logger.error('Redis SET failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Get value by key
   */
  public async get(key: string): Promise<string | null> {
    try {
      const fullKey = this.getFullKey(key);
      const start = Date.now();

      const result = await this.client.get(fullKey);

      const duration = Date.now() - start;
      if (duration > 100) {
        performanceLogger.logSlowQuery(`Redis GET ${fullKey}`, duration);
      }

      logger.debug('Redis GET', { key: fullKey, hit: !!result });
      return result;
    } catch (error) {
      logger.error('Redis GET failed', { key, error: error.message });
      return null; // Return null on error for graceful degradation
    }
  }

  /**
   * Delete key
   */
  public async del(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.del(fullKey);

      logger.debug('Redis DEL', { key: fullKey, deleted: result });
      return result;
    } catch (error) {
      logger.error('Redis DEL failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.exists(fullKey);

      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS failed', { key, error: error.message });
      return false;
    }
  }

  /**
   * Set TTL for key
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.expire(fullKey, seconds);

      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE failed', { key, seconds, error: error.message });
      throw error;
    }
  }

  /**
   * Get TTL for key
   */
  public async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.ttl(fullKey);

      return result;
    } catch (error) {
      logger.error('Redis TTL failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Increment key value
   */
  public async incr(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.incr(fullKey);

      logger.debug('Redis INCR', { key: fullKey, value: result });
      return result;
    } catch (error) {
      logger.error('Redis INCR failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Increment key value by amount
   */
  public async incrby(key: string, increment: number): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.incrby(fullKey, increment);

      logger.debug('Redis INCRBY', { key: fullKey, increment, value: result });
      return result;
    } catch (error) {
      logger.error('Redis INCRBY failed', { key, increment, error: error.message });
      throw error;
    }
  }

  /**
   * Set multiple keys
   */
  public async mset(keyValues: Record<string, string>): Promise<string> {
    try {
      const prefixedKeyValues: string[] = [];

      for (const [key, value] of Object.entries(keyValues)) {
        prefixedKeyValues.push(this.getFullKey(key), value);
      }

      const result = await this.client.mset(...prefixedKeyValues);

      logger.debug('Redis MSET', { keys: Object.keys(keyValues) });
      return result;
    } catch (error) {
      logger.error('Redis MSET failed', { keys: Object.keys(keyValues), error: error.message });
      throw error;
    }
  }

  /**
   * Get multiple keys
   */
  public async mget(...keys: string[]): Promise<(string | null)[]> {
    try {
      const fullKeys = keys.map(key => this.getFullKey(key));
      const result = await this.client.mget(...fullKeys);

      logger.debug('Redis MGET', { keys: fullKeys });
      return result;
    } catch (error) {
      logger.error('Redis MGET failed', { keys, error: error.message });
      throw error;
    }
  }

  /**
   * Add to set
   */
  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.sadd(fullKey, ...members);

      logger.debug('Redis SADD', { key: fullKey, members });
      return result;
    } catch (error) {
      logger.error('Redis SADD failed', { key, members, error: error.message });
      throw error;
    }
  }

  /**
   * Remove from set
   */
  public async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.srem(fullKey, ...members);

      logger.debug('Redis SREM', { key: fullKey, members });
      return result;
    } catch (error) {
      logger.error('Redis SREM failed', { key, members, error: error.message });
      throw error;
    }
  }

  /**
   * Check if member is in set
   */
  public async sismember(key: string, member: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.sismember(fullKey, member);

      return result === 1;
    } catch (error) {
      logger.error('Redis SISMEMBER failed', { key, member, error: error.message });
      return false;
    }
  }

  /**
   * Get all set members
   */
  public async smembers(key: string): Promise<string[]> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.smembers(fullKey);

      return result;
    } catch (error) {
      logger.error('Redis SMEMBERS failed', { key, error: error.message });
      return [];
    }
  }

  /**
   * Cache with JSON serialization
   */
  public async setJSON(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.set(key, serialized, ttl);
    } catch (error) {
      logger.error('Redis setJSON failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Get and deserialize JSON
   */
  public async getJSON<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis getJSON failed', { key, error: error.message });
      return null;
    }
  }

  /**
   * Rate limiting implementation
   */
  public async rateLimit(key: string, limit: number, window: number): Promise<{
    allowed: boolean;
    count: number;
    remaining: number;
    resetTime: number;
  }> {
    try {
      const fullKey = this.getFullKey(`rate_limit:${key}`);
      const now = Date.now();
      const windowStart = now - window * 1000;

      // Use Lua script for atomic operation
      const luaScript = `
        local key = KEYS[1]
        local window = tonumber(ARGV[1])
        local limit = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

        -- Count current entries
        local current = redis.call('ZCARD', key)

        if current < limit then
          -- Add current request
          redis.call('ZADD', key, now, now .. ':' .. math.random())
          redis.call('EXPIRE', key, math.ceil(window / 1000))
          return {1, current + 1, limit - current - 1, now + window}
        else
          return {0, current, 0, now + window}
        end
      `;

      const result = await this.client.eval(
        luaScript,
        1,
        fullKey,
        window * 1000,
        limit,
        now
      ) as [number, number, number, number];

      return {
        allowed: result[0] === 1,
        count: result[1],
        remaining: result[2],
        resetTime: result[3]
      };
    } catch (error) {
      logger.error('Redis rate limit failed', { key, error: error.message });
      // Return permissive result on error
      return {
        allowed: true,
        count: 0,
        remaining: limit,
        resetTime: Date.now() + window * 1000
      };
    }
  }

  /**
   * Session management
   */
  public async setSession(sessionId: string, data: any, ttl = 3600): Promise<void> {
    await this.setJSON(`session:${sessionId}`, data, ttl);
  }

  public async getSession<T = any>(sessionId: string): Promise<T | null> {
    return this.getJSON<T>(`session:${sessionId}`);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  /**
   * Get Redis info
   */
  public async getInfo(): Promise<any> {
    try {
      const info = await this.client.info();
      const keyspace = await this.client.info('keyspace');
      const memory = await this.client.info('memory');

      return {
        info,
        keyspace,
        memory,
        connected: this.isConnected
      };
    } catch (error) {
      logger.error('Failed to get Redis info', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Get connection status
   */
  public get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get Redis client instance
   */
  public get redisClient(): Redis {
    return this.client;
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance();