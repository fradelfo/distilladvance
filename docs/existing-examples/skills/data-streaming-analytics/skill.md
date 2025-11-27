# Data Streaming & Real-time Analytics Skill

Advanced data streaming and real-time analytics expertise covering stream processing frameworks, time-series optimization, event-driven architectures, and comprehensive real-time analytics platform development.

## Skill Overview

Expert data streaming knowledge including stream processing, complex event processing, time-series databases, real-time analytics, windowing strategies, data pipeline orchestration, and modern streaming analytics platform engineering.

## Core Capabilities

### Stream Processing Frameworks
- **Apache Kafka Streams** - Stateful processing, windowing, joins, exactly-once semantics
- **Apache Flink** - Complex event processing, watermarks, checkpointing, fault tolerance
- **Apache Spark Streaming** - Micro-batching, structured streaming, delta processing
- **Apache Beam** - Unified batch/stream processing, dataflow pipelines, portable execution

### Time-Series Optimization
- **InfluxDB** - High-performance time-series storage, query optimization, retention policies
- **TimescaleDB** - PostgreSQL extension, hypertables, continuous aggregation, compression
- **Prometheus** - Metrics collection, alerting, PromQL queries, federation
- **ClickHouse** - Columnar database, real-time analytics, materialized views, aggregation

### Real-time Analytics
- **Complex Event Processing** - Pattern detection, temporal queries, event correlation
- **Windowing strategies** - Tumbling, sliding, session windows, late data handling
- **Stream aggregations** - Count, sum, average, percentiles, custom aggregators
- **Low-latency pipelines** - Sub-second processing, in-memory computing, caching layers

### Data Pipeline Orchestration
- **Apache Airflow** - Workflow scheduling, dependency management, monitoring, scaling
- **Prefect** - Modern workflow orchestration, dynamic DAGs, error handling
- **Stream processing** - Real-time ETL, data transformation, enrichment, validation
- **Event sourcing** - Event stores, replay capabilities, CQRS patterns, audit trails

## Modern Data Streaming & Analytics Platform Implementation

### Comprehensive Real-time Analytics Platform with Kafka and Flink
```typescript
// Advanced data streaming and real-time analytics platform with stream processing
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { EventEmitter } from 'events';
import { createClient } from 'redis';
import InfluxDB, { InfluxDB as InfluxDBClient, Point, WriteOptions } from '@influxdata/influxdb-client';
import { Client as ClickHouseClient, createClient as createClickHouseClient } from '@clickhouse/client';
import { Pool as PostgresPool } from 'pg';
import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import cron from 'node-cron';
import { Transform, Writable, pipeline } from 'stream';
import { promisify } from 'util';

// Types and interfaces
interface StreamingConfig {
  kafka: KafkaConfig;
  influxdb: InfluxDBConfig;
  clickhouse: ClickHouseConfig;
  postgres: PostgresConfig;
  redis: RedisConfig;
  processing: ProcessingConfig;
  analytics: AnalyticsConfig;
  monitoring: MonitoringConfig;
}

interface KafkaConfig {
  brokers: string[];
  clientId: string;
  topics: TopicConfig[];
  producers: ProducerConfig;
  consumers: ConsumerConfig;
}

interface TopicConfig {
  name: string;
  partitions: number;
  replicationFactor: number;
  configs: Record<string, string>;
  retention: string;
}

interface ProducerConfig {
  maxInFlightRequests: number;
  idempotent: boolean;
  transactionTimeout: number;
  acks: number;
  compression: 'gzip' | 'snappy' | 'lz4' | 'zstd';
}

interface ConsumerConfig {
  groupId: string;
  sessionTimeout: number;
  heartbeatInterval: number;
  maxPollRecords: number;
  autoCommit: boolean;
}

interface InfluxDBConfig {
  url: string;
  token: string;
  organization: string;
  buckets: BucketConfig[];
  retentionPolicies: RetentionPolicy[];
}

interface BucketConfig {
  name: string;
  retention: string;
  description: string;
  shardGroupDuration: string;
}

interface RetentionPolicy {
  name: string;
  duration: string;
  shardGroupDuration: string;
  replicationFactor: number;
  default: boolean;
}

interface ClickHouseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  tables: TableConfig[];
}

interface TableConfig {
  name: string;
  engine: string;
  schema: ColumnConfig[];
  partitioning: PartitionConfig;
  orderBy: string[];
  settings: Record<string, any>;
}

interface ColumnConfig {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  codec?: string;
}

interface PartitionConfig {
  by: string;
  granularity: 'day' | 'month' | 'year';
}

interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
}

interface ProcessingConfig {
  windows: WindowConfig[];
  aggregations: AggregationConfig[];
  transforms: TransformConfig[];
  enrichment: EnrichmentConfig[];
}

interface WindowConfig {
  name: string;
  type: 'tumbling' | 'sliding' | 'session';
  size: number; // milliseconds
  slide?: number; // for sliding windows
  grace?: number; // late data tolerance
}

interface AggregationConfig {
  name: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'percentile' | 'custom';
  field: string;
  groupBy: string[];
  window: string;
  outputTopic: string;
}

interface TransformConfig {
  name: string;
  inputTopic: string;
  outputTopic: string;
  transformFunction: string;
  schema: SchemaConfig;
}

interface SchemaConfig {
  input: Record<string, string>;
  output: Record<string, string>;
  validation: ValidationRule[];
}

interface ValidationRule {
  field: string;
  type: 'required' | 'range' | 'regex' | 'custom';
  params: any;
}

interface EnrichmentConfig {
  name: string;
  source: 'database' | 'cache' | 'api';
  lookupKey: string;
  fields: string[];
  cacheConfig?: CacheConfig;
}

interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'ttl';
}

interface AnalyticsConfig {
  dashboards: DashboardConfig[];
  alerts: AlertConfig[];
  ml: MLConfig;
  reporting: ReportingConfig;
}

interface DashboardConfig {
  name: string;
  widgets: WidgetConfig[];
  refreshInterval: number;
  filters: FilterConfig[];
}

interface WidgetConfig {
  type: 'timeseries' | 'metric' | 'table' | 'heatmap' | 'geo';
  title: string;
  query: QueryConfig;
  visualization: VisualizationConfig;
}

interface QueryConfig {
  source: 'influxdb' | 'clickhouse' | 'postgres';
  query: string;
  timeRange: string;
  parameters: Record<string, any>;
}

interface VisualizationConfig {
  chart: string;
  options: Record<string, any>;
  thresholds?: ThresholdConfig[];
}

interface ThresholdConfig {
  value: number;
  color: string;
  label: string;
}

interface FilterConfig {
  name: string;
  type: 'time' | 'select' | 'multi-select' | 'text';
  values?: string[];
  default?: any;
}

interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: NotificationChannel[];
  suppressDuration: number;
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  config: Record<string, any>;
}

interface MLConfig {
  models: MLModelConfig[];
  features: FeatureConfig[];
  training: TrainingConfig;
}

interface MLModelConfig {
  name: string;
  type: 'anomaly_detection' | 'forecasting' | 'classification' | 'clustering';
  algorithm: string;
  parameters: Record<string, any>;
  inputFeatures: string[];
  outputTarget: string;
}

interface FeatureConfig {
  name: string;
  expression: string;
  window: string;
  aggregation: string;
}

interface TrainingConfig {
  schedule: string;
  dataSource: string;
  validationSplit: number;
  hyperparameters: Record<string, any>;
}

interface ReportingConfig {
  reports: ReportConfig[];
  schedules: ScheduleConfig[];
  exports: ExportConfig[];
}

interface ReportConfig {
  name: string;
  query: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template: string;
}

interface ScheduleConfig {
  reportName: string;
  cron: string;
  recipients: string[];
  enabled: boolean;
}

interface ExportConfig {
  destination: 'email' | 's3' | 'ftp' | 'api';
  config: Record<string, any>;
}

interface MonitoringConfig {
  metrics: MetricConfig[];
  logging: LogConfig;
  tracing: TracingConfig;
  healthChecks: HealthCheckConfig[];
}

interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  tags: string[];
  description: string;
}

interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  outputs: LogOutput[];
}

interface LogOutput {
  type: 'console' | 'file' | 'elasticsearch' | 'kafka';
  config: Record<string, any>;
}

interface TracingConfig {
  enabled: boolean;
  sampler: number;
  exporter: 'jaeger' | 'zipkin' | 'otlp';
  endpoint: string;
}

interface HealthCheckConfig {
  name: string;
  type: 'kafka' | 'database' | 'service' | 'custom';
  interval: number;
  timeout: number;
  threshold: number;
}

// Event types
interface StreamEvent {
  id: string;
  timestamp: number;
  source: string;
  type: string;
  data: Record<string, any>;
  metadata: EventMetadata;
}

interface EventMetadata {
  version: string;
  contentType: string;
  correlationId?: string;
  causationId?: string;
  partition?: number;
  offset?: string;
}

interface WindowedEvent {
  window: WindowInfo;
  events: StreamEvent[];
  aggregations: Record<string, any>;
  metadata: WindowMetadata;
}

interface WindowInfo {
  start: number;
  end: number;
  type: string;
  size: number;
}

interface WindowMetadata {
  eventCount: number;
  firstEventTime: number;
  lastEventTime: number;
  lateEvents: number;
}

// Core Data Streaming Platform
class DataStreamingPlatform extends EventEmitter {
  private config: StreamingConfig;
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private influxDB: InfluxDBClient;
  private clickHouse: ClickHouseClient;
  private postgres: PostgresPool;
  private redis: any;
  private logger: Logger;
  private app: Express;
  private wsServer: WebSocketServer;

  // Stream processing
  private windows: Map<string, WindowProcessor> = new Map();
  private aggregators: Map<string, Aggregator> = new Map();
  private transformers: Map<string, StreamTransformer> = new Map();
  private enrichers: Map<string, DataEnricher> = new Map();

  // Analytics
  private dashboards: Map<string, Dashboard> = new Map();
  private alerts: Map<string, AlertProcessor> = new Map();
  private mlModels: Map<string, MLModel> = new Map();

  // Monitoring
  private metrics: Map<string, any> = new Map();
  private healthChecks: Map<string, HealthChecker> = new Map();

  constructor(config: StreamingConfig) {
    super();
    this.config = config;

    this.initializeKafka();
    this.initializeStorages();
    this.initializeLogger();
    this.initializeWebServer();
    this.initializeProcessors();
  }

  private initializeKafka(): void {
    this.kafka = new Kafka({
      clientId: this.config.kafka.clientId,
      brokers: this.config.kafka.brokers,
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: this.config.kafka.producers.maxInFlightRequests,
      idempotent: this.config.kafka.producers.idempotent,
      transactionTimeout: this.config.kafka.producers.transactionTimeout,
    });
  }

  private initializeStorages(): void {
    // InfluxDB
    this.influxDB = new InfluxDB({
      url: this.config.influxdb.url,
      token: this.config.influxdb.token,
    });

    // ClickHouse
    this.clickHouse = createClickHouseClient({
      host: this.config.clickhouse.host,
      port: this.config.clickhouse.port,
      username: this.config.clickhouse.username,
      password: this.config.clickhouse.password,
      database: this.config.clickhouse.database,
    });

    // PostgreSQL
    this.postgres = new PostgresPool({
      host: this.config.postgres.host,
      port: this.config.postgres.port,
      database: this.config.postgres.database,
      user: this.config.postgres.username,
      password: this.config.postgres.password,
      ssl: this.config.postgres.ssl,
      max: this.config.postgres.maxConnections,
    });

    // Redis
    this.redis = createClient({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
    });
  }

  private initializeLogger(): void {
    this.logger = createLogger({
      level: this.config.monitoring.logging.level,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        this.config.monitoring.logging.format === 'json' ? format.json() : format.simple()
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'streaming-platform.log' })
      ]
    });
  }

  private initializeWebServer(): void {
    this.app = express();
    this.app.use(express.json());

    this.setupRoutes();
    this.setupWebSocketServer();
  }

  private initializeProcessors(): void {
    // Window processors
    for (const windowConfig of this.config.processing.windows) {
      this.windows.set(windowConfig.name, new WindowProcessor(windowConfig, this.logger));
    }

    // Aggregators
    for (const aggConfig of this.config.processing.aggregations) {
      this.aggregators.set(aggConfig.name, new Aggregator(aggConfig, this.logger));
    }

    // Transformers
    for (const transformConfig of this.config.processing.transforms) {
      this.transformers.set(transformConfig.name, new StreamTransformer(transformConfig, this.logger));
    }

    // Data enrichers
    for (const enrichConfig of this.config.processing.enrichment) {
      this.enrichers.set(enrichConfig.name, new DataEnricher(enrichConfig, this.redis, this.postgres, this.logger));
    }
  }

  async initialize(): Promise<void> {
    try {
      // Connect to services
      await this.producer.connect();
      await this.redis.connect();

      // Create Kafka topics
      await this.createTopics();

      // Initialize storage schemas
      await this.initializeStorageSchemas();

      // Setup consumers
      await this.setupConsumers();

      // Initialize analytics components
      await this.initializeAnalytics();

      // Start health checks
      this.startHealthChecks();

      // Start scheduled jobs
      this.startScheduledJobs();

      this.logger.info('Data Streaming Platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize platform', { error });
      throw error;
    }
  }

  private async createTopics(): Promise<void> {
    const admin = this.kafka.admin();
    await admin.connect();

    const topicsToCreate = this.config.kafka.topics.map(topic => ({
      topic: topic.name,
      numPartitions: topic.partitions,
      replicationFactor: topic.replicationFactor,
      configEntries: [
        ...Object.entries(topic.configs).map(([key, value]) => ({ name: key, value })),
        { name: 'retention.ms', value: topic.retention }
      ]
    }));

    try {
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
      this.logger.info('Kafka topics created', { topics: topicsToCreate.map(t => t.topic) });
    } catch (error) {
      // Topics might already exist
      this.logger.warn('Some topics already exist', { error: error.message });
    } finally {
      await admin.disconnect();
    }
  }

  private async initializeStorageSchemas(): Promise<void> {
    // Initialize InfluxDB buckets
    for (const bucket of this.config.influxdb.buckets) {
      await this.createInfluxDBBucket(bucket);
    }

    // Initialize ClickHouse tables
    for (const table of this.config.clickhouse.tables) {
      await this.createClickHouseTable(table);
    }

    this.logger.info('Storage schemas initialized');
  }

  private async createInfluxDBBucket(bucket: BucketConfig): Promise<void> {
    try {
      const bucketsAPI = this.influxDB.getBucketsAPI(this.config.influxdb.organization);

      const existingBucket = await bucketsAPI.getBuckets({ name: bucket.name });
      if (existingBucket.buckets && existingBucket.buckets.length > 0) {
        this.logger.info('InfluxDB bucket already exists', { bucket: bucket.name });
        return;
      }

      await bucketsAPI.createBucket({
        name: bucket.name,
        description: bucket.description,
        retentionRules: [{
          type: 'expire',
          everySeconds: this.parseDuration(bucket.retention),
        }],
        orgID: this.config.influxdb.organization,
      });

      this.logger.info('InfluxDB bucket created', { bucket: bucket.name });
    } catch (error) {
      this.logger.error('Failed to create InfluxDB bucket', { bucket: bucket.name, error });
    }
  }

  private async createClickHouseTable(table: TableConfig): Promise<void> {
    const columns = table.schema.map(col => {
      let definition = `${col.name} ${col.type}`;
      if (!col.nullable) definition += ' NOT NULL';
      if (col.default !== undefined) definition += ` DEFAULT ${col.default}`;
      if (col.codec) definition += ` CODEC(${col.codec})`;
      return definition;
    }).join(', ');

    const partitionBy = table.partitioning.by;
    const orderBy = table.orderBy.join(', ');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${table.name} (
        ${columns}
      ) ENGINE = ${table.engine}
      PARTITION BY ${partitionBy}
      ORDER BY (${orderBy})
      ${Object.entries(table.settings).map(([key, value]) => `SETTINGS ${key} = ${value}`).join(', ')}
    `;

    try {
      await this.clickHouse.exec({ query: createTableSQL });
      this.logger.info('ClickHouse table created', { table: table.name });
    } catch (error) {
      this.logger.error('Failed to create ClickHouse table', { table: table.name, error });
    }
  }

  private async setupConsumers(): Promise<void> {
    // Create consumers for processing workflows
    for (const aggConfig of this.config.processing.aggregations) {
      await this.createAggregationConsumer(aggConfig);
    }

    for (const transformConfig of this.config.processing.transforms) {
      await this.createTransformConsumer(transformConfig);
    }

    this.logger.info('Stream processing consumers created');
  }

  private async createAggregationConsumer(aggConfig: AggregationConfig): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: `aggregation-${aggConfig.name}`,
      sessionTimeout: this.config.kafka.consumers.sessionTimeout,
      heartbeatInterval: this.config.kafka.consumers.heartbeatInterval,
    });

    await consumer.connect();

    // Subscribe to input topics
    const inputTopics = this.getAggregationInputTopics(aggConfig);
    await consumer.subscribe({ topics: inputTopics });

    await consumer.run({
      autoCommit: this.config.kafka.consumers.autoCommit,
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        try {
          const event = this.parseStreamEvent(message);
          await this.processAggregation(aggConfig, event);
        } catch (error) {
          this.logger.error('Aggregation processing error', {
            aggregation: aggConfig.name,
            topic,
            partition,
            error
          });
        }
      },
    });

    this.consumers.set(`aggregation-${aggConfig.name}`, consumer);
  }

  private async createTransformConsumer(transformConfig: TransformConfig): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: `transform-${transformConfig.name}`,
      sessionTimeout: this.config.kafka.consumers.sessionTimeout,
      heartbeatInterval: this.config.kafka.consumers.heartbeatInterval,
    });

    await consumer.connect();
    await consumer.subscribe({ topics: [transformConfig.inputTopic] });

    await consumer.run({
      autoCommit: this.config.kafka.consumers.autoCommit,
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        try {
          const event = this.parseStreamEvent(message);
          const transformedEvent = await this.processTransformation(transformConfig, event);

          if (transformedEvent) {
            await this.publishEvent(transformConfig.outputTopic, transformedEvent);
          }
        } catch (error) {
          this.logger.error('Transform processing error', {
            transform: transformConfig.name,
            topic,
            partition,
            error
          });
        }
      },
    });

    this.consumers.set(`transform-${transformConfig.name}`, consumer);
  }

  // Event Processing
  async publishEvent(topic: string, event: StreamEvent): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{
          key: event.id,
          value: JSON.stringify(event),
          timestamp: event.timestamp.toString(),
          headers: {
            'event-type': event.type,
            'content-type': event.metadata.contentType,
            'correlation-id': event.metadata.correlationId || '',
          }
        }]
      });

      this.updateMetric('events_published', 1, { topic, type: event.type });
    } catch (error) {
      this.logger.error('Failed to publish event', { topic, event: event.id, error });
      this.updateMetric('events_publish_errors', 1, { topic, type: event.type });
      throw error;
    }
  }

  private parseStreamEvent(message: any): StreamEvent {
    const value = message.value?.toString();
    if (!value) {
      throw new Error('Empty message value');
    }

    try {
      const parsed = JSON.parse(value);
      return {
        id: parsed.id || uuidv4(),
        timestamp: parsed.timestamp || Date.now(),
        source: parsed.source || 'unknown',
        type: parsed.type || 'generic',
        data: parsed.data || {},
        metadata: {
          version: parsed.metadata?.version || '1.0',
          contentType: parsed.metadata?.contentType || 'application/json',
          correlationId: parsed.metadata?.correlationId,
          causationId: parsed.metadata?.causationId,
          partition: message.partition,
          offset: message.offset,
        }
      };
    } catch (error) {
      this.logger.error('Failed to parse stream event', { error });
      throw new Error('Invalid event format');
    }
  }

  private async processAggregation(aggConfig: AggregationConfig, event: StreamEvent): Promise<void> {
    const aggregator = this.aggregators.get(aggConfig.name);
    if (!aggregator) {
      throw new Error(`Aggregator ${aggConfig.name} not found`);
    }

    const windowProcessor = this.windows.get(aggConfig.window);
    if (!windowProcessor) {
      throw new Error(`Window ${aggConfig.window} not found`);
    }

    // Add event to window
    const windowedEvents = await windowProcessor.addEvent(event);

    // Process complete windows
    for (const windowedEvent of windowedEvents) {
      const aggregationResult = await aggregator.aggregate(windowedEvent);

      if (aggregationResult) {
        // Store result
        await this.storeAggregation(aggConfig, aggregationResult);

        // Publish to output topic
        if (aggConfig.outputTopic) {
          const outputEvent: StreamEvent = {
            id: uuidv4(),
            timestamp: Date.now(),
            source: 'aggregator',
            type: `aggregation_${aggConfig.function}`,
            data: aggregationResult,
            metadata: {
              version: '1.0',
              contentType: 'application/json',
            }
          };

          await this.publishEvent(aggConfig.outputTopic, outputEvent);
        }
      }
    }
  }

  private async processTransformation(transformConfig: TransformConfig, event: StreamEvent): Promise<StreamEvent | null> {
    const transformer = this.transformers.get(transformConfig.name);
    if (!transformer) {
      throw new Error(`Transformer ${transformConfig.name} not found`);
    }

    // Validate input
    const isValid = await transformer.validate(event);
    if (!isValid) {
      this.logger.warn('Event validation failed', {
        transform: transformConfig.name,
        event: event.id
      });
      return null;
    }

    // Apply transformation
    const transformedEvent = await transformer.transform(event);

    // Apply enrichment if configured
    for (const enrichConfig of this.config.processing.enrichment) {
      const enricher = this.enrichers.get(enrichConfig.name);
      if (enricher) {
        await enricher.enrich(transformedEvent);
      }
    }

    return transformedEvent;
  }

  // Data Storage
  private async storeAggregation(aggConfig: AggregationConfig, result: any): Promise<void> {
    // Store in time-series database
    await this.storeInInfluxDB(aggConfig.name, result);

    // Store in analytical database
    await this.storeInClickHouse(aggConfig.name, result);

    // Cache recent results
    await this.cacheResult(aggConfig.name, result);
  }

  private async storeInInfluxDB(measurement: string, data: any): Promise<void> {
    const writeApi = this.influxDB.getWriteApi(
      this.config.influxdb.organization,
      this.config.influxdb.buckets[0].name,
      'ms'
    );

    const point = new Point(measurement)
      .timestamp(data.timestamp || new Date());

    // Add fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'timestamp' && key !== 'tags') {
        if (typeof value === 'number') {
          point.floatField(key, value);
        } else if (typeof value === 'boolean') {
          point.booleanField(key, value);
        } else {
          point.stringField(key, String(value));
        }
      }
    });

    // Add tags
    if (data.tags) {
      Object.entries(data.tags).forEach(([key, value]) => {
        point.tag(key, String(value));
      });
    }

    try {
      writeApi.writePoint(point);
      await writeApi.close();
    } catch (error) {
      this.logger.error('Failed to write to InfluxDB', { measurement, error });
    }
  }

  private async storeInClickHouse(table: string, data: any): Promise<void> {
    try {
      const columns = Object.keys(data).join(', ');
      const values = Object.values(data).map(v =>
        typeof v === 'string' ? `'${v}'` : v
      ).join(', ');

      const query = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
      await this.clickHouse.exec({ query });
    } catch (error) {
      this.logger.error('Failed to write to ClickHouse', { table, error });
    }
  }

  private async cacheResult(key: string, data: any): Promise<void> {
    try {
      const cacheKey = `${this.config.redis.keyPrefix}:result:${key}`;
      await this.redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 minutes TTL
    } catch (error) {
      this.logger.error('Failed to cache result', { key, error });
    }
  }

  // Analytics and Monitoring
  private async initializeAnalytics(): Promise<void> {
    // Initialize dashboards
    for (const dashboardConfig of this.config.analytics.dashboards) {
      this.dashboards.set(dashboardConfig.name, new Dashboard(dashboardConfig, this));
    }

    // Initialize alerts
    for (const alertConfig of this.config.analytics.alerts) {
      this.alerts.set(alertConfig.name, new AlertProcessor(alertConfig, this.logger));
    }

    // Initialize ML models
    for (const modelConfig of this.config.analytics.ml.models) {
      this.mlModels.set(modelConfig.name, new MLModel(modelConfig, this.logger));
    }

    this.logger.info('Analytics components initialized');
  }

  private startHealthChecks(): void {
    for (const healthConfig of this.config.monitoring.healthChecks) {
      const checker = new HealthChecker(healthConfig, this.logger);
      this.healthChecks.set(healthConfig.name, checker);
      checker.start();
    }
  }

  private startScheduledJobs(): void {
    // Schedule ML model training
    if (this.config.analytics.ml.training.schedule) {
      cron.schedule(this.config.analytics.ml.training.schedule, async () => {
        await this.trainMLModels();
      });
    }

    // Schedule report generation
    for (const schedule of this.config.analytics.reporting.schedules) {
      if (schedule.enabled) {
        cron.schedule(schedule.cron, async () => {
          await this.generateReport(schedule.reportName);
        });
      }
    }

    // Schedule cleanup jobs
    cron.schedule('0 2 * * *', async () => { // Daily at 2 AM
      await this.cleanupOldData();
    });
  }

  // API Routes
  private setupRoutes(): void {
    // Health endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      const health = await this.getSystemHealth();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Metrics endpoint
    this.app.get('/metrics', (req: Request, res: Response) => {
      const metrics = this.getAllMetrics();
      res.json(metrics);
    });

    // Query endpoint
    this.app.post('/query', async (req: Request, res: Response) => {
      try {
        const result = await this.executeQuery(req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Dashboard data endpoint
    this.app.get('/dashboards/:name/data', async (req: Request, res: Response) => {
      try {
        const dashboard = this.dashboards.get(req.params.name);
        if (!dashboard) {
          return res.status(404).json({ error: 'Dashboard not found' });
        }

        const data = await dashboard.getData(req.query);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Event injection endpoint (for testing)
    this.app.post('/events', async (req: Request, res: Response) => {
      try {
        const event = req.body as StreamEvent;
        event.id = event.id || uuidv4();
        event.timestamp = event.timestamp || Date.now();

        const topic = req.query.topic as string || 'test-events';
        await this.publishEvent(topic, event);

        res.status(201).json({ message: 'Event published', id: event.id });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Alert management
    this.app.get('/alerts', (req: Request, res: Response) => {
      const alerts = Array.from(this.alerts.values()).map(alert => alert.getStatus());
      res.json(alerts);
    });

    this.app.post('/alerts/:name/acknowledge', (req: Request, res: Response) => {
      const alert = this.alerts.get(req.params.name);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      alert.acknowledge();
      res.json({ message: 'Alert acknowledged' });
    });
  }

  private setupWebSocketServer(): void {
    this.wsServer = new WebSocketServer({ port: 8081 });

    this.wsServer.on('connection', (ws: WebSocket) => {
      this.logger.info('WebSocket client connected');

      ws.on('message', async (message: string) => {
        try {
          const request = JSON.parse(message);
          await this.handleWebSocketMessage(ws, request);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.logger.info('WebSocket client disconnected');
      });
    });

    // Broadcast real-time metrics
    setInterval(() => {
      const metrics = this.getAllMetrics();
      this.broadcastToClients({ type: 'metrics', data: metrics });
    }, 5000);
  }

  private async handleWebSocketMessage(ws: WebSocket, request: any): Promise<void> {
    switch (request.type) {
      case 'subscribe_dashboard':
        await this.subscribeToDashboard(ws, request.dashboard);
        break;
      case 'subscribe_alerts':
        await this.subscribeToAlerts(ws);
        break;
      case 'query':
        const result = await this.executeQuery(request.query);
        ws.send(JSON.stringify({ type: 'query_result', data: result, requestId: request.id }));
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown request type' }));
    }
  }

  private broadcastToClients(message: any): void {
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Utility methods
  private updateMetric(name: string, value: number, tags: Record<string, any> = {}): void {
    const key = `${name}:${JSON.stringify(tags)}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);
  }

  private getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of this.metrics.entries()) {
      const [name, tagsJson] = key.split(':');
      const tags = tagsJson ? JSON.parse(tagsJson) : {};

      if (!result[name]) {
        result[name] = [];
      }

      result[name].push({ value, tags });
    }

    return result;
  }

  private async getSystemHealth(): Promise<any> {
    const healthChecks = Array.from(this.healthChecks.values());
    const results = await Promise.all(
      healthChecks.map(checker => checker.check())
    );

    const allHealthy = results.every(result => result.healthy);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      checks: results,
      uptime: process.uptime(),
      version: process.env.VERSION || '1.0.0'
    };
  }

  private async executeQuery(queryConfig: QueryConfig): Promise<any> {
    switch (queryConfig.source) {
      case 'influxdb':
        return this.executeInfluxDBQuery(queryConfig);
      case 'clickhouse':
        return this.executeClickHouseQuery(queryConfig);
      case 'postgres':
        return this.executePostgresQuery(queryConfig);
      default:
        throw new Error(`Unsupported query source: ${queryConfig.source}`);
    }
  }

  private async executeInfluxDBQuery(queryConfig: QueryConfig): Promise<any> {
    const queryApi = this.influxDB.getQueryApi(this.config.influxdb.organization);
    const query = this.interpolateQuery(queryConfig.query, queryConfig.parameters);

    const result: any[] = [];

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row: any, tableMeta: any) {
          result.push(tableMeta.toObject(row));
        },
        error(error: Error) {
          reject(error);
        },
        complete() {
          resolve(result);
        },
      });
    });
  }

  private async executeClickHouseQuery(queryConfig: QueryConfig): Promise<any> {
    const query = this.interpolateQuery(queryConfig.query, queryConfig.parameters);
    const result = await this.clickHouse.query({ query });
    return result.json();
  }

  private async executePostgresQuery(queryConfig: QueryConfig): Promise<any> {
    const query = this.interpolateQuery(queryConfig.query, queryConfig.parameters);
    const client = await this.postgres.connect();

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  private interpolateQuery(query: string, parameters: Record<string, any>): string {
    let interpolated = query;

    Object.entries(parameters).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      interpolated = interpolated.replace(regex, String(value));
    });

    return interpolated;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const [, value, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(value) * (multipliers[unit as keyof typeof multipliers] || 3600);
  }

  private getAggregationInputTopics(aggConfig: AggregationConfig): string[] {
    // Determine input topics based on aggregation configuration
    // This is a simplified implementation
    return ['input-events'];
  }

  private async subscribeToDashboard(ws: WebSocket, dashboardName: string): Promise<void> {
    // Implementation for dashboard subscription
    this.logger.info('Client subscribed to dashboard', { dashboard: dashboardName });
  }

  private async subscribeToAlerts(ws: WebSocket): Promise<void> {
    // Implementation for alert subscription
    this.logger.info('Client subscribed to alerts');
  }

  private async trainMLModels(): Promise<void> {
    this.logger.info('Starting ML model training...');

    for (const [name, model] of this.mlModels.entries()) {
      try {
        await model.train();
        this.logger.info('ML model trained successfully', { model: name });
      } catch (error) {
        this.logger.error('ML model training failed', { model: name, error });
      }
    }
  }

  private async generateReport(reportName: string): Promise<void> {
    this.logger.info('Generating report', { report: reportName });
    // Report generation implementation
  }

  private async cleanupOldData(): Promise<void> {
    this.logger.info('Starting data cleanup...');

    // Cleanup old metrics
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [key] of this.metrics.entries()) {
      // Remove old metric entries
      // Implementation would depend on metric storage format
    }

    this.logger.info('Data cleanup completed');
  }

  public async start(port: number = 8080): Promise<void> {
    await this.initialize();

    this.app.listen(port, () => {
      this.logger.info(`Data Streaming Platform API running on port ${port}`);
      this.logger.info(`WebSocket server running on port 8081`);
    });
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down Data Streaming Platform...');

    // Close consumers
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }

    // Close producer
    await this.producer.disconnect();

    // Close database connections
    await this.postgres.end();
    await this.redis.disconnect();

    // Stop health checks
    for (const checker of this.healthChecks.values()) {
      checker.stop();
    }

    this.logger.info('Data Streaming Platform shutdown complete');
  }
}

// Supporting classes (simplified implementations)
class WindowProcessor {
  constructor(private config: WindowConfig, private logger: Logger) {}

  async addEvent(event: StreamEvent): Promise<WindowedEvent[]> {
    // Window processing implementation
    return [];
  }
}

class Aggregator {
  constructor(private config: AggregationConfig, private logger: Logger) {}

  async aggregate(windowedEvent: WindowedEvent): Promise<any> {
    // Aggregation implementation
    return {};
  }
}

class StreamTransformer {
  constructor(private config: TransformConfig, private logger: Logger) {}

  async validate(event: StreamEvent): Promise<boolean> {
    // Validation implementation
    return true;
  }

  async transform(event: StreamEvent): Promise<StreamEvent> {
    // Transformation implementation
    return event;
  }
}

class DataEnricher {
  constructor(
    private config: EnrichmentConfig,
    private redis: any,
    private postgres: PostgresPool,
    private logger: Logger
  ) {}

  async enrich(event: StreamEvent): Promise<void> {
    // Enrichment implementation
  }
}

class Dashboard {
  constructor(private config: DashboardConfig, private platform: DataStreamingPlatform) {}

  async getData(query: any): Promise<any> {
    // Dashboard data implementation
    return {};
  }
}

class AlertProcessor {
  constructor(private config: AlertConfig, private logger: Logger) {}

  getStatus(): any {
    // Alert status implementation
    return { name: this.config.name, status: 'ok' };
  }

  acknowledge(): void {
    // Alert acknowledgment implementation
  }
}

class MLModel {
  constructor(private config: MLModelConfig, private logger: Logger) {}

  async train(): Promise<void> {
    // ML training implementation
  }
}

class HealthChecker {
  constructor(private config: HealthCheckConfig, private logger: Logger) {}

  start(): void {
    // Health check start implementation
  }

  stop(): void {
    // Health check stop implementation
  }

  async check(): Promise<{ healthy: boolean; name: string; message?: string }> {
    // Health check implementation
    return { healthy: true, name: this.config.name };
  }
}

// Example usage
export async function createDataStreamingExample(): Promise<void> {
  const config: StreamingConfig = {
    kafka: {
      brokers: ['localhost:9092'],
      clientId: 'streaming-platform',
      topics: [
        {
          name: 'events',
          partitions: 6,
          replicationFactor: 1,
          configs: { 'cleanup.policy': 'delete' },
          retention: '86400000', // 1 day
        },
        {
          name: 'aggregations',
          partitions: 3,
          replicationFactor: 1,
          configs: { 'cleanup.policy': 'compact' },
          retention: '604800000', // 7 days
        },
      ],
      producers: {
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
        acks: 1,
        compression: 'gzip',
      },
      consumers: {
        groupId: 'streaming-platform',
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxPollRecords: 500,
        autoCommit: false,
      },
    },
    influxdb: {
      url: 'http://localhost:8086',
      token: 'your-influxdb-token',
      organization: 'your-org',
      buckets: [
        {
          name: 'metrics',
          retention: '30d',
          description: 'Real-time metrics',
          shardGroupDuration: '1h',
        },
      ],
      retentionPolicies: [],
    },
    clickhouse: {
      host: 'localhost',
      port: 8123,
      username: 'default',
      password: '',
      database: 'analytics',
      tables: [
        {
          name: 'events',
          engine: 'MergeTree',
          schema: [
            { name: 'timestamp', type: 'DateTime64', nullable: false },
            { name: 'event_type', type: 'String', nullable: false },
            { name: 'user_id', type: 'String', nullable: true },
            { name: 'data', type: 'String', nullable: false },
          ],
          partitioning: { by: 'toYYYYMM(timestamp)', granularity: 'month' },
          orderBy: ['timestamp', 'event_type'],
          settings: {},
        },
      ],
    },
    postgres: {
      host: 'localhost',
      port: 5432,
      database: 'streaming_platform',
      username: 'postgres',
      password: 'password',
      ssl: false,
      maxConnections: 20,
    },
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0,
      keyPrefix: 'streaming',
    },
    processing: {
      windows: [
        {
          name: 'minute-window',
          type: 'tumbling',
          size: 60000, // 1 minute
          grace: 5000, // 5 seconds late data tolerance
        },
      ],
      aggregations: [
        {
          name: 'event-count',
          function: 'count',
          field: '*',
          groupBy: ['event_type'],
          window: 'minute-window',
          outputTopic: 'aggregations',
        },
      ],
      transforms: [
        {
          name: 'event-enrichment',
          inputTopic: 'raw-events',
          outputTopic: 'events',
          transformFunction: 'enrich',
          schema: {
            input: { event_type: 'string', data: 'object' },
            output: { event_type: 'string', data: 'object', enriched_at: 'timestamp' },
            validation: [
              { field: 'event_type', type: 'required', params: {} },
              { field: 'data', type: 'required', params: {} },
            ],
          },
        },
      ],
      enrichment: [
        {
          name: 'user-enrichment',
          source: 'database',
          lookupKey: 'user_id',
          fields: ['email', 'segment', 'created_at'],
        },
      ],
    },
    analytics: {
      dashboards: [
        {
          name: 'real-time-metrics',
          widgets: [
            {
              type: 'timeseries',
              title: 'Events per Minute',
              query: {
                source: 'influxdb',
                query: 'SELECT count(*) FROM events WHERE time > now() - 1h GROUP BY time(1m)',
                timeRange: '1h',
                parameters: {},
              },
              visualization: {
                chart: 'line',
                options: { smooth: true },
              },
            },
          ],
          refreshInterval: 30000, // 30 seconds
          filters: [],
        },
      ],
      alerts: [
        {
          name: 'high-error-rate',
          condition: 'error_rate > threshold',
          threshold: 0.05,
          severity: 'high',
          channels: [
            {
              type: 'email',
              config: { recipients: ['alerts@example.com'] },
            },
          ],
          suppressDuration: 300000, // 5 minutes
        },
      ],
      ml: {
        models: [
          {
            name: 'anomaly-detector',
            type: 'anomaly_detection',
            algorithm: 'isolation_forest',
            parameters: { contamination: 0.1 },
            inputFeatures: ['event_count', 'error_rate'],
            outputTarget: 'anomaly_score',
          },
        ],
        features: [
          {
            name: 'event_count',
            expression: 'COUNT(*)',
            window: '5m',
            aggregation: 'sum',
          },
        ],
        training: {
          schedule: '0 2 * * *', // Daily at 2 AM
          dataSource: 'historical_events',
          validationSplit: 0.2,
          hyperparameters: {},
        },
      },
      reporting: {
        reports: [
          {
            name: 'daily-summary',
            query: 'SELECT * FROM daily_metrics WHERE date = $date',
            format: 'pdf',
            template: 'daily-report-template',
          },
        ],
        schedules: [
          {
            reportName: 'daily-summary',
            cron: '0 9 * * *', // Daily at 9 AM
            recipients: ['reports@example.com'],
            enabled: true,
          },
        ],
        exports: [
          {
            destination: 'email',
            config: { smtp: 'smtp.example.com' },
          },
        ],
      },
    },
    monitoring: {
      metrics: [
        {
          name: 'events_processed',
          type: 'counter',
          tags: ['topic', 'partition'],
          description: 'Number of events processed',
        },
      ],
      logging: {
        level: 'info',
        format: 'json',
        outputs: [
          { type: 'console', config: {} },
          { type: 'file', config: { filename: 'streaming.log' } },
        ],
      },
      tracing: {
        enabled: true,
        sampler: 0.1,
        exporter: 'jaeger',
        endpoint: 'http://localhost:14268/api/traces',
      },
      healthChecks: [
        {
          name: 'kafka',
          type: 'kafka',
          interval: 30000,
          timeout: 5000,
          threshold: 3,
        },
        {
          name: 'influxdb',
          type: 'database',
          interval: 30000,
          timeout: 5000,
          threshold: 3,
        },
      ],
    },
  };

  const platform = new DataStreamingPlatform(config);
  await platform.start(8080);

  console.log('Data Streaming & Real-time Analytics Platform running');
}

export { DataStreamingPlatform, StreamingConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Real-time data processing is needed
- Stream processing implementation is required
- Time-series database optimization is requested
- Event-driven architecture is needed
- Complex event processing is required
- Real-time analytics and monitoring is requested

This comprehensive data streaming and real-time analytics skill provides expert-level capabilities for building modern, scalable streaming platforms with advanced processing, analytics, and optimization features.