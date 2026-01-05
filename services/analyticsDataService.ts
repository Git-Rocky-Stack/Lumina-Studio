/**
 * Analytics Data Service
 *
 * Provides data fetching and aggregation for the analytics dashboard.
 * Integrates with Supabase for persistent analytics storage.
 */

import { supabase } from '../lib/supabase';

// ============================================
// Types
// ============================================

export interface DateRange {
  start: Date;
  end: Date;
  label: '7d' | '30d' | '90d' | '12m' | 'all';
}

export interface AnalyticsSummary {
  totalViews: number;
  totalSessions: number;
  totalExports: number;
  totalAIGenerations: number;
  totalAssetsCreated: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
    fill?: boolean;
  }[];
}

export interface TopAsset {
  id: string;
  name: string;
  type: string;
  views: number;
  downloads: number;
  thumbnail?: string;
  trend: number;
}

export interface FeatureUsageData {
  name: string;
  category: string;
  users: number;
  totalUses: number;
  avgDuration: number;
  trend: number;
}

export interface AIUsageData {
  operationType: string;
  count: number;
  creditsUsed: number;
  avgLatency: number;
  successRate: number;
}

export interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  benchmark: number;
}

export interface DashboardData {
  summary: AnalyticsSummary;
  viewsOverTime: TimeSeriesPoint[];
  sessionsOverTime: TimeSeriesPoint[];
  topAssets: TopAsset[];
  featureUsage: FeatureUsageData[];
  aiUsage: AIUsageData[];
  deviceBreakdown: { device: string; percentage: number }[];
  geoDistribution: { country: string; users: number }[];
  peakHours: { hour: number; value: number }[];
  funnel: FunnelStep[];
  performance: PerformanceMetric[];
}

// ============================================
// Helper Functions
// ============================================

const getDateRange = (range: DateRange['label']): { start: Date; end: Date } => {
  const end = new Date();
  let start = new Date();

  switch (range) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '12m':
      start.setMonth(end.getMonth() - 12);
      break;
    case 'all':
      start = new Date(2020, 0, 1); // Project start date
      break;
  }

  return { start, end };
};

const formatDateForQuery = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// ============================================
// Analytics Data Service
// ============================================

class AnalyticsDataService {
  private userId: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Fetch complete dashboard data
   */
  async getDashboardData(range: DateRange['label']): Promise<DashboardData> {
    const { start, end } = getDateRange(range);

    // Fetch all data in parallel
    const [
      summary,
      viewsOverTime,
      sessionsOverTime,
      topAssets,
      featureUsage,
      aiUsage,
      deviceBreakdown,
      geoDistribution,
      peakHours,
      funnel,
      performance,
    ] = await Promise.all([
      this.getSummary(start, end),
      this.getViewsOverTime(start, end),
      this.getSessionsOverTime(start, end),
      this.getTopAssets(start, end),
      this.getFeatureUsage(start, end),
      this.getAIUsage(start, end),
      this.getDeviceBreakdown(start, end),
      this.getGeoDistribution(start, end),
      this.getPeakHours(start, end),
      this.getFunnelData(start, end),
      this.getPerformanceMetrics(start, end),
    ]);

    return {
      summary,
      viewsOverTime,
      sessionsOverTime,
      topAssets,
      featureUsage,
      aiUsage,
      deviceBreakdown,
      geoDistribution,
      peakHours,
      funnel,
      performance,
    };
  }

  /**
   * Get summary metrics
   */
  async getSummary(start: Date, end: Date): Promise<AnalyticsSummary> {
    if (!this.userId) {
      return this.getMockSummary();
    }

    try {
      const { data, error } = await supabase.rpc('get_user_analytics_summary', {
        p_user_id: this.userId,
        p_days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      });

      if (error) throw error;

      return {
        totalViews: data?.total_page_views || 0,
        totalSessions: data?.total_sessions || 0,
        totalExports: data?.total_exports || 0,
        totalAIGenerations: data?.total_ai_generations || 0,
        totalAssetsCreated: data?.total_assets_created || 0,
        avgSessionDuration: data?.avg_session_duration || 0,
        bounceRate: 0.35, // Calculate from actual data
      };
    } catch (error) {
      console.error('Error fetching summary:', error);
      return this.getMockSummary();
    }
  }

  /**
   * Get views over time
   */
  async getViewsOverTime(start: Date, end: Date): Promise<TimeSeriesPoint[]> {
    if (!this.userId) {
      return this.generateMockTimeSeries(start, end, 1000, 5000);
    }

    try {
      const { data, error } = await supabase
        .from('analytics_daily_aggregates')
        .select('date, page_views')
        .eq('user_id', this.userId)
        .gte('date', formatDateForQuery(start))
        .lte('date', formatDateForQuery(end))
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        date: row.date,
        value: row.page_views || 0,
      }));
    } catch (error) {
      console.error('Error fetching views:', error);
      return this.generateMockTimeSeries(start, end, 1000, 5000);
    }
  }

  /**
   * Get sessions over time
   */
  async getSessionsOverTime(start: Date, end: Date): Promise<TimeSeriesPoint[]> {
    if (!this.userId) {
      return this.generateMockTimeSeries(start, end, 50, 200);
    }

    try {
      const { data, error } = await supabase
        .from('analytics_daily_aggregates')
        .select('date, sessions')
        .eq('user_id', this.userId)
        .gte('date', formatDateForQuery(start))
        .lte('date', formatDateForQuery(end))
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        date: row.date,
        value: row.sessions || 0,
      }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return this.generateMockTimeSeries(start, end, 50, 200);
    }
  }

  /**
   * Get top performing assets
   */
  async getTopAssets(_start: Date, _end: Date): Promise<TopAsset[]> {
    // Mock data for now - would query assets table
    return [
      { id: '1', name: 'Marketing Banner Q1', type: 'image', views: 12500, downloads: 890, trend: 15 },
      { id: '2', name: 'Product Launch Video', type: 'video', views: 8900, downloads: 450, trend: 8 },
      { id: '3', name: 'Annual Report 2025', type: 'pdf', views: 6700, downloads: 1200, trend: 22 },
      { id: '4', name: 'Social Media Kit', type: 'template', views: 5400, downloads: 320, trend: -3 },
      { id: '5', name: 'Brand Guidelines', type: 'pdf', views: 4200, downloads: 280, trend: 5 },
    ];
  }

  /**
   * Get feature usage data
   */
  async getFeatureUsage(start: Date, end: Date): Promise<FeatureUsageData[]> {
    if (!this.userId) {
      return this.getMockFeatureUsage();
    }

    try {
      const { data, error } = await supabase
        .from('analytics_feature_usage')
        .select('*')
        .eq('user_id', this.userId)
        .gte('last_used_at', formatDateForQuery(start))
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(row => ({
        name: row.feature_name,
        category: row.feature_category,
        users: 1,
        totalUses: row.usage_count,
        avgDuration: row.total_duration_seconds / row.usage_count,
        trend: 0,
      }));
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      return this.getMockFeatureUsage();
    }
  }

  /**
   * Get AI usage data
   */
  async getAIUsage(start: Date, end: Date): Promise<AIUsageData[]> {
    if (!this.userId) {
      return this.getMockAIUsage();
    }

    try {
      const { data, error } = await supabase
        .from('analytics_ai_usage')
        .select('operation_type, credits_used, latency_ms, success')
        .eq('user_id', this.userId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      // Aggregate by operation type
      const aggregated = (data || []).reduce((acc, row) => {
        const key = row.operation_type;
        if (!acc[key]) {
          acc[key] = { count: 0, credits: 0, latency: 0, successes: 0 };
        }
        acc[key].count++;
        acc[key].credits += row.credits_used;
        acc[key].latency += row.latency_ms || 0;
        acc[key].successes += row.success ? 1 : 0;
        return acc;
      }, {} as Record<string, { count: number; credits: number; latency: number; successes: number }>);

      return Object.entries(aggregated).map(([type, stats]) => ({
        operationType: type,
        count: stats.count,
        creditsUsed: stats.credits,
        avgLatency: Math.round(stats.latency / stats.count),
        successRate: Math.round((stats.successes / stats.count) * 100),
      }));
    } catch (error) {
      console.error('Error fetching AI usage:', error);
      return this.getMockAIUsage();
    }
  }

  /**
   * Get device breakdown
   */
  async getDeviceBreakdown(_start: Date, _end: Date): Promise<{ device: string; percentage: number }[]> {
    // Mock data - would aggregate from events
    return [
      { device: 'Desktop', percentage: 68 },
      { device: 'Mobile', percentage: 24 },
      { device: 'Tablet', percentage: 8 },
    ];
  }

  /**
   * Get geographic distribution
   */
  async getGeoDistribution(_start: Date, _end: Date): Promise<{ country: string; users: number }[]> {
    // Mock data - would aggregate from events
    return [
      { country: 'United States', users: 4500 },
      { country: 'United Kingdom', users: 1200 },
      { country: 'Germany', users: 890 },
      { country: 'Canada', users: 750 },
      { country: 'Australia', users: 620 },
      { country: 'France', users: 580 },
      { country: 'Japan', users: 450 },
      { country: 'Other', users: 1010 },
    ];
  }

  /**
   * Get peak activity hours
   */
  async getPeakHours(_start: Date, _end: Date): Promise<{ hour: number; value: number }[]> {
    // Mock data - would aggregate from events
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      value: Math.round(50 + Math.sin((hour - 10) * 0.5) * 40 + Math.random() * 20),
    }));
  }

  /**
   * Get funnel data
   */
  async getFunnelData(_start: Date, _end: Date): Promise<FunnelStep[]> {
    // Mock funnel data
    const funnel = [
      { name: 'Landing Page', users: 10000 },
      { name: 'Sign Up Started', users: 3500 },
      { name: 'Sign Up Complete', users: 2800 },
      { name: 'First Project', users: 1900 },
      { name: 'First Export', users: 1200 },
      { name: 'Upgrade View', users: 450 },
      { name: 'Upgrade Complete', users: 180 },
    ];

    return funnel.map((step, index) => ({
      name: step.name,
      users: step.users,
      conversionRate: index === 0 ? 100 : Math.round((step.users / funnel[0].users) * 100),
      dropOffRate: index === 0 ? 0 : Math.round(((funnel[index - 1].users - step.users) / funnel[index - 1].users) * 100),
    }));
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(_start: Date, _end: Date): Promise<PerformanceMetric[]> {
    // Mock performance data
    return [
      { name: 'Page Load Time', value: 1.8, unit: 's', status: 'good', benchmark: 3.0 },
      { name: 'First Contentful Paint', value: 0.9, unit: 's', status: 'good', benchmark: 1.8 },
      { name: 'Time to Interactive', value: 2.4, unit: 's', status: 'warning', benchmark: 3.9 },
      { name: 'Cumulative Layout Shift', value: 0.05, unit: '', status: 'good', benchmark: 0.1 },
      { name: 'API Latency (avg)', value: 120, unit: 'ms', status: 'good', benchmark: 500 },
      { name: 'Error Rate', value: 0.2, unit: '%', status: 'good', benchmark: 1.0 },
    ];
  }

  /**
   * Track an event
   */
  async trackEvent(
    eventName: string,
    eventCategory: string,
    sessionId: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    if (!this.userId) return;

    try {
      await supabase.rpc('track_analytics_event', {
        p_user_id: this.userId,
        p_event_name: eventName,
        p_event_category: eventCategory,
        p_session_id: sessionId,
        p_properties: properties || {},
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(featureName: string, featureCategory: string): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('analytics_feature_usage')
        .upsert({
          user_id: this.userId,
          feature_name: featureName,
          feature_category: featureCategory,
          last_used_at: new Date().toISOString(),
          usage_count: 1,
        }, {
          onConflict: 'user_id,feature_name',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }

  // ============================================
  // Mock Data Generators
  // ============================================

  private getMockSummary(): AnalyticsSummary {
    return {
      totalViews: 45892,
      totalSessions: 2341,
      totalExports: 892,
      totalAIGenerations: 456,
      totalAssetsCreated: 234,
      avgSessionDuration: 485,
      bounceRate: 0.32,
    };
  }

  private generateMockTimeSeries(
    start: Date,
    end: Date,
    minValue: number,
    maxValue: number
  ): TimeSeriesPoint[] {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const data: TimeSeriesPoint[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      // Generate realistic-looking data with weekly patterns
      const dayOfWeek = date.getDay();
      const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1;
      const trendFactor = 1 + (i / days) * 0.2; // Slight upward trend
      const randomFactor = 0.7 + Math.random() * 0.6;

      const value = Math.round(
        minValue + (maxValue - minValue) * weekendFactor * trendFactor * randomFactor
      );

      data.push({
        date: formatDateForQuery(date),
        value,
      });
    }

    return data;
  }

  private getMockFeatureUsage(): FeatureUsageData[] {
    return [
      { name: 'Canvas Editor', category: 'design', users: 1850, totalUses: 12500, avgDuration: 420, trend: 12 },
      { name: 'AI Image Generator', category: 'ai', users: 1200, totalUses: 8900, avgDuration: 45, trend: 35 },
      { name: 'Template Gallery', category: 'templates', users: 980, totalUses: 5600, avgDuration: 180, trend: 8 },
      { name: 'Video Studio', category: 'video', users: 650, totalUses: 2300, avgDuration: 890, trend: -5 },
      { name: 'PDF Suite', category: 'documents', users: 450, totalUses: 1800, avgDuration: 320, trend: 18 },
      { name: 'Brand Hub', category: 'branding', users: 320, totalUses: 890, avgDuration: 240, trend: 22 },
    ];
  }

  private getMockAIUsage(): AIUsageData[] {
    return [
      { operationType: 'Image Generation', count: 2500, creditsUsed: 5000, avgLatency: 3200, successRate: 94 },
      { operationType: 'Background Removal', count: 1800, creditsUsed: 1800, avgLatency: 1500, successRate: 98 },
      { operationType: 'Image Upscaling', count: 950, creditsUsed: 1900, avgLatency: 2800, successRate: 96 },
      { operationType: 'Style Transfer', count: 420, creditsUsed: 840, avgLatency: 4500, successRate: 91 },
      { operationType: 'Text Generation', count: 380, creditsUsed: 380, avgLatency: 800, successRate: 99 },
    ];
  }
}

// Export singleton instance
export const analyticsDataService = new AnalyticsDataService();
export default analyticsDataService;
