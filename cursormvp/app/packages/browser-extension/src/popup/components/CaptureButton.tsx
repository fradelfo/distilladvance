import React from 'react';
import type { ConversationSource } from '@distill/shared-types';

interface CaptureButtonProps {
  onClick: () => void;
  disabled?: boolean;
  platform: ConversationSource | null;
  isLoading?: boolean;
}

export function CaptureButton({
  onClick,
  disabled = false,
  platform,
  isLoading = false,
}: CaptureButtonProps): React.ReactElement {
  const platformColor = getPlatformColor(platform);

  return (
    <button
      type="button"
      className="capture-button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={`Capture ${platform || 'AI'} conversation`}
      style={
        {
          '--platform-color': platformColor,
        } as React.CSSProperties
      }
    >
      {isLoading ? (
        <>
          <span className="capture-spinner" aria-hidden="true" />
          <span>Capturing...</span>
        </>
      ) : (
        <>
          <span className="capture-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </span>
          <span>Capture Conversation</span>
        </>
      )}

      <style>{`
        .capture-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .capture-button:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .capture-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
        }

        .capture-button:disabled {
          background: var(--color-gray-300);
          cursor: not-allowed;
          box-shadow: none;
        }

        .capture-button:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }

        .capture-icon {
          display: flex;
          align-items: center;
        }

        .capture-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .capture-spinner {
            animation: none;
            border-top-color: rgba(255, 255, 255, 0.6);
          }
        }
      `}</style>
    </button>
  );
}

function getPlatformColor(platform: ConversationSource | null): string {
  switch (platform) {
    case 'chatgpt':
      return '#10a37f';
    case 'claude':
      return '#d97706';
    case 'gemini':
      return '#4285f4';
    case 'copilot':
      return '#0078d4';
    default:
      return '#6366f1';
  }
}
