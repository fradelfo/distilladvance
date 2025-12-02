# /ship Examples

## Example 1: Successful Ship

**Command:**
```
/ship
```

**Expected Output:**
```markdown
## Shipped! 🚀

### Pre-Merge Checks
✅ PR #156 is approved
✅ All CI checks passing
✅ No merge conflicts

### Merge
✅ PR #156 merged to main
- Merge commit: `a1b2c3d`
- Squash message: "feat: Add markdown export for prompts (#156)"
- Branch deleted: `feature/87-markdown-export`

### Issue
✅ #87 automatically closed

### Deployment
⏭️ No deployment configured

### Summary
**feat: Add markdown export for prompts**
- Added single and batch export endpoints
- Implemented markdown with YAML frontmatter
- Added download UI to prompt detail and library

### What's Next
- Monitor for issues in production
- Use `/metrics-experiments` to track export feature usage
- Celebrate! 🎉
```

---

## Example 2: Ship with Deployment

**Command:**
```
/ship #163
```

**Expected Output:**
```markdown
## Shipped! 🚀

### Pre-Merge Checks
✅ PR #163 is approved
✅ All CI checks passing
✅ No merge conflicts

### Merge
✅ PR #163 merged to main
- Merge commit: `d4e5f6g`
- Squash message: "feat: Implement workspace invite system (#163)"
- Branch deleted: `feature/92-workspace-invites`

### Issue
✅ #92 automatically closed

### Deployment
✅ **Deployed to production**

*From /devops:*
- Deployment triggered via GitHub Actions
- Build: ✅ Successful
- Database migrations: ✅ Applied (1 new migration)
- Health check: ✅ Passing
- Deployment time: 3m 24s

### Summary
**feat: Implement workspace invite system**
- Token-based invite authentication
- Email notifications for invites
- Invite management UI

### What's Next
- Monitor error rates in Sentry
- Check email delivery metrics
- Watch for user feedback on invite flow
```

---

## Example 3: PR Not Approved - Cannot Ship

**Command:**
```
/ship
```

**Expected Output:**
```markdown
## Cannot Ship

### Pre-Merge Checks
❌ **PR #170 is not approved**

| Check | Status |
|-------|--------|
| Approved | ❌ Pending review |
| CI Checks | ✅ Passing |
| Conflicts | ✅ None |

### Current Review Status
- Requested: @teammate1, @teammate2
- Reviewed: None yet
- Comments: 0

### Resolution
Request review from team members or wait for pending reviews.

```bash
# Request review
gh pr edit 170 --add-reviewer teammate1

# Or view PR status
gh pr view 170
```

### Next Steps
- [ ] Request review if not already done
- [ ] Address any review comments
- [ ] Run `/ship` again once approved
```

---

## Example 4: CI Checks Failing

**Command:**
```
/ship #175
```

**Expected Output:**
```markdown
## Cannot Ship

### Pre-Merge Checks
❌ **CI checks failing**

| Check | Status |
|-------|--------|
| Approved | ✅ Approved |
| CI Checks | ❌ Failing |
| Conflicts | ✅ None |

### Failing Checks
1. **test (ubuntu-latest)** - Failed
   - `FAIL src/components/__tests__/Export.test.tsx`
   - `Expected: "Download" / Received: "Export"`

2. **lint** - Failed
   - `src/services/export.ts:45 - 'unused' is defined but never used`

### Resolution
Fix the failing tests and lint errors:

```bash
# Run tests locally
bun run test

# Run lint with fix
bun run lint:fix
```

### Next Steps
- [ ] Fix failing test assertion
- [ ] Remove unused variable
- [ ] Push fixes
- [ ] Wait for CI to pass
- [ ] Run `/ship` again
```

---

## Example 5: Merge Conflicts

**Command:**
```
/ship
```

**Expected Output:**
```markdown
## Cannot Ship

### Pre-Merge Checks
❌ **Merge conflicts detected**

| Check | Status |
|-------|--------|
| Approved | ✅ Approved |
| CI Checks | ✅ Passing |
| Conflicts | ❌ Conflicts |

### Conflicting Files
- `src/components/PromptLibrary.tsx`
- `src/styles/globals.css`

### Resolution
Update your branch with latest main and resolve conflicts:

```bash
# Fetch and merge main
git fetch origin
git merge origin/main

# Resolve conflicts in your editor
# Then commit the resolution
git add .
git commit -m "Resolve merge conflicts with main"

# Push updated branch
git push
```

### Next Steps
- [ ] Merge latest main into your branch
- [ ] Resolve conflicts
- [ ] Push changes
- [ ] Wait for CI to pass
- [ ] Run `/ship` again
```

---

## Example 6: PR Already Merged

**Command:**
```
/ship #150
```

**Expected Output:**
```markdown
## Cannot Ship

### Status
❌ **PR #150 is already merged**

### Details
- Merged at: 2024-01-15 14:32:00
- Merged by: @username
- Merge commit: `x9y8z7w`

### Linked Issue
✅ #85 was closed when PR was merged

### Next Steps
Nothing to do - this PR has already been shipped!

If you meant to ship a different PR:
```bash
# List open PRs
gh pr list

# Ship a specific PR
/ship #<pr-number>
```
```

---

## Example 7: Ship from Different Branch

**Command:**
```
/ship
```
*(Run from `main` branch)*

**Expected Output:**
```markdown
## Cannot Ship

### Status
❌ **No PR found for current branch**

### Details
Current branch: `main`

The `/ship` command works with feature branches that have open PRs.

### Find Your PR
```bash
# List your open PRs
gh pr list --author @me

# List all open PRs
gh pr list
```

### Next Steps
Either:
1. Checkout your feature branch and run `/ship`
2. Specify the PR number: `/ship #<pr-number>`
```
