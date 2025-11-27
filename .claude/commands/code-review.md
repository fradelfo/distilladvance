---
description: Review code quality, security, best practices
allowed-tools: Read, Grep, Glob, Bash(git diff:*, git log:*)
---

Review code:

$ARGUMENTS

## Checklist

### Correctness
- Solves problem?
- Edge cases?
- Error handling?

### Quality
- Readable?
- Names descriptive?
- Unnecessary complexity?
- Duplication?

### Testing
- Adequate tests?
- Edge cases tested?
- Tests readable?

### Security
- Input validated?
- Injection risks?
- Secrets safe?

### Performance
- Obvious issues?
- Unnecessary renders?
- Efficient queries?

### Accessibility
- Keyboard?
- ARIA?
- Screen reader?

## Output

- 🔴 **Must fix:** Critical
- 🟡 **Should fix:** Important
- 🟢 **Consider:** Nice-to-have
- ✅ **Good:** Done well

Include line refs and code suggestions.
