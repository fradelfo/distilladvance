---
name: resume
description: Resume work from previous session. Run at start of any session.
allowed-tools: Read, Grep, Glob, Bash(git:*, cat:*, ls:*, find:*)
---

# Session Resume

Let me gather context to resume work on Distill.

## Context Sources

| Source | Path |
|--------|------|
| Local Docs | `cursormvp/docs/logs/` |
| Development Log | `cursormvp/docs/logs/development-log.md` |
| Roadmap | `cursormvp/docs/logs/roadmap.md` |
| Sprint Files | `cursormvp/docs/logs/sprints/` |
| Phase Marker | `docs/phases/development-phase.md` |

## Current state

### Git status
```bash
git branch --show-current
git status --short
git log --oneline -5
```

### Active phases
Check `docs/phases/` for in-progress work.

### Local documentation context
Read from `cursormvp/docs/logs/development-log.md` for:
- Last session summary
- Sprint progress
- Blockers
- Next steps

### Sprint details
Check `cursormvp/docs/logs/sprints/sprint-*.md` for current sprint status.

### Recent changes
```bash
git diff --stat HEAD~3
```

## Summary

Based on what I find, I'll provide:

1. **Current branch and status**
2. **Active sprint/phase** (from local docs)
3. **Last progress logged** (from Development Log)
4. **Suggested next actions**
5. **Any blockers noted**

## If I need more context

I may ask you to:
- Confirm which feature to continue
- Provide any decisions made outside sessions
- Clarify priority if multiple things in progress

---

*Gathering context now...*
