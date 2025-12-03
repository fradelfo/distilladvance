/**
 * Content Script Main Entry
 * Injected into AI chat pages to capture conversations
 */

import type {
  CapturedConversation,
  ConversationMessage,
  ConversationSource,
  ExtensionMessage,
} from '@distill/shared-types';
import { browser } from '../shared/browser-api';
import { MessageTypes } from '../shared/messages';
import { type CaptureModal, showCaptureModal } from './components/CaptureModal';

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
async function extractConversation(): Promise<ConversationMessage[]> {
  const platform = detectPlatform();
  const messages: ConversationMessage[] = [];

  switch (platform) {
    case 'chatgpt':
      messages.push(...extractChatGPTMessages());
      break;
    case 'claude':
      messages.push(...(await extractClaudeMessages()));
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

async function extractClaudeMessages(): Promise<ConversationMessage[]> {
  console.log('[Distill] Starting Claude extraction with scroll loading...');

  // Step 1: Scroll to load all messages (handles virtualization)
  await scrollToLoadAllMessages();

  const messages: ConversationMessage[] = [];
  const seenIds = new Set<string>(); // Deduplicate by element position/index
  const seenContent = new Set<string>(); // Deduplicate by content for fallback strategies

  // Claude's DOM structure uses conversation turns
  // Try multiple selector strategies for robustness

  // Strategy 1: Look for message containers with data attributes
  const turnContainers = document.querySelectorAll('[data-testid^="conversation-turn"]');
  console.log(`[Distill] Found ${turnContainers.length} turn containers with data-testid`);

  if (turnContainers.length > 0) {
    turnContainers.forEach((turn, index) => {
      // Try multiple ways to detect if this is a human message
      const isHuman =
        turn.querySelector('[data-testid="user-message"]') !== null ||
        turn.classList.contains('human-turn') ||
        turn.getAttribute('data-is-human') === 'true' ||
        turn.querySelector('[class*="user"]') !== null;

      // Try multiple ways to get content
      const contentEl = turn.querySelector(
        '.whitespace-pre-wrap, .prose, [class*="message-content"], [class*="font-"]'
      );
      let content = '';

      if (contentEl) {
        content = contentEl.textContent?.trim() || '';
      } else {
        // Fallback: get all text from the turn container, but filter out UI elements
        const allText = turn.textContent?.trim() || '';
        // Remove common UI text patterns
        content = allText.replace(/^(Human|Claude|Assistant|You):\s*/i, '').trim();
      }

      const messageId = `turn-${index}`;

      if (content && content.length > 10 && !seenIds.has(messageId)) {
        seenIds.add(messageId);
        messages.push({
          id: messageId,
          role: isHuman ? 'user' : 'assistant',
          content,
        });
        console.log(
          `[Distill] Extracted message ${index + 1}: ${isHuman ? 'user' : 'assistant'} (${content.length} chars)`
        );
      } else if (!content) {
        console.warn(`[Distill] Skipped turn ${index}: no content found`);
      } else if (content.length <= 10) {
        console.warn(
          `[Distill] Skipped turn ${index}: content too short (${content.length} chars)`
        );
      }
    });
    console.log('[Distill] Strategy 1: Found', messages.length, 'messages');
    return messages;
  }

  // Strategy 2: Look for font-based message classes (Claude's styling)
  const allMessages = document.querySelectorAll(
    '.font-user-message, .font-claude-message, [class*="human"], [class*="assistant"]'
  );
  console.log(`[Distill] Strategy 2: Found ${allMessages.length} font-based messages`);

  if (allMessages.length > 0) {
    allMessages.forEach((el, index) => {
      const classList = el.className || '';
      const isHuman = classList.includes('user') || classList.includes('human');
      const content = el.textContent?.trim() || '';

      const messageId = `msg-${index}`;
      if (content && content.length > 10 && !seenIds.has(messageId)) {
        seenIds.add(messageId);
        messages.push({
          id: messageId,
          role: isHuman ? 'user' : 'assistant',
          content,
        });
        console.log(
          `[Distill] Extracted message ${index + 1}: ${isHuman ? 'user' : 'assistant'} (${content.length} chars)`
        );
      }
    });
    console.log('[Distill] Strategy 2 result: Found', messages.length, 'messages');
    return messages;
  }

  // Strategy 3: Look for the main conversation container and parse structure
  const conversationContainer = document.querySelector(
    '[class*="conversation"], [class*="chat-messages"], main'
  );

  if (conversationContainer) {
    // Look for alternating message blocks
    const blocks = conversationContainer.querySelectorAll(
      '[class*="message"], [class*="turn"], [class*="block"]'
    );

    blocks.forEach((block, index) => {
      const text = block.textContent?.trim() || '';
      // Skip empty or very short blocks (likely UI elements)
      if (text.length < 10) return;

      if (!seenContent.has(text)) {
        seenContent.add(text);
        // Heuristic: odd indexes are often user messages in alternating UI
        const isHuman = index % 2 === 0;

        messages.push({
          id: `block-${index}`,
          role: isHuman ? 'user' : 'assistant',
          content: text,
        });
      }
    });
  }

  // Strategy 4: Last resort - check for any data-is-streaming or similar attributes
  if (messages.length === 0) {
    const streamingMessages = document.querySelectorAll('[data-is-streaming], [data-message-id]');
    streamingMessages.forEach((el, index) => {
      const content = el.textContent?.trim() || '';
      if (content && !seenContent.has(content)) {
        seenContent.add(content);
        messages.push({
          id: `stream-${index}`,
          role: index % 2 === 0 ? 'user' : 'assistant',
          content,
        });
      }
    });
  }

  console.log('[Distill] Claude extraction complete:', messages.length, 'messages');
  return messages;
}

/**
 * Scroll through the conversation to load all messages (handles virtualization)
 */
async function scrollToLoadAllMessages(): Promise<void> {
  return new Promise((resolve) => {
    const scrollContainer = findScrollContainer();

    if (!scrollContainer) {
      console.log('[Distill] No scroll container found, skipping scroll loading');
      resolve();
      return;
    }

    console.log('[Distill] Starting scroll loading sequence...');

    let previousMessageCount = 0;
    let stableCount = 0;
    const maxAttempts = 15; // Increased for longer conversations
    let attempts = 0;
    let scrollDirection: 'top' | 'bottom' = 'bottom'; // Start by scrolling to bottom

    const scrollInterval = setInterval(() => {
      attempts++;

      // Count current messages in DOM
      const currentMessageCount = document.querySelectorAll(
        '[data-testid^="conversation-turn"], .font-user-message, .font-claude-message, [class*="message"]'
      ).length;

      console.log(
        `[Distill] Scroll attempt ${attempts}: ${currentMessageCount} messages (scrolling to ${scrollDirection})`
      );

      // Alternate between scrolling to bottom and top to load all messages
      if (scrollDirection === 'bottom') {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        scrollDirection = 'top';
      } else {
        scrollContainer.scrollTop = 0;
        scrollDirection = 'bottom';
      }

      // Check if message count stabilized
      if (currentMessageCount === previousMessageCount) {
        stableCount++;
      } else {
        stableCount = 0;
        previousMessageCount = currentMessageCount;
      }

      // Stop when stable for 3 checks or max attempts reached
      if (stableCount >= 3 || attempts >= maxAttempts) {
        clearInterval(scrollInterval);
        console.log(`[Distill] Scroll loading complete: ${currentMessageCount} messages in DOM`);

        // Scroll to top one final time so messages are in order
        scrollContainer.scrollTop = 0;

        // Wait for any final rendering
        setTimeout(resolve, 800);
      }
    }, 500); // Increased to 500ms to give DOM time to update
  });
}

/**
 * Find the scrollable container for the conversation
 */
function findScrollContainer(): HTMLElement | null {
  // Try to find Claude's scroll container
  const candidates = [
    document.querySelector('[class*="conversation"]'),
    document.querySelector('[class*="chat-messages"]'),
    document.querySelector('main'),
    document.querySelector('[role="main"]'),
    document.documentElement,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate instanceof HTMLElement) {
      const style = window.getComputedStyle(candidate);
      if (
        style.overflow === 'auto' ||
        style.overflow === 'scroll' ||
        style.overflowY === 'auto' ||
        style.overflowY === 'scroll'
      ) {
        return candidate;
      }
    }
  }

  // Fallback to document element
  return document.documentElement;
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
async function buildCapturedConversation(): Promise<CapturedConversation> {
  const platform = detectPlatform();
  const messages = await extractConversation();

  return {
    source: platform,
    url: window.location.href,
    title: getConversationTitle(),
    messages,
    capturedAt: new Date(),
  };
}

// Open the capture modal overlay
async function openCaptureModal(): Promise<void> {
  // Close existing modal if open
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }

  // Show loading indicator while capturing
  console.log('[Distill] Capturing conversation...');

  const conversation = await buildCapturedConversation();

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
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const typedMessage = message as ExtensionMessage;
  console.log('[Distill] Content script received message:', typedMessage.type);

  // Handle async operations properly
  (async () => {
    try {
      switch (typedMessage.type) {
        case MessageTypes.CAPTURE_CONVERSATION: {
          console.log('[Distill] Starting conversation capture...');
          const capturedData = await buildCapturedConversation();
          console.log('[Distill] Conversation captured:', capturedData.messages.length, 'messages');

          // Send back to background script
          browser.runtime
            .sendMessage({
              type: MessageTypes.CONVERSATION_CAPTURED,
              payload: capturedData,
              source: 'content',
              timestamp: Date.now(),
            })
            .catch((err) => {
              console.warn('[Distill] Failed to send to background:', err);
            });

          sendResponse({ success: true, data: capturedData });
          break;
        }

        case MessageTypes.OPEN_CAPTURE_MODAL: {
          await openCaptureModal();
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
          const messages = await extractConversation();

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
          console.warn('[Distill] Unknown message type:', typedMessage.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Distill] Error handling message:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();

  return true; // Keep message channel open for async response
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
