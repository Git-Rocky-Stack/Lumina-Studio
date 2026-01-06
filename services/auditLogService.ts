// Audit Log Service - Track all actions for compliance
import { supabase } from '../lib/supabase';

export type AuditActionType =
  | 'user.login'
  | 'user.logout'
  | 'user.password_change'
  | 'user.profile_update'
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'project.export'
  | 'project.share'
  | 'asset.upload'
  | 'asset.delete'
  | 'asset.download'
  | 'member.invite'
  | 'member.join'
  | 'member.remove'
  | 'member.role_change'
  | 'workspace.create'
  | 'workspace.update'
  | 'workspace.delete'
  | 'approval.submit'
  | 'approval.approve'
  | 'approval.reject'
  | 'approval.cancel'
  | 'settings.update'
  | 'sso.configure'
  | 'sso.login'
  | 'brand.update'
  | 'export.download'
  | 'api.access'
  | 'security.suspicious';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AuditStatus = 'success' | 'failure' | 'blocked';
export type ResourceType = 'user' | 'project' | 'asset' | 'member' | 'workspace' | 'approval' | 'settings' | 'sso' | 'brand';

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface AuditLogEntry {
  id: string;
  workspace_id?: string;
  user_id?: string;
  session_id?: string;
  action_type: AuditActionType;
  resource_type?: ResourceType;
  resource_id?: string;
  resource_name?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata: {
    ip_address?: string;
    user_agent?: string;
    device_info?: string;
    [key: string]: unknown;
  };
  ip_address?: string;
  user_agent?: string;
  geo_location?: GeoLocation;
  risk_level: RiskLevel;
  status: AuditStatus;
  error_message?: string;
  created_at: Date;
  // Joined data
  user?: {
    email: string;
    full_name?: string;
  };
}

export interface AuditRetentionPolicy {
  id: string;
  workspace_id: string;
  retention_days: number;
  action_types?: AuditActionType[];
  extended_retention_days: number;
  auto_export: boolean;
  export_destination?: {
    type: 's3' | 'gcs' | 'azure';
    bucket: string;
    prefix?: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface AuditLogExport {
  id: string;
  workspace_id: string;
  requested_by: string;
  date_range_start: Date;
  date_range_end: Date;
  filters?: {
    action_types?: AuditActionType[];
    user_ids?: string[];
    resource_types?: ResourceType[];
  };
  format: 'csv' | 'json' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size_bytes?: number;
  record_count?: number;
  created_at: Date;
  completed_at?: Date;
}

export interface AuditLogFilters {
  action_types?: AuditActionType[];
  user_ids?: string[];
  resource_types?: ResourceType[];
  risk_levels?: RiskLevel[];
  statuses?: AuditStatus[];
  start_date?: Date;
  end_date?: Date;
  search?: string;
}

interface LogEventOptions {
  workspace_id?: string;
  resource_type?: ResourceType;
  resource_id?: string;
  resource_name?: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
  risk_level?: RiskLevel;
  status?: AuditStatus;
  error_message?: string;
}

// Risk level mapping for different actions
const ACTION_RISK_LEVELS: Partial<Record<AuditActionType, RiskLevel>> = {
  'user.login': 'low',
  'user.logout': 'low',
  'user.password_change': 'medium',
  'project.create': 'low',
  'project.delete': 'medium',
  'project.export': 'low',
  'member.invite': 'low',
  'member.remove': 'medium',
  'member.role_change': 'medium',
  'workspace.delete': 'high',
  'settings.update': 'medium',
  'sso.configure': 'high',
  'security.suspicious': 'critical',
  'api.access': 'low',
};

class AuditLogService {
  private sessionId: string | null = null;
  private batchQueue: Omit<AuditLogEntry, 'id' | 'created_at'>[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 2000; // 2 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  // ==========================================
  // LOG EVENTS
  // ==========================================

  async logEvent(
    actionType: AuditActionType,
    options: LogEventOptions = {}
  ): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const entry: Omit<AuditLogEntry, 'id' | 'created_at'> = {
      workspace_id: options.workspace_id,
      user_id: user?.id,
      session_id: this.sessionId || undefined,
      action_type: actionType,
      resource_type: options.resource_type,
      resource_id: options.resource_id,
      resource_name: options.resource_name,
      changes: options.changes,
      metadata: {
        ...options.metadata,
        timestamp: new Date().toISOString(),
      },
      risk_level: options.risk_level || ACTION_RISK_LEVELS[actionType] || 'low',
      status: options.status || 'success',
      error_message: options.error_message,
    };

    // Add browser info if available
    if (typeof window !== 'undefined') {
      entry.user_agent = navigator.userAgent;
      entry.metadata.device_info = this.getDeviceInfo();
    }

    // Add to batch queue for efficiency
    this.batchQueue.push(entry);

    if (this.batchQueue.length >= this.BATCH_SIZE) {
      return this.flushBatch();
    }

    // Set timeout to flush batch
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushBatch(), this.BATCH_DELAY);
    }

    return 'queued';
  }

  private async flushBatch(): Promise<string | null> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length === 0) return null;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(batch)
      .select('id');

    if (error) {
      console.error('Error logging audit events:', error);
      // Re-queue failed entries
      this.batchQueue.push(...batch);
      return null;
    }

    return data?.[0]?.id || null;
  }

  // Immediate log (bypasses batching for critical events)
  async logImmediate(
    actionType: AuditActionType,
    options: LogEventOptions = {}
  ): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        workspace_id: options.workspace_id,
        user_id: user?.id,
        session_id: this.sessionId,
        action_type: actionType,
        resource_type: options.resource_type,
        resource_id: options.resource_id,
        resource_name: options.resource_name,
        changes: options.changes,
        metadata: options.metadata || {},
        risk_level: options.risk_level || ACTION_RISK_LEVELS[actionType] || 'low',
        status: options.status || 'success',
        error_message: options.error_message,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging audit event:', error);
      return null;
    }

    return data?.id || null;
  }

  private getDeviceInfo(): string {
    if (typeof window === 'undefined') return 'server';

    const ua = navigator.userAgent;
    let device = 'Unknown';

    if (/mobile/i.test(ua)) {
      device = 'Mobile';
    } else if (/tablet/i.test(ua)) {
      device = 'Tablet';
    } else {
      device = 'Desktop';
    }

    let os = 'Unknown';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

    return `${device} - ${os}`;
  }

  // ==========================================
  // QUERY LOGS
  // ==========================================

  async getLogs(
    workspaceId: string,
    filters: AuditLogFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 50 }
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.action_types?.length) {
      query = query.in('action_type', filters.action_types);
    }

    if (filters.user_ids?.length) {
      query = query.in('user_id', filters.user_ids);
    }

    if (filters.resource_types?.length) {
      query = query.in('resource_type', filters.resource_types);
    }

    if (filters.risk_levels?.length) {
      query = query.in('risk_level', filters.risk_levels);
    }

    if (filters.statuses?.length) {
      query = query.in('status', filters.statuses);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }

    if (filters.search) {
      query = query.or(`resource_name.ilike.%${filters.search}%,action_type.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return { logs: [], total: 0 };
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  async getLogById(logId: string): Promise<AuditLogEntry | null> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (error) return null;
    return data;
  }

  async getRecentActivity(
    workspaceId: string,
    limit: number = 10
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  }

  async getUserActivity(
    userId: string,
    options: { workspace_id?: string; limit?: number } = {}
  ): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.workspace_id) {
      query = query.eq('workspace_id', options.workspace_id);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  async getActivityStats(
    workspaceId: string,
    days: number = 30
  ): Promise<{
    totalActions: number;
    uniqueUsers: number;
    actionsByType: Record<string, number>;
    actionsByDay: { date: string; count: number }[];
    riskBreakdown: Record<RiskLevel, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('action_type, user_id, risk_level, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString());

    if (error || !data) {
      return {
        totalActions: 0,
        uniqueUsers: 0,
        actionsByType: {},
        actionsByDay: [],
        riskBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
      };
    }

    const uniqueUsers = new Set(data.map(l => l.user_id)).size;

    const actionsByType: Record<string, number> = {};
    const actionsByDay: Record<string, number> = {};
    const riskBreakdown: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };

    data.forEach(log => {
      // Actions by type
      actionsByType[log.action_type] = (actionsByType[log.action_type] || 0) + 1;

      // Actions by day
      const day = new Date(log.created_at).toISOString().split('T')[0];
      actionsByDay[day] = (actionsByDay[day] || 0) + 1;

      // Risk breakdown
      riskBreakdown[log.risk_level as RiskLevel]++;
    });

    return {
      totalActions: data.length,
      uniqueUsers,
      actionsByType,
      actionsByDay: Object.entries(actionsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      riskBreakdown,
    };
  }

  async getSecurityAlerts(
    workspaceId: string,
    limit: number = 20
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('risk_level', ['high', 'critical'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  }

  // ==========================================
  // EXPORTS
  // ==========================================

  async requestExport(
    workspaceId: string,
    options: {
      start_date: Date;
      end_date: Date;
      filters?: AuditLogFilters;
      format?: 'csv' | 'json' | 'pdf';
    }
  ): Promise<AuditLogExport | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('audit_log_exports')
      .insert({
        workspace_id: workspaceId,
        requested_by: user.id,
        date_range_start: options.start_date.toISOString(),
        date_range_end: options.end_date.toISOString(),
        filters: options.filters,
        format: options.format || 'csv',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating export request:', error);
      return null;
    }

    // TODO: Trigger background job to process export
    // For now, we'll process immediately (small datasets)
    this.processExport(data.id);

    return data;
  }

  private async processExport(exportId: string): Promise<void> {
    // Update status to processing
    await supabase
      .from('audit_log_exports')
      .update({ status: 'processing' })
      .eq('id', exportId);

    // Get export details
    const { data: exportData } = await supabase
      .from('audit_log_exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (!exportData) return;

    // Fetch logs
    const { logs } = await this.getLogs(
      exportData.workspace_id,
      {
        start_date: new Date(exportData.date_range_start),
        end_date: new Date(exportData.date_range_end),
        ...exportData.filters,
      },
      { page: 1, limit: 10000 }
    );

    // Generate export content
    let content: string;
    let mimeType: string;

    if (exportData.format === 'json') {
      content = JSON.stringify(logs, null, 2);
      mimeType = 'application/json';
    } else {
      // CSV format
      const headers = ['id', 'timestamp', 'user_id', 'action_type', 'resource_type', 'resource_name', 'status', 'risk_level'];
      const rows = logs.map(log => [
        log.id,
        log.created_at,
        log.user_id || '',
        log.action_type,
        log.resource_type || '',
        log.resource_name || '',
        log.status,
        log.risk_level,
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      mimeType = 'text/csv';
    }

    // In production, upload to storage and get URL
    // For now, we'll store a data URL
    const dataUrl = `data:${mimeType};base64,${btoa(content)}`;

    await supabase
      .from('audit_log_exports')
      .update({
        status: 'completed',
        file_url: dataUrl,
        file_size_bytes: content.length,
        record_count: logs.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', exportId);
  }

  async getExports(workspaceId: string): Promise<AuditLogExport[]> {
    const { data, error } = await supabase
      .from('audit_log_exports')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  // ==========================================
  // RETENTION POLICIES
  // ==========================================

  async getRetentionPolicy(workspaceId: string): Promise<AuditRetentionPolicy | null> {
    const { data, error } = await supabase
      .from('audit_retention_policies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error) return null;
    return data;
  }

  async updateRetentionPolicy(
    workspaceId: string,
    policy: Partial<Omit<AuditRetentionPolicy, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ): Promise<AuditRetentionPolicy | null> {
    const { data, error } = await supabase
      .from('audit_retention_policies')
      .upsert({
        workspace_id: workspaceId,
        ...policy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating retention policy:', error);
      return null;
    }

    return data;
  }

  // Cleanup old logs based on retention policy
  async cleanupOldLogs(workspaceId: string): Promise<number> {
    const policy = await this.getRetentionPolicy(workspaceId);
    if (!policy) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

    const { data, error } = await supabase
      .from('audit_logs')
      .delete()
      .eq('workspace_id', workspaceId)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up old logs:', error);
      return 0;
    }

    return data?.length || 0;
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  startNewSession(): void {
    this.sessionId = this.generateSessionId();
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  // Flush any pending logs
  async flush(): Promise<void> {
    await this.flushBatch();
  }
}

export const auditLogService = new AuditLogService();
export default auditLogService;
