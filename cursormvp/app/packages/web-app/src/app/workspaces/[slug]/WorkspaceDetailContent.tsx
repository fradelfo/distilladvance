'use client';

/**
 * WorkspaceDetailContent Component
 *
 * Client component that displays workspace details, members, invites,
 * with edit and delete capabilities for owners/admins.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { WorkspaceForm, MemberList, InviteForm } from '@/components/workspaces';
import { trpc } from '@/lib/trpc';

interface WorkspaceDetailContentProps {
  workspaceSlug: string;
}

type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export function WorkspaceDetailContent({
  workspaceSlug,
}: WorkspaceDetailContentProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string;
    name: string;
    isSelf: boolean;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Fetch workspace details
  const {
    data: workspace,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.workspace.bySlug.useQuery(
    { slug: workspaceSlug },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch pending invites (only if user is owner/admin)
  const currentUserId = session?.user?.id;
  const currentMember = workspace?.members.find(
    (m) => m.userId === currentUserId
  );
  const currentUserRole = currentMember?.role as WorkspaceRole | undefined;
  const canManageInvites =
    currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const {
    data: invites,
    isLoading: invitesLoading,
    refetch: refetchInvites,
  } = trpc.workspace.listInvites.useQuery(
    { workspaceId: workspace?.id || '' },
    {
      enabled: !!workspace?.id && canManageInvites,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Mutations
  const updateMutation = trpc.workspace.update.useMutation({
    onSuccess: () => {
      setIsEditModalOpen(false);
      setFormError(null);
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  const deleteMutation = trpc.workspace.delete.useMutation({
    onSuccess: () => {
      router.push('/workspaces');
    },
    onError: (err) => {
      console.error('Failed to delete workspace:', err.message);
      setIsDeleteModalOpen(false);
    },
  });

  const createInviteMutation = trpc.workspace.createInvite.useMutation({
    onSuccess: () => {
      setIsInviteModalOpen(false);
      setInviteError(null);
      refetchInvites();
    },
    onError: (err) => {
      setInviteError(err.message);
    },
  });

  const revokeInviteMutation = trpc.workspace.revokeInvite.useMutation({
    onSuccess: () => {
      refetchInvites();
    },
    onError: (err) => {
      console.error('Failed to revoke invite:', err.message);
    },
  });

  const removeMemberMutation = trpc.workspace.removeMember.useMutation({
    onSuccess: () => {
      setIsRemoveMemberModalOpen(false);
      setMemberToRemove(null);
      // If user removed themselves, redirect to workspaces list
      if (memberToRemove?.isSelf) {
        router.push('/workspaces');
      } else {
        refetch();
      }
    },
    onError: (err) => {
      console.error('Failed to remove member:', err.message);
      setIsRemoveMemberModalOpen(false);
    },
  });

  const updateMemberRoleMutation = trpc.workspace.updateMemberRole.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      console.error('Failed to update member role:', err.message);
    },
  });

  // Handlers
  const handleUpdate = useCallback(
    (formData: { name: string; slug: string; description: string }) => {
      if (!workspace) return;
      updateMutation.mutate({
        id: workspace.id,
        name: formData.name,
        description: formData.description || undefined,
      });
    },
    [updateMutation, workspace]
  );

  const handleDelete = useCallback(() => {
    if (!workspace) return;
    deleteMutation.mutate({ id: workspace.id });
  }, [deleteMutation, workspace]);

  const handleCreateInvite = useCallback(
    (formData: { email: string; role: 'ADMIN' | 'MEMBER' }) => {
      if (!workspace) return;
      createInviteMutation.mutate({
        workspaceId: workspace.id,
        email: formData.email,
        role: formData.role,
      });
    },
    [createInviteMutation, workspace]
  );

  const handleRevokeInvite = useCallback(
    (inviteId: string) => {
      revokeInviteMutation.mutate({ inviteId });
    },
    [revokeInviteMutation]
  );

  const handleRemoveMemberClick = useCallback(
    (userId: string) => {
      if (!workspace) return;
      const member = workspace.members.find((m) => m.userId === userId);
      if (!member) return;

      setMemberToRemove({
        userId,
        name: member.user.name || member.user.email,
        isSelf: userId === currentUserId,
      });
      setIsRemoveMemberModalOpen(true);
    },
    [workspace, currentUserId]
  );

  const handleConfirmRemoveMember = useCallback(() => {
    if (!workspace || !memberToRemove) return;
    removeMemberMutation.mutate({
      workspaceId: workspace.id,
      userId: memberToRemove.userId,
    });
  }, [removeMemberMutation, workspace, memberToRemove]);

  const handleUpdateMemberRole = useCallback(
    (userId: string, role: WorkspaceRole) => {
      if (!workspace) return;
      updateMemberRoleMutation.mutate({
        workspaceId: workspace.id,
        userId,
        role,
      });
    },
    [updateMemberRoleMutation, workspace]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-lg bg-neutral-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-7 bg-neutral-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-neutral-100 rounded" />
              <div className="h-9 w-20 bg-neutral-100 rounded" />
            </div>
          </div>
        </div>

        {/* Members skeleton */}
        <div className="mb-4">
          <div className="h-6 bg-neutral-200 rounded w-32 mb-4" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200" />
                <div>
                  <div className="h-4 bg-neutral-200 rounded w-32 mb-1" />
                  <div className="h-3 bg-neutral-100 rounded w-40" />
                </div>
              </div>
              <div className="h-6 bg-neutral-100 rounded-full w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div>
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
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
          Back to Workspaces
        </Link>

        <div className="card p-6 text-center">
          <p className="text-sm text-error-600">
            {error?.message || 'Failed to load workspace'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 btn-outline px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div>
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
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
          Back to Workspaces
        </Link>

        <div className="card p-6 text-center">
          <p className="text-sm text-neutral-600">Workspace not found</p>
        </div>
      </div>
    );
  }

  const isOwner = currentUserRole === 'OWNER';
  const isAdmin = currentUserRole === 'ADMIN';

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/workspaces"
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
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
        Back to Workspaces
      </Link>

      {/* Workspace Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Workspace Image */}
            {workspace.image ? (
              <img
                src={workspace.image}
                alt={workspace.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-xl font-bold text-neutral-900">
                {workspace.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                <span>{workspace.members.length} members</span>
                <span>-</span>
                <span>{workspace._count.prompts} prompts</span>
                <span>-</span>
                <span>{workspace._count.collections} collections</span>
              </div>
              {workspace.description && (
                <p className="text-sm text-neutral-600 mt-3">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions (only for owners/admins) */}
          {(isOwner || isAdmin) && (
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
              {isOwner && (
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Members</h2>
          {canManageInvites && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="btn-primary px-3 py-2 text-sm"
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Invite Member
              </span>
            </button>
          )}
        </div>

        {currentUserId && currentUserRole && (
          <MemberList
            members={workspace.members}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onUpdateRole={isOwner ? handleUpdateMemberRole : undefined}
            onRemoveMember={handleRemoveMemberClick}
            isLoading={
              removeMemberMutation.isPending ||
              updateMemberRoleMutation.isPending
            }
          />
        )}
      </div>

      {/* Pending Invites Section (only for owners/admins) */}
      {canManageInvites && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Pending Invites
          </h2>

          {invitesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200" />
                    <div>
                      <div className="h-4 bg-neutral-200 rounded w-40 mb-1" />
                      <div className="h-3 bg-neutral-100 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>
          ) : invites && invites.length > 0 ? (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-white"
                >
                  <div className="flex items-center gap-3">
                    {/* Email icon */}
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-neutral-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {invite.email}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Invited as{' '}
                        {invite.role.charAt(0) +
                          invite.role.slice(1).toLowerCase()}{' '}
                        - Expires {formatDate(invite.expiresAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    disabled={revokeInviteMutation.isPending}
                    className="text-sm text-neutral-500 hover:text-error-600 px-2 py-1"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-neutral-200 rounded-lg">
              <svg
                className="mx-auto h-8 w-8 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-neutral-500">
                No pending invites
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Modal
          title="Edit Workspace"
          onClose={() => {
            setIsEditModalOpen(false);
            setFormError(null);
          }}
        >
          <WorkspaceForm
            initialValues={{
              name: workspace.name,
              slug: workspace.slug,
              description: workspace.description || '',
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

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <Modal
          title="Invite Member"
          onClose={() => {
            setIsInviteModalOpen(false);
            setInviteError(null);
          }}
        >
          <InviteForm
            onSubmit={handleCreateInvite}
            onCancel={() => {
              setIsInviteModalOpen(false);
              setInviteError(null);
            }}
            isLoading={createInviteMutation.isPending}
            error={inviteError}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal
          title="Delete Workspace"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Are you sure you want to delete{' '}
              <span className="font-medium">{workspace.name}</span>? This action
              cannot be undone. All prompts and collections in this workspace
              will be deleted.
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

      {/* Remove Member Confirmation Modal */}
      {isRemoveMemberModalOpen && memberToRemove && (
        <Modal
          title={memberToRemove.isSelf ? 'Leave Workspace' : 'Remove Member'}
          onClose={() => {
            setIsRemoveMemberModalOpen(false);
            setMemberToRemove(null);
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              {memberToRemove.isSelf ? (
                <>
                  Are you sure you want to leave{' '}
                  <span className="font-medium">{workspace.name}</span>? You
                  will lose access to all prompts and collections in this
                  workspace.
                </>
              ) : (
                <>
                  Are you sure you want to remove{' '}
                  <span className="font-medium">{memberToRemove.name}</span>{' '}
                  from this workspace?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsRemoveMemberModalOpen(false);
                  setMemberToRemove(null);
                }}
                className="btn-outline px-4 py-2"
                disabled={removeMemberMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveMember}
                className="btn-primary bg-error-600 hover:bg-error-700 px-4 py-2"
                disabled={removeMemberMutation.isPending}
              >
                {removeMemberMutation.isPending
                  ? memberToRemove.isSelf
                    ? 'Leaving...'
                    : 'Removing...'
                  : memberToRemove.isSelf
                    ? 'Leave'
                    : 'Remove'}
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
          <h2
            id="modal-title"
            className="text-lg font-semibold text-neutral-900"
          >
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
