/**
 * Prisma Database Service
 * Singleton service for managing database connections and operations with Prisma ORM
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { config } from '../config/environment';
import { logger, performanceLogger } from '../utils/logger';

/**
 * Prisma service class with connection management and monitoring
 */
export class PrismaService {
  private static instance: PrismaService;
  private prisma: PrismaClient;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetryAttempts = 3;

  constructor() {
    const dbConfig = config.getDatabaseConfig();

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbConfig.url
        }
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      errorFormat: 'pretty'
    });

    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Setup Prisma event listeners for logging and monitoring
   */
  private setupEventListeners(): void {
    // Log slow queries
    this.prisma.$on('query', (event) => {
      const duration = event.duration;

      if (config.get('database').logging) {
        logger.debug('Database query executed', {
          query: event.query,
          params: event.params,
          duration: `${duration}ms`,
          target: event.target
        });
      }

      // Log slow queries
      performanceLogger.logSlowQuery(event.query, duration, {
        params: event.params,
        target: event.target
      });
    });

    // Log database errors
    this.prisma.$on('error', (event) => {
      logger.error('Database error occurred', {
        message: event.message,
        target: event.target,
        timestamp: event.timestamp
      });
    });

    // Log database info
    this.prisma.$on('info', (event) => {
      logger.info('Database info', {
        message: event.message,
        target: event.target,
        timestamp: event.timestamp
      });
    });

    // Log database warnings
    this.prisma.$on('warn', (event) => {
      logger.warn('Database warning', {
        message: event.message,
        target: event.target,
        timestamp: event.timestamp
      });
    });
  }

  /**
   * Connect to the database with retry logic
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    while (this.connectionAttempts < this.maxRetryAttempts) {
      try {
        await this.prisma.$connect();
        this.isConnected = true;
        this.connectionAttempts = 0;

        logger.info('Database connected successfully', {
          attempt: this.connectionAttempts + 1,
          url: this.maskDatabaseUrl(config.get('database').url)
        });

        // Test the connection
        await this.healthCheck();

        return;
      } catch (error) {
        this.connectionAttempts++;

        logger.error(`Database connection attempt ${this.connectionAttempts} failed`, {
          error: error.message,
          maxAttempts: this.maxRetryAttempts
        });

        if (this.connectionAttempts >= this.maxRetryAttempts) {
          throw new Error(`Failed to connect to database after ${this.maxRetryAttempts} attempts: ${error.message}`);
        }

        // Wait before retrying (exponential backoff)
        await this.delay(1000 * Math.pow(2, this.connectionAttempts - 1));
      }
    }
  }

  /**
   * Disconnect from the database
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.prisma.$disconnect();
      this.isConnected = false;

      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database', { error: error.message });
      throw error;
    }
  }

  /**
   * Check database health
   */
  public async healthCheck(): Promise<{ status: string; latency: number; version?: string }> {
    try {
      const start = Date.now();

      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1 as health_check`;

      const latency = Date.now() - start;

      // Get database version
      let version: string | undefined;
      try {
        const result = await this.prisma.$queryRaw`SELECT version() as version` as any[];
        version = result[0]?.version;
      } catch (error) {
        // Version query might fail on some databases, ignore
      }

      return {
        status: 'healthy',
        latency,
        version
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute a transaction with automatic retry
   */
  public async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    const defaultOptions = {
      maxWait: 5000,  // 5 seconds
      timeout: 10000, // 10 seconds
      ...options
    };

    try {
      const result = await this.prisma.$transaction(fn, defaultOptions);

      logger.debug('Transaction completed successfully');
      return result;
    } catch (error) {
      logger.error('Transaction failed', {
        error: error.message,
        options: defaultOptions
      });
      throw error;
    }
  }

  /**
   * Execute raw SQL with logging
   */
  public async executeRaw(sql: string, values?: any[]): Promise<any> {
    try {
      logger.debug('Executing raw SQL', { sql, values });

      const start = Date.now();
      const result = await this.prisma.$queryRawUnsafe(sql, ...(values || []));
      const duration = Date.now() - start;

      performanceLogger.logSlowQuery(sql, duration, { values });

      return result;
    } catch (error) {
      logger.error('Raw SQL execution failed', {
        sql,
        values,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<any> {
    try {
      // Get table sizes and row counts
      const tables = await this.prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats
        WHERE schemaname = 'public'
        ORDER BY schemaname, tablename
      `;

      // Get database size
      const dbSize = await this.prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      ` as any[];

      return {
        tables,
        databaseSize: dbSize[0]?.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get database stats', { error: error.message });
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Perform database migration status check
   */
  public async getMigrationStatus(): Promise<any> {
    try {
      const migrations = await this.prisma.$queryRaw`
        SELECT * FROM _prisma_migrations
        ORDER BY started_at DESC
        LIMIT 10
      `;

      return {
        migrations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Migration table might not exist, return empty
      return {
        migrations: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get active connection count
   */
  public async getConnectionCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
      ` as any[];

      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      logger.error('Failed to get connection count', { error: error.message });
      return -1;
    }
  }

  /**
   * Clean up expired sessions and tokens
   */
  public async cleanup(): Promise<void> {
    try {
      const now = new Date();

      // Clean expired refresh tokens
      const expiredTokens = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });

      // Clean expired password reset tokens
      const expiredResets = await this.prisma.user.updateMany({
        where: {
          passwordResetExpires: {
            lt: now
          },
          passwordResetToken: {
            not: null
          }
        },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null
        }
      });

      // Clean expired email verification tokens
      const expiredVerifications = await this.prisma.user.updateMany({
        where: {
          emailVerificationExpires: {
            lt: now
          },
          emailVerificationToken: {
            not: null
          }
        },
        data: {
          emailVerificationToken: null,
          emailVerificationExpires: null
        }
      });

      logger.info('Database cleanup completed', {
        expiredTokens: expiredTokens.count,
        expiredResets: expiredResets.count,
        expiredVerifications: expiredVerifications.count
      });
    } catch (error) {
      logger.error('Database cleanup failed', { error: error.message });
    }
  }

  /**
   * Get the Prisma client instance
   */
  public get client(): PrismaClient {
    return this.prisma;
  }

  /**
   * Get User model
   */
  public get user() {
    return this.prisma.user;
  }

  /**
   * Get Post model
   */
  public get post() {
    return this.prisma.post;
  }

  /**
   * Get Comment model
   */
  public get comment() {
    return this.prisma.comment;
  }

  /**
   * Get RefreshToken model
   */
  public get refreshToken() {
    return this.prisma.refreshToken;
  }

  /**
   * Get Permission model
   */
  public get permission() {
    return this.prisma.permission;
  }

  /**
   * Check if database is connected
   */
  public get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Mask sensitive information in database URL
   */
  private maskDatabaseUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = '***';
      }
      return parsed.toString();
    } catch {
      return 'invalid_url';
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const prismaService = PrismaService.getInstance();