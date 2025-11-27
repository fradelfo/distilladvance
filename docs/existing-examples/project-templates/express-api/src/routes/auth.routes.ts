/**
 * Authentication Routes
 * Handles user registration, login, token refresh, password management, and logout
 */

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';
import { authMiddleware, blacklistToken, JwtTokenPayload } from '../middleware/auth';
import { ApiError, AuthenticationError, ValidationApiError, ConflictError, NotFoundError, SuccessResponse } from '../utils/errors';
import { logger, securityLogger } from '../utils/logger';
import { config } from '../config/environment';
import { PrismaService } from '../services/prisma.service';
import { RedisService } from '../services/redis.service';
import { EmailService } from '../services/email.service';

const router = Router();
const prismaService = new PrismaService();
const redisService = new RedisService();
const emailService = new EmailService();

/**
 * Validation schemas
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  acceptTerms: z.boolean().refine(val => val === true, 'Terms and conditions must be accepted')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

/**
 * Rate limiting configurations
 */
const authRateLimit = rateLimit({
  windowMs: config.get('rateLimiting').auth.window,
  max: config.get('rateLimiting').auth.requests,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const strictAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts
  message: {
    success: false,
    error: {
      message: 'Too many failed attempts, account temporarily locked',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

/**
 * JWT token generation utility
 */
async function generateTokens(user: any): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const jwtConfig = config.get('jwt');

  // Generate unique session ID
  const sessionId = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Access token payload
  const accessPayload: JwtTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    aud: jwtConfig.audience,
    iss: jwtConfig.issuer,
    jti: `${user.id}_${Date.now()}_access`
  };

  // Generate access token
  const accessToken = jwt.sign(accessPayload, jwtConfig.secret);

  // Create refresh token in database
  const refreshTokenData = await prismaService.refreshToken.create({
    data: {
      token: `${user.id}_${Date.now()}_${Math.random().toString(36)}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      sessionId
    }
  });

  // Store session data in Redis
  await redisService.setSession(sessionId, {
    userId: user.id,
    email: user.email,
    role: user.role,
    loginTime: new Date().toISOString(),
    userAgent: user.userAgent || 'unknown',
    ip: user.ip || 'unknown'
  }, 7 * 24 * 3600); // 7 days

  return {
    accessToken,
    refreshToken: refreshTokenData.token,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
}

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
  authRateLimit,
  validateRequest(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prismaService.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      securityLogger.logAuth('Registration attempt with existing email', undefined, {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw new ConflictError('Email address is already registered', {
        field: 'email',
        value: email
      });
    }

    // Hash password
    const securityConfig = config.get('security');
    const hashedPassword = await bcrypt.hash(password, securityConfig.bcryptRounds);

    // Generate email verification token
    const verificationToken = jwt.sign(
      { email, purpose: 'email_verification' },
      config.get('jwt').secret,
      { expiresIn: '24h' }
    );

    // Create user
    const user = await prismaService.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'user',
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      }
    });

    // Send verification email
    if (config.get('email').enabled) {
      await emailService.sendVerificationEmail(user.email, verificationToken);
    }

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json(SuccessResponse.created({
      user,
      message: 'Registration successful. Please check your email to verify your account.'
    }));
  })
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post('/login',
  authRateLimit,
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body;

    // Find user
    const user = await prismaService.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      securityLogger.logAuth('Login attempt with non-existent email', undefined, {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      securityLogger.logAuth('Login attempt with invalid password', user.id, {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      securityLogger.logAuth('Login attempt with inactive account', user.id, {
        email,
        ip: req.ip
      });

      throw new AuthenticationError('Account is inactive. Please contact support.');
    }

    // Generate tokens
    const tokens = await generateTokens({
      ...user,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Update last login
    await prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      rememberMe,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set secure cookie for refresh token if remember me is selected
    if (rememberMe) {
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.isProduction(),
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json(SuccessResponse.ok({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer'
      }
    }, 'Login successful'));
  })
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  validateRequest(refreshSchema),
  asyncHandler(async (req: Request, res: Response) => {
    let { refreshToken } = req.body;

    // Also check cookies for refresh token
    if (!refreshToken && req.cookies?.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    // Find refresh token in database
    const tokenRecord = await prismaService.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord) {
      securityLogger.logAuth('Invalid refresh token used', undefined, {
        token: refreshToken.substring(0, 10) + '...',
        ip: req.ip
      });

      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prismaService.refreshToken.delete({
        where: { id: tokenRecord.id }
      });

      throw new AuthenticationError('Refresh token has expired');
    }

    // Check if user is still active
    if (!tokenRecord.user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Generate new tokens
    const tokens = await generateTokens({
      ...tokenRecord.user,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Delete old refresh token
    await prismaService.refreshToken.delete({
      where: { id: tokenRecord.id }
    });

    logger.info('Token refreshed successfully', {
      userId: tokenRecord.user.id,
      ip: req.ip
    });

    res.json(SuccessResponse.ok({
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer'
      }
    }, 'Token refreshed successfully'));
  })
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate tokens
 * @access  Private
 */
router.post('/logout',
  authMiddleware(),
  blacklistToken(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const token = req.headers.authorization?.split(' ')[1];

    // Delete all refresh tokens for this user
    await prismaService.refreshToken.deleteMany({
      where: { userId: user.id }
    });

    // Clear session from Redis
    if (user.sessionId) {
      await redisService.deleteSession(user.sessionId);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    logger.info('User logged out successfully', {
      userId: user.id,
      ip: req.ip
    });

    res.json(SuccessResponse.ok({}, 'Logged out successfully'));
  })
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
  strictAuthRateLimit,
  validateRequest(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Always return success for security (don't reveal if email exists)
    const user = await prismaService.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (user && user.isActive) {
      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password_reset' },
        config.get('jwt').secret,
        { expiresIn: '1h' }
      );

      // Save reset token to database
      await prismaService.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        }
      });

      // Send reset email
      if (config.get('email').enabled) {
        await emailService.sendPasswordResetEmail(user.email, resetToken);
      }

      securityLogger.logAuth('Password reset requested', user.id, {
        email,
        ip: req.ip
      });
    }

    res.json(SuccessResponse.ok({}, 'If the email exists, a password reset link has been sent.'));
  })
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  strictAuthRateLimit,
  validateRequest(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    // Verify reset token
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.get('jwt').secret);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Find user with matching token
    const user = await prismaService.user.findFirst({
      where: {
        id: decoded.userId,
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, config.get('security').bcryptRounds);

    // Update password and clear reset tokens
    await prismaService.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    // Invalidate all refresh tokens
    await prismaService.refreshToken.deleteMany({
      where: { userId: user.id }
    });

    logger.info('Password reset successfully', {
      userId: user.id,
      ip: req.ip
    });

    res.json(SuccessResponse.ok({}, 'Password reset successfully. Please log in with your new password.'));
  })
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email',
  validateRequest(verifyEmailSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    // Verify email verification token
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.get('jwt').secret);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired verification token');
    }

    // Find user with matching token
    const user = await prismaService.user.findFirst({
      where: {
        email: decoded.email,
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new AuthenticationError('Invalid or expired verification token');
    }

    // Update user as verified
    await prismaService.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    logger.info('Email verified successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.json(SuccessResponse.ok({}, 'Email verified successfully. Your account is now active.'));
  })
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me',
  authMiddleware(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    // Get full user details
    const fullUser = await prismaService.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      }
    });

    res.json(SuccessResponse.ok({ user: fullUser }));
  })
);

export default router;