// ============================================================================
// OFFLINE MODE SYSTEM - TYPE DEFINITIONS
// ============================================================================

/**
 * Sync status
 */
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

/**
 * Connection status
 */
export type ConnectionStatus = 'online' | 'offline' | 'slow';

/**
 * Cache strategy
 */
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate';

/**
 * Pending operation
 */
export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'element' | 'asset' | 'component';
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: number;
}

/**
 * Cached resource
 */
export interface CachedResource {
  url: string;
  data: any;
  contentType: string;
  size: number;
  cachedAt: number;
  expiresAt: number;
  strategy: CacheStrategy;
}

/**
 * Offline project
 */
export interface OfflineProject {
  id: string;
  name: string;
  lastModified: number;
  lastSynced: number;
  size: number;
  syncStatus: SyncStatus;
  pendingChanges: number;
}

/**
 * Storage quota info
 */
export interface StorageQuota {
  used: number;
  available: number;
  percentage: number;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: SyncError[];
  timestamp: number;
}

/**
 * Sync error
 */
export interface SyncError {
  operationId: string;
  message: string;
  code: string;
  retryable: boolean;
}

/**
 * Offline mode settings
 */
export interface OfflineModeSettings {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  maxCacheSize: number; // MB
  cacheAssets: boolean;
  cacheComponents: boolean;
  compressionEnabled: boolean;
  conflictResolution: 'local' | 'remote' | 'prompt';
}

/**
 * Network quality metrics
 */
export interface NetworkMetrics {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

/**
 * Offline event
 */
export interface OfflineEvent {
  type: 'online' | 'offline' | 'sync-start' | 'sync-complete' | 'sync-error' | 'storage-warning';
  timestamp: number;
  data?: any;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_SETTINGS: OfflineModeSettings = {
  enabled: true,
  autoSync: true,
  syncInterval: 5,
  maxCacheSize: 500,
  cacheAssets: true,
  cacheComponents: true,
  compressionEnabled: true,
  conflictResolution: 'prompt'
};

export const SYNC_STATUS_INFO: Record<SyncStatus, { label: string; color: string; icon: string }> = {
  synced: { label: 'Synced', color: '#22c55e', icon: 'fa-check-circle' },
  pending: { label: 'Pending', color: '#f59e0b', icon: 'fa-clock' },
  syncing: { label: 'Syncing', color: '#3b82f6', icon: 'fa-sync' },
  error: { label: 'Error', color: '#ef4444', icon: 'fa-exclamation-circle' },
  offline: { label: 'Offline', color: '#6b7280', icon: 'fa-cloud-slash' }
};

export const CONNECTION_STATUS_INFO: Record<ConnectionStatus, { label: string; color: string; icon: string }> = {
  online: { label: 'Online', color: '#22c55e', icon: 'fa-wifi' },
  offline: { label: 'Offline', color: '#ef4444', icon: 'fa-wifi-slash' },
  slow: { label: 'Slow Connection', color: '#f59e0b', icon: 'fa-wifi-weak' }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate operation ID
 */
export function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format time ago
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Check if expired
 */
export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Calculate expiry time
 */
export function calculateExpiry(maxAge: number): number {
  return Date.now() + maxAge;
}

/**
 * Compress data
 */
export async function compressData(data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const inputData = encoder.encode(data);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(inputData);
  writer.close();

  const output: Uint8Array[] = [];
  const reader = cs.readable.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    output.push(value);
  }

  const totalLength = output.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of output) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Decompress data
 */
export async function decompressData(data: ArrayBuffer): Promise<string> {
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(data);
  writer.close();

  const output: Uint8Array[] = [];
  const reader = ds.readable.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    output.push(value);
  }

  const totalLength = output.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of output) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(result);
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get network metrics
 */
export function getNetworkMetrics(): NetworkMetrics | null {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 50,
    saveData: connection.saveData || false
  };
}

/**
 * Get storage quota
 */
export async function getStorageQuota(): Promise<StorageQuota> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const total = estimate.quota || 0;

    return {
      used,
      available: total - used,
      percentage: total > 0 ? (used / total) * 100 : 0
    };
  }

  return { used: 0, available: 0, percentage: 0 };
}
