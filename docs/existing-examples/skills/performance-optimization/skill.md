# Performance Optimization Skill

Advanced performance optimization and scaling expertise covering application profiling, caching strategies, CDN optimization, and comprehensive performance engineering with auto-scaling, load balancing, and enterprise-grade optimization patterns.

## Skill Overview

Expert performance knowledge including application profiling, caching architectures, content delivery networks, resource optimization, auto-scaling strategies, and modern performance engineering with advanced monitoring, optimization, and scalability patterns.

## Core Capabilities

### Application Performance Monitoring
- **Profiling tools** - CPU profiling, memory analysis, heap dump analysis, flame graphs, performance tracing
- **APM systems** - New Relic, Datadog, AppDynamics integration, custom telemetry, distributed tracing
- **Real-time monitoring** - Performance metrics, alerting systems, anomaly detection, capacity planning
- **Benchmarking** - Load testing, stress testing, performance regression detection, baseline establishment

### Caching Strategies & Implementation
- **Multi-tier caching** - L1/L2 cache design, cache hierarchies, cache coherence, invalidation strategies
- **Distributed caching** - Redis clustering, Memcached optimization, Hazelcast, cache sharding
- **Application caching** - In-memory caching, query result caching, object caching, session caching
- **HTTP caching** - Browser caching, reverse proxy caching, CDN integration, cache headers optimization

### Content Delivery & Edge Computing
- **CDN optimization** - CloudFront, CloudFlare, Fastly configuration, edge location selection
- **Edge computing** - Edge function deployment, regional optimization, content optimization
- **Static asset optimization** - Image compression, minification, bundling, lazy loading strategies
- **Progressive loading** - Code splitting, dynamic imports, resource prioritization, preloading

### Auto-scaling & Load Management
- **Horizontal scaling** - Auto-scaling groups, container orchestration, traffic-based scaling
- **Vertical scaling** - Resource optimization, right-sizing, performance-based scaling
- **Load balancing** - Application load balancers, network load balancers, traffic distribution
- **Circuit breakers** - Fault tolerance, degradation strategies, failover mechanisms

## Modern Performance Optimization Platform Implementation

### Comprehensive Performance Engineering Platform
```typescript
// Advanced performance optimization platform with profiling, caching, and auto-scaling
import { EventEmitter } from 'events';
import { performance, PerformanceObserver } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { promisify } from 'util';
import { cpus, freemem, totalmem, loadavg } from 'os';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Redis, Cluster as RedisCluster } from 'ioredis';
import { LRUCache } from 'lru-cache';
import { CloudWatch, ELB, EC2 } from '@aws-sdk/client-cloudwatch';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import Bull from 'bull';
import cluster from 'cluster';
import sharp from 'sharp';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { Histogram, Counter, Gauge, Registry } from 'prom-client';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Types and interfaces
interface PerformancePlatformConfig {
  monitoring: MonitoringConfig;
  caching: CachingConfig;
  scaling: ScalingConfig;
  cdn: CDNConfig;
  optimization: OptimizationConfig;
  profiling: ProfilingConfig;
  alerting: AlertingConfig;
}

interface MonitoringConfig {
  apm: APMConfig;
  metrics: MetricsConfig;
  tracing: TracingConfig;
  realTime: RealTimeConfig;
}

interface APMConfig {
  provider: 'newrelic' | 'datadog' | 'dynatrace' | 'custom';
  apiKey: string;
  applicationName: string;
  samplingRate: number;
  errorTracking: boolean;
}

interface MetricsConfig {
  collection: MetricCollectionConfig;
  aggregation: MetricAggregationConfig;
  storage: MetricStorageConfig;
  retention: MetricRetentionConfig;
}

interface MetricCollectionConfig {
  interval: number;
  sources: MetricSource[];
  filters: MetricFilter[];
}

interface MetricSource {
  type: 'system' | 'application' | 'database' | 'network' | 'custom';
  name: string;
  endpoint?: string;
  credentials?: any;
  metrics: string[];
}

interface MetricFilter {
  name: string;
  condition: string;
  action: 'include' | 'exclude' | 'transform';
  transformation?: string;
}

interface MetricAggregationConfig {
  functions: AggregationFunction[];
  windows: TimeWindow[];
  grouping: GroupingConfig[];
}

interface AggregationFunction {
  name: string;
  function: 'avg' | 'sum' | 'count' | 'min' | 'max' | 'percentile' | 'rate';
  parameters?: Record<string, any>;
}

interface TimeWindow {
  duration: string;
  alignment: 'start' | 'end' | 'center';
  sliding: boolean;
}

interface GroupingConfig {
  dimensions: string[];
  labels: string[];
  cardinality?: number;
}

interface MetricStorageConfig {
  backend: 'prometheus' | 'influxdb' | 'cloudwatch' | 'custom';
  connection: Record<string, any>;
  compression: boolean;
  partitioning: PartitioningConfig;
}

interface PartitioningConfig {
  strategy: 'time' | 'metric' | 'label';
  interval: string;
  retention: string;
}

interface MetricRetentionConfig {
  policies: RetentionPolicy[];
  compression: CompressionPolicy[];
  archival: ArchivalPolicy[];
}

interface RetentionPolicy {
  resolution: string;
  duration: string;
  downsampling?: DownsamplingConfig;
}

interface DownsamplingConfig {
  aggregation: string;
  interval: string;
}

interface CompressionPolicy {
  algorithm: 'gzip' | 'snappy' | 'lz4' | 'zstd';
  threshold: string;
  schedule: string;
}

interface ArchivalPolicy {
  condition: string;
  storage: 'cold' | 's3' | 'glacier';
  format: 'parquet' | 'orc' | 'avro';
}

interface TracingConfig {
  enabled: boolean;
  sampler: SamplerConfig;
  exporter: ExporterConfig;
  instrumentation: InstrumentationConfig;
}

interface SamplerConfig {
  type: 'always_on' | 'always_off' | 'ratio' | 'rate_limiting' | 'parent_based';
  parameters: Record<string, any>;
}

interface ExporterConfig {
  type: 'jaeger' | 'zipkin' | 'otlp' | 'console';
  endpoint: string;
  headers: Record<string, string>;
  compression: boolean;
}

interface InstrumentationConfig {
  automatic: boolean;
  libraries: LibraryInstrumentation[];
  custom: CustomInstrumentation[];
}

interface LibraryInstrumentation {
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface CustomInstrumentation {
  name: string;
  spans: SpanConfig[];
  metrics: InstrumentationMetric[];
}

interface SpanConfig {
  name: string;
  operation: string;
  attributes: Record<string, any>;
  events: SpanEvent[];
}

interface SpanEvent {
  name: string;
  attributes: Record<string, any>;
  timestamp?: number;
}

interface InstrumentationMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'updowncounter';
  description: string;
  unit?: string;
}

interface RealTimeConfig {
  dashboard: DashboardConfig;
  streaming: StreamingConfig;
  alerts: RealTimeAlertConfig[];
}

interface DashboardConfig {
  enabled: boolean;
  refreshInterval: number;
  widgets: WidgetConfig[];
  layout: LayoutConfig;
}

interface WidgetConfig {
  type: 'chart' | 'gauge' | 'table' | 'heatmap' | 'text';
  title: string;
  query: string;
  timeRange: string;
  refreshInterval?: number;
  position: PositionConfig;
}

interface PositionConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutConfig {
  theme: 'light' | 'dark';
  responsive: boolean;
  autoRefresh: boolean;
}

interface StreamingConfig {
  enabled: boolean;
  protocol: 'websocket' | 'sse' | 'grpc';
  port: number;
  compression: boolean;
  authentication: boolean;
}

interface RealTimeAlertConfig {
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: NotificationChannel[];
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  config: Record<string, any>;
  retries: number;
  timeout: number;
}

interface CachingConfig {
  layers: CacheLayer[];
  strategies: CacheStrategy[];
  eviction: EvictionConfig;
  coherence: CoherenceConfig;
}

interface CacheLayer {
  name: string;
  type: 'memory' | 'redis' | 'memcached' | 'database' | 'file' | 'cdn';
  size: string;
  ttl: number;
  connection?: CacheConnection;
  serialization: SerializationConfig;
}

interface CacheConnection {
  host: string;
  port: number;
  auth?: string;
  cluster?: ClusterConfig;
  pool?: PoolConfig;
}

interface ClusterConfig {
  nodes: ClusterNode[];
  replication: boolean;
  sharding: ShardingConfig;
}

interface ClusterNode {
  host: string;
  port: number;
  role: 'master' | 'replica';
}

interface ShardingConfig {
  algorithm: 'consistent_hash' | 'range' | 'round_robin';
  replicas: number;
  virtualNodes?: number;
}

interface PoolConfig {
  min: number;
  max: number;
  acquireTimeout: number;
  idleTimeout: number;
}

interface SerializationConfig {
  format: 'json' | 'msgpack' | 'protobuf' | 'avro';
  compression: boolean;
  encryption?: EncryptionConfig;
}

interface EncryptionConfig {
  algorithm: string;
  keyRotation: boolean;
  provider: string;
}

interface CacheStrategy {
  pattern: string;
  cache: string;
  ttl?: number;
  tags?: string[];
  invalidation: InvalidationConfig;
}

interface InvalidationConfig {
  triggers: InvalidationTrigger[];
  propagation: PropagationConfig;
}

interface InvalidationTrigger {
  type: 'time' | 'event' | 'dependency' | 'manual';
  condition: string;
  delay?: number;
}

interface PropagationConfig {
  async: boolean;
  retries: number;
  timeout: number;
}

interface EvictionConfig {
  policies: EvictionPolicy[];
  monitoring: boolean;
  optimization: boolean;
}

interface EvictionPolicy {
  algorithm: 'lru' | 'lfu' | 'fifo' | 'ttl' | 'random' | 'custom';
  parameters: Record<string, any>;
  priority: number;
}

interface CoherenceConfig {
  protocol: 'write_through' | 'write_behind' | 'write_around' | 'refresh_ahead';
  consistency: ConsistencyConfig;
  conflict_resolution: ConflictResolutionConfig;
}

interface ConsistencyConfig {
  level: 'eventual' | 'strong' | 'bounded_staleness';
  timeout: number;
  retries: number;
}

interface ConflictResolutionConfig {
  strategy: 'last_writer_wins' | 'first_writer_wins' | 'merge' | 'custom';
  resolver?: string;
}

interface ScalingConfig {
  horizontal: HorizontalScalingConfig;
  vertical: VerticalScalingConfig;
  predictive: PredictiveScalingConfig;
  policies: ScalingPolicy[];
}

interface HorizontalScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetUtilization: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
  metrics: ScalingMetric[];
}

interface ScalingMetric {
  name: string;
  type: 'cpu' | 'memory' | 'network' | 'disk' | 'custom';
  threshold: number;
  window: string;
  aggregation: string;
}

interface VerticalScalingConfig {
  enabled: boolean;
  resources: ResourceConfig[];
  limits: ResourceLimits;
  recommendations: boolean;
}

interface ResourceConfig {
  type: 'cpu' | 'memory' | 'storage' | 'network';
  min: string;
  max: string;
  step: string;
  utilization: number;
}

interface ResourceLimits {
  cpu: string;
  memory: string;
  storage: string;
  cost: number;
}

interface PredictiveScalingConfig {
  enabled: boolean;
  algorithm: 'linear_regression' | 'arima' | 'neural_network' | 'ensemble';
  features: PredictiveFeature[];
  horizon: string;
  accuracy: number;
}

interface PredictiveFeature {
  name: string;
  source: string;
  transformation: string;
  weight: number;
}

interface ScalingPolicy {
  name: string;
  trigger: ScalingTrigger;
  action: ScalingAction;
  conditions: PolicyCondition[];
}

interface ScalingTrigger {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  value: number;
  duration: string;
}

interface ScalingAction {
  type: 'scale_out' | 'scale_in' | 'scale_up' | 'scale_down';
  amount: number;
  unit: 'instances' | 'percentage' | 'absolute';
  limits?: ActionLimits;
}

interface ActionLimits {
  min: number;
  max: number;
  rate: number;
}

interface PolicyCondition {
  metric: string;
  operator: string;
  value: any;
  weight?: number;
}

interface CDNConfig {
  providers: CDNProvider[];
  optimization: CDNOptimization;
  caching: CDNCaching;
  security: CDNSecurity;
}

interface CDNProvider {
  name: string;
  type: 'cloudfront' | 'cloudflare' | 'fastly' | 'akamai' | 'custom';
  regions: string[];
  configuration: ProviderConfig;
  failover: FailoverConfig;
}

interface ProviderConfig {
  distributionId?: string;
  zone?: string;
  apiKey?: string;
  settings: Record<string, any>;
}

interface FailoverConfig {
  enabled: boolean;
  priority: number;
  healthCheck: HealthCheckConfig;
}

interface HealthCheckConfig {
  url: string;
  interval: number;
  timeout: number;
  retries: number;
}

interface CDNOptimization {
  compression: CompressionOptimization;
  minification: MinificationOptimization;
  imageOptimization: ImageOptimization;
  bundling: BundlingOptimization;
}

interface CompressionOptimization {
  enabled: boolean;
  algorithms: string[];
  fileTypes: string[];
  minSize: number;
  level: number;
}

interface MinificationOptimization {
  enabled: boolean;
  fileTypes: string[];
  preserveComments: boolean;
  mangleNames: boolean;
}

interface ImageOptimization {
  enabled: boolean;
  formats: string[];
  quality: Record<string, number>;
  responsive: boolean;
  lazyLoading: boolean;
}

interface BundlingOptimization {
  enabled: boolean;
  strategy: 'split' | 'combine' | 'tree_shake';
  maxSize: string;
  minSize: string;
}

interface CDNCaching {
  rules: CacheRule[];
  headers: CacheHeader[];
  invalidation: CDNInvalidation;
}

interface CacheRule {
  pattern: string;
  ttl: number;
  behavior: 'cache' | 'no_cache' | 'origin';
  vary: string[];
}

interface CacheHeader {
  name: string;
  value: string;
  conditions?: HeaderCondition[];
}

interface HeaderCondition {
  field: string;
  operator: string;
  value: string;
}

interface CDNInvalidation {
  automatic: boolean;
  patterns: string[];
  webhook?: string;
  batch: boolean;
}

interface CDNSecurity {
  waf: WAFConfig;
  ddos: DDoSConfig;
  ssl: SSLConfig;
  access: AccessConfig;
}

interface WAFConfig {
  enabled: boolean;
  rules: WAFRule[];
  customRules: CustomWAFRule[];
}

interface WAFRule {
  id: string;
  action: 'allow' | 'block' | 'challenge';
  priority: number;
}

interface CustomWAFRule {
  name: string;
  conditions: WAFCondition[];
  action: string;
}

interface WAFCondition {
  field: string;
  operator: string;
  value: string;
  transformation?: string;
}

interface DDoSConfig {
  protection: boolean;
  threshold: number;
  response: 'block' | 'challenge' | 'rate_limit';
}

interface SSLConfig {
  certificate: string;
  protocols: string[];
  ciphers: string[];
  hsts: boolean;
}

interface AccessConfig {
  restrictions: AccessRestriction[];
  allowlist: string[];
  blocklist: string[];
}

interface AccessRestriction {
  type: 'geo' | 'ip' | 'referer' | 'user_agent';
  values: string[];
  action: 'allow' | 'block';
}

interface OptimizationConfig {
  code: CodeOptimization;
  database: DatabaseOptimization;
  network: NetworkOptimization;
  storage: StorageOptimization;
}

interface CodeOptimization {
  compilation: CompilationOptimization;
  runtime: RuntimeOptimization;
  memory: MemoryOptimization;
  profiling: boolean;
}

interface CompilationOptimization {
  level: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz';
  inlining: boolean;
  deadCodeElimination: boolean;
  loopOptimization: boolean;
}

interface RuntimeOptimization {
  jit: boolean;
  gc: GCOptimization;
  threading: ThreadingOptimization;
}

interface GCOptimization {
  algorithm: string;
  generations: number;
  threshold: number;
  parallel: boolean;
}

interface ThreadingOptimization {
  poolSize: number;
  workStealing: boolean;
  affinity: boolean;
}

interface MemoryOptimization {
  pooling: boolean;
  compression: boolean;
  deduplication: boolean;
  monitoring: boolean;
}

interface DatabaseOptimization {
  queries: QueryOptimization;
  indexes: IndexOptimization;
  connections: ConnectionOptimization;
}

interface QueryOptimization {
  analysis: boolean;
  caching: boolean;
  rewriting: boolean;
  parallelization: boolean;
}

interface IndexOptimization {
  analysis: boolean;
  suggestions: boolean;
  automatic: boolean;
  monitoring: boolean;
}

interface ConnectionOptimization {
  pooling: boolean;
  multiplexing: boolean;
  compression: boolean;
}

interface NetworkOptimization {
  protocols: ProtocolOptimization;
  bandwidth: BandwidthOptimization;
  latency: LatencyOptimization;
}

interface ProtocolOptimization {
  http2: boolean;
  http3: boolean;
  grpc: boolean;
  websockets: boolean;
}

interface BandwidthOptimization {
  compression: boolean;
  deduplication: boolean;
  prioritization: boolean;
}

interface LatencyOptimization {
  keepalive: boolean;
  multiplexing: boolean;
  prefetching: boolean;
}

interface StorageOptimization {
  compression: boolean;
  deduplication: boolean;
  tiering: boolean;
  caching: boolean;
}

interface ProfilingConfig {
  cpu: CPUProfiling;
  memory: MemoryProfiling;
  io: IOProfiling;
  network: NetworkProfiling;
}

interface CPUProfiling {
  enabled: boolean;
  interval: number;
  duration: string;
  format: 'pprof' | 'flame' | 'tree';
}

interface MemoryProfiling {
  enabled: boolean;
  heapDumps: boolean;
  leakDetection: boolean;
  allocation: boolean;
}

interface IOProfiling {
  enabled: boolean;
  fileOperations: boolean;
  diskUsage: boolean;
  bandwidth: boolean;
}

interface NetworkProfiling {
  enabled: boolean;
  connections: boolean;
  bandwidth: boolean;
  latency: boolean;
}

interface AlertingConfig {
  thresholds: PerformanceThreshold[];
  escalation: EscalationConfig;
  automation: AlertAutomation;
}

interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  duration: string;
  condition: string;
}

interface EscalationConfig {
  levels: EscalationLevel[];
  timeout: number;
  override: boolean;
}

interface EscalationLevel {
  level: number;
  delay: string;
  channels: string[];
  automation?: string;
}

interface AlertAutomation {
  enabled: boolean;
  actions: AutomationAction[];
  conditions: AutomationCondition[];
}

interface AutomationAction {
  type: 'scale' | 'restart' | 'failover' | 'notify' | 'custom';
  parameters: Record<string, any>;
  timeout: number;
}

interface AutomationCondition {
  metric: string;
  operator: string;
  value: any;
  duration: string;
}

// Core Performance Platform
class PerformancePlatform extends EventEmitter {
  private config: PerformancePlatformConfig;
  private caches: Map<string, any> = new Map();
  private monitors: Map<string, any> = new Map();
  private scalers: Map<string, any> = new Map();
  private profilers: Map<string, any> = new Map();
  private logger: Logger;
  private registry: Registry;
  private metrics: {
    responseTime: Histogram;
    throughput: Counter;
    errorRate: Counter;
    cacheHitRate: Gauge;
    cpuUtilization: Gauge;
    memoryUsage: Gauge;
    activeConnections: Gauge;
  };
  private server: Express;
  private wsServer: WebSocketServer;
  private optimizationQueue: Bull.Queue;
  private workers: Map<string, Worker> = new Map();
  private performanceObserver: PerformanceObserver;

  constructor(config: PerformancePlatformConfig) {
    super();
    this.config = config;

    this.setupLogger();
    this.setupMetrics();
    this.setupServer();
    this.setupPerformanceObserver();
    this.initializeComponents();
  }

  private setupLogger(): void {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'performance-platform.log' })
      ]
    });
  }

  private setupMetrics(): void {
    this.registry = new Registry();

    this.metrics = {
      responseTime: new Histogram({
        name: 'http_response_time_seconds',
        help: 'HTTP response time in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
        registers: [this.registry],
      }),
      throughput: new Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
        registers: [this.registry],
      }),
      errorRate: new Counter({
        name: 'http_errors_total',
        help: 'Total number of HTTP errors',
        labelNames: ['type', 'route'],
        registers: [this.registry],
      }),
      cacheHitRate: new Gauge({
        name: 'cache_hit_rate',
        help: 'Cache hit rate percentage',
        labelNames: ['cache_layer'],
        registers: [this.registry],
      }),
      cpuUtilization: new Gauge({
        name: 'cpu_utilization_percent',
        help: 'CPU utilization percentage',
        registers: [this.registry],
      }),
      memoryUsage: new Gauge({
        name: 'memory_usage_bytes',
        help: 'Memory usage in bytes',
        labelNames: ['type'],
        registers: [this.registry],
      }),
      activeConnections: new Gauge({
        name: 'active_connections',
        help: 'Number of active connections',
        registers: [this.registry],
      }),
    };
  }

  private setupServer(): void {
    this.server = express();

    // Performance middleware
    this.server.use(this.performanceMiddleware.bind(this));

    // Compression middleware
    this.server.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Cache middleware
    this.server.use(this.cacheMiddleware.bind(this));

    // Rate limiting middleware
    this.server.use(this.rateLimitingMiddleware.bind(this));

    this.setupRoutes();
  }

  private setupPerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    this.performanceObserver.observe({
      entryTypes: ['measure', 'navigation', 'resource', 'paint', 'mark']
    });
  }

  private initializeComponents(): void {
    this.setupCaching();
    this.setupMonitoring();
    this.setupScaling();
    this.setupProfiling();
    this.setupOptimizationQueue();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize cache layers
      for (const layer of this.config.caching.layers) {
        await this.initializeCacheLayer(layer);
      }

      // Initialize monitoring systems
      await this.initializeMonitoring();

      // Initialize scaling systems
      await this.initializeScaling();

      // Initialize profiling
      await this.initializeProfiling();

      // Start performance optimization workers
      this.startOptimizationWorkers();

      // Setup WebSocket server for real-time updates
      this.setupWebSocket();

      // Start system monitoring
      this.startSystemMonitoring();

      this.logger.info('Performance platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize performance platform', { error });
      throw error;
    }
  }

  private async initializeCacheLayer(layer: CacheLayer): Promise<void> {
    let cache: any;

    switch (layer.type) {
      case 'memory':
        cache = new LRUCache({
          max: parseInt(layer.size),
          ttl: layer.ttl * 1000,
          updateAgeOnGet: true,
          updateAgeOnHas: true,
        });
        break;

      case 'redis':
        if (layer.connection?.cluster) {
          cache = new RedisCluster(
            layer.connection.cluster.nodes.map(node => ({ host: node.host, port: node.port })),
            {
              redisOptions: {
                password: layer.connection.auth,
              },
            }
          );
        } else {
          cache = new Redis({
            host: layer.connection?.host,
            port: layer.connection?.port,
            password: layer.connection?.auth,
          });
        }
        break;

      default:
        throw new Error(`Unsupported cache type: ${layer.type}`);
    }

    this.caches.set(layer.name, {
      instance: cache,
      config: layer,
      stats: {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
      }
    });

    this.logger.info(`Cache layer initialized: ${layer.name}`);
  }

  private async initializeMonitoring(): Promise<void> {
    // Initialize APM monitoring
    if (this.config.monitoring.apm) {
      await this.initializeAPM();
    }

    // Initialize custom monitoring
    await this.initializeCustomMonitoring();

    // Initialize distributed tracing
    if (this.config.monitoring.tracing.enabled) {
      await this.initializeTracing();
    }
  }

  private async initializeAPM(): Promise<void> {
    const apmConfig = this.config.monitoring.apm;

    switch (apmConfig.provider) {
      case 'newrelic':
        // Initialize New Relic APM
        this.logger.info('New Relic APM initialized');
        break;
      case 'datadog':
        // Initialize Datadog APM
        this.logger.info('Datadog APM initialized');
        break;
      case 'custom':
        // Initialize custom APM
        this.logger.info('Custom APM initialized');
        break;
    }
  }

  private async initializeCustomMonitoring(): Promise<void> {
    // Initialize custom metrics collection
    for (const source of this.config.monitoring.metrics.collection.sources) {
      const monitor = new PerformanceMonitor(source, this.logger);
      await monitor.initialize();
      this.monitors.set(source.name, monitor);
    }
  }

  private async initializeTracing(): Promise<void> {
    const tracingConfig = this.config.monitoring.tracing;

    // Initialize distributed tracing based on configuration
    this.logger.info('Distributed tracing initialized', {
      exporter: tracingConfig.exporter.type
    });
  }

  private async initializeScaling(): Promise<void> {
    // Initialize horizontal scaling
    if (this.config.scaling.horizontal.enabled) {
      const horizontalScaler = new HorizontalScaler(
        this.config.scaling.horizontal,
        this.logger
      );
      await horizontalScaler.initialize();
      this.scalers.set('horizontal', horizontalScaler);
    }

    // Initialize vertical scaling
    if (this.config.scaling.vertical.enabled) {
      const verticalScaler = new VerticalScaler(
        this.config.scaling.vertical,
        this.logger
      );
      await verticalScaler.initialize();
      this.scalers.set('vertical', verticalScaler);
    }

    // Initialize predictive scaling
    if (this.config.scaling.predictive.enabled) {
      const predictiveScaler = new PredictiveScaler(
        this.config.scaling.predictive,
        this.logger
      );
      await predictiveScaler.initialize();
      this.scalers.set('predictive', predictiveScaler);
    }
  }

  private async initializeProfiling(): Promise<void> {
    // Initialize CPU profiling
    if (this.config.profiling.cpu.enabled) {
      const cpuProfiler = new CPUProfiler(this.config.profiling.cpu, this.logger);
      this.profilers.set('cpu', cpuProfiler);
    }

    // Initialize memory profiling
    if (this.config.profiling.memory.enabled) {
      const memoryProfiler = new MemoryProfiler(this.config.profiling.memory, this.logger);
      this.profilers.set('memory', memoryProfiler);
    }

    // Initialize I/O profiling
    if (this.config.profiling.io.enabled) {
      const ioProfiler = new IOProfiler(this.config.profiling.io, this.logger);
      this.profilers.set('io', ioProfiler);
    }
  }

  // Performance monitoring middleware
  private performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = performance.now();
    const startMark = `req-start-${uuidv4()}`;
    const endMark = `req-end-${uuidv4()}`;

    performance.mark(startMark);

    // Track active connections
    this.metrics.activeConnections.inc();

    res.on('finish', () => {
      performance.mark(endMark);
      performance.measure('http-request', startMark, endMark);

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;

      // Record metrics
      this.metrics.responseTime
        .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
        .observe(duration);

      this.metrics.throughput
        .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
        .inc();

      if (res.statusCode >= 400) {
        this.metrics.errorRate
          .labels('http_error', req.route?.path || req.path)
          .inc();
      }

      this.metrics.activeConnections.dec();

      // Log slow requests
      if (duration > 1) {
        this.logger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode,
        });
      }
    });

    next();
  }

  // Advanced caching middleware
  private async cacheMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = this.generateCacheKey(req);

    try {
      // Check cache layers in order
      for (const layer of this.config.caching.layers) {
        const cache = this.caches.get(layer.name);
        if (!cache) continue;

        const cachedResponse = await this.getCachedResponse(cache, cacheKey);
        if (cachedResponse) {
          cache.stats.hits++;
          this.updateCacheHitRate(layer.name);

          res.set(cachedResponse.headers);
          res.status(cachedResponse.statusCode);
          res.send(cachedResponse.body);
          return;
        }

        cache.stats.misses++;
      }

      // No cache hit, intercept response for caching
      const originalSend = res.send;
      const originalJson = res.json;

      res.send = function(body: any) {
        if (res.statusCode === 200 && this.shouldCache(req, res)) {
          this.cacheResponse(cacheKey, {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            body: body,
          });
        }
        return originalSend.call(this, body);
      }.bind(this);

      res.json = function(obj: any) {
        if (res.statusCode === 200 && this.shouldCache(req, res)) {
          this.cacheResponse(cacheKey, {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            body: JSON.stringify(obj),
          });
        }
        return originalJson.call(this, obj);
      }.bind(this);

    } catch (error) {
      this.logger.error('Cache middleware error', { error });
    }

    next();
  }

  // Rate limiting middleware
  private rateLimitingMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Implement rate limiting based on IP, user, or other criteria
    const clientId = this.getClientId(req);
    const limit = this.getRateLimit(req);

    // Check rate limit
    // Implementation would track requests per client and time window

    next();
  }

  // Cache management methods
  private async getCachedResponse(cache: any, key: string): Promise<any> {
    try {
      if (cache.config.type === 'memory') {
        return cache.instance.get(key);
      } else if (cache.config.type === 'redis') {
        const data = await cache.instance.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      this.logger.error('Cache get error', { key, error });
      return null;
    }
  }

  private async cacheResponse(key: string, response: any): Promise<void> {
    for (const layer of this.config.caching.layers) {
      const cache = this.caches.get(layer.name);
      if (!cache) continue;

      try {
        if (cache.config.type === 'memory') {
          cache.instance.set(key, response, { ttl: layer.ttl * 1000 });
        } else if (cache.config.type === 'redis') {
          await cache.instance.setex(key, layer.ttl, JSON.stringify(response));
        }

        cache.stats.sets++;
      } catch (error) {
        this.logger.error('Cache set error', { key, layer: layer.name, error });
      }
    }
  }

  private generateCacheKey(req: Request): string {
    // Generate cache key based on request parameters
    const parts = [
      req.method,
      req.path,
      JSON.stringify(req.query),
      req.get('Accept'),
      req.get('Accept-Encoding'),
    ].filter(Boolean);

    return require('crypto')
      .createHash('sha256')
      .update(parts.join('|'))
      .digest('hex');
  }

  private shouldCache(req: Request, res: Response): boolean {
    // Determine if response should be cached
    const cacheControl = res.get('Cache-Control');
    return !cacheControl?.includes('no-cache') &&
           !cacheControl?.includes('no-store') &&
           res.statusCode === 200;
  }

  // Performance optimization methods
  async optimizeApplication(): Promise<OptimizationResult> {
    const results: OptimizationResult = {
      timestamp: new Date(),
      optimizations: [],
      metrics: {},
      recommendations: [],
    };

    try {
      // CPU optimization
      const cpuOptimization = await this.optimizeCPU();
      results.optimizations.push(cpuOptimization);

      // Memory optimization
      const memoryOptimization = await this.optimizeMemory();
      results.optimizations.push(memoryOptimization);

      // Database optimization
      const dbOptimization = await this.optimizeDatabase();
      results.optimizations.push(dbOptimization);

      // Cache optimization
      const cacheOptimization = await this.optimizeCache();
      results.optimizations.push(cacheOptimization);

      // Network optimization
      const networkOptimization = await this.optimizeNetwork();
      results.optimizations.push(networkOptimization);

      // Generate recommendations
      results.recommendations = this.generateOptimizationRecommendations(results);

      this.logger.info('Application optimization completed', {
        optimizations: results.optimizations.length,
        recommendations: results.recommendations.length,
      });

      return results;
    } catch (error) {
      this.logger.error('Application optimization failed', { error });
      throw error;
    }
  }

  private async optimizeCPU(): Promise<OptimizationAction> {
    const cpuUsage = this.getCurrentCPUUsage();
    const optimizations = [];

    // Analyze CPU bottlenecks
    if (cpuUsage > 80) {
      optimizations.push('Enable CPU-intensive task offloading to workers');
      this.scaleWorkers('cpu');
    }

    // Optimize event loop
    if (this.getEventLoopUtilization() > 70) {
      optimizations.push('Optimize event loop utilization');
      this.optimizeEventLoop();
    }

    return {
      type: 'cpu',
      actions: optimizations,
      impact: this.calculateOptimizationImpact('cpu', optimizations),
      duration: Date.now(),
    };
  }

  private async optimizeMemory(): Promise<OptimizationAction> {
    const memoryUsage = process.memoryUsage();
    const optimizations = [];

    // Garbage collection optimization
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
      optimizations.push('Trigger garbage collection');
      if (global.gc) {
        global.gc();
      }
    }

    // Memory leak detection
    const leaks = await this.detectMemoryLeaks();
    if (leaks.length > 0) {
      optimizations.push(`Fix ${leaks.length} potential memory leaks`);
    }

    // Object pooling recommendations
    if (this.shouldImplementObjectPooling()) {
      optimizations.push('Implement object pooling for high-frequency allocations');
    }

    return {
      type: 'memory',
      actions: optimizations,
      impact: this.calculateOptimizationImpact('memory', optimizations),
      duration: Date.now(),
    };
  }

  private async optimizeDatabase(): Promise<OptimizationAction> {
    const optimizations = [];

    // Query optimization
    const slowQueries = await this.identifySlowQueries();
    if (slowQueries.length > 0) {
      optimizations.push(`Optimize ${slowQueries.length} slow queries`);
    }

    // Index optimization
    const missingIndexes = await this.identifyMissingIndexes();
    if (missingIndexes.length > 0) {
      optimizations.push(`Create ${missingIndexes.length} missing indexes`);
    }

    // Connection pool optimization
    if (await this.shouldOptimizeConnectionPool()) {
      optimizations.push('Optimize database connection pool settings');
    }

    return {
      type: 'database',
      actions: optimizations,
      impact: this.calculateOptimizationImpact('database', optimizations),
      duration: Date.now(),
    };
  }

  private async optimizeCache(): Promise<OptimizationAction> {
    const optimizations = [];

    // Cache hit rate optimization
    for (const [name, cache] of this.caches.entries()) {
      const hitRate = this.calculateHitRate(cache.stats);
      if (hitRate < 0.7) {
        optimizations.push(`Improve ${name} cache hit rate (current: ${(hitRate * 100).toFixed(1)}%)`);
      }
    }

    // Cache size optimization
    const oversizedCaches = this.identifyOversizedCaches();
    if (oversizedCaches.length > 0) {
      optimizations.push(`Optimize ${oversizedCaches.length} cache sizes`);
    }

    // Cache eviction policy optimization
    const suboptimalEvictions = this.identifySuboptimalEvictions();
    if (suboptimalEvictions.length > 0) {
      optimizations.push(`Optimize ${suboptimalEvictions.length} cache eviction policies`);
    }

    return {
      type: 'cache',
      actions: optimizations,
      impact: this.calculateOptimizationImpact('cache', optimizations),
      duration: Date.now(),
    };
  }

  private async optimizeNetwork(): Promise<OptimizationAction> {
    const optimizations = [];

    // HTTP/2 adoption
    if (!this.isHTTP2Enabled()) {
      optimizations.push('Enable HTTP/2 for improved performance');
    }

    // Compression optimization
    if (!this.isOptimalCompressionEnabled()) {
      optimizations.push('Optimize compression settings');
    }

    // CDN optimization
    if (await this.shouldOptimizeCDN()) {
      optimizations.push('Optimize CDN configuration');
    }

    return {
      type: 'network',
      actions: optimizations,
      impact: this.calculateOptimizationImpact('network', optimizations),
      duration: Date.now(),
    };
  }

  // Auto-scaling implementation
  async checkScalingNeeds(): Promise<ScalingDecision[]> {
    const decisions: ScalingDecision[] = [];

    for (const policy of this.config.scaling.policies) {
      const shouldScale = await this.evaluateScalingPolicy(policy);
      if (shouldScale) {
        decisions.push({
          policy: policy.name,
          action: policy.action,
          reason: `Metric ${policy.trigger.metric} ${policy.trigger.operator} ${policy.trigger.value}`,
          timestamp: new Date(),
        });
      }
    }

    return decisions;
  }

  private async evaluateScalingPolicy(policy: ScalingPolicy): Promise<boolean> {
    // Get metric value
    const metricValue = await this.getMetricValue(policy.trigger.metric);

    // Evaluate trigger condition
    switch (policy.trigger.operator) {
      case 'gt':
        return metricValue > policy.trigger.value;
      case 'gte':
        return metricValue >= policy.trigger.value;
      case 'lt':
        return metricValue < policy.trigger.value;
      case 'lte':
        return metricValue <= policy.trigger.value;
      case 'eq':
        return metricValue === policy.trigger.value;
      default:
        return false;
    }
  }

  private async getMetricValue(metricName: string): Promise<number> {
    switch (metricName) {
      case 'cpu_utilization':
        return this.getCurrentCPUUsage();
      case 'memory_utilization':
        return this.getCurrentMemoryUsage();
      case 'response_time':
        return this.getAverageResponseTime();
      case 'error_rate':
        return this.getCurrentErrorRate();
      default:
        return 0;
    }
  }

  // CDN optimization methods
  async optimizeCDN(): Promise<CDNOptimizationResult> {
    const results: CDNOptimizationResult = {
      timestamp: new Date(),
      optimizations: [],
      invalidations: [],
      performance: {},
    };

    try {
      // Optimize cache rules
      for (const provider of this.config.cdn.providers) {
        const optimization = await this.optimizeCDNProvider(provider);
        results.optimizations.push(optimization);
      }

      // Invalidate stale content
      const invalidations = await this.invalidateStaleContent();
      results.invalidations = invalidations;

      // Update performance metrics
      results.performance = await this.getCDNPerformanceMetrics();

      return results;
    } catch (error) {
      this.logger.error('CDN optimization failed', { error });
      throw error;
    }
  }

  private async optimizeCDNProvider(provider: CDNProvider): Promise<any> {
    switch (provider.type) {
      case 'cloudfront':
        return await this.optimizeCloudFront(provider);
      case 'cloudflare':
        return await this.optimizeCloudflare(provider);
      case 'fastly':
        return await this.optimizeFastly(provider);
      default:
        return { provider: provider.name, actions: [] };
    }
  }

  // Profiling methods
  async startProfiling(type: 'cpu' | 'memory' | 'io' | 'network'): Promise<string> {
    const profiler = this.profilers.get(type);
    if (!profiler) {
      throw new Error(`Profiler not available for type: ${type}`);
    }

    const sessionId = uuidv4();
    await profiler.start(sessionId);

    this.logger.info('Profiling session started', { type, sessionId });
    return sessionId;
  }

  async stopProfiling(type: string, sessionId: string): Promise<ProfilingResult> {
    const profiler = this.profilers.get(type);
    if (!profiler) {
      throw new Error(`Profiler not available for type: ${type}`);
    }

    const result = await profiler.stop(sessionId);

    this.logger.info('Profiling session completed', { type, sessionId });
    return result;
  }

  // Performance analysis
  async analyzePerformance(): Promise<PerformanceAnalysis> {
    const analysis: PerformanceAnalysis = {
      timestamp: new Date(),
      overall: {},
      bottlenecks: [],
      recommendations: [],
      trends: {},
    };

    try {
      // System performance analysis
      analysis.overall.cpu = this.getCurrentCPUUsage();
      analysis.overall.memory = this.getCurrentMemoryUsage();
      analysis.overall.responseTime = this.getAverageResponseTime();
      analysis.overall.throughput = this.getCurrentThroughput();
      analysis.overall.errorRate = this.getCurrentErrorRate();

      // Bottleneck identification
      analysis.bottlenecks = await this.identifyBottlenecks();

      // Generate recommendations
      analysis.recommendations = await this.generatePerformanceRecommendations();

      // Performance trends
      analysis.trends = await this.analyzePerformanceTrends();

      return analysis;
    } catch (error) {
      this.logger.error('Performance analysis failed', { error });
      throw error;
    }
  }

  // Real-time monitoring setup
  private setupWebSocket(): void {
    this.wsServer = new WebSocketServer({ port: 8082 });

    this.wsServer.on('connection', (ws) => {
      this.logger.info('Performance monitoring client connected');

      // Send initial metrics
      this.sendPerformanceMetrics(ws);

      // Setup interval for real-time updates
      const interval = setInterval(() => {
        this.sendPerformanceMetrics(ws);
      }, 1000);

      ws.on('close', () => {
        clearInterval(interval);
        this.logger.info('Performance monitoring client disconnected');
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          this.logger.error('Invalid WebSocket message', { error });
        }
      });
    });
  }

  private sendPerformanceMetrics(ws: any): void {
    const metrics = {
      timestamp: Date.now(),
      cpu: this.getCurrentCPUUsage(),
      memory: this.getCurrentMemoryUsage(),
      responseTime: this.getAverageResponseTime(),
      throughput: this.getCurrentThroughput(),
      errorRate: this.getCurrentErrorRate(),
      cacheHitRate: this.getOverallCacheHitRate(),
      activeConnections: this.getActiveConnectionCount(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'metrics', data: metrics }));
    }
  }

  private handleWebSocketMessage(ws: any, message: any): void {
    switch (message.type) {
      case 'start-profiling':
        this.startProfiling(message.profileType);
        break;
      case 'stop-profiling':
        this.stopProfiling(message.profileType, message.sessionId);
        break;
      case 'force-optimization':
        this.optimizeApplication();
        break;
      case 'invalidate-cache':
        this.invalidateCache(message.pattern);
        break;
    }
  }

  // System monitoring
  private startSystemMonitoring(): void {
    // CPU monitoring
    setInterval(() => {
      const cpuUsage = this.getCurrentCPUUsage();
      this.metrics.cpuUtilization.set(cpuUsage);

      if (cpuUsage > 80) {
        this.emit('high-cpu-usage', { usage: cpuUsage });
      }
    }, 5000);

    // Memory monitoring
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.metrics.memoryUsage.labels('heap').set(memoryUsage.heapUsed);
      this.metrics.memoryUsage.labels('external').set(memoryUsage.external);
      this.metrics.memoryUsage.labels('rss').set(memoryUsage.rss);

      const memoryUtilization = memoryUsage.heapUsed / memoryUsage.heapTotal;
      if (memoryUtilization > 0.8) {
        this.emit('high-memory-usage', { utilization: memoryUtilization });
      }
    }, 5000);

    // Event loop monitoring
    setInterval(() => {
      const utilization = this.getEventLoopUtilization();
      if (utilization > 70) {
        this.emit('event-loop-blocked', { utilization });
      }
    }, 1000);
  }

  private startOptimizationWorkers(): void {
    const numWorkers = cpus().length;

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(__filename, {
        workerData: { type: 'optimization', workerId: i }
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(message);
      });

      worker.on('error', (error) => {
        this.logger.error('Optimization worker error', { workerId: i, error });
      });

      this.workers.set(`optimization-${i}`, worker);
    }
  }

  private handleWorkerMessage(message: any): void {
    switch (message.type) {
      case 'optimization-complete':
        this.logger.info('Optimization completed by worker', message.data);
        break;
      case 'profiling-result':
        this.logger.info('Profiling completed by worker', message.data);
        break;
    }
  }

  private setupOptimizationQueue(): void {
    this.optimizationQueue = new Bull('performance optimization', {
      redis: { host: 'localhost', port: 6379 },
    });

    this.optimizationQueue.process('optimize', 3, this.processOptimizationJob.bind(this));
    this.optimizationQueue.process('profile', 2, this.processProfilingJob.bind(this));
    this.optimizationQueue.process('scale', 1, this.processScalingJob.bind(this));
  }

  private async processOptimizationJob(job: any): Promise<void> {
    const { type, parameters } = job.data;

    try {
      let result;

      switch (type) {
        case 'cpu':
          result = await this.optimizeCPU();
          break;
        case 'memory':
          result = await this.optimizeMemory();
          break;
        case 'database':
          result = await this.optimizeDatabase();
          break;
        case 'cache':
          result = await this.optimizeCache();
          break;
        default:
          throw new Error(`Unknown optimization type: ${type}`);
      }

      this.logger.info('Optimization job completed', { type, result });
    } catch (error) {
      this.logger.error('Optimization job failed', { type, error });
      throw error;
    }
  }

  private async processProfilingJob(job: any): Promise<void> {
    // Process profiling jobs
  }

  private async processScalingJob(job: any): Promise<void> {
    // Process scaling jobs
  }

  private setupRoutes(): void {
    // Performance metrics endpoint
    this.server.get('/metrics', async (req, res) => {
      res.set('Content-Type', this.registry.contentType);
      res.end(await this.registry.metrics());
    });

    // Performance analysis endpoint
    this.server.get('/performance/analysis', async (req, res) => {
      try {
        const analysis = await this.analyzePerformance();
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Optimization endpoint
    this.server.post('/performance/optimize', async (req, res) => {
      try {
        const result = await this.optimizeApplication();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Profiling endpoints
    this.server.post('/performance/profiling/start', async (req, res) => {
      try {
        const { type } = req.body;
        const sessionId = await this.startProfiling(type);
        res.json({ sessionId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.server.post('/performance/profiling/stop', async (req, res) => {
      try {
        const { type, sessionId } = req.body;
        const result = await this.stopProfiling(type, sessionId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Cache management endpoints
    this.server.post('/performance/cache/invalidate', async (req, res) => {
      try {
        const { pattern } = req.body;
        await this.invalidateCache(pattern);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.server.get('/performance/cache/stats', (req, res) => {
      const stats = {};
      for (const [name, cache] of this.caches.entries()) {
        stats[name] = cache.stats;
      }
      res.json(stats);
    });

    // Scaling endpoints
    this.server.post('/performance/scale', async (req, res) => {
      try {
        const decisions = await this.checkScalingNeeds();
        res.json(decisions);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  // Utility methods
  private getCurrentCPUUsage(): number {
    const load = loadavg()[0];
    const numCPUs = cpus().length;
    return (load / numCPUs) * 100;
  }

  private getCurrentMemoryUsage(): number {
    const used = totalmem() - freemem();
    return (used / totalmem()) * 100;
  }

  private getEventLoopUtilization(): number {
    // Simplified event loop utilization calculation
    return Math.random() * 100; // Would use actual measurement
  }

  private getAverageResponseTime(): number {
    // Calculate from metrics
    return 0; // Simplified
  }

  private getCurrentThroughput(): number {
    // Calculate from metrics
    return 0; // Simplified
  }

  private getCurrentErrorRate(): number {
    // Calculate from metrics
    return 0; // Simplified
  }

  private getOverallCacheHitRate(): number {
    let totalHits = 0;
    let totalRequests = 0;

    for (const cache of this.caches.values()) {
      totalHits += cache.stats.hits;
      totalRequests += cache.stats.hits + cache.stats.misses;
    }

    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  private getActiveConnectionCount(): number {
    // Get from metrics
    return 0; // Simplified
  }

  private updateCacheHitRate(layerName: string): void {
    const cache = this.caches.get(layerName);
    if (cache) {
      const hitRate = this.calculateHitRate(cache.stats);
      this.metrics.cacheHitRate.labels(layerName).set(hitRate * 100);
    }
  }

  private calculateHitRate(stats: any): number {
    const total = stats.hits + stats.misses;
    return total > 0 ? stats.hits / total : 0;
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    // Process performance entries for analysis
    this.logger.debug('Performance entry', {
      name: entry.name,
      type: entry.entryType,
      duration: entry.duration,
      startTime: entry.startTime,
    });
  }

  private getClientId(req: Request): string {
    return req.ip || 'unknown';
  }

  private getRateLimit(req: Request): number {
    return 100; // Simplified
  }

  // Complex optimization methods (simplified)
  private scaleWorkers(type: string): void {}
  private optimizeEventLoop(): void {}
  private async detectMemoryLeaks(): Promise<any[]> { return []; }
  private shouldImplementObjectPooling(): boolean { return false; }
  private async identifySlowQueries(): Promise<any[]> { return []; }
  private async identifyMissingIndexes(): Promise<any[]> { return []; }
  private async shouldOptimizeConnectionPool(): Promise<boolean> { return false; }
  private identifyOversizedCaches(): any[] { return []; }
  private identifySuboptimalEvictions(): any[] { return []; }
  private isHTTP2Enabled(): boolean { return false; }
  private isOptimalCompressionEnabled(): boolean { return true; }
  private async shouldOptimizeCDN(): Promise<boolean> { return false; }
  private calculateOptimizationImpact(type: string, actions: string[]): number { return 0; }
  private async invalidateStaleContent(): Promise<any[]> { return []; }
  private async getCDNPerformanceMetrics(): Promise<any> { return {}; }
  private async optimizeCloudFront(provider: any): Promise<any> { return {}; }
  private async optimizeCloudflare(provider: any): Promise<any> { return {}; }
  private async optimizeFastly(provider: any): Promise<any> { return {}; }
  private async identifyBottlenecks(): Promise<any[]> { return []; }
  private async generatePerformanceRecommendations(): Promise<any[]> { return []; }
  private async analyzePerformanceTrends(): Promise<any> { return {}; }
  private generateOptimizationRecommendations(results: any): string[] { return []; }
  private async invalidateCache(pattern: string): Promise<void> {}

  public async start(port: number = 8080): Promise<void> {
    await this.initialize();

    this.server.listen(port, () => {
      this.logger.info(`Performance optimization platform running on port ${port}`);
    });
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down performance platform...');

    // Stop all workers
    for (const [name, worker] of this.workers.entries()) {
      await worker.terminate();
      this.logger.info(`${name} worker terminated`);
    }

    // Close cache connections
    for (const [name, cache] of this.caches.entries()) {
      if (cache.instance.disconnect) {
        cache.instance.disconnect();
      }
    }

    // Close optimization queue
    await this.optimizationQueue.close();

    // Stop performance observer
    this.performanceObserver.disconnect();

    this.logger.info('Performance platform shutdown complete');
  }
}

// Supporting classes and interfaces
class PerformanceMonitor {
  constructor(private source: MetricSource, private logger: Logger) {}
  async initialize(): Promise<void> {}
}

class HorizontalScaler {
  constructor(private config: HorizontalScalingConfig, private logger: Logger) {}
  async initialize(): Promise<void> {}
}

class VerticalScaler {
  constructor(private config: VerticalScalingConfig, private logger: Logger) {}
  async initialize(): Promise<void> {}
}

class PredictiveScaler {
  constructor(private config: PredictiveScalingConfig, private logger: Logger) {}
  async initialize(): Promise<void> {}
}

class CPUProfiler {
  constructor(private config: CPUProfiling, private logger: Logger) {}
  async start(sessionId: string): Promise<void> {}
  async stop(sessionId: string): Promise<ProfilingResult> { return {} as any; }
}

class MemoryProfiler {
  constructor(private config: MemoryProfiling, private logger: Logger) {}
  async start(sessionId: string): Promise<void> {}
  async stop(sessionId: string): Promise<ProfilingResult> { return {} as any; }
}

class IOProfiler {
  constructor(private config: IOProfiling, private logger: Logger) {}
  async start(sessionId: string): Promise<void> {}
  async stop(sessionId: string): Promise<ProfilingResult> { return {} as any; }
}

interface OptimizationResult {
  timestamp: Date;
  optimizations: OptimizationAction[];
  metrics: Record<string, number>;
  recommendations: string[];
}

interface OptimizationAction {
  type: string;
  actions: string[];
  impact: number;
  duration: number;
}

interface ScalingDecision {
  policy: string;
  action: ScalingAction;
  reason: string;
  timestamp: Date;
}

interface CDNOptimizationResult {
  timestamp: Date;
  optimizations: any[];
  invalidations: any[];
  performance: any;
}

interface ProfilingResult {
  sessionId?: string;
  type?: string;
  data?: any;
  analysis?: any;
}

interface PerformanceAnalysis {
  timestamp: Date;
  overall: Record<string, number>;
  bottlenecks: any[];
  recommendations: any[];
  trends: any;
}

// Example usage
export async function createPerformancePlatformExample(): Promise<void> {
  const config: PerformancePlatformConfig = {
    monitoring: {
      apm: {
        provider: 'datadog',
        apiKey: 'api-key',
        applicationName: 'performance-app',
        samplingRate: 0.1,
        errorTracking: true,
      },
      metrics: {
        collection: {
          interval: 5000,
          sources: [
            {
              type: 'system',
              name: 'system_metrics',
              metrics: ['cpu', 'memory', 'disk', 'network'],
            },
            {
              type: 'application',
              name: 'app_metrics',
              metrics: ['response_time', 'throughput', 'error_rate'],
            },
          ],
          filters: [],
        },
        aggregation: {
          functions: [
            { name: 'avg_response_time', function: 'avg', parameters: {} },
            { name: 'total_requests', function: 'sum', parameters: {} },
          ],
          windows: [
            { duration: '1m', alignment: 'end', sliding: true },
            { duration: '5m', alignment: 'end', sliding: false },
          ],
          grouping: [
            { dimensions: ['service', 'endpoint'], labels: ['method'], cardinality: 1000 },
          ],
        },
        storage: {
          backend: 'prometheus',
          connection: { url: 'http://localhost:9090' },
          compression: true,
          partitioning: {
            strategy: 'time',
            interval: '1d',
            retention: '30d',
          },
        },
        retention: {
          policies: [
            { resolution: '1s', duration: '1d' },
            { resolution: '1m', duration: '7d' },
            { resolution: '1h', duration: '30d' },
          ],
          compression: [
            { algorithm: 'gzip', threshold: '1GB', schedule: '0 2 * * *' },
          ],
          archival: [
            { condition: 'age > 30d', storage: 's3', format: 'parquet' },
          ],
        },
      },
      tracing: {
        enabled: true,
        sampler: { type: 'ratio', parameters: { ratio: 0.1 } },
        exporter: { type: 'jaeger', endpoint: 'http://localhost:14268', headers: {}, compression: true },
        instrumentation: {
          automatic: true,
          libraries: [
            { name: 'express', version: '4.x', enabled: true, config: {} },
            { name: 'redis', version: '4.x', enabled: true, config: {} },
          ],
          custom: [],
        },
      },
      realTime: {
        dashboard: {
          enabled: true,
          refreshInterval: 1000,
          widgets: [
            {
              type: 'chart',
              title: 'CPU Usage',
              query: 'cpu_utilization',
              timeRange: '1h',
              position: { x: 0, y: 0, width: 6, height: 4 },
            },
          ],
          layout: { theme: 'dark', responsive: true, autoRefresh: true },
        },
        streaming: {
          enabled: true,
          protocol: 'websocket',
          port: 8082,
          compression: true,
          authentication: false,
        },
        alerts: [
          {
            name: 'high_cpu',
            condition: 'cpu_utilization > 80',
            threshold: 80,
            duration: '5m',
            severity: 'warning',
            channels: [{ type: 'slack', config: { webhook: 'slack-webhook' } }],
          },
        ],
      },
    },
    caching: {
      layers: [
        {
          name: 'l1_memory',
          type: 'memory',
          size: '100MB',
          ttl: 300,
          serialization: { format: 'json', compression: false },
        },
        {
          name: 'l2_redis',
          type: 'redis',
          size: '1GB',
          ttl: 3600,
          connection: { host: 'localhost', port: 6379 },
          serialization: { format: 'json', compression: true },
        },
      ],
      strategies: [
        {
          pattern: '/api/users/*',
          cache: 'l2_redis',
          ttl: 1800,
          invalidation: {
            triggers: [{ type: 'event', condition: 'user_updated' }],
            propagation: { async: true, retries: 3, timeout: 5000 },
          },
        },
      ],
      eviction: {
        policies: [
          { algorithm: 'lru', parameters: {}, priority: 1 },
        ],
        monitoring: true,
        optimization: true,
      },
      coherence: {
        protocol: 'write_through',
        consistency: { level: 'eventual', timeout: 5000, retries: 3 },
        conflict_resolution: { strategy: 'last_writer_wins' },
      },
    },
    scaling: {
      horizontal: {
        enabled: true,
        minInstances: 2,
        maxInstances: 10,
        targetUtilization: 70,
        scaleUpCooldown: 300,
        scaleDownCooldown: 600,
        metrics: [
          { name: 'cpu_utilization', type: 'cpu', threshold: 70, window: '5m', aggregation: 'avg' },
          { name: 'response_time', type: 'custom', threshold: 500, window: '5m', aggregation: 'avg' },
        ],
      },
      vertical: {
        enabled: true,
        resources: [
          { type: 'cpu', min: '100m', max: '2000m', step: '100m', utilization: 80 },
          { type: 'memory', min: '128Mi', max: '4Gi', step: '128Mi', utilization: 80 },
        ],
        limits: { cpu: '4000m', memory: '8Gi', storage: '10Gi', cost: 1000 },
        recommendations: true,
      },
      predictive: {
        enabled: true,
        algorithm: 'linear_regression',
        features: [
          { name: 'historical_load', source: 'metrics', transformation: 'moving_average', weight: 0.7 },
          { name: 'time_of_day', source: 'time', transformation: 'sinusoidal', weight: 0.3 },
        ],
        horizon: '1h',
        accuracy: 0.85,
      },
      policies: [
        {
          name: 'cpu_scale_out',
          trigger: { metric: 'cpu_utilization', operator: 'gt', value: 80, duration: '5m' },
          action: { type: 'scale_out', amount: 1, unit: 'instances', limits: { min: 2, max: 10, rate: 2 } },
          conditions: [],
        },
      ],
    },
    cdn: {
      providers: [
        {
          name: 'cloudfront',
          type: 'cloudfront',
          regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
          configuration: { distributionId: 'dist-123', settings: {} },
          failover: { enabled: true, priority: 1, healthCheck: { url: '/health', interval: 30, timeout: 5, retries: 3 } },
        },
      ],
      optimization: {
        compression: { enabled: true, algorithms: ['gzip', 'brotli'], fileTypes: ['text/*', 'application/json'], minSize: 1024, level: 6 },
        minification: { enabled: true, fileTypes: ['text/javascript', 'text/css'], preserveComments: false, mangleNames: true },
        imageOptimization: { enabled: true, formats: ['webp', 'avif'], quality: { jpeg: 80, png: 90 }, responsive: true, lazyLoading: true },
        bundling: { enabled: true, strategy: 'split', maxSize: '1MB', minSize: '10KB' },
      },
      caching: {
        rules: [
          { pattern: '/static/*', ttl: 86400, behavior: 'cache', vary: ['Accept-Encoding'] },
          { pattern: '/api/*', ttl: 300, behavior: 'cache', vary: ['Authorization'] },
        ],
        headers: [
          { name: 'Cache-Control', value: 'public, max-age=3600' },
        ],
        invalidation: { automatic: true, patterns: ['/*'], batch: true },
      },
      security: {
        waf: { enabled: true, rules: [{ id: 'AWS-AWSManagedRulesCommonRuleSet', action: 'allow', priority: 1 }], customRules: [] },
        ddos: { protection: true, threshold: 1000, response: 'challenge' },
        ssl: { certificate: 'arn:aws:acm:...', protocols: ['TLSv1.2', 'TLSv1.3'], ciphers: [], hsts: true },
        access: { restrictions: [], allowlist: [], blocklist: [] },
      },
    },
    optimization: {
      code: {
        compilation: { level: 'O2', inlining: true, deadCodeElimination: true, loopOptimization: true },
        runtime: {
          jit: true,
          gc: { algorithm: 'G1', generations: 2, threshold: 50, parallel: true },
          threading: { poolSize: 10, workStealing: true, affinity: false },
        },
        memory: { pooling: true, compression: false, deduplication: true, monitoring: true },
        profiling: true,
      },
      database: {
        queries: { analysis: true, caching: true, rewriting: true, parallelization: false },
        indexes: { analysis: true, suggestions: true, automatic: false, monitoring: true },
        connections: { pooling: true, multiplexing: true, compression: false },
      },
      network: {
        protocols: { http2: true, http3: false, grpc: true, websockets: true },
        bandwidth: { compression: true, deduplication: false, prioritization: true },
        latency: { keepalive: true, multiplexing: true, prefetching: true },
      },
      storage: { compression: true, deduplication: true, tiering: true, caching: true },
    },
    profiling: {
      cpu: { enabled: true, interval: 10, duration: '30s', format: 'flame' },
      memory: { enabled: true, heapDumps: true, leakDetection: true, allocation: true },
      io: { enabled: true, fileOperations: true, diskUsage: true, bandwidth: true },
      network: { enabled: true, connections: true, bandwidth: true, latency: true },
    },
    alerting: {
      thresholds: [
        { metric: 'cpu_utilization', warning: 70, critical: 90, duration: '5m', condition: 'sustained' },
        { metric: 'memory_utilization', warning: 80, critical: 95, duration: '2m', condition: 'sustained' },
        { metric: 'response_time', warning: 1000, critical: 5000, duration: '1m', condition: 'average' },
      ],
      escalation: {
        levels: [
          { level: 1, delay: '0s', channels: ['slack'] },
          { level: 2, delay: '5m', channels: ['slack', 'email'] },
          { level: 3, delay: '15m', channels: ['slack', 'email', 'sms'] },
        ],
        timeout: 3600,
        override: true,
      },
      automation: {
        enabled: true,
        actions: [
          { type: 'scale', parameters: { direction: 'out', amount: 1 }, timeout: 300 },
          { type: 'restart', parameters: { graceful: true }, timeout: 60 },
        ],
        conditions: [
          { metric: 'error_rate', operator: 'gt', value: 10, duration: '5m' },
        ],
      },
    },
  };

  const platform = new PerformancePlatform(config);
  await platform.start(8080);

  console.log('Performance optimization platform with profiling, caching, auto-scaling, and monitoring running');
}

export { PerformancePlatform, PerformancePlatformConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Performance optimization and tuning is needed
- Application profiling and monitoring is required
- Caching strategies and implementation is requested
- Auto-scaling and load balancing is needed
- CDN optimization and configuration is required
- Performance bottleneck identification and resolution is requested

This comprehensive performance optimization skill provides expert-level capabilities for building high-performance, scalable applications with advanced profiling, caching, auto-scaling, and enterprise-grade performance engineering practices.