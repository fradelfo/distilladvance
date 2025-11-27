/**
 * Metrics Collection Middleware
 * Collects performance and usage metrics for monitoring and observability
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

export class MetricsService {
  private metrics: Map<string, any> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private responseTimes: number[] = [];

  constructor() {
    // Clean up old metrics every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  recordRequest(method: string, path: string, statusCode: number, duration: number): void {
    const key = `${method}:${path}`;

    // Increment request count
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);

    // Record response time
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Store additional metrics
    this.metrics.set(`${key}:last_request`, {
      timestamp: Date.now(),
      statusCode,
      duration
    });
  }

  getMetrics(): any {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    return {
      totalRequests,
      averageResponseTime: avgResponseTime,
      requestsByEndpoint: Object.fromEntries(this.requestCounts),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  private cleanup(): void {
    // Keep only recent response times
    this.responseTimes = this.responseTimes.slice(-500);
  }
}

export function metricsMiddleware(metricsService: MetricsService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = performance.now();

    res.on('finish', () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      metricsService.recordRequest(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration
      );
    });

    next();
  };
}