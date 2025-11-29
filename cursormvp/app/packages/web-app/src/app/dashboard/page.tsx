import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';

export const metadata = {
  title: 'Dashboard',
  description: 'Your Distill dashboard',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="dashboard">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Welcome back, {session.user.name || 'User'}
            </p>
          </div>
          <Link href="/prompts/new" className="btn-primary px-4 py-2">
            <span className="flex items-center gap-2">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Prompt
            </span>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-4">
            <p className="text-sm text-neutral-500">Total Prompts</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">0</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-neutral-500">This Week</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">0 runs</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-neutral-500">Team Members</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">1</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/prompts"
              className="card p-4 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-medium text-neutral-900">Prompt Library</h3>
              <p className="text-sm text-neutral-500">Browse your prompts</p>
            </Link>
            <Link
              href="/conversations"
              className="card p-4 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-medium text-neutral-900">Conversations</h3>
              <p className="text-sm text-neutral-500">View captured chats</p>
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

        {/* Getting Started */}
        <div className="mt-8">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              Getting Started
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Start by capturing a conversation from ChatGPT, Claude, or other AI
              tools using the Distill browser extension.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-6 py-2"
              >
                Install Extension
              </a>
              <Link href="/prompts/new" className="btn-outline px-6 py-2">
                Create Manually
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
