'use client';

/**
 * CollectionsContent Component
 *
 * Client component that handles the interactive collections UI,
 * including listing, creating, editing, and deleting collections.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  CollectionCard,
  CollectionCardSkeleton,
  CollectionForm,
} from '@/components/collections';
import { EmptyState } from '@/components/EmptyState';
import { trpc } from '@/lib/trpc';

// Type for a collection from the API
interface CollectionListItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  workspaceId: string | null;
  promptCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function CollectionsContent() {
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<CollectionListItem | null>(null);
  const [deletingCollectionId, setDeletingCollectionId] = useState<
    string | null
  >(null);

  // Error state
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch collections
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.collection.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const createMutation = trpc.collection.create.useMutation({
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setFormError(null);
      toast.success('Collection created successfully');
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
      toast.error('Failed to create collection');
    },
  });

  const updateMutation = trpc.collection.update.useMutation({
    onSuccess: () => {
      setEditingCollection(null);
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
      setDeletingCollectionId(null);
      toast.success('Collection deleted successfully');
      refetch();
    },
    onError: (err) => {
      console.error('Failed to delete collection:', err.message);
      toast.error('Failed to delete collection');
      setDeletingCollectionId(null);
    },
  });

  const collections = useMemo((): CollectionListItem[] => {
    return data?.collections || [];
  }, [data]);

  // Handlers
  const handleCreate = useCallback(
    (formData: { name: string; description: string; isPublic: boolean }) => {
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        isPublic: formData.isPublic,
      });
    },
    [createMutation]
  );

  const handleUpdate = useCallback(
    (formData: { name: string; description: string; isPublic: boolean }) => {
      if (!editingCollection) return;
      updateMutation.mutate({
        id: editingCollection.id,
        name: formData.name,
        description: formData.description || null,
        isPublic: formData.isPublic,
      });
    },
    [updateMutation, editingCollection]
  );

  const handleEdit = useCallback(
    (id: string) => {
      const collection = collections.find((c) => c.id === id);
      if (collection) {
        setEditingCollection(collection);
        setFormError(null);
      }
    },
    [collections]
  );

  const handleDelete = useCallback((id: string) => {
    setDeletingCollectionId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deletingCollectionId) {
      deleteMutation.mutate({ id: deletingCollectionId });
    }
  }, [deleteMutation, deletingCollectionId]);

  const cancelDelete = useCallback(() => {
    setDeletingCollectionId(null);
  }, []);

  // Empty state
  if (!isLoading && collections.length === 0) {
    return (
      <div>
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Collections</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Organize your prompts into collections
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary px-4 py-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Collection
            </span>
          </button>
        </div>

        <EmptyState
          icon={
            <svg
              className="h-12 w-12 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          }
          title="No collections yet"
          description="Create your first collection to organize your prompts by project, topic, or workflow."
          primaryAction={{
            label: 'Create Collection',
            onClick: () => setIsCreateModalOpen(true),
          }}
        />

        {/* Create Modal */}
        {isCreateModalOpen && (
          <Modal
            title="Create Collection"
            onClose={() => {
              setIsCreateModalOpen(false);
              setFormError(null);
            }}
          >
            <CollectionForm
              onSubmit={handleCreate}
              onCancel={() => {
                setIsCreateModalOpen(false);
                setFormError(null);
              }}
              isLoading={createMutation.isPending}
              error={formError}
            />
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Collections</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {collections.length} collection{collections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary px-4 py-2 self-start"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Collection
          </span>
        </button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="card p-6 text-center">
          <p className="text-sm text-error-600">
            Failed to load collections: {error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 btn-outline px-4 py-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CollectionCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Collections Grid */}
      {!isLoading && !isError && collections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              id={collection.id}
              name={collection.name}
              description={collection.description}
              promptCount={collection.promptCount}
              isPublic={collection.isPublic}
              createdAt={new Date(collection.createdAt)}
              updatedAt={new Date(collection.updatedAt)}
              isOwner={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <Modal
          title="Create Collection"
          onClose={() => {
            setIsCreateModalOpen(false);
            setFormError(null);
          }}
        >
          <CollectionForm
            onSubmit={handleCreate}
            onCancel={() => {
              setIsCreateModalOpen(false);
              setFormError(null);
            }}
            isLoading={createMutation.isPending}
            error={formError}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingCollection && (
        <Modal
          title="Edit Collection"
          onClose={() => {
            setEditingCollection(null);
            setFormError(null);
          }}
        >
          <CollectionForm
            initialValues={{
              name: editingCollection.name,
              description: editingCollection.description || '',
              isPublic: editingCollection.isPublic,
            }}
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditingCollection(null);
              setFormError(null);
            }}
            isLoading={updateMutation.isPending}
            isEditing
            error={formError}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCollectionId && (
        <Modal
          title="Delete Collection"
          onClose={cancelDelete}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Are you sure you want to delete this collection? This action cannot
              be undone. The prompts in this collection will not be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="btn-outline px-4 py-2"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-primary bg-error-600 hover:bg-error-700 px-4 py-2"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
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
          <h2 id="modal-title" className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
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
