# Package.json Test Script Updates

Add these scripts to your `package.json` file in the `scripts` section:

```json
{
  "scripts": {
    // Existing scripts...
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",

    // Main test commands
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",

    // Specific test suites
    "test:unit": "vitest --run test/unit",
    "test:component": "vitest --run test/component",
    "test:integration": "vitest --run test/integration",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:perf": "vitest --run test/performance",
    "test:a11y": "npm run build && pa11y-ci",

    // CI/CD commands
    "test:ci": "vitest --run --coverage",
    "test:ci:e2e": "playwright test --reporter=github",

    // Utility commands
    "test:changed": "vitest --run --changed",
    "test:related": "vitest --run --related",
    "test:clear-cache": "vitest --clearCache",

    // Coverage commands
    "coverage": "vitest --coverage",
    "coverage:open": "open coverage/index.html",

    // Playwright specific
    "playwright:install": "playwright install --with-deps",
    "playwright:codegen": "playwright codegen http://localhost:5173",
    "playwright:report": "playwright show-report",
    "playwright:trace": "playwright show-trace",

    // Existing lint/format scripts...
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "prepare": "husky"
  }
}
```

## Additional DevDependencies to Install

If not already present, add these development dependencies:

```bash
npm install --save-dev \
  @playwright/test@latest \
  @testing-library/react@latest \
  @testing-library/user-event@latest \
  @testing-library/jest-dom@latest \
  @vitest/coverage-v8@latest \
  @vitest/ui@latest \
  vitest@latest \
  happy-dom@latest \
  pa11y-ci@latest
```

## Husky Pre-commit Hook Setup

Create `.husky/pre-commit` file:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linter
npm run lint

# Run tests for staged files
npm run test:changed -- --run

# Run formatter check
npm run format:check
```

Make it executable:
```bash
chmod +x .husky/pre-commit
```

## VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm run test",
  "playwright.reuseBrowser": true,
  "testing.automaticallyOpenPeekView": "never",
  "coverage-gutters.coverageFileNames": [
    "lcov.info",
    "coverage/lcov.info"
  ]
}
```

## VS Code Extensions Recommendations

Add to `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "vitest.explorer",
    "ms-playwright.playwright",
    "ryanluker.vscode-coverage-gutters",
    "firsttris.vscode-jest-runner",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

## NPM Scripts Quick Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests in watch mode |
| `npm run test:unit` | Run unit tests once |
| `npm run test:component` | Run component tests once |
| `npm run test:integration` | Run integration tests once |
| `npm run test:e2e` | Run E2E tests (all browsers) |
| `npm run test:e2e:headed` | Run E2E with visible browser |
| `npm run test:e2e:debug` | Debug E2E tests |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:perf` | Run performance tests |
| `npm run test:ci` | Run all tests for CI |
| `npm run playwright:install` | Install Playwright browsers |
| `npm run playwright:codegen` | Generate test code |
| `npm run playwright:report` | View Playwright HTML report |

## Complete Installation Steps

1. **Update package.json with new scripts** (see above)

2. **Install test dependencies**:
```bash
npm install --save-dev \
  @playwright/test@latest \
  @testing-library/react@latest \
  @testing-library/user-event@latest \
  @testing-library/jest-dom@latest \
  @vitest/coverage-v8@latest \
  @vitest/ui@latest \
  vitest@latest \
  happy-dom@latest
```

3. **Install Playwright browsers**:
```bash
npx playwright install --with-deps
```

4. **Verify installation**:
```bash
npm test -- --run
```

5. **Generate initial coverage report**:
```bash
npm run test:coverage
```

6. **Set up pre-commit hooks** (optional):
```bash
npm run prepare
```

## Troubleshooting Installation

### Issue: Playwright installation fails
**Solution**:
```bash
# On Linux/Mac
sudo npx playwright install-deps

# On Windows (run as Administrator)
npx playwright install --with-deps
```

### Issue: Vitest not found
**Solution**:
```bash
npm install --save-dev vitest@latest
```

### Issue: Coverage not generating
**Solution**:
```bash
npm install --save-dev @vitest/coverage-v8@latest
```

### Issue: Happy-DOM errors
**Solution**:
```bash
npm install --save-dev happy-dom@latest
```

## Verification Commands

After installation, verify everything works:

```bash
# 1. Check if unit tests run
npm run test:unit

# 2. Check if component tests run
npm run test:component

# 3. Check if E2E tests run
npm run test:e2e:chromium

# 4. Check if coverage generates
npm run test:coverage

# 5. Open Vitest UI
npm run test:ui
```

All commands should execute without errors. If any fail, check the troubleshooting section above.
