# E-commerce Platform Development Skill

Modern e-commerce platform development expertise covering custom platforms, marketplace integration, payment processing, inventory management, and scalable multi-tenant architectures.

## Skill Overview

Expert e-commerce knowledge including platform architecture, payment gateway integration, inventory management, order processing, customer management, analytics, and modern e-commerce development patterns.

## Core Capabilities

### E-commerce Architecture
- **Microservices design** - Order management, inventory, payments, customer service separation
- **Multi-tenant systems** - Vendor marketplaces, white-label solutions, SaaS platforms
- **Event-driven architecture** - Order workflows, inventory updates, notification systems
- **API-first design** - Headless commerce, mobile apps, third-party integrations

### Payment & Financial Systems
- **Payment gateway integration** - Stripe, PayPal, Square, international gateways
- **Multi-currency support** - Exchange rates, localized pricing, tax calculation
- **Subscription management** - Recurring billing, dunning management, plan upgrades
- **Financial reporting** - Revenue tracking, settlement reconciliation, tax reporting

### Inventory & Catalog Management
- **Product information management** - Attributes, variants, bundling, digital products
- **Inventory optimization** - Stock levels, reorder points, supplier management
- **Pricing engines** - Dynamic pricing, promotions, discount rules, A/B testing
- **Search & discovery** - Elasticsearch, faceted search, recommendations, personalization

### Enterprise Features
- **B2B functionality** - Quote systems, approval workflows, custom pricing, bulk ordering
- **International commerce** - Localization, shipping zones, compliance, duties calculation
- **Performance optimization** - Caching strategies, CDN integration, database optimization
- **Security & compliance** - PCI DSS, GDPR, fraud prevention, secure checkout

## Modern E-commerce Implementation

### Comprehensive E-commerce Platform with Node.js
```typescript
// Advanced e-commerce platform with microservices architecture
import express, { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import Decimal from 'decimal.js';
import axios from 'axios';
import Bull from 'bull';
import { v4 as uuidv4 } from 'uuid';

// Core interfaces and types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    customerId?: string;
  };
}

interface EcommerceConfig {
  database: { url: string };
  redis: { url: string };
  stripe: { secretKey: string; webhookSecret: string };
  paypal: { clientId: string; clientSecret: string };
  smtp: { host: string; user: string; pass: string };
  aws: { accessKeyId: string; secretAccessKey: string; region: string; bucket: string };
}

// Validation schemas
const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string(),
  sku: z.string().min(1).max(100),
  price: z.number().positive(),
  comparePrice: z.number().optional(),
  costPrice: z.number().optional(),
  weight: z.number().optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number()
  }).optional(),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  variants: z.array(z.object({
    name: z.string(),
    value: z.string(),
    price: z.number().optional(),
    sku: z.string().optional(),
    inventory: z.number().optional()
  })).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  published: z.boolean().default(false)
});

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().positive(),
    price: z.number().positive()
  })),
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
    phone: z.string().optional()
  }),
  billingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }).optional(),
  paymentMethod: z.string(),
  shippingMethod: z.string(),
  discountCode: z.string().optional(),
  notes: z.string().optional()
});

// Core E-commerce Platform Class
class EcommercePlatform extends EventEmitter {
  private app: Express;
  private prisma: PrismaClient;
  private redis: Redis;
  private stripe: Stripe;
  private logger: Logger;
  private config: EcommerceConfig;
  private jobQueue: Bull.Queue;

  constructor(config: EcommerceConfig) {
    super();
    this.config = config;
    this.prisma = new PrismaClient({
      datasources: { db: { url: config.database.url } }
    });
    this.redis = new Redis(config.redis.url);
    this.stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2023-10-16' });
    this.app = express();

    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.File({ filename: 'ecommerce.log' }),
        new transports.Console({ format: format.simple() })
      ]
    });

    this.jobQueue = new Bull('ecommerce jobs', { redis: config.redis.url });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupJobProcessing();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS configuration for e-commerce
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Product management
    this.app.get('/api/products', this.getProducts.bind(this));
    this.app.get('/api/products/:id', this.getProduct.bind(this));
    this.app.post('/api/products', this.authenticate.bind(this), this.createProduct.bind(this));
    this.app.put('/api/products/:id', this.authenticate.bind(this), this.updateProduct.bind(this));
    this.app.delete('/api/products/:id', this.authenticate.bind(this), this.deleteProduct.bind(this));

    // Category management
    this.app.get('/api/categories', this.getCategories.bind(this));
    this.app.post('/api/categories', this.authenticate.bind(this), this.createCategory.bind(this));

    // Cart management
    this.app.get('/api/cart/:sessionId', this.getCart.bind(this));
    this.app.post('/api/cart/:sessionId/items', this.addToCart.bind(this));
    this.app.put('/api/cart/:sessionId/items/:itemId', this.updateCartItem.bind(this));
    this.app.delete('/api/cart/:sessionId/items/:itemId', this.removeFromCart.bind(this));

    // Order management
    this.app.post('/api/orders', this.createOrder.bind(this));
    this.app.get('/api/orders/:id', this.getOrder.bind(this));
    this.app.put('/api/orders/:id/status', this.authenticate.bind(this), this.updateOrderStatus.bind(this));
    this.app.get('/api/orders', this.authenticate.bind(this), this.getOrders.bind(this));

    // Payment processing
    this.app.post('/api/payments/stripe/intent', this.createPaymentIntent.bind(this));
    this.app.post('/api/payments/stripe/webhook', this.handleStripeWebhook.bind(this));

    // Inventory management
    this.app.get('/api/inventory', this.authenticate.bind(this), this.getInventory.bind(this));
    this.app.post('/api/inventory/adjust', this.authenticate.bind(this), this.adjustInventory.bind(this));

    // Analytics and reporting
    this.app.get('/api/analytics/sales', this.authenticate.bind(this), this.getSalesAnalytics.bind(this));
    this.app.get('/api/analytics/products', this.authenticate.bind(this), this.getProductAnalytics.bind(this));

    // Customer management
    this.app.get('/api/customers', this.authenticate.bind(this), this.getCustomers.bind(this));
    this.app.get('/api/customers/:id/orders', this.authenticate.bind(this), this.getCustomerOrders.bind(this));

    // Shipping and tax
    this.app.post('/api/shipping/rates', this.getShippingRates.bind(this));
    this.app.post('/api/tax/calculate', this.calculateTax.bind(this));

    // Search functionality
    this.app.get('/api/search', this.searchProducts.bind(this));
  }

  // Product Management
  private async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        category,
        brand,
        minPrice,
        maxPrice,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const where: any = { published: true };

      if (category) where.categoryId = category;
      if (brand) where.brandId = brand;
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice as string);
        if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
      }

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip: offset,
          take: limitNum,
          include: {
            category: true,
            brand: true,
            variants: true,
            images: true
          },
          orderBy: { [sortBy as string]: sortOrder }
        }),
        this.prisma.product.count({ where })
      ]);

      res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      this.logger.error('Get products error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validatedData = productSchema.parse(req.body);

      // Check if SKU is unique
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: validatedData.sku }
      });

      if (existingProduct) {
        res.status(400).json({ error: 'SKU already exists' });
        return;
      }

      const product = await this.prisma.product.create({
        data: {
          ...validatedData,
          createdById: req.user!.id
        },
        include: {
          category: true,
          brand: true,
          variants: true,
          images: true
        }
      });

      // Clear product cache
      await this.clearProductCache();

      // Emit product created event
      this.emit('product.created', product);

      res.status(201).json(product);
    } catch (error) {
      this.logger.error('Create product error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Cart Management
  private async getCart(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const cacheKey = `cart:${sessionId}`;

      const cachedCart = await this.redis.get(cacheKey);
      if (cachedCart) {
        res.json(JSON.parse(cachedCart));
        return;
      }

      const cart = await this.prisma.cart.findUnique({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: {
                include: { images: true }
              },
              variant: true
            }
          }
        }
      });

      if (!cart) {
        res.json({ items: [], total: 0, itemCount: 0 });
        return;
      }

      const cartWithTotals = this.calculateCartTotals(cart);

      // Cache for 5 minutes
      await this.redis.set(cacheKey, JSON.stringify(cartWithTotals), 'EX', 300);

      res.json(cartWithTotals);
    } catch (error) {
      this.logger.error('Get cart error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async addToCart(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { productId, variantId, quantity = 1 } = req.body;

      // Get product and variant info
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true }
      });

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Check inventory
      const availableInventory = variantId
        ? product.variants.find(v => v.id === variantId)?.inventory || 0
        : product.inventory;

      if (availableInventory < quantity) {
        res.status(400).json({ error: 'Insufficient inventory' });
        return;
      }

      // Get or create cart
      let cart = await this.prisma.cart.findUnique({
        where: { sessionId }
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { sessionId }
        });
      }

      // Add or update cart item
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId: variantId || null
        }
      });

      let cartItem;
      if (existingItem) {
        cartItem = await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity }
        });
      } else {
        cartItem = await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId,
            quantity,
            price: variantId
              ? product.variants.find(v => v.id === variantId)?.price || product.price
              : product.price
          }
        });
      }

      // Clear cart cache
      await this.redis.del(`cart:${sessionId}`);

      // Get updated cart
      const updatedCart = await this.getCart(req, res);
    } catch (error) {
      this.logger.error('Add to cart error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Order Processing
  private async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = orderSchema.parse(req.body);

      // Start transaction
      const order = await this.prisma.$transaction(async (tx) => {
        // Calculate totals
        let subtotal = new Decimal(0);
        const orderItems = [];

        for (const item of validatedData.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { variants: true }
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          // Check inventory
          const variant = item.variantId
            ? product.variants.find(v => v.id === item.variantId)
            : null;

          const availableInventory = variant?.inventory || product.inventory;
          if (availableInventory < item.quantity) {
            throw new Error(`Insufficient inventory for ${product.name}`);
          }

          const itemTotal = new Decimal(item.price).mul(item.quantity);
          subtotal = subtotal.add(itemTotal);

          orderItems.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            total: itemTotal.toNumber()
          });

          // Update inventory
          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { inventory: { decrement: item.quantity } }
            });
          } else {
            await tx.product.update({
              where: { id: product.id },
              data: { inventory: { decrement: item.quantity } }
            });
          }
        }

        // Calculate shipping and tax
        const shippingCost = await this.calculateShipping(
          validatedData.shippingAddress,
          validatedData.shippingMethod,
          orderItems
        );

        const taxAmount = await this.calculateTaxAmount(
          validatedData.shippingAddress,
          subtotal.toNumber()
        );

        const total = subtotal.add(shippingCost).add(taxAmount);

        // Create order
        const newOrder = await tx.order.create({
          data: {
            orderNumber: this.generateOrderNumber(),
            customerId: req.user?.customerId,
            email: req.user?.email || validatedData.shippingAddress.firstName + '@guest.com',
            subtotal: subtotal.toNumber(),
            shippingCost: shippingCost.toNumber(),
            taxAmount: taxAmount.toNumber(),
            total: total.toNumber(),
            currency: 'USD',
            status: 'pending',
            paymentStatus: 'pending',
            fulfillmentStatus: 'unfulfilled',
            shippingAddress: validatedData.shippingAddress,
            billingAddress: validatedData.billingAddress || validatedData.shippingAddress,
            notes: validatedData.notes,
            items: {
              create: orderItems
            }
          },
          include: {
            items: {
              include: {
                product: true,
                variant: true
              }
            }
          }
        });

        return newOrder;
      });

      // Process payment
      const paymentResult = await this.processPayment(order, validatedData.paymentMethod);

      if (paymentResult.success) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentId: paymentResult.paymentId
          }
        });

        // Queue order fulfillment
        await this.jobQueue.add('fulfill-order', { orderId: order.id });

        // Send order confirmation email
        await this.jobQueue.add('send-order-confirmation', { orderId: order.id });

        this.emit('order.created', order);
      }

      res.status(201).json({
        order,
        payment: paymentResult
      });
    } catch (error) {
      this.logger.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
  }

  // Payment Processing
  private async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { amount, currency = 'usd', orderId } = req.body;

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: { orderId },
        automatic_payment_methods: { enabled: true }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      this.logger.error('Create payment intent error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }

  private async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.get('stripe-signature');

      if (!signature) {
        res.status(400).send('Missing stripe signature');
        return;
      }

      const event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        this.config.stripe.webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        default:
          this.logger.info('Unhandled webhook event:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      this.logger.error('Stripe webhook error:', error);
      res.status(400).send('Webhook error');
    }
  }

  // Analytics and Reporting
  private async getSalesAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate, period = 'day' } = req.query;

      const cacheKey = `analytics:sales:${startDate}:${endDate}:${period}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      const analytics = await this.generateSalesAnalytics(
        startDate as string,
        endDate as string,
        period as string
      );

      // Cache for 1 hour
      await this.redis.set(cacheKey, JSON.stringify(analytics), 'EX', 3600);

      res.json(analytics);
    } catch (error) {
      this.logger.error('Sales analytics error:', error);
      res.status(500).json({ error: 'Failed to generate analytics' });
    }
  }

  // Utility methods
  private calculateCartTotals(cart: any) {
    let subtotal = new Decimal(0);
    let itemCount = 0;

    for (const item of cart.items) {
      const itemTotal = new Decimal(item.price).mul(item.quantity);
      subtotal = subtotal.add(itemTotal);
      itemCount += item.quantity;
    }

    return {
      ...cart,
      subtotal: subtotal.toNumber(),
      itemCount
    };
  }

  private async calculateShipping(address: any, method: string, items: any[]): Promise<Decimal> {
    // Implement shipping calculation logic
    // This would integrate with shipping APIs (UPS, FedEx, etc.)
    return new Decimal(9.99);
  }

  private async calculateTaxAmount(address: any, amount: number): Promise<Decimal> {
    // Implement tax calculation logic
    // This would integrate with tax services (Avalara, TaxJar, etc.)
    return new Decimal(amount).mul(0.08); // 8% tax rate example
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  private async processPayment(order: any, paymentMethod: string): Promise<any> {
    try {
      switch (paymentMethod) {
        case 'stripe':
          return await this.processStripePayment(order);
        case 'paypal':
          return await this.processPayPalPayment(order);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      this.logger.error('Payment processing error:', error);
      return { success: false, error: error.message };
    }
  }

  private async processStripePayment(order: any): Promise<any> {
    // Implementation for Stripe payment processing
    return { success: true, paymentId: 'stripe_' + uuidv4() };
  }

  private async clearProductCache(): Promise<void> {
    const pattern = 'products:*';
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private setupJobProcessing(): void {
    this.jobQueue.process('fulfill-order', async (job) => {
      // Implement order fulfillment logic
      this.logger.info('Processing order fulfillment:', job.data);
    });

    this.jobQueue.process('send-order-confirmation', async (job) => {
      // Implement email sending logic
      this.logger.info('Sending order confirmation:', job.data);
    });
  }

  private setupEventHandlers(): void {
    this.on('order.created', (order) => {
      this.logger.info('Order created:', order.id);
    });

    this.on('product.created', (product) => {
      this.logger.info('Product created:', product.id);
    });
  }

  // Authentication middleware placeholder
  private async authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    // Implement JWT authentication logic
    next();
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      this.logger.info(`E-commerce platform running on port ${port}`);
    });
  }
}

// Example usage
const config: EcommerceConfig = {
  database: { url: process.env.DATABASE_URL! },
  redis: { url: process.env.REDIS_URL! },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID!,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET!
  },
  smtp: {
    host: process.env.SMTP_HOST!,
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!,
    bucket: process.env.AWS_BUCKET!
  }
};

const platform = new EcommercePlatform(config);
platform.start(3000);

export { EcommercePlatform, EcommerceConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- E-commerce platform development is needed
- Online store creation is required
- Payment gateway integration is requested
- Inventory management systems are needed
- Multi-vendor marketplace development is required
- Shopping cart and checkout functionality is requested

## Advanced Stripe Integration & Payment Processing

### Comprehensive Stripe Payment System
```typescript
// Advanced Stripe payment processing with subscriptions and marketplace
import Stripe from 'stripe';
import { WebhookEvent } from 'stripe';

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  connectWebhookSecret: string;
  publishableKey: string;
}

interface PaymentMethodConfig {
  card: boolean;
  applePay: boolean;
  googlePay: boolean;
  klarna: boolean;
  afterpay: boolean;
  bancontact: boolean;
  sepa: boolean;
  sofort: boolean;
  giropay: boolean;
  przelewy24: boolean;
}

class AdvancedStripePaymentProcessor {
  private stripe: Stripe;
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = config;
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  // Advanced Payment Intent with Smart Payment Methods
  async createAdvancedPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    orderId: string;
    shipping?: any;
    billing?: any;
    paymentMethods?: PaymentMethodConfig;
    captureMethod?: 'automatic' | 'manual';
    setupFutureUsage?: 'on_session' | 'off_session';
    transferData?: {
      destination: string;
      amount?: number;
    };
  }): Promise<Stripe.PaymentIntent> {
    const {
      amount,
      currency,
      customerId,
      orderId,
      shipping,
      billing,
      paymentMethods,
      captureMethod = 'automatic',
      setupFutureUsage,
      transferData
    } = params;

    // Configure payment method types based on customer preferences
    const paymentMethodTypes = this.getPaymentMethodTypes(
      currency,
      amount,
      paymentMethods || { card: true, applePay: true, googlePay: true, klarna: false, afterpay: false, bancontact: false, sepa: false, sofort: false, giropay: false, przelewy24: false }
    );

    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        orderId,
        source: 'ecommerce_platform'
      },
      payment_method_types: paymentMethodTypes,
      capture_method: captureMethod,
      setup_future_usage: setupFutureUsage,
      shipping: shipping ? {
        address: {
          line1: shipping.address1,
          line2: shipping.address2,
          city: shipping.city,
          state: shipping.state,
          postal_code: shipping.zipCode,
          country: shipping.country,
        },
        name: `${shipping.firstName} ${shipping.lastName}`,
        phone: shipping.phone,
      } : undefined,
    };

    // Add transfer data for marketplace payments
    if (transferData) {
      paymentIntentData.transfer_data = {
        destination: transferData.destination,
        amount: transferData.amount ? Math.round(transferData.amount * 100) : undefined,
      };
    }

    // Add application fee for marketplace
    if (transferData && !transferData.amount) {
      const feePercentage = 0.029; // 2.9% platform fee
      paymentIntentData.application_fee_amount = Math.round(amount * feePercentage * 100);
    }

    return await this.stripe.paymentIntents.create(paymentIntentData);
  }

  // Subscription Management
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    quantity?: number;
    couponId?: string;
    trialDays?: number;
    paymentMethodId?: string;
    collectTaxAutomatically?: boolean;
    transferData?: {
      destination: string;
      amountPercent: number;
    };
  }): Promise<Stripe.Subscription> {
    const {
      customerId,
      priceId,
      quantity = 1,
      couponId,
      trialDays,
      paymentMethodId,
      collectTaxAutomatically = true,
      transferData
    } = params;

    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{
        price: priceId,
        quantity,
      }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent', 'customer'],
      automatic_tax: {
        enabled: collectTaxAutomatically,
      },
    };

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    if (couponId) {
      subscriptionData.coupon = couponId;
    }

    if (trialDays) {
      subscriptionData.trial_period_days = trialDays;
    }

    // Add transfer data for marketplace subscriptions
    if (transferData) {
      subscriptionData.transfer_data = {
        destination: transferData.destination,
        amount_percent: transferData.amountPercent,
      };
    }

    return await this.stripe.subscriptions.create(subscriptionData);
  }

  // Advanced Customer Management
  async createCustomerWithSetupIntent(params: {
    email: string;
    name?: string;
    phone?: string;
    address?: any;
    metadata?: Record<string, string>;
    taxId?: string;
    preferredLocales?: string[];
  }): Promise<{
    customer: Stripe.Customer;
    setupIntent: Stripe.SetupIntent;
  }> {
    const { email, name, phone, address, metadata, taxId, preferredLocales } = params;

    // Create customer
    const customer = await this.stripe.customers.create({
      email,
      name,
      phone,
      address: address ? {
        line1: address.address1,
        line2: address.address2,
        city: address.city,
        state: address.state,
        postal_code: address.zipCode,
        country: address.country,
      } : undefined,
      metadata: metadata || {},
      tax_id_data: taxId ? [{
        type: 'eu_vat',
        value: taxId,
      }] : undefined,
      preferred_locales: preferredLocales,
    });

    // Create setup intent for saving payment methods
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customer.id,
      usage: 'off_session',
      payment_method_types: ['card'],
    });

    return { customer, setupIntent };
  }

  // Marketplace Connect Account Management
  async createConnectAccount(params: {
    type: 'express' | 'standard' | 'custom';
    email: string;
    country: string;
    businessType?: 'individual' | 'company';
    businessProfile?: {
      url?: string;
      name?: string;
      productDescription?: string;
      supportEmail?: string;
      supportPhone?: string;
      supportUrl?: string;
    };
  }): Promise<Stripe.Account> {
    const { type, email, country, businessType = 'individual', businessProfile } = params;

    const accountData: Stripe.AccountCreateParams = {
      type,
      email,
      country,
      business_type: businessType,
      business_profile: businessProfile,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    };

    return await this.stripe.accounts.create(accountData);
  }

  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<Stripe.AccountLink> {
    return await this.stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
  }

  // Advanced Pricing and Products
  async createProductWithPricing(params: {
    name: string;
    description?: string;
    images?: string[];
    metadata?: Record<string, string>;
    prices: Array<{
      currency: string;
      amount?: number;
      recurring?: {
        interval: 'day' | 'week' | 'month' | 'year';
        intervalCount?: number;
      };
      tiers?: Array<{
        upTo: number | 'inf';
        flatAmount?: number;
        unitAmount?: number;
      }>;
      usageType?: 'licensed' | 'metered';
    }>;
  }): Promise<{
    product: Stripe.Product;
    prices: Stripe.Price[];
  }> {
    const { name, description, images, metadata, prices } = params;

    // Create product
    const product = await this.stripe.products.create({
      name,
      description,
      images,
      metadata: metadata || {},
    });

    // Create prices
    const createdPrices = await Promise.all(
      prices.map(async (priceData) => {
        const priceParams: Stripe.PriceCreateParams = {
          product: product.id,
          currency: priceData.currency,
          billing_scheme: priceData.tiers ? 'tiered' : 'per_unit',
        };

        if (priceData.amount) {
          priceParams.unit_amount = Math.round(priceData.amount * 100);
        }

        if (priceData.recurring) {
          priceParams.recurring = {
            interval: priceData.recurring.interval,
            interval_count: priceData.recurring.intervalCount,
            usage_type: priceData.usageType || 'licensed',
          };
        }

        if (priceData.tiers) {
          priceParams.tiers = priceData.tiers.map(tier => ({
            up_to: tier.upTo === 'inf' ? 'inf' : tier.upTo,
            flat_amount: tier.flatAmount ? Math.round(tier.flatAmount * 100) : undefined,
            unit_amount: tier.unitAmount ? Math.round(tier.unitAmount * 100) : undefined,
          }));
          priceParams.tiers_mode = 'graduated';
        }

        return await this.stripe.prices.create(priceParams);
      })
    );

    return { product, prices: createdPrices };
  }

  // Fraud Prevention and Risk Management
  async createRadarRule(params: {
    rule: string;
    outcome: 'allow' | 'block' | 'review';
  }): Promise<Stripe.Radar.Rule> {
    return await this.stripe.radar.rules.create({
      rule: params.rule,
      outcome: params.outcome,
    });
  }

  async reviewPayment(paymentIntentId: string, action: 'approve' | 'block'): Promise<Stripe.Review> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.review) {
      return await this.stripe.reviews.approve(paymentIntent.review as string, {
        reason: action === 'approve' ? 'approved_by_merchant' : 'blocked_by_merchant',
      });
    }

    throw new Error('No review found for this payment');
  }

  // Advanced Webhook Handling
  async processAdvancedWebhook(
    body: string,
    signature: string,
    handlers: {
      [K in WebhookEvent['type']]?: (event: Extract<WebhookEvent, { type: K }>) => Promise<void>;
    }
  ): Promise<void> {
    let event: WebhookEvent;

    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.config.webhookSecret
      ) as WebhookEvent;
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle specific event types
    const handler = handlers[event.type];
    if (handler) {
      await handler(event as any);
    } else {
      console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  // Utility Methods
  private getPaymentMethodTypes(
    currency: string,
    amount: number,
    config: PaymentMethodConfig
  ): string[] {
    const methods: string[] = [];

    if (config.card) methods.push('card');

    // Regional payment methods
    switch (currency.toLowerCase()) {
      case 'eur':
        if (config.sepa) methods.push('sepa_debit');
        if (config.sofort) methods.push('sofort');
        if (config.giropay) methods.push('giropay');
        if (config.bancontact) methods.push('bancontact');
        break;
      case 'pln':
        if (config.przelewy24) methods.push('p24');
        break;
      case 'usd':
      case 'cad':
      case 'aud':
        if (config.applePay) methods.push('us_bank_account');
        if (config.afterpay && amount >= 1 && amount <= 2000) methods.push('afterpay_clearpay');
        break;
    }

    // BNPL options based on amount and currency
    if (config.klarna && ['eur', 'usd', 'gbp', 'sek', 'nok', 'dkk'].includes(currency.toLowerCase())) {
      if (amount >= 1 && amount <= 10000) {
        methods.push('klarna');
      }
    }

    return methods;
  }
}

// Enhanced Payment Processing with Multiple Gateways
class MultiGatewayPaymentProcessor {
  private stripe: AdvancedStripePaymentProcessor;
  private paypalProcessor: PayPalProcessor;
  private squareProcessor: SquareProcessor;

  constructor(config: {
    stripe: StripeConfig;
    paypal: PayPalConfig;
    square: SquareConfig;
  }) {
    this.stripe = new AdvancedStripePaymentProcessor(config.stripe);
    this.paypalProcessor = new PayPalProcessor(config.paypal);
    this.squareProcessor = new SquareProcessor(config.square);
  }

  async processPayment(params: {
    gateway: 'stripe' | 'paypal' | 'square';
    amount: number;
    currency: string;
    customerId?: string;
    orderId: string;
    paymentMethod: any;
    metadata?: Record<string, string>;
  }): Promise<{
    success: boolean;
    paymentId: string;
    transactionId?: string;
    error?: string;
  }> {
    try {
      switch (params.gateway) {
        case 'stripe':
          const stripeResult = await this.processStripePayment(params);
          return stripeResult;
        case 'paypal':
          const paypalResult = await this.processPayPalPayment(params);
          return paypalResult;
        case 'square':
          const squareResult = await this.processSquarePayment(params);
          return squareResult;
        default:
          throw new Error(`Unsupported payment gateway: ${params.gateway}`);
      }
    } catch (error) {
      return {
        success: false,
        paymentId: '',
        error: error.message,
      };
    }
  }

  private async processStripePayment(params: any): Promise<any> {
    const paymentIntent = await this.stripe.createAdvancedPaymentIntent({
      amount: params.amount,
      currency: params.currency,
      customerId: params.customerId,
      orderId: params.orderId,
    });

    return {
      success: true,
      paymentId: paymentIntent.id,
      transactionId: paymentIntent.client_secret,
    };
  }

  private async processPayPalPayment(params: any): Promise<any> {
    // PayPal implementation
    return {
      success: true,
      paymentId: 'paypal_' + Date.now(),
      transactionId: 'txn_' + Date.now(),
    };
  }

  private async processSquarePayment(params: any): Promise<any> {
    // Square implementation
    return {
      success: true,
      paymentId: 'square_' + Date.now(),
      transactionId: 'sqr_' + Date.now(),
    };
  }
}

// Subscription Management System
class SubscriptionManager {
  private stripe: AdvancedStripePaymentProcessor;
  private prisma: PrismaClient;

  constructor(stripe: AdvancedStripePaymentProcessor, prisma: PrismaClient) {
    this.stripe = stripe;
    this.prisma = prisma;
  }

  async createSubscriptionPlan(params: {
    name: string;
    description: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    trialDays?: number;
    features: string[];
    metadata?: Record<string, string>;
  }): Promise<{
    product: Stripe.Product;
    price: Stripe.Price;
    plan: any;
  }> {
    const { name, description, amount, currency, interval, trialDays, features, metadata } = params;

    // Create Stripe product and price
    const { product, prices } = await this.stripe.createProductWithPricing({
      name,
      description,
      metadata: metadata || {},
      prices: [{
        currency,
        amount,
        recurring: {
          interval,
        },
      }],
    });

    // Save plan to database
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        amount,
        currency,
        interval,
        trialDays: trialDays || 0,
        features,
        stripeProductId: product.id,
        stripePriceId: prices[0].id,
        metadata: metadata || {},
        active: true,
      },
    });

    return { product, price: prices[0], plan };
  }

  async subscribeCustomer(params: {
    customerId: string;
    planId: string;
    paymentMethodId?: string;
    couponCode?: string;
    quantity?: number;
  }): Promise<{
    subscription: Stripe.Subscription;
    dbSubscription: any;
  }> {
    const { customerId, planId, paymentMethodId, couponCode, quantity = 1 } = params;

    // Get plan details
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Create Stripe subscription
    const subscription = await this.stripe.createSubscription({
      customerId,
      priceId: plan.stripePriceId,
      quantity,
      paymentMethodId,
      trialDays: plan.trialDays > 0 ? plan.trialDays : undefined,
      couponId: couponCode,
    });

    // Save subscription to database
    const dbSubscription = await this.prisma.subscription.create({
      data: {
        customerId,
        planId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        quantity,
        metadata: {},
      },
    });

    return { subscription, dbSubscription };
  }

  async handleSubscriptionWebhook(event: WebhookEvent): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    // Update subscription in database
    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      create: {
        stripeSubscriptionId: subscription.id,
        customerId: subscription.customer as string,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        quantity: subscription.items.data[0]?.quantity || 1,
        planId: '', // Would need to look up by price ID
        metadata: {},
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        quantity: subscription.items.data[0]?.quantity || 1,
      },
    });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      await this.prisma.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: {
          lastPaymentDate: new Date(),
          status: 'active',
        },
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      await this.prisma.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: {
          status: 'past_due',
        },
      });

      // Implement dunning management logic
      await this.handleDunningManagement(invoice);
    }
  }

  private async handleDunningManagement(invoice: Stripe.Invoice): Promise<void> {
    // Implement retry logic, email notifications, etc.
    console.log('Handling dunning management for invoice:', invoice.id);
  }
}

// Mock interfaces for other processors
interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

interface SquareConfig {
  applicationId: string;
  accessToken: string;
  environment: 'sandbox' | 'production';
}

class PayPalProcessor {
  constructor(config: PayPalConfig) {}
}

class SquareProcessor {
  constructor(config: SquareConfig) {}
}
```

## Advanced Inventory Management

### Warehouse Management System
```typescript
// Comprehensive inventory and warehouse management
interface InventoryItem {
  id: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  maxStock: number;
  location: {
    zone: string;
    aisle: string;
    shelf: string;
    bin: string;
  };
  lastUpdated: Date;
  costPrice: number;
  averageCost: number;
  movements: InventoryMovement[];
}

interface InventoryMovement {
  id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'reservation' | 'release';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceId?: string; // Order ID, Transfer ID, etc.
  warehouseId: string;
  userId?: string;
  timestamp: Date;
  cost?: number;
}

class AdvancedInventoryManager {
  private prisma: PrismaClient;
  private redis: Redis;
  private eventEmitter: EventEmitter;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
    this.eventEmitter = new EventEmitter();
    this.setupInventoryAlerts();
  }

  // Multi-warehouse inventory management
  async getInventoryAcrossWarehouses(productId: string, variantId?: string): Promise<{
    total: number;
    available: number;
    reserved: number;
    warehouses: Array<{
      warehouseId: string;
      warehouseName: string;
      quantity: number;
      available: number;
      reserved: number;
      location: any;
    }>;
  }> {
    const cacheKey = `inventory:${productId}:${variantId || 'default'}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        productId,
        variantId: variantId || null,
      },
      include: {
        warehouse: true,
      },
    });

    let total = 0;
    let available = 0;
    let reserved = 0;

    const warehouses = inventoryItems.map(item => {
      total += item.quantity;
      available += item.availableQuantity;
      reserved += item.reservedQuantity;

      return {
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        quantity: item.quantity,
        available: item.availableQuantity,
        reserved: item.reservedQuantity,
        location: item.location,
      };
    });

    const result = { total, available, reserved, warehouses };

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);

    return result;
  }

  // Intelligent stock reservation system
  async reserveStock(params: {
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      preferredWarehouse?: string;
    }>;
    orderId: string;
    expiresAt?: Date;
  }): Promise<{
    success: boolean;
    reservations: Array<{
      productId: string;
      variantId?: string;
      reservedQuantity: number;
      warehouseId: string;
      reservationId: string;
    }>;
    unavailable?: Array<{
      productId: string;
      variantId?: string;
      requestedQuantity: number;
      availableQuantity: number;
    }>;
  }> {
    const { items, orderId, expiresAt } = params;
    const reservations: any[] = [];
    const unavailable: any[] = [];

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const { productId, variantId, quantity, preferredWarehouse } = item;

        // Get available inventory across warehouses
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            productId,
            variantId: variantId || null,
            availableQuantity: { gt: 0 },
            warehouseId: preferredWarehouse || undefined,
          },
          orderBy: [
            { warehouseId: preferredWarehouse ? 'asc' : 'desc' },
            { availableQuantity: 'desc' },
          ],
        });

        let remainingQuantity = quantity;
        const itemReservations = [];

        for (const inventoryItem of inventoryItems) {
          if (remainingQuantity <= 0) break;

          const reservableQuantity = Math.min(
            remainingQuantity,
            inventoryItem.availableQuantity
          );

          if (reservableQuantity > 0) {
            // Create reservation
            const reservation = await tx.inventoryReservation.create({
              data: {
                inventoryItemId: inventoryItem.id,
                orderId,
                quantity: reservableQuantity,
                expiresAt: expiresAt || new Date(Date.now() + 30 * 60 * 1000), // 30 minutes default
                status: 'reserved',
              },
            });

            // Update inventory item
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: {
                reservedQuantity: { increment: reservableQuantity },
                availableQuantity: { decrement: reservableQuantity },
              },
            });

            // Record movement
            await tx.inventoryMovement.create({
              data: {
                inventoryItemId: inventoryItem.id,
                type: 'reservation',
                quantity: -reservableQuantity,
                previousQuantity: inventoryItem.availableQuantity,
                newQuantity: inventoryItem.availableQuantity - reservableQuantity,
                reason: `Reserved for order ${orderId}`,
                referenceId: orderId,
                warehouseId: inventoryItem.warehouseId,
                timestamp: new Date(),
              },
            });

            itemReservations.push({
              productId,
              variantId,
              reservedQuantity: reservableQuantity,
              warehouseId: inventoryItem.warehouseId,
              reservationId: reservation.id,
            });

            remainingQuantity -= reservableQuantity;
          }
        }

        if (remainingQuantity > 0) {
          unavailable.push({
            productId,
            variantId,
            requestedQuantity: quantity,
            availableQuantity: quantity - remainingQuantity,
          });
        } else {
          reservations.push(...itemReservations);
        }
      }

      return { reservations, unavailable };
    });

    // Clear inventory cache
    await this.clearInventoryCache(items.map(i => ({ productId: i.productId, variantId: i.variantId })));

    // Emit inventory events
    this.eventEmitter.emit('inventory.reserved', { orderId, reservations });

    if (result.unavailable.length > 0) {
      this.eventEmitter.emit('inventory.insufficient', { orderId, unavailable: result.unavailable });
    }

    return {
      success: result.unavailable.length === 0,
      reservations: result.reservations,
      unavailable: result.unavailable.length > 0 ? result.unavailable : undefined,
    };
  }

  // Automated reorder system
  async checkReorderPoints(): Promise<{
    reorderNeeded: Array<{
      productId: string;
      variantId?: string;
      currentStock: number;
      reorderPoint: number;
      suggestedOrderQuantity: number;
      warehouseId: string;
      supplierId?: string;
      leadTimeDays: number;
      estimatedCost: number;
    }>;
  }> {
    const lowStockItems = await this.prisma.inventoryItem.findMany({
      where: {
        OR: [
          { availableQuantity: { lte: this.prisma.inventoryItem.fields.reorderPoint } },
          {
            availableQuantity: {
              lte: {
                multiply: [this.prisma.inventoryItem.fields.reorderPoint, 1.2] // 20% buffer
              }
            }
          }
        ],
      },
      include: {
        product: {
          include: {
            suppliers: true,
          },
        },
        variant: true,
        warehouse: true,
      },
    });

    const reorderNeeded = lowStockItems.map(item => {
      // Calculate suggested order quantity using economic order quantity (EOQ)
      const demand = this.calculateAverageDemand(item.productId, item.variantId);
      const orderingCost = 50; // Fixed ordering cost
      const holdingCost = item.costPrice * 0.25; // 25% annual holding cost

      const eoq = Math.sqrt((2 * demand * orderingCost) / holdingCost);
      const suggestedOrderQuantity = Math.max(eoq, item.maxStock - item.quantity);

      const primarySupplier = item.product.suppliers[0];

      return {
        productId: item.productId,
        variantId: item.variantId,
        currentStock: item.availableQuantity,
        reorderPoint: item.reorderPoint,
        suggestedOrderQuantity: Math.ceil(suggestedOrderQuantity),
        warehouseId: item.warehouseId,
        supplierId: primarySupplier?.id,
        leadTimeDays: primarySupplier?.leadTimeDays || 7,
        estimatedCost: suggestedOrderQuantity * item.costPrice,
      };
    });

    return { reorderNeeded };
  }

  // Advanced analytics and forecasting
  async generateInventoryAnalytics(params: {
    startDate: Date;
    endDate: Date;
    warehouseId?: string;
    productIds?: string[];
  }): Promise<{
    turnoverRate: number;
    averageDaysOnHand: number;
    stockouts: number;
    excessStock: {
      productId: string;
      currentStock: number;
      optimalStock: number;
      excessValue: number;
    }[];
    fastMoving: {
      productId: string;
      salesVelocity: number;
      turnoverRate: number;
    }[];
    slowMoving: {
      productId: string;
      daysWithoutSale: number;
      currentStock: number;
      carryingCost: number;
    }[];
  }> {
    const { startDate, endDate, warehouseId, productIds } = params;

    // Get inventory movements for the period
    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        warehouseId,
        inventoryItem: productIds ? { productId: { in: productIds } } : undefined,
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate turnover rate
    const outgoingMovements = movements.filter(m => m.type === 'out');
    const totalSold = outgoingMovements.reduce((sum, m) => sum + m.quantity, 0);

    const averageInventory = await this.calculateAverageInventory(startDate, endDate, warehouseId);
    const turnoverRate = averageInventory > 0 ? totalSold / averageInventory : 0;

    const averageDaysOnHand = turnoverRate > 0 ? 365 / turnoverRate : 0;

    // Identify stockouts
    const stockouts = movements.filter(m =>
      m.type === 'out' && m.newQuantity === 0
    ).length;

    // Identify excess stock
    const excessStock = await this.identifyExcessStock();

    // Fast-moving items (high turnover)
    const fastMoving = await this.identifyFastMovingItems(startDate, endDate);

    // Slow-moving items (low turnover)
    const slowMoving = await this.identifySlowMovingItems(startDate, endDate);

    return {
      turnoverRate,
      averageDaysOnHand,
      stockouts,
      excessStock,
      fastMoving,
      slowMoving,
    };
  }

  // Demand forecasting
  async forecastDemand(productId: string, variantId?: string, daysToForecast = 30): Promise<{
    forecastedDemand: number[];
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    seasonality: {
      detected: boolean;
      pattern?: number[];
    };
  }> {
    // Get historical sales data
    const salesData = await this.getHistoricalSales(productId, variantId, 365); // 1 year of data

    // Simple moving average for demonstration
    // In production, use more sophisticated methods like ARIMA, exponential smoothing, etc.
    const movingAverage = this.calculateMovingAverage(salesData, 7); // 7-day moving average

    const lastValue = movingAverage[movingAverage.length - 1];
    const forecastedDemand = Array(daysToForecast).fill(lastValue);

    // Calculate trend
    const trend = this.calculateTrend(movingAverage);

    // Apply trend to forecast
    for (let i = 0; i < forecastedDemand.length; i++) {
      forecastedDemand[i] += trend * i;
    }

    // Detect seasonality (simplified)
    const seasonality = this.detectSeasonality(salesData);

    return {
      forecastedDemand,
      confidence: 0.75, // Placeholder confidence score
      trend: this.categorizeTrend(trend),
      seasonality,
    };
  }

  // Helper methods
  private async clearInventoryCache(items: Array<{ productId: string; variantId?: string }>): Promise<void> {
    const keys = items.map(item => `inventory:${item.productId}:${item.variantId || 'default'}`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private calculateAverageDemand(productId: string, variantId?: string): number {
    // Implementation to calculate average demand over time
    return 10; // Placeholder
  }

  private async calculateAverageInventory(startDate: Date, endDate: Date, warehouseId?: string): Promise<number> {
    // Implementation to calculate average inventory level
    return 100; // Placeholder
  }

  private async identifyExcessStock(): Promise<any[]> {
    // Implementation to identify excess stock
    return [];
  }

  private async identifyFastMovingItems(startDate: Date, endDate: Date): Promise<any[]> {
    // Implementation to identify fast-moving items
    return [];
  }

  private async identifySlowMovingItems(startDate: Date, endDate: Date): Promise<any[]> {
    // Implementation to identify slow-moving items
    return [];
  }

  private async getHistoricalSales(productId: string, variantId?: string, days: number): Promise<number[]> {
    // Implementation to get historical sales data
    return Array(days).fill(5); // Placeholder
  }

  private calculateMovingAverage(data: number[], window: number): number[] {
    const result = [];
    for (let i = window - 1; i < data.length; i++) {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
    return result;
  }

  private calculateTrend(data: number[]): number {
    // Simple linear regression to calculate trend
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private categorizeTrend(trend: number): 'increasing' | 'decreasing' | 'stable' {
    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }

  private detectSeasonality(data: number[]): { detected: boolean; pattern?: number[] } {
    // Simplified seasonality detection
    return { detected: false };
  }

  private setupInventoryAlerts(): void {
    this.eventEmitter.on('inventory.low', async (data) => {
      console.log('Low inventory alert:', data);
      // Send notifications, create purchase orders, etc.
    });

    this.eventEmitter.on('inventory.stockout', async (data) => {
      console.log('Stockout alert:', data);
      // Handle stockout scenarios
    });
  }
}
```

This comprehensive e-commerce platform skill provides expert-level capabilities for building modern, scalable e-commerce solutions with advanced Stripe integration, subscription management, multi-gateway payment processing, sophisticated inventory management, fraud prevention, and comprehensive analytics for both B2C and B2B commerce.