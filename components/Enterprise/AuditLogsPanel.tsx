// Audit Logs Panel - Track all actions for compliance
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Trash2,
  Upload,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  auditLogService,
  AuditLogEntry,
  AuditActionType,
  RiskLevel,
  AuditLogFilters,
} from '../../services/auditLogService';

interface AuditLogsPanelProps {
  workspaceId: string;
  onClose?: () => void;
}

export const AuditLogsPanel: React.FC<AuditLogsPanelProps> = ({
  workspaceId,
  onClose,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<{
    totalActions: number;
    uniqueUsers: number;
    riskBreakdown: Record<RiskLevel, number>;
  } | null>(null);

  const LIMIT = 50;

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [workspaceId, page, filters]);

  const loadLogs = async () => {
    setIsLoading(true);
    const result = await auditLogService.getLogs(
      workspaceId,
      { ...filters, search: searchQuery || undefined },
      { page, limit: LIMIT }
    );
    setLogs(result.logs);
    setTotalLogs(result.total);
    setIsLoading(false);
  };

  const loadStats = async () => {
    const data = await auditLogService.getActivityStats(workspaceId, 30);
    setStats(data);
  };

  const handleSearch = () => {
    setPage(1);
    loadLogs();
  };

  const handleExport = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    await auditLogService.requestExport(workspaceId, {
      start_date: startDate,
      end_date: new Date(),
      filters,
      format: 'csv',
    });
    alert('Export started. You will be notified when it\'s ready.');
  };

  const getActionIcon = (actionType: AuditActionType) => {
    if (actionType.startsWith('user.login')) return <LogIn className="w-4 h-4" />;
    if (actionType.startsWith('user.logout')) return <LogOut className="w-4 h-4" />;
    if (actionType.includes('delete')) return <Trash2 className="w-4 h-4" />;
    if (actionType.includes('upload')) return <Upload className="w-4 h-4" />;
    if (actionType.includes('invite') || actionType.includes('member')) return <UserPlus className="w-4 h-4" />;
    if (actionType.includes('settings')) return <Settings className="w-4 h-4" />;
    if (actionType.includes('approval')) return <CheckCircle className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const formatActionType = (type: string) => {
    return type.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalLogs / LIMIT);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Audit Logs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalActions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Actions (30d)</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.uniqueUsers}
            </p>
            <p className="text-xs text-gray-500">Active Users</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-orange-500">
              {stats.riskBreakdown.high + stats.riskBreakdown.critical}
            </p>
            <p className="text-xs text-gray-500">High Risk Events</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-green-500">
              {stats.riskBreakdown.low}
            </p>
            <p className="text-xs text-gray-500">Low Risk Events</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search actions, resources..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
            showFilters
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <button
          onClick={loadLogs}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Risk Level
              </label>
              <select
                value={filters.risk_levels?.[0] || ''}
                onChange={e => setFilters({
                  ...filters,
                  risk_levels: e.target.value ? [e.target.value as RiskLevel] : undefined,
                })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Date Range
              </label>
              <select
                onChange={e => {
                  const days = parseInt(e.target.value);
                  if (days) {
                    const start = new Date();
                    start.setDate(start.getDate() - days);
                    setFilters({ ...filters, start_date: start, end_date: new Date() });
                  } else {
                    setFilters({ ...filters, start_date: undefined, end_date: undefined });
                  }
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">All Time</option>
                <option value="1">Last 24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Action Type
              </label>
              <select
                value={filters.action_types?.[0] || ''}
                onChange={e => setFilters({
                  ...filters,
                  action_types: e.target.value ? [e.target.value as AuditActionType] : undefined,
                })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">All Actions</option>
                <option value="user.login">User Login</option>
                <option value="project.create">Project Create</option>
                <option value="project.delete">Project Delete</option>
                <option value="member.invite">Member Invite</option>
                <option value="settings.update">Settings Update</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
            <Shield className="w-12 h-12 mb-4 opacity-50" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map(log => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  selectedLog?.id === log.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getRiskIcon(log.risk_level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatActionType(log.action_type)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(log.risk_level)}`}>
                        {log.risk_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {log.resource_name && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {log.resource_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user_id?.substring(0, 8) || 'System'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.created_at)}
                      </span>
                    </div>

                    {/* Expanded Details */}
                    {selectedLog?.id === log.id && (
                      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Resource Type</p>
                            <p className="text-gray-700 dark:text-gray-300">
                              {log.resource_type || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Resource ID</p>
                            <p className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                              {log.resource_id || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">IP Address</p>
                            <p className="text-gray-700 dark:text-gray-300">
                              {log.ip_address || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <p className={`${
                              log.status === 'success' ? 'text-green-600' :
                              log.status === 'failure' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {log.status}
                            </p>
                          </div>
                        </div>
                        {log.changes && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Changes</p>
                            <pre className="text-xs bg-gray-200 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.user_agent && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">User Agent</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {log.user_agent}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * LIMIT) + 1} - {Math.min(page * LIMIT, totalLogs)} of {totalLogs}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPanel;
