# /checkpoint Examples

## Example 1: Mid-Feature Progress

**Command:**
```
/checkpoint Completed the API endpoint for markdown export, starting on frontend download button
```

**Expected Output:**
```markdown
## Checkpoint Summary

### Branch
`feature/87-markdown-export`

### Issue
#87 - Add markdown export for prompts

### Changes Committed
```
commit a3f2c1d
WIP: Add markdown export API endpoint

- Added GET /api/prompts/:id/export endpoint
- Implemented markdown formatting with frontmatter
- Added unit tests for export service

Completed the API endpoint for markdown export, starting on frontend download button

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Progress Update Posted
[View on GitHub](https://github.com/user/repo/issues/87#issuecomment-123456)

### Issue Comment Posted:
```markdown
## Progress Update

**Status**: In Progress
**Branch**: feature/87-markdown-export

### What's Done
- ✅ API endpoint for single prompt export
- ✅ Markdown formatting with frontmatter
- ✅ Unit tests

### Current Focus
Starting on frontend download button

### Commits Since Start
- a3f2c1d - WIP: Add markdown export API endpoint
- b2e4f6a - Initial branch setup
```

### What's Next
Continue with frontend implementation - add download button to prompt detail page.
```

---

## Example 2: End of Day Save

**Command:**
```
/checkpoint EOD - auth flow 80% complete, need to finish error handling tomorrow
```

**Expected Output:**
```markdown
## Checkpoint Summary

### Branch
`feature/92-workspace-invites`

### Issue
#92 - Implement workspace invite system

### Changes Committed
```
commit d4e5f6g
WIP: Workspace invite auth flow

- Added invite token generation
- Implemented invite acceptance endpoint
- Added email notification service stub
- Pending: error handling and edge cases

EOD - auth flow 80% complete, need to finish error handling tomorrow

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Progress Update Posted
[View on GitHub](https://github.com/user/repo/issues/92#issuecomment-789012)

### What's Next
Tomorrow: Complete error handling for invite flow, then move to UI.
```

---

## Example 3: Quick Save (No Message)

**Command:**
```
/checkpoint
```

**Expected Output:**
```markdown
## Checkpoint Summary

### Branch
`fix/95-preview-reactivity`

### Issue
#95 - Fix prompt preview not updating

### Changes Committed
```
commit h7i8j9k
WIP: Work in progress

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Files Changed
- src/components/PromptPreview.tsx
- src/hooks/usePromptVariables.ts

### Progress Update Posted
[View on GitHub](https://github.com/user/repo/issues/95#issuecomment-345678)

### What's Next
Continue debugging the reactivity issue.
```

---

## Example 4: No Changes to Commit

**Command:**
```
/checkpoint Just finished reviewing the approach, ready to start coding
```

**Expected Output:**
```markdown
## Checkpoint Summary

### Branch
`feature/100-bulk-export`

### Issue
#100 - Add bulk prompt export

### Changes Committed
No uncommitted changes to commit.

### Progress Update Posted
[View on GitHub](https://github.com/user/repo/issues/100#issuecomment-901234)

### Issue Comment Posted:
```markdown
## Progress Update

**Status**: In Progress
**Branch**: feature/100-bulk-export

### Current Focus
Just finished reviewing the approach, ready to start coding

### Commits Since Start
(No commits yet)
```

### What's Next
Begin implementation.
```

---

## Example 5: No Issue Linked

**Command:**
```
/checkpoint Quick experiment with new animation library
```

**Expected Output:**
```markdown
## Checkpoint Summary

### Branch
`experiment/framer-motion-test`

### Issue
⚠️ No issue linked to this branch

### Changes Committed
```
commit l0m1n2o
WIP: Framer motion experiment

Quick experiment with new animation library

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Progress Update Posted
Skipped - no issue linked

### What's Next
Continue experimenting. Consider creating an issue if this becomes a real feature.

**Tip**: Use `/start-work` to create issues linked to branches for better tracking.
```
