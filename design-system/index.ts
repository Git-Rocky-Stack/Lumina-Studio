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
