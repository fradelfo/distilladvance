import { signOut } from '@/auth';
import Link from 'next/link';

interface AppHeaderProps {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  };
  currentPage?: 'dashboard' | 'prompts' | 'conversations' | 'collections' | 'workspaces' | 'settings';
}

export function AppHeader({ user, currentPage }: AppHeaderProps) {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/prompts', label: 'Library', key: 'prompts' },
    { href: '/conversations', label: 'Conversations', key: 'conversations' },
    { href: '/collections', label: 'Collections', key: 'collections' },
    { href: '/workspaces', label: 'Workspaces', key: 'workspaces' },
  ];

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <span className="text-xl font-semibold text-neutral-900">Distill</span>
          </Link>
          <nav className="hidden md:flex md:gap-4">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-sm font-medium ${
                  currentPage === item.key
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-neutral-900">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                {(user.name || user.email || 'U')[0].toUpperCase()}
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
  );
}
