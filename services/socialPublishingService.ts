// =============================================
// Social Publishing Service
// Connect and publish to social media platforms
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'youtube'
  | 'pinterest';

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  platform_user_id: string;
  platform_username?: string;
  platform_display_name?: string;
  platform_avatar_url?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes: string[];
  is_active: boolean;
  last_used_at?: string;
  connected_at: string;
  updated_at: string;
}

export interface PlatformFormat {
  id: string;
  platform: SocialPlatform;
  format_name: string;
  display_name: string;
  width: number;
  height: number;
  aspect_ratio?: string;
  max_file_size_mb?: number;
  supported_formats: string[];
  max_duration_seconds?: number;
  description?: string;
  is_active: boolean;
}

export interface ScheduledPost {
  id: string;
  user_id: string;
  social_account_id: string;
  design_id?: string;
  design_data?: any;
  media_url?: string;
  media_type: 'image' | 'video' | 'carousel';
  caption?: string;
  hashtags: string[];
  mentions: string[];
  link_url?: string;
  scheduled_for: string;
  timezone: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  published_at?: string;
  platform_post_id?: string;
  platform_post_url?: string;
  error_message?: string;
  retry_count: number;
  initial_likes?: number;
  initial_comments?: number;
  initial_shares?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  social_account?: SocialAccount;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  scheduled_post_id?: string;
  title: string;
  description?: string;
  event_type: 'post' | 'campaign' | 'reminder' | 'holiday';
  color: string;
  start_time: string;
  end_time?: string;
  is_all_day: boolean;
  recurrence_rule?: string;
  created_at: string;
  // Joined data
  scheduled_post?: ScheduledPost;
}

export interface OptimalPostTime {
  day_of_week: number;
  hour_utc: number;
  score: number;
  sample_size: number;
}

export interface PostAnalytics {
  id: string;
  scheduled_post_id: string;
  recorded_at: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  clicks: number;
  profile_visits: number;
  raw_data: any;
}

// Platform configurations
export const platformConfig: Record<SocialPlatform, {
  name: string;
  icon: string;
  color: string;
  authUrl?: string;
  scopes: string[];
}> = {
  instagram: {
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    scopes: ['basic', 'publish_content', 'manage_insights'],
  },
  tiktok: {
    name: 'TikTok',
    icon: 'tiktok',
    color: '#000000',
    scopes: ['user.info.basic', 'video.upload', 'video.publish'],
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'twitter',
    color: '#1DA1F2',
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    scopes: ['r_liteprofile', 'w_member_social'],
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    scopes: ['pages_manage_posts', 'pages_read_engagement'],
  },
  youtube: {
    name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    scopes: ['youtube.upload', 'youtube.readonly'],
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'pinterest',
    color: '#BD081C',
    scopes: ['read_public', 'write_public'],
  },
};

// =============================================
// Social Publishing Service
// =============================================

class SocialPublishingService {
  // =============================================
  // Social Accounts
  // =============================================

  async getConnectedAccounts(): Promise<SocialAccount[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch social accounts:', error);
      return [];
    }

    return data || [];
  }

  async getAccountById(accountId: string): Promise<SocialAccount | null> {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) {
      console.error('Failed to fetch account:', error);
      return null;
    }

    return data;
  }

  async connectAccount(
    platform: SocialPlatform,
    platformUserId: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiresAt?: string,
    scopes?: string[],
    profileData?: {
      username?: string;
      displayName?: string;
      avatarUrl?: string;
    }
  ): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform,
        platform_user_id: platformUserId,
        platform_username: profileData?.username,
        platform_display_name: profileData?.displayName,
        platform_avatar_url: profileData?.avatarUrl,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        scopes: scopes || platformConfig[platform].scopes,
        is_active: true,
        connected_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to connect account:', error);
      return null;
    }

    return data?.id;
  }

  async disconnectAccount(accountId: string): Promise<boolean> {
    const { error } = await supabase
      .from('social_accounts')
      .update({ is_active: false })
      .eq('id', accountId);

    if (error) {
      console.error('Failed to disconnect account:', error);
      return false;
    }

    return true;
  }

  async refreshAccountToken(accountId: string): Promise<boolean> {
    // In production, implement OAuth token refresh logic here
    // This is a placeholder that would call the platform's refresh endpoint
    console.log('Refreshing token for account:', accountId);
    return true;
  }

  // =============================================
  // Platform Formats
  // =============================================

  async getPlatformFormats(platform?: SocialPlatform): Promise<PlatformFormat[]> {
    let query = supabase
      .from('platform_formats')
      .select('*')
      .eq('is_active', true)
      .order('platform')
      .order('format_name');

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch platform formats:', error);
      return [];
    }

    return data || [];
  }

  async getFormatByDimensions(width: number, height: number): Promise<PlatformFormat[]> {
    const { data, error } = await supabase
      .from('platform_formats')
      .select('*')
      .eq('width', width)
      .eq('height', height)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to fetch formats by dimensions:', error);
      return [];
    }

    return data || [];
  }

  // =============================================
  // Scheduled Posts
  // =============================================

  async createScheduledPost(post: Partial<ScheduledPost>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        ...post,
        user_id: user.id,
        status: post.status || 'draft',
        timezone: post.timezone || 'UTC',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create scheduled post:', error);
      return null;
    }

    return data?.id;
  }

  async updateScheduledPost(postId: string, updates: Partial<ScheduledPost>): Promise<boolean> {
    const { error } = await supabase
      .from('scheduled_posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) {
      console.error('Failed to update scheduled post:', error);
      return false;
    }

    return true;
  }

  async deleteScheduledPost(postId: string): Promise<boolean> {
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Failed to delete scheduled post:', error);
      return false;
    }

    return true;
  }

  async getScheduledPosts(
    status?: ScheduledPost['status'],
    accountId?: string
  ): Promise<ScheduledPost[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('scheduled_posts')
      .select('*, social_account:social_accounts(*)')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }
    if (accountId) {
      query = query.eq('social_account_id', accountId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch scheduled posts:', error);
      return [];
    }

    return data || [];
  }

  async getPostById(postId: string): Promise<ScheduledPost | null> {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*, social_account:social_accounts(*)')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Failed to fetch post:', error);
      return null;
    }

    return data;
  }

  async schedulePost(postId: string, scheduledFor: string): Promise<boolean> {
    const { error } = await supabase
      .from('scheduled_posts')
      .update({
        scheduled_for: scheduledFor,
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      console.error('Failed to schedule post:', error);
      return false;
    }

    return true;
  }

  async publishNow(postId: string): Promise<boolean> {
    // In production, this would trigger the actual publishing workflow
    const { error } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'publishing',
        scheduled_for: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      console.error('Failed to publish post:', error);
      return false;
    }

    // Add to publishing queue
    await supabase.from('publishing_queue').insert({
      scheduled_post_id: postId,
      priority: 1, // High priority for immediate publish
    });

    return true;
  }

  async cancelScheduledPost(postId: string): Promise<boolean> {
    const { error } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      console.error('Failed to cancel post:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // Calendar
  // =============================================

  async getCalendarEvents(
    startDate: string,
    endDate: string
  ): Promise<CalendarEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*, scheduled_post:scheduled_posts(*, social_account:social_accounts(*))')
      .eq('user_id', user.id)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Failed to fetch calendar events:', error);
      return [];
    }

    return data || [];
  }

  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...event,
        user_id: user.id,
        event_type: event.event_type || 'post',
        color: event.color || '#6366f1',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create calendar event:', error);
      return null;
    }

    return data?.id;
  }

  async updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<boolean> {
    const { error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', eventId);

    if (error) {
      console.error('Failed to update calendar event:', error);
      return false;
    }

    return true;
  }

  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Failed to delete calendar event:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // Optimal Times
  // =============================================

  async getOptimalPostTimes(accountId: string): Promise<OptimalPostTime[]> {
    const { data, error } = await supabase
      .from('optimal_post_times')
      .select('day_of_week, hour_utc, score, sample_size')
      .eq('social_account_id', accountId)
      .order('score', { ascending: false });

    if (error) {
      console.error('Failed to fetch optimal times:', error);
      return [];
    }

    return data || [];
  }

  async getNextOptimalTime(accountId: string): Promise<Date | null> {
    const { data, error } = await supabase.rpc('get_next_optimal_time', {
      p_social_account_id: accountId,
    });

    if (error) {
      console.error('Failed to get next optimal time:', error);
      return null;
    }

    return data ? new Date(data) : null;
  }

  // =============================================
  // Analytics
  // =============================================

  async getPostAnalytics(postId: string): Promise<PostAnalytics[]> {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('scheduled_post_id', postId)
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch post analytics:', error);
      return [];
    }

    return data || [];
  }

  async getLatestAnalytics(postId: string): Promise<PostAnalytics | null> {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('scheduled_post_id', postId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to fetch latest analytics:', error);
      return null;
    }

    return data;
  }

  // =============================================
  // Hashtag Suggestions
  // =============================================

  suggestHashtags(caption: string, platform: SocialPlatform): string[] {
    // Simple hashtag suggestion based on caption keywords
    // In production, this would use AI/ML for better suggestions
    const words = caption.toLowerCase().split(/\s+/);
    const commonTags: Record<string, string[]> = {
      marketing: ['#marketing', '#digitalmarketing', '#socialmedia', '#branding'],
      design: ['#design', '#graphicdesign', '#creative', '#art'],
      business: ['#business', '#entrepreneur', '#startup', '#success'],
      lifestyle: ['#lifestyle', '#motivation', '#inspiration', '#life'],
      food: ['#food', '#foodie', '#foodporn', '#delicious'],
      travel: ['#travel', '#wanderlust', '#adventure', '#explore'],
      fashion: ['#fashion', '#style', '#ootd', '#fashionista'],
      fitness: ['#fitness', '#workout', '#gym', '#health'],
    };

    const suggestions: Set<string> = new Set();

    for (const word of words) {
      for (const [category, tags] of Object.entries(commonTags)) {
        if (word.includes(category) || category.includes(word)) {
          tags.forEach(tag => suggestions.add(tag));
        }
      }
    }

    // Add platform-specific tags
    if (platform === 'instagram') {
      suggestions.add('#instagram');
    } else if (platform === 'tiktok') {
      suggestions.add('#fyp');
      suggestions.add('#viral');
    } else if (platform === 'linkedin') {
      suggestions.add('#linkedin');
      suggestions.add('#networking');
    }

    return Array.from(suggestions).slice(0, 30);
  }

  // =============================================
  // Enhanced Publishing Schedules
  // =============================================

  async getPublishingSchedules(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    schedule_type: 'optimal' | 'fixed' | 'recurring';
    fixed_times?: string[];
    recurrence_rule?: string;
    timezone: string;
    platforms: string[];
    platform_settings: Record<string, any>;
    auto_queue: boolean;
    queue_from_folder?: string;
    is_active: boolean;
    created_at: string;
  }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('publishing_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch publishing schedules:', error);
      return [];
    }

    return data || [];
  }

  async createPublishingSchedule(schedule: {
    name: string;
    description?: string;
    schedule_type: 'optimal' | 'fixed' | 'recurring';
    fixed_times?: string[];
    recurrence_rule?: string;
    timezone?: string;
    platforms?: string[];
    auto_queue?: boolean;
  }): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('publishing_schedules')
      .insert({
        user_id: user.id,
        name: schedule.name,
        description: schedule.description,
        schedule_type: schedule.schedule_type,
        fixed_times: schedule.fixed_times,
        recurrence_rule: schedule.recurrence_rule,
        timezone: schedule.timezone || 'UTC',
        platforms: schedule.platforms || [],
        auto_queue: schedule.auto_queue || false,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create publishing schedule:', error);
      return null;
    }

    return data?.id;
  }

  async updatePublishingSchedule(
    scheduleId: string,
    updates: Partial<{
      name: string;
      description: string;
      schedule_type: 'optimal' | 'fixed' | 'recurring';
      fixed_times: string[];
      recurrence_rule: string;
      timezone: string;
      platforms: string[];
      is_active: boolean;
    }>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('publishing_schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', scheduleId);

    if (error) {
      console.error('Failed to update publishing schedule:', error);
      return false;
    }

    return true;
  }

  async deletePublishingSchedule(scheduleId: string): Promise<boolean> {
    const { error } = await supabase
      .from('publishing_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('Failed to delete publishing schedule:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // AI-Powered Optimal Time Suggestions
  // =============================================

  async suggestOptimalTimes(
    platform: SocialPlatform,
    accountId?: string,
    count: number = 5
  ): Promise<Array<{ datetime: Date; score: number; reason: string }>> {
    // Platform-specific optimal time ranges (based on industry research)
    const platformOptimalHours: Record<SocialPlatform, number[]> = {
      instagram: [9, 11, 14, 17, 19, 21], // Best: 11am-1pm, 7-9pm
      tiktok: [7, 9, 12, 15, 19, 22],     // Best: 7-9am, 12pm, 7-10pm
      twitter: [8, 10, 12, 17, 21],       // Best: 8am, 12pm, 5pm
      linkedin: [7, 8, 9, 12, 17, 18],    // Best: 7-9am, 12pm (weekdays)
      facebook: [9, 13, 16, 19],          // Best: 1-4pm
      youtube: [12, 15, 17, 21],          // Best: 12pm, 3pm, 5pm
      pinterest: [14, 20, 21, 22],        // Best: 2pm, 8-11pm
    };

    const platformBestDays: Record<SocialPlatform, number[]> = {
      instagram: [1, 2, 3, 4, 5, 6], // Mon-Sat
      tiktok: [1, 2, 3, 4, 5],       // Weekdays
      twitter: [1, 2, 3, 4, 5],      // Weekdays
      linkedin: [1, 2, 3, 4],        // Mon-Thu
      facebook: [3, 4, 5],           // Wed-Fri
      youtube: [4, 5, 6, 0],         // Thu-Sun
      pinterest: [6, 0],             // Weekend
    };

    const suggestions: Array<{ datetime: Date; score: number; reason: string }> = [];
    const now = new Date();
    const optimalHours = platformOptimalHours[platform];
    const bestDays = platformBestDays[platform];

    // If we have account-specific data, use it
    if (accountId) {
      const accountOptimalTimes = await this.getOptimalPostTimes(accountId);
      if (accountOptimalTimes.length > 0) {
        // Use historical data
        for (const optimal of accountOptimalTimes.slice(0, count)) {
          const nextDate = this.getNextDateForDayAndHour(optimal.day_of_week, optimal.hour_utc);
          suggestions.push({
            datetime: nextDate,
            score: optimal.score,
            reason: `Based on your audience engagement (${optimal.sample_size} posts analyzed)`,
          });
        }
        return suggestions;
      }
    }

    // Generate suggestions based on platform best practices
    for (let i = 0; i < count; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + i);

      // Find the next best day
      while (!bestDays.includes(targetDate.getDay())) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      // Pick an optimal hour
      const hourIndex = i % optimalHours.length;
      targetDate.setHours(optimalHours[hourIndex], 0, 0, 0);

      // Calculate score based on hour and day
      const hourScore = 1 - (hourIndex / optimalHours.length) * 0.3;
      const dayScore = bestDays.includes(targetDate.getDay()) ? 1 : 0.7;
      const score = hourScore * dayScore;

      suggestions.push({
        datetime: targetDate,
        score: Math.round(score * 100) / 100,
        reason: `Optimal time for ${platformConfig[platform].name} based on industry best practices`,
      });
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }

  private getNextDateForDayAndHour(dayOfWeek: number, hour: number): Date {
    const now = new Date();
    const result = new Date(now);

    // Find the next occurrence of this day
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
    result.setDate(result.getDate() + daysUntil);
    result.setHours(hour, 0, 0, 0);

    // If the time has already passed today, use next week
    if (result <= now) {
      result.setDate(result.getDate() + 7);
    }

    return result;
  }

  // =============================================
  // Time Slot Analysis
  // =============================================

  async getTimeSlotHeatmap(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{ day: number; hour: number; posts: number; avgEngagement: number }>> {
    // Get posts in date range
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('scheduled_for, initial_likes, initial_comments, initial_shares')
      .eq('social_account_id', accountId)
      .eq('status', 'published')
      .gte('scheduled_for', startDate)
      .lte('scheduled_for', endDate);

    if (error || !data) {
      return [];
    }

    // Build heatmap
    const heatmap: Record<string, { posts: number; totalEngagement: number }> = {};

    data.forEach(post => {
      const date = new Date(post.scheduled_for);
      const day = date.getDay();
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      const engagement = (post.initial_likes || 0) +
        (post.initial_comments || 0) * 2 +
        (post.initial_shares || 0) * 3;

      if (!heatmap[key]) {
        heatmap[key] = { posts: 0, totalEngagement: 0 };
      }
      heatmap[key].posts++;
      heatmap[key].totalEngagement += engagement;
    });

    // Convert to array
    return Object.entries(heatmap).map(([key, value]) => {
      const [day, hour] = key.split('-').map(Number);
      return {
        day,
        hour,
        posts: value.posts,
        avgEngagement: value.posts > 0 ? value.totalEngagement / value.posts : 0,
      };
    });
  }

  // =============================================
  // Bulk Scheduling
  // =============================================

  async bulkSchedulePosts(posts: Array<{
    social_account_id: string;
    media_url?: string;
    caption?: string;
    hashtags?: string[];
    scheduled_for: string;
  }>): Promise<{ success: number; failed: number; ids: string[] }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: 0, failed: 0, ids: [] };

    const postsWithUser = posts.map(post => ({
      ...post,
      user_id: user.id,
      status: 'scheduled',
      timezone: 'UTC',
      media_type: 'image',
    }));

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert(postsWithUser)
      .select('id');

    if (error) {
      console.error('Failed to bulk schedule posts:', error);
      return { success: 0, failed: posts.length, ids: [] };
    }

    return {
      success: data?.length || 0,
      failed: posts.length - (data?.length || 0),
      ids: data?.map(d => d.id) || [],
    };
  }

  // =============================================
  // Queue Management
  // =============================================

  async getPostQueue(accountId: string): Promise<ScheduledPost[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*, social_account:social_accounts(*)')
      .eq('user_id', user.id)
      .eq('social_account_id', accountId)
      .in('status', ['draft', 'scheduled'])
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Failed to fetch post queue:', error);
      return [];
    }

    return data || [];
  }

  async reorderQueue(
    accountId: string,
    postIds: string[]
  ): Promise<boolean> {
    // Get current scheduled posts
    const queue = await this.getPostQueue(accountId);
    if (queue.length === 0) return false;

    // Get the scheduled times
    const times = queue
      .filter(p => p.status === 'scheduled')
      .map(p => new Date(p.scheduled_for))
      .sort((a, b) => a.getTime() - b.getTime());

    // Reassign times in new order
    for (let i = 0; i < postIds.length && i < times.length; i++) {
      await this.updateScheduledPost(postIds[i], {
        scheduled_for: times[i].toISOString(),
      });
    }

    return true;
  }
}

// Export singleton
export const socialPublishing = new SocialPublishingService();
