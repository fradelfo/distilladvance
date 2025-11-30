'use client';

/**
 * SemanticSearch Component
 *
 * Provides semantic search functionality for finding prompts by meaning
 * using vector embeddings and cosine similarity.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { TagChip } from '@/components/TagFilter';
import { EmptyState } from '@/components/EmptyState';

interface SemanticSearchProps {
  /** Optional workspace ID to scope the search */
  workspaceId?: string;
  /** Whether to include public prompts in results */
  includePublic?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Type for a search result from the API (dates come as strings from tRPC)
interface SearchResult {
  prompt: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    isPublic: boolean;
    createdAt: string;
    author: string;
    isOwner: boolean;
  };
  similarity: number;
}

export function SemanticSearch({
  workspaceId,
  includePublic = true,
  className = '',
}: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Use tRPC mutation for semantic search
  const searchMutation = trpc.embedding.search.useMutation();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setHasSearched(true);
    await searchMutation.mutateAsync({
      query: query.trim(),
      limit: 20,
      threshold: 0.5,
      workspaceId,
      includePublic,
    });
  }, [query, workspaceId, includePublic, searchMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setHasSearched(false);
    searchMutation.reset();
  }, [searchMutation]);

  const results: SearchResult[] = searchMutation.data?.results ?? [];
  const meta = searchMutation.data?.meta;

  // Format similarity score as percentage
  const formatSimilarity = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  // Get badge color based on similarity score
  const getSimilarityBadgeClass = (score: number): string => {
    if (score >= 0.9) return 'bg-success-100 text-success-700';
    if (score >= 0.8) return 'bg-primary-100 text-primary-700';
    if (score >= 0.7) return 'bg-warning-100 text-warning-700';
    return 'bg-secondary text-muted-foreground';
  };

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            {/* Search Icon */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by meaning..."
              className="input w-full pl-10 pr-10"
              aria-label="Semantic search"
              disabled={searchMutation.isPending}
            />

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-muted-foreground"
                aria-label="Clear search"
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

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={!query.trim() || searchMutation.isPending}
            className="btn-primary px-6 py-2 flex items-center gap-2"
          >
            {searchMutation.isPending ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Search Info */}
        {meta && (
          <p className="mt-2 text-xs text-muted-foreground">
            Found {meta.resultsReturned} result{meta.resultsReturned !== 1 ? 's' : ''} from{' '}
            {meta.totalCandidates} prompt{meta.totalCandidates !== 1 ? 's' : ''} in {meta.durationMs}ms
          </p>
        )}
      </div>

      {/* Error State */}
      {searchMutation.isError && (
        <div className="card p-6 text-center">
          <p className="text-sm text-error-600">
            Search failed: {searchMutation.error?.message || 'Unknown error'}
          </p>
          <button
            type="button"
            onClick={() => searchMutation.reset()}
            className="mt-4 btn-outline px-4 py-2"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Initial State (no search yet) */}
      {!hasSearched && !searchMutation.isPending && (
        <EmptyState
          icon="🔮"
          title="Search by meaning"
          description="Enter a description of what you're looking for. Semantic search finds prompts based on their meaning, not just keywords."
        />
      )}

      {/* No Results */}
      {hasSearched && !searchMutation.isPending && !searchMutation.isError && results.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No matching prompts"
          description={`No prompts found similar to "${query}". Try a different description or lower the similarity threshold.`}
          secondaryAction={{
            label: 'Clear search',
            onClick: handleClear,
          }}
        />
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <SemanticSearchResultCard
              key={result.prompt.id}
              result={result}
              similarityLabel={formatSimilarity(result.similarity)}
              similarityBadgeClass={getSimilarityBadgeClass(result.similarity)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SemanticSearchResultCard Component
 *
 * Displays a single search result as a card with similarity score.
 */
interface SemanticSearchResultCardProps {
  result: SearchResult;
  similarityLabel: string;
  similarityBadgeClass: string;
}

function SemanticSearchResultCard({
  result,
  similarityLabel,
  similarityBadgeClass,
}: SemanticSearchResultCardProps) {
  const { prompt, similarity } = result;

  return (
    <Link href={`/prompts/${prompt.id}`} className="block">
      <article className="card p-4 hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {/* Header with Similarity Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-foreground line-clamp-1 flex-1">
            {prompt.title}
          </h3>
          <span
            className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${similarityBadgeClass}`}
            title={`${Math.round(similarity * 100)}% match`}
          >
            {similarityLabel} match
          </span>
        </div>

        {/* Content Preview */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {prompt.content}
        </p>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {prompt.tags.slice(0, 3).map((tag) => (
              <TagChip key={tag} tag={tag} size="sm" />
            ))}
            {prompt.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                +{prompt.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{prompt.author}</span>
            {prompt.isPublic && (
              <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600">
                Public
              </span>
            )}
            {prompt.isOwner && (
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                Yours
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

/**
 * SemanticSearchSkeleton Component
 *
 * Loading skeleton for search results.
 */
export function SemanticSearchSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="card p-4 animate-pulse">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="h-5 bg-neutral-200 rounded w-3/4" />
            <div className="h-5 bg-neutral-200 rounded-full w-16" />
          </div>

          {/* Description */}
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-secondary rounded w-full" />
            <div className="h-4 bg-secondary rounded w-5/6" />
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 mb-3">
            <div className="h-5 bg-secondary rounded-full w-16" />
            <div className="h-5 bg-secondary rounded-full w-20" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="h-4 bg-secondary rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
