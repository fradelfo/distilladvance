import path from 'path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for comprehensive E2E testing
 * Includes browser extension testing, web app testing, and cross-browser compatibility
 */
export default defineConfig({
  testDir: '../e2e',
  outputDir: '../e2e/test-results',

  /* Global test configuration */
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 5000, // 5 seconds for assertions
  },

  /* Fail fast on CI, retry locally */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: '../playwright-report' }],
    ['json', { outputFile: '../test-results/playwright-results.json' }],
    ['junit', { outputFile: '../test-results/playwright-junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('../utils/global-setup.ts'),
  globalTeardown: require.resolve('../utils/global-teardown.ts'),

  /* Shared settings for all projects */
  use: {
    /* Base URL for web application tests */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace on first retry */
    trace: 'on-first-retry',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Action timeout */
    actionTimeout: 10000,

    /* Navigation timeout */
    navigationTimeout: 15000,
  },

  /* Test projects for different browsers and scenarios */
  projects: [
    /* Setup project - runs first */
    {
      name: 'setup',
      testMatch: '**/setup.spec.ts',
    },

    /* Browser Extension Testing - Chrome */
    {
      name: 'chrome-extension',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      testDir: '../e2e/browser-extension',
      dependencies: ['setup'],
      grep: /@extension/,
      use: {
        ...devices['Desktop Chrome'],
        // Load extension for testing
        args: [
          `--disable-extensions-except=${path.resolve(__dirname, '../../app/packages/browser-extension/dist')}`,
          `--load-extension=${path.resolve(__dirname, '../../app/packages/browser-extension/dist')}`,
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
        ],
      },
    },

    /* Browser Extension Testing - Firefox */
    {
      name: 'firefox-extension',
      use: {
        ...devices['Desktop Firefox'],
      },
      testDir: '../e2e/browser-extension',
      dependencies: ['setup'],
      grep: /@extension/,
    },

    /* Web Application Testing - Desktop Chrome */
    {
      name: 'chrome-web-app',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      testDir: '../e2e/web-app',
      dependencies: ['setup'],
      grep: /@web-app/,
    },

    /* Web Application Testing - Desktop Firefox */
    {
      name: 'firefox-web-app',
      use: {
        ...devices['Desktop Firefox'],
      },
      testDir: '../e2e/web-app',
      dependencies: ['setup'],
      grep: /@web-app/,
    },

    /* Web Application Testing - Desktop Safari */
    {
      name: 'safari-web-app',
      use: {
        ...devices['Desktop Safari'],
      },
      testDir: '../e2e/web-app',
      dependencies: ['setup'],
      grep: /@web-app/,
    },

    /* Mobile Testing */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      testDir: '../e2e/web-app',
      dependencies: ['setup'],
      grep: /@mobile/,
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
      testDir: '../e2e/web-app',
      dependencies: ['setup'],
      grep: /@mobile/,
    },

    /* AI Integration Testing */
    {
      name: 'ai-integration',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      testDir: '../e2e/ai-integration',
      dependencies: ['setup'],
      grep: /@ai/,
      timeout: 60000, // Longer timeout for AI tests
    },

    /* Cross-Platform Integration Testing */
    {
      name: 'cross-platform',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      testDir: '../e2e/cross-platform',
      dependencies: ['setup'],
      grep: /@cross-platform/,
    },

    /* Performance Testing */
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      testDir: '../e2e/performance',
      dependencies: ['setup'],
      grep: /@performance/,
      timeout: 90000, // Extended timeout for performance tests
    },

    /* Accessibility Testing */
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      testDir: '../e2e/accessibility',
      dependencies: ['setup'],
      grep: /@a11y/,
    },
  ],

  /* Local development server */
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: 'bun run dev:web',
          port: 3000,
          timeout: 120 * 1000,
          reuseExistingServer: !process.env.CI,
        },
        {
          command: 'bun run dev:api',
          port: 3001,
          timeout: 120 * 1000,
          reuseExistingServer: !process.env.CI,
        },
      ],
});

/* Browser Extension specific configuration */
export const extensionConfig = defineConfig({
  testDir: '../e2e/browser-extension',
  timeout: 45 * 1000, // Longer timeout for extension operations

  use: {
    trace: 'on',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chrome-extension-dev',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        args: [
          `--disable-extensions-except=${path.resolve(__dirname, '../../app/packages/browser-extension/dist')}`,
          `--load-extension=${path.resolve(__dirname, '../../app/packages/browser-extension/dist')}`,
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      },
    },
    {
      name: 'firefox-extension-dev',
      use: {
        ...devices['Desktop Firefox'],
        firefoxUserPrefs: {
          'extensions.autoDisableScopes': 0,
          'extensions.enabledScopes': 15,
        },
      },
    },
  ],
});

/* Performance Testing Configuration */
export const performanceConfig = defineConfig({
  testDir: '../e2e/performance',
  timeout: 120 * 1000, // 2 minutes for performance tests

  use: {
    trace: 'off', // Disable tracing for performance tests
    video: 'off',
    screenshot: 'off',
  },

  projects: [
    {
      name: 'performance-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        args: [
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      },
    },
  ],
});

/* Visual Testing Configuration */
export const visualConfig = defineConfig({
  testDir: '../e2e/visual',
  timeout: 60 * 1000,

  use: {
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'visual-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'visual-firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
  ],

  expect: {
    threshold: 0.2, // Allow 20% pixel difference for visual comparisons
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled',
    },
  },
});
