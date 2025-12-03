'use client';

/**
 * PromptLibraryContent Component
 *
 * Client component that handles the interactive prompt library UI,
 * including search, filtering, sorting, and displaying prompts.
 */

import { EmptyState } from '@/components/EmptyState';
import { PromptCard, PromptCardSkeleton } from '@/components/PromptCard';
import { type SortOption, SortSelect } from '@/components/SortSelect';
import {
  AdvancedSearchPanel,
  type AutocompleteSuggestion,
  type SearchFilters,
  type SearchMode,
} from '@/components/search/AdvancedSearchPanel';
import { ErrorWithRetry } from '@/components/ui/error-with-retry';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

// View mode for the grid
type ViewMode = 'grid' | 'list';

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

// Type for search results
interface SearchResultItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  author: string;
  authorId: string;
  isOwner: boolean;
  score: number;
  highlight?: string;
}

export function PromptLibraryContent() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('FULLTEXT');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Sort and view state
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Advanced search query
  const searchQueryResult = trpc.search.search.useQuery(
    {
      query: searchQuery,
      mode: searchMode,
      filters: {
        tags: searchFilters.tags,
        isPublic: searchFilters.isPublic,
        dateFrom: searchFilters.dateFrom,
        dateTo: searchFilters.dateTo,
        minUsageCount: searchFilters.minUsageCount,
      },
      limit: 50,
      offset: 0,
      includePublic: true,
      logSearch: true,
    },
    {
      enabled: isSearchActive && searchQuery.length > 0,
      staleTime: 60 * 1000, // 1 minute
    }
  );

  // Fetch prompts with tRPC (for browse mode)
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
      search: !isSearchActive ? searchQuery || undefined : undefined,
      tags: searchFilters.tags?.length ? searchFilters.tags : undefined,
    },
    {
      getNextPageParam: (lastPage: ListPromptsPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !isSearchActive || searchQuery.length === 0,
    }
  );

  // Saved searches
  const savedSearchesQuery = trpc.search.listSavedSearches.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Search history
  const searchHistoryQuery = trpc.search.getHistory.useQuery(
    { limit: 10 },
    { staleTime: 60 * 1000 }
  );

  // Autocomplete - debounced query
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query for autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Autocomplete query
  const autocompleteQuery = trpc.search.autocomplete.useQuery(
    { query: debouncedQuery, limit: 8, includeHistory: true },
    {
      enabled: debouncedQuery.length >= 2 && !isSearchActive,
      staleTime: 30 * 1000,
    }
  );

  // Transform autocomplete suggestions
  const autocompleteSuggestions = useMemo((): AutocompleteSuggestion[] => {
    if (!autocompleteQuery.data?.suggestions) return [];
    return autocompleteQuery.data.suggestions.map((s) => ({
      type: s.type as 'title' | 'history' | 'tag',
      text: s.text,
      similarity: s.similarity,
    }));
  }, [autocompleteQuery.data?.suggestions]);

  // Mutations
  const createSavedSearchMutation = trpc.search.createSavedSearch.useMutation({
    onSuccess: () => savedSearchesQuery.refetch(),
  });

  const deleteSavedSearchMutation = trpc.search.deleteSavedSearch.useMutation({
    onSuccess: () => savedSearchesQuery.refetch(),
  });

  const clearHistoryMutation = trpc.search.clearHistory.useMutation({
    onSuccess: () => searchHistoryQuery.refetch(),
  });

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
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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

  // Transform saved searches with proper typing to avoid deep type instantiation
  const savedSearchesList = useMemo(() => {
    // Cast to unknown first to break deep type inference chain
    const rawData = savedSearchesQuery.data as unknown as
      | {
          savedSearches?: Array<{
            id: string;
            name: string;
            query: string | null;
            filters: Record<string, unknown>;
            searchMode: string;
            isDefault: boolean;
          }>;
        }
      | undefined;

    if (!rawData?.savedSearches) return undefined;

    return rawData.savedSearches.map((s) => ({
      id: s.id,
      name: s.name,
      query: s.query,
      filters: {
        tags: s.filters?.tags as string[] | undefined,
        isPublic: s.filters?.isPublic as boolean | undefined,
        dateFrom: s.filters?.dateFrom ? new Date(s.filters.dateFrom as string) : undefined,
        dateTo: s.filters?.dateTo ? new Date(s.filters.dateTo as string) : undefined,
        minUsageCount: s.filters?.minUsageCount as number | undefined,
        workspaceId: s.filters?.workspaceId as string | undefined,
      } as SearchFilters,
      searchMode: s.searchMode as SearchMode,
      isDefault: s.isDefault,
    }));
  }, [savedSearchesQuery.data]);

  // Transform search history with proper typing
  const searchHistoryList = useMemo(() => {
    // Cast to unknown first to break deep type inference chain
    const rawData = searchHistoryQuery.data as unknown as
      | {
          history?: Array<{
            id: string;
            query: string;
            searchMode: string;
            resultCount: number;
            createdAt: string;
          }>;
        }
      | undefined;

    if (!rawData?.history) return undefined;

    return rawData.history.map((h) => ({
      id: h.id,
      query: h.query,
      searchMode: h.searchMode as SearchMode,
      resultCount: h.resultCount,
      createdAt: new Date(h.createdAt),
    }));
  }, [searchHistoryQuery.data]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setIsSearchActive(true);
    }
  }, [searchQuery]);

  // Handle saved search save
  const handleSaveSearch = useCallback(
    (name: string) => {
      createSavedSearchMutation.mutate({
        name,
        query: searchQuery || undefined,
        filters: {
          tags: searchFilters.tags,
          isPublic: searchFilters.isPublic,
          dateFrom: searchFilters.dateFrom?.toISOString(),
          dateTo: searchFilters.dateTo?.toISOString(),
          minUsageCount: searchFilters.minUsageCount,
          workspaceId: searchFilters.workspaceId,
        },
        searchMode,
        isDefault: false,
      });
    },
    [createSavedSearchMutation, searchQuery, searchFilters, searchMode]
  );

  // Handle load saved search
  const handleLoadSavedSearch = useCallback(
    (savedSearch: {
      query?: string | null;
      filters: unknown;
      searchMode: SearchMode;
    }) => {
      setSearchQuery(savedSearch.query || '');
      setSearchFilters(savedSearch.filters as SearchFilters);
      setSearchMode(savedSearch.searchMode);
      if (savedSearch.query) {
        setIsSearchActive(true);
      }
    },
    []
  );

  // Handle clear filters
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchFilters({});
    setIsSearchActive(false);
  }, []);

  // Handle copy prompt
  const handleCopy = useCallback(
    async (id: string) => {
      const prompt = prompts.find((p: PromptListItem) => p.id === id);
      if (prompt) {
        // For now, we just copy the title. In detail view, we copy the full template
        await navigator.clipboard.writeText(`Prompt: ${prompt.title}`);
        // TODO: Show toast notification
      }
    },
    [prompts]
  );

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
  if (
    !isLoading &&
    prompts.length === 0 &&
    !searchQuery &&
    (!searchFilters.tags || searchFilters.tags.length === 0)
  ) {
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
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  // Determine if we have search results to show
  const searchResults = searchQueryResult.data?.results || [];
  const showSearchResults = isSearchActive && searchQuery.length > 0;
  const displayPrompts = showSearchResults ? [] : sortedPrompts;
  const noSearchResults =
    !isLoading &&
    !searchQueryResult.isLoading &&
    ((showSearchResults && searchResults.length === 0) ||
      (!showSearchResults &&
        prompts.length === 0 &&
        (searchQuery || Object.keys(searchFilters).length > 0)));

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prompt Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {showSearchResults
              ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`
              : `${prompts.length} prompt${prompts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/prompts/new" className="btn-primary px-4 py-2 self-start">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Advanced Search Panel */}
      <div className="mb-6">
        <AdvancedSearchPanel
          query={searchQuery}
          onQueryChange={setSearchQuery}
          mode={searchMode}
          onModeChange={setSearchMode}
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onSearch={handleSearch}
          isSearching={searchQueryResult.isLoading}
          availableTags={allTags}
          savedSearches={savedSearchesList}
          searchHistory={searchHistoryList}
          onSaveSearch={handleSaveSearch}
          onLoadSavedSearch={handleLoadSavedSearch}
          onDeleteSavedSearch={(id) => deleteSavedSearchMutation.mutate({ id })}
          onClearHistory={() => clearHistoryMutation.mutate()}
          autocompleteSuggestions={autocompleteSuggestions}
          isLoadingAutocomplete={autocompleteQuery.isLoading}
          onSelectSuggestion={(suggestion) => {
            setSearchQuery(suggestion.text);
            if (suggestion.type === 'tag') {
              setSearchFilters((prev) => ({
                ...prev,
                tags: prev.tags ? [...prev.tags, suggestion.text] : [suggestion.text],
              }));
            }
          }}
        />
      </div>

      {/* Sort and View Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SortSelect value={sortBy} onChange={setSortBy} />
          {isSearchActive && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear search
            </button>
          )}
        </div>
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
      {(isLoading || searchQueryResult.isLoading) && (
        <div
          className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}
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
          }${searchQuery && searchFilters.tags?.length ? ' and ' : ''}${
            searchFilters.tags?.length ? 'selected tags' : ''
          }.`}
          secondaryAction={{
            label: 'Clear filters',
            onClick: handleClearSearch,
          }}
        />
      )}

      {/* Search Results */}
      {showSearchResults && !searchQueryResult.isLoading && searchResults.length > 0 && (
        <div
          className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}
        >
          {searchResults.map((result) => (
            <PromptCard
              key={result.id}
              id={result.id}
              title={result.title}
              tags={result.tags}
              usageCount={result.usageCount}
              isPublic={result.isPublic}
              createdAt={new Date(result.createdAt)}
              updatedAt={new Date(result.createdAt)}
              onCopy={handleCopy}
              onRun={handleRun}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Browse Mode Prompts Grid/List */}
      {!showSearchResults && !isLoading && displayPrompts.length > 0 && (
        <>
          <div
            className={
              viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'
            }
          >
            {displayPrompts.map((prompt) => (
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
    </div>
  );
}
