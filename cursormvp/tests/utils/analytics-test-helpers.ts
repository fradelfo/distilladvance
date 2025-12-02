/**
 * Analytics Testing Utilities
 * Provides comprehensive testing tools for PostHog analytics integration
 */

import { vi } from 'vitest';

// Types for captured events
interface CapturedEvent {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

interface IdentifiedUser {
  distinctId: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

interface GroupIdentification {
  groupType: string;
  groupKey: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

// Mock PostHog Node Client
export class MockPostHogClient {
  private events: CapturedEvent[] = [];
  private identifications: IdentifiedUser[] = [];
  private groups: GroupIdentification[] = [];
  private isShutdown = false;

  capture = vi.fn().mockImplementation(
    ({
      distinctId,
      event,
      properties,
    }: {
      distinctId: string;
      event: string;
      properties?: Record<string, unknown>;
    }) => {
      if (this.isShutdown) {
        throw new Error('PostHog client has been shut down');
      }
      this.events.push({
        distinctId,
        event,
        properties,
        timestamp: new Date(),
      });
    }
  );

  identify = vi.fn().mockImplementation(
    ({
      distinctId,
      properties,
    }: {
      distinctId: string;
      properties?: Record<string, unknown>;
    }) => {
      if (this.isShutdown) {
        throw new Error('PostHog client has been shut down');
      }
      this.identifications.push({
        distinctId,
        properties,
        timestamp: new Date(),
      });
    }
  );

  groupIdentify = vi.fn().mockImplementation(
    ({
      groupType,
      groupKey,
      properties,
    }: {
      groupType: string;
      groupKey: string;
      properties?: Record<string, unknown>;
    }) => {
      if (this.isShutdown) {
        throw new Error('PostHog client has been shut down');
      }
      this.groups.push({
        groupType,
        groupKey,
        properties,
        timestamp: new Date(),
      });
    }
  );

  shutdown = vi.fn().mockImplementation(async () => {
    this.isShutdown = true;
    return Promise.resolve();
  });

  flush = vi.fn().mockImplementation(async () => {
    return Promise.resolve();
  });

  // Test utility methods
  getEvents(): CapturedEvent[] {
    return [...this.events];
  }

  getEventsByType(eventType: string): CapturedEvent[] {
    return this.events.filter((e) => e.event === eventType);
  }

  getEventsByUser(distinctId: string): CapturedEvent[] {
    return this.events.filter((e) => e.distinctId === distinctId);
  }

  getIdentifications(): IdentifiedUser[] {
    return [...this.identifications];
  }

  getGroups(): GroupIdentification[] {
    return [...this.groups];
  }

  getLastEvent(): CapturedEvent | undefined {
    return this.events[this.events.length - 1];
  }

  getLastIdentification(): IdentifiedUser | undefined {
    return this.identifications[this.identifications.length - 1];
  }

  hasEvent(eventType: string): boolean {
    return this.events.some((e) => e.event === eventType);
  }

  hasEventWithProperties(eventType: string, properties: Record<string, unknown>): boolean {
    return this.events.some(
      (e) =>
        e.event === eventType &&
        Object.entries(properties).every(([key, value]) => e.properties?.[key] === value)
    );
  }

  getEventCount(): number {
    return this.events.length;
  }

  reset(): void {
    this.events = [];
    this.identifications = [];
    this.groups = [];
    this.isShutdown = false;
    vi.clearAllMocks();
  }
}

// Mock PostHog JS Client (for browser)
export class MockPostHogJSClient {
  private events: CapturedEvent[] = [];
  private currentUser: string | null = null;
  private userProperties: Record<string, unknown> = {};
  private isInitialized = false;
  private featureFlags: Record<string, boolean | string> = {};

  init = vi.fn().mockImplementation(
    (
      apiKey: string,
      options?: {
        api_host?: string;
        loaded?: (posthog: MockPostHogJSClient) => void;
      }
    ) => {
      this.isInitialized = true;
      if (options?.loaded) {
        options.loaded(this);
      }
    }
  );

  identify = vi
    .fn()
    .mockImplementation((distinctId: string, properties?: Record<string, unknown>) => {
      if (!this.isInitialized) return;
      this.currentUser = distinctId;
      if (properties) {
        this.userProperties = { ...this.userProperties, ...properties };
      }
    });

  capture = vi.fn().mockImplementation((event: string, properties?: Record<string, unknown>) => {
    if (!this.isInitialized) return;
    this.events.push({
      distinctId: this.currentUser || 'anonymous',
      event,
      properties,
      timestamp: new Date(),
    });
  });

  reset = vi.fn().mockImplementation(() => {
    this.currentUser = null;
    this.userProperties = {};
  });

  people = {
    set: vi.fn().mockImplementation((properties: Record<string, unknown>) => {
      this.userProperties = { ...this.userProperties, ...properties };
    }),
  };

  isFeatureEnabled = vi.fn().mockImplementation((flagKey: string): boolean | undefined => {
    const value = this.featureFlags[flagKey];
    return typeof value === 'boolean' ? value : undefined;
  });

  getFeatureFlag = vi.fn().mockImplementation((flagKey: string): string | boolean | undefined => {
    return this.featureFlags[flagKey];
  });

  startSessionRecording = vi.fn();
  stopSessionRecording = vi.fn();

  // Test utility methods
  setFeatureFlag(flagKey: string, value: boolean | string): void {
    this.featureFlags[flagKey] = value;
  }

  getEvents(): CapturedEvent[] {
    return [...this.events];
  }

  getEventsByType(eventType: string): CapturedEvent[] {
    return this.events.filter((e) => e.event === eventType);
  }

  getCurrentUser(): string | null {
    return this.currentUser;
  }

  getUserProperties(): Record<string, unknown> {
    return { ...this.userProperties };
  }

  isUserIdentified(): boolean {
    return this.currentUser !== null;
  }

  hasEvent(eventType: string): boolean {
    return this.events.some((e) => e.event === eventType);
  }

  getEventCount(): number {
    return this.events.length;
  }

  clearEvents(): void {
    this.events = [];
  }

  fullReset(): void {
    this.events = [];
    this.currentUser = null;
    this.userProperties = {};
    this.isInitialized = false;
    this.featureFlags = {};
    vi.clearAllMocks();
  }
}

// Analytics Test Tracker Factory
export function createAnalyticsTracker() {
  const events: CapturedEvent[] = [];
  const users: Map<string, Record<string, unknown>> = new Map();

  return {
    trackEvent(distinctId: string, event: string, properties?: Record<string, unknown>) {
      events.push({
        distinctId,
        event,
        properties,
        timestamp: new Date(),
      });
    },

    identifyUser(distinctId: string, properties?: Record<string, unknown>) {
      users.set(distinctId, properties || {});
    },

    getEvents() {
      return [...events];
    },

    getEventsByType(type: string) {
      return events.filter((e) => e.event === type);
    },

    getEventsByUser(distinctId: string) {
      return events.filter((e) => e.distinctId === distinctId);
    },

    getUser(distinctId: string) {
      return users.get(distinctId);
    },

    hasEvent(type: string) {
      return events.some((e) => e.event === type);
    },

    getEventCount() {
      return events.length;
    },

    reset() {
      events.length = 0;
      users.clear();
    },
  };
}

// Mock Prisma for analytics queries
export function createMockPrismaForAnalytics() {
  return {
    user: {
      count: vi.fn().mockResolvedValue(100),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    prompt: {
      count: vi.fn().mockResolvedValue(500),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    promptRun: {
      count: vi.fn().mockResolvedValue(1000),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    workspace: {
      count: vi.fn().mockResolvedValue(50),
      findMany: vi.fn().mockResolvedValue([]),
    },
    workspaceMember: {
      count: vi.fn().mockResolvedValue(150),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    conversation: {
      count: vi.fn().mockResolvedValue(200),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ count: BigInt(50) }]),
  };
}

// Test data generators
export const analyticsTestData = {
  generateUserSignedUpEvent(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      event: 'user_signed_up',
      properties: {
        source: 'organic',
        referrer: 'https://google.com',
        method: 'google',
        timestamp: new Date().toISOString(),
        ...overrides,
      },
    };
  },

  generateChatCapturedEvent(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      event: 'chat_captured',
      properties: {
        platform: 'chatgpt',
        privacyMode: 'prompt_only',
        tokenCount: 1500,
        messageCount: 10,
        timestamp: new Date().toISOString(),
        ...overrides,
      },
    };
  },

  generatePromptCreatedEvent(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      event: 'prompt_created',
      properties: {
        source: 'capture',
        hasVariables: true,
        variableCount: 3,
        tagCount: 2,
        timestamp: new Date().toISOString(),
        ...overrides,
      },
    };
  },

  generatePromptRunEvent(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      event: 'prompt_run',
      properties: {
        promptId: 'prompt-123',
        platform: 'clipboard',
        variableCount: 2,
        isShared: false,
        timestamp: new Date().toISOString(),
        ...overrides,
      },
    };
  },

  generateCoachUsedEvent(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      event: 'coach_used',
      properties: {
        promptId: 'prompt-123',
        suggestionsShown: 5,
        suggestionsApplied: 2,
        focusArea: 'clarity',
        qualityScore: 75,
        timestamp: new Date().toISOString(),
        ...overrides,
      },
    };
  },

  generateSearchEvent(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      event: 'search_performed',
      properties: {
        queryLength: 25,
        resultsCount: 10,
        searchType: 'semantic',
        hasFilters: false,
        timestamp: new Date().toISOString(),
        ...overrides,
      },
    };
  },

  generateDashboardMetrics() {
    return {
      activation: {
        signups: 100,
        workspacesCreated: 80,
        extensionsInstalled: 60,
        firstCapture: 50,
        thirdCapture: 30,
        conversionRates: {
          signupToWorkspace: 0.8,
          workspaceToExtension: 0.75,
          extensionToFirstCapture: 0.83,
          firstToThirdCapture: 0.6,
          overall: 0.3,
        },
      },
      engagement: {
        dailyActiveUsers: 50,
        weeklyActiveUsers: 200,
        monthlyActiveUsers: 500,
        promptsPerUser: 5.2,
        runsPerPrompt: 3.1,
        averageSessionDuration: 1800000,
      },
      teamHealth: {
        activeWorkspaces: 40,
        seatsPerWorkspace: 3.5,
        sharedPromptsUsage: 0.45,
        collaborationRate: 0.6,
      },
      featureAdoption: {
        coachUsageRate: 0.25,
        semanticSearchUsageRate: 0.4,
        privacyModeDistribution: {
          promptOnly: 70,
          fullChat: 30,
        },
        platformDistribution: {
          chatgpt: 45,
          claude: 30,
          gemini: 15,
          copilot: 8,
          other: 2,
        },
      },
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };
  },
};

// Export all
export default {
  MockPostHogClient,
  MockPostHogJSClient,
  createAnalyticsTracker,
  createMockPrismaForAnalytics,
  analyticsTestData,
};
