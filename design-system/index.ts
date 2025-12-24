/**
 * Lumina Studio Design System
 *
 * A world-class design system with:
 * - Systematic design tokens
 * - Spring physics animations
 * - Unified components
 * - Sound design
 * - Accessibility built-in
 */

// ============================================================================
// TOKENS
// ============================================================================

export * from './tokens';
export { default as tokens } from './tokens';

// ============================================================================
// ANIMATIONS
// ============================================================================

export * from './animations';
export { default as animations } from './animations';

// ============================================================================
// SOUNDS
// ============================================================================

export * from './sounds';
export { default as sounds } from './sounds';

// ============================================================================
// COMPONENTS
// ============================================================================

// Button
export { Button, IconButton, ButtonGroup } from './components/Button';
export type { ButtonVariant, ButtonSize } from './components/Button';

// Card
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardImage,
  GlassCard,
  StatCard,
} from './components/Card';
export type { CardVariant, CardPadding } from './components/Card';

// Input
export { Input, Textarea, SearchInput } from './components/Input';
export type { InputSize, InputVariant, InputState } from './components/Input';

// Toast
export { ToastProvider, useToast } from './components/Toast';
export type { ToastType, ToastPosition } from './components/Toast';

// Skeleton
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonListItem,
  SkeletonButton,
  SkeletonImage,
  SkeletonStatsCard,
  SkeletonFileCard,
  SkeletonCanvasLayer,
  SkeletonTemplateCard,
  StaggeredSkeleton,
} from './components/Skeleton';

// Progressive Image
export {
  ProgressiveImage,
  ProgressiveAvatar,
  ProgressiveBackground,
} from './components/ProgressiveImage';

// Custom Cursor
export {
  CursorProvider,
  useCursor,
  CursorTrigger,
} from './components/CustomCursor';

// AI Onboarding
export {
  OnboardingProvider,
  useOnboarding,
} from './components/AIOnboarding';

// ============================================================================
// NEW ENHANCED COMPONENTS (v2.0)
// ============================================================================

// Modal & Dialog
export { Modal, ConfirmDialog, Sheet } from './components/Modal';

// Dropdown & Context Menu
export { Dropdown, ContextMenu } from './components/Dropdown';

// Tabs
export { Tabs, VerticalTabs } from './components/Tabs';

// Toggle, Checkbox, Radio
export { Toggle, ToggleGroup, Checkbox, Radio } from './components/Toggle';

// Slider
export { Slider, RangeSlider } from './components/Slider';

// Badge & Status
export { Badge, NotificationBadge, StatusIndicator, Tag } from './components/Badge';

// Avatar & Presence
export {
  Avatar,
  AvatarGroup,
  PresenceAvatar,
  CursorPresence,
} from './components/AvatarGroup';

// Progress Ring
export {
  ProgressRing,
  MultiRingProgress,
  ActivityRing,
  CountdownRing,
  ScoreRing,
} from './components/ProgressRing';

// Stepper
export { Stepper, StepContent, BreadcrumbStepper } from './components/Stepper';

// Accordion
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  FAQAccordion,
  Collapsible,
  ExpandableCard,
  Details,
} from './components/Accordion';

// Command Palette
export {
  CommandPaletteProvider,
  useCommandPalette,
  CommandPaletteTrigger,
} from './components/CommandPalette';

// Gradient & Visual Effects
export {
  GradientMesh,
  AuroraBackground,
  GlassPanel,
  BlobBackground,
  NoiseOverlay,
  Shimmer,
  Spotlight,
  GridPattern,
  DotPattern,
} from './components/GradientMesh';

// Particle Effects
export {
  Confetti,
  Sparkle,
  Sparkles,
  FloatingParticles,
  Bubbles,
  SuccessCheck,
  PulseRipple,
  TypingIndicator,
  Fireworks,
  ParticleSpinner,
} from './components/ParticleEffects';

// Tooltip
export { Tooltip, ContextualTooltip, Hotspot, InfoTooltip } from './components/Tooltip';

// Breadcrumb
export {
  Breadcrumb,
  PathBreadcrumb,
  PageBreadcrumb,
} from './components/Breadcrumb';

// Gesture Handlers
export {
  usePinchZoom,
  PannableContainer,
  Swipeable,
  LongPressable,
  PullToRefresh,
  DoubleTap,
} from './components/GestureHandlers';

// Drag & Drop Upload
export {
  DragDropUpload,
  GlobalDropZone,
  FileInputButton,
} from './components/DragDropUpload';

// Collaboration
export {
  PresenceIndicator,
  LiveCursors,
  ActivityFeed,
  CollaboratorTyping,
  ConnectionStatus,
  ElementLock,
  SelectionHighlight,
  CollabNotification,
  CollaborationPanel,
} from './components/CollaborationIndicators';

// Version History
export { VersionHistory, VisualDiff } from './components/VersionHistory';

// Template Gallery
export {
  TemplateGallery,
  AIDesignSuggestions,
  defaultCategories,
} from './components/TemplateGallery';

// Parallax & Scroll Effects
export {
  ParallaxSection,
  ParallaxBackground,
  ScrollReveal,
  StaggeredReveal,
  HorizontalScroll,
  ScrollProgress,
  TextReveal,
  PinnedSection,
  ZoomOnScroll,
  RotateOnScroll,
  BlurOnScroll,
  Counter,
} from './components/Parallax';

// Service Worker & Offline Support
export {
  ServiceWorkerProvider,
  useServiceWorker,
  ConnectionIndicator,
  InstallPrompt,
} from './components/ServiceWorkerProvider';
