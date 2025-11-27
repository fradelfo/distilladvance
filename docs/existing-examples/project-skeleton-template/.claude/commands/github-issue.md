---
name: github-issue
description: Intelligent GitHub issue analysis and resolution using orchestrator with multi-agent coordination
---

Use the orchestrator to analyze and resolve GitHub issues with intelligent agent coordination:

**Issue Analysis & Classification:**
1. **Automatic Issue Categorization:**
   - Bug Report: Functional issues, crashes, unexpected behavior
   - Feature Request: New functionality or enhancement proposals
   - Security Issue: Vulnerability reports, security concerns
   - Performance Issue: Speed, memory, or resource optimization
   - Documentation: Missing or outdated documentation
   - Browser Extension Issue: Extension-specific functionality
   - AI/LLM Issue: Model performance, prompt optimization, cost concerns

2. **Priority Assessment:**
   - Critical: Security vulnerabilities, data loss, system down
   - High: Major functionality broken, significant user impact
   - Medium: Minor functionality issues, enhancement requests
   - Low: Documentation updates, minor improvements

3. **Complexity Estimation:**
   - Simple: 1-2 hours, single agent, straightforward fix
   - Medium: 4-8 hours, 2-3 agents, moderate complexity
   - Complex: 1-3 days, multiple agents, architectural changes

**Agent Assignment Strategy:**
- **Frontend Agent**: UI bugs, React components, extension popup issues
- **Platform Agent**: API issues, AI/LLM problems, backend functionality
- **Security Agent**: Security vulnerabilities, privacy concerns, compliance
- **DevOps Agent**: Deployment issues, infrastructure problems, CI/CD
- **Quality Agent**: Testing issues, performance problems, browser compatibility
- **Code Reviewer**: Code quality issues, refactoring requests
- **Tech-Lead Agent**: Architecture decisions, complex technical issues

**Issue Resolution Workflow:**

**Phase 1: Issue Investigation**
1. **Automatic Context Gathering:**
   - Read issue description and comments
   - Analyze provided error logs and stack traces
   - Review related code sections and recent changes
   - Check for similar issues in project history
   - Identify affected components and systems

2. **Reproduction Attempt:**
   - Create minimal reproduction case
   - Test across different environments (dev, staging)
   - Validate browser extension across multiple browsers
   - Document reproduction steps and conditions

**Phase 2: Solution Development**
1. **Root Cause Analysis:**
   - Identify the underlying cause of the issue
   - Assess impact scope and affected users
   - Determine if it's a regression or new issue
   - Evaluate potential side effects of fixes

2. **Solution Design:**
   - Design appropriate fix or enhancement
   - Consider alternative approaches
   - Assess impact on existing functionality
   - Plan testing strategy for solution validation

**Phase 3: Implementation & Testing**
1. **Code Implementation:**
   - Implement fix or feature according to design
   - Follow established code standards and patterns
   - Include comprehensive error handling
   - Add appropriate logging and monitoring

2. **Comprehensive Testing:**
   - Unit tests for new code and bug fixes
   - Integration tests for system interactions
   - Regression tests to prevent issue recurrence
   - Browser extension compatibility testing
   - Performance impact assessment

**Phase 4: Validation & Deployment**
1. **Code Review:**
   - Peer review of implemented solution
   - Security review for sensitive changes
   - Performance impact assessment
   - Documentation update verification

2. **Staged Deployment:**
   - Deploy to development environment
   - Validate fix in staging environment
   - Monitor metrics and error rates
   - Deploy to production with monitoring

**Special Handling for Issue Types:**

**Bug Reports:**
- Reproduce issue reliably
- Create comprehensive test cases
- Implement fix with regression prevention
- Add monitoring to prevent recurrence

**Feature Requests:**
- Validate feature value and feasibility
- Design user experience and API
- Implement with comprehensive testing
- Document new functionality thoroughly

**Security Issues:**
- Immediate assessment and containment
- Coordinate with security agent for audit
- Implement fix with security review
- Security testing and vulnerability assessment

**Performance Issues:**
- Profile and benchmark current performance
- Identify bottlenecks and optimization opportunities
- Implement optimizations with measurement
- Validate performance improvements

**Browser Extension Issues:**
- Test across Chrome, Firefox, Edge browsers
- Validate content script injection and compatibility
- Check manifest permissions and store compliance
- Ensure cross-browser API compatibility

**AI/LLM Issues:**
- Analyze prompt effectiveness and cost efficiency
- Test model performance and response quality
- Optimize for cost and performance balance
- Validate AI safety and content filtering

**Issue Response Templates:**

**Initial Response (within 24 hours):**
```markdown
Thank you for reporting this issue!

**Issue Classification:**
- Type: [Bug/Feature/Security/Performance/Documentation]
- Priority: [Critical/High/Medium/Low]
- Complexity: [Simple/Medium/Complex]
- Assigned Agent: [Agent Name]

**Next Steps:**
- [Specific investigation or reproduction steps]
- [Timeline for resolution]
- [Any additional information needed]

We'll keep you updated on progress and expected resolution timeline.
```

**Resolution Update:**
```markdown
**Issue Resolution Update:**

**Root Cause:** [Brief explanation of the issue cause]
**Solution:** [Description of implemented fix]
**Testing:** [Validation steps taken]
**Impact:** [Any side effects or considerations]

**Implementation:**
- PR: #[number]
- Deployment: [timeline]
- Monitoring: [metrics being tracked]

The fix will be available in the next release. Please test and confirm resolution.
```

**Quality Gates for Issue Resolution:**
- Issue must be reproduced before implementing fix
- Solution must include comprehensive tests
- Security review required for security-related issues
- Performance impact must be assessed and acceptable
- Documentation must be updated for user-facing changes
- Resolution must be validated in staging before production

Please provide the GitHub issue URL or paste the issue content for analysis and resolution coordination.