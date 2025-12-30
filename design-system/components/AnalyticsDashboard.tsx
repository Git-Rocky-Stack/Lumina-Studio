import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalyticsData {
  views: number;
  downloads: number;
  shares: number;
  likes: number;
  comments: number;
  viewsHistory: { date: string; value: number }[];
  topAssets: { id: string; name: string; views: number; thumbnail?: string }[];
  engagementByType: { type: string; value: number; color: string }[];
  peakHours: { hour: number; value: number }[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  dateRange: '7d' | '30d' | '90d' | 'all';
  onDateRangeChange: (range: '7d' | '30d' | '90d' | 'all') => void;
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  dateRange,
  onDateRangeChange,
  className = '',
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'downloads' | 'shares'>('views');

  const stats = [
    { key: 'views', label: 'Total Views', value: data.views, icon: 'fa-eye', color: '#6366f1' },
    { key: 'downloads', label: 'Downloads', value: data.downloads, icon: 'fa-download', color: '#10b981' },
    { key: 'shares', label: 'Shares', value: data.shares, icon: 'fa-share-nodes', color: '#f59e0b' },
    { key: 'likes', label: 'Likes', value: data.likes, icon: 'fa-heart', color: '#ef4444' },
    { key: 'comments', label: 'Comments', value: data.comments, icon: 'fa-comment', color: '#8b5cf6' },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const maxViewsValue = Math.max(...data.viewsHistory.map(v => v.value));

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="type-subsection text-slate-900 dark:text-white flex items-center gap-2">
          <i className="fas fa-chart-line text-accent" />
          Analytics Dashboard
        </h2>

        {/* Date range selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => onDateRangeChange(range)}
              className={`px-3 py-1.5 rounded-lg type-body-sm font-semibold transition-colors ${
                dateRange === range
                  ? 'bg-accent text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {range === 'all' ? 'All Time' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedMetric(stat.key as any)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <i className={`fas ${stat.icon}`} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatNumber(stat.value)}
            </div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Views Chart */}
      <div className="mb-8">
        <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Views Over Time
        </h3>
        <div className="h-48 flex items-end gap-1">
          {data.viewsHistory.map((point, index) => (
            <motion.div
              key={point.date}
              initial={{ height: 0 }}
              animate={{ height: `${(point.value / maxViewsValue) * 100}%` }}
              transition={{ delay: index * 0.02, type: 'spring', stiffness: 300 }}
              className="flex-1 bg-accent/20 hover:bg-accent/40 rounded-t-lg relative group cursor-pointer"
            >
              <div
                className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-lg transition-all"
                style={{ height: `${(point.value / maxViewsValue) * 100}%` }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {formatNumber(point.value)} views
                <br />
                {point.date}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Assets */}
        <div>
          <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Top Performing Assets
          </h3>
          <div className="space-y-3">
            {data.topAssets.slice(0, 5).map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <div className="text-lg font-bold text-slate-400 w-6">{index + 1}</div>
                {asset.thumbnail ? (
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <i className="fas fa-image text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white truncate">
                    {asset.name}
                  </div>
                  <div className="text-sm text-slate-500">{formatNumber(asset.views)} views</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Engagement by Type */}
        <div>
          <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Engagement by Content Type
          </h3>
          <div className="space-y-4">
            {data.engagementByType.map((item, index) => {
              const maxValue = Math.max(...data.engagementByType.map(i => i.value));
              const percentage = (item.value / maxValue) * 100;

              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{item.type}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatNumber(item.value)}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Peak Hours */}
          <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 mt-6 mb-4">
            Peak Activity Hours
          </h3>
          <div className="flex items-end gap-1 h-20">
            {data.peakHours.map((hour, index) => {
              const maxValue = Math.max(...data.peakHours.map(h => h.value));
              const percentage = (hour.value / maxValue) * 100;

              return (
                <motion.div
                  key={hour.hour}
                  initial={{ height: 0 }}
                  animate={{ height: `${percentage}%` }}
                  transition={{ delay: index * 0.02 }}
                  className="flex-1 bg-accent/30 hover:bg-accent/50 rounded-t relative group cursor-pointer"
                  title={`${hour.hour}:00 - ${formatNumber(hour.value)} activities`}
                >
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">
                    {hour.hour % 6 === 0 ? `${hour.hour}h` : ''}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export button */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <motion.button
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg type-body-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className="fas fa-download mr-2" />
          Export Report
        </motion.button>
      </div>
    </div>
  );
};

// Mini Stats Widget for sidebar
interface MiniStatsProps {
  views: number;
  trend: number; // percentage change
  className?: string;
}

export const MiniStats: React.FC<MiniStatsProps> = ({ views, trend, className = '' }) => {
  const isPositive = trend >= 0;

  return (
    <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">Total Views</span>
        <span
          className={`text-xs font-medium ${
            isPositive ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} mr-1`} />
          {Math.abs(trend)}%
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">
        {views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views}
      </div>
    </div>
  );
};

// Activity Sparkline
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#6366f1',
  height = 40,
  className = '',
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={className} style={{ height }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        <polygon
          fill="url(#sparklineGradient)"
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    </div>
  );
};

export default AnalyticsDashboard;
