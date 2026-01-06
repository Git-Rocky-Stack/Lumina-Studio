# Migration Guide

Guide for migrating between versions of the Lumina Studio Design System.

## Version History

| Version | Release Date | Status |
|---------|--------------|--------|
| 2.0.0 | Current | Active |
| 1.x | Legacy | Deprecated |

---

## Migrating to v2.0

### Overview

Version 2.0 introduces significant improvements:
- Framer Motion animations
- Enhanced accessibility
- Responsive utilities
- Real-time data hooks
- TypeScript improvements

### Breaking Changes

#### 1. Button Component

**Props renamed:**

```tsx
// Before (v1)
<Button loading={true} loadingLabel="Saving..." />

// After (v2)
<Button isLoading={true} loadingText="Saving..." />
```

**Variant changes:**

```tsx
// Before (v1)
<Button variant="danger" />
<Button variant="default" />

// After (v2)
<Button variant="destructive" />
<Button variant="secondary" />
```

#### 2. Card Component

**Structure change:**

```tsx
// Before (v1)
<Card title="Title" description="Desc">
  Content
</Card>

// After (v2)
<Card>
  <CardHeader title="Title" subtitle="Desc" />
  <CardBody>Content</CardBody>
</Card>
```

**Props renamed:**

```tsx
// Before (v1)
<Card shadowLevel="high" borderRadius="large" />

// After (v2)
<Card shadow="lg" radius="xl" />
```

#### 3. Modal Component

**Close handler signature changed:**

```tsx
// Before (v1)
<Modal onClose={() => setOpen(false)} />

// After (v2)
<Modal onClose={(reason) => {
  // reason: 'escape' | 'backdrop' | 'close-button' | 'programmatic'
  setOpen(false);
}} />
```

**Props renamed:**

```tsx
// Before (v1)
<Modal
  show={isOpen}
  onDismiss={handleClose}
  disableBackdropClick
  disableEscapeClose
/>

// After (v2)
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  closeOnBackdrop={false}
  closeOnEscape={false}
/>
```

#### 4. Input Component

**Validation props changed:**

```tsx
// Before (v1)
<Input
  errorMessage="Invalid email"
  helperText="Enter your email"
  isInvalid
/>

// After (v2)
<Input
  error="Invalid email"
  hint="Enter your email"
/>
```

**Addon props renamed:**

```tsx
// Before (v1)
<Input
  prepend="https://"
  append=".com"
  iconLeft={<SearchIcon />}
  iconRight={<ClearIcon />}
/>

// After (v2)
<Input
  leftAddon="https://"
  rightAddon=".com"
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
/>
```

#### 5. Toast System

**Complete API change:**

```tsx
// Before (v1)
import { showToast } from 'design-system';

showToast('Success!', { type: 'success' });

// After (v2)
import { useToast } from 'design-system';

function Component() {
  const { success } = useToast();
  success('Success!');
}
```

**Provider required:**

```tsx
// After (v2) - Wrap app with provider
<ToastProvider position="top-right">
  <App />
</ToastProvider>
```

#### 6. Animation Changes

**Framer Motion required:**

```bash
npm install framer-motion
```

**Animation props standardized:**

```tsx
// Before (v1)
<Card animateIn="fade" animationDuration={300} />

// After (v2)
<AnimatedCard animation="fadeIn" duration={0.3} />
```

#### 7. Responsive Utilities

**New component imports:**

```tsx
// Before (v1)
import { MediaQuery } from 'design-system';

<MediaQuery min="md">
  <DesktopNav />
</MediaQuery>

// After (v2)
import { Show, Hide } from 'design-system/responsive';

<Show above="md">
  <DesktopNav />
</Show>
```

### Migration Steps

#### Step 1: Update Dependencies

```bash
npm install framer-motion@^11 lucide-react@^0.456 clsx@^2 tailwind-merge@^2
```

#### Step 2: Update Imports

Run a find-and-replace across your codebase:

```javascript
// Find: import { Button, Card, Modal } from 'old-path'
// Replace: import { Button } from 'design-system/components/Button'
```

Or use barrel imports:

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Modal,
  Input,
} from 'design-system/components';
```

#### Step 3: Update Button Usage

```tsx
// Automated codemod pattern:
// loading -> isLoading
// loadingLabel -> loadingText
// variant="danger" -> variant="destructive"
// variant="default" -> variant="secondary"
```

#### Step 4: Update Card Usage

Convert flat Card props to composition:

```tsx
// Before
<Card
  title="Project"
  description="Description"
  footer={<Button>Save</Button>}
>
  Content
</Card>

// After
<Card>
  <CardHeader
    title="Project"
    subtitle="Description"
  />
  <CardBody>
    Content
  </CardBody>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

#### Step 5: Update Modal Usage

```tsx
// Before
<Modal
  show={isOpen}
  onDismiss={() => setOpen(false)}
  disableBackdropClick
>
  Content
</Modal>

// After
<Modal
  isOpen={isOpen}
  onClose={(reason) => setOpen(false)}
  closeOnBackdrop={false}
>
  Content
</Modal>
```

#### Step 6: Update Toast Usage

```tsx
// Before
showToast('Message', { type: 'success' });

// After
function Component() {
  const { success } = useToast();

  const handleAction = () => {
    success('Message');
  };

  return <Button onClick={handleAction}>Action</Button>;
}

// App root
<ToastProvider>
  <App />
</ToastProvider>
```

#### Step 7: Update Input Usage

```tsx
// Before
<Input
  errorMessage={errors.email}
  helperText="We'll never share your email"
  isInvalid={!!errors.email}
/>

// After
<Input
  error={errors.email}
  hint="We'll never share your email"
/>
```

#### Step 8: Add Animation Provider (Optional)

For optimized animations:

```tsx
import { LazyMotion, domAnimation } from 'framer-motion';

function App() {
  return (
    <LazyMotion features={domAnimation}>
      <ToastProvider>
        {/* Your app */}
      </ToastProvider>
    </LazyMotion>
  );
}
```

### Codemods

We provide automated codemods for common migrations:

```bash
# Run all v2 migrations
npx @lumina-studio/codemod v2

# Run specific migrations
npx @lumina-studio/codemod button-props
npx @lumina-studio/codemod modal-props
npx @lumina-studio/codemod toast-api
```

### TypeScript Changes

#### Updated Type Imports

```tsx
// Before (v1)
import type { ButtonProps } from 'design-system/types';

// After (v2)
import type { ButtonProps } from 'design-system/components/Button';
```

#### New Types

```tsx
// Modal close reasons
type ModalCloseReason = 'escape' | 'backdrop' | 'close-button' | 'programmatic' | 'action';

// Widget types
type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';
type WidgetColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

// Breakpoints
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
```

### CSS Changes

#### Tailwind Config Updates

```javascript
// tailwind.config.js
export default {
  // Add design system paths
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/design-system/**/*.{js,ts,jsx,tsx}",
  ],

  // Enable dark mode
  darkMode: 'class',

  theme: {
    extend: {
      // Add new design tokens...
    },
  },
};
```

#### Removed CSS Classes

The following custom classes are no longer needed (handled by components):

```css
/* Remove these if you added them manually */
.btn-loading { ... }
.modal-backdrop { ... }
.card-elevated { ... }
```

### Deprecation Notices

The following will be removed in v3:

| Deprecated | Replacement | Remove in |
|------------|-------------|-----------|
| `Button.loading` | `Button.isLoading` | v3.0 |
| `Card.shadowLevel` | `Card.shadow` | v3.0 |
| `showToast()` | `useToast()` | v3.0 |
| `MediaQuery` | `Show` / `Hide` | v3.0 |

### Getting Help

If you encounter issues during migration:

1. Check the [API Reference](./API_REFERENCE.md) for updated prop names
2. Review the [Component Catalog](./COMPONENT_CATALOG.md) for usage examples
3. Search existing issues on GitHub
4. Open a new issue with migration-related questions

### Rollback Plan

If you need to rollback to v1:

```bash
# Revert to v1
npm install @lumina-studio/design-system@1

# Or pin to specific version
npm install @lumina-studio/design-system@1.9.0
```

Note: v1 will receive security patches only through [EOL date].
