/**
 * Typed Message Passing for Extension Communication
 * Handles popup <-> background <-> content script communication
 */

import type {
  ExtensionMessage,
  ExtensionMessageType,
  CapturedConversation,
  ConversationMessage,
  DistillResult,
  ExtensionSettings,
} from '@distill/shared-types';

// ============================================================================
// Message Types
// ============================================================================

export const MessageTypes = {
  // Capture flow
  CAPTURE_CONVERSATION: 'CAPTURE_CONVERSATION',
  CONVERSATION_CAPTURED: 'CONVERSATION_CAPTURED',

  // Distillation
  DISTILL_REQUEST: 'DISTILL_REQUEST',
  DISTILL_COMPLETE: 'DISTILL_COMPLETE',

  // Settings
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // Auth
  AUTH_STATUS: 'AUTH_STATUS',

  // Generic
  ERROR: 'ERROR',

  // Page status
  GET_PAGE_STATUS: 'GET_PAGE_STATUS',
  PAGE_STATUS: 'PAGE_STATUS',

  // Modal control (content script)
  OPEN_CAPTURE_MODAL: 'OPEN_CAPTURE_MODAL',
  CLOSE_CAPTURE_MODAL: 'CLOSE_CAPTURE_MODAL',
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

// ============================================================================
// Message Payloads
// ============================================================================

export interface CaptureConversationPayload {
  tabId?: number;
}

export interface ConversationCapturedPayload {
  conversation: CapturedConversation;
}

export interface DistillRequestPayload {
  messages: ConversationMessage[];
  privacyMode: 'prompt-only' | 'full';
  options?: {
    preserveContext?: boolean;
    maxLength?: number;
  };
}

export interface DistillCompletePayload {
  result: DistillResult;
}

export interface SettingsPayload {
  settings: Partial<ExtensionSettings>;
}

export interface AuthStatusPayload {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface PageStatusPayload {
  supported: boolean;
  platform: string | null;
  hasConversation: boolean;
  messageCount: number;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Type-safe Message Creation
// ============================================================================

type MessageSource = 'popup' | 'background' | 'content' | 'options';

export function createMessage<T>(
  type: MessageType,
  payload: T,
  source: MessageSource
): ExtensionMessage<T> {
  return {
    type: type as ExtensionMessageType,
    payload,
    source,
    timestamp: Date.now(),
  };
}

// ============================================================================
// Message Sending Utilities
// ============================================================================

/**
 * Send a message to the background service worker
 */
export async function sendMessage<T = unknown, R = unknown>(
  type: MessageType,
  payload: T
): Promise<R | null> {
  try {
    const message = createMessage(type, payload, 'popup');
    const response = await chrome.runtime.sendMessage(message);
    return response as R;
  } catch (error) {
    console.error('[Distill] Error sending message:', error);
    return null;
  }
}

/**
 * Send a message to a specific tab's content script
 */
export async function sendToTab<T = unknown, R = unknown>(
  tabId: number,
  type: MessageType,
  payload: T
): Promise<R | null> {
  try {
    const message = createMessage(type, payload, 'background');
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response as R;
  } catch (error) {
    console.error('[Distill] Error sending message to tab:', error);
    return null;
  }
}

/**
 * Send a message to the currently active tab
 */
export async function sendToActiveTab<T = unknown, R = unknown>(
  type: MessageType,
  payload: T
): Promise<R | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      console.error('[Distill] No active tab found');
      return null;
    }
    return sendToTab(tab.id, type, payload);
  } catch (error) {
    console.error('[Distill] Error getting active tab:', error);
    return null;
  }
}

// ============================================================================
// Message Listener Helpers
// ============================================================================

type MessageHandler<T = unknown, R = unknown> = (
  payload: T,
  sender: chrome.runtime.MessageSender
) => Promise<R> | R;

interface MessageHandlers {
  [key: string]: MessageHandler;
}

/**
 * Create a message listener with typed handlers
 */
export function createMessageListener(handlers: MessageHandlers) {
  return (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): boolean => {
    const handler = handlers[message.type];

    if (handler) {
      const result = handler(message.payload, sender);

      if (result instanceof Promise) {
        result
          .then(sendResponse)
          .catch((error) => {
            console.error('[Distill] Handler error:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep channel open for async response
      }

      sendResponse(result);
    } else {
      console.warn('[Distill] Unknown message type:', message.type);
    }

    return false;
  };
}

// ============================================================================
// Response Types
// ============================================================================

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function successResponse<T>(data: T): MessageResponse<T> {
  return { success: true, data };
}

export function errorResponse(code: string, message: string): MessageResponse {
  return { success: false, error: { code, message } };
}
