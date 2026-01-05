// Canvas History Service - Visual history scrubber with thumbnails
// Provides undo/redo timeline functionality with branching support

import { supabase } from '../lib/supabase';

// ============================================
// Types
// ============================================

export interface CanvasState {
  elements: CanvasElement[];
  viewport: { x: number; y: number; zoom: number };
  selection?: string[];
  guides?: Guide[];
}

export interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

export interface Guide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
}

export interface HistoryEntry {
  id: string;
  projectId: string;
  versionNumber: number;
  actionLabel: string;
  actionType: HistoryActionType;
  canvasState: CanvasState;
  thumbnailUrl?: string;
  changedElements: string[];
  delta?: StateDelta;
  parentVersion?: number;
  branchName: string;
  isCheckpoint: boolean;
  isAutosave: boolean;
  createdAt: Date;
}

export type HistoryActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'resize'
  | 'style'
  | 'group'
  | 'ungroup'
  | 'duplicate'
  | 'paste'
  | 'import'
  | 'bulk'
  | 'checkpoint'
  | 'autosave';

export interface StateDelta {
  added?: CanvasElement[];
  removed?: string[];
  modified?: { id: string; before: Partial<CanvasElement>; after: Partial<CanvasElement> }[];
}

export interface Branch {
  name: string;
  headVersion: number;
  createdAt: Date;
  lastModified: Date;
}

export interface HistoryNavigationResult {
  success: boolean;
  entry?: HistoryEntry;
  state?: CanvasState;
  error?: string;
}

// ============================================
// Canvas History Service Class
// ============================================

class CanvasHistoryService {
  private readonly MAX_LOCAL_HISTORY = 100;
  private readonly AUTOSAVE_INTERVAL = 30000; // 30 seconds
  private readonly THUMBNAIL_WIDTH = 200;
  private readonly THUMBNAIL_HEIGHT = 150;

  private localHistory: HistoryEntry[] = [];
  private currentIndex = -1;
  private currentProjectId: string | null = null;
  private currentBranch = 'main';
  private autosaveTimer: number | null = null;
  private lastSavedState: string | null = null;

  // Event handlers
  private onHistoryChange?: (history: HistoryEntry[], currentIndex: number) => void;
  private onStateRestore?: (state: CanvasState) => void;

  // ============================================
  // Initialization
  // ============================================

  initialize(
    projectId: string,
    callbacks: {
      onHistoryChange?: (history: HistoryEntry[], currentIndex: number) => void;
      onStateRestore?: (state: CanvasState) => void;
    } = {}
  ): void {
    this.currentProjectId = projectId;
    this.onHistoryChange = callbacks.onHistoryChange;
    this.onStateRestore = callbacks.onStateRestore;
    this.localHistory = [];
    this.currentIndex = -1;
    this.startAutosave();
  }

  dispose(): void {
    this.stopAutosave();
    this.currentProjectId = null;
    this.onHistoryChange = undefined;
    this.onStateRestore = undefined;
  }

  // ============================================
  // History Management
  // ============================================

  pushState(
    state: CanvasState,
    actionLabel: string,
    actionType: HistoryActionType,
    changedElementIds: string[] = []
  ): HistoryEntry {
    if (!this.currentProjectId) {
      throw new Error('Canvas history not initialized');
    }

    // Calculate delta from previous state
    let delta: StateDelta | undefined;
    if (this.currentIndex >= 0) {
      const previousState = this.localHistory[this.currentIndex].canvasState;
      delta = this.calculateDelta(previousState, state);
    }

    // Create new entry
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      projectId: this.currentProjectId,
      versionNumber: this.currentIndex + 2,
      actionLabel,
      actionType,
      canvasState: this.cloneState(state),
      changedElements: changedElementIds,
      delta,
      parentVersion: this.currentIndex >= 0 ? this.localHistory[this.currentIndex].versionNumber : undefined,
      branchName: this.currentBranch,
      isCheckpoint: false,
      isAutosave: false,
      createdAt: new Date(),
    };

    // Remove any redo history (everything after current index)
    this.localHistory = this.localHistory.slice(0, this.currentIndex + 1);

    // Add new entry
    this.localHistory.push(entry);
    this.currentIndex++;

    // Trim history if too long
    if (this.localHistory.length > this.MAX_LOCAL_HISTORY) {
      const removeCount = this.localHistory.length - this.MAX_LOCAL_HISTORY;
      this.localHistory = this.localHistory.slice(removeCount);
      this.currentIndex -= removeCount;
    }

    // Notify listeners
    this.notifyHistoryChange();

    // Sync to database (async, don't await)
    this.syncToDatabase(entry);

    return entry;
  }

  undo(): HistoryNavigationResult {
    if (!this.canUndo()) {
      return { success: false, error: 'Nothing to undo' };
    }

    this.currentIndex--;
    const entry = this.localHistory[this.currentIndex];

    if (this.onStateRestore) {
      this.onStateRestore(entry.canvasState);
    }

    this.notifyHistoryChange();

    return { success: true, entry, state: entry.canvasState };
  }

  redo(): HistoryNavigationResult {
    if (!this.canRedo()) {
      return { success: false, error: 'Nothing to redo' };
    }

    this.currentIndex++;
    const entry = this.localHistory[this.currentIndex];

    if (this.onStateRestore) {
      this.onStateRestore(entry.canvasState);
    }

    this.notifyHistoryChange();

    return { success: true, entry, state: entry.canvasState };
  }

  goToVersion(versionNumber: number): HistoryNavigationResult {
    const index = this.localHistory.findIndex(e => e.versionNumber === versionNumber);

    if (index === -1) {
      return { success: false, error: `Version ${versionNumber} not found` };
    }

    this.currentIndex = index;
    const entry = this.localHistory[index];

    if (this.onStateRestore) {
      this.onStateRestore(entry.canvasState);
    }

    this.notifyHistoryChange();

    return { success: true, entry, state: entry.canvasState };
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.localHistory.length - 1;
  }

  getCurrentEntry(): HistoryEntry | null {
    return this.localHistory[this.currentIndex] || null;
  }

  getHistory(): HistoryEntry[] {
    return [...this.localHistory];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  // ============================================
  // Checkpoints
  // ============================================

  createCheckpoint(name: string, state: CanvasState): HistoryEntry {
    const entry = this.pushState(state, `Checkpoint: ${name}`, 'checkpoint', []);
    entry.isCheckpoint = true;

    // Update in database
    this.syncToDatabase(entry);

    return entry;
  }

  getCheckpoints(): HistoryEntry[] {
    return this.localHistory.filter(e => e.isCheckpoint);
  }

  // ============================================
  // Branching
  // ============================================

  async createBranch(branchName: string): Promise<Branch | null> {
    if (!this.currentProjectId) return null;

    const currentEntry = this.getCurrentEntry();
    if (!currentEntry) return null;

    // Create branch starting from current state
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Insert branch head entry
    const { error } = await supabase
      .from('canvas_history')
      .insert({
        user_id: user.id,
        project_id: this.currentProjectId,
        version_number: 1,
        action_label: `Branch created from version ${currentEntry.versionNumber}`,
        action_type: 'checkpoint',
        canvas_state: currentEntry.canvasState,
        changed_elements: [],
        parent_version: currentEntry.versionNumber,
        branch_name: branchName,
        is_checkpoint: true,
        is_autosave: false,
      });

    if (error) {
      console.error('Failed to create branch:', error);
      return null;
    }

    return {
      name: branchName,
      headVersion: 1,
      createdAt: new Date(),
      lastModified: new Date(),
    };
  }

  async switchBranch(branchName: string): Promise<boolean> {
    if (!this.currentProjectId) return false;

    // Load branch history from database
    const history = await this.loadBranchHistory(branchName);
    if (history.length === 0) return false;

    this.currentBranch = branchName;
    this.localHistory = history;
    this.currentIndex = history.length - 1;

    const latestEntry = history[this.currentIndex];
    if (this.onStateRestore) {
      this.onStateRestore(latestEntry.canvasState);
    }

    this.notifyHistoryChange();

    return true;
  }

  async listBranches(): Promise<Branch[]> {
    if (!this.currentProjectId) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('canvas_history')
      .select('branch_name, version_number, created_at')
      .eq('user_id', user.id)
      .eq('project_id', this.currentProjectId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Failed to list branches:', error);
      return [];
    }

    // Group by branch
    const branchMap = new Map<string, Branch>();

    for (const row of data) {
      const existing = branchMap.get(row.branch_name);
      if (!existing || row.version_number > existing.headVersion) {
        branchMap.set(row.branch_name, {
          name: row.branch_name,
          headVersion: row.version_number,
          createdAt: new Date(row.created_at),
          lastModified: new Date(row.created_at),
        });
      }
    }

    return Array.from(branchMap.values());
  }

  async mergeBranch(sourceBranch: string): Promise<boolean> {
    if (!this.currentProjectId || sourceBranch === this.currentBranch) return false;

    // Load source branch head
    const sourceHistory = await this.loadBranchHistory(sourceBranch);
    if (sourceHistory.length === 0) return false;

    const sourceHead = sourceHistory[sourceHistory.length - 1];

    // Create merge entry in current branch
    this.pushState(
      sourceHead.canvasState,
      `Merged from branch: ${sourceBranch}`,
      'bulk',
      sourceHead.changedElements
    );

    return true;
  }

  // ============================================
  // Autosave
  // ============================================

  private startAutosave(): void {
    if (this.autosaveTimer) return;

    this.autosaveTimer = window.setInterval(() => {
      this.performAutosave();
    }, this.AUTOSAVE_INTERVAL);
  }

  private stopAutosave(): void {
    if (this.autosaveTimer) {
      window.clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  private async performAutosave(): Promise<void> {
    const currentEntry = this.getCurrentEntry();
    if (!currentEntry) return;

    const stateHash = JSON.stringify(currentEntry.canvasState);
    if (stateHash === this.lastSavedState) return;

    // Mark current entry as autosave
    const autosaveEntry: HistoryEntry = {
      ...currentEntry,
      id: crypto.randomUUID(),
      isAutosave: true,
      actionLabel: `Autosave at ${new Date().toLocaleTimeString()}`,
    };

    await this.syncToDatabase(autosaveEntry);
    this.lastSavedState = stateHash;
  }

  // ============================================
  // Delta Calculation
  // ============================================

  private calculateDelta(before: CanvasState, after: CanvasState): StateDelta {
    const beforeMap = new Map(before.elements.map(e => [e.id, e]));
    const afterMap = new Map(after.elements.map(e => [e.id, e]));

    const delta: StateDelta = {
      added: [],
      removed: [],
      modified: [],
    };

    // Find added elements
    for (const element of after.elements) {
      if (!beforeMap.has(element.id)) {
        delta.added!.push(element);
      }
    }

    // Find removed elements
    for (const element of before.elements) {
      if (!afterMap.has(element.id)) {
        delta.removed!.push(element.id);
      }
    }

    // Find modified elements
    for (const element of after.elements) {
      const beforeElement = beforeMap.get(element.id);
      if (beforeElement) {
        const changes = this.getChangedProperties(beforeElement, element);
        if (Object.keys(changes.before).length > 0) {
          delta.modified!.push({
            id: element.id,
            before: changes.before,
            after: changes.after,
          });
        }
      }
    }

    return delta;
  }

  private getChangedProperties(
    before: CanvasElement,
    after: CanvasElement
  ): { before: Partial<CanvasElement>; after: Partial<CanvasElement> } {
    const beforeChanges: Partial<CanvasElement> = {};
    const afterChanges: Partial<CanvasElement> = {};

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const beforeVal = (before as Record<string, unknown>)[key];
      const afterVal = (after as Record<string, unknown>)[key];

      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        (beforeChanges as Record<string, unknown>)[key] = beforeVal;
        (afterChanges as Record<string, unknown>)[key] = afterVal;
      }
    }

    return { before: beforeChanges, after: afterChanges };
  }

  // ============================================
  // Thumbnail Generation
  // ============================================

  async generateThumbnail(state: CanvasState): Promise<string | null> {
    try {
      // Create an offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = this.THUMBNAIL_WIDTH;
      canvas.height = this.THUMBNAIL_HEIGHT;
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      for (const element of state.elements) {
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + element.width);
        maxY = Math.max(maxY, element.y + element.height);
      }

      if (!isFinite(minX)) {
        // No elements, return empty thumbnail
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT);
        return canvas.toDataURL('image/png');
      }

      // Calculate scale to fit
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const scaleX = (this.THUMBNAIL_WIDTH - 20) / contentWidth;
      const scaleY = (this.THUMBNAIL_HEIGHT - 20) / contentHeight;
      const scale = Math.min(scaleX, scaleY, 1);

      // Clear and set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT);

      // Transform to center content
      const offsetX = (this.THUMBNAIL_WIDTH - contentWidth * scale) / 2 - minX * scale;
      const offsetY = (this.THUMBNAIL_HEIGHT - contentHeight * scale) / 2 - minY * scale;

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Render elements (simplified)
      for (const element of state.elements) {
        ctx.save();

        switch (element.type) {
          case 'rect':
            ctx.fillStyle = (element.fill as string) || '#e5e7eb';
            ctx.fillRect(element.x, element.y, element.width, element.height);
            break;

          case 'ellipse':
            ctx.fillStyle = (element.fill as string) || '#e5e7eb';
            ctx.beginPath();
            ctx.ellipse(
              element.x + element.width / 2,
              element.y + element.height / 2,
              element.width / 2,
              element.height / 2,
              0, 0, Math.PI * 2
            );
            ctx.fill();
            break;

          case 'text':
            ctx.fillStyle = (element.fill as string) || '#374151';
            ctx.font = `${(element.fontSize as number) || 14}px sans-serif`;
            ctx.fillText(
              (element.text as string) || '',
              element.x,
              element.y + (element.height || 20)
            );
            break;

          case 'image':
            ctx.fillStyle = '#d1d5db';
            ctx.fillRect(element.x, element.y, element.width, element.height);
            // Draw placeholder icon
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🖼', element.x + element.width / 2, element.y + element.height / 2 + 4);
            break;

          default:
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(element.x, element.y, element.width, element.height);
        }

        ctx.restore();
      }

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }

  // ============================================
  // Database Operations
  // ============================================

  private async syncToDatabase(entry: HistoryEntry): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('canvas_history')
      .upsert({
        id: entry.id,
        user_id: user.id,
        project_id: entry.projectId,
        version_number: entry.versionNumber,
        action_label: entry.actionLabel,
        action_type: entry.actionType,
        canvas_state: entry.canvasState,
        thumbnail_url: entry.thumbnailUrl,
        changed_elements: entry.changedElements,
        delta: entry.delta,
        parent_version: entry.parentVersion,
        branch_name: entry.branchName,
        is_checkpoint: entry.isCheckpoint,
        is_autosave: entry.isAutosave,
      });

    if (error) {
      console.error('Failed to sync history to database:', error);
    }
  }

  async loadProjectHistory(projectId: string, branchName = 'main'): Promise<HistoryEntry[]> {
    this.currentProjectId = projectId;
    this.currentBranch = branchName;

    const history = await this.loadBranchHistory(branchName);

    this.localHistory = history;
    this.currentIndex = history.length - 1;

    this.notifyHistoryChange();

    return history;
  }

  private async loadBranchHistory(branchName: string): Promise<HistoryEntry[]> {
    if (!this.currentProjectId) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('canvas_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', this.currentProjectId)
      .eq('branch_name', branchName)
      .order('version_number', { ascending: true })
      .limit(this.MAX_LOCAL_HISTORY);

    if (error || !data) {
      console.error('Failed to load history:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      projectId: row.project_id,
      versionNumber: row.version_number,
      actionLabel: row.action_label,
      actionType: row.action_type as HistoryActionType,
      canvasState: row.canvas_state as CanvasState,
      thumbnailUrl: row.thumbnail_url,
      changedElements: row.changed_elements || [],
      delta: row.delta as StateDelta | undefined,
      parentVersion: row.parent_version,
      branchName: row.branch_name,
      isCheckpoint: row.is_checkpoint,
      isAutosave: row.is_autosave,
      createdAt: new Date(row.created_at),
    }));
  }

  // ============================================
  // Utilities
  // ============================================

  private cloneState(state: CanvasState): CanvasState {
    return JSON.parse(JSON.stringify(state));
  }

  private notifyHistoryChange(): void {
    if (this.onHistoryChange) {
      this.onHistoryChange([...this.localHistory], this.currentIndex);
    }
  }

  // Get action label for common operations
  static getActionLabel(actionType: HistoryActionType, details?: { count?: number; elementType?: string }): string {
    const count = details?.count || 1;
    const type = details?.elementType || 'element';

    switch (actionType) {
      case 'create':
        return count > 1 ? `Created ${count} ${type}s` : `Created ${type}`;
      case 'update':
        return count > 1 ? `Updated ${count} ${type}s` : `Updated ${type}`;
      case 'delete':
        return count > 1 ? `Deleted ${count} ${type}s` : `Deleted ${type}`;
      case 'move':
        return count > 1 ? `Moved ${count} ${type}s` : `Moved ${type}`;
      case 'resize':
        return count > 1 ? `Resized ${count} ${type}s` : `Resized ${type}`;
      case 'style':
        return `Changed style`;
      case 'group':
        return `Grouped ${count} elements`;
      case 'ungroup':
        return `Ungrouped elements`;
      case 'duplicate':
        return count > 1 ? `Duplicated ${count} ${type}s` : `Duplicated ${type}`;
      case 'paste':
        return `Pasted ${count} element${count > 1 ? 's' : ''}`;
      case 'import':
        return `Imported content`;
      case 'bulk':
        return `Bulk operation`;
      case 'checkpoint':
        return `Checkpoint`;
      case 'autosave':
        return `Autosave`;
      default:
        return 'Unknown action';
    }
  }
}

// Export singleton instance
export const canvasHistoryService = new CanvasHistoryService();
