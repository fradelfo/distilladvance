---
description: Complete feature and prepare for merge
allowed-tools: Read, Write, Bash, Grep, Glob
---

Complete:

$ARGUMENTS

## Pre-completion

### Code
- [ ] Tests pass (`pnpm test`)
- [ ] No TS errors (`pnpm typecheck`)
- [ ] No lint warnings (`pnpm lint`)
- [ ] Self-reviewed

### Docs
- [ ] CHANGELOG.md updated
- [ ] README updated (if needed)
- [ ] API docs updated (if applicable)

### Requirements
- [ ] Acceptance criteria met
- [ ] Edge cases handled
- [ ] Error states implemented

## Actions

1. **Final checks:**
```bash
pnpm typecheck
pnpm lint
pnpm test
```

2. **CHANGELOG:** Add under [Unreleased]

3. **Phase marker:** Mark complete in `docs/phases/`

4. **PR:** Update description, link PRD + design

5. **Obsidian:** Log completion

## Output

1. Summary of changes
2. Remaining concerns
3. PR description
4. Obsidian log entry
