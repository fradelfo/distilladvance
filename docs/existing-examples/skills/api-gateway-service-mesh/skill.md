# API Gateway & Service Mesh Skill

Advanced API gateway and service mesh expertise covering traffic management, security policies, observability, and comprehensive API infrastructure platform development with modern orchestration tools.

## Skill Overview

Expert API gateway and service mesh knowledge including traffic routing, load balancing, security policy enforcement, service discovery, circuit breaking, distributed tracing, and modern API infrastructure platform engineering.

## Core Capabilities

### API Gateway Architecture
- **Kong Gateway** - Plugin ecosystem, rate limiting, authentication, request/response transformation
- **Ambassador/Emissary** - Kubernetes-native gateway, gRPC support, canary deployments
- **AWS API Gateway** - Serverless APIs, usage plans, API keys, throttling, caching
- **Azure API Management** - Policy definitions, developer portals, versioning, analytics

### Service Mesh Implementation
- **Istio** - Traffic management, security policies, observability, multi-cluster deployment
- **Linkerd** - Lightweight mesh, automatic mTLS, traffic splitting, real-time metrics
- **Consul Connect** - Service discovery, intention-based security, multi-datacenter
- **AWS App Mesh** - Virtual services, traffic routing, health checks, observability

### Traffic Management
- **Load balancing** - Round-robin, weighted, least-connection, session affinity algorithms
- **Traffic routing** - Path-based, header-based, canary, blue-green deployment strategies
- **Circuit breakers** - Failure detection, fallback mechanisms, health monitoring
- **Rate limiting** - Token bucket, sliding window, quota management, dynamic scaling

### Security & Policies
- **mTLS encryption** - Certificate management, rotation, validation, trust domains
- **Authorization policies** - RBAC, ABAC, JWT validation, custom claims processing
- **API security** - OAuth integration, API key management, threat protection
- **Network policies** - Zero-trust networking, microsegmentation, compliance enforcement

## Modern API Gateway & Service Mesh Implementation

### Comprehensive API Infrastructure Platform with Istio and Kong
```typescript
// Advanced API Gateway and Service Mesh platform with traffic management and security
import express, { Express, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import Kong from 'kong-admin-api';
import { Kafka, Producer, Consumer } from 'kafkajs';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import CircuitBreaker from 'opossum';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { Registry, Histogram, Counter, Gauge } from 'prom-client';
import * as k8s from '@kubernetes/client-node';
import yaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Types and interfaces
interface GatewayConfig {
  name: string;
  type: 'kong' | 'istio' | 'ambassador' | 'custom';
  endpoints: EndpointConfig[];
  security: SecurityConfig;
  rateLimit: RateLimitConfig;
  loadBalancing: LoadBalancerConfig;
  monitoring: MonitoringConfig;
}

interface EndpointConfig {
  path: string;
  methods: string[];
  upstream: UpstreamConfig;
  plugins: PluginConfig[];
  authentication?: AuthenticationConfig;
  rateLimit?: RateLimitConfig;
  caching?: CachingConfig;
  transformation?: TransformationConfig;
}

interface UpstreamConfig {
  service: string;
  version?: string;
  weight?: number;
  timeout?: number;
  retries?: number;
  healthCheck?: HealthCheckConfig;
  circuitBreaker?: CircuitBreakerConfig;
}

interface PluginConfig {
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

interface AuthenticationConfig {
  type: 'jwt' | 'oauth' | 'apikey' | 'basic' | 'mtls';
  config: Record<string, any>;
  required: boolean;
}

interface RateLimitConfig {
  requests: number;
  window: number; // seconds
  algorithm: 'sliding_window' | 'token_bucket' | 'fixed_window';
  scope: 'global' | 'user' | 'ip' | 'service';
  quotas?: QuotaConfig[];
}

interface QuotaConfig {
  name: string;
  limit: number;
  period: 'minute' | 'hour' | 'day' | 'month';
  scope: string;
}

interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash' | 'consistent_hash';
  healthChecks: boolean;
  stickySessions: boolean;
  failover: FailoverConfig;
}

interface FailoverConfig {
  enabled: boolean;
  maxRetries: number;
  backoffMultiplier: number;
  circuitBreaker: boolean;
}

interface HealthCheckConfig {
  path: string;
  interval: number;
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
}

interface CircuitBreakerConfig {
  enabled: boolean;
  threshold: number;
  timeout: number;
  resetTimeout: number;
}

interface CachingConfig {
  enabled: boolean;
  ttl: number;
  keyStrategy: 'path' | 'query' | 'header' | 'custom';
  storage: 'memory' | 'redis' | 'memcached';
}

interface TransformationConfig {
  request?: TransformationRule[];
  response?: TransformationRule[];
}

interface TransformationRule {
  type: 'add_header' | 'remove_header' | 'modify_header' | 'add_query' | 'remove_query' | 'body_transform';
  config: Record<string, any>;
}

interface SecurityConfig {
  cors: CorsConfig;
  headers: SecurityHeadersConfig;
  encryption: EncryptionConfig;
  firewall: FirewallConfig;
}

interface CorsConfig {
  enabled: boolean;
  origins: string[];
  methods: string[];
  headers: string[];
  credentials: boolean;
}

interface SecurityHeadersConfig {
  hsts: boolean;
  frameOptions: string;
  contentTypeOptions: boolean;
  xssProtection: boolean;
  referrerPolicy: string;
}

interface EncryptionConfig {
  tls: TLSConfig;
  mtls: mTLSConfig;
}

interface TLSConfig {
  enabled: boolean;
  version: string;
  cipherSuites: string[];
  certificates: CertificateConfig[];
}

interface mTLSConfig {
  enabled: boolean;
  enforced: boolean;
  trustDomain: string;
  certificateAuthority: string;
}

interface CertificateConfig {
  domain: string;
  certPath: string;
  keyPath: string;
  autoRenew: boolean;
}

interface FirewallConfig {
  enabled: boolean;
  whitelistedIPs: string[];
  blacklistedIPs: string[];
  geoBlocking: GeoBlockingConfig;
  ddosProtection: DDoSProtectionConfig;
}

interface GeoBlockingConfig {
  enabled: boolean;
  allowedCountries: string[];
  blockedCountries: string[];
}

interface DDoSProtectionConfig {
  enabled: boolean;
  requestsPerSecond: number;
  burstSize: number;
  blockDuration: number;
}

interface MonitoringConfig {
  metrics: boolean;
  tracing: boolean;
  logging: LoggingConfig;
  alerting: AlertingConfig;
}

interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'text';
  destinations: LogDestination[];
}

interface LogDestination {
  type: 'file' | 'console' | 'syslog' | 'http';
  config: Record<string, any>;
}

interface AlertingConfig {
  enabled: boolean;
  rules: AlertRule[];
  notificationChannels: NotificationChannel[];
}

interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  notificationChannel: string;
}

interface NotificationChannel {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  config: Record<string, any>;
}

interface ServiceMeshConfig {
  type: 'istio' | 'linkerd' | 'consul';
  namespace: string;
  services: MeshServiceConfig[];
  policies: SecurityPolicy[];
  telemetry: TelemetryConfig;
}

interface MeshServiceConfig {
  name: string;
  version: string;
  ports: ServicePort[];
  virtualService?: VirtualServiceConfig;
  destinationRule?: DestinationRuleConfig;
}

interface ServicePort {
  name: string;
  port: number;
  protocol: string;
}

interface VirtualServiceConfig {
  hosts: string[];
  http: HttpRouteConfig[];
}

interface HttpRouteConfig {
  match: RouteMatch[];
  route: RouteDestination[];
  fault?: FaultInjection;
  timeout?: string;
  retries?: RetryPolicy;
}

interface RouteMatch {
  uri?: UriMatch;
  headers?: Record<string, StringMatch>;
  queryParams?: Record<string, StringMatch>;
}

interface UriMatch {
  exact?: string;
  prefix?: string;
  regex?: string;
}

interface StringMatch {
  exact?: string;
  prefix?: string;
  regex?: string;
}

interface RouteDestination {
  destination: DestinationConfig;
  weight?: number;
}

interface DestinationConfig {
  host: string;
  subset?: string;
  port?: ServicePort;
}

interface FaultInjection {
  delay?: DelayFault;
  abort?: AbortFault;
}

interface DelayFault {
  percentage: number;
  fixedDelay: string;
}

interface AbortFault {
  percentage: number;
  httpStatus: number;
}

interface RetryPolicy {
  attempts: number;
  perTryTimeout: string;
  retryOn: string;
}

interface DestinationRuleConfig {
  host: string;
  trafficPolicy?: TrafficPolicy;
  subsets?: SubsetConfig[];
}

interface TrafficPolicy {
  loadBalancer?: LoadBalancerConfig;
  connectionPool?: ConnectionPoolConfig;
  outlierDetection?: OutlierDetectionConfig;
}

interface ConnectionPoolConfig {
  tcp?: TcpSettings;
  http?: HttpSettings;
}

interface TcpSettings {
  maxConnections: number;
  connectTimeout: string;
}

interface HttpSettings {
  http1MaxPendingRequests: number;
  http2MaxRequests: number;
  maxRequestsPerConnection: number;
  maxRetries: number;
}

interface OutlierDetectionConfig {
  consecutive5xxErrors: number;
  interval: string;
  baseEjectionTime: string;
  maxEjectionPercent: number;
}

interface SubsetConfig {
  name: string;
  labels: Record<string, string>;
  trafficPolicy?: TrafficPolicy;
}

interface SecurityPolicy {
  name: string;
  type: 'authorization' | 'authentication' | 'peerauthentication';
  spec: Record<string, any>;
}

interface TelemetryConfig {
  metrics: MetricsConfig;
  tracing: TracingConfig;
  accessLogs: AccessLogsConfig;
}

interface MetricsConfig {
  enabled: boolean;
  providers: string[];
  dimensions: Record<string, string>;
}

interface TracingConfig {
  enabled: boolean;
  provider: string;
  sampling: number;
  zipkinAddress?: string;
  jaegerAddress?: string;
}

interface AccessLogsConfig {
  enabled: boolean;
  format: string;
  providers: string[];
}

// Core API Gateway Platform
class APIGatewayPlatform {
  private config: GatewayConfig;
  private app: Express;
  private kong?: Kong;
  private redis: Redis;
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private logger: Logger;
  private registry: Registry;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private rateLimiters: Map<string, any> = new Map();
  private healthChecks: Map<string, NodeJS.Timer> = new Map();
  private metrics: {
    requestCounter: Counter;
    responseTime: Histogram;
    errorRate: Counter;
    activeConnections: Gauge;
  };

  constructor(config: GatewayConfig) {
    this.config = config;
    this.app = express();

    // Initialize Redis for rate limiting and caching
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Initialize Kafka for event streaming
    this.kafka = new Kafka({
      clientId: 'api-gateway',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'api-gateway-group' });

    // Initialize logger
    this.logger = createLogger({
      level: config.monitoring.logging.level,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        config.monitoring.logging.format === 'json' ? format.json() : format.simple()
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'api-gateway.log' })
      ]
    });

    // Initialize metrics
    this.registry = new Registry();
    this.metrics = {
      requestCounter: new Counter({
        name: 'api_gateway_requests_total',
        help: 'Total number of API requests',
        labelNames: ['method', 'path', 'status_code', 'service'],
        registers: [this.registry],
      }),
      responseTime: new Histogram({
        name: 'api_gateway_response_time_seconds',
        help: 'API response time in seconds',
        labelNames: ['method', 'path', 'service'],
        buckets: [0.1, 0.5, 1, 2, 5, 10],
        registers: [this.registry],
      }),
      errorRate: new Counter({
        name: 'api_gateway_errors_total',
        help: 'Total number of API errors',
        labelNames: ['method', 'path', 'error_type', 'service'],
        registers: [this.registry],
      }),
      activeConnections: new Gauge({
        name: 'api_gateway_active_connections',
        help: 'Number of active connections',
        registers: [this.registry],
      }),
    };

    this.setupMiddleware();
    this.setupRoutes();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Kong if configured
      if (this.config.type === 'kong') {
        await this.initializeKong();
      }

      // Connect to Kafka
      await this.producer.connect();
      await this.consumer.connect();

      // Setup circuit breakers
      this.setupCircuitBreakers();

      // Setup rate limiters
      this.setupRateLimiters();

      // Setup health checks
      this.setupHealthChecks();

      // Register routes
      await this.registerRoutes();

      // Start event consumer
      this.startEventConsumer();

      this.logger.info('API Gateway platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize API Gateway platform', { error });
      throw error;
    }
  }

  private async initializeKong(): Promise<void> {
    this.kong = new Kong({
      host: process.env.KONG_ADMIN_HOST || 'localhost',
      port: process.env.KONG_ADMIN_PORT || '8001',
    });

    // Create Kong service and routes from configuration
    for (const endpoint of this.config.endpoints) {
      await this.createKongService(endpoint);
      await this.createKongRoute(endpoint);
      await this.applyKongPlugins(endpoint);
    }
  }

  private async createKongService(endpoint: EndpointConfig): Promise<void> {
    const service = {
      name: `${endpoint.upstream.service}-service`,
      url: `http://${endpoint.upstream.service}:80`,
      connect_timeout: endpoint.upstream.timeout || 5000,
      read_timeout: endpoint.upstream.timeout || 60000,
      write_timeout: endpoint.upstream.timeout || 60000,
      retries: endpoint.upstream.retries || 5,
    };

    await this.kong!.services.create(service);
    this.logger.info('Kong service created', { service: service.name });
  }

  private async createKongRoute(endpoint: EndpointConfig): Promise<void> {
    const route = {
      name: `${endpoint.upstream.service}-route`,
      paths: [endpoint.path],
      methods: endpoint.methods,
      service: { name: `${endpoint.upstream.service}-service` },
      strip_path: true,
    };

    await this.kong!.routes.create(route);
    this.logger.info('Kong route created', { route: route.name, path: endpoint.path });
  }

  private async applyKongPlugins(endpoint: EndpointConfig): Promise<void> {
    for (const plugin of endpoint.plugins) {
      if (plugin.enabled) {
        const kongPlugin = {
          name: plugin.name,
          config: plugin.config,
          service: { name: `${endpoint.upstream.service}-service` },
        };

        await this.kong!.plugins.create(kongPlugin);
        this.logger.info('Kong plugin applied', { plugin: plugin.name, service: endpoint.upstream.service });
      }
    }
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      hsts: this.config.security.headers.hsts,
      frameguard: { action: this.config.security.headers.frameOptions },
      noSniff: this.config.security.headers.contentTypeOptions,
      xssFilter: this.config.security.headers.xssProtection,
      referrerPolicy: { policy: this.config.security.headers.referrerPolicy as any },
    }));

    // CORS
    if (this.config.security.cors.enabled) {
      this.app.use(cors({
        origin: this.config.security.cors.origins,
        methods: this.config.security.cors.methods,
        allowedHeaders: this.config.security.cors.headers,
        credentials: this.config.security.cors.credentials,
      }));
    }

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID and timing
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = uuidv4();
      const startTime = Date.now();

      req.headers['x-request-id'] = requestId;
      res.setHeader('x-request-id', requestId);

      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const path = req.path;
        const method = req.method;
        const statusCode = res.statusCode.toString();

        // Record metrics
        this.metrics.requestCounter
          .labels(method, path, statusCode, 'gateway')
          .inc();

        this.metrics.responseTime
          .labels(method, path, 'gateway')
          .observe(duration);

        if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
          this.metrics.errorRate
            .labels(method, path, 'http_error', 'gateway')
            .inc();
        }

        // Log request
        this.logger.info('Request processed', {
          requestId,
          method,
          path,
          statusCode: parseInt(statusCode),
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      });

      next();
    });

    // Authentication middleware
    this.app.use(this.createAuthenticationMiddleware());

    // Rate limiting middleware
    this.app.use(this.createRateLimitingMiddleware());

    // Firewall middleware
    this.app.use(this.createFirewallMiddleware());
  }

  private createAuthenticationMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      const endpoint = this.findEndpoint(req.path, req.method);

      if (!endpoint?.authentication?.required) {
        return next();
      }

      try {
        const authResult = await this.authenticate(req, endpoint.authentication);
        (req as any).user = authResult;
        next();
      } catch (error) {
        res.status(401).json({
          error: 'Authentication failed',
          message: error.message,
        });
      }
    };
  }

  private async authenticate(req: Request, authConfig: AuthenticationConfig): Promise<any> {
    switch (authConfig.type) {
      case 'jwt':
        return this.authenticateJWT(req, authConfig);
      case 'apikey':
        return this.authenticateAPIKey(req, authConfig);
      case 'oauth':
        return this.authenticateOAuth(req, authConfig);
      case 'mtls':
        return this.authenticatemTLS(req, authConfig);
      default:
        throw new Error('Unsupported authentication method');
    }
  }

  private authenticateJWT(req: Request, authConfig: AuthenticationConfig): any {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const secret = authConfig.config.secret || process.env.JWT_SECRET;

    try {
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  private async authenticateAPIKey(req: Request, authConfig: AuthenticationConfig): Promise<any> {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      throw new Error('Missing API key');
    }

    // Validate API key (implementation depends on your API key store)
    const isValid = await this.validateAPIKey(apiKey as string);

    if (!isValid) {
      throw new Error('Invalid API key');
    }

    return { apiKey, authenticated: true };
  }

  private async validateAPIKey(apiKey: string): Promise<boolean> {
    // Check Redis cache first
    const cached = await this.redis.get(`apikey:${apiKey}`);
    if (cached) {
      return cached === 'valid';
    }

    // Validate against database or external service
    // For demo purposes, we'll use a simple validation
    const isValid = apiKey.startsWith('ak_') && apiKey.length > 20;

    // Cache result
    await this.redis.setex(`apikey:${apiKey}`, 300, isValid ? 'valid' : 'invalid');

    return isValid;
  }

  private createRateLimitingMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      const endpoint = this.findEndpoint(req.path, req.method);
      const rateLimitConfig = endpoint?.rateLimit || this.config.rateLimit;

      if (!rateLimitConfig) {
        return next();
      }

      try {
        await this.checkRateLimit(req, rateLimitConfig);
        next();
      } catch (error) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: error.message,
          retryAfter: rateLimitConfig.window,
        });
      }
    };
  }

  private async checkRateLimit(req: Request, config: RateLimitConfig): Promise<void> {
    const key = this.getRateLimitKey(req, config);
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, config.window);
    }

    if (current > config.requests) {
      throw new Error(`Rate limit of ${config.requests} requests per ${config.window} seconds exceeded`);
    }
  }

  private getRateLimitKey(req: Request, config: RateLimitConfig): string {
    const baseKey = 'ratelimit';

    switch (config.scope) {
      case 'global':
        return `${baseKey}:global`;
      case 'ip':
        return `${baseKey}:ip:${req.ip}`;
      case 'user':
        const userId = (req as any).user?.id || 'anonymous';
        return `${baseKey}:user:${userId}`;
      case 'service':
        const serviceName = this.findEndpoint(req.path, req.method)?.upstream.service || 'unknown';
        return `${baseKey}:service:${serviceName}`;
      default:
        return `${baseKey}:ip:${req.ip}`;
    }
  }

  private createFirewallMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const firewall = this.config.security.firewall;

      if (!firewall.enabled) {
        return next();
      }

      const clientIP = req.ip;

      // Check blacklist
      if (firewall.blacklistedIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'IP address is blacklisted' });
      }

      // Check whitelist (if configured)
      if (firewall.whitelistedIPs.length > 0 && !firewall.whitelistedIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'IP address is not whitelisted' });
      }

      // DDoS protection
      if (firewall.ddosProtection.enabled) {
        this.checkDDoSProtection(req, res, next);
      } else {
        next();
      }
    };
  }

  private async checkDDoSProtection(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ddosConfig = this.config.security.firewall.ddosProtection;
    const key = `ddos:${req.ip}`;

    const requests = await this.redis.incr(key);
    if (requests === 1) {
      await this.redis.expire(key, 1); // 1 second window
    }

    if (requests > ddosConfig.requestsPerSecond) {
      // Block IP temporarily
      await this.redis.setex(`blocked:${req.ip}`, ddosConfig.blockDuration, 'true');
      res.status(429).json({ error: 'Rate limit exceeded - IP temporarily blocked' });
      return;
    }

    // Check if IP is already blocked
    const isBlocked = await this.redis.get(`blocked:${req.ip}`);
    if (isBlocked) {
      res.status(429).json({ error: 'IP address is temporarily blocked' });
      return;
    }

    next();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        version: process.env.API_VERSION || '1.0.0',
        uptime: process.uptime(),
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req: Request, res: Response) => {
      res.set('Content-Type', this.registry.contentType);
      res.end(await this.registry.metrics());
    });

    // Admin endpoints
    this.app.get('/admin/config', this.authenticateAdmin.bind(this), (req: Request, res: Response) => {
      res.json(this.config);
    });

    this.app.post('/admin/reload', this.authenticateAdmin.bind(this), async (req: Request, res: Response) => {
      try {
        await this.reloadConfiguration();
        res.json({ message: 'Configuration reloaded successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to reload configuration' });
      }
    });

    // Circuit breaker status
    this.app.get('/admin/circuit-breakers', this.authenticateAdmin.bind(this), (req: Request, res: Response) => {
      const status = Array.from(this.circuitBreakers.entries()).map(([name, breaker]) => ({
        name,
        state: breaker.stats,
        isOpen: breaker.opened,
      }));

      res.json(status);
    });
  }

  private async registerRoutes(): Promise<void> {
    for (const endpoint of this.config.endpoints) {
      await this.registerEndpoint(endpoint);
    }
  }

  private async registerEndpoint(endpoint: EndpointConfig): Promise<void> {
    const proxyOptions: Options = {
      target: `http://${endpoint.upstream.service}`,
      changeOrigin: true,
      timeout: endpoint.upstream.timeout || 30000,
      proxyTimeout: endpoint.upstream.timeout || 30000,
      onError: (err, req, res) => {
        this.handleProxyError(err, req as Request, res as Response, endpoint);
      },
      onProxyReq: (proxyReq, req, res) => {
        this.handleProxyRequest(proxyReq, req as Request, res as Response, endpoint);
      },
      onProxyRes: (proxyRes, req, res) => {
        this.handleProxyResponse(proxyRes, req as Request, res as Response, endpoint);
      },
    };

    // Apply request transformation
    if (endpoint.transformation?.request) {
      proxyOptions.onProxyReq = (proxyReq, req, res) => {
        this.applyRequestTransformation(proxyReq, req as Request, endpoint.transformation!.request!);
        this.handleProxyRequest(proxyReq, req as Request, res as Response, endpoint);
      };
    }

    // Apply response transformation
    if (endpoint.transformation?.response) {
      proxyOptions.onProxyRes = (proxyRes, req, res) => {
        this.applyResponseTransformation(proxyRes, req as Request, endpoint.transformation!.response!);
        this.handleProxyResponse(proxyRes, req as Request, res as Response, endpoint);
      };
    }

    // Create circuit breaker for this endpoint
    if (endpoint.upstream.circuitBreaker?.enabled) {
      const circuitBreaker = this.createCircuitBreaker(endpoint);
      proxyOptions.onError = (err, req, res) => {
        circuitBreaker.fire().catch(() => {
          this.handleProxyError(err, req as Request, res as Response, endpoint);
        });
      };
    }

    const proxy = createProxyMiddleware(proxyOptions);

    // Register route with all methods
    for (const method of endpoint.methods) {
      (this.app as any)[method.toLowerCase()](endpoint.path, proxy);
    }

    this.logger.info('Endpoint registered', {
      path: endpoint.path,
      methods: endpoint.methods,
      service: endpoint.upstream.service,
    });
  }

  private setupCircuitBreakers(): void {
    for (const endpoint of this.config.endpoints) {
      if (endpoint.upstream.circuitBreaker?.enabled) {
        this.createCircuitBreaker(endpoint);
      }
    }
  }

  private createCircuitBreaker(endpoint: EndpointConfig): CircuitBreaker {
    const config = endpoint.upstream.circuitBreaker!;
    const options = {
      timeout: config.timeout || 3000,
      errorThresholdPercentage: config.threshold || 50,
      resetTimeout: config.resetTimeout || 30000,
    };

    const breaker = new CircuitBreaker(this.makeUpstreamCall.bind(this), options);

    breaker.fallback(() => {
      this.logger.warn('Circuit breaker fallback activated', { service: endpoint.upstream.service });
      return { error: 'Service temporarily unavailable' };
    });

    breaker.on('open', () => {
      this.logger.error('Circuit breaker opened', { service: endpoint.upstream.service });
      this.publishEvent('circuit.breaker.opened', { service: endpoint.upstream.service });
    });

    breaker.on('halfOpen', () => {
      this.logger.info('Circuit breaker half-open', { service: endpoint.upstream.service });
    });

    breaker.on('close', () => {
      this.logger.info('Circuit breaker closed', { service: endpoint.upstream.service });
      this.publishEvent('circuit.breaker.closed', { service: endpoint.upstream.service });
    });

    this.circuitBreakers.set(endpoint.upstream.service, breaker);
    return breaker;
  }

  private async makeUpstreamCall(endpoint: EndpointConfig, req: Request): Promise<any> {
    const url = `http://${endpoint.upstream.service}${req.path}`;
    const config: AxiosRequestConfig = {
      method: req.method as any,
      url,
      headers: req.headers,
      data: req.body,
      timeout: endpoint.upstream.timeout || 30000,
    };

    const response = await axios(config);
    return response.data;
  }

  private setupRateLimiters(): void {
    // Global rate limiter
    const globalLimiter = rateLimit({
      windowMs: this.config.rateLimit.window * 1000,
      max: this.config.rateLimit.requests,
      standardHeaders: true,
      legacyHeaders: false,
      store: new (require('rate-limit-redis'))({
        client: this.redis,
        prefix: 'global:',
      }),
    });

    this.rateLimiters.set('global', globalLimiter);

    // Endpoint-specific rate limiters
    for (const endpoint of this.config.endpoints) {
      if (endpoint.rateLimit) {
        const limiter = rateLimit({
          windowMs: endpoint.rateLimit.window * 1000,
          max: endpoint.rateLimit.requests,
          keyGenerator: (req) => {
            return this.getRateLimitKey(req, endpoint.rateLimit!);
          },
          store: new (require('rate-limit-redis'))({
            client: this.redis,
            prefix: `endpoint:${endpoint.path}:`,
          }),
        });

        this.rateLimiters.set(endpoint.path, limiter);
      }
    }
  }

  private setupHealthChecks(): void {
    for (const endpoint of this.config.endpoints) {
      if (endpoint.upstream.healthCheck) {
        this.startHealthCheck(endpoint);
      }
    }
  }

  private startHealthCheck(endpoint: EndpointConfig): void {
    const healthConfig = endpoint.upstream.healthCheck!;
    const serviceName = endpoint.upstream.service;

    const checkHealth = async () => {
      try {
        const url = `http://${serviceName}${healthConfig.path}`;
        const response = await axios.get(url, {
          timeout: healthConfig.timeout,
        });

        if (response.status === 200) {
          await this.markServiceHealthy(serviceName);
        } else {
          await this.markServiceUnhealthy(serviceName);
        }
      } catch (error) {
        await this.markServiceUnhealthy(serviceName);
        this.logger.error('Health check failed', { service: serviceName, error: error.message });
      }
    };

    const interval = setInterval(checkHealth, healthConfig.interval);
    this.healthChecks.set(serviceName, interval);

    // Initial health check
    checkHealth();
  }

  private async markServiceHealthy(serviceName: string): Promise<void> {
    await this.redis.hset('service:health', serviceName, 'healthy');
    await this.redis.hdel('service:unhealthy_count', serviceName);
  }

  private async markServiceUnhealthy(serviceName: string): Promise<void> {
    const unhealthyCount = await this.redis.hincrby('service:unhealthy_count', serviceName, 1);
    const endpoint = this.config.endpoints.find(e => e.upstream.service === serviceName);
    const threshold = endpoint?.upstream.healthCheck?.unhealthyThreshold || 3;

    if (unhealthyCount >= threshold) {
      await this.redis.hset('service:health', serviceName, 'unhealthy');
      this.publishEvent('service.unhealthy', { service: serviceName });
    }
  }

  // Request/Response transformation
  private applyRequestTransformation(proxyReq: any, req: Request, transformations: TransformationRule[]): void {
    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'add_header':
          proxyReq.setHeader(transformation.config.name, transformation.config.value);
          break;
        case 'remove_header':
          proxyReq.removeHeader(transformation.config.name);
          break;
        case 'modify_header':
          const existingValue = proxyReq.getHeader(transformation.config.name);
          if (existingValue) {
            proxyReq.setHeader(transformation.config.name, transformation.config.value);
          }
          break;
        case 'add_query':
          // Query parameter transformation would require URL modification
          break;
      }
    }
  }

  private applyResponseTransformation(proxyRes: any, req: Request, transformations: TransformationRule[]): void {
    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'add_header':
          proxyRes.headers[transformation.config.name] = transformation.config.value;
          break;
        case 'remove_header':
          delete proxyRes.headers[transformation.config.name];
          break;
        case 'modify_header':
          if (proxyRes.headers[transformation.config.name]) {
            proxyRes.headers[transformation.config.name] = transformation.config.value;
          }
          break;
      }
    }
  }

  // Event handling
  private async publishEvent(eventType: string, data: any): Promise<void> {
    try {
      await this.producer.send({
        topic: 'api-gateway-events',
        messages: [{
          key: eventType,
          value: JSON.stringify({
            type: eventType,
            data,
            timestamp: new Date(),
            gateway: this.config.name,
          }),
        }],
      });
    } catch (error) {
      this.logger.error('Failed to publish event', { eventType, error });
    }
  }

  private startEventConsumer(): void {
    this.consumer.subscribe({ topics: ['api-gateway-events'] });

    this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value?.toString() || '{}');
          await this.handleEvent(event);
        } catch (error) {
          this.logger.error('Failed to process event', { error });
        }
      },
    });
  }

  private async handleEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'service.unhealthy':
        await this.handleServiceUnhealthy(event.data);
        break;
      case 'circuit.breaker.opened':
        await this.handleCircuitBreakerOpened(event.data);
        break;
      default:
        this.logger.debug('Unhandled event', { type: event.type });
    }
  }

  private async handleServiceUnhealthy(data: any): Promise<void> {
    this.logger.warn('Service marked unhealthy', { service: data.service });

    // Remove from load balancer pool
    await this.redis.sadd(`unhealthy:services`, data.service);

    // Send alert
    if (this.config.monitoring.alerting.enabled) {
      await this.sendAlert('service_unhealthy', {
        service: data.service,
        message: `Service ${data.service} is unhealthy`,
        severity: 'warning',
      });
    }
  }

  private async handleCircuitBreakerOpened(data: any): Promise<void> {
    this.logger.error('Circuit breaker opened', { service: data.service });

    // Send critical alert
    if (this.config.monitoring.alerting.enabled) {
      await this.sendAlert('circuit_breaker_opened', {
        service: data.service,
        message: `Circuit breaker opened for service ${data.service}`,
        severity: 'critical',
      });
    }
  }

  private async sendAlert(alertType: string, data: any): Promise<void> {
    // Implementation depends on configured notification channels
    this.logger.info('Alert triggered', { type: alertType, data });
  }

  // Service Mesh Integration
  async deployServiceMesh(config: ServiceMeshConfig): Promise<void> {
    this.logger.info(`Deploying ${config.type} service mesh...`);

    switch (config.type) {
      case 'istio':
        await this.deployIstio(config);
        break;
      case 'linkerd':
        await this.deployLinkerd(config);
        break;
      case 'consul':
        await this.deployConsul(config);
        break;
    }

    this.logger.info('Service mesh deployment completed');
  }

  private async deployIstio(config: ServiceMeshConfig): Promise<void> {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

    // Deploy VirtualServices
    for (const service of config.services) {
      if (service.virtualService) {
        await this.createVirtualService(k8sApi, service, config.namespace);
      }

      if (service.destinationRule) {
        await this.createDestinationRule(k8sApi, service, config.namespace);
      }
    }

    // Deploy security policies
    for (const policy of config.policies) {
      await this.createSecurityPolicy(k8sApi, policy, config.namespace);
    }

    // Configure telemetry
    if (config.telemetry.enabled) {
      await this.configureTelemetry(k8sApi, config.telemetry, config.namespace);
    }
  }

  private async createVirtualService(k8sApi: k8s.CustomObjectsApi, service: MeshServiceConfig, namespace: string): Promise<void> {
    const virtualService = {
      apiVersion: 'networking.istio.io/v1beta1',
      kind: 'VirtualService',
      metadata: {
        name: `${service.name}-vs`,
        namespace,
      },
      spec: service.virtualService,
    };

    await k8sApi.createNamespacedCustomObject(
      'networking.istio.io',
      'v1beta1',
      namespace,
      'virtualservices',
      virtualService
    );

    this.logger.info('VirtualService created', { service: service.name });
  }

  // Utility methods
  private findEndpoint(path: string, method: string): EndpointConfig | undefined {
    return this.config.endpoints.find(endpoint =>
      endpoint.methods.includes(method.toUpperCase()) &&
      this.pathMatches(path, endpoint.path)
    );
  }

  private pathMatches(requestPath: string, endpointPath: string): boolean {
    // Simple path matching - can be enhanced with regex or glob patterns
    return requestPath.startsWith(endpointPath) || endpointPath.includes('*');
  }

  private authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
    const adminToken = req.headers['x-admin-token'];

    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      res.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    next();
  }

  private async reloadConfiguration(): Promise<void> {
    // Reload configuration from file or external source
    this.logger.info('Reloading configuration...');

    // Clear existing routes and circuit breakers
    this.circuitBreakers.clear();
    this.rateLimiters.clear();

    // Clear health check intervals
    for (const interval of this.healthChecks.values()) {
      clearInterval(interval);
    }
    this.healthChecks.clear();

    // Re-register routes and setup components
    await this.registerRoutes();
    this.setupCircuitBreakers();
    this.setupRateLimiters();
    this.setupHealthChecks();
  }

  private handleProxyError(err: Error, req: Request, res: Response, endpoint: EndpointConfig): void {
    this.logger.error('Proxy error', {
      error: err.message,
      service: endpoint.upstream.service,
      path: req.path,
    });

    this.metrics.errorRate
      .labels(req.method, req.path, 'proxy_error', endpoint.upstream.service)
      .inc();

    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Service temporarily unavailable',
    });
  }

  private handleProxyRequest(proxyReq: any, req: Request, res: Response, endpoint: EndpointConfig): void {
    // Add tracing headers
    proxyReq.setHeader('x-trace-id', req.headers['x-request-id']);
    proxyReq.setHeader('x-gateway', this.config.name);

    // Add service identification
    proxyReq.setHeader('x-upstream-service', endpoint.upstream.service);
  }

  private handleProxyResponse(proxyRes: any, req: Request, res: Response, endpoint: EndpointConfig): void {
    // Add response headers
    proxyRes.headers['x-served-by'] = this.config.name;
    proxyRes.headers['x-upstream-service'] = endpoint.upstream.service;
  }

  private async authenticateOAuth(req: Request, authConfig: AuthenticationConfig): Promise<any> {
    // OAuth implementation
    throw new Error('OAuth authentication not implemented');
  }

  private async authenticatemTLS(req: Request, authConfig: AuthenticationConfig): Promise<any> {
    // mTLS implementation
    throw new Error('mTLS authentication not implemented');
  }

  private async deployLinkerd(config: ServiceMeshConfig): Promise<void> {
    // Linkerd deployment implementation
    this.logger.info('Deploying Linkerd...');
  }

  private async deployConsul(config: ServiceMeshConfig): Promise<void> {
    // Consul Connect deployment implementation
    this.logger.info('Deploying Consul Connect...');
  }

  private async createDestinationRule(k8sApi: k8s.CustomObjectsApi, service: MeshServiceConfig, namespace: string): Promise<void> {
    // DestinationRule creation implementation
    this.logger.info('Creating DestinationRule...', { service: service.name });
  }

  private async createSecurityPolicy(k8sApi: k8s.CustomObjectsApi, policy: SecurityPolicy, namespace: string): Promise<void> {
    // Security policy creation implementation
    this.logger.info('Creating security policy...', { policy: policy.name });
  }

  private async configureTelemetry(k8sApi: k8s.CustomObjectsApi, telemetry: TelemetryConfig, namespace: string): Promise<void> {
    // Telemetry configuration implementation
    this.logger.info('Configuring telemetry...');
  }

  public async start(port: number = 8080): Promise<void> {
    this.app.listen(port, () => {
      this.logger.info(`API Gateway running on port ${port}`);
    });
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down API Gateway...');

    // Disconnect from Kafka
    await this.producer.disconnect();
    await this.consumer.disconnect();

    // Close Redis connection
    this.redis.disconnect();

    // Clear health check intervals
    for (const interval of this.healthChecks.values()) {
      clearInterval(interval);
    }

    this.logger.info('API Gateway shutdown complete');
  }
}

// Example usage
export async function createAPIGatewayExample(): Promise<void> {
  const config: GatewayConfig = {
    name: 'api-gateway',
    type: 'custom',
    endpoints: [
      {
        path: '/api/users',
        methods: ['GET', 'POST'],
        upstream: {
          service: 'user-service',
          timeout: 30000,
          retries: 3,
          healthCheck: {
            path: '/health',
            interval: 30000,
            timeout: 5000,
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
          circuitBreaker: {
            enabled: true,
            threshold: 50,
            timeout: 3000,
            resetTimeout: 30000,
          },
        },
        plugins: [
          {
            name: 'rate-limiting',
            config: { requests: 100, window: 60 },
            enabled: true,
          },
        ],
        authentication: {
          type: 'jwt',
          config: { secret: 'your-secret-key' },
          required: true,
        },
        rateLimit: {
          requests: 100,
          window: 60,
          algorithm: 'sliding_window',
          scope: 'user',
        },
      },
    ],
    security: {
      cors: {
        enabled: true,
        origins: ['https://app.example.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        headers: ['Content-Type', 'Authorization'],
        credentials: true,
      },
      headers: {
        hsts: true,
        frameOptions: 'DENY',
        contentTypeOptions: true,
        xssProtection: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
      },
      encryption: {
        tls: {
          enabled: true,
          version: '1.3',
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          certificates: [],
        },
        mtls: {
          enabled: false,
          enforced: false,
          trustDomain: 'cluster.local',
          certificateAuthority: '',
        },
      },
      firewall: {
        enabled: true,
        whitelistedIPs: [],
        blacklistedIPs: [],
        geoBlocking: {
          enabled: false,
          allowedCountries: [],
          blockedCountries: [],
        },
        ddosProtection: {
          enabled: true,
          requestsPerSecond: 1000,
          burstSize: 2000,
          blockDuration: 300,
        },
      },
    },
    rateLimit: {
      requests: 1000,
      window: 60,
      algorithm: 'sliding_window',
      scope: 'global',
    },
    loadBalancing: {
      algorithm: 'round_robin',
      healthChecks: true,
      stickySessions: false,
      failover: {
        enabled: true,
        maxRetries: 3,
        backoffMultiplier: 2,
        circuitBreaker: true,
      },
    },
    monitoring: {
      metrics: true,
      tracing: true,
      logging: {
        level: 'info',
        format: 'json',
        destinations: [
          { type: 'console', config: {} },
          { type: 'file', config: { filename: 'api-gateway.log' } },
        ],
      },
      alerting: {
        enabled: true,
        rules: [
          {
            name: 'high_error_rate',
            condition: 'error_rate > 0.1',
            threshold: 0.1,
            severity: 'critical',
            notificationChannel: 'slack',
          },
        ],
        notificationChannels: [
          {
            name: 'slack',
            type: 'slack',
            config: { webhook: 'https://hooks.slack.com/...' },
          },
        ],
      },
    },
  };

  const gateway = new APIGatewayPlatform(config);
  await gateway.initialize();
  await gateway.start(8080);

  console.log('API Gateway with service mesh capabilities running');
}

export { APIGatewayPlatform, GatewayConfig, ServiceMeshConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- API gateway implementation is needed
- Service mesh deployment is required
- Traffic management and routing is requested
- Security policy enforcement is needed
- Load balancing and failover strategies are required
- Microservices communication orchestration is requested

This comprehensive API gateway and service mesh skill provides expert-level capabilities for building modern, secure API infrastructure with advanced traffic management, security policies, and observability features.