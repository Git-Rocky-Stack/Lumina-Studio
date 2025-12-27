// ============================================
// SyncStatusIndicator - Cloud Sync Status Display
// ============================================

import React, { useState, useEffect } from 'react';
import cloudStorageService, {
  CloudProvider,
  SyncStatus,
} from '../../../services/cloudStorageService';

interface SyncStatusIndicatorProps {
  provider?: CloudProvider;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  provider,
  showDetails = true,
  compact = false,
  className = '',
}) => {
  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [syncing, setSyncing] = useState<Set<CloudProvider>>(new Set());

  useEffect(() => {
    const loadStatuses = () => {
      if (provider) {
        const status = cloudStorageService.getSyncStatus(provider);
        setStatuses(status ? [status] : []);
      } else {
        setStatuses(cloudStorageService.getAllSyncStatuses());
      }
    };

    loadStatuses();

    const unsubStart = cloudStorageService.on('syncStarted', (p: CloudProvider) => {
      setSyncing(prev => new Set(prev).add(p));
      loadStatuses();
    });

    const unsubComplete = cloudStorageService.on('syncCompleted', (p: CloudProvider) => {
      setSyncing(prev => {
        const next = new Set(prev);
        next.delete(p);
        return next;
      });
      loadStatuses();
    });

    return () => {
      unsubStart();
      unsubComplete();
    };
  }, [provider]);

  const handleSync = async (p: CloudProvider) => {
    await cloudStorageService.syncNow(p);
  };

  const getStatusIcon = (status: SyncStatus) => {
    if (syncing.has(status.provider)) {
      return (
        <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }

    switch (status.status) {
      case 'idle':
        return (
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        );
      case 'syncing':
        return (
          <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      case 'offline':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z" />
          </svg>
        );
    }
  };

  const getStatusText = (status: SyncStatus) => {
    if (syncing.has(status.provider)) {
      return 'Syncing...';
    }

    switch (status.status) {
      case 'idle':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return status.error || 'Sync error';
      case 'offline':
        return 'Offline';
    }
  };

  const getStatusColor = (status: SyncStatus) => {
    if (syncing.has(status.provider)) {
      return 'text-blue-400';
    }

    switch (status.status) {
      case 'idle':
        return 'text-green-400';
      case 'syncing':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      case 'offline':
        return 'text-yellow-400';
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (statuses.length === 0) {
    return null;
  }

  // Compact mode - just a small indicator
  if (compact) {
    const hasError = statuses.some(s => s.status === 'error');
    const isSyncing = statuses.some(s => syncing.has(s.provider) || s.status === 'syncing');
    const isOffline = statuses.some(s => s.status === 'offline');

    let color = 'bg-green-500';
    if (hasError) color = 'bg-red-500';
    else if (isOffline) color = 'bg-yellow-500';
    else if (isSyncing) color = 'bg-blue-500';

    return (
      <div className={`relative ${className}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${color} ${isSyncing ? 'animate-pulse' : ''}`} />
        {statuses.some(s => s.pendingChanges > 0) && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full text-[8px] text-white flex items-center justify-center">
            {statuses.reduce((sum, s) => sum + s.pendingChanges, 0)}
          </span>
        )}
      </div>
    );
  }

  // Single provider mode
  if (provider && statuses.length === 1) {
    const status = statuses[0];
    const config = cloudStorageService.getProviderConfig(provider);

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <span className={`text-sm ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
        </div>
        {showDetails && (
          <>
            <span className="text-xs text-white/40">
              Last sync: {formatLastSync(status.lastSyncAt)}
            </span>
            {status.pendingChanges > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 rounded text-purple-300">
                {status.pendingChanges} pending
              </span>
            )}
            <button
              onClick={() => handleSync(provider)}
              disabled={syncing.has(provider)}
              className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sync now
            </button>
          </>
        )}
      </div>
    );
  }

  // Multi-provider mode
  return (
    <div className={`${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors w-full"
      >
        <div className="flex items-center gap-1">
          {statuses.map(status => (
            <div key={status.provider} className="relative">
              {getStatusIcon(status)}
            </div>
          ))}
        </div>
        <span className="text-sm text-white flex-1 text-left">
          {statuses.length} connected
        </span>
        {statuses.some(s => s.pendingChanges > 0) && (
          <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 rounded text-purple-300">
            {statuses.reduce((sum, s) => sum + s.pendingChanges, 0)} pending
          </span>
        )}
        <svg
          className={`w-4 h-4 text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 p-2 bg-white/5 rounded-lg">
          {statuses.map(status => {
            const config = cloudStorageService.getProviderConfig(status.provider);

            return (
              <div
                key={status.provider}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  {getStatusIcon(status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{config.name}</span>
                    <span className={`text-xs ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">
                    Last sync: {formatLastSync(status.lastSyncAt)}
                  </span>
                </div>
                {status.pendingChanges > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 rounded text-purple-300">
                    {status.pendingChanges}
                  </span>
                )}
                <button
                  onClick={() => handleSync(status.provider)}
                  disabled={syncing.has(status.provider)}
                  className="p-1.5 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className={`w-4 h-4 text-white/60 ${syncing.has(status.provider) ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Mini version for toolbar/header
export const SyncStatusBadge: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className = '' }) => {
  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadStatuses = () => {
      setStatuses(cloudStorageService.getAllSyncStatuses());
    };

    loadStatuses();

    const unsubStart = cloudStorageService.on('syncStarted', () => {
      setSyncing(true);
      loadStatuses();
    });

    const unsubComplete = cloudStorageService.on('syncCompleted', () => {
      setSyncing(false);
      loadStatuses();
    });

    return () => {
      unsubStart();
      unsubComplete();
    };
  }, []);

  if (statuses.length === 0) {
    return null;
  }

  const hasError = statuses.some(s => s.status === 'error');
  const isOffline = statuses.some(s => s.status === 'offline');
  const pendingCount = statuses.reduce((sum, s) => sum + s.pendingChanges, 0);

  let bgColor = 'bg-green-500/20';
  let textColor = 'text-green-400';
  let icon = (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );

  if (hasError) {
    bgColor = 'bg-red-500/20';
    textColor = 'text-red-400';
    icon = (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    );
  } else if (isOffline) {
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-400';
    icon = (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27z" />
      </svg>
    );
  } else if (syncing) {
    bgColor = 'bg-blue-500/20';
    textColor = 'text-blue-400';
    icon = (
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${bgColor} ${textColor} hover:opacity-80 transition-opacity ${className}`}
    >
      {icon}
      <span className="text-xs font-medium">
        {syncing ? 'Syncing' : hasError ? 'Error' : isOffline ? 'Offline' : 'Synced'}
      </span>
      {pendingCount > 0 && (
        <span className="text-[10px] px-1 py-0.5 bg-white/10 rounded">
          {pendingCount}
        </span>
      )}
    </button>
  );
};

export default SyncStatusIndicator;
