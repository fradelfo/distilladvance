# Debugging Workflow

A systematic approach to identifying, isolating, and resolving bugs using Claude Code to accelerate the debugging process and ensure thorough problem resolution.

## Overview

This workflow provides a structured methodology for debugging issues from initial problem identification through resolution and prevention. It emphasizes systematic investigation, evidence-based reasoning, and comprehensive validation to ensure problems are fully resolved.

**Benefits:**
- **Systematic Approach**: Consistent methodology reduces debugging time and improves success rate
- **Knowledge Capture**: Documents investigation process and solutions for future reference
- **Root Cause Focus**: Ensures underlying issues are addressed, not just symptoms
- **Prevention Oriented**: Includes steps to prevent similar issues in the future

## Prerequisites

### Required Tools
- Debugger (browser DevTools, IDE debugger, language-specific debuggers)
- Logging and monitoring tools (application logs, system metrics)
- Version control system for code history analysis
- Testing frameworks for reproduction and validation
- Performance monitoring tools (APM, profilers)

### Team Knowledge
- Understanding of application architecture and data flow
- Proficiency with debugging tools and techniques
- Knowledge of logging and monitoring systems
- Familiarity with testing and validation approaches

### Environment Setup
- Access to relevant environments (development, staging, production)
- Proper logging levels configured
- Debugging tools and IDE configured
- Access to monitoring dashboards and metrics
- Test data and scenarios available

## Debugging Process Phases

### Phase 1: Problem Identification & Triage

```markdown
## Step 1.1: Issue Description and Classification

**Objective**: Clearly understand and document the problem, assess its impact, and determine appropriate priority level.

**Instructions**:
1. Gather detailed problem description from reporter
2. Reproduce the issue if possible
3. Assess impact on users and business operations
4. Classify bug type and assign priority
5. Determine if immediate hotfix is needed

**Claude Code Assistance**:
```bash
# Get help organizing bug information
"Help me analyze and organize this bug report:

Bug Description: [PASTE_BUG_DESCRIPTION]
Steps to Reproduce: [PASTE_STEPS]
Expected Behavior: [PASTE_EXPECTED]
Actual Behavior: [PASTE_ACTUAL]
Environment: [ENVIRONMENT_INFO]

Please help me:
1. Classify the bug type and severity
2. Identify potential causes based on symptoms
3. Suggest investigation approaches
4. Determine if this needs immediate attention
5. Create a structured investigation plan"
```

**Bug Classification Framework**:
```markdown
## Bug Severity Levels

### Critical (P0) - Immediate Action Required
- Complete system outage or data loss
- Security vulnerabilities actively being exploited
- Financial impact or regulatory compliance issues
- Affects core business functionality for all users

### High (P1) - Fix within 24 hours
- Major functionality broken for significant user base
- Performance degradation affecting user experience
- Data integrity issues without immediate data loss
- Workaround available but not sustainable

### Medium (P2) - Fix within week
- Functionality broken for subset of users
- Minor performance issues
- UI/UX problems that don't prevent task completion
- Non-critical features not working properly

### Low (P3) - Fix in next release cycle
- Cosmetic issues or minor usability problems
- Enhancement requests disguised as bugs
- Issues affecting development/testing environments only
- Documentation or error message improvements
```

**Issue Documentation Template**:
```markdown
## Bug Report: [TITLE]

### Problem Summary
Brief description of the issue and its impact

### Environment
- **Application Version**:
- **Environment**: Development/Staging/Production
- **Browser/Platform**:
- **User Account**:
- **Timestamp**:

### Steps to Reproduce
1. Step one with specific details
2. Step two with expected state
3. Step three where problem occurs

### Expected Behavior
What should happen according to requirements

### Actual Behavior
What actually happens, including error messages

### Impact Assessment
- **Users Affected**: Number/percentage of users impacted
- **Business Impact**: Revenue, compliance, reputation effects
- **Workaround Available**: Yes/No and details

### Additional Context
- Browser console errors
- Network requests/responses
- Relevant log entries
- Screenshots or recordings
```

**Quality Gates**:
- [ ] Problem is clearly documented and reproducible
- [ ] Severity and priority are appropriately assigned
- [ ] Impact assessment is complete and accurate
- [ ] Initial investigation plan is defined
```

```markdown
## Step 1.2: Environment and Data Analysis

**Objective**: Analyze the environment conditions and data state when the bug occurs to establish baseline investigation context.

**Instructions**:
1. Examine system logs around the time of issue occurrence
2. Check system metrics (CPU, memory, disk, network)
3. Analyze recent deployments or configuration changes
4. Review data consistency and integrity
5. Document environmental factors that may contribute

**Claude Code Assistance**:
```bash
# Analyze log files and system state
"Help me analyze these system logs and identify potential causes:

Error Logs: [PASTE_ERROR_LOGS]
System Metrics: [PASTE_METRICS]
Recent Changes: [LIST_RECENT_DEPLOYMENTS]

Please help me:
1. Identify patterns in error logs
2. Correlate errors with system metrics
3. Find timing relationships with recent changes
4. Suggest specific areas to investigate
5. Prioritize investigation steps"
```

**Environmental Analysis Checklist**:
```markdown
## System Environment Check
- [ ] Application logs reviewed for errors and warnings
- [ ] Database logs checked for query errors or timeouts
- [ ] System resource usage (CPU, memory, disk, network)
- [ ] Recent deployments and their timing
- [ ] Configuration changes and environment variables
- [ ] Third-party service status and connectivity

## Data Analysis
- [ ] Database consistency checks
- [ ] Data volume and growth patterns
- [ ] User session and authentication data
- [ ] Cache state and invalidation
- [ ] File system permissions and disk space

## Traffic and Load Analysis
- [ ] Request volume and patterns
- [ ] Geographic distribution of affected users
- [ ] Time-based patterns (specific hours, days)
- [ ] Load balancer and CDN behavior
```

**Quality Gates**:
- [ ] Comprehensive environmental baseline established
- [ ] Log analysis completed with patterns identified
- [ ] Recent changes catalogued and assessed
- [ ] Data integrity verified
```

### Phase 2: Investigation & Root Cause Analysis

```markdown
## Step 2.1: Code Analysis and History Review

**Objective**: Analyze relevant code sections and recent changes to identify potential causes of the bug.

**Instructions**:
1. Identify code sections most likely related to the problem
2. Review recent commits and pull requests in those areas
3. Analyze code logic for potential edge cases or race conditions
4. Check for recent dependency updates or configuration changes
5. Use git blame/annotate to understand code history

**Claude Code Assistance**:
```javascript
// Ask Claude to analyze code for potential issues
"Help me analyze this code section for potential bugs:

Function: [PASTE_FUNCTION_CODE]
Recent Changes: [PASTE_GIT_DIFF]
Error Context: [DESCRIBE_ERROR_CONTEXT]

Please help me:
1. Identify potential logic errors or edge cases
2. Analyze recent changes for regression risks
3. Find possible race conditions or timing issues
4. Suggest specific debugging approaches
5. Identify areas needing closer examination"

// Example code analysis request
"Analyze this user authentication function for potential security or logic issues:

async function authenticateUser(email, password) {
  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  user.lastLoginAt = new Date();
  await user.save();

  return { user, token };
}

Recent changes include switching from bcrypt.compare to bcrypt.compareSync for performance reasons."
```

**Code Analysis Framework**:
```markdown
## Static Code Analysis
- [ ] Logic flow analysis for edge cases
- [ ] Input validation and error handling review
- [ ] Null/undefined reference checks
- [ ] Type safety and data conversion issues
- [ ] Async/await and promise handling
- [ ] Resource management (connections, files, memory)

## Recent Changes Analysis
- [ ] Git log review for last 30 days in affected areas
- [ ] Pull request analysis for related changes
- [ ] Dependency update impact assessment
- [ ] Configuration and environment variable changes
- [ ] Database schema or data migration effects

## Architecture Pattern Analysis
- [ ] Data flow through application layers
- [ ] Error propagation and handling patterns
- [ ] Caching and state management consistency
- [ ] Service integration and API contract compliance
- [ ] Security and authorization boundary checks
```

**Code Review Commands**:
```bash
# Analyze recent changes in affected area
git log --oneline --since="30 days ago" -- src/auth/
git diff HEAD~10..HEAD -- src/auth/authentication.js

# Find when specific code was last modified
git blame src/auth/authentication.js
git log -p --follow src/auth/authentication.js

# Search for similar patterns across codebase
grep -r "bcrypt.compareSync" src/
grep -r "JWT_SECRET" --include="*.js" src/
```

**Quality Gates**:
- [ ] Relevant code sections identified and analyzed
- [ ] Recent changes assessed for regression potential
- [ ] Code logic verified against expected behavior
- [ ] Potential causes documented with evidence
```

```markdown
## Step 2.2: Interactive Debugging and Reproduction

**Objective**: Use debugging tools to step through code execution and reproduce the issue in a controlled environment.

**Instructions**:
1. Set up debugging environment with reproduction steps
2. Use debugger to step through code execution path
3. Examine variable states and data flow at each step
4. Identify the exact point where behavior deviates from expected
5. Test various input conditions and edge cases

**Claude Code Assistance**:
```bash
# Get debugging strategy guidance
"Help me create a debugging strategy for this issue:

Problem: User authentication fails intermittently
Symptoms: Sometimes returns 'Invalid credentials' for valid users
Code path: [DESCRIBE_AUTHENTICATION_FLOW]
Debugging tools available: Node.js debugger, Chrome DevTools, console logs

Please help me:
1. Plan systematic debugging approach
2. Identify key breakpoints to set
3. Suggest data points to monitor
4. Create test scenarios for reproduction
5. Design experiments to isolate the cause"
```

**Debugging Strategy Template**:
```markdown
## Debugging Approach

### Hypothesis Formation
Based on analysis, form specific hypotheses about the root cause:
- **Hypothesis 1**: Race condition in user lookup vs password validation
- **Hypothesis 2**: bcrypt.compareSync blocking event loop causing timeouts
- **Hypothesis 3**: JWT_SECRET environment variable not properly loaded

### Experimental Design
For each hypothesis, design specific experiments:

#### Hypothesis 1 Testing
```javascript
// Add detailed logging around async operations
async function authenticateUser(email, password) {
  console.log(`Auth start: ${email} at ${new Date().toISOString()}`);

  const userFindStart = Date.now();
  const user = await User.findOne({ email });
  console.log(`User lookup took: ${Date.now() - userFindStart}ms`);

  if (!user) {
    console.log(`No user found for email: ${email}`);
    throw new Error('Invalid credentials');
  }

  console.log(`User found: ${user.id}, attempting password verification`);
  const passwordCheckStart = Date.now();
  const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
  console.log(`Password check took: ${Date.now() - passwordCheckStart}ms, result: ${isValidPassword}`);

  // Continue with rest of function...
}
```

#### Controlled Reproduction
```javascript
// Create isolated test case
describe('Authentication Debugging', () => {
  beforeEach(async () => {
    // Set up known good state
    await User.deleteMany({});
    const testUser = await User.create({
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('testpassword', 10)
    });
  });

  it('should authenticate valid user consistently', async () => {
    // Run authentication multiple times
    for (let i = 0; i < 100; i++) {
      const result = await authenticateUser('test@example.com', 'testpassword');
      expect(result).toBeDefined();
      expect(result.token).toBeTruthy();
    }
  });

  it('should handle concurrent authentication attempts', async () => {
    const promises = Array(10).fill().map(() =>
      authenticateUser('test@example.com', 'testpassword')
    );

    const results = await Promise.all(promises);
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.token).toBeTruthy();
    });
  });
});
```

### Data Collection Points
- Function entry and exit timing
- Database query performance and results
- Memory usage during password hashing
- Event loop lag measurements
- Error stack traces and context
```

**Interactive Debugging Commands**:
```bash
# Start Node.js with debugger
node --inspect-brk=0.0.0.0:9229 server.js

# Chrome DevTools debugging
# Open chrome://inspect and connect to Node.js process

# VS Code debugging configuration
{
  "type": "node",
  "request": "launch",
  "name": "Debug Authentication",
  "program": "${workspaceFolder}/server.js",
  "env": {
    "NODE_ENV": "development"
  },
  "console": "integratedTerminal"
}
```

**Quality Gates**:
- [ ] Issue successfully reproduced in controlled environment
- [ ] Code execution path traced and documented
- [ ] Variable states and data transformations verified
- [ ] Exact failure point identified
- [ ] Hypothesis validated or refuted with evidence
```

### Phase 3: Solution Development

```markdown
## Step 3.1: Solution Design and Implementation

**Objective**: Design and implement a targeted fix that addresses the root cause without introducing new issues.

**Instructions**:
1. Design solution that addresses root cause, not just symptoms
2. Consider impact on existing functionality and performance
3. Plan backward compatibility and migration if needed
4. Implement fix with comprehensive logging and monitoring
5. Add tests to prevent regression

**Claude Code Assistance**:
```javascript
// Get help designing the fix
"Help me design a solution for this authentication issue:

Root Cause: bcrypt.compareSync blocking event loop causing request timeouts
Current Code: [PASTE_CURRENT_CODE]
Constraints: Must maintain security, minimal performance impact

Please help me:
1. Design async solution to replace blocking operation
2. Implement proper error handling
3. Add monitoring and logging
4. Create tests to validate fix
5. Plan rollout and monitoring strategy"

// Example solution implementation
"Help me implement this authentication fix:

Problem: Blocking password comparison causing timeouts
Solution Approach: Use async bcrypt.compare with timeout and retry logic

Requirements:
- Non-blocking password verification
- Timeout handling for slow operations
- Proper error differentiation
- Maintain security properties
- Add comprehensive logging"
```

**Solution Implementation Example**:
```javascript
// Fixed authentication function with async operations and timeout
const bcrypt = require('bcrypt');
const { promisify } = require('util');

// Create timeout wrapper for bcrypt operations
const withTimeout = (promise, timeoutMs, operation) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

async function authenticateUser(email, password) {
  const authId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${authId}] Authentication started for email: ${email}`);

    // User lookup with timeout
    const userLookupStart = Date.now();
    const user = await withTimeout(
      User.findOne({ email }),
      5000,
      'user_lookup'
    );

    const userLookupTime = Date.now() - userLookupStart;
    console.log(`[${authId}] User lookup completed in ${userLookupTime}ms`);

    if (!user) {
      console.log(`[${authId}] No user found for email: ${email}`);
      throw new Error('Invalid credentials');
    }

    // Async password verification with timeout
    const passwordCheckStart = Date.now();
    const isValidPassword = await withTimeout(
      bcrypt.compare(password, user.passwordHash),
      3000,
      'password_verification'
    );

    const passwordCheckTime = Date.now() - passwordCheckStart;
    console.log(`[${authId}] Password verification completed in ${passwordCheckTime}ms`);

    if (!isValidPassword) {
      console.log(`[${authId}] Invalid password for user: ${user.id}`);
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const tokenGenStart = Date.now();
    const token = jwt.sign(
      { userId: user.id, authId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login (non-blocking)
    User.findByIdAndUpdate(user.id, { lastLoginAt: new Date() }).catch(err => {
      console.error(`[${authId}] Failed to update lastLoginAt:`, err);
    });

    const totalTime = Date.now() - userLookupStart;
    console.log(`[${authId}] Authentication successful, total time: ${totalTime}ms`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token,
      authId
    };

  } catch (error) {
    console.error(`[${authId}] Authentication failed:`, error.message);

    // Differentiate between timeout and credential errors for monitoring
    if (error.message.includes('timeout')) {
      // Log timeout for monitoring/alerting
      console.error(`[${authId}] TIMEOUT ERROR - investigate performance issue`);
      throw new Error('Authentication service temporarily unavailable');
    }

    throw error;
  }
}

// Comprehensive test coverage for the fix
describe('Fixed Authentication', () => {
  describe('Performance and Reliability', () => {
    it('should handle slow password verification gracefully', async () => {
      // Mock slow bcrypt.compare
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(true), 2000))
      );

      const result = await authenticateUser('test@example.com', 'password');
      expect(result).toBeDefined();
      expect(result.token).toBeTruthy();

      bcrypt.compare = originalCompare;
    });

    it('should timeout and fail gracefully for extremely slow operations', async () => {
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(true), 5000))
      );

      await expect(authenticateUser('test@example.com', 'password'))
        .rejects.toThrow('Authentication service temporarily unavailable');

      bcrypt.compare = originalCompare;
    });

    it('should handle concurrent authentication requests', async () => {
      const promises = Array(20).fill().map(() =>
        authenticateUser('test@example.com', 'password')
      );

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.token).toBeTruthy();
      });
    });
  });

  describe('Security Properties', () => {
    it('should maintain timing-attack resistance', async () => {
      const validUserTime = [];
      const invalidUserTime = [];

      // Test with valid user
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        try {
          await authenticateUser('test@example.com', 'wrongpassword');
        } catch (e) {}
        validUserTime.push(Date.now() - start);
      }

      // Test with invalid user
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        try {
          await authenticateUser('nonexistent@example.com', 'password');
        } catch (e) {}
        invalidUserTime.push(Date.now() - start);
      }

      // Timing should be similar (within reasonable variance)
      const avgValidTime = validUserTime.reduce((a, b) => a + b) / validUserTime.length;
      const avgInvalidTime = invalidUserTime.reduce((a, b) => a + b) / invalidUserTime.length;

      expect(Math.abs(avgValidTime - avgInvalidTime)).toBeLessThan(50); // 50ms variance tolerance
    });
  });
});
```

**Quality Gates**:
- [ ] Solution addresses root cause, not just symptoms
- [ ] Implementation maintains security and performance requirements
- [ ] Comprehensive test coverage added
- [ ] Monitoring and logging enhanced
- [ ] Backward compatibility maintained
```

### Phase 4: Validation & Testing

```markdown
## Step 4.1: Comprehensive Testing and Validation

**Objective**: Thoroughly test the fix to ensure it resolves the issue without introducing new problems.

**Instructions**:
1. Test fix against original reproduction steps
2. Run comprehensive test suite to check for regressions
3. Perform load testing to validate performance improvements
4. Test edge cases and error conditions
5. Validate in staging environment with production-like data

**Claude Code Assistance**:
```bash
# Get help creating comprehensive test plan
"Help me create a comprehensive test plan to validate this authentication fix:

Original Issue: Intermittent authentication failures due to blocking operations
Fix Implemented: Async password verification with timeout handling
Test Environment: Staging environment with production data copy

Please help me:
1. Design test scenarios for the fix validation
2. Create load testing scripts
3. Plan regression testing approach
4. Define success criteria
5. Create monitoring and alerting for the fix"
```

**Test Validation Framework**:
```markdown
## Fix Validation Tests

### Functional Testing
- [ ] Original bug reproduction steps now pass consistently
- [ ] Valid credentials authenticate successfully (100 iterations)
- [ ] Invalid credentials properly rejected
- [ ] Edge cases handled correctly (empty inputs, special characters)
- [ ] Error messages remain user-friendly and secure

### Performance Testing
- [ ] Authentication response time improved (target: <200ms 95th percentile)
- [ ] Concurrent authentication handling (50+ simultaneous requests)
- [ ] Memory usage remains stable under load
- [ ] Event loop lag reduced significantly
- [ ] Database connection pool handling improved

### Regression Testing
- [ ] All existing authentication tests pass
- [ ] Related functionality unaffected (session management, logout)
- [ ] Integration with authorization systems working
- [ ] API endpoints maintain expected behavior
- [ ] Frontend authentication flows unchanged

### Security Testing
- [ ] Timing attack resistance maintained
- [ ] Password security properties preserved
- [ ] JWT token generation and validation working
- [ ] Audit logging captures all events properly
- [ ] No sensitive data exposed in logs
```

**Load Testing Script**:
```javascript
// Load testing script for authentication endpoint
const autocannon = require('autocannon');

async function runAuthenticationLoadTest() {
  console.log('Starting authentication load test...');

  const result = await autocannon({
    url: 'http://localhost:3000/auth/login',
    connections: 50,
    duration: 60,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'loadtest@example.com',
      password: 'testpassword'
    }),
    method: 'POST'
  });

  console.log('Load test results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.average} req/sec`);
  console.log(`Latency p95: ${result.latency.p95}ms`);
  console.log(`Errors: ${result.errors}`);

  // Validate performance requirements
  if (result.latency.p95 > 200) {
    throw new Error(`P95 latency ${result.latency.p95}ms exceeds 200ms requirement`);
  }

  if (result.errors > 0) {
    throw new Error(`${result.errors} errors occurred during load test`);
  }

  console.log('Load test passed all requirements!');
}

// Monitor system resources during test
const { performance, PerformanceObserver } = require('perf_hooks');
const obs = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });

runAuthenticationLoadTest().catch(console.error);
```

**Quality Gates**:
- [ ] Original issue no longer reproducible
- [ ] All functional tests pass
- [ ] Performance requirements met
- [ ] No regressions detected
- [ ] Security properties validated
```

### Phase 5: Deployment & Monitoring

```markdown
## Step 5.1: Production Deployment and Monitoring

**Objective**: Deploy the fix to production with careful monitoring and rollback capability.

**Instructions**:
1. Deploy fix to production using established procedures
2. Monitor application metrics and error rates closely
3. Validate fix effectiveness with real user traffic
4. Set up alerting for any related issues
5. Prepare for immediate rollback if problems occur

**Deployment Strategy**:
```bash
# Gradual rollout approach
# 1. Deploy to single server instance
kubectl patch deployment auth-service -p '{"spec":{"template":{"metadata":{"annotations":{"deployment.kubernetes.io/revision":"fix-auth-blocking"}}}}}'

# 2. Monitor for 15 minutes
kubectl logs -f deployment/auth-service | grep -E "(ERROR|timeout|authentication)"

# 3. Check metrics
curl -s http://monitoring.internal/api/v1/query?query=auth_response_time_p95

# 4. If successful, roll out to all instances
kubectl set image deployment/auth-service auth-service=auth-service:v1.2.1-auth-fix
```

**Monitoring Dashboard Setup**:
```yaml
# Prometheus monitoring rules
groups:
  - name: authentication.rules
    rules:
      - alert: AuthenticationLatencyHigh
        expr: histogram_quantile(0.95, rate(auth_request_duration_seconds_bucket[5m])) > 0.2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Authentication latency is high"
          description: "95th percentile authentication latency is {{ $value }}s"

      - alert: AuthenticationErrorRateHigh
        expr: rate(auth_errors_total[5m]) > 0.01
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Authentication error rate is high"
          description: "Authentication error rate is {{ $value }} errors/second"

      - alert: AuthenticationTimeouts
        expr: rate(auth_timeouts_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Authentication timeouts detected"
          description: "{{ $value }} authentication timeouts per second"
```

**Post-Deployment Validation**:
```bash
# Monitor authentication success rate
watch -n 5 'curl -s "http://monitoring.internal/api/v1/query?query=rate(auth_success_total[5m])" | jq ".data.result[0].value[1]"'

# Check for timeout errors
watch -n 10 'curl -s "http://monitoring.internal/api/v1/query?query=auth_timeouts_total" | jq ".data.result[0].value[1]"'

# Monitor response time improvements
curl -s "http://monitoring.internal/api/v1/query_range?query=auth_response_time_p95&start=$(date -d '1 hour ago' +%s)&end=$(date +%s)&step=300" | jq '.data.result[0].values'
```

**Quality Gates**:
- [ ] Deployment successful without errors
- [ ] Authentication error rate remains low
- [ ] Response times improved as expected
- [ ] No new timeout errors reported
- [ ] User experience metrics stable or improved
```

## Post-Resolution Activities

### Step 5.2: Documentation and Knowledge Sharing

```markdown
## Knowledge Capture and Prevention

**Objective**: Document the issue, solution, and lessons learned to prevent similar problems and improve team knowledge.

**Instructions**:
1. Create comprehensive post-mortem document
2. Update documentation and troubleshooting guides
3. Share learnings with team through presentation or discussion
4. Identify process improvements and preventive measures
5. Update monitoring and alerting based on insights

**Claude Code Assistance**:
```bash
# Get help writing post-mortem
"Help me write a comprehensive post-mortem for this authentication bug:

Issue: Intermittent authentication failures
Root Cause: Blocking bcrypt operations causing event loop blocking
Impact: 15% of authentication attempts failing during peak hours
Solution: Async bcrypt with timeout handling and improved monitoring

Please help me:
1. Structure the post-mortem document
2. Identify lessons learned
3. Suggest preventive measures
4. Create action items for process improvement
5. Draft communication for stakeholders"
```

**Post-Mortem Template**:
```markdown
# Post-Mortem: Authentication Intermittent Failures

## Incident Summary
- **Date**: [DATE]
- **Duration**: [START_TIME] - [END_TIME]
- **Severity**: High (P1)
- **Impact**: 15% authentication failure rate affecting ~1,500 users
- **Root Cause**: Synchronous bcrypt operations blocking Node.js event loop

## Timeline
- **09:30 UTC**: First reports of authentication issues from customer support
- **09:45 UTC**: Engineering team notified, investigation started
- **10:15 UTC**: Issue reproduced in staging environment
- **10:30 UTC**: Root cause identified as blocking bcrypt operations
- **11:00 UTC**: Fix implemented and tested in staging
- **11:30 UTC**: Fix deployed to production
- **11:45 UTC**: Issue resolved, monitoring confirms fix effectiveness

## Root Cause Analysis
### Primary Cause
Synchronous `bcrypt.compareSync()` operations were blocking the Node.js event loop during peak traffic periods, causing request timeouts and authentication failures.

### Contributing Factors
1. **Recent Code Change**: Performance optimization replaced async bcrypt.compare with sync version
2. **Insufficient Load Testing**: Change not tested under production-like concurrent load
3. **Monitoring Gap**: No specific alerts for event loop lag or authentication timeouts
4. **Review Process**: Performance implications of sync vs async not adequately discussed

## Impact Assessment
### User Impact
- 1,500+ users experienced authentication failures
- Average failure duration: 45 minutes
- No data loss or security compromise

### Business Impact
- Estimated revenue impact: $5,000 (failed purchases during outage)
- Customer support tickets: 23 reports
- Reputation impact: Minor (quick resolution, transparent communication)

## Resolution
### Immediate Fix
- Reverted to async `bcrypt.compare()` with proper timeout handling
- Added comprehensive logging for authentication operations
- Implemented monitoring for event loop lag

### Long-term Improvements
- Enhanced load testing to include authentication scenarios
- Added authentication-specific monitoring and alerting
- Updated code review checklist to include async/sync considerations

## Lessons Learned
### What Went Well
- Quick identification and reproduction of the issue
- Effective team communication and coordination
- Fast deployment and resolution
- No security or data integrity issues

### What Could Be Improved
- Earlier detection through better monitoring
- More comprehensive testing of performance changes
- Better understanding of Node.js event loop implications
- Automated performance regression testing

## Action Items
### Immediate (Within 1 Week)
- [ ] Add event loop lag monitoring and alerting
- [ ] Create authentication performance regression tests
- [ ] Update load testing to include authentication scenarios
- [ ] Document Node.js performance best practices

### Short-term (Within 1 Month)
- [ ] Implement automated performance testing in CI/CD
- [ ] Create comprehensive authentication monitoring dashboard
- [ ] Conduct team training on Node.js performance considerations
- [ ] Review and update code review checklist

### Long-term (Within 3 Months)
- [ ] Establish performance budgets for critical operations
- [ ] Implement chaos engineering for authentication systems
- [ ] Create comprehensive incident response playbooks
- [ ] Regular performance audits of critical paths

## Prevention Measures
1. **Monitoring**: Enhanced authentication and performance monitoring
2. **Testing**: Mandatory load testing for authentication changes
3. **Process**: Updated code review guidelines for async/sync decisions
4. **Education**: Team training on Node.js performance best practices
```

**Quality Gates**:
- [ ] Comprehensive post-mortem documented
- [ ] Action items assigned with owners and deadlines
- [ ] Team learnings shared and discussed
- [ ] Process improvements identified and planned
- [ ] Documentation updated with new knowledge
```

## Debugging Workflow Automation

### Custom Claude Code Commands

```markdown
# .claude/commands/debug-start.md
Start Debugging Session

## Instructions
Help me start a systematic debugging session:

1. Analyze the bug report and symptoms
2. Create investigation plan with priorities
3. Set up debugging environment
4. Suggest initial investigation steps
5. Document hypothesis and testing approach

Ask me about:
- Detailed problem description
- Steps to reproduce
- Environment and context
- Recent changes or deployments
- Available debugging tools and access
```

```markdown
# .claude/commands/debug-analyze.md
Analyze Debugging Evidence

## Instructions
Help me analyze the evidence I've gathered during debugging:

1. Review logs, metrics, and error traces
2. Correlate timing with system events
3. Identify patterns and anomalies
4. Form or refine hypotheses
5. Suggest next investigation steps

Provide me with:
- Log entries or error messages
- System metrics and performance data
- Timeline of events
- Recent code changes
- Environmental factors
```

```markdown
# .claude/commands/debug-fix.md
Design and Implement Fix

## Instructions
Help me design and implement a proper fix:

1. Review root cause analysis findings
2. Design solution that addresses core issue
3. Consider impact and side effects
4. Implement with proper testing
5. Plan deployment and monitoring

Include:
- Root cause explanation
- Current problematic code
- Requirements and constraints
- Testing and validation needs
- Rollback and monitoring plans
```

### Debugging Automation Tools

```bash
#!/bin/bash
# scripts/debug-setup.sh - Set up debugging environment

echo "Setting up debugging environment..."

# Enable detailed logging
export NODE_ENV=debug
export DEBUG=auth:*,database:*,api:*

# Start application with debugging
node --inspect-brk=0.0.0.0:9229 server.js &
APP_PID=$!

# Start log monitoring
tail -f logs/application.log | grep -E "(ERROR|WARN|auth)" &
LOG_PID=$!

echo "Debugging environment ready:"
echo "  - Application PID: $APP_PID"
echo "  - Debug port: 9229"
echo "  - Log monitoring PID: $LOG_PID"
echo "  - Chrome DevTools: chrome://inspect"

# Cleanup function
cleanup() {
  echo "Cleaning up debugging environment..."
  kill $APP_PID $LOG_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM
wait
```

This comprehensive debugging workflow provides teams with a systematic approach to identifying, analyzing, and resolving bugs while capturing knowledge and preventing future occurrences.