---
description: Log progress/decisions to local development log
allowed-tools: Read, Write, Edit, Bash(date:*)
---

Log to local development files:

$ARGUMENTS

## Local Documentation Path

**Project folder:** `cursormvp/docs/logs/`

| Log Type | File |
|----------|------|
| Daily progress | `cursormvp/docs/logs/development-log.md` |
| Sprint progress | `cursormvp/docs/logs/sprints/sprint-[N].md` |
| Roadmap | `cursormvp/docs/logs/roadmap.md` |

## Log types

### Daily log (append to development-log.md)
```markdown
## [Date] (Session N)

### Session Start
- **Phase:** Development
- **Sprint:** [N] - [Name]
- **Focus:** [focus area]

### Completed
- [x] [accomplished]

### Decisions
- [decisions + why]

### Blockers
- [blockers]

### Next Session
- [what's next]

---
```

### Decision
```markdown
# Decision: [Title]

**Date:** [date]
**Project:** Distill
**Status:** decided

## Context
[why needed]

## Decision
[what decided]

## Rationale
[why this choice]

## Consequences
[what changes]
```

### Feature progress
```markdown
## [Date] Update

**Status:** In Progress | Blocked | Complete

### Done
- [x]

### In Progress
- [ ]

### Blocked
-

### Notes

```

## Output

Use local file operations:
1. Read `cursormvp/docs/logs/development-log.md`
2. Append entry using Edit tool
3. Update sprint file if applicable
