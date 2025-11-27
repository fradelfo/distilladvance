/**
 * Server Entry Point
 * Bootstraps the Express application with proper configuration and error handling
 */

import 'reflect-metadata'; // Required for decorators and dependency injection
import { App } from './app';
import { logger } from './utils/logger';
import { config } from './config/environment';

/**
 * Bootstrap and start the application server
 */
async function bootstrap(): Promise<void> {
  try {
    // Log startup information
    logger.info('Starting Blog API Server', {
      environment: config.environment,
      version: config.app.version,
      nodeVersion: process.version,
      pid: process.pid
    });

    // Validate environment configuration
    if (!config.isValid()) {
      throw new Error('Invalid configuration. Please check environment variables.');
    }

    // Create and start application
    const app = new App();
    await app.start();

    // Log memory usage periodically in development
    if (config.environment === 'development') {
      setInterval(() => {
        const usage = process.memoryUsage();
        logger.debug('Memory usage', {
          rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(usage.external / 1024 / 1024)} MB`
        });
      }, 30000); // Log every 30 seconds
    }

  } catch (error) {
    logger.error('Failed to start application', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle module import vs direct execution
if (require.main === module) {
  bootstrap();
}

export { bootstrap };