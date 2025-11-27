# Test-Driven Development (TDD) Workflow

A systematic approach to implementing Test-Driven Development using Claude Code to guide the red-green-refactor cycle and ensure high-quality, well-tested code.

## Overview

This workflow implements the classic TDD cycle with Claude Code assistance to help write effective tests, implement minimal code, and refactor safely. The pattern emphasizes writing tests first, implementing just enough code to make tests pass, and then improving code quality through refactoring.

**Benefits:**
- **Higher Code Quality**: Tests define requirements and catch regressions
- **Better Design**: Writing tests first leads to more modular, testable code
- **Confidence in Changes**: Comprehensive test suite enables safe refactoring
- **Documentation**: Tests serve as executable documentation of behavior

## Prerequisites

### Required Tools
- Test framework (Jest, PyTest, Go Test, JUnit, etc.)
- Code coverage tools (Istanbul, Coverage.py, etc.)
- Mocking/stubbing libraries
- Claude Code with testing agent templates

### Team Knowledge
- Understanding of testing principles and patterns
- Familiarity with test framework and assertion libraries
- Basic refactoring techniques
- Understanding of code coverage metrics

### Project Setup
- Test framework configured with proper test discovery
- Code coverage reporting set up
- CI/CD integration for automated test execution
- Minimum coverage thresholds defined (recommended: 80%+)

## TDD Workflow Steps

### Phase 1: RED - Write a Failing Test

```markdown
## Step 1.1: Identify Next Requirement

**Objective**: Select the smallest, most specific requirement to implement next.

**Instructions**:
1. Review current feature requirements or user story
2. Identify the next smallest behavioral requirement
3. Ensure requirement is specific and testable
4. Document expected behavior in plain language

**Claude Code Assistance**:
```bash
# Ask Claude to help break down requirements
"Analyze this feature requirement and suggest the next smallest, most testable behavior to implement: [REQUIREMENT_DESCRIPTION]"

# Example
"Analyze this user authentication feature and suggest the next smallest behavior to implement. Current status: basic user model exists, no authentication yet."
```

**Quality Criteria**:
- [ ] Requirement is atomic (cannot be broken down further)
- [ ] Expected behavior is clearly defined
- [ ] Success criteria are measurable
- [ ] Requirement builds on existing functionality
```

```markdown
## Step 1.2: Write the Failing Test

**Objective**: Create a test that describes the desired behavior and fails because the behavior is not yet implemented.

**Instructions**:
1. Write a test that expresses the requirement in code
2. Use descriptive test names that explain the expected behavior
3. Follow the Arrange-Act-Assert pattern
4. Ensure test is focused on a single behavior

**Claude Code Assistance**:
```javascript
// Ask Claude to help write the test
"Write a Jest test for this behavior: A user should be able to authenticate with valid email and password. The test should verify that authentication returns a JWT token and user information."

// Claude will help structure the test
describe('User Authentication', () => {
  it('should return JWT token and user info for valid credentials', async () => {
    // Arrange
    const validEmail = 'user@example.com';
    const validPassword = 'securePassword123';
    const mockUser = { id: 1, email: validEmail, name: 'Test User' };

    // Act
    const result = await authenticateUser(validEmail, validPassword);

    // Assert
    expect(result).toHaveProperty('token');
    expect(result.token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
    expect(result.user).toEqual(mockUser);
  });
});
```

**Test Quality Checklist**:
- [ ] Test name clearly describes expected behavior
- [ ] Test is independent and can run in isolation
- [ ] Test uses meaningful assertions
- [ ] Test setup is minimal and focused
- [ ] Mock dependencies are properly configured
```

```markdown
## Step 1.3: Run Test and Confirm Failure

**Objective**: Verify that the new test fails for the expected reason (missing implementation).

**Instructions**:
1. Run the test suite including the new test
2. Confirm the new test fails
3. Verify failure is due to missing implementation, not test errors
4. Document the failure reason

**Claude Code Commands**:
```bash
# Run specific test to see failure
npm test -- --testNamePattern="should return JWT token"

# Run with verbose output to see detailed failure
npm test -- --verbose --testNamePattern="authentication"

# Check test coverage before implementation
npm test -- --coverage
```

**Validation Criteria**:
- [ ] New test fails as expected
- [ ] Failure message indicates missing functionality
- [ ] Existing tests still pass
- [ ] Test failure is clear and descriptive

**Common Issues**:
- **Test passes unexpectedly**: Check if functionality already exists
- **Test has syntax errors**: Fix test code before proceeding
- **Test fails for wrong reason**: Verify test setup and dependencies
```

### Phase 2: GREEN - Make the Test Pass

```markdown
## Step 2.1: Implement Minimal Code

**Objective**: Write the simplest code that makes the failing test pass without breaking existing tests.

**Instructions**:
1. Implement only what is needed to make the test pass
2. Avoid over-engineering or implementing extra features
3. Use hardcoded values if they make the test pass
4. Focus on making it work, not making it perfect

**Claude Code Assistance**:
```javascript
// Ask Claude for minimal implementation
"Write the minimal implementation to make this test pass: [PASTE_TEST_CODE]. Focus only on making the test pass, not on perfect design."

// Example implementation guidance
"Here's my failing test for user authentication. Write the minimal authenticateUser function to make it pass:

describe('User Authentication', () => {
  it('should return JWT token and user info for valid credentials', async () => {
    const result = await authenticateUser('user@example.com', 'securePassword123');
    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('user@example.com');
  });
});
```

**Implementation Example**:
```javascript
// Minimal implementation (may include hardcoded values)
async function authenticateUser(email, password) {
  // Minimal implementation to make test pass
  if (email === 'user@example.com' && password === 'securePassword123') {
    return {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: { id: 1, email: 'user@example.com', name: 'Test User' }
    };
  }
  throw new Error('Invalid credentials');
}
```

**Quality Guidelines**:
- [ ] Code compiles and runs without errors
- [ ] Implementation is as simple as possible
- [ ] No unnecessary complexity or abstractions
- [ ] Hardcoded values are acceptable at this stage
```

```markdown
## Step 2.2: Run Tests and Confirm Success

**Objective**: Verify that all tests now pass, including the new test and all existing tests.

**Instructions**:
1. Run the complete test suite
2. Confirm the new test passes
3. Verify all existing tests still pass
4. Check that no tests were accidentally broken

**Claude Code Commands**:
```bash
# Run all tests to ensure nothing broke
npm test

# Run with coverage to see impact
npm test -- --coverage

# Run specific test file if working on focused area
npm test src/auth/authentication.test.js

# Watch mode for continuous feedback
npm test -- --watch
```

**Success Criteria**:
- [ ] New test passes
- [ ] All existing tests pass
- [ ] No test failures or errors
- [ ] Code coverage maintains or improves

**If Tests Fail**:
1. **New test still fails**: Implementation may be incomplete
2. **Existing tests broken**: Implementation may have side effects
3. **Multiple failures**: Consider smaller implementation steps
```

### Phase 3: REFACTOR - Improve Code Quality

```markdown
## Step 3.1: Identify Refactoring Opportunities

**Objective**: Look for ways to improve code quality while maintaining all test passes.

**Instructions**:
1. Look for code duplication
2. Identify complex or unclear code sections
3. Check for proper separation of concerns
4. Consider better variable/function names
5. Evaluate error handling and edge cases

**Claude Code Assistance**:
```bash
# Ask Claude to identify refactoring opportunities
"Review this code and suggest refactoring opportunities. Focus on improving readability, removing duplication, and better design patterns:

[PASTE_CURRENT_IMPLEMENTATION]

Current tests that must continue passing:
[PASTE_TEST_CODE]"
```

**Common Refactoring Opportunities**:
- Remove hardcoded values and add proper logic
- Extract helper functions for complex operations
- Improve error handling and validation
- Add input validation and sanitization
- Improve variable and function naming
- Remove code duplication
```

```markdown
## Step 3.2: Refactor with Continuous Testing

**Objective**: Improve code quality through small, safe refactoring steps while ensuring tests remain green.

**Instructions**:
1. Make small, incremental changes
2. Run tests after each refactoring step
3. Ensure all tests continue to pass
4. If tests break, immediately revert and take smaller steps

**Refactoring Example**:
```javascript
// Before refactoring (hardcoded values)
async function authenticateUser(email, password) {
  if (email === 'user@example.com' && password === 'securePassword123') {
    return {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: { id: 1, email: 'user@example.com', name: 'Test User' }
    };
  }
  throw new Error('Invalid credentials');
}

// After refactoring (proper implementation)
async function authenticateUser(email, password) {
  const user = await userRepository.findByEmail(email);
  if (!user || !await bcrypt.compare(password, user.hashedPassword)) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name }
  };
}
```

**Refactoring Checklist**:
- [ ] Each refactoring step is small and focused
- [ ] Tests pass after each change
- [ ] Code is more readable and maintainable
- [ ] No functionality is added (only improved)
- [ ] Error handling is appropriate
```

```markdown
## Step 3.3: Final Validation

**Objective**: Ensure the refactored code meets quality standards and all requirements.

**Instructions**:
1. Run complete test suite with coverage
2. Verify code meets team standards
3. Check that implementation properly handles edge cases
4. Ensure code is ready for code review

**Claude Code Commands**:
```bash
# Run comprehensive test suite
npm test -- --coverage --verbose

# Run linting and code quality checks
npm run lint
npm run type-check

# Run integration tests if available
npm run test:integration
```

**Quality Gates**:
- [ ] All tests pass (unit, integration, e2e)
- [ ] Code coverage meets minimum threshold (80%+)
- [ ] Code follows team style guidelines
- [ ] No linting errors or warnings
- [ ] TypeScript types are correct (if applicable)
- [ ] Code is properly documented
```

## TDD Cycle Automation

### Custom Claude Code Commands

Create these commands in `.claude/commands/` to streamline your TDD workflow:

```markdown
# .claude/commands/tdd-red.md
Start TDD Red Phase - Write Failing Test

## Instructions
Help me start the red phase of TDD:

1. Analyze the current feature requirement
2. Suggest the next smallest testable behavior
3. Help write a focused, failing test
4. Ensure test follows testing best practices
5. Verify test fails for the right reasons

Ask me about:
- The feature requirement or user story
- Current implementation status
- Testing framework preferences
- Specific behavior to test next
```

```markdown
# .claude/commands/tdd-green.md
TDD Green Phase - Implement Minimal Code

## Instructions
Help me implement the minimal code to make failing tests pass:

1. Review the failing test
2. Suggest minimal implementation approach
3. Help write simple code that makes test pass
4. Avoid over-engineering or extra features
5. Focus on making it work, not perfect

Guidelines:
- Hardcoded values are acceptable initially
- Implement only what the test requires
- No additional features or complexity
- Ensure existing tests continue passing
```

```markdown
# .claude/commands/tdd-refactor.md
TDD Refactor Phase - Improve Code Quality

## Instructions
Help me refactor code while keeping all tests green:

1. Identify code improvement opportunities
2. Suggest small, safe refactoring steps
3. Help improve code readability and structure
4. Remove duplication and improve design
5. Ensure all tests continue passing

Focus areas:
- Remove hardcoded values
- Extract helper functions
- Improve naming and clarity
- Add proper error handling
- Follow SOLID principles
```

### Automated Quality Checks

```json
{
  "scripts": {
    "tdd:red": "npm test -- --watch --verbose",
    "tdd:green": "npm test && npm run coverage:check",
    "tdd:refactor": "npm test && npm run lint && npm run type-check",
    "tdd:cycle": "npm run tdd:green && npm run tdd:refactor"
  }
}
```

## Advanced TDD Patterns

### Outside-In TDD

```markdown
## Outside-In Development Approach

### Start with Acceptance Tests
1. Write high-level acceptance test for user story
2. Let acceptance test guide lower-level unit test creation
3. Use mocking to isolate units during development
4. Implement from outside (UI/API) to inside (domain logic)

### Example Flow
```javascript
// 1. Start with acceptance test (Cucumber/Cypress)
Feature: User Authentication
  Scenario: User logs in with valid credentials
    Given a user exists with email "user@example.com"
    When I submit login form with valid credentials
    Then I should be redirected to dashboard
    And I should see welcome message

// 2. Create controller test (mocked service)
describe('AuthController', () => {
  it('should redirect to dashboard on successful login', async () => {
    mockAuthService.authenticate.mockResolvedValue({ user, token });
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password' });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/dashboard');
  });
});

// 3. Create service test (mocked repository)
describe('AuthService', () => {
  it('should return user and token for valid credentials', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(user);
    const result = await authService.authenticate(email, password);
    expect(result).toHaveProperty('token');
    expect(result.user).toEqual(user);
  });
});
```

### Inside-Out TDD

```markdown
## Inside-Out Development Approach

### Start with Domain Logic
1. Begin with core business logic and domain objects
2. Build up to higher-level components
3. Use real objects rather than mocks when possible
4. Integrate components as you build up

### Example Flow
```javascript
// 1. Start with domain objects
describe('User', () => {
  it('should validate password correctly', () => {
    const user = new User('user@example.com', 'hashedPassword');
    expect(user.isPasswordValid('plainPassword')).toBe(true);
  });
});

// 2. Build service layer
describe('AuthService', () => {
  it('should authenticate user with valid credentials', async () => {
    const authService = new AuthService(userRepository);
    const result = await authService.authenticate(email, password);
    expect(result.isAuthenticated).toBe(true);
  });
});

// 3. Build controller layer
describe('AuthController', () => {
  it('should return 200 for valid authentication', async () => {
    const controller = new AuthController(authService);
    const response = await controller.login(validCredentials);
    expect(response.status).toBe(200);
  });
});
```

## TDD Metrics and Quality Assessment

### Test Quality Metrics

```markdown
## Key TDD Metrics

### Test Coverage
- Line coverage: % of code lines executed by tests
- Branch coverage: % of code branches executed
- Function coverage: % of functions called by tests
- Statement coverage: % of statements executed

**Target**: Minimum 80% coverage, aim for 90%+

### Test Quality Indicators
- Test-to-code ratio (aim for 1:1 to 3:1)
- Average test execution time (aim for <5ms per unit test)
- Test failure rate in CI/CD pipeline
- Number of flaky or intermittent test failures

### Code Quality Metrics
- Cyclomatic complexity (aim for <10 per function)
- Code duplication percentage (aim for <5%)
- Technical debt ratio
- Defect density (bugs per 1000 lines of code)
```

### Continuous Improvement

```markdown
## TDD Process Improvement

### Weekly TDD Retrospectives
1. **What went well?**
   - Which tests provided good safety net for refactoring?
   - Where did TDD help catch bugs early?
   - What refactoring opportunities did tests enable?

2. **What could be improved?**
   - Where were tests difficult to write?
   - Which tests were brittle or hard to maintain?
   - Where did we skip TDD and regret it?

3. **Action items for next week**
   - Specific TDD practices to focus on
   - Testing skills to develop
   - Tools or processes to improve

### Monthly TDD Health Check
- Review test coverage trends
- Analyze test execution performance
- Evaluate test maintenance burden
- Assess team TDD adoption and satisfaction
```

## Common TDD Challenges and Solutions

### Challenge: Tests Take Too Long to Write

**Problem**: Writing tests feels slow and impacts development velocity.

**Solutions**:
- Start with simpler tests and gradually add complexity
- Use test templates and code snippets
- Practice writing tests for common patterns
- Pair program to learn from experienced TDD practitioners

### Challenge: Hard to Test Legacy Code

**Problem**: Existing code is tightly coupled and difficult to test.

**Solutions**:
- Use characterization tests to understand existing behavior
- Apply refactoring techniques to make code more testable
- Use dependency injection to break coupling
- Gradually introduce TDD for new features and bug fixes

### Challenge: Uncertain What to Test

**Problem**: Not clear what behavior to test or how granular tests should be.

**Solutions**:
- Start with happy path scenarios
- Add edge cases and error conditions gradually
- Focus on testing behavior, not implementation details
- Use acceptance criteria as guide for test scenarios

### Challenge: Tests Become Brittle

**Problem**: Tests break frequently with small code changes.

**Solutions**:
- Test behavior rather than implementation details
- Use appropriate levels of abstraction in tests
- Minimize mocking and prefer real objects when possible
- Regularly refactor tests to keep them maintainable

This TDD workflow template provides a comprehensive, step-by-step approach to implementing Test-Driven Development with Claude Code assistance, ensuring high code quality and maintainable test suites.