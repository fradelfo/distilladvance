'use client';

/**
 * RunPromptModal Component
 *
 * A modal dialog for running prompts with variable extraction and execution.
 * Allows users to fill in variable values, preview the filled prompt,
 * copy to clipboard, or open directly in AI chat platforms.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { extractVariables, fillVariables } from '@/lib/variables';

interface RunPromptModalProps {
  /** The prompt to run */
  prompt: {
    id: string;
    title: string;
    content: string;
  };
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

/**
 * URLs for opening prompts in AI chat platforms.
 * Some platforms support pre-filling the prompt via URL parameters.
 */
const AI_PLATFORM_URLS = {
  chatgpt: 'https://chat.openai.com/',
  claude: 'https://claude.ai/new',
} as const;

export function RunPromptModal({
  prompt,
  isOpen,
  onClose,
}: RunPromptModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Track usage mutation
  const incrementUsageMutation = trpc.distill.incrementUsage.useMutation();

  // Extract variables from prompt content
  const variables = useMemo(() => {
    return extractVariables(prompt.content);
  }, [prompt.content]);

  // Generate filled prompt
  const filledPrompt = useMemo(() => {
    return fillVariables(prompt.content, variableValues);
  }, [prompt.content, variableValues]);

  // Check if all variables are filled
  const allVariablesFilled = useMemo(() => {
    return variables.every((varName) => variableValues[varName]?.trim());
  }, [variables, variableValues]);

  // Reset state when modal opens/closes or prompt changes
  useEffect(() => {
    if (isOpen) {
      setVariableValues({});
      setCopied(false);
      // Focus first input after modal animation
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, prompt.id]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Handle variable input change
  const handleVariableChange = useCallback((name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Track usage and perform action
  const trackAndExecute = useCallback(
    async (action: () => void | Promise<void>) => {
      try {
        await incrementUsageMutation.mutateAsync({ id: prompt.id });
      } catch (error) {
        // Log error but don't block the action
        console.error('[RunPromptModal] Failed to track usage:', error);
      }
      await action();
    },
    [incrementUsageMutation, prompt.id]
  );

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    const textToCopy =
      variables.length > 0 && allVariablesFilled
        ? filledPrompt
        : prompt.content;

    await trackAndExecute(async () => {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [
    filledPrompt,
    prompt.content,
    variables.length,
    allVariablesFilled,
    trackAndExecute,
  ]);

  // Handle open in AI platform
  const handleOpenInPlatform = useCallback(
    async (platform: keyof typeof AI_PLATFORM_URLS) => {
      const textToCopy =
        variables.length > 0 && allVariablesFilled
          ? filledPrompt
          : prompt.content;

      await trackAndExecute(async () => {
        // Copy to clipboard first so user can paste
        await navigator.clipboard.writeText(textToCopy);
        // Open the platform in a new tab
        window.open(AI_PLATFORM_URLS[platform], '_blank', 'noopener,noreferrer');
      });
    },
    [
      filledPrompt,
      prompt.content,
      variables.length,
      allVariablesFilled,
      trackAndExecute,
    ]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-prompt-title"
    >
      <div
        ref={modalRef}
        className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col mx-4"
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2
            id="run-prompt-title"
            className="text-xl font-semibold text-neutral-900 truncate pr-4"
          >
            Run: {prompt.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Variables Section */}
          {variables.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">
                Fill in Variables
              </h3>
              <div className="space-y-4">
                {variables.map((varName, index) => (
                  <div key={varName}>
                    <label
                      htmlFor={`var-${varName}`}
                      className="block text-sm font-medium text-neutral-700 mb-1"
                    >
                      {varName}
                      <span className="text-error-500 ml-1" aria-hidden="true">
                        *
                      </span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      ref={index === 0 ? firstInputRef : undefined}
                      id={`var-${varName}`}
                      type="text"
                      value={variableValues[varName] || ''}
                      onChange={(e) =>
                        handleVariableChange(varName, e.target.value)
                      }
                      placeholder={`Enter value for ${varName}`}
                      className="input w-full"
                      aria-required="true"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Section */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-3">
              {variables.length > 0 ? 'Preview' : 'Prompt Content'}
            </h3>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono text-neutral-800">
                {variables.length > 0 ? filledPrompt : prompt.content}
              </pre>
            </div>
            {variables.length > 0 && !allVariablesFilled && (
              <p className="mt-2 text-sm text-amber-600" role="status">
                Fill in all variables to see the complete prompt.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-6 bg-neutral-50">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              disabled={variables.length > 0 && !allVariablesFilled}
              className={`btn-primary flex-1 px-4 py-2.5 flex items-center justify-center gap-2 ${
                variables.length > 0 && !allVariablesFilled
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              aria-disabled={variables.length > 0 && !allVariablesFilled}
            >
              {copied ? (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>

            {/* Open in ChatGPT Button */}
            <button
              onClick={() => handleOpenInPlatform('chatgpt')}
              disabled={variables.length > 0 && !allVariablesFilled}
              className={`btn-outline flex-1 px-4 py-2.5 flex items-center justify-center gap-2 ${
                variables.length > 0 && !allVariablesFilled
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              aria-disabled={variables.length > 0 && !allVariablesFilled}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
              </svg>
              Open in ChatGPT
            </button>

            {/* Open in Claude Button */}
            <button
              onClick={() => handleOpenInPlatform('claude')}
              disabled={variables.length > 0 && !allVariablesFilled}
              className={`btn-outline flex-1 px-4 py-2.5 flex items-center justify-center gap-2 ${
                variables.length > 0 && !allVariablesFilled
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              aria-disabled={variables.length > 0 && !allVariablesFilled}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4.709 15.955l4.72-2.647.08-.08-.08-.16-2.251-3.166c-1.073-1.594-2.226-3.347-2.306-3.507-.24-.479-.24-.958 0-1.277.24-.32.64-.48 1.12-.4.32.08.56.24.8.4.16.16 3.107 4.31 3.987 5.585l.24.32.72-.4 6.468-3.587c.64-.32 1.2-.64 1.68-.88.48-.24.88-.32 1.2-.24.56.16.88.56.88 1.04 0 .32-.08.64-.32.96-.24.32-.56.56-.96.72-.24.08-1.04.48-2.32 1.12l-5.268 2.887-.48.24.4.56c.88 1.197 3.587 4.87 3.667 4.95.48.56.56 1.12.24 1.6-.24.4-.72.64-1.28.56-.4-.08-.72-.24-1-.48-.16-.16-2.726-3.747-3.507-4.87l-.32-.48-.56.32-4.71 2.567c-.4.24-.72.4-1 .48-.56.16-1.04 0-1.36-.4-.24-.32-.24-.72-.08-1.12.08-.24.24-.48.48-.72.08-.08.72-.48 1.68-1.04z" />
              </svg>
              Open in Claude
            </button>
          </div>

          {variables.length > 0 && !allVariablesFilled && (
            <p className="mt-3 text-center text-sm text-neutral-500">
              Fill in all variables above to enable these actions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
