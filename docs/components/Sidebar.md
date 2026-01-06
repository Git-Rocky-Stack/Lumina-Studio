# Sidebar

Collapsible navigation sidebar with nested items and responsive mobile drawer.

## Import

```tsx
import {
  Sidebar,
  MobileSidebar,
  MobileMenuButton,
} from './design-system/components/navigation/Sidebar';
```

## Overview

The Sidebar component provides a world-class navigation experience with collapsible states, nested items, smooth animations, and full accessibility support. It includes responsive variants for desktop and mobile.

## Basic Usage

```tsx
const navItems = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'projects', label: 'Projects', icon: <FolderIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

<Sidebar
  items={navItems}
  activeItem="home"
  onItemClick={(item) => navigate(item.href)}
/>
```

## Navigation Items

### Basic Items

```tsx
const items = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'analytics', label: 'Analytics', icon: <ChartIcon /> },
];
```

### With Badges

```tsx
const items = [
  { id: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 5 },
  { id: 'tasks', label: 'Tasks', icon: <TaskIcon />, badge: '3 new' },
];
```

### With Links

```tsx
const items = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, href: '/' },
  { id: 'docs', label: 'Documentation', icon: <BookIcon />, href: '/docs' },
];
```

### Nested Items

```tsx
const items = [
  {
    id: 'projects',
    label: 'Projects',
    icon: <FolderIcon />,
    children: [
      { id: 'project-1', label: 'Project Alpha' },
      { id: 'project-2', label: 'Project Beta' },
      { id: 'project-3', label: 'Project Gamma' },
    ],
  },
];
```

### Disabled Items

```tsx
const items = [
  { id: 'premium', label: 'Premium Features', icon: <StarIcon />, disabled: true },
];
```

## Collapsible Sidebar

### Controlled

```tsx
function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Sidebar
      items={items}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      collapsible
    />
  );
}
```

### Uncontrolled

```tsx
<Sidebar items={items} collapsible />
```

### Disable Collapse

```tsx
<Sidebar items={items} collapsible={false} />
```

## Width Configuration

```tsx
<Sidebar
  items={items}
  width={280}           // Expanded width (default: 256)
  collapsedWidth={64}   // Collapsed width (default: 72)
/>
```

## Visual Variants

### Default

Standard sidebar with border.

```tsx
<Sidebar variant="default" items={items} />
```

### Floating

Rounded with shadow, appears to float.

```tsx
<Sidebar variant="floating" items={items} />
```

### Bordered

Accent border on active items.

```tsx
<Sidebar variant="bordered" items={items} />
```

## Header & Footer

### With Logo

```tsx
<Sidebar
  items={items}
  logo={<img src="/logo.svg" alt="App" className="h-8" />}
  collapsedLogo={<img src="/logo-mark.svg" alt="App" className="h-8 w-8" />}
/>
```

### Custom Header

```tsx
<Sidebar
  items={items}
  header={
    <div className="flex items-center gap-3 p-4">
      <Avatar src="/user.jpg" />
      <div>
        <p className="font-medium">John Doe</p>
        <p className="text-sm text-zinc-500">Admin</p>
      </div>
    </div>
  }
/>
```

### Footer

```tsx
<Sidebar
  items={items}
  footer={
    <Button variant="ghost" fullWidth leftIcon={<LogoutIcon />}>
      Sign Out
    </Button>
  }
/>
```

## Glassmorphism Effect

```tsx
<Sidebar
  items={items}
  glassmorphism
/>
```

## Tooltips

Show tooltips when sidebar is collapsed:

```tsx
<Sidebar
  items={items}
  showTooltipsWhenCollapsed // default: true
/>
```

## Mobile Sidebar

### Mobile Drawer

```tsx
function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar items={items} />
      </div>

      {/* Mobile Drawer */}
      <MobileSidebar
        items={items}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Menu Button */}
      <MobileMenuButton
        onClick={() => setIsSidebarOpen(true)}
        isOpen={isSidebarOpen}
      />
    </>
  );
}
```

## Complete Layout Example

```tsx
function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, href: '/' },
    { id: 'projects', label: 'Projects', icon: <FolderIcon />, badge: 3, children: [
      { id: 'project-1', label: 'Active Projects', href: '/projects/active' },
      { id: 'project-2', label: 'Archived', href: '/projects/archived' },
    ]},
    { id: 'team', label: 'Team', icon: <UsersIcon />, href: '/team' },
    { id: 'analytics', label: 'Analytics', icon: <ChartIcon />, href: '/analytics' },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          items={navItems}
          activeItem={currentPath}
          onItemClick={(item) => navigate(item.href)}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          collapsible
          logo={<Logo />}
          collapsedLogo={<LogoMark />}
          footer={
            <UserMenu />
          }
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        items={navItems}
        activeItem={currentPath}
        onItemClick={(item) => {
          navigate(item.href);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logo={<Logo />}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center h-16 px-4 border-b border-zinc-200 dark:border-zinc-800">
          <MobileMenuButton
            onClick={() => setSidebarOpen(true)}
            isOpen={sidebarOpen}
          />
          <h1 className="text-xl font-semibold ml-4 lg:ml-0">
            Dashboard
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Props

### Sidebar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `NavItem[]` | - | Navigation items |
| `activeItem` | `string` | - | Active item ID |
| `onItemClick` | `(item: NavItem) => void` | - | Item click handler |
| `collapsed` | `boolean` | - | Controlled collapsed state |
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
| `closeOnItemClick` | `boolean` | `false` | Close on item click |

### NavItem Type

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

### MobileSidebar Props

Extends Sidebar props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Drawer open state |
| `onClose` | `() => void` | - | Close handler |

### MobileMenuButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onClick` | `() => void` | - | Click handler |
| `isOpen` | `boolean` | `false` | Open state |
| `className` | `string` | - | Additional classes |

## Accessibility

- Uses semantic `<nav>` and `<aside>` elements
- Implements tree navigation pattern with ARIA
- Full keyboard navigation support
- Focus trap in mobile drawer
- Screen reader announcements for collapse state
- Respects `prefers-reduced-motion`

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus between items |
| `Enter` / `Space` | Activate item or toggle nested menu |
| `ArrowRight` | Expand nested menu |
| `ArrowLeft` | Collapse nested menu |
| `Escape` | Close mobile drawer |

## Best Practices

### Do

- Group related items together
- Use icons consistently
- Show badges for actionable notifications
- Provide tooltips in collapsed state
- Use the mobile drawer for small screens

### Don't

- Create deeply nested navigation (max 2 levels)
- Hide important items in collapsed state
- Use too many badge notifications
- Forget to handle the active state

## Related Components

- [MobileMenuButton](./MobileMenuButton.md) - Toggle for mobile sidebar
- [Drawer](./Drawer.md) - Generic slide-in panel
- [Show/Hide](./ShowHide.md) - Responsive rendering
