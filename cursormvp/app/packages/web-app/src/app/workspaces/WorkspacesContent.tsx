'use client';

/**
 * WorkspacesContent Component
 *
 * Client component that handles the interactive workspaces UI,
 * including listing and creating workspaces.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  WorkspaceCard,
  WorkspaceCardSkeleton,
  WorkspaceForm,
} from '@/components/workspaces';
import { EmptyState } from '@/components/EmptyState';
import { trpc } from '@/lib/trpc';

// Type for a workspace from the API
interface WorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  _count: {
    members: number;
    prompts: number;
  };
}

export function WorkspacesContent() {
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Error state
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch workspaces
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.workspace.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const createMutation = trpc.workspace.create.useMutation({
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setFormError(null);
      toast.success('Workspace created successfully');
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
      toast.error('Failed to create workspace');
    },
  });

  const workspaces = useMemo((): WorkspaceListItem[] => {
    return data || [];
  }, [data]);

  // Handlers
  const handleCreate = useCallback(
    (formData: { name: string; slug: string; description: string }) => {
      createMutation.mutate({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
      });
    },
    [createMutation]
  );

  // Empty state
  if (!isLoading && !isError && workspaces.length === 0) {
    return (
      <div>
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Workspaces</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Collaborate on prompts with your team
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
              Create Workspace
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          title="No workspaces yet"
          description="Create your first workspace to collaborate on prompts with your team."
          primaryAction={{
            label: 'Create Workspace',
            onClick: () => setIsCreateModalOpen(true),
          }}
        />

        {/* Create Modal */}
        {isCreateModalOpen && (
          <Modal
            title="Create Workspace"
            onClose={() => {
              setIsCreateModalOpen(false);
              setFormError(null);
            }}
          >
            <WorkspaceForm
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
          <h1 className="text-2xl font-bold text-neutral-900">Workspaces</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
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
            Create Workspace
          </span>
        </button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="card p-6 text-center">
          <p className="text-sm text-error-600">
            Failed to load workspaces: {error?.message || 'Unknown error'}
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
            <WorkspaceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Workspaces Grid */}
      {!isLoading && !isError && workspaces.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              id={workspace.id}
              name={workspace.name}
              slug={workspace.slug}
              description={workspace.description}
              image={workspace.image}
              role={workspace.role}
              memberCount={workspace._count.members}
              promptCount={workspace._count.prompts}
              joinedAt={new Date(workspace.joinedAt)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <Modal
          title="Create Workspace"
          onClose={() => {
            setIsCreateModalOpen(false);
            setFormError(null);
          }}
        >
          <WorkspaceForm
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
