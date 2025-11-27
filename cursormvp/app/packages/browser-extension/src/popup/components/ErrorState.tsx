import React, { useState, useEffect } from 'react';

interface ErrorStateProps {
  error: {
    code: string;
    message: string;
  };
  onRetry: () => void;
  onDismiss: () => void;
  retryCountdown?: number | null;
}

const ERROR_MESSAGES: Record<string, { title: string; message: string; canRetry: boolean }> = {
  NETWORK_ERROR: {
    title: 'Connection failed',
    message: "Couldn't connect to Distill servers. Check your internet and try again.",
    canRetry: true,
  },
  AUTH_EXPIRED: {
    title: 'Session expired',
    message: 'Please log in again to continue.',
    canRetry: false,
  },
  EXTRACTION_FAILED: {
    title: "Couldn't read chat",
    message: 'Try refreshing the page and capturing again.',
    canRetry: true,
  },
  DISTILL_FAILED: {
    title: 'Distillation failed',
    message: "Our AI couldn't process this conversation. Please try again.",
    canRetry: true,
  },
  RATE_LIMITED: {
    title: 'Too many requests',
    message: 'Please wait a moment before trying again.',
    canRetry: true,
  },
  CONVERSATION_TOO_SHORT: {
    title: 'Not enough content',
    message: 'Add more messages to the conversation before capturing.',
    canRetry: false,
  },
};

export function ErrorState({
  error,
  onRetry,
  onDismiss,
  retryCountdown = null,
}: ErrorStateProps): React.ReactElement {
  const [countdown, setCountdown] = useState(retryCountdown);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          onRetry();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onRetry]);

  const errorConfig = ERROR_MESSAGES[error.code] || {
    title: 'Something went wrong',
    message: error.message || 'An unexpected error occurred.',
    canRetry: true,
  };

  const handleCopyError = async () => {
    const errorDetails = `Error: ${error.code}\nMessage: ${error.message}`;
    await navigator.clipboard.writeText(errorDetails);
  };

  return (
    <div className="error-container" role="alert">
      {/* Error Icon */}
      <div className="error-icon" aria-hidden="true">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Error Message */}
      <h3 className="error-title">{errorConfig.title}</h3>
      <p className="error-message">{errorConfig.message}</p>

      {/* Error Details (Collapsible) */}
      <details className="error-details">
        <summary>Error details</summary>
        <div className="error-code">
          <code>Error code: {error.code}</code>
          <button
            type="button"
            className="copy-button"
            onClick={handleCopyError}
            aria-label="Copy error details"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </details>

      {/* Actions */}
      <div className="error-actions">
        <button type="button" className="btn-secondary" onClick={onDismiss}>
          Dismiss
        </button>
        {errorConfig.canRetry && (
          <button
            type="button"
            className="btn-primary"
            onClick={onRetry}
            disabled={countdown !== null && countdown > 0}
            autoFocus
          >
            {countdown !== null && countdown > 0 ? `Retry in ${countdown}s` : 'Try Again'}
          </button>
        )}
        {error.code === 'AUTH_EXPIRED' && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              chrome.tabs.create({ url: 'https://app.distill.ai/login' });
            }}
          >
            Log In
          </button>
        )}
      </div>

      <style>{`
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0;
          text-align: center;
        }

        .error-icon {
          width: 56px;
          height: 56px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-error-500);
          margin-bottom: 16px;
        }

        .error-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-gray-800);
          margin: 0 0 8px;
        }

        .error-message {
          font-size: 14px;
          color: var(--color-gray-600);
          margin: 0 0 16px;
          line-height: 1.5;
        }

        .error-details {
          width: 100%;
          background: var(--color-gray-50);
          border: 1px solid var(--color-gray-200);
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: left;
        }

        .error-details summary {
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-gray-500);
          cursor: pointer;
          user-select: none;
        }

        .error-details summary:hover {
          color: var(--color-gray-700);
        }

        .error-details[open] summary {
          border-bottom: 1px solid var(--color-gray-200);
        }

        .error-code {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
        }

        .error-code code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--color-gray-600);
        }

        .copy-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: white;
          border: 1px solid var(--color-gray-200);
          border-radius: 6px;
          color: var(--color-gray-500);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .copy-button:hover {
          background: var(--color-gray-50);
          color: var(--color-gray-700);
        }

        .error-actions {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: var(--color-primary-500);
          border: none;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-600);
        }

        .btn-primary:disabled {
          background: var(--color-gray-300);
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          border: 1px solid var(--color-gray-300);
          color: var(--color-gray-700);
        }

        .btn-secondary:hover {
          background: var(--color-gray-50);
          border-color: var(--color-gray-400);
        }

        .btn-primary:focus-visible,
        .btn-secondary:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
