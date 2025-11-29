'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AppSidebarProps {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  };
  currentPage?: 'home' | 'prompts' | 'conversations' | 'collections' | 'workspaces' | 'settings';
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    key: 'home',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/prompts',
    label: 'Library',
    key: 'prompts',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/conversations',
    label: 'Conversations',
    key: 'conversations',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: '/collections',
    label: 'Collections',
    key: 'collections',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    href: '/workspaces',
    label: 'Workspaces',
    key: 'workspaces',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export function AppSidebar({ user, currentPage }: AppSidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem('sidebar-collapsed', String(newValue));
  };

  const handleSignOut = async () => {
    const response = await fetch('/api/auth/signout', { method: 'POST' });
    if (response.ok) {
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-lg bg-white p-2 shadow-md md:hidden"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-neutral-200 bg-white transition-all duration-300
          md:relative md:z-auto
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-16' : 'w-[280px]'}
        `}
      >
        {/* Header */}
        <div className={`flex h-16 items-center border-b border-neutral-200 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">💧</span>
              <span className="text-xl font-semibold text-neutral-900">Distill</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard" className="flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            className={`hidden rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 md:block ${isCollapsed ? 'absolute right-2' : ''}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }
                      ${isCollapsed ? 'justify-center px-2' : ''}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={isActive ? 'text-primary-600' : 'text-neutral-500 group-hover:text-neutral-700'}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-neutral-200 p-3">
          <div className={`flex items-center gap-3 rounded-lg p-2 ${isCollapsed ? 'justify-center' : ''}`}>
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="h-9 w-9 flex-shrink-0 rounded-full"
              />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {user.name || 'User'}
                </p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>
            )}
          </div>
          {!isCollapsed ? (
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </form>
          ) : (
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                title="Sign out"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
