/**
 * Structured Logging Utility
 * Production-ready logging with multiple transports and structured output
 */

import winston, { Logger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/environment';

/**
 * Custom log levels with numeric priorities
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

/**
 * Color mapping for console output
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

/**
 * Custom format for structured logging
 */
const structuredFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  format.errors({ stack: true }),
  format.metadata({
    fillExcept: ['timestamp', 'level', 'message']
  }),
  format.json({
    space: config.isDevelopment() ? 2 : 0
  })
);

/**
 * Development-friendly console format
 */
const consoleFormat = format.combine(
  format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  format.colorize({ all: true }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `${timestamp} [${level}] ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      log += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

/**
 * Create Winston logger transports based on configuration
 */
function createTransports(): winston.transport[] {
  const logTransports: winston.transport[] = [];

  // Console transport (always enabled)
  logTransports.push(
    new transports.Console({
      level: config.get('logging').level,
      format: config.isDevelopment() ? consoleFormat : structuredFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // File transport (optional)
  if (config.get('logging').file.enabled) {
    const fileConfig = config.get('logging').file;

    // Error log file
    logTransports.push(
      new DailyRotateFile({
        filename: `logs/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: structuredFormat,
        maxSize: fileConfig.maxSize,
        maxFiles: fileConfig.maxFiles,
        zippedArchive: true,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // Combined log file
    logTransports.push(
      new DailyRotateFile({
        filename: `logs/${fileConfig.filename.replace('.log', '')}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        format: structuredFormat,
        maxSize: fileConfig.maxSize,
        maxFiles: fileConfig.maxFiles,
        zippedArchive: true
      })
    );

    // HTTP access log
    logTransports.push(
      new DailyRotateFile({
        filename: `logs/access-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        format: structuredFormat,
        maxSize: fileConfig.maxSize,
        maxFiles: fileConfig.maxFiles,
        zippedArchive: true
      })
    );
  }

  return logTransports;
}

/**
 * Create and configure the main logger instance
 */
const createLogger = (): Logger => {
  // Set colors for custom levels
  winston.addColors(logColors);

  return winston.createLogger({
    levels: logLevels,
    level: config.get('logging').level,
    format: structuredFormat,
    transports: createTransports(),
    defaultMeta: {
      service: config.get('app').name,
      version: config.get('app').version,
      environment: config.get('environment'),
      pid: process.pid
    },
    exitOnError: false
  });
};

/**
 * Main logger instance
 */
export const logger = createLogger();

/**
 * Enhanced logging interface with additional methods
 */
export class Logger {
  private winston: winston.Logger;

  constructor(context?: string) {
    this.winston = logger.child({ context });
  }

  /**
   * Log error messages with optional error object
   */
  error(message: string, meta?: any, error?: Error): void {
    const logMeta = { ...meta };

    if (error) {
      logMeta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.winston.error(message, logMeta);
  }

  /**
   * Log warning messages
   */
  warn(message: string, meta?: any): void {
    this.winston.warn(message, meta);
  }

  /**
   * Log informational messages
   */
  info(message: string, meta?: any): void {
    this.winston.info(message, meta);
  }

  /**
   * Log HTTP requests (for access logging)
   */
  http(message: string, meta?: any): void {
    this.winston.http(message, meta);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, meta?: any): void {
    this.winston.debug(message, meta);
  }

  /**
   * Create child logger with additional context
   */
  child(meta: any): Logger {
    const childLogger = new Logger();
    childLogger.winston = this.winston.child(meta);
    return childLogger;
  }

  /**
   * Start a timer for performance logging
   */
  startTimer(): winston.Profiler {
    return this.winston.startTimer();
  }

  /**
   * Log with custom level
   */
  log(level: string, message: string, meta?: any): void {
    this.winston.log(level, message, meta);
  }
}

/**
 * Create contextual logger for specific modules
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

/**
 * Request logging helper
 */
export const requestLogger = {
  /**
   * Log incoming request
   */
  logRequest(req: any, startTime: number): void {
    logger.http('Request started', {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.id,
      startTime
    });
  },

  /**
   * Log completed request
   */
  logResponse(req: any, res: any, startTime: number): void {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(logLevel, 'Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id,
      contentLength: res.get('content-length') || 0
    });
  },

  /**
   * Log request error
   */
  logError(req: any, error: Error): void {
    logger.error('Request failed', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }
};

/**
 * Security logging helpers
 */
export const securityLogger = {
  /**
   * Log authentication events
   */
  logAuth(event: string, userId?: string, meta?: any): void {
    logger.warn(`Security: ${event}`, {
      event,
      userId,
      category: 'authentication',
      ...meta
    });
  },

  /**
   * Log authorization failures
   */
  logAuthz(event: string, userId?: string, resource?: string, meta?: any): void {
    logger.warn(`Security: ${event}`, {
      event,
      userId,
      resource,
      category: 'authorization',
      ...meta
    });
  },

  /**
   * Log suspicious activity
   */
  logSuspicious(event: string, meta?: any): void {
    logger.warn(`Security: Suspicious activity - ${event}`, {
      event,
      category: 'suspicious',
      ...meta
    });
  },

  /**
   * Log rate limiting events
   */
  logRateLimit(ip: string, endpoint: string, meta?: any): void {
    logger.warn('Security: Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      category: 'rate_limiting',
      ...meta
    });
  }
};

/**
 * Performance logging helpers
 */
export const performanceLogger = {
  /**
   * Log slow database queries
   */
  logSlowQuery(query: string, duration: number, meta?: any): void {
    if (duration > 1000) { // Log queries slower than 1 second
      logger.warn('Slow database query detected', {
        query: query.substring(0, 200), // Truncate long queries
        duration: `${duration}ms`,
        category: 'performance',
        ...meta
      });
    }
  },

  /**
   * Log memory usage warnings
   */
  logMemoryUsage(usage: NodeJS.MemoryUsage): void {
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);

    if (usedMB > 500) { // Warn if using more than 500MB
      logger.warn('High memory usage detected', {
        heapUsed: `${usedMB}MB`,
        heapTotal: `${totalMB}MB`,
        category: 'performance'
      });
    }
  }
};

// Handle uncaught exceptions and rejections
logger.exceptions.handle(
  new transports.File({ filename: 'logs/exceptions.log' })
);

logger.rejections.handle(
  new transports.File({ filename: 'logs/rejections.log' })
);

export default logger;