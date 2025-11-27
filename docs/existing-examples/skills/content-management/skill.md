# Content Management Systems Skill

Modern CMS development and headless content management expertise covering custom CMS development, headless architectures, content workflows, and integration with popular platforms like WordPress, Strapi, and Sanity.

## Skill Overview

Expert CMS knowledge including custom CMS development, headless architectures, content modeling, workflow automation, multi-channel publishing, performance optimization, and modern content management patterns.

## Core Capabilities

### Headless CMS Architecture
- **Strapi development** - Custom content types, plugins, API customization
- **Sanity Studio** - Schema design, custom inputs, real-time collaboration
- **Contentful integration** - Content delivery APIs, webhooks, localization
- **Ghost headless** - Publishing workflows, membership systems, newsletters

### Custom CMS Development
- **Node.js CMS** - Express/Fastify backends, content APIs, admin dashboards
- **PHP CMS** - WordPress custom development, Laravel CMS, security hardening
- **Python CMS** - Django CMS, Wagtail development, content pipelines
- **JAMstack integration** - Static site generation, build triggers, edge delivery

### Content Workflows
- **Editorial workflows** - Content approval, versioning, scheduling, collaboration
- **Multi-language support** - Internationalization, translation management
- **Media management** - Asset optimization, CDN integration, responsive images
- **SEO optimization** - Meta management, structured data, performance monitoring

### Enterprise Features
- **User management** - Role-based access, SSO integration, audit trails
- **Performance optimization** - Caching strategies, database optimization, CDN setup
- **Security implementation** - Authentication, authorization, input validation
- **Scalability patterns** - Microservices, caching layers, database sharding

## Modern CMS Implementation

### Custom Headless CMS with Node.js and TypeScript
```typescript
// Comprehensive headless CMS implementation with modern architecture
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient, User, Content, ContentType, Media } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Types and interfaces
interface AuthenticatedRequest extends Request {
  user?: User;
}

interface CMSConfig {
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
}

// Validation schemas
const contentSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  content: z.string(),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  contentTypeId: z.string().uuid()
});

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'editor', 'author', 'contributor'])
});

const contentTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'textarea', 'richtext', 'number', 'boolean', 'date', 'image', 'file', 'select', 'multiselect']),
    required: z.boolean().default(false),
    options: z.record(z.any()).optional()
  }))
});

// CMS Core Class
class HeadlessCMS {
  private app: Express;
  private prisma: PrismaClient;
  private redis: Redis;
  private s3: S3Client;
  private logger: Logger;
  private config: CMSConfig;

  constructor(config: CMSConfig) {
    this.config = config;
    this.app = express();
    this.prisma = new PrismaClient({
      datasources: { db: { url: config.database.url } }
    });
    this.redis = new Redis(config.redis.url);
    this.s3 = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    });

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' }),
        new transports.Console({
          format: format.simple()
        })
      ]
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Authentication routes
    this.app.post('/api/auth/login', this.login.bind(this));
    this.app.post('/api/auth/register', this.register.bind(this));
    this.app.post('/api/auth/refresh', this.refreshToken.bind(this));
    this.app.post('/api/auth/logout', this.authenticate.bind(this), this.logout.bind(this));

    // User management
    this.app.get('/api/users', this.authenticate.bind(this), this.authorize(['admin']).bind(this), this.getUsers.bind(this));
    this.app.get('/api/users/:id', this.authenticate.bind(this), this.getUser.bind(this));
    this.app.put('/api/users/:id', this.authenticate.bind(this), this.updateUser.bind(this));
    this.app.delete('/api/users/:id', this.authenticate.bind(this), this.authorize(['admin']).bind(this), this.deleteUser.bind(this));

    // Content type management
    this.app.get('/api/content-types', this.getContentTypes.bind(this));
    this.app.post('/api/content-types', this.authenticate.bind(this), this.authorize(['admin']).bind(this), this.createContentType.bind(this));
    this.app.put('/api/content-types/:id', this.authenticate.bind(this), this.authorize(['admin']).bind(this), this.updateContentType.bind(this));
    this.app.delete('/api/content-types/:id', this.authenticate.bind(this), this.authorize(['admin']).bind(this), this.deleteContentType.bind(this));

    // Content management
    this.app.get('/api/content', this.getContent.bind(this));
    this.app.get('/api/content/:id', this.getContentById.bind(this));
    this.app.post('/api/content', this.authenticate.bind(this), this.createContent.bind(this));
    this.app.put('/api/content/:id', this.authenticate.bind(this), this.updateContent.bind(this));
    this.app.delete('/api/content/:id', this.authenticate.bind(this), this.deleteContent.bind(this));
    this.app.post('/api/content/:id/publish', this.authenticate.bind(this), this.publishContent.bind(this));

    // Media management
    this.app.post('/api/media/upload', this.authenticate.bind(this), this.setupFileUpload(), this.uploadMedia.bind(this));
    this.app.get('/api/media', this.authenticate.bind(this), this.getMedia.bind(this));
    this.app.delete('/api/media/:id', this.authenticate.bind(this), this.deleteMedia.bind(this));

    // Webhooks
    this.app.post('/api/webhooks/:event', this.handleWebhook.bind(this));

    // Health check
    this.app.get('/health', this.healthCheck.bind(this));

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  // Authentication middleware
  private async authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
      }

      const decoded = jwt.verify(token, this.config.jwt.secret) as any;
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true }
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid token.' });
        return;
      }

      req.user = user as User;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token.' });
    }
  }

  // Authorization middleware
  private authorize(roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        return;
      }
      next();
    };
  }

  // File upload setup
  private setupFileUpload() {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      limits: { fileSize: this.config.upload.maxFileSize },
      fileFilter: (req, file, cb) => {
        if (this.config.upload.allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('File type not allowed'));
        }
      }
    });

    return upload.single('file');
  }

  // Authentication routes
  private async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user || !await bcrypt.compare(password, user.password)) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        this.config.jwt.secret,
        { expiresIn: this.config.jwt.expiresIn }
      );

      // Store session in Redis
      await this.redis.set(`session:${user.id}`, token, 'EX', 86400); // 24 hours

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      this.logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = userSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          ...validatedData,
          password: hashedPassword
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      res.status(201).json({ user });
    } catch (error) {
      this.logger.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  private async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

      const decoded = jwt.verify(refreshToken, this.config.jwt.secret) as any;
      const sessionToken = await this.redis.get(`session:${decoded.userId}`);

      if (!sessionToken) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        this.config.jwt.secret,
        { expiresIn: this.config.jwt.expiresIn }
      );

      await this.redis.set(`session:${decoded.userId}`, newToken, 'EX', 86400);

      res.json({ token: newToken });
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  private async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user) {
        await this.redis.del(`session:${req.user.id}`);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      this.logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Content management routes
  private async getContent(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '10',
        contentTypeId,
        status,
        search,
        tags
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const where: any = {};

      if (contentTypeId) {
        where.contentTypeId = contentTypeId;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (tags) {
        where.tags = {
          hasSome: Array.isArray(tags) ? tags : [tags]
        };
      }

      // Cache key for this query
      const cacheKey = `content:${JSON.stringify({ where, offset, limitNum })}`;
      const cachedResult = await this.redis.get(cacheKey);

      if (cachedResult) {
        res.json(JSON.parse(cachedResult));
        return;
      }

      const [content, total] = await Promise.all([
        this.prisma.content.findMany({
          where,
          skip: offset,
          take: limitNum,
          include: {
            contentType: true,
            author: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.content.count({ where })
      ]);

      const result = {
        content,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      };

      // Cache for 5 minutes
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);

      res.json(result);
    } catch (error) {
      this.logger.error('Get content error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async createContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validatedData = contentSchema.parse(req.body);

      // Check if slug is unique for this content type
      const existingContent = await this.prisma.content.findFirst({
        where: {
          slug: validatedData.slug,
          contentTypeId: validatedData.contentTypeId
        }
      });

      if (existingContent) {
        res.status(400).json({ error: 'Slug already exists for this content type' });
        return;
      }

      const content = await this.prisma.content.create({
        data: {
          ...validatedData,
          authorId: req.user!.id
        },
        include: {
          contentType: true,
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Invalidate content cache
      await this.invalidateContentCache();

      // Trigger webhook
      await this.triggerWebhook('content.created', content);

      res.status(201).json(content);
    } catch (error) {
      this.logger.error('Create content error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Media management
  private async uploadMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const file = req.file;
      const fileId = uuidv4();
      const fileName = `${fileId}-${file.originalname}`;

      let processedBuffer = file.buffer;

      // Process images with Sharp
      if (file.mimetype.startsWith('image/')) {
        processedBuffer = await sharp(file.buffer)
          .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.aws.bucket,
        Key: fileName,
        Body: processedBuffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedBy: req.user!.id
        }
      });

      await this.s3.send(uploadCommand);

      // Save media record
      const media = await this.prisma.media.create({
        data: {
          fileName,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: processedBuffer.length,
          s3Key: fileName,
          uploadedById: req.user!.id
        }
      });

      res.status(201).json(media);
    } catch (error) {
      this.logger.error('Upload media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Webhook handling
  private async triggerWebhook(event: string, data: any): Promise<void> {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: { events: { has: event } }
      });

      for (const webhook of webhooks) {
        // Queue webhook for background processing
        await this.redis.lpush('webhook_queue', JSON.stringify({
          url: webhook.url,
          event,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      this.logger.error('Webhook trigger error:', error);
    }
  }

  private async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { event } = req.params;
      const payload = req.body;

      // Process webhook based on event type
      switch (event) {
        case 'build_triggered':
          await this.handleBuildTrigger(payload);
          break;
        case 'content_updated':
          await this.handleContentUpdate(payload);
          break;
        default:
          res.status(400).json({ error: 'Unknown event type' });
          return;
      }

      res.json({ message: 'Webhook processed successfully' });
    } catch (error) {
      this.logger.error('Handle webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async handleBuildTrigger(payload: any): Promise<void> {
    // Trigger static site build
    this.logger.info('Build trigger received:', payload);
    // Implementation would trigger your build system (Netlify, Vercel, etc.)
  }

  private async handleContentUpdate(payload: any): Promise<void> {
    // Handle content update webhook
    await this.invalidateContentCache();
    this.logger.info('Content update webhook processed:', payload);
  }

  // Utility methods
  private async invalidateContentCache(): Promise<void> {
    const pattern = 'content:*';
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Check Redis connection
      await this.redis.ping();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          redis: 'healthy',
          s3: 'healthy'
        }
      });
    } catch (error) {
      this.logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  private errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
    this.logger.error('Unhandled error:', error);

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }

  // Start server
  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      this.logger.info(`CMS server running on port ${port}`);
    });
  }
}

// Content type management routes (additional implementations)
private async getContentTypes(req: Request, res: Response): Promise<void> {
  try {
    const contentTypes = await this.prisma.contentType.findMany({
      include: {
        _count: {
          select: { content: true }
        }
      }
    });

    res.json(contentTypes);
  } catch (error) {
    this.logger.error('Get content types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

private async createContentType(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const validatedData = contentTypeSchema.parse(req.body);

    const contentType = await this.prisma.contentType.create({
      data: validatedData
    });

    res.status(201).json(contentType);
  } catch (error) {
    this.logger.error('Create content type error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Example usage
const config: CMSConfig = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/cms'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_BUCKET || 'cms-media-bucket'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h'
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  }
};

const cms = new HeadlessCMS(config);
cms.start(3000);

export { HeadlessCMS, CMSConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Content management system development is needed
- Headless CMS architecture is required
- Content workflow automation is requested
- Multi-channel publishing is needed
- Editorial workflow implementation is required
- Custom CMS development is requested

This comprehensive content management skill provides expert-level capabilities for building modern, scalable content management systems using headless architectures and modern development practices.