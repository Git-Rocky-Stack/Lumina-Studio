// ============================================================================
// OFFLINE MODE SERVICE
// ============================================================================

import {
  generateOperationId,
  formatBytes,
  isExpired,
  calculateExpiry,
  isOnline,
  getNetworkMetrics,
  getStorageQuota,
  DEFAULT_SETTINGS
} from '../types/offline';
import type {
  PendingOperation,
  CachedResource,
  OfflineProject,
  StorageQuota,
  SyncResult,
  SyncError,
  OfflineModeSettings,
  NetworkMetrics,
  OfflineEvent,
  SyncStatus,
  ConnectionStatus,
  CacheStrategy
} from '../types/offline';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  SETTINGS: 'lumina_offline_settings',
  PENDING_OPERATIONS: 'lumina_pending_operations',
  CACHED_RESOURCES: 'lumina_cached_resources',
  OFFLINE_PROJECTS: 'lumina_offline_projects',
  SYNC_LOG: 'lumina_sync_log'
};

const DB_NAME = 'lumina_offline_db';
const DB_VERSION = 1;

// ============================================================================
// OFFLINE MODE MANAGER
// ============================================================================

class OfflineModeManager {
  private settings: OfflineModeSettings;
  private pendingOperations: PendingOperation[] = [];
  private cachedResources: Map<string, CachedResource> = new Map();
  private offlineProjects: Map<string, OfflineProject> = new Map();
  private db: IDBDatabase | null = null;
  private syncTimer: number | null = null;
  private connectionStatus: ConnectionStatus = 'online';

  // Callbacks
  private onStatusChange: ((status: ConnectionStatus) => void) | null = null;
  private onSyncStart: (() => void) | null = null;
  private onSyncComplete: ((result: SyncResult) => void) | null = null;
  private onStorageWarning: ((quota: StorageQuota) => void) | null = null;
  private eventListeners: ((event: OfflineEvent) => void)[] = [];

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.loadFromStorage();
    this.initializeDB();
    this.setupNetworkListeners();
    this.startSyncTimer();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const operationsJson = localStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
      const resourcesJson = localStorage.getItem(STORAGE_KEYS.CACHED_RESOURCES);
      const projectsJson = localStorage.getItem(STORAGE_KEYS.OFFLINE_PROJECTS);

      if (settingsJson) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }

      if (operationsJson) {
        this.pendingOperations = JSON.parse(operationsJson);
      }

      if (resourcesJson) {
        const resources = JSON.parse(resourcesJson) as CachedResource[];
        resources.forEach(r => this.cachedResources.set(r.url, r));
      }

      if (projectsJson) {
        const projects = JSON.parse(projectsJson) as OfflineProject[];
        projects.forEach(p => this.offlineProjects.set(p.id, p));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(this.pendingOperations));
      localStorage.setItem(
        STORAGE_KEYS.CACHED_RESOURCES,
        JSON.stringify(Array.from(this.cachedResources.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.OFFLINE_PROJECTS,
        JSON.stringify(Array.from(this.offlineProjects.values()))
      );
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Assets store
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('projectId', 'projectId', { unique: false });
        }

        // Cache store
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'url' });
        }
      };
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Check connection periodically
    setInterval(() => {
      this.checkConnectionQuality();
    }, 30000);
  }

  private handleOnline(): void {
    this.connectionStatus = 'online';
    this.onStatusChange?.('online');
    this.emitEvent({ type: 'online', timestamp: Date.now() });

    // Auto sync when back online
    if (this.settings.autoSync && this.pendingOperations.length > 0) {
      this.sync();
    }
  }

  private handleOffline(): void {
    this.connectionStatus = 'offline';
    this.onStatusChange?.('offline');
    this.emitEvent({ type: 'offline', timestamp: Date.now() });
  }

  private checkConnectionQuality(): void {
    if (!isOnline()) {
      this.connectionStatus = 'offline';
      return;
    }

    const metrics = getNetworkMetrics();
    if (metrics) {
      if (metrics.effectiveType === 'slow-2g' || metrics.effectiveType === '2g' || metrics.rtt > 500) {
        this.connectionStatus = 'slow';
      } else {
        this.connectionStatus = 'online';
      }
    }
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.settings.autoSync) {
      this.syncTimer = window.setInterval(() => {
        if (this.connectionStatus === 'online' && this.pendingOperations.length > 0) {
          this.sync();
        }
      }, this.settings.syncInterval * 60 * 1000);
    }
  }

  // ============================================================================
  // PENDING OPERATIONS
  // ============================================================================

  /**
   * Queue an operation for sync
   */
  queueOperation(
    type: PendingOperation['type'],
    entity: PendingOperation['entity'],
    entityId: string,
    data: any,
    priority: number = 1
  ): PendingOperation {
    const operation: PendingOperation = {
      id: generateOperationId(),
      type,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority
    };

    this.pendingOperations.push(operation);
    this.pendingOperations.sort((a, b) => b.priority - a.priority);

    // Update project sync status
    const project = this.offlineProjects.get(entityId);
    if (project) {
      project.syncStatus = 'pending';
      project.pendingChanges++;
      project.lastModified = Date.now();
    }

    this.saveToStorage();

    return operation;
  }

  /**
   * Get pending operations
   */
  getPendingOperations(): PendingOperation[] {
    return [...this.pendingOperations];
  }

  /**
   * Clear pending operations
   */
  clearPendingOperations(): void {
    this.pendingOperations = [];
    this.saveToStorage();
  }

  // ============================================================================
  // SYNC
  // ============================================================================

  /**
   * Sync pending operations
   */
  async sync(): Promise<SyncResult> {
    if (!isOnline()) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: this.pendingOperations.length,
        errors: [{ operationId: '', message: 'No network connection', code: 'OFFLINE', retryable: true }],
        timestamp: Date.now()
      };
    }

    this.onSyncStart?.();
    this.emitEvent({ type: 'sync-start', timestamp: Date.now() });

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
      timestamp: Date.now()
    };

    const operationsToSync = [...this.pendingOperations];

    for (const operation of operationsToSync) {
      try {
        await this.processOperation(operation);
        result.syncedCount++;

        // Remove from pending
        const index = this.pendingOperations.findIndex(op => op.id === operation.id);
        if (index !== -1) {
          this.pendingOperations.splice(index, 1);
        }

        // Update project status
        const project = this.offlineProjects.get(operation.entityId);
        if (project) {
          project.pendingChanges--;
          if (project.pendingChanges === 0) {
            project.syncStatus = 'synced';
            project.lastSynced = Date.now();
          }
        }
      } catch (error: any) {
        result.failedCount++;
        result.success = false;

        const syncError: SyncError = {
          operationId: operation.id,
          message: error.message || 'Unknown error',
          code: error.code || 'UNKNOWN',
          retryable: operation.retryCount < 3
        };

        result.errors.push(syncError);

        // Increment retry count
        operation.retryCount++;

        if (!syncError.retryable) {
          // Remove non-retryable operations
          const index = this.pendingOperations.findIndex(op => op.id === operation.id);
          if (index !== -1) {
            this.pendingOperations.splice(index, 1);
          }
        }
      }
    }

    this.saveToStorage();
    this.onSyncComplete?.(result);
    this.emitEvent({ type: 'sync-complete', timestamp: Date.now(), data: result });

    return result;
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: PendingOperation): Promise<void> {
    // Simulate API call - in production, this would make actual HTTP requests
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Simulated sync error'));
        }
      }, 100);
    });
  }

  // ============================================================================
  // CACHING
  // ============================================================================

  /**
   * Cache a resource
   */
  async cacheResource(
    url: string,
    data: any,
    contentType: string = 'application/json',
    strategy: CacheStrategy = 'cache-first',
    maxAge: number = 3600000 // 1 hour
  ): Promise<CachedResource> {
    const size = JSON.stringify(data).length;

    const resource: CachedResource = {
      url,
      data,
      contentType,
      size,
      cachedAt: Date.now(),
      expiresAt: calculateExpiry(maxAge),
      strategy
    };

    this.cachedResources.set(url, resource);

    // Store in IndexedDB for larger resources
    if (this.db && size > 50000) {
      await this.storeInDB('cache', resource);
    }

    this.saveToStorage();
    await this.checkStorageQuota();

    return resource;
  }

  /**
   * Get cached resource
   */
  async getCachedResource(url: string): Promise<CachedResource | null> {
    // Check memory cache first
    let resource = this.cachedResources.get(url);

    // Check IndexedDB if not in memory
    if (!resource && this.db) {
      resource = await this.getFromDB('cache', url);
      if (resource) {
        this.cachedResources.set(url, resource);
      }
    }

    if (!resource) return null;

    // Check expiration
    if (isExpired(resource.expiresAt)) {
      await this.removeCachedResource(url);
      return null;
    }

    return resource;
  }

  /**
   * Remove cached resource
   */
  async removeCachedResource(url: string): Promise<boolean> {
    this.cachedResources.delete(url);

    if (this.db) {
      await this.removeFromDB('cache', url);
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Clear all cached resources
   */
  async clearCache(): Promise<void> {
    this.cachedResources.clear();

    if (this.db) {
      await this.clearStore('cache');
    }

    this.saveToStorage();
  }

  // ============================================================================
  // OFFLINE PROJECTS
  // ============================================================================

  /**
   * Make project available offline
   */
  async makeProjectOffline(projectId: string, projectName: string, projectData: any): Promise<OfflineProject> {
    const size = JSON.stringify(projectData).length;

    const offlineProject: OfflineProject = {
      id: projectId,
      name: projectName,
      lastModified: Date.now(),
      lastSynced: Date.now(),
      size,
      syncStatus: 'synced',
      pendingChanges: 0
    };

    this.offlineProjects.set(projectId, offlineProject);

    // Store project data in IndexedDB
    if (this.db) {
      await this.storeInDB('projects', { id: projectId, data: projectData, ...offlineProject });
    }

    this.saveToStorage();
    await this.checkStorageQuota();

    return offlineProject;
  }

  /**
   * Get offline project
   */
  async getOfflineProject(projectId: string): Promise<any | null> {
    const project = this.offlineProjects.get(projectId);
    if (!project) return null;

    if (this.db) {
      const stored = await this.getFromDB('projects', projectId);
      return stored?.data || null;
    }

    return null;
  }

  /**
   * Remove offline project
   */
  async removeOfflineProject(projectId: string): Promise<boolean> {
    this.offlineProjects.delete(projectId);

    if (this.db) {
      await this.removeFromDB('projects', projectId);
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Get all offline projects
   */
  getOfflineProjects(): OfflineProject[] {
    return Array.from(this.offlineProjects.values());
  }

  /**
   * Update offline project
   */
  updateOfflineProject(projectId: string, projectData: any): void {
    const project = this.offlineProjects.get(projectId);
    if (!project) return;

    project.lastModified = Date.now();
    project.size = JSON.stringify(projectData).length;

    // Queue for sync
    this.queueOperation('update', 'project', projectId, projectData);
  }

  // ============================================================================
  // INDEXEDDB HELPERS
  // ============================================================================

  private async storeInDB(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromDB(storeName: string, key: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromDB(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // STORAGE QUOTA
  // ============================================================================

  /**
   * Check storage quota
   */
  async checkStorageQuota(): Promise<StorageQuota> {
    const quota = await getStorageQuota();

    if (quota.percentage > 90) {
      this.onStorageWarning?.(quota);
      this.emitEvent({ type: 'storage-warning', timestamp: Date.now(), data: quota });
    }

    return quota;
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<StorageQuota> {
    return getStorageQuota();
  }

  // ============================================================================
  // GETTERS & SETTERS
  // ============================================================================

  /**
   * Get settings
   */
  getSettings(): OfflineModeSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<OfflineModeSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
    this.startSyncTimer();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get network metrics
   */
  getNetworkMetrics(): NetworkMetrics | null {
    return getNetworkMetrics();
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return isOnline();
  }

  // ============================================================================
  // CALLBACKS & EVENTS
  // ============================================================================

  setOnStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onStatusChange = callback;
  }

  setOnSyncStart(callback: () => void): void {
    this.onSyncStart = callback;
  }

  setOnSyncComplete(callback: (result: SyncResult) => void): void {
    this.onSyncComplete = callback;
  }

  setOnStorageWarning(callback: (quota: StorageQuota) => void): void {
    this.onStorageWarning = callback;
  }

  addEventListener(callback: (event: OfflineEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index !== -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(event: OfflineEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const offlineModeManager = new OfflineModeManager();
