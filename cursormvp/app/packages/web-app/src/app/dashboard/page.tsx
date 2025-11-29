import { auth, signOut } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  // This should be caught by middleware, but double-check
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">💧</span>
              <span className="text-xl font-semibold text-neutral-900">Distill</span>
            </Link>
            <nav className="hidden md:flex md:gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-primary-600"
              >
                Library
              </Link>
              <Link
                href="/collections"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Collections
              </Link>
              <Link
                href="/workspaces"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Workspaces
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-neutral-900">
                  {session.user.name || 'User'}
                </p>
                <p className="text-xs text-neutral-500">{session.user.email}</p>
              </div>
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                  {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Sign Out */}
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="btn-ghost px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Prompt Library</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Your captured and distilled prompts
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

        {/* Empty State */}
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-5xl">📝</div>
          <h2 className="text-lg font-semibold text-neutral-900">
            No prompts yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-600">
            Start by capturing a conversation from ChatGPT, Claude, or other AI
            tools using the Distill browser extension.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

        {/* Quick Stats (placeholder for when there are prompts) */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
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
      </main>
    </div>
  );
}
