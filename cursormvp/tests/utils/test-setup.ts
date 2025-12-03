/**
 * Global test setup configuration for Vitest
 * Configures test environment, mocks, and utilities
 */

import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { handlers } from './api-mocks';
import '@testing-library/jest-dom';

// MSW server for API mocking
export const server = setupServer(...handlers);

// Global test configuration
beforeAll(async () => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'error',
  });

  // Setup global mocks
  setupGlobalMocks();

  // Initialize test database
  await setupTestDatabase();

  // Setup AI service mocks
  setupAIMocks();
});

afterAll(async () => {
  // Close MSW server
  server.close();

  // Cleanup test database
  await cleanupTestDatabase();

  // Clear all mocks
  vi.clearAllMocks();
});

beforeEach(() => {
  // Reset MSW handlers
  server.resetHandlers();

  // Clear all timers
  vi.clearAllTimers();

  // Reset modules
  vi.resetModules();
});

afterEach(() => {
  // Cleanup React Testing Library
  cleanup();

  // Clear all mocks
  vi.clearAllMocks();

  // Restore all mocks
  vi.restoreAllMocks();
});

/**
 * Setup global mocks for common APIs and services
 */
function setupGlobalMocks() {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock fetch for tests that don't use MSW
  global.fetch = vi.fn();

  // Mock crypto.randomUUID
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    },
  });

  // Mock console methods for cleaner test output
  global.console = {
    ...console,
    // Uncomment to suppress console output in tests
    // log: vi.fn(),
    // warn: vi.fn(),
    // error: vi.fn(),
    // debug: vi.fn(),
    // info: vi.fn()
  };

  // Mock environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
}

/**
 * Setup test database with isolated transactions
 */
async function setupTestDatabase() {
  try {
    const { PrismaClient } = await import('@prisma/client');

    // Create test database client
    globalThis.__TEST_PRISMA__ = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/distill_test',
        },
      },
    });

    // Run migrations
    await globalThis.__TEST_PRISMA__.$executeRaw`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `;
  } catch (error) {
    console.warn('Test database setup failed:', error);
  }
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
  try {
    if (globalThis.__TEST_PRISMA__) {
      await globalThis.__TEST_PRISMA__.$disconnect();
      globalThis.__TEST_PRISMA__ = undefined;
    }
  } catch (error) {
    console.warn('Test database cleanup failed:', error);
  }
}

/**
 * Setup AI service mocks
 */
function setupAIMocks() {
  // Mock OpenAI
  vi.mock('openai', () => ({
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Mocked OpenAI response',
                  role: 'assistant',
                },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 5,
              total_tokens: 15,
            },
          }),
        },
      },
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [
            {
              embedding: Array(1536)
                .fill(0)
                .map(() => Math.random()),
            },
          ],
          usage: {
            prompt_tokens: 10,
            total_tokens: 10,
          },
        }),
      },
    })),
  }));

  // Mock Anthropic
  vi.mock('@anthropic-ai/sdk', () => ({
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: 'Mocked Anthropic response',
            },
          ],
          role: 'assistant',
          usage: {
            input_tokens: 10,
            output_tokens: 5,
          },
        }),
      },
    })),
  }));

  // Mock vector database
  vi.mock('chromadb', () => ({
    ChromaApi: vi.fn().mockImplementation(() => ({
      createCollection: vi.fn().mockResolvedValue({}),
      getCollection: vi.fn().mockResolvedValue({
        add: vi.fn().mockResolvedValue({}),
        query: vi.fn().mockResolvedValue({
          documents: [['Mocked document']],
          metadatas: [[{ id: 'test-id' }]],
          distances: [[0.1]],
        }),
        delete: vi.fn().mockResolvedValue({}),
      }),
    })),
  }));
}

/**
 * Test utilities
 */
export const testUtils = {
  // Wait for next tick
  waitForNextTick: () => new Promise((resolve) => process.nextTick(resolve)),

  // Wait for timeout
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Create mock function with TypeScript support
  createMockFn: <T extends (...args: unknown[]) => unknown>(): MockedFunction<T> =>
    vi.fn() as MockedFunction<T>,

  // Generate test data
  generateTestData: {
    user: (overrides = {}) => ({
      id: crypto.randomUUID(),
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      ...overrides,
    }),

    conversation: (overrides = {}) => ({
      id: crypto.randomUUID(),
      title: 'Test Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),

    aiResponse: (overrides = {}) => ({
      id: crypto.randomUUID(),
      content: 'Test AI response',
      role: 'assistant' as const,
      timestamp: new Date(),
      ...overrides,
    }),
  },

  // Database utilities
  db: {
    // Clean database between tests
    cleanup: async () => {
      if (globalThis.__TEST_PRISMA__) {
        const tablenames = await globalThis.__TEST_PRISMA__.$queryRaw<
          Array<{ tablename: string }>
        >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

        const tables = tablenames
          .map(({ tablename }) => tablename)
          .filter((name) => name !== '_prisma_migrations')
          .map((name) => `"public"."${name}"`)
          .join(', ');

        try {
          await globalThis.__TEST_PRISMA__.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        } catch (_error) {}
      }
    },

    // Seed test data
    seed: async (data: any) => {
      if (globalThis.__TEST_PRISMA__) {
        // Implementation depends on your data model
        return data;
      }
    },
  },
};

// Type definitions
type MockedFunction<T extends (...args: any[]) => any> = T & {
  mock: {
    calls: Parameters<T>[];
    results: Array<{ type: 'return'; value: ReturnType<T> } | { type: 'throw'; value: any }>;
  };
};

// Global type extensions
declare global {
  var __TEST_PRISMA__: any;

  namespace NodeJS {
    interface Global {
      __TEST_PRISMA__: any;
    }
  }
}

// Export for use in individual test files
export { vi, server };
