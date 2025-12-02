# Start New Work

Use this workflow whenever starting a new feature, fix, experiment, or idea.

## Arguments
- $ARGUMENTS: Description of the work to be done

## Required Documents to Read

Before starting work, **MUST check** these documents:

| Document | Path | Why |
|----------|------|-----|
| Backlog | `work/product/backlog.md` | Check if already exists |
| Roadmap | `work/product/roadmap.md` | Verify priority alignment |
| PRD | `docs/prd/distill_mvp_prd_v0_1.md` | Understand requirements context |

## Workflow

### 1. Create GitHub Issue
```bash
gh issue create --title "{title}" --body "{description}"
```

### 2. Create Branch (linked to issue)
```bash
git checkout main
git pull origin main
git checkout -b {type}/{issue-number}-{short-description}
```

Branch types:
- `feature/` - New functionality
- `fix/` - Bug fixes
- `experiment/` - Testing ideas
- `chore/` - Maintenance, refactoring

### 3. Update GitHub Project
```bash
gh issue edit {issue-number} --add-project "{project-name}"
```

## Instructions

When user runs `/start-work {description}`:

1. Ask for clarification if needed:
   - What type? (feature/fix/experiment/chore)
   - Brief title for the issue
   - Acceptance criteria / definition of done

2. Create GitHub issue with:
   - Clear title
   - Description with context
   - Acceptance criteria checklist
   - Labels based on type

3. Create feature branch:
   - Pull latest main
   - Branch name: `{type}/{issue-number}-{kebab-case-description}`

4. Add issue to GitHub Project (if exists)

5. Confirm setup complete and show:
   - Issue URL
   - Branch name
   - Ready to start working

## When Work is Complete

Remind user to:
- Create PR linking to the issue (`Closes #issue-number`)
- PR will auto-close the issue when merged
