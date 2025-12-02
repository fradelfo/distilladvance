import type { ConversationSource } from '@distill/shared-types';
import type React from 'react';

type PageStatus = 'unsupported' | 'supported' | 'loading' | 'error';

interface StatusBadgeProps {
  status: PageStatus;
  platform: ConversationSource | null;
}

export function StatusBadge({ status, platform }: StatusBadgeProps): React.ReactElement {
  const { icon, text, className } = getStatusConfig(status, platform);

  return (
    <div className={`status-badge ${className}`} role="status" aria-live="polite">
      <span className="status-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="status-text">{text}</span>

      <style>{`
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.supported {
          background: rgba(34, 197, 94, 0.1);
          color: #15803d;
        }

        .status-badge.unsupported {
          background: var(--color-gray-100);
          color: var(--color-gray-500);
        }

        .status-badge.loading {
          background: var(--color-gray-100);
          color: var(--color-gray-500);
        }

        .status-badge.error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .status-icon {
          display: flex;
          align-items: center;
          font-size: 10px;
        }

        .status-badge.loading .status-icon {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (prefers-reduced-motion: reduce) {
          .status-badge.loading .status-icon {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function getStatusConfig(
  status: PageStatus,
  platform: ConversationSource | null
): { icon: string; text: string; className: string } {
  switch (status) {
    case 'supported':
      return {
        icon: getPlatformIcon(platform),
        text: getPlatformName(platform),
        className: 'supported',
      };
    case 'loading':
      return {
        icon: '...',
        text: 'Detecting...',
        className: 'loading',
      };
    case 'error':
      return {
        icon: '!',
        text: 'Error',
        className: 'error',
      };
    default:
      return {
        icon: '-',
        text: 'Not supported',
        className: 'unsupported',
      };
  }
}

function getPlatformIcon(platform: ConversationSource | null): string {
  switch (platform) {
    case 'chatgpt':
      return 'GPT';
    case 'claude':
      return 'C';
    case 'gemini':
      return 'G';
    case 'copilot':
      return 'CP';
    default:
      return 'AI';
  }
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
      return 'AI Chat';
  }
}
