'use client';

/**
 * TagFilter Component
 *
 * Displays a list of tag chips for filtering prompts.
 * Supports single and multi-select modes.
 */

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
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {selectedTags.length > 0 && (
        <button
          onClick={clearAll}
          className="text-xs text-neutral-500 hover:text-neutral-700 underline"
        >
          Clear all
        </button>
      )}
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`
              inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
              transition-colors duration-150
              ${
                isSelected
                  ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
            `}
            aria-pressed={isSelected}
          >
            {tag}
            {isSelected && (
              <svg
                className="ml-1.5 h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
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
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`
        inline-flex items-center rounded-full bg-neutral-100 text-neutral-600 font-medium
        ${sizeClasses}
        ${className}
      `}
    >
      {tag}
    </span>
  );
}
