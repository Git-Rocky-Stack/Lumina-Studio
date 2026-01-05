// =============================================
// Offline Indicator Component
// Visual indicator for offline status and sync
// =============================================

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  CloudOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { offlineSync, SyncConflict } from '../../services/offlineSyncService';

// =============================================
// Types
// =============================================

interface OfflineIndicatorProps {
  className?: string;
}

// =============================================
// Offline Indicator Component
// =============================================

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // =============================================
  // Setup
  // =============================================

  useEffect(() => {
    // Initialize offline sync
    offlineSync.init();

    // Subscribe to status changes
    const unsubscribe = offlineSync.onStatusChange((status) => {
      setIsOnline(status.isOnline);
      setPendingCount(status.pendingCount);
    });

    // Load conflicts
    loadConflicts();

    // Set initial state
    setIsOnline(offlineSync.online);
    loadPendingCount();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadPendingCount = async () => {
    const count = await offlineSync.getPendingCount();
    setPendingCount(count);
  };

  const loadConflicts = async () => {
    const conflictList = await offlineSync.getConflicts();
    setConflicts(conflictList);
  };

  // =============================================
  // Handlers
  // =============================================

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await offlineSync.syncAll();
      setLastSyncTime(new Date());
      loadPendingCount();
      loadConflicts();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'local_wins' | 'server_wins'
  ) => {
    await offlineSync.resolveConflict(conflictId, resolution);
    loadConflicts();
    loadPendingCount();
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const diff = Date.now() - lastSyncTime.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return lastSyncTime.toLocaleTimeString();
  };

  // =============================================
  // Render
  // =============================================

  // Minimized view when online with no pending changes
  if (isOnline && pendingCount === 0 && conflicts.length === 0 && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg
          bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20
          transition-colors ${className}`}
      >
        <Cloud className="w-3.5 h-3.5" />
        <span>Synced</span>
      </button>
    );
  }

  return (
    <div className={`offline-indicator ${className}`}>
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2
            hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Offline</span>
              </div>
            )}

            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs
                bg-violet-500/20 text-violet-400">
                {pendingCount} pending
              </span>
            )}

            {conflicts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs
                bg-amber-500/20 text-amber-400">
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSyncing && (
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            )}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-zinc-800">
            {/* Sync Status */}
            <div className="pt-3 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                Last sync: {formatLastSync()}
              </div>
              <button
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
                className="flex items-center gap-1 px-2 py-1 rounded-lg
                  bg-violet-500/20 text-violet-400 text-xs
                  hover:bg-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
            </div>

            {/* Offline Message */}
            {!isOnline && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <CloudOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-400 font-medium">Working Offline</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Changes will be saved locally and synced when you're back online.
                  </p>
                </div>
              </div>
            )}

            {/* Pending Changes */}
            {pendingCount > 0 && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Cloud className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-violet-400 font-medium">
                    {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {isOnline ? 'Syncing...' : 'Will sync when online'}
                  </p>
                </div>
              </div>
            )}

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Conflicts Detected
                </p>
                {conflicts.slice(0, 3).map((conflict) => (
                  <div
                    key={conflict.id}
                    className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-400 capitalize">
                        {conflict.entity_type}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(conflict.local_timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'local_wins')}
                        className="flex-1 px-2 py-1 rounded text-xs
                          bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 transition-colors"
                      >
                        Keep Local
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'server_wins')}
                        className="flex-1 px-2 py-1 rounded text-xs
                          bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 transition-colors"
                      >
                        Use Server
                      </button>
                    </div>
                  </div>
                ))}
                {conflicts.length > 3 && (
                  <p className="text-xs text-zinc-500 text-center">
                    +{conflicts.length - 3} more conflict{conflicts.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* All Synced */}
            {isOnline && pendingCount === 0 && conflicts.length === 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-emerald-400">All changes synced</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
