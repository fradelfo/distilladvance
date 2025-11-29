/**
 * Background Service Worker
 * Handles extension lifecycle, message passing, and background tasks
 */

import type { ExtensionMessage } from '@distill/shared-types';
import { MessageTypes } from '../shared/messages';
import {
  initExtensionAnalytics,
  trackExtensionInstalled,
  trackExtensionUpdated,
  trackKeyboardShortcutUsed,
  trackContextMenuUsed,
  trackChatCaptured,
} from '../shared/analytics';

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  // Initialize analytics first
  await initExtensionAnalytics();

  if (details.reason === 'install') {
    console.log('[Distill] Extension installed');
    initializeDefaults();
    trackExtensionInstalled();
  } else if (details.reason === 'update') {
    console.log('[Distill] Extension updated');
    trackExtensionUpdated(details.previousVersion || 'unknown');
  }
});

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-conversation') {
    trackKeyboardShortcutUsed();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      // Send message to content script to open capture modal
      chrome.tabs.sendMessage(tab.id, {
        type: MessageTypes.OPEN_CAPTURE_MODAL,
        payload: {},
        source: 'background',
        timestamp: Date.now(),
      });
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('[Distill] Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    });

  // Return true to indicate async response
  return true;
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'distill-selection',
    title: 'Distill Selected Text',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'distill-page',
    title: 'Distill This Conversation',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://chat.openai.com/*',
      'https://chatgpt.com/*',
      'https://claude.ai/*',
      'https://gemini.google.com/*',
    ],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'distill-selection' && info.selectionText) {
    trackContextMenuUsed('distill-selection');
    handleDistillSelection(info.selectionText, tab);
  } else if (info.menuItemId === 'distill-page') {
    trackContextMenuUsed('distill-page');
    handleDistillPage(tab);
  }
});

// ============================================================================
// Message Handlers
// ============================================================================

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  const { type, payload } = message;

  switch (type) {
    case MessageTypes.CAPTURE_CONVERSATION:
    case 'CAPTURE_CONVERSATION':
      return handleCaptureConversation(payload);

    case MessageTypes.CONVERSATION_CAPTURED:
    case 'CONVERSATION_CAPTURED':
      return handleConversationCaptured(payload);

    case MessageTypes.DISTILL_REQUEST:
    case 'DISTILL_REQUEST':
      return handleDistillRequest(payload);

    case MessageTypes.GET_SETTINGS:
    case 'GET_SETTINGS':
      return getSettings();

    case MessageTypes.UPDATE_SETTINGS:
    case 'UPDATE_SETTINGS':
      return updateSettings(payload);

    case MessageTypes.AUTH_STATUS:
    case 'AUTH_STATUS':
      return getAuthStatus();

    default:
      console.warn('[Distill] Unknown message type:', type);
      return { success: false, error: 'Unknown message type' };
  }
}

async function handleCaptureConversation(payload: unknown) {
  // Request capture from content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tab.id!,
        {
          type: MessageTypes.CAPTURE_CONVERSATION,
          payload: {},
          source: 'background',
          timestamp: Date.now(),
        },
        resolve
      );
    });
  }
  return { success: false, error: 'No active tab' };
}

async function handleConversationCaptured(payload: unknown) {
  // Store captured conversation
  const conversations = await chrome.storage.local.get('conversations');
  const existing = conversations.conversations || [];

  const capturedData = payload as {
    source?: string;
    privacyMode?: string;
    messages?: Array<unknown>;
  };

  existing.unshift({
    ...capturedData,
    capturedAt: new Date().toISOString(),
  });

  // Keep last 100 conversations
  await chrome.storage.local.set({
    conversations: existing.slice(0, 100),
  });

  // Update stats
  const stats = await chrome.storage.local.get(['promptsSaved', 'lastCapture']);
  await chrome.storage.local.set({
    promptsSaved: (stats.promptsSaved || 0) + 1,
    lastCapture: new Date().toISOString(),
  });

  // Track analytics event
  const messageCount = capturedData.messages?.length || 0;
  const tokenCount = messageCount * 100; // Rough estimate
  trackChatCaptured(
    (capturedData.source || 'other') as any,
    capturedData.privacyMode === 'full' ? 'full_chat' : 'prompt_only',
    tokenCount,
    messageCount
  );

  return { success: true, message: 'Conversation captured' };
}

async function handleDistillRequest(payload: unknown) {
  // TODO: Implement actual API call to distillation service
  // For now, simulate a successful distillation
  console.log('[Distill] Processing distill request:', payload);

  // In production, this would:
  // 1. Get auth token from storage
  // 2. Call the API server with the conversation
  // 3. Return the distilled prompt result

  return {
    success: true,
    data: {
      promptId: 'prompt-' + Date.now(),
      title: 'Distilled Prompt',
      content: 'Generated prompt template...',
      tags: ['generated'],
      metadata: {},
    },
  };
}

async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  return result.settings || getDefaultSettings();
}

async function updateSettings(settings: unknown) {
  await chrome.storage.sync.set({ settings });
  return { success: true };
}

async function getAuthStatus() {
  const result = await chrome.storage.local.get('authToken');
  return { authenticated: !!result.authToken };
}

// ============================================================================
// Context Menu Handlers
// ============================================================================

async function handleDistillSelection(text: string, tab?: chrome.tabs.Tab) {
  // Open popup with selected text for distillation
  console.log('[Distill] Distilling selection:', text.substring(0, 100));
}

async function handleDistillPage(tab?: chrome.tabs.Tab) {
  if (!tab?.id) return;

  // Send message to content script to open capture modal
  chrome.tabs.sendMessage(tab.id, {
    type: MessageTypes.OPEN_CAPTURE_MODAL,
    payload: {},
    source: 'background',
    timestamp: Date.now(),
  });
}

// ============================================================================
// Initialization
// ============================================================================

function initializeDefaults() {
  chrome.storage.sync.set({
    settings: getDefaultSettings(),
  });
}

function getDefaultSettings() {
  return {
    autoCapture: false,
    captureOnNavigate: false,
    showNotifications: true,
    defaultPrivacy: 'private',
    syncEnabled: true,
    theme: 'system',
  };
}

export {};
