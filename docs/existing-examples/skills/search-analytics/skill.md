# Search & Analytics Skill

Advanced search and analytics platform expertise covering Elasticsearch, data indexing, full-text search, and comprehensive search platform engineering with modern analytics, observability, and enterprise search capabilities.

## Skill Overview

Expert search and analytics knowledge including Elasticsearch optimization, search relevance tuning, analytics dashboards, log analysis, and modern search platform engineering with advanced indexing, querying, aggregation, and real-time analytics patterns.

## Core Capabilities

### Elasticsearch & Search Engines
- **Cluster management** - Node configuration, sharding strategies, replication, cluster health monitoring
- **Index optimization** - Mapping design, field types, analyzers, index templates, lifecycle policies
- **Query optimization** - Query DSL, search relevance, scoring algorithms, performance tuning
- **Aggregation frameworks** - Bucket aggregations, metric aggregations, pipeline aggregations, real-time analytics

### Data Indexing & Processing
- **Ingestion pipelines** - Logstash, Filebeat, custom processors, data transformation, enrichment
- **Real-time indexing** - Streaming data, bulk operations, index refresh strategies, near real-time search
- **Schema design** - Dynamic mapping, field mapping, analyzers, tokenizers, custom plugins
- **Data lifecycle** - Hot-warm-cold architecture, index rollover, data retention, archival strategies

### Search & Analytics Platforms
- **Enterprise search** - Document search, faceted search, autocomplete, spell correction, personalization
- **Log analytics** - ELK stack, log parsing, alerting, anomaly detection, operational intelligence
- **Business intelligence** - Kibana dashboards, visualizations, reporting, KPI monitoring
- **Search-as-a-Service** - API design, multi-tenancy, security, scaling, performance optimization

### Observability & Monitoring
- **Performance monitoring** - Query performance, indexing metrics, cluster health, resource utilization
- **Alerting systems** - Threshold alerts, anomaly detection, notification channels, escalation
- **Capacity planning** - Storage forecasting, performance modeling, scaling strategies
- **Security monitoring** - Access control, audit logging, threat detection, compliance reporting

## Modern Search Analytics Platform Implementation

### Comprehensive Search & Analytics Platform with Elasticsearch
```typescript
// Advanced search and analytics platform with Elasticsearch, real-time indexing, and dashboards
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { KibanaClient } from '@elastic/kibana-client'; // Hypothetical client
import express, { Express, Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import { createReadStream, createWriteStream } from 'fs';
import { Transform, pipeline } from 'stream';
import { promisify } from 'util';
import Bull from 'bull';
import cron from 'node-cron';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

// Types and interfaces
interface SearchPlatformConfig {
  elasticsearch: ElasticsearchConfig;
  indexing: IndexingConfig;
  search: SearchConfig;
  analytics: AnalyticsConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
}

interface ElasticsearchConfig {
  nodes: ElasticsearchNode[];
  cluster: ClusterConfig;
  indices: IndexConfig[];
  templates: IndexTemplateConfig[];
}

interface ElasticsearchNode {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  auth?: {
    username: string;
    password: string;
  };
  roles: ('master' | 'data' | 'ingest' | 'coordinating')[];
}

interface ClusterConfig {
  name: string;
  shards: ShardConfig;
  replication: ReplicationConfig;
  allocation: AllocationConfig;
}

interface ShardConfig {
  defaultShards: number;
  maxShardsPerNode: number;
  routingAllocation: boolean;
}

interface ReplicationConfig {
  defaultReplicas: number;
  autoExpandReplicas: boolean;
  waitForActiveShards: number;
}

interface AllocationConfig {
  awareness: boolean;
  attributes: string[];
  totalShardsPerNode: number;
}

interface IndexConfig {
  name: string;
  pattern: string;
  settings: IndexSettings;
  mappings: IndexMappings;
  aliases: string[];
  lifecycle: LifecyclePolicy;
}

interface IndexSettings {
  numberOfShards: number;
  numberOfReplicas: number;
  refreshInterval: string;
  maxResultWindow: number;
  analysis: AnalysisSettings;
}

interface AnalysisSettings {
  analyzers: AnalyzerConfig[];
  tokenizers: TokenizerConfig[];
  filters: FilterConfig[];
  normalizers: NormalizerConfig[];
}

interface AnalyzerConfig {
  name: string;
  type: 'custom' | 'standard' | 'simple' | 'whitespace' | 'keyword';
  tokenizer: string;
  filters: string[];
  charFilters?: string[];
}

interface TokenizerConfig {
  name: string;
  type: 'standard' | 'keyword' | 'pattern' | 'edge_ngram' | 'ngram';
  pattern?: string;
  flags?: string;
  minGram?: number;
  maxGram?: number;
}

interface FilterConfig {
  name: string;
  type: 'lowercase' | 'uppercase' | 'stop' | 'stemmer' | 'synonym' | 'ngram';
  stopwords?: string[];
  synonyms?: string[];
  language?: string;
}

interface NormalizerConfig {
  name: string;
  type: 'custom';
  charFilters?: string[];
  filters: string[];
}

interface IndexMappings {
  properties: Record<string, FieldMapping>;
  dynamicTemplates?: DynamicTemplate[];
  dynamic?: boolean | 'strict';
  dateDetection?: boolean;
  numericDetection?: boolean;
}

interface FieldMapping {
  type: 'text' | 'keyword' | 'date' | 'long' | 'double' | 'boolean' | 'ip' | 'geo_point' | 'object' | 'nested';
  analyzer?: string;
  searchAnalyzer?: string;
  fields?: Record<string, FieldMapping>;
  properties?: Record<string, FieldMapping>;
  format?: string;
  index?: boolean;
  store?: boolean;
  docValues?: boolean;
}

interface DynamicTemplate {
  name: string;
  match?: string;
  pathMatch?: string;
  matchMappingType?: string;
  mapping: FieldMapping;
}

interface LifecyclePolicy {
  name: string;
  phases: LifecyclePhase[];
}

interface LifecyclePhase {
  name: 'hot' | 'warm' | 'cold' | 'frozen' | 'delete';
  minAge: string;
  actions: LifecycleAction[];
}

interface LifecycleAction {
  type: 'rollover' | 'shrink' | 'allocate' | 'migrate' | 'readonly' | 'delete';
  params: Record<string, any>;
}

interface IndexTemplateConfig {
  name: string;
  indexPatterns: string[];
  version: number;
  priority: number;
  settings: IndexSettings;
  mappings: IndexMappings;
  aliases: Record<string, any>;
}

interface IndexingConfig {
  pipelines: IndexingPipeline[];
  processors: ProcessorConfig[];
  bulkSettings: BulkSettings;
  realTime: RealTimeConfig;
}

interface IndexingPipeline {
  name: string;
  description: string;
  processors: ProcessorStep[];
  onFailure?: ProcessorStep[];
  version: number;
}

interface ProcessorStep {
  type: string;
  params: Record<string, any>;
  onFailure?: ProcessorStep[];
  if?: string;
  tag?: string;
}

interface ProcessorConfig {
  name: string;
  type: 'ingest' | 'logstash' | 'beats' | 'custom';
  source: ProcessorSource;
  transformation: TransformationConfig;
  output: OutputConfig;
}

interface ProcessorSource {
  type: 'file' | 'kafka' | 'http' | 'database' | 'syslog';
  config: Record<string, any>;
}

interface TransformationConfig {
  parsers: ParserConfig[];
  enrichment: EnrichmentConfig[];
  filtering: FilteringConfig[];
}

interface ParserConfig {
  type: 'json' | 'csv' | 'grok' | 'kv' | 'xml' | 'multiline';
  pattern?: string;
  fields?: string[];
  separator?: string;
}

interface EnrichmentConfig {
  type: 'geoip' | 'user_agent' | 'dns' | 'database' | 'api';
  source: string;
  target: string;
  cache?: boolean;
}

interface FilteringConfig {
  type: 'drop' | 'mutate' | 'date' | 'ruby' | 'throttle';
  condition?: string;
  params: Record<string, any>;
}

interface OutputConfig {
  index: string;
  docType?: string;
  routing?: string;
  pipeline?: string;
}

interface BulkSettings {
  size: number;
  flushInterval: number;
  maxRetries: number;
  backoffTime: number;
  compression: boolean;
}

interface RealTimeConfig {
  enabled: boolean;
  refreshInterval: string;
  translogSettings: TranslogSettings;
}

interface TranslogSettings {
  syncInterval: string;
  durability: 'request' | 'async';
  flushThreshold: string;
}

interface SearchConfig {
  endpoints: SearchEndpoint[];
  features: SearchFeatures;
  relevance: RelevanceConfig;
  performance: SearchPerformanceConfig;
}

interface SearchEndpoint {
  path: string;
  type: 'full-text' | 'structured' | 'autocomplete' | 'suggest' | 'more-like-this';
  indices: string[];
  defaultSize: number;
  maxSize: number;
  timeout: string;
  authentication: boolean;
}

interface SearchFeatures {
  highlighting: HighlightingConfig;
  facets: FacetConfig[];
  suggestions: SuggestionConfig;
  personalization: PersonalizationConfig;
}

interface HighlightingConfig {
  enabled: boolean;
  fields: string[];
  fragmentSize: number;
  numberOfFragments: number;
  type: 'unified' | 'plain' | 'fvh';
}

interface FacetConfig {
  field: string;
  type: 'terms' | 'range' | 'date_range' | 'histogram' | 'geo_distance';
  size: number;
  params: Record<string, any>;
}

interface SuggestionConfig {
  enabled: boolean;
  types: ('term' | 'phrase' | 'completion')[];
  fields: string[];
  maxSuggestions: number;
}

interface PersonalizationConfig {
  enabled: boolean;
  userProfiles: boolean;
  behaviorTracking: boolean;
  recommendations: boolean;
}

interface RelevanceConfig {
  scoring: ScoringConfig;
  boosting: BoostingConfig;
  functions: ScoringFunction[];
}

interface ScoringConfig {
  model: 'BM25' | 'DFR' | 'IB' | 'LMDirichlet' | 'LMJelinekMercer';
  params: Record<string, any>;
}

interface BoostingConfig {
  fieldBoosts: Record<string, number>;
  timeDecay: TimeDecayConfig;
  popularity: PopularityConfig;
}

interface TimeDecayConfig {
  enabled: boolean;
  field: string;
  scale: string;
  decay: number;
}

interface PopularityConfig {
  enabled: boolean;
  field: string;
  modifier: 'none' | 'log' | 'log1p' | 'log2p' | 'ln' | 'ln1p' | 'ln2p' | 'square' | 'sqrt' | 'reciprocal';
}

interface ScoringFunction {
  type: 'script_score' | 'weight' | 'random_score' | 'field_value_factor' | 'decay';
  filter?: any;
  params: Record<string, any>;
}

interface SearchPerformanceConfig {
  caching: CachingConfig;
  routing: RoutingConfig;
  optimization: OptimizationConfig;
}

interface CachingConfig {
  queryCache: boolean;
  requestCache: boolean;
  fieldDataCache: boolean;
  sizes: Record<string, string>;
}

interface RoutingConfig {
  preferLocal: boolean;
  awareness: boolean;
  allocation: AllocationConfig;
}

interface OptimizationConfig {
  indexSorting: boolean;
  forcemerge: boolean;
  prefiltering: boolean;
}

interface AnalyticsConfig {
  dashboards: DashboardConfig[];
  visualizations: VisualizationConfig[];
  alerts: AlertConfig[];
  reports: ReportConfig[];
}

interface DashboardConfig {
  name: string;
  description: string;
  widgets: WidgetConfig[];
  filters: FilterConfig[];
  refreshInterval: number;
  timeRange: TimeRangeConfig;
}

interface WidgetConfig {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'heatmap' | 'timeline';
  title: string;
  query: QueryConfig;
  visualization: VisualizationSettings;
  position: WidgetPosition;
}

interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QueryConfig {
  index: string;
  query: any;
  aggregations?: any;
  size?: number;
  sort?: any[];
}

interface VisualizationSettings {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  axes?: AxisConfig[];
  colors?: string[];
  legend?: boolean;
  annotations?: AnnotationConfig[];
}

interface AxisConfig {
  position: 'left' | 'right' | 'top' | 'bottom';
  title: string;
  scale: 'linear' | 'logarithmic' | 'time';
}

interface AnnotationConfig {
  type: 'line' | 'range' | 'text';
  value: any;
  style: Record<string, any>;
}

interface VisualizationConfig {
  name: string;
  type: 'line' | 'area' | 'bar' | 'pie' | 'metric' | 'table' | 'heatmap';
  dataSource: DataSourceConfig;
  settings: VisualizationSettings;
}

interface DataSourceConfig {
  index: string;
  timeField: string;
  metrics: MetricConfig[];
  buckets: BucketConfig[];
}

interface MetricConfig {
  type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'cardinality' | 'percentiles';
  field?: string;
  params?: Record<string, any>;
}

interface BucketConfig {
  type: 'date_histogram' | 'histogram' | 'terms' | 'range' | 'filters';
  field?: string;
  params: Record<string, any>;
}

interface AlertConfig {
  name: string;
  description: string;
  condition: AlertCondition;
  actions: AlertAction[];
  schedule: string;
  enabled: boolean;
}

interface AlertCondition {
  type: 'threshold' | 'anomaly' | 'cardinality' | 'frequency';
  query: any;
  threshold?: number;
  timeWindow: string;
  comparison: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
}

interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'index' | 'log';
  config: Record<string, any>;
}

interface ReportConfig {
  name: string;
  description: string;
  type: 'dashboard' | 'search' | 'custom';
  source: string;
  schedule: string;
  format: 'pdf' | 'csv' | 'json';
  delivery: DeliveryConfig;
}

interface DeliveryConfig {
  method: 'email' | 'webhook' | 'storage';
  recipients?: string[];
  config: Record<string, any>;
}

interface FilterConfig {
  name: string;
  type: 'term' | 'range' | 'exists' | 'wildcard' | 'regexp';
  field?: string;
  params: Record<string, any>;
}

interface TimeRangeConfig {
  type: 'relative' | 'absolute';
  value: string;
  from?: string;
  to?: string;
}

interface MonitoringConfig {
  cluster: ClusterMonitoringConfig;
  performance: PerformanceMonitoringConfig;
  capacity: CapacityMonitoringConfig;
  alerts: MonitoringAlertConfig[];
}

interface ClusterMonitoringConfig {
  health: boolean;
  nodes: boolean;
  indices: boolean;
  shards: boolean;
  tasks: boolean;
}

interface PerformanceMonitoringConfig {
  queries: boolean;
  indexing: boolean;
  search: boolean;
  gc: boolean;
  jvm: boolean;
}

interface CapacityMonitoringConfig {
  storage: boolean;
  memory: boolean;
  cpu: boolean;
  network: boolean;
  forecasting: boolean;
}

interface MonitoringAlertConfig {
  name: string;
  metric: string;
  threshold: number;
  duration: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[];
}

interface SecurityConfig {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  auditing: AuditingConfig;
}

interface AuthenticationConfig {
  enabled: boolean;
  methods: ('native' | 'ldap' | 'saml' | 'oidc')[];
  tokenExpiration: number;
  passwordPolicy: PasswordPolicy;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
}

interface AuthorizationConfig {
  enabled: boolean;
  rbac: boolean;
  roles: RoleConfig[];
  fieldSecurity: boolean;
  documentSecurity: boolean;
}

interface RoleConfig {
  name: string;
  cluster: string[];
  indices: IndexPermission[];
}

interface IndexPermission {
  names: string[];
  privileges: string[];
  fieldGrants?: string[];
  query?: any;
}

interface EncryptionConfig {
  transport: boolean;
  http: boolean;
  atRest: boolean;
  algorithms: string[];
}

interface AuditingConfig {
  enabled: boolean;
  events: string[];
  outputs: AuditOutputConfig[];
  filters: AuditFilterConfig[];
}

interface AuditOutputConfig {
  type: 'logfile' | 'index' | 'webhook';
  config: Record<string, any>;
}

interface AuditFilterConfig {
  type: 'include' | 'exclude';
  users?: string[];
  actions?: string[];
  indices?: string[];
}

// Core Search Platform
class SearchAnalyticsPlatform extends EventEmitter {
  private config: SearchPlatformConfig;
  private elasticsearch: ElasticsearchClient;
  private redis: Redis;
  private logger: Logger;
  private app: Express;
  private wsServer: WebSocketServer;
  private indexingQueue: Bull.Queue;
  private alertingQueue: Bull.Queue;
  private dashboards: Map<string, Dashboard> = new Map();
  private alerts: Map<string, Alert> = new Map();

  constructor(config: SearchPlatformConfig) {
    super();
    this.config = config;

    this.setupLogger();
    this.setupElasticsearch();
    this.setupRedis();
    this.setupQueues();
    this.setupExpress();
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
        new transports.File({ filename: 'search-platform.log' })
      ]
    });
  }

  private setupElasticsearch(): void {
    this.elasticsearch = new ElasticsearchClient({
      nodes: this.config.elasticsearch.nodes.map(node => ({
        url: `${node.protocol}://${node.host}:${node.port}`,
        auth: node.auth ? {
          username: node.auth.username,
          password: node.auth.password,
        } : undefined,
      })),
      maxRetries: 3,
      requestTimeout: 30000,
      sniffOnStart: true,
      sniffInterval: 300000,
    });
  }

  private setupRedis(): void {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  private setupQueues(): void {
    this.indexingQueue = new Bull('indexing', {
      redis: { host: 'localhost', port: 6379 },
    });

    this.alertingQueue = new Bull('alerting', {
      redis: { host: 'localhost', port: 6379 },
    });

    this.setupQueueProcessors();
  }

  private setupQueueProcessors(): void {
    this.indexingQueue.process('bulk-index', 10, this.processBulkIndexing.bind(this));
    this.alertingQueue.process('check-alert', 5, this.processAlert.bind(this));
  }

  private setupExpress(): void {
    this.app = express();
    this.app.use(express.json({ limit: '10mb' }));
    this.setupRoutes();
    this.setupWebSocket();
  }

  async initialize(): Promise<void> {
    try {
      // Check Elasticsearch cluster health
      await this.checkClusterHealth();

      // Create index templates
      await this.createIndexTemplates();

      // Create indices
      await this.createIndices();

      // Setup ingest pipelines
      await this.createIngestPipelines();

      // Initialize dashboards
      await this.initializeDashboards();

      // Initialize alerts
      await this.initializeAlerts();

      // Start scheduled jobs
      this.startScheduledJobs();

      this.logger.info('Search Analytics Platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize search platform', { error });
      throw error;
    }
  }

  private async checkClusterHealth(): Promise<void> {
    try {
      const health = await this.elasticsearch.cluster.health();

      if (health.status === 'red') {
        throw new Error('Elasticsearch cluster is in red status');
      }

      this.logger.info('Elasticsearch cluster health', {
        status: health.status,
        nodes: health.number_of_nodes,
        dataNodes: health.number_of_data_nodes,
      });
    } catch (error) {
      this.logger.error('Cluster health check failed', { error });
      throw error;
    }
  }

  private async createIndexTemplates(): Promise<void> {
    for (const template of this.config.elasticsearch.templates) {
      try {
        await this.elasticsearch.indices.putIndexTemplate({
          name: template.name,
          body: {
            index_patterns: template.indexPatterns,
            version: template.version,
            priority: template.priority,
            template: {
              settings: template.settings,
              mappings: template.mappings,
              aliases: template.aliases,
            },
          },
        });

        this.logger.info('Index template created', { name: template.name });
      } catch (error) {
        this.logger.error('Failed to create index template', { name: template.name, error });
        throw error;
      }
    }
  }

  private async createIndices(): Promise<void> {
    for (const indexConfig of this.config.elasticsearch.indices) {
      try {
        const exists = await this.elasticsearch.indices.exists({
          index: indexConfig.name,
        });

        if (!exists) {
          await this.elasticsearch.indices.create({
            index: indexConfig.name,
            body: {
              settings: indexConfig.settings,
              mappings: indexConfig.mappings,
              aliases: indexConfig.aliases.reduce((acc, alias) => {
                acc[alias] = {};
                return acc;
              }, {} as Record<string, any>),
            },
          });

          this.logger.info('Index created', { name: indexConfig.name });
        }
      } catch (error) {
        this.logger.error('Failed to create index', { name: indexConfig.name, error });
        throw error;
      }
    }
  }

  private async createIngestPipelines(): Promise<void> {
    for (const pipeline of this.config.indexing.pipelines) {
      try {
        await this.elasticsearch.ingest.putPipeline({
          id: pipeline.name,
          body: {
            description: pipeline.description,
            version: pipeline.version,
            processors: pipeline.processors,
            on_failure: pipeline.onFailure,
          },
        });

        this.logger.info('Ingest pipeline created', { name: pipeline.name });
      } catch (error) {
        this.logger.error('Failed to create ingest pipeline', { name: pipeline.name, error });
        throw error;
      }
    }
  }

  // Search Operations
  async search(params: SearchParams): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // Build Elasticsearch query
      const query = this.buildQuery(params);

      // Execute search
      const response = await this.elasticsearch.search({
        index: params.index,
        body: query,
        size: params.size || 10,
        from: params.from || 0,
        timeout: params.timeout || '30s',
        routing: params.routing,
        preference: params.preference,
      });

      // Process results
      const result = this.processSearchResponse(response, params);

      // Track search metrics
      const executionTime = Date.now() - startTime;
      await this.trackSearchMetrics({
        index: params.index,
        queryType: params.type,
        executionTime,
        resultCount: result.total,
      });

      return result;
    } catch (error) {
      this.logger.error('Search failed', { params, error });
      throw error;
    }
  }

  private buildQuery(params: SearchParams): any {
    const query: any = {
      query: {},
      highlight: {},
      aggregations: {},
      sort: [],
    };

    // Build main query
    switch (params.type) {
      case 'full-text':
        query.query = this.buildFullTextQuery(params);
        break;
      case 'structured':
        query.query = this.buildStructuredQuery(params);
        break;
      case 'autocomplete':
        query.query = this.buildAutocompleteQuery(params);
        break;
      default:
        query.query = { match_all: {} };
    }

    // Add filters
    if (params.filters && params.filters.length > 0) {
      query.query = {
        bool: {
          must: query.query,
          filter: params.filters.map(f => this.buildFilter(f)),
        },
      };
    }

    // Add aggregations
    if (params.facets) {
      query.aggs = this.buildAggregations(params.facets);
    }

    // Add highlighting
    if (params.highlight) {
      query.highlight = this.buildHighlighting(params.highlight);
    }

    // Add sorting
    if (params.sort) {
      query.sort = this.buildSorting(params.sort);
    }

    return query;
  }

  private buildFullTextQuery(params: SearchParams): any {
    if (!params.query) {
      return { match_all: {} };
    }

    return {
      multi_match: {
        query: params.query,
        fields: params.fields || ['*'],
        type: 'best_fields',
        fuzziness: 'AUTO',
        prefix_length: 2,
        max_expansions: 50,
      },
    };
  }

  private buildStructuredQuery(params: SearchParams): any {
    const must: any[] = [];

    if (params.query) {
      must.push({
        query_string: {
          query: params.query,
          default_field: '_all',
          analyze_wildcard: true,
        },
      });
    }

    return must.length > 0 ? { bool: { must } } : { match_all: {} };
  }

  private buildAutocompleteQuery(params: SearchParams): any {
    if (!params.query) {
      return { match_all: {} };
    }

    return {
      bool: {
        should: [
          {
            match_phrase_prefix: {
              'title.suggest': {
                query: params.query,
                max_expansions: 5,
              },
            },
          },
          {
            match: {
              'title.suggest': {
                query: params.query,
                boost: 2,
              },
            },
          },
        ],
      },
    };
  }

  private buildFilter(filter: SearchFilter): any {
    switch (filter.type) {
      case 'term':
        return { term: { [filter.field!]: filter.value } };
      case 'terms':
        return { terms: { [filter.field!]: filter.values } };
      case 'range':
        return { range: { [filter.field!]: filter.range } };
      case 'exists':
        return { exists: { field: filter.field } };
      case 'wildcard':
        return { wildcard: { [filter.field!]: filter.value } };
      default:
        return { match_all: {} };
    }
  }

  private buildAggregations(facets: FacetRequest[]): any {
    const aggs: any = {};

    for (const facet of facets) {
      switch (facet.type) {
        case 'terms':
          aggs[facet.name] = {
            terms: {
              field: facet.field,
              size: facet.size || 10,
            },
          };
          break;
        case 'range':
          aggs[facet.name] = {
            range: {
              field: facet.field,
              ranges: facet.ranges,
            },
          };
          break;
        case 'date_histogram':
          aggs[facet.name] = {
            date_histogram: {
              field: facet.field,
              calendar_interval: facet.interval || '1d',
            },
          };
          break;
      }
    }

    return aggs;
  }

  private buildHighlighting(highlight: HighlightRequest): any {
    return {
      fields: highlight.fields.reduce((acc, field) => {
        acc[field] = {
          fragment_size: highlight.fragmentSize || 150,
          number_of_fragments: highlight.numberOfFragments || 3,
        };
        return acc;
      }, {} as Record<string, any>),
      type: highlight.type || 'unified',
    };
  }

  private buildSorting(sort: SortOption[]): any[] {
    return sort.map(s => ({
      [s.field]: {
        order: s.direction,
        missing: s.missing || '_last',
      },
    }));
  }

  private processSearchResponse(response: any, params: SearchParams): SearchResult {
    return {
      total: response.hits.total.value,
      took: response.took,
      hits: response.hits.hits.map((hit: any) => ({
        id: hit._id,
        index: hit._index,
        score: hit._score,
        source: hit._source,
        highlight: hit.highlight,
      })),
      aggregations: response.aggregations || {},
      suggestions: response.suggest || {},
    };
  }

  // Indexing Operations
  async indexDocument(index: string, document: any, options: IndexOptions = {}): Promise<IndexResult> {
    try {
      const response = await this.elasticsearch.index({
        index,
        id: options.id,
        body: document,
        routing: options.routing,
        pipeline: options.pipeline,
        refresh: options.refresh ? 'true' : 'false',
        timeout: options.timeout || '30s',
      });

      return {
        id: response._id,
        index: response._index,
        version: response._version,
        result: response.result,
        shards: response._shards,
      };
    } catch (error) {
      this.logger.error('Document indexing failed', { index, error });
      throw error;
    }
  }

  async bulkIndex(operations: BulkOperation[]): Promise<BulkResult> {
    try {
      const body: any[] = [];

      for (const op of operations) {
        const action = { [op.action]: { _index: op.index, _id: op.id } };
        body.push(action);

        if (op.action !== 'delete' && op.document) {
          body.push(op.document);
        }
      }

      const response = await this.elasticsearch.bulk({
        body,
        timeout: '5m',
        refresh: 'false',
      });

      return {
        took: response.took,
        errors: response.errors,
        items: response.items,
        indexed: response.items.filter((item: any) =>
          item.index && item.index.status >= 200 && item.index.status < 300
        ).length,
      };
    } catch (error) {
      this.logger.error('Bulk indexing failed', { error });
      throw error;
    }
  }

  private async processBulkIndexing(job: any): Promise<void> {
    const { operations } = job.data;

    try {
      const result = await this.bulkIndex(operations);

      if (result.errors) {
        this.logger.warn('Bulk indexing completed with errors', {
          indexed: result.indexed,
          total: operations.length
        });
      } else {
        this.logger.info('Bulk indexing completed successfully', {
          indexed: result.indexed
        });
      }
    } catch (error) {
      this.logger.error('Bulk indexing job failed', { error });
      throw error;
    }
  }

  // Analytics and Dashboards
  private async initializeDashboards(): Promise<void> {
    for (const dashboardConfig of this.config.analytics.dashboards) {
      const dashboard = new Dashboard(dashboardConfig, this.elasticsearch, this.logger);
      await dashboard.initialize();
      this.dashboards.set(dashboardConfig.name, dashboard);
    }

    this.logger.info('Dashboards initialized', { count: this.dashboards.size });
  }

  async getDashboardData(name: string, timeRange?: TimeRangeConfig): Promise<any> {
    const dashboard = this.dashboards.get(name);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${name}`);
    }

    return await dashboard.getData(timeRange);
  }

  // Alerting
  private async initializeAlerts(): Promise<void> {
    for (const alertConfig of this.config.analytics.alerts) {
      const alert = new Alert(alertConfig, this.elasticsearch, this.logger);
      this.alerts.set(alertConfig.name, alert);

      // Schedule alert checking
      this.scheduleAlert(alert);
    }

    this.logger.info('Alerts initialized', { count: this.alerts.size });
  }

  private scheduleAlert(alert: Alert): void {
    // Schedule alert checking based on its schedule
    cron.schedule(alert.getSchedule(), async () => {
      await this.alertingQueue.add('check-alert', { alertName: alert.getName() });
    });
  }

  private async processAlert(job: any): Promise<void> {
    const { alertName } = job.data;
    const alert = this.alerts.get(alertName);

    if (!alert) {
      this.logger.error('Alert not found', { alertName });
      return;
    }

    try {
      const triggered = await alert.check();

      if (triggered) {
        await alert.execute();
        this.logger.info('Alert triggered', { alertName });
      }
    } catch (error) {
      this.logger.error('Alert check failed', { alertName, error });
    }
  }

  // Monitoring and Metrics
  private async trackSearchMetrics(metrics: SearchMetrics): Promise<void> {
    // Store metrics in Elasticsearch for analysis
    await this.elasticsearch.index({
      index: 'search-metrics',
      body: {
        ...metrics,
        timestamp: new Date(),
      },
      refresh: 'false',
    });

    // Update Redis counters
    await this.redis.incr(`search:count:${metrics.index}`);
    await this.redis.incrby(`search:time:${metrics.index}`, metrics.executionTime);
  }

  async getClusterStats(): Promise<ClusterStats> {
    const [health, stats, nodes] = await Promise.all([
      this.elasticsearch.cluster.health(),
      this.elasticsearch.cluster.stats(),
      this.elasticsearch.nodes.stats(),
    ]);

    return {
      health: health.status,
      nodes: {
        total: health.number_of_nodes,
        data: health.number_of_data_nodes,
        coordinatingOnly: health.number_of_nodes - health.number_of_data_nodes,
      },
      indices: {
        count: stats.indices.count,
        shards: {
          total: stats.indices.shards.total,
          primaries: stats.indices.shards.primaries,
          replicas: stats.indices.shards.total - stats.indices.shards.primaries,
        },
        docs: stats.indices.docs.count,
        store: stats.indices.store.size_in_bytes,
      },
      memory: {
        heap: stats.nodes.jvm.mem.heap_used_in_bytes,
        nonHeap: stats.nodes.jvm.mem.non_heap_used_in_bytes,
      },
      performance: this.calculatePerformanceMetrics(nodes),
    };
  }

  private calculatePerformanceMetrics(nodesStats: any): any {
    // Calculate performance metrics from node stats
    let totalQueries = 0;
    let totalQueryTime = 0;
    let totalIndexing = 0;
    let totalIndexingTime = 0;

    for (const nodeId in nodesStats.nodes) {
      const node = nodesStats.nodes[nodeId];
      if (node.indices) {
        totalQueries += node.indices.search.query_total || 0;
        totalQueryTime += node.indices.search.query_time_in_millis || 0;
        totalIndexing += node.indices.indexing.index_total || 0;
        totalIndexingTime += node.indices.indexing.index_time_in_millis || 0;
      }
    }

    return {
      avgQueryTime: totalQueries > 0 ? totalQueryTime / totalQueries : 0,
      avgIndexingTime: totalIndexing > 0 ? totalIndexingTime / totalIndexing : 0,
      queriesPerSecond: totalQueries,
      indexingPerSecond: totalIndexing,
    };
  }

  // API Routes
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.elasticsearch.cluster.health();
        res.json({ status: 'ok', elasticsearch: health.status });
      } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
      }
    });

    // Search endpoint
    this.app.post('/search', async (req, res) => {
      try {
        const result = await this.search(req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Index document
    this.app.post('/index/:index', async (req, res) => {
      try {
        const result = await this.indexDocument(req.params.index, req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Bulk index
    this.app.post('/bulk', async (req, res) => {
      try {
        const result = await this.bulkIndex(req.body.operations);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Dashboard data
    this.app.get('/dashboard/:name', async (req, res) => {
      try {
        const data = await this.getDashboardData(req.params.name, req.query as any);
        res.json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Cluster stats
    this.app.get('/cluster/stats', async (req, res) => {
      try {
        const stats = await this.getClusterStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupWebSocket(): void {
    this.wsServer = new WebSocketServer({ port: 8081 });

    this.wsServer.on('connection', (ws) => {
      this.logger.info('WebSocket client connected');

      // Send real-time updates
      setInterval(async () => {
        try {
          const stats = await this.getClusterStats();
          ws.send(JSON.stringify({ type: 'stats', data: stats }));
        } catch (error) {
          // Ignore errors for real-time updates
        }
      }, 5000);

      ws.on('close', () => {
        this.logger.info('WebSocket client disconnected');
      });
    });
  }

  private startScheduledJobs(): void {
    // Daily index optimization
    cron.schedule('0 2 * * *', async () => {
      await this.optimizeIndices();
    });

    // Weekly cluster maintenance
    cron.schedule('0 3 * * 0', async () => {
      await this.performMaintenance();
    });
  }

  private async optimizeIndices(): Promise<void> {
    this.logger.info('Starting index optimization...');

    try {
      // Force merge indices
      await this.elasticsearch.indices.forcemerge({
        index: '*',
        max_num_segments: 1,
        only_expunge_deletes: true,
      });

      this.logger.info('Index optimization completed');
    } catch (error) {
      this.logger.error('Index optimization failed', { error });
    }
  }

  private async performMaintenance(): Promise<void> {
    this.logger.info('Starting cluster maintenance...');

    try {
      // Clean up old indices
      await this.cleanupOldIndices();

      // Update index settings
      await this.updateIndexSettings();

      this.logger.info('Cluster maintenance completed');
    } catch (error) {
      this.logger.error('Cluster maintenance failed', { error });
    }
  }

  private async cleanupOldIndices(): Promise<void> {
    // Implementation for cleaning up old indices based on lifecycle policies
  }

  private async updateIndexSettings(): Promise<void> {
    // Implementation for updating index settings
  }

  public async start(port: number = 8080): Promise<void> {
    await this.initialize();

    this.app.listen(port, () => {
      this.logger.info(`Search Analytics Platform running on port ${port}`);
    });
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down search platform...');

    // Close queues
    await this.indexingQueue.close();
    await this.alertingQueue.close();

    // Close connections
    this.redis.disconnect();
    await this.elasticsearch.close();

    this.logger.info('Search platform shutdown complete');
  }
}

// Supporting classes and interfaces
interface SearchParams {
  index: string;
  type: 'full-text' | 'structured' | 'autocomplete' | 'suggest';
  query?: string;
  fields?: string[];
  filters?: SearchFilter[];
  facets?: FacetRequest[];
  highlight?: HighlightRequest;
  sort?: SortOption[];
  size?: number;
  from?: number;
  timeout?: string;
  routing?: string;
  preference?: string;
}

interface SearchFilter {
  type: 'term' | 'terms' | 'range' | 'exists' | 'wildcard';
  field?: string;
  value?: any;
  values?: any[];
  range?: { gte?: any; lte?: any; gt?: any; lt?: any };
}

interface FacetRequest {
  name: string;
  type: 'terms' | 'range' | 'date_histogram';
  field: string;
  size?: number;
  ranges?: Array<{ from?: any; to?: any; key?: string }>;
  interval?: string;
}

interface HighlightRequest {
  fields: string[];
  fragmentSize?: number;
  numberOfFragments?: number;
  type?: 'unified' | 'plain' | 'fvh';
}

interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  missing?: '_first' | '_last';
}

interface SearchResult {
  total: number;
  took: number;
  hits: SearchHit[];
  aggregations: any;
  suggestions: any;
}

interface SearchHit {
  id: string;
  index: string;
  score: number;
  source: any;
  highlight?: any;
}

interface IndexOptions {
  id?: string;
  routing?: string;
  pipeline?: string;
  refresh?: boolean;
  timeout?: string;
}

interface IndexResult {
  id: string;
  index: string;
  version: number;
  result: string;
  shards: any;
}

interface BulkOperation {
  action: 'index' | 'create' | 'update' | 'delete';
  index: string;
  id?: string;
  document?: any;
}

interface BulkResult {
  took: number;
  errors: boolean;
  items: any[];
  indexed: number;
}

interface SearchMetrics {
  index: string;
  queryType: string;
  executionTime: number;
  resultCount: number;
}

interface ClusterStats {
  health: string;
  nodes: any;
  indices: any;
  memory: any;
  performance: any;
}

// Dashboard and Alert classes (simplified)
class Dashboard {
  constructor(
    private config: DashboardConfig,
    private elasticsearch: ElasticsearchClient,
    private logger: Logger
  ) {}

  async initialize(): Promise<void> {
    // Initialize dashboard
  }

  async getData(timeRange?: TimeRangeConfig): Promise<any> {
    // Fetch dashboard data
    return {};
  }
}

class Alert {
  constructor(
    private config: AlertConfig,
    private elasticsearch: ElasticsearchClient,
    private logger: Logger
  ) {}

  getSchedule(): string {
    return this.config.schedule;
  }

  getName(): string {
    return this.config.name;
  }

  async check(): Promise<boolean> {
    // Check alert condition
    return false;
  }

  async execute(): Promise<void> {
    // Execute alert actions
  }
}

// Example usage
export async function createSearchPlatformExample(): Promise<void> {
  const config: SearchPlatformConfig = {
    elasticsearch: {
      nodes: [
        {
          host: 'localhost',
          port: 9200,
          protocol: 'http',
          roles: ['master', 'data', 'ingest'],
        },
      ],
      cluster: {
        name: 'search-cluster',
        shards: {
          defaultShards: 1,
          maxShardsPerNode: 1000,
          routingAllocation: true,
        },
        replication: {
          defaultReplicas: 0,
          autoExpandReplicas: false,
          waitForActiveShards: 1,
        },
        allocation: {
          awareness: false,
          attributes: [],
          totalShardsPerNode: -1,
        },
      },
      indices: [
        {
          name: 'logs',
          pattern: 'logs-*',
          settings: {
            numberOfShards: 1,
            numberOfReplicas: 0,
            refreshInterval: '1s',
            maxResultWindow: 10000,
            analysis: {
              analyzers: [
                {
                  name: 'log_analyzer',
                  type: 'custom',
                  tokenizer: 'standard',
                  filters: ['lowercase', 'stop'],
                },
              ],
              tokenizers: [],
              filters: [],
              normalizers: [],
            },
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              level: { type: 'keyword' },
              message: { type: 'text', analyzer: 'log_analyzer' },
              host: { type: 'keyword' },
              service: { type: 'keyword' },
            },
          },
          aliases: ['current-logs'],
          lifecycle: {
            name: 'logs_policy',
            phases: [
              {
                name: 'hot',
                minAge: '0ms',
                actions: [
                  {
                    type: 'rollover',
                    params: { max_size: '5gb', max_age: '1d' },
                  },
                ],
              },
              {
                name: 'delete',
                minAge: '30d',
                actions: [{ type: 'delete', params: {} }],
              },
            ],
          },
        },
      ],
      templates: [
        {
          name: 'logs_template',
          indexPatterns: ['logs-*'],
          version: 1,
          priority: 100,
          settings: {
            numberOfShards: 1,
            numberOfReplicas: 0,
            refreshInterval: '1s',
            maxResultWindow: 10000,
            analysis: {
              analyzers: [],
              tokenizers: [],
              filters: [],
              normalizers: [],
            },
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              level: { type: 'keyword' },
              message: { type: 'text' },
            },
          },
          aliases: {},
        },
      ],
    },
    indexing: {
      pipelines: [
        {
          name: 'log_enrichment',
          description: 'Enrich log data',
          version: 1,
          processors: [
            {
              type: 'grok',
              params: {
                field: 'message',
                patterns: ['%{COMBINEDAPACHELOG}'],
              },
            },
            {
              type: 'date',
              params: {
                field: 'timestamp',
                formats: ['ISO8601'],
              },
            },
          ],
        },
      ],
      processors: [],
      bulkSettings: {
        size: 1000,
        flushInterval: 5000,
        maxRetries: 3,
        backoffTime: 1000,
        compression: true,
      },
      realTime: {
        enabled: true,
        refreshInterval: '1s',
        translogSettings: {
          syncInterval: '5s',
          durability: 'request',
          flushThreshold: '512mb',
        },
      },
    },
    search: {
      endpoints: [
        {
          path: '/search/logs',
          type: 'full-text',
          indices: ['logs-*'],
          defaultSize: 20,
          maxSize: 1000,
          timeout: '30s',
          authentication: false,
        },
      ],
      features: {
        highlighting: {
          enabled: true,
          fields: ['message'],
          fragmentSize: 150,
          numberOfFragments: 3,
          type: 'unified',
        },
        facets: [
          {
            field: 'level',
            type: 'terms',
            size: 10,
            params: {},
          },
          {
            field: 'service',
            type: 'terms',
            size: 20,
            params: {},
          },
        ],
        suggestions: {
          enabled: true,
          types: ['term', 'phrase'],
          fields: ['message'],
          maxSuggestions: 5,
        },
        personalization: {
          enabled: false,
          userProfiles: false,
          behaviorTracking: false,
          recommendations: false,
        },
      },
      relevance: {
        scoring: {
          model: 'BM25',
          params: { k1: 1.2, b: 0.75 },
        },
        boosting: {
          fieldBoosts: { 'title': 2.0, 'content': 1.0 },
          timeDecay: {
            enabled: true,
            field: 'timestamp',
            scale: '7d',
            decay: 0.5,
          },
          popularity: {
            enabled: false,
            field: 'views',
            modifier: 'log1p',
          },
        },
        functions: [],
      },
      performance: {
        caching: {
          queryCache: true,
          requestCache: true,
          fieldDataCache: true,
          sizes: { 'query': '10%', 'request': '1%', 'fielddata': '40%' },
        },
        routing: {
          preferLocal: true,
          awareness: false,
          allocation: {
            awareness: false,
            attributes: [],
            totalShardsPerNode: -1,
          },
        },
        optimization: {
          indexSorting: false,
          forcemerge: true,
          prefiltering: true,
        },
      },
    },
    analytics: {
      dashboards: [
        {
          name: 'logs_overview',
          description: 'Log analytics dashboard',
          widgets: [
            {
              id: 'log_volume',
              type: 'chart',
              title: 'Log Volume Over Time',
              query: {
                index: 'logs-*',
                query: { match_all: {} },
                aggregations: {
                  logs_over_time: {
                    date_histogram: {
                      field: 'timestamp',
                      calendar_interval: '1h',
                    },
                  },
                },
              },
              visualization: {
                chartType: 'line',
                axes: [
                  { position: 'left', title: 'Count', scale: 'linear' },
                  { position: 'bottom', title: 'Time', scale: 'time' },
                ],
                colors: ['#1f77b4'],
                legend: true,
                annotations: [],
              },
              position: { x: 0, y: 0, width: 6, height: 4 },
            },
          ],
          filters: [],
          refreshInterval: 30,
          timeRange: {
            type: 'relative',
            value: '24h',
          },
        },
      ],
      visualizations: [],
      alerts: [
        {
          name: 'high_error_rate',
          description: 'Alert on high error rate',
          condition: {
            type: 'threshold',
            query: {
              bool: {
                must: [
                  { term: { level: 'ERROR' } },
                ],
              },
            },
            threshold: 100,
            timeWindow: '5m',
            comparison: 'gt',
          },
          actions: [
            {
              type: 'webhook',
              config: {
                url: 'https://hooks.slack.com/services/...',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { text: 'High error rate detected!' },
              },
            },
          ],
          schedule: '*/5 * * * *',
          enabled: true,
        },
      ],
      reports: [],
    },
    monitoring: {
      cluster: {
        health: true,
        nodes: true,
        indices: true,
        shards: true,
        tasks: true,
      },
      performance: {
        queries: true,
        indexing: true,
        search: true,
        gc: true,
        jvm: true,
      },
      capacity: {
        storage: true,
        memory: true,
        cpu: true,
        network: true,
        forecasting: true,
      },
      alerts: [
        {
          name: 'cluster_health_red',
          metric: 'cluster.health.status',
          threshold: 0,
          duration: '1m',
          severity: 'critical',
          channels: ['slack', 'email'],
        },
      ],
    },
    security: {
      authentication: {
        enabled: true,
        methods: ['native'],
        tokenExpiration: 3600,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          maxAge: 90,
        },
      },
      authorization: {
        enabled: true,
        rbac: true,
        roles: [
          {
            name: 'read_only',
            cluster: ['cluster:monitor/main'],
            indices: [
              {
                names: ['logs-*'],
                privileges: ['read'],
              },
            ],
          },
        ],
        fieldSecurity: true,
        documentSecurity: true,
      },
      encryption: {
        transport: true,
        http: true,
        atRest: true,
        algorithms: ['TLS1.2', 'AES256'],
      },
      auditing: {
        enabled: true,
        events: ['authentication_success', 'authentication_failed', 'access_granted', 'access_denied'],
        outputs: [
          {
            type: 'index',
            config: { index: 'audit-logs' },
          },
        ],
        filters: [],
      },
    },
  };

  const platform = new SearchAnalyticsPlatform(config);
  await platform.start(8080);

  console.log('Search & Analytics Platform with Elasticsearch, dashboards, and real-time analytics running');
}

export { SearchAnalyticsPlatform, SearchPlatformConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Search engine implementation is needed
- Elasticsearch cluster management is required
- Log analytics and monitoring is requested
- Full-text search capabilities are needed
- Analytics dashboards and reporting is required
- Data indexing and search optimization is requested

This comprehensive search and analytics skill provides expert-level capabilities for building modern, scalable search platforms with advanced Elasticsearch optimization, real-time analytics, monitoring, and enterprise search features.