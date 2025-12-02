# Ship - Merge and Deploy

Merge PR and deploy to production.

## Arguments
- $ARGUMENTS: Optional PR number (auto-detects from current branch if not provided)

## Instructions

When user runs `/ship {pr-number}`:

### ⚠️ IMPORTANT - Conditional agent invocation:

1. **`/devops` agent** (IF deployment configured)
   - Only if project has deployment automation
   - Handle deployment after merge

### Workflow

1. **Identify PR**
   - If PR number provided: use that
   - If not: detect from current branch
   ```bash
   gh pr list --head $(git branch --show-current) --json number,state
   ```

2. **Pre-Merge Checks**
   ```bash
   gh pr view {pr-number} --json state,mergeable,reviewDecision,statusCheckRollup
   ```

   **Check requirements:**
   - PR state is "open"
   - PR is mergeable (no conflicts)
   - Review decision is "APPROVED" (if required)
   - All status checks passing

   **If any check fails:**
   - Report which check failed
   - **STOP - Do not merge**
   - Suggest resolution

3. **Merge PR**
   ```bash
   gh pr merge {pr-number} --squash --delete-branch
   ```

4. **Verify Issue Closed**
   - Check if linked issue was auto-closed
   - If not, close it manually

5. **Deployment** (IF configured)
   - Check if project has deployment setup
   - If yes: run `/devops` agent for deployment
   - If no: skip deployment step

6. **Cleanup**
   ```bash
   git checkout main
   git pull origin main
   ```

### Output Format

**Success:**
```markdown
## Shipped! 🚀

### Merge
✅ PR #{pr-number} merged to main
- Merge commit: {sha}
- Branch deleted: {branch-name}

### Issue
✅ #{issue-number} closed

### Deployment
✅ Deployed to production / ⏭️ No deployment configured

### Summary
{PR title and brief description}

### What's Next
- Monitor for issues
- Use `/metrics-experiments` to track impact
```

**Pre-Merge Check Failed:**
```markdown
## Cannot Ship

### Status
❌ **Pre-merge checks failed**

### Issues Found
- {check 1}: {status}
- {check 2}: {status}

### Resolution
{specific steps to resolve}

### Next Steps
- Fix the issues above
- Run `/ship` again
```

## Examples

```
/ship
```
(Auto-detects PR from current branch)

```
/ship #42
```
(Ships specific PR)

## Safety Notes

- Always uses squash merge for clean history
- Automatically deletes feature branch after merge
- Will not merge if:
  - PR has merge conflicts
  - Required reviews not approved
  - CI checks failing
  - PR already merged or closed

$ARGUMENTS
