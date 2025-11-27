/**
 * Error Handling Utilities
 * Comprehensive error classes and utilities for consistent API error responses
 */

import { ValidationError } from 'zod';

/**
 * HTTP status codes enum for better type safety
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Error codes for API responses
 */
export enum ErrorCode {
  // Authentication errors
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',

  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RESOURCE_FORBIDDEN = 'RESOURCE_FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_GONE = 'RESOURCE_GONE',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // File upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED'
}

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code || this.getDefaultErrorCode(statusCode);
    this.details = details;
    this.isOperational = isOperational;

    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Get default error code based on status code
   */
  private getDefaultErrorCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.INVALID_INPUT;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTHENTICATION_REQUIRED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.ACCESS_DENIED;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.RESOURCE_CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCode.INTERNAL_ERROR;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }

  /**
   * Convert error to API response format
   */
  toJSON(): Record<string, any> {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details })
      }
    };
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required', details?: any) {
    super(HttpStatus.UNAUTHORIZED, message, ErrorCode.AUTHENTICATION_REQUIRED, details);
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied', details?: any) {
    super(HttpStatus.FORBIDDEN, message, ErrorCode.ACCESS_DENIED, details);
  }
}

/**
 * Validation Error
 */
export class ValidationApiError extends ApiError {
  constructor(message = 'Validation failed', details?: any) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, message, ErrorCode.VALIDATION_ERROR, details);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource', identifier?: string | number) {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;

    super(HttpStatus.NOT_FOUND, message, ErrorCode.RESOURCE_NOT_FOUND, {
      resource,
      identifier
    });
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details?: any) {
    super(HttpStatus.CONFLICT, message, ErrorCode.RESOURCE_CONFLICT, details);
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends ApiError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number, details?: any) {
    super(HttpStatus.TOO_MANY_REQUESTS, message, ErrorCode.RATE_LIMIT_EXCEEDED, {
      retryAfter,
      ...details
    });
    this.retryAfter = retryAfter;
  }
}

/**
 * Database Error
 */
export class DatabaseError extends ApiError {
  constructor(message = 'Database operation failed', details?: any) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, ErrorCode.DATABASE_ERROR, details, false);
  }
}

/**
 * External Service Error
 */
export class ExternalServiceError extends ApiError {
  constructor(service: string, message?: string, details?: any) {
    const errorMessage = message || `External service '${service}' is unavailable`;
    super(HttpStatus.BAD_GATEWAY, errorMessage, ErrorCode.EXTERNAL_SERVICE_ERROR, {
      service,
      ...details
    });
  }
}

/**
 * File Upload Error
 */
export class FileUploadError extends ApiError {
  constructor(message = 'File upload failed', code = ErrorCode.UPLOAD_FAILED, details?: any) {
    super(HttpStatus.BAD_REQUEST, message, code, details);
  }
}

/**
 * Error factory functions for common scenarios
 */
export const ErrorFactory = {
  /**
   * Create authentication error
   */
  unauthorized(message?: string): AuthenticationError {
    return new AuthenticationError(message);
  },

  /**
   * Create authorization error
   */
  forbidden(message?: string): AuthorizationError {
    return new AuthorizationError(message);
  },

  /**
   * Create not found error
   */
  notFound(resource?: string, identifier?: string | number): NotFoundError {
    return new NotFoundError(resource, identifier);
  },

  /**
   * Create validation error from Zod validation
   */
  validationError(error: ValidationError): ValidationApiError {
    const details = {
      issues: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    };

    return new ValidationApiError('Validation failed', details);
  },

  /**
   * Create conflict error
   */
  conflict(message: string, field?: string, value?: any): ConflictError {
    return new ConflictError(message, { field, value });
  },

  /**
   * Create rate limit error
   */
  rateLimited(retryAfter?: number): RateLimitError {
    return new RateLimitError(undefined, retryAfter);
  },

  /**
   * Create file upload error
   */
  fileTooBig(maxSize: number): FileUploadError {
    return new FileUploadError(
      `File size exceeds maximum allowed size of ${maxSize} bytes`,
      ErrorCode.FILE_TOO_LARGE,
      { maxSize }
    );
  },

  /**
   * Create invalid file type error
   */
  invalidFileType(allowedTypes: string[]): FileUploadError {
    return new FileUploadError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      ErrorCode.INVALID_FILE_TYPE,
      { allowedTypes }
    );
  }
};

/**
 * Error utility functions
 */
export const ErrorUtils = {
  /**
   * Check if error is operational (safe to expose to client)
   */
  isOperational(error: any): boolean {
    if (error instanceof ApiError) {
      return error.isOperational;
    }
    return false;
  },

  /**
   * Check if error is from client (4xx status codes)
   */
  isClientError(error: any): boolean {
    if (error instanceof ApiError) {
      return error.statusCode >= 400 && error.statusCode < 500;
    }
    return false;
  },

  /**
   * Check if error is from server (5xx status codes)
   */
  isServerError(error: any): boolean {
    if (error instanceof ApiError) {
      return error.statusCode >= 500;
    }
    return false;
  },

  /**
   * Convert unknown error to ApiError
   */
  toApiError(error: any): ApiError {
    // Already an ApiError
    if (error instanceof ApiError) {
      return error;
    }

    // Zod validation error
    if (error instanceof ValidationError) {
      return ErrorFactory.validationError(error);
    }

    // Prisma errors
    if (error.code === 'P2002') {
      return new ConflictError('Unique constraint violation', {
        fields: error.meta?.target
      });
    }

    if (error.code === 'P2025') {
      return new NotFoundError('Record');
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid token');
    }

    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Token expired');
    }

    // Generic error
    return new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      ErrorCode.INTERNAL_ERROR,
      undefined,
      false
    );
  },

  /**
   * Sanitize error for client response
   */
  sanitizeError(error: ApiError, includeStack = false): Record<string, any> {
    const response = error.toJSON();

    // Add stack trace in development
    if (includeStack && error.stack) {
      response.error.stack = error.stack;
    }

    return response;
  }
};

/**
 * Success response utility
 */
export const SuccessResponse = {
  /**
   * Create success response
   */
  ok(data?: any, message = 'Success'): Record<string, any> {
    return {
      success: true,
      message,
      ...(data && { data })
    };
  },

  /**
   * Create created response
   */
  created(data?: any, message = 'Resource created successfully'): Record<string, any> {
    return {
      success: true,
      message,
      ...(data && { data })
    };
  },

  /**
   * Create paginated response
   */
  paginated(
    items: any[],
    total: number,
    page: number,
    limit: number,
    message = 'Data retrieved successfully'
  ): Record<string, any> {
    return {
      success: true,
      message,
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    };
  }
};