import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment configuration
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/utils/test-setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/playwright-report/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        // Browser extension specific thresholds
        'app/packages/browser-extension/src/': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // AI services higher threshold
        'app/packages/api-server/src/ai/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },

    // File matching patterns
    include: [
      'app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'tests/e2e/**',
      'tests/integration/**',
    ],

    // Test timeout and retry configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    retry: 1,

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // Browser extension specific configuration
    browser: {
      enabled: false, // Use jsdom for most tests
      name: 'chrome',
      headless: true,
    },

    // Watch mode configuration
    watch: {
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**'],
    },

    // Reporter configuration
    reporter: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results/vitest-results.json',
      html: './test-results/vitest-report.html',
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../app'),
      '@browser-extension': resolve(__dirname, '../../app/packages/browser-extension/src'),
      '@web-app': resolve(__dirname, '../../app/packages/web-app/src'),
      '@api-server': resolve(__dirname, '../../app/packages/api-server/src'),
      '@shared-types': resolve(__dirname, '../../app/packages/shared-types'),
      '@tests': resolve(__dirname, '../../tests'),
    },
  },

  // Define global variables
  define: {
    __TEST__: true,
    __DEV__: true,
    'process.env.NODE_ENV': '"test"',
  },

  // ESBuild configuration for TypeScript
  esbuild: {
    target: 'node18',
  },
});

// Browser extension specific configuration
export const extensionConfig = defineConfig({
  ...defineConfig({
    test: {
      environment: 'happy-dom', // Lighter DOM environment for extension tests
      globals: true,
      setupFiles: ['./tests/utils/browser-setup.ts'],
      include: ['app/packages/browser-extension/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: ['app/packages/browser-extension/dist/**'],
      testTimeout: 15000, // Longer timeout for extension tests
      browser: {
        enabled: true,
        name: 'chrome',
        headless: true,
        provider: 'playwright',
      },
    },
  }).test,
});

// AI/LLM testing configuration
export const aiConfig = defineConfig({
  ...defineConfig({
    test: {
      environment: 'node',
      globals: true,
      setupFiles: ['./tests/utils/ai-test-helpers.ts'],
      include: [
        'app/packages/api-server/src/ai/**/*.{test,spec}.{js,ts}',
        'tests/integration/ai-services/**/*.{test,spec}.{js,ts}',
      ],
      testTimeout: 30000, // Longer timeout for AI tests
      retry: 2, // More retries for potentially flaky AI service tests
      pool: 'forks', // Isolated processes for AI tests
      poolOptions: {
        forks: {
          singleFork: false,
          maxForks: 2, // Limit concurrent AI tests to avoid rate limits
          minForks: 1,
        },
      },
    },
  }).test,
});

// Performance testing configuration
export const performanceConfig = defineConfig({
  ...defineConfig({
    test: {
      environment: 'node',
      globals: true,
      setupFiles: ['./tests/utils/performance-setup.ts'],
      include: ['tests/performance/**/*.{test,spec}.{js,ts}'],
      testTimeout: 60000, // Very long timeout for performance tests
      retry: 0, // No retries for performance tests (consistent results)
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true, // Single process for consistent performance measurements
          maxForks: 1,
          minForks: 1,
        },
      },
    },
  }).test,
});
