# Message Queue & Event Streaming Skill

Advanced message queue and event streaming expertise covering Apache Kafka, RabbitMQ, event sourcing architectures, stream processing, and comprehensive distributed messaging platform development.

## Skill Overview

Expert messaging and streaming knowledge including event-driven architecture, message broker deployment, stream processing frameworks, event sourcing patterns, message delivery guarantees, and modern distributed messaging platform engineering.

## Core Capabilities

### Event Streaming Platforms
- **Apache Kafka** - Cluster deployment, partition strategy, consumer groups, stream processing
- **Apache Pulsar** - Multi-tenancy, geo-replication, tiered storage, function deployment
- **AWS Kinesis** - Data streams, analytics, firehose, video streams integration
- **Event hubs** - Azure Event Hubs, Google Cloud Pub/Sub, real-time data ingestion

### Message Brokers & Queues
- **RabbitMQ** - Exchange types, routing patterns, clustering, high availability
- **Apache ActiveMQ** - JMS integration, network of brokers, advisory messages
- **Amazon SQS/SNS** - Queue types, dead letter queues, message filtering, fan-out patterns
- **Redis Streams** - Consumer groups, blocking reads, stream processing, persistence

### Event Sourcing & CQRS
- **Event store design** - Event schema evolution, snapshotting, replay mechanisms
- **CQRS implementation** - Command/query separation, read models, eventual consistency
- **Event replay** - Historical data reconstruction, event versioning, migration strategies
- **Saga patterns** - Distributed transactions, compensation logic, process managers

### Stream Processing & Analytics
- **Kafka Streams** - Stateful processing, windowing, joins, exactly-once semantics
- **Apache Flink** - Complex event processing, watermarks, checkpointing, fault tolerance
- **Apache Storm** - Real-time computation, spouts, bolts, stream grouping
- **ksqlDB** - Stream processing with SQL, materialized views, connectors

## Modern Message Queue & Event Streaming Implementation

### Comprehensive Event Streaming Platform with Kafka
```typescript
// Advanced event streaming platform with Kafka, event sourcing, and stream processing
import { Kafka, Consumer, Producer, EachMessagePayload, EachBatchPayload } from 'kafkajs';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import amqp from 'amqplib';
import express, { Express, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import cron from 'node-cron';
import AWS from 'aws-sdk';

// Types and interfaces
interface StreamingConfig {
  kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
    ssl?: boolean;
    sasl?: {
      mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
      username: string;
      password: string;
    };
  };
  redis: {
    url: string;
    cluster?: boolean;
    nodes?: string[];
  };
  rabbitmq: {
    url: string;
    exchanges: ExchangeConfig[];
    queues: QueueConfig[];
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    kinesis: {
      streamName: string;
      shardCount: number;
    };
    sqs: {
      queueUrls: string[];
    };
  };
}

interface Event {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: any;
  metadata: EventMetadata;
  timestamp: Date;
}

interface EventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: string;
  source: string;
  schemaVersion: string;
}

interface EventStore {
  append(streamName: string, events: Event[], expectedVersion?: number): Promise<void>;
  read(streamName: string, fromVersion?: number, maxCount?: number): Promise<Event[]>;
  readAll(fromPosition?: number, maxCount?: number): Promise<Event[]>;
  subscribe(streamName: string, handler: (event: Event) => Promise<void>): Promise<void>;
  createSnapshot(aggregateId: string, version: number, data: any): Promise<void>;
  getSnapshot(aggregateId: string): Promise<{ version: number; data: any } | null>;
}

interface StreamProcessor {
  name: string;
  inputTopics: string[];
  outputTopic?: string;
  processor: (message: any, context: ProcessorContext) => Promise<any>;
  config: {
    parallelism: number;
    checkpointInterval: number;
    windowSize?: number;
    retryPolicy: RetryPolicy;
  };
}

interface ProcessorContext {
  timestamp: number;
  partition: number;
  offset: string;
  headers: Record<string, string>;
  key?: string;
}

interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface ExchangeConfig {
  name: string;
  type: 'direct' | 'fanout' | 'topic' | 'headers';
  durable: boolean;
  autoDelete: boolean;
}

interface QueueConfig {
  name: string;
  durable: boolean;
  exclusive: boolean;
  autoDelete: boolean;
  arguments?: Record<string, any>;
}

interface DeadLetterQueue {
  originalTopic: string;
  deadLetterTopic: string;
  maxRetries: number;
  retryDelayMs: number;
}

// Event schemas
const eventSchema = z.object({
  type: z.string(),
  aggregateId: z.string().uuid(),
  aggregateType: z.string(),
  data: z.record(z.any()),
  metadata: z.object({
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    userId: z.string().optional(),
    source: z.string(),
    schemaVersion: z.string(),
  }),
});

// Core Event Streaming Platform
class EventStreamingPlatform extends EventEmitter {
  private config: StreamingConfig;
  private kafka: Kafka;
  private kafkaProducer: Producer;
  private kafkaConsumers: Map<string, Consumer> = new Map();
  private redis: Redis;
  private prisma: PrismaClient;
  private logger: Logger;
  private app: Express;

  // RabbitMQ
  private rabbitmqConnection?: amqp.Connection;
  private rabbitmqChannel?: amqp.Channel;

  // AWS Services
  private kinesis: AWS.Kinesis;
  private sqs: AWS.SQS;
  private sns: AWS.SNS;

  // Event Store
  private eventStore: EventStore;

  // Stream Processors
  private streamProcessors: Map<string, StreamProcessor> = new Map();
  private processorStates: Map<string, any> = new Map();

  // Dead Letter Queues
  private deadLetterQueues: Map<string, DeadLetterQueue> = new Map();

  // Metrics
  private metrics: Map<string, number> = new Map();

  constructor(config: StreamingConfig) {
    super();
    this.config = config;

    // Initialize Kafka
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      ssl: config.kafka.ssl,
      sasl: config.kafka.sasl,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.kafkaProducer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });

    // Initialize Redis
    if (config.redis.cluster) {
      this.redis = new Redis.Cluster(config.redis.nodes || []);
    } else {
      this.redis = new Redis(config.redis.url);
    }

    // Initialize AWS services
    AWS.config.update({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });

    this.kinesis = new AWS.Kinesis();
    this.sqs = new AWS.SQS();
    this.sns = new AWS.SNS();

    // Initialize other components
    this.prisma = new PrismaClient();
    this.app = express();

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console({ format: format.simple() }),
        new transports.File({ filename: 'streaming-platform.log' })
      ]
    });

    this.eventStore = new KafkaEventStore(this.kafka, this.logger);

    this.setupExpress();
    this.setupDeadLetterQueues();
    this.setupMetricsCollection();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Kafka
      await this.kafkaProducer.connect();
      this.logger.info('Connected to Kafka producer');

      // Initialize RabbitMQ
      await this.setupRabbitMQ();

      // Initialize event store
      await this.setupEventStore();

      // Setup stream processors
      await this.setupStreamProcessors();

      // Start metrics collection
      this.startMetricsCollection();

      this.logger.info('Event streaming platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize event streaming platform', { error });
      throw error;
    }
  }

  // Event Publishing
  async publishEvent(event: Omit<Event, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: Event = {
      id: uuidv4(),
      timestamp: new Date(),
      ...event,
    };

    try {
      // Validate event
      const validatedData = eventSchema.parse({
        type: fullEvent.type,
        aggregateId: fullEvent.aggregateId,
        aggregateType: fullEvent.aggregateType,
        data: fullEvent.data,
        metadata: fullEvent.metadata,
      });

      // Publish to Kafka
      const topic = this.getTopicForEventType(fullEvent.type);
      await this.kafkaProducer.send({
        topic,
        messages: [
          {
            key: fullEvent.aggregateId,
            value: JSON.stringify(fullEvent),
            headers: {
              eventId: fullEvent.id,
              eventType: fullEvent.type,
              aggregateType: fullEvent.aggregateType,
              version: fullEvent.version.toString(),
              correlationId: fullEvent.metadata.correlationId,
            },
            timestamp: fullEvent.timestamp.getTime().toString(),
          },
        ],
      });

      // Store in event store
      await this.eventStore.append(
        `${fullEvent.aggregateType}-${fullEvent.aggregateId}`,
        [fullEvent]
      );

      // Update metrics
      this.incrementMetric('events_published');
      this.incrementMetric(`events_published_${fullEvent.type}`);

      // Emit locally for synchronous handlers
      this.emit('event', fullEvent);

      this.logger.info('Event published', {
        eventId: fullEvent.id,
        type: fullEvent.type,
        aggregateId: fullEvent.aggregateId,
      });
    } catch (error) {
      this.logger.error('Failed to publish event', { event: fullEvent, error });
      throw error;
    }
  }

  // Event Subscription
  async subscribeToEvents(
    topics: string[],
    groupId: string,
    handler: (event: Event, context: ProcessorContext) => Promise<void>
  ): Promise<string> {
    const consumerId = `${groupId}-${uuidv4()}`;
    const consumer = this.kafka.consumer({ groupId });

    try {
      await consumer.connect();
      await consumer.subscribe({ topics });

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { message, topic, partition } = payload;

          try {
            const event: Event = JSON.parse(message.value?.toString() || '{}');
            const context: ProcessorContext = {
              timestamp: parseInt(message.timestamp || '0'),
              partition,
              offset: message.offset,
              headers: {},
              key: message.key?.toString(),
            };

            // Convert headers
            if (message.headers) {
              for (const [key, value] of Object.entries(message.headers)) {
                context.headers[key] = value?.toString() || '';
              }
            }

            await handler(event, context);

            this.incrementMetric('events_processed');
            this.incrementMetric(`events_processed_${event.type}`);
          } catch (error) {
            this.logger.error('Error processing event', { topic, partition, offset: message.offset, error });

            // Send to dead letter queue
            await this.sendToDeadLetterQueue(topic, message, error);
          }
        },
      });

      this.kafkaConsumers.set(consumerId, consumer);

      this.logger.info('Event subscription created', { consumerId, topics, groupId });
      return consumerId;
    } catch (error) {
      this.logger.error('Failed to create event subscription', { topics, groupId, error });
      throw error;
    }
  }

  // Stream Processing
  async registerStreamProcessor(processor: StreamProcessor): Promise<void> {
    this.streamProcessors.set(processor.name, processor);

    const consumer = this.kafka.consumer({
      groupId: `${processor.name}-group`,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    try {
      await consumer.connect();
      await consumer.subscribe({ topics: processor.inputTopics });

      await consumer.run({
        eachBatch: async (payload: EachBatchPayload) => {
          const { batch, commitOffsetsIfNecessary } = payload;
          const messages = batch.messages;

          // Process messages with windowing if configured
          if (processor.config.windowSize) {
            await this.processWithWindowing(processor, messages);
          } else {
            await this.processStreamBatch(processor, messages);
          }

          // Commit offsets after successful processing
          await commitOffsetsIfNecessary();
        },
      });

      this.logger.info('Stream processor registered', {
        name: processor.name,
        inputTopics: processor.inputTopics,
        outputTopic: processor.outputTopic,
      });
    } catch (error) {
      this.logger.error('Failed to register stream processor', { processor: processor.name, error });
      throw error;
    }
  }

  private async processStreamBatch(processor: StreamProcessor, messages: any[]): Promise<void> {
    const promises = messages.map(async (message) => {
      try {
        const inputData = JSON.parse(message.value.toString());
        const context: ProcessorContext = {
          timestamp: parseInt(message.timestamp),
          partition: message.partition,
          offset: message.offset,
          headers: {},
          key: message.key?.toString(),
        };

        // Convert headers
        if (message.headers) {
          for (const [key, value] of Object.entries(message.headers)) {
            context.headers[key] = value?.toString() || '';
          }
        }

        const result = await processor.processor(inputData, context);

        // Send result to output topic if configured
        if (processor.outputTopic && result) {
          await this.kafkaProducer.send({
            topic: processor.outputTopic,
            messages: [
              {
                key: message.key,
                value: JSON.stringify(result),
                headers: message.headers,
              },
            ],
          });
        }

        this.incrementMetric(`stream_processed_${processor.name}`);
      } catch (error) {
        this.logger.error('Stream processor error', {
          processor: processor.name,
          offset: message.offset,
          error,
        });

        // Apply retry policy
        await this.handleProcessorError(processor, message, error);
      }
    });

    await Promise.all(promises);
  }

  private async processWithWindowing(processor: StreamProcessor, messages: any[]): Promise<void> {
    const windowSize = processor.config.windowSize!;
    const now = Date.now();
    const windowStart = Math.floor(now / windowSize) * windowSize;
    const windowEnd = windowStart + windowSize;

    // Group messages by window
    const windowMessages = messages.filter(message => {
      const timestamp = parseInt(message.timestamp);
      return timestamp >= windowStart && timestamp < windowEnd;
    });

    if (windowMessages.length > 0) {
      const aggregatedData = this.aggregateWindowData(windowMessages);
      const context: ProcessorContext = {
        timestamp: windowStart,
        partition: windowMessages[0].partition,
        offset: windowMessages[windowMessages.length - 1].offset,
        headers: {},
      };

      try {
        const result = await processor.processor(aggregatedData, context);

        if (processor.outputTopic && result) {
          await this.kafkaProducer.send({
            topic: processor.outputTopic,
            messages: [
              {
                key: `window-${windowStart}`,
                value: JSON.stringify({
                  window: { start: windowStart, end: windowEnd },
                  data: result,
                }),
              },
            ],
          });
        }
      } catch (error) {
        this.logger.error('Windowed stream processor error', {
          processor: processor.name,
          window: { start: windowStart, end: windowEnd },
          error,
        });
      }
    }
  }

  // Event Sourcing
  async getAggregate<T>(aggregateType: string, aggregateId: string): Promise<T | null> {
    try {
      // Try to get snapshot first
      const snapshot = await this.eventStore.getSnapshot(aggregateId);
      let version = 0;
      let aggregate: any = null;

      if (snapshot) {
        aggregate = snapshot.data;
        version = snapshot.version;
      }

      // Get events since snapshot
      const streamName = `${aggregateType}-${aggregateId}`;
      const events = await this.eventStore.read(streamName, version + 1);

      // Apply events to rebuild aggregate
      for (const event of events) {
        aggregate = this.applyEvent(aggregate, event);
        version = event.version;
      }

      return aggregate;
    } catch (error) {
      this.logger.error('Failed to get aggregate', { aggregateType, aggregateId, error });
      return null;
    }
  }

  async saveAggregate<T>(
    aggregateType: string,
    aggregateId: string,
    events: Event[],
    expectedVersion?: number
  ): Promise<void> {
    const streamName = `${aggregateType}-${aggregateId}`;

    try {
      // Append events to event store
      await this.eventStore.append(streamName, events, expectedVersion);

      // Publish events to Kafka
      for (const event of events) {
        await this.publishEvent(event);
      }

      // Create snapshot if needed
      if (events.length > 0 && events[events.length - 1].version % 100 === 0) {
        const aggregate = await this.getAggregate<T>(aggregateType, aggregateId);
        if (aggregate) {
          await this.eventStore.createSnapshot(
            aggregateId,
            events[events.length - 1].version,
            aggregate
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to save aggregate', { aggregateType, aggregateId, error });
      throw error;
    }
  }

  // RabbitMQ Integration
  private async setupRabbitMQ(): Promise<void> {
    try {
      this.rabbitmqConnection = await amqp.connect(this.config.rabbitmq.url);
      this.rabbitmqChannel = await this.rabbitmqConnection.createChannel();

      // Setup exchanges
      for (const exchange of this.config.rabbitmq.exchanges) {
        await this.rabbitmqChannel.assertExchange(
          exchange.name,
          exchange.type,
          {
            durable: exchange.durable,
            autoDelete: exchange.autoDelete,
          }
        );
      }

      // Setup queues
      for (const queue of this.config.rabbitmq.queues) {
        await this.rabbitmqChannel.assertQueue(
          queue.name,
          {
            durable: queue.durable,
            exclusive: queue.exclusive,
            autoDelete: queue.autoDelete,
            arguments: queue.arguments,
          }
        );
      }

      this.logger.info('RabbitMQ setup completed');
    } catch (error) {
      this.logger.error('Failed to setup RabbitMQ', { error });
      throw error;
    }
  }

  async publishToRabbitMQ(
    exchange: string,
    routingKey: string,
    message: any,
    options?: amqp.Options.Publish
  ): Promise<void> {
    if (!this.rabbitmqChannel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.rabbitmqChannel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
        messageId: uuidv4(),
        ...options,
      });

      this.incrementMetric('rabbitmq_messages_published');
    } catch (error) {
      this.logger.error('Failed to publish to RabbitMQ', { exchange, routingKey, error });
      throw error;
    }
  }

  async subscribeToRabbitMQ(
    queue: string,
    handler: (message: any, ack: () => void, nack: () => void) => Promise<void>
  ): Promise<void> {
    if (!this.rabbitmqChannel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    try {
      await this.rabbitmqChannel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const message = JSON.parse(msg.content.toString());
            await handler(
              message,
              () => this.rabbitmqChannel!.ack(msg),
              () => this.rabbitmqChannel!.nack(msg, false, true)
            );
          } catch (error) {
            this.logger.error('Error processing RabbitMQ message', { queue, error });
            this.rabbitmqChannel!.nack(msg, false, false); // Dead letter
          }
        }
      });

      this.logger.info('RabbitMQ subscription created', { queue });
    } catch (error) {
      this.logger.error('Failed to subscribe to RabbitMQ', { queue, error });
      throw error;
    }
  }

  // AWS Integration
  async publishToKinesis(streamName: string, data: any, partitionKey: string): Promise<void> {
    try {
      const params = {
        StreamName: streamName,
        Data: JSON.stringify(data),
        PartitionKey: partitionKey,
      };

      await this.kinesis.putRecord(params).promise();
      this.incrementMetric('kinesis_records_published');
    } catch (error) {
      this.logger.error('Failed to publish to Kinesis', { streamName, error });
      throw error;
    }
  }

  async publishToSQS(queueUrl: string, message: any, delaySeconds?: number): Promise<void> {
    try {
      const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        DelaySeconds: delaySeconds,
        MessageAttributes: {
          timestamp: {
            DataType: 'String',
            StringValue: Date.now().toString(),
          },
        },
      };

      await this.sqs.sendMessage(params).promise();
      this.incrementMetric('sqs_messages_published');
    } catch (error) {
      this.logger.error('Failed to publish to SQS', { queueUrl, error });
      throw error;
    }
  }

  // Dead Letter Queue Management
  private setupDeadLetterQueues(): void {
    // Setup dead letter queues for different topics
    this.deadLetterQueues.set('user-events', {
      originalTopic: 'user-events',
      deadLetterTopic: 'user-events-dlq',
      maxRetries: 3,
      retryDelayMs: 1000,
    });

    this.deadLetterQueues.set('order-events', {
      originalTopic: 'order-events',
      deadLetterTopic: 'order-events-dlq',
      maxRetries: 5,
      retryDelayMs: 2000,
    });
  }

  private async sendToDeadLetterQueue(topic: string, message: any, error: Error): Promise<void> {
    const dlqConfig = this.deadLetterQueues.get(topic);
    if (!dlqConfig) return;

    try {
      const deadLetterMessage = {
        originalTopic: topic,
        originalMessage: message.value?.toString(),
        error: error.message,
        failedAt: new Date(),
        retryCount: 0,
        headers: message.headers,
      };

      await this.kafkaProducer.send({
        topic: dlqConfig.deadLetterTopic,
        messages: [
          {
            key: message.key,
            value: JSON.stringify(deadLetterMessage),
          },
        ],
      });

      this.incrementMetric('dead_letter_messages');
    } catch (dlqError) {
      this.logger.error('Failed to send message to dead letter queue', { topic, error: dlqError });
    }
  }

  async retryDeadLetterMessages(topic: string): Promise<void> {
    const dlqConfig = this.deadLetterQueues.get(topic);
    if (!dlqConfig) return;

    const consumer = this.kafka.consumer({ groupId: `${dlqConfig.deadLetterTopic}-retry` });

    try {
      await consumer.connect();
      await consumer.subscribe({ topics: [dlqConfig.deadLetterTopic] });

      await consumer.run({
        eachMessage: async ({ message }) => {
          try {
            const deadLetterMessage = JSON.parse(message.value?.toString() || '{}');

            if (deadLetterMessage.retryCount < dlqConfig.maxRetries) {
              // Retry the original message
              await this.kafkaProducer.send({
                topic: dlqConfig.originalTopic,
                messages: [
                  {
                    key: message.key,
                    value: deadLetterMessage.originalMessage,
                    headers: deadLetterMessage.headers,
                  },
                ],
              });

              // Update retry count
              deadLetterMessage.retryCount++;
              deadLetterMessage.retriedAt = new Date();

              await this.kafkaProducer.send({
                topic: dlqConfig.deadLetterTopic,
                messages: [
                  {
                    key: message.key,
                    value: JSON.stringify(deadLetterMessage),
                  },
                ],
              });
            }
          } catch (error) {
            this.logger.error('Failed to retry dead letter message', { error });
          }
        },
      });
    } catch (error) {
      this.logger.error('Failed to setup dead letter retry consumer', { topic, error });
    }
  }

  // Utility methods
  private applyEvent(aggregate: any, event: Event): any {
    // Event application logic would depend on your domain
    // This is a simplified example
    switch (event.type) {
      case 'UserCreated':
        return { ...event.data, id: event.aggregateId, version: event.version };
      case 'UserUpdated':
        return { ...aggregate, ...event.data, version: event.version };
      default:
        return aggregate;
    }
  }

  private getTopicForEventType(eventType: string): string {
    // Map event types to topics
    const eventTypeToTopic: Record<string, string> = {
      'UserCreated': 'user-events',
      'UserUpdated': 'user-events',
      'OrderPlaced': 'order-events',
      'OrderShipped': 'order-events',
      'PaymentProcessed': 'payment-events',
    };

    return eventTypeToTopic[eventType] || 'general-events';
  }

  private aggregateWindowData(messages: any[]): any {
    // Aggregate messages within a window
    const aggregated = {
      count: messages.length,
      data: messages.map(m => JSON.parse(m.value.toString())),
      window: {
        start: Math.min(...messages.map(m => parseInt(m.timestamp))),
        end: Math.max(...messages.map(m => parseInt(m.timestamp))),
      },
    };

    return aggregated;
  }

  private async handleProcessorError(processor: StreamProcessor, message: any, error: Error): Promise<void> {
    const retryPolicy = processor.config.retryPolicy;
    const retryKey = `retry:${processor.name}:${message.offset}`;

    try {
      const retryCount = await this.redis.get(retryKey);
      const currentRetries = parseInt(retryCount || '0');

      if (currentRetries < retryPolicy.maxRetries) {
        const delay = Math.min(
          retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, currentRetries),
          retryPolicy.maxDelay
        );

        await this.redis.setex(retryKey, 3600, (currentRetries + 1).toString());

        setTimeout(async () => {
          try {
            const inputData = JSON.parse(message.value.toString());
            const context: ProcessorContext = {
              timestamp: parseInt(message.timestamp),
              partition: message.partition,
              offset: message.offset,
              headers: {},
              key: message.key?.toString(),
            };

            await processor.processor(inputData, context);
          } catch (retryError) {
            await this.handleProcessorError(processor, message, retryError as Error);
          }
        }, delay);
      } else {
        // Max retries exceeded, send to dead letter queue
        await this.sendToDeadLetterQueue(processor.inputTopics[0], message, error);
      }
    } catch (retryError) {
      this.logger.error('Error handling processor retry', { processor: processor.name, error: retryError });
    }
  }

  // Metrics and monitoring
  private setupMetricsCollection(): void {
    // Initialize metrics
    this.metrics.set('events_published', 0);
    this.metrics.set('events_processed', 0);
    this.metrics.set('dead_letter_messages', 0);
    this.metrics.set('rabbitmq_messages_published', 0);
    this.metrics.set('kinesis_records_published', 0);
    this.metrics.set('sqs_messages_published', 0);
  }

  private startMetricsCollection(): void {
    // Collect metrics every minute
    cron.schedule('* * * * *', () => {
      this.collectMetrics();
    });
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect Kafka metrics
      const admin = this.kafka.admin();
      await admin.connect();

      const metadata = await admin.fetchTopicMetadata();
      const kafkaMetrics = {
        topicCount: metadata.topics.length,
        brokerCount: metadata.brokers.length,
      };

      this.logger.info('Platform metrics', {
        kafka: kafkaMetrics,
        application: Object.fromEntries(this.metrics),
      });

      await admin.disconnect();
    } catch (error) {
      this.logger.error('Failed to collect metrics', { error });
    }
  }

  private incrementMetric(name: string): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + 1);
  }

  // Event Store Setup
  private async setupEventStore(): Promise<void> {
    // Setup topics for event store
    const admin = this.kafka.admin();
    await admin.connect();

    try {
      await admin.createTopics({
        topics: [
          {
            topic: 'eventstore-events',
            numPartitions: 10,
            replicationFactor: 3,
            configEntries: [
              { name: 'cleanup.policy', value: 'compact' },
              { name: 'min.compaction.lag.ms', value: '86400000' }, // 1 day
            ],
          },
          {
            topic: 'eventstore-snapshots',
            numPartitions: 5,
            replicationFactor: 3,
            configEntries: [
              { name: 'cleanup.policy', value: 'compact' },
            ],
          },
        ],
      });
    } catch (error) {
      // Topics might already exist
      this.logger.warn('Topics already exist or failed to create', { error: error.message });
    }

    await admin.disconnect();
  }

  private async setupStreamProcessors(): Promise<void> {
    // Example stream processors
    await this.registerStreamProcessor({
      name: 'user-activity-aggregator',
      inputTopics: ['user-events'],
      outputTopic: 'user-activity-summary',
      processor: async (data, context) => {
        // Aggregate user activity
        return {
          userId: data.userId,
          activityCount: 1,
          lastActivity: context.timestamp,
        };
      },
      config: {
        parallelism: 4,
        checkpointInterval: 5000,
        windowSize: 60000, // 1 minute window
        retryPolicy: {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        },
      },
    });

    await this.registerStreamProcessor({
      name: 'fraud-detection',
      inputTopics: ['payment-events'],
      outputTopic: 'fraud-alerts',
      processor: async (data, context) => {
        // Simple fraud detection logic
        if (data.amount > 10000) {
          return {
            alert: 'HIGH_VALUE_TRANSACTION',
            paymentId: data.paymentId,
            amount: data.amount,
            riskScore: 0.8,
          };
        }
        return null;
      },
      config: {
        parallelism: 8,
        checkpointInterval: 1000,
        retryPolicy: {
          maxRetries: 5,
          initialDelay: 500,
          maxDelay: 5000,
          backoffMultiplier: 1.5,
        },
      },
    });
  }

  // Express API Setup
  private setupExpress(): void {
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        metrics: Object.fromEntries(this.metrics),
      });
    });

    // Publish event endpoint
    this.app.post('/events', async (req: Request, res: Response) => {
      try {
        await this.publishEvent(req.body);
        res.status(201).json({ message: 'Event published successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to publish event' });
      }
    });

    // Get metrics endpoint
    this.app.get('/metrics', (req: Request, res: Response) => {
      res.json(Object.fromEntries(this.metrics));
    });
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      this.logger.info(`Event streaming platform API running on port ${port}`);
    });
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down event streaming platform...');

    // Disconnect Kafka
    await this.kafkaProducer.disconnect();
    for (const consumer of this.kafkaConsumers.values()) {
      await consumer.disconnect();
    }

    // Close RabbitMQ connection
    if (this.rabbitmqConnection) {
      await this.rabbitmqConnection.close();
    }

    // Close Redis connection
    this.redis.disconnect();

    this.logger.info('Event streaming platform shutdown completed');
  }
}

// Kafka-based Event Store implementation
class KafkaEventStore implements EventStore {
  private kafka: Kafka;
  private producer: Producer;
  private logger: Logger;
  private eventsTopic = 'eventstore-events';
  private snapshotsTopic = 'eventstore-snapshots';

  constructor(kafka: Kafka, logger: Logger) {
    this.kafka = kafka;
    this.logger = logger;
    this.producer = kafka.producer();
  }

  async append(streamName: string, events: Event[], expectedVersion?: number): Promise<void> {
    const messages = events.map(event => ({
      key: streamName,
      value: JSON.stringify(event),
      headers: {
        eventId: event.id,
        eventType: event.type,
        aggregateId: event.aggregateId,
        version: event.version.toString(),
      },
    }));

    await this.producer.send({
      topic: this.eventsTopic,
      messages,
    });
  }

  async read(streamName: string, fromVersion?: number, maxCount?: number): Promise<Event[]> {
    // Implementation would use Kafka consumer to read events for a specific stream
    // This is a simplified version
    return [];
  }

  async readAll(fromPosition?: number, maxCount?: number): Promise<Event[]> {
    // Implementation would read all events from all streams
    return [];
  }

  async subscribe(streamName: string, handler: (event: Event) => Promise<void>): Promise<void> {
    // Implementation would subscribe to events for a specific stream
  }

  async createSnapshot(aggregateId: string, version: number, data: any): Promise<void> {
    const snapshot = {
      aggregateId,
      version,
      data,
      createdAt: new Date(),
    };

    await this.producer.send({
      topic: this.snapshotsTopic,
      messages: [
        {
          key: aggregateId,
          value: JSON.stringify(snapshot),
        },
      ],
    });
  }

  async getSnapshot(aggregateId: string): Promise<{ version: number; data: any } | null> {
    // Implementation would get the latest snapshot for an aggregate
    return null;
  }
}

// Example usage
export async function createEventStreamingExample(): Promise<void> {
  const config: StreamingConfig = {
    kafka: {
      brokers: ['localhost:9092'],
      clientId: 'event-streaming-platform',
      groupId: 'platform-group',
    },
    redis: {
      url: 'redis://localhost:6379',
    },
    rabbitmq: {
      url: 'amqp://localhost:5672',
      exchanges: [
        { name: 'events', type: 'topic', durable: true, autoDelete: false },
      ],
      queues: [
        { name: 'user-events', durable: true, exclusive: false, autoDelete: false },
      ],
    },
    aws: {
      region: 'us-west-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      kinesis: {
        streamName: 'event-stream',
        shardCount: 4,
      },
      sqs: {
        queueUrls: ['https://sqs.us-west-2.amazonaws.com/account/queue-name'],
      },
    },
  };

  const platform = new EventStreamingPlatform(config);
  await platform.initialize();

  // Example event publishing
  await platform.publishEvent({
    type: 'UserCreated',
    aggregateId: '12345',
    aggregateType: 'User',
    version: 1,
    data: {
      email: 'user@example.com',
      name: 'John Doe',
    },
    metadata: {
      correlationId: uuidv4(),
      source: 'user-service',
      schemaVersion: '1.0',
    },
  });

  // Example event subscription
  await platform.subscribeToEvents(
    ['user-events'],
    'user-processor',
    async (event, context) => {
      console.log('Processing event:', event.type, event.data);
    }
  );

  platform.start(3000);
}

export { EventStreamingPlatform, StreamingConfig, Event, EventStore };
```

## Skill Activation Triggers

This skill automatically activates when:
- Event-driven architecture implementation is needed
- Message queue and streaming systems are required
- Event sourcing and CQRS patterns are requested
- Distributed system communication is needed
- Real-time data processing and analytics are required
- Asynchronous messaging and workflow orchestration are requested

This comprehensive message queue and event streaming skill provides expert-level capabilities for building modern, scalable event-driven systems with advanced patterns for messaging, streaming, and distributed data processing.