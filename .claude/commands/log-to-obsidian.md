---
description: Log progress/decisions to Obsidian vault
allowed-tools: Read, Write, Bash(date:*)
---

Log to Obsidian:

$ARGUMENTS

## Log types

### Daily log
```markdown
## [Time] — Cursor AI MVP

### Progress
- [accomplished]

### Decisions
- [decisions + why]

### Blockers
- [blockers]

### Next
- [what's next]
```

### Decision
```markdown
# Decision: [Title]

**Date:** [date]
**Project:** Cursor AI MVP
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

Use Obsidian MCP to:
1. Find/create note
2. Append entry
3. Update linked notes
