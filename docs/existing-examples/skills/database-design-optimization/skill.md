# Database Design & Optimization Skill

Advanced database architecture and optimization expertise covering distributed database design, performance tuning, caching strategies, and comprehensive database platform engineering with modern NoSQL, SQL, and vector database technologies.

## Skill Overview

Expert database knowledge including schema design patterns, query optimization, distributed architectures, caching layers, performance monitoring, and modern database platform engineering with advanced optimization, scaling, and reliability patterns.

## Core Capabilities

### Database Design & Architecture
- **Schema design patterns** - Normalization strategies, denormalization trade-offs, domain-driven design, event sourcing schemas
- **Distributed databases** - Sharding strategies, replication topologies, consistency models, partition tolerance
- **Database selection** - SQL vs NoSQL trade-offs, CAP theorem applications, workload-specific optimization
- **Migration strategies** - Zero-downtime migrations, schema versioning, data transformation pipelines

### Performance Optimization
- **Query optimization** - Index strategies, execution plans, query rewriting, performance profiling
- **Caching layers** - Redis patterns, application caching, database query caching, CDN integration
- **Connection pooling** - Pool sizing, connection lifecycle, failover strategies, monitoring
- **Storage optimization** - Partitioning strategies, compression algorithms, archival patterns

### Modern Database Technologies
- **Vector databases** - Embedding storage, similarity search, AI/ML integration, RAG implementations
- **Time-series databases** - InfluxDB, TimescaleDB optimization, retention policies, aggregation strategies
- **Graph databases** - Neo4j, relationship modeling, traversal optimization, social network patterns
- **Document databases** - MongoDB optimization, aggregation pipelines, indexing strategies

### Monitoring & Observability
- **Performance monitoring** - Query analysis, slow query detection, resource utilization tracking
- **Health checks** - Replication lag monitoring, connection health, automated failover
- **Alerting systems** - Threshold-based alerts, anomaly detection, escalation procedures
- **Capacity planning** - Growth modeling, resource forecasting, scaling strategies

## Modern Database Platform Implementation

### Comprehensive Database Management Platform
```typescript
// Advanced database platform with optimization, caching, and monitoring
import { Pool, PoolClient, QueryResult } from 'pg';
import { MongoClient, Db, Collection } from 'mongodb';
import { Redis } from 'ioredis';
import { Client as ClickHouseClient } from '@clickhouse/client';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { VectorStore } from '@pinecone-database/pinecone';
import { Connection, createConnection, Repository, EntityManager } from 'typeorm';
import { Prisma, PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { EventEmitter } from 'events';
import { Histogram, Counter, Gauge, Registry } from 'prom-client';
import Bull from 'bull';
import cron from 'node-cron';
import { performance } from 'perf_hooks';

// Types and interfaces
interface DatabaseConfig {
  primary: DatabaseConnection;
  replicas: DatabaseConnection[];
  cache: CacheConfig;
  monitoring: MonitoringConfig;
  optimization: OptimizationConfig;
  security: SecurityConfig;
}

interface DatabaseConnection {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'clickhouse' | 'elasticsearch' | 'vector';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolConfig: PoolConfig;
  options: Record<string, any>;
}

interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
}

interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'ttl' | 'fifo';
  redis: RedisConfig;
  layers: CacheLayer[];
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  cluster?: ClusterConfig;
}

interface ClusterConfig {
  nodes: RedisNode[];
  options: ClusterOptions;
}

interface RedisNode {
  host: string;
  port: number;
}

interface ClusterOptions {
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
}

interface CacheLayer {
  name: string;
  type: 'memory' | 'redis' | 'database';
  ttl: number;
  maxSize?: number;
  evictionPolicy: string;
}

interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricConfig[];
  alerting: AlertConfig;
  logging: LogConfig;
  healthChecks: HealthCheckConfig[];
}

interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  labels: string[];
}

interface AlertConfig {
  enabled: boolean;
  rules: AlertRule[];
  channels: NotificationChannel[];
}

interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
}

interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  retention: string;
  destinations: LogDestination[];
}

interface LogDestination {
  type: 'file' | 'console' | 'elasticsearch';
  config: Record<string, any>;
}

interface HealthCheckConfig {
  name: string;
  type: 'connection' | 'query' | 'replication' | 'custom';
  interval: number;
  timeout: number;
  query?: string;
}

interface OptimizationConfig {
  indexing: IndexConfig;
  partitioning: PartitionConfig;
  compression: CompressionConfig;
  archival: ArchivalConfig;
}

interface IndexConfig {
  autoCreate: boolean;
  strategies: IndexStrategy[];
  monitoring: boolean;
}

interface IndexStrategy {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  condition?: string;
  fillFactor?: number;
}

interface PartitionConfig {
  enabled: boolean;
  strategies: PartitionStrategy[];
}

interface PartitionStrategy {
  table: string;
  type: 'range' | 'list' | 'hash';
  column: string;
  interval?: string;
  values?: any[];
}

interface CompressionConfig {
  enabled: boolean;
  algorithm: 'gzip' | 'lz4' | 'zstd';
  level: number;
  tables: string[];
}

interface ArchivalConfig {
  enabled: boolean;
  rules: ArchivalRule[];
  storage: ArchivalStorage;
}

interface ArchivalRule {
  table: string;
  condition: string;
  retentionPeriod: string;
  compressionEnabled: boolean;
}

interface ArchivalStorage {
  type: 's3' | 'gcs' | 'local';
  config: Record<string, any>;
}

interface SecurityConfig {
  encryption: EncryptionConfig;
  authentication: AuthConfig;
  auditing: AuditConfig;
  compliance: ComplianceConfig;
}

interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  keyRotation: boolean;
  algorithm: string;
}

interface AuthConfig {
  method: 'password' | 'certificate' | 'oauth' | 'ldap';
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAge: number;
}

interface AuditConfig {
  enabled: boolean;
  events: string[];
  retention: string;
  storage: string;
}

interface ComplianceConfig {
  standards: string[];
  dataClassification: DataClassification[];
  retention: RetentionPolicy[];
}

interface DataClassification {
  name: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  handling: string[];
}

interface RetentionPolicy {
  dataType: string;
  retentionPeriod: string;
  deletionMethod: 'hard' | 'soft' | 'archive';
}

interface QueryContext {
  userId?: string;
  sessionId: string;
  requestId: string;
  startTime: number;
  timeout: number;
  readPreference?: 'primary' | 'secondary' | 'nearest';
}

interface QueryResult<T = any> {
  data: T;
  metadata: QueryMetadata;
  fromCache: boolean;
  executionTime: number;
}

interface QueryMetadata {
  rowCount: number;
  columnCount?: number;
  executionPlan?: any;
  indexesUsed: string[];
  warnings: string[];
}

// Core Database Platform
class DatabasePlatform extends EventEmitter {
  private config: DatabaseConfig;
  private connections: Map<string, any> = new Map();
  private pools: Map<string, Pool> = new Map();
  private cache: Redis;
  private logger: Logger;
  private registry: Registry;
  private metrics: {
    queryDuration: Histogram;
    connectionCount: Gauge;
    cacheHitRate: Counter;
    errorRate: Counter;
  };
  private queryQueue: Bull.Queue;
  private healthStatus: Map<string, boolean> = new Map();

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;

    this.setupLogger();
    this.setupMetrics();
    this.setupCache();
    this.setupQueryQueue();
  }

  private setupLogger(): void {
    this.logger = createLogger({
      level: this.config.monitoring.logging.level,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        this.config.monitoring.logging.format === 'json' ? format.json() : format.simple()
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'database-platform.log' })
      ]
    });
  }

  private setupMetrics(): void {
    this.registry = new Registry();

    this.metrics = {
      queryDuration: new Histogram({
        name: 'db_query_duration_seconds',
        help: 'Database query execution time',
        labelNames: ['database', 'operation', 'table'],
        buckets: [0.001, 0.01, 0.1, 1, 5, 10],
        registers: [this.registry],
      }),
      connectionCount: new Gauge({
        name: 'db_connections_active',
        help: 'Active database connections',
        labelNames: ['database', 'type'],
        registers: [this.registry],
      }),
      cacheHitRate: new Counter({
        name: 'db_cache_hits_total',
        help: 'Cache hit/miss counter',
        labelNames: ['cache_layer', 'result'],
        registers: [this.registry],
      }),
      errorRate: new Counter({
        name: 'db_errors_total',
        help: 'Database errors counter',
        labelNames: ['database', 'error_type'],
        registers: [this.registry],
      }),
    };
  }

  private setupCache(): void {
    if (this.config.cache.enabled) {
      if (this.config.cache.redis.cluster) {
        this.cache = new Redis.Cluster(
          this.config.cache.redis.cluster.nodes,
          this.config.cache.redis.cluster.options
        );
      } else {
        this.cache = new Redis({
          host: this.config.cache.redis.host,
          port: this.config.cache.redis.port,
          password: this.config.cache.redis.password,
          db: this.config.cache.redis.db,
          keyPrefix: this.config.cache.redis.keyPrefix,
        });
      }
    }
  }

  private setupQueryQueue(): void {
    this.queryQueue = new Bull('database queries', {
      redis: {
        host: this.config.cache.redis.host,
        port: this.config.cache.redis.port,
        password: this.config.cache.redis.password,
      },
    });

    this.queryQueue.process('heavy-query', 5, this.processHeavyQuery.bind(this));
    this.queryQueue.process('batch-operation', 3, this.processBatchOperation.bind(this));
  }

  async initialize(): Promise<void> {
    try {
      // Initialize primary database connection
      await this.initializeConnection('primary', this.config.primary);

      // Initialize replica connections
      for (let i = 0; i < this.config.replicas.length; i++) {
        await this.initializeConnection(`replica-${i}`, this.config.replicas[i]);
      }

      // Start health checks
      this.startHealthChecks();

      // Setup optimization jobs
      this.setupOptimizationJobs();

      // Initialize monitoring
      this.initializeMonitoring();

      this.logger.info('Database platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database platform', { error });
      throw error;
    }
  }

  private async initializeConnection(name: string, config: DatabaseConnection): Promise<void> {
    try {
      switch (config.type) {
        case 'postgresql':
          await this.initializePostgreSQL(name, config);
          break;
        case 'mongodb':
          await this.initializeMongoDB(name, config);
          break;
        case 'redis':
          await this.initializeRedis(name, config);
          break;
        case 'clickhouse':
          await this.initializeClickHouse(name, config);
          break;
        case 'elasticsearch':
          await this.initializeElasticsearch(name, config);
          break;
        case 'vector':
          await this.initializeVectorDatabase(name, config);
          break;
        default:
          throw new Error(`Unsupported database type: ${config.type}`);
      }

      this.healthStatus.set(name, true);
      this.logger.info(`${name} database connection initialized`, { type: config.type });
    } catch (error) {
      this.healthStatus.set(name, false);
      this.logger.error(`Failed to initialize ${name} database`, { error });
      throw error;
    }
  }

  private async initializePostgreSQL(name: string, config: DatabaseConnection): Promise<void> {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl,
      min: config.poolConfig.min,
      max: config.poolConfig.max,
      acquireTimeoutMillis: config.poolConfig.acquireTimeoutMillis,
      idleTimeoutMillis: config.poolConfig.idleTimeoutMillis,
      createTimeoutMillis: config.poolConfig.createTimeoutMillis,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    this.pools.set(name, pool);
    this.connections.set(name, { type: 'postgresql', pool, config });

    // Setup connection monitoring
    pool.on('connect', () => {
      this.metrics.connectionCount.labels(name, 'active').inc();
    });

    pool.on('remove', () => {
      this.metrics.connectionCount.labels(name, 'active').dec();
    });

    pool.on('error', (error) => {
      this.logger.error(`PostgreSQL pool error for ${name}`, { error });
      this.metrics.errorRate.labels(name, 'pool_error').inc();
    });
  }

  private async initializeMongoDB(name: string, config: DatabaseConnection): Promise<void> {
    const client = new MongoClient(`mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`, {
      ssl: config.ssl,
      minPoolSize: config.poolConfig.min,
      maxPoolSize: config.poolConfig.max,
      connectTimeoutMS: config.poolConfig.createTimeoutMillis,
      socketTimeoutMS: config.poolConfig.acquireTimeoutMillis,
      ...config.options,
    });

    await client.connect();
    const db = client.db(config.database);

    // Test connection
    await db.admin().ping();

    this.connections.set(name, { type: 'mongodb', client, db, config });
  }

  private async initializeRedis(name: string, config: DatabaseConnection): Promise<void> {
    const redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: parseInt(config.database),
    });

    // Test connection
    await redis.ping();

    this.connections.set(name, { type: 'redis', client: redis, config });
  }

  private async initializeClickHouse(name: string, config: DatabaseConnection): Promise<void> {
    const client = ClickHouseClient.create({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
    });

    // Test connection
    await client.query({ query: 'SELECT 1' });

    this.connections.set(name, { type: 'clickhouse', client, config });
  }

  private async initializeElasticsearch(name: string, config: DatabaseConnection): Promise<void> {
    const client = new ElasticsearchClient({
      node: `${config.ssl ? 'https' : 'http'}://${config.host}:${config.port}`,
      auth: {
        username: config.username,
        password: config.password,
      },
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    });

    // Test connection
    await client.ping();

    this.connections.set(name, { type: 'elasticsearch', client, config });
  }

  private async initializeVectorDatabase(name: string, config: DatabaseConnection): Promise<void> {
    // Initialize Pinecone or similar vector database
    const client = new VectorStore({
      apiKey: config.password,
      environment: config.options?.environment || 'us-west1-gcp',
      indexName: config.database,
    });

    this.connections.set(name, { type: 'vector', client, config });
  }

  // Query Execution and Optimization
  async query<T = any>(
    sql: string,
    params: any[] = [],
    options: Partial<QueryContext> = {}
  ): Promise<QueryResult<T>> {
    const context: QueryContext = {
      sessionId: options.sessionId || 'default',
      requestId: options.requestId || this.generateRequestId(),
      startTime: performance.now(),
      timeout: options.timeout || 30000,
      readPreference: options.readPreference || 'primary',
      ...options,
    };

    // Check cache first
    const cacheKey = this.generateCacheKey(sql, params);
    if (this.config.cache.enabled) {
      const cachedResult = await this.getFromCache(cacheKey);
      if (cachedResult) {
        this.metrics.cacheHitRate.labels('query', 'hit').inc();
        return cachedResult;
      }
      this.metrics.cacheHitRate.labels('query', 'miss').inc();
    }

    // Determine connection based on read preference
    const connectionName = this.selectConnection(context.readPreference);
    const connection = this.connections.get(connectionName);

    if (!connection) {
      throw new Error(`No available connection for preference: ${context.readPreference}`);
    }

    const startTime = performance.now();

    try {
      let result: QueryResult<T>;

      switch (connection.type) {
        case 'postgresql':
          result = await this.executePostgreSQLQuery(connection, sql, params, context);
          break;
        case 'mongodb':
          result = await this.executeMongoDBQuery(connection, sql, params, context);
          break;
        default:
          throw new Error(`Unsupported connection type: ${connection.type}`);
      }

      const executionTime = performance.now() - startTime;
      result.executionTime = executionTime;

      // Record metrics
      this.metrics.queryDuration
        .labels(connectionName, this.extractOperation(sql), this.extractTable(sql))
        .observe(executionTime / 1000);

      // Cache result if enabled and appropriate
      if (this.config.cache.enabled && this.shouldCacheQuery(sql)) {
        await this.setCache(cacheKey, result);
      }

      // Log slow queries
      if (executionTime > 1000) {
        this.logger.warn('Slow query detected', {
          sql: sql.substring(0, 100),
          executionTime,
          connectionName,
          requestId: context.requestId,
        });
      }

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;

      this.metrics.errorRate.labels(connectionName, 'query_error').inc();

      this.logger.error('Query execution failed', {
        sql: sql.substring(0, 100),
        error: error.message,
        executionTime,
        connectionName,
        requestId: context.requestId,
      });

      throw error;
    }
  }

  private async executePostgreSQLQuery<T>(
    connection: any,
    sql: string,
    params: any[],
    context: QueryContext
  ): Promise<QueryResult<T>> {
    const client = await connection.pool.connect();

    try {
      // Enable query timing
      await client.query('SET log_statement_stats = on');

      const startTime = performance.now();
      const result = await client.query(sql, params);
      const executionTime = performance.now() - startTime;

      // Get execution plan for analysis
      let executionPlan = null;
      if (sql.trim().toLowerCase().startsWith('select')) {
        try {
          const planResult = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, params);
          executionPlan = planResult.rows[0]['QUERY PLAN'];
        } catch {
          // Ignore execution plan errors
        }
      }

      return {
        data: result.rows,
        metadata: {
          rowCount: result.rowCount,
          columnCount: result.fields?.length,
          executionPlan,
          indexesUsed: this.extractIndexesFromPlan(executionPlan),
          warnings: [],
        },
        fromCache: false,
        executionTime,
      };
    } finally {
      client.release();
    }
  }

  private async executeMongoDBQuery<T>(
    connection: any,
    operation: string,
    params: any[],
    context: QueryContext
  ): Promise<QueryResult<T>> {
    // Parse MongoDB operation (simplified)
    const [collection, method, ...args] = params;
    const coll = connection.db.collection(collection);

    const startTime = performance.now();
    let result: any;

    switch (method) {
      case 'find':
        result = await coll.find(args[0] || {}).toArray();
        break;
      case 'findOne':
        result = await coll.findOne(args[0] || {});
        break;
      case 'insertOne':
        result = await coll.insertOne(args[0]);
        break;
      case 'insertMany':
        result = await coll.insertMany(args[0]);
        break;
      case 'updateOne':
        result = await coll.updateOne(args[0], args[1]);
        break;
      case 'updateMany':
        result = await coll.updateMany(args[0], args[1]);
        break;
      case 'deleteOne':
        result = await coll.deleteOne(args[0]);
        break;
      case 'deleteMany':
        result = await coll.deleteMany(args[0]);
        break;
      case 'aggregate':
        result = await coll.aggregate(args[0]).toArray();
        break;
      default:
        throw new Error(`Unsupported MongoDB operation: ${method}`);
    }

    const executionTime = performance.now() - startTime;

    return {
      data: result,
      metadata: {
        rowCount: Array.isArray(result) ? result.length : 1,
        indexesUsed: [],
        warnings: [],
      },
      fromCache: false,
      executionTime,
    };
  }

  // Advanced Caching System
  private async getFromCache(key: string): Promise<any> {
    try {
      for (const layer of this.config.cache.layers) {
        const result = await this.getFromCacheLayer(layer, key);
        if (result) {
          return result;
        }
      }
      return null;
    } catch (error) {
      this.logger.warn('Cache read error', { key, error: error.message });
      return null;
    }
  }

  private async getFromCacheLayer(layer: CacheLayer, key: string): Promise<any> {
    const layerKey = `${layer.name}:${key}`;

    switch (layer.type) {
      case 'redis':
        const value = await this.cache.get(layerKey);
        return value ? JSON.parse(value) : null;
      case 'memory':
        // Implement in-memory cache
        return null;
      case 'database':
        // Implement database-backed cache
        return null;
      default:
        return null;
    }
  }

  private async setCache(key: string, value: any): Promise<void> {
    try {
      for (const layer of this.config.cache.layers) {
        await this.setCacheLayer(layer, key, value);
      }
    } catch (error) {
      this.logger.warn('Cache write error', { key, error: error.message });
    }
  }

  private async setCacheLayer(layer: CacheLayer, key: string, value: any): Promise<void> {
    const layerKey = `${layer.name}:${key}`;

    switch (layer.type) {
      case 'redis':
        await this.cache.setex(layerKey, layer.ttl, JSON.stringify(value));
        break;
      case 'memory':
        // Implement in-memory cache
        break;
      case 'database':
        // Implement database-backed cache
        break;
    }
  }

  // Connection Management
  private selectConnection(readPreference: string): string {
    switch (readPreference) {
      case 'primary':
        return 'primary';
      case 'secondary':
      case 'nearest':
        // Select healthy replica
        const replicas = Array.from(this.healthStatus.entries())
          .filter(([name, healthy]) => name.startsWith('replica-') && healthy)
          .map(([name]) => name);

        if (replicas.length === 0) {
          this.logger.warn('No healthy replicas available, falling back to primary');
          return 'primary';
        }

        // Simple round-robin selection
        const index = Math.floor(Math.random() * replicas.length);
        return replicas[index];
      default:
        return 'primary';
    }
  }

  // Database Optimization
  async optimizeQuery(sql: string): Promise<string> {
    // Analyze query and suggest optimizations
    const analysis = await this.analyzeQuery(sql);

    if (analysis.missingIndexes.length > 0) {
      this.logger.info('Suggested indexes for query optimization', {
        sql: sql.substring(0, 100),
        suggestedIndexes: analysis.missingIndexes,
      });
    }

    if (analysis.suggestions.length > 0) {
      this.logger.info('Query optimization suggestions', {
        sql: sql.substring(0, 100),
        suggestions: analysis.suggestions,
      });
    }

    return analysis.optimizedQuery || sql;
  }

  private async analyzeQuery(sql: string): Promise<any> {
    // Simplified query analysis
    const analysis = {
      missingIndexes: [],
      suggestions: [],
      optimizedQuery: sql,
    };

    // Check for missing WHERE clause indexes
    const whereMatches = sql.match(/WHERE\s+(\w+)\s*=/gi);
    if (whereMatches) {
      analysis.missingIndexes.push(...whereMatches.map(match => match.split(/\s+/)[1]));
    }

    // Check for N+1 query patterns
    if (sql.includes('IN (')) {
      analysis.suggestions.push('Consider using JOIN instead of IN subquery for better performance');
    }

    // Check for SELECT *
    if (sql.includes('SELECT *')) {
      analysis.suggestions.push('Avoid SELECT * - specify only needed columns');
    }

    return analysis;
  }

  private async createIndex(table: string, columns: string[], type: string = 'btree'): Promise<void> {
    const indexName = `idx_${table}_${columns.join('_')}`;
    const sql = `CREATE INDEX CONCURRENTLY ${indexName} ON ${table} USING ${type} (${columns.join(', ')})`;

    try {
      await this.query(sql);
      this.logger.info('Index created successfully', { indexName, table, columns });
    } catch (error) {
      this.logger.error('Failed to create index', { indexName, error: error.message });
    }
  }

  // Performance Monitoring
  private async analyzePerformance(): Promise<any> {
    const metrics = await Promise.all([
      this.getConnectionStats(),
      this.getQueryStats(),
      this.getCacheStats(),
      this.getReplicationStats(),
    ]);

    return {
      timestamp: new Date(),
      connections: metrics[0],
      queries: metrics[1],
      cache: metrics[2],
      replication: metrics[3],
      recommendations: this.generateRecommendations(metrics),
    };
  }

  private async getConnectionStats(): Promise<any> {
    // Get connection statistics from all pools
    const stats = {};

    for (const [name, pool] of this.pools.entries()) {
      if (pool instanceof Pool) {
        stats[name] = {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        };
      }
    }

    return stats;
  }

  private async getQueryStats(): Promise<any> {
    // Analyze recent query performance
    const slowQueries = await this.getSlowQueries();
    const frequentQueries = await this.getFrequentQueries();

    return {
      slowQueries,
      frequentQueries,
      averageExecutionTime: this.calculateAverageExecutionTime(),
    };
  }

  private async getCacheStats(): Promise<any> {
    if (!this.config.cache.enabled) {
      return null;
    }

    const info = await this.cache.info();
    return {
      hitRate: this.calculateCacheHitRate(),
      memoryUsage: info.used_memory,
      connectedClients: info.connected_clients,
      keyCount: await this.cache.dbsize(),
    };
  }

  private async getReplicationStats(): Promise<any> {
    const stats = {};

    for (const [name, connection] of this.connections.entries()) {
      if (connection.type === 'postgresql' && name.startsWith('replica-')) {
        try {
          const result = await this.query(
            'SELECT * FROM pg_stat_replication',
            [],
            { readPreference: 'primary' }
          );
          stats[name] = result.data;
        } catch (error) {
          stats[name] = { error: error.message };
        }
      }
    }

    return stats;
  }

  // Migration Management
  async executeMigration(migration: DatabaseMigration): Promise<void> {
    const migrationContext = {
      sessionId: 'migration',
      requestId: this.generateRequestId(),
      startTime: performance.now(),
      timeout: 300000, // 5 minutes
    };

    this.logger.info('Starting migration', { migration: migration.name });

    try {
      // Create migration log entry
      await this.logMigrationStart(migration);

      // Execute pre-migration checks
      await this.executeMigrationChecks(migration.preChecks);

      // Execute migration steps
      for (const step of migration.steps) {
        await this.executeMigrationStep(step, migrationContext);
      }

      // Execute post-migration validation
      await this.executeMigrationValidation(migration.validation);

      // Mark migration as completed
      await this.logMigrationCompletion(migration);

      this.logger.info('Migration completed successfully', { migration: migration.name });
    } catch (error) {
      await this.logMigrationError(migration, error);
      this.logger.error('Migration failed', { migration: migration.name, error });

      // Execute rollback if provided
      if (migration.rollback) {
        await this.executeMigrationRollback(migration.rollback);
      }

      throw error;
    }
  }

  private async executeMigrationStep(step: MigrationStep, context: QueryContext): Promise<void> {
    switch (step.type) {
      case 'sql':
        await this.query(step.sql, step.params || [], context);
        break;
      case 'script':
        await this.executeScript(step.script, context);
        break;
      case 'data':
        await this.executeDataMigration(step.operation, context);
        break;
      default:
        throw new Error(`Unsupported migration step type: ${step.type}`);
    }
  }

  // Health Monitoring
  private startHealthChecks(): void {
    for (const check of this.config.monitoring.healthChecks) {
      this.scheduleHealthCheck(check);
    }

    // Overall platform health check
    setInterval(() => {
      this.performPlatformHealthCheck();
    }, 30000); // Every 30 seconds
  }

  private scheduleHealthCheck(check: HealthCheckConfig): void {
    setInterval(async () => {
      try {
        const healthy = await this.performHealthCheck(check);
        this.updateHealthStatus(check.name, healthy);
      } catch (error) {
        this.updateHealthStatus(check.name, false);
        this.logger.error('Health check failed', { check: check.name, error });
      }
    }, check.interval);
  }

  private async performHealthCheck(check: HealthCheckConfig): Promise<boolean> {
    switch (check.type) {
      case 'connection':
        return await this.checkConnectionHealth(check.name);
      case 'query':
        return await this.checkQueryHealth(check.query!);
      case 'replication':
        return await this.checkReplicationHealth();
      default:
        return true;
    }
  }

  private async checkConnectionHealth(connectionName: string): Promise<boolean> {
    const connection = this.connections.get(connectionName);
    if (!connection) return false;

    try {
      switch (connection.type) {
        case 'postgresql':
          const client = await connection.pool.connect();
          await client.query('SELECT 1');
          client.release();
          return true;
        case 'mongodb':
          await connection.db.admin().ping();
          return true;
        case 'redis':
          await connection.client.ping();
          return true;
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  // Backup and Recovery
  async createBackup(options: BackupOptions): Promise<BackupResult> {
    const backupId = this.generateBackupId();
    const startTime = Date.now();

    this.logger.info('Starting backup', { backupId, options });

    try {
      const result: BackupResult = {
        id: backupId,
        startTime: new Date(startTime),
        endTime: null,
        size: 0,
        location: '',
        metadata: {},
        success: false,
      };

      // Create backup based on database type
      for (const [name, connection] of this.connections.entries()) {
        if (options.databases?.includes(name) || !options.databases) {
          const backupData = await this.backupDatabase(connection, options);
          result.metadata[name] = backupData;
          result.size += backupData.size;
        }
      }

      result.endTime = new Date();
      result.success = true;
      result.location = await this.storeBackup(result, options.storage);

      this.logger.info('Backup completed successfully', { backupId, size: result.size });
      return result;
    } catch (error) {
      this.logger.error('Backup failed', { backupId, error });
      throw error;
    }
  }

  private async backupDatabase(connection: any, options: BackupOptions): Promise<any> {
    switch (connection.type) {
      case 'postgresql':
        return await this.backupPostgreSQL(connection, options);
      case 'mongodb':
        return await this.backupMongoDB(connection, options);
      default:
        throw new Error(`Backup not supported for ${connection.type}`);
    }
  }

  // Utility Methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(sql: string, params: any[]): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(sql + JSON.stringify(params))
      .digest('hex');
    return hash.substring(0, 32);
  }

  private shouldCacheQuery(sql: string): boolean {
    const normalizedSql = sql.trim().toLowerCase();
    return (
      normalizedSql.startsWith('select') &&
      !normalizedSql.includes('now()') &&
      !normalizedSql.includes('current_timestamp') &&
      !normalizedSql.includes('random()')
    );
  }

  private extractOperation(sql: string): string {
    return sql.trim().split(/\s+/)[0].toLowerCase();
  }

  private extractTable(sql: string): string {
    const match = sql.match(/(?:from|into|update|join)\s+([^\s;,]+)/i);
    return match ? match[1] : 'unknown';
  }

  private extractIndexesFromPlan(plan: any): string[] {
    // Extract index names from execution plan
    if (!plan) return [];

    const indexes: string[] = [];
    const extractFromNode = (node: any) => {
      if (node['Index Name']) {
        indexes.push(node['Index Name']);
      }
      if (node.Plans) {
        node.Plans.forEach(extractFromNode);
      }
    };

    if (plan.Plan) {
      extractFromNode(plan.Plan);
    }

    return indexes;
  }

  // Additional utility and helper methods
  private async processHeavyQuery(job: any): Promise<any> {
    const { sql, params, context } = job.data;
    return await this.query(sql, params, context);
  }

  private async processBatchOperation(job: any): Promise<any> {
    const { operations } = job.data;
    const results = [];

    for (const operation of operations) {
      const result = await this.query(operation.sql, operation.params);
      results.push(result);
    }

    return results;
  }

  private setupOptimizationJobs(): void {
    // Daily optimization tasks
    cron.schedule('0 2 * * *', async () => {
      await this.performDailyOptimization();
    });

    // Weekly analysis
    cron.schedule('0 3 * * 0', async () => {
      await this.performWeeklyAnalysis();
    });
  }

  private initializeMonitoring(): void {
    if (this.config.monitoring.enabled) {
      // Set up metric collection
      setInterval(() => {
        this.collectMetrics();
      }, 10000); // Every 10 seconds
    }
  }

  private async performDailyOptimization(): Promise<void> {
    this.logger.info('Starting daily optimization tasks');

    try {
      // Update table statistics
      await this.updateTableStatistics();

      // Analyze index usage
      await this.analyzeIndexUsage();

      // Clean up old cache entries
      await this.cleanupCache();

      // Vacuum and analyze tables
      await this.performTableMaintenance();

      this.logger.info('Daily optimization completed successfully');
    } catch (error) {
      this.logger.error('Daily optimization failed', { error });
    }
  }

  private async performWeeklyAnalysis(): Promise<void> {
    this.logger.info('Starting weekly analysis');

    try {
      const analysis = await this.analyzePerformance();

      // Generate performance report
      await this.generatePerformanceReport(analysis);

      // Check for optimization opportunities
      await this.identifyOptimizationOpportunities();

      this.logger.info('Weekly analysis completed successfully');
    } catch (error) {
      this.logger.error('Weekly analysis failed', { error });
    }
  }

  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down database platform...');

    // Close all connections
    for (const [name, connection] of this.connections.entries()) {
      try {
        switch (connection.type) {
          case 'postgresql':
            await connection.pool.end();
            break;
          case 'mongodb':
            await connection.client.close();
            break;
          case 'redis':
            connection.client.disconnect();
            break;
        }
        this.logger.info(`${name} connection closed`);
      } catch (error) {
        this.logger.error(`Failed to close ${name} connection`, { error });
      }
    }

    // Close cache connection
    if (this.cache) {
      this.cache.disconnect();
    }

    // Close query queue
    await this.queryQueue.close();

    this.logger.info('Database platform shutdown complete');
  }

  // Placeholder methods for complex operations
  private async updateTableStatistics(): Promise<void> {
    this.logger.debug('Updating table statistics...');
  }

  private async analyzeIndexUsage(): Promise<void> {
    this.logger.debug('Analyzing index usage...');
  }

  private async cleanupCache(): Promise<void> {
    this.logger.debug('Cleaning up cache...');
  }

  private async performTableMaintenance(): Promise<void> {
    this.logger.debug('Performing table maintenance...');
  }

  private async generatePerformanceReport(analysis: any): Promise<void> {
    this.logger.debug('Generating performance report...', { analysis });
  }

  private async identifyOptimizationOpportunities(): Promise<void> {
    this.logger.debug('Identifying optimization opportunities...');
  }

  private async collectMetrics(): Promise<void> {
    // Collect various platform metrics
    for (const [name, connection] of this.connections.entries()) {
      this.metrics.connectionCount.labels(name, 'total').set(1);
    }
  }

  private generateRecommendations(metrics: any[]): string[] {
    const recommendations = [];

    // Analyze metrics and generate recommendations
    // This is a simplified implementation

    return recommendations;
  }

  private calculateAverageExecutionTime(): number {
    // Calculate average from collected metrics
    return 0;
  }

  private calculateCacheHitRate(): number {
    // Calculate cache hit rate
    return 0;
  }

  private async getSlowQueries(): Promise<any[]> {
    // Return slow query analysis
    return [];
  }

  private async getFrequentQueries(): Promise<any[]> {
    // Return frequent query analysis
    return [];
  }

  private updateHealthStatus(name: string, healthy: boolean): void {
    this.healthStatus.set(name, healthy);

    if (!healthy) {
      this.emit('health-status-changed', { name, healthy });
    }
  }

  private async checkQueryHealth(query: string): Promise<boolean> {
    try {
      await this.query(query, [], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private async checkReplicationHealth(): Promise<boolean> {
    // Check replication lag and status
    return true;
  }

  private async performPlatformHealthCheck(): Promise<void> {
    const overallHealth = Array.from(this.healthStatus.values()).every(status => status);

    if (!overallHealth) {
      this.logger.warn('Platform health degraded');
      this.emit('platform-health-degraded');
    }
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeBackup(result: BackupResult, storage: any): Promise<string> {
    // Store backup to configured storage
    return 'backup-location';
  }

  private async backupPostgreSQL(connection: any, options: BackupOptions): Promise<any> {
    // Implement PostgreSQL backup logic
    return { size: 0 };
  }

  private async backupMongoDB(connection: any, options: BackupOptions): Promise<any> {
    // Implement MongoDB backup logic
    return { size: 0 };
  }

  private async logMigrationStart(migration: DatabaseMigration): Promise<void> {
    this.logger.info('Migration started', { migration: migration.name });
  }

  private async logMigrationCompletion(migration: DatabaseMigration): Promise<void> {
    this.logger.info('Migration completed', { migration: migration.name });
  }

  private async logMigrationError(migration: DatabaseMigration, error: Error): Promise<void> {
    this.logger.error('Migration error', { migration: migration.name, error });
  }

  private async executeMigrationChecks(checks: any[]): Promise<void> {
    // Execute pre-migration checks
  }

  private async executeMigrationValidation(validation: any[]): Promise<void> {
    // Execute post-migration validation
  }

  private async executeMigrationRollback(rollback: any): Promise<void> {
    // Execute migration rollback
  }

  private async executeScript(script: string, context: QueryContext): Promise<void> {
    // Execute custom script
  }

  private async executeDataMigration(operation: any, context: QueryContext): Promise<void> {
    // Execute data migration operation
  }
}

// Supporting interfaces
interface DatabaseMigration {
  name: string;
  version: string;
  description: string;
  preChecks: any[];
  steps: MigrationStep[];
  validation: any[];
  rollback?: any;
}

interface MigrationStep {
  type: 'sql' | 'script' | 'data';
  sql?: string;
  params?: any[];
  script?: string;
  operation?: any;
}

interface BackupOptions {
  databases?: string[];
  compression: boolean;
  storage: any;
}

interface BackupResult {
  id: string;
  startTime: Date;
  endTime: Date | null;
  size: number;
  location: string;
  metadata: Record<string, any>;
  success: boolean;
}

// Example usage
export async function createDatabasePlatformExample(): Promise<void> {
  const config: DatabaseConfig = {
    primary: {
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'app_primary',
      username: 'app_user',
      password: 'secure_password',
      ssl: true,
      poolConfig: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 300000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
      },
      options: {},
    },
    replicas: [
      {
        type: 'postgresql',
        host: 'replica1.example.com',
        port: 5432,
        database: 'app_primary',
        username: 'app_user',
        password: 'secure_password',
        ssl: true,
        poolConfig: {
          min: 1,
          max: 10,
          acquireTimeoutMillis: 30000,
          idleTimeoutMillis: 300000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
        },
        options: {},
      },
    ],
    cache: {
      enabled: true,
      ttl: 300,
      maxSize: 1000,
      strategy: 'lru',
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'dbcache:',
      },
      layers: [
        {
          name: 'l1',
          type: 'memory',
          ttl: 60,
          maxSize: 100,
          evictionPolicy: 'lru',
        },
        {
          name: 'l2',
          type: 'redis',
          ttl: 300,
          evictionPolicy: 'lru',
        },
      ],
    },
    monitoring: {
      enabled: true,
      metrics: [
        {
          name: 'db_queries_total',
          type: 'counter',
          description: 'Total database queries',
          labels: ['database', 'operation'],
        },
      ],
      alerting: {
        enabled: true,
        rules: [
          {
            name: 'high_query_latency',
            condition: 'avg_query_duration > threshold',
            threshold: 1000,
            duration: '5m',
            severity: 'high',
          },
        ],
        channels: [
          {
            type: 'slack',
            config: { webhook: 'https://hooks.slack.com/...' },
          },
        ],
      },
      logging: {
        level: 'info',
        format: 'json',
        retention: '30d',
        destinations: [
          { type: 'file', config: { filename: 'database.log' } },
          { type: 'elasticsearch', config: { host: 'localhost:9200' } },
        ],
      },
      healthChecks: [
        {
          name: 'primary_connection',
          type: 'connection',
          interval: 30000,
          timeout: 5000,
        },
        {
          name: 'replication_status',
          type: 'replication',
          interval: 60000,
          timeout: 10000,
        },
      ],
    },
    optimization: {
      indexing: {
        autoCreate: true,
        strategies: [
          {
            table: 'users',
            columns: ['email'],
            type: 'btree',
          },
        ],
        monitoring: true,
      },
      partitioning: {
        enabled: true,
        strategies: [
          {
            table: 'events',
            type: 'range',
            column: 'created_at',
            interval: '1 month',
          },
        ],
      },
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6,
        tables: ['logs', 'events'],
      },
      archival: {
        enabled: true,
        rules: [
          {
            table: 'logs',
            condition: "created_at < NOW() - INTERVAL '1 year'",
            retentionPeriod: '7 years',
            compressionEnabled: true,
          },
        ],
        storage: {
          type: 's3',
          config: {
            bucket: 'database-archives',
            region: 'us-west-2',
          },
        },
      },
    },
    security: {
      encryption: {
        atRest: true,
        inTransit: true,
        keyRotation: true,
        algorithm: 'AES-256',
      },
      authentication: {
        method: 'password',
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: true,
          maxAge: 90,
        },
        sessionTimeout: 3600,
      },
      auditing: {
        enabled: true,
        events: ['login', 'query', 'schema_change'],
        retention: '7 years',
        storage: 'elasticsearch',
      },
      compliance: {
        standards: ['SOC2', 'GDPR', 'HIPAA'],
        dataClassification: [
          {
            name: 'PII',
            sensitivity: 'confidential',
            handling: ['encrypt', 'audit', 'mask'],
          },
        ],
        retention: [
          {
            dataType: 'PII',
            retentionPeriod: '7 years',
            deletionMethod: 'hard',
          },
        ],
      },
    },
  };

  const platform = new DatabasePlatform(config);
  await platform.initialize();

  console.log('Database platform with advanced optimization and monitoring running');
}

export { DatabasePlatform, DatabaseConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Database architecture and design is needed
- Performance optimization and tuning is required
- Distributed database implementation is requested
- Caching strategies and optimization is needed
- Database monitoring and observability is required
- Schema design and migration planning is requested

This comprehensive database design and optimization skill provides expert-level capabilities for building modern, scalable database platforms with advanced optimization, caching, monitoring, and enterprise-grade reliability features.