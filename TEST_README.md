# Lumina Studio PDF Suite - Testing Guide

This guide provides comprehensive instructions for running and maintaining tests for the Lumina Studio PDF annotation suite.

## Table of Contents
- [Quick Start](#quick-start)
- [Test Categories](#test-categories)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Installation
```bash
# Install all dependencies including test tools
npm install

# Install Playwright browsers for E2E tests
npx playwright install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:unit          # Unit tests only
npm run test:component     # Component tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # E2E tests only
npm run test:perf         # Performance tests only
```

## Test Categories

### 1. Unit Tests
**Location**: `test/unit/`

Tests individual functions, services, and hooks in isolation.

**Examples**:
- PDF service operations (load, parse, render)
- Annotation CRUD operations
- Hook state management
- Utility functions

**Run command**:
```bash
npm run test:unit
```

**Watch mode**:
```bash
npm run test:unit -- --watch
```

### 2. Component Tests
**Location**: `test/component/`

Tests React components using React Testing Library.

**Examples**:
- PDFViewer rendering and interactions
- Toolbar button functionality
- LayersPanel state management
- Form validation

**Run command**:
```bash
npm run test:component
```

**Debug mode**:
```bash
npm run test:component -- --ui
```

### 3. Integration Tests
**Location**: `test/integration/`

Tests interactions between multiple components and services.

**Examples**:
- Supabase database operations
- Real-time collaboration sync
- Storage operations
- Authentication flows

**Run command**:
```bash
npm run test:integration
```

**Prerequisites**:
- Local Supabase instance running
- Database seeded with test data

```bash
# Start local Supabase
npx supabase start

# Run integration tests
npm run test:integration

# Stop Supabase
npx supabase stop
```

### 4. E2E Tests
**Location**: `test/e2e/`

Tests complete user workflows using Playwright.

**Examples**:
- Document loading and annotation creation
- Template application workflow
- Collaboration scenarios
- AI suggestion acceptance

**Run command**:
```bash
npm run test:e2e
```

**Run specific browser**:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**Debug mode**:
```bash
npx playwright test --debug
```

**Headed mode** (see browser):
```bash
npx playwright test --headed
```

### 5. Performance Tests
**Location**: `test/performance/`

Benchmarks and performance regression tests.

**Examples**:
- Document load time
- Annotation rendering performance
- Memory usage patterns
- Real-time sync latency

**Run command**:
```bash
npm run test:perf
```

## Running Tests

### Development Workflow

#### Watch Mode (Recommended for Development)
```bash
npm test
```
This runs Vitest in watch mode, automatically re-running tests when files change.

#### Single Run
```bash
npm run test:unit -- --run
npm run test:component -- --run
```

#### Run Specific Test File
```bash
npm run test:unit -- test/unit/hooks/usePDFAnnotations.test.ts
```

#### Run Tests Matching Pattern
```bash
npm run test:unit -- --grep="annotation"
```

### CI/CD Workflow

All tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**GitHub Actions workflow**: `.github/workflows/test.yml`

Stages:
1. **Unit & Component Tests** (Node 18.x, 20.x)
2. **Integration Tests** (with Supabase)
3. **E2E Tests** (Chromium, Firefox, WebKit)
4. **Performance Tests** (on PRs)
5. **Accessibility Tests**
6. **Quality Gate** (coverage threshold check)

### Local CI Simulation
```bash
# Run the same checks as CI
npm run ci:test
```

This runs:
- Linting
- Type checking
- All test suites
- Coverage report generation

## Writing Tests

### Unit Test Example

```typescript
// test/unit/services/annotationService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AnnotationService } from '../../../services/annotationService';
import { createMockSupabaseClient } from '../../mocks/supabase';

describe('AnnotationService', () => {
  let service: AnnotationService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new AnnotationService(mockSupabase);
  });

  it('should create annotation', async () => {
    const annotation = await service.createAnnotation({
      type: 'highlight',
      pageNumber: 1,
      rect: { x: 0, y: 0, width: 100, height: 20 },
    });

    expect(annotation.id).toBeDefined();
    expect(annotation.type).toBe('highlight');
  });
});
```

### Component Test Example

```typescript
// test/component/LayersPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LayersPanel from '../../components/LayersPanel';

describe('LayersPanel', () => {
  it('should create new layer', async () => {
    const user = userEvent.setup();
    const onLayerCreate = vi.fn();

    render(<LayersPanel onLayerCreate={onLayerCreate} />);

    await user.click(screen.getByRole('button', { name: /add layer/i }));
    await user.type(screen.getByRole('textbox'), 'Test Layer');
    await user.keyboard('{Enter}');

    expect(onLayerCreate).toHaveBeenCalledWith({ name: 'Test Layer' });
  });
});
```

### E2E Test Example

```typescript
// test/e2e/annotation-creation.spec.ts
import { test, expect } from '@playwright/test';

test('should create highlight annotation', async ({ page }) => {
  await page.goto('http://localhost:5173/pdf-suite');

  // Upload PDF
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles('./test/fixtures/pdfs/test.pdf');

  // Select highlight tool
  await page.click('[data-testid="tool-highlight"]');

  // Create highlight
  await page.click('[data-testid="pdf-canvas"]', { position: { x: 200, y: 300 } });

  // Verify annotation exists
  await expect(page.locator('[data-testid^="annotation-highlight"]')).toBeVisible();
});
```

### Best Practices

#### 1. Test Structure (AAA Pattern)
```typescript
it('should update annotation color', () => {
  // Arrange
  const annotation = createAnnotation();

  // Act
  annotation.setColor('#FF0000');

  // Assert
  expect(annotation.color).toBe('#FF0000');
});
```

#### 2. Use Fixtures and Factories
```typescript
import { createAnnotationFixture } from '../../fixtures/annotations';

const annotation = createAnnotationFixture({
  type: 'highlight',
  color: '#FFEB3B',
});
```

#### 3. Mock External Dependencies
```typescript
import { createMockSupabaseClient } from '../../mocks/supabase';
import { setupPDFMocks } from '../../mocks/pdf';

beforeEach(() => {
  setupPDFMocks();
});
```

#### 4. Test User Interactions, Not Implementation
```typescript
// Good
await user.click(screen.getByRole('button', { name: /save/i }));

// Bad
await user.click(screen.getByTestId('save-button'));
```

#### 5. Async Operations
```typescript
// Wait for element to appear
await screen.findByText('Success');

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});
```

## Test Coverage

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report in browser
open coverage/index.html
```

### Coverage Thresholds

Minimum coverage requirements:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

**Configuration**: `vitest.config.ts`

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80,
}
```

### Coverage Badges

Add to README:
```markdown
![Coverage](https://img.shields.io/codecov/c/github/username/repo)
```

## CI/CD Integration

### GitHub Actions

The test suite runs automatically on GitHub Actions with the following stages:

#### 1. Unit & Component Tests
- Runs on Node 18.x and 20.x
- Uploads coverage to Codecov
- Caches dependencies for faster runs

#### 2. Integration Tests
- Starts local Supabase instance
- Seeds test database
- Runs integration test suite

#### 3. E2E Tests
- Runs on Chromium, Firefox, and WebKit
- Records videos on failure
- Uploads Playwright reports

#### 4. Performance Tests
- Compares against baseline
- Comments results on PRs
- Fails on significant regression

#### 5. Quality Gate
- Checks all test results
- Verifies coverage thresholds
- Blocks merge if checks fail

### Local Pre-commit Checks

Install pre-commit hook:
```bash
npm run prepare
```

This runs:
- Linting
- Type checking
- Unit tests for changed files
- Formatting

## Troubleshooting

### Common Issues

#### 1. Tests Failing Locally but Passing in CI
```bash
# Clear cache and reinstall
rm -rf node_modules
npm ci

# Run tests in CI mode
CI=true npm test
```

#### 2. Playwright Browser Not Found
```bash
# Reinstall Playwright browsers
npx playwright install --with-deps
```

#### 3. Supabase Connection Error
```bash
# Check Supabase is running
npx supabase status

# Restart Supabase
npx supabase stop
npx supabase start
```

#### 4. Memory Issues with Large Test Suites
```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm test
```

#### 5. Flaky Tests
```bash
# Run test multiple times to identify flakiness
npx vitest run --reporter=verbose --retry=3
```

#### 6. PDF.js Worker Errors
```bash
# Ensure PDF.js worker is configured correctly
# Check test/setup.ts for worker mock
```

### Debug Tips

#### 1. Debug Single Test
```typescript
it.only('should test specific behavior', () => {
  // Test runs in isolation
});
```

#### 2. Skip Test Temporarily
```typescript
it.skip('should test something', () => {
  // Test is skipped
});
```

#### 3. Increase Test Timeout
```typescript
it('should handle slow operation', async () => {
  // Test code
}, { timeout: 10000 }); // 10 second timeout
```

#### 4. Debug Playwright Test
```bash
# Run with debugger
npx playwright test --debug

# Run with browser visible
npx playwright test --headed --slowMo=1000
```

#### 5. Console Logging in Tests
```typescript
import { debug } from '@testing-library/react';

// Print DOM tree
debug();

// Print specific element
debug(screen.getByRole('button'));
```

## Test Maintenance

### Regular Tasks

#### Weekly
- Review and fix flaky tests
- Update test snapshots if needed
- Check coverage trends

#### Monthly
- Update test dependencies
- Review and refactor brittle tests
- Update E2E selectors for UI changes

#### Quarterly
- Review test strategy effectiveness
- Update performance baselines
- Assess test execution time

### Performance Optimization

#### 1. Parallel Test Execution
```typescript
// vitest.config.ts
export default {
  test: {
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },
};
```

#### 2. Test Isolation
- Use `beforeEach` to reset state
- Clear mocks between tests
- Avoid test interdependencies

#### 3. Selective Test Running
```bash
# Run only changed tests
npm run test:changed

# Run tests related to specific file
npm run test:related src/services/pdfService.ts
```

## Resources

### Documentation
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Tools
- [Vitest VS Code Extension](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)
- [Playwright VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [Test Coverage Gutters](https://marketplace.visualstudio.com/items?itemName=ryanluker.vscode-coverage-gutters)

### Support
- GitHub Issues: [Report bugs or issues](https://github.com/your-repo/issues)
- Discussions: [Ask questions](https://github.com/your-repo/discussions)
