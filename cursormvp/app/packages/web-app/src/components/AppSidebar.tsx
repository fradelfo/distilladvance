'use client';

/**
 * AppSidebar Component
 *
 * Left navigation sidebar with collapsible state, mobile support,
 * user profile section, and theme toggle.
 * Uses shadcn/ui Avatar, Tooltip, and Lucide icons.
 */

import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FolderClosed,
  GitBranch,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AppSidebarProps {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  };
  currentPage?:
    | 'home'
    | 'prompts'
    | 'conversations'
    | 'collections'
    | 'workflows'
    | 'workspaces'
    | 'billing'
    | 'settings';
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
    href: '/workflows',
    label: 'Workflows',
    key: 'workflows',
    icon: GitBranch,
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

// Resize constraints
const MIN_WIDTH = 64; // Icon-only mode (matches w-16)
const MAX_WIDTH = 320; // Maximum expanded width
const DEFAULT_WIDTH = 240; // Default expanded width
const AUTO_CLOSE_THRESHOLD = 50; // Below this width during drag, auto-snap to closed

export function AppSidebar({ user, currentPage }: AppSidebarProps) {
  // Initialize with default to avoid SSR hydration mismatch
  // (localStorage is only available on client)
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Refs for resize operation
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const sidebarRef = useRef<HTMLElement>(null);

  // Sync width from localStorage after mount (client-only)
  useEffect(() => {
    const storedWidth = localStorage.getItem('sidebar-width');
    if (storedWidth) {
      const parsed = Number(storedWidth);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setWidth(parsed);
        return;
      }
    }
    // Legacy fallback for existing users
    const legacyCollapsed = localStorage.getItem('sidebar-collapsed');
    if (legacyCollapsed === 'true') {
      setWidth(MIN_WIDTH);
    }
  }, []);

  // Derived state - icon-only mode at minimum width
  const isCollapsed = width <= MIN_WIDTH;

  // Toggle between collapsed (MIN_WIDTH) and expanded (DEFAULT_WIDTH)
  const toggleSidebar = useCallback(() => {
    const newWidth = isCollapsed ? DEFAULT_WIDTH : MIN_WIDTH;
    setWidth(newWidth);
    localStorage.setItem('sidebar-width', String(newWidth));
  }, [isCollapsed]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      // Disable transitions during resize for smooth performance
      if (sidebarRef.current) {
        sidebarRef.current.style.transition = 'none';
      }

      // Set cursor globally and prevent text selection
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !sidebarRef.current) return;

    const delta = e.clientX - startX.current;
    // Allow dragging below MIN_WIDTH to detect auto-close intent
    const newWidth = Math.min(MAX_WIDTH, Math.max(0, startWidth.current + delta));

    // Direct DOM manipulation for 60fps performance
    sidebarRef.current.style.width = `${Math.max(MIN_WIDTH, newWidth)}px`;

    // Store the raw width for auto-close detection
    sidebarRef.current.dataset.rawWidth = String(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isResizing.current) return;

    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (sidebarRef.current) {
      // Re-enable transitions
      sidebarRef.current.style.transition = '';

      // Check if user dragged below auto-close threshold
      const rawWidth =
        Number(sidebarRef.current.dataset.rawWidth) || sidebarRef.current.offsetWidth;
      const finalWidth =
        rawWidth < AUTO_CLOSE_THRESHOLD ? MIN_WIDTH : Math.max(MIN_WIDTH, rawWidth);

      // Clean up data attribute
      delete sidebarRef.current.dataset.rawWidth;

      // Apply final width with transition
      sidebarRef.current.style.width = `${finalWidth}px`;
      setWidth(finalWidth);
      localStorage.setItem('sidebar-width', String(finalWidth));
    }
  }, []);

  // Attach document-level listeners for drag outside sidebar
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-background transition-all duration-300',
          'md:relative md:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{ width: `${width}px` }}
      >
        {/* Header */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-border px-4 overflow-hidden',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden min-w-0">
            <span className="text-2xl flex-shrink-0">💧</span>
            <span
              className={cn(
                'text-xl font-semibold text-foreground truncate transition-all duration-200',
                isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}
            >
              Distill
            </span>
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={cn('hidden md:flex', isCollapsed && 'absolute right-2')}
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
            <TooltipContent side="right">{isCollapsed ? 'Expand' : 'Collapse'}</TooltipContent>
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
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    isCollapsed && 'justify-center px-2 gap-0'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'truncate transition-all duration-200',
                      isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );

              if (isCollapsed) {
                return (
                  <li key={item.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
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
          <ThemeToggle
            showLabel
            hideLabel={isCollapsed}
            className="mb-2 w-full text-muted-foreground hover:text-foreground"
          />

          {/* User info */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg p-2 overflow-hidden',
              isCollapsed && 'justify-center gap-0'
            )}
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'min-w-0 flex-1 transition-all duration-200',
                isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}
            >
              <p className="truncate text-sm font-medium text-foreground">{user.name || 'User'}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Sign out */}
          <Button
            onClick={() => signOut({ callbackUrl: '/login' })}
            variant="ghost"
            className={cn(
              'mt-2 w-full justify-start text-muted-foreground hover:text-foreground overflow-hidden',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                'ml-2 truncate transition-all duration-200',
                isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100'
              )}
            >
              Sign out
            </span>
          </Button>
        </div>

        {/* Resize handle - desktop only */}
        <div
          className={cn(
            'absolute right-0 top-0 h-full w-3 -mr-1.5 cursor-col-resize',
            'hidden md:flex items-center justify-center',
            'group transition-colors'
          )}
          onMouseDown={handleResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          tabIndex={0}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 50 : 10;
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              const newWidth = Math.max(MIN_WIDTH, width - step);
              setWidth(newWidth);
              localStorage.setItem('sidebar-width', String(newWidth));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              const newWidth = Math.min(MAX_WIDTH, width + step);
              setWidth(newWidth);
              localStorage.setItem('sidebar-width', String(newWidth));
            }
          }}
        >
          {/* Full-height border line indicator */}
          <div
            className={cn(
              'h-full w-px bg-border',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
              'group-hover:bg-primary/40 group-active:bg-primary/60 group-active:opacity-100'
            )}
          />
        </div>
      </aside>
    </>
  );
}
