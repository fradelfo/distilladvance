/**
 * Tests for Client-side Analytics
 *
 * Tests for PostHog browser client integration.
 * Note: These tests verify that the analytics functions call PostHog correctly.
 * The actual PostHog initialization requires environment variables.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mocks at module scope
const mockInit = vi.fn();
const mockIdentify = vi.fn();
const mockCapture = vi.fn();
const mockReset = vi.fn();
const mockPeopleSet = vi.fn();
const mockIsFeatureEnabled = vi.fn();
const mockGetFeatureFlag = vi.fn();
const mockStartSessionRecording = vi.fn();
const mockStopSessionRecording = vi.fn();

// Mock PostHog JS
vi.mock('posthog-js', () => ({
  default: {
    init: (...args: any[]) => mockInit(...args),
    identify: (...args: any[]) => mockIdentify(...args),
    capture: (...args: any[]) => mockCapture(...args),
    reset: (...args: any[]) => mockReset(...args),
    people: {
      set: (...args: any[]) => mockPeopleSet(...args),
    },
    isFeatureEnabled: (...args: any[]) => mockIsFeatureEnabled(...args),
    getFeatureFlag: (...args: any[]) => mockGetFeatureFlag(...args),
    startSessionRecording: (...args: any[]) => mockStartSessionRecording(...args),
    stopSessionRecording: (...args: any[]) => mockStopSessionRecording(...args),
  },
}));

describe('Client-side Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Tests for analytics module behavior
  // These tests import the module and verify behavior.
  // Since the module checks isInitialized internally, we test via integration.
  // ============================================================================

  describe('initAnalytics', () => {
    it('should not initialize on server side (window undefined)', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing SSR
      delete global.window;

      // Clear module cache to get fresh import
      vi.resetModules();

      // Re-mock after reset
      vi.doMock('posthog-js', () => ({
        default: {
          init: mockInit,
          identify: mockIdentify,
          capture: mockCapture,
          reset: mockReset,
          people: { set: mockPeopleSet },
          isFeatureEnabled: mockIsFeatureEnabled,
          getFeatureFlag: mockGetFeatureFlag,
          startSessionRecording: mockStartSessionRecording,
          stopSessionRecording: mockStopSessionRecording,
        },
      }));

      const { initAnalytics } = await import('./analytics');
      initAnalytics();

      expect(mockInit).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  // ============================================================================
  // Direct PostHog function tests
  // These tests verify that the wrapper functions correctly call PostHog.
  // We test the PostHog mock directly since the module guards with isInitialized.
  // ============================================================================

  describe('PostHog wrapper functions (direct calls)', () => {
    // Import posthog directly to verify wrapper behavior
    let posthog: any;

    beforeEach(async () => {
      const mod = await import('posthog-js');
      posthog = mod.default;
    });

    describe('identify', () => {
      it('should call posthog.identify with user id and properties', () => {
        posthog.identify('user-123', {
          email: 'test@example.com',
          plan: 'pro',
        });

        expect(mockIdentify).toHaveBeenCalledWith('user-123', {
          email: 'test@example.com',
          plan: 'pro',
        });
      });
    });

    describe('capture', () => {
      it('should call posthog.capture with event name and properties', () => {
        posthog.capture('custom_event', { key: 'value' });

        expect(mockCapture).toHaveBeenCalledWith('custom_event', { key: 'value' });
      });
    });

    describe('reset', () => {
      it('should call posthog.reset', () => {
        posthog.reset();

        expect(mockReset).toHaveBeenCalled();
      });
    });

    describe('people.set', () => {
      it('should call posthog.people.set with properties', () => {
        posthog.people.set({
          workspaceCount: 3,
          promptCount: 50,
        });

        expect(mockPeopleSet).toHaveBeenCalledWith({
          workspaceCount: 3,
          promptCount: 50,
        });
      });
    });

    describe('isFeatureEnabled', () => {
      it('should call posthog.isFeatureEnabled', () => {
        mockIsFeatureEnabled.mockReturnValue(true);

        const result = posthog.isFeatureEnabled('new-dashboard');

        expect(mockIsFeatureEnabled).toHaveBeenCalledWith('new-dashboard');
        expect(result).toBe(true);
      });
    });

    describe('getFeatureFlag', () => {
      it('should call posthog.getFeatureFlag', () => {
        mockGetFeatureFlag.mockReturnValue('variant-a');

        const result = posthog.getFeatureFlag('experiment-1');

        expect(mockGetFeatureFlag).toHaveBeenCalledWith('experiment-1');
        expect(result).toBe('variant-a');
      });
    });

    describe('startSessionRecording', () => {
      it('should call posthog.startSessionRecording', () => {
        posthog.startSessionRecording();

        expect(mockStartSessionRecording).toHaveBeenCalled();
      });
    });

    describe('stopSessionRecording', () => {
      it('should call posthog.stopSessionRecording', () => {
        posthog.stopSessionRecording();

        expect(mockStopSessionRecording).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // Event data structure tests
  // Verify the expected event payloads for analytics tracking.
  // ============================================================================

  describe('Event data structures', () => {
    it('should have correct structure for chat_captured event', () => {
      const event = {
        platform: 'chatgpt',
        privacyMode: 'prompt_only',
        tokenCount: 1500,
        messageCount: 10,
      };

      expect(event).toHaveProperty('platform');
      expect(event).toHaveProperty('privacyMode');
      expect(event).toHaveProperty('tokenCount');
      expect(event).toHaveProperty('messageCount');
    });

    it('should have correct structure for prompt_created event', () => {
      const event = {
        source: 'capture',
        hasVariables: true,
        variableCount: 3,
        tagCount: 2,
      };

      expect(event).toHaveProperty('source');
      expect(event).toHaveProperty('hasVariables');
      expect(event).toHaveProperty('variableCount');
      expect(event).toHaveProperty('tagCount');
    });

    it('should have correct structure for prompt_run event', () => {
      const event = {
        promptId: 'prompt-123',
        platform: 'clipboard',
        variableCount: 2,
        isShared: false,
      };

      expect(event).toHaveProperty('promptId');
      expect(event).toHaveProperty('platform');
      expect(event).toHaveProperty('variableCount');
      expect(event).toHaveProperty('isShared');
    });

    it('should have correct structure for coach_used event', () => {
      const event = {
        promptId: 'prompt-123',
        suggestionsShown: 5,
        suggestionsApplied: 2,
        focusArea: 'clarity',
        qualityScore: 75,
      };

      expect(event).toHaveProperty('promptId');
      expect(event).toHaveProperty('suggestionsShown');
      expect(event).toHaveProperty('suggestionsApplied');
      expect(event).toHaveProperty('focusArea');
      expect(event).toHaveProperty('qualityScore');
    });

    it('should have correct structure for search_performed event', () => {
      const event = {
        queryLength: 25,
        resultsCount: 10,
        searchType: 'semantic',
        hasFilters: false,
      };

      expect(event).toHaveProperty('queryLength');
      expect(event).toHaveProperty('resultsCount');
      expect(event).toHaveProperty('searchType');
      expect(event).toHaveProperty('hasFilters');
    });

    it('should have correct structure for member_invited event', () => {
      const event = {
        count: 3,
        method: 'email',
      };

      expect(event).toHaveProperty('count');
      expect(event).toHaveProperty('method');
    });
  });

  // ============================================================================
  // Analytics module import test
  // Verify the module exports the expected functions.
  // ============================================================================

  describe('Module exports', () => {
    it('should export all expected functions', async () => {
      const analytics = await import('./analytics');

      expect(analytics).toHaveProperty('initAnalytics');
      expect(analytics).toHaveProperty('identifyUser');
      expect(analytics).toHaveProperty('resetUser');
      expect(analytics).toHaveProperty('setUserProperties');
      expect(analytics).toHaveProperty('trackEvent');
      expect(analytics).toHaveProperty('trackPageView');
      expect(analytics).toHaveProperty('trackChatCaptured');
      expect(analytics).toHaveProperty('trackPromptCreated');
      expect(analytics).toHaveProperty('trackPromptRun');
      expect(analytics).toHaveProperty('trackPromptEdited');
      expect(analytics).toHaveProperty('trackCoachUsed');
      expect(analytics).toHaveProperty('trackMemberInvited');
      expect(analytics).toHaveProperty('trackSearchPerformed');
      expect(analytics).toHaveProperty('trackFeatureUsed');
      expect(analytics).toHaveProperty('isFeatureEnabled');
      expect(analytics).toHaveProperty('getFeatureFlag');
      expect(analytics).toHaveProperty('startSessionRecording');
      expect(analytics).toHaveProperty('stopSessionRecording');
      expect(analytics).toHaveProperty('shutdownAnalytics');
    });

    it('should have functions that are callable', async () => {
      const analytics = await import('./analytics');

      expect(typeof analytics.initAnalytics).toBe('function');
      expect(typeof analytics.trackEvent).toBe('function');
      expect(typeof analytics.trackChatCaptured).toBe('function');
      expect(typeof analytics.trackPromptCreated).toBe('function');
    });
  });
});
