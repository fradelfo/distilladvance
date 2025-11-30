---
status: accepted
date: 2025-11-30
---

# UI Component Library: shadcn/ui Migration

## Context and problem statement

Distill's web app needs a consistent, accessible, and themeable UI component library. The initial implementation used raw Radix UI primitives with custom Tailwind styling. As the application grew, we faced challenges:

- Inconsistent styling across components
- Duplicated code for common patterns (buttons, dialogs, cards)
- No dark mode support
- Time-consuming to build new UI features
- Accessibility patterns needed to be implemented manually for each component

## Decision drivers

- **Development speed** - Need to ship UI features quickly
- **Consistency** - All components should follow the same design language
- **Accessibility** - WCAG 2.1 AA compliance required (per PRD)
- **Theming** - Dark mode requested by users
- **Maintainability** - Components should be easy to update and customize
- **Bundle size** - Keep extension and web app performant

## Options

### Option 1: Continue with raw Radix UI + custom Tailwind

Keep building components from scratch using Radix primitives.

**Pros:**
- Full control over every component
- No additional dependencies
- Already familiar with the approach

**Cons:**
- Slow development (rebuild common patterns each time)
- Inconsistent styling between developers
- Dark mode requires significant effort
- Higher maintenance burden

### Option 2: shadcn/ui component library

Adopt shadcn/ui, a collection of copy-paste components built on Radix UI and Tailwind CSS.

**Pros:**
- Pre-built, accessible components
- Built on Radix (consistent with our existing approach)
- Dark mode built-in via CSS variables
- Copy-paste model means we own the code (no runtime dependency)
- Active community, frequent updates
- Tailwind-based (matches our stack)
- TypeScript support

**Cons:**
- Migration effort for existing components
- Learning curve for team
- Component updates require manual copying

### Option 3: Headless UI (Tailwind Labs)

Use Headless UI from Tailwind Labs.

**Pros:**
- Official Tailwind integration
- Well-maintained

**Cons:**
- Fewer components than shadcn/ui
- Still requires significant custom styling
- No built-in theming system

### Option 4: Full design system (Chakra UI, MUI)

Adopt a comprehensive design system.

**Pros:**
- Everything included out of the box
- Consistent design language

**Cons:**
- Large bundle size
- Opinionated styling harder to customize
- Vendor lock-in
- Conflicts with Tailwind approach

## Decision

**Chosen:** Option 2 - shadcn/ui component library

**Because:**

1. **Built on our existing stack** - Uses Radix UI and Tailwind CSS which we already use
2. **Copy-paste ownership** - Components are copied into our codebase, not imported from npm. We fully own and control the code.
3. **Dark mode included** - CSS variable-based theming works out of the box
4. **Accessible by default** - Components follow WAI-ARIA patterns
5. **Active ecosystem** - Regular updates, large community, good documentation
6. **Incremental adoption** - Can migrate components one at a time
7. **Bundle efficiency** - Only include components we use

### Consequences

**Good:**
- Dark mode implemented in single session (next-themes + shadcn/ui)
- Consistent button, dialog, card, input, select, toast components
- Development velocity increased significantly
- Accessibility compliance easier to maintain
- Design system documentation built-in

**Bad:**
- Required migration effort for existing components
- Some custom styling needed for Distill-specific patterns
- Must manually update components when shadcn/ui releases improvements

### Confirmation

We'll know this decision was right if:
- UI development time decreases by 30%+
- No accessibility regressions
- Dark mode works reliably across all pages
- Team reports improved DX

## Implementation

### Components migrated

| Component | Status | Location |
|-----------|--------|----------|
| Button | Complete | `components/ui/button.tsx` |
| Card | Complete | `components/ui/card.tsx` |
| Dialog | Complete | `components/ui/dialog.tsx` |
| Input | Complete | `components/ui/input.tsx` |
| Label | Complete | `components/ui/label.tsx` |
| Select | Complete | `components/ui/select.tsx` |
| Toast (Sonner) | Complete | `components/ui/sonner.tsx` |
| ThemeToggle | Complete | `components/theme-toggle.tsx` |

### Theming setup

- `next-themes` for dark mode state management
- CSS variables in `globals.css` for color tokens
- `ThemeProvider` wrapping app layout

## More information

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- Related: Sprint 6 UI/UX Improvements (`docs/design/sprint-6-ui-improvements-spec.md`)
