# Serverless Architecture Skill

Advanced serverless computing and Function-as-a-Service (FaaS) expertise covering AWS Lambda, Azure Functions, Google Cloud Functions, event-driven architectures, and serverless application patterns.

## Skill Overview

Expert serverless knowledge including FaaS development, event-driven architectures, serverless databases, API Gateway integration, cold start optimization, cost management, and modern serverless application design patterns.

## Core Capabilities

### Serverless Platforms
- **AWS Lambda** - Function development, layers, runtime optimization, event sources
- **Azure Functions** - Trigger bindings, Durable Functions, premium plans
- **Google Cloud Functions** - HTTP triggers, event sources, Cloud Run integration
- **Vercel/Netlify** - Edge functions, deployment automation, static site integration

### Event-Driven Architecture
- **Event sourcing** - Event streams, CQRS patterns, eventual consistency
- **Message queues** - SQS, Service Bus, Pub/Sub integration with functions
- **API Gateway** - REST APIs, GraphQL resolvers, authentication, rate limiting
- **Webhook processing** - Payload validation, retry logic, dead letter queues

### Serverless Data & Storage
- **NoSQL databases** - DynamoDB, CosmosDB, Firestore optimization
- **Object storage** - S3, Blob Storage, Cloud Storage event processing
- **Caching strategies** - Redis, Memcached, in-memory caching patterns
- **Data pipelines** - ETL functions, streaming data processing, batch jobs

### Performance & Operations
- **Cold start optimization** - Provisioned concurrency, connection pooling, bundling
- **Monitoring & observability** - X-Ray, Application Insights, distributed tracing
- **Cost optimization** - Resource rightsizing, usage patterns, billing alerts
- **Security** - IAM policies, secrets management, VPC integration

## Modern Serverless Architecture Implementation

### Comprehensive Serverless Framework with TypeScript
```typescript
// Advanced serverless framework with AWS Lambda, API Gateway, and DynamoDB
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SQSEvent, S3Event } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import validator from '@middy/validator';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import { transpile } from 'typescript';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';

// Types and interfaces
interface LambdaConfig {
  region: string;
  dynamodbTablePrefix: string;
  s3BucketName: string;
  sqsQueueUrl: string;
  snsTopicArn: string;
  secretsManagerPrefix: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  role: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
  createdAt: string;
  updatedAt: string;
  imageUrls?: string[];
  metadata?: Record<string, any>;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
  paymentId?: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']).default('user')
});

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string(),
  price: z.number().positive(),
  category: z.string(),
  inventory: z.number().min(0),
  imageUrls: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional()
});

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    price: z.number().positive()
  })).min(1),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  })
});

// AWS Service Clients (initialized with connection reuse for performance)
let dynamodbClient: DynamoDBClient;
let s3Client: S3Client;
let sqsClient: SQSClient;
let snsClient: SNSClient;
let secretsManagerClient: SecretsManagerClient;

const config: LambdaConfig = {
  region: process.env.AWS_REGION!,
  dynamodbTablePrefix: process.env.DYNAMODB_TABLE_PREFIX!,
  s3BucketName: process.env.S3_BUCKET_NAME!,
  sqsQueueUrl: process.env.SQS_QUEUE_URL!,
  snsTopicArn: process.env.SNS_TOPIC_ARN!,
  secretsManagerPrefix: process.env.SECRETS_MANAGER_PREFIX!
};

// Initialize AWS clients
function initializeClients() {
  if (!dynamodbClient) {
    dynamodbClient = new DynamoDBClient({
      region: config.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: config.region,
      maxAttempts: 3
    });
  }

  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: config.region,
      maxAttempts: 3
    });
  }

  if (!snsClient) {
    snsClient = new SNSClient({
      region: config.region,
      maxAttempts: 3
    });
  }

  if (!secretsManagerClient) {
    secretsManagerClient = new SecretsManagerClient({
      region: config.region,
      maxAttempts: 3
    });
  }
}

// Database Service Layer
class DatabaseService {
  constructor(private tableName: string) {}

  async getItem<T>(partitionKey: string, sortKey?: string): Promise<T | null> {
    initializeClients();

    try {
      const key: any = { id: { S: partitionKey } };
      if (sortKey) {
        key.sortKey = { S: sortKey };
      }

      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: key
      });

      const result = await dynamodbClient.send(command);

      if (!result.Item) {
        return null;
      }

      return unmarshall(result.Item) as T;
    } catch (error) {
      console.error('Database get error:', error);
      throw new Error('Database operation failed');
    }
  }

  async putItem<T>(item: T): Promise<void> {
    initializeClients();

    try {
      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(item)
      });

      await dynamodbClient.send(command);
    } catch (error) {
      console.error('Database put error:', error);
      throw new Error('Database operation failed');
    }
  }

  async queryItems<T>(partitionKey: string, sortKeyCondition?: string): Promise<T[]> {
    initializeClients();

    try {
      let keyConditionExpression = 'id = :pk';
      const expressionAttributeValues: any = {
        ':pk': { S: partitionKey }
      };

      if (sortKeyCondition) {
        keyConditionExpression += ' AND sortKey = :sk';
        expressionAttributeValues[':sk'] = { S: sortKeyCondition };
      }

      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues
      });

      const result = await dynamodbClient.send(command);

      if (!result.Items) {
        return [];
      }

      return result.Items.map(item => unmarshall(item) as T);
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database operation failed');
    }
  }

  async updateItem(partitionKey: string, updates: Record<string, any>): Promise<void> {
    initializeClients();

    try {
      const updateExpressions: string[] = [];
      const expressionAttributeValues: any = {};
      const expressionAttributeNames: any = {};

      Object.entries(updates).forEach(([key, value], index) => {
        const attributeName = `#attr${index}`;
        const attributeValue = `:val${index}`;

        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = marshall({ value })[value];
      });

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: { id: { S: partitionKey } },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      });

      await dynamodbClient.send(command);
    } catch (error) {
      console.error('Database update error:', error);
      throw new Error('Database operation failed');
    }
  }
}

// Authentication Service
class AuthService {
  private static jwtSecret: string;

  static async getJwtSecret(): Promise<string> {
    if (!this.jwtSecret) {
      initializeClients();

      const command = new GetSecretValueCommand({
        SecretId: `${config.secretsManagerPrefix}/jwt-secret`
      });

      const result = await secretsManagerClient.send(command);
      this.jwtSecret = result.SecretString!;
    }

    return this.jwtSecret;
  }

  static async generateToken(user: Omit<User, 'passwordHash'>): Promise<string> {
    const secret = await this.getJwtSecret();

    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: '24h' }
    );
  }

  static async verifyToken(token: string): Promise<any> {
    const secret = await this.getJwtSecret();

    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// User Service
class UserService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService(`${config.dynamodbTablePrefix}-users`);
  }

  async createUser(userData: z.infer<typeof createUserSchema>): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await AuthService.hashPassword(userData.password);
    const user: User = {
      id: uuidv4(),
      email: userData.email,
      name: userData.name,
      passwordHash,
      role: userData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.db.putItem(user);

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;
    return userResponse;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.getItem<User>(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // In a real implementation, you'd use a GSI on email
    // For simplicity, this is a placeholder
    return null;
  }

  async authenticateUser(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>, token: string }> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await AuthService.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const { passwordHash, ...userResponse } = user;
    const token = await AuthService.generateToken(userResponse);

    return { user: userResponse, token };
  }
}

// Product Service
class ProductService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService(`${config.dynamodbTablePrefix}-products`);
  }

  async createProduct(productData: z.infer<typeof createProductSchema>): Promise<Product> {
    const product: Product = {
      id: uuidv4(),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.db.putItem(product);

    // Publish product created event
    await this.publishProductEvent('product.created', product);

    return product;
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.db.getItem<Product>(id);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const updatedProduct = {
      ...product,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.db.putItem(updatedProduct);

    // Publish product updated event
    await this.publishProductEvent('product.updated', updatedProduct);

    return updatedProduct;
  }

  private async publishProductEvent(eventType: string, product: Product): Promise<void> {
    initializeClients();

    try {
      const command = new PublishCommand({
        TopicArn: config.snsTopicArn,
        Message: JSON.stringify({
          eventType,
          product,
          timestamp: new Date().toISOString()
        }),
        Subject: eventType
      });

      await snsClient.send(command);
    } catch (error) {
      console.error('Failed to publish product event:', error);
    }
  }
}

// Order Service
class OrderService {
  private db: DatabaseService;
  private productService: ProductService;

  constructor() {
    this.db = new DatabaseService(`${config.dynamodbTablePrefix}-orders`);
    this.productService = new ProductService();
  }

  async createOrder(userId: string, orderData: z.infer<typeof createOrderSchema>): Promise<Order> {
    // Validate products and calculate total
    let totalAmount = 0;
    const validatedItems: OrderItem[] = [];

    for (const item of orderData.items) {
      const product = await this.productService.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for product ${product.name}`);
      }

      validatedItems.push(item);
      totalAmount += item.price * item.quantity;
    }

    const order: Order = {
      id: uuidv4(),
      userId,
      items: validatedItems,
      totalAmount,
      status: OrderStatus.PENDING,
      shippingAddress: orderData.shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.db.putItem(order);

    // Queue order processing
    await this.queueOrderProcessing(order.id);

    return order;
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.db.getItem<Order>(id);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error('Order not found');
    }

    await this.db.updateItem(id, {
      status,
      updatedAt: new Date().toISOString()
    });

    const updatedOrder = { ...order, status, updatedAt: new Date().toISOString() };

    // Publish order status changed event
    await this.publishOrderEvent('order.status.changed', updatedOrder);

    return updatedOrder;
  }

  private async queueOrderProcessing(orderId: string): Promise<void> {
    initializeClients();

    try {
      const command = new SendMessageCommand({
        QueueUrl: config.sqsQueueUrl,
        MessageBody: JSON.stringify({
          orderId,
          action: 'process_order',
          timestamp: new Date().toISOString()
        }),
        DelaySeconds: 0
      });

      await sqsClient.send(command);
    } catch (error) {
      console.error('Failed to queue order processing:', error);
    }
  }

  private async publishOrderEvent(eventType: string, order: Order): Promise<void> {
    initializeClients();

    try {
      const command = new PublishCommand({
        TopicArn: config.snsTopicArn,
        Message: JSON.stringify({
          eventType,
          order,
          timestamp: new Date().toISOString()
        }),
        Subject: eventType
      });

      await snsClient.send(command);
    } catch (error) {
      console.error('Failed to publish order event:', error);
    }
  }
}

// API Response utilities
function createResponse(statusCode: number, body: any, headers?: Record<string, string>): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': uuidv4(),
      ...headers
    },
    body: JSON.stringify(body)
  };
}

function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return createResponse(statusCode, {
    error: true,
    message,
    timestamp: new Date().toISOString()
  });
}

// Middleware for authentication
const authMiddleware = (): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => {
  return {
    before: async (request) => {
      const authHeader = request.event.headers.Authorization || request.event.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);

      try {
        const decoded = await AuthService.verifyToken(token);
        request.context.user = decoded;
      } catch (error) {
        throw new Error('Invalid token');
      }
    }
  };
};

// Lambda Functions

// User Registration
export const registerUser = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userData = JSON.parse(event.body || '{}');
    const validatedData = createUserSchema.parse(userData);

    const userService = new UserService();
    const user = await userService.createUser(validatedData);

    return createResponse(201, {
      success: true,
      user
    });
  } catch (error) {
    console.error('User registration error:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Validation error');
    }

    return createErrorResponse(500, 'Internal server error');
  }
})
  .use(cors())
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(validator({
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] }
          },
          required: ['email', 'name', 'password']
        }
      }
    }
  }));

// User Login
export const loginUser = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return createErrorResponse(400, 'Email and password are required');
    }

    const userService = new UserService();
    const result = await userService.authenticateUser(email, password);

    return createResponse(200, {
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('User login error:', error);
    return createErrorResponse(401, 'Invalid credentials');
  }
})
  .use(cors())
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer());

// Get User Profile
export const getUserProfile = middy(async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const userId = (context as any).user.userId;
    const userService = new UserService();
    const user = await userService.getUserById(userId);

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    const { passwordHash, ...userProfile } = user;

    return createResponse(200, {
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
})
  .use(cors())
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(authMiddleware());

// Create Product
export const createProduct = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productData = JSON.parse(event.body || '{}');
    const validatedData = createProductSchema.parse(productData);

    const productService = new ProductService();
    const product = await productService.createProduct(validatedData);

    return createResponse(201, {
      success: true,
      product
    });
  } catch (error) {
    console.error('Create product error:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Validation error');
    }

    return createErrorResponse(500, 'Internal server error');
  }
})
  .use(cors())
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(authMiddleware());

// Get Product
export const getProduct = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;

    if (!productId) {
      return createErrorResponse(400, 'Product ID is required');
    }

    const productService = new ProductService();
    const product = await productService.getProduct(productId);

    if (!product) {
      return createErrorResponse(404, 'Product not found');
    }

    return createResponse(200, {
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
})
  .use(cors())
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer());

// Create Order
export const createOrder = middy(async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const userId = (context as any).user.userId;
    const orderData = JSON.parse(event.body || '{}');
    const validatedData = createOrderSchema.parse(orderData);

    const orderService = new OrderService();
    const order = await orderService.createOrder(userId, validatedData);

    return createResponse(201, {
      success: true,
      order
    });
  } catch (error) {
    console.error('Create order error:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Validation error');
    }

    return createErrorResponse(500, 'Internal server error');
  }
})
  .use(cors())
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(authMiddleware());

// Process Order Queue (SQS Trigger)
export const processOrderQueue = async (event: SQSEvent): Promise<void> => {
  const orderService = new OrderService();

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { orderId, action } = message;

      if (action === 'process_order') {
        // Process the order
        await orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

        // Simulate inventory reduction and payment processing
        console.log(`Order ${orderId} processed successfully`);

        // Delete message from queue
        initializeClients();
        await sqsClient.send(new DeleteMessageCommand({
          QueueUrl: config.sqsQueueUrl,
          ReceiptHandle: record.receiptHandle
        }));
      }
    } catch (error) {
      console.error('Error processing order queue message:', error);
      // Message will remain in queue for retry
    }
  }
};

// Process S3 Events
export const processS3Events = async (event: S3Event): Promise<void> => {
  initializeClients();

  for (const record of event.Records) {
    try {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      if (record.eventName.startsWith('ObjectCreated')) {
        // Process uploaded file
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey
        });

        const response = await s3Client.send(command);

        // Example: Process image files
        if (objectKey.includes('images/')) {
          console.log(`Processing uploaded image: ${objectKey}`);
          // Implement image processing logic (resize, compress, etc.)
        }
      }
    } catch (error) {
      console.error('Error processing S3 event:', error);
    }
  }
};

// Health Check Function
export const healthCheck = middy(async (): Promise<APIGatewayProxyResult> => {
  return createResponse(200, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '1.0.0'
  });
})
  .use(cors())
  .use(httpErrorHandler());
```

## Skill Activation Triggers

This skill automatically activates when:
- Serverless application development is needed
- Function-as-a-Service (FaaS) implementation is required
- Event-driven architecture is requested
- API Gateway and Lambda integration is needed
- Serverless cost optimization is required
- Microservices with serverless patterns are requested

This comprehensive serverless architecture skill provides expert-level capabilities for building modern, scalable serverless applications with advanced patterns for performance, security, and cost optimization.