# Checkpoint - Progress Update

Save progress and update stakeholders mid-work.

## Arguments
- $ARGUMENTS: Optional status notes describing progress

## Instructions

When user runs `/checkpoint {notes}`:

### Workflow

1. **Check Current State**
   ```bash
   git status
   git branch --show-current
   ```

2. **Identify Current Issue**
   - Extract issue number from branch name (e.g., `feature/42-dark-mode` → #42)
   - If no issue linked, note this in output

3. **Commit Changes** (if any uncommitted changes)
   ```bash
   git add -A
   git commit -m "WIP: {summary of changes}

   {user's status notes if provided}

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

4. **Update GitHub Issue** (if issue exists)
   ```bash
   gh issue comment {issue-number} --body "## Progress Update

   **Status**: In Progress
   **Branch**: {branch-name}

   ### What's Done
   {list of completed work from git log}

   ### Current Focus
   {user's status notes}

   ### Commits Since Start
   {list recent commits on this branch}
   "
   ```

5. **Show Summary**

### Output Format

```markdown
## Checkpoint Summary

### Branch
`{branch-name}`

### Issue
#{issue-number} - {issue-title}

### Changes Committed
- {commit 1}
- {commit 2}
- ...

### Progress Update Posted
[Link to issue comment]

### What's Next
{based on user notes or suggest continuing work}
```

## Examples

```
/checkpoint Completed the API endpoint, starting on frontend integration
```

```
/checkpoint
```
(Will commit with generic WIP message)

## Notes

- If no changes to commit, will only update the issue
- If no issue linked to branch, will only commit
- Always shows current state and next steps

$ARGUMENTS
