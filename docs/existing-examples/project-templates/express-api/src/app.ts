/**
 * Express.js Application Setup
 * Production-ready Express app with TypeScript, modern middleware, and comprehensive error handling
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from '../build/routes';

import { config } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { validateRequest } from './middleware/validation';
import { metricsMiddleware } from './middleware/metrics';
import { corsConfig } from './config/cors';
import { ApiError } from './utils/errors';
import { HealthService } from './services/health.service';
import { MetricsService } from './services/metrics.service';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import adminRoutes from './routes/admin.routes';
import healthRoutes from './routes/health.routes';

/**
 * Express Application Class
 *
 * Configures and manages the Express.js application with:
 * - Modern security middleware (Helmet, CORS)
 * - Performance optimizations (compression, rate limiting)
 * - Comprehensive logging and monitoring
 * - API documentation with Swagger
 * - WebSocket support for real-time features
 * - Graceful shutdown handling
 */
export class App {
  public app: Application;
  public server: ReturnType<typeof createServer>;
  public io: Server;
  private metricsService: MetricsService;
  private healthService: HealthService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: corsConfig
    });

    this.metricsService = new MetricsService();
    this.healthService = new HealthService();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeWebSocket();
  }

  /**
   * Initialize core middleware stack
   * Order matters - middleware executes in the order it's added
   */
  private initializeMiddlewares(): void {
    // Trust proxy if behind reverse proxy
    this.app.set('trust proxy', config.server.trustProxy);

    // Security middleware - must be first
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"]
        }
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors(corsConfig));

    // Compression middleware
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024 // Only compress responses > 1KB
    }));

    // Request parsing
    this.app.use(express.json({
      limit: config.api.maxRequestSize,
      strict: true
    }));
    this.app.use(express.urlencoded({
      extended: true,
      limit: config.api.maxRequestSize
    }));

    // Request logging middleware
    this.app.use(requestLogger);

    // Metrics collection middleware
    this.app.use(metricsMiddleware(this.metricsService));

    // Global rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimiting.global.requests,
      message: {
        error: {
          message: 'Too many requests from this IP',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: '15 minutes'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });

        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests from this IP, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        });
      }
    }));

    // API documentation
    if (config.environment !== 'production') {
      try {
        const swaggerSpec = require('../swagger.json');
        this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
          customCss: '.swagger-ui .topbar { display: none }',
          customSiteTitle: 'Blog API Documentation'
        }));
      } catch (error) {
        logger.warn('Swagger documentation not available', { error: error.message });
      }
    }
  }

  /**
   * Initialize API routes with proper middleware
   */
  private initializeRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.use('/health', healthRoutes);

    // API v1 routes
    const apiV1 = express.Router();

    // Authentication routes (public)
    apiV1.use('/auth', authRoutes);

    // Protected routes with authentication middleware
    apiV1.use('/users', authMiddleware, userRoutes);
    apiV1.use('/posts', authMiddleware, postRoutes);
    apiV1.use('/admin', authMiddleware, adminRoutes);

    // Mount API v1 routes
    this.app.use('/api/v1', apiV1);

    // TSOA generated routes (if using TSOA)
    try {
      RegisterRoutes(this.app);
    } catch (error) {
      logger.debug('TSOA routes not available', { error: error.message });
    }

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: config.app.name,
        version: config.app.version,
        environment: config.environment,
        timestamp: new Date().toISOString(),
        documentation: config.environment !== 'production' ? '/docs' : undefined
      });
    });

    // 404 handler for undefined routes
    this.app.use('*', (req: Request, res: Response) => {
      throw new ApiError(404, 'Endpoint not found', 'ENDPOINT_NOT_FOUND');
    });
  }

  /**
   * Initialize comprehensive error handling
   */
  private initializeErrorHandling(): void {
    // Global error handler (must be last middleware)
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      this.gracefulShutdown('SIGTERM');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
      logger.error('Unhandled Rejection', { reason, promise });
      this.gracefulShutdown('SIGTERM');
    });

    // Handle process termination signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  /**
   * Initialize WebSocket for real-time features
   */
  private initializeWebSocket(): void {
    this.io.use((socket, next) => {
      // WebSocket authentication middleware
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error'));
        }

        // Verify JWT token
        const authService = require('./services/auth.service').AuthService;
        const decoded = authService.verifyToken(token);
        socket.data.user = decoded;

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.user?.id;
      logger.info('WebSocket connection established', { userId, socketId: socket.id });

      // Join user room for personalized notifications
      if (userId) {
        socket.join(`user:${userId}`);
      }

      // Handle real-time events
      socket.on('post:view', (postId: string) => {
        // Broadcast post view event
        socket.broadcast.emit('post:viewed', { postId, viewerId: userId });
      });

      socket.on('comment:new', (data: { postId: string; comment: any }) => {
        // Broadcast new comment to post subscribers
        socket.broadcast.to(`post:${data.postId}`).emit('comment:added', {
          comment: data.comment,
          authorId: userId
        });
      });

      socket.on('disconnect', (reason) => {
        logger.info('WebSocket connection closed', { userId, socketId: socket.id, reason });
      });
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database connection
      const { PrismaService } = await import('./services/prisma.service');
      const prismaService = new PrismaService();
      await prismaService.connect();

      // Initialize Redis connection
      const { RedisService } = await import('./services/redis.service');
      const redisService = new RedisService();
      await redisService.connect();

      // Start HTTP server
      this.server.listen(config.server.port, config.server.host, () => {
        logger.info('Server started successfully', {
          host: config.server.host,
          port: config.server.port,
          environment: config.environment,
          version: config.app.version,
          pid: process.pid
        });

        // Log available routes in development
        if (config.environment === 'development') {
          this.logRoutes();
        }
      });

      // Set up health monitoring
      this.healthService.startMonitoring();

    } catch (error) {
      logger.error('Failed to start server', { error: error.message, stack: error.stack });
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown handler
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout. Forcing exit.');
      process.exit(1);
    }, 30000); // 30 second timeout

    try {
      // Stop accepting new connections
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close WebSocket connections
      this.io.close(() => {
        logger.info('WebSocket server closed');
      });

      // Close database connections
      const { PrismaService } = await import('./services/prisma.service');
      const prismaService = new PrismaService();
      await prismaService.disconnect();

      // Close Redis connections
      const { RedisService } = await import('./services/redis.service');
      const redisService = new RedisService();
      await redisService.disconnect();

      // Stop health monitoring
      this.healthService.stopMonitoring();

      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error.message });
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  /**
   * Log all registered routes (development only)
   */
  private logRoutes(): void {
    const routes: string[] = [];

    this.app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        // Direct routes
        const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
        routes.push(`${methods} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        // Router middleware
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
            const path = middleware.regexp.source.replace('\\/?$', '') + handler.route.path;
            routes.push(`${methods} ${path.replace(/\\\//g, '/')}`);
          }
        });
      }
    });

    logger.debug('Registered routes', { routes: routes.sort() });
  }

  /**
   * Get Express application instance
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Get HTTP server instance
   */
  public getServer() {
    return this.server;
  }

  /**
   * Get WebSocket server instance
   */
  public getIO(): Server {
    return this.io;
  }
}