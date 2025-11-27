/**
 * Authentication and Authorization Middleware
 * JWT-based authentication with role-based access control and comprehensive security features
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { securityLogger } from '../utils/logger';
import { config } from '../config/environment';
import { PrismaService } from '../services/prisma.service';
import { RedisService } from '../services/redis.service';

/**
 * User roles enum
 */
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * JWT payload interface
 */
export interface JwtTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
  permissions?: string[];
  iat: number;
  exp: number;
}

/**
 * Authenticated request interface
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
    sessionId?: string;
  };
}

/**
 * Authentication middleware options
 */
interface AuthOptions {
  required?: boolean;
  allowExpiredToken?: boolean;
  skipBlacklistCheck?: boolean;
}

/**
 * Authorization middleware options
 */
interface AuthzOptions {
  roles?: UserRole[];
  permissions?: string[];
  requireAll?: boolean;
  allowSelf?: boolean;
  resourceParam?: string;
}

// Service instances
let prismaService: PrismaService;
let redisService: RedisService;

/**
 * Initialize services for middleware
 */
async function initializeServices(): Promise<void> {
  if (!prismaService) {
    prismaService = new PrismaService();
    await prismaService.connect();
  }
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
}

/**
 * Extract JWT token from request headers
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  // Bearer token format
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Query parameter fallback (for WebSocket connections)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  // Cookie fallback
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  return null;
}

/**
 * Verify JWT token and decode payload
 */
function verifyToken(token: string): JwtTokenPayload {
  try {
    const jwtConfig = config.get('jwt');
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: ['HS256']
    }) as JwtTokenPayload;

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired', { expiredAt: error.expiredAt });
    }

    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token', { reason: error.message });
    }

    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
  if (!redisService) {
    return false; // Skip check if Redis is not available
  }

  try {
    const blacklisted = await redisService.get(`blacklist:${tokenId}`);
    return !!blacklisted;
  } catch (error) {
    securityLogger.logSuspicious('Failed to check token blacklist', {
      tokenId,
      error: error.message
    });
    return false; // Fail open for availability
  }
}

/**
 * Get user from database and cache
 */
async function getUser(userId: string): Promise<any> {
  await initializeServices();

  try {
    // Try cache first
    let user = null;
    if (redisService) {
      const cached = await redisService.get(`user:${userId}`);
      if (cached) {
        user = JSON.parse(cached);
      }
    }

    // Fallback to database
    if (!user) {
      user = await prismaService.user.findUnique({
        where: { id: userId },
        include: {
          permissions: true
        }
      });

      // Cache user data for 15 minutes
      if (user && redisService) {
        await redisService.setex(`user:${userId}`, 900, JSON.stringify(user));
      }
    }

    return user;
  } catch (error) {
    securityLogger.logSuspicious('Failed to fetch user', {
      userId,
      error: error.message
    });
    throw new AuthenticationError('Authentication failed');
  }
}

/**
 * Main authentication middleware
 */
export function authMiddleware(options: AuthOptions = { required: true }) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);

      // Handle missing token
      if (!token) {
        if (options.required) {
          securityLogger.logAuth('Missing authentication token', undefined, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
          });
          throw new AuthenticationError('Authentication token is required');
        }
        return next();
      }

      // Verify and decode token
      const payload = verifyToken(token);

      // Check token blacklist (unless skipped)
      if (!options.skipBlacklistCheck && payload.jti) {
        const isBlacklisted = await isTokenBlacklisted(payload.jti);
        if (isBlacklisted) {
          securityLogger.logAuth('Blacklisted token used', payload.userId, {
            tokenId: payload.jti,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          throw new AuthenticationError('Token has been revoked');
        }
      }

      // Get user from database
      const user = await getUser(payload.userId);

      if (!user) {
        securityLogger.logAuth('User not found for valid token', payload.userId, {
          tokenId: payload.jti,
          ip: req.ip
        });
        throw new AuthenticationError('User not found');
      }

      if (!user.isActive) {
        securityLogger.logAuth('Inactive user attempted access', payload.userId, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        throw new AuthenticationError('Account is inactive');
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        permissions: user.permissions?.map((p: any) => p.name) || [],
        sessionId: payload.sessionId
      };

      // Update last seen timestamp
      if (redisService) {
        await redisService.setex(`user:${user.id}:last_seen`, 3600, Date.now().toString());
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication middleware (doesn't require authentication)
 */
export const optionalAuth = authMiddleware({ required: false });

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(user.role)) {
      securityLogger.logAuthz('Insufficient role permissions', user.id, req.path, {
        userRole: user.role,
        requiredRoles: roles,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw new AuthorizationError(
        `Access denied. Required roles: ${roles.join(', ')}`,
        { userRole: user.role, requiredRoles: roles }
      );
    }

    next();
  };
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    const hasPermission = permissions.every(permission =>
      user.permissions.includes(permission)
    );

    if (!hasPermission) {
      securityLogger.logAuthz('Insufficient permissions', user.id, req.path, {
        userPermissions: user.permissions,
        requiredPermissions: permissions,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw new AuthorizationError(
        `Access denied. Required permissions: ${permissions.join(', ')}`,
        { userPermissions: user.permissions, requiredPermissions: permissions }
      );
    }

    next();
  };
}

/**
 * Resource ownership authorization middleware
 */
export function requireOwnership(resourceParam = 'id', resourceType = 'resource') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Admins can access any resource
      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
        return next();
      }

      const resourceId = req.params[resourceParam];

      if (!resourceId) {
        throw new AuthorizationError(`Missing ${resourceParam} parameter`);
      }

      // Check ownership based on resource type
      await initializeServices();

      let resource;
      switch (resourceType) {
        case 'post':
          resource = await prismaService.post.findUnique({
            where: { id: resourceId },
            select: { authorId: true }
          });
          break;
        case 'comment':
          resource = await prismaService.comment.findUnique({
            where: { id: resourceId },
            select: { authorId: true }
          });
          break;
        case 'user':
          // User can only access their own profile
          if (resourceId !== user.id) {
            throw new AuthorizationError('Access denied');
          }
          return next();
        default:
          throw new AuthorizationError(`Unknown resource type: ${resourceType}`);
      }

      if (!resource) {
        throw new AuthorizationError(`${resourceType} not found`);
      }

      if (resource.authorId !== user.id) {
        securityLogger.logAuthz('Resource ownership violation', user.id, req.path, {
          resourceType,
          resourceId,
          ownerId: resource.authorId,
          ip: req.ip
        });

        throw new AuthorizationError('Access denied. You can only access your own resources.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Moderator or admin middleware
 */
export const requireModerator = requireRole(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Blacklist token middleware (for logout)
 */
export function blacklistToken() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);

      if (token && redisService) {
        const payload = jwt.decode(token) as JwtTokenPayload;

        if (payload?.jti) {
          // Blacklist token until its natural expiration
          const ttl = payload.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await redisService.setex(`blacklist:${payload.jti}`, ttl, 'revoked');
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Rate limiting by user ID
 */
export function userRateLimit(maxRequests = 100, windowMs = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return next();
    }

    const now = Date.now();
    const userKey = user.id;
    const userRequests = requests.get(userKey);

    if (!userRequests || now > userRequests.resetTime) {
      // Reset counter
      requests.set(userKey, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      securityLogger.logRateLimit(req.ip, req.path, {
        userId: user.id,
        requestCount: userRequests.count,
        maxRequests
      });

      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        }
      });
      return;
    }

    userRequests.count++;
    next();
  };
}

/**
 * API key authentication middleware (for service-to-service communication)
 */
export function apiKeyAuth() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string;

      if (!apiKey) {
        throw new AuthenticationError('API key is required');
      }

      // Verify API key (implement your API key validation logic)
      const isValidKey = await validateApiKey(apiKey);

      if (!isValidKey) {
        securityLogger.logAuth('Invalid API key used', undefined, {
          apiKey: apiKey.substring(0, 8) + '...',
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        throw new AuthenticationError('Invalid API key');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate API key (implement based on your requirements)
 */
async function validateApiKey(apiKey: string): Promise<boolean> {
  // Implement your API key validation logic
  // This could check against a database, cache, or external service
  return false; // Placeholder
}

export { authMiddleware as auth };