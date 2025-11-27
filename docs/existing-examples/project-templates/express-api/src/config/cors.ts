/**
 * CORS Configuration
 * Secure Cross-Origin Resource Sharing setup for the API
 */

import { CorsOptions } from 'cors';
import { config } from './environment';
import { logger } from '../utils/logger';

/**
 * Dynamic CORS configuration with security considerations
 */
export const corsConfig: CorsOptions = {
  // Dynamic origin validation
  origin: (origin, callback) => {
    const allowedOrigins = config.get('security').corsOrigins;

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin && config.isDevelopment()) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow localhost in development
    if (config.isDevelopment() && origin) {
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/;
      if (localhostRegex.test(origin)) {
        return callback(null, true);
      }
    }

    // Log rejected origins for security monitoring
    logger.warn('CORS origin rejected', { origin, allowedOrigins });
    callback(new Error('Not allowed by CORS'));
  },

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'X-Forwarded-For',
    'User-Agent'
  ],

  // Headers exposed to the client
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Location'
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Preflight cache time (24 hours)
  maxAge: 86400,

  // Handle preflight for all routes
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Strict CORS configuration for production APIs
 */
export const strictCorsConfig: CorsOptions = {
  origin: config.get('security').corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Origin',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Development CORS configuration (more permissive)
 */
export const devCorsConfig: CorsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: '*',
  credentials: true,
  maxAge: 3600,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

/**
 * Get appropriate CORS configuration based on environment
 */
export function getCorsConfig(): CorsOptions {
  if (config.isDevelopment()) {
    return devCorsConfig;
  }

  if (config.isProduction()) {
    return strictCorsConfig;
  }

  return corsConfig;
}