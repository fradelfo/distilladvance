/**
 * Jest configuration specifically for browser extension testing
 * Handles Chrome APIs, content scripts, and extension-specific environments
 */

const path = require('path');

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/utils/extension-test-setup.ts',
    '<rootDir>/tests/utils/chrome-api-mocks.ts',
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/app/packages/browser-extension/**/__tests__/**/*.{js,ts}',
    '<rootDir>/app/packages/browser-extension/**/*.{test,spec}.{js,ts}',
    '<rootDir>/tests/unit/extension/**/*.{test,spec}.{js,ts}',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          compilerOptions: {
            module: 'commonjs',
            target: 'es2020',
            lib: ['es2020', 'dom'],
            types: ['chrome', 'jest', '@types/chrome'],
          },
        },
      },
    ],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Module name mapping (aliases)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '^@browser-extension/(.*)$': '<rootDir>/app/packages/browser-extension/src/$1',
    '^@shared-types/(.*)$': '<rootDir>/app/packages/shared-types/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/utils/__mocks__/fileMock.js',
  },

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/extension',
  collectCoverageFrom: [
    'app/packages/browser-extension/src/**/*.{ts,tsx,js,jsx}',
    '!app/packages/browser-extension/src/**/*.d.ts',
    '!app/packages/browser-extension/src/**/*.stories.{js,ts,tsx}',
    '!app/packages/browser-extension/src/**/__tests__/**',
    '!app/packages/browser-extension/src/**/test-utils/**',
  ],

  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Content scripts have specific thresholds
    'app/packages/browser-extension/src/content/': {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    // Background service worker
    'app/packages/browser-extension/src/background/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Popup and options pages
    'app/packages/browser-extension/src/popup/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Test timeout
  testTimeout: 15000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Globals
  globals: {
    __DEV__: true,
    __TEST__: true,
    chrome: {},
    browser: {},
  },

  // Test environment options
  testEnvironmentOptions: {
    url: 'https://example.com',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/.next/'],

  // Module path ignore patterns
  modulePathIgnorePatterns: [
    '<rootDir>/app/packages/browser-extension/dist/',
    '<rootDir>/app/packages/browser-extension/build/',
  ],

  // Verbose output
  verbose: true,

  // Error on deprecated features
  errorOnDeprecated: true,

  // Extension-specific Jest configuration
  extensionConfig: {
    // Chrome extension testing utilities
    chromeExtensionPath: path.resolve(__dirname, '../../app/packages/browser-extension/dist'),

    // Content script testing configuration
    contentScript: {
      // Sites to test content script injection
      testSites: ['https://chat.openai.com', 'https://claude.ai', 'https://gemini.google.com'],
      // DOM selectors for testing
      selectors: {
        chatInput: '[data-testid="prompt-textarea"], textarea[placeholder*="message"]',
        messageContainer: '[data-testid="conversation-turn"], .message',
        submitButton: '[data-testid="send-button"], button[type="submit"]',
      },
    },

    // Background script testing configuration
    backgroundScript: {
      // Test Chrome APIs
      apis: ['tabs', 'runtime', 'storage', 'scripting', 'action'],
    },

    // Popup testing configuration
    popup: {
      dimensions: {
        width: 400,
        height: 600,
      },
    },
  },

  // Performance budgets for extension tests
  performanceBudgets: {
    contentScript: {
      loadTime: 100, // ms
      memoryUsage: 10 * 1024 * 1024, // 10MB
      bundleSize: 500 * 1024, // 500KB
    },
    backgroundScript: {
      loadTime: 200, // ms
      memoryUsage: 20 * 1024 * 1024, // 20MB
      bundleSize: 1024 * 1024, // 1MB
    },
    popup: {
      loadTime: 500, // ms
      memoryUsage: 50 * 1024 * 1024, // 50MB
      bundleSize: 2 * 1024 * 1024, // 2MB
    },
  },

  // Custom reporters
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        outputPath: 'coverage/extension/test-report.html',
        pageTitle: 'Browser Extension Test Report',
        includeFailureMsg: true,
        includeSuiteFailure: true,
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'extension-junit.xml',
        suiteName: 'Browser Extension Tests',
      },
    ],
  ],

  // Watch mode configuration
  watchPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/', '/build/'],
};

// Export specific configurations for different test types
module.exports.contentScriptConfig = {
  ...module.exports,
  testMatch: [
    '<rootDir>/app/packages/browser-extension/src/content/**/*.{test,spec}.{js,ts}',
    '<rootDir>/tests/unit/extension/content/**/*.{test,spec}.{js,ts}',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/utils/content-script-setup.ts'],
};

module.exports.backgroundScriptConfig = {
  ...module.exports,
  testEnvironment: 'node', // Background scripts run in service worker context
  testMatch: [
    '<rootDir>/app/packages/browser-extension/src/background/**/*.{test,spec}.{js,ts}',
    '<rootDir>/tests/unit/extension/background/**/*.{test,spec}.{js,ts}',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/utils/background-script-setup.ts'],
};

module.exports.popupConfig = {
  ...module.exports,
  testMatch: [
    '<rootDir>/app/packages/browser-extension/src/popup/**/*.{test,spec}.{js,ts,tsx}',
    '<rootDir>/tests/unit/extension/popup/**/*.{test,spec}.{js,ts,tsx}',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/utils/popup-setup.ts'],
};
