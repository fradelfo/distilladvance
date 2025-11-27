'use client';

/**
 * SortSelect Component
 *
 * Dropdown select for sorting options.
 */

export type SortOption = 'recent' | 'oldest' | 'most_used' | 'alphabetical';

interface SortSelectProps {
  /** Current sort value */
  value: SortOption;
  /** Callback when sort changes */
  onChange: (value: SortOption) => void;
  /** Additional CSS classes */
  className?: string;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most_used', label: 'Most Used' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export function SortSelect({ value, onChange, className = '' }: SortSelectProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="sort-select" className="text-sm text-neutral-600 whitespace-nowrap">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="input py-1.5 text-sm pr-8 bg-white"
        aria-label="Sort prompts by"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
