---
description: Create handoff document between phases
allowed-tools: Read, Write, Grep, Glob
---

Create handoff:

$ARGUMENTS

## Handoff types

### Product → Design

```markdown
# Handoff: Product → Design

**Feature:** 
**Date:** 
**PRD:** 

## Context
[Goals, constraints, timeline]

## Key requirements
- 
- 

## Success metrics
| Metric | Target | Measurement |
|--------|--------|-------------|

## User context
**Primary user:** 
**Goal:** 
**Current pain:** 

## Technical constraints
- 

## Questions for design
- [ ] 

## Out of scope
- 

## Timeline
| Milestone | Date |
|-----------|------|
| Design complete | |
| Handoff to dev | |

## Checklist
- [ ] PRD approved
- [ ] Metrics defined
- [ ] Constraints documented
```

### Design → Dev

```markdown
# Handoff: Design → Dev

**Feature:** 
**Date:** 
**PRD:** 
**Design spec:** 

## Summary


## Acceptance criteria
1. [ ] 
2. [ ] 

## Implementation notes

### Components
| Component | Action | Notes |
|-----------|--------|-------|

### Interactions


### State management


### APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|

## Edge cases
| Scenario | Behaviour |
|----------|-----------|

## Accessibility
- [ ] Keyboard:
- [ ] Screen reader:
- [ ] Focus:

## Test scenarios
- 

## Questions for dev
- [ ] 

## Timeline
| Milestone | Date |
|-----------|------|
| Implementation | |
| Code review | |
| Merge | |

## Checklist
- [ ] Design spec complete
- [ ] States documented
- [ ] Edge cases identified
- [ ] A11y specified
```

## Output

Save to `/docs/handoffs/[feature]-[from]-to-[to].md`
