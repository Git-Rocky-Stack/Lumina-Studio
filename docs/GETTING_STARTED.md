# Getting Started

This guide will help you set up the Lumina Studio Design System in your React project and create your first components.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm, yarn, or pnpm package manager
- Basic knowledge of React and TypeScript
- A React 18+ project set up

## Installation

### Step 1: Install Dependencies

```bash
npm install framer-motion lucide-react clsx tailwind-merge
```

### Step 2: Configure Tailwind CSS

If not already configured, set up Tailwind CSS:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./design-system/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Design system tokens
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
```

### Step 3: Add CSS

Include base styles in your main CSS file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Screen reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Basic Usage

### Import Components

```tsx
import { Button } from './design-system/components/Button';
import { Card, CardHeader, CardBody } from './design-system/components/Card';
import { Input } from './design-system/components/Input';
import { Modal } from './design-system/components/Modal';
import { ToastProvider, useToast } from './design-system/components/Toast';
```

### Your First Component

Create a simple form using the design system:

```tsx
import React, { useState } from 'react';
import { Button } from './design-system/components/Button';
import { Input } from './design-system/components/Input';
import { Card, CardHeader, CardBody, CardFooter } from './design-system/components/Card';
import { ToastProvider, useToast } from './design-system/components/Toast';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('Login successful!');
    } catch (err) {
      error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" padding="lg" className="max-w-md mx-auto">
      <CardHeader
        title="Welcome Back"
        subtitle="Sign in to your account"
      />
      <form onSubmit={handleSubmit}>
        <CardBody>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </div>
        </CardBody>
        <CardFooter bordered>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Wrap your app with ToastProvider
function App() {
  return (
    <ToastProvider position="top-right">
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
        <LoginForm />
      </div>
    </ToastProvider>
  );
}

export default App;
```

## Setting Up Providers

Some components require providers to be wrapped around your application:

```tsx
import { ToastProvider } from './design-system/components/Toast';

function App() {
  return (
    <ToastProvider position="top-right" maxToasts={5}>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

## Dark Mode

The design system supports dark mode via Tailwind's `dark:` classes. Toggle dark mode by adding/removing the `dark` class on the `<html>` element:

```tsx
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      onClick={() => setIsDark(!isDark)}
    >
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </Button>
  );
}
```

## Responsive Design

Components support responsive props where applicable:

```tsx
import { Stack } from './design-system/responsive/containers';

<Stack
  direction={{ xs: 'vertical', md: 'horizontal' }}
  spacing={{ xs: 16, md: 24 }}
>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Stack>
```

Use the `Show` and `Hide` components for conditional rendering:

```tsx
import { Show, Hide } from './design-system/responsive/containers';

<>
  <Show above="md">
    <DesktopNavigation />
  </Show>
  <Hide above="md">
    <MobileNavigation />
  </Hide>
</>
```

## Accessibility

All components are built with accessibility in mind:

### Keyboard Navigation
- All interactive elements are focusable
- Tab order follows visual order
- Modal components trap focus
- Escape key closes overlays

### Screen Reader Support
- Proper ARIA labels and roles
- Live regions for dynamic content
- Error announcements for forms

```tsx
import { VisuallyHidden, LiveRegion } from './design-system/accessibility/screen-reader';

<Button>
  <Icon />
  <VisuallyHidden>Delete item</VisuallyHidden>
</Button>

<LiveRegion politeness="assertive">
  {notification}
</LiveRegion>
```

## Animation Settings

Respect user preferences for reduced motion:

```tsx
import { useReducedMotion } from 'framer-motion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  // Component automatically adapts
  return (
    <AnimatedCard
      animation={prefersReducedMotion ? 'none' : 'fadeUp'}
    >
      Content
    </AnimatedCard>
  );
}
```

## Next Steps

- Explore the [Component Catalog](./COMPONENT_CATALOG.md) for all available components
- Read the [API Reference](./API_REFERENCE.md) for detailed props documentation
- Check [Best Practices](./BEST_PRACTICES.md) for usage guidelines
- See individual component docs in the [components](./components/) directory

## Getting Help

- Check the [FAQ](./FAQ.md) for common questions
- Open an issue on GitHub for bugs or feature requests
- Review existing examples in the codebase
