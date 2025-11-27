# Web App Library Design Spec

**Status:** Draft
**PRD:** `docs/requirements/mvp-prd.md` (FR-LIB-01 through FR-LIB-04, FR-EDIT-01, FR-RUN-01)
**Updated:** 2025-11-26

---

## Overview

The Web App Library is the central hub where users browse, search, organize, and use their team's prompt collection. It's the primary interface for discovering and reusing prompts, making it critical for the core value proposition of Distill.

**Key User Story (US-02):**
> As a team member, I want to search and run prompts from our team library so that I can reuse proven workflows without starting from scratch.

---

## User Flow

### Happy Path: Find and Run a Prompt
1. User navigates to Library (default landing after login)
2. User sees prompt grid/list with recent prompts
3. User types search query (e.g., "customer email")
4. Results filter in real-time (<500ms)
5. User clicks on a prompt card
6. Prompt detail panel opens (or navigates to detail page)
7. User clicks "Run" button
8. Variable fill modal appears (if prompt has variables)
9. User fills variables and clicks "Run in ChatGPT"
10. Prompt copied to clipboard + ChatGPT opens
11. Success toast: "Copied to clipboard!"

### Alternative Paths

**Browse by Collection:**
1. User clicks collection in sidebar
2. Library filters to show only prompts in that collection
3. User continues browsing or searching within collection

**Filter by Tag:**
1. User clicks tag chip on any prompt card
2. Library filters to show prompts with that tag
3. Tag appears in active filters area

**Sort Results:**
1. User clicks sort dropdown
2. Options: Recent, Most Used, Alphabetical
3. Library re-orders immediately

**Quick Copy (no variables):**
1. User hovers over prompt card
2. Copy icon appears
3. User clicks copy icon
4. Prompt copied to clipboard
5. Toast: "Prompt copied!"

### Error Paths

**Search Returns No Results:**
1. User types search query
2. No matches found
3. Empty state: "No prompts found for '[query]'"
4. Suggestions: "Try different keywords" + "Capture your first prompt"

**Network Error Loading Library:**
1. User navigates to Library
2. API request fails
3. Error state with retry button
4. Message: "Couldn't load your prompts. Check your connection."

**Prompt Deleted by Another User:**
1. User clicks on prompt card
2. Prompt no longer exists (deleted by teammate)
3. Error: "This prompt was deleted"
4. Redirect back to library

---

## Screen Inventory

| Screen | Purpose | Entry Points | Exit Points |
|--------|---------|--------------|-------------|
| Library Grid | Browse all prompts | Login, Nav, Extension success | Prompt Detail, Settings |
| Prompt Detail | View/edit single prompt | Library click, Direct URL, Search | Library (back), Run modal |
| Run Modal | Fill variables, execute | Prompt Detail "Run" button | Success (close), Cancel |
| Collection View | Filtered by collection | Sidebar click | Library (clear filter) |
| Search Results | Filtered by query | Search input | Library (clear search) |
| Empty State | No prompts yet | First login | Capture flow (CTA) |

---

## Components

### 1. Library Header

**Purpose:** Page title, workspace context, primary actions

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│  📚 Prompt Library          [Workspace ▼]      [+ New Prompt]  │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Shows workspace name
- Loading: Skeleton for workspace dropdown
- Multi-workspace: Dropdown enabled

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| workspaceName | string | required | Current workspace |
| workspaces | Workspace[] | [] | User's workspaces |
| onWorkspaceChange | function | - | Switch workspace handler |
| onNewPrompt | function | - | Manual prompt creation |

**Accessibility:**
- Keyboard: Tab to each element, Enter to activate
- Screen reader: "Prompt Library, [workspace name] workspace"
- ARIA: `aria-label` on workspace selector

---

### 2. Search Bar

**Purpose:** Full-text search across prompts

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│  🔍  Search prompts...                              [⌘K]       │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Placeholder text, search icon
- Focus: Border highlight, clear keyboard hint
- Active: Query text visible
- Loading: Subtle spinner replacing search icon
- With Results: Result count shown
- No Results: Red border (subtle), count shows "0"

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | "" | Current search query |
| onChange | function | - | Query change handler |
| resultCount | number | null | Number of results |
| isLoading | boolean | false | Search in progress |
| placeholder | string | "Search prompts..." | Placeholder text |

**Accessibility:**
- Keyboard: Cmd/Ctrl+K global shortcut, Escape to clear
- Screen reader: "Search prompts, [n] results found"
- ARIA: `role="search"`, `aria-describedby` for result count

---

### 3. Filter Bar

**Purpose:** Active filters and sorting controls

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│  Filters: [Tag: marketing ×] [Creator: Jane ×]    Sort: Recent▼│
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Hidden when no filters active
- Active: Shows filter chips with remove buttons
- Hover: Chip shows remove icon

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| filters | Filter[] | [] | Active filter objects |
| sortBy | 'recent' \| 'used' \| 'alpha' | 'recent' | Sort order |
| onRemoveFilter | function | - | Remove filter handler |
| onSortChange | function | - | Sort change handler |

**Accessibility:**
- Keyboard: Tab through chips, Enter/Space to remove
- Screen reader: "Active filters: [filter names]. Press delete to remove."
- ARIA: `aria-label` on each chip button

---

### 4. Prompt Card

**Purpose:** Display prompt summary in grid/list

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│  Customer Onboarding Email                              [Copy] │
│  ─────────────────────────────────────────────────────────────│
│  Write a personalized onboarding email for {{customer_name}}   │
│  targeting {{product_tier}} users...                           │
│  ─────────────────────────────────────────────────────────────│
│  [marketing] [email] [onboarding]                              │
│  👤 Jane · 12 runs · 2 days ago                                │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Normal display
- Hover: Elevated shadow, copy button appears
- Focus: Outline visible (keyboard nav)
- Loading: Skeleton placeholder
- Selected: Blue border (if multi-select enabled)

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prompt | Prompt | required | Prompt data object |
| onSelect | function | - | Card click handler |
| onCopy | function | - | Quick copy handler |
| onTagClick | function | - | Tag filter handler |
| isCompact | boolean | false | List view mode |

**Accessibility:**
- Keyboard: Tab to card, Enter to open, C to copy
- Screen reader: "[Title], [n] variables, [n] runs, by [creator], [tags]"
- ARIA: `role="article"`, `aria-labelledby` title

---

### 5. Sidebar (Collections)

**Purpose:** Navigate by collection, quick stats

**Layout:**
```
┌──────────────────┐
│  Collections     │
│  ───────────────│
│  📁 All Prompts  │
│  📁 Marketing    │
│  📁 Sales        │
│  📁 Support      │
│  ───────────────│
│  + New Collection│
│  ───────────────│
│  📊 Stats        │
│  42 prompts      │
│  156 runs/week   │
└──────────────────┘
```

**States:**
- Default: All collections visible
- Selected: Active collection highlighted
- Collapsed: Icon-only mode on smaller screens
- Empty: "No collections yet" + create CTA

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| collections | Collection[] | [] | User's collections |
| activeCollection | string \| null | null | Selected collection ID |
| onSelect | function | - | Collection click handler |
| onCreateCollection | function | - | New collection handler |
| stats | LibraryStats | - | Prompt/run counts |
| isCollapsed | boolean | false | Compact sidebar mode |

**Accessibility:**
- Keyboard: Arrow keys to navigate, Enter to select
- Screen reader: "Collections navigation, [n] collections"
- ARIA: `role="navigation"`, `aria-current` on active

---

### 6. Prompt Detail Panel/Page

**Purpose:** Full prompt view with actions

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│  [← Back]              Customer Onboarding Email    [⋮ More]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Write a personalized onboarding email for                │ │
│  │ {{customer_name}} who just signed up for our             │ │
│  │ {{product_tier}} plan. Include:                          │ │
│  │ - Welcome message                                        │ │
│  │ - Next steps for {{onboarding_date}}                     │ │
│  │ - Support contact info                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Variables (3):                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ {{customer_name}} - Customer's full name                 │ │
│  │ {{product_tier}} - Pro, Business, or Enterprise          │ │
│  │ {{onboarding_date}} - Scheduled onboarding call date     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Tags: [marketing] [email] [onboarding]                        │
│  Created by Jane · Last edited 2 days ago · 12 runs            │
│                                                                │
│  [View Original Chat]  (only if full-chat mode)               │
│                                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   ▶ Run     │ │   ✏ Edit    │ │   📋 Copy   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Full prompt visible
- Loading: Skeleton for content
- Editing: Inline editor visible
- Error: "Prompt not found" message

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prompt | Prompt | required | Full prompt object |
| onRun | function | - | Run button handler |
| onEdit | function | - | Edit button handler |
| onCopy | function | - | Copy button handler |
| onDelete | function | - | Delete handler |
| canViewOriginal | boolean | false | Full-chat mode |
| onViewOriginal | function | - | View chat handler |

**Accessibility:**
- Keyboard: Tab through actions, Enter to activate
- Screen reader: Full prompt read with structure
- ARIA: `aria-labelledby` for prompt sections

---

### 7. Run Modal

**Purpose:** Fill variables and execute prompt

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                    Run: Customer Onboarding Email         [×]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Fill in the variables:                                        │
│                                                                │
│  Customer Name *                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ John Smith                                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│  Customer's full name                                          │
│                                                                │
│  Product Tier *                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Business ▼                                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│  Pro, Business, or Enterprise                                  │
│                                                                │
│  Onboarding Date                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ December 1, 2025                                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│  Scheduled onboarding call date                                │
│                                                                │
│  ───────────────────────────────────────────────────────────── │
│                                                                │
│  Run in:  [ChatGPT ▼]                                          │
│                                                                │
│  [Cancel]                              [Run in ChatGPT →]      │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Form ready for input
- Validating: Required fields highlighted if empty
- Submitting: Button shows loading spinner
- Success: Modal closes, toast appears
- Error: Error message above buttons

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prompt | Prompt | required | Prompt with variables |
| variables | Variable[] | [] | Variables to fill |
| defaultPlatform | Platform | 'chatgpt' | Default run target |
| onRun | function | - | Execute handler |
| onCancel | function | - | Close modal handler |
| isOpen | boolean | false | Modal visibility |

**Accessibility:**
- Keyboard: Tab through fields, Enter to submit, Escape to close
- Screen reader: "Run prompt dialog, [n] fields required"
- ARIA: `role="dialog"`, `aria-modal="true"`, focus trap

---

### 8. Empty State

**Purpose:** Guide users when library is empty

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                         📚                                     │
│                                                                │
│              Your prompt library is empty                      │
│                                                                │
│     Capture your first prompt from ChatGPT, Claude,           │
│     Gemini, or Copilot using the Distill extension.           │
│                                                                │
│     ┌─────────────────────────────────────────────┐           │
│     │       Capture Your First Prompt →           │           │
│     └─────────────────────────────────────────────┘           │
│                                                                │
│     Or create one manually                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- No prompts: Primary CTA to capture
- No search results: Different message + query shown
- Collection empty: Message specific to collection

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | 'library' \| 'search' \| 'collection' | 'library' | Empty state type |
| searchQuery | string | "" | Query (if search type) |
| collectionName | string | "" | Collection (if collection type) |
| onCaptureClick | function | - | Primary CTA handler |
| onManualCreate | function | - | Secondary action |

**Accessibility:**
- Keyboard: Tab to CTA buttons
- Screen reader: Clear explanation of empty state
- ARIA: `role="status"` for dynamic empty states

---

## Edge Cases

| Scenario | Behaviour | Message |
|----------|-----------|---------|
| 500+ prompts | Paginate (20/page) | "[Page] of [Total]" |
| Very long prompt title | Truncate with ellipsis | "Title that is very lo..." |
| Prompt with 10+ tags | Show 5, "+N more" button | "+5 more tags" |
| Variable with no description | Show placeholder | "No description" (italic) |
| Deleted while viewing | Redirect to library | "This prompt was deleted" |
| Network timeout on search | Show cached results | "Showing cached results" |
| Special characters in search | Escape and search | Handle gracefully |
| User removes last prompt | Show empty state | (empty state component) |
| Concurrent edit | Last-write-wins + notification | "Updated by [name]. Refresh to see changes." |
| Prompt with code blocks | Preserve formatting | Syntax highlighting |
| Non-English prompts | Display correctly | UTF-8 support |
| Very long variable value | Textarea instead of input | Auto-expand |

---

## Responsive Behaviour

| Breakpoint | Changes |
|------------|---------|
| Mobile (<640px) | Single column, sidebar hidden, bottom sheet for detail, full-width search |
| Tablet (640-1024px) | 2-column grid, collapsible sidebar, slide-over detail panel |
| Desktop (>1024px) | 3-4 column grid, persistent sidebar, side panel or page for detail |

### Mobile Specifics
- Sidebar accessible via hamburger menu
- Search bar sticky at top
- Cards stack vertically
- Run modal becomes full-screen
- Swipe gestures for card actions

### Tablet Specifics
- Sidebar collapsible (icons only when collapsed)
- 2-column masonry or grid layout
- Detail panel slides from right

### Desktop Specifics
- Full sidebar always visible
- 3-4 column grid based on viewport
- Detail can be side panel or full page (user preference)
- Keyboard shortcuts prominently displayed

---

## Accessibility Checklist

- [x] Contrast >= 4.5:1 for all text
- [x] Focus states visible on all interactive elements
- [x] Full keyboard navigation (Tab, Arrow keys, Enter, Escape)
- [x] All form labels visible and associated
- [x] Error messages descriptive and linked to fields
- [x] `prefers-reduced-motion` respected for animations
- [x] Touch targets >= 44px on mobile
- [x] Screen reader announcements for dynamic content
- [x] Skip link to main content
- [x] Heading hierarchy (h1 > h2 > h3)
- [x] Alt text for any icons with meaning
- [x] ARIA landmarks for navigation regions

---

## Design Tokens

### Colors
```css
/* Primary */
--color-primary-500: #6366F1;      /* Indigo - primary actions */
--color-primary-600: #4F46E5;      /* Indigo - hover */
--color-primary-100: #E0E7FF;      /* Indigo - light backgrounds */

/* Neutral */
--color-neutral-50: #FAFAFA;       /* Page background */
--color-neutral-100: #F4F4F5;      /* Card background */
--color-neutral-200: #E4E4E7;      /* Borders */
--color-neutral-500: #71717A;      /* Secondary text */
--color-neutral-900: #18181B;      /* Primary text */

/* Semantic */
--color-success-500: #22C55E;      /* Success states */
--color-warning-500: #F59E0B;      /* Warnings */
--color-error-500: #EF4444;        /* Errors */

/* Tags (categorical) */
--color-tag-marketing: #F472B6;
--color-tag-sales: #60A5FA;
--color-tag-support: #34D399;
--color-tag-product: #A78BFA;
--color-tag-default: #94A3B8;
```

### Typography
```css
/* Font Family */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;  /* For prompt text */

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px - metadata */
--text-sm: 0.875rem;     /* 14px - body small */
--text-base: 1rem;       /* 16px - body */
--text-lg: 1.125rem;     /* 18px - card titles */
--text-xl: 1.25rem;      /* 20px - section headers */
--text-2xl: 1.5rem;      /* 24px - page title */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Spacing
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-card: 0 1px 3px rgba(0,0,0,0.08);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.12);
```

### Borders
```css
--radius-sm: 0.25rem;   /* 4px - tags */
--radius-md: 0.5rem;    /* 8px - cards, inputs */
--radius-lg: 0.75rem;   /* 12px - modals */
--radius-full: 9999px;  /* Pills, avatars */

--border-width: 1px;
--border-color: var(--color-neutral-200);
```

### Animation
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  --transition-fast: 0ms;
  --transition-base: 0ms;
  --transition-slow: 0ms;
}
```

---

## Technical Constraints

### Performance Requirements
- Library load: <2s (P95)
- Search response: <500ms
- Filter update: <200ms (client-side)
- Pagination: Infinite scroll or numbered (TBD)

### Data Limits
- Max 1000 prompts per workspace
- Max 100 prompts without pagination
- Max 50 tags per prompt
- Max 10 variables per prompt

### API Integration
- tRPC endpoints for CRUD operations
- Optimistic updates for better UX
- Cache invalidation on mutations
- Real-time updates via polling (WebSocket in future)

### State Management
- Zustand for client state
- React Query for server state
- URL state for filters/search (shareable)

---

## Open Questions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Grid vs List default view? | A) Grid (visual), B) List (dense), C) User choice | C) User choice, default Grid |
| 2 | Detail as panel or page? | A) Side panel, B) Full page, C) Configurable | A) Side panel for quick browse |
| 3 | Pagination style? | A) Infinite scroll, B) Numbered pages, C) Load more | C) Load more button |
| 4 | Search: instant or debounced? | A) Instant, B) 300ms debounce | B) 300ms debounce |
| 5 | Collection nesting? | A) Flat only (MVP), B) One level | A) Flat only for MVP |

---

## Related Documents

- [Capture Flow Design Spec](./capture-flow-design-spec.md)
- [PRD v0.2](../requirements/mvp-prd.md)
- [Shared Types](../../cursormvp/app/packages/shared-types/src/index.ts)
