// =============================================
// Offline Sync Service
// Handle offline mode and data synchronization
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
export type ConflictResolution = 'local_wins' | 'server_wins' | 'merged' | 'manual';
export type EntityType = 'project' | 'asset' | 'template' | 'canvas';

export interface SyncQueueItem {
  id: string;
  user_id: string;
  device_id: string;
  operation_type: 'create' | 'update' | 'delete';
  entity_type: EntityType;
  entity_id: string;
  entity_data?: any;
  local_timestamp: string;
  server_timestamp?: string;
  version: number;
  base_version?: number;
  conflict_status: 'none' | 'detected' | 'resolved' | 'rejected';
  conflict_resolution?: ConflictResolution;
  conflict_data?: any;
  sync_status: SyncStatus;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  created_at: string;
  synced_at?: string;
}

export interface SyncConflict {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  local_data: any;
  server_data: any;
  local_timestamp: string;
  server_timestamp: string;
  resolution?: ConflictResolution;
  resolved_data?: any;
}

export interface DeviceInfo {
  id: string;
  device_id: string;
  device_name?: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  last_sync_at?: string;
  is_active: boolean;
}

export interface SyncCheckpoint {
  entity_type: EntityType;
  last_sync_timestamp: string;
  last_sync_version: number;
}

// =============================================
// IndexedDB Setup for Offline Storage
// =============================================

const DB_NAME = 'lumina-offline';
const DB_VERSION = 1;

const STORES = {
  SYNC_QUEUE: 'syncQueue',
  CACHED_DATA: 'cachedData',
  PENDING_CHANGES: 'pendingChanges',
  CHECKPOINTS: 'checkpoints',
};

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('status', 'sync_status');
          syncStore.createIndex('entity', ['entity_type', 'entity_id']);
        }

        // Cached data store
        if (!db.objectStoreNames.contains(STORES.CACHED_DATA)) {
          const cacheStore = db.createObjectStore(STORES.CACHED_DATA, { keyPath: 'key' });
          cacheStore.createIndex('type', 'type');
          cacheStore.createIndex('expires', 'expires_at');
        }

        // Pending changes store
        if (!db.objectStoreNames.contains(STORES.PENDING_CHANGES)) {
          db.createObjectStore(STORES.PENDING_CHANGES, { keyPath: 'id' });
        }

        // Checkpoints store
        if (!db.objectStoreNames.contains(STORES.CHECKPOINTS)) {
          db.createObjectStore(STORES.CHECKPOINTS, { keyPath: 'entity_type' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // Sync Queue Operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const fullItem = { ...item, id };

    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SYNC_QUEUE, 'readwrite');
      const request = store.add(fullItem);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SYNC_QUEUE);
      const index = store.index('status');
      const request = index.getAll(IDBKeyRange.only('pending'));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SYNC_QUEUE, 'readwrite');
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const putRequest = store.put({ ...item, ...updates });
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Item not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeSyncItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SYNC_QUEUE, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache Operations
  async cacheData(key: string, type: string, data: any, expiresIn?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.CACHED_DATA, 'readwrite');
      const item = {
        key,
        type,
        data,
        cached_at: new Date().toISOString(),
        expires_at: expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null,
      };
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.CACHED_DATA);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check expiration
          if (result.expires_at && new Date(result.expires_at) < new Date()) {
            this.removeCachedData(key);
            resolve(null);
          } else {
            resolve(result.data);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeCachedData(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.CACHED_DATA, 'readwrite');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Checkpoint Operations
  async getCheckpoint(entityType: EntityType): Promise<SyncCheckpoint | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.CHECKPOINTS);
      const request = store.get(entityType);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async setCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.CHECKPOINTS, 'readwrite');
      const request = store.put(checkpoint);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// =============================================
// Offline Sync Service
// =============================================

class OfflineSyncService {
  private storage: OfflineStorage;
  private deviceId: string;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: Set<(status: { isOnline: boolean; pendingCount: number }) => void> = new Set();

  constructor() {
    this.storage = new OfflineStorage();
    this.deviceId = this.getOrCreateDeviceId();
    this.setupEventListeners();
  }

  // =============================================
  // Initialization
  // =============================================

  async init(): Promise<void> {
    await this.storage.init();
    await this.registerDevice();

    // Sync on startup if online
    if (this.isOnline) {
      this.syncAll();
    }
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('lumina_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('lumina_device_id', deviceId);
    }
    return deviceId;
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  // =============================================
  // Status & Listeners
  // =============================================

  get online(): boolean {
    return this.isOnline;
  }

  onStatusChange(callback: (status: { isOnline: boolean; pendingCount: number }) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private async notifyListeners(): Promise<void> {
    const pending = await this.storage.getPendingSyncItems();
    this.listeners.forEach(cb => cb({
      isOnline: this.isOnline,
      pendingCount: pending.length,
    }));
  }

  async getPendingCount(): Promise<number> {
    const pending = await this.storage.getPendingSyncItems();
    return pending.length;
  }

  // =============================================
  // Device Registration
  // =============================================

  private async registerDevice(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const deviceInfo = {
      device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop',
      device_type: navigator.userAgent.includes('Mobile')
        ? 'mobile'
        : navigator.userAgent.includes('Tablet')
          ? 'tablet'
          : 'desktop',
      browser: this.getBrowserName(),
      os: this.getOSName(),
    };

    await supabase.from('user_devices').upsert({
      user_id: user.id,
      device_id: this.deviceId,
      ...deviceInfo,
      last_seen_at: new Date().toISOString(),
      is_active: true,
    });
  }

  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // =============================================
  // Queue Operations
  // =============================================

  async queueChange(
    operationType: 'create' | 'update' | 'delete',
    entityType: EntityType,
    entityId: string,
    entityData?: any,
    baseVersion?: number
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const queueId = await this.storage.addToSyncQueue({
      user_id: user.id,
      device_id: this.deviceId,
      operation_type: operationType,
      entity_type: entityType,
      entity_id: entityId,
      entity_data: entityData,
      local_timestamp: new Date().toISOString(),
      version: 1,
      base_version: baseVersion,
      conflict_status: 'none',
      sync_status: 'pending',
      retry_count: 0,
      max_retries: 5,
      created_at: new Date().toISOString(),
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncAll();
    }

    this.notifyListeners();
    return queueId;
  }

  // =============================================
  // Synchronization
  // =============================================

  async syncAll(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;

    try {
      const pendingItems = await this.storage.getPendingSyncItems();

      for (const item of pendingItems) {
        await this.syncItem(item);
      }

      // Pull changes from server
      await this.pullChanges();

    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    try {
      await this.storage.updateSyncItem(item.id, { sync_status: 'syncing' });

      // Call server sync function
      const { data, error } = await supabase.rpc('process_sync_item', {
        p_queue_id: item.id,
      });

      if (error) throw error;

      if (data?.conflict) {
        // Handle conflict
        await this.storage.updateSyncItem(item.id, {
          sync_status: 'conflict',
          conflict_status: 'detected',
          conflict_data: data.server_data,
        });
      } else if (data?.success) {
        // Success - remove from queue
        await this.storage.removeSyncItem(item.id);
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (err: any) {
      const retryCount = item.retry_count + 1;
      if (retryCount >= item.max_retries) {
        await this.storage.updateSyncItem(item.id, {
          sync_status: 'failed',
          retry_count: retryCount,
          error_message: err.message,
        });
      } else {
        await this.storage.updateSyncItem(item.id, {
          sync_status: 'pending',
          retry_count: retryCount,
          error_message: err.message,
        });
      }
    }
  }

  private async pullChanges(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const entityTypes: EntityType[] = ['project', 'asset', 'template', 'canvas'];

    for (const entityType of entityTypes) {
      const checkpoint = await this.storage.getCheckpoint(entityType);

      const { data, error } = await supabase.rpc('get_changes_since', {
        p_user_id: user.id,
        p_device_id: this.deviceId,
        p_entity_type: entityType,
      });

      if (error) {
        console.error(`Failed to pull ${entityType} changes:`, error);
        continue;
      }

      if (data && data.length > 0) {
        // Cache the changes
        for (const change of data) {
          await this.storage.cacheData(
            `${entityType}:${change.entity_id}`,
            entityType,
            change.data
          );
        }

        // Update checkpoint
        const lastChange = data[data.length - 1];
        await this.storage.setCheckpoint({
          entity_type: entityType,
          last_sync_timestamp: lastChange.changed_at,
          last_sync_version: lastChange.version,
        });
      }

      // Update server checkpoint
      await supabase.rpc('update_sync_checkpoint', {
        p_user_id: user.id,
        p_device_id: this.deviceId,
        p_entity_type: entityType,
        p_timestamp: new Date().toISOString(),
        p_version: checkpoint?.last_sync_version || 0,
      });
    }
  }

  // =============================================
  // Conflict Resolution
  // =============================================

  async getConflicts(): Promise<SyncConflict[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('sync_conflicts')
      .select('*')
      .eq('user_id', user.id)
      .is('resolution', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch conflicts:', error);
      return [];
    }

    return data || [];
  }

  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    resolvedData?: any
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('sync_conflicts')
      .update({
        resolution,
        resolved_data: resolvedData,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', conflictId);

    if (error) {
      console.error('Failed to resolve conflict:', error);
      return false;
    }

    // Re-sync with resolution
    await this.syncAll();
    return true;
  }

  // =============================================
  // Cache Operations
  // =============================================

  async getCached<T>(key: string): Promise<T | null> {
    return this.storage.getCachedData<T>(key);
  }

  async setCached(key: string, type: string, data: any, ttlMs?: number): Promise<void> {
    await this.storage.cacheData(key, type, data, ttlMs);
  }

  async clearCache(): Promise<void> {
    // Clear all cached data - useful for logout
    const db = (this.storage as any).db as IDBDatabase;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CACHED_DATA, STORES.CHECKPOINTS], 'readwrite');
      tx.objectStore(STORES.CACHED_DATA).clear();
      tx.objectStore(STORES.CHECKPOINTS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

// Export singleton
export const offlineSync = new OfflineSyncService();
