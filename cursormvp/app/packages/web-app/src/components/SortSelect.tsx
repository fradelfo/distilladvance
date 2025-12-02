'use client';

/**
 * SortSelect Component
 *
 * Dropdown select for sorting options using shadcn/ui Select.
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      <Label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">
        Sort by:
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
        <SelectTrigger id="sort-select" className="w-[160px] h-9">
          <SelectValue placeholder="Select sort" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
