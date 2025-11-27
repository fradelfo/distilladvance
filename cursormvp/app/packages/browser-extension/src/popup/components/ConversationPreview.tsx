import React from 'react';
import type { ConversationMessage } from '@distill/shared-types';

interface ConversationPreviewProps {
  messages: ConversationMessage[];
  isLoading?: boolean;
  maxMessages?: number;
  maxContentLength?: number;
}

export function ConversationPreview({
  messages,
  isLoading = false,
  maxMessages = 3,
  maxContentLength = 100,
}: ConversationPreviewProps): React.ReactElement {
  const displayMessages = messages.slice(0, maxMessages);
  const remainingCount = messages.length - maxMessages;

  if (isLoading) {
    return (
      <div className="preview-container" aria-busy="true" aria-label="Loading conversation preview">
        <div className="preview-label">Preview</div>
        <div className="preview-skeleton">
          <div className="skeleton-message">
            <div className="skeleton-role" />
            <div className="skeleton-content" />
          </div>
          <div className="skeleton-message">
            <div className="skeleton-role" />
            <div className="skeleton-content" />
          </div>
          <div className="skeleton-message">
            <div className="skeleton-role" />
            <div className="skeleton-content short" />
          </div>
        </div>

        <style>{skeletonStyles}</style>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="preview-container">
        <div className="preview-label">Preview</div>
        <div className="preview-empty">
          <span className="empty-icon">!</span>
          <p>No messages found in this conversation.</p>
        </div>

        <style>{containerStyles}</style>
      </div>
    );
  }

  return (
    <div
      className="preview-container"
      role="list"
      aria-label={`Preview of ${messages.length} messages, showing first ${Math.min(messages.length, maxMessages)}`}
    >
      <div className="preview-label">Preview</div>
      <div className="preview-messages">
        {displayMessages.map((message, index) => (
          <div key={message.id || index} className="message-item" role="listitem">
            <span className={`message-role ${message.role}`}>
              {message.role === 'user' ? 'You' : 'AI'}
            </span>
            <p className="message-content">{truncateText(message.content, maxContentLength)}</p>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="more-messages" aria-label={`${remainingCount} more messages not shown`}>
            + {remainingCount} more message{remainingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <style>{containerStyles}</style>
    </div>
  );
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

const containerStyles = `
  .preview-container {
    background: var(--color-gray-50);
    border: 1px solid var(--color-gray-200);
    border-radius: 10px;
    overflow: hidden;
  }

  .preview-label {
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--color-gray-200);
    background: white;
  }

  .preview-messages {
    max-height: 200px;
    overflow-y: auto;
    padding: 8px;
  }

  .message-item {
    padding: 10px 12px;
    background: white;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .message-item:last-of-type {
    margin-bottom: 0;
  }

  .message-role {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 4px;
  }

  .message-role.user {
    color: var(--color-primary-600);
  }

  .message-role.assistant {
    color: var(--color-gray-500);
  }

  .message-content {
    font-size: 13px;
    color: var(--color-gray-700);
    line-height: 1.4;
    margin: 0;
    word-break: break-word;
  }

  .more-messages {
    padding: 10px;
    text-align: center;
    font-size: 12px;
    color: var(--color-gray-400);
    border-top: 1px dashed var(--color-gray-200);
    margin-top: 6px;
  }

  .preview-empty {
    padding: 24px;
    text-align: center;
  }

  .empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-warning-500);
    color: white;
    border-radius: 50%;
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 8px;
  }

  .preview-empty p {
    color: var(--color-gray-500);
    font-size: 13px;
    margin: 0;
  }
`;

const skeletonStyles = `
  ${containerStyles}

  .preview-skeleton {
    padding: 8px;
  }

  .skeleton-message {
    padding: 10px 12px;
    background: white;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .skeleton-role {
    width: 32px;
    height: 12px;
    background: var(--color-gray-200);
    border-radius: 4px;
    margin-bottom: 8px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-content {
    height: 14px;
    background: var(--color-gray-100);
    border-radius: 4px;
    animation: pulse 1.5s ease-in-out infinite;
    animation-delay: 0.1s;
  }

  .skeleton-content.short {
    width: 70%;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton-role,
    .skeleton-content {
      animation: none;
    }
  }
`;
