'use client';

/**
 * HomeContent Component
 *
 * Client component for the home page that displays:
 * - Stats overview (prompts, runs, conversations)
 * - Recent activity feed
 * - Recent prompts and conversations
 * - Quick actions
 */

import Link from 'next/link';
import { trpc } from '@/lib/trpc';

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Get source icon
function getSourceIcon(source: string): string {
  switch (source?.toLowerCase()) {
    case 'chatgpt': return '🤖';
    case 'claude': return '🟠';
    case 'gemini': return '💎';
    case 'copilot': return '🔷';
    default: return '💬';
  }
}

interface HomeContentProps {
  userName?: string;
}

export function HomeContent({ userName }: HomeContentProps) {
  // Fetch recent prompts
  const {
    data: promptsData,
    isLoading: promptsLoading
  } = trpc.distill.listPrompts.useInfiniteQuery(
    { limit: 5 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  // Fetch recent conversations
  const {
    data: conversationsData,
    isLoading: conversationsLoading
  } = trpc.conversation.list.useInfiniteQuery(
    { limit: 5 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  // Fetch conversation stats
  const {
    data: conversationStatsData,
    isLoading: conversationStatsLoading
  } = trpc.conversation.stats.useQuery();

  // Fetch prompt stats
  const {
    data: promptStatsData,
    isLoading: promptStatsLoading
  } = trpc.distill.stats.useQuery();

  // Extract data
  const recentPrompts = promptsData?.pages?.[0]?.prompts ?? [];
  const recentConversations = conversationsData?.pages?.[0]?.conversations ?? [];
  const conversationStats = conversationStatsData?.stats;
  const totalConversations = conversationStats?.total ?? 0;
  const totalPrompts = promptStatsData?.stats?.total ?? 0;

  // Combine recent items for activity feed
  const activityItems = [
    ...recentPrompts.slice(0, 3).map(p => ({
      type: 'prompt' as const,
      title: p.title,
      time: p.createdAt,
      id: p.id,
    })),
    ...recentConversations.slice(0, 3).map(c => ({
      type: 'conversation' as const,
      title: c.title,
      time: c.createdAt,
      id: c.id,
      source: c.source,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  const isLoading = promptsLoading || conversationsLoading || conversationStatsLoading || promptStatsLoading;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-neutral-500">Total Prompts</p>
          {isLoading ? (
            <div className="mt-1 h-8 w-16 animate-pulse rounded bg-neutral-200" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-neutral-900">
              {totalPrompts}
            </p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-500">Conversations</p>
          {isLoading ? (
            <div className="mt-1 h-8 w-16 animate-pulse rounded bg-neutral-200" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-neutral-900">
              {totalConversations}
            </p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-500">Sources</p>
          {isLoading ? (
            <div className="mt-1 h-8 w-24 animate-pulse rounded bg-neutral-200" />
          ) : (
            <div className="mt-1 flex gap-2">
              {conversationStats?.bySource && conversationStats.bySource.map(({ source, count }) => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs"
                  title={`${source}: ${count}`}
                >
                  {getSourceIcon(source)} {count}
                </span>
              ))}
              {!conversationStats?.bySource && <span className="text-neutral-400">-</span>}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h2>
        <div className="card divide-y divide-neutral-100">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                </div>
              </div>
            ))
          ) : activityItems.length > 0 ? (
            activityItems.map((item, i) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.type === 'prompt' ? `/prompts/${item.id}` : `/conversations/${item.id}`}
                className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm">
                  {item.type === 'prompt' ? '📝' : getSourceIcon((item as any).source)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {item.type === 'prompt' ? 'Created prompt' : 'Saved conversation'}: {item.title}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatRelativeTime(item.time)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-neutral-500">
              <p>No recent activity</p>
              <p className="text-sm mt-1">Start by capturing a conversation or creating a prompt</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Items Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Prompts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Prompts</h2>
            <Link href="/prompts" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="card divide-y divide-neutral-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded bg-neutral-200" />
                </div>
              ))
            ) : recentPrompts.length > 0 ? (
              recentPrompts.slice(0, 5).map((prompt) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.id}`}
                  className="block p-4 hover:bg-neutral-50 transition-colors"
                >
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {prompt.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                      {formatRelativeTime(prompt.createdAt)}
                    </span>
                    {prompt.tags?.length > 0 && (
                      <span className="text-xs text-neutral-400">
                        {prompt.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-neutral-500">
                <p className="text-2xl mb-2">📝</p>
                <p>No prompts yet</p>
                <Link href="/prompts/new" className="text-sm text-primary-600 hover:underline">
                  Create your first prompt
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Conversations</h2>
            <Link href="/conversations" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="card divide-y divide-neutral-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded bg-neutral-200" />
                </div>
              ))
            ) : recentConversations.length > 0 ? (
              recentConversations.slice(0, 5).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="block p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{getSourceIcon(conv.source)}</span>
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {conv.title}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                    <span>{conv.source}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(conv.createdAt)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-neutral-500">
                <p className="text-2xl mb-2">💬</p>
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Use the extension to capture chats</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/prompts/new"
            className="card p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-medium text-neutral-900">New Prompt</h3>
            <p className="text-sm text-neutral-500">Create from scratch</p>
          </Link>
          <Link
            href="/prompts"
            className="card p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-medium text-neutral-900">Library</h3>
            <p className="text-sm text-neutral-500">Browse prompts</p>
          </Link>
          <Link
            href="/collections"
            className="card p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-2">📁</div>
            <h3 className="font-medium text-neutral-900">Collections</h3>
            <p className="text-sm text-neutral-500">Organize prompts</p>
          </Link>
          <Link
            href="/workspaces"
            className="card p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-medium text-neutral-900">Workspaces</h3>
            <p className="text-sm text-neutral-500">Team collaboration</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
