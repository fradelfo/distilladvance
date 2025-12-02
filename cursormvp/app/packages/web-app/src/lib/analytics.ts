/**
 * Client-side Analytics
 *
 * PostHog client for browser-side event tracking.
 * Used alongside server-side tracking for comprehensive analytics.
 */

import type { AnalyticsEventType, ConversationSource } from '@distill/shared-types';
import posthog from 'posthog-js';

// ============================================================================
// Configuration
// ============================================================================

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'http://localhost:8080';
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';

let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize PostHog analytics.
 * Call this once in your app's entry point.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  if (!ANALYTICS_ENABLED || !POSTHOG_KEY) {
    console.log('[Analytics] Disabled or no API key configured');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // We'll track specific events manually
    persistence: 'localStorage',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] PostHog initialized');
      }
    },
  });

  isInitialized = true;
}

// ============================================================================
// User Identification
// ============================================================================

/**
 * Identify a user after login.
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (!isInitialized) return;

  posthog.identify(userId, properties);
}

/**
 * Reset user identity (on logout).
 */
export function resetUser(): void {
  if (!isInitialized) return;

  posthog.reset();
}

/**
 * Set user properties.
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isInitialized) return;

  posthog.people.set(properties);
}

// ============================================================================
// Event Tracking
// ============================================================================

/**
 * Track a generic event.
 */
export function trackEvent(
  eventName: AnalyticsEventType | string,
  properties?: Record<string, unknown>
): void {
  if (!isInitialized) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}:`, properties);
    }
    return;
  }

  posthog.capture(eventName, properties);
}

/**
 * Track a page view.
 */
export function trackPageView(path: string, properties?: Record<string, unknown>): void {
  trackEvent('page_viewed', {
    path,
    ...properties,
  });
}

/**
 * Track chat capture from extension.
 */
export function trackChatCaptured(
  platform: ConversationSource,
  privacyMode: 'prompt_only' | 'full_chat',
  tokenCount: number,
  messageCount: number
): void {
  trackEvent('chat_captured', {
    platform,
    privacyMode,
    tokenCount,
    messageCount,
  });
}

/**
 * Track prompt creation.
 */
export function trackPromptCreated(
  source: 'capture' | 'manual' | 'import',
  hasVariables: boolean,
  variableCount: number,
  tagCount: number
): void {
  trackEvent('prompt_created', {
    source,
    hasVariables,
    variableCount,
    tagCount,
  });
}

/**
 * Track prompt run.
 */
export function trackPromptRun(
  promptId: string,
  platform: ConversationSource | 'clipboard',
  variableCount: number,
  isShared: boolean
): void {
  trackEvent('prompt_run', {
    promptId,
    platform,
    variableCount,
    isShared,
  });
}

/**
 * Track prompt edit.
 */
export function trackPromptEdited(
  promptId: string,
  editType: 'title' | 'content' | 'variables' | 'tags' | 'multiple',
  timeSinceCreationMs: number
): void {
  trackEvent('prompt_edited', {
    promptId,
    editType,
    timeSinceCreationMs,
  });
}

/**
 * Track coach usage.
 */
export function trackCoachUsed(
  promptId: string,
  suggestionsShown: number,
  suggestionsApplied: number,
  focusArea?: string,
  qualityScore?: number
): void {
  trackEvent('coach_used', {
    promptId,
    suggestionsShown,
    suggestionsApplied,
    focusArea,
    qualityScore,
  });
}

/**
 * Track member invite.
 */
export function trackMemberInvited(count: number, method: 'email' | 'link'): void {
  trackEvent('member_invited', {
    count,
    method,
  });
}

/**
 * Track search.
 */
export function trackSearchPerformed(
  queryLength: number,
  resultsCount: number,
  searchType: 'text' | 'semantic',
  hasFilters: boolean
): void {
  trackEvent('search_performed', {
    queryLength,
    resultsCount,
    searchType,
    hasFilters,
  });
}

/**
 * Track feature usage.
 */
export function trackFeatureUsed(
  feature: string,
  action: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent('feature_used', {
    feature,
    action,
    ...metadata,
  });
}

// ============================================================================
// Workflow Analytics
// ============================================================================

/**
 * Track workflow created.
 */
export function trackWorkflowCreated(
  workflowId: string,
  stepCount: number,
  workspaceId?: string
): void {
  trackEvent('workflow_created', {
    workflowId,
    stepCount,
    workspaceId,
  });
}

/**
 * Track workflow updated.
 */
export function trackWorkflowUpdated(workflowId: string, changes: string[]): void {
  trackEvent('workflow_updated', {
    workflowId,
    changes,
  });
}

/**
 * Track workflow deleted.
 */
export function trackWorkflowDeleted(workflowId: string): void {
  trackEvent('workflow_deleted', { workflowId });
}

/**
 * Track workflow execution started.
 */
export function trackWorkflowExecutionStarted(
  workflowId: string,
  executionId: string,
  stepCount: number
): void {
  trackEvent('workflow_execution_started', {
    workflowId,
    executionId,
    stepCount,
  });
}

/**
 * Track workflow execution completed.
 */
export function trackWorkflowExecutionCompleted(
  executionId: string,
  stepCount: number,
  totalTokens: number,
  totalCost: number,
  durationMs: number
): void {
  trackEvent('workflow_execution_completed', {
    executionId,
    stepCount,
    totalTokens,
    totalCost,
    durationMs,
  });
}

/**
 * Track workflow execution failed.
 */
export function trackWorkflowExecutionFailed(
  executionId: string,
  failedStep: number,
  errorType: string
): void {
  trackEvent('workflow_execution_failed', {
    executionId,
    failedStep,
    errorType,
  });
}

/**
 * Track workflow execution cancelled.
 */
export function trackWorkflowExecutionCancelled(
  executionId: string,
  cancelledAtStep: number
): void {
  trackEvent('workflow_execution_cancelled', {
    executionId,
    cancelledAtStep,
  });
}

/**
 * Track workflow step completed.
 */
export function trackWorkflowStepCompleted(
  executionId: string,
  stepOrder: number,
  tokens: number,
  durationMs: number
): void {
  trackEvent('workflow_step_completed', {
    executionId,
    stepOrder,
    tokens,
    durationMs,
  });
}

/**
 * Track workflow shared to workspace.
 */
export function trackWorkflowShared(workflowId: string, workspaceId: string): void {
  trackEvent('workflow_shared', {
    workflowId,
    workspaceId,
  });
}

// ============================================================================
// Feature Flags (PostHog)
// ============================================================================

/**
 * Check if a feature flag is enabled.
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!isInitialized) return false;

  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag value.
 */
export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (!isInitialized) return undefined;

  return posthog.getFeatureFlag(flagKey);
}

// ============================================================================
// Session Recording
// ============================================================================

/**
 * Start session recording (if enabled).
 */
export function startSessionRecording(): void {
  if (!isInitialized) return;

  posthog.startSessionRecording();
}

/**
 * Stop session recording.
 */
export function stopSessionRecording(): void {
  if (!isInitialized) return;

  posthog.stopSessionRecording();
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Shutdown analytics and flush pending events.
 */
export function shutdownAnalytics(): void {
  if (!isInitialized) return;

  posthog.capture('$pageleave');
  isInitialized = false;
}
