'use client';

/**
 * ThemeToggle Component
 *
 * A button that toggles between light and dark themes using next-themes.
 * Uses Lucide icons for sun/moon indicators.
 */

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ThemeToggleProps {
  /** Show text label next to icon */
  showLabel?: boolean;
  /** Hide label (for collapsible sidebars) */
  hideLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ThemeToggle({ showLabel = false, hideLabel = false, className = '' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Show placeholder during SSR to avoid layout shift
  if (!mounted) {
    return (
      <Button variant="ghost" size={showLabel ? 'default' : 'icon'} disabled className={className}>
        <Sun className="h-5 w-5" />
        {showLabel && <span className="ml-2">Theme</span>}
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (showLabel) {
    return (
      <Button
        variant="ghost"
        onClick={toggleTheme}
        className={`w-full justify-start overflow-hidden ${className} ${hideLabel ? 'justify-center px-2' : ''}`}
      >
        {isDark ? (
          <Sun className="h-5 w-5 flex-shrink-0" />
        ) : (
          <Moon className="h-5 w-5 flex-shrink-0" />
        )}
        <span className={`ml-2 truncate transition-all duration-200 ${hideLabel ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100'}`}>
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={className}
        >
          {isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">
            {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isDark ? 'Light mode' : 'Dark mode'}
      </TooltipContent>
    </Tooltip>
  );
}
