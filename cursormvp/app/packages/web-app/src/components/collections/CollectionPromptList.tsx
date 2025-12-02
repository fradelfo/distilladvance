'use client';

/**
 * CollectionPromptList Component
 *
 * Displays a list of prompts within a collection with actions.
 */

import Link from 'next/link';
import { TagChip } from '../TagFilter';

interface PromptItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  order: number;
}

interface CollectionPromptListProps {
  /** List of prompts in the collection */
  prompts: PromptItem[];
  /** Whether the current user can edit the collection */
  canEdit?: boolean;
  /** Whether the list is in loading state */
  isLoading?: boolean;
  /** Called when a prompt is removed from the collection */
  onRemovePrompt?: (promptId: string) => void;
  /** Called when prompts are reordered */
  onReorder?: (promptIds: string[]) => void;
  /** Called when user wants to browse library to add prompts */
  onBrowseLibrary?: () => void;
}

export function CollectionPromptList({
  prompts,
  canEdit = false,
  isLoading = false,
  onRemovePrompt,
  onBrowseLibrary,
}: CollectionPromptListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + '...';
  };

  if (prompts.length === 0 && !isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-4">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">No prompts in this collection</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {canEdit
            ? 'Add prompts from your library to organize them here.'
            : 'This collection is empty.'}
        </p>
        {canEdit && onBrowseLibrary && (
          <button
            onClick={onBrowseLibrary}
            className="inline-flex items-center gap-2 mt-4 btn-primary px-4 py-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Browse Library
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <article
          key={prompt.id}
          className="card p-4 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Prompt Content */}
            <div className="flex-1 min-w-0">
              <Link href={`/prompts/${prompt.id}`} className="block hover:text-primary-600">
                <h4 className="text-base font-semibold text-foreground line-clamp-1">
                  {prompt.title}
                </h4>
              </Link>

              {/* Preview of content */}
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {truncateContent(prompt.content)}
              </p>

              {/* Tags */}
              {prompt.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {prompt.tags.slice(0, 4).map((tag) => (
                    <TagChip key={tag} tag={tag} size="sm" />
                  ))}
                  {prompt.tags.length > 4 && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                      +{prompt.tags.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Meta info */}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1" title="Usage count">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
                  {prompt.usageCount} uses
                </span>
                <span>Updated {formatDate(prompt.updatedAt)}</span>
                {prompt.isPublic && (
                  <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600">
                    Public
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/prompts/${prompt.id}?run=true`}
                className="p-2 rounded-md text-muted-foreground hover:text-primary-600 hover:bg-primary-50"
                title="Run prompt"
                aria-label="Run prompt"
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
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </Link>
              {canEdit && (
                <button
                  onClick={() => onRemovePrompt?.(prompt.id)}
                  className="p-2 rounded-md text-muted-foreground hover:text-error-600 hover:bg-error-50"
                  title="Remove from collection"
                  aria-label="Remove prompt from collection"
                  disabled={isLoading}
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
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * CollectionPromptListSkeleton Component
 *
 * Loading skeleton for the CollectionPromptList.
 */
export function CollectionPromptListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="space-y-2 mb-3">
                <div className="h-4 bg-secondary rounded w-full" />
                <div className="h-4 bg-secondary rounded w-5/6" />
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-5 bg-secondary rounded-full w-16" />
                <div className="h-5 bg-secondary rounded-full w-20" />
              </div>
              <div className="flex gap-4">
                <div className="h-4 bg-secondary rounded w-16" />
                <div className="h-4 bg-secondary rounded w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-9 bg-secondary rounded" />
              <div className="h-9 w-9 bg-secondary rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
