// ============================================
// Hooks - Barrel Export
// ============================================

// Authentication
export { useAuth } from './useAuth';
export type {
  UserProfile,
  UserPreferences,
  AuthState,
  UseAuthReturn,
} from './useAuth';

// Analytics
export { useAnalytics, useAnalyticsTracking } from './useAnalytics';
export type { UseAnalyticsReturn, UseAnalyticsOptions } from './useAnalytics';

// Collaboration
export { useCollaboration, usePresence, useInvitations } from './useCollaboration';
export type { UsePresenceReturn, UseInvitationsReturn } from './useCollaboration';

// Animation
export { useScrollAnimation } from './useScrollAnimation';

// Utilities
export { useCountUp } from './useCountUp';
