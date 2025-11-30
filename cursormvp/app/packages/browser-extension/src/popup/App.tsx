import React, { useEffect, useState, useCallback } from 'react';
import { CaptureButton } from './components/CaptureButton';
import { CaptureModal } from './components/CaptureModal';
import { StatusBadge } from './components/StatusBadge';
import { StatsPanel } from './components/StatsPanel';
import { sendMessage, MessageTypes, type AuthStatusPayload } from '../shared/messages';
import { urls, config } from '../shared/config';
import type { CapturedConversation, ConversationSource } from '@distill/shared-types';

type PageStatus = 'unsupported' | 'supported' | 'loading' | 'error';

interface AppState {
  pageStatus: PageStatus;
  platform: ConversationSource | null;
  isAuthenticated: boolean;
  captureModalOpen: boolean;
  conversation: CapturedConversation | null;
  stats: {
    promptsSaved: number;
    lastCapture: string | null;
  };
}

export function App(): React.ReactElement {
  const [state, setState] = useState<AppState>({
    pageStatus: 'loading',
    platform: null,
    isAuthenticated: false,
    captureModalOpen: false,
    conversation: null,
    stats: {
      promptsSaved: 0,
      lastCapture: null,
    },
  });

  const checkCurrentPage = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) {
        setState((prev) => ({ ...prev, pageStatus: 'unsupported', platform: null }));
        return;
      }

      const url = tab.url;
      let platform: ConversationSource | null = null;

      if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
        platform = 'chatgpt';
      } else if (url.includes('claude.ai')) {
        platform = 'claude';
      } else if (url.includes('gemini.google.com')) {
        platform = 'gemini';
      } else if (url.includes('copilot.microsoft.com')) {
        platform = 'copilot';
      }

      setState((prev) => ({
        ...prev,
        pageStatus: platform ? 'supported' : 'unsupported',
        platform,
      }));
    } catch (error) {
      console.error('[Distill] Error checking page:', error);
      setState((prev) => ({ ...prev, pageStatus: 'error' }));
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await sendMessage<object, AuthStatusPayload>(MessageTypes.AUTH_STATUS, {});
      setState((prev) => ({
        ...prev,
        isAuthenticated: response?.authenticated ?? false,
      }));
    } catch (error) {
      console.error('[Distill] Error checking auth:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get(['promptsSaved', 'lastCapture']);
      setState((prev) => ({
        ...prev,
        stats: {
          promptsSaved: result.promptsSaved || 0,
          lastCapture: result.lastCapture || null,
        },
      }));
    } catch (error) {
      console.error('[Distill] Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    checkCurrentPage();
    checkAuthStatus();
    loadStats();
  }, [checkCurrentPage, checkAuthStatus, loadStats]);

  const handleCaptureClick = async () => {
    console.log('[Distill] Capture clicked, pageStatus:', state.pageStatus);
    if (state.pageStatus !== 'supported') {
      console.log('[Distill] Page not supported, aborting');
      return;
    }

    setState((prev) => ({ ...prev, captureModalOpen: true, conversation: null }));

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('[Distill] Active tab:', tab?.id, tab?.url);
      if (!tab?.id) {
        console.log('[Distill] No tab ID found');
        alert('Could not find active tab. Please try again.');
        setState((prev) => ({ ...prev, captureModalOpen: false }));
        return;
      }

      console.log('[Distill] Sending CAPTURE_CONVERSATION message to tab', tab.id);

      // Add timeout to the message
      const messagePromise = chrome.tabs.sendMessage(tab.id, {
        type: MessageTypes.CAPTURE_CONVERSATION,
        payload: {},
        source: 'popup',
        timestamp: Date.now(),
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout waiting for conversation data')), 15000)
      );

      const response = await Promise.race([messagePromise, timeoutPromise]);

      console.log('[Distill] Response from content script:', response);
      console.log('[Distill] Response type:', typeof response);
      console.log('[Distill] Response success:', response?.success);
      console.log('[Distill] Response data:', response?.data);

      if (response?.success && response.data) {
        console.log('[Distill] Got conversation data:', response.data.messages?.length, 'messages');
        setState((prev) => ({
          ...prev,
          conversation: response.data,
        }));
      } else {
        console.warn('[Distill] Invalid response format:', response);
        alert('Failed to capture conversation. The conversation data was empty or invalid. Please try again.');
        setState((prev) => ({ ...prev, captureModalOpen: false, conversation: null }));
      }
    } catch (error) {
      console.error('[Distill] Error capturing:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('Timeout')) {
        alert('Timeout while capturing conversation. This page may have a very long conversation. Please try again or refresh the page.');
      } else if (errorMessage.includes('Could not establish connection')) {
        alert('Content script not loaded. Please refresh the AI chat page and try again.');
      } else {
        alert(`Error capturing conversation: ${errorMessage}`);
      }

      setState((prev) => ({
        ...prev,
        captureModalOpen: false,
        conversation: null,
      }));
    }
  };

  const handleModalClose = () => {
    setState((prev) => ({
      ...prev,
      captureModalOpen: false,
      conversation: null,
    }));
  };

  const handleDistillComplete = () => {
    setState((prev) => ({
      ...prev,
      captureModalOpen: false,
      conversation: null,
      stats: {
        ...prev.stats,
        promptsSaved: prev.stats.promptsSaved + 1,
        lastCapture: new Date().toISOString(),
      },
    }));

    // Persist stats
    chrome.storage.local.set({
      promptsSaved: state.stats.promptsSaved + 1,
      lastCapture: new Date().toISOString(),
    });
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: urls.dashboard });
  };

  const openLogin = () => {
    chrome.tabs.create({ url: urls.login });
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">D</div>
            <span className="logo-text">Distill</span>
          </div>
          <StatusBadge status={state.pageStatus} platform={state.platform} />
        </div>
      </header>

      {/* Main Content */}
      <main className="popup-main">
        {/* Capture Section */}
        <section className="capture-section">
          {state.pageStatus === 'supported' ? (
            <>
              <p className="section-description">
                Capture and distill this {getPlatformName(state.platform)} conversation into a
                reusable prompt template.
              </p>
              <CaptureButton
                onClick={handleCaptureClick}
                disabled={!state.isAuthenticated}
                platform={state.platform}
              />
              {!state.isAuthenticated && (
                <button type="button" className="login-prompt" onClick={openLogin}>
                  Log in to capture conversations
                </button>
              )}
            </>
          ) : (
            <div className="unsupported-message">
              <div className="unsupported-icon">!</div>
              <p>Not a supported AI chat page</p>
              <p className="unsupported-hint">
                Navigate to ChatGPT, Claude, Gemini, or Copilot to capture conversations.
              </p>
            </div>
          )}
        </section>

        {/* Stats Section */}
        <StatsPanel promptsSaved={state.stats.promptsSaved} lastCapture={state.stats.lastCapture} />

        {/* Quick Actions */}
        <section className="actions-section">
          <button type="button" className="action-button" onClick={openDashboard}>
            <span className="action-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </span>
            Open Dashboard
            <span className="action-arrow">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </span>
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="popup-footer">
        <span>v0.1.0</span>
        <a href={config.helpUrl} target="_blank" rel="noopener noreferrer">
          Help
        </a>
      </footer>

      {/* Capture Modal */}
      {state.captureModalOpen && (
        <CaptureModal
          isOpen={state.captureModalOpen}
          conversation={state.conversation}
          onClose={handleModalClose}
          onDistillComplete={handleDistillComplete}
        />
      )}

      <style>{`
        .popup-container {
          display: flex;
          flex-direction: column;
          min-height: 480px;
          background: var(--color-gray-50);
        }

        .popup-header {
          background: white;
          border-bottom: 1px solid var(--color-gray-200);
          padding: 12px 16px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-icon {
          width: 28px;
          height: 28px;
          background: var(--color-primary-500);
          color: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }

        .logo-text {
          font-weight: 600;
          font-size: 16px;
          color: var(--color-gray-900);
        }

        .popup-main {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .capture-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--color-gray-200);
        }

        .section-description {
          color: var(--color-gray-600);
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .login-prompt {
          display: block;
          width: 100%;
          margin-top: 12px;
          padding: 8px;
          background: none;
          border: 1px dashed var(--color-gray-300);
          border-radius: 6px;
          color: var(--color-primary-600);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .login-prompt:hover {
          background: var(--color-gray-50);
          border-color: var(--color-primary-400);
        }

        .unsupported-message {
          text-align: center;
          padding: 20px 0;
        }

        .unsupported-icon {
          width: 40px;
          height: 40px;
          margin: 0 auto 12px;
          background: var(--color-gray-100);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-gray-400);
          font-size: 20px;
          font-weight: 600;
        }

        .unsupported-message p {
          color: var(--color-gray-600);
          font-size: 14px;
        }

        .unsupported-hint {
          margin-top: 8px;
          font-size: 12px !important;
          color: var(--color-gray-500) !important;
        }

        .actions-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 14px;
          background: white;
          border: 1px solid var(--color-gray-200);
          border-radius: 8px;
          color: var(--color-gray-700);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-button:hover {
          background: var(--color-gray-50);
          border-color: var(--color-gray-300);
        }

        .action-icon {
          color: var(--color-gray-500);
        }

        .action-arrow {
          margin-left: auto;
          color: var(--color-gray-400);
        }

        .popup-footer {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--color-gray-400);
          border-top: 1px solid var(--color-gray-100);
        }

        .popup-footer a {
          color: var(--color-gray-500);
          text-decoration: none;
        }

        .popup-footer a:hover {
          color: var(--color-primary-600);
        }
      `}</style>
    </div>
  );
}

function getPlatformName(platform: ConversationSource | null): string {
  switch (platform) {
    case 'chatgpt':
      return 'ChatGPT';
    case 'claude':
      return 'Claude';
    case 'gemini':
      return 'Gemini';
    case 'copilot':
      return 'Copilot';
    default:
      return 'AI';
  }
}
