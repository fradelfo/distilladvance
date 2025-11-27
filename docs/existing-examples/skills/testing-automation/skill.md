# Testing Automation Skill

Advanced test automation expertise covering unit testing, integration testing, end-to-end testing, performance testing, and modern testing frameworks.

## Skill Overview

Comprehensive testing automation knowledge including test-driven development, behavior-driven development, continuous testing, test orchestration, visual testing, and quality assurance automation using cutting-edge tools and frameworks.

## Core Capabilities

### Test Strategy & Design
- **Test pyramid** - Unit, integration, E2E test distribution and strategy
- **Test-driven development** - TDD/BDD methodologies and best practices
- **Test data management** - Fixtures, factories, synthetic data generation
- **Test environment management** - Containerized testing, test isolation

### Unit Testing Excellence
- **Modern frameworks** - Jest, Vitest, pytest, JUnit 5, RSpec
- **Mocking strategies** - Service mocking, dependency injection, test doubles
- **Property-based testing** - Hypothesis, QuickCheck, fast-check
- **Mutation testing** - Test quality assessment and improvement

### Integration Testing
- **API testing** - REST, GraphQL, gRPC service testing
- **Database testing** - Transaction testing, data integrity validation
- **Message queue testing** - Async communication testing
- **Contract testing** - Pact, consumer-driven contracts

### End-to-End Testing
- **Browser automation** - Playwright, Cypress, Selenium WebDriver
- **Mobile testing** - Appium, Detox, native testing frameworks
- **Visual testing** - Snapshot testing, visual regression detection
- **Cross-browser testing** - Multi-browser compatibility automation

## Modern Testing Framework Implementation

### Advanced Jest/Vitest Configuration
```javascript
// Modern Jest configuration with advanced features
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/global-setup.js',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/*.test.{js,ts}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Test organization
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,ts}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts}',
  ],

  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Advanced features
  maxWorkers: '50%',
  cache: true,
  testTimeout: 30000,

  // Custom reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
    }],
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'test-report.html',
      expand: true,
    }],
  ],

  // Snapshot serializers
  snapshotSerializers: ['enzyme-to-json/serializer'],

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
      useESM: true,
    }],
  },

  // Environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
};

// Advanced test utilities and fixtures
// tests/utils/test-helpers.js
import { faker } from '@faker-js/faker';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';

export class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      createdAt: faker.date.past(),
      isActive: true,
      profile: {
        bio: faker.lorem.sentence(),
        avatar: faker.image.avatar(),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark']),
          notifications: faker.datatype.boolean(),
        },
      },
      ...overrides,
    };
  }

  static createUsers(count = 5, overrides = {}) {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  static createApiResponse(data, overrides = {}) {
    return {
      success: true,
      data,
      message: 'Success',
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  }

  static createErrorResponse(message = 'Something went wrong', code = 500) {
    return {
      success: false,
      error: {
        message,
        code,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export class MockBuilder {
  constructor() {
    this.mocks = new Map();
  }

  mockApiService() {
    const mockApi = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    this.mocks.set('ApiService', mockApi);
    return this;
  }

  mockDatabase() {
    const mockDb = {
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      transaction: jest.fn(),
    };

    this.mocks.set('Database', mockDb);
    return this;
  }

  mockEventBus() {
    const mockEventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
    };

    this.mocks.set('EventBus', mockEventBus);
    return this;
  }

  build() {
    return Object.fromEntries(this.mocks);
  }
}

// Property-based testing utilities
export class PropertyTesting {
  static generateEmail() {
    const domains = ['test.com', 'example.org', 'demo.net'];
    const username = faker.internet.userName();
    const domain = faker.helpers.arrayElement(domains);
    return `${username}@${domain}`;
  }

  static generatePhoneNumber() {
    return faker.phone.number('+1##########');
  }

  static generateValidPassword() {
    // Ensure password meets complexity requirements
    const lowercase = faker.string.alpha({ length: 2, casing: 'lower' });
    const uppercase = faker.string.alpha({ length: 2, casing: 'upper' });
    const numbers = faker.string.numeric(2);
    const special = faker.helpers.arrayElements(['!', '@', '#', '$'], 2).join('');
    const random = faker.string.alphanumeric(4);

    return faker.helpers.shuffle([
      lowercase, uppercase, numbers, special, random
    ].join('').split('')).join('');
  }

  static runPropertyTest(description, generator, predicate, iterations = 100) {
    test(description, () => {
      for (let i = 0; i < iterations; i++) {
        const input = generator();
        const result = predicate(input);

        if (!result.success) {
          throw new Error(
            `Property test failed on iteration ${i + 1}: ${result.message}\nInput: ${JSON.stringify(input, null, 2)}`
          );
        }
      }
    });
  }
}

// Component testing utilities
export function createWrapper(Component, props = {}, options = {}) {
  return mount(Component, {
    global: {
      plugins: [createTestingPinia()],
      stubs: ['RouterLink', 'RouterView'],
      ...options.global,
    },
    props,
    ...options,
  });
}

export function waitForElement(wrapper, selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = wrapper.find(selector);

      if (element.exists()) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
      } else {
        setTimeout(checkElement, 100);
      }
    };

    checkElement();
  });
}

// Advanced test examples
describe('UserService', () => {
  let userService;
  let mockApi;
  let mockDatabase;

  beforeEach(() => {
    const mocks = new MockBuilder()
      .mockApiService()
      .mockDatabase()
      .build();

    mockApi = mocks.ApiService;
    mockDatabase = mocks.Database;

    userService = new UserService({
      api: mockApi,
      database: mockDatabase,
    });
  });

  describe('User creation', () => {
    test('should create user with valid data', async () => {
      // Arrange
      const userData = TestDataFactory.createUser({ email: 'test@example.com' });
      const expectedResponse = TestDataFactory.createApiResponse({ user: userData });

      mockApi.post.mockResolvedValue(expectedResponse);
      mockDatabase.create.mockResolvedValue(userData);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(userData);
      expect(mockApi.post).toHaveBeenCalledWith('/users', userData);
      expect(mockDatabase.create).toHaveBeenCalledWith('users', userData);
    });

    test('should handle duplicate email error', async () => {
      // Arrange
      const userData = TestDataFactory.createUser();
      const errorResponse = TestDataFactory.createErrorResponse('Email already exists', 409);

      mockApi.post.mockRejectedValue(new Error('Email already exists'));

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow('Email already exists');
      expect(mockDatabase.create).not.toHaveBeenCalled();
    });

    // Property-based test
    PropertyTesting.runPropertyTest(
      'should accept any valid email format',
      () => ({ email: PropertyTesting.generateEmail() }),
      (input) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email);
        return { success: isValid, message: `Invalid email: ${input.email}` };
      }
    );
  });

  describe('User search with debouncing', () => {
    jest.useFakeTimers();

    test('should debounce search requests', async () => {
      // Arrange
      const searchTerms = ['a', 'ab', 'abc'];
      mockApi.get.mockResolvedValue(TestDataFactory.createApiResponse({ users: [] }));

      // Act
      searchTerms.forEach(term => userService.searchUsers(term));
      jest.advanceTimersByTime(300); // Debounce delay

      // Assert
      expect(mockApi.get).toHaveBeenCalledTimes(1);
      expect(mockApi.get).toHaveBeenCalledWith('/users/search?q=abc');
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});

// Snapshot testing with custom serializers
expect.addSnapshotSerializer({
  test: (val) => val && typeof val.toISOString === 'function',
  print: () => '[Date]',
});

expect.addSnapshotSerializer({
  test: (val) => typeof val === 'string' && val.match(/^[0-9a-f-]{36}$/),
  print: () => '[UUID]',
});

test('should render user card correctly', () => {
  const user = TestDataFactory.createUser();
  const wrapper = createWrapper(UserCard, { user });

  expect(wrapper.html()).toMatchSnapshot();
});
```

### Playwright E2E Testing Framework
```typescript
// Advanced Playwright configuration and tests
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],

  outputDir: 'test-results/',
});

// Advanced page object pattern
// e2e/pages/user-management.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class UserManagementPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly addUserButton: Locator;
  readonly userTable: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('user-search');
    this.addUserButton = page.getByTestId('add-user-btn');
    this.userTable = page.getByTestId('users-table');
    this.loadingSpinner = page.getByTestId('loading-spinner');
    this.errorMessage = page.getByTestId('error-message');
    this.paginationNext = page.getByTestId('pagination-next');
    this.paginationPrev = page.getByTestId('pagination-prev');
  }

  async goto() {
    await this.page.goto('/users');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.loadingSpinner.waitFor({ state: 'hidden' });
    await expect(this.userTable).toBeVisible();
  }

  async searchUsers(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForLoad();
  }

  async getUserRow(userEmail: string) {
    return this.userTable.locator(`tr:has-text("${userEmail}")`);
  }

  async addUser(userData: { name: string; email: string; role: string }) {
    await this.addUserButton.click();

    const modal = this.page.getByTestId('add-user-modal');
    await expect(modal).toBeVisible();

    await this.page.getByTestId('user-name-input').fill(userData.name);
    await this.page.getByTestId('user-email-input').fill(userData.email);
    await this.page.getByTestId('user-role-select').selectOption(userData.role);

    await this.page.getByTestId('save-user-btn').click();
    await expect(modal).toBeHidden();
    await this.waitForLoad();
  }

  async editUser(userEmail: string, updates: Partial<{ name: string; role: string }>) {
    const userRow = await this.getUserRow(userEmail);
    await userRow.getByTestId('edit-user-btn').click();

    const modal = this.page.getByTestId('edit-user-modal');
    await expect(modal).toBeVisible();

    if (updates.name) {
      const nameInput = this.page.getByTestId('user-name-input');
      await nameInput.clear();
      await nameInput.fill(updates.name);
    }

    if (updates.role) {
      await this.page.getByTestId('user-role-select').selectOption(updates.role);
    }

    await this.page.getByTestId('save-user-btn').click();
    await expect(modal).toBeHidden();
    await this.waitForLoad();
  }

  async deleteUser(userEmail: string) {
    const userRow = await this.getUserRow(userEmail);
    await userRow.getByTestId('delete-user-btn').click();

    const confirmDialog = this.page.getByTestId('confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    await this.page.getByTestId('confirm-delete-btn').click();
    await expect(confirmDialog).toBeHidden();
    await this.waitForLoad();
  }

  async expectUserInTable(userEmail: string, shouldExist: boolean = true) {
    const userRow = this.getUserRow(userEmail);

    if (shouldExist) {
      await expect(userRow).toBeVisible();
    } else {
      await expect(userRow).not.toBeVisible();
    }
  }

  async expectUserCount(count: number) {
    await expect(this.userTable.locator('tbody tr')).toHaveCount(count);
  }

  async goToNextPage() {
    await this.paginationNext.click();
    await this.waitForLoad();
  }

  async goToPreviousPage() {
    await this.paginationPrev.click();
    await this.waitForLoad();
  }
}

// Test data management
// e2e/fixtures/test-data.ts
export interface TestUser {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  password: string;
}

export class TestDataManager {
  private static instance: TestDataManager;
  private users: TestUser[] = [];

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  createUser(overrides: Partial<TestUser> = {}): TestUser {
    const user: TestUser = {
      name: `Test User ${Date.now()}`,
      email: `test.${Date.now()}@example.com`,
      role: 'user',
      password: 'TestPassword123!',
      ...overrides,
    };

    this.users.push(user);
    return user;
  }

  createUsers(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  getUsers(): TestUser[] {
    return this.users;
  }

  cleanup(): void {
    this.users = [];
  }
}

// Advanced E2E tests
// e2e/user-management.spec.ts
import { test, expect } from '@playwright/test';
import { UserManagementPage } from './pages/user-management.page';
import { TestDataManager } from './fixtures/test-data';

test.describe('User Management', () => {
  let userPage: UserManagementPage;
  let testData: TestDataManager;

  test.beforeEach(async ({ page }) => {
    userPage = new UserManagementPage(page);
    testData = TestDataManager.getInstance();
    await userPage.goto();
  });

  test.afterEach(async () => {
    testData.cleanup();
  });

  test('should display user list correctly', async () => {
    await expect(userPage.userTable).toBeVisible();
    await expect(userPage.searchInput).toBeVisible();
    await expect(userPage.addUserButton).toBeVisible();
  });

  test('should add new user successfully', async () => {
    const user = testData.createUser({
      name: 'John Doe',
      email: 'john.doe@test.com',
      role: 'admin',
    });

    await userPage.addUser(user);
    await userPage.expectUserInTable(user.email, true);
  });

  test('should search users correctly', async () => {
    const user1 = testData.createUser({ name: 'Alice Smith' });
    const user2 = testData.createUser({ name: 'Bob Johnson' });

    // Assuming users are pre-seeded
    await userPage.searchUsers('Alice');
    await userPage.expectUserInTable(user1.email, true);
    await userPage.expectUserInTable(user2.email, false);
  });

  test('should edit user successfully', async () => {
    const user = testData.createUser();

    // Pre-create user via API or assume it exists
    await userPage.editUser(user.email, { name: 'Updated Name', role: 'admin' });

    const userRow = await userPage.getUserRow(user.email);
    await expect(userRow).toContainText('Updated Name');
    await expect(userRow).toContainText('admin');
  });

  test('should delete user successfully', async () => {
    const user = testData.createUser();

    await userPage.deleteUser(user.email);
    await userPage.expectUserInTable(user.email, false);
  });

  test('should handle pagination correctly', async ({ page }) => {
    // Assuming there are enough users for pagination
    const initialUrl = page.url();

    await userPage.goToNextPage();
    const nextPageUrl = page.url();
    expect(nextPageUrl).not.toBe(initialUrl);

    await userPage.goToPreviousPage();
    const backToFirstUrl = page.url();
    expect(backToFirstUrl).toBe(initialUrl);
  });

  test('should validate form inputs', async ({ page }) => {
    await userPage.addUserButton.click();

    const modal = page.getByTestId('add-user-modal');
    const saveButton = page.getByTestId('save-user-btn');

    // Try to save without filling required fields
    await saveButton.click();

    await expect(page.getByTestId('name-error')).toBeVisible();
    await expect(page.getByTestId('email-error')).toBeVisible();
    await expect(modal).toBeVisible(); // Modal should stay open
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/users', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.reload();
    await expect(userPage.errorMessage).toBeVisible();
    await expect(userPage.errorMessage).toContainText('Failed to load users');
  });

  test('should work on mobile devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');

    await expect(userPage.userTable).toBeVisible();

    // Check if table is responsive
    const tableWidth = await userPage.userTable.boundingBox();
    const pageWidth = await page.viewportSize();

    expect(tableWidth?.width).toBeLessThanOrEqual(pageWidth?.width || 0);
  });

  test.describe('Performance', () => {
    test('should load users within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await userPage.goto();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000); // 3 seconds max
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Test with simulated large dataset
      await page.route('**/api/users', route => {
        const users = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@test.com`,
          role: 'user',
        }));

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ users }),
        });
      });

      const startTime = performance.now();
      await userPage.goto();
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(5000); // 5 seconds max for large dataset
    });
  });
});

// Visual regression testing
// e2e/visual.spec.ts
test.describe('Visual Regression Tests', () => {
  test('should match user list page screenshot', async ({ page }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    // Wait for all images to load
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('user-list-page.png');
  });

  test('should match add user modal screenshot', async ({ page }) => {
    const userPage = new UserManagementPage(page);
    await userPage.goto();

    await userPage.addUserButton.click();
    const modal = page.getByTestId('add-user-modal');

    await expect(modal).toHaveScreenshot('add-user-modal.png');
  });

  test('should match error state screenshot', async ({ page }) => {
    await page.route('**/api/users', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    const userPage = new UserManagementPage(page);
    await userPage.goto();

    await expect(userPage.errorMessage).toBeVisible();
    await expect(page).toHaveScreenshot('error-state.png');
  });
});
```

## Skill Activation Triggers

This skill automatically activates when:
- Test automation strategy development is needed
- Testing framework setup is requested
- E2E testing implementation is required
- Performance testing automation is needed
- Test coverage improvement is requested
- CI/CD testing integration is required

This comprehensive testing automation skill provides expert-level capabilities for building robust, automated testing systems across all layers of modern applications.