// ============================================================================
// VERSION HISTORY & TIME TRAVEL SERVICE
// ============================================================================

import type { DesignElement } from '../types';
import {
  generateVersionId,
  generateBranchId,
  calculateElementDiff,
  formatVersionNumber,
  MAX_AUTO_SAVE_VERSIONS,
  MAX_VERSIONS_PER_PROJECT
} from '../types/version';
import type {
  VersionMetadata,
  VersionSnapshot,
  VersionBranch,
  VersionDiff,
  VersionComparison,
  RestoreOptions,
  VersionFilter,
  CanvasSettings
} from '../types/version';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  VERSIONS: 'lumina_versions',
  BRANCHES: 'lumina_branches',
  CURRENT_VERSION: 'lumina_current_version',
  CURRENT_BRANCH: 'lumina_current_branch',
  SNAPSHOTS: 'lumina_snapshots'
};

// ============================================================================
// VERSION MANAGER
// ============================================================================

class VersionManager {
  private versions: Map<string, VersionMetadata> = new Map();
  private snapshots: Map<string, VersionSnapshot> = new Map();
  private branches: Map<string, VersionBranch> = new Map();
  private currentVersionId: string | null = null;
  private currentBranchId: string = 'main';
  private versionCounter: number = 0;
  private autoSaveTimer: number | null = null;

  // Callbacks
  private onVersionChange: ((versions: VersionMetadata[]) => void) | null = null;
  private onBranchChange: ((branches: VersionBranch[]) => void) | null = null;

  constructor() {
    this.loadFromStorage();
    this.ensureMainBranch();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const versionsJson = localStorage.getItem(STORAGE_KEYS.VERSIONS);
      const branchesJson = localStorage.getItem(STORAGE_KEYS.BRANCHES);
      const snapshotsJson = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      const currentVersion = localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION);
      const currentBranch = localStorage.getItem(STORAGE_KEYS.CURRENT_BRANCH);

      if (versionsJson) {
        const versions = JSON.parse(versionsJson) as VersionMetadata[];
        versions.forEach(v => this.versions.set(v.id, v));
        this.versionCounter = Math.max(...versions.map(v => v.versionNumber), 0);
      }

      if (branchesJson) {
        const branches = JSON.parse(branchesJson) as VersionBranch[];
        branches.forEach(b => this.branches.set(b.id, b));
      }

      if (snapshotsJson) {
        const snapshots = JSON.parse(snapshotsJson) as VersionSnapshot[];
        snapshots.forEach(s => this.snapshots.set(s.metadata.id, s));
      }

      if (currentVersion) this.currentVersionId = currentVersion;
      if (currentBranch) this.currentBranchId = currentBranch;
    } catch (error) {
      console.error('Failed to load version history:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.VERSIONS,
        JSON.stringify(Array.from(this.versions.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.BRANCHES,
        JSON.stringify(Array.from(this.branches.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.SNAPSHOTS,
        JSON.stringify(Array.from(this.snapshots.values()))
      );
      if (this.currentVersionId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION, this.currentVersionId);
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_BRANCH, this.currentBranchId);
    } catch (error) {
      console.error('Failed to save version history:', error);
    }
  }

  private ensureMainBranch(): void {
    if (!this.branches.has('main')) {
      const mainBranch: VersionBranch = {
        id: 'main',
        name: 'Main',
        description: 'Default branch',
        createdAt: new Date().toISOString(),
        createdFromVersionId: '',
        headVersionId: '',
        isDefault: true
      };
      this.branches.set('main', mainBranch);
      this.saveToStorage();
    }
  }

  // ============================================================================
  // VERSION CREATION
  // ============================================================================

  /**
   * Create a new version snapshot
   */
  createVersion(
    elements: DesignElement[],
    options: {
      name?: string;
      description?: string;
      authorName?: string;
      authorId?: string;
      authorAvatar?: string;
      isAutoSave?: boolean;
      isMilestone?: boolean;
      tags?: string[];
      canvasSettings?: CanvasSettings;
    } = {}
  ): VersionMetadata {
    // Enforce version limit
    if (this.versions.size >= MAX_VERSIONS_PER_PROJECT) {
      this.pruneOldAutoSaves();
    }

    this.versionCounter++;
    const versionId = generateVersionId();

    const metadata: VersionMetadata = {
      id: versionId,
      name: options.name || `Version ${formatVersionNumber(this.versionCounter)}`,
      description: options.description,
      timestamp: new Date().toISOString(),
      authorId: options.authorId,
      authorName: options.authorName || 'Anonymous',
      authorAvatar: options.authorAvatar,
      versionNumber: this.versionCounter,
      parentVersionId: this.currentVersionId || undefined,
      branchName: this.getBranch(this.currentBranchId)?.name,
      elementCount: elements.length,
      tags: options.tags,
      isAutoSave: options.isAutoSave,
      isMilestone: options.isMilestone
    };

    const snapshot: VersionSnapshot = {
      metadata,
      elements: JSON.parse(JSON.stringify(elements)), // Deep clone
      canvasSettings: options.canvasSettings
    };

    // Generate thumbnail (simplified - in production would use canvas)
    metadata.thumbnail = this.generateThumbnail(elements);

    this.versions.set(versionId, metadata);
    this.snapshots.set(versionId, snapshot);
    this.currentVersionId = versionId;

    // Update branch head
    const branch = this.branches.get(this.currentBranchId);
    if (branch) {
      branch.headVersionId = versionId;
    }

    this.saveToStorage();
    this.notifyVersionChange();

    return metadata;
  }

  /**
   * Generate a simple thumbnail representation
   */
  private generateThumbnail(elements: DesignElement[]): string {
    // In production, this would render to a small canvas
    // For now, return a data URL placeholder based on element count
    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
    const color = colors[elements.length % colors.length];
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${encodeURIComponent(color)}20"/><text x="50" y="55" text-anchor="middle" fill="${encodeURIComponent(color)}" font-size="24">${elements.length}</text></svg>`;
  }

  /**
   * Remove old auto-saves to stay under limit
   */
  private pruneOldAutoSaves(): void {
    const autoSaves = Array.from(this.versions.values())
      .filter(v => v.isAutoSave)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const toRemove = autoSaves.slice(0, autoSaves.length - MAX_AUTO_SAVE_VERSIONS + 10);
    toRemove.forEach(v => {
      this.versions.delete(v.id);
      this.snapshots.delete(v.id);
    });
  }

  // ============================================================================
  // VERSION RETRIEVAL
  // ============================================================================

  /**
   * Get all versions
   */
  getVersions(filter?: VersionFilter): VersionMetadata[] {
    let versions = Array.from(this.versions.values());

    if (filter) {
      if (filter.branchId) {
        versions = versions.filter(v => v.branchName === this.getBranch(filter.branchId!)?.name);
      }
      if (filter.authorId) {
        versions = versions.filter(v => v.authorId === filter.authorId);
      }
      if (filter.startDate) {
        const start = new Date(filter.startDate).getTime();
        versions = versions.filter(v => new Date(v.timestamp).getTime() >= start);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate).getTime();
        versions = versions.filter(v => new Date(v.timestamp).getTime() <= end);
      }
      if (filter.tags && filter.tags.length > 0) {
        versions = versions.filter(v => v.tags?.some(t => filter.tags!.includes(t)));
      }
      if (filter.onlyMilestones) {
        versions = versions.filter(v => v.isMilestone);
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        versions = versions.filter(v =>
          v.name.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query)
        );
      }
    }

    return versions.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get a specific version
   */
  getVersion(versionId: string): VersionMetadata | undefined {
    return this.versions.get(versionId);
  }

  /**
   * Get version snapshot (full data)
   */
  getSnapshot(versionId: string): VersionSnapshot | undefined {
    return this.snapshots.get(versionId);
  }

  /**
   * Get current version
   */
  getCurrentVersion(): VersionMetadata | undefined {
    return this.currentVersionId ? this.versions.get(this.currentVersionId) : undefined;
  }

  // ============================================================================
  // VERSION OPERATIONS
  // ============================================================================

  /**
   * Restore to a previous version
   */
  restoreVersion(
    versionId: string,
    options: RestoreOptions = {}
  ): DesignElement[] | null {
    const snapshot = this.snapshots.get(versionId);
    if (!snapshot) return null;

    let elementsToRestore = snapshot.elements;

    if (options.selectedElementIds && options.selectedElementIds.length > 0) {
      // Partial restore - only selected elements
      const selectedSet = new Set(options.selectedElementIds);
      elementsToRestore = snapshot.elements.filter(el => selectedSet.has(el.id));
    }

    if (options.createNewVersion) {
      // Create a new version marking the restoration
      this.createVersion(elementsToRestore, {
        name: `Restored from ${snapshot.metadata.name}`,
        description: `Restored from version ${snapshot.metadata.versionNumber}`,
        tags: ['restored']
      });
    }

    return JSON.parse(JSON.stringify(elementsToRestore));
  }

  /**
   * Compare two versions
   */
  compareVersions(versionIdA: string, versionIdB: string): VersionComparison | null {
    const snapshotA = this.snapshots.get(versionIdA);
    const snapshotB = this.snapshots.get(versionIdB);

    if (!snapshotA || !snapshotB) return null;

    const diff = calculateElementDiff(snapshotA.elements, snapshotB.elements);

    return {
      versionA: snapshotA.metadata,
      versionB: snapshotB.metadata,
      diff,
      summary: {
        addedCount: diff.added.length,
        removedCount: diff.removed.length,
        modifiedCount: diff.modified.length,
        unchangedCount: snapshotA.elements.length - diff.removed.length - diff.modified.length
      }
    };
  }

  /**
   * Update version metadata
   */
  updateVersion(
    versionId: string,
    updates: Partial<Pick<VersionMetadata, 'name' | 'description' | 'tags' | 'isMilestone'>>
  ): VersionMetadata | null {
    const version = this.versions.get(versionId);
    if (!version) return null;

    const updated = { ...version, ...updates };
    this.versions.set(versionId, updated);

    const snapshot = this.snapshots.get(versionId);
    if (snapshot) {
      snapshot.metadata = updated;
    }

    this.saveToStorage();
    this.notifyVersionChange();

    return updated;
  }

  /**
   * Delete a version
   */
  deleteVersion(versionId: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) return false;

    // Don't delete current version
    if (versionId === this.currentVersionId) return false;

    // Update parent references
    for (const v of this.versions.values()) {
      if (v.parentVersionId === versionId) {
        v.parentVersionId = version.parentVersionId;
      }
    }

    this.versions.delete(versionId);
    this.snapshots.delete(versionId);
    this.saveToStorage();
    this.notifyVersionChange();

    return true;
  }

  // ============================================================================
  // BRANCHING
  // ============================================================================

  /**
   * Create a new branch from a version
   */
  createBranch(
    name: string,
    fromVersionId?: string,
    description?: string
  ): VersionBranch {
    const branchId = generateBranchId();
    const sourceVersionId = fromVersionId || this.currentVersionId || '';

    const branch: VersionBranch = {
      id: branchId,
      name,
      description,
      createdAt: new Date().toISOString(),
      createdFromVersionId: sourceVersionId,
      headVersionId: sourceVersionId
    };

    this.branches.set(branchId, branch);
    this.saveToStorage();
    this.notifyBranchChange();

    return branch;
  }

  /**
   * Switch to a branch
   */
  switchBranch(branchId: string): DesignElement[] | null {
    const branch = this.branches.get(branchId);
    if (!branch) return null;

    this.currentBranchId = branchId;

    if (branch.headVersionId) {
      const snapshot = this.snapshots.get(branch.headVersionId);
      if (snapshot) {
        this.currentVersionId = branch.headVersionId;
        this.saveToStorage();
        return JSON.parse(JSON.stringify(snapshot.elements));
      }
    }

    this.saveToStorage();
    return null;
  }

  /**
   * Get all branches
   */
  getBranches(): VersionBranch[] {
    return Array.from(this.branches.values());
  }

  /**
   * Get a specific branch
   */
  getBranch(branchId: string): VersionBranch | undefined {
    return this.branches.get(branchId);
  }

  /**
   * Get current branch
   */
  getCurrentBranch(): VersionBranch | undefined {
    return this.branches.get(this.currentBranchId);
  }

  /**
   * Delete a branch
   */
  deleteBranch(branchId: string): boolean {
    if (branchId === 'main') return false; // Can't delete main
    if (branchId === this.currentBranchId) return false; // Can't delete current

    this.branches.delete(branchId);
    this.saveToStorage();
    this.notifyBranchChange();

    return true;
  }

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================

  /**
   * Start auto-save timer
   */
  startAutoSave(
    getElements: () => DesignElement[],
    intervalMs: number = 30000,
    authorName?: string
  ): void {
    this.stopAutoSave();

    this.autoSaveTimer = window.setInterval(() => {
      const elements = getElements();
      if (elements.length > 0) {
        this.createVersion(elements, {
          name: 'Auto-save',
          isAutoSave: true,
          authorName: authorName || 'Auto-save'
        });
      }
    }, intervalMs);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      window.clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnVersionChange(callback: (versions: VersionMetadata[]) => void): void {
    this.onVersionChange = callback;
  }

  setOnBranchChange(callback: (branches: VersionBranch[]) => void): void {
    this.onBranchChange = callback;
  }

  private notifyVersionChange(): void {
    this.onVersionChange?.(this.getVersions());
  }

  private notifyBranchChange(): void {
    this.onBranchChange?.(this.getBranches());
  }

  // ============================================================================
  // EXPORT/IMPORT
  // ============================================================================

  /**
   * Export version history
   */
  exportHistory(): string {
    return JSON.stringify({
      versions: Array.from(this.versions.values()),
      snapshots: Array.from(this.snapshots.values()),
      branches: Array.from(this.branches.values()),
      currentVersionId: this.currentVersionId,
      currentBranchId: this.currentBranchId
    });
  }

  /**
   * Import version history
   */
  importHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.versions) {
        data.versions.forEach((v: VersionMetadata) => this.versions.set(v.id, v));
      }
      if (data.snapshots) {
        data.snapshots.forEach((s: VersionSnapshot) => this.snapshots.set(s.metadata.id, s));
      }
      if (data.branches) {
        data.branches.forEach((b: VersionBranch) => this.branches.set(b.id, b));
      }
      if (data.currentVersionId) this.currentVersionId = data.currentVersionId;
      if (data.currentBranchId) this.currentBranchId = data.currentBranchId;

      this.saveToStorage();
      this.notifyVersionChange();
      this.notifyBranchChange();

      return true;
    } catch (error) {
      console.error('Failed to import version history:', error);
      return false;
    }
  }

  /**
   * Clear all version history
   */
  clearHistory(): void {
    this.versions.clear();
    this.snapshots.clear();
    this.branches.clear();
    this.currentVersionId = null;
    this.versionCounter = 0;

    this.ensureMainBranch();
    this.saveToStorage();
    this.notifyVersionChange();
    this.notifyBranchChange();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const versionManager = new VersionManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable change description
 */
export function describeChange(change: { changedProperties: string[] }): string {
  const props = change.changedProperties;

  if (props.includes('x') || props.includes('y')) {
    return 'Moved';
  }
  if (props.includes('width') || props.includes('height')) {
    return 'Resized';
  }
  if (props.includes('rotation')) {
    return 'Rotated';
  }
  if (props.includes('content')) {
    return 'Content changed';
  }
  if (props.includes('isVisible')) {
    return 'Visibility changed';
  }
  if (props.includes('animation')) {
    return 'Animation changed';
  }

  return `${props.length} properties changed`;
}

/**
 * Get icon for element type
 */
export function getElementIcon(type: string): string {
  switch (type) {
    case 'text': return 'fa-font';
    case 'image': return 'fa-image';
    case 'shape': return 'fa-shapes';
    default: return 'fa-cube';
  }
}
