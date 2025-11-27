/**
 * Request Logging Middleware
 * Structured logging for HTTP requests with performance tracking
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, requestLogger as loggerUtils } from '../utils/logger';

/**
 * Enhanced request interface with logging context
 */
interface RequestWithLogging extends Request {
  id: string;
  startTime: number;
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const enhancedReq = req as RequestWithLogging;

  // Add unique request ID
  enhancedReq.id = uuidv4();
  enhancedReq.startTime = Date.now();

  // Add request ID to response headers
  res.set('X-Request-ID', enhancedReq.id);

  // Log request start
  loggerUtils.logRequest(enhancedReq, enhancedReq.startTime);

  // Override end to log response
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]) {
    loggerUtils.logResponse(enhancedReq, this, enhancedReq.startTime);
    return originalEnd.apply(this, args);
  };

  next();
}