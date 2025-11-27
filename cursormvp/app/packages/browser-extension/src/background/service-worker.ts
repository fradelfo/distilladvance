/**
 * Background Service Worker
 * Handles extension lifecycle, message passing, and background tasks
 */

import type { ExtensionMessage, ExtensionMessageType } from '@distill/shared-types';

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Distill] Extension installed');
    initializeDefaults();
  } else if (details.reason === 'update') {
    console.log('[Distill] Extension updated');
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
    handleDistillSelection(info.selectionText, tab);
  } else if (info.menuItemId === 'distill-page') {
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
    case 'CAPTURE_CONVERSATION':
      return handleCaptureConversation(payload);

    case 'DISTILL_REQUEST':
      return handleDistillRequest(payload);

    case 'GET_SETTINGS':
      return getSettings();

    case 'UPDATE_SETTINGS':
      return updateSettings(payload);

    case 'AUTH_STATUS':
      return getAuthStatus();

    default:
      console.warn('[Distill] Unknown message type:', type);
      return { success: false, error: 'Unknown message type' };
  }
}

async function handleCaptureConversation(payload: unknown) {
  // Store captured conversation
  const conversations = await chrome.storage.local.get('conversations');
  const existing = conversations.conversations || [];

  existing.unshift({
    ...payload,
    capturedAt: new Date().toISOString(),
  });

  // Keep last 100 conversations
  await chrome.storage.local.set({
    conversations: existing.slice(0, 100),
  });

  return { success: true, message: 'Conversation captured' };
}

async function handleDistillRequest(payload: unknown) {
  // TODO: Implement distillation logic
  // This would call the API server to process the conversation
  return { success: true, message: 'Distillation queued' };
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

  // Send message to content script to capture conversation
  chrome.tabs.sendMessage(tab.id, {
    type: 'CAPTURE_CONVERSATION',
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
