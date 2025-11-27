# Machine Learning & AI Integration Skill

Advanced machine learning and AI platform engineering expertise covering MLOps pipelines, model serving, vector databases, and comprehensive AI/ML platform development with modern frameworks and production-ready deployment strategies.

## Skill Overview

Expert ML/AI knowledge including model lifecycle management, feature engineering, inference optimization, experiment tracking, and modern AI platform engineering with TensorFlow, PyTorch, Hugging Face, and comprehensive MLOps pipeline automation.

## Core Capabilities

### MLOps & Model Lifecycle
- **Model versioning** - MLflow, DVC, model registries, experiment tracking, artifact management
- **Pipeline automation** - Kubeflow, Apache Airflow, MLflow Pipelines, continuous training, deployment
- **Model monitoring** - Drift detection, performance tracking, data quality monitoring, alerting
- **A/B testing** - Model comparison, canary deployments, traffic splitting, performance analysis

### Model Serving & Inference
- **Serving platforms** - TensorFlow Serving, TorchServe, ONNX Runtime, Triton Inference Server
- **API frameworks** - FastAPI model APIs, GraphQL for ML, real-time inference, batch processing
- **Optimization** - Model quantization, pruning, distillation, ONNX conversion, TensorRT optimization
- **Scaling strategies** - Auto-scaling, load balancing, edge deployment, model caching

### Vector Databases & Similarity Search
- **Vector stores** - Pinecone, Weaviate, Milvus, Chroma, FAISS implementation and optimization
- **Embedding models** - Sentence Transformers, OpenAI embeddings, custom embedding training
- **Search optimization** - Index tuning, approximate nearest neighbor, hybrid search strategies
- **RAG implementations** - Retrieval-augmented generation, document chunking, context optimization

### AI/ML Platform Integration
- **Framework integration** - TensorFlow, PyTorch, scikit-learn, XGBoost, LightGBM ecosystem
- **Cloud ML services** - AWS SageMaker, Google AI Platform, Azure ML, model deployment strategies
- **LLM integration** - OpenAI API, Hugging Face Transformers, local LLM deployment, prompt engineering
- **Computer vision** - OpenCV, PIL, image processing pipelines, object detection, classification

## Modern ML Platform Implementation

### Comprehensive ML/AI Platform with MLOps
```typescript
// Advanced ML/AI platform with model serving, vector databases, and MLOps automation
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import * as tf from '@tensorflow/tfjs-node';
import * as ort from 'onnxruntime-node';
import { PineconeClient } from '@pinecone-database/pinecone';
import { ChromaClient } from 'chromadb';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';
import { EventEmitter } from 'events';
import Bull from 'bull';
import cron from 'node-cron';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import numpy as require('numpy-js'); // Note: Would need actual numpy.js or similar
import fetch from 'node-fetch';

// Types and interfaces
interface MLPlatformConfig {
  models: ModelConfig[];
  vectorDB: VectorDatabaseConfig;
  serving: ServingConfig;
  training: TrainingConfig;
  monitoring: MLMonitoringConfig;
  experiments: ExperimentConfig;
  deployment: DeploymentConfig;
  storage: StorageConfig;
}

interface ModelConfig {
  name: string;
  version: string;
  type: 'tensorflow' | 'pytorch' | 'onnx' | 'sklearn' | 'huggingface';
  framework: string;
  task: 'classification' | 'regression' | 'nlp' | 'cv' | 'embedding' | 'llm';
  input: ModelInputSchema;
  output: ModelOutputSchema;
  preprocessing: PreprocessingPipeline;
  postprocessing: PostprocessingPipeline;
  metadata: ModelMetadata;
}

interface ModelInputSchema {
  type: 'tensor' | 'text' | 'image' | 'audio' | 'json';
  shape?: number[];
  dtype?: string;
  validation: z.ZodSchema;
}

interface ModelOutputSchema {
  type: 'tensor' | 'json' | 'classification' | 'embedding';
  shape?: number[];
  labels?: string[];
  postprocess?: boolean;
}

interface PreprocessingPipeline {
  steps: PreprocessingStep[];
  caching: boolean;
}

interface PreprocessingStep {
  name: string;
  type: 'normalize' | 'tokenize' | 'resize' | 'encode' | 'custom';
  params: Record<string, any>;
}

interface PostprocessingPipeline {
  steps: PostprocessingStep[];
}

interface PostprocessingStep {
  name: string;
  type: 'softmax' | 'argmax' | 'decode' | 'custom';
  params: Record<string, any>;
}

interface ModelMetadata {
  description: string;
  author: string;
  created: string;
  accuracy?: number;
  metrics: Record<string, number>;
  tags: string[];
  dependencies: string[];
}

interface VectorDatabaseConfig {
  provider: 'pinecone' | 'weaviate' | 'milvus' | 'chroma';
  connection: VectorDBConnection;
  indexes: VectorIndexConfig[];
  embedding: EmbeddingConfig;
}

interface VectorDBConnection {
  apiKey?: string;
  host: string;
  port?: number;
  environment?: string;
}

interface VectorIndexConfig {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  pods?: number;
  replicas?: number;
}

interface EmbeddingConfig {
  model: string;
  provider: 'openai' | 'huggingface' | 'sentence-transformers' | 'custom';
  dimension: number;
  maxTokens?: number;
  batchSize: number;
}

interface ServingConfig {
  endpoints: EndpointConfig[];
  autoscaling: AutoscalingConfig;
  caching: ServingCacheConfig;
  rateLimit: RateLimitConfig;
}

interface EndpointConfig {
  path: string;
  model: string;
  method: 'sync' | 'async' | 'batch';
  timeout: number;
  maxBatchSize?: number;
  authentication: boolean;
}

interface AutoscalingConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number;
  targetMemory: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

interface ServingCacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

interface RateLimitConfig {
  requestsPerMinute: number;
  burstSize: number;
  scope: 'global' | 'user' | 'ip';
}

interface TrainingConfig {
  pipelines: TrainingPipelineConfig[];
  compute: ComputeConfig;
  data: DataConfig;
  hyperparameter: HyperparameterConfig;
}

interface TrainingPipelineConfig {
  name: string;
  type: 'supervised' | 'unsupervised' | 'reinforcement' | 'transfer';
  schedule: string;
  dataSource: string;
  outputModel: string;
  validation: ValidationConfig;
}

interface ComputeConfig {
  provider: 'local' | 'aws' | 'gcp' | 'azure';
  instances: ComputeInstance[];
  distributed: boolean;
  gpu: boolean;
}

interface ComputeInstance {
  type: string;
  count: number;
  memory: string;
  storage: string;
}

interface DataConfig {
  sources: DataSourceConfig[];
  preprocessing: DataPreprocessingConfig;
  validation: DataValidationConfig;
  versioning: DataVersioningConfig;
}

interface DataSourceConfig {
  name: string;
  type: 'postgres' | 'mongodb' | 's3' | 'api' | 'file';
  connection: Record<string, any>;
  query?: string;
}

interface DataPreprocessingConfig {
  steps: DataPreprocessingStep[];
  caching: boolean;
  parallelization: boolean;
}

interface DataPreprocessingStep {
  name: string;
  type: 'clean' | 'transform' | 'feature_engineering' | 'split';
  params: Record<string, any>;
}

interface DataValidationConfig {
  schema: z.ZodSchema;
  checks: DataQualityCheck[];
}

interface DataQualityCheck {
  name: string;
  type: 'completeness' | 'accuracy' | 'consistency' | 'distribution';
  threshold: number;
}

interface DataVersioningConfig {
  enabled: boolean;
  storage: 'dvc' | 's3' | 'local';
  retention: number;
}

interface HyperparameterConfig {
  optimization: 'grid' | 'random' | 'bayesian' | 'optuna';
  trials: number;
  objective: string;
  parameters: HyperparameterSpace;
}

interface HyperparameterSpace {
  [key: string]: {
    type: 'float' | 'int' | 'categorical';
    low?: number;
    high?: number;
    values?: any[];
  };
}

interface ValidationConfig {
  strategy: 'holdout' | 'k-fold' | 'time-series';
  splitRatio?: number;
  folds?: number;
  metrics: string[];
}

interface MLMonitoringConfig {
  drift: DriftDetectionConfig;
  performance: PerformanceMonitoringConfig;
  data: DataMonitoringConfig;
  alerts: AlertConfig[];
}

interface DriftDetectionConfig {
  enabled: boolean;
  methods: ('ks' | 'psi' | 'wasserstein' | 'chi2')[];
  threshold: number;
  window: number;
  frequency: string;
}

interface PerformanceMonitoringConfig {
  metrics: PerformanceMetric[];
  baseline: Record<string, number>;
  degradationThreshold: number;
  alerting: boolean;
}

interface PerformanceMetric {
  name: string;
  type: 'accuracy' | 'precision' | 'recall' | 'f1' | 'auc' | 'mse' | 'mae';
  weight: number;
}

interface DataMonitoringConfig {
  quality: DataQualityMonitoring;
  volume: DataVolumeMonitoring;
  freshness: DataFreshnessMonitoring;
}

interface DataQualityMonitoring {
  enabled: boolean;
  checks: string[];
  schedule: string;
}

interface DataVolumeMonitoring {
  enabled: boolean;
  expectedVolume: number;
  tolerance: number;
}

interface DataFreshnessMonitoring {
  enabled: boolean;
  maxAge: number;
  schedule: string;
}

interface AlertConfig {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: NotificationChannel[];
  cooldown: number;
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
}

interface ExperimentConfig {
  tracking: ExperimentTrackingConfig;
  comparison: ExperimentComparisonConfig;
  abTesting: ABTestingConfig;
}

interface ExperimentTrackingConfig {
  provider: 'mlflow' | 'wandb' | 'tensorboard' | 'custom';
  connection: Record<string, any>;
  autoLog: boolean;
  artifacts: boolean;
}

interface ExperimentComparisonConfig {
  metrics: string[];
  visualization: boolean;
  reporting: boolean;
}

interface ABTestingConfig {
  enabled: boolean;
  trafficSplit: TrafficSplitConfig[];
  duration: number;
  successMetrics: string[];
}

interface TrafficSplitConfig {
  model: string;
  percentage: number;
  conditions?: Record<string, any>;
}

interface DeploymentConfig {
  strategy: 'blue-green' | 'canary' | 'rolling' | 'shadow';
  environments: DeploymentEnvironment[];
  approval: ApprovalConfig;
  rollback: RollbackConfig;
}

interface DeploymentEnvironment {
  name: string;
  type: 'staging' | 'production' | 'test';
  infrastructure: InfrastructureConfig;
  validation: DeploymentValidation[];
}

interface InfrastructureConfig {
  provider: 'kubernetes' | 'docker' | 'serverless' | 'edge';
  replicas: number;
  resources: ResourceConfig;
  networking: NetworkingConfig;
}

interface ResourceConfig {
  cpu: string;
  memory: string;
  gpu?: boolean;
  storage: string;
}

interface NetworkingConfig {
  ingress: boolean;
  loadBalancer: boolean;
  ssl: boolean;
}

interface DeploymentValidation {
  type: 'health' | 'performance' | 'accuracy' | 'load';
  params: Record<string, any>;
}

interface ApprovalConfig {
  required: boolean;
  reviewers: string[];
  autoApprove?: ApprovalCriteria;
}

interface ApprovalCriteria {
  accuracy?: number;
  performance?: number;
  tests?: boolean;
}

interface RollbackConfig {
  automatic: boolean;
  triggers: RollbackTrigger[];
  strategy: 'immediate' | 'gradual';
}

interface RollbackTrigger {
  metric: string;
  threshold: number;
  duration: number;
}

interface StorageConfig {
  models: StorageBackend;
  data: StorageBackend;
  artifacts: StorageBackend;
  cache: StorageBackend;
}

interface StorageBackend {
  type: 's3' | 'gcs' | 'azure' | 'local' | 'hdfs';
  connection: Record<string, any>;
  encryption: boolean;
  compression: boolean;
}

// Core ML Platform
class MLPlatform extends EventEmitter {
  private config: MLPlatformConfig;
  private models: Map<string, LoadedModel> = new Map();
  private vectorDB: VectorDatabase;
  private redis: Redis;
  private postgres: Pool;
  private s3: S3Client;
  private logger: Logger;
  private server: FastifyInstance;
  private trainingQueue: Bull.Queue;
  private inferenceQueue: Bull.Queue;
  private experiments: ExperimentTracker;
  private monitoring: ModelMonitoring;

  constructor(config: MLPlatformConfig) {
    super();
    this.config = config;

    this.setupLogger();
    this.setupStorage();
    this.setupQueues();
    this.setupVectorDB();
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
        new transports.File({ filename: 'ml-platform.log' })
      ]
    });
  }

  private setupStorage(): void {
    // Redis for caching and session storage
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // PostgreSQL for metadata and experiment tracking
    this.postgres = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'ml_platform',
      user: 'ml_user',
      password: 'ml_password',
      max: 20,
    });

    // S3 for model and data storage
    this.s3 = new S3Client({
      region: 'us-west-2',
    });
  }

  private setupQueues(): void {
    // Training queue for async model training
    this.trainingQueue = new Bull('training', {
      redis: { host: 'localhost', port: 6379 },
    });

    // Inference queue for batch inference
    this.inferenceQueue = new Bull('inference', {
      redis: { host: 'localhost', port: 6379 },
    });

    this.setupQueueProcessors();
  }

  private setupQueueProcessors(): void {
    this.trainingQueue.process('train-model', 3, this.processTrainingJob.bind(this));
    this.inferenceQueue.process('batch-inference', 10, this.processBatchInference.bind(this));
  }

  private setupVectorDB(): void {
    switch (this.config.vectorDB.provider) {
      case 'pinecone':
        this.vectorDB = new PineconeVectorDB(this.config.vectorDB);
        break;
      case 'chroma':
        this.vectorDB = new ChromaVectorDB(this.config.vectorDB);
        break;
      default:
        throw new Error(`Unsupported vector DB: ${this.config.vectorDB.provider}`);
    }
  }

  private initializeComponents(): void {
    this.experiments = new ExperimentTracker(this.config.experiments);
    this.monitoring = new ModelMonitoring(this.config.monitoring, this.logger);
  }

  async initialize(): Promise<void> {
    try {
      // Load all configured models
      for (const modelConfig of this.config.models) {
        await this.loadModel(modelConfig);
      }

      // Initialize vector database
      await this.vectorDB.initialize();

      // Start monitoring
      await this.monitoring.start();

      // Setup scheduled jobs
      this.setupScheduledJobs();

      this.logger.info('ML Platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize ML platform', { error });
      throw error;
    }
  }

  private async loadModel(config: ModelConfig): Promise<void> {
    try {
      let model: LoadedModel;

      switch (config.type) {
        case 'tensorflow':
          model = await this.loadTensorFlowModel(config);
          break;
        case 'onnx':
          model = await this.loadONNXModel(config);
          break;
        case 'huggingface':
          model = await this.loadHuggingFaceModel(config);
          break;
        default:
          throw new Error(`Unsupported model type: ${config.type}`);
      }

      this.models.set(config.name, model);
      this.logger.info('Model loaded successfully', { name: config.name, type: config.type });
    } catch (error) {
      this.logger.error('Failed to load model', { name: config.name, error });
      throw error;
    }
  }

  private async loadTensorFlowModel(config: ModelConfig): Promise<LoadedModel> {
    const modelPath = `s3://models/${config.name}/${config.version}`;
    const handler = tf.loadLayersModel(modelPath);

    return {
      config,
      handler,
      type: 'tensorflow',
      loaded: true,
      lastUsed: Date.now(),
    };
  }

  private async loadONNXModel(config: ModelConfig): Promise<LoadedModel> {
    const modelPath = `./models/${config.name}/${config.version}/model.onnx`;
    const session = await ort.InferenceSession.create(modelPath);

    return {
      config,
      handler: session,
      type: 'onnx',
      loaded: true,
      lastUsed: Date.now(),
    };
  }

  private async loadHuggingFaceModel(config: ModelConfig): Promise<LoadedModel> {
    // Would integrate with Hugging Face Transformers
    const model = {
      tokenizer: null, // Would load actual tokenizer
      model: null,     // Would load actual model
    };

    return {
      config,
      handler: model,
      type: 'huggingface',
      loaded: true,
      lastUsed: Date.now(),
    };
  }

  // Model Inference
  async predict(modelName: string, input: any, options: InferenceOptions = {}): Promise<InferenceResult> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      const model = this.models.get(modelName);
      if (!model) {
        throw new Error(`Model not found: ${modelName}`);
      }

      // Update last used timestamp
      model.lastUsed = Date.now();

      // Check cache first
      const cacheKey = this.generateCacheKey(modelName, input);
      if (this.config.serving.caching.enabled && !options.skipCache) {
        const cached = await this.getCachedPrediction(cacheKey);
        if (cached) {
          return {
            ...cached,
            fromCache: true,
            requestId,
            latency: Date.now() - startTime,
          };
        }
      }

      // Preprocess input
      const preprocessed = await this.preprocessInput(model.config, input);

      // Run inference
      let prediction: any;
      switch (model.type) {
        case 'tensorflow':
          prediction = await this.runTensorFlowInference(model, preprocessed);
          break;
        case 'onnx':
          prediction = await this.runONNXInference(model, preprocessed);
          break;
        case 'huggingface':
          prediction = await this.runHuggingFaceInference(model, preprocessed);
          break;
        default:
          throw new Error(`Unsupported model type: ${model.type}`);
      }

      // Postprocess output
      const postprocessed = await this.postprocessOutput(model.config, prediction);

      const result: InferenceResult = {
        modelName,
        modelVersion: model.config.version,
        prediction: postprocessed,
        confidence: this.calculateConfidence(prediction),
        requestId,
        latency: Date.now() - startTime,
        fromCache: false,
      };

      // Cache result
      if (this.config.serving.caching.enabled) {
        await this.cachePrediction(cacheKey, result);
      }

      // Log inference for monitoring
      await this.logInference(result);

      return result;
    } catch (error) {
      this.logger.error('Inference failed', { modelName, requestId, error });
      throw error;
    }
  }

  private async runTensorFlowInference(model: LoadedModel, input: any): Promise<any> {
    const tensorInput = tf.tensor(input);
    const prediction = (model.handler as any).predict(tensorInput);
    const result = await prediction.data();

    tensorInput.dispose();
    prediction.dispose();

    return Array.from(result);
  }

  private async runONNXInference(model: LoadedModel, input: any): Promise<any> {
    const session = model.handler as ort.InferenceSession;
    const feeds: Record<string, ort.Tensor> = {};

    // Assume single input for simplicity
    const inputName = session.inputNames[0];
    feeds[inputName] = new ort.Tensor('float32', new Float32Array(input), [1, input.length]);

    const results = await session.run(feeds);
    const outputName = session.outputNames[0];

    return Array.from(results[outputName].data as Float32Array);
  }

  private async runHuggingFaceInference(model: LoadedModel, input: any): Promise<any> {
    // Would implement actual Hugging Face inference
    // This is a placeholder
    return { prediction: 'example' };
  }

  // Vector Database Operations
  async storeEmbedding(
    index: string,
    id: string,
    embedding: number[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.vectorDB.upsert(index, [{ id, values: embedding, metadata }]);
  }

  async searchSimilar(
    index: string,
    query: number[],
    topK: number = 10,
    filter?: Record<string, any>
  ): Promise<SimilarityResult[]> {
    return await this.vectorDB.query(index, query, topK, filter);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddingConfig = this.config.vectorDB.embedding;

    switch (embeddingConfig.provider) {
      case 'openai':
        return await this.generateOpenAIEmbedding(text);
      case 'huggingface':
        return await this.generateHuggingFaceEmbedding(text);
      default:
        throw new Error(`Unsupported embedding provider: ${embeddingConfig.provider}`);
    }
  }

  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  private async generateHuggingFaceEmbedding(text: string): Promise<number[]> {
    // Would implement sentence transformers or similar
    // Placeholder implementation
    return new Array(384).fill(0).map(() => Math.random());
  }

  // Training Pipeline
  async startTraining(pipelineConfig: TrainingPipelineConfig): Promise<string> {
    const jobId = uuidv4();

    const job = await this.trainingQueue.add('train-model', {
      jobId,
      config: pipelineConfig,
      timestamp: Date.now(),
    });

    this.logger.info('Training job started', { jobId, pipeline: pipelineConfig.name });
    return jobId;
  }

  private async processTrainingJob(job: any): Promise<void> {
    const { jobId, config } = job.data;

    try {
      this.logger.info('Processing training job', { jobId, pipeline: config.name });

      // Start experiment tracking
      const experiment = await this.experiments.startExperiment({
        name: config.name,
        type: config.type,
        parameters: {},
      });

      // Load and preprocess data
      const data = await this.loadTrainingData(config.dataSource);
      const processedData = await this.preprocessTrainingData(data, config);

      // Train model
      const trainedModel = await this.trainModel(config, processedData);

      // Validate model
      const validation = await this.validateModel(trainedModel, processedData.validation);

      // Log results
      await this.experiments.logMetrics(experiment.id, validation.metrics);
      await this.experiments.logArtifacts(experiment.id, { model: trainedModel });

      // Save model
      const modelPath = await this.saveModel(trainedModel, config.outputModel);

      await this.experiments.endExperiment(experiment.id, {
        status: 'completed',
        modelPath,
        metrics: validation.metrics,
      });

      this.logger.info('Training job completed', { jobId, modelPath });
    } catch (error) {
      this.logger.error('Training job failed', { jobId, error });
      throw error;
    }
  }

  // Model Monitoring
  async detectDrift(modelName: string, newData: any[]): Promise<DriftResult> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model not found: ${modelName}`);
    }

    return await this.monitoring.detectDrift(modelName, newData);
  }

  async monitorPerformance(modelName: string, predictions: any[], actualLabels: any[]): Promise<PerformanceMetrics> {
    return await this.monitoring.evaluatePerformance(modelName, predictions, actualLabels);
  }

  // A/B Testing
  async deployABTest(testConfig: ABTestingConfig): Promise<string> {
    const testId = uuidv4();

    // Deploy models with traffic splitting
    for (const split of testConfig.trafficSplit) {
      await this.deployModelWithTrafficSplit(split.model, split.percentage);
    }

    // Start monitoring
    await this.startABTestMonitoring(testId, testConfig);

    this.logger.info('A/B test deployed', { testId, models: testConfig.trafficSplit.map(s => s.model) });
    return testId;
  }

  // Batch Processing
  async runBatchInference(modelName: string, inputs: any[], batchSize: number = 32): Promise<any[]> {
    const results = [];

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(input => this.predict(modelName, input))
      );
      results.push(...batchResults.map(r => r.prediction));
    }

    return results;
  }

  // Feature Store Operations
  async createFeatureStore(): Promise<FeatureStore> {
    return new FeatureStore(this.postgres, this.redis, this.logger);
  }

  // Hyperparameter Optimization
  async optimizeHyperparameters(config: HyperparameterConfig): Promise<OptimizationResult> {
    const optimizer = new HyperparameterOptimizer(config, this.logger);
    return await optimizer.optimize();
  }

  // Model Registry Operations
  async registerModel(model: ModelConfig, artifacts: ModelArtifacts): Promise<string> {
    const modelId = uuidv4();

    // Store model metadata
    await this.postgres.query(
      'INSERT INTO model_registry (id, name, version, config, created_at) VALUES ($1, $2, $3, $4, $5)',
      [modelId, model.name, model.version, JSON.stringify(model), new Date()]
    );

    // Store model files
    const modelPath = `models/${model.name}/${model.version}`;
    await this.storeModelArtifacts(modelPath, artifacts);

    this.logger.info('Model registered', { modelId, name: model.name, version: model.version });
    return modelId;
  }

  // Utility Methods
  private async preprocessInput(config: ModelConfig, input: any): Promise<any> {
    let processed = input;

    for (const step of config.preprocessing.steps) {
      switch (step.type) {
        case 'normalize':
          processed = this.normalizeInput(processed, step.params);
          break;
        case 'tokenize':
          processed = this.tokenizeInput(processed, step.params);
          break;
        case 'resize':
          processed = this.resizeInput(processed, step.params);
          break;
      }
    }

    return processed;
  }

  private async postprocessOutput(config: ModelConfig, output: any): Promise<any> {
    let processed = output;

    for (const step of config.postprocessing.steps) {
      switch (step.type) {
        case 'softmax':
          processed = this.applySoftmax(processed);
          break;
        case 'argmax':
          processed = this.applyArgmax(processed);
          break;
        case 'decode':
          processed = this.decodeOutput(processed, step.params);
          break;
      }
    }

    return processed;
  }

  private normalizeInput(input: any, params: Record<string, any>): any {
    // Implement normalization logic
    return input;
  }

  private tokenizeInput(input: string, params: Record<string, any>): any {
    // Implement tokenization logic
    return input.split(' ').map(token => token.toLowerCase());
  }

  private resizeInput(input: any, params: Record<string, any>): any {
    // Implement image resizing logic
    return input;
  }

  private applySoftmax(output: number[]): number[] {
    const max = Math.max(...output);
    const exp = output.map(x => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b);
    return exp.map(x => x / sum);
  }

  private applyArgmax(output: number[]): number {
    return output.indexOf(Math.max(...output));
  }

  private decodeOutput(output: any, params: Record<string, any>): any {
    // Implement decoding logic
    return output;
  }

  private calculateConfidence(prediction: any): number {
    if (Array.isArray(prediction)) {
      return Math.max(...prediction);
    }
    return 1.0;
  }

  private generateCacheKey(modelName: string, input: any): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify({ modelName, input }))
      .digest('hex');
    return `prediction:${hash}`;
  }

  private async getCachedPrediction(key: string): Promise<any> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  private async cachePrediction(key: string, result: InferenceResult): Promise<void> {
    await this.redis.setex(key, this.config.serving.caching.ttl, JSON.stringify(result));
  }

  private async logInference(result: InferenceResult): Promise<void> {
    await this.postgres.query(
      'INSERT INTO inference_logs (model_name, request_id, latency, created_at) VALUES ($1, $2, $3, $4)',
      [result.modelName, result.requestId, result.latency, new Date()]
    );
  }

  private setupScheduledJobs(): void {
    // Daily model performance monitoring
    cron.schedule('0 2 * * *', async () => {
      await this.runDailyMonitoring();
    });

    // Weekly drift detection
    cron.schedule('0 3 * * 0', async () => {
      await this.runWeeklyDriftDetection();
    });
  }

  private async runDailyMonitoring(): Promise<void> {
    this.logger.info('Running daily monitoring tasks');
    // Implementation would go here
  }

  private async runWeeklyDriftDetection(): Promise<void> {
    this.logger.info('Running weekly drift detection');
    // Implementation would go here
  }

  // Additional placeholder methods
  private async processBatchInference(job: any): Promise<void> { /* Implementation */ }
  private async loadTrainingData(source: string): Promise<any> { return {}; }
  private async preprocessTrainingData(data: any, config: any): Promise<any> { return data; }
  private async trainModel(config: any, data: any): Promise<any> { return {}; }
  private async validateModel(model: any, data: any): Promise<any> { return { metrics: {} }; }
  private async saveModel(model: any, path: string): Promise<string> { return path; }
  private async deployModelWithTrafficSplit(model: string, percentage: number): Promise<void> {}
  private async startABTestMonitoring(testId: string, config: ABTestingConfig): Promise<void> {}
  private async storeModelArtifacts(path: string, artifacts: any): Promise<void> {}

  // Shutdown
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down ML platform...');

    // Close database connections
    await this.postgres.end();
    this.redis.disconnect();

    // Stop queues
    await this.trainingQueue.close();
    await this.inferenceQueue.close();

    // Stop monitoring
    await this.monitoring.stop();

    this.logger.info('ML platform shutdown complete');
  }
}

// Supporting classes
interface LoadedModel {
  config: ModelConfig;
  handler: any;
  type: string;
  loaded: boolean;
  lastUsed: number;
}

interface InferenceOptions {
  skipCache?: boolean;
  timeout?: number;
}

interface InferenceResult {
  modelName: string;
  modelVersion: string;
  prediction: any;
  confidence: number;
  requestId: string;
  latency: number;
  fromCache: boolean;
}

interface SimilarityResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

interface DriftResult {
  hasDrift: boolean;
  methods: Record<string, number>;
  timestamp: Date;
}

interface PerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc?: number;
}

interface ModelArtifacts {
  model: Buffer;
  metadata: Record<string, any>;
  requirements?: string[];
}

interface OptimizationResult {
  bestParams: Record<string, any>;
  bestScore: number;
  trials: any[];
}

// Vector Database Interface
abstract class VectorDatabase {
  abstract initialize(): Promise<void>;
  abstract upsert(index: string, vectors: any[]): Promise<void>;
  abstract query(index: string, vector: number[], topK: number, filter?: any): Promise<SimilarityResult[]>;
}

class PineconeVectorDB extends VectorDatabase {
  private client: PineconeClient;

  constructor(config: VectorDatabaseConfig) {
    super();
    this.client = new PineconeClient();
  }

  async initialize(): Promise<void> {
    await this.client.init({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
  }

  async upsert(index: string, vectors: any[]): Promise<void> {
    const pineconeIndex = this.client.Index(index);
    await pineconeIndex.upsert({ upsertRequest: { vectors } });
  }

  async query(index: string, vector: number[], topK: number, filter?: any): Promise<SimilarityResult[]> {
    const pineconeIndex = this.client.Index(index);
    const response = await pineconeIndex.query({
      queryRequest: { vector, topK, includeMetadata: true, filter }
    });

    return response.matches?.map(match => ({
      id: match.id!,
      score: match.score!,
      metadata: match.metadata || {},
    })) || [];
  }
}

class ChromaVectorDB extends VectorDatabase {
  private client: ChromaClient;

  constructor(config: VectorDatabaseConfig) {
    super();
    this.client = new ChromaClient({ path: config.connection.host });
  }

  async initialize(): Promise<void> {
    // ChromaDB initialization
  }

  async upsert(index: string, vectors: any[]): Promise<void> {
    const collection = await this.client.getOrCreateCollection({ name: index });
    await collection.upsert({
      ids: vectors.map(v => v.id),
      embeddings: vectors.map(v => v.values),
      metadatas: vectors.map(v => v.metadata),
    });
  }

  async query(index: string, vector: number[], topK: number, filter?: any): Promise<SimilarityResult[]> {
    const collection = await this.client.getCollection({ name: index });
    const results = await collection.query({
      queryEmbeddings: [vector],
      nResults: topK,
      where: filter,
    });

    return results.ids[0].map((id, i) => ({
      id,
      score: results.distances![0][i],
      metadata: results.metadatas![0][i] || {},
    }));
  }
}

// Additional supporting classes would be defined here:
// ExperimentTracker, ModelMonitoring, FeatureStore, HyperparameterOptimizer, etc.

class ExperimentTracker {
  constructor(private config: ExperimentConfig) {}
  async startExperiment(params: any): Promise<any> { return { id: uuidv4() }; }
  async logMetrics(id: string, metrics: any): Promise<void> {}
  async logArtifacts(id: string, artifacts: any): Promise<void> {}
  async endExperiment(id: string, results: any): Promise<void> {}
}

class ModelMonitoring {
  constructor(private config: MLMonitoringConfig, private logger: Logger) {}
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  async detectDrift(modelName: string, data: any[]): Promise<DriftResult> {
    return { hasDrift: false, methods: {}, timestamp: new Date() };
  }
  async evaluatePerformance(modelName: string, predictions: any[], labels: any[]): Promise<PerformanceMetrics> {
    return { accuracy: 0.9, precision: 0.9, recall: 0.9, f1Score: 0.9 };
  }
}

class FeatureStore {
  constructor(private postgres: Pool, private redis: Redis, private logger: Logger) {}
}

class HyperparameterOptimizer {
  constructor(private config: HyperparameterConfig, private logger: Logger) {}
  async optimize(): Promise<OptimizationResult> {
    return { bestParams: {}, bestScore: 0, trials: [] };
  }
}

// Example usage
export async function createMLPlatformExample(): Promise<void> {
  const config: MLPlatformConfig = {
    models: [
      {
        name: 'text-classifier',
        version: '1.0.0',
        type: 'tensorflow',
        framework: 'tensorflow',
        task: 'classification',
        input: {
          type: 'text',
          validation: z.string(),
        },
        output: {
          type: 'classification',
          labels: ['positive', 'negative', 'neutral'],
        },
        preprocessing: {
          steps: [
            { name: 'tokenize', type: 'tokenize', params: { maxLength: 512 } },
            { name: 'normalize', type: 'normalize', params: {} },
          ],
          caching: true,
        },
        postprocessing: {
          steps: [
            { name: 'softmax', type: 'softmax', params: {} },
          ],
        },
        metadata: {
          description: 'Text sentiment classification model',
          author: 'ML Team',
          created: '2024-01-01',
          accuracy: 0.92,
          metrics: { f1: 0.91, precision: 0.93 },
          tags: ['nlp', 'classification'],
          dependencies: ['tensorflow'],
        },
      },
    ],
    vectorDB: {
      provider: 'pinecone',
      connection: {
        apiKey: 'pinecone-api-key',
        environment: 'us-west1-gcp',
        host: '',
      },
      indexes: [
        {
          name: 'documents',
          dimension: 1536,
          metric: 'cosine',
        },
      ],
      embedding: {
        model: 'text-embedding-ada-002',
        provider: 'openai',
        dimension: 1536,
        batchSize: 100,
      },
    },
    serving: {
      endpoints: [
        {
          path: '/predict/text-classifier',
          model: 'text-classifier',
          method: 'sync',
          timeout: 5000,
          authentication: true,
        },
      ],
      autoscaling: {
        enabled: true,
        minReplicas: 2,
        maxReplicas: 10,
        targetCPU: 70,
        targetMemory: 80,
        scaleUpCooldown: 300,
        scaleDownCooldown: 600,
      },
      caching: {
        enabled: true,
        ttl: 3600,
        maxSize: 10000,
        strategy: 'lru',
      },
      rateLimit: {
        requestsPerMinute: 1000,
        burstSize: 100,
        scope: 'user',
      },
    },
    training: {
      pipelines: [
        {
          name: 'daily-retrain',
          type: 'supervised',
          schedule: '0 2 * * *',
          dataSource: 'training_data',
          outputModel: 'text-classifier-v2',
          validation: {
            strategy: 'holdout',
            splitRatio: 0.2,
            metrics: ['accuracy', 'f1', 'precision', 'recall'],
          },
        },
      ],
      compute: {
        provider: 'aws',
        instances: [
          {
            type: 'm5.xlarge',
            count: 2,
            memory: '16GB',
            storage: '100GB',
          },
        ],
        distributed: false,
        gpu: true,
      },
      data: {
        sources: [
          {
            name: 'training_data',
            type: 'postgres',
            connection: { host: 'localhost', database: 'ml_data' },
            query: 'SELECT text, label FROM training_samples',
          },
        ],
        preprocessing: {
          steps: [
            { name: 'clean', type: 'clean', params: {} },
            { name: 'split', type: 'split', params: { ratio: [0.8, 0.2] } },
          ],
          caching: true,
          parallelization: true,
        },
        validation: {
          schema: z.object({ text: z.string(), label: z.string() }),
          checks: [
            { name: 'completeness', type: 'completeness', threshold: 0.95 },
          ],
        },
        versioning: {
          enabled: true,
          storage: 'dvc',
          retention: 30,
        },
      },
      hyperparameter: {
        optimization: 'bayesian',
        trials: 100,
        objective: 'f1_score',
        parameters: {
          learningRate: { type: 'float', low: 0.0001, high: 0.01 },
          batchSize: { type: 'int', low: 16, high: 128 },
        },
      },
    },
    monitoring: {
      drift: {
        enabled: true,
        methods: ['ks', 'psi'],
        threshold: 0.05,
        window: 1000,
        frequency: '0 */6 * * *',
      },
      performance: {
        metrics: [
          { name: 'accuracy', type: 'accuracy', weight: 0.4 },
          { name: 'f1', type: 'f1', weight: 0.6 },
        ],
        baseline: { accuracy: 0.9, f1: 0.89 },
        degradationThreshold: 0.05,
        alerting: true,
      },
      data: {
        quality: { enabled: true, checks: ['completeness'], schedule: '0 */4 * * *' },
        volume: { enabled: true, expectedVolume: 10000, tolerance: 0.2 },
        freshness: { enabled: true, maxAge: 3600, schedule: '0 * * * *' },
      },
      alerts: [
        {
          name: 'drift-detected',
          condition: 'drift_score > 0.05',
          severity: 'high',
          channels: [{ type: 'slack', config: { webhook: 'slack-webhook' } }],
          cooldown: 3600,
        },
      ],
    },
    experiments: {
      tracking: {
        provider: 'mlflow',
        connection: { uri: 'http://localhost:5000' },
        autoLog: true,
        artifacts: true,
      },
      comparison: {
        metrics: ['accuracy', 'f1', 'latency'],
        visualization: true,
        reporting: true,
      },
      abTesting: {
        enabled: true,
        trafficSplit: [
          { model: 'text-classifier-v1', percentage: 80 },
          { model: 'text-classifier-v2', percentage: 20 },
        ],
        duration: 86400, // 1 day
        successMetrics: ['accuracy', 'latency'],
      },
    },
    deployment: {
      strategy: 'canary',
      environments: [
        {
          name: 'production',
          type: 'production',
          infrastructure: {
            provider: 'kubernetes',
            replicas: 3,
            resources: { cpu: '1000m', memory: '2Gi', storage: '10Gi' },
            networking: { ingress: true, loadBalancer: true, ssl: true },
          },
          validation: [
            { type: 'health', params: { endpoint: '/health' } },
            { type: 'performance', params: { latency: 100 } },
          ],
        },
      ],
      approval: {
        required: true,
        reviewers: ['ml-lead@company.com'],
        autoApprove: { accuracy: 0.95, performance: 100 },
      },
      rollback: {
        automatic: true,
        triggers: [
          { metric: 'error_rate', threshold: 0.05, duration: 300 },
        ],
        strategy: 'immediate',
      },
    },
    storage: {
      models: {
        type: 's3',
        connection: { bucket: 'ml-models' },
        encryption: true,
        compression: true,
      },
      data: {
        type: 's3',
        connection: { bucket: 'ml-data' },
        encryption: true,
        compression: true,
      },
      artifacts: {
        type: 's3',
        connection: { bucket: 'ml-artifacts' },
        encryption: true,
        compression: false,
      },
      cache: {
        type: 'local',
        connection: {},
        encryption: false,
        compression: false,
      },
    },
  };

  const platform = new MLPlatform(config);
  await platform.initialize();

  console.log('ML Platform with advanced MLOps, vector databases, and model serving running');
}

export { MLPlatform, MLPlatformConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Machine learning model development is needed
- MLOps pipeline implementation is required
- AI/ML platform engineering is requested
- Vector database integration is needed
- Model serving and inference optimization is required
- Experiment tracking and model monitoring is requested

This comprehensive machine learning and AI integration skill provides expert-level capabilities for building modern, scalable ML platforms with advanced MLOps, model serving, vector databases, and enterprise-grade AI engineering practices.