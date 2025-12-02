'use client';

/**
 * ErrorWithRetry Component
 *
 * Displays an error message with a retry button for failed API calls.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorWithRetryProps {
  /** The error message to display */
  message: string;
  /** Callback when retry button is clicked */
  onRetry: () => void;
  /** Whether the retry is in progress */
  isRetrying?: boolean;
  /** Optional title for the error */
  title?: string;
  /** Optional className for additional styling */
  className?: string;
}

export function ErrorWithRetry({
  message,
  onRetry,
  isRetrying = false,
  title = 'Something went wrong',
  className = '',
}: ErrorWithRetryProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center ${className}`}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-12 w-12 text-destructive mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
      <Button onClick={onRetry} disabled={isRetrying} variant="outline" className="min-w-[120px]">
        {isRetrying ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Try Again
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Inline variant for use within cards/sections
 */
interface ErrorWithRetryInlineProps {
  /** The error message to display */
  message: string;
  /** Callback when retry button is clicked */
  onRetry: () => void;
  /** Whether the retry is in progress */
  isRetrying?: boolean;
}

export function ErrorWithRetryInline({
  message,
  onRetry,
  isRetrying = false,
}: ErrorWithRetryInlineProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" aria-hidden="true" />
        <p className="text-sm text-destructive">{message}</p>
      </div>
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        variant="ghost"
        size="sm"
        className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        {isRetrying ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Retry'}
      </Button>
    </div>
  );
}
