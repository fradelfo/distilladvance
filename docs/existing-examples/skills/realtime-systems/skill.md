# Real-Time Systems Development Skill

Advanced real-time systems development expertise covering WebSocket implementations, event streaming, message queues, live collaboration, real-time analytics, and low-latency system architecture.

## Skill Overview

Expert real-time systems knowledge including event-driven architectures, message streaming platforms, WebSocket implementations, real-time collaboration systems, live data processing, and distributed real-time computing.

## Core Capabilities

### Real-Time Communication
- **WebSocket systems** - Socket.IO, native WebSockets, connection management, scaling
- **Server-Sent Events** - Live updates, event streaming, browser compatibility
- **WebRTC integration** - Peer-to-peer communication, video/audio streaming, data channels
- **Push notifications** - Web push, mobile push, notification channels, targeting

### Message Streaming & Queuing
- **Apache Kafka** - Event streaming, partitioning, consumer groups, stream processing
- **Redis Streams** - Event sourcing, consumer groups, message persistence
- **RabbitMQ/NATS** - Message queuing, pub/sub patterns, reliable delivery
- **Event sourcing** - Event store design, replay capabilities, CQRS implementation

### Live Collaboration Systems
- **Operational transformation** - Conflict resolution, text editing, state synchronization
- **CRDT implementation** - Conflict-free replicated data types, distributed consistency
- **Real-time editing** - Collaborative documents, live cursors, presence awareness
- **Synchronization protocols** - State sync, delta synchronization, conflict resolution

### Performance & Scalability
- **Connection pooling** - WebSocket load balancing, sticky sessions, horizontal scaling
- **Event processing** - Stream processing, real-time analytics, complex event processing
- **Caching strategies** - Redis clustering, in-memory caching, cache invalidation
- **Load distribution** - Geographic distribution, edge computing, CDN integration

## Modern Real-Time Systems Implementation

### Comprehensive Real-Time Platform with Node.js and TypeScript
```typescript
// Advanced real-time platform with WebSocket clustering and event streaming
import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import WebSocket from 'ws';
import { diff_match_patch } from 'diff-match-patch';

// Types and interfaces
interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  rooms?: Set<string>;
}

interface RealTimeEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  roomId?: string;
  metadata?: Record<string, any>;
}

interface PresenceData {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: number;
  metadata?: Record<string, any>;
}

interface DocumentOperation {
  id: string;
  documentId: string;
  userId: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
}

// Real-Time Platform Core Class
class RealTimePlatform extends EventEmitter {
  private app: Express;
  private httpServer: HttpServer;
  private io: SocketIOServer;
  private redis: Redis;
  private redisPublisher: Redis;
  private redisSubscriber: Redis;
  private kafka: Kafka;
  private kafkaProducer: Producer;
  private kafkaConsumer: Consumer;
  private prisma: PrismaClient;
  private logger: Logger;
  private rateLimiter: RateLimiterRedis;
  private dmp: diff_match_patch;

  // Connection and room management
  private connections: Map<string, AuthenticatedSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private presence: Map<string, PresenceData> = new Map();
  private documents: Map<string, DocumentState> = new Map();

  constructor(config: RealTimeConfig) {
    super();

    this.app = express();
    this.httpServer = createServer(this.app);
    this.redis = new Redis(config.redis.url);
    this.redisPublisher = new Redis(config.redis.url);
    this.redisSubscriber = new Redis(config.redis.url);
    this.prisma = new PrismaClient();
    this.dmp = new diff_match_patch();

    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.File({ filename: 'realtime.log' }),
        new transports.Console({ format: format.simple() })
      ]
    });

    this.rateLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyGenerator: (req: any) => req.user?.id || req.ip,
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
    });

    this.setupSocketIO(config);
    this.setupKafka(config);
    this.setupEventHandlers();
    this.setupHTTPRoutes();
  }

  private setupSocketIO(config: RealTimeConfig): void {
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.cors.origins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Redis adapter for scaling across multiple instances
    this.io.adapter(createAdapter(this.redisPublisher, this.redisSubscriber));

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, role: true }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        socket.rooms = new Set();
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Rate limiting middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        await this.rateLimiter.consume(socket.user?.id || socket.handshake.address);
        next();
      } catch (rejRes) {
        next(new Error('Rate limit exceeded'));
      }
    });

    this.io.on('connection', this.handleConnection.bind(this));
  }

  private setupKafka(config: RealTimeConfig): void {
    this.kafka = new Kafka({
      clientId: 'realtime-platform',
      brokers: config.kafka.brokers
    });

    this.kafkaProducer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000
    });

    this.kafkaConsumer = this.kafka.consumer({
      groupId: 'realtime-platform-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
  }

  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    this.logger.info(`User connected: ${socket.user?.id}`);

    // Store connection
    this.connections.set(socket.id, socket);

    // Update presence
    await this.updatePresence(socket.user!.id, {
      userId: socket.user!.id,
      userName: socket.user!.name,
      status: 'online',
      lastSeen: Date.now()
    });

    // Setup event handlers
    this.setupSocketEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', async () => {
      await this.handleDisconnection(socket);
    });

    // Send initial presence data
    socket.emit('presence:update', Array.from(this.presence.values()));
  }

  private setupSocketEventHandlers(socket: AuthenticatedSocket): void {
    // Room management
    socket.on('room:join', async (data: { roomId: string; password?: string }) => {
      await this.handleRoomJoin(socket, data);
    });

    socket.on('room:leave', async (data: { roomId: string }) => {
      await this.handleRoomLeave(socket, data);
    });

    // Real-time messaging
    socket.on('message:send', async (data: any) => {
      await this.handleMessageSend(socket, data);
    });

    // Document collaboration
    socket.on('document:join', async (data: { documentId: string }) => {
      await this.handleDocumentJoin(socket, data);
    });

    socket.on('document:operation', async (data: DocumentOperation) => {
      await this.handleDocumentOperation(socket, data);
    });

    socket.on('document:cursor', async (data: any) => {
      await this.handleCursorUpdate(socket, data);
    });

    // Presence updates
    socket.on('presence:update', async (data: Partial<PresenceData>) => {
      await this.handlePresenceUpdate(socket, data);
    });

    // Custom events
    socket.on('event:custom', async (data: any) => {
      await this.handleCustomEvent(socket, data);
    });
  }

  // Room Management
  private async handleRoomJoin(socket: AuthenticatedSocket, data: { roomId: string; password?: string }): Promise<void> {
    try {
      const { roomId, password } = data;

      // Validate room access
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: { participants: true }
      });

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.password && room.password !== password) {
        socket.emit('error', { message: 'Invalid room password' });
        return;
      }

      // Join socket.io room
      await socket.join(roomId);
      socket.rooms?.add(roomId);

      // Update room participants
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId)?.add(socket.user!.id);

      // Notify other participants
      socket.to(roomId).emit('room:user_joined', {
        userId: socket.user!.id,
        userName: socket.user!.name,
        timestamp: Date.now()
      });

      // Send room state to new participant
      socket.emit('room:joined', {
        roomId,
        participants: Array.from(this.rooms.get(roomId) || [])
      });

      // Publish event to Kafka for persistence
      await this.publishEvent({
        type: 'room.joined',
        payload: { roomId, userId: socket.user!.id },
        userId: socket.user!.id,
        roomId
      });

      this.logger.info(`User ${socket.user!.id} joined room ${roomId}`);
    } catch (error) {
      this.logger.error('Room join error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private async handleRoomLeave(socket: AuthenticatedSocket, data: { roomId: string }): Promise<void> {
    try {
      const { roomId } = data;

      await socket.leave(roomId);
      socket.rooms?.delete(roomId);

      // Update room participants
      this.rooms.get(roomId)?.delete(socket.user!.id);

      // Notify other participants
      socket.to(roomId).emit('room:user_left', {
        userId: socket.user!.id,
        userName: socket.user!.name,
        timestamp: Date.now()
      });

      // Publish event
      await this.publishEvent({
        type: 'room.left',
        payload: { roomId, userId: socket.user!.id },
        userId: socket.user!.id,
        roomId
      });

      this.logger.info(`User ${socket.user!.id} left room ${roomId}`);
    } catch (error) {
      this.logger.error('Room leave error:', error);
    }
  }

  // Document Collaboration
  private async handleDocumentJoin(socket: AuthenticatedSocket, data: { documentId: string }): Promise<void> {
    try {
      const { documentId } = data;

      // Validate document access
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: { collaborators: true }
      });

      if (!document) {
        socket.emit('error', { message: 'Document not found' });
        return;
      }

      // Check permissions
      const hasAccess = document.collaborators.some(c => c.userId === socket.user!.id) ||
                       document.ownerId === socket.user!.id;

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Join document room
      const docRoomId = `doc:${documentId}`;
      await socket.join(docRoomId);

      // Get or initialize document state
      if (!this.documents.has(documentId)) {
        this.documents.set(documentId, {
          id: documentId,
          content: document.content,
          operations: [],
          collaborators: new Map(),
          cursors: new Map()
        });
      }

      const docState = this.documents.get(documentId)!;
      docState.collaborators.set(socket.user!.id, {
        userId: socket.user!.id,
        userName: socket.user!.name,
        joinedAt: Date.now()
      });

      // Send document state
      socket.emit('document:state', {
        documentId,
        content: docState.content,
        collaborators: Array.from(docState.collaborators.values()),
        cursors: Array.from(docState.cursors.values())
      });

      // Notify other collaborators
      socket.to(docRoomId).emit('document:collaborator_joined', {
        userId: socket.user!.id,
        userName: socket.user!.name,
        timestamp: Date.now()
      });

      this.logger.info(`User ${socket.user!.id} joined document ${documentId}`);
    } catch (error) {
      this.logger.error('Document join error:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  }

  private async handleDocumentOperation(socket: AuthenticatedSocket, operation: DocumentOperation): Promise<void> {
    try {
      const { documentId } = operation;
      const docState = this.documents.get(documentId);

      if (!docState) {
        socket.emit('error', { message: 'Document not found' });
        return;
      }

      // Apply operational transformation
      const transformedOp = this.transformOperation(operation, docState.operations);

      // Update document content
      docState.content = this.applyOperation(docState.content, transformedOp);
      docState.operations.push(transformedOp);

      // Limit operation history
      if (docState.operations.length > 1000) {
        docState.operations = docState.operations.slice(-500);
      }

      // Broadcast to other collaborators
      const docRoomId = `doc:${documentId}`;
      socket.to(docRoomId).emit('document:operation', transformedOp);

      // Publish to Kafka for persistence
      await this.publishEvent({
        type: 'document.operation',
        payload: transformedOp,
        userId: socket.user!.id,
        roomId: docRoomId
      });

      // Auto-save periodically
      await this.scheduleDocumentSave(documentId);

    } catch (error) {
      this.logger.error('Document operation error:', error);
      socket.emit('error', { message: 'Failed to apply operation' });
    }
  }

  private transformOperation(newOp: DocumentOperation, existingOps: DocumentOperation[]): DocumentOperation {
    // Simplified operational transformation
    // In production, use a more robust OT algorithm
    let transformedOp = { ...newOp };

    for (const existingOp of existingOps) {
      if (existingOp.timestamp > newOp.timestamp) {
        continue;
      }

      // Transform based on operation types
      if (existingOp.type === 'insert' && newOp.position >= existingOp.position) {
        transformedOp.position += existingOp.content?.length || 0;
      } else if (existingOp.type === 'delete' && newOp.position > existingOp.position) {
        transformedOp.position -= existingOp.length || 0;
      }
    }

    return transformedOp;
  }

  private applyOperation(content: string, operation: DocumentOperation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) +
               operation.content +
               content.slice(operation.position);
      case 'delete':
        return content.slice(0, operation.position) +
               content.slice(operation.position + (operation.length || 0));
      default:
        return content;
    }
  }

  // Message Broadcasting
  private async handleMessageSend(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { roomId, content, type = 'text', metadata = {} } = data;

      if (!socket.rooms?.has(roomId)) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }

      const message = {
        id: uuidv4(),
        roomId,
        userId: socket.user!.id,
        userName: socket.user!.name,
        content,
        type,
        metadata,
        timestamp: Date.now()
      };

      // Broadcast to room
      this.io.to(roomId).emit('message:received', message);

      // Publish to Kafka for persistence
      await this.publishEvent({
        type: 'message.sent',
        payload: message,
        userId: socket.user!.id,
        roomId
      });

      this.logger.info(`Message sent in room ${roomId} by user ${socket.user!.id}`);
    } catch (error) {
      this.logger.error('Message send error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // Presence Management
  private async updatePresence(userId: string, presenceData: PresenceData): Promise<void> {
    this.presence.set(userId, presenceData);

    // Broadcast presence update
    this.io.emit('presence:update', Array.from(this.presence.values()));

    // Store in Redis with TTL
    await this.redis.set(
      `presence:${userId}`,
      JSON.stringify(presenceData),
      'EX',
      300 // 5 minutes TTL
    );
  }

  private async handlePresenceUpdate(socket: AuthenticatedSocket, data: Partial<PresenceData>): Promise<void> {
    const currentPresence = this.presence.get(socket.user!.id);
    if (currentPresence) {
      const updatedPresence = { ...currentPresence, ...data, lastSeen: Date.now() };
      await this.updatePresence(socket.user!.id, updatedPresence);
    }
  }

  // Event Publishing
  private async publishEvent(event: Omit<RealTimeEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: RealTimeEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...event
    };

    try {
      await this.kafkaProducer.send({
        topic: 'realtime-events',
        messages: [{
          key: fullEvent.roomId || fullEvent.userId,
          value: JSON.stringify(fullEvent),
          timestamp: fullEvent.timestamp.toString()
        }]
      });
    } catch (error) {
      this.logger.error('Failed to publish event to Kafka:', error);
    }
  }

  // Kafka Event Processing
  private async setupKafkaConsumer(): Promise<void> {
    await this.kafkaConsumer.subscribe({ topics: ['realtime-events', 'analytics-events'] });

    await this.kafkaConsumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const event = JSON.parse(payload.message.value!.toString());
          await this.processKafkaEvent(event);
        } catch (error) {
          this.logger.error('Kafka message processing error:', error);
        }
      }
    });
  }

  private async processKafkaEvent(event: RealTimeEvent): Promise<void> {
    switch (event.type) {
      case 'message.sent':
        await this.persistMessage(event.payload);
        break;
      case 'document.operation':
        await this.persistDocumentOperation(event.payload);
        break;
      case 'room.joined':
      case 'room.left':
        await this.updateRoomActivity(event);
        break;
      default:
        this.logger.info('Unhandled event type:', event.type);
    }
  }

  // Utility Methods
  private async handleDisconnection(socket: AuthenticatedSocket): Promise<void> {
    this.logger.info(`User disconnected: ${socket.user?.id}`);

    // Remove from connections
    this.connections.delete(socket.id);

    // Update presence
    if (socket.user) {
      await this.updatePresence(socket.user.id, {
        userId: socket.user.id,
        userName: socket.user.name,
        status: 'away',
        lastSeen: Date.now()
      });
    }

    // Leave all rooms
    if (socket.rooms) {
      for (const roomId of socket.rooms) {
        this.rooms.get(roomId)?.delete(socket.user!.id);
        socket.to(roomId).emit('room:user_left', {
          userId: socket.user!.id,
          userName: socket.user!.name,
          timestamp: Date.now()
        });
      }
    }

    // Remove from document collaborators
    for (const [docId, docState] of this.documents) {
      if (docState.collaborators.has(socket.user!.id)) {
        docState.collaborators.delete(socket.user!.id);
        socket.to(`doc:${docId}`).emit('document:collaborator_left', {
          userId: socket.user!.id,
          timestamp: Date.now()
        });
      }
    }
  }

  private async scheduleDocumentSave(documentId: string): Promise<void> {
    // Debounced save implementation
    const saveKey = `save:${documentId}`;
    const existing = await this.redis.get(saveKey);

    if (!existing) {
      await this.redis.set(saveKey, '1', 'EX', 5); // 5 second debounce
      setTimeout(async () => {
        await this.saveDocument(documentId);
        await this.redis.del(saveKey);
      }, 5000);
    }
  }

  private async saveDocument(documentId: string): Promise<void> {
    const docState = this.documents.get(documentId);
    if (docState) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          content: docState.content,
          updatedAt: new Date()
        }
      });
    }
  }

  private setupHTTPRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', connections: this.connections.size });
    });

    this.app.get('/metrics', (req, res) => {
      res.json({
        connections: this.connections.size,
        rooms: this.rooms.size,
        documents: this.documents.size,
        presence: this.presence.size
      });
    });
  }

  public async start(port: number = 3000): Promise<void> {
    // Initialize Kafka
    await this.kafkaProducer.connect();
    await this.kafkaConsumer.connect();
    await this.setupKafkaConsumer();

    // Start HTTP server
    this.httpServer.listen(port, () => {
      this.logger.info(`Real-time platform running on port ${port}`);
    });
  }
}

// Supporting interfaces
interface RealTimeConfig {
  redis: { url: string };
  kafka: { brokers: string[] };
  cors: { origins: string[] };
}

interface DocumentState {
  id: string;
  content: string;
  operations: DocumentOperation[];
  collaborators: Map<string, any>;
  cursors: Map<string, any>;
}

// Example usage
const config: RealTimeConfig = {
  redis: { url: process.env.REDIS_URL! },
  kafka: { brokers: process.env.KAFKA_BROKERS!.split(',') },
  cors: { origins: ['http://localhost:3000'] }
};

const platform = new RealTimePlatform(config);
platform.start(3001);

export { RealTimePlatform, RealTimeConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Real-time communication systems are needed
- WebSocket implementation is required
- Live collaboration features are requested
- Event streaming architecture is needed
- Real-time analytics and monitoring are required
- Message queuing and pub/sub systems are requested

This comprehensive real-time systems skill provides expert-level capabilities for building modern, scalable real-time applications with advanced features for collaboration, messaging, and live data processing.