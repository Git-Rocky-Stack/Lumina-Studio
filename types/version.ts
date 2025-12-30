// ============================================================================
// VERSION HISTORY & TIME TRAVEL - TYPE DEFINITIONS
// ============================================================================

import type { DesignElement } from '../types';

/**
 * Version metadata
 */
export interface VersionMetadata {
  id: string;
  name: string;
  description?: string;
  timestamp: string;
  authorId?: string;
  authorName: string;
  authorAvatar?: string;

  // Version info
  versionNumber: number;
  parentVersionId?: string;
  branchName?: string;

  // Snapshot info
  elementCount: number;
  thumbnail?: string;

  // Tags
  tags?: string[];
  isAutoSave?: boolean;
  isMilestone?: boolean;
}

/**
 * Full version snapshot
 */
export interface VersionSnapshot {
  metadata: VersionMetadata;
  elements: DesignElement[];
  canvasSettings?: CanvasSettings;
}

/**
 * Canvas settings snapshot
 */
export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor?: string;
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

/**
 * Version diff for comparison
 */
export interface VersionDiff {
  added: DesignElement[];
  removed: DesignElement[];
  modified: ElementChange[];
}

/**
 * Individual element change
 */
export interface ElementChange {
  elementId: string;
  before: Partial<DesignElement>;
  after: Partial<DesignElement>;
  changedProperties: string[];
}

/**
 * Version branch
 */
export interface VersionBranch {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdFromVersionId: string;
  headVersionId: string;
  isDefault?: boolean;
}

/**
 * Timeline item for display
 */
export interface TimelineItem {
  version: VersionMetadata;
  isCurrentVersion: boolean;
  isBranchPoint: boolean;
  children?: TimelineItem[];
}

/**
 * Version filter options
 */
export interface VersionFilter {
  branchId?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  onlyMilestones?: boolean;
  searchQuery?: string;
}

/**
 * Version comparison result
 */
export interface VersionComparison {
  versionA: VersionMetadata;
  versionB: VersionMetadata;
  diff: VersionDiff;
  summary: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    unchangedCount: number;
  };
}

/**
 * Restore options
 */
export interface RestoreOptions {
  createNewVersion?: boolean;
  preserveCurrentAsBackup?: boolean;
  mergeElements?: boolean;
  selectedElementIds?: string[];
}

/**
 * Version history state
 */
export interface VersionHistoryState {
  versions: VersionMetadata[];
  branches: VersionBranch[];
  currentVersionId: string | null;
  currentBranchId: string;
  isLoading: boolean;
  error?: string;
}

/**
 * Version action types
 */
export type VersionAction =
  | 'create'
  | 'restore'
  | 'branch'
  | 'merge'
  | 'delete'
  | 'rename'
  | 'tag';

/**
 * Version event for activity tracking
 */
export interface VersionEvent {
  id: string;
  action: VersionAction;
  versionId: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTO_SAVE_INTERVAL_MS = 30000; // 30 seconds
export const MAX_AUTO_SAVE_VERSIONS = 50;
export const MAX_VERSIONS_PER_PROJECT = 500;

export const VERSION_ICONS: Record<VersionAction, string> = {
  create: 'fa-plus-circle',
  restore: 'fa-undo',
  branch: 'fa-code-branch',
  merge: 'fa-code-merge',
  delete: 'fa-trash',
  rename: 'fa-edit',
  tag: 'fa-tag'
};

export const MILESTONE_ICONS = [
  { id: 'draft', icon: 'fa-file', label: 'Draft' },
  { id: 'review', icon: 'fa-eye', label: 'Ready for Review' },
  { id: 'approved', icon: 'fa-check-circle', label: 'Approved' },
  { id: 'final', icon: 'fa-flag-checkered', label: 'Final' },
  { id: 'archived', icon: 'fa-archive', label: 'Archived' }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate version ID
 */
export function generateVersionId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate branch ID
 */
export function generateBranchId(): string {
  return `br_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format version number
 */
export function formatVersionNumber(num: number): string {
  return `v${num.toString().padStart(3, '0')}`;
}

/**
 * Calculate element diff
 */
export function calculateElementDiff(
  before: DesignElement[],
  after: DesignElement[]
): VersionDiff {
  const beforeMap = new Map(before.map(el => [el.id, el]));
  const afterMap = new Map(after.map(el => [el.id, el]));

  const added: DesignElement[] = [];
  const removed: DesignElement[] = [];
  const modified: ElementChange[] = [];

  // Find added and modified
  for (const [id, afterEl] of afterMap) {
    const beforeEl = beforeMap.get(id);
    if (!beforeEl) {
      added.push(afterEl);
    } else {
      const changes = getElementChanges(beforeEl, afterEl);
      if (changes.length > 0) {
        modified.push({
          elementId: id,
          before: pickProperties(beforeEl, changes),
          after: pickProperties(afterEl, changes),
          changedProperties: changes
        });
      }
    }
  }

  // Find removed
  for (const [id, beforeEl] of beforeMap) {
    if (!afterMap.has(id)) {
      removed.push(beforeEl);
    }
  }

  return { added, removed, modified };
}

/**
 * Get changed properties between two elements
 */
function getElementChanges(before: DesignElement, after: DesignElement): string[] {
  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeVal = (before as any)[key];
    const afterVal = (after as any)[key];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changes.push(key);
    }
  }

  return changes;
}

/**
 * Pick specific properties from an object
 */
function pickProperties<T extends Record<string, any>>(
  obj: T,
  keys: string[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (key in obj) {
      (result as any)[key] = obj[key];
    }
  }
  return result;
}

/**
 * Format relative time for versions
 */
export function formatVersionTime(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: time < now - 31536000000 ? 'numeric' : undefined
  });
}
