# Button

Buttons trigger actions and communicate what will happen when the user interacts with them.

## Import

```tsx
import { Button } from './design-system/components/Button';
```

## Overview

The Button component is the primary interactive element in the design system. It supports multiple variants, sizes, and states while maintaining accessibility and consistent styling.

## Basic Usage

```tsx
<Button onClick={handleClick}>Click me</Button>
```

## Variants

### Primary

Use for the main call to action on a page.

```tsx
<Button variant="primary">Save Changes</Button>
```

### Secondary

Use for less prominent actions.

```tsx
<Button variant="secondary">Cancel</Button>
```

### Outline

Use for actions that need to be visible but not prominent.

```tsx
<Button variant="outline">Learn More</Button>
```

### Ghost

Use for the least prominent actions, often in toolbars.

```tsx
<Button variant="ghost">Edit</Button>
```

### Destructive

Use for dangerous actions like deleting data.

```tsx
<Button variant="destructive">Delete Account</Button>
```

### Success

Use for positive confirmation actions.

```tsx
<Button variant="success">Approve</Button>
```

## Sizes

```tsx
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
```

## States

### Loading

Show a loading spinner during async operations.

```tsx
<Button isLoading>Processing</Button>
<Button isLoading loadingText="Saving...">Save</Button>
```

### Disabled

Prevent interaction when the action is not available.

```tsx
<Button disabled>Unavailable</Button>
```

## Icons

### Left Icon

```tsx
<Button leftIcon={<PlusIcon />}>Add Item</Button>
```

### Right Icon

```tsx
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>
```

### Both Icons

```tsx
<Button leftIcon={<DownloadIcon />} rightIcon={<ChevronDownIcon />}>
  Download
</Button>
```

### Icon Only

```tsx
<Button variant="ghost" aria-label="Settings">
  <SettingsIcon />
</Button>
```

## Full Width

```tsx
<Button fullWidth>Full Width Button</Button>
```

## As Link

Render the button as an anchor element.

```tsx
<Button as="a" href="/dashboard">Go to Dashboard</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive' \| 'success'` | `'primary'` | Visual style variant |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `isLoading` | `boolean` | `false` | Show loading spinner |
| `loadingText` | `string` | - | Text to display while loading |
| `leftIcon` | `ReactNode` | - | Icon before text |
| `rightIcon` | `ReactNode` | - | Icon after text |
| `fullWidth` | `boolean` | `false` | Take full container width |
| `disabled` | `boolean` | `false` | Disable button |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `as` | `ElementType` | `'button'` | Render as different element |
| `href` | `string` | - | URL when rendering as link |
| `className` | `string` | - | Additional CSS classes |

## Accessibility

- Buttons use native `<button>` elements for proper keyboard support
- Loading state announces to screen readers
- Icon-only buttons require `aria-label`
- Disabled buttons are removed from tab order
- Focus states are clearly visible

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to button |
| `Enter` | Activate button |
| `Space` | Activate button |

### Screen Reader Considerations

```tsx
// Icon-only button must have aria-label
<Button variant="ghost" aria-label="Close dialog">
  <XIcon />
</Button>

// Loading state is announced
<Button isLoading aria-busy="true">
  Saving
</Button>
```

## Best Practices

### Do

- Use primary variant for the main action
- Provide loading feedback for async operations
- Use destructive variant for dangerous actions
- Include accessible labels for icon-only buttons

### Don't

- Use multiple primary buttons in the same section
- Disable buttons without explaining why
- Use buttons for navigation (use links instead)
- Remove focus indicators

## Related Components

- [AnimatedButton](./AnimatedButton.md) - Button with micro-interactions
- [Card](./Card.md) - Often contains buttons in footer
- [Dialog](./Dialog.md) - Uses buttons for actions
