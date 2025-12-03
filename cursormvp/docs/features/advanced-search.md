# Advanced Search

Distill's Advanced Search provides powerful search capabilities for finding prompts across your library using multiple search strategies, filters, and personalization features.

## Overview

| Feature | Description |
|---------|-------------|
| Full-Text Search | PostgreSQL tsvector-based search on title + content |
| Semantic Search | Vector embedding similarity search |
| Hybrid Search | Combined FTS + Semantic with RRF ranking |
| Advanced Filters | Date range, tags, visibility, usage count |
| Saved Searches | Persist and reload search configurations |
| Search History | Track and reuse recent searches |
| Autocomplete | Fuzzy suggestions as you type |
| Highlighted Matches | Context snippets with matched terms |

---

## Search Modes

### Keyword Search
Simple case-insensitive title matching.

```typescript
// API
trpc.search.search.query({
  query: "API",
  mode: "KEYWORD",
  limit: 20
});
```

**Best for:** Quick title lookups, exact phrase matching

### Full-Text Search
PostgreSQL `tsvector` search across title and content with relevance ranking.

```typescript
// API
trpc.search.search.query({
  query: "API integration patterns",
  mode: "FULLTEXT",
  limit: 20
});
```

**Features:**
- Searches both title (weighted higher) and content
- Supports stemming (e.g., "running" matches "run")
- Relevance ranking with `ts_rank`
- Highlighted matches with `ts_headline`

**Best for:** Finding prompts by keywords anywhere in content

### Semantic Search
Vector similarity search using OpenAI embeddings.

```typescript
// API
trpc.search.search.query({
  query: "help me write better code",
  mode: "SEMANTIC",
  limit: 20
});
```

**Features:**
- Finds conceptually similar prompts
- Works even without exact keyword matches
- Uses cosine similarity scoring

**Best for:** Finding prompts by meaning/concept

### Hybrid Search
Combines Full-Text and Semantic search using Reciprocal Rank Fusion (RRF).

```typescript
// API
trpc.search.hybrid.query({
  query: "refactoring best practices",
  limit: 20,
  ftsWeight: 0.4,      // Weight for full-text results
  semanticWeight: 0.6  // Weight for semantic results
});
```

**Features:**
- Best of both keyword and semantic matching
- Configurable weights for each strategy
- RRF ensures robust score normalization

**Best for:** Comprehensive search combining keywords and concepts

---

## Advanced Filters

### Available Filters

| Filter | Type | Description |
|--------|------|-------------|
| `tags` | `string[]` | Filter by one or more tags |
| `isPublic` | `boolean` | Filter by visibility (public/private) |
| `dateFrom` | `Date` | Minimum creation date |
| `dateTo` | `Date` | Maximum creation date |
| `minUsageCount` | `number` | Minimum times prompt was used |
| `workspaceId` | `string` | Filter by workspace |
| `authorId` | `string` | Filter by author |

### Usage Example

```typescript
// API
trpc.search.search.query({
  query: "API",
  mode: "FULLTEXT",
  filters: {
    tags: ["javascript", "backend"],
    isPublic: true,
    dateFrom: new Date("2024-01-01"),
    minUsageCount: 5
  },
  limit: 20
});
```

### UI Usage

1. Click the **Filter** icon next to the search box
2. Expand the filter panel
3. Set desired filters:
   - **Date Range:** Click calendar icons to set from/to dates
   - **Tags:** Click tags to toggle selection
   - **Visibility:** Toggle "Public only" switch
   - **Usage:** Enter minimum usage count
4. Filters apply immediately to search results
5. Click **Clear filters** to reset

---

## Saved Searches

Save frequently used search configurations for quick access.

### Create Saved Search

```typescript
// API
trpc.search.createSavedSearch.mutate({
  name: "My JavaScript Prompts",
  query: "javascript",
  filters: {
    tags: ["javascript"],
    isPublic: false
  },
  searchMode: "FULLTEXT",
  isDefault: false
});
```

### List Saved Searches

```typescript
// API
const { savedSearches } = await trpc.search.listSavedSearches.query();
```

### Load Saved Search

```typescript
// In component
onLoadSavedSearch={(savedSearch) => {
  setSearchQuery(savedSearch.query || '');
  setSearchFilters(savedSearch.filters);
  setSearchMode(savedSearch.searchMode);
}}
```

### Delete Saved Search

```typescript
// API
trpc.search.deleteSavedSearch.mutate({ id: "saved-search-id" });
```

### UI Usage

1. Set up your search with query and filters
2. Click the **Bookmark** icon
3. Enter a name for your saved search
4. Click **Save**
5. Access saved searches from the bookmark dropdown
6. Click a saved search to load it
7. Click the X to delete a saved search

---

## Search History

Automatically tracks your recent searches for easy reuse.

### Get History

```typescript
// API
const { history } = await trpc.search.getHistory.query({ limit: 10 });
// Returns: { id, query, searchMode, resultCount, createdAt }[]
```

### Clear History

```typescript
// API
trpc.search.clearHistory.mutate();
```

### UI Usage

1. Click the **Clock** icon next to the search box
2. See your recent unique searches
3. Click any search to reload it
4. Click **Clear history** to remove all entries

---

## Autocomplete

Get intelligent suggestions as you type.

### API

```typescript
const { suggestions } = await trpc.search.autocomplete.query({
  query: "cod",
  limit: 8,
  includeHistory: true
});

// Returns:
// [
//   { type: "history", text: "code review", similarity: 1.0 },
//   { type: "title", text: "Code Refactoring Guide", similarity: 0.75 },
//   { type: "tag", text: "coding", similarity: 0.8 }
// ]
```

### Suggestion Types

| Type | Icon | Description |
|------|------|-------------|
| `history` | Clock | From your recent searches |
| `title` | Search | Matching prompt titles |
| `tag` | Badge | Matching tags |

### Features

- **Fuzzy matching:** Uses PostgreSQL trigram similarity
- **Debounced:** 200ms delay to reduce API calls
- **Keyboard navigation:** Arrow keys + Enter to select
- **Smart ranking:** History prioritized, then by similarity

### UI Usage

1. Start typing in the search box (minimum 2 characters)
2. Wait briefly for suggestions to appear
3. Use **Arrow Up/Down** to navigate
4. Press **Enter** to select a suggestion
5. Press **Escape** to dismiss
6. Click any suggestion to select it

---

## Highlighted Matches

Search results include highlighted snippets showing matching context.

### Response Format

```typescript
interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  score: number;
  highlight?: string;  // HTML with <b> tags around matches
}
```

### Example

Query: "API"

```json
{
  "title": "REST API Design Guide",
  "highlight": "...building a robust <b>API</b> requires careful planning of endpoints..."
}
```

### Rendering

```tsx
<div
  dangerouslySetInnerHTML={{ __html: result.highlight }}
  className="text-sm text-muted-foreground"
/>
```

---

## Auto-Embed

Embeddings are automatically generated when prompts are created or updated.

### Trigger Points

| Action | Embedding Generated |
|--------|---------------------|
| Create prompt via `savePrompt` | Yes |
| Update prompt (title/content/tags) | Yes |
| Distill conversation | Yes |

### Implementation

Embeddings are generated asynchronously (fire-and-forget) to not block the main response:

```typescript
// Internal - happens automatically
function triggerAutoEmbed(promptId: string): void {
  setImmediate(async () => {
    await embedPrompt(promptId);
  });
}
```

### Logs

Check server logs for embedding status:

```
[AutoEmbed] Starting embedding for prompt: clx123...
[AutoEmbed] Successfully embedded prompt: clx123...
```

---

## Database Setup

### Full-Text Search

Run the FTS setup script to create the search vector column and indexes:

```bash
cd app/packages/api
source ../../.env  # or set DATABASE_URL
bunx tsx scripts/setup-fts.ts
```

This creates:
- `search_vector` column on `prompts` table
- Trigger to auto-update vector on insert/update
- GIN index for fast searching

### Trigram Extension

Run the trigram setup script for autocomplete:

```bash
cd app/packages/api
source ../../.env
bunx tsx scripts/setup-trigram.ts
```

This creates:
- `pg_trgm` extension
- GIN indexes on title and content for fuzzy matching

---

## API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `search.search` | Query | Main search with mode selection |
| `search.fulltext` | Query | Full-text search only |
| `search.hybrid` | Query | Combined FTS + Semantic |
| `search.autocomplete` | Query | Get suggestions |
| `search.createSavedSearch` | Mutation | Save a search |
| `search.listSavedSearches` | Query | List saved searches |
| `search.updateSavedSearch` | Mutation | Update saved search |
| `search.deleteSavedSearch` | Mutation | Delete saved search |
| `search.getHistory` | Query | Get search history |
| `search.clearHistory` | Mutation | Clear history |
| `search.getStatus` | Query | Check FTS availability |

### Input Schemas

```typescript
// Search Input
{
  query: string;           // 1-500 characters
  mode: "KEYWORD" | "FULLTEXT" | "SEMANTIC" | "HYBRID";
  filters?: {
    tags?: string[];
    isPublic?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    minUsageCount?: number;
    workspaceId?: string;
    authorId?: string;
  };
  limit?: number;          // 1-100, default 20
  offset?: number;         // default 0
  includePublic?: boolean; // default true
  logSearch?: boolean;     // default true
}

// Autocomplete Input
{
  query: string;           // 1-100 characters
  limit?: number;          // 1-20, default 8
  includeHistory?: boolean; // default true
}

// Saved Search Input
{
  name: string;            // 1-100 characters
  query?: string;
  filters: { ... };
  searchMode: SearchMode;
  isDefault?: boolean;
}
```

---

## Performance Considerations

### Indexing

| Index | Type | Purpose |
|-------|------|---------|
| `prompts_search_vector_idx` | GIN | Full-text search |
| `prompts_title_trgm_idx` | GIN | Trigram autocomplete |
| `prompts_content_trgm_idx` | GIN | Trigram content match |
| `prompts_title_lower_idx` | B-tree | Prefix matching |

### Caching

| Query | Stale Time |
|-------|------------|
| Search results | 1 minute |
| Saved searches | 5 minutes |
| Search history | 1 minute |
| Autocomplete | 30 seconds |

### Debouncing

Autocomplete uses 200ms debounce to reduce API load while typing.

---

## Troubleshooting

### Full-Text Search Not Working

1. Check if FTS is set up:
   ```typescript
   const { status } = await trpc.search.getStatus.query();
   console.log(status.fulltextSearch); // should be true
   ```

2. Re-run setup script:
   ```bash
   bunx tsx scripts/setup-fts.ts
   ```

### Semantic Search Returns No Results

1. Ensure prompts have embeddings:
   ```sql
   SELECT COUNT(*) FROM prompt_embeddings;
   ```

2. Manually trigger embedding:
   ```typescript
   await trpc.embedding.embedPrompt.mutate({ promptId: "..." });
   ```

### Autocomplete Not Showing

1. Ensure query is at least 2 characters
2. Check trigram extension is installed:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
   ```

3. Re-run trigram setup:
   ```bash
   bunx tsx scripts/setup-trigram.ts
   ```

---

## Component Usage

### AdvancedSearchPanel Props

```typescript
interface AdvancedSearchPanelProps {
  // Required
  query: string;
  onQueryChange: (query: string) => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;

  // Optional
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
```

### Example Integration

```tsx
import { AdvancedSearchPanel } from '@/components/search';
import { trpc } from '@/lib/trpc';

function PromptSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('FULLTEXT');
  const [filters, setFilters] = useState<SearchFilters>({});

  const searchResult = trpc.search.search.useQuery(
    { query, mode, filters, limit: 20 },
    { enabled: query.length > 0 }
  );

  const autocomplete = trpc.search.autocomplete.useQuery(
    { query, limit: 8 },
    { enabled: query.length >= 2 }
  );

  return (
    <AdvancedSearchPanel
      query={query}
      onQueryChange={setQuery}
      mode={mode}
      onModeChange={setMode}
      filters={filters}
      onFiltersChange={setFilters}
      onSearch={() => searchResult.refetch()}
      isSearching={searchResult.isLoading}
      autocompleteSuggestions={autocomplete.data?.suggestions}
      isLoadingAutocomplete={autocomplete.isLoading}
    />
  );
}
```
