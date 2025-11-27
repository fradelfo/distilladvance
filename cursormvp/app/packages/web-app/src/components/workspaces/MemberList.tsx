'use client';

/**
 * MemberList Component
 *
 * Displays workspace members with role management.
 */

import { useState } from 'react';

interface Member {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface MemberListProps {
  members: Member[];
  currentUserId: string;
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  onUpdateRole?: (userId: string, role: 'OWNER' | 'ADMIN' | 'MEMBER') => void;
  onRemoveMember?: (userId: string) => void;
  isLoading?: boolean;
}

export function MemberList({
  members,
  currentUserId,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
  isLoading = false,
}: MemberListProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const roleColors = {
    OWNER: 'bg-amber-50 text-amber-700 border-amber-200',
    ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
    MEMBER: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  };

  const canManageRole = (targetRole: 'OWNER' | 'ADMIN' | 'MEMBER') => {
    if (currentUserRole === 'OWNER') return true;
    if (currentUserRole === 'ADMIN' && targetRole === 'MEMBER') return true;
    return false;
  };

  const canRemove = (targetUserId: string, targetRole: 'OWNER' | 'ADMIN' | 'MEMBER') => {
    // Users can always remove themselves (except last owner)
    if (targetUserId === currentUserId) return true;
    return canManageRole(targetRole);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-white"
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {member.user.image ? (
              <img
                src={member.user.image}
                alt={member.user.name || 'Member'}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-600">
                {(member.user.name || member.user.email).charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {member.user.name || 'Unnamed'}
                </span>
                {member.userId === currentUserId && (
                  <span className="text-xs text-neutral-500">(you)</span>
                )}
              </div>
              <p className="text-sm text-neutral-500">{member.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Joined date */}
            <span className="text-xs text-neutral-400 hidden sm:block">
              Joined {formatDate(member.joinedAt)}
            </span>

            {/* Role badge/selector */}
            {editingUserId === member.userId && currentUserRole === 'OWNER' ? (
              <select
                value={member.role}
                onChange={(e) => {
                  onUpdateRole?.(member.userId, e.target.value as 'OWNER' | 'ADMIN' | 'MEMBER');
                  setEditingUserId(null);
                }}
                onBlur={() => setEditingUserId(null)}
                autoFocus
                disabled={isLoading}
                className="text-sm rounded-md border border-neutral-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
            ) : (
              <button
                onClick={() => {
                  if (currentUserRole === 'OWNER' && member.userId !== currentUserId) {
                    setEditingUserId(member.userId);
                  }
                }}
                disabled={currentUserRole !== 'OWNER' || member.userId === currentUserId}
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColors[member.role]} ${
                  currentUserRole === 'OWNER' && member.userId !== currentUserId
                    ? 'cursor-pointer hover:opacity-80'
                    : 'cursor-default'
                }`}
              >
                {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
              </button>
            )}

            {/* Remove button */}
            {canRemove(member.userId, member.role) && onRemoveMember && (
              <button
                onClick={() => onRemoveMember(member.userId)}
                disabled={isLoading}
                className="p-1.5 rounded-md text-neutral-400 hover:text-error-600 hover:bg-error-50"
                title={member.userId === currentUserId ? 'Leave workspace' : 'Remove member'}
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * MemberListSkeleton
 */
export function MemberListSkeleton() {
  return (
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
  );
}
