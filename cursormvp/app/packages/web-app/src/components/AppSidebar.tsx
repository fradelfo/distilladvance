'use client';

/**
 * AppSidebar Component
 *
 * Left navigation sidebar with collapsible state, mobile support,
 * user profile section, and theme toggle.
 * Uses shadcn/ui Avatar, Tooltip, and Lucide icons.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  BookOpen,
  MessageSquare,
  FolderClosed,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  };
  currentPage?: 'home' | 'prompts' | 'conversations' | 'collections' | 'workspaces' | 'billing' | 'settings';
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    key: 'home',
    icon: Home,
  },
  {
    href: '/prompts',
    label: 'Library',
    key: 'prompts',
    icon: BookOpen,
  },
  {
    href: '/conversations',
    label: 'Conversations',
    key: 'conversations',
    icon: MessageSquare,
  },
  {
    href: '/collections',
    label: 'Collections',
    key: 'collections',
    icon: FolderClosed,
  },
  {
    href: '/workspaces',
    label: 'Workspaces',
    key: 'workspaces',
    icon: Users,
  },
  {
    href: '/billing',
    label: 'Billing',
    key: 'billing',
    icon: CreditCard,
  },
];

export function AppSidebar({ user, currentPage }: AppSidebarProps) {
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

  const getUserInitials = () => {
    if (user.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    return user.email[0].toUpperCase();
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
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-30 md:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-background transition-all duration-300',
          'md:relative md:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-16' : 'w-[280px]'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex h-16 items-center border-b border-border px-4',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">💧</span>
              <span className="text-xl font-semibold text-foreground">Distill</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard" className="flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </Link>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className={cn(
                  'hidden md:flex',
                  isCollapsed && 'absolute right-2'
                )}
              >
                {isCollapsed ? (
                  <ChevronsRight className="h-5 w-5" />
                ) : (
                  <ChevronsLeft className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? 'Expand' : 'Collapse'}
            </TooltipContent>
          </Tooltip>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.key;
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <li key={item.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.key}>{linkContent}</li>;
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-border p-3">
          {/* Theme toggle */}
          {isCollapsed ? (
            <div className="mb-2 flex justify-center">
              <ThemeToggle />
            </div>
          ) : (
            <ThemeToggle showLabel className="mb-2 w-full justify-start text-muted-foreground hover:text-foreground" />
          )}

          {/* User info */}
          <div className={cn(
            'flex items-center gap-3 rounded-lg p-2',
            isCollapsed && 'justify-center'
          )}>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name || 'User'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>

          {/* Sign out */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <form action="/api/auth/signout" method="POST">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="mt-2 w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Sign out</span>
                  </Button>
                </form>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <form action="/api/auth/signout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2">Sign out</span>
              </Button>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
