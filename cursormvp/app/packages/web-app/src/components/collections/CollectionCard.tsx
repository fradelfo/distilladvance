'use client';

/**
 * CollectionCard Component
 *
 * Displays a collection summary in a card format with quick actions.
 */

import Link from 'next/link';

interface CollectionCardProps {
  /** Collection ID */
  id: string;
  /** Collection name */
  name: string;
  /** Collection description (optional) */
  description?: string | null;
  /** Number of prompts in the collection */
  promptCount: number;
  /** Whether the collection is public */
  isPublic: boolean;
  /** Creation date */
  createdAt: Date;
  /** Last updated date */
  updatedAt: Date;
  /** Whether the current user owns this collection */
  isOwner?: boolean;
  /** Callback for edit action */
  onEdit?: (id: string) => void;
  /** Callback for delete action */
  onDelete?: (id: string) => void;
}

export function CollectionCard({
  id,
  name,
  description,
  promptCount,
  isPublic,
  createdAt,
  updatedAt,
  isOwner = true,
  onEdit,
  onDelete,
}: CollectionCardProps) {
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

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(id);
  };

  return (
    <Link href={`/collections/${id}`} className="block">
      <article className="card p-4 hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {/* Folder icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-neutral-900 line-clamp-1">
              {name}
            </h3>
          </div>
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

        {/* Prompt count badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
            {promptCount} prompt{promptCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span title={`Updated ${updatedAt.toLocaleDateString()}`}>
              Updated {formatDate(updatedAt)}
            </span>
          </div>

          {/* Quick Actions (only for owners) */}
          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                title="Edit collection"
                aria-label="Edit collection"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md text-neutral-400 hover:text-error-600 hover:bg-error-50"
                title="Delete collection"
                aria-label="Delete collection"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

/**
 * CollectionCardSkeleton Component
 *
 * Loading skeleton for the CollectionCard.
 */
export function CollectionCardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 bg-neutral-200 rounded-md" />
        <div className="h-5 bg-neutral-200 rounded w-3/4" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-5/6" />
      </div>

      {/* Badge */}
      <div className="mb-3">
        <div className="h-5 bg-neutral-100 rounded-full w-20" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className="h-4 bg-neutral-100 rounded w-24" />
        <div className="flex gap-1">
          <div className="h-7 w-7 bg-neutral-100 rounded" />
          <div className="h-7 w-7 bg-neutral-100 rounded" />
        </div>
      </div>
    </div>
  );
}
