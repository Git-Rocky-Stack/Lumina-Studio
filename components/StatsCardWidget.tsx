import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MetricConfig {
  id: string;
  label: string;
  icon: string;
  fetchData: (period: string) => Promise<{ value: number; change: number; trend: 'up' | 'down' }>;
  formatter: (value: number) => string;
}

export interface StatsCardWidgetProps {
  title: string;
  metrics: MetricConfig[];
  refreshInterval?: number;
  onError?: (error: Error) => void;
  initialPeriod?: '1h' | '24h' | '7d' | '30d';
}

interface MetricData {
  value: number;
  change: number;
  trend: 'up' | 'down';
}

// ============================================================================
// Sub-components
// ============================================================================

// Skeleton Card Component
const SkeletonStatsCard: React.FC = () => {
  return (
    <div
      data-testid="skeleton-card"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse"
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: string;
  index: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, trend, icon, index }) => {
  const [valueChanged, setValueChanged] = useState(false);

  useEffect(() => {
    setValueChanged(true);
    const timer = setTimeout(() => setValueChanged(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <motion.div
      data-testid={`stat-card-${index}`}
      data-animated="true"
      data-animation-delay={index * 100}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</h3>
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
          <i className={`fas ${icon}`} aria-hidden="true"></i>
        </div>
      </div>
      <div
        className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
        data-testid="stat-value"
        data-value-changed={valueChanged ? 'true' : 'false'}
      >
        {value}
      </div>
      <div className="flex items-center text-sm">
        <span
          data-testid={trend === 'up' ? 'trend-up' : 'trend-down'}
          className={`font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
        </span>
      </div>
    </motion.div>
  );
};

// Toast Component
interface ToastProps {
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
      } text-white z-50`}
    >
      {message}
    </div>
  );
};

// Error State Component
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center">
      <p className="text-red-600 dark:text-red-400 mb-4">Failed to load metrics: {message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        aria-label="Retry loading metrics"
      >
        Retry
      </button>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const StatsCardWidget: React.FC<StatsCardWidgetProps> = ({
  title,
  metrics,
  refreshInterval = 5000,
  onError,
  initialPeriod = '1h',
}) => {
  // State
  const [metricData, setMetricData] = useState<Record<string, MetricData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '24h' | '7d' | '30d'>(initialPeriod);
  const [error, setError] = useState<Error | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  // Fetch data for all metrics
  const fetchAllMetrics = useCallback(async (period: string) => {
    // Prevent concurrent fetches
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsRefreshing(true);
    setError(null);

    try {
      const results = await Promise.all(
        metrics.map(async (metric) => {
          try {
            const data = await metric.fetchData(period);
            return { id: metric.id, data };
          } catch (err) {
            throw err;
          }
        })
      );

      if (!isMountedRef.current) return;

      const newData: Record<string, MetricData> = {};
      results.forEach(({ id, data }) => {
        newData[id] = data;
      });

      setMetricData(newData);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsLoading(false);

      if (onError) {
        onError(error);
      }

      setToast({
        message: error.message,
        type: 'error',
      });
    } finally {
      if (isMountedRef.current) {
        isLoadingRef.current = false;
        setIsRefreshing(false);
      }
    }
  }, [metrics, onError]);

  // Initial load and period changes
  useEffect(() => {
    isMountedRef.current = true;

    const loadData = async () => {
      await fetchAllMetrics(selectedPeriod);
    };

    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh interval
  useEffect(() => {
    if (isPaused || metrics.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchAllMetrics(selectedPeriod);
    }, refreshInterval);

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, selectedPeriod, refreshInterval, metrics.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    if (!isLoadingRef.current) {
      fetchAllMetrics(selectedPeriod);
    }
  }, [selectedPeriod, fetchAllMetrics]);

  // Handle pause/resume
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Handle period change - immediate for better UX
  const handlePeriodChange = useCallback((period: '1h' | '24h' | '7d' | '30d') => {
    setSelectedPeriod(period);
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchAllMetrics(selectedPeriod);
  }, [selectedPeriod, fetchAllMetrics]);

  // Time period options
  const periods: Array<'1h' | '24h' | '7d' | '30d'> = ['1h', '24h', '7d', '30d'];

  // Empty state
  if (metrics.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{title}</h2>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No metrics to display
        </div>
      </div>
    );
  }

  return (
    <div data-testid="stats-widget" className="p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>

        <div className="flex items-center gap-4">
          {/* Time Period Selector */}
          <div className="flex gap-2">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                aria-label={`Select ${period} time period`}
                aria-pressed={selectedPeriod === period}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Pause/Resume Button */}
          <button
            onClick={handleTogglePause}
            aria-label={isPaused ? 'Resume data updates' : 'Pause data updates'}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            aria-label="Refresh metrics"
            aria-busy={isRefreshing}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        data-testid="stats-grid"
        role="region"
        aria-label={title}
        aria-busy={isLoading}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {isLoading ? (
          // Skeleton Loading State
          metrics.map((_, index) => <SkeletonStatsCard key={index} />)
        ) : error ? (
          // Error State
          <div className="col-span-full">
            <ErrorState message={error.message} onRetry={handleRetry} />
          </div>
        ) : (
          // Stat Cards
          metrics.map((metric, index) => {
            const data = metricData[metric.id];
            if (!data) return null;

            return (
              <StatCard
                key={metric.id}
                label={metric.label}
                value={metric.formatter(data.value)}
                change={data.change}
                trend={data.trend}
                icon={metric.icon}
                index={index}
              />
            );
          })
        )}
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
