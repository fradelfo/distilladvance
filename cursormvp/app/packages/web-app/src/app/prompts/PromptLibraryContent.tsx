'use client';

/**
 * PromptLibraryContent Component
 *
 * Client component that handles the interactive prompt library UI,
 * including search, filtering, sorting, and displaying prompts.
 */

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PromptCard, PromptCardSkeleton } from '@/components/PromptCard';
import { PromptSearch } from '@/components/PromptSearch';
import { TagFilter } from '@/components/TagFilter';
import { SortSelect, type SortOption } from '@/components/SortSelect';
import { EmptyState } from '@/components/EmptyState';
import { ErrorWithRetry } from '@/components/ui/error-with-retry';
import { trpc } from '@/lib/trpc';

// Lazy load SemanticSearch - only loaded when user switches to semantic mode
const SemanticSearch = dynamic(
  () => import('@/components/prompts').then((mod) => ({ default: mod.SemanticSearch })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
    ssr: false,
  }
);

// View mode for the grid
type ViewMode = 'grid' | 'list';

// Search mode: browse (keyword) or semantic (meaning)
type SearchMode = 'browse' | 'semantic';

// Type for a prompt from the API (dates come as strings from tRPC)
interface PromptListItem {
  id: string;
  title: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Type for paginated response
interface ListPromptsPage {
  success: boolean;
  prompts: PromptListItem[];
  nextCursor?: string;
}

export function PromptLibraryContent() {
  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('browse');

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Fetch prompts with tRPC
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.distill.listPrompts.useInfiniteQuery(
    {
      limit: 20,
      search: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    },
    {
      getNextPageParam: (lastPage: ListPromptsPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Flatten paginated results
  const prompts = useMemo((): PromptListItem[] => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page: ListPromptsPage) => page.prompts);
  }, [data]);

  // Extract all unique tags from prompts for filtering
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts.forEach((prompt: PromptListItem) => {
      prompt.tags.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [prompts]);

  // Sort prompts client-side
  const sortedPrompts = useMemo(() => {
    const sorted = [...prompts];
    switch (sortBy) {
      case 'recent':
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'most_used':
        sorted.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return sorted;
  }, [prompts, sortBy]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle copy prompt
  const handleCopy = useCallback(async (id: string) => {
    const prompt = prompts.find((p: PromptListItem) => p.id === id);
    if (prompt) {
      // For now, we just copy the title. In detail view, we copy the full template
      await navigator.clipboard.writeText(`Prompt: ${prompt.title}`);
      // TODO: Show toast notification
    }
  }, [prompts]);

  // Handle run prompt (navigate to detail with run mode)
  const handleRun = useCallback((id: string) => {
    // Navigate to prompt detail page with run mode
    window.location.href = `/prompts/${id}?run=true`;
  }, []);

  // Handle edit prompt
  const handleEdit = useCallback((id: string) => {
    window.location.href = `/prompts/${id}/edit`;
  }, []);

  // Empty state for no prompts
  if (!isLoading && prompts.length === 0 && !searchQuery && selectedTags.length === 0) {
    return (
      <div>
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Prompt Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your captured and distilled prompts
            </p>
          </div>
          <Link href="/prompts/new" className="btn-primary px-4 py-2">
            <span className="flex items-center gap-2">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Prompt
            </span>
          </Link>
        </div>

        <EmptyState
          icon="📝"
          title="No prompts yet"
          description="Start by capturing a conversation from ChatGPT, Claude, or other AI tools using the Distill browser extension."
          primaryAction={{
            label: 'Install Extension',
            href: 'https://chrome.google.com/webstore',
          }}
          secondaryAction={{
            label: 'Create Manually',
            onClick: () => (window.location.href = '/prompts/new'),
          }}
        />
      </div>
    );
  }

  // Empty state for no search results
  const noSearchResults =
    !isLoading &&
    prompts.length === 0 &&
    (searchQuery || selectedTags.length > 0);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prompt Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/prompts/new" className="btn-primary px-4 py-2 self-start">
          <span className="flex items-center gap-2">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Prompt
          </span>
        </Link>
      </div>

      {/* Search Mode Toggle */}
      <div className="mb-6">
        <div className="flex items-center rounded-lg border border-border bg-secondary p-1 w-fit">
          <button
            type="button"
            onClick={() => setSearchMode('browse')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              searchMode === 'browse'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={searchMode === 'browse'}
          >
            <span className="flex items-center gap-2">
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Browse
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('semantic')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              searchMode === 'semantic'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={searchMode === 'semantic'}
          >
            <span className="flex items-center gap-2">
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Semantic Search
            </span>
          </button>
        </div>
      </div>

      {/* Semantic Search Mode */}
      {searchMode === 'semantic' && (
        <SemanticSearch includePublic={true} />
      )}

      {/* Browse Mode - Search and Filters */}
      {searchMode === 'browse' && (
        <>
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <PromptSearch
                onSearch={handleSearch}
                initialValue={searchQuery}
                className="flex-1"
              />
              <div className="flex items-center gap-4">
                <SortSelect value={sortBy} onChange={setSortBy} />
                {/* View Mode Toggle */}
                <div className="flex items-center rounded-md border border-input bg-background">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-label="Grid view"
                    title="Grid view"
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
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-label="List view"
                    title="List view"
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
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <TagFilter
                tags={allTags}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
              />
            )}
          </div>

          {/* Error State */}
          {isError && (
            <div className="card">
              <ErrorWithRetry
                message={error?.message || 'Unable to load your prompts. Please try again.'}
                onRetry={() => refetch()}
                isRetrying={isRefetching}
              />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-4'
              }
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <PromptCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* No Search Results */}
          {noSearchResults && (
            <EmptyState
              icon="🔍"
              title="No prompts found"
              description={`No prompts match your ${
                searchQuery ? `search "${searchQuery}"` : ''
              }${searchQuery && selectedTags.length > 0 ? ' and ' : ''}${
                selectedTags.length > 0 ? 'selected tags' : ''
              }.`}
              secondaryAction={{
                label: 'Clear filters',
                onClick: () => {
                  setSearchQuery('');
                  setSelectedTags([]);
                },
              }}
            />
          )}

          {/* Prompts Grid/List */}
          {!isLoading && !noSearchResults && sortedPrompts.length > 0 && (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-4'
                }
              >
                {sortedPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    id={prompt.id}
                    title={prompt.title}
                    tags={prompt.tags}
                    usageCount={prompt.usageCount}
                    isPublic={prompt.isPublic}
                    createdAt={new Date(prompt.createdAt)}
                    updatedAt={new Date(prompt.updatedAt)}
                    onCopy={handleCopy}
                    onRun={handleRun}
                    onEdit={handleEdit}
                  />
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
        </>
      )}
    </div>
  );
}
