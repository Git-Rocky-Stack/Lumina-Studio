# Installation Guide

Complete installation instructions for the Lumina Studio Design System.

## Prerequisites

### Required
- **Node.js** 18.0 or higher
- **React** 18.0 or higher
- **TypeScript** 5.0 or higher (optional but recommended)

### Recommended
- **Tailwind CSS** 3.4 or higher
- **VS Code** with ESLint and Prettier extensions

## Installation Methods

### Method 1: Install from npm (when published)

```bash
# npm
npm install @lumina-studio/design-system

# yarn
yarn add @lumina-studio/design-system

# pnpm
pnpm add @lumina-studio/design-system
```

### Method 2: Copy Design System Files

For now, copy the design system files directly into your project:

```bash
# Copy the design-system folder to your project
cp -r design-system/ your-project/src/design-system/
```

## Peer Dependencies

Install required peer dependencies:

```bash
npm install react react-dom framer-motion lucide-react clsx tailwind-merge
```

### Dependency Versions

| Package | Minimum Version | Recommended |
|---------|-----------------|-------------|
| react | ^18.0.0 | ^18.2.0 |
| react-dom | ^18.0.0 | ^18.2.0 |
| framer-motion | ^10.0.0 | ^11.0.0 |
| lucide-react | ^0.300.0 | ^0.456.0 |
| clsx | ^2.0.0 | ^2.1.0 |
| tailwind-merge | ^2.0.0 | ^2.5.0 |

## Configuration

### Tailwind CSS Configuration

Create or update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Include design system files
    "./src/design-system/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      // Design system color tokens
      colors: {
        // Primary palette (Indigo)
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
        // Success (Green)
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        // Warning (Amber)
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Error (Red)
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },

      // Typography scale
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      // Spacing scale (8-point grid)
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },

      // Border radius
      borderRadius: {
        '4xl': '2rem',
      },

      // Shadows
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },

      // Keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      // Container queries
      containers: {
        xs: '320px',
        sm: '384px',
        md: '448px',
        lg: '512px',
        xl: '576px',
      },
    },
  },
  plugins: [
    // Optional: Add container queries plugin
    // require('@tailwindcss/container-queries'),
  ],
}
```

### PostCSS Configuration

Ensure `postcss.config.js` is configured:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### TypeScript Configuration

For TypeScript projects, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/design-system/*": ["./src/design-system/*"],
      "@/components/*": ["./src/design-system/components/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Path Aliases (Optional)

Add path aliases in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/design-system': path.resolve(__dirname, './src/design-system'),
    },
  },
});
```

## CSS Setup

### Base Styles

Add to your main CSS file (e.g., `src/index.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Screen reader utility */
@layer utilities {
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

  .sr-only-focusable:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
}

/* Focus visible utility */
@layer utilities {
  .focus-visible-ring {
    @apply outline-none ring-2 ring-indigo-500 ring-offset-2;
  }
}

/* Animation utilities */
@layer utilities {
  .animate-enter {
    animation: enter 0.2s ease-out;
  }

  .animate-leave {
    animation: leave 0.2s ease-in forwards;
  }
}

@keyframes enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes leave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

### Dark Mode Setup

Add dark mode support:

```css
/* Root variables for theme */
:root {
  --background: 255 255 255;
  --foreground: 24 24 27;
}

.dark {
  --background: 24 24 27;
  --foreground: 250 250 250;
}

body {
  background-color: rgb(var(--background));
  color: rgb(var(--foreground));
}
```

## Project Structure

Recommended project structure:

```
your-project/
├── src/
│   ├── design-system/
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── animated/
│   │   │   │   ├── AnimatedButton.tsx
│   │   │   │   ├── AnimatedCard.tsx
│   │   │   │   ├── AnimatedList.tsx
│   │   │   │   └── AnimatedCountUp.tsx
│   │   │   ├── navigation/
│   │   │   │   └── Sidebar/
│   │   │   ├── overlays/
│   │   │   │   ├── Dialog/
│   │   │   │   ├── Drawer/
│   │   │   │   └── Modal/
│   │   │   └── data-display/
│   │   │       └── DashboardWidget/
│   │   ├── hooks/
│   │   │   ├── useFocusTrap.ts
│   │   │   └── useRealTimeData.ts
│   │   ├── responsive/
│   │   │   ├── breakpoints.ts
│   │   │   ├── containers.tsx
│   │   │   └── hooks.ts
│   │   ├── accessibility/
│   │   │   └── screen-reader.tsx
│   │   ├── animations/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── cn.ts
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## Verification

After installation, verify the setup by creating a test component:

```tsx
// src/App.tsx
import { Button } from './design-system/components/Button';
import { Card, CardHeader, CardBody } from './design-system/components/Card';

function App() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <Card variant="elevated" className="max-w-md mx-auto">
        <CardHeader title="Installation Complete" />
        <CardBody>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            The design system is ready to use!
          </p>
          <Button variant="primary">
            Get Started
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export default App;
```

Run your development server:

```bash
npm run dev
```

If you see the card with the button properly styled, the installation is complete.

## Troubleshooting

### Common Issues

#### 1. Styles Not Applying

Ensure your Tailwind config includes the design system paths:

```javascript
content: [
  "./src/design-system/**/*.{js,ts,jsx,tsx}",
]
```

#### 2. TypeScript Errors

Make sure all peer dependencies are installed:

```bash
npm install framer-motion lucide-react clsx tailwind-merge
```

#### 3. Framer Motion Warnings

If you see SSR warnings, ensure you're using client-side rendering or add the `motion` lazy loading:

```tsx
import { LazyMotion, domAnimation } from 'framer-motion';

function App() {
  return (
    <LazyMotion features={domAnimation}>
      {/* Your app */}
    </LazyMotion>
  );
}
```

#### 4. Dark Mode Not Working

Ensure `darkMode: 'class'` is set in your Tailwind config and the `dark` class is added to the `<html>` element.

## Next Steps

- Read the [Getting Started](./GETTING_STARTED.md) guide for usage examples
- Explore the [API Reference](./API_REFERENCE.md) for all component props
- Check [Best Practices](./BEST_PRACTICES.md) for optimal usage patterns
