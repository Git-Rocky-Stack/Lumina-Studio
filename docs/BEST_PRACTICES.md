# Best Practices Guide

Guidelines and patterns for using the Lumina Studio Design System effectively.

## Table of Contents

- [Component Usage](#component-usage)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Responsive Design](#responsive-design)
- [Animation](#animation)
- [Form Handling](#form-handling)
- [State Management](#state-management)
- [Testing](#testing)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)

---

## Component Usage

### Use Semantic Variants

Choose variants that communicate meaning, not just appearance:

```tsx
// Good - Variant communicates intent
<Button variant="destructive" onClick={handleDelete}>
  Delete Account
</Button>

// Avoid - Using color for styling only
<Button className="bg-red-500" onClick={handleDelete}>
  Delete Account
</Button>
```

### Prefer Composition Over Customization

Build complex UIs by composing simple components:

```tsx
// Good - Compose components
<Card>
  <CardHeader title="Settings" action={<Button size="sm">Edit</Button>} />
  <CardBody>
    <Stack spacing={16}>
      <Input label="Name" />
      <Input label="Email" />
    </Stack>
  </CardBody>
  <CardFooter>
    <Button variant="primary">Save</Button>
  </CardFooter>
</Card>

// Avoid - Monolithic custom component
<SettingsCardWithFormAndButtons
  fields={['name', 'email']}
  onSave={handleSave}
/>
```

### Use Design System Props

Leverage built-in props instead of custom CSS:

```tsx
// Good - Use component props
<Card padding="lg" radius="xl" shadow="md">
  ...
</Card>

// Avoid - Override with custom classes
<Card className="p-8 rounded-3xl shadow-lg">
  ...
</Card>
```

### Maintain Consistent Spacing

Use the design system's spacing scale:

```tsx
// Good - Use spacing props or Tailwind scale
<Stack spacing={16}>
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// Avoid - Arbitrary spacing values
<div className="space-y-[13px]">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## Accessibility

### Always Provide Text Alternatives

```tsx
// Good - Icon button with accessible name
<Button variant="ghost" aria-label="Close dialog">
  <XIcon />
</Button>

// Good - Using VisuallyHidden
<Button variant="ghost">
  <XIcon />
  <VisuallyHidden>Close dialog</VisuallyHidden>
</Button>

// Bad - No accessible name
<Button variant="ghost">
  <XIcon />
</Button>
```

### Use Proper Heading Hierarchy

```tsx
// Good - Logical heading structure
<main>
  <h1>Dashboard</h1>
  <section>
    <h2>Analytics</h2>
    <h3>Weekly Summary</h3>
  </section>
  <section>
    <h2>Recent Activity</h2>
  </section>
</main>

// Bad - Skipping heading levels
<main>
  <h1>Dashboard</h1>
  <h3>Analytics</h3>  {/* Skipped h2 */}
  <h4>Weekly Summary</h4>
</main>
```

### Announce Dynamic Content

```tsx
// Good - Announce status changes
function SearchResults({ results, isLoading }) {
  const { announce } = useAnnouncer();

  useEffect(() => {
    if (!isLoading && results) {
      announce(`Found ${results.length} results`);
    }
  }, [results, isLoading]);

  return (
    <>
      <LoadingAnnouncement isLoading={isLoading} />
      {/* Results UI */}
    </>
  );
}
```

### Ensure Keyboard Navigation

```tsx
// Good - All interactive elements are keyboard accessible
<Sidebar
  items={navItems}
  onItemClick={(item) => {
    navigate(item.href);
    // Focus management handled internally
  }}
/>

// Bad - Click-only interaction
<div onClick={handleClick} className="cursor-pointer">
  Clickable area
</div>

// Better - Proper button or link
<button onClick={handleClick}>
  Clickable area
</button>
```

### Provide Focus Indicators

The design system provides focus styles by default. Don't remove them:

```tsx
// Good - Uses built-in focus styles
<Button>Click me</Button>

// Bad - Removes focus indicator
<Button className="focus:outline-none focus:ring-0">
  Click me
</Button>
```

---

## Performance

### Use Appropriate Animation Levels

```tsx
// Good - Respect user preferences
function MyComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatedCard
      animation={reducedMotion ? 'none' : 'fadeUp'}
    >
      Content
    </AnimatedCard>
  );
}
```

### Lazy Load Heavy Components

```tsx
import { lazy, Suspense } from 'react';

// Good - Lazy load complex components
const DashboardWidget = lazy(() =>
  import('./design-system/components/DashboardWidget')
);

function Dashboard() {
  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <DashboardWidget />
    </Suspense>
  );
}
```

### Memoize Expensive Renders

```tsx
import { memo, useMemo, useCallback } from 'react';

// Good - Memoize list items
const ListItem = memo(function ListItem({ item, onSelect }) {
  return (
    <div onClick={() => onSelect(item.id)}>
      {item.name}
    </div>
  );
});

function List({ items, onSelect }) {
  const handleSelect = useCallback((id) => {
    onSelect(id);
  }, [onSelect]);

  return (
    <AnimatedList>
      {items.map(item => (
        <ListItem key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </AnimatedList>
  );
}
```

### Avoid Layout Thrashing

```tsx
// Good - Batch DOM reads and writes
function Component() {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    // Read phase
    const { width, height } = containerRef.current.getBoundingClientRect();

    // Write phase
    containerRef.current.style.setProperty('--container-width', `${width}px`);
  }, []);

  return <div ref={containerRef}>...</div>;
}
```

---

## Responsive Design

### Use Responsive Props

```tsx
// Good - Responsive stack direction
<Stack
  direction={{ xs: 'vertical', md: 'horizontal' }}
  spacing={{ xs: 16, md: 24 }}
>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Stack>
```

### Use Show/Hide for Conditional Rendering

```tsx
// Good - Different UI for breakpoints
<>
  <Show above="md">
    <DesktopSidebar />
  </Show>
  <Hide above="md">
    <MobileNavigation />
  </Hide>
</>
```

### Design Mobile-First

```tsx
// Good - Mobile styles first, then enhance
<div className="
  p-4        /* Mobile */
  md:p-6     /* Tablet */
  lg:p-8     /* Desktop */
">
  Content
</div>
```

### Use Container Queries Where Appropriate

```tsx
<Container enableContainerQueries containerName="card-container">
  <div className="@container">
    <div className="@md:flex @md:gap-4">
      {/* Layout changes based on container, not viewport */}
    </div>
  </div>
</Container>
```

---

## Animation

### Use Meaningful Animations

```tsx
// Good - Animation communicates state change
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Modal>...</Modal>
    </motion.div>
  )}
</AnimatePresence>

// Avoid - Animation for its own sake
<motion.button
  animate={{ rotate: 360 }}
  transition={{ repeat: Infinity, duration: 2 }}
>
  Click me  {/* Why is this spinning? */}
</motion.button>
```

### Keep Animations Fast

```tsx
// Good - Quick, snappy animations
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>

// Avoid - Slow animations that delay interaction
<motion.div
  initial={{ opacity: 0, y: 100 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 2 }}
>
  Content  {/* User waits 2 seconds to see this */}
</motion.div>
```

### Use Spring Physics for Natural Feel

```tsx
// Good - Spring physics feel natural
<motion.div
  animate={{ scale: isPressed ? 0.95 : 1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
  Button
</motion.div>
```

---

## Form Handling

### Validate on Blur and Submit

```tsx
// Good - Validate at appropriate times
function Form() {
  const [errors, setErrors] = useState({});

  const handleBlur = (field) => (e) => {
    const error = validate(field, e.target.value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        error={errors.email}
        onBlur={handleBlur('email')}
      />
    </form>
  );
}
```

### Show Clear Error States

```tsx
// Good - Clear error messaging
<Input
  label="Password"
  type="password"
  error="Password must contain at least 8 characters, one uppercase letter, and one number"
  aria-invalid={!!error}
  aria-errormessage="password-error"
/>
```

### Provide Loading Feedback

```tsx
// Good - Show loading state on submit
<Button
  type="submit"
  isLoading={isSubmitting}
  loadingText="Saving..."
>
  Save Changes
</Button>
```

### Use Controlled Inputs

```tsx
// Good - Controlled input with clear data flow
function Form() {
  const [value, setValue] = useState('');

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      label="Name"
    />
  );
}
```

---

## State Management

### Keep State Close to Where It's Used

```tsx
// Good - Local state for UI concerns
function Modal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Tabs activeIndex={activeTab} onChange={setActiveTab}>
        ...
      </Tabs>
    </Modal>
  );
}
```

### Lift State Only When Necessary

```tsx
// Good - Lift state when siblings need it
function Page() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <ItemList onSelect={setSelectedId} />
      <ItemDetail id={selectedId} />
    </>
  );
}
```

### Use Controlled Components for Forms

```tsx
// Good - Controlled components for form state
function SearchForm() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});

  return (
    <form>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <FilterPanel
        value={filters}
        onChange={setFilters}
      />
    </form>
  );
}
```

---

## Testing

### Test User Interactions

```tsx
import { render, screen, fireEvent } from '@testing-library/react';

test('button shows loading state when clicked', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Submit</Button>);

  fireEvent.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalled();
});
```

### Test Accessibility

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('modal has no accessibility violations', async () => {
  const { container } = render(
    <Modal isOpen title="Test Modal">
      Content
    </Modal>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Test Keyboard Navigation

```tsx
test('modal can be closed with Escape', () => {
  const onClose = jest.fn();
  render(<Modal isOpen onClose={onClose} title="Test" />);

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledWith('escape');
});
```

---

## Common Patterns

### Confirmation Flow

```tsx
function DeleteButton({ onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setShowConfirm(true)}>
        Delete
      </Button>
      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title="Confirm Deletion"
        destructive
        loading={isDeleting}
      >
        Are you sure? This cannot be undone.
      </ConfirmationDialog>
    </>
  );
}
```

### Search with Debounce

```tsx
function SearchInput({ onSearch }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
      leftIcon={<SearchIcon />}
    />
  );
}
```

### Loading States

```tsx
function DataDisplay() {
  const { data, isLoading, error, refetch } = useData();

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <AlertCircle className="mx-auto mb-4" />
          <p>{error.message}</p>
          <Button onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <DashboardWidget
      title="Statistics"
      value={data?.value}
      isLoading={isLoading}
      onRefresh={refetch}
    />
  );
}
```

---

## Anti-Patterns

### Don't Override Design Tokens

```tsx
// Bad - Overriding design system colors
<Button className="bg-[#1a73e8] hover:bg-[#1557b0]">
  Custom Blue
</Button>

// Good - Use design system variants or extend properly
<Button variant="primary">
  Primary
</Button>
```

### Don't Skip Accessibility

```tsx
// Bad - No accessible name
<button onClick={onClose}>
  <XIcon />
</button>

// Good - Proper accessible name
<button onClick={onClose} aria-label="Close">
  <XIcon />
</button>
```

### Don't Nest Interactive Elements

```tsx
// Bad - Button inside a clickable card
<Card onClick={handleCardClick}>
  <Button onClick={handleButtonClick}>Action</Button>
</Card>

// Good - Separate click targets
<Card>
  <CardBody onClick={handleCardClick}>
    Content
  </CardBody>
  <CardFooter>
    <Button onClick={handleButtonClick}>Action</Button>
  </CardFooter>
</Card>
```

### Don't Forget Loading States

```tsx
// Bad - No feedback during async operation
<Button onClick={async () => {
  await saveData(); // User doesn't know it's happening
}}>
  Save
</Button>

// Good - Clear loading feedback
<Button
  onClick={handleSave}
  isLoading={isSaving}
  loadingText="Saving..."
>
  Save
</Button>
```

### Don't Use Divs for Everything

```tsx
// Bad - Using divs for interactive elements
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>

// Good - Use semantic elements
<button onClick={handleClick}>Click me</button>
<a href="/page">Navigate</a>
```
