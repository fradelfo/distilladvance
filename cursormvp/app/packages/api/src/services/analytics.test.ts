/**
 * Tests for the Analytics Service
 *
 * Comprehensive tests for PostHog event tracking and metrics aggregation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock PostHog before imports - use inline mocks
vi.mock("posthog-node", () => {
  const mockCapture = vi.fn();
  const mockIdentify = vi.fn();
  const mockShutdown = vi.fn().mockResolvedValue(undefined);

  return {
    PostHog: vi.fn().mockImplementation(() => ({
      capture: mockCapture,
      identify: mockIdentify,
      shutdown: mockShutdown,
    })),
    __mockCapture: mockCapture,
    __mockIdentify: mockIdentify,
    __mockShutdown: mockShutdown,
  };
});

// Mock environment - analytics enabled
vi.mock("../lib/env.js", () => ({
  env: {
    POSTHOG_API_KEY: "test-posthog-key",
    POSTHOG_HOST: "http://localhost:8080",
    ANALYTICS_ENABLED: true,
    NODE_ENV: "test",
  },
}));

// Mock Prisma - define mock inline
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    prompt: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    promptRun: {
      count: vi.fn(),
    },
    workspace: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    workspaceMember: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    conversation: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Get mock references after mocking
const posthogModule = await import("posthog-node");
const mockCapture = (posthogModule as any).__mockCapture;
const mockIdentify = (posthogModule as any).__mockIdentify;
const mockShutdown = (posthogModule as any).__mockShutdown;

const { prisma: mockPrisma } = await import("../lib/prisma.js");

// Import after mocks
import {
  trackUserSignup,
  trackWorkspaceCreated,
  trackChatCaptured,
  trackPromptCreated,
  trackPromptRun,
  trackPromptEdited,
  trackCoachUsed,
  trackMemberInvited,
  trackSearchPerformed,
  getActivationMetrics,
  getEngagementMetrics,
  getTeamHealthMetrics,
  getFeatureAdoptionMetrics,
  getDashboardMetrics,
  shutdownAnalytics,
} from "./analytics.js";

describe("Analytics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Event Tracking Tests
  // ============================================================================

  describe("trackUserSignup", () => {
    it("should track user signup event with correct properties", async () => {
      await trackUserSignup({
        userId: "user-123",
        source: "organic",
        method: "google",
        referrer: "https://google.com",
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          distinctId: "user-123",
          event: "user_signed_up",
          properties: expect.objectContaining({
            userId: "user-123",
            source: "organic",
            method: "google",
            referrer: "https://google.com",
            timestamp: expect.any(String),
          }),
        })
      );
    });

    it("should identify user after signup", async () => {
      await trackUserSignup({
        userId: "user-456",
        source: "referral",
        method: "email",
      });

      expect(mockIdentify).toHaveBeenCalledWith(
        expect.objectContaining({
          distinctId: "user-456",
          properties: expect.objectContaining({
            signupMethod: "email",
            signupSource: "referral",
          }),
        })
      );
    });
  });

  describe("trackWorkspaceCreated", () => {
    it("should track workspace creation event", async () => {
      await trackWorkspaceCreated({
        userId: "user-123",
        workspaceId: "ws-456",
        privacyDefault: "prompt_only",
        workspaceName: "My Team",
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          distinctId: "user-123",
          event: "workspace_created",
          properties: expect.objectContaining({
            privacyDefault: "prompt_only",
            workspaceName: "My Team",
          }),
        })
      );
    });
  });

  describe("trackChatCaptured", () => {
    it("should track chat capture event with platform info", async () => {
      await trackChatCaptured({
        userId: "user-123",
        platform: "chatgpt",
        privacyMode: "prompt_only",
        tokenCount: 1500,
        messageCount: 10,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "chat_captured",
          properties: expect.objectContaining({
            platform: "chatgpt",
            privacyMode: "prompt_only",
            tokenCount: 1500,
            messageCount: 10,
          }),
        })
      );
    });

    it("should track captures from different platforms", async () => {
      const platforms = ["chatgpt", "claude", "gemini", "copilot"] as const;

      for (const platform of platforms) {
        await trackChatCaptured({
          userId: "user-123",
          platform,
          privacyMode: "full_chat",
          tokenCount: 1000,
          messageCount: 5,
        });
      }

      expect(mockCapture).toHaveBeenCalledTimes(4);
    });
  });

  describe("trackPromptCreated", () => {
    it("should track prompt creation from capture", async () => {
      await trackPromptCreated({
        userId: "user-123",
        source: "capture",
        hasVariables: true,
        variableCount: 3,
        tagCount: 2,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "prompt_created",
          properties: expect.objectContaining({
            source: "capture",
            hasVariables: true,
            variableCount: 3,
            tagCount: 2,
          }),
        })
      );
    });

    it("should track manual prompt creation", async () => {
      await trackPromptCreated({
        userId: "user-123",
        source: "manual",
        hasVariables: false,
        variableCount: 0,
        tagCount: 5,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "prompt_created",
          properties: expect.objectContaining({
            source: "manual",
            hasVariables: false,
          }),
        })
      );
    });
  });

  describe("trackPromptRun", () => {
    it("should track prompt run event", async () => {
      await trackPromptRun({
        userId: "user-123",
        promptId: "prompt-456",
        platform: "clipboard",
        variableCount: 2,
        isShared: false,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "prompt_run",
          properties: expect.objectContaining({
            promptId: "prompt-456",
            platform: "clipboard",
            variableCount: 2,
            isShared: false,
          }),
        })
      );
    });

    it("should track shared prompt runs", async () => {
      await trackPromptRun({
        userId: "user-123",
        promptId: "prompt-789",
        platform: "chatgpt",
        variableCount: 1,
        isShared: true,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            isShared: true,
          }),
        })
      );
    });
  });

  describe("trackPromptEdited", () => {
    it("should track prompt edit with edit type", async () => {
      await trackPromptEdited({
        userId: "user-123",
        promptId: "prompt-456",
        editType: "content",
        timeSinceCreationMs: 86400000, // 1 day
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "prompt_edited",
          properties: expect.objectContaining({
            editType: "content",
            timeSinceCreationMs: 86400000,
          }),
        })
      );
    });

    it("should track multiple field edits", async () => {
      await trackPromptEdited({
        userId: "user-123",
        promptId: "prompt-456",
        editType: "multiple",
        timeSinceCreationMs: 3600000,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            editType: "multiple",
          }),
        })
      );
    });
  });

  describe("trackCoachUsed", () => {
    it("should track coach usage with suggestions metrics", async () => {
      await trackCoachUsed({
        userId: "user-123",
        promptId: "prompt-456",
        suggestionsShown: 5,
        suggestionsApplied: 2,
        focusArea: "clarity",
        qualityScore: 75,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "coach_used",
          properties: expect.objectContaining({
            suggestionsShown: 5,
            suggestionsApplied: 2,
            focusArea: "clarity",
            qualityScore: 75,
          }),
        })
      );
    });

    it("should track coach usage without focus area", async () => {
      await trackCoachUsed({
        userId: "user-123",
        promptId: "prompt-456",
        suggestionsShown: 3,
        suggestionsApplied: 0,
      });

      expect(mockCapture).toHaveBeenCalled();
    });
  });

  describe("trackMemberInvited", () => {
    it("should track member invite via email", async () => {
      await trackMemberInvited({
        userId: "user-123",
        workspaceId: "ws-456",
        count: 3,
        method: "email",
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "member_invited",
          properties: expect.objectContaining({
            count: 3,
            method: "email",
          }),
        })
      );
    });

    it("should track member invite via link", async () => {
      await trackMemberInvited({
        userId: "user-123",
        workspaceId: "ws-456",
        count: 1,
        method: "link",
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            method: "link",
          }),
        })
      );
    });
  });

  describe("trackSearchPerformed", () => {
    it("should track text search", async () => {
      await trackSearchPerformed({
        userId: "user-123",
        queryLength: 25,
        resultsCount: 10,
        searchType: "text",
        hasFilters: false,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "search_performed",
          properties: expect.objectContaining({
            searchType: "text",
            queryLength: 25,
            resultsCount: 10,
          }),
        })
      );
    });

    it("should track semantic search with filters", async () => {
      await trackSearchPerformed({
        userId: "user-123",
        queryLength: 50,
        resultsCount: 5,
        searchType: "semantic",
        hasFilters: true,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            searchType: "semantic",
            hasFilters: true,
          }),
        })
      );
    });
  });

  // ============================================================================
  // Metrics Aggregation Tests
  // ============================================================================

  describe("getActivationMetrics", () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");

    beforeEach(() => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.workspace.count.mockResolvedValue(80);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: "1" },
        { id: "2" },
        { id: "3" },
      ]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(30) }]);
    });

    it("should return activation funnel metrics", async () => {
      const metrics = await getActivationMetrics(startDate, endDate);

      expect(metrics).toHaveProperty("signups");
      expect(metrics).toHaveProperty("workspacesCreated");
      expect(metrics).toHaveProperty("conversionRates");
    });

    it("should calculate conversion rates", async () => {
      const metrics = await getActivationMetrics(startDate, endDate);

      expect(metrics.conversionRates).toHaveProperty("signupToWorkspace");
      expect(metrics.conversionRates).toHaveProperty("overall");
      expect(metrics.conversionRates.signupToWorkspace).toBeGreaterThanOrEqual(0);
      expect(metrics.conversionRates.signupToWorkspace).toBeLessThanOrEqual(1);
    });
  });

  describe("getEngagementMetrics", () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");

    beforeEach(() => {
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.prompt.count.mockResolvedValue(250);
      mockPrisma.promptRun.count.mockResolvedValue(500);
      mockPrisma.prompt.aggregate.mockResolvedValue({ _avg: { usageCount: 2 } });
    });

    it("should return engagement metrics", async () => {
      const metrics = await getEngagementMetrics(startDate, endDate);

      expect(metrics).toHaveProperty("dailyActiveUsers");
      expect(metrics).toHaveProperty("weeklyActiveUsers");
      expect(metrics).toHaveProperty("promptsPerUser");
      expect(metrics).toHaveProperty("runsPerPrompt");
    });

    it("should calculate prompts per user", async () => {
      const metrics = await getEngagementMetrics(startDate, endDate);

      expect(metrics.promptsPerUser).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getTeamHealthMetrics", () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");

    beforeEach(() => {
      mockPrisma.workspace.count.mockResolvedValue(40);
      mockPrisma.workspaceMember.groupBy.mockResolvedValue([
        { workspaceId: "ws-1", _count: 3 },
        { workspaceId: "ws-2", _count: 4 },
        { workspaceId: "ws-3", _count: 3 },
        { workspaceId: "ws-4", _count: 4 },
      ]);
      mockPrisma.prompt.count.mockResolvedValue(200);
    });

    it("should return team health metrics", async () => {
      const metrics = await getTeamHealthMetrics(startDate, endDate);

      expect(metrics).toHaveProperty("activeWorkspaces");
      expect(metrics).toHaveProperty("seatsPerWorkspace");
      expect(metrics).toHaveProperty("sharedPromptsUsage");
    });

    it("should calculate seats per workspace", async () => {
      const metrics = await getTeamHealthMetrics(startDate, endDate);

      expect(metrics.seatsPerWorkspace).toBe(3.5); // (3+4+3+4) / 4 = 14 / 4 = 3.5
    });
  });

  describe("getFeatureAdoptionMetrics", () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");

    beforeEach(() => {
      mockPrisma.prompt.count.mockResolvedValue(100);
      mockPrisma.conversation.groupBy.mockResolvedValue([
        { source: "chatgpt", _count: 45 },
        { source: "claude", _count: 30 },
        { source: "gemini", _count: 15 },
        { source: "copilot", _count: 8 },
        { source: "other", _count: 2 },
      ]);
    });

    it("should return feature adoption metrics", async () => {
      const metrics = await getFeatureAdoptionMetrics(startDate, endDate);

      expect(metrics).toHaveProperty("privacyModeDistribution");
      expect(metrics).toHaveProperty("platformDistribution");
    });

    it("should have platform distribution", async () => {
      const metrics = await getFeatureAdoptionMetrics(startDate, endDate);

      expect(metrics.platformDistribution).toHaveProperty("chatgpt");
      expect(metrics.platformDistribution).toHaveProperty("claude");
    });
  });

  describe("getDashboardMetrics", () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");

    beforeEach(() => {
      // Setup all mocks
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.workspace.count.mockResolvedValue(50);
      mockPrisma.prompt.count.mockResolvedValue(500);
      mockPrisma.promptRun.count.mockResolvedValue(1000);
      mockPrisma.workspaceMember.groupBy.mockResolvedValue([
        { workspaceId: "ws-1", _count: 3 },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.prompt.aggregate.mockResolvedValue({ _avg: { usageCount: 2 } });
      mockPrisma.conversation.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(30) }]);
    });

    it("should return complete dashboard metrics", async () => {
      const metrics = await getDashboardMetrics(startDate, endDate);

      expect(metrics).toHaveProperty("activation");
      expect(metrics).toHaveProperty("engagement");
      expect(metrics).toHaveProperty("teamHealth");
      expect(metrics).toHaveProperty("featureAdoption");
      expect(metrics).toHaveProperty("period");
    });

    it("should include correct period", async () => {
      const metrics = await getDashboardMetrics(startDate, endDate);

      expect(metrics.period.start).toBe(startDate.toISOString());
      expect(metrics.period.end).toBe(endDate.toISOString());
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle PostHog capture errors gracefully", async () => {
      mockCapture.mockImplementationOnce(() => {
        throw new Error("Network error");
      });

      // Should not throw
      await expect(
        trackPromptCreated({
          userId: "user-123",
          source: "manual",
          hasVariables: false,
          variableCount: 0,
          tagCount: 0,
        })
      ).resolves.toBeUndefined();
    });

    it("should handle Prisma errors in metrics", async () => {
      mockPrisma.user.count.mockRejectedValueOnce(new Error("DB error"));

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await expect(getActivationMetrics(startDate, endDate)).rejects.toThrow();
    });
  });

  // ============================================================================
  // Shutdown Tests
  // ============================================================================

  describe("shutdownAnalytics", () => {
    it("should shutdown PostHog client", async () => {
      await shutdownAnalytics();

      expect(mockShutdown).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Analytics Disabled Tests
// ============================================================================

describe("Analytics Service (Disabled)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should not track events when analytics is disabled", async () => {
    // Re-mock with analytics disabled
    vi.doMock("../lib/env.js", () => ({
      env: {
        POSTHOG_API_KEY: "",
        POSTHOG_HOST: "http://localhost:8080",
        ANALYTICS_ENABLED: false,
        NODE_ENV: "test",
      },
    }));

    // Import fresh module
    const { trackPromptCreated: trackDisabled } = await import("./analytics.js");

    await trackDisabled({
      userId: "user-123",
      source: "manual",
      hasVariables: false,
      variableCount: 0,
      tagCount: 0,
    });

    // PostHog should not be called
    expect(mockCapture).not.toHaveBeenCalled();
  });
});
