# Complete Work - Finish and Create PR

Prepare work for review with quality checks.

## Arguments
- $ARGUMENTS: Optional PR summary (auto-generated if not provided)

## Required Documents to Read

Before completing work, **MUST read** for review context:

| Document | Path | Why |
|----------|------|-----|
| Architecture | `work/engineering/architecture.md` | Validate architectural compliance |
| API Design | `work/engineering/api-design.md` | Check API consistency |
| PRD | `docs/prd/distill_mvp_prd_v0_1.md` | Verify requirements met |

**IF extension changes, also read:**
| Document | Path | Why |
|----------|------|-----|
| Extension Design | `work/engineering/extension-design.md` | Extension patterns |

**IF UI changes, also read:**
| Document | Path | Why |
|----------|------|-----|
| UI Specs | `work/design/ui-specs.md` | Design compliance |

## Instructions

When user runs `/complete-work {summary}`:

### ⚠️ IMPORTANT - MUST invoke these agents:

1. **`/code-review` agent** (ALWAYS)
   - Run comprehensive code review
   - Check quality, security, performance
   - Must pass before creating PR

2. **`/security-audit` agent** (IF security-sensitive)
   - If changes touch authentication, authorization, user data, API keys
   - If changes involve external APIs or data handling
   - Run deep security review

### Workflow

1. **Pre-Flight Checks**
   ```bash
   git status
   git branch --show-current
   ```
   - Ensure all changes are committed
   - If uncommitted changes, prompt user to commit first

2. **Extract Context**
   - Get issue number from branch name
   - Get commit history for this branch
   - Identify files changed

3. **Code Review** (MUST)
   - Run `/code-review` agent
   - Analyze the output for critical/high issues

   **If critical issues found**:
   - Report issues clearly
   - **STOP - Do not create PR**
   - Suggest fixes

4. **Security Audit** (IF needed)
   - Check if changes are security-sensitive:
     - Auth/authorization changes
     - User data handling
     - API key/secret handling
     - External API integration
   - If yes: run `/security-audit` agent

   **If security issues found**:
   - Report issues clearly
   - **STOP - Do not create PR**
   - Suggest fixes

5. **Create PR** (only if reviews pass)
   ```bash
   git push -u origin {branch-name}

   gh pr create --title "{title}" --body "## Summary
   {summary from user or auto-generated}

   ## Changes
   {list of changes from commits}

   ## Code Review
   ✅ Passed - {summary of review}

   ## Security Review
   ✅ Passed / N/A

   ## Testing
   - [ ] Unit tests pass
   - [ ] Manual testing completed

   Closes #{issue-number}

   🤖 Generated with [Claude Code](https://claude.com/claude-code)"
   ```

### Output Format

**If Review Passes:**
```markdown
## Work Complete

### Code Review
✅ **Passed**
{summary of review findings}

### Security Review
✅ **Passed** / **N/A** (not security-sensitive)

### Pull Request Created
**PR**: {PR URL}
**Closes**: #{issue-number}

### Next Steps
- Wait for CI checks
- Request human review if needed
- When approved, use `/ship` to merge
```

**If Review Fails:**
```markdown
## Review Failed - PR Not Created

### Code Review Issues
❌ **{count} issues found**

#### Critical
- {issue 1}
- {issue 2}

#### High
- {issue 1}

### Suggested Fixes
1. {fix suggestion}
2. {fix suggestion}

### Next Steps
- Fix the issues listed above
- Run `/complete-work` again
```

## Examples

```
/complete-work Added dark mode with system preference detection and persistence
```

```
/complete-work
```
(Will auto-generate summary from commits)

$ARGUMENTS
