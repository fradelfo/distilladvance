---
description: Run retrospective on completed feature/sprint
allowed-tools: Read, Grep, Glob, Write
---

Retrospective on:

$ARGUMENTS

## Framework

1. **What happened?**
   - Goal?
   - Delivered?
   - Time vs estimate?

2. **What went well?**
   - Smooth processes
   - Good decisions
   - Effective tools

3. **What didn't go well?**
   - Blockers
   - Rework
   - Missed requirements
   - Tech debt

4. **Learnings?**
   - New techniques
   - Assumptions validated
   - Domain knowledge

5. **What to change?**
   - Process
   - Tools
   - Docs
   - Skills

## Review

- Git history
- Phase marker
- PRD + design spec
- PR comments
- ADRs

## Output

```markdown
# Retrospective: [Feature]

**Date:** 
**Duration:** planned vs actual

## Summary


## Went well
- 

## Didn't go well
- 

## Learnings
- 

## Actions
- [ ] Action — Owner

## Metrics
| Metric | Value |
|--------|-------|
| Planned | |
| Actual | |
| PRs | |
| Tests | |
| Bugs | |
```

Save to:
- `docs/phases/[feature]-retro.md`
- Obsidian: `01-projects/cursor-ai-mvp/notes/`
