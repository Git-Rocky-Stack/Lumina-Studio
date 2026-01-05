// Activity Heatmap Panel - Visual timeline of edits, most-changed areas
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  Target,
  BarChart2,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  activityHeatmapService,
  HeatmapData,
  HeatmapCell,
  ActivityStats,
  TimelineEntry,
  ActivityActionType,
} from '../../services/activityHeatmapService';

interface HeatmapPanelProps {
  projectId: string;
  canvasWidth?: number;
  canvasHeight?: number;
  onClose?: () => void;
}

export const HeatmapPanel: React.FC<HeatmapPanelProps> = ({
  projectId,
  canvasWidth = 1920,
  canvasHeight = 1080,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'timeline' | 'stats'>('heatmap');
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedActionType, setSelectedActionType] = useState<ActivityActionType | 'all'>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [projectId, selectedPeriod]);

  const loadData = async () => {
    setIsLoading(true);

    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [heatmap, timeline, activityStats] = await Promise.all([
      activityHeatmapService.generateHeatmap(projectId, {
        periodStart,
        canvasWidth,
        canvasHeight,
      }),
      activityHeatmapService.getActivityTimeline(projectId, { periodStart }),
      activityHeatmapService.getActivityStats(projectId, days),
    ]);

    setHeatmapData(heatmap);
    setTimelineData(timeline);
    setStats(activityStats);
    setIsLoading(false);
  };

  // Render heatmap to canvas
  useEffect(() => {
    if (!heatmapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter cells by action type
    const cells = selectedActionType === 'all'
      ? heatmapData.cells
      : heatmapData.cells.filter(c => c.mostCommonAction === selectedActionType);

    // Draw heatmap cells
    for (const cell of cells) {
      const x = cell.gridX * heatmapData.gridSize;
      const y = cell.gridY * heatmapData.gridSize;

      ctx.fillStyle = activityHeatmapService.getHeatmapColor(
        cell.intensity,
        cell.mostCommonAction
      );
      ctx.fillRect(x, y, heatmapData.gridSize, heatmapData.gridSize);
    }
  }, [heatmapData, selectedActionType]);

  // Format action type for display
  const formatActionType = (type: ActivityActionType): string => {
    const labels: Record<ActivityActionType, string> = {
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      move: 'Move',
      resize: 'Resize',
      style: 'Style',
      transform: 'Transform',
      group: 'Group',
      ungroup: 'Ungroup',
      duplicate: 'Duplicate',
      paste: 'Paste',
      select: 'Select',
      deselect: 'Deselect',
    };
    return labels[type] || type;
  };

  // Action type colors
  const actionColors: Record<ActivityActionType, string> = {
    create: '#22c55e',
    update: '#3b82f6',
    delete: '#ef4444',
    move: '#f59e0b',
    resize: '#8b5cf6',
    style: '#ec4899',
    transform: '#14b8a6',
    group: '#6366f1',
    ungroup: '#a855f7',
    duplicate: '#06b6d4',
    paste: '#84cc16',
    select: '#64748b',
    deselect: '#94a3b8',
  };

  // Day of week labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Activity Heatmap</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`p-1.5 rounded ${showOverlay ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
            title={showOverlay ? 'Hide overlay' : 'Show overlay'}
          >
            {showOverlay ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={loadData}
            className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <Calendar size={14} className="text-gray-400" />
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
          className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>

        <Filter size={14} className="text-gray-400 ml-2" />
        <select
          value={selectedActionType}
          onChange={e => setSelectedActionType(e.target.value as typeof selectedActionType)}
          className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
        >
          <option value="all">All Actions</option>
          {Object.keys(actionColors).map(type => (
            <option key={type} value={type}>
              {formatActionType(type as ActivityActionType)}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['heatmap', 'timeline', 'stats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'heatmap' && <Target className="inline w-4 h-4 mr-1" />}
            {tab === 'timeline' && <Clock className="inline w-4 h-4 mr-1" />}
            {tab === 'stats' && <BarChart2 className="inline w-4 h-4 mr-1" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Heatmap Tab */}
            {activeTab === 'heatmap' && heatmapData && (
              <div className="space-y-4">
                {/* Heatmap Canvas */}
                <div className="relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={Math.min(canvasWidth / 4, 400)}
                    height={Math.min(canvasHeight / 4, 300)}
                    className="w-full"
                    style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
                  />

                  {/* Legend */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded text-xs">
                    <span className="text-gray-500">Low</span>
                    <div className="flex">
                      {[0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
                        <div
                          key={intensity}
                          className="w-4 h-3"
                          style={{
                            backgroundColor: activityHeatmapService.getHeatmapColor(
                              intensity,
                              selectedActionType === 'all' ? undefined : selectedActionType
                            ),
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-gray-500">High</span>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Total Actions</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {heatmapData.totalActions.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Active Areas</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {heatmapData.cells.length}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Peak Activity</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {heatmapData.maxIntensity}
                    </div>
                  </div>
                </div>

                {/* Hotspots */}
                {stats?.hotspots && stats.hotspots.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hotspots
                    </h3>
                    <div className="space-y-2">
                      {stats.hotspots.slice(0, 5).map((hotspot, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: `rgba(249, 115, 22, ${hotspot.intensity})`,
                              }}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              ({Math.round(hotspot.x)}, {Math.round(hotspot.y)})
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(hotspot.intensity * 100)}% activity
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {timelineData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No activity in this period</p>
                  </div>
                ) : (
                  <>
                    {/* Timeline Chart (simple bar representation) */}
                    <div className="h-32 flex items-end gap-1">
                      {timelineData.slice(-30).map((entry, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${Math.min(100, (entry.count / Math.max(...timelineData.map(e => e.count))) * 100)}%`,
                            backgroundColor: actionColors[entry.actionType] || '#6366f1',
                            minHeight: '4px',
                          }}
                          title={`${entry.timestamp.toLocaleDateString()}: ${entry.count} ${entry.actionType}`}
                        />
                      ))}
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {timelineData.slice().reverse().slice(0, 20).map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: actionColors[entry.actionType] }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {formatActionType(entry.actionType)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{entry.count}x</span>
                            <span>{entry.timestamp.toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-4">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Total Actions</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalActions.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Avg/Session</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {Math.round(stats.averageActionsPerSession)}
                    </div>
                  </div>
                </div>

                {/* Most Active Time */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Peak Activity
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dayLabels[stats.mostActiveDayOfWeek]}s at{' '}
                        {stats.mostActiveHour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="text-xs text-gray-500">
                        Your most productive time
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions by Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions by Type
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.actionsByType)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([type, count]) => {
                        const percentage = (count / stats.totalActions) * 100;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: actionColors[type as ActivityActionType] }}
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {formatActionType(type as ActivityActionType)}
                                </span>
                              </div>
                              <span className="text-gray-500">{count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: actionColors[type as ActivityActionType],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Top Element Types */}
                {stats.topElementTypes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Most Edited Elements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.topElementTypes.slice(0, 5).map(({ type, count }) => (
                        <div
                          key={type}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400"
                        >
                          {type} ({count})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HeatmapPanel;
