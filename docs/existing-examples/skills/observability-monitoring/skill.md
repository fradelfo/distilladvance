# Observability & Monitoring Skill

Advanced observability and monitoring expertise covering distributed tracing, metrics collection, log aggregation, alerting, and comprehensive production monitoring strategies with modern tools and platforms.

## Skill Overview

Expert observability knowledge including distributed systems monitoring, application performance monitoring (APM), log management, metrics and alerting, SLI/SLO implementation, incident response, and modern observability platform architecture.

## Core Capabilities

### Distributed Tracing & APM
- **OpenTelemetry** - Instrumentation, trace collection, span analysis, context propagation
- **Jaeger/Zipkin** - Trace storage, query optimization, distributed trace analysis
- **APM platforms** - DataDog, New Relic, Dynatrace integration and optimization
- **Performance profiling** - CPU, memory, I/O analysis, bottleneck identification

### Metrics & Time-Series Monitoring
- **Prometheus** - Metric collection, PromQL queries, recording rules, federation
- **Grafana** - Dashboard design, alerting rules, visualization best practices
- **Custom metrics** - Application metrics, business KPIs, SLI implementation
- **Time-series optimization** - Data retention, storage optimization, query performance

### Log Management & Analysis
- **ELK Stack** - Elasticsearch, Logstash, Kibana architecture and optimization
- **Modern alternatives** - Loki, Fluentd, Vector for log processing
- **Structured logging** - JSON logging, correlation IDs, log standardization
- **Log analysis** - Pattern recognition, anomaly detection, security monitoring

### Alerting & Incident Response
- **Alert management** - PagerDuty, Slack integration, escalation policies
- **SLO/SLI monitoring** - Error budgets, availability targets, performance thresholds
- **Incident automation** - Auto-remediation, runbook automation, post-mortem generation
- **On-call optimization** - Alert fatigue reduction, intelligent routing, notification strategies

## Modern Observability Implementation

### Comprehensive Observability Platform with OpenTelemetry
```typescript
// Advanced observability platform with distributed tracing, metrics, and logging
import express, { Express, Request, Response, NextFunction } from 'express';
import { NodeTracerProvider } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MetricReader, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { trace, metrics, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import Winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import prometheus from 'prom-client';
import { createPrometheusMetrics } from 'express-prometheus-middleware';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Types and interfaces
interface ObservabilityConfig {
  serviceName: string;
  environment: string;
  jaeger: {
    endpoint: string;
    username?: string;
    password?: string;
  };
  prometheus: {
    endpoint: string;
    port: number;
  };
  elasticsearch: {
    node: string;
    username?: string;
    password?: string;
  };
  alerts: {
    webhookUrl?: string;
    slackToken?: string;
    pagerdutyToken?: string;
  };
}

interface SpanContext {
  traceId: string;
  spanId: string;
  correlationId: string;
}

interface MetricLabels {
  service: string;
  environment: string;
  version: string;
  endpoint?: string;
  method?: string;
  statusCode?: string;
}

interface SLOConfig {
  name: string;
  description: string;
  sli: {
    metric: string;
    threshold: number;
    timeWindow: string;
  };
  errorBudget: number; // percentage
  alertThresholds: {
    warning: number;
    critical: number;
  };
}

// Core observability platform
class ObservabilityPlatform {
  private config: ObservabilityConfig;
  private tracer: any;
  private meter: any;
  private logger: Winston.Logger;
  private app: Express;
  private prisma: PrismaClient;
  private redis: Redis;

  // Metrics
  private requestDuration: prometheus.Histogram<string>;
  private requestCount: prometheus.Counter<string>;
  private activeConnections: prometheus.Gauge<string>;
  private errorCount: prometheus.Counter<string>;
  private businessMetrics: Map<string, prometheus.Counter<string> | prometheus.Gauge<string>>;

  // SLOs and alerting
  private sloConfigs: Map<string, SLOConfig>;
  private alertManager: AlertManager;

  constructor(config: ObservabilityConfig) {
    this.config = config;
    this.businessMetrics = new Map();
    this.sloConfigs = new Map();

    this.setupTracing();
    this.setupMetrics();
    this.setupLogging();
    this.setupExpress();
    this.alertManager = new AlertManager(config.alerts);

    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL);
  }

  private setupTracing(): void {
    // Configure OpenTelemetry tracing
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
      }),
      instrumentations: [getNodeAutoInstrumentations()]
    });

    // Configure Jaeger exporter
    const jaegerExporter = new JaegerExporter({
      endpoint: this.config.jaeger.endpoint,
      username: this.config.jaeger.username,
      password: this.config.jaeger.password,
    });

    provider.addSpanProcessor(
      new (require('@opentelemetry/sdk-tracing-base').BatchSpanProcessor)(jaegerExporter)
    );

    provider.register();
    this.tracer = trace.getTracer(this.config.serviceName);
  }

  private setupMetrics(): void {
    // Configure OpenTelemetry metrics
    const metricReader = new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: this.config.prometheus.endpoint,
      }),
      exportIntervalMillis: 5000,
    });

    const meterProvider = new (require('@opentelemetry/sdk-metrics').MeterProvider)({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
      }),
      readers: [metricReader],
    });

    metrics.setGlobalMeterProvider(meterProvider);
    this.meter = metrics.getMeter(this.config.serviceName);

    // Prometheus metrics setup
    prometheus.register.clear();

    this.requestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    });

    this.requestCount = new prometheus.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service']
    });

    this.activeConnections = new prometheus.Gauge({
      name: 'http_connections_active',
      help: 'Number of active HTTP connections',
      labelNames: ['service']
    });

    this.errorCount = new prometheus.Counter({
      name: 'application_errors_total',
      help: 'Total number of application errors',
      labelNames: ['error_type', 'service', 'severity']
    });

    // Register default metrics
    prometheus.collectDefaultMetrics({ prefix: 'nodejs_' });
  }

  private setupLogging(): void {
    // Enhanced structured logging with correlation
    const esTransport = new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: this.config.elasticsearch.node,
        auth: this.config.elasticsearch.username ? {
          username: this.config.elasticsearch.username,
          password: this.config.elasticsearch.password!
        } : undefined
      },
      index: `logs-${this.config.serviceName}-${this.config.environment}`,
      transformer: (logData: any) => ({
        '@timestamp': new Date(),
        severity: logData.level,
        service: this.config.serviceName,
        environment: this.config.environment,
        message: logData.message,
        ...logData.meta,
        traceId: logData.meta?.traceId,
        spanId: logData.meta?.spanId,
        correlationId: logData.meta?.correlationId
      })
    });

    this.logger = Winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: Winston.format.combine(
        Winston.format.timestamp(),
        Winston.format.errors({ stack: true }),
        Winston.format.json(),
        Winston.format((info) => {
          // Add trace context to logs
          const span = trace.getActiveSpan();
          if (span) {
            const spanContext = span.spanContext();
            info.traceId = spanContext.traceId;
            info.spanId = spanContext.spanId;
          }
          return info;
        })()
      ),
      transports: [
        new Winston.transports.Console({
          format: Winston.format.combine(
            Winston.format.colorize(),
            Winston.format.simple()
          )
        }),
        esTransport
      ]
    });
  }

  private setupExpress(): void {
    this.app = express();

    // Correlation ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      req.headers['x-correlation-id'] = correlationId;
      res.setHeader('x-correlation-id', correlationId);

      // Store in context for logging
      context.with(context.active(), () => {
        next();
      });
    });

    // Request tracing middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const span = this.tracer.startSpan(`${req.method} ${req.path}`, {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': req.method,
          'http.url': req.url,
          'http.route': req.path,
          'http.user_agent': req.get('User-Agent'),
          'correlation.id': req.headers['x-correlation-id'] as string,
        }
      });

      context.with(trace.setSpan(context.active(), span), () => {
        const startTime = Date.now();

        res.on('finish', () => {
          const duration = (Date.now() - startTime) / 1000;

          // Update span with response data
          span.setAttributes({
            'http.status_code': res.statusCode,
            'http.response_size': res.get('Content-Length'),
          });

          if (res.statusCode >= 400) {
            span.setStatus({ code: SpanStatusCode.ERROR });
          } else {
            span.setStatus({ code: SpanStatusCode.OK });
          }

          span.end();

          // Record Prometheus metrics
          this.requestDuration
            .labels(req.method, req.path, res.statusCode.toString(), this.config.serviceName)
            .observe(duration);

          this.requestCount
            .labels(req.method, req.path, res.statusCode.toString(), this.config.serviceName)
            .inc();

          // Log request
          this.logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: duration,
            userAgent: req.get('User-Agent'),
            correlationId: req.headers['x-correlation-id']
          });
        });

        next();
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req: Request, res: Response) => {
      res.set('Content-Type', prometheus.register.contentType);
      res.end(await prometheus.register.metrics());
    });

    // Health check with detailed status
    this.app.get('/health', async (req: Request, res: Response) => {
      const span = this.tracer.startSpan('health_check');

      try {
        const checks = await Promise.allSettled([
          this.checkDatabase(),
          this.checkRedis(),
          this.checkExternalDependencies()
        ]);

        const health = {
          status: 'healthy',
          timestamp: new Date(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          environment: this.config.environment,
          checks: {
            database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
            redis: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
            external: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
          }
        };

        const isHealthy = checks.every(check => check.status === 'fulfilled');
        span.setStatus({ code: isHealthy ? SpanStatusCode.OK : SpanStatusCode.ERROR });

        res.status(isHealthy ? 200 : 503).json(health);
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        res.status(503).json({ status: 'unhealthy', error: (error as Error).message });
      } finally {
        span.end();
      }
    });
  }

  // Business metrics methods
  public incrementBusinessMetric(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    let metric = this.businessMetrics.get(name);
    if (!metric) {
      metric = new prometheus.Counter({
        name: `business_${name}_total`,
        help: `Business metric: ${name}`,
        labelNames: Object.keys(labels)
      });
      this.businessMetrics.set(name, metric);
    }
    (metric as prometheus.Counter<string>).inc(labels, value);
  }

  public setBusinessGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    let metric = this.businessMetrics.get(name);
    if (!metric) {
      metric = new prometheus.Gauge({
        name: `business_${name}`,
        help: `Business gauge: ${name}`,
        labelNames: Object.keys(labels)
      });
      this.businessMetrics.set(name, metric);
    }
    (metric as prometheus.Gauge<string>).set(labels, value);
  }

  // SLO monitoring
  public defineSLO(config: SLOConfig): void {
    this.sloConfigs.set(config.name, config);

    // Create alerting rules for SLO
    this.setupSLOAlerting(config);
  }

  private setupSLOAlerting(config: SLOConfig): void {
    setInterval(async () => {
      try {
        const sliValue = await this.calculateSLI(config);
        const errorBudgetUsed = ((config.sli.threshold - sliValue) / config.sli.threshold) * 100;

        if (errorBudgetUsed >= config.alertThresholds.critical) {
          await this.alertManager.sendAlert({
            severity: 'critical',
            title: `SLO Critical: ${config.name}`,
            description: `SLI: ${sliValue}%, Error Budget Used: ${errorBudgetUsed}%`,
            labels: { slo: config.name, severity: 'critical' }
          });
        } else if (errorBudgetUsed >= config.alertThresholds.warning) {
          await this.alertManager.sendAlert({
            severity: 'warning',
            title: `SLO Warning: ${config.name}`,
            description: `SLI: ${sliValue}%, Error Budget Used: ${errorBudgetUsed}%`,
            labels: { slo: config.name, severity: 'warning' }
          });
        }

        // Record SLO metrics
        this.setBusinessGauge(`slo_${config.name}_sli`, sliValue);
        this.setBusinessGauge(`slo_${config.name}_error_budget_used`, errorBudgetUsed);

      } catch (error) {
        this.logger.error('SLO calculation error', { slo: config.name, error });
      }
    }, 60000); // Check every minute
  }

  private async calculateSLI(config: SLOConfig): Promise<number> {
    // Query Prometheus for SLI calculation
    const query = config.sli.metric;
    const timeWindow = config.sli.timeWindow;

    try {
      const response = await axios.get(`${this.config.prometheus.endpoint}/api/v1/query`, {
        params: {
          query: query,
          time: Math.floor(Date.now() / 1000)
        }
      });

      const result = response.data.data.result[0];
      return parseFloat(result?.value[1] || '0');
    } catch (error) {
      this.logger.error('SLI calculation failed', { query, error });
      return 0;
    }
  }

  // Error tracking and monitoring
  public recordError(error: Error, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', context?: Record<string, any>): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }

    this.errorCount
      .labels(error.constructor.name, this.config.serviceName, severity)
      .inc();

    this.logger.error('Application Error', {
      error: error.message,
      stack: error.stack,
      severity,
      ...context
    });

    // Alert on critical errors
    if (severity === 'critical') {
      this.alertManager.sendAlert({
        severity: 'critical',
        title: 'Critical Application Error',
        description: error.message,
        labels: { error_type: error.constructor.name, service: this.config.serviceName }
      }).catch(alertError => {
        this.logger.error('Failed to send critical error alert', { alertError });
      });
    }
  }

  // Custom instrumentation helpers
  public async instrumentAsyncOperation<T>(
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string | number>
  ): Promise<T> {
    const span = this.tracer.startSpan(name, { attributes });

    try {
      const result = await context.with(trace.setSpan(context.active(), span), operation);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }

  public instrumentSyncOperation<T>(
    name: string,
    operation: () => T,
    attributes?: Record<string, string | number>
  ): T {
    const span = this.tracer.startSpan(name, { attributes });

    try {
      const result = context.with(trace.setSpan(context.active(), span), operation);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }

  // Database monitoring
  private async checkDatabase(): Promise<void> {
    await this.instrumentAsyncOperation('database_health_check', async () => {
      await this.prisma.$queryRaw`SELECT 1`;
    });
  }

  // Redis monitoring
  private async checkRedis(): Promise<void> {
    await this.instrumentAsyncOperation('redis_health_check', async () => {
      await this.redis.ping();
    });
  }

  // External dependencies monitoring
  private async checkExternalDependencies(): Promise<void> {
    await this.instrumentAsyncOperation('external_dependencies_check', async () => {
      // Check external APIs, services, etc.
      const checks = [
        axios.get('https://api.external-service.com/health', { timeout: 5000 }),
        // Add more external dependency checks
      ];

      await Promise.all(checks);
    });
  }

  // Performance monitoring
  public startPerformanceTimer(name: string): () => number {
    const start = process.hrtime.bigint();

    return () => {
      const duration = Number(process.hrtime.bigint() - start) / 1e6; // Convert to ms

      // Record custom performance metric
      const performanceTimer = new prometheus.Histogram({
        name: `performance_${name}_duration_ms`,
        help: `Performance timing for ${name}`,
        labelNames: ['service']
      });

      performanceTimer.labels(this.config.serviceName).observe(duration);

      this.logger.debug('Performance Timing', {
        operation: name,
        duration,
        unit: 'ms'
      });

      return duration;
    };
  }

  // Audit logging
  public logAuditEvent(event: string, userId?: string, details?: Record<string, any>): void {
    this.logger.info('Audit Event', {
      event,
      userId,
      timestamp: new Date(),
      ...details,
      audit: true
    });

    // Increment audit metric
    this.incrementBusinessMetric('audit_events', { event, service: this.config.serviceName });
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      this.logger.info('Observability platform started', {
        port,
        service: this.config.serviceName,
        environment: this.config.environment
      });

      // Record service start metric
      this.incrementBusinessMetric('service_starts', { service: this.config.serviceName });
    });
  }
}

// Alert Manager for notifications
class AlertManager {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async sendAlert(alert: {
    severity: string;
    title: string;
    description: string;
    labels?: Record<string, string>;
  }): Promise<void> {
    try {
      // Send to multiple channels
      await Promise.allSettled([
        this.sendSlackAlert(alert),
        this.sendPagerDutyAlert(alert),
        this.sendWebhookAlert(alert)
      ]);
    } catch (error) {
      console.error('Alert sending failed:', error);
    }
  }

  private async sendSlackAlert(alert: any): Promise<void> {
    if (!this.config.slackToken) return;

    const color = {
      'critical': 'danger',
      'warning': 'warning',
      'info': 'good'
    }[alert.severity] || 'warning';

    const payload = {
      text: alert.title,
      attachments: [{
        color,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Description', value: alert.description, short: false }
        ],
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    await axios.post(this.config.slackToken, payload);
  }

  private async sendPagerDutyAlert(alert: any): Promise<void> {
    if (!this.config.pagerdutyToken || alert.severity !== 'critical') return;

    const payload = {
      routing_key: this.config.pagerdutyToken,
      event_action: 'trigger',
      payload: {
        summary: alert.title,
        source: 'observability-platform',
        severity: alert.severity,
        custom_details: alert.labels
      }
    };

    await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
  }

  private async sendWebhookAlert(alert: any): Promise<void> {
    if (!this.config.webhookUrl) return;

    await axios.post(this.config.webhookUrl, {
      alert,
      timestamp: new Date()
    });
  }
}

// Usage example
const config: ObservabilityConfig = {
  serviceName: 'my-application',
  environment: process.env.NODE_ENV || 'development',
  jaeger: {
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    username: process.env.JAEGER_USERNAME,
    password: process.env.JAEGER_PASSWORD,
  },
  prometheus: {
    endpoint: process.env.PROMETHEUS_ENDPOINT || 'http://localhost:9090',
    port: 9464
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
  alerts: {
    webhookUrl: process.env.WEBHOOK_URL,
    slackToken: process.env.SLACK_WEBHOOK_URL,
    pagerdutyToken: process.env.PAGERDUTY_ROUTING_KEY,
  }
};

// Initialize platform
const observability = new ObservabilityPlatform(config);

// Define SLOs
observability.defineSLO({
  name: 'availability',
  description: 'Service availability SLO',
  sli: {
    metric: 'rate(http_requests_total{status_code!~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
    threshold: 99.9,
    timeWindow: '30d'
  },
  errorBudget: 0.1,
  alertThresholds: {
    warning: 50, // 50% of error budget used
    critical: 80 // 80% of error budget used
  }
});

observability.defineSLO({
  name: 'latency',
  description: 'Response time SLO',
  sli: {
    metric: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000',
    threshold: 500, // 500ms
    timeWindow: '30d'
  },
  errorBudget: 5, // 5% of requests can exceed threshold
  alertThresholds: {
    warning: 60,
    critical: 80
  }
});

// Example usage in application code
export class ExampleService {
  constructor(private observability: ObservabilityPlatform) {}

  async processOrder(orderId: string): Promise<void> {
    return this.observability.instrumentAsyncOperation(
      'process_order',
      async () => {
        const timer = this.observability.startPerformanceTimer('order_processing');

        try {
          // Simulate order processing
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

          // Record business metrics
          this.observability.incrementBusinessMetric('orders_processed', {
            status: 'success'
          });

          // Log audit event
          this.observability.logAuditEvent('order_processed', 'user_123', {
            orderId,
            amount: 99.99
          });

          timer(); // Record timing
        } catch (error) {
          this.observability.recordError(error as Error, 'high', { orderId });
          this.observability.incrementBusinessMetric('orders_processed', {
            status: 'error'
          });
          throw error;
        }
      },
      { orderId, operation: 'order_processing' }
    );
  }
}

export { ObservabilityPlatform, ObservabilityConfig, AlertManager };
```

## Skill Activation Triggers

This skill automatically activates when:
- Production monitoring systems are needed
- Distributed tracing implementation is required
- Application performance monitoring (APM) is requested
- SLO/SLI implementation and monitoring is needed
- Alert management and incident response systems are required
- Observability platform architecture and optimization is requested

This comprehensive observability and monitoring skill provides expert-level capabilities for building modern, scalable monitoring systems with advanced features for distributed systems, performance optimization, and production reliability.