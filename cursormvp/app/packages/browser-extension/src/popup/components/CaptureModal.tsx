import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConversationPreview } from './ConversationPreview';
import { PrivacyModeSelector } from './PrivacyModeSelector';
import { ProcessingState } from './ProcessingState';
import { SuccessState } from './SuccessState';
import { ErrorState } from './ErrorState';
import { sendMessage, MessageTypes, type MessageResponse } from '../../shared/messages';
import type { CapturedConversation, DistillResult } from '@distill/shared-types';

type ModalState = 'preview' | 'processing' | 'success' | 'error';
type PrivacyMode = 'prompt-only' | 'full';

interface CaptureModalProps {
  isOpen: boolean;
  conversation: CapturedConversation | null;
  onClose: () => void;
  onDistillComplete: () => void;
}

export function CaptureModal({
  isOpen,
  conversation,
  onClose,
  onDistillComplete,
}: CaptureModalProps): React.ReactElement | null {
  const [modalState, setModalState] = useState<ModalState>('preview');
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('prompt-only');
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [result, setResult] = useState<DistillResult | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap and accessibility
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && modalState !== 'processing') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, modalState, onClose]);

  const handleDistill = useCallback(async () => {
    if (!conversation) return;

    setModalState('processing');
    setProgress(0);
    setProgressStep('Sending conversation...');

    try {
      // Simulate progress updates
      const progressSteps = [
        { progress: 20, step: 'Analyzing conversation...' },
        { progress: 40, step: 'Extracting key prompts...' },
        { progress: 70, step: 'Generating template...' },
        { progress: 90, step: 'Finalizing...' },
      ];

      for (const step of progressSteps) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setProgress(step.progress);
        setProgressStep(step.step);
      }

      // Send distill request
      const response = await sendMessage<object, MessageResponse>(MessageTypes.DISTILL_REQUEST, {
        messages: conversation.messages,
        privacyMode,
        options: {
          preserveContext: privacyMode === 'full',
        },
      });

      if (response?.success) {
        setProgress(100);
        setProgressStep('Complete!');
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Mock result for now
        setResult({
          promptId: 'prompt-' + Date.now(),
          content: 'Generated prompt template...',
          title: conversation.title || 'Untitled Prompt',
          tags: ['generated'],
          metadata: {
            originalLength: conversation.messages.length,
            distilledLength: 1,
          },
        });
        setModalState('success');
      } else {
        throw new Error(response?.error?.message || 'Distillation failed');
      }
    } catch (err) {
      console.error('[Distill] Error during distillation:', err);
      setError({
        code: 'DISTILL_FAILED',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      setModalState('error');
    }
  }, [conversation, privacyMode]);

  const handleRetry = () => {
    setError(null);
    setModalState('preview');
  };

  const handleViewEdit = () => {
    if (result?.promptId) {
      chrome.tabs.create({
        url: `https://app.distill.ai/prompts/${result.promptId}`,
      });
    }
    onDistillComplete();
  };

  const handleCaptureAnother = () => {
    onDistillComplete();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && modalState !== 'processing') {
          onClose();
        }
      }}
    >
      <div className="modal-container" ref={modalRef} tabIndex={-1}>
        {/* Header */}
        <header className="modal-header">
          <div className="modal-title-section">
            <div className="modal-icon">D</div>
            <h2 id="modal-title" className="modal-title">
              {modalState === 'success'
                ? 'Prompt Created!'
                : modalState === 'error'
                  ? 'Something went wrong'
                  : 'Distill this conversation'}
            </h2>
          </div>
          {modalState !== 'processing' && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </header>

        {/* Content */}
        <div className="modal-content">
          {modalState === 'preview' && (
            <>
              <ConversationPreview
                messages={conversation?.messages || []}
                isLoading={!conversation}
              />
              <PrivacyModeSelector value={privacyMode} onChange={setPrivacyMode} />
            </>
          )}

          {modalState === 'processing' && (
            <ProcessingState progress={progress} step={progressStep} />
          )}

          {modalState === 'success' && result && (
            <SuccessState
              result={result}
              onViewEdit={handleViewEdit}
              onCaptureAnother={handleCaptureAnother}
            />
          )}

          {modalState === 'error' && error && (
            <ErrorState error={error} onRetry={handleRetry} onDismiss={onClose} />
          )}
        </div>

        {/* Footer - only show in preview state */}
        {modalState === 'preview' && (
          <footer className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDistill}
              disabled={!conversation}
            >
              Distill
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </footer>
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-container {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.2s ease;
          outline: none;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-gray-100);
        }

        .modal-title-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-icon {
          width: 32px;
          height: 32px;
          background: var(--color-primary-500);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }

        .modal-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-gray-900);
          margin: 0;
        }

        .modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          border-radius: 6px;
          color: var(--color-gray-400);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-600);
        }

        .modal-close:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid var(--color-gray-100);
        }

        .btn-secondary {
          padding: 10px 18px;
          background: white;
          border: 1px solid var(--color-gray-300);
          border-radius: 8px;
          color: var(--color-gray-700);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background: var(--color-gray-50);
          border-color: var(--color-gray-400);
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: var(--color-primary-500);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-600);
        }

        .btn-primary:disabled {
          background: var(--color-gray-300);
          cursor: not-allowed;
        }

        .btn-secondary:focus-visible,
        .btn-primary:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .modal-overlay,
          .modal-container {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
