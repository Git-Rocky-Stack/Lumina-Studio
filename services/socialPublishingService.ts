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
}

// Export singleton
export const socialPublishing = new SocialPublishingService();
