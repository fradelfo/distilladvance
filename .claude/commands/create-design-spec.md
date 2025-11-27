---
description: Create design specification from PRD
allowed-tools: Read, Write, Grep, Glob
---

Create design spec for:

$ARGUMENTS

## Before starting

1. Read PRD in `/docs/requirements/`
2. List all user stories + acceptance criteria
3. Note technical constraints

## Template

```markdown
# [Feature] Design Spec

**Status:** Draft
**PRD:** [link]
**Updated:** [date]

## Overview


## User flow

### Happy path
1. 

### Alternative paths
- 

### Error paths
- 

## Screen inventory
| Screen | Purpose | Entry | Exit |
|--------|---------|-------|------|

## Components

### [Component]
**Purpose:**

**States:**
- Default
- Hover/Focus
- Active
- Disabled
- Loading
- Error
- Success

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|

**Accessibility:**
- Keyboard:
- Screen reader:
- ARIA:

## Edge cases
| Scenario | Behaviour | Message |
|----------|-----------|---------|

## Responsive
| Breakpoint | Changes |
|------------|---------|
| Mobile (<640px) | |
| Tablet (640-1024px) | |
| Desktop (>1024px) | |

## Accessibility checklist
- [ ] Contrast ≥ 4.5:1
- [ ] Focus states
- [ ] Keyboard accessible
- [ ] Labels visible
- [ ] Descriptive errors
- [ ] prefers-reduced-motion
- [ ] Touch targets ≥ 44px

## Design tokens


## Open questions
- [ ] Question — Options — Recommendation
```

## Output

Save to `/docs/design/[feature]-design-spec.md`
