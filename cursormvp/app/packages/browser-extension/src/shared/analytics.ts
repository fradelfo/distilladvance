/**
 * Extension Analytics
 *
 * Lightweight analytics tracking for the browser extension.
 * Sends events to the API server for aggregation with web app events.
 */

import type { ConversationSource } from '@distill/shared-types';
import { browser } from './browser-api';
import { config } from './config';

// ============================================================================
// Configuration
// ============================================================================

const API_URL = config.apiUrl;
let userId: string | null = null;
let sessionId: string | null = null;
let analyticsEnabled = true;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize extension analytics.
 */
interface AnalyticsStorage {
  analyticsSessionId?: string;
  analyticsEnabled?: boolean;
  userId?: string;
}

export async function initExtensionAnalytics(): Promise<void> {
  // Generate or retrieve session ID
  const storage = (await browser.storage.local.get([
    'analyticsSessionId',
    'analyticsEnabled',
  ])) as AnalyticsStorage;

  if (storage.analyticsEnabled === false) {
    analyticsEnabled = false;
    return;
  }

  sessionId = storage.analyticsSessionId || generateSessionId();
  await browser.storage.local.set({ analyticsSessionId: sessionId });

  // Check for user ID from auth
  const authStorage = (await browser.storage.local.get(['userId'])) as AnalyticsStorage;
  userId = authStorage.userId || null;
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return `ext-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Set the current user ID.
 */
export function setUserId(id: string | null): void {
  userId = id;
  if (id) {
    browser.storage.local.set({ userId: id });
  }
}

// ============================================================================
// Event Tracking
// ============================================================================

interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

/**
 * Track an analytics event.
 */
async function trackEvent(event: string, properties: Record<string, unknown>): Promise<void> {
  if (!analyticsEnabled) {
    console.log('[Analytics] Disabled:', event, properties);
    return;
  }

  const analyticsEvent: AnalyticsEvent = {
    event,
    properties: {
      ...properties,
      extensionVersion: browser.runtime.getManifest().version,
      source: 'extension',
    },
    userId: userId || undefined,
    sessionId: sessionId || undefined,
    timestamp: new Date().toISOString(),
  };

  // Log in development
  console.log('[Analytics]', event, analyticsEvent.properties);

  // Try to send to API (non-blocking)
  try {
    const authToken = await getAuthToken();
    if (authToken) {
      fetch(`${API_URL}/api/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(analyticsEvent),
      }).catch(() => {
        // Silently fail - analytics should not block functionality
      });
    }
  } catch {
    // Silently fail
  }
}

/**
 * Get auth token from storage.
 */
async function getAuthToken(): Promise<string | null> {
  const storage = await browser.storage.local.get(['authToken']);
  return (storage as { authToken?: string }).authToken || null;
}

// ============================================================================
// Specific Event Trackers
// ============================================================================

/**
 * Track extension installation.
 */
export function trackExtensionInstalled(): void {
  const manifest = browser.runtime.getManifest();

  trackEvent('extension_installed', {
    browser: 'chrome',
    version: navigator.userAgent,
    extensionVersion: manifest.version,
  });
}

/**
 * Track extension update.
 */
export function trackExtensionUpdated(previousVersion: string): void {
  const manifest = browser.runtime.getManifest();

  trackEvent('extension_updated', {
    previousVersion,
    newVersion: manifest.version,
  });
}

/**
 * Track chat capture.
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
 * Track capture modal opened.
 */
export function trackCaptureModalOpened(platform: string): void {
  trackEvent('capture_modal_opened', {
    platform,
  });
}

/**
 * Track capture modal closed.
 */
export function trackCaptureModalClosed(action: 'captured' | 'cancelled' | 'error'): void {
  trackEvent('capture_modal_closed', {
    action,
  });
}

/**
 * Track keyboard shortcut used.
 */
export function trackKeyboardShortcutUsed(): void {
  trackEvent('keyboard_shortcut_used', {
    shortcut: 'capture-conversation',
  });
}

/**
 * Track context menu used.
 */
export function trackContextMenuUsed(menuItem: string): void {
  trackEvent('context_menu_used', {
    menuItem,
  });
}

/**
 * Track page detection.
 */
export function trackPageDetected(
  platform: string,
  supported: boolean,
  hasConversation: boolean
): void {
  trackEvent('page_detected', {
    platform,
    supported,
    hasConversation,
  });
}

/**
 * Track distillation started.
 */
export function trackDistillationStarted(platform: string, messageCount: number): void {
  trackEvent('distillation_started', {
    platform,
    messageCount,
  });
}

/**
 * Track distillation completed.
 */
export function trackDistillationCompleted(
  success: boolean,
  durationMs: number,
  platform: string
): void {
  trackEvent('distillation_completed', {
    success,
    durationMs,
    platform,
  });
}

/**
 * Track error occurrence.
 */
export function trackError(errorCode: string, errorMessage: string, context?: string): void {
  trackEvent('extension_error', {
    errorCode,
    errorMessage,
    context,
  });
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Enable or disable analytics.
 */
export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  analyticsEnabled = enabled;
  await browser.storage.local.set({ analyticsEnabled: enabled });
}

/**
 * Check if analytics is enabled.
 */
export function isAnalyticsEnabled(): boolean {
  return analyticsEnabled;
}
