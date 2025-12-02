/**
 * Tests for Analytics tRPC Router
 *
 * Tests for tracking endpoints and dashboard metrics queries.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create mocks at module scope
const mockTrackChatCaptured = vi.fn().mockResolvedValue(undefined);
const mockTrackPromptCreated = vi.fn().mockResolvedValue(undefined);
const mockTrackPromptRun = vi.fn().mockResolvedValue(undefined);
const mockTrackPromptEdited = vi.fn().mockResolvedValue(undefined);
const mockTrackCoachUsed = vi.fn().mockResolvedValue(undefined);
const mockTrackMemberInvited = vi.fn().mockResolvedValue(undefined);
const mockTrackSearchPerformed = vi.fn().mockResolvedValue(undefined);
const mockGetDashboardMetrics = vi.fn();
const mockGetActivationMetrics = vi.fn();
const mockGetEngagementMetrics = vi.fn();
const mockGetTeamHealthMetrics = vi.fn();
const mockGetFeatureAdoptionMetrics = vi.fn();

// Mock the analytics service - use arrow functions to reference module-scoped mocks
vi.mock('../../services/analytics.js', () => ({
  trackChatCaptured: (...args: any[]) => mockTrackChatCaptured(...args),
  trackPromptCreated: (...args: any[]) => mockTrackPromptCreated(...args),
  trackPromptRun: (...args: any[]) => mockTrackPromptRun(...args),
  trackPromptEdited: (...args: any[]) => mockTrackPromptEdited(...args),
  trackCoachUsed: (...args: any[]) => mockTrackCoachUsed(...args),
  trackMemberInvited: (...args: any[]) => mockTrackMemberInvited(...args),
  trackSearchPerformed: (...args: any[]) => mockTrackSearchPerformed(...args),
  getDashboardMetrics: (...args: any[]) => mockGetDashboardMetrics(...args),
  getActivationMetrics: (...args: any[]) => mockGetActivationMetrics(...args),
  getEngagementMetrics: (...args: any[]) => mockGetEngagementMetrics(...args),
  getTeamHealthMetrics: (...args: any[]) => mockGetTeamHealthMetrics(...args),
  getFeatureAdoptionMetrics: (...args: any[]) => mockGetFeatureAdoptionMetrics(...args),
}));

// Import test utilities
import { analyticsRouter } from './analytics.js';

// Helper to create a mock context
function createMockContext(userId = 'test-user-123') {
  return {
    userId,
    session: {
      user: {
        id: userId,
        email: 'test@example.com',
      },
    },
  };
}

describe('Analytics Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Tracking Mutation Tests
  // ============================================================================

  describe('trackChatCaptured', () => {
    it('should validate platform input', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackChatCaptured({
        platform: 'chatgpt',
        privacyMode: 'prompt_only',
        tokenCount: 1500,
        messageCount: 10,
      });

      expect(mockTrackChatCaptured).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          platform: 'chatgpt',
          privacyMode: 'prompt_only',
          tokenCount: 1500,
          messageCount: 10,
        })
      );
    });

    it('should accept all valid platforms', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);
      const platforms = ['chatgpt', 'claude', 'gemini', 'copilot', 'other'] as const;

      for (const platform of platforms) {
        await caller.trackChatCaptured({
          platform,
          privacyMode: 'full_chat',
          tokenCount: 1000,
          messageCount: 5,
        });
      }

      expect(mockTrackChatCaptured).toHaveBeenCalledTimes(5);
    });

    it('should include workspace ID when provided', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackChatCaptured({
        platform: 'claude',
        privacyMode: 'prompt_only',
        tokenCount: 2000,
        messageCount: 15,
        workspaceId: 'ws-456',
      });

      expect(mockTrackChatCaptured).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-456',
        })
      );
    });
  });

  describe('trackPromptCreated', () => {
    it('should track prompt creation from capture', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackPromptCreated({
        source: 'capture',
        hasVariables: true,
        variableCount: 3,
        tagCount: 2,
      });

      expect(mockTrackPromptCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'capture',
          hasVariables: true,
          variableCount: 3,
          tagCount: 2,
        })
      );
    });

    it('should track manual prompt creation', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackPromptCreated({
        source: 'manual',
        hasVariables: false,
        variableCount: 0,
        tagCount: 5,
      });

      expect(mockTrackPromptCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'manual',
        })
      );
    });

    it('should track import prompt creation', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackPromptCreated({
        source: 'import',
        hasVariables: true,
        variableCount: 5,
        tagCount: 3,
      });

      expect(mockTrackPromptCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'import',
        })
      );
    });
  });

  describe('trackPromptRun', () => {
    it('should track prompt run to clipboard', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackPromptRun({
        promptId: 'prompt-123',
        platform: 'clipboard',
        variableCount: 2,
        isShared: false,
      });

      expect(mockTrackPromptRun).toHaveBeenCalledWith(
        expect.objectContaining({
          promptId: 'prompt-123',
          platform: 'clipboard',
          isShared: false,
        })
      );
    });

    it('should track shared prompt run', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackPromptRun({
        promptId: 'prompt-456',
        platform: 'chatgpt',
        variableCount: 1,
        isShared: true,
      });

      expect(mockTrackPromptRun).toHaveBeenCalledWith(
        expect.objectContaining({
          isShared: true,
        })
      );
    });
  });

  describe('trackPromptEdited', () => {
    it('should track content edit', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackPromptEdited({
        promptId: 'prompt-123',
        editType: 'content',
        timeSinceCreationMs: 86400000,
      });

      expect(mockTrackPromptEdited).toHaveBeenCalledWith(
        expect.objectContaining({
          editType: 'content',
          timeSinceCreationMs: 86400000,
        })
      );
    });

    it('should accept all edit types', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);
      const editTypes = ['title', 'content', 'variables', 'tags', 'multiple'] as const;

      for (const editType of editTypes) {
        await caller.trackPromptEdited({
          promptId: 'prompt-123',
          editType,
          timeSinceCreationMs: 3600000,
        });
      }

      expect(mockTrackPromptEdited).toHaveBeenCalledTimes(5);
    });
  });

  describe('trackCoachUsed', () => {
    it('should track coach usage with all fields', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackCoachUsed({
        promptId: 'prompt-123',
        suggestionsShown: 5,
        suggestionsApplied: 2,
        focusArea: 'clarity',
        qualityScore: 75,
      });

      expect(mockTrackCoachUsed).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestionsShown: 5,
          suggestionsApplied: 2,
          focusArea: 'clarity',
          qualityScore: 75,
        })
      );
    });

    it('should allow optional fields', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackCoachUsed({
        promptId: 'prompt-123',
        suggestionsShown: 3,
        suggestionsApplied: 0,
      });

      expect(mockTrackCoachUsed).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestionsShown: 3,
          suggestionsApplied: 0,
        })
      );
    });

    it('should validate quality score range', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      // Valid score
      await caller.trackCoachUsed({
        promptId: 'prompt-123',
        suggestionsShown: 3,
        suggestionsApplied: 1,
        qualityScore: 100,
      });

      expect(mockTrackCoachUsed).toHaveBeenCalled();
    });
  });

  describe('trackMemberInvited', () => {
    it('should track email invite', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackMemberInvited({
        count: 3,
        method: 'email',
      });

      expect(mockTrackMemberInvited).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 3,
          method: 'email',
        })
      );
    });

    it('should track link invite', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackMemberInvited({
        count: 1,
        method: 'link',
      });

      expect(mockTrackMemberInvited).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'link',
        })
      );
    });
  });

  describe('trackSearchPerformed', () => {
    it('should track text search', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackSearchPerformed({
        queryLength: 25,
        resultsCount: 10,
        searchType: 'text',
        hasFilters: false,
      });

      expect(mockTrackSearchPerformed).toHaveBeenCalledWith(
        expect.objectContaining({
          searchType: 'text',
          hasFilters: false,
        })
      );
    });

    it('should track semantic search with filters', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.trackSearchPerformed({
        queryLength: 50,
        resultsCount: 5,
        searchType: 'semantic',
        hasFilters: true,
      });

      expect(mockTrackSearchPerformed).toHaveBeenCalledWith(
        expect.objectContaining({
          searchType: 'semantic',
          hasFilters: true,
        })
      );
    });
  });

  // ============================================================================
  // Query Tests
  // ============================================================================

  describe('getDashboard', () => {
    beforeEach(() => {
      mockGetDashboardMetrics.mockResolvedValue({
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
          privacyModeDistribution: { promptOnly: 70, fullChat: 30 },
          platformDistribution: {
            chatgpt: 45,
            claude: 30,
            gemini: 15,
            copilot: 8,
            other: 2,
          },
        },
        period: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T00:00:00.000Z',
        },
      });
    });

    it('should return dashboard metrics with default date range', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      const result = await caller.getDashboard({});

      expect(mockGetDashboardMetrics).toHaveBeenCalled();
      expect(result).toHaveProperty('activation');
      expect(result).toHaveProperty('engagement');
      expect(result).toHaveProperty('teamHealth');
      expect(result).toHaveProperty('featureAdoption');
    });

    it('should accept custom date range', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      await caller.getDashboard({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T00:00:00.000Z',
      });

      expect(mockGetDashboardMetrics).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
    });
  });

  describe('getActivationFunnel', () => {
    beforeEach(() => {
      mockGetActivationMetrics.mockResolvedValue({
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
      });
    });

    it('should return activation funnel metrics', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      const result = await caller.getActivationFunnel({});

      expect(mockGetActivationMetrics).toHaveBeenCalled();
      expect(result).toHaveProperty('signups');
      expect(result).toHaveProperty('conversionRates');
    });
  });

  describe('getEngagement', () => {
    beforeEach(() => {
      mockGetEngagementMetrics.mockResolvedValue({
        dailyActiveUsers: 50,
        weeklyActiveUsers: 200,
        monthlyActiveUsers: 500,
        promptsPerUser: 5.2,
        runsPerPrompt: 3.1,
        averageSessionDuration: 1800000,
      });
    });

    it('should return engagement metrics', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      const result = await caller.getEngagement({});

      expect(mockGetEngagementMetrics).toHaveBeenCalled();
      expect(result).toHaveProperty('dailyActiveUsers');
      expect(result).toHaveProperty('promptsPerUser');
    });
  });

  describe('getTeamHealth', () => {
    beforeEach(() => {
      mockGetTeamHealthMetrics.mockResolvedValue({
        activeWorkspaces: 40,
        seatsPerWorkspace: 3.5,
        sharedPromptsUsage: 0.45,
        collaborationRate: 0.6,
      });
    });

    it('should return team health metrics', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      const result = await caller.getTeamHealth({});

      expect(mockGetTeamHealthMetrics).toHaveBeenCalled();
      expect(result).toHaveProperty('activeWorkspaces');
      expect(result).toHaveProperty('seatsPerWorkspace');
    });
  });

  describe('getFeatureAdoption', () => {
    beforeEach(() => {
      mockGetFeatureAdoptionMetrics.mockResolvedValue({
        coachUsageRate: 0.25,
        semanticSearchUsageRate: 0.4,
        privacyModeDistribution: { promptOnly: 70, fullChat: 30 },
        platformDistribution: {
          chatgpt: 45,
          claude: 30,
          gemini: 15,
          copilot: 8,
          other: 2,
        },
      });
    });

    it('should return feature adoption metrics', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      const result = await caller.getFeatureAdoption({});

      expect(mockGetFeatureAdoptionMetrics).toHaveBeenCalled();
      expect(result).toHaveProperty('privacyModeDistribution');
      expect(result).toHaveProperty('platformDistribution');
    });
  });

  // ============================================================================
  // Return Value Tests
  // ============================================================================

  describe('Return Values', () => {
    it('should return success for all tracking mutations', async () => {
      const caller = analyticsRouter.createCaller(createMockContext() as any);

      const results = await Promise.all([
        caller.trackChatCaptured({
          platform: 'chatgpt',
          privacyMode: 'prompt_only',
          tokenCount: 100,
          messageCount: 5,
        }),
        caller.trackPromptCreated({
          source: 'manual',
          hasVariables: false,
          variableCount: 0,
          tagCount: 0,
        }),
        caller.trackPromptRun({
          promptId: 'p1',
          platform: 'clipboard',
          variableCount: 0,
          isShared: false,
        }),
      ]);

      results.forEach((result) => {
        expect(result).toEqual({ success: true });
      });
    });
  });
});
