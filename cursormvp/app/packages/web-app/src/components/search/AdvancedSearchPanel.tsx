'use client';

/**
 * AdvancedSearchPanel Component
 *
 * Provides advanced search functionality with:
 * - Search mode selector (Keyword, Full-text, Semantic, Hybrid)
 * - Advanced filters (date range, tags, public/private, usage count)
 * - Saved searches dropdown
 * - Search history dropdown
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  BookmarkIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  FilterIcon,
  SearchIcon,
  SparklesIcon,
  XIcon,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export type SearchMode = 'KEYWORD' | 'FULLTEXT' | 'SEMANTIC' | 'HYBRID';

export interface SearchFilters {
  tags?: string[];
  isPublic?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  minUsageCount?: number;
  workspaceId?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query?: string | null;
  filters: SearchFilters;
  searchMode: SearchMode;
  isDefault: boolean;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  searchMode: SearchMode;
  resultCount: number;
  createdAt: Date;
}

export interface AutocompleteSuggestion {
  type: 'title' | 'history' | 'tag';
  text: string;
  similarity: number;
}

interface AdvancedSearchPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  isSearching?: boolean;
  availableTags?: string[];
  savedSearches?: SavedSearch[];
  searchHistory?: SearchHistoryItem[];
  onSaveSearch?: (name: string) => void;
  onLoadSavedSearch?: (search: SavedSearch) => void;
  onDeleteSavedSearch?: (id: string) => void;
  onClearHistory?: () => void;
  autocompleteSuggestions?: AutocompleteSuggestion[];
  isLoadingAutocomplete?: boolean;
  onSelectSuggestion?: (suggestion: AutocompleteSuggestion) => void;
  className?: string;
}

// ============================================================================
// Search Mode Icons & Labels
// ============================================================================

const SEARCH_MODES: { value: SearchMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'KEYWORD',
    label: 'Keyword',
    description: 'Simple title search',
    icon: <SearchIcon className="h-4 w-4" />,
  },
  {
    value: 'FULLTEXT',
    label: 'Full-Text',
    description: 'Search title & content',
    icon: <FilterIcon className="h-4 w-4" />,
  },
  {
    value: 'SEMANTIC',
    label: 'Semantic',
    description: 'Search by meaning',
    icon: <SparklesIcon className="h-4 w-4" />,
  },
  {
    value: 'HYBRID',
    label: 'Hybrid',
    description: 'Combined search',
    icon: <Zap className="h-4 w-4" />,
  },
];

// ============================================================================
// Component
// ============================================================================

export function AdvancedSearchPanel({
  query,
  onQueryChange,
  mode,
  onModeChange,
  filters,
  onFiltersChange,
  onSearch,
  isSearching = false,
  availableTags = [],
  savedSearches = [],
  searchHistory = [],
  onSaveSearch,
  onLoadSavedSearch,
  onDeleteSavedSearch,
  onClearHistory,
  autocompleteSuggestions = [],
  isLoadingAutocomplete = false,
  onSelectSuggestion,
  className,
}: AdvancedSearchPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Show autocomplete when query changes and suggestions are available
  useEffect(() => {
    if (query.length > 0 && autocompleteSuggestions.length > 0) {
      setShowAutocomplete(true);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowAutocomplete(false);
    }
  }, [query, autocompleteSuggestions]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      onQueryChange(suggestion.text);
      setShowAutocomplete(false);
      setSelectedSuggestionIndex(-1);
      onSelectSuggestion?.(suggestion);
    },
    [onQueryChange, onSelectSuggestion]
  );

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showAutocomplete && autocompleteSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleSelectSuggestion(autocompleteSuggestions[selectedSuggestionIndex]);
        } else if (e.key === 'Escape') {
          setShowAutocomplete(false);
          setSelectedSuggestionIndex(-1);
        } else if (e.key === 'Enter') {
          setShowAutocomplete(false);
          onSearch();
        }
      } else if (e.key === 'Enter') {
        onSearch();
      }
    },
    [showAutocomplete, autocompleteSuggestions, selectedSuggestionIndex, handleSelectSuggestion, onSearch]
  );

  // Count active filters
  const activeFilterCount = [
    filters.tags && filters.tags.length > 0,
    filters.isPublic !== undefined,
    filters.dateFrom,
    filters.dateTo,
    filters.minUsageCount !== undefined,
  ].filter(Boolean).length;

  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    onFiltersChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({});
    setShowFilters(false);
  };

  // Handle save search
  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim());
      setSaveSearchName('');
      setSaveDialogOpen(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Search Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input with Autocomplete */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search prompts..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length > 0 && autocompleteSuggestions.length > 0) {
                setShowAutocomplete(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow click on suggestions
              setTimeout(() => setShowAutocomplete(false), 200);
            }}
            className="pl-9 pr-4"
            aria-label="Search prompts"
            aria-expanded={showAutocomplete}
            aria-autocomplete="list"
            role="combobox"
          />
          {/* Autocomplete Dropdown */}
          {showAutocomplete && (autocompleteSuggestions.length > 0 || isLoadingAutocomplete) && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
              {isLoadingAutocomplete ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading suggestions...</div>
              ) : (
                autocompleteSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.text}`}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none transition-colors',
                      selectedSuggestionIndex === index
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    role="option"
                    aria-selected={selectedSuggestionIndex === index}
                  >
                    {suggestion.type === 'history' && (
                      <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {suggestion.type === 'title' && (
                      <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {suggestion.type === 'tag' && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        tag
                      </Badge>
                    )}
                    <span className="flex-1 truncate text-left">{suggestion.text}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Search Mode Selector */}
        <Select value={mode} onValueChange={(v) => onModeChange(v as SearchMode)}>
          <SelectTrigger className="w-[160px]" aria-label="Search mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                <div className="flex items-center gap-2">
                  {m.icon}
                  <span>{m.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Toggle */}
        <Button
          variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          aria-expanded={showFilters}
        >
          <FilterIcon className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Saved Searches Dropdown */}
        {(savedSearches.length > 0 || onSaveSearch) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Saved searches">
                <BookmarkIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              {savedSearches.length > 0 ? (
                <>
                  {savedSearches.map((search) => (
                    <DropdownMenuItem
                      key={search.id}
                      onClick={() => onLoadSavedSearch?.(search)}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate">{search.name}</span>
                      {search.isDefault && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Default
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No saved searches
                </div>
              )}
              {onSaveSearch && query && (
                <DropdownMenuItem
                  onClick={() => setSaveDialogOpen(true)}
                  className="border-t mt-1 pt-2"
                >
                  <BookmarkIcon className="h-4 w-4 mr-2" />
                  Save current search
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Search History Dropdown */}
        {searchHistory.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Search history">
                <ClockIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              {searchHistory.slice(0, 10).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => {
                    onQueryChange(item.query);
                    onModeChange(item.searchMode);
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="truncate flex-1">{item.query}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {item.resultCount} results
                  </span>
                </DropdownMenuItem>
              ))}
              {onClearHistory && (
                <DropdownMenuItem onClick={onClearHistory} className="border-t mt-1 pt-2 text-destructive">
                  Clear history
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Search Button */}
        <Button onClick={onSearch} disabled={isSearching}>
          {isSearching ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Searching...
            </span>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filters</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-from"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-to"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Min Usage Count */}
            <div className="space-y-2">
              <Label htmlFor="min-usage">Min Usage Count</Label>
              <Input
                id="min-usage"
                type="number"
                min={0}
                placeholder="0"
                value={filters.minUsageCount ?? ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minUsageCount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Public/Private Toggle */}
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={filters.isPublic === undefined ? 'all' : filters.isPublic ? 'public' : 'private'}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    isPublic: v === 'all' ? undefined : v === 'public',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Public only</SelectItem>
                  <SelectItem value="private">Private only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 20).map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags?.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {availableTags.length > 20 && (
                  <span className="text-sm text-muted-foreground">
                    +{availableTags.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Active:</span>
              {filters.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <XIcon
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => handleTagToggle(tag)}
                  />
                </Badge>
              ))}
              {filters.dateFrom && (
                <Badge variant="secondary" className="gap-1">
                  From: {format(filters.dateFrom, 'MMM d')}
                  <XIcon
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onFiltersChange({ ...filters, dateFrom: undefined })}
                  />
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="secondary" className="gap-1">
                  To: {format(filters.dateTo, 'MMM d')}
                  <XIcon
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onFiltersChange({ ...filters, dateTo: undefined })}
                  />
                </Badge>
              )}
              {filters.isPublic !== undefined && (
                <Badge variant="secondary" className="gap-1">
                  {filters.isPublic ? 'Public' : 'Private'}
                  <XIcon
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onFiltersChange({ ...filters, isPublic: undefined })}
                  />
                </Badge>
              )}
              {filters.minUsageCount !== undefined && (
                <Badge variant="secondary" className="gap-1">
                  Usage {'>='} {filters.minUsageCount}
                  <XIcon
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onFiltersChange({ ...filters, minUsageCount: undefined })}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save Search Dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="save-search-name">Name</Label>
                <Input
                  id="save-search-name"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="My search..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedSearchPanel;
