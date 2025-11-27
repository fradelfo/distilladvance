/**
 * Global Error Handling Middleware
 * Catches and processes all application errors with proper logging and response formatting
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { ApiError, ErrorUtils, HttpStatus, ErrorCode } from '../utils/errors';
import { logger, securityLogger } from '../utils/logger';
import { config } from '../config/environment';

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    requestId?: string;
    timestamp: string;
    path: string;
    stack?: string;
  };
}

/**
 * Global error handling middleware
 * Must be the last middleware in the stack
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip if response is already sent
  if (res.headersSent) {
    return next(error);
  }

  // Convert unknown errors to ApiError
  const apiError = processError(error);

  // Log error with context
  logError(apiError, req, error);

  // Send error response
  sendErrorResponse(apiError, req, res);
}

/**
 * Process and convert various error types to ApiError
 */
function processError(error: any): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = {
      issues: error.issues.map(issue => ({
        field: issue.path.join('.') || 'unknown',
        message: issue.message,
        code: issue.code,
        received: issue.received
      }))
    };

    return new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Validation failed',
      ErrorCode.VALIDATION_ERROR,
      details
    );
  }

  // Multer file upload errors
  if (error instanceof MulterError) {
    return handleMulterError(error);
  }

  // Prisma database errors
  if (error.code?.startsWith('P')) {
    return handlePrismaError(error);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new ApiError(
      HttpStatus.UNAUTHORIZED,
      'Invalid authentication token',
      ErrorCode.TOKEN_INVALID
    );
  }

  if (error.name === 'TokenExpiredError') {
    return new ApiError(
      HttpStatus.UNAUTHORIZED,
      'Authentication token has expired',
      ErrorCode.TOKEN_EXPIRED
    );
  }

  // Syntax errors (malformed JSON, etc.)
  if (error instanceof SyntaxError && 'body' in error) {
    return new ApiError(
      HttpStatus.BAD_REQUEST,
      'Invalid JSON in request body',
      ErrorCode.INVALID_FORMAT,
      { originalError: error.message }
    );
  }

  // Type errors (usually programming errors)
  if (error instanceof TypeError) {
    return new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      ErrorCode.INTERNAL_ERROR,
      undefined,
      false // Not operational
    );
  }

  // Range errors
  if (error instanceof RangeError) {
    return new ApiError(
      HttpStatus.BAD_REQUEST,
      'Invalid range or value provided',
      ErrorCode.INVALID_INPUT,
      { originalError: error.message }
    );
  }

  // Reference errors (usually programming errors)
  if (error instanceof ReferenceError) {
    return new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      ErrorCode.INTERNAL_ERROR,
      undefined,
      false
    );
  }

  // MongoDB/Mongoose errors
  if (error.name === 'CastError') {
    return new ApiError(
      HttpStatus.BAD_REQUEST,
      'Invalid ID format',
      ErrorCode.INVALID_FORMAT,
      { field: error.path, value: error.value }
    );
  }

  if (error.name === 'ValidationError' && error.errors) {
    const details = Object.keys(error.errors).map(field => ({
      field,
      message: error.errors[field].message
    }));

    return new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Validation failed',
      ErrorCode.VALIDATION_ERROR,
      { issues: details }
    );
  }

  // Default case - unknown error
  const isProduction = config.isProduction();
  const message = isProduction ? 'Internal server error' : error.message || 'Unknown error';

  return new ApiError(
    HttpStatus.INTERNAL_SERVER_ERROR,
    message,
    ErrorCode.INTERNAL_ERROR,
    isProduction ? undefined : { originalError: error.message, stack: error.stack },
    false
  );
}

/**
 * Handle Multer (file upload) errors
 */
function handleMulterError(error: MulterError): ApiError {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ApiError(
        HttpStatus.BAD_REQUEST,
        'File size exceeds maximum allowed size',
        ErrorCode.FILE_TOO_LARGE,
        { limit: error.message }
      );

    case 'LIMIT_FILE_COUNT':
      return new ApiError(
        HttpStatus.BAD_REQUEST,
        'Too many files uploaded',
        ErrorCode.INVALID_INPUT,
        { message: error.message }
      );

    case 'LIMIT_UNEXPECTED_FILE':
      return new ApiError(
        HttpStatus.BAD_REQUEST,
        'Unexpected file field',
        ErrorCode.INVALID_INPUT,
        { field: error.field }
      );

    case 'MISSING_FIELD_NAME':
      return new ApiError(
        HttpStatus.BAD_REQUEST,
        'Missing field name for file upload',
        ErrorCode.REQUIRED_FIELD_MISSING
      );

    default:
      return new ApiError(
        HttpStatus.BAD_REQUEST,
        'File upload error',
        ErrorCode.UPLOAD_FAILED,
        { originalError: error.message }
      );
  }
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: any): ApiError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.join(', ') : target;

      return new ApiError(
        HttpStatus.CONFLICT,
        `Duplicate entry for ${fields || 'field'}`,
        ErrorCode.RESOURCE_CONFLICT,
        { fields: target }
      );

    case 'P2014':
      // Required relation violation
      return new ApiError(
        HttpStatus.BAD_REQUEST,
        'Related record is required but missing',
        ErrorCode.VALIDATION_ERROR,
        { relation: error.meta?.relation_name }
      );

    case 'P2003':
      // Foreign key constraint violation
      return new ApiError(
        HttpStatus.BAD_REQUEST,
        'Foreign key constraint violation',
        ErrorCode.VALIDATION_ERROR,
        { field: error.meta?.field_name }
      );

    case 'P2025':
      // Record not found
      return new ApiError(
        HttpStatus.NOT_FOUND,
        'Record not found',
        ErrorCode.RESOURCE_NOT_FOUND
      );

    case 'P2000':
      // Value too long
      return new ApiError(
        HttpStatus.BAD_REQUEST,
        'Value too long for database column',
        ErrorCode.INVALID_INPUT,
        { column: error.meta?.column_name }
      );

    case 'P2001':
      // Record does not exist
      return new ApiError(
        HttpStatus.NOT_FOUND,
        'Related record does not exist',
        ErrorCode.RESOURCE_NOT_FOUND,
        { model: error.meta?.model_name }
      );

    case 'P2015':
      // Related record not found
      return new ApiError(
        HttpStatus.NOT_FOUND,
        'Related record not found',
        ErrorCode.RESOURCE_NOT_FOUND
      );

    case 'P1008':
      // Operation timeout
      return new ApiError(
        HttpStatus.SERVICE_UNAVAILABLE,
        'Database operation timed out',
        ErrorCode.SERVICE_UNAVAILABLE
      );

    case 'P1001':
      // Can't reach database server
      return new ApiError(
        HttpStatus.SERVICE_UNAVAILABLE,
        'Database server unavailable',
        ErrorCode.DATABASE_ERROR,
        undefined,
        false
      );

    default:
      return new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Database error',
        ErrorCode.DATABASE_ERROR,
        { code: error.code, message: error.message },
        false
      );
  }
}

/**
 * Log error with appropriate level and context
 */
function logError(apiError: ApiError, req: Request, originalError?: any): void {
  const logContext = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
    statusCode: apiError.statusCode,
    errorCode: apiError.code,
    isOperational: apiError.isOperational
  };

  // Log based on error type and severity
  if (apiError.statusCode >= 500) {
    // Server errors
    logger.error('Server error occurred', logContext, originalError || apiError);
  } else if (apiError.statusCode === 429) {
    // Rate limiting
    securityLogger.logRateLimit(req.ip, req.originalUrl, logContext);
  } else if (apiError.statusCode === 401 || apiError.statusCode === 403) {
    // Authentication/Authorization errors
    securityLogger.logAuth(apiError.message, (req as any).user?.id, logContext);
  } else if (apiError.statusCode >= 400) {
    // Client errors
    logger.warn('Client error occurred', logContext);
  } else {
    // Other errors
    logger.info('Request completed with error', logContext);
  }

  // Log original error details for non-operational errors
  if (!apiError.isOperational && originalError) {
    logger.error('Non-operational error details', {
      ...logContext,
      originalError: {
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack
      }
    });
  }
}

/**
 * Send formatted error response to client
 */
function sendErrorResponse(apiError: ApiError, req: Request, res: Response): void {
  const isDevelopment = config.isDevelopment();

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code,
      statusCode: apiError.statusCode,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  };

  // Add details if available and operational error
  if (apiError.details && apiError.isOperational) {
    errorResponse.error.details = apiError.details;
  }

  // Add stack trace in development for debugging
  if (isDevelopment && apiError.stack) {
    errorResponse.error.stack = apiError.stack;
  }

  // Set appropriate headers
  res.status(apiError.statusCode);

  // Add rate limit headers for 429 errors
  if (apiError.statusCode === 429 && apiError instanceof ApiError) {
    const retryAfter = (apiError as any).retryAfter;
    if (retryAfter) {
      res.set('Retry-After', retryAfter.toString());
    }
  }

  // Security headers for error responses
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });

  // Send JSON response
  res.json(errorResponse);
}

/**
 * Async error handler wrapper
 * Use this to wrap async route handlers to automatically catch errors
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 * Should be placed before the global error handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new ApiError(
    HttpStatus.NOT_FOUND,
    `Endpoint not found: ${req.method} ${req.originalUrl}`,
    ErrorCode.RESOURCE_NOT_FOUND,
    {
      method: req.method,
      path: req.originalUrl,
      availableEndpoints: req.method === 'OPTIONS' ? ['GET', 'POST', 'PUT', 'DELETE'] : undefined
    }
  );

  next(error);
}