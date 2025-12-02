/**
 * API Mock Handlers for MSW (Mock Service Worker)
 * Provides realistic API responses for testing without hitting real endpoints
 */

import { http, HttpResponse } from 'msw';

// Mock data generators
const generateUser = (overrides = {}) => ({
  id: crypto.randomUUID(),
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://avatars.example.com/test-user.jpg',
  plan: 'pro',
  usage: {
    tokensUsed: 15000,
    tokensLimit: 100000,
    conversationsCount: 25,
    distillationsCount: 150,
  },
  preferences: {
    theme: 'light',
    defaultModel: 'gpt-4',
    privacyLevel: 'standard',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const generateConversation = (overrides = {}) => ({
  id: crypto.randomUUID(),
  title: 'Sample AI Conversation',
  platform: 'openai',
  messages: [
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'What is the meaning of life?',
      timestamp: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        'The meaning of life is a philosophical question that has been pondered by humans throughout history...',
      timestamp: new Date().toISOString(),
    },
  ],
  distillationResults: {
    id: crypto.randomUUID(),
    originalLength: 1500,
    distilledLength: 300,
    compressionRatio: 0.8,
    qualityScore: 0.92,
    keyInsights: [
      "Philosophical exploration of life's meaning",
      'Multiple perspectives on purpose and fulfillment',
      'Historical context and modern interpretations',
    ],
    prompt:
      'Distill this conversation about the meaning of life, preserving key philosophical insights.',
    createdAt: new Date().toISOString(),
  },
  metadata: {
    wordCount: 1500,
    estimatedReadTime: 6,
    topics: ['philosophy', 'meaning', 'life'],
    sentiment: 'neutral',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const generatePromptTemplate = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'Code Review Template',
  description: 'Comprehensive code review focusing on security, performance, and best practices',
  category: 'development',
  prompt: `Review the following code for:
1. Security vulnerabilities
2. Performance issues
3. Code quality and best practices
4. Potential bugs
5. Maintainability

Provide specific suggestions for improvement.`,
  variables: ['code', 'language', 'context'],
  tags: ['code-review', 'security', 'performance'],
  usageCount: 245,
  rating: 4.8,
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// API Route Handlers
export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();

    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        user: generateUser(),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      });
    }

    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      token: 'new-mock-jwt-token',
      expiresIn: 3600,
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // User endpoints
  http.get('/api/user/profile', () => {
    return HttpResponse.json({
      user: generateUser(),
    });
  }),

  http.put('/api/user/profile', async ({ request }) => {
    const updates = await request.json();
    return HttpResponse.json({
      user: generateUser(updates),
    });
  }),

  http.get('/api/user/usage', () => {
    return HttpResponse.json({
      current: {
        tokensUsed: 15000,
        tokensLimit: 100000,
        conversationsCount: 25,
        distillationsCount: 150,
        costThisMonth: 12.45,
      },
      history: [
        { date: '2024-01-01', tokens: 5000, cost: 4.2 },
        { date: '2024-01-02', tokens: 7500, cost: 6.3 },
        { date: '2024-01-03', tokens: 2500, cost: 1.95 },
      ],
    });
  }),

  // Conversations endpoints
  http.get('/api/conversations', ({ request }) => {
    const url = new URL(request.url);
    const page = Number.parseInt(url.searchParams.get('page') || '1');
    const limit = Number.parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');

    let conversations = Array.from({ length: 50 }, (_, i) =>
      generateConversation({
        title: `Conversation ${i + 1}`,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      })
    );

    if (search) {
      conversations = conversations.filter((conv) =>
        conv.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = conversations.slice(startIndex, endIndex);

    return HttpResponse.json({
      conversations: paginatedConversations,
      pagination: {
        page,
        limit,
        total: conversations.length,
        pages: Math.ceil(conversations.length / limit),
      },
    });
  }),

  http.get('/api/conversations/:id', ({ params }) => {
    return HttpResponse.json({
      conversation: generateConversation({ id: params.id }),
    });
  }),

  http.post('/api/conversations', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        conversation: generateConversation(body),
      },
      { status: 201 }
    );
  }),

  http.put('/api/conversations/:id', async ({ params, request }) => {
    const updates = await request.json();
    return HttpResponse.json({
      conversation: generateConversation({ id: params.id, ...updates }),
    });
  }),

  http.delete('/api/conversations/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // AI/Distillation endpoints
  http.post('/api/ai/distill', async ({ request }) => {
    const body = await request.json();

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return HttpResponse.json({
      distillation: {
        id: crypto.randomUUID(),
        originalContent: body.content,
        distilledContent: `Distilled version of: ${body.content.substring(0, 100)}...`,
        compressionRatio: 0.75,
        qualityScore: 0.88,
        processingTime: 1850,
        model: body.model || 'gpt-4',
        tokensUsed: 450,
        cost: 0.027,
        keyInsights: [
          'Main topic identified and preserved',
          'Supporting details condensed effectively',
          'Action items highlighted',
        ],
      },
    });
  }),

  http.post('/api/ai/chat', async ({ request }) => {
    const body = await request.json();

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return HttpResponse.json({
      response: {
        content: `AI response to: ${body.message}`,
        role: 'assistant',
        model: body.model || 'gpt-4',
        tokensUsed: {
          prompt: 125,
          completion: 85,
          total: 210,
        },
        cost: 0.0126,
        processingTime: 1450,
      },
    });
  }),

  http.get('/api/ai/models', () => {
    return HttpResponse.json({
      models: [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'OpenAI',
          contextWindow: 8192,
          costPer1kTokens: { input: 0.03, output: 0.06 },
          capabilities: ['chat', 'distillation', 'analysis'],
          available: true,
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'OpenAI',
          contextWindow: 4096,
          costPer1kTokens: { input: 0.0015, output: 0.002 },
          capabilities: ['chat', 'distillation'],
          available: true,
        },
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          provider: 'Anthropic',
          contextWindow: 200000,
          costPer1kTokens: { input: 0.003, output: 0.015 },
          capabilities: ['chat', 'distillation', 'analysis', 'coding'],
          available: true,
        },
      ],
    });
  }),

  // Prompt Templates endpoints
  http.get('/api/templates', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    let templates = Array.from({ length: 20 }, (_, i) =>
      generatePromptTemplate({
        name: `Template ${i + 1}`,
        category: category || ['development', 'analysis', 'writing'][i % 3],
      })
    );

    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    return HttpResponse.json({ templates });
  }),

  http.get('/api/templates/:id', ({ params }) => {
    return HttpResponse.json({
      template: generatePromptTemplate({ id: params.id }),
    });
  }),

  http.post('/api/templates', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        template: generatePromptTemplate(body),
      },
      { status: 201 }
    );
  }),

  // Analytics endpoints
  http.get('/api/analytics/usage', () => {
    return HttpResponse.json({
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        tokens: Math.floor(Math.random() * 5000) + 1000,
        conversations: Math.floor(Math.random() * 10) + 1,
        distillations: Math.floor(Math.random() * 15) + 2,
        cost: Math.round((Math.random() * 10 + 2) * 100) / 100,
      })).reverse(),
      totals: {
        tokensThisMonth: 45000,
        conversationsThisMonth: 125,
        distillationsThisMonth: 280,
        costThisMonth: 28.5,
      },
    });
  }),

  http.get('/api/analytics/performance', () => {
    return HttpResponse.json({
      averageResponseTime: 1250,
      averageQualityScore: 0.87,
      popularModels: [
        { model: 'gpt-4', usage: 65 },
        { model: 'claude-3-sonnet', usage: 25 },
        { model: 'gpt-3.5-turbo', usage: 10 },
      ],
      topCategories: [
        { category: 'development', count: 45 },
        { category: 'analysis', count: 32 },
        { category: 'writing', count: 18 },
      ],
    });
  }),

  // Extension-specific endpoints
  http.get('/api/extension/sites', () => {
    return HttpResponse.json({
      supportedSites: [
        {
          domain: 'chat.openai.com',
          name: 'ChatGPT',
          selectors: {
            chatInput: 'textarea[placeholder*="message"]',
            messageContainer: '[data-testid="conversation-turn"]',
            submitButton: '[data-testid="send-button"]',
          },
          status: 'active',
        },
        {
          domain: 'claude.ai',
          name: 'Claude',
          selectors: {
            chatInput: 'div[contenteditable="true"]',
            messageContainer: '.message',
            submitButton: 'button[type="submit"]',
          },
          status: 'active',
        },
      ],
    });
  }),

  http.post('/api/extension/detect', async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      detected: true,
      platform: body.url.includes('openai.com')
        ? 'openai'
        : body.url.includes('claude.ai')
          ? 'anthropic'
          : 'unknown',
      confidence: 0.95,
      selectors: {
        chatInput: 'textarea',
        messageContainer: '.message',
        submitButton: 'button[type="submit"]',
      },
    });
  }),

  // Error simulation endpoints for testing
  http.get('/api/test/error/:code', ({ params }) => {
    const code = Number.parseInt(params.code as string);
    return HttpResponse.json({ error: `Simulated ${code} error` }, { status: code });
  }),

  http.get('/api/test/slow', async () => {
    // Simulate slow response
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return HttpResponse.json({ message: 'Slow response completed' });
  }),

  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        ai_providers: 'available',
        cache: 'operational',
      },
    });
  }),
];

// Error handlers for development
export const errorHandlers = [
  // Simulate network errors
  http.get('/api/network-error', () => {
    return HttpResponse.error();
  }),

  // Simulate timeout
  http.get('/api/timeout', async () => {
    await new Promise((resolve) => setTimeout(resolve, 30000));
    return HttpResponse.json({ message: 'This should timeout' });
  }),
];

// Export default handlers
export default handlers;
