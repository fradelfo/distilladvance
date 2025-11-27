'use client';

/**
 * WorkspaceCard Component
 *
 * Displays a workspace summary in a card format.
 */

import Link from 'next/link';

interface WorkspaceCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  memberCount: number;
  promptCount: number;
  joinedAt: Date;
}

export function WorkspaceCard({
  name,
  slug,
  description,
  image,
  role,
  memberCount,
  promptCount,
  joinedAt,
}: WorkspaceCardProps) {
  const roleColors = {
    OWNER: 'bg-amber-50 text-amber-700',
    ADMIN: 'bg-purple-50 text-purple-700',
    MEMBER: 'bg-neutral-100 text-neutral-600',
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/workspaces/${slug}`} className="block">
      <article className="card p-5 hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Workspace Icon/Image */}
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-900 line-clamp-1">
              {name}
            </h3>
            <p className="text-sm text-neutral-500">/{slug}</p>
          </div>
          <span
            className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[role]}`}
          >
            {role.charAt(0) + role.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>{memberCount} members</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{promptCount} prompts</span>
          </div>
        </div>

        {/* Joined date */}
        <p className="text-xs text-neutral-400 mt-2">
          Joined {formatDate(joinedAt)}
        </p>
      </article>
    </Link>
  );
}

/**
 * WorkspaceCardSkeleton
 */
export function WorkspaceCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-neutral-200" />
        <div className="flex-1">
          <div className="h-5 bg-neutral-200 rounded w-3/4 mb-1" />
          <div className="h-4 bg-neutral-100 rounded w-1/2" />
        </div>
        <div className="h-5 bg-neutral-100 rounded-full w-16" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-2/3" />
      </div>
      <div className="flex gap-4 pt-4 border-t border-neutral-100">
        <div className="h-4 bg-neutral-100 rounded w-24" />
        <div className="h-4 bg-neutral-100 rounded w-20" />
      </div>
    </div>
  );
}
