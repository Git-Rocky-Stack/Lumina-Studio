# API Reference

Complete API documentation for all Lumina Studio Design System components.

## Table of Contents

- [Core Components](#core-components)
  - [Button](#button)
  - [Card](#card)
  - [Input](#input)
  - [Modal](#modal)
  - [Toast](#toast)
- [Overlay Components](#overlay-components)
  - [Dialog](#dialog)
  - [Drawer](#drawer)
- [Navigation Components](#navigation-components)
  - [Sidebar](#sidebar)
- [Data Display](#data-display)
  - [DashboardWidget](#dashboardwidget)
- [Animated Components](#animated-components)
  - [AnimatedButton](#animatedbutton)
  - [AnimatedCard](#animatedcard)
  - [AnimatedList](#animatedlist)
  - [AnimatedCountUp](#animatedcountup)
- [Responsive Components](#responsive-components)
  - [Container](#container)
  - [ResponsiveGrid](#responsivegrid)
  - [Stack](#stack)
  - [Show / Hide](#show--hide)
- [Accessibility](#accessibility)
  - [VisuallyHidden](#visuallyhidden)
  - [LiveRegion](#liveregion)
- [Hooks](#hooks)
  - [useFocusTrap](#usefocustrap)
  - [useRealTimeData](#userealtimedata)
  - [useBreakpoint](#usebreakpoint)
  - [useAnnouncer](#useannouncer)

---

## Core Components

### Button

A versatile button component with multiple variants, sizes, and states.

```tsx
import { Button } from './design-system/components/Button';
```

#### Props

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

#### Examples

```tsx
// Basic variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// With loading state
<Button isLoading loadingText="Saving...">Save</Button>

// With icons
<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// As link
<Button as="a" href="/dashboard">Go to Dashboard</Button>
```

---

### Card

A container component for displaying content with optional header, body, and footer sections.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from './design-system/components/Card';
```

#### Card Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'elevated' \| 'outlined' \| 'ghost' \| 'interactive'` | `'default'` | Card style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Internal padding |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'lg'` | Border radius |
| `shadow` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | - | Shadow depth |
| `hoverEffect` | `boolean` | `false` | Enable hover lift effect |
| `pressable` | `boolean` | `false` | Enable press animation |
| `as` | `ElementType` | `'div'` | Render as different element |

#### CardHeader Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Header title |
| `subtitle` | `string` | - | Header subtitle |
| `action` | `ReactNode` | - | Action element (e.g., button) |
| `bordered` | `boolean` | `false` | Show bottom border |

#### CardBody Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |

#### CardFooter Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bordered` | `boolean` | `false` | Show top border |
| `justify` | `'start' \| 'center' \| 'end' \| 'between'` | `'end'` | Justify content |

#### Examples

```tsx
<Card variant="elevated" padding="lg">
  <CardHeader
    title="Card Title"
    subtitle="Card description"
    action={<Button size="sm">Edit</Button>}
    bordered
  />
  <CardBody>
    <p>Card content goes here.</p>
  </CardBody>
  <CardFooter bordered>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save</Button>
  </CardFooter>
</Card>
```

---

### Input

A form input component with labels, validation, and addon support.

```tsx
import { Input } from './design-system/components/Input';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `placeholder` | `string` | - | Placeholder text |
| `type` | `string` | `'text'` | Input type (text, email, password, etc.) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `variant` | `'default' \| 'filled' \| 'flushed'` | `'default'` | Input style |
| `error` | `string` | - | Error message |
| `hint` | `string` | - | Help text below input |
| `leftAddon` | `ReactNode` | - | Element before input |
| `rightAddon` | `ReactNode` | - | Element after input |
| `leftIcon` | `ReactNode` | - | Icon inside input (left) |
| `rightIcon` | `ReactNode` | - | Icon inside input (right) |
| `fullWidth` | `boolean` | `false` | Take full container width |
| `disabled` | `boolean` | `false` | Disable input |
| `readOnly` | `boolean` | `false` | Make read-only |
| `required` | `boolean` | `false` | Mark as required |

#### Examples

```tsx
// Basic input
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
/>

// With validation error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With addons
<Input
  leftAddon="https://"
  rightAddon=".com"
  placeholder="website"
/>

// With icons
<Input
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>
```

---

### Modal

An accessible modal dialog with focus trap and animations.

```tsx
import { Modal, useModal } from './design-system/components/Modal';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Modal open state |
| `onClose` | `(reason: ModalCloseReason) => void` | - | Close callback |
| `title` | `string` | - | Modal title |
| `description` | `string` | - | Modal description |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal width |
| `closeOnBackdrop` | `boolean` | `true` | Close when clicking backdrop |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `showCloseButton` | `boolean` | `true` | Show close button |
| `preventScroll` | `boolean` | `true` | Prevent body scroll |
| `lockFocus` | `boolean` | `true` | Enable focus trap |
| `returnFocus` | `boolean` | `true` | Return focus on close |
| `glassmorphism` | `boolean` | `false` | Enable glass effect |
| `header` | `ReactNode` | - | Custom header |
| `footer` | `ReactNode` | - | Footer content |

#### Examples

```tsx
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">Confirm</Button>
          </>
        }
      >
        <p>Are you sure you want to continue?</p>
      </Modal>
    </>
  );
}
```

---

### Toast

A notification system with stacking, timers, and actions.

```tsx
import { ToastProvider, useToast, toast } from './design-system/components/Toast';
```

#### ToastProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' \| 'top-center' \| 'bottom-center'` | `'top-right'` | Toast position |
| `maxToasts` | `number` | `5` | Maximum visible toasts |
| `duration` | `number` | `5000` | Default duration (ms) |
| `gap` | `number` | `12` | Gap between toasts |

#### useToast Hook

```tsx
const { success, error, warning, info, promise, dismiss, dismissAll } = useToast();

// Show success toast
success('Operation completed!');

// Show error toast
error('Something went wrong');

// Show with options
warning('Please review', {
  duration: 10000,
  action: {
    label: 'Undo',
    onClick: () => handleUndo(),
  },
});

// Promise toast
promise(asyncOperation(), {
  loading: 'Processing...',
  success: 'Done!',
  error: 'Failed',
});
```

---

## Overlay Components

### Dialog

Specialized modal for confirmations and alerts.

```tsx
import { Dialog, ConfirmationDialog, AlertDialog } from './design-system/components/overlays/Dialog';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | Dialog type |
| `showIcon` | `boolean` | `true` | Show variant icon |
| `icon` | `ReactNode` | - | Custom icon |
| `primaryAction` | `DialogAction` | - | Primary action button |
| `secondaryAction` | `DialogAction` | - | Secondary action button |
| `centerContent` | `boolean` | `false` | Center align content |
| `closeOnAction` | `boolean` | `true` | Close after action |

#### DialogAction Type

```typescript
interface DialogAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
}
```

#### ConfirmationDialog Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `confirmText` | `string` | `'Confirm'` | Confirm button text |
| `cancelText` | `string` | `'Cancel'` | Cancel button text |
| `onConfirm` | `() => void \| Promise<void>` | - | Confirm handler |
| `onCancel` | `() => void` | - | Cancel handler |
| `destructive` | `boolean` | `false` | Destructive action style |
| `loading` | `boolean` | `false` | Show loading state |

#### Examples

```tsx
// Confirmation dialog
<ConfirmationDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete Item"
  onConfirm={handleDelete}
  destructive
>
  This action cannot be undone.
</ConfirmationDialog>

// Alert dialog
<AlertDialog
  isOpen={showAlert}
  onClose={() => setShowAlert(false)}
  title="Success"
  variant="success"
  acknowledgeText="Got it"
>
  Your changes have been saved.
</AlertDialog>
```

---

### Drawer

Slide-in panel from any edge.

```tsx
import { Drawer } from './design-system/components/overlays/Drawer';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Open state |
| `onClose` | `(reason) => void` | - | Close handler |
| `position` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` | Slide direction |
| `width` | `string` | `'400px'` | Width (left/right) |
| `height` | `string` | `'400px'` | Height (top/bottom) |
| `title` | `string` | - | Drawer title |
| `description` | `string` | - | Drawer description |
| `showOverlay` | `boolean` | `true` | Show backdrop |
| `showCloseButton` | `boolean` | `true` | Show close button |
| `glassmorphism` | `boolean` | `false` | Glass effect |
| `footer` | `ReactNode` | - | Footer content |

#### Examples

```tsx
<Drawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  position="right"
  title="Settings"
  width="500px"
  footer={
    <Button onClick={() => setIsOpen(false)}>Close</Button>
  }
>
  <SettingsForm />
</Drawer>
```

---

## Navigation Components

### Sidebar

Collapsible navigation sidebar with nested items.

```tsx
import { Sidebar, MobileSidebar, MobileMenuButton } from './design-system/components/navigation/Sidebar';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `NavItem[]` | - | Navigation items |
| `activeItem` | `string` | - | Active item ID |
| `onItemClick` | `(item: NavItem) => void` | - | Item click handler |
| `collapsed` | `boolean` | - | Collapsed state (controlled) |
| `onCollapsedChange` | `(collapsed: boolean) => void` | - | Collapse change handler |
| `collapsible` | `boolean` | `true` | Enable collapse toggle |
| `width` | `number` | `256` | Expanded width (px) |
| `collapsedWidth` | `number` | `72` | Collapsed width (px) |
| `header` | `ReactNode` | - | Header content |
| `footer` | `ReactNode` | - | Footer content |
| `logo` | `ReactNode` | - | Logo element |
| `collapsedLogo` | `ReactNode` | - | Logo when collapsed |
| `variant` | `'default' \| 'floating' \| 'bordered'` | `'default'` | Visual variant |
| `glassmorphism` | `boolean` | `false` | Glass effect |
| `showTooltipsWhenCollapsed` | `boolean` | `true` | Show tooltips |

#### NavItem Type

```typescript
interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: NavItem[];
  onClick?: () => void;
}
```

#### Examples

```tsx
const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, href: '/' },
  { id: 'projects', label: 'Projects', icon: <FolderIcon />, badge: 3, children: [
    { id: 'project-1', label: 'Project Alpha' },
    { id: 'project-2', label: 'Project Beta' },
  ]},
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
];

<Sidebar
  items={navItems}
  activeItem="home"
  onItemClick={(item) => navigate(item.href)}
  collapsible
  logo={<Logo />}
  collapsedLogo={<LogoMark />}
/>
```

---

## Data Display

### DashboardWidget

Real-time stat cards and data visualization widgets.

```tsx
import { DashboardWidget, StatWidget, ProgressWidget } from './design-system/components/data-display/DashboardWidget';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Widget title |
| `subtitle` | `string` | - | Widget subtitle |
| `value` | `number \| string` | - | Main value |
| `unit` | `string` | - | Value unit |
| `icon` | `ReactNode` | - | Widget icon |
| `type` | `'stat' \| 'progress' \| 'chart' \| 'list'` | `'stat'` | Widget type |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Widget size |
| `color` | `WidgetColor` | `'neutral'` | Color scheme |
| `animation` | `AnimationLevel` | `'moderate'` | Animation intensity |
| `trend` | `TrendData` | - | Trend indicator |
| `previousValue` | `number` | - | For auto trend calculation |
| `showTrend` | `boolean` | `true` | Show trend indicator |
| `showSparkline` | `boolean` | `false` | Show sparkline chart |
| `sparklineData` | `number[]` | - | Sparkline data points |
| `onRefresh` | `() => void` | - | Refresh handler |
| `onExpand` | `() => void` | - | Expand handler |
| `expandable` | `boolean` | `false` | Enable expand |
| `isLoading` | `boolean` | `false` | Loading state |
| `error` | `Error` | - | Error state |
| `isStale` | `boolean` | `false` | Data stale state |
| `lastUpdated` | `Date` | - | Last update time |
| `glassmorphism` | `boolean` | `false` | Glass effect |

#### TrendData Type

```typescript
interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  value: number;
  comparisonLabel?: string;
  invertColors?: boolean;
}
```

#### Examples

```tsx
// Basic stat widget
<DashboardWidget
  title="Total Users"
  value={12543}
  icon={<UsersIcon />}
  color="primary"
  trend={{ direction: 'up', value: 12.5 }}
  showSparkline
  sparklineData={[100, 120, 115, 130, 140, 135, 150]}
/>

// Progress widget
<ProgressWidget
  title="Storage Used"
  value={75}
  progress={75}
  progressConfig={{ max: 100, showLabel: true }}
  color="warning"
/>

// With real-time updates
<DashboardWidget
  title="Active Sessions"
  value={activeCount}
  onRefresh={fetchSessions}
  isLoading={isLoading}
  lastUpdated={lastFetch}
/>
```

---

## Animated Components

### AnimatedButton

Button with micro-interactions and gestures.

```tsx
import { AnimatedButton } from './design-system/components/animated/AnimatedButton';
```

#### Props

Extends all Button props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animation` | `'scale' \| 'bounce' \| 'pulse' \| 'shake' \| 'glow' \| 'morph' \| 'magnetic' \| 'ripple'` | `'scale'` | Animation type |
| `intensity` | `'subtle' \| 'moderate' \| 'expressive'` | `'moderate'` | Animation intensity |
| `gesture` | `'tap' \| 'hover' \| 'both'` | `'both'` | Trigger gesture |
| `continuous` | `boolean` | `false` | Continuous animation |
| `staggerChildren` | `boolean` | `false` | Stagger child animations |
| `disableOnReducedMotion` | `boolean` | `true` | Respect reduced motion |

---

### AnimatedCard

Card with entrance and interaction animations.

```tsx
import { AnimatedCard } from './design-system/components/animated/AnimatedCard';
```

#### Props

Extends all Card props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animation` | `'fadeUp' \| 'fadeIn' \| 'slideIn' \| 'scale' \| 'flip' \| 'none'` | `'fadeUp'` | Entrance animation |
| `hoverAnimation` | `'lift' \| 'glow' \| 'border' \| 'scale' \| 'tilt' \| 'none'` | `'lift'` | Hover animation |
| `delay` | `number` | `0` | Animation delay (seconds) |
| `duration` | `number` | `0.3` | Animation duration (seconds) |
| `triggerOnView` | `boolean` | `true` | Trigger on scroll into view |
| `viewThreshold` | `number` | `0.3` | Intersection threshold |
| `layoutId` | `string` | - | For shared layout animations |

---

### AnimatedList

Staggered list animations.

```tsx
import { AnimatedList, AnimatedListItem } from './design-system/components/animated/AnimatedList';
```

#### AnimatedList Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animation` | `'fadeUp' \| 'fadeIn' \| 'slideIn' \| 'scale' \| 'stagger'` | `'stagger'` | Item animation |
| `staggerDelay` | `number` | `0.05` | Delay between items |
| `initialDelay` | `number` | `0` | Initial delay |
| `duration` | `number` | `0.3` | Animation duration |
| `triggerOnView` | `boolean` | `true` | Trigger on view |
| `viewThreshold` | `number` | `0.1` | Intersection threshold |
| `as` | `ElementType` | `'ul'` | Container element |

---

### AnimatedCountUp

Animated number counter.

```tsx
import { AnimatedCountUp, AnimatedCurrency, AnimatedPercentage, AnimatedCompactNumber } from './design-system/components/animated/AnimatedCountUp';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | - | Target value |
| `from` | `number` | `0` | Start value |
| `duration` | `number` | `1` | Animation duration (seconds) |
| `easing` | `'linear' \| 'easeOut' \| 'easeIn' \| 'easeInOut'` | `'easeOut'` | Easing function |
| `decimals` | `number` | `0` | Decimal places |
| `prefix` | `string` | - | Value prefix |
| `suffix` | `string` | - | Value suffix |
| `separator` | `string` | `','` | Thousands separator |
| `decimal` | `string` | `'.'` | Decimal separator |
| `triggerOnView` | `boolean` | `true` | Trigger on view |
| `animateOnChange` | `boolean` | `true` | Re-animate on value change |
| `label` | `string` | - | Display label |
| `labelPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Label position |

#### Examples

```tsx
// Basic count up
<AnimatedCountUp value={1234567} duration={2} separator="," />

// Currency
<AnimatedCurrency value={99.99} currency="USD" />

// Percentage
<AnimatedPercentage value={85.5} showPlusSign />

// Compact notation
<AnimatedCompactNumber value={1500000} /> // Shows "1.5M"

// With stat counter (includes trend)
<AnimatedStatCounter
  value={12543}
  previousValue={10234}
  showTrend
  label="Total Users"
/>
```

---

## Responsive Components

### Container

Responsive max-width container.

```tsx
import { Container } from './design-system/responsive/containers';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxWidth` | `'narrow' \| 'standard' \| 'wide' \| 'ultraWide' \| string` | `'standard'` | Max width preset or custom |
| `center` | `boolean` | `true` | Center horizontally |
| `px` | `number \| Record<Breakpoint, number>` | `16` | Horizontal padding |
| `py` | `number \| Record<Breakpoint, number>` | - | Vertical padding |
| `fullHeight` | `boolean` | `false` | Min-height 100vh |
| `fluid` | `boolean` | `false` | No max-width |
| `enableContainerQueries` | `boolean` | `false` | Enable container queries |

---

### ResponsiveGrid

Auto-responsive grid layout.

```tsx
import { ResponsiveGrid } from './design-system/responsive/containers';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minWidth` | `number` | `280` | Minimum column width (px) |
| `maxColumns` | `number` | `12` | Maximum columns |
| `gap` | `number \| string` | `16` | Gap between items |
| `gapX` | `number \| string` | - | Horizontal gap |
| `gapY` | `number \| string` | - | Vertical gap |
| `columns` | `number \| Record<Breakpoint, number>` | - | Fixed columns |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | Align items |
| `justify` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | Justify items |
| `autoFill` | `boolean` | `false` | Use auto-fill |

---

### Stack

Flexible stacking layout.

```tsx
import { Stack } from './design-system/responsive/containers';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `'horizontal' \| 'vertical' \| Record<Breakpoint, Direction>` | `'vertical'` | Stack direction |
| `spacing` | `number \| Record<Breakpoint, number>` | `16` | Spacing between items |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | `'stretch'` | Cross-axis alignment |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | `'start'` | Main-axis justification |
| `wrap` | `boolean` | `false` | Wrap items |
| `reverse` | `boolean` | `false` | Reverse direction |
| `divider` | `ReactNode` | - | Divider between items |

---

### Show / Hide

Conditional rendering by breakpoint.

```tsx
import { Show, Hide } from './design-system/responsive/containers';
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `above` | `Breakpoint` | Show/hide above breakpoint |
| `below` | `Breakpoint` | Show/hide below breakpoint |
| `only` | `Breakpoint \| Breakpoint[]` | Show/hide at specific breakpoints |

#### Examples

```tsx
// Show desktop nav on md and above
<Show above="sm">
  <DesktopNavigation />
</Show>

// Hide on mobile
<Hide below="md">
  <Sidebar />
</Hide>

// Show only on tablet
<Show only={['sm', 'md']}>
  <TabletView />
</Show>
```

---

## Accessibility

### VisuallyHidden

Screen reader only content.

```tsx
import { VisuallyHidden } from './design-system/accessibility/screen-reader';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `focusable` | `boolean` | `false` | Make focusable (for skip links) |

---

### LiveRegion

Announce dynamic content to screen readers.

```tsx
import { LiveRegion } from './design-system/accessibility/screen-reader';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `politeness` | `'polite' \| 'assertive'` | `'polite'` | Announcement priority |
| `atomic` | `boolean` | `true` | Announce entire region |
| `relevant` | `'additions' \| 'removals' \| 'text' \| 'all'` | `'additions text'` | What changes to announce |
| `role` | `'status' \| 'alert' \| 'log' \| 'timer'` | `'status'` | ARIA role |

---

## Hooks

### useFocusTrap

Trap focus within a container.

```tsx
import { useFocusTrap } from './design-system/hooks/useFocusTrap';
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable focus trap |
| `returnFocus` | `boolean` | `true` | Return focus on disable |
| `initialFocus` | `RefObject<HTMLElement>` | - | Initial focus element |
| `onEscape` | `() => void` | - | Escape key handler |

#### Returns

```typescript
{
  containerRef: RefObject<HTMLDivElement>;
  firstFocusableRef: RefObject<HTMLElement>;
  lastFocusableRef: RefObject<HTMLElement>;
}
```

---

### useRealTimeData

Fetch and auto-refresh data.

```tsx
import { useRealTimeData } from './design-system/hooks/useRealTimeData';
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fetchFn` | `() => Promise<T>` | - | Data fetch function |
| `interval` | `number` | `30000` | Refresh interval (ms) |
| `enabled` | `boolean` | `true` | Enable auto-refresh |
| `staleTime` | `number` | `60000` | Time until data is stale |
| `onSuccess` | `(data: T) => void` | - | Success callback |
| `onError` | `(error: Error) => void` | - | Error callback |

#### Returns

```typescript
{
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  lastUpdated: Date | undefined;
  refetch: () => Promise<void>;
}
```

---

### useBreakpoint

Get current responsive breakpoint.

```tsx
import { useBreakpoint } from './design-system/responsive/hooks';
```

#### Returns

```typescript
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
```

---

### useAnnouncer

Programmatically announce to screen readers.

```tsx
import { useAnnouncer } from './design-system/accessibility/screen-reader';
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `politeness` | `'polite' \| 'assertive'` | `'polite'` | Announcement priority |
| `clearAfter` | `number` | - | Clear after (ms) |

#### Returns

```typescript
{
  announce: (message: string) => void;
  clear: () => void;
  message: string;
}
```
