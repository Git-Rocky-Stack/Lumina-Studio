/**
 * Enhanced Analytics Components
 * Project insights, Export history, Popular assets, Usage stats
 */

import React, { useState } from 'react';

// ============================================================================
// PROJECT INSIGHTS
// ============================================================================

interface ProjectInsight {
  projectId: string;
  projectName: string;
  totalTime: number; // in minutes
  sessions: number;
  revisions: number;
  collaborators: number;
  lastAccessed: Date;
  createdAt: Date;
  exportCount: number;
  viewCount: number;
  commentCount: number;
}

interface ProjectInsightsProps {
  insights: ProjectInsight;
  className?: string;
}

export const ProjectInsights: React.FC<ProjectInsightsProps> = ({
  insights,
  className = '',
}) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const stats = [
    { label: 'Time Spent', value: formatDuration(insights.totalTime), icon: 'fa-clock', color: 'text-blue-500 bg-blue-50' },
    { label: 'Sessions', value: insights.sessions.toString(), icon: 'fa-desktop', color: 'text-violet-500 bg-violet-50' },
    { label: 'Revisions', value: insights.revisions.toString(), icon: 'fa-code-branch', color: 'text-amber-500 bg-amber-50' },
    { label: 'Collaborators', value: insights.collaborators.toString(), icon: 'fa-users', color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Exports', value: insights.exportCount.toString(), icon: 'fa-download', color: 'text-rose-500 bg-rose-50' },
    { label: 'Views', value: insights.viewCount.toString(), icon: 'fa-eye', color: 'text-slate-500 bg-slate-50' },
  ];

  const daysSinceCreated = Math.floor((new Date().getTime() - insights.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const avgTimePerDay = insights.totalTime / (daysSinceCreated || 1);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Project Insights</h4>
        <span className="text-[10px] text-slate-400">
          Created {daysSinceCreated} days ago
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-white border border-slate-100 rounded-xl text-center hover:border-slate-200 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${stat.color}`}>
              <i className={`fas ${stat.icon}`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gradient-to-r from-accent/10 to-violet-500/10 rounded-xl border border-accent/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white">
            <i className="fas fa-chart-line" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Productivity Score</p>
            <p className="text-xs text-slate-500">
              Avg. {formatDuration(Math.round(avgTimePerDay))} per day • {insights.commentCount} comments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT HISTORY
// ============================================================================

interface ExportRecord {
  id: string;
  projectId: string;
  projectName: string;
  format: string;
  resolution: string;
  fileSize: string;
  exportedAt: Date;
  downloadUrl?: string;
  status: 'completed' | 'processing' | 'failed';
}

interface ExportHistoryProps {
  exports: ExportRecord[];
  onDownload?: (exportId: string) => void;
  onDelete?: (exportId: string) => void;
  onReExport?: (exportId: string) => void;
  className?: string;
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({
  exports,
  onDownload,
  onDelete,
  onReExport,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  const filteredExports = filter === 'all' ? exports : exports.filter(e => e.status === filter);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: ExportRecord['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'processing': return 'bg-amber-100 text-amber-700';
      case 'failed': return 'bg-rose-100 text-rose-700';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'mp4': case 'webm': case 'mov': return 'fa-video';
      case 'png': case 'jpg': case 'webp': return 'fa-image';
      case 'pdf': return 'fa-file-pdf';
      case 'svg': return 'fa-code';
      case 'gif': return 'fa-film';
      default: return 'fa-file';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Export History</h4>
        <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
          {(['all', 'completed', 'processing', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-white text-accent shadow-sm' : 'text-slate-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredExports.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <i className="fas fa-download text-2xl mb-2 opacity-50" />
            <p className="text-sm">No exports yet</p>
          </div>
        ) : (
          filteredExports.map((exp) => (
            <div
              key={exp.id}
              className="p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                  <i className={`fas ${getFormatIcon(exp.format)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-700 truncate">{exp.projectName}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusColor(exp.status)}`}>
                      {exp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {exp.format.toUpperCase()} • {exp.resolution} • {exp.fileSize}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">{formatDate(exp.exportedAt)}</p>
                  <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {exp.status === 'completed' && onDownload && (
                      <button
                        onClick={() => onDownload(exp.id)}
                        className="p-1.5 text-accent hover:bg-accent/10 rounded"
                      >
                        <i className="fas fa-download text-xs" />
                      </button>
                    )}
                    {exp.status === 'failed' && onReExport && (
                      <button
                        onClick={() => onReExport(exp.id)}
                        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded"
                      >
                        <i className="fas fa-redo text-xs" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded"
                      >
                        <i className="fas fa-trash text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// POPULAR ASSETS
// ============================================================================

interface PopularAsset {
  id: string;
  name: string;
  thumbnail: string;
  type: 'image' | 'video' | 'audio' | 'document';
  usageCount: number;
  lastUsed: Date;
  projectsUsedIn: number;
}

interface PopularAssetsProps {
  assets: PopularAsset[];
  onAssetClick: (asset: PopularAsset) => void;
  className?: string;
}

export const PopularAssets: React.FC<PopularAssetsProps> = ({
  assets,
  onAssetClick,
  className = '',
}) => {
  const typeIcons = {
    image: 'fa-image',
    video: 'fa-video',
    audio: 'fa-music',
    document: 'fa-file-lines',
  };

  const sortedAssets = [...assets].sort((a, b) => b.usageCount - a.usageCount);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Most Used Assets</h4>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          {assets.length} total
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sortedAssets.slice(0, 6).map((asset, idx) => (
          <button
            key={asset.id}
            onClick={() => onAssetClick(asset)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 hover:ring-2 hover:ring-accent transition-all"
          >
            <img
              src={asset.thumbnail}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs font-bold text-white truncate">{asset.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/70">
                    <i className={`fas ${typeIcons[asset.type]} mr-1`} />
                    {asset.usageCount} uses
                  </span>
                  <span className="text-[10px] text-white/70">
                    {asset.projectsUsedIn} projects
                  </span>
                </div>
              </div>
            </div>
            {idx < 3 && (
              <div className="absolute top-2 left-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {idx + 1}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// USAGE STATS WIDGET
// ============================================================================

interface UsageStats {
  aiCreditsUsed: number;
  aiCreditsTotal: number;
  storageUsed: number; // in MB
  storageTotal: number; // in MB
  exportsThisMonth: number;
  exportsLimit: number;
  collaboratorsCount: number;
  collaboratorsLimit: number;
}

interface UsageStatsWidgetProps {
  stats: UsageStats;
  onUpgrade?: () => void;
  className?: string;
}

export const UsageStatsWidget: React.FC<UsageStatsWidgetProps> = ({
  stats,
  onUpgrade,
  className = '',
}) => {
  const formatStorage = (mb: number) => {
    if (mb < 1024) return `${mb} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const getProgressColor = (used: number, total: number) => {
    const ratio = used / total;
    if (ratio >= 0.9) return 'bg-rose-500';
    if (ratio >= 0.7) return 'bg-amber-500';
    return 'bg-accent';
  };

  const items = [
    {
      label: 'AI Credits',
      used: stats.aiCreditsUsed,
      total: stats.aiCreditsTotal,
      format: (v: number) => v.toString(),
      icon: 'fa-sparkles',
    },
    {
      label: 'Storage',
      used: stats.storageUsed,
      total: stats.storageTotal,
      format: formatStorage,
      icon: 'fa-hard-drive',
    },
    {
      label: 'Exports',
      used: stats.exportsThisMonth,
      total: stats.exportsLimit,
      format: (v: number) => v.toString(),
      icon: 'fa-download',
    },
    {
      label: 'Team',
      used: stats.collaboratorsCount,
      total: stats.collaboratorsLimit,
      format: (v: number) => v.toString(),
      icon: 'fa-users',
    },
  ];

  return (
    <div className={`p-6 bg-white border border-slate-100 rounded-2xl ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-slate-700">Usage</h4>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="px-3 py-1 bg-gradient-to-r from-accent to-violet-500 text-white rounded-full text-[10px] font-bold hover:brightness-110 transition-all"
          >
            <i className="fas fa-rocket mr-1" />
            Upgrade
          </button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <i className={`fas ${item.icon} text-slate-400 text-xs`} />
                <span className="text-xs font-medium text-slate-600">{item.label}</span>
              </div>
              <span className="text-xs text-slate-500">
                {item.format(item.used)} / {item.format(item.total)}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(item.used, item.total)}`}
                style={{ width: `${Math.min(100, (item.used / item.total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MINI CHART (Sparkline)
// ============================================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showDots?: boolean;
  animated?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#6366f1',
  fillColor,
  showDots = false,
  animated = true,
  className = '',
}) => {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y, value };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={className}
      style={{ overflow: 'visible' }}
    >
      {fillColor && (
        <path
          d={areaD}
          fill={fillColor}
          opacity={0.2}
          className={animated ? 'animate-in fade-in duration-1000' : ''}
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-in fade-in duration-500' : ''}
        style={animated ? {
          strokeDasharray: 1000,
          strokeDashoffset: 1000,
          animation: 'sparkline-draw 1.5s ease-out forwards',
        } : {}}
      />
      {showDots && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={color}
          className={animated ? 'animate-in zoom-in duration-300' : ''}
          style={animated ? { animationDelay: `${i * 50}ms` } : {}}
        />
      ))}
      <style>{`
        @keyframes sparkline-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
};

export default {
  ProjectInsights,
  ExportHistory,
  PopularAssets,
  UsageStatsWidget,
  Sparkline,
};
