# /complete-work Examples

## Example 1: Clean Pass - PR Created

**Command:**
```
/complete-work Added markdown export with frontmatter metadata and batch download
```

**Expected Output:**
```markdown
## Work Complete

### Documents Reviewed
- ✅ `work/engineering/architecture.md` - Follows service layer pattern
- ✅ `work/engineering/api-design.md` - API endpoints follow REST conventions
- ✅ `docs/prd/distill_mvp_prd_v0_1.md` - Aligns with data portability requirement

### Code Review
✅ **Passed**

*From /code-review:*
- Code quality: 9/10
- No security issues found
- Test coverage: 85% for new code
- Minor suggestions (non-blocking):
  - Consider extracting markdown template to constant
  - Add JSDoc to export function

### Security Review
**N/A** - Not security-sensitive changes

### Pull Request Created
**PR**: https://github.com/user/repo/pull/156
**Title**: feat: Add markdown export for prompts
**Closes**: #87

### PR Description:
```markdown
## Summary
Added markdown export with frontmatter metadata and batch download

## Changes
- Added GET /api/prompts/:id/export endpoint
- Added POST /api/prompts/export/batch for bulk export
- Implemented markdown formatting with YAML frontmatter
- Added download button to prompt detail page
- Added "Export Selected" to prompt library

## Code Review
✅ Passed - Code quality 9/10, 85% test coverage

## Testing
- [x] Unit tests pass
- [x] Manual testing completed
- [x] Tested single and batch export

Closes #87

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Next Steps
- Wait for CI checks to complete
- Request human review if needed
- When approved, use `/ship` to merge
```

---

## Example 2: Code Review Fails - PR NOT Created

**Command:**
```
/complete-work
```

**Expected Output:**
```markdown
## Review Failed - PR Not Created

### Code Review Issues
❌ **3 issues found**

*From /code-review:*

#### Critical (1)
1. **SQL Injection vulnerability** in `src/services/search.ts:45`
   ```typescript
   // Current (vulnerable)
   const query = `SELECT * FROM prompts WHERE title LIKE '%${searchTerm}%'`

   // Should be
   const query = `SELECT * FROM prompts WHERE title LIKE $1`
   const params = [`%${searchTerm}%`]
   ```

#### High (2)
1. **Missing input validation** in `src/routes/export.ts:23`
   - `promptIds` array not validated for length or content
   - Could allow excessive resource consumption

2. **Unhandled promise rejection** in `src/services/export.ts:67`
   - `Promise.all` without error handling
   - Could crash on partial failures

### Suggested Fixes

1. **SQL Injection**: Use parameterized query with Prisma
   ```typescript
   const results = await prisma.prompt.findMany({
     where: { title: { contains: searchTerm } }
   })
   ```

2. **Input validation**: Add Zod schema
   ```typescript
   const exportSchema = z.object({
     promptIds: z.array(z.string().uuid()).max(100)
   })
   ```

3. **Promise handling**: Use Promise.allSettled
   ```typescript
   const results = await Promise.allSettled(exports)
   const failures = results.filter(r => r.status === 'rejected')
   ```

### Next Steps
- [ ] Fix the 3 issues listed above
- [ ] Run `/complete-work` again after fixes
```

---

## Example 3: Security-Sensitive - Full Audit

**Command:**
```
/complete-work Implemented workspace invite system with token-based auth
```

**Expected Output:**
```markdown
## Work Complete

### Code Review
✅ **Passed**

*From /code-review:*
- Code quality: 8/10
- Test coverage: 78% for new code
- Architecture follows existing patterns

### Security Review
✅ **Passed**

*From /security-audit:*
Security-sensitive changes detected (auth/tokens). Full audit performed:

- ✅ Token generation uses crypto.randomBytes (secure)
- ✅ Tokens expire after 7 days
- ✅ One-time use enforced (deleted after acceptance)
- ✅ Rate limiting on invite endpoint
- ✅ Email validation before sending invites
- ⚠️ Recommendation: Consider adding invite attempt logging

### Pull Request Created
**PR**: https://github.com/user/repo/pull/163
**Title**: feat: Implement workspace invite system
**Closes**: #92

### PR Description:
```markdown
## Summary
Implemented workspace invite system with token-based auth

## Changes
- Added invite token generation and validation
- Added workspace invite API endpoints
- Implemented invite acceptance flow
- Added email notifications for invites
- Added invite management UI

## Code Review
✅ Passed - Code quality 8/10

## Security Review
✅ Passed - Token handling secure, rate limiting in place

## Testing
- [x] Unit tests pass
- [x] Integration tests for invite flow
- [x] Manual testing of full invite journey

Closes #92

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Next Steps
- Wait for CI checks
- Security review recommendation: Add invite attempt logging (can be follow-up)
- When approved, use `/ship` to merge
```

---

## Example 4: Security Audit Fails

**Command:**
```
/complete-work Added API key management for external integrations
```

**Expected Output:**
```markdown
## Review Failed - PR Not Created

### Code Review
✅ **Passed** (8/10)

### Security Review
❌ **Failed - 2 critical issues**

*From /security-audit:*
Security-sensitive changes detected. Critical issues found:

#### Critical (2)

1. **API keys stored in plain text** in `src/services/apiKeys.ts:34`
   ```typescript
   // Current (insecure)
   await prisma.apiKey.create({
     data: { key: generatedKey, userId }
   })
   ```

   **Required**: Hash API keys before storage, only show full key once on creation
   ```typescript
   const hashedKey = await bcrypt.hash(generatedKey, 10)
   await prisma.apiKey.create({
     data: { keyHash: hashedKey, keyPrefix: generatedKey.slice(0, 8), userId }
   })
   ```

2. **API key exposed in logs** in `src/middleware/auth.ts:56`
   ```typescript
   // Current (insecure)
   console.log(`API request with key: ${apiKey}`)
   ```

   **Required**: Never log API keys
   ```typescript
   console.log(`API request with key: ${apiKey.slice(0, 8)}...`)
   ```

### Suggested Fixes

1. Hash API keys using bcrypt before database storage
2. Store only a prefix for display purposes
3. Remove or mask API keys from all log statements
4. Add key rotation mechanism

### Next Steps
- [ ] Fix the 2 critical security issues
- [ ] Run `/complete-work` again after fixes
- [ ] Consider security review for key rotation design
```

---

## Example 5: Auto-Generated Summary

**Command:**
```
/complete-work
```

**Expected Output:**
```markdown
## Work Complete

### Code Review
✅ **Passed**

*From /code-review:*
- Code quality: 9/10
- No issues found
- Good test coverage

### Security Review
**N/A** - Not security-sensitive changes

### Pull Request Created
**PR**: https://github.com/user/repo/pull/170
**Title**: fix: Resolve prompt preview reactivity issue
**Closes**: #95

### PR Description:
```markdown
## Summary
Fixed prompt preview not updating when variables change

*Auto-generated from commits:*
- Fixed useEffect dependency array in PromptPreview
- Added proper memoization for variable extraction
- Added regression test for variable updates

## Changes
- src/components/PromptPreview.tsx - Fixed effect dependencies
- src/hooks/usePromptVariables.ts - Added memoization
- src/components/__tests__/PromptPreview.test.tsx - Added test

## Code Review
✅ Passed

## Testing
- [x] Unit tests pass
- [x] Regression test added

Closes #95

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Next Steps
- CI checks running
- When approved, use `/ship` to merge
```
