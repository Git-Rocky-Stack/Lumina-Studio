/**
 * Analytics Dashboard Page
 *
 * Comprehensive analytics visualization with interactive charts,
 * real-time metrics, and customizable widgets.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Download,
  Sparkles,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Zap,
  RefreshCw,
  Filter,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  FileImage,
  FileVideo,
  FileText,
  Layout,
  Loader2,
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

// ============================================
// Sub-Components
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, loading }) => {
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <div className="text-3xl font-bold text-slate-800">{value}</div>
      )}
      <div className="text-sm text-slate-500 mt-1">{title}</div>
    </motion.div>
  );
};

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, subtitle, children, action }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

// Simple Bar Chart Component
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showLabels?: boolean;
}

const SimpleBarChart: React.FC<BarChartProps> = ({ data, height = 200, showLabels = true }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ height }} className="flex items-end gap-2">
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
              className="w-full rounded-t-lg relative group cursor-pointer"
              style={{ backgroundColor: item.color || '#6366f1' }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {item.value.toLocaleString()}
              </div>
            </motion.div>
            {showLabels && (
              <span className="text-[10px] text-slate-400 truncate w-full text-center">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Line Chart Component (SVG-based)
interface LineChartProps {
  data: { date: string; value: number }[];
  height?: number;
  color?: string;
  showArea?: boolean;
}

const SimpleLineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = '#6366f1',
  showArea = true,
}) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((point.value - minValue) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div style={{ height }} className="relative">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {showArea && (
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
        )}
        {showArea && (
          <motion.polygon
            fill="url(#lineGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            points={areaPoints}
          />
        )}
        <motion.polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-400">
        {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((point, i) => (
          <span key={i}>{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        ))}
      </div>
    </div>
  );
};

// Donut Chart Component
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const segments = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (currentAngle - 90) * (Math.PI / 180);

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {segments.map((segment, index) => (
          <motion.path
            key={index}
            d={segment.path}
            fill={segment.color}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        ))}
        <circle cx="50" cy="50" r="25" fill="white" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold fill-slate-800">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-slate-600">{item.label}</span>
            <span className="text-sm font-semibold text-slate-800 ml-auto">
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Progress Bar
interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max, color }) => {
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold text-slate-800">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// ============================================
// Main Dashboard Component
// ============================================

const AnalyticsDashboardPage: React.FC = () => {
  const { data, isLoading, error, dateRange, setDateRange, refresh } = useAnalytics({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  // Prepare chart data
  const deviceChartData = useMemo(() => {
    if (!data?.deviceBreakdown) return [];
    const colors = ['#6366f1', '#10b981', '#f59e0b'];
    return data.deviceBreakdown.map((d, i) => ({
      label: d.device,
      value: d.percentage,
      color: colors[i % colors.length],
    }));
  }, [data?.deviceBreakdown]);

  const featureUsageData = useMemo(() => {
    if (!data?.featureUsage) return [];
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];
    return data.featureUsage.slice(0, 6).map((f, i) => ({
      label: f.name.split(' ')[0],
      value: f.totalUses,
      color: colors[i % colors.length],
    }));
  }, [data?.featureUsage]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Failed to load analytics</h2>
          <p className="text-slate-500 mb-4">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-indigo-500" />
              Analytics Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Track your performance and engagement metrics</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="12m">Last 12 months</option>
                <option value="all">All time</option>
              </select>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Views"
            value={formatNumber(data?.summary.totalViews || 0)}
            change={12}
            icon={<Eye className="w-6 h-6" />}
            color="#6366f1"
            loading={isLoading}
          />
          <StatCard
            title="Sessions"
            value={formatNumber(data?.summary.totalSessions || 0)}
            change={8}
            icon={<Users className="w-6 h-6" />}
            color="#10b981"
            loading={isLoading}
          />
          <StatCard
            title="Exports"
            value={formatNumber(data?.summary.totalExports || 0)}
            change={15}
            icon={<Download className="w-6 h-6" />}
            color="#f59e0b"
            loading={isLoading}
          />
          <StatCard
            title="AI Generations"
            value={formatNumber(data?.summary.totalAIGenerations || 0)}
            change={32}
            icon={<Sparkles className="w-6 h-6" />}
            color="#8b5cf6"
            loading={isLoading}
          />
          <StatCard
            title="Avg. Session"
            value={formatDuration(data?.summary.avgSessionDuration || 0)}
            change={-3}
            icon={<Clock className="w-6 h-6" />}
            color="#ec4899"
            loading={isLoading}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Views Over Time - Spans 2 columns */}
          <div className="col-span-2">
            <ChartContainer
              title="Views Over Time"
              subtitle="Page views and engagement trends"
            >
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                </div>
              ) : (
                <SimpleLineChart
                  data={data?.viewsOverTime || []}
                  height={250}
                  color="#6366f1"
                />
              )}
            </ChartContainer>
          </div>

          {/* Device Breakdown */}
          <ChartContainer title="Device Breakdown" subtitle="Users by device type">
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : (
              <DonutChart data={deviceChartData} />
            )}
          </ChartContainer>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Feature Usage */}
          <ChartContainer title="Feature Usage" subtitle="Most used features">
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : (
              <SimpleBarChart data={featureUsageData} height={200} />
            )}
          </ChartContainer>

          {/* Top Assets */}
          <ChartContainer title="Top Performing Assets" subtitle="By views and downloads">
            <div className="space-y-4">
              {(data?.topAssets || []).slice(0, 5).map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="text-lg font-bold text-slate-300 w-6">{index + 1}</div>
                  <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                    {asset.type === 'image' && <FileImage className="w-5 h-5 text-slate-500" />}
                    {asset.type === 'video' && <FileVideo className="w-5 h-5 text-slate-500" />}
                    {asset.type === 'pdf' && <FileText className="w-5 h-5 text-slate-500" />}
                    {asset.type === 'template' && <Layout className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{asset.name}</p>
                    <p className="text-sm text-slate-500">{formatNumber(asset.views)} views</p>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      asset.trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {asset.trend >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(asset.trend)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </ChartContainer>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* AI Usage */}
          <ChartContainer title="AI Usage" subtitle="Credits consumed by operation">
            <div className="space-y-4">
              {(data?.aiUsage || []).slice(0, 5).map((item, index) => (
                <ProgressBar
                  key={index}
                  label={item.operationType}
                  value={item.creditsUsed}
                  max={5000}
                  color={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'][index % 5]}
                />
              ))}
            </div>
          </ChartContainer>

          {/* Peak Hours */}
          <ChartContainer title="Peak Activity Hours" subtitle="When your users are most active">
            {isLoading ? (
              <div className="h-[150px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : (
              <div className="h-[150px] flex items-end gap-1">
                {(data?.peakHours || []).map((hour, index) => {
                  const maxValue = Math.max(...(data?.peakHours || []).map(h => h.value), 1);
                  const height = (hour.value / maxValue) * 100;
                  const isActive = hour.hour >= 9 && hour.hour <= 17;

                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex-1 rounded-t cursor-pointer transition-colors ${
                        isActive ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                      title={`${hour.hour}:00 - ${hour.value} activities`}
                    />
                  );
                })}
              </div>
            )}
            <div className="flex justify-between mt-2 text-[10px] text-slate-400">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>12am</span>
            </div>
          </ChartContainer>

          {/* Geographic Distribution */}
          <ChartContainer title="Top Countries" subtitle="Users by location">
            <div className="space-y-3">
              {(data?.geoDistribution || []).slice(0, 5).map((country, index) => {
                const maxUsers = Math.max(...(data?.geoDistribution || []).map(c => c.users), 1);
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                      <Globe className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700">{country.country}</span>
                        <span className="text-sm font-medium text-slate-800">
                          {formatNumber(country.users)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(country.users / maxUsers) * 100}%` }}
                          transition={{ delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartContainer>
        </div>

        {/* Conversion Funnel */}
        <ChartContainer
          title="Conversion Funnel"
          subtitle="User journey from landing to upgrade"
        >
          <div className="flex items-end justify-between gap-4">
            {(data?.funnel || []).map((step, index) => {
              const maxUsers = (data?.funnel || [])[0]?.users || 1;
              const height = (step.users / maxUsers) * 200;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="text-sm font-semibold text-slate-800 mb-1">
                    {formatNumber(step.users)}
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{step.conversionRate}%</div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ delay: index * 0.1, type: 'spring' }}
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg relative"
                    style={{ minHeight: 20 }}
                  >
                    {step.dropOffRate > 0 && (
                      <div className="absolute -right-2 top-0 transform translate-x-full">
                        <div className="text-[10px] text-red-500 font-medium">
                          -{step.dropOffRate}%
                        </div>
                      </div>
                    )}
                  </motion.div>
                  <div className="text-xs text-slate-500 mt-3 text-center max-w-[80px]">
                    {step.name}
                  </div>
                </div>
              );
            })}
          </div>
        </ChartContainer>

        {/* Performance Metrics */}
        <div className="mt-8">
          <ChartContainer
            title="Performance Metrics"
            subtitle="Core Web Vitals and app performance"
          >
            <div className="grid grid-cols-6 gap-4">
              {(data?.performance || []).map((metric, index) => {
                const statusColors = {
                  good: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
                  warning: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
                  critical: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
                };
                const colors = statusColors[metric.status];

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl ${colors.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {metric.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {metric.value}
                      <span className="text-sm font-normal text-slate-500">{metric.unit}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{metric.name}</div>
                  </motion.div>
                );
              })}
            </div>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;
