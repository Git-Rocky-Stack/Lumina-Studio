// =============================================
// Social Publishing Components Index
// Export all social publishing UI components
// =============================================

export { PostScheduler } from './PostScheduler';
export { ContentCalendar } from './ContentCalendar';

// Re-export types from service
export type {
  SocialPlatform,
  SocialAccount,
  PlatformFormat,
  ScheduledPost,
  CalendarEvent,
  OptimalPostTime,
  PostAnalytics,
} from '../../services/socialPublishingService';

export { platformConfig } from '../../services/socialPublishingService';
