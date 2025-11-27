# Tests

> Test files go here

## Strategy

- **Unit:** Isolated functions/components
- **Integration:** Feature workflows
- **E2E:** Critical user journeys

## Conventions

- Co-locate: `component.tsx` → `component.test.tsx`
- Descriptive names: `it('should show error when...')`
- Arrange-Act-Assert pattern

## Commands

```bash
pnpm test           # All tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Coverage
```
