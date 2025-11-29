'use client';

/**
 * PromptPickerModal Component
 *
 * A modal dialog for selecting prompts to add to a collection.
 * Features multi-select with checkboxes, search filtering,
 * and visual indication of already-added prompts.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

interface PromptPickerModalProps {
  /** Collection ID to add prompts to */
  collectionId: string;
  /** IDs of prompts already in the collection */
  existingPromptIds: string[];
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback after prompts are successfully added */
  onAdded: () => void;
}

interface PromptItem {
  id: string;
  title: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

export function PromptPickerModal({
  collectionId,
  existingPromptIds,
  isOpen,
  onClose,
  onAdded,
}: PromptPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch prompts
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.distill.listPrompts.useInfiniteQuery(
    {
      limit: 20,
      search: searchQuery || undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: isOpen,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Add prompt mutation
  const addPromptMutation = trpc.collection.addPrompt.useMutation();

  // Flatten paginated results
  const prompts = useMemo((): PromptItem[] => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.prompts as PromptItem[]);
  }, [data]);

  // Filter out already-added prompts for selection, but still show them grayed out
  const existingSet = useMemo(() => new Set(existingPromptIds), [existingPromptIds]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIds(new Set());
      setIsAdding(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isAdding) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isAdding, onClose]);

  // Toggle prompt selection
  const toggleSelection = useCallback((promptId: string) => {
    if (existingSet.has(promptId)) return; // Can't select already-added prompts

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(promptId)) {
        next.delete(promptId);
      } else {
        next.add(promptId);
      }
      return next;
    });
  }, [existingSet]);

  // Handle adding selected prompts
  const handleAddSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsAdding(true);
    try {
      // Add prompts sequentially to maintain order
      for (const promptId of selectedIds) {
        await addPromptMutation.mutateAsync({
          collectionId,
          promptId,
        });
      }
      onAdded();
      onClose();
    } catch (error) {
      console.error('[PromptPickerModal] Failed to add prompts:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsAdding(false);
    }
  }, [selectedIds, collectionId, addPromptMutation, onAdded, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !isAdding) {
        onClose();
      }
    },
    [isAdding, onClose]
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
      aria-labelledby="prompt-picker-title"
    >
      <div
        ref={modalRef}
        className="card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col mx-4"
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2
            id="prompt-picker-title"
            className="text-xl font-semibold text-neutral-900"
          >
            Add Prompts to Collection
          </h2>
          <button
            onClick={onClose}
            disabled={isAdding}
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-50"
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

        {/* Search */}
        <div className="p-4 border-b border-neutral-200">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400"
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
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="input w-full pl-10"
              disabled={isAdding}
            />
          </div>
          {selectedIds.size > 0 && (
            <p className="mt-2 text-sm text-primary-600">
              {selectedIds.size} prompt{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Prompt List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border border-neutral-200">
                  <div className="h-5 w-5 bg-neutral-200 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-neutral-900">No prompts found</p>
              <p className="mt-1 text-sm text-neutral-600">
                {searchQuery
                  ? `No prompts match "${searchQuery}"`
                  : 'Create some prompts first to add them to collections'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {prompts.map((prompt) => {
                const isExisting = existingSet.has(prompt.id);
                const isSelected = selectedIds.has(prompt.id);

                return (
                  <button
                    key={prompt.id}
                    onClick={() => toggleSelection(prompt.id)}
                    disabled={isExisting || isAdding}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      isExisting
                        ? 'border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center ${
                        isExisting
                          ? 'border-neutral-300 bg-neutral-200'
                          : isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-neutral-300'
                      }`}
                    >
                      {(isSelected || isExisting) && (
                        <svg
                          className={`h-3 w-3 ${isExisting ? 'text-neutral-400' : 'text-white'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Prompt Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isExisting ? 'text-neutral-500' : 'text-neutral-900'}`}>
                        {prompt.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {isExisting && (
                          <span className="text-xs text-neutral-500 bg-neutral-200 px-1.5 py-0.5 rounded">
                            Already added
                          </span>
                        )}
                        {prompt.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {prompt.tags.length > 2 && (
                          <span className="text-xs text-neutral-400">
                            +{prompt.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Usage count */}
                    <div className="flex-shrink-0 text-sm text-neutral-400">
                      {prompt.usageCount} uses
                    </div>
                  </button>
                );
              })}

              {/* Load More */}
              {hasNextPage && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage || isAdding}
                    className="btn-outline px-4 py-2"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 bg-neutral-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isAdding}
            className="btn-outline px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSelected}
            disabled={selectedIds.size === 0 || isAdding}
            className={`btn-primary px-4 py-2 ${
              selectedIds.size === 0 || isAdding ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isAdding
              ? 'Adding...'
              : `Add ${selectedIds.size || ''} Prompt${selectedIds.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
