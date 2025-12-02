'use client';

/**
 * TagFilter Component
 *
 * Displays a list of tag chips for filtering prompts.
 * Supports single and multi-select modes.
 * Uses shadcn/ui Badge component.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface TagFilterProps {
  /** Available tags to display */
  tags: string[];
  /** Currently selected tags */
  selectedTags: string[];
  /** Callback when tag selection changes */
  onTagsChange: (tags: string[]) => void;
  /** Allow multiple tag selection (default: true) */
  multiSelect?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TagFilter({
  tags,
  selectedTags,
  onTagsChange,
  multiSelect = true,
  className = '',
}: TagFilterProps) {
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      // Add tag
      if (multiSelect) {
        onTagsChange([...selectedTags, tag]);
      } else {
        onTagsChange([tag]);
      }
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {selectedTags.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
            aria-pressed={isSelected}
          >
            <Badge
              variant={isSelected ? 'default' : 'secondary'}
              className={cn('cursor-pointer transition-colors', isSelected && 'pr-1.5')}
            >
              {tag}
              {isSelected && <X className="ml-1 h-3 w-3" aria-hidden="true" />}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

/**
 * TagChip Component
 *
 * A standalone tag display chip (non-interactive).
 */
interface TagChipProps {
  tag: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function TagChip({ tag, size = 'sm', className = '' }: TagChipProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm', className)}
    >
      {tag}
    </Badge>
  );
}
