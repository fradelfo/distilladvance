---
name: code-review
description: Comprehensive code review using code-reviewer agent with security, performance, and quality analysis
---

Use the code-reviewer agent to perform a comprehensive analysis of recent code changes, focusing on:

**Primary Review Areas:**
- Code quality and architecture patterns
- Security vulnerabilities and browser extension security
- Performance implications and optimization opportunities
- TypeScript/React best practices and modern patterns
- Browser extension compliance (Manifest V3, permissions, CSP)

**Automated Analysis:**
- Static code analysis with Biome linting
- Security scanning for OWASP vulnerabilities
- Dependency audit for known security issues
- Bundle size analysis and performance budget validation
- Extension store compliance checking

**Review Process:**
1. Analyze recent Git commits (last 10 commits or since last release tag)
2. Identify modified files and their impact scope
3. Perform automated security and quality scans
4. Review architecture decisions and integration patterns
5. Check browser extension security patterns
6. Validate AI/LLM integration best practices
7. Assess performance impact and optimization opportunities

**Output Requirements:**
- Prioritized list of issues (Critical, High, Medium, Low)
- Specific file locations and line numbers for issues
- Actionable recommendations with implementation guidance
- Security risk assessment for browser extension changes
- Performance impact summary with optimization suggestions
- Compliance check for extension store policies

**Quality Gates:**
- Critical security issues must be addressed before deployment
- Code quality score must be >= 8/10
- Bundle size must stay within performance budget
- All new code must include appropriate tests
- Browser extension permissions must be justified and minimal

Please focus on recent changes and provide specific, actionable feedback that improves both code quality and security posture.