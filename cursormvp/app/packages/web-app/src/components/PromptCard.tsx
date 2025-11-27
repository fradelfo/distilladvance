'use client';

/**
 * PromptCard Component
 *
 * Displays a prompt summary in a card format with quick actions.
 */

import Link from 'next/link';
import { TagChip } from './TagFilter';

interface PromptCardProps {
  /** Prompt ID */
  id: string;
  /** Prompt title */
  title: string;
  /** Prompt description (optional) */
  description?: string;
  /** Associated tags */
  tags: string[];
  /** Number of times the prompt has been used */
  usageCount: number;
  /** Whether the prompt is public */
  isPublic: boolean;
  /** Creation date */
  createdAt: Date;
  /** Last updated date */
  updatedAt: Date;
  /** Callback for copy action */
  onCopy?: (id: string) => void;
  /** Callback for run action */
  onRun?: (id: string) => void;
  /** Callback for edit action */
  onEdit?: (id: string) => void;
}

export function PromptCard({
  id,
  title,
  description,
  tags,
  usageCount,
  isPublic,
  createdAt,
  updatedAt,
  onCopy,
  onRun,
  onEdit,
}: PromptCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCopy?.(id);
  };

  const handleRun = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRun?.(id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(id);
  };

  return (
    <Link href={`/prompts/${id}`} className="block">
      <article className="card p-4 hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-neutral-900 line-clamp-1">
            {title}
          </h3>
          {isPublic && (
            <span className="flex-shrink-0 inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600">
              Public
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <TagChip key={tag} tag={tag} size="sm" />
            ))}
            {tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs text-neutral-400">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1" title="Usage count">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {usageCount}
            </span>
            <span title={`Updated ${updatedAt.toLocaleDateString()}`}>
              {formatDate(updatedAt)}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              title="Copy prompt"
              aria-label="Copy prompt"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              onClick={handleRun}
              className="p-1.5 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
              title="Run prompt"
              aria-label="Run prompt"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleEdit}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              title="Edit prompt"
              aria-label="Edit prompt"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

/**
 * PromptCardSkeleton Component
 *
 * Loading skeleton for the PromptCard.
 */
export function PromptCardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="h-5 bg-neutral-200 rounded w-3/4" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-5/6" />
      </div>

      {/* Tags */}
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 bg-neutral-100 rounded-full w-16" />
        <div className="h-5 bg-neutral-100 rounded-full w-20" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className="flex gap-3">
          <div className="h-4 bg-neutral-100 rounded w-8" />
          <div className="h-4 bg-neutral-100 rounded w-16" />
        </div>
        <div className="flex gap-1">
          <div className="h-7 w-7 bg-neutral-100 rounded" />
          <div className="h-7 w-7 bg-neutral-100 rounded" />
          <div className="h-7 w-7 bg-neutral-100 rounded" />
        </div>
      </div>
    </div>
  );
}
