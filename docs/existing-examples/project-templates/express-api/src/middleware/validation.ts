/**
 * Request Validation Middleware
 * Validates request data against Zod schemas with comprehensive error reporting
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationApiError } from '../utils/errors';

/**
 * Validation target type
 */
type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

/**
 * Validation middleware factory
 */
export function validateRequest(
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[target];

      // Parse and validate data
      const validatedData = schema.parse(dataToValidate);

      // Replace request data with validated data
      req[target] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationApiError(
          'Request validation failed',
          {
            target,
            issues: error.issues.map(issue => ({
              field: issue.path.join('.') || 'root',
              message: issue.message,
              code: issue.code,
              received: issue.received,
              expected: issue.expected
            }))
          }
        );

        next(validationError);
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request body
 */
export const validateBody = (schema: ZodSchema) => validateRequest(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => validateRequest(schema, 'query');

/**
 * Validate route parameters
 */
export const validateParams = (schema: ZodSchema) => validateRequest(schema, 'params');

/**
 * Validate headers
 */
export const validateHeaders = (schema: ZodSchema) => validateRequest(schema, 'headers');