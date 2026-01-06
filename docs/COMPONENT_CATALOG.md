# Component Catalog

Visual showcase of all Lumina Studio Design System components with interactive examples.

## Overview

This catalog provides visual examples and usage patterns for every component in the design system. Each section includes:
- Component preview
- Usage examples
- Variant showcase
- Interactive states

---

## Core Components

### Button

Buttons trigger actions and communicate what will happen when the user interacts with them.

#### Variants

```tsx
// Primary - Main calls to action
<Button variant="primary">Primary Action</Button>

// Secondary - Alternative actions
<Button variant="secondary">Secondary</Button>

// Outline - Subtle emphasis
<Button variant="outline">Outline</Button>

// Ghost - Minimal emphasis
<Button variant="ghost">Ghost</Button>

// Destructive - Dangerous actions
<Button variant="destructive">Delete</Button>

// Success - Positive actions
<Button variant="success">Success</Button>
```

#### Sizes

```tsx
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
```

#### States

```tsx
// Loading
<Button isLoading>Loading</Button>
<Button isLoading loadingText="Saving...">Save</Button>

// Disabled
<Button disabled>Disabled</Button>

// With Icons
<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>
<Button leftIcon={<DownloadIcon />} rightIcon={<ChevronDownIcon />}>
  Download
</Button>
```

#### Full Width

```tsx
<Button fullWidth>Full Width Button</Button>
```

---

### Card

Cards contain content and actions about a single subject.

#### Variants

```tsx
// Default
<Card variant="default">
  <CardBody>Default card</CardBody>
</Card>

// Elevated - Prominent cards
<Card variant="elevated">
  <CardBody>Elevated card with shadow</CardBody>
</Card>

// Outlined - Bordered cards
<Card variant="outlined">
  <CardBody>Outlined card</CardBody>
</Card>

// Ghost - Minimal styling
<Card variant="ghost">
  <CardBody>Ghost card</CardBody>
</Card>

// Interactive - Clickable cards
<Card variant="interactive" onClick={handleClick}>
  <CardBody>Click me</CardBody>
</Card>
```

#### With Sections

```tsx
<Card variant="elevated" padding="lg">
  <CardHeader
    title="Project Overview"
    subtitle="Last updated 2 hours ago"
    action={<Button size="sm" variant="ghost">Edit</Button>}
    bordered
  />
  <CardBody>
    <p>Main content area with description and details.</p>
  </CardBody>
  <CardFooter bordered justify="between">
    <span className="text-sm text-zinc-500">3 team members</span>
    <div className="flex gap-2">
      <Button variant="ghost" size="sm">Cancel</Button>
      <Button variant="primary" size="sm">Save</Button>
    </div>
  </CardFooter>
</Card>
```

#### Padding Options

```tsx
<Card padding="none">No padding</Card>
<Card padding="sm">Small padding</Card>
<Card padding="md">Medium padding</Card>
<Card padding="lg">Large padding</Card>
<Card padding="xl">Extra large padding</Card>
```

---

### Input

Form inputs for collecting user data.

#### Variants

```tsx
// Default
<Input label="Email" placeholder="you@example.com" />

// Filled
<Input label="Name" variant="filled" />

// Flushed (underline only)
<Input label="Search" variant="flushed" />
```

#### Sizes

```tsx
<Input size="sm" placeholder="Small" />
<Input size="md" placeholder="Medium" />
<Input size="lg" placeholder="Large" />
```

#### States

```tsx
// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With hint
<Input
  label="Email"
  type="email"
  hint="We'll never share your email"
/>

// Disabled
<Input label="Disabled" disabled value="Cannot edit" />

// Read-only
<Input label="Read Only" readOnly value="Display only" />

// Required
<Input label="Required Field" required />
```

#### With Addons & Icons

```tsx
// Left/Right addons
<Input
  leftAddon="https://"
  rightAddon=".com"
  placeholder="website"
/>

// Icons
<Input
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>

<Input
  rightIcon={<EyeIcon />}
  type="password"
  placeholder="Password"
/>

// Both addons and icons
<Input
  leftAddon="$"
  rightIcon={<InfoIcon />}
  placeholder="Amount"
/>
```

---

### Modal

Overlay dialogs for focused interactions.

#### Sizes

```tsx
// Extra small (max-width: 320px)
<Modal size="xs" title="Confirm">...</Modal>

// Small (max-width: 400px)
<Modal size="sm" title="Quick Action">...</Modal>

// Medium (max-width: 500px) - Default
<Modal size="md" title="Edit Item">...</Modal>

// Large (max-width: 640px)
<Modal size="lg" title="Settings">...</Modal>

// Extra large (max-width: 800px)
<Modal size="xl" title="Dashboard">...</Modal>

// Full screen
<Modal size="full" title="Full Screen">...</Modal>
```

#### With Footer Actions

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Save Changes"
  description="Your changes will be saved permanently"
  footer={
    <div className="flex gap-3">
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
    </div>
  }
>
  <p>Are you sure you want to save these changes?</p>
</Modal>
```

#### Glassmorphism Effect

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Glass Modal"
  glassmorphism
>
  Content with glass background effect
</Modal>
```

---

### Toast

Notification system for feedback messages.

#### Types

```tsx
const { success, error, warning, info } = useToast();

// Success
success('File uploaded successfully');

// Error
error('Failed to save changes');

// Warning
warning('Your session will expire soon');

// Info
info('New features available');
```

#### With Actions

```tsx
success('Item deleted', {
  action: {
    label: 'Undo',
    onClick: handleUndo,
  },
});
```

#### Custom Duration

```tsx
// Long duration
warning('Important notice', { duration: 10000 });

// Persistent (no auto-dismiss)
error('Critical error', { duration: Infinity });
```

#### Promise Toast

```tsx
promise(
  saveData(),
  {
    loading: 'Saving...',
    success: 'Data saved!',
    error: 'Failed to save',
  }
);
```

#### Positions

```tsx
<ToastProvider position="top-right">...</ToastProvider>
<ToastProvider position="top-left">...</ToastProvider>
<ToastProvider position="top-center">...</ToastProvider>
<ToastProvider position="bottom-right">...</ToastProvider>
<ToastProvider position="bottom-left">...</ToastProvider>
<ToastProvider position="bottom-center">...</ToastProvider>
```

---

## Overlay Components

### Dialog

Specialized modals for confirmations and alerts.

#### Variants

```tsx
// Default
<Dialog variant="default" title="Confirm">...</Dialog>

// Info
<Dialog variant="info" title="Information">...</Dialog>

// Success
<Dialog variant="success" title="Success!">...</Dialog>

// Warning
<Dialog variant="warning" title="Warning">...</Dialog>

// Error
<Dialog variant="error" title="Error">...</Dialog>
```

#### Confirmation Dialog

```tsx
<ConfirmationDialog
  isOpen={isOpen}
  onClose={handleClose}
  title="Delete Project"
  onConfirm={handleDelete}
  confirmText="Delete"
  cancelText="Keep"
  destructive
>
  Are you sure you want to delete this project? This action cannot be undone.
</ConfirmationDialog>
```

#### Alert Dialog

```tsx
<AlertDialog
  isOpen={showAlert}
  onClose={() => setShowAlert(false)}
  title="Update Complete"
  variant="success"
  acknowledgeText="Got it"
>
  Your profile has been updated successfully.
</AlertDialog>
```

---

### Drawer

Slide-in panels for secondary content.

#### Positions

```tsx
// Right (default)
<Drawer position="right" title="Settings">...</Drawer>

// Left
<Drawer position="left" title="Navigation">...</Drawer>

// Top
<Drawer position="top" title="Search">...</Drawer>

// Bottom
<Drawer position="bottom" title="Actions">...</Drawer>
```

#### Custom Size

```tsx
// Wide drawer
<Drawer position="right" width="600px" title="Details">
  ...
</Drawer>

// Tall bottom drawer
<Drawer position="bottom" height="50vh" title="Panel">
  ...
</Drawer>
```

---

## Navigation Components

### Sidebar

Collapsible navigation with nested items.

#### Basic Sidebar

```tsx
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
  { id: 'projects', label: 'Projects', icon: <FolderIcon />, badge: 5 },
  { id: 'analytics', label: 'Analytics', icon: <ChartIcon /> },
  { id: 'settings', label: 'Settings', icon: <CogIcon /> },
];

<Sidebar
  items={navItems}
  activeItem="dashboard"
  onItemClick={(item) => navigate(`/${item.id}`)}
/>
```

#### With Nested Items

```tsx
const navItems = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  {
    id: 'projects',
    label: 'Projects',
    icon: <FolderIcon />,
    children: [
      { id: 'project-a', label: 'Project Alpha' },
      { id: 'project-b', label: 'Project Beta' },
      { id: 'project-c', label: 'Project Gamma' },
    ],
  },
  { id: 'team', label: 'Team', icon: <UsersIcon /> },
];

<Sidebar items={navItems} collapsible />
```

#### Variants

```tsx
// Default
<Sidebar variant="default" items={items} />

// Floating (rounded with shadow)
<Sidebar variant="floating" items={items} />

// Bordered (accent border on active)
<Sidebar variant="bordered" items={items} />
```

#### With Logo & Footer

```tsx
<Sidebar
  items={navItems}
  logo={<img src="/logo.svg" alt="App" className="h-8" />}
  collapsedLogo={<img src="/logo-mark.svg" alt="App" className="h-8" />}
  footer={
    <div className="flex items-center gap-2">
      <Avatar src="/user.jpg" />
      <span>John Doe</span>
    </div>
  }
/>
```

---

## Data Display

### DashboardWidget

Real-time stat cards and visualizations.

#### Stat Widget

```tsx
<DashboardWidget
  title="Total Revenue"
  value={125430}
  unit="USD"
  icon={<DollarIcon />}
  color="success"
  trend={{ direction: 'up', value: 12.5 }}
/>
```

#### With Sparkline

```tsx
<DashboardWidget
  title="Active Users"
  value={8432}
  showSparkline
  sparklineData={[1000, 1200, 1100, 1400, 1300, 1500, 1800]}
  trend={{ direction: 'up', value: 8.2 }}
/>
```

#### Progress Widget

```tsx
<ProgressWidget
  title="Storage Used"
  value={75}
  progress={75}
  progressConfig={{ max: 100, showLabel: true }}
  color="warning"
/>
```

#### Loading & Error States

```tsx
// Loading
<DashboardWidget
  title="Loading Data"
  isLoading
/>

// Error
<DashboardWidget
  title="Failed to Load"
  error={new Error('Network error')}
  onRefresh={retry}
/>
```

#### Color Schemes

```tsx
<DashboardWidget color="primary" title="Primary" value={100} />
<DashboardWidget color="success" title="Success" value={200} />
<DashboardWidget color="warning" title="Warning" value={300} />
<DashboardWidget color="error" title="Error" value={400} />
<DashboardWidget color="info" title="Info" value={500} />
```

---

## Animated Components

### AnimatedButton

```tsx
// Scale animation (default)
<AnimatedButton animation="scale">Scale</AnimatedButton>

// Bounce animation
<AnimatedButton animation="bounce">Bounce</AnimatedButton>

// Pulse animation
<AnimatedButton animation="pulse" continuous>Pulse</AnimatedButton>

// Glow animation
<AnimatedButton animation="glow">Glow</AnimatedButton>

// Magnetic effect
<AnimatedButton animation="magnetic">Magnetic</AnimatedButton>

// Ripple effect
<AnimatedButton animation="ripple">Ripple</AnimatedButton>
```

### AnimatedCard

```tsx
// Fade up entrance
<AnimatedCard animation="fadeUp">
  Content appears from below
</AnimatedCard>

// Scale entrance
<AnimatedCard animation="scale">
  Content scales in
</AnimatedCard>

// With hover effects
<AnimatedCard animation="fadeIn" hoverAnimation="lift">
  Lifts on hover
</AnimatedCard>

<AnimatedCard animation="fadeIn" hoverAnimation="glow">
  Glows on hover
</AnimatedCard>

<AnimatedCard animation="fadeIn" hoverAnimation="tilt">
  Tilts on hover (3D effect)
</AnimatedCard>
```

### AnimatedList

```tsx
<AnimatedList staggerDelay={0.1}>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      {item.content}
    </AnimatedListItem>
  ))}
</AnimatedList>
```

### AnimatedCountUp

```tsx
// Basic counter
<AnimatedCountUp value={12345} duration={2} />

// Currency
<AnimatedCurrency value={99.99} currency="USD" />

// Percentage
<AnimatedPercentage value={85.5} showPlusSign />

// Compact notation
<AnimatedCompactNumber value={1500000} /> // "1.5M"

// With trend
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

```tsx
// Standard width (1280px max)
<Container maxWidth="standard">...</Container>

// Narrow (768px max)
<Container maxWidth="narrow">...</Container>

// Wide (1536px max)
<Container maxWidth="wide">...</Container>

// Fluid (no max-width)
<Container fluid>...</Container>

// With padding
<Container px={24} py={32}>...</Container>
```

### ResponsiveGrid

```tsx
// Auto-responsive (calculates columns based on min-width)
<ResponsiveGrid minWidth={300} gap={24}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</ResponsiveGrid>

// Fixed columns per breakpoint
<ResponsiveGrid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap={16}>
  ...
</ResponsiveGrid>
```

### Stack

```tsx
// Vertical stack (default)
<Stack spacing={16}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Stack>

// Horizontal stack
<Stack direction="horizontal" spacing={8}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Stack>

// Responsive direction
<Stack direction={{ xs: 'vertical', md: 'horizontal' }} spacing={16}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Stack>

// With dividers
<Stack spacing={16} divider={<hr className="border-zinc-200" />}>
  <div>Section 1</div>
  <div>Section 2</div>
  <div>Section 3</div>
</Stack>
```

### Show / Hide

```tsx
// Show on desktop only
<Show above="md">
  <DesktopNavigation />
</Show>

// Hide on mobile
<Hide below="md">
  <Sidebar />
</Hide>

// Show only on specific breakpoints
<Show only={['sm', 'md']}>
  <TabletSpecificContent />
</Show>
```

---

## Accessibility Components

### VisuallyHidden

```tsx
// Icon button with accessible label
<button>
  <DeleteIcon />
  <VisuallyHidden>Delete item</VisuallyHidden>
</button>

// Skip link (focusable)
<VisuallyHidden focusable>
  <a href="#main-content">Skip to main content</a>
</VisuallyHidden>
```

### LiveRegion

```tsx
// Status updates
<LiveRegion politeness="polite">
  {statusMessage}
</LiveRegion>

// Critical alerts
<LiveRegion politeness="assertive" role="alert">
  {errorMessage}
</LiveRegion>
```

### LoadingAnnouncement

```tsx
<LoadingAnnouncement
  isLoading={isSubmitting}
  loadingMessage="Submitting form..."
  completeMessage="Form submitted successfully"
/>
```

### ProgressAnnouncement

```tsx
<ProgressAnnouncement
  value={uploadProgress}
  max={100}
  announceInterval={25}
  formatMessage={(pct) => `Upload ${pct}% complete`}
/>
```

---

## Design Tokens

### Colors

```
primary-50 to primary-950 (Indigo)
success-50, success-500, success-600 (Green)
warning-50, warning-500, warning-600 (Amber)
error-50, error-500, error-600 (Red)
zinc-50 to zinc-950 (Neutral)
```

### Spacing (8-point grid)

```
4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px, 80px, 96px
```

### Border Radius

```
none: 0
sm: 4px
md: 6px
lg: 8px
xl: 12px
2xl: 16px
full: 9999px
```

### Shadows

```
sm: Small shadow for subtle elevation
md: Medium shadow for cards
lg: Large shadow for modals
xl: Extra large shadow for dropdowns
2xl: Maximum shadow for overlays
```

### Animation Durations

```
instant: 0ms
fast: 150ms
normal: 200ms
slow: 300ms
slower: 500ms
```

### Breakpoints

```
xs: 0px
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
3xl: 1920px
4xl: 2560px
```
