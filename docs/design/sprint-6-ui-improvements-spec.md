# Sprint 6: UI/UX Improvements Design Spec

**Status:** Implemented
**PRD:** `docs/requirements/mvp-prd.md`
**Updated:** 2025-11-30

## Overview

Sprint 6 focuses on improving the user experience through navigation redesign, home page improvements, component library standardization, and dark mode support. These changes create a more polished, professional product experience.

## User flow

### Happy path
1. User logs in → sees redesigned home page with stats and activity
2. User navigates via left sidebar → quick access to all sections
3. User toggles dark mode → preference persists across sessions
4. User receives feedback → toast notifications for all actions

### Error paths
- Network error → toast notification with retry option
- Permission denied → redirect to appropriate page with message

## Screens

| Screen | Purpose | Entry | Exit |
|--------|---------|-------|------|
| Home (`/dashboard`) | Stats overview, activity feed, quick actions | Login, sidebar | Any route via sidebar |
| All pages | Consistent sidebar navigation | Any authenticated route | Any route |

## Components

### LeftSidebar

**States:**
- Default (expanded on desktop)
- Collapsed (on desktop, user preference)
- Hidden (mobile, below md breakpoint)
- Mobile drawer (slide-in on mobile)

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isCollapsed | boolean | false | Sidebar collapse state |
| onToggle | function | - | Toggle collapse callback |

**Accessibility:**
- Keyboard: Tab through nav items, Enter to activate
- ARIA: `role="navigation"`, `aria-label="Main navigation"`

### StatsCard

**States:**
- Default (with data)
- Loading (skeleton)
- Empty (no data, show zero)
- Error (show fallback)

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Card title |
| value | number | - | Primary metric value |
| icon | ReactNode | - | Icon component |
| trend | number | - | Optional trend percentage |

**Accessibility:**
- Keyboard: Focusable for screen readers
- ARIA: `role="region"`, descriptive labels

### ThemeToggle

**States:**
- Light mode active
- Dark mode active
- System preference active

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| - | - | - | Uses next-themes context |

**Accessibility:**
- Keyboard: Enter/Space to toggle
- ARIA: `role="button"`, `aria-label="Toggle theme"`

### Toast (Sonner)

**States:**
- Success (green)
- Error (red)
- Info (blue)
- Loading (spinner)

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| message | string | - | Toast content |
| type | enum | info | success, error, info, loading |
| duration | number | 4000 | Auto-dismiss time (ms) |

**Accessibility:**
- ARIA: `role="alert"`, `aria-live="polite"`
- Focus: Does not steal focus

## Edge cases

| Scenario | Behaviour |
|----------|-----------|
| Sidebar on mobile | Hidden by default, hamburger menu triggers drawer |
| Stats API timeout | Show skeleton for 3s, then error state |
| Theme preference not saved | Fall back to system preference |
| Toast queue overflow | Stack up to 3 toasts, dismiss oldest |
| Sidebar collapse + mobile | Reset to hidden when crossing breakpoint |

## Responsive

| Breakpoint | Changes |
|------------|---------|
| Mobile (<768px) | Sidebar hidden, hamburger menu, single-column layout |
| Tablet (768-1024px) | Sidebar collapsed by default, 2-column grid |
| Desktop (>1024px) | Sidebar expanded, 3+ column grid for stats |

## Accessibility

- [x] Contrast ≥ 4.5:1 (verified for both light and dark themes)
- [x] Focus states (visible focus ring on all interactive elements)
- [x] Keyboard nav (full keyboard navigation, no mouse required)
- [x] Labels visible (all form inputs have visible labels)
- [x] Touch ≥ 44px (all touch targets meet minimum size)
- [x] Dark mode (respects prefers-color-scheme, toggle available)
- [x] Reduced motion (animations respect prefers-reduced-motion)

## Implementation Details

### Component Library

All UI components migrated to shadcn/ui:

| Component | Source | Notes |
|-----------|--------|-------|
| Button | shadcn/ui | All variants (default, destructive, outline, ghost) |
| Card | shadcn/ui | Used for stats, prompts, collections |
| Dialog | shadcn/ui | All modals migrated |
| Input | shadcn/ui | Form inputs with label integration |
| Label | shadcn/ui | Accessible form labels |
| Select | shadcn/ui | Dropdowns with search support |
| Sonner | shadcn/ui | Toast notifications |

### Dark Mode

- Provider: `next-themes`
- Storage: localStorage
- Default: system preference
- Toggle location: Top navigation bar

### CSS Variables

Theme colors defined in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... other tokens */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... other tokens */
}
```

## Related Documents

- ADR: `docs/decisions/0002-shadcn-ui-migration.md`
- Development phase: `docs/phases/development-phase.md`
- Previous design specs: `docs/design/`
