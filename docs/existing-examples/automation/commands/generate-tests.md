You are tasked with generating comprehensive tests for the provided code. Create a thorough test suite that covers functionality, edge cases, and error scenarios.

## Test Generation Approach

1. **Code Analysis**
   - Understand the function/class/module purpose
   - Identify all inputs, outputs, and side effects
   - Map out the execution paths and decision points
   - Note external dependencies and integrations

2. **Test Strategy**
   - Unit tests for individual functions/methods
   - Integration tests for component interactions
   - End-to-end tests for complete workflows
   - Error handling and edge case coverage

3. **Test Categories to Include**
   - Happy path scenarios (expected normal usage)
   - Edge cases (boundary conditions, extreme values)
   - Error scenarios (invalid inputs, network failures)
   - Security tests (input validation, injection attacks)
   - Performance tests (if applicable)

## Test Implementation Guidelines

### Test Structure (AAA Pattern)
```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [specific condition]', () => {
      // Arrange - Set up test data and conditions
      const input = { /* test data */ };
      const expected = { /* expected result */ };

      // Act - Execute the code under test
      const result = functionUnderTest(input);

      // Assert - Verify the outcome
      expect(result).toEqual(expected);
    });
  });
});
```

### Test Naming Conventions
- Describe what the test validates
- Include the specific condition being tested
- Use clear, descriptive language
- Follow pattern: "should [expected behavior] when [condition]"

### Test Data Management
- Use meaningful test data that represents real scenarios
- Create separate test data for different scenarios
- Use data builders or factories for complex objects
- Avoid hardcoded magic numbers without context

## Language-Specific Patterns

### JavaScript/TypeScript (Jest)
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { UserService } from './UserService';

describe('UserService', () => {
  let userService;
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    userService = new UserService(mockApiClient);
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com', name: 'Test User' };
      const expectedUser = { id: 1, ...userData };
      mockApiClient.post.mockResolvedValue({ data: expectedUser });

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/users', userData);
      expect(result).toEqual(expectedUser);
    });

    it('should throw validation error for invalid email', async () => {
      // Arrange
      const invalidData = { email: 'invalid-email', name: 'Test' };

      // Act & Assert
      await expect(userService.createUser(invalidData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

### Python (pytest)
```python
import pytest
from unittest.mock import Mock, patch
from user_service import UserService

class TestUserService:
    def setup_method(self):
        self.mock_api_client = Mock()
        self.user_service = UserService(self.mock_api_client)

    def test_create_user_with_valid_data(self):
        # Arrange
        user_data = {'email': 'test@example.com', 'name': 'Test User'}
        expected_user = {'id': 1, **user_data}
        self.mock_api_client.post.return_value = expected_user

        # Act
        result = self.user_service.create_user(user_data)

        # Assert
        self.mock_api_client.post.assert_called_once_with('/users', user_data)
        assert result == expected_user

    def test_create_user_raises_validation_error_for_invalid_email(self):
        # Arrange
        invalid_data = {'email': 'invalid-email', 'name': 'Test'}

        # Act & Assert
        with pytest.raises(ValueError, match='Invalid email format'):
            self.user_service.create_user(invalid_data)
```

## Test Coverage Areas

### Functional Testing
- All public methods and functions
- Different input combinations
- Return value validation
- State changes verification

### Edge Case Testing
- Empty inputs (null, undefined, empty strings/arrays)
- Boundary values (min/max numbers, string lengths)
- Invalid data types
- Malformed data

### Error Handling Testing
- Network failures and timeouts
- Invalid API responses
- Database connection errors
- Permission/authorization failures

### Integration Testing
- API endpoint testing
- Database operations
- External service integrations
- File system operations

### Performance Testing (when applicable)
- Large dataset handling
- Concurrent operation testing
- Memory usage validation
- Response time verification

## Mock and Stub Guidelines

### When to Mock
- External dependencies (APIs, databases, file systems)
- Time-dependent functions (Date.now(), timers)
- Random number generators
- Complex dependencies that are tested separately

### Mocking Best Practices
```javascript
// Good: Mock behavior, not implementation
const mockUserRepository = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
};

// Good: Verify behavior
expect(mockUserRepository.save).toHaveBeenCalledWith(expectedUser);

// Avoid: Testing implementation details
expect(mockUserRepository.save).toHaveBeenCalledTimes(1); // Unless specifically needed
```

## Test Organization

### File Structure
```
src/
  components/
    UserForm.js
    UserForm.test.js
  services/
    UserService.js
    UserService.test.js
  utils/
    validation.js
    validation.test.js
tests/
  integration/
    userWorkflow.test.js
  e2e/
    userRegistration.test.js
```

### Test Suites Organization
- Group related tests using `describe` blocks
- Use nested `describe` blocks for different methods/scenarios
- Keep test files close to the code they test
- Separate unit, integration, and e2e tests

## Accessibility Testing (for UI components)
```javascript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<UserForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Output Requirements

Generate tests that include:
1. **Comprehensive test suite** covering all identified scenarios
2. **Clear test descriptions** following naming conventions
3. **Proper setup and teardown** for test isolation
4. **Mock implementations** for external dependencies
5. **Edge case coverage** including error scenarios
6. **Performance considerations** where applicable
7. **Accessibility tests** for UI components
8. **Documentation** explaining complex test scenarios

Focus on creating maintainable, readable tests that provide confidence in the code's correctness and help prevent regressions during future changes.