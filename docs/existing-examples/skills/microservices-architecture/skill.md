# Microservices Architecture Skill

Advanced microservices design and implementation expertise covering service mesh deployment, API gateway architecture, distributed system patterns, and scalable microservices platform development with modern orchestration tools.

## Skill Overview

Expert microservices knowledge including service decomposition strategies, inter-service communication patterns, service mesh architecture, API gateway design, circuit breaker implementation, distributed transaction management, and modern microservices platform engineering.

## Core Capabilities

### Service Mesh & Communication
- **Istio/Linkerd** - Service mesh deployment, traffic management, security policies, observability
- **Envoy proxy** - Advanced routing, load balancing, rate limiting, circuit breakers
- **gRPC communication** - Protocol buffers, streaming, load balancing, error handling
- **Service discovery** - Consul, etcd, Kubernetes DNS, health checking, failover

### API Gateway & Edge Services
- **Kong/Ambassador** - API gateway deployment, plugin ecosystem, rate limiting, authentication
- **Zuul/Spring Cloud Gateway** - Routing rules, filters, request transformation, circuit breakers
- **GraphQL Federation** - Schema stitching, resolver composition, distributed graph architecture
- **BFF patterns** - Backend-for-frontend, mobile/web API optimization, aggregation layers

### Distributed System Patterns
- **Circuit breakers** - Hystrix, resilience4j, failure isolation, bulkhead patterns
- **Saga patterns** - Orchestration vs choreography, compensation logic, state management
- **CQRS implementation** - Command query separation, event sourcing, read/write optimization
- **Event-driven architecture** - Domain events, event streaming, eventual consistency

### Deployment & Operations
- **Service deployment** - Blue/green, canary, rolling deployments, feature flags
- **Configuration management** - Centralized config, environment-specific settings, secret management
- **Monitoring & tracing** - Distributed tracing, service maps, performance monitoring
- **Testing strategies** - Contract testing, chaos engineering, integration testing

## Modern Microservices Platform Implementation

### Comprehensive Microservices Platform with Istio and Node.js
```typescript
// Advanced microservices platform with service mesh, API gateway, and distributed patterns
import express, { Express, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import consul from 'consul';
import CircuitBreaker from 'opossum';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { Kafka, Consumer, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { GraphQLSchema, GraphQLObjectType, GraphQLString, buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/subgraph';

// Types and interfaces
interface ServiceConfig {
  name: string;
  version: string;
  port: number;
  healthCheckPath: string;
  dependencies: string[];
  circuitBreaker: {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
  };
}

interface ServiceRegistry {
  id: string;
  name: string;
  version: string;
  address: string;
  port: number;
  health: 'healthy' | 'unhealthy';
  metadata: Record<string, any>;
  lastSeen: Date;
}

interface ApiGatewayRoute {
  path: string;
  method: string;
  target: {
    service: string;
    path: string;
  };
  middleware: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  authentication?: {
    required: boolean;
    roles?: string[];
  };
}

interface SagaStep {
  id: string;
  service: string;
  action: string;
  compensationAction: string;
  retryCount: number;
  timeout: number;
}

interface SagaTransaction {
  id: string;
  steps: SagaStep[];
  status: 'pending' | 'completed' | 'failed' | 'compensating';
  completedSteps: string[];
  currentStep?: string;
  error?: string;
}

// Core Microservices Platform
class MicroservicesPlatform {
  private services: Map<string, ServiceRegistry> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private eventBus: EventEmitter = new EventEmitter();
  private consul: consul.ConsulClient;
  private redis: Redis;
  private kafka: Kafka;
  private kafkaProducer: Producer;
  private kafkaConsumer: Consumer;
  private logger: Logger;
  private sagaOrchestrator: SagaOrchestrator;

  constructor() {
    this.consul = new consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || '8500',
    });

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.kafka = new Kafka({
      clientId: 'microservices-platform',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });

    this.kafkaProducer = this.kafka.producer();
    this.kafkaConsumer = this.kafka.consumer({ groupId: 'platform-group' });

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console({ format: format.simple() }),
        new transports.File({ filename: 'microservices-platform.log' })
      ]
    });

    this.sagaOrchestrator = new SagaOrchestrator(this.redis, this.kafkaProducer, this.logger);

    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    await this.kafkaProducer.connect();
    await this.kafkaConsumer.connect();
    await this.kafkaConsumer.subscribe({ topics: ['service-events', 'saga-events'] });

    this.startServiceDiscovery();
    this.startHealthChecking();
    await this.sagaOrchestrator.initialize();

    this.logger.info('Microservices platform initialized');
  }

  // Service Registration and Discovery
  async registerService(config: ServiceConfig): Promise<string> {
    const serviceId = uuidv4();
    const service: ServiceRegistry = {
      id: serviceId,
      name: config.name,
      version: config.version,
      address: process.env.SERVICE_HOST || 'localhost',
      port: config.port,
      health: 'healthy',
      metadata: {
        dependencies: config.dependencies,
        healthCheckPath: config.healthCheckPath,
      },
      lastSeen: new Date(),
    };

    // Register with Consul
    await this.consul.agent.service.register({
      id: serviceId,
      name: config.name,
      port: config.port,
      check: {
        http: `http://${service.address}:${config.port}${config.healthCheckPath}`,
        interval: '10s',
        timeout: '3s',
      },
      meta: {
        version: config.version,
        dependencies: JSON.stringify(config.dependencies),
      },
    });

    // Store locally
    this.services.set(serviceId, service);

    // Setup circuit breaker
    this.createCircuitBreaker(config.name, config.circuitBreaker);

    // Publish service registration event
    await this.publishEvent('service.registered', {
      serviceId,
      serviceName: config.name,
      version: config.version,
    });

    this.logger.info('Service registered', { serviceId, name: config.name });
    return serviceId;
  }

  async discoverService(serviceName: string): Promise<ServiceRegistry[]> {
    const cacheKey = `services:${serviceName}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const consulServices = await this.consul.health.service(serviceName);
      const healthyServices = consulServices[1]
        .filter(service => service.Checks.every(check => check.Status === 'passing'))
        .map(service => ({
          id: service.Service.ID,
          name: service.Service.Service,
          version: service.Service.Meta.version,
          address: service.Service.Address,
          port: service.Service.Port,
          health: 'healthy' as const,
          metadata: service.Service.Meta,
          lastSeen: new Date(),
        }));

      // Cache for 30 seconds
      await this.redis.setex(cacheKey, 30, JSON.stringify(healthyServices));

      return healthyServices;
    } catch (error) {
      this.logger.error('Service discovery failed', { serviceName, error });
      return [];
    }
  }

  // Circuit Breaker Implementation
  private createCircuitBreaker(serviceName: string, config: any): CircuitBreaker {
    const options = {
      timeout: config.timeout || 3000,
      errorThresholdPercentage: config.errorThresholdPercentage || 50,
      resetTimeout: config.resetTimeout || 30000,
    };

    const breaker = new CircuitBreaker(this.makeServiceCall.bind(this), options);

    breaker.fallback(() => {
      this.logger.warn('Circuit breaker fallback activated', { service: serviceName });
      return { error: 'Service temporarily unavailable' };
    });

    breaker.on('open', () => {
      this.logger.error('Circuit breaker opened', { service: serviceName });
      this.publishEvent('circuit.breaker.opened', { service: serviceName });
    });

    breaker.on('close', () => {
      this.logger.info('Circuit breaker closed', { service: serviceName });
      this.publishEvent('circuit.breaker.closed', { service: serviceName });
    });

    this.circuitBreakers.set(serviceName, breaker);
    return breaker;
  }

  private async makeServiceCall(serviceName: string, path: string, options: any): Promise<any> {
    const services = await this.discoverService(serviceName);
    if (services.length === 0) {
      throw new Error(`No healthy instances found for service: ${serviceName}`);
    }

    // Simple round-robin load balancing
    const service = services[Math.floor(Math.random() * services.length)];
    const url = `http://${service.address}:${service.port}${path}`;

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      signal: AbortSignal.timeout(options.timeout || 5000),
    });

    if (!response.ok) {
      throw new Error(`Service call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Service Mesh Integration
  async callService(serviceName: string, path: string, options: any = {}): Promise<any> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      throw new Error(`No circuit breaker found for service: ${serviceName}`);
    }

    const correlationId = options.correlationId || uuidv4();
    const startTime = Date.now();

    try {
      const result = await breaker.fire(serviceName, path, {
        ...options,
        headers: {
          ...options.headers,
          'x-correlation-id': correlationId,
          'x-forwarded-for': options.clientIp,
        },
      });

      const duration = Date.now() - startTime;

      // Record metrics
      await this.recordServiceCallMetric(serviceName, path, 'success', duration);

      this.logger.info('Service call completed', {
        service: serviceName,
        path,
        duration,
        correlationId,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await this.recordServiceCallMetric(serviceName, path, 'error', duration);

      this.logger.error('Service call failed', {
        service: serviceName,
        path,
        error: error.message,
        duration,
        correlationId,
      });

      throw error;
    }
  }

  // Event-Driven Communication
  async publishEvent(eventType: string, payload: any): Promise<void> {
    const event = {
      id: uuidv4(),
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    try {
      await this.kafkaProducer.send({
        topic: 'service-events',
        messages: [
          {
            key: event.type,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });

      // Also emit locally
      this.eventBus.emit(eventType, payload);

      this.logger.info('Event published', { eventType, eventId: event.id });
    } catch (error) {
      this.logger.error('Failed to publish event', { eventType, error });
    }
  }

  async subscribeToEvent(eventType: string, handler: (payload: any) => Promise<void>): Promise<void> {
    this.eventBus.on(eventType, async (payload) => {
      try {
        await handler(payload);
      } catch (error) {
        this.logger.error('Event handler failed', { eventType, error });
      }
    });
  }

  private async recordServiceCallMetric(
    serviceName: string,
    path: string,
    status: string,
    duration: number
  ): Promise<void> {
    const metricKey = `metrics:service_calls:${serviceName}:${path}:${status}`;
    await this.redis.incr(metricKey);
    await this.redis.expire(metricKey, 300); // 5 minutes

    const durationKey = `metrics:service_call_duration:${serviceName}:${path}`;
    await this.redis.lpush(durationKey, duration);
    await this.redis.ltrim(durationKey, 0, 99); // Keep last 100 measurements
    await this.redis.expire(durationKey, 300);
  }

  // Health Checking
  private startHealthChecking(): void {
    setInterval(async () => {
      for (const [serviceId, service] of this.services) {
        try {
          const healthUrl = `http://${service.address}:${service.port}${service.metadata.healthCheckPath}`;
          const response = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });

          const previousHealth = service.health;
          service.health = response.ok ? 'healthy' : 'unhealthy';
          service.lastSeen = new Date();

          if (previousHealth !== service.health) {
            await this.publishEvent('service.health.changed', {
              serviceId,
              serviceName: service.name,
              health: service.health,
            });
          }
        } catch (error) {
          const previousHealth = service.health;
          service.health = 'unhealthy';

          if (previousHealth !== service.health) {
            await this.publishEvent('service.health.changed', {
              serviceId,
              serviceName: service.name,
              health: service.health,
              error: error.message,
            });
          }
        }
      }
    }, 10000); // Check every 10 seconds
  }

  // Service Discovery Watch
  private startServiceDiscovery(): void {
    setInterval(async () => {
      try {
        const consulServices = await this.consul.catalog.service.list();
        const currentServices = new Set(consulServices[1].map(s => s.ServiceName));

        // Remove services no longer in Consul
        for (const [serviceId, service] of this.services) {
          if (!currentServices.has(service.name)) {
            this.services.delete(serviceId);
            this.circuitBreakers.delete(service.name);
            await this.publishEvent('service.deregistered', {
              serviceId,
              serviceName: service.name,
            });
          }
        }
      } catch (error) {
        this.logger.error('Service discovery update failed', { error });
      }
    }, 30000); // Check every 30 seconds
  }

  private setupEventHandlers(): void {
    this.kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value?.toString() || '{}');

          switch (event.type) {
            case 'service.health.changed':
              await this.handleServiceHealthChange(event.payload);
              break;
            case 'circuit.breaker.opened':
              await this.handleCircuitBreakerOpened(event.payload);
              break;
            default:
              this.logger.debug('Unhandled event', { type: event.type });
          }
        } catch (error) {
          this.logger.error('Event processing failed', { error, topic, partition });
        }
      },
    });
  }

  private async handleServiceHealthChange(payload: any): Promise<void> {
    const { serviceId, serviceName, health } = payload;

    if (health === 'unhealthy') {
      // Remove from load balancer pool
      await this.redis.sadd(`unhealthy:${serviceName}`, serviceId);
    } else {
      // Add back to load balancer pool
      await this.redis.srem(`unhealthy:${serviceName}`, serviceId);
    }
  }

  private async handleCircuitBreakerOpened(payload: any): Promise<void> {
    const { service } = payload;

    // Implement fallback strategies
    await this.redis.setex(`circuit_breaker:${service}`, 300, 'open');

    // Notify monitoring systems
    await this.publishEvent('alert.circuit.breaker', {
      service,
      severity: 'high',
      message: `Circuit breaker opened for service: ${service}`,
    });
  }

  // Saga Pattern Implementation
  async executeSaga(sagaDefinition: SagaStep[]): Promise<string> {
    return this.sagaOrchestrator.execute(sagaDefinition);
  }

  async getSagaStatus(sagaId: string): Promise<SagaTransaction | null> {
    return this.sagaOrchestrator.getStatus(sagaId);
  }
}

// API Gateway Implementation
class ApiGateway {
  private app: Express;
  private platform: MicroservicesPlatform;
  private routes: Map<string, ApiGatewayRoute> = new Map();
  private rateLimiters: Map<string, any> = new Map();

  constructor(platform: MicroservicesPlatform) {
    this.platform = platform;
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request correlation
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || uuidv4();
      res.setHeader('x-correlation-id', req.headers['x-correlation-id'] as string);
      next();
    });

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });

      next();
    });

    // Dynamic routing
    this.app.use('*', this.routeRequest.bind(this));
  }

  addRoute(route: ApiGatewayRoute): void {
    const routeKey = `${route.method}:${route.path}`;
    this.routes.set(routeKey, route);

    // Setup rate limiting if specified
    if (route.rateLimit) {
      const rateLimit = require('express-rate-limit');
      const limiter = rateLimit({
        windowMs: route.rateLimit.windowMs,
        max: route.rateLimit.max,
        message: 'Too many requests',
      });
      this.rateLimiters.set(routeKey, limiter);
    }
  }

  private async routeRequest(req: Request, res: Response): Promise<void> {
    const routeKey = `${req.method}:${req.path}`;
    const route = this.routes.get(routeKey);

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    try {
      // Apply rate limiting
      const rateLimiter = this.rateLimiters.get(routeKey);
      if (rateLimiter) {
        await new Promise((resolve, reject) => {
          rateLimiter(req, res, (err: any) => {
            if (err) reject(err);
            else resolve(undefined);
          });
        });
      }

      // Apply authentication
      if (route.authentication?.required) {
        await this.authenticateRequest(req, route.authentication.roles);
      }

      // Forward request to target service
      const result = await this.platform.callService(
        route.target.service,
        route.target.path,
        {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(req.body),
          correlationId: req.headers['x-correlation-id'],
          clientIp: req.ip,
        }
      );

      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  }

  private async authenticateRequest(req: Request, requiredRoles?: string[]): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (requiredRoles && !requiredRoles.some(role => decoded.roles?.includes(role))) {
        throw new Error('Insufficient permissions');
      }

      (req as any).user = decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  start(port: number = 8080): void {
    this.app.listen(port, () => {
      console.log(`API Gateway listening on port ${port}`);
    });
  }
}

// Saga Orchestrator for distributed transactions
class SagaOrchestrator {
  private redis: Redis;
  private producer: Producer;
  private logger: Logger;
  private activeSagas: Map<string, SagaTransaction> = new Map();

  constructor(redis: Redis, producer: Producer, logger: Logger) {
    this.redis = redis;
    this.producer = producer;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    // Load active sagas from Redis
    const sagaKeys = await this.redis.keys('saga:*');
    for (const key of sagaKeys) {
      const sagaData = await this.redis.get(key);
      if (sagaData) {
        const saga = JSON.parse(sagaData);
        this.activeSagas.set(saga.id, saga);
      }
    }

    this.logger.info(`Loaded ${this.activeSagas.size} active sagas`);
  }

  async execute(steps: SagaStep[]): Promise<string> {
    const sagaId = uuidv4();
    const saga: SagaTransaction = {
      id: sagaId,
      steps,
      status: 'pending',
      completedSteps: [],
    };

    this.activeSagas.set(sagaId, saga);
    await this.persistSaga(saga);

    // Start executing steps
    this.executeNextStep(saga);

    return sagaId;
  }

  async getStatus(sagaId: string): Promise<SagaTransaction | null> {
    return this.activeSagas.get(sagaId) || null;
  }

  private async executeNextStep(saga: SagaTransaction): Promise<void> {
    if (saga.status !== 'pending') return;

    const nextStep = saga.steps.find(step => !saga.completedSteps.includes(step.id));
    if (!nextStep) {
      saga.status = 'completed';
      await this.persistSaga(saga);
      this.logger.info(`Saga completed: ${saga.id}`);
      return;
    }

    saga.currentStep = nextStep.id;
    await this.persistSaga(saga);

    try {
      await this.executeStep(nextStep);
      saga.completedSteps.push(nextStep.id);
      saga.currentStep = undefined;
      await this.persistSaga(saga);

      // Continue with next step
      setTimeout(() => this.executeNextStep(saga), 100);
    } catch (error) {
      this.logger.error(`Saga step failed: ${nextStep.id}`, { error });
      saga.status = 'compensating';
      saga.error = error instanceof Error ? error.message : 'Unknown error';
      await this.persistSaga(saga);

      // Start compensation
      this.compensate(saga);
    }
  }

  private async executeStep(step: SagaStep): Promise<void> {
    // Send command to service
    await this.producer.send({
      topic: 'saga-commands',
      messages: [{
        key: step.service,
        value: JSON.stringify({
          stepId: step.id,
          service: step.service,
          action: step.action,
          timestamp: new Date().toISOString(),
        }),
      }],
    });

    // Wait for response (simplified - in practice use proper correlation)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Step timeout')), step.timeout);

      // In a real implementation, you'd wait for the service response
      setTimeout(() => {
        clearTimeout(timeout);
        resolve(undefined);
      }, Math.random() * 1000); // Simulate processing time
    });
  }

  private async compensate(saga: SagaTransaction): Promise<void> {
    // Execute compensation actions in reverse order
    const completedSteps = saga.steps.filter(step => saga.completedSteps.includes(step.id));

    for (const step of completedSteps.reverse()) {
      try {
        await this.executeCompensation(step);
      } catch (error) {
        this.logger.error(`Compensation failed for step: ${step.id}`, { error });
      }
    }

    saga.status = 'failed';
    await this.persistSaga(saga);
  }

  private async executeCompensation(step: SagaStep): Promise<void> {
    await this.producer.send({
      topic: 'saga-commands',
      messages: [{
        key: step.service,
        value: JSON.stringify({
          stepId: step.id,
          service: step.service,
          action: step.compensationAction,
          type: 'compensation',
          timestamp: new Date().toISOString(),
        }),
      }],
    });
  }

  private async persistSaga(saga: SagaTransaction): Promise<void> {
    await this.redis.setex(`saga:${saga.id}`, 3600, JSON.stringify(saga));
  }
}

// Example usage
export async function createMicroservicesExample(): Promise<void> {
  const platform = new MicroservicesPlatform();
  await platform.initialize();

  // Register services
  await platform.registerService({
    name: 'user-service',
    version: '1.0.0',
    port: 3001,
    healthCheckPath: '/health',
    dependencies: ['database'],
    circuitBreaker: {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    },
  });

  await platform.registerService({
    name: 'order-service',
    version: '1.0.0',
    port: 3002,
    healthCheckPath: '/health',
    dependencies: ['user-service', 'inventory-service'],
    circuitBreaker: {
      timeout: 3000,
      errorThresholdPercentage: 60,
      resetTimeout: 20000,
    },
  });

  // Setup API Gateway
  const gateway = new ApiGateway(platform);

  gateway.addRoute({
    path: '/api/users/*',
    method: 'GET',
    target: {
      service: 'user-service',
      path: '/users',
    },
    middleware: ['auth', 'rate-limit'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
    },
    authentication: {
      required: true,
      roles: ['user', 'admin'],
    },
  });

  gateway.addRoute({
    path: '/api/orders/*',
    method: 'POST',
    target: {
      service: 'order-service',
      path: '/orders',
    },
    middleware: ['auth'],
    authentication: {
      required: true,
      roles: ['user'],
    },
  });

  // Example saga transaction
  const sagaId = await platform.executeSaga([
    {
      id: 'reserve-inventory',
      service: 'inventory-service',
      action: 'reserve',
      compensationAction: 'release',
      retryCount: 3,
      timeout: 5000,
    },
    {
      id: 'charge-payment',
      service: 'payment-service',
      action: 'charge',
      compensationAction: 'refund',
      retryCount: 3,
      timeout: 10000,
    },
    {
      id: 'create-order',
      service: 'order-service',
      action: 'create',
      compensationAction: 'cancel',
      retryCount: 1,
      timeout: 5000,
    },
  ]);

  console.log(`Saga started: ${sagaId}`);

  // Start API Gateway
  gateway.start(8080);
}

export { MicroservicesPlatform, ApiGateway, SagaOrchestrator };
```

## Skill Activation Triggers

This skill automatically activates when:
- Microservices architecture design is needed
- Service mesh deployment is required
- API gateway implementation is requested
- Distributed system patterns are needed
- Inter-service communication optimization is required
- Circuit breaker and resilience patterns are requested

This comprehensive microservices architecture skill provides expert-level capabilities for building modern, scalable distributed systems with advanced patterns for service communication, fault tolerance, and system resilience.