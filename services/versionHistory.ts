/**
 * Version History Service
 *
 * Provides version control features:
 * - Auto-save snapshots
 * - Named checkpoints
 * - Visual diff between versions
 * - One-click restore
 */

export interface Version {
  id: string;
  name?: string;
  timestamp: number;
  type: 'auto' | 'manual' | 'checkpoint';
  data: any;
  thumbnail?: string;
  size: number;
  description?: string;
}

export interface VersionDiff {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

const DB_NAME = 'lumina-versions';
const STORE_NAME = 'versions';
const MAX_AUTO_VERSIONS = 50;
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

class VersionHistoryService {
  private db: IDBDatabase | null = null;
  private projectId: string = '';
  private autoSaveTimer: number | null = null;
  private lastSaveHash: string = '';

  /**
   * Initialize the version history for a project
   */
  async init(projectId: string): Promise<void> {
    this.projectId = projectId;
    await this.openDatabase();
    this.startAutoSave();
  }

  /**
   * Open IndexedDB database
   */
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = window.setInterval(() => {
      // Auto-save will be triggered by the component
      window.dispatchEvent(new CustomEvent('lumina-auto-save'));
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Create a new version snapshot
   */
  async createVersion(
    data: any,
    options: {
      name?: string;
      type?: 'auto' | 'manual' | 'checkpoint';
      description?: string;
      thumbnail?: string;
    } = {}
  ): Promise<Version> {
    if (!this.db) await this.openDatabase();

    // Generate hash to detect changes
    const dataHash = this.hashData(data);
    if (dataHash === this.lastSaveHash && options.type === 'auto') {
      throw new Error('No changes detected');
    }
    this.lastSaveHash = dataHash;

    const version: Version & { projectId: string } = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: this.projectId,
      name: options.name,
      timestamp: Date.now(),
      type: options.type || 'manual',
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      thumbnail: options.thumbnail,
      size: new Blob([JSON.stringify(data)]).size,
      description: options.description,
    };

    await this.saveVersion(version);
    await this.pruneAutoVersions();

    return version;
  }

  /**
   * Save version to database
   */
  private async saveVersion(version: Version & { projectId: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all versions for current project
   */
  async getVersions(): Promise<Version[]> {
    if (!this.db) await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('projectId');
      const request = index.getAll(this.projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const versions = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(versions);
      };
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(versionId: string): Promise<Version | null> {
    if (!this.db) await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(versionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Restore a version
   */
  async restoreVersion(versionId: string): Promise<any> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    // Create a checkpoint before restoring
    window.dispatchEvent(new CustomEvent('lumina-create-checkpoint', {
      detail: { reason: `Before restoring to ${version.name || this.formatDate(version.timestamp)}` }
    }));

    return version.data;
  }

  /**
   * Delete a version
   */
  async deleteVersion(versionId: string): Promise<void> {
    if (!this.db) await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(versionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Rename a version
   */
  async renameVersion(versionId: string, name: string): Promise<void> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    version.name = name;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ ...version, projectId: this.projectId });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Compare two versions and return diff
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<VersionDiff> {
    const [v1, v2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2),
    ]);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    const keys1 = new Set(Object.keys(this.flattenObject(v1.data)));
    const keys2 = new Set(Object.keys(this.flattenObject(v2.data)));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    const unchanged: string[] = [];

    keys2.forEach((key) => {
      if (!keys1.has(key)) {
        added.push(key);
      }
    });

    keys1.forEach((key) => {
      if (!keys2.has(key)) {
        removed.push(key);
      } else {
        const flat1 = this.flattenObject(v1.data);
        const flat2 = this.flattenObject(v2.data);
        if (JSON.stringify(flat1[key]) !== JSON.stringify(flat2[key])) {
          modified.push(key);
        } else {
          unchanged.push(key);
        }
      }
    });

    return { added, removed, modified, unchanged };
  }

  /**
   * Prune old auto-save versions
   */
  private async pruneAutoVersions(): Promise<void> {
    const versions = await this.getVersions();
    const autoVersions = versions.filter((v) => v.type === 'auto');

    if (autoVersions.length > MAX_AUTO_VERSIONS) {
      const toDelete = autoVersions.slice(MAX_AUTO_VERSIONS);
      await Promise.all(toDelete.map((v) => this.deleteVersion(v.id)));
    }
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<{ used: number; versions: number }> {
    const versions = await this.getVersions();
    const used = versions.reduce((acc, v) => acc + v.size, 0);
    return { used, versions: versions.length };
  }

  /**
   * Clear all versions for current project
   */
  async clearAllVersions(): Promise<void> {
    const versions = await this.getVersions();
    await Promise.all(versions.map((v) => this.deleteVersion(v.id)));
  }

  /**
   * Helper: Hash data for change detection
   */
  private hashData(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Helper: Flatten object for diff comparison
   */
  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, this.flattenObject(obj[key], newKey));
      } else {
        result[newKey] = obj[key];
      }
    }

    return result;
  }

  /**
   * Helper: Format date
   */
  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
}

// Singleton instance
export const versionHistory = new VersionHistoryService();

export default versionHistory;
