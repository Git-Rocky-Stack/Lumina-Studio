# Testing Infrastructure Documentation

## Overview

This document describes the testing infrastructure for Lumina Studio, built with Vitest and React Testing Library for React 19 and TypeScript compatibility.

## Installation

All testing dependencies have been installed:
- `vitest` - Fast unit test framework powered by Vite
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM implementation for Node.js
- `happy-dom` - Alternative fast DOM implementation
- `@vitest/ui` - UI for viewing test results

## Configuration

### vitest.config.ts

Located at: `C:\Users\User\Desktop\Development Projects\Strategia-Enhanced-App\Lumina-Studio\vitest.config.ts`

Key features:
- **Environment**: happy-dom (faster than jsdom)
- **Globals**: Enabled for Jest-like API
- **Setup Files**: Loads `./test/setup.ts` before tests
- **Coverage**: v8 provider with HTML, JSON, LCOV reports
- **Aliases**: `@` points to project root
- **CSS Support**: Enabled for component tests
- **Mock Management**: Auto-reset and restore mocks between tests

### Test Setup File

Located at: `C:\Users\User\Desktop\Development Projects\Strategia-Enhanced-App\Lumina-Studio\test\setup.ts`

Provides:
- Jest DOM matchers (`toBeInTheDocument`, `toHaveClass`, etc.)
- Global mocks for:
  - `window.matchMedia`
  - `ResizeObserver`
  - `IntersectionObserver`
  - `window.scrollTo`
  - `localStorage`
  - `sessionStorage`
  - `fetch`
- Automatic cleanup after each test
- Console error suppression for known warnings

## Running Tests

### Available Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Running Specific Tests

```bash
# Run specific test file
npm test -- services/__tests__/errorTracking.test.ts

# Run tests matching pattern
npm test -- --grep "Analytics"

# Run tests in specific directory
npm test -- services/__tests__/
```

## Test Structure

### Sample Tests Created

#### 1. Error Tracking Service Tests
**File**: `C:\Users\User\Desktop\Development Projects\Strategia-Enhanced-App\Lumina-Studio\services\__tests__\errorTracking.test.ts`

Tests cover:
- ✅ Session ID generation and persistence
- ✅ Error capturing with metadata
- ✅ Error storage in localStorage
- ✅ Error limit enforcement (maxStoredErrors)
- ✅ User ID association
- ✅ Ignore patterns for common errors
- ✅ Sample rate configuration
- ✅ Custom event dispatch
- ✅ Network error reporting
- ✅ Exception capturing helper

**Total**: 18 test cases

#### 2. Analytics Service Tests
**File**: `C:\Users\User\Desktop\Development Projects\Strategia-Enhanced-App\Lumina-Studio\services\__tests__\analytics.test.ts`

Tests cover:
- ✅ Session ID generation and reuse
- ✅ Cookie consent checking
- ✅ Essential vs non-essential event tracking
- ✅ Event tracking with properties
- ✅ Page view tracking with time measurement
- ✅ User identification
- ✅ Funnel tracking and progress
- ✅ Feature usage tracking
- ✅ CTA click tracking
- ✅ Event batching and flushing
- ✅ Network error handling
- ✅ Session start/end tracking
- ✅ Debug mode logging

**Total**: 28 test cases

## Writing New Tests

### Basic Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### React Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Service Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import myService from '../myService';

describe('MyService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should initialize correctly', () => {
    myService.init();

    expect(myService.isInitialized).toBe(true);
  });

  it('should handle API calls', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' })
    } as Response);

    const result = await myService.fetchData();

    expect(fetchMock).toHaveBeenCalledWith('/api/endpoint');
    expect(result).toEqual({ data: 'test' });
  });
});
```

## Best Practices

### 1. Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names: "should [expected behavior] when [condition]"
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mocking
- Mock external dependencies (fetch, timers, etc.)
- Reset mocks between tests with `vi.restoreAllMocks()`
- Use `vi.spyOn()` to spy on existing methods
- Use `vi.fn()` to create mock functions

### 3. Async Testing
```typescript
it('should handle async operations', async () => {
  const promise = fetchData();
  await expect(promise).resolves.toBe('data');
});
```

### 4. Timer Testing
```typescript
it('should handle timers', () => {
  vi.useFakeTimers();

  const callback = vi.fn();
  setTimeout(callback, 1000);

  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();

  vi.useRealTimers();
});
```

### 5. Coverage Goals
- Aim for 80%+ code coverage
- Focus on critical paths and edge cases
- Don't test third-party library code
- Test behavior, not implementation

## Continuous Integration

### Pre-commit Hook
Consider adding tests to pre-commit hooks:

```json
// In package.json lint-staged
"*.{ts,tsx}": [
  "eslint --fix",
  "vitest related --run",
  "prettier --write"
]
```

### CI/CD Pipeline
Add to GitHub Actions or similar:

```yaml
- name: Run tests
  run: npm test -- --run

- name: Upload coverage
  run: npm run test:coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Common Issues

#### 1. Module Resolution Errors
Ensure `@` alias is configured in both `vitest.config.ts` and `tsconfig.json`

#### 2. DOM Not Available
Check that `environment: 'happy-dom'` is set in vitest.config.ts

#### 3. Async Tests Timing Out
Increase timeout in test:
```typescript
it('long running test', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### 4. Mock Not Working
Ensure mocks are defined before imports:
```typescript
vi.mock('./myModule', () => ({
  default: vi.fn(),
}));
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event](https://testing-library.com/docs/user-event/intro/)

## Next Steps

1. Run initial tests: `npm test -- --run`
2. Check coverage: `npm run test:coverage`
3. Add tests for additional services:
   - `services/imageOptimization.ts`
   - `services/collaboration.ts`
   - `services/versionHistory.ts`
   - `services/undoManager.ts`
4. Create component tests for UI components
5. Set up CI/CD integration
6. Configure coverage thresholds in `vitest.config.ts`

## Test Coverage Configuration

To enforce coverage thresholds, add to `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```
