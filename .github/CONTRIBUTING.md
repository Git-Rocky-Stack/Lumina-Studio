# Contributing to Lumina Studio

Thank you for contributing to Lumina Studio! This guide will help you get started with the development workflow.

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install git hooks**:
   ```bash
   npm run prepare
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Code Quality Standards

This project enforces strict code quality standards through automated tooling:

### TypeScript

- Strict type checking is enabled
- No implicit `any` types
- Explicit return types on functions (recommended)
- Prefer type imports: `import type { MyType } from './types'`

### Code Style

- **Formatter**: Prettier (runs automatically)
- **Linter**: ESLint with TypeScript, React, and accessibility rules
- **Line width**: 100 characters
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings

### Pre-commit Checks

Every commit automatically runs:
1. ESLint with auto-fix on staged `.ts`/`.tsx` files
2. Prettier formatting on all staged files

If checks fail, the commit will be blocked until you fix the issues.

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Follow TypeScript best practices:

```typescript
// Good: Explicit types, type imports
import type { User } from './types';

export function getUser(id: string): User | null {
  // Implementation
}

// Bad: Implicit any, no return type
export function getUser(id) {
  // Implementation
}
```

### 3. Check Your Code

Before committing, you can manually check:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format all files
npm run format
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature"
```

The pre-commit hook will automatically:
- Run ESLint on your TypeScript files
- Format your code with Prettier
- Block the commit if there are errors

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

## Common Issues

### "Parsing error" from ESLint

Make sure your code is valid TypeScript. Run:
```bash
npx tsc --noEmit
```

### Husky hooks not running

Reinstall the hooks:
```bash
npm run prepare
```

### Too many type errors

If you need to temporarily bypass strict checking:
```typescript
// For a single line
// @ts-ignore
const data = untypedLibrary();

// For a block
/* eslint-disable @typescript-eslint/no-explicit-any */
const config: any = legacyConfig;
/* eslint-enable @typescript-eslint/no-explicit-any */
```

But please fix these properly when possible!

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code passes `npm run lint`
- [ ] Code passes `npm run format:check`
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] No console.log statements (use console.warn or console.error if needed)
- [ ] Types are properly defined (no `any` unless absolutely necessary)
- [ ] Accessibility attributes are present on interactive elements
- [ ] React hooks dependencies are correct (check ESLint warnings)

## IDE Setup

### VS Code (Recommended)

1. Install extensions:
   - ESLint (`dbaeumer.vscode-eslint`)
   - Prettier (`esbenp.prettier-vscode`)

2. Add to your workspace settings (`.vscode/settings.json`):
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": "explicit"
     }
   }
   ```

### WebStorm/IntelliJ IDEA

1. Enable ESLint: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Enable Prettier: Settings → Languages & Frameworks → JavaScript → Prettier
3. Check "Run on save" for both

## Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Building

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Questions?

- Check [CODE_QUALITY.md](../CODE_QUALITY.md) for detailed documentation
- Check [SETUP_SUMMARY.md](../SETUP_SUMMARY.md) for setup overview

## Commit Message Convention

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

Example:
```
feat: add dark mode toggle to settings
fix: resolve memory leak in animation component
docs: update installation instructions
```
