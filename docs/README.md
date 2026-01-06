# Lumina Studio Design System

A world-class React component library built with TypeScript, Tailwind CSS, and Framer Motion. Designed for professional creative applications with enterprise-grade accessibility, animations, and responsive design.

## Features

- **40+ Production-Ready Components** - Buttons, Cards, Modals, Forms, Navigation, and more
- **Framer Motion Animations** - Spring physics, micro-interactions, and gesture support
- **WCAG AA Compliant** - Full keyboard navigation, screen reader support, focus management
- **Responsive by Default** - Mobile-first design with responsive breakpoints and container queries
- **Dark Mode Support** - Seamless dark/light theme switching
- **TypeScript First** - Complete type definitions with IntelliSense support
- **Tailwind CSS Integration** - Utility-first styling with custom design tokens

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Component Categories

### Core Components
- [Button](./components/Button.md) - Primary interaction element with variants and states
- [Card](./components/Card.md) - Content container with elevation and interactivity
- [Input](./components/Input.md) - Form input with validation and addons
- [Modal](./components/Modal.md) - Overlay dialog with focus trap and animations

### Overlay Components
- [Dialog](./components/Dialog.md) - Confirmation and alert dialogs
- [Drawer](./components/Drawer.md) - Slide-in panels from any direction
- [Toast](./components/Toast.md) - Notification system with stacking

### Navigation Components
- [Sidebar](./components/Sidebar.md) - Collapsible navigation with nested items
- [Breadcrumb](./components/Breadcrumb.md) - Navigation trail
- [Tabs](./components/Tabs.md) - Tabbed interface

### Data Display
- [DashboardWidget](./components/DashboardWidget.md) - Real-time stat cards and charts
- [Badge](./components/Badge.md) - Status indicators
- [AvatarGroup](./components/AvatarGroup.md) - User avatars with overflow

### Animated Components
- [AnimatedButton](./components/AnimatedButton.md) - Button with micro-interactions
- [AnimatedCard](./components/AnimatedCard.md) - Card with entrance and gesture animations
- [AnimatedList](./components/AnimatedList.md) - Staggered list animations
- [AnimatedCountUp](./components/AnimatedCountUp.md) - Number counter animation

### Responsive Utilities
- [Container](./components/Container.md) - Responsive max-width container
- [ResponsiveGrid](./components/ResponsiveGrid.md) - Auto-responsive grid layout
- [Stack](./components/Stack.md) - Flexible stacking layout
- [Show/Hide](./components/ShowHide.md) - Conditional rendering by breakpoint

### Accessibility Helpers
- [VisuallyHidden](./components/VisuallyHidden.md) - Screen reader only content
- [LiveRegion](./components/LiveRegion.md) - Dynamic announcements
- [FocusTrap](./components/FocusTrap.md) - Modal focus management

## Documentation

- [Getting Started](./GETTING_STARTED.md) - Installation and setup
- [Installation](./INSTALLATION.md) - Detailed installation guide
- [API Reference](./API_REFERENCE.md) - Complete props documentation
- [Component Catalog](./COMPONENT_CATALOG.md) - Visual component showcase
- [Best Practices](./BEST_PRACTICES.md) - Usage guidelines and patterns
- [Migration Guide](./MIGRATION_GUIDE.md) - Version upgrade instructions

## Design Principles

### 1. Accessibility First
Every component is built with accessibility as a core requirement, not an afterthought. We follow WCAG 2.1 AA standards and implement proper ARIA attributes, keyboard navigation, and screen reader support.

### 2. Animation with Purpose
Animations enhance user experience without sacrificing performance. We use Framer Motion's spring physics for natural-feeling interactions and respect `prefers-reduced-motion` settings.

### 3. Responsive by Default
Components adapt seamlessly across breakpoints. We use a mobile-first approach with responsive props and breakpoint-aware rendering.

### 4. Type Safety
Full TypeScript support with comprehensive type definitions. Every prop is typed, documented, and validated at compile time.

### 5. Composable Architecture
Components are designed to work together. Use composition patterns to build complex UIs from simple building blocks.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

See our [Contributing Guide](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.
