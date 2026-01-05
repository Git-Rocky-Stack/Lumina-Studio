// Activity Heatmap Service - Visual timeline of edits, most-changed areas
// Tracks user activity and generates heatmap visualizations

import { supabase } from '../lib/supabase';

// ============================================
// Types
// ============================================

export interface ActivityLogEntry {
  id: string;
  userId: string;
  projectId?: string;
  actionType: ActivityActionType;
  elementId?: string;
  elementType?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  changes?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
  sessionId?: string;
  createdAt: Date;
}

export type ActivityActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'resize'
  | 'style'
  | 'transform'
  | 'group'
  | 'ungroup'
  | 'duplicate'
  | 'paste'
  | 'select'
  | 'deselect';

export interface HeatmapCell {
  gridX: number;
  gridY: number;
  intensity: number; // 0-1
  actionCounts: Record<ActivityActionType, number>;
  totalActions: number;
  mostCommonAction: ActivityActionType;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  gridSize: number;
  maxIntensity: number;
  periodStart: Date;
  periodEnd: Date;
  totalActions: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface ActivityAggregate {
  id: string;
  userId: string;
  projectId?: string;
  periodStart: Date;
  periodEnd: Date;
  periodType: 'hour' | 'day' | 'week';
  gridX?: number;
  gridY?: number;
  gridSize: number;
  actionCounts: Record<string, number>;
  totalActions: number;
  uniqueElements: number;
}

export interface TimelineEntry {
  timestamp: Date;
  actionType: ActivityActionType;
  elementType?: string;
  count: number;
}

export interface ActivityStats {
  totalActions: number;
  actionsByType: Record<ActivityActionType, number>;
  mostActiveHour: number;
  mostActiveDayOfWeek: number;
  averageActionsPerSession: number;
  topElementTypes: { type: string; count: number }[];
  hotspots: { x: number; y: number; intensity: number }[];
}

// ============================================
// Activity Heatmap Service Class
// ============================================

class ActivityHeatmapService {
  private currentSessionId: string;
  private activityBuffer: ActivityLogEntry[] = [];
  private bufferFlushInterval: number | null = null;
  private readonly BUFFER_FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly BUFFER_MAX_SIZE = 50;
  private readonly DEFAULT_GRID_SIZE = 50; // pixels per cell

  constructor() {
    this.currentSessionId = this.generateSessionId();
  }

  // ============================================
  // Session Management
  // ============================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startSession(): string {
    this.currentSessionId = this.generateSessionId();
    this.startBufferFlush();
    return this.currentSessionId;
  }

  endSession(): void {
    this.stopBufferFlush();
    this.flushBuffer();
  }

  private startBufferFlush(): void {
    if (this.bufferFlushInterval) return;

    this.bufferFlushInterval = window.setInterval(() => {
      this.flushBuffer();
    }, this.BUFFER_FLUSH_INTERVAL);
  }

  private stopBufferFlush(): void {
    if (this.bufferFlushInterval) {
      window.clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }
  }

  // ============================================
  // Activity Logging
  // ============================================

  logActivity(
    actionType: ActivityActionType,
    data: {
      projectId?: string;
      elementId?: string;
      elementType?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      changes?: Record<string, unknown>;
      previousValue?: unknown;
      newValue?: unknown;
    }
  ): void {
    const entry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      userId: '', // Will be set when flushing
      projectId: data.projectId,
      actionType,
      elementId: data.elementId,
      elementType: data.elementType,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      changes: data.changes,
      previousValue: data.previousValue,
      newValue: data.newValue,
      sessionId: this.currentSessionId,
      createdAt: new Date(),
    };

    this.activityBuffer.push(entry);

    if (this.activityBuffer.length >= this.BUFFER_MAX_SIZE) {
      this.flushBuffer();
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.activityBuffer.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const entries = this.activityBuffer.map(entry => ({
      user_id: user.id,
      project_id: entry.projectId,
      action_type: entry.actionType,
      element_id: entry.elementId,
      element_type: entry.elementType,
      x: entry.x,
      y: entry.y,
      width: entry.width,
      height: entry.height,
      changes: entry.changes,
      previous_value: entry.previousValue,
      new_value: entry.newValue,
      session_id: entry.sessionId,
      created_at: entry.createdAt.toISOString(),
    }));

    this.activityBuffer = [];

    const { error } = await supabase
      .from('activity_log')
      .insert(entries);

    if (error) {
      console.error('Failed to flush activity buffer:', error);
      // Re-add failed entries to buffer
      // this.activityBuffer.unshift(...entries); // Commented to avoid infinite loop
    }
  }

  // ============================================
  // Heatmap Generation
  // ============================================

  async generateHeatmap(
    projectId: string,
    options: {
      periodStart?: Date;
      periodEnd?: Date;
      gridSize?: number;
      canvasWidth?: number;
      canvasHeight?: number;
    } = {}
  ): Promise<HeatmapData | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const periodEnd = options.periodEnd || new Date();
    const periodStart = options.periodStart || new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const gridSize = options.gridSize || this.DEFAULT_GRID_SIZE;
    const canvasWidth = options.canvasWidth || 1920;
    const canvasHeight = options.canvasHeight || 1080;

    // Fetch activity data
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString())
      .not('x', 'is', null)
      .not('y', 'is', null);

    if (error || !activities) {
      console.error('Failed to fetch activity data:', error);
      return null;
    }

    // Generate heatmap cells
    const cellMap = new Map<string, HeatmapCell>();
    let maxIntensity = 0;

    for (const activity of activities) {
      const gridX = Math.floor(activity.x / gridSize);
      const gridY = Math.floor(activity.y / gridSize);
      const key = `${gridX},${gridY}`;

      if (!cellMap.has(key)) {
        cellMap.set(key, {
          gridX,
          gridY,
          intensity: 0,
          actionCounts: {} as Record<ActivityActionType, number>,
          totalActions: 0,
          mostCommonAction: activity.action_type as ActivityActionType,
        });
      }

      const cell = cellMap.get(key)!;
      const actionType = activity.action_type as ActivityActionType;
      cell.actionCounts[actionType] = (cell.actionCounts[actionType] || 0) + 1;
      cell.totalActions++;

      // Update most common action
      let maxCount = 0;
      for (const [action, count] of Object.entries(cell.actionCounts)) {
        if (count > maxCount) {
          maxCount = count;
          cell.mostCommonAction = action as ActivityActionType;
        }
      }

      if (cell.totalActions > maxIntensity) {
        maxIntensity = cell.totalActions;
      }
    }

    // Normalize intensity
    const cells = Array.from(cellMap.values()).map(cell => ({
      ...cell,
      intensity: maxIntensity > 0 ? cell.totalActions / maxIntensity : 0,
    }));

    return {
      cells,
      gridSize,
      maxIntensity,
      periodStart,
      periodEnd,
      totalActions: activities.length,
      canvasWidth,
      canvasHeight,
    };
  }

  // ============================================
  // Timeline Generation
  // ============================================

  async getActivityTimeline(
    projectId: string,
    options: {
      periodStart?: Date;
      periodEnd?: Date;
      interval?: 'hour' | 'day' | 'week';
    } = {}
  ): Promise<TimelineEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const periodEnd = options.periodEnd || new Date();
    const periodStart = options.periodStart || new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const interval = options.interval || 'day';

    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('action_type, element_type, created_at')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString())
      .order('created_at', { ascending: true });

    if (error || !activities) {
      console.error('Failed to fetch timeline data:', error);
      return [];
    }

    // Group by interval
    const timelineMap = new Map<string, TimelineEntry>();

    for (const activity of activities) {
      const date = new Date(activity.created_at);
      let key: string;

      switch (interval) {
        case 'hour':
          key = `${date.toISOString().slice(0, 13)}:00:00`;
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
      }

      const entryKey = `${key}_${activity.action_type}`;

      if (!timelineMap.has(entryKey)) {
        timelineMap.set(entryKey, {
          timestamp: new Date(key),
          actionType: activity.action_type as ActivityActionType,
          elementType: activity.element_type,
          count: 0,
        });
      }

      timelineMap.get(entryKey)!.count++;
    }

    return Array.from(timelineMap.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  // ============================================
  // Activity Statistics
  // ============================================

  async getActivityStats(
    projectId?: string,
    periodDays: number = 30
  ): Promise<ActivityStats | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    let query = supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', periodStart.toISOString());

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: activities, error } = await query;

    if (error || !activities) {
      console.error('Failed to fetch activity stats:', error);
      return null;
    }

    // Calculate statistics
    const actionsByType: Record<ActivityActionType, number> = {} as Record<ActivityActionType, number>;
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    const elementTypeCounts: Record<string, number> = {};
    const sessionCounts: Record<string, number> = {};
    const positionCounts = new Map<string, { x: number; y: number; count: number }>();

    for (const activity of activities) {
      // Count by action type
      const actionType = activity.action_type as ActivityActionType;
      actionsByType[actionType] = (actionsByType[actionType] || 0) + 1;

      // Count by hour
      const hour = new Date(activity.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      // Count by day of week
      const day = new Date(activity.created_at).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;

      // Count by element type
      if (activity.element_type) {
        elementTypeCounts[activity.element_type] = (elementTypeCounts[activity.element_type] || 0) + 1;
      }

      // Count by session
      if (activity.session_id) {
        sessionCounts[activity.session_id] = (sessionCounts[activity.session_id] || 0) + 1;
      }

      // Track positions for hotspots
      if (activity.x !== null && activity.y !== null) {
        const gridX = Math.floor(activity.x / 100);
        const gridY = Math.floor(activity.y / 100);
        const key = `${gridX},${gridY}`;

        if (!positionCounts.has(key)) {
          positionCounts.set(key, { x: gridX * 100 + 50, y: gridY * 100 + 50, count: 0 });
        }
        positionCounts.get(key)!.count++;
      }
    }

    // Find most active hour
    let mostActiveHour = 0;
    let maxHourCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        mostActiveHour = parseInt(hour);
      }
    }

    // Find most active day
    let mostActiveDayOfWeek = 0;
    let maxDayCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostActiveDayOfWeek = parseInt(day);
      }
    }

    // Calculate average actions per session
    const sessionList = Object.values(sessionCounts);
    const averageActionsPerSession = sessionList.length > 0
      ? sessionList.reduce((a, b) => a + b, 0) / sessionList.length
      : 0;

    // Get top element types
    const topElementTypes = Object.entries(elementTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get hotspots
    const maxPositionCount = Math.max(...Array.from(positionCounts.values()).map(p => p.count), 1);
    const hotspots = Array.from(positionCounts.values())
      .map(p => ({ x: p.x, y: p.y, intensity: p.count / maxPositionCount }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 20);

    return {
      totalActions: activities.length,
      actionsByType,
      mostActiveHour,
      mostActiveDayOfWeek,
      averageActionsPerSession,
      topElementTypes,
      hotspots,
    };
  }

  // ============================================
  // Aggregation (for performance optimization)
  // ============================================

  async generateAggregates(
    projectId: string,
    periodType: 'hour' | 'day' | 'week'
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Determine period boundaries
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (periodType) {
      case 'hour':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
        periodStart = new Date(periodEnd.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodStart = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    // Fetch activities for the period
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString());

    if (error || !activities) {
      console.error('Failed to fetch activities for aggregation:', error);
      return;
    }

    // Group by grid cell
    const gridSize = this.DEFAULT_GRID_SIZE;
    const aggregateMap = new Map<string, {
      gridX: number;
      gridY: number;
      actionCounts: Record<string, number>;
      uniqueElements: Set<string>;
    }>();

    for (const activity of activities) {
      if (activity.x === null || activity.y === null) continue;

      const gridX = Math.floor(activity.x / gridSize);
      const gridY = Math.floor(activity.y / gridSize);
      const key = `${gridX},${gridY}`;

      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, {
          gridX,
          gridY,
          actionCounts: {},
          uniqueElements: new Set(),
        });
      }

      const aggregate = aggregateMap.get(key)!;
      aggregate.actionCounts[activity.action_type] =
        (aggregate.actionCounts[activity.action_type] || 0) + 1;

      if (activity.element_id) {
        aggregate.uniqueElements.add(activity.element_id);
      }
    }

    // Insert aggregates
    const aggregates = Array.from(aggregateMap.values()).map(agg => ({
      user_id: user.id,
      project_id: projectId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      period_type: periodType,
      grid_x: agg.gridX,
      grid_y: agg.gridY,
      grid_size: gridSize,
      action_counts: agg.actionCounts,
      total_actions: Object.values(agg.actionCounts).reduce((a, b) => a + b, 0),
      unique_elements: agg.uniqueElements.size,
    }));

    if (aggregates.length > 0) {
      const { error: insertError } = await supabase
        .from('activity_aggregates')
        .upsert(aggregates, {
          onConflict: 'user_id,project_id,period_start,grid_x,grid_y'
        });

      if (insertError) {
        console.error('Failed to insert aggregates:', insertError);
      }
    }
  }

  // ============================================
  // Heatmap Color Utilities
  // ============================================

  getHeatmapColor(intensity: number, actionType?: ActivityActionType): string {
    // Color schemes by action type
    const colorSchemes: Record<string, { low: string; high: string }> = {
      create: { low: '#22c55e20', high: '#22c55e' },   // Green
      update: { low: '#3b82f620', high: '#3b82f6' },   // Blue
      delete: { low: '#ef444420', high: '#ef4444' },   // Red
      move: { low: '#f59e0b20', high: '#f59e0b' },     // Orange
      resize: { low: '#8b5cf620', high: '#8b5cf6' },   // Purple
      style: { low: '#ec489920', high: '#ec4899' },    // Pink
      default: { low: '#6366f120', high: '#6366f1' },  // Indigo
    };

    const scheme = colorSchemes[actionType || 'default'] || colorSchemes.default;

    // Interpolate between low and high colors based on intensity
    return this.interpolateColor(scheme.low, scheme.high, intensity);
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    // Parse colors (assumes hex format)
    const parseColor = (color: string) => {
      const hex = color.replace('#', '');
      const hasAlpha = hex.length === 8;
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hasAlpha ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      };
    };

    const c1 = parseColor(color1);
    const c2 = parseColor(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    const a = c1.a + (c2.a - c1.a) * factor;

    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    }
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

// Export singleton instance
export const activityHeatmapService = new ActivityHeatmapService();
