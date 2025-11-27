# GraphQL Development Skill

Advanced GraphQL development expertise covering federation architecture, real-time subscriptions, performance optimization, and comprehensive GraphQL platform development with modern tooling and best practices.

## Skill Overview

Expert GraphQL knowledge including schema design patterns, federation implementation, subscription systems, query optimization, security patterns, and modern GraphQL platform engineering with Apollo Federation, Relay, and performance monitoring.

## Core Capabilities

### GraphQL Federation & Architecture
- **Apollo Federation** - Gateway setup, subgraph composition, entity resolution, distributed schemas
- **Schema stitching** - Remote schema merging, delegation, conflict resolution, type extensions
- **Microservices integration** - Service boundaries, data graph design, cross-service relationships
- **Type composition** - Entity relationships, federation directives, schema evolution strategies

### Real-time & Subscriptions
- **GraphQL subscriptions** - WebSocket transport, subscription filtering, connection management
- **Live queries** - Real-time data updates, cache invalidation, optimistic updates
- **Event-driven architecture** - Pub/sub systems, event sourcing, real-time notifications
- **Connection pooling** - Subscription scaling, memory management, connection limits

### Performance & Optimization
- **Query optimization** - N+1 problem solving, DataLoader patterns, query complexity analysis
- **Caching strategies** - Apollo Cache, Redis integration, CDN caching, cache invalidation
- **Query planning** - Execution optimization, field resolution batching, parallel execution
- **Monitoring & analytics** - Query performance tracking, error analysis, usage metrics

### Security & Validation
- **Query security** - Depth limiting, complexity analysis, rate limiting, query whitelisting
- **Authentication integration** - JWT validation, role-based access, field-level permissions
- **Input validation** - Schema validation, custom scalars, directive-based validation
- **Data protection** - PII masking, audit logging, compliance patterns

## Modern GraphQL Platform Implementation

### Comprehensive GraphQL Federation Platform with Apollo
```typescript
// Advanced GraphQL federation platform with subscriptions, caching, and security
import { ApolloServer } from 'apollo-server-express';
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql, makeExecutableSchema, AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { GraphQLScalarType, GraphQLError } from 'graphql';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import DataLoader from 'dataloader';
import { shield, rule, and, or, not } from 'graphql-shield';
import { applyMiddleware } from 'graphql-middleware';
import depthLimit from 'graphql-depth-limit';
import costAnalysis from 'graphql-cost-analysis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import express from 'express';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { createComplexityLimitRule } from 'graphql-query-complexity';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

// Types and interfaces
interface GraphQLConfig {
  gateway: {
    services: ServiceDefinition[];
    pollIntervalInMs?: number;
    debug?: boolean;
  };
  subscriptions: {
    redis: {
      host: string;
      port: number;
      password?: string;
    };
    maxConnections: number;
    connectionTimeout: number;
  };
  security: {
    maxDepth: number;
    maxComplexity: number;
    rateLimitPerMinute: number;
    enableIntrospection: boolean;
    requireAuth: boolean;
  };
  caching: {
    redis: {
      host: string;
      port: number;
    };
    ttl: number;
    enableResponseCache: boolean;
  };
  monitoring: {
    enableTracing: boolean;
    enableMetrics: boolean;
    logQueries: boolean;
  };
}

interface ServiceDefinition {
  name: string;
  url: string;
  sdl?: string;
}

interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  organizationId?: string;
}

interface QueryMetrics {
  operationName?: string;
  query: string;
  variables?: Record<string, any>;
  executionTime: number;
  complexity: number;
  depth: number;
  errors?: GraphQLError[];
  userId?: string;
  timestamp: Date;
}

interface CacheEntry<T = any> {
  value: T;
  ttl: number;
  createdAt: Date;
}

// Custom scalars
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO 8601 date-time string',
  serialize(value: any): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error('Value must be a Date instance');
  },
  parseValue(value: any): Date {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new Error('Value must be a string');
  },
  parseLiteral(ast: any): Date {
    if (ast.kind === 'StringValue') {
      return new Date(ast.value);
    }
    throw new Error('Value must be a string literal');
  },
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON object',
  serialize: (value: any) => value,
  parseValue: (value: any) => value,
  parseLiteral: (ast: any) => {
    switch (ast.kind) {
      case 'StringValue':
        return JSON.parse(ast.value);
      case 'ObjectValue':
        return ast.fields.reduce((obj: any, field: any) => {
          obj[field.name.value] = field.value.value;
          return obj;
        }, {});
      default:
        throw new Error('Invalid JSON literal');
    }
  },
});

// Core GraphQL Platform
class GraphQLPlatform {
  private config: GraphQLConfig;
  private gateway: ApolloGateway;
  private server: ApolloServer;
  private subscriptionServer?: SubscriptionServer;
  private pubsub: PubSub;
  private redis: Redis;
  private cacheRedis: Redis;
  private rateLimiter: RateLimiterRedis;
  private logger: Logger;
  private prisma: PrismaClient;
  private dataLoaders: Map<string, DataLoader<any, any>> = new Map();
  private queryMetrics: QueryMetrics[] = [];

  constructor(config: GraphQLConfig) {
    this.config = config;
    this.prisma = new PrismaClient();

    // Initialize Redis for subscriptions
    this.redis = new Redis({
      host: config.subscriptions.redis.host,
      port: config.subscriptions.redis.port,
      password: config.subscriptions.redis.password,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Initialize Redis for caching
    this.cacheRedis = new Redis({
      host: config.caching.redis.host,
      port: config.caching.redis.port,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Initialize PubSub
    this.pubsub = new RedisPubSub({
      publisher: this.redis,
      subscriber: this.redis,
    });

    // Initialize rate limiter
    this.rateLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'graphql_rl',
      points: config.security.rateLimitPerMinute,
      duration: 60,
    });

    // Initialize logger
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console({ format: format.simple() }),
        new transports.File({ filename: 'graphql-platform.log' })
      ]
    });

    this.setupGateway();
    this.setupDataLoaders();
  }

  private setupGateway(): void {
    // Custom data source for authentication and monitoring
    class AuthenticatedDataSource extends RemoteGraphQLDataSource {
      private platform: GraphQLPlatform;

      constructor(platform: GraphQLPlatform) {
        super();
        this.platform = platform;
      }

      willSendRequest({ request, context }: any) {
        // Add authentication headers
        if (context.user) {
          request.http.headers.set('user-id', context.user.id);
          request.http.headers.set('user-roles', JSON.stringify(context.user.roles));
        }

        // Add tracing headers
        const requestId = context.requestId || uuidv4();
        request.http.headers.set('x-request-id', requestId);
        request.http.headers.set('x-trace-id', context.traceId || uuidv4());

        // Add timestamp for latency tracking
        request.http.headers.set('x-request-timestamp', Date.now().toString());
      }

      didReceiveResponse({ response, context }: any) {
        // Log service response times
        const requestTime = parseInt(response.http.headers.get('x-request-timestamp') || '0');
        const responseTime = Date.now() - requestTime;

        this.platform.logger.info('Service response', {
          service: this.name,
          responseTime,
          status: response.http.status,
          requestId: context.requestId,
        });

        return response;
      }

      didEncounterError(error: any) {
        this.platform.logger.error('Service error', {
          service: this.name,
          error: error.message,
          stack: error.stack,
        });

        throw error;
      }
    }

    this.gateway = new ApolloGateway({
      serviceList: this.config.gateway.services,
      introspectionHeaders: {
        'user-agent': 'GraphQL-Gateway/1.0',
      },
      buildService({ url }) {
        const dataSource = new AuthenticatedDataSource(this);
        dataSource.url = url;
        return dataSource;
      },
      experimental_pollInterval: this.config.gateway.pollIntervalInMs,
      debug: this.config.gateway.debug,
    });
  }

  private setupDataLoaders(): void {
    // User data loader
    const userLoader = new DataLoader(async (userIds: readonly string[]) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        include: { roles: true },
      });

      const userMap = new Map(users.map(user => [user.id, user]));
      return userIds.map(id => userMap.get(id) || null);
    });

    // Organization data loader
    const organizationLoader = new DataLoader(async (orgIds: readonly string[]) => {
      const organizations = await this.prisma.organization.findMany({
        where: { id: { in: orgIds as string[] } },
        include: { users: true },
      });

      const orgMap = new Map(organizations.map(org => [org.id, org]));
      return orgIds.map(id => orgMap.get(id) || null);
    });

    // Post data loader with caching
    const postLoader = new DataLoader(
      async (postIds: readonly string[]) => {
        // Check cache first
        const cacheKeys = postIds.map(id => `post:${id}`);
        const cached = await this.cacheRedis.mget(...cacheKeys);

        const uncachedIds: string[] = [];
        const results: any[] = [];

        cached.forEach((cachedPost, index) => {
          if (cachedPost) {
            results[index] = JSON.parse(cachedPost);
          } else {
            uncachedIds.push(postIds[index]);
            results[index] = null;
          }
        });

        if (uncachedIds.length > 0) {
          const posts = await this.prisma.post.findMany({
            where: { id: { in: uncachedIds } },
            include: {
              author: true,
              comments: { include: { author: true } },
              tags: true,
            },
          });

          // Cache the results
          const pipeline = this.cacheRedis.pipeline();
          posts.forEach(post => {
            pipeline.setex(`post:${post.id}`, this.config.caching.ttl, JSON.stringify(post));
            const index = postIds.findIndex(id => id === post.id);
            if (index !== -1) {
              results[index] = post;
            }
          });
          await pipeline.exec();
        }

        return results;
      },
      {
        cacheKeyFn: (key: string) => `loader:post:${key}`,
        cacheMap: new Map(),
      }
    );

    this.dataLoaders.set('users', userLoader);
    this.dataLoaders.set('organizations', organizationLoader);
    this.dataLoaders.set('posts', postLoader);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize gateway
      const { schema, executor } = await this.gateway.load();

      // Apply security middleware
      const protectedSchema = applyMiddleware(
        schema,
        this.createSecurityShield(),
        this.createRateLimitMiddleware(),
        this.createMetricsMiddleware()
      );

      // Create Apollo Server
      this.server = new ApolloServer({
        schema: protectedSchema,
        executor,
        context: this.createContext.bind(this),
        plugins: [
          this.createTracingPlugin(),
          this.createCachePlugin(),
          this.createMetricsPlugin(),
          this.createSecurityPlugin(),
        ],
        validationRules: [
          depthLimit(this.config.security.maxDepth),
          createComplexityLimitRule(this.config.security.maxComplexity),
        ],
        introspection: this.config.security.enableIntrospection,
        playground: this.config.security.enableIntrospection,
        formatError: this.formatError.bind(this),
        formatResponse: this.formatResponse.bind(this),
      });

      this.logger.info('GraphQL Platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize GraphQL platform', { error });
      throw error;
    }
  }

  private createContext({ req, connection }: any) {
    if (connection) {
      // WebSocket connection context for subscriptions
      return {
        ...connection.context,
        dataSources: this.dataLoaders,
        pubsub: this.pubsub,
        redis: this.redis,
        requestId: uuidv4(),
        traceId: uuidv4(),
      };
    }

    // HTTP request context
    return {
      user: req.user,
      dataSources: this.dataLoaders,
      pubsub: this.pubsub,
      redis: this.redis,
      requestId: req.headers['x-request-id'] || uuidv4(),
      traceId: req.headers['x-trace-id'] || uuidv4(),
      userAgent: req.headers['user-agent'],
      clientIp: req.ip,
    };
  }

  private createSecurityShield() {
    const isAuthenticated = rule({ cache: 'contextual' })(
      async (parent, args, context) => {
        return context.user !== null;
      }
    );

    const hasRole = (role: string) => rule({ cache: 'contextual' })(
      async (parent, args, context) => {
        return context.user?.roles?.includes(role) === true;
      }
    );

    const hasPermission = (permission: string) => rule({ cache: 'contextual' })(
      async (parent, args, context) => {
        return context.user?.permissions?.includes(permission) === true;
      }
    );

    const canAccessResource = rule({ cache: 'strict' })(
      async (parent, args, context, info) => {
        // Implement resource-level access control
        if (!context.user) return false;

        const resourceType = info.parentType.name;
        const resourceId = parent?.id || args?.id;

        if (resourceType === 'User' && resourceId) {
          // Users can access their own profile or admins can access any
          return context.user.id === resourceId || context.user.roles.includes('admin');
        }

        if (resourceType === 'Organization' && resourceId) {
          // Users can access their organization
          return context.user.organizationId === resourceId || context.user.roles.includes('admin');
        }

        return true;
      }
    );

    return shield({
      Query: {
        me: isAuthenticated,
        users: and(isAuthenticated, hasRole('admin')),
        organizations: and(isAuthenticated, hasRole('admin')),
        posts: isAuthenticated,
        privateData: and(isAuthenticated, hasPermission('read:private')),
      },
      Mutation: {
        createPost: isAuthenticated,
        updatePost: and(isAuthenticated, canAccessResource),
        deletePost: and(isAuthenticated, canAccessResource),
        createUser: hasRole('admin'),
        updateUser: and(isAuthenticated, canAccessResource),
        deleteUser: hasRole('admin'),
      },
      Subscription: {
        postUpdated: isAuthenticated,
        userNotifications: isAuthenticated,
      },
      User: canAccessResource,
      Organization: canAccessResource,
    }, {
      allowExternalErrors: true,
      fallbackRule: not(isAuthenticated),
    });
  }

  private createRateLimitMiddleware() {
    return async (resolve: any, parent: any, args: any, context: any, info: any) => {
      const key = context.user?.id || context.clientIp;

      try {
        await this.rateLimiter.consume(key);
        return resolve(parent, args, context, info);
      } catch (rejRes) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    };
  }

  private createMetricsMiddleware() {
    return async (resolve: any, parent: any, args: any, context: any, info: any) => {
      const start = Date.now();

      try {
        const result = await resolve(parent, args, context, info);

        // Record successful operation
        this.recordMetrics({
          operation: info.operation.operation,
          fieldName: info.fieldName,
          parentType: info.parentType.name,
          duration: Date.now() - start,
          success: true,
          userId: context.user?.id,
        });

        return result;
      } catch (error) {
        // Record failed operation
        this.recordMetrics({
          operation: info.operation.operation,
          fieldName: info.fieldName,
          parentType: info.parentType.name,
          duration: Date.now() - start,
          success: false,
          error: error.message,
          userId: context.user?.id,
        });

        throw error;
      }
    };
  }

  private createTracingPlugin() {
    return {
      requestDidStart() {
        return {
          didResolveOperation(requestContext: any) {
            if (requestContext.request.operationName) {
              requestContext.logger.info('GraphQL operation', {
                operationName: requestContext.request.operationName,
                query: requestContext.request.query,
                variables: requestContext.request.variables,
                userId: requestContext.context.user?.id,
                requestId: requestContext.context.requestId,
              });
            }
          },

          didEncounterErrors(requestContext: any) {
            requestContext.logger.error('GraphQL errors', {
              errors: requestContext.errors.map((error: GraphQLError) => ({
                message: error.message,
                path: error.path,
                locations: error.locations,
                stack: error.stack,
              })),
              requestId: requestContext.context.requestId,
              userId: requestContext.context.user?.id,
            });
          },

          willSendResponse(requestContext: any) {
            const duration = Date.now() - requestContext.context.startTime;

            requestContext.logger.info('GraphQL response', {
              duration,
              operationName: requestContext.request.operationName,
              success: !requestContext.errors || requestContext.errors.length === 0,
              requestId: requestContext.context.requestId,
              userId: requestContext.context.user?.id,
            });
          },
        };
      },
    };
  }

  private createCachePlugin() {
    return {
      requestDidStart() {
        return {
          willSendResponse(requestContext: any) {
            if (this.config.caching.enableResponseCache &&
                requestContext.request.operationName &&
                !requestContext.errors) {
              // Cache successful query responses
              const cacheKey = this.generateCacheKey(
                requestContext.request.query,
                requestContext.request.variables,
                requestContext.context.user?.id
              );

              this.cacheRedis.setex(
                `response:${cacheKey}`,
                this.config.caching.ttl,
                JSON.stringify(requestContext.response.data)
              );
            }
          },
        };
      },
    };
  }

  private createSecurityPlugin() {
    return {
      requestDidStart() {
        return {
          didResolveOperation(requestContext: any) {
            // Log potentially suspicious queries
            const query = requestContext.request.query;
            const operationName = requestContext.request.operationName;

            if (this.isSuspiciousQuery(query)) {
              this.logger.warn('Suspicious GraphQL query detected', {
                query,
                operationName,
                variables: requestContext.request.variables,
                userId: requestContext.context.user?.id,
                clientIp: requestContext.context.clientIp,
                userAgent: requestContext.context.userAgent,
              });
            }
          },
        };
      },
    };
  }

  private createMetricsPlugin() {
    return {
      requestDidStart() {
        const startTime = Date.now();

        return {
          willSendResponse(requestContext: any) {
            const executionTime = Date.now() - startTime;

            const metrics: QueryMetrics = {
              operationName: requestContext.request.operationName,
              query: requestContext.request.query,
              variables: requestContext.request.variables,
              executionTime,
              complexity: this.calculateQueryComplexity(requestContext.request.query),
              depth: this.calculateQueryDepth(requestContext.request.query),
              errors: requestContext.errors,
              userId: requestContext.context.user?.id,
              timestamp: new Date(),
            };

            this.queryMetrics.push(metrics);

            // Keep only last 1000 metrics in memory
            if (this.queryMetrics.length > 1000) {
              this.queryMetrics.shift();
            }

            // Store metrics in Redis for analysis
            this.redis.lpush('graphql:metrics', JSON.stringify(metrics));
            this.redis.ltrim('graphql:metrics', 0, 9999); // Keep last 10k metrics
          },
        };
      },
    };
  }

  // Subscription Resolvers
  createSubscriptionResolvers() {
    return {
      postUpdated: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator(['POST_UPDATED']),
          (payload, variables, context) => {
            // Filter subscriptions based on user permissions
            return this.canUserAccessPost(context.user, payload.postUpdated);
          }
        ),
      },

      userNotifications: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator(['USER_NOTIFICATION']),
          (payload, variables, context) => {
            return payload.userId === context.user.id;
          }
        ),
      },

      liveQuery: {
        subscribe: async function* (parent: any, args: any, context: any) {
          const { query, variables } = args;

          // Initial query result
          let lastResult = await context.dataSources.executeQuery(query, variables);
          yield { liveQuery: lastResult };

          // Subscribe to relevant changes
          const subscription = context.pubsub.asyncIterator(['DATA_CHANGED']);

          for await (const change of subscription) {
            // Re-execute query and compare results
            const newResult = await context.dataSources.executeQuery(query, variables);

            if (JSON.stringify(newResult) !== JSON.stringify(lastResult)) {
              lastResult = newResult;
              yield { liveQuery: newResult };
            }
          }
        },
      },

      realtimeMetrics: {
        subscribe: withFilter(
          () => this.pubsub.asyncIterator(['METRICS_UPDATE']),
          (payload, variables, context) => {
            return context.user.roles.includes('admin') || context.user.roles.includes('monitor');
          }
        ),
      },
    };
  }

  // Query Optimization and Caching
  async optimizeQuery(query: string, variables: any, context: any): Promise<any> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(query, variables, context.user?.id);

    // Check cache first
    const cached = await this.cacheRedis.get(`response:${cacheKey}`);
    if (cached) {
      this.logger.debug('Cache hit', { cacheKey });
      return JSON.parse(cached);
    }

    // Analyze query for optimization opportunities
    const queryAnalysis = this.analyzeQuery(query);

    if (queryAnalysis.hasNPlusOnePotential) {
      // Prepare data loaders
      context.dataSources = this.prepareDataLoaders(queryAnalysis.fields);
    }

    // Execute optimized query
    const result = await this.executeOptimizedQuery(query, variables, context);

    // Cache result if cacheable
    if (queryAnalysis.isCacheable) {
      await this.cacheRedis.setex(
        `response:${cacheKey}`,
        this.calculateCacheTTL(queryAnalysis),
        JSON.stringify(result)
      );
    }

    return result;
  }

  private analyzeQuery(query: string): any {
    // Simplified query analysis
    return {
      hasNPlusOnePotential: query.includes('posts') && query.includes('author'),
      isCacheable: !query.includes('mutation') && !query.includes('subscription'),
      complexity: this.calculateQueryComplexity(query),
      depth: this.calculateQueryDepth(query),
      fields: this.extractFields(query),
    };
  }

  private calculateQueryComplexity(query: string): number {
    // Simplified complexity calculation
    const fieldCount = (query.match(/\w+\s*{/g) || []).length;
    const depthPenalty = this.calculateQueryDepth(query) * 2;
    return fieldCount + depthPenalty;
  }

  private calculateQueryDepth(query: string): number {
    // Count maximum nesting depth
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of query) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  private extractFields(query: string): string[] {
    // Extract field names from query
    const fieldRegex = /(\w+)\s*(?:\(.*?\))?\s*{/g;
    const fields: string[] = [];
    let match;

    while ((match = fieldRegex.exec(query)) !== null) {
      fields.push(match[1]);
    }

    return fields;
  }

  private generateCacheKey(query: string, variables: any, userId?: string): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify({ query, variables, userId }))
      .digest('hex');
    return hash;
  }

  private calculateCacheTTL(queryAnalysis: any): number {
    // Dynamic TTL based on query characteristics
    if (queryAnalysis.complexity > 50) {
      return this.config.caching.ttl * 2; // Cache complex queries longer
    }

    return this.config.caching.ttl;
  }

  private isSuspiciousQuery(query: string): boolean {
    // Basic suspicious query detection
    const suspiciousPatterns = [
      /\{\s*\w+\s*\{\s*\w+\s*\{.*\{.*\{/,  // Very deep nesting
      /__schema|__type|__typename.*introspection/i,  // Introspection abuse
      /mutation.*mutation.*mutation/i,  // Multiple mutations
    ];

    return suspiciousPatterns.some(pattern => pattern.test(query));
  }

  private async canUserAccessPost(user: any, post: any): Promise<boolean> {
    if (!user) return false;

    // Public posts are accessible to all authenticated users
    if (post.isPublic) return true;

    // Users can access their own posts
    if (post.authorId === user.id) return true;

    // Organization members can access organization posts
    if (post.organizationId && user.organizationId === post.organizationId) {
      return true;
    }

    // Admins can access everything
    return user.roles.includes('admin');
  }

  private async executeOptimizedQuery(query: string, variables: any, context: any): Promise<any> {
    // Execute query with optimizations
    return await this.server.executeOperation({
      query,
      variables,
      contextValue: context,
    });
  }

  private prepareDataLoaders(fields: string[]): any {
    const loaders: any = {};

    for (const field of fields) {
      if (this.dataLoaders.has(field)) {
        loaders[field] = this.dataLoaders.get(field);
      }
    }

    return loaders;
  }

  private recordMetrics(metrics: any): void {
    // Record operation metrics
    this.redis.hincrby('graphql:operations', `${metrics.parentType}.${metrics.fieldName}`, 1);
    this.redis.hincrby('graphql:durations', `${metrics.parentType}.${metrics.fieldName}`, metrics.duration);

    if (!metrics.success) {
      this.redis.hincrby('graphql:errors', `${metrics.parentType}.${metrics.fieldName}`, 1);
    }

    // Record hourly metrics
    const hour = new Date().getHours();
    this.redis.hincrby(`graphql:hourly:${hour}`, 'operations', 1);
    this.redis.expire(`graphql:hourly:${hour}`, 86400); // 24 hours
  }

  // Error formatting and security
  private formatError(error: GraphQLError): GraphQLError {
    // Log detailed error information
    this.logger.error('GraphQL error', {
      message: error.message,
      path: error.path,
      locations: error.locations,
      stack: error.stack,
    });

    // Return sanitized error for production
    if (process.env.NODE_ENV === 'production') {
      // Don't expose internal errors in production
      if (error.message.includes('Database') || error.message.includes('Internal')) {
        return new GraphQLError('Internal server error');
      }
    }

    return error;
  }

  private formatResponse(response: any): any {
    // Add metadata to response
    if (response.extensions) {
      response.extensions.timestamp = new Date().toISOString();
      response.extensions.version = process.env.API_VERSION || '1.0.0';
    }

    return response;
  }

  // Real-time Features
  async publishUpdate(event: string, payload: any): Promise<void> {
    await this.pubsub.publish(event, payload);

    // Also store in Redis for replay capability
    await this.redis.lpush(`events:${event}`, JSON.stringify({
      ...payload,
      timestamp: new Date(),
    }));

    // Keep last 1000 events
    await this.redis.ltrim(`events:${event}`, 0, 999);
  }

  async getRecentEvents(event: string, count: number = 10): Promise<any[]> {
    const events = await this.redis.lrange(`events:${event}`, 0, count - 1);
    return events.map(event => JSON.parse(event));
  }

  // Monitoring and Analytics
  async getMetrics(): Promise<any> {
    const operations = await this.redis.hgetall('graphql:operations');
    const durations = await this.redis.hgetall('graphql:durations');
    const errors = await this.redis.hgetall('graphql:errors');

    const metrics: any = {
      operations: {},
      averageDurations: {},
      errorRates: {},
      recentQueries: this.queryMetrics.slice(-10),
    };

    // Calculate average durations and error rates
    for (const [key, count] of Object.entries(operations)) {
      const totalDuration = parseInt(durations[key] || '0');
      const errorCount = parseInt(errors[key] || '0');

      metrics.operations[key] = parseInt(count as string);
      metrics.averageDurations[key] = totalDuration / parseInt(count as string);
      metrics.errorRates[key] = errorCount / parseInt(count as string);
    }

    return metrics;
  }

  async getSubscriptionStats(): Promise<any> {
    return {
      activeConnections: this.subscriptionServer?.wsServer.clients.size || 0,
      totalSubscriptions: await this.redis.get('subscription:count') || 0,
      subscriptionsByType: await this.redis.hgetall('subscription:types'),
    };
  }

  // Schema Management
  async reloadSchema(): Promise<void> {
    try {
      const { schema, executor } = await this.gateway.load();
      this.server.schema = schema;
      this.logger.info('Schema reloaded successfully');
    } catch (error) {
      this.logger.error('Schema reload failed', { error });
      throw error;
    }
  }

  async validateSchemaChanges(newSchema: string): Promise<any> {
    // Simplified schema validation
    try {
      const { buildSchema } = require('graphql');
      const schema = buildSchema(newSchema);

      return {
        valid: true,
        errors: [],
        breakingChanges: [], // Would implement actual breaking change detection
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        breakingChanges: [],
      };
    }
  }

  // Development and Debugging
  async executeDebugQuery(query: string, variables: any = {}): Promise<any> {
    const start = Date.now();

    try {
      const result = await this.server.executeOperation({
        query,
        variables,
        contextValue: {
          user: { id: 'debug', roles: ['admin'] },
          dataSources: this.dataLoaders,
          debug: true,
        },
      });

      const duration = Date.now() - start;

      return {
        result,
        metadata: {
          duration,
          complexity: this.calculateQueryComplexity(query),
          depth: this.calculateQueryDepth(query),
        },
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack,
      };
    }
  }

  // Lifecycle Management
  async start(port: number = 4000): Promise<void> {
    const app = express();

    // Apply authentication middleware
    app.use(async (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

          const user = await this.dataLoaders.get('users')?.load(decoded.userId);
          req.user = user;
        } catch (error) {
          // Invalid token - continue without user
        }
      }

      next();
    });

    await this.server.start();
    this.server.applyMiddleware({ app, path: '/graphql' });

    const httpServer = createServer(app);

    // Setup WebSocket server for subscriptions
    this.subscriptionServer = SubscriptionServer.create({
      schema: this.server.schema!,
      execute,
      subscribe,
      onConnect: async (connectionParams: any) => {
        // Authenticate WebSocket connections
        const token = connectionParams.authToken || connectionParams.Authorization;

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            const user = await this.dataLoaders.get('users')?.load(decoded.userId);

            return {
              user,
              dataSources: this.dataLoaders,
              pubsub: this.pubsub,
            };
          } catch (error) {
            throw new Error('Authentication failed');
          }
        }

        throw new Error('Authentication required');
      },
      onDisconnect: () => {
        this.logger.info('WebSocket client disconnected');
      },
    }, {
      server: httpServer,
      path: '/graphql',
    });

    httpServer.listen(port, () => {
      this.logger.info(`GraphQL server running on http://localhost:${port}/graphql`);
      this.logger.info(`WebSocket subscriptions at ws://localhost:${port}/graphql`);
    });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down GraphQL platform...');

    await this.server.stop();

    if (this.subscriptionServer) {
      this.subscriptionServer.close();
    }

    await this.gateway.stop();
    this.redis.disconnect();
    this.cacheRedis.disconnect();
    await this.prisma.$disconnect();

    this.logger.info('GraphQL platform shutdown complete');
  }
}

// Example usage and subgraph implementation
export async function createGraphQLPlatformExample(): Promise<void> {
  const config: GraphQLConfig = {
    gateway: {
      services: [
        {
          name: 'users',
          url: 'http://localhost:4001/graphql',
        },
        {
          name: 'posts',
          url: 'http://localhost:4002/graphql',
        },
        {
          name: 'comments',
          url: 'http://localhost:4003/graphql',
        },
      ],
      pollIntervalInMs: 10000,
      debug: process.env.NODE_ENV !== 'production',
    },
    subscriptions: {
      redis: {
        host: 'localhost',
        port: 6379,
      },
      maxConnections: 1000,
      connectionTimeout: 30000,
    },
    security: {
      maxDepth: 10,
      maxComplexity: 1000,
      rateLimitPerMinute: 100,
      enableIntrospection: process.env.NODE_ENV !== 'production',
      requireAuth: true,
    },
    caching: {
      redis: {
        host: 'localhost',
        port: 6379,
      },
      ttl: 300, // 5 minutes
      enableResponseCache: true,
    },
    monitoring: {
      enableTracing: true,
      enableMetrics: true,
      logQueries: process.env.NODE_ENV !== 'production',
    },
  };

  const platform = new GraphQLPlatform(config);
  await platform.initialize();
  await platform.start(4000);

  // Example subgraph schema for users service
  const userSchema = gql`
    type User @key(fields: "id") {
      id: ID!
      email: String!
      username: String!
      profile: UserProfile
      posts: [Post!]!
      createdAt: DateTime!
      updatedAt: DateTime!
    }

    type UserProfile {
      firstName: String
      lastName: String
      avatar: String
      bio: String
    }

    extend type Query {
      me: User
      user(id: ID!): User
      users(first: Int, after: String): UserConnection!
    }

    extend type Mutation {
      updateProfile(input: UpdateProfileInput!): User!
      uploadAvatar(file: Upload!): User!
    }

    extend type Subscription {
      userUpdated(userId: ID!): User!
    }

    type UserConnection {
      edges: [UserEdge!]!
      pageInfo: PageInfo!
      totalCount: Int!
    }

    type UserEdge {
      cursor: String!
      node: User!
    }

    type PageInfo {
      hasNextPage: Boolean!
      hasPreviousPage: Boolean!
      startCursor: String
      endCursor: String
    }

    input UpdateProfileInput {
      firstName: String
      lastName: String
      bio: String
    }

    scalar Upload
    scalar DateTime
  `;

  // Example resolvers for users service
  const userResolvers = {
    User: {
      __resolveReference: async (user: any, { dataSources }: any) => {
        return dataSources.users.load(user.id);
      },
      posts: async (user: any, args: any, { dataSources }: any) => {
        return dataSources.posts.loadByUserId(user.id);
      },
    },
    Query: {
      me: async (parent: any, args: any, { user }: any) => {
        return user;
      },
      user: async (parent: any, { id }: any, { dataSources }: any) => {
        return dataSources.users.load(id);
      },
      users: async (parent: any, { first, after }: any, { dataSources }: any) => {
        return dataSources.users.loadConnection({ first, after });
      },
    },
    Mutation: {
      updateProfile: async (parent: any, { input }: any, { user, dataSources }: any) => {
        return dataSources.users.updateProfile(user.id, input);
      },
      uploadAvatar: async (parent: any, { file }: any, { user, dataSources }: any) => {
        return dataSources.users.uploadAvatar(user.id, file);
      },
    },
    Subscription: {
      userUpdated: {
        subscribe: withFilter(
          (parent: any, args: any, { pubsub }: any) => pubsub.asyncIterator(['USER_UPDATED']),
          (payload: any, { userId }: any) => {
            return payload.userUpdated.id === userId;
          }
        ),
      },
    },
    DateTime: DateTimeScalar,
  };

  // Create subgraph schema
  const userSubgraphSchema = buildSubgraphSchema({
    typeDefs: userSchema,
    resolvers: userResolvers,
  });

  console.log('GraphQL Federation platform with subscriptions and advanced features running');
}

export { GraphQLPlatform, GraphQLConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- GraphQL API development is needed
- Federation architecture implementation is required
- Real-time subscriptions are requested
- GraphQL performance optimization is needed
- Schema design and evolution is required
- GraphQL security implementation is requested

This comprehensive GraphQL development skill provides expert-level capabilities for building modern, scalable GraphQL platforms with advanced features for federation, real-time capabilities, security, and performance optimization.