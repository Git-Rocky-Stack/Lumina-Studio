/**
 * useAnalytics Hook
 *
 * React hook for analytics data fetching and state management.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import {
  analyticsDataService,
  type DashboardData,
  type DateRange,
  type AnalyticsSummary,
} from '../services/analyticsDataService';

export interface UseAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

export interface UseAnalyticsReturn {
  data: DashboardData | null;
  summary: AnalyticsSummary | null;
  isLoading: boolean;
  error: Error | null;
  dateRange: DateRange['label'];
  setDateRange: (range: DateRange['label']) => void;
  refresh: () => Promise<void>;
  trackEvent: (eventName: string, properties?: Record<string, unknown>) => void;
  trackFeature: (featureName: string, category: string) => void;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  const { userId } = useAuthContext();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateRange, setDateRange] = useState<DateRange['label']>('30d');

  // Set user ID on service
  useEffect(() => {
    analyticsDataService.setUserId(userId);
  }, [userId]);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dashboardData = await analyticsDataService.getDashboardData(dateRange);
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Track event
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      const sessionId = sessionStorage.getItem('lumina_analytics_session') || 'unknown';
      analyticsDataService.trackEvent(eventName, 'user_action', sessionId, properties);
    },
    []
  );

  // Track feature usage
  const trackFeature = useCallback(
    (featureName: string, category: string) => {
      analyticsDataService.trackFeatureUsage(featureName, category);
    },
    []
  );

  // Memoized summary
  const summary = useMemo(() => data?.summary || null, [data]);

  return {
    data,
    summary,
    isLoading,
    error,
    dateRange,
    setDateRange,
    refresh: fetchData,
    trackEvent,
    trackFeature,
  };
}

/**
 * Lightweight hook for tracking only
 */
export function useAnalyticsTracking() {
  const { userId } = useAuthContext();

  useEffect(() => {
    analyticsDataService.setUserId(userId);
  }, [userId]);

  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      const sessionId = sessionStorage.getItem('lumina_analytics_session') || 'unknown';
      analyticsDataService.trackEvent(eventName, 'user_action', sessionId, properties);
    },
    []
  );

  const trackFeature = useCallback(
    (featureName: string, category: string) => {
      analyticsDataService.trackFeatureUsage(featureName, category);
    },
    []
  );

  const trackPageView = useCallback((pagePath: string) => {
    const sessionId = sessionStorage.getItem('lumina_analytics_session') || 'unknown';
    analyticsDataService.trackEvent('page_view', 'page_view', sessionId, { path: pagePath });
  }, []);

  return {
    trackEvent,
    trackFeature,
    trackPageView,
  };
}

export default useAnalytics;
