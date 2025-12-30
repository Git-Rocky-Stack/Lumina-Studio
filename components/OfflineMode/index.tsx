// ============================================================================
// OFFLINE MODE - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { offlineModeManager } from '../../services/offlineService';
import {
  formatBytes,
  formatTimeAgo,
  SYNC_STATUS_INFO,
  CONNECTION_STATUS_INFO
} from '../../types/offline';
import type {
  OfflineProject,
  StorageQuota,
  SyncResult,
  OfflineModeSettings,
  ConnectionStatus,
  PendingOperation
} from '../../types/offline';

// ============================================================================
// DESIGN SYSTEM TOKENS
// ============================================================================

const colors = {
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a24',
    elevated: '#1e1e2a'
  },
  border: {
    subtle: '#2a2a3a',
    default: '#3a3a4a'
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    tertiary: '#707080'
  },
  accent: {
    primary: '#6366f1',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

// ============================================================================
// CONNECTION STATUS INDICATOR
// ============================================================================

interface ConnectionStatusIndicatorProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  showLabel = true,
  size = 'md'
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(offlineModeManager.getConnectionStatus());

  useEffect(() => {
    offlineModeManager.setOnStatusChange(setStatus);

    return () => {
      offlineModeManager.setOnStatusChange(() => {});
    };
  }, []);

  const info = CONNECTION_STATUS_INFO[status];
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{ scale: status === 'online' ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 1, repeat: status === 'online' ? Infinity : 0, repeatDelay: 2 }}
        className={`${sizeClasses[size]} rounded-full`}
        style={{ backgroundColor: info.color }}
      />
      {showLabel && (
        <span className="text-sm" style={{ color: info.color }}>
          {info.label}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// SYNC STATUS BADGE
// ============================================================================

interface SyncStatusBadgeProps {
  pendingCount: number;
  isSyncing?: boolean;
  onClick?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  pendingCount,
  isSyncing = false,
  onClick
}) => {
  if (pendingCount === 0 && !isSyncing) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: colors.accent.success + '20' }}>
        <i className="fa-solid fa-check text-xs" style={{ color: colors.accent.success }} />
        <span className="text-xs" style={{ color: colors.accent.success }}>Synced</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors hover:opacity-80"
      style={{ backgroundColor: isSyncing ? colors.accent.primary + '20' : colors.accent.warning + '20' }}
    >
      <i
        className={`fa-solid ${isSyncing ? 'fa-sync fa-spin' : 'fa-cloud-arrow-up'} text-xs`}
        style={{ color: isSyncing ? colors.accent.primary : colors.accent.warning }}
      />
      <span className="text-xs" style={{ color: isSyncing ? colors.accent.primary : colors.accent.warning }}>
        {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
      </span>
    </button>
  );
};

// ============================================================================
// OFFLINE MODE PANEL
// ============================================================================

interface OfflineModePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineModePanel: React.FC<OfflineModePanelProps> = ({
  isOpen,
  onClose
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(offlineModeManager.getConnectionStatus());
  const [settings, setSettings] = useState<OfflineModeSettings>(offlineModeManager.getSettings());
  const [projects, setProjects] = useState<OfflineProject[]>(offlineModeManager.getOfflineProjects());
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>(offlineModeManager.getPendingOperations());
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'pending' | 'settings'>('projects');

  useEffect(() => {
    offlineModeManager.setOnStatusChange(setStatus);
    offlineModeManager.setOnSyncStart(() => setIsSyncing(true));
    offlineModeManager.setOnSyncComplete((result) => {
      setIsSyncing(false);
      setLastSyncResult(result);
      setPendingOps(offlineModeManager.getPendingOperations());
      setProjects(offlineModeManager.getOfflineProjects());
    });

    // Load storage quota
    offlineModeManager.getStorageUsage().then(setStorageQuota);

    return () => {
      offlineModeManager.setOnStatusChange(() => {});
      offlineModeManager.setOnSyncStart(() => {});
      offlineModeManager.setOnSyncComplete(() => {});
    };
  }, []);

  const handleSync = useCallback(() => {
    offlineModeManager.sync();
  }, []);

  const handleSettingChange = useCallback((updates: Partial<OfflineModeSettings>) => {
    offlineModeManager.updateSettings(updates);
    setSettings(offlineModeManager.getSettings());
  }, []);

  const handleRemoveProject = useCallback(async (projectId: string) => {
    await offlineModeManager.removeOfflineProject(projectId);
    setProjects(offlineModeManager.getOfflineProjects());
  }, []);

  const handleClearCache = useCallback(async () => {
    await offlineModeManager.clearCache();
    const quota = await offlineModeManager.getStorageUsage();
    setStorageQuota(quota);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl shadow-2xl"
          style={{ backgroundColor: colors.background.secondary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: colors.border.subtle }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.accent.primary + '20' }}
              >
                <i className="fa-solid fa-cloud" style={{ color: colors.accent.primary }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                  Offline Mode
                </h2>
                <div className="flex items-center gap-3">
                  <ConnectionStatusIndicator size="sm" />
                  {pendingOps.length > 0 && (
                    <span className="text-xs" style={{ color: colors.text.tertiary }}>
                      {pendingOps.length} pending changes
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status === 'online' && pendingOps.length > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: colors.accent.primary, color: '#fff' }}
                >
                  {isSyncing ? (
                    <>
                      <i className="fa-solid fa-sync fa-spin mr-1.5" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up mr-1.5" />
                      Sync Now
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
              >
                <i className="fa-solid fa-xmark" style={{ color: colors.text.secondary }} />
              </button>
            </div>
          </div>

          {/* Storage Usage */}
          {storageQuota && (
            <div className="px-6 py-3 border-b" style={{ borderColor: colors.border.subtle }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  Storage Usage
                </span>
                <span className="text-sm" style={{ color: colors.text.primary }}>
                  {formatBytes(storageQuota.used)} / {formatBytes(storageQuota.used + storageQuota.available)}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.background.tertiary }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${storageQuota.percentage}%` }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: storageQuota.percentage > 90
                      ? colors.accent.error
                      : storageQuota.percentage > 70
                        ? colors.accent.warning
                        : colors.accent.success
                  }}
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: colors.border.subtle }}>
            {(['projects', 'pending', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-sm capitalize transition-colors relative"
                style={{ color: activeTab === tab ? colors.accent.primary : colors.text.secondary }}
              >
                {tab}
                {tab === 'pending' && pendingOps.length > 0 && (
                  <span
                    className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full"
                    style={{ backgroundColor: colors.accent.warning, color: '#fff' }}
                  >
                    {pendingOps.length}
                  </span>
                )}
                {activeTab === tab && (
                  <motion.div
                    layoutId="offline-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: colors.accent.primary }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[50vh]">
            {activeTab === 'projects' && (
              <ProjectsTab
                projects={projects}
                onRemove={handleRemoveProject}
              />
            )}

            {activeTab === 'pending' && (
              <PendingTab
                operations={pendingOps}
                lastResult={lastSyncResult}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                onUpdate={handleSettingChange}
                onClearCache={handleClearCache}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// PROJECTS TAB
// ============================================================================

interface ProjectsTabProps {
  projects: OfflineProject[];
  onRemove: (projectId: string) => void;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ projects, onRemove }) => (
  <div className="p-4">
    {projects.length === 0 ? (
      <div className="text-center py-12">
        <i className="fa-solid fa-folder-open text-4xl mb-4" style={{ color: colors.text.tertiary }} />
        <p style={{ color: colors.text.secondary }}>No offline projects</p>
        <p className="text-sm mt-1" style={{ color: colors.text.tertiary }}>
          Projects you save for offline use will appear here
        </p>
      </div>
    ) : (
      <div className="space-y-2">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onRemove={() => onRemove(project.id)}
          />
        ))}
      </div>
    )}
  </div>
);

// ============================================================================
// PROJECT CARD
// ============================================================================

interface ProjectCardProps {
  project: OfflineProject;
  onRemove: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onRemove }) => {
  const statusInfo = SYNC_STATUS_INFO[project.syncStatus];

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg"
      style={{ backgroundColor: colors.background.tertiary }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: colors.background.elevated }}
        >
          <i className="fa-solid fa-file-lines" style={{ color: colors.text.secondary }} />
        </div>
        <div>
          <div className="font-medium" style={{ color: colors.text.primary }}>
            {project.name}
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: colors.text.tertiary }}>
            <span>{formatBytes(project.size)}</span>
            <span>Modified {formatTimeAgo(project.lastModified)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <i className={`fa-solid ${statusInfo.icon} text-xs`} style={{ color: statusInfo.color }} />
          <span className="text-xs" style={{ color: statusInfo.color }}>
            {statusInfo.label}
          </span>
          {project.pendingChanges > 0 && (
            <span className="text-xs" style={{ color: colors.accent.warning }}>
              ({project.pendingChanges})
            </span>
          )}
        </div>

        <button
          onClick={onRemove}
          className="p-2 rounded-lg transition-colors hover:bg-white/10"
          title="Remove from offline"
        >
          <i className="fa-solid fa-trash text-sm" style={{ color: colors.accent.error }} />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PENDING TAB
// ============================================================================

interface PendingTabProps {
  operations: PendingOperation[];
  lastResult: SyncResult | null;
}

const PendingTab: React.FC<PendingTabProps> = ({ operations, lastResult }) => (
  <div className="p-4">
    {lastResult && (
      <div
        className="mb-4 p-3 rounded-lg"
        style={{
          backgroundColor: lastResult.success
            ? colors.accent.success + '20'
            : colors.accent.error + '20'
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <i
            className={`fa-solid ${lastResult.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}
            style={{ color: lastResult.success ? colors.accent.success : colors.accent.error }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: lastResult.success ? colors.accent.success : colors.accent.error }}
          >
            {lastResult.success ? 'Sync Complete' : 'Sync Failed'}
          </span>
        </div>
        <p className="text-xs" style={{ color: colors.text.secondary }}>
          {lastResult.syncedCount} synced, {lastResult.failedCount} failed
        </p>
      </div>
    )}

    {operations.length === 0 ? (
      <div className="text-center py-12">
        <i className="fa-solid fa-check-circle text-4xl mb-4" style={{ color: colors.accent.success }} />
        <p style={{ color: colors.text.secondary }}>All changes synced</p>
        <p className="text-sm mt-1" style={{ color: colors.text.tertiary }}>
          No pending operations
        </p>
      </div>
    ) : (
      <div className="space-y-2">
        {operations.map(op => (
          <div
            key={op.id}
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ backgroundColor: colors.background.tertiary }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.background.elevated }}
              >
                <i
                  className={`fa-solid ${
                    op.type === 'create' ? 'fa-plus' :
                    op.type === 'update' ? 'fa-pen' : 'fa-trash'
                  } text-xs`}
                  style={{ color: colors.text.secondary }}
                />
              </div>
              <div>
                <div className="text-sm capitalize" style={{ color: colors.text.primary }}>
                  {op.type} {op.entity}
                </div>
                <div className="text-xs" style={{ color: colors.text.tertiary }}>
                  {formatTimeAgo(op.timestamp)}
                  {op.retryCount > 0 && ` - ${op.retryCount} retries`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: colors.accent.warning + '20',
                  color: colors.accent.warning
                }}
              >
                Pending
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ============================================================================
// SETTINGS TAB
// ============================================================================

interface SettingsTabProps {
  settings: OfflineModeSettings;
  onUpdate: (updates: Partial<OfflineModeSettings>) => void;
  onClearCache: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onUpdate, onClearCache }) => (
  <div className="p-4 space-y-6">
    {/* Main Toggle */}
    <SettingToggle
      label="Enable Offline Mode"
      description="Save projects for offline access"
      value={settings.enabled}
      onChange={v => onUpdate({ enabled: v })}
    />

    <div className="border-t pt-4" style={{ borderColor: colors.border.subtle }}>
      <h4 className="text-sm font-medium mb-4" style={{ color: colors.text.primary }}>
        Sync Settings
      </h4>

      <div className="space-y-4">
        <SettingToggle
          label="Auto Sync"
          description="Automatically sync changes when online"
          value={settings.autoSync}
          onChange={v => onUpdate({ autoSync: v })}
          disabled={!settings.enabled}
        />

        {settings.autoSync && (
          <div className="ml-6">
            <label className="text-xs block mb-2" style={{ color: colors.text.tertiary }}>
              Sync Interval
            </label>
            <select
              value={settings.syncInterval}
              onChange={e => onUpdate({ syncInterval: Number(e.target.value) })}
              className="px-3 py-2 text-sm rounded-lg outline-none"
              style={{
                backgroundColor: colors.background.tertiary,
                color: colors.text.primary,
                border: `1px solid ${colors.border.subtle}`
              }}
            >
              <option value={1}>Every minute</option>
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
            </select>
          </div>
        )}

        <div>
          <label className="text-xs block mb-2" style={{ color: colors.text.tertiary }}>
            Conflict Resolution
          </label>
          <select
            value={settings.conflictResolution}
            onChange={e => onUpdate({ conflictResolution: e.target.value as any })}
            className="px-3 py-2 text-sm rounded-lg outline-none"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.primary,
              border: `1px solid ${colors.border.subtle}`
            }}
          >
            <option value="local">Keep local changes</option>
            <option value="remote">Keep remote changes</option>
            <option value="prompt">Ask me each time</option>
          </select>
        </div>
      </div>
    </div>

    <div className="border-t pt-4" style={{ borderColor: colors.border.subtle }}>
      <h4 className="text-sm font-medium mb-4" style={{ color: colors.text.primary }}>
        Cache Settings
      </h4>

      <div className="space-y-4">
        <SettingToggle
          label="Cache Assets"
          description="Store images and media for offline use"
          value={settings.cacheAssets}
          onChange={v => onUpdate({ cacheAssets: v })}
          disabled={!settings.enabled}
        />

        <SettingToggle
          label="Cache Components"
          description="Store component library offline"
          value={settings.cacheComponents}
          onChange={v => onUpdate({ cacheComponents: v })}
          disabled={!settings.enabled}
        />

        <SettingToggle
          label="Enable Compression"
          description="Compress cached data to save space"
          value={settings.compressionEnabled}
          onChange={v => onUpdate({ compressionEnabled: v })}
          disabled={!settings.enabled}
        />

        <div>
          <label className="text-xs block mb-2" style={{ color: colors.text.tertiary }}>
            Max Cache Size
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={settings.maxCacheSize}
              onChange={e => onUpdate({ maxCacheSize: Number(e.target.value) })}
              min={100}
              max={2000}
              step={100}
              className="flex-1"
            />
            <span className="text-sm w-16 text-right" style={{ color: colors.text.primary }}>
              {settings.maxCacheSize} MB
            </span>
          </div>
        </div>

        <button
          onClick={onClearCache}
          className="w-full py-2 text-sm rounded-lg transition-colors"
          style={{
            backgroundColor: colors.accent.error + '20',
            color: colors.accent.error
          }}
        >
          <i className="fa-solid fa-trash mr-1.5" />
          Clear Cache
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// SETTING TOGGLE
// ============================================================================

interface SettingToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  value,
  onChange,
  disabled
}) => (
  <div className="flex items-center justify-between">
    <div>
      <span
        className="text-sm"
        style={{ color: disabled ? colors.text.tertiary : colors.text.primary }}
      >
        {label}
      </span>
      {description && (
        <p className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>
          {description}
        </p>
      )}
    </div>
    <button
      onClick={() => !disabled && onChange(!value)}
      className="w-10 h-5 rounded-full transition-colors relative"
      style={{
        backgroundColor: value && !disabled ? colors.accent.primary : colors.background.tertiary,
        opacity: disabled ? 0.5 : 1
      }}
      disabled={disabled}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
      />
    </button>
  </div>
);

// ============================================================================
// OFFLINE BANNER
// ============================================================================

export const OfflineBanner: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(offlineModeManager.getConnectionStatus());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    offlineModeManager.setOnStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'offline') {
        setIsVisible(true);
      }
    });

    // Check initial status
    if (!offlineModeManager.isOnline()) {
      setStatus('offline');
      setIsVisible(true);
    }

    return () => {
      offlineModeManager.setOnStatusChange(() => {});
    };
  }, []);

  if (!isVisible || status === 'online') return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 px-4"
      style={{
        backgroundColor: status === 'offline' ? colors.accent.error : colors.accent.warning
      }}
    >
      <div className="flex items-center gap-2 text-white text-sm">
        <i className={`fa-solid ${status === 'offline' ? 'fa-wifi-slash' : 'fa-wifi-weak'}`} />
        <span>
          {status === 'offline'
            ? "You're offline. Changes will sync when connected."
            : "Slow connection. Some features may be limited."}
        </span>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="ml-4 p-1 rounded hover:bg-white/20"
      >
        <i className="fa-solid fa-xmark text-white" />
      </button>
    </motion.div>
  );
};

export default OfflineModePanel;
