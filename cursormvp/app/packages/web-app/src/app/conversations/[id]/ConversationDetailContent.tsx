'use client';

/**
 * ConversationDetailContent Component
 *
 * Shows conversation details, message thread (if FULL mode),
 * linked prompts, and actions like distill and delete.
 */

import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Source icons and names
const sourceIcons: Record<string, string> = {
  chatgpt: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
  claude: 'https://www.anthropic.com/favicon.ico',
  gemini: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
  copilot: 'https://copilot.microsoft.com/favicon.ico',
};

const sourceNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'Copilot',
};

interface ConversationDetailContentProps {
  conversationId: string;
}

interface Message {
  role: string;
  content: string;
}

export function ConversationDetailContent({ conversationId }: ConversationDetailContentProps) {
  const router = useRouter();
  const [isDistilling, setIsDistilling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch conversation details
  const { data, isLoading, isError, error } = trpc.conversation.byId.useQuery(
    { id: conversationId },
    { staleTime: 5 * 60 * 1000 }
  );

  // Delete mutation
  const deleteMutation = trpc.conversation.delete.useMutation({
    onSuccess: () => {
      router.push('/conversations');
    },
  });

  // State for distill error
  const [distillError, setDistillError] = useState<string | null>(null);

  const handleDistill = async () => {
    setIsDistilling(true);
    setDistillError(null);
    try {
      // Use fetch directly to avoid type depth issues with tRPC mutation
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/trpc/distill.distillFromConversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ conversationId }),
      });

      const data = await response.json();

      if (data.result?.data?.success && data.result?.data?.promptId) {
        router.push(`/prompts/${data.result.data.promptId}`);
      } else {
        throw new Error(data.result?.data?.error || 'Failed to distill conversation');
      }
    } catch (err) {
      console.error('Failed to distill:', err);
      setDistillError(err instanceof Error ? err.message : 'Failed to distill');
      setIsDistilling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: conversationId });
    } catch (err) {
      console.error('Failed to delete:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton - matches actual h1 + metadata */}
        <div className="animate-pulse flex items-start gap-4">
          <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-muted" />
          <div className="min-w-0 flex-1">
            <div className="h-8 w-48 rounded bg-muted mb-2" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="card animate-pulse p-6">
          <div className="space-y-4">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-error-600">
          Failed to load conversation: {error?.message || 'Unknown error'}
        </p>
        <Link href="/conversations" className="mt-4 btn-outline px-4 py-2 inline-block">
          Back to Conversations
        </Link>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversation = data?.conversation as any;
  if (!conversation) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-muted-foreground">Conversation not found</p>
        <Link href="/conversations" className="mt-4 btn-outline px-4 py-2 inline-block">
          Back to Conversations
        </Link>
      </div>
    );
  }

  const rawContent = conversation.rawContent as Message[] | null;
  const prompts = (conversation.prompts || []) as Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/conversations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Conversations
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between overflow-hidden">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Source Icon */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
            {sourceIcons[conversation.source] ? (
              <img
                src={sourceIcons[conversation.source]}
                alt={sourceNames[conversation.source] || conversation.source}
                className="h-7 w-7"
                width={28}
                height={28}
              />
            ) : (
              <span className="text-2xl">💬</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground truncate" title={conversation.title}>
              {conversation.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{sourceNames[conversation.source] || conversation.source}</span>
              <span>·</span>
              <span>{formatDate(conversation.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {conversation.privacyMode === 'FULL' && rawContent && (
            <button
              onClick={handleDistill}
              disabled={isDistilling}
              className="btn-primary px-4 py-2"
            >
              {isDistilling ? 'Distilling...' : 'Distill This'}
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-outline px-4 py-2 text-error-600 hover:bg-error-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Distill Error */}
      {distillError && (
        <div className="card bg-error-50 border-error-200 p-4">
          <p className="text-sm text-error-700">{distillError}</p>
          <button
            onClick={() => setDistillError(null)}
            className="mt-2 text-sm text-error-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metadata Card */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Privacy Mode
            </span>
            <p className="mt-1">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  conversation.privacyMode === 'FULL'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-secondary text-foreground'
                }`}
              >
                {conversation.privacyMode === 'FULL' ? 'Full Content' : 'Prompt Only'}
              </span>
            </p>
          </div>
          {conversation.sourceUrl && (
            <div>
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Source URL
              </span>
              <p className="mt-1">
                <a
                  href={conversation.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline"
                >
                  View Original
                </a>
              </p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Linked Prompts
            </span>
            <p className="mt-1 text-sm">{prompts.length}</p>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      {conversation.privacyMode === 'FULL' && rawContent && rawContent.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="border-b border-border bg-secondary px-4 py-3">
            <h2 className="font-medium text-foreground">Conversation Thread</h2>
            <p className="text-sm text-muted-foreground">{rawContent.length} messages</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {rawContent.map((message, index) => (
              <div
                key={index}
                className={`p-4 ${message.role === 'assistant' ? 'bg-secondary' : 'bg-background'}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      message.role === 'assistant'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-200 text-foreground'
                    }`}
                  >
                    {message.role === 'assistant' ? 'AI' : 'You'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      {message.role === 'assistant' ? 'Assistant' : 'You'}
                    </p>
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="font-medium text-foreground mb-1">Content Not Stored</h3>
          <p className="text-sm text-muted-foreground">
            This conversation was saved in &quot;Prompt Only&quot; mode. The full message content
            was not stored for privacy.
          </p>
          {conversation.privacyMode !== 'FULL' && (
            <p className="text-sm text-muted-foreground mt-2">
              To enable distillation, capture new conversations in &quot;Full&quot; privacy mode.
            </p>
          )}
        </div>
      )}

      {/* Linked Prompts */}
      {prompts.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="border-b border-border bg-secondary px-4 py-3">
            <h2 className="font-medium text-foreground">Linked Prompts</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {prompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.id}`}
                className="block px-4 py-3 hover:bg-secondary transition-colors"
              >
                <p className="font-medium text-foreground">{prompt.title}</p>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(prompt.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Conversation?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete this conversation. Any linked prompts will remain but
              will no longer be associated with this conversation.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline px-4 py-2"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-primary px-4 py-2 bg-error-600 hover:bg-error-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
