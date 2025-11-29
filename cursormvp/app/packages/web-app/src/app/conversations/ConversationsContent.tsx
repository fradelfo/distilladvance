'use client';

/**
 * ConversationsContent Component
 *
 * Client component that handles the interactive conversations list UI,
 * including filtering by source and privacy mode.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { trpc } from '@/lib/trpc';

// Source icons for different AI platforms
const sourceIcons: Record<string, string> = {
  chatgpt: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
  claude: 'https://www.anthropic.com/favicon.ico',
  gemini: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
  copilot: 'https://copilot.microsoft.com/favicon.ico',
  unknown: '',
};

// Human-readable source names
const sourceNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'Copilot',
  unknown: 'Unknown',
};

// Type for a conversation from the API
interface ConversationListItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string | null;
  privacyMode: 'PROMPT_ONLY' | 'FULL';
  createdAt: string;
  updatedAt: string;
  _count: {
    prompts: number;
  };
}

// Type for paginated response
interface ListConversationsPage {
  success: boolean;
  conversations: ConversationListItem[];
  nextCursor?: string;
}

export function ConversationsContent() {
  // Filter state
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [privacyFilter, setPrivacyFilter] = useState<string>('all');

  // Fetch conversations with tRPC
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.conversation.list.useInfiniteQuery(
    {
      limit: 20,
      source: sourceFilter !== 'all' ? sourceFilter : undefined,
      privacyMode: privacyFilter !== 'all' ? (privacyFilter as 'PROMPT_ONLY' | 'FULL') : undefined,
    },
    {
      getNextPageParam: (lastPage: ListConversationsPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Flatten paginated results
  const conversations = useMemo((): ConversationListItem[] => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page: ListConversationsPage) => page.conversations);
  }, [data]);

  // Get unique sources for filtering
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    conversations.forEach((conv) => sources.add(conv.source));
    return Array.from(sources).sort();
  }, [conversations]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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

  // Empty state for no conversations
  if (!isLoading && conversations.length === 0 && sourceFilter === 'all' && privacyFilter === 'all') {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Conversations</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Your captured AI conversations
            </p>
          </div>
        </div>

        <EmptyState
          icon="💬"
          title="No conversations yet"
          description="Start by capturing a conversation from ChatGPT, Claude, or other AI tools using the Distill browser extension."
          primaryAction={{
            label: 'Install Extension',
            href: 'https://chrome.google.com/webstore',
          }}
        />
      </div>
    );
  }

  // No search results
  const noFilterResults =
    !isLoading && conversations.length === 0 && (sourceFilter !== 'all' || privacyFilter !== 'all');

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Conversations</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="source-filter" className="text-sm font-medium text-neutral-700">
            Source:
          </label>
          <select
            id="source-filter"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map((source) => (
              <option key={source} value={source}>
                {sourceNames[source] || source}
              </option>
            ))}
          </select>
        </div>

        {/* Privacy Mode Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="privacy-filter" className="text-sm font-medium text-neutral-700">
            Privacy:
          </label>
          <select
            id="privacy-filter"
            value={privacyFilter}
            onChange={(e) => setPrivacyFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All</option>
            <option value="FULL">Full Content</option>
            <option value="PROMPT_ONLY">Prompt Only</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="card p-6 text-center">
          <p className="text-sm text-error-600">
            Failed to load conversations: {error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-outline px-4 py-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="card animate-pulse p-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-neutral-200" />
                  <div className="h-3 w-1/2 rounded bg-neutral-200" />
                </div>
                <div className="h-6 w-20 rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Filter Results */}
      {noFilterResults && (
        <EmptyState
          icon="🔍"
          title="No conversations found"
          description="No conversations match your current filters."
          secondaryAction={{
            label: 'Clear filters',
            onClick: () => {
              setSourceFilter('all');
              setPrivacyFilter('all');
            },
          }}
        />
      )}

      {/* Conversations List */}
      {!isLoading && !noFilterResults && conversations.length > 0 && (
        <>
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="card block p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {/* Source Icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    {sourceIcons[conversation.source] ? (
                      <img
                        src={sourceIcons[conversation.source]}
                        alt={sourceNames[conversation.source] || conversation.source}
                        className="h-6 w-6"
                      />
                    ) : (
                      <span className="text-lg">💬</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-neutral-900">
                      {conversation.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                      <span>{sourceNames[conversation.source] || conversation.source}</span>
                      <span>·</span>
                      <span>{formatDate(conversation.createdAt)}</span>
                      {conversation._count.prompts > 0 && (
                        <>
                          <span>·</span>
                          <span>{conversation._count.prompts} prompt{conversation._count.prompts !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Privacy Badge */}
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      conversation.privacyMode === 'FULL'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {conversation.privacyMode === 'FULL' ? 'Full' : 'Prompt Only'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="mt-8 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn-outline px-6 py-2"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
