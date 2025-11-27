/**
 * Content Script Main Entry
 * Injected into AI chat pages to capture conversations
 */

import type {
  ConversationMessage,
  ConversationSource,
  ExtensionMessage,
  CapturedConversation,
} from '@distill/shared-types';
import { showCaptureModal, CaptureModal } from './components/CaptureModal';
import { MessageTypes } from '../shared/messages';

// Module state
let currentModal: CaptureModal | null = null;

// Detect which AI chat platform we're on
function detectPlatform(): ConversationSource {
  const hostname = window.location.hostname;

  if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  }
  if (hostname.includes('claude.ai')) {
    return 'claude';
  }
  if (hostname.includes('gemini.google.com')) {
    return 'gemini';
  }
  if (hostname.includes('copilot.microsoft.com')) {
    return 'copilot';
  }

  return 'other';
}

// Extract conversation from the page
function extractConversation(): ConversationMessage[] {
  const platform = detectPlatform();
  const messages: ConversationMessage[] = [];

  switch (platform) {
    case 'chatgpt':
      messages.push(...extractChatGPTMessages());
      break;
    case 'claude':
      messages.push(...extractClaudeMessages());
      break;
    case 'gemini':
      messages.push(...extractGeminiMessages());
      break;
    default:
      console.warn('[Distill] Unknown platform, using generic extraction');
      messages.push(...extractGenericMessages());
  }

  return messages;
}

// Platform-specific extractors
function extractChatGPTMessages(): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  const messageElements = document.querySelectorAll('[data-message-author-role]');

  messageElements.forEach((el, index) => {
    const role = el.getAttribute('data-message-author-role') as 'user' | 'assistant';
    const content = el.textContent?.trim() || '';

    if (content) {
      messages.push({
        id: `msg-${index}`,
        role,
        content,
      });
    }
  });

  return messages;
}

function extractClaudeMessages(): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  // Claude-specific selectors
  const humanMessages = document.querySelectorAll('[data-testid="human-message"]');
  const assistantMessages = document.querySelectorAll('[data-testid="ai-message"]');

  // Interleave messages (this is simplified, actual implementation needs ordering)
  humanMessages.forEach((el, index) => {
    messages.push({
      id: `human-${index}`,
      role: 'user',
      content: el.textContent?.trim() || '',
    });
  });

  assistantMessages.forEach((el, index) => {
    messages.push({
      id: `assistant-${index}`,
      role: 'assistant',
      content: el.textContent?.trim() || '',
    });
  });

  return messages;
}

function extractGeminiMessages(): ConversationMessage[] {
  // Gemini-specific extraction
  return extractGenericMessages();
}

function extractGenericMessages(): ConversationMessage[] {
  // Generic fallback extraction based on common patterns
  const messages: ConversationMessage[] = [];
  // Implementation would use heuristics to find message containers
  return messages;
}

// Get conversation title from page
function getConversationTitle(): string {
  // Try common title locations
  const titleElement =
    document.querySelector('title') ||
    document.querySelector('h1') ||
    document.querySelector('[data-testid="conversation-title"]');

  return titleElement?.textContent?.trim() || 'Untitled Conversation';
}

// Build captured conversation object
function buildCapturedConversation(): CapturedConversation {
  const platform = detectPlatform();
  const messages = extractConversation();

  return {
    source: platform,
    url: window.location.href,
    title: getConversationTitle(),
    messages,
    capturedAt: new Date(),
  };
}

// Open the capture modal overlay
function openCaptureModal(): void {
  // Close existing modal if open
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }

  const conversation = buildCapturedConversation();

  currentModal = showCaptureModal({
    conversation,
    onClose: () => {
      currentModal = null;
    },
    onDistill: (result) => {
      console.log('[Distill] Distill completed:', result);
    },
  });
}

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    case MessageTypes.CAPTURE_CONVERSATION: {
      const capturedData = buildCapturedConversation();

      // Send back to background script
      chrome.runtime.sendMessage({
        type: MessageTypes.CONVERSATION_CAPTURED,
        payload: capturedData,
        source: 'content',
        timestamp: Date.now(),
      });

      sendResponse({ success: true, data: capturedData });
      break;
    }

    case MessageTypes.OPEN_CAPTURE_MODAL: {
      openCaptureModal();
      sendResponse({ success: true });
      break;
    }

    case MessageTypes.CLOSE_CAPTURE_MODAL: {
      if (currentModal) {
        currentModal.remove();
        currentModal = null;
      }
      sendResponse({ success: true });
      break;
    }

    case MessageTypes.GET_PAGE_STATUS: {
      const platform = detectPlatform();
      const messages = extractConversation();

      sendResponse({
        success: true,
        data: {
          supported: platform !== 'other',
          platform,
          hasConversation: messages.length > 0,
          messageCount: messages.length,
        },
      });
      break;
    }

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true;
});

// Initialize content script
function init() {
  console.log('[Distill] Content script loaded on:', detectPlatform());

  // Optionally inject UI elements
  injectDistillButton();
}

// Inject floating button for quick capture
function injectDistillButton() {
  // Create shadow DOM for style isolation
  const container = document.createElement('div');
  container.id = 'distill-container';
  const shadow = container.attachShadow({ mode: 'closed' });

  const button = document.createElement('button');
  button.innerHTML = '📝';
  button.title = 'Distill this conversation';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: #6366f1;
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });

  button.addEventListener('click', () => {
    // Open the capture modal directly
    openCaptureModal();
  });

  shadow.appendChild(button);
  document.body.appendChild(container);
}

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
