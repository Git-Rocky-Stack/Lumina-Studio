# Code Quality Tooling

This document describes the code quality tools configured for the Lumina Studio project.

## Overview

The project uses the following tools to maintain code quality:

- **ESLint**: Static code analysis for identifying problematic patterns in TypeScript/JavaScript code
- **Prettier**: Opinionated code formatter for consistent code style
- **Husky**: Git hooks to enforce quality checks before commits
- **lint-staged**: Run linters on staged git files

## Configuration Files

### ESLint (`eslint.config.js`)

Uses ESLint 9+ flat config format with the following features:

- **TypeScript Support**: Full TypeScript parsing and type-aware linting
- **React & React Hooks**: Rules for React best practices and hooks
- **Accessibility**: JSX accessibility rules via `eslint-plugin-jsx-a11y`
- **Strict Type Checking**: Enforces strict TypeScript patterns including:
  - No floating promises
  - Consistent type imports
  - Prefer nullish coalescing and optional chaining
  - Explicit function return types (with exceptions for expressions)
  - No unused variables (except those prefixed with `_`)

### Prettier (`.prettierrc`)

Configured with the following settings:

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### TypeScript (`tsconfig.json`)

Enhanced with strict type-checking options:

- `strict`: true (enables all strict type-checking options)
- `noImplicitAny`: Errors on expressions with implied `any` type
- `strictNullChecks`: Enables strict null and undefined checking
- `noUnusedLocals`: Report errors on unused local variables
- `noUnusedParameters`: Report errors on unused parameters
- `noImplicitReturns`: Report error when not all code paths return a value
- `noUncheckedIndexedAccess`: Include `undefined` in index signature results
- `noImplicitOverride`: Ensure overriding members are marked with `override`

## NPM Scripts

### Linting

```bash
# Run ESLint on all files
npm run lint

# Run ESLint and automatically fix issues
npm run lint:fix
```

### Formatting

```bash
# Format all files with Prettier
npm run format

# Check if files are formatted (CI)
npm run format:check
```

### Development Workflow

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Pre-commit Hooks

Husky is configured to run `lint-staged` on every commit. The following checks run automatically:

### For TypeScript/TSX files (`*.ts`, `*.tsx`)
1. ESLint with auto-fix
2. Prettier formatting

### For JavaScript/JSX files (`*.js`, `*.jsx`)
1. ESLint with auto-fix
2. Prettier formatting

### For Other files (`*.json`, `*.css`, `*.md`)
1. Prettier formatting

## How It Works

1. **Developer makes changes** and stages files with `git add`
2. **Git commit is initiated**
3. **Husky pre-commit hook triggers** (`.husky/pre-commit`)
4. **lint-staged runs** configured tools on staged files only
5. **If all checks pass**, commit proceeds
6. **If checks fail**, commit is aborted with error messages

## Manual Usage

### Fix all linting issues in a file

```bash
npx eslint --fix src/path/to/file.tsx
```

### Format a specific file

```bash
npx prettier --write src/path/to/file.tsx
```

### Check a specific file without modifying it

```bash
npx eslint src/path/to/file.tsx
npx prettier --check src/path/to/file.tsx
```

## CI/CD Integration

For CI/CD pipelines, use the check commands:

```bash
# In your CI workflow
npm run lint          # Fails if linting errors exist
npm run format:check  # Fails if formatting is incorrect
```

## IDE Integration

### VS Code

Install these extensions for the best experience:

1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier - Code formatter** (`esbenp.prettier-vscode`)

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### WebStorm/IntelliJ IDEA

1. Enable ESLint: `Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint`
2. Enable Prettier: `Settings > Languages & Frameworks > JavaScript > Prettier`
3. Check "On save" for both tools

## Troubleshooting

### Husky hooks not running

If pre-commit hooks aren't running:

```bash
# Reinstall Husky
npm run prepare

# Make hook executable (Unix/Mac)
chmod +x .husky/pre-commit
```

### ESLint errors in IDE

If you see ESLint errors in your IDE but not in the terminal:

1. Restart your IDE/editor
2. Clear ESLint cache: `rm -rf .eslintcache`
3. Reinstall dependencies: `npm install`

### Prettier conflicts with ESLint

The configuration uses `eslint-config-prettier` to disable ESLint rules that conflict with Prettier. If you see conflicts, ensure this is imported last in `eslint.config.js`.

## Customization

### Disabling specific rules

To disable a rule for a specific file or line:

```typescript
// Disable for entire file
/* eslint-disable @typescript-eslint/no-explicit-any */

// Disable for a specific line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();

// Disable for next line (TypeScript)
// @ts-ignore
const result = someUntypedLibrary();
```

### Adding new rules

Edit `eslint.config.js` and add rules to the appropriate configuration object:

```javascript
rules: {
  '@typescript-eslint/explicit-module-boundary-types': 'warn',
  // ... other rules
}
```

## Dependencies

### Core Tools

- `eslint@^9.39.2` - Linting engine
- `prettier@^3.7.4` - Code formatter
- `husky@^9.1.7` - Git hooks
- `lint-staged@^16.2.7` - Run linters on staged files

### ESLint Plugins

- `@typescript-eslint/parser@^8.50.1` - TypeScript parser
- `@typescript-eslint/eslint-plugin@^8.50.1` - TypeScript rules
- `eslint-plugin-react@^7.37.5` - React rules
- `eslint-plugin-react-hooks@^7.0.1` - React Hooks rules
- `eslint-plugin-jsx-a11y@^6.10.2` - Accessibility rules
- `eslint-config-prettier@^10.1.8` - Disable conflicting rules

## Best Practices

1. **Commit frequently** - Pre-commit hooks run on staged files only
2. **Fix warnings** - Don't ignore warnings; they often indicate code smells
3. **Use type inference** - Let TypeScript infer types when possible
4. **Document exceptions** - If you disable a rule, add a comment explaining why
5. **Keep dependencies updated** - Regularly update linting tools for new features

## Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
