'use client';

/**
 * PromptSearch Component
 *
 * Search input with debounced updates for filtering prompts.
 * Uses shadcn/ui Input and Lucide icons.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptSearchProps {
  /** Callback when search value changes (debounced) */
  onSearch: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Initial search value */
  initialValue?: string;
  /** Additional CSS classes */
  className?: string;
}

export function PromptSearch({
  onSearch,
  placeholder = 'Search prompts...',
  debounceMs = 300,
  initialValue = '',
  className = '',
}: PromptSearchProps) {
  const [value, setValue] = useState(initialValue);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className={cn('relative', className)}>
      {/* Search Icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Input */}
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
        aria-label="Search prompts"
      />

      {/* Clear Button */}
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 h-full w-10 rounded-l-none hover:bg-transparent"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      )}
    </div>
  );
}
