'use client';

/**
 * CollectionDetailContent Component
 *
 * Client component that displays collection details and its prompts,
 * with edit and delete capabilities.
 */

import {
  CollectionForm,
  CollectionPromptList,
  CollectionPromptListSkeleton,
  PromptPickerModal,
} from '@/components/collections';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CollectionDetailContentProps {
  collectionId: string;
}

export function CollectionDetailContent({ collectionId }: CollectionDetailContentProps) {
  const router = useRouter();

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch collection details
  const { data, isLoading, isError, error, refetch } = trpc.collection.byId.useQuery(
    { id: collectionId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Mutations
  const updateMutation = trpc.collection.update.useMutation({
    onSuccess: () => {
      setIsEditModalOpen(false);
      setFormError(null);
      toast.success('Collection updated successfully');
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
      toast.error('Failed to update collection');
    },
  });

  const deleteMutation = trpc.collection.delete.useMutation({
    onSuccess: () => {
      toast.success('Collection deleted successfully');
      router.push('/collections');
    },
    onError: (err) => {
      console.error('Failed to delete collection:', err.message);
      toast.error('Failed to delete collection');
      setIsDeleteModalOpen(false);
    },
  });

  const removePromptMutation = trpc.collection.removePrompt.useMutation({
    onSuccess: () => {
      toast.success('Prompt removed from collection');
      refetch();
    },
    onError: (err) => {
      console.error('Failed to remove prompt:', err.message);
      toast.error('Failed to remove prompt');
    },
  });

  const collection = data?.collection;

  // Get existing prompt IDs for the picker modal
  const existingPromptIds = useMemo(
    () => collection?.prompts.map((p) => p.id) ?? [],
    [collection?.prompts]
  );

  // Handlers
  const handleUpdate = useCallback(
    (formData: { name: string; description: string; isPublic: boolean }) => {
      updateMutation.mutate({
        id: collectionId,
        name: formData.name,
        description: formData.description || null,
        isPublic: formData.isPublic,
      });
    },
    [updateMutation, collectionId]
  );

  const handleDelete = useCallback(() => {
    deleteMutation.mutate({ id: collectionId });
  }, [deleteMutation, collectionId]);

  const handleRemovePrompt = useCallback(
    (promptId: string) => {
      removePromptMutation.mutate({
        collectionId,
        promptId,
      });
    },
    [removePromptMutation, collectionId]
  );

  const handleBrowseLibrary = useCallback(() => {
    setIsPromptPickerOpen(true);
  }, []);

  const handlePromptsAdded = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <div>
        {/* Back link skeleton */}
        <div className="mb-6">
          <div className="h-5 bg-neutral-200 rounded w-32 animate-pulse" />
        </div>

        {/* Header skeleton */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-7 bg-neutral-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-secondary rounded w-3/4" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-secondary rounded" />
              <div className="h-9 w-20 bg-secondary rounded" />
            </div>
          </div>
        </div>

        {/* Prompts skeleton */}
        <div className="mb-4">
          <div className="h-6 bg-neutral-200 rounded w-32 mb-4" />
        </div>
        <CollectionPromptListSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div>
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Collections
        </Link>

        <div className="card p-6 text-center">
          <p className="text-sm text-error-600">{error?.message || 'Failed to load collection'}</p>
          <button onClick={() => refetch()} className="mt-4 btn-outline px-4 py-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div>
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Collections
        </Link>

        <div className="card p-6 text-center">
          <p className="text-sm text-muted-foreground">Collection not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/collections"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Collections
      </Link>

      {/* Collection Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* Folder icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-primary-600"
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
              <div>
                <h1 className="text-xl font-bold text-foreground">{collection.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {collection.isPublic && (
                    <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600">
                      Public
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {collection.prompts.length} prompt
                    {collection.prompts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            {collection.description && (
              <p className="text-sm text-muted-foreground mt-3">{collection.description}</p>
            )}
          </div>

          {/* Actions (only for owners) */}
          {collection.isOwner && (
            <div className="flex gap-2 self-start">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-outline px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-1.5">
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
                  Edit
                </span>
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="btn-outline px-3 py-2 text-sm text-error-600 hover:bg-error-50 hover:border-error-300"
              >
                <span className="flex items-center gap-1.5">
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
                  Delete
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prompts Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Prompts in this collection</h2>
        {collection.isOwner && (
          <button
            onClick={handleBrowseLibrary}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            + Add from library
          </button>
        )}
      </div>

      <CollectionPromptList
        prompts={collection.prompts}
        canEdit={collection.isOwner}
        onRemovePrompt={handleRemovePrompt}
        onBrowseLibrary={handleBrowseLibrary}
        isLoading={removePromptMutation.isPending}
      />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Modal
          title="Edit Collection"
          onClose={() => {
            setIsEditModalOpen(false);
            setFormError(null);
          }}
        >
          <CollectionForm
            initialValues={{
              name: collection.name,
              description: collection.description || '',
              isPublic: collection.isPublic,
            }}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditModalOpen(false);
              setFormError(null);
            }}
            isLoading={updateMutation.isPending}
            isEditing
            error={formError}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal title="Delete Collection" onClose={() => setIsDeleteModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-medium">{collection.name}</span>
              ? This action cannot be undone. The prompts in this collection will not be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-outline px-4 py-2"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary bg-error-600 hover:bg-error-700 px-4 py-2"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Prompt Picker Modal */}
      <PromptPickerModal
        collectionId={collectionId}
        existingPromptIds={existingPromptIds}
        isOpen={isPromptPickerOpen}
        onClose={() => setIsPromptPickerOpen(false)}
        onAdded={handlePromptsAdded}
      />
    </div>
  );
}

/**
 * Modal Component
 *
 * Simple modal wrapper for forms and dialogs.
 */
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-md mx-4 card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-secondary"
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

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
