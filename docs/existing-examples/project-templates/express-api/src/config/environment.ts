/**
 * Environment Configuration
 * Type-safe configuration management with validation and defaults
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
});

/**
 * Configuration schema with validation
 */
const ConfigSchema = z.object({
  // Application settings
  app: z.object({
    name: z.string().default('Blog API'),
    version: z.string().default('1.0.0'),
    description: z.string().default('Modern TypeScript Express API for blogging platform')
  }),

  // Environment
  environment: z.enum(['development', 'test', 'staging', 'production']).default('development'),

  // Server configuration
  server: z.object({
    host: z.string().default('0.0.0.0'),
    port: z.number().int().min(1).max(65535).default(3000),
    trustProxy: z.boolean().default(false)
  }),

  // Database configuration
  database: z.object({
    url: z.string().url('Invalid database URL'),
    ssl: z.boolean().default(false),
    logging: z.boolean().default(false),
    poolSize: z.number().int().min(1).max(50).default(10),
    timeout: z.number().int().min(1000).default(30000) // 30 seconds
  }),

  // Redis configuration
  redis: z.object({
    url: z.string().url('Invalid Redis URL').default('redis://localhost:6379'),
    keyPrefix: z.string().default('blog:'),
    ttl: z.number().int().min(60).default(3600) // 1 hour
  }),

  // JWT configuration
  jwt: z.object({
    secret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    accessTokenExpiry: z.string().default('15m'),
    refreshTokenExpiry: z.string().default('7d'),
    issuer: z.string().default('blog-api'),
    audience: z.string().default('blog-users')
  }),

  // Security settings
  security: z.object({
    bcryptRounds: z.number().int().min(10).max(15).default(12),
    corsOrigins: z.array(z.string()).default(['http://localhost:3000']),
    sessionSecret: z.string().min(32, 'Session secret must be at least 32 characters'),
    csrfEnabled: z.boolean().default(true)
  }),

  // Rate limiting
  rateLimiting: z.object({
    global: z.object({
      requests: z.number().int().min(1).default(100),
      window: z.number().int().min(60000).default(900000) // 15 minutes
    }),
    auth: z.object({
      requests: z.number().int().min(1).default(5),
      window: z.number().int().min(60000).default(900000) // 15 minutes
    }),
    api: z.object({
      requests: z.number().int().min(1).default(60),
      window: z.number().int().min(60000).default(60000) // 1 minute
    })
  }),

  // API settings
  api: z.object({
    prefix: z.string().default('/api/v1'),
    maxRequestSize: z.string().default('10mb'),
    pagination: z.object({
      defaultLimit: z.number().int().min(1).max(100).default(20),
      maxLimit: z.number().int().min(1).max(1000).default(100)
    })
  }),

  // Email configuration
  email: z.object({
    enabled: z.boolean().default(false),
    from: z.string().email().optional(),
    smtp: z.object({
      host: z.string().optional(),
      port: z.number().int().min(1).max(65535).default(587),
      secure: z.boolean().default(false),
      auth: z.object({
        user: z.string().optional(),
        pass: z.string().optional()
      }).optional()
    }).optional()
  }),

  // File upload settings
  uploads: z.object({
    enabled: z.boolean().default(true),
    maxFileSize: z.number().int().min(1024).default(10 * 1024 * 1024), // 10MB
    allowedMimeTypes: z.array(z.string()).default([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]),
    destination: z.string().default('./uploads')
  }),

  // Logging configuration
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'pretty']).default('json'),
    file: z.object({
      enabled: z.boolean().default(false),
      filename: z.string().default('app.log'),
      maxSize: z.string().default('10m'),
      maxFiles: z.number().int().min(1).default(5)
    })
  }),

  // Monitoring and observability
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metricsEndpoint: z.string().default('/metrics'),
    healthEndpoint: z.string().default('/health'),
    prometheus: z.object({
      enabled: z.boolean().default(true),
      prefix: z.string().default('blog_api_')
    })
  })
});

type ConfigType = z.infer<typeof ConfigSchema>;

/**
 * Environment variable mapping
 */
function getEnvironmentConfig(): ConfigType {
  return {
    app: {
      name: process.env.APP_NAME || 'Blog API',
      version: process.env.APP_VERSION || '1.0.0',
      description: process.env.APP_DESCRIPTION || 'Modern TypeScript Express API for blogging platform'
    },
    environment: (process.env.NODE_ENV as any) || 'development',
    server: {
      host: process.env.SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || process.env.SERVER_PORT || '3000', 10),
      trustProxy: process.env.TRUST_PROXY === 'true'
    },
    database: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/blog_db',
      ssl: process.env.DATABASE_SSL === 'true',
      logging: process.env.DATABASE_LOGGING === 'true',
      poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
      timeout: parseInt(process.env.DATABASE_TIMEOUT || '30000', 10)
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'blog:',
      ttl: parseInt(process.env.REDIS_TTL || '3600', 10)
    },
    jwt: {
      secret: process.env.JWT_SECRET || (() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET is required in production');
        }
        return 'development-jwt-secret-at-least-32-characters-long';
      })(),
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: process.env.JWT_ISSUER || 'blog-api',
      audience: process.env.JWT_AUDIENCE || 'blog-users'
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
      corsOrigins: process.env.CORS_ORIGINS
        ? JSON.parse(process.env.CORS_ORIGINS)
        : ['http://localhost:3000'],
      sessionSecret: process.env.SESSION_SECRET || (() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('SESSION_SECRET is required in production');
        }
        return 'development-session-secret-at-least-32-characters-long';
      })(),
      csrfEnabled: process.env.CSRF_ENABLED !== 'false'
    },
    rateLimiting: {
      global: {
        requests: parseInt(process.env.RATE_LIMIT_GLOBAL_REQUESTS || '100', 10),
        window: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW || '900000', 10)
      },
      auth: {
        requests: parseInt(process.env.RATE_LIMIT_AUTH_REQUESTS || '5', 10),
        window: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '900000', 10)
      },
      api: {
        requests: parseInt(process.env.RATE_LIMIT_API_REQUESTS || '60', 10),
        window: parseInt(process.env.RATE_LIMIT_API_WINDOW || '60000', 10)
      }
    },
    api: {
      prefix: process.env.API_PREFIX || '/api/v1',
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
      pagination: {
        defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10),
        maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10)
      }
    },
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      from: process.env.EMAIL_FROM,
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        } : undefined
      }
    },
    uploads: {
      enabled: process.env.UPLOADS_ENABLED !== 'false',
      maxFileSize: parseInt(process.env.UPLOADS_MAX_SIZE || '10485760', 10),
      allowedMimeTypes: process.env.UPLOADS_ALLOWED_TYPES
        ? JSON.parse(process.env.UPLOADS_ALLOWED_TYPES)
        : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      destination: process.env.UPLOADS_DESTINATION || './uploads'
    },
    logging: {
      level: (process.env.LOG_LEVEL as any) || 'info',
      format: (process.env.LOG_FORMAT as any) || 'json',
      file: {
        enabled: process.env.LOG_FILE_ENABLED === 'true',
        filename: process.env.LOG_FILE_NAME || 'app.log',
        maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5', 10)
      }
    },
    monitoring: {
      enabled: process.env.MONITORING_ENABLED !== 'false',
      metricsEndpoint: process.env.METRICS_ENDPOINT || '/metrics',
      healthEndpoint: process.env.HEALTH_ENDPOINT || '/health',
      prometheus: {
        enabled: process.env.PROMETHEUS_ENABLED !== 'false',
        prefix: process.env.PROMETHEUS_PREFIX || 'blog_api_'
      }
    }
  };
}

/**
 * Configuration class with validation and utilities
 */
class Configuration {
  private _config: ConfigType;
  private _isValidated = false;

  constructor() {
    this._config = this.validateConfig();
  }

  private validateConfig(): ConfigType {
    try {
      const envConfig = getEnvironmentConfig();
      const validated = ConfigSchema.parse(envConfig);
      this._isValidated = true;
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(issue =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join('\n');
        throw new Error(`Configuration validation failed:\n${issues}`);
      }
      throw error;
    }
  }

  /**
   * Get configuration value
   */
  get<T extends keyof ConfigType>(key: T): ConfigType[T] {
    return this._config[key];
  }

  /**
   * Check if configuration is valid
   */
  isValid(): boolean {
    return this._isValidated;
  }

  /**
   * Get all configuration as readonly object
   */
  getAll(): Readonly<ConfigType> {
    return Object.freeze({ ...this._config });
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this._config.environment === 'development';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this._config.environment === 'production';
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this._config.environment === 'test';
  }

  /**
   * Get database configuration for Prisma
   */
  getDatabaseConfig() {
    return {
      url: this._config.database.url,
      ssl: this._config.database.ssl,
      logging: this._config.database.logging,
      pool: {
        min: 2,
        max: this._config.database.poolSize,
        acquireTimeoutMillis: this._config.database.timeout
      }
    };
  }

  /**
   * Get Redis configuration
   */
  getRedisConfig() {
    const url = new URL(this._config.redis.url);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      db: parseInt(url.pathname.slice(1), 10) || 0,
      keyPrefix: this._config.redis.keyPrefix,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };
  }
}

// Create and export singleton configuration instance
export const config = new Configuration();

// Export types for use in other modules
export type { ConfigType };
export { ConfigSchema };