/**
 * Background Service Worker
 * Handles extension lifecycle, message passing, and background tasks
 */

import type { ExtensionMessage } from '@distill/shared-types';
import {
  initExtensionAnalytics,
  trackChatCaptured,
  trackContextMenuUsed,
  trackExtensionInstalled,
  trackExtensionUpdated,
  trackKeyboardShortcutUsed,
} from '../shared/analytics';
import { config } from '../shared/config';
import { MessageTypes } from '../shared/messages';

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

    case MessageTypes.SAVE_CONVERSATION:
    case 'SAVE_CONVERSATION':
      return handleSaveConversation(payload);

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
  console.log('[Distill] Processing distill request:', payload);

  try {
    // Get cookies for auth
    const cookies = await chrome.cookies.getAll({ url: config.webUrl });
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const distillPayload = payload as {
      messages: Array<{ role: string; content: string }>;
      privacyMode: string;
      options?: { preserveContext?: boolean };
    };

    // Step 1: Call the distill API
    console.log('[Distill] Calling distill API...');
    const distillResponse = await fetch(`${config.apiUrl}/trpc/distill.distill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        messages: distillPayload.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!distillResponse.ok) {
      const errorText = await distillResponse.text();
      console.error('[Distill] Distill API error:', errorText);
      throw new Error(`Distill API error: ${distillResponse.status}`);
    }

    const distillResult = await distillResponse.json();
    console.log('[Distill] Distill result:', distillResult);

    if (!distillResult.result?.data?.success) {
      throw new Error(distillResult.result?.data?.error || 'Distillation failed');
    }

    const { prompt: distilledPrompt } = distillResult.result.data;

    // Step 2: Save the prompt to the database
    console.log('[Distill] Saving prompt...');
    const saveResponse = await fetch(`${config.apiUrl}/trpc/distill.savePrompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: distilledPrompt.title,
        description: distilledPrompt.description,
        template: distilledPrompt.template,
        variables: distilledPrompt.variables || [],
        tags: distilledPrompt.tags || [],
        isPublic: false,
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error('[Distill] Save prompt error:', errorText);
      throw new Error(`Save prompt error: ${saveResponse.status}`);
    }

    const saveResult = await saveResponse.json();
    console.log('[Distill] Save result:', saveResult);

    if (!saveResult.result?.data?.success) {
      throw new Error(saveResult.result?.data?.error || 'Failed to save prompt');
    }

    const savedPrompt = saveResult.result.data.prompt;

    return {
      success: true,
      data: {
        promptId: savedPrompt.id,
        title: savedPrompt.title,
        content: savedPrompt.content,
        tags: savedPrompt.tags || [],
        metadata: savedPrompt.metadata || {},
      },
    };
  } catch (error) {
    console.error('[Distill] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function handleSaveConversation(payload: unknown) {
  console.log('[Distill] Processing save conversation request:', payload);

  try {
    // Get cookies for auth
    const cookies = await chrome.cookies.getAll({ url: config.webUrl });
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const savePayload = payload as {
      messages: Array<{ role: string; content: string }>;
      title: string;
      source: string;
      sourceUrl?: string;
      privacyMode: 'prompt-only' | 'full';
    };

    // Map privacy mode to API format
    const apiPrivacyMode = savePayload.privacyMode === 'full' ? 'FULL' : 'PROMPT_ONLY';

    // Prepare raw content for storage (only if FULL mode)
    const rawContent = apiPrivacyMode === 'FULL' ? savePayload.messages : null;

    // Call the conversation.create API
    console.log('[Distill] Calling conversation.create API...');
    const response = await fetch(`${config.apiUrl}/trpc/conversation.create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: savePayload.title || 'Untitled Conversation',
        source: savePayload.source || 'unknown',
        sourceUrl: savePayload.sourceUrl,
        privacyMode: apiPrivacyMode,
        rawContent,
        metadata: {
          messageCount: savePayload.messages.length,
          capturedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Distill] Save conversation error:', errorText);
      throw new Error(`Save conversation error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Distill] Save result:', result);

    if (!result.result?.data?.success) {
      throw new Error(result.result?.data?.error || 'Failed to save conversation');
    }

    const savedConversation = result.result.data.conversation;

    // Update local stats
    const stats = await chrome.storage.local.get(['conversationsSaved', 'lastSave']);
    await chrome.storage.local.set({
      conversationsSaved: (stats.conversationsSaved || 0) + 1,
      lastSave: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        conversationId: savedConversation.id,
        title: savedConversation.title,
        source: savedConversation.source,
        privacyMode: savedConversation.privacyMode,
      },
    };
  } catch (error) {
    console.error('[Distill] Error saving conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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
  try {
    // Check auth by calling the web app's session endpoint
    // We need to get cookies for the web app domain
    const cookies = await chrome.cookies.getAll({ url: config.webUrl });
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    console.log('[Distill] Checking auth with cookies from:', config.webUrl);
    console.log('[Distill] Found cookies:', cookies.length);

    const response = await fetch(`${config.webUrl}/api/auth/session`, {
      credentials: 'include',
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      console.log('[Distill] Session check failed:', response.status);
      // In development mode, allow bypass for testing
      if (config.webUrl.includes('localhost')) {
        console.log('[Distill] Dev mode - allowing auth bypass for testing');
        return { authenticated: true, userId: 'dev-user' };
      }
      return { authenticated: false };
    }

    const session = await response.json();
    console.log('[Distill] Session response:', session);
    const authenticated = !!session?.user?.id;

    // Cache the user ID for API calls
    if (authenticated && session.user.id) {
      await chrome.storage.local.set({ userId: session.user.id });
    }

    return { authenticated, userId: session?.user?.id };
  } catch (error) {
    console.error('[Distill] Auth check failed:', error);
    // In development mode, allow bypass for testing
    if (config.webUrl.includes('localhost')) {
      console.log('[Distill] Dev mode - allowing auth bypass for testing');
      return { authenticated: true, userId: 'dev-user' };
    }
    return { authenticated: false };
  }
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
