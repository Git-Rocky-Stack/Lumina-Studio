// ============================================================================
// REAL-TIME COLLABORATION SERVICE
// ============================================================================

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  generateRandomColor,
  ACTIVITY_LABELS
} from '../types/collaboration';
import type {
  UserPresence,
  CursorData,
  SelectionHighlight,
  CommentThread,
  Comment,
  ActivityItem,
  CollaborationSession,
  Collaborator,
  CollaboratorRole,
  ProjectInvitation,
  RealtimeEvent,
  CursorMovePayload,
  SelectionChangePayload,
  ActivityType
} from '../types/collaboration';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  USER_COLOR: 'lumina_collab_color',
  CACHED_SESSIONS: 'lumina_collab_sessions'
};

// ============================================================================
// COLLABORATION MANAGER
// ============================================================================

class CollaborationManager {
  private channel: RealtimeChannel | null = null;
  private projectId: string | null = null;
  private userId: string | null = null;
  private userName: string = 'Anonymous';
  private userColor: string = generateRandomColor();
  private userAvatar: string | null = null;

  // Local state
  private presenceMap: Map<string, UserPresence> = new Map();
  private cursorMap: Map<string, CursorData> = new Map();
  private selectionMap: Map<string, SelectionHighlight> = new Map();

  // Callbacks
  private onPresenceUpdate: ((users: Map<string, UserPresence>) => void) | null = null;
  private onCursorUpdate: ((cursors: Map<string, CursorData>) => void) | null = null;
  private onSelectionUpdate: ((selections: Map<string, SelectionHighlight>) => void) | null = null;
  private onActivityEvent: ((activity: ActivityItem) => void) | null = null;
  private onCommentEvent: ((thread: CommentThread, action: 'create' | 'update' | 'delete') => void) | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;

  // Throttling
  private cursorThrottle: number | null = null;
  private lastCursorUpdate = 0;
  private CURSOR_THROTTLE_MS = 50;

  constructor() {
    // Load user color from storage
    const savedColor = localStorage.getItem(STORAGE_KEYS.USER_COLOR);
    if (savedColor) {
      this.userColor = savedColor;
    } else {
      localStorage.setItem(STORAGE_KEYS.USER_COLOR, this.userColor);
    }
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to a project's collaboration channel
   */
  async connect(
    projectId: string,
    user: { id: string; name: string; avatar?: string }
  ): Promise<void> {
    // Disconnect from any existing channel
    await this.disconnect();

    this.projectId = projectId;
    this.userId = user.id;
    this.userName = user.name;
    this.userAvatar = user.avatar || null;

    // Create realtime channel
    this.channel = supabase.channel(`project:${projectId}`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: false }
      }
    });

    // Set up presence
    this.channel.on('presence', { event: 'sync' }, () => {
      this.handlePresenceSync();
    });

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      this.handlePresenceJoin(key, newPresences);
    });

    this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      this.handlePresenceLeave(key, leftPresences);
    });

    // Set up broadcast listeners
    this.channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      this.handleCursorBroadcast(payload);
    });

    this.channel.on('broadcast', { event: 'selection' }, ({ payload }) => {
      this.handleSelectionBroadcast(payload);
    });

    this.channel.on('broadcast', { event: 'activity' }, ({ payload }) => {
      this.handleActivityBroadcast(payload);
    });

    this.channel.on('broadcast', { event: 'comment' }, ({ payload }) => {
      this.handleCommentBroadcast(payload);
    });

    // Subscribe and track presence
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track user presence
        await this.channel?.track({
          odifier: user.id,
          name: user.name,
          avatar: user.avatar,
          color: this.userColor,
          status: 'online',
          cursor: null,
          selection: null,
          currentView: 'canvas',
          lastUpdate: Date.now(),
          joinedAt: Date.now()
        });

        this.onConnectionChange?.(true);

        // Broadcast join activity
        this.broadcastActivity('join', `joined the project`);
      }
    });
  }

  /**
   * Disconnect from current channel
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      // Broadcast leave activity
      this.broadcastActivity('leave', `left the project`);

      await this.channel.unsubscribe();
      this.channel = null;
    }

    this.projectId = null;
    this.presenceMap.clear();
    this.cursorMap.clear();
    this.selectionMap.clear();
    this.onConnectionChange?.(false);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.channel !== null;
  }

  // ============================================================================
  // PRESENCE HANDLERS
  // ============================================================================

  private handlePresenceSync(): void {
    if (!this.channel) return;

    const state = this.channel.presenceState<UserPresence>();
    this.presenceMap.clear();

    Object.entries(state).forEach(([key, presences]) => {
      const presence = presences[0];
      if (presence && presence.odifier !== this.userId) {
        this.presenceMap.set(key, presence);
      }
    });

    this.onPresenceUpdate?.(this.presenceMap);
  }

  private handlePresenceJoin(key: string, newPresences: UserPresence[]): void {
    const presence = newPresences[0];
    if (presence && presence.odifier !== this.userId) {
      this.presenceMap.set(key, presence);
      this.onPresenceUpdate?.(this.presenceMap);
    }
  }

  private handlePresenceLeave(key: string, leftPresences: UserPresence[]): void {
    this.presenceMap.delete(key);
    this.cursorMap.delete(key);
    this.selectionMap.delete(key);

    this.onPresenceUpdate?.(this.presenceMap);
    this.onCursorUpdate?.(this.cursorMap);
    this.onSelectionUpdate?.(this.selectionMap);
  }

  // ============================================================================
  // CURSOR & SELECTION
  // ============================================================================

  /**
   * Update local cursor position and broadcast
   */
  updateCursor(x: number, y: number, viewportX?: number, viewportY?: number): void {
    if (!this.channel || !this.userId) return;

    const now = Date.now();
    if (now - this.lastCursorUpdate < this.CURSOR_THROTTLE_MS) {
      // Throttle cursor updates
      if (this.cursorThrottle) {
        window.clearTimeout(this.cursorThrottle);
      }
      this.cursorThrottle = window.setTimeout(() => {
        this.broadcastCursor(x, y, viewportX, viewportY);
      }, this.CURSOR_THROTTLE_MS);
      return;
    }

    this.broadcastCursor(x, y, viewportX, viewportY);
  }

  private broadcastCursor(x: number, y: number, viewportX?: number, viewportY?: number): void {
    this.lastCursorUpdate = Date.now();

    this.channel?.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        senderId: this.userId,
        senderName: this.userName,
        color: this.userColor,
        x,
        y,
        viewportX: viewportX ?? x,
        viewportY: viewportY ?? y
      }
    });
  }

  private handleCursorBroadcast(payload: any): void {
    if (payload.senderId === this.userId) return;

    this.cursorMap.set(payload.senderId, {
      odifier: payload.senderId,
      name: payload.senderName,
      color: payload.color,
      x: payload.x,
      y: payload.y
    });

    this.onCursorUpdate?.(this.cursorMap);
  }

  /**
   * Update selection and broadcast
   */
  updateSelection(elementIds: string[], bounds?: { x: number; y: number; width: number; height: number }): void {
    if (!this.channel || !this.userId) return;

    this.channel.send({
      type: 'broadcast',
      event: 'selection',
      payload: {
        senderId: this.userId,
        senderName: this.userName,
        color: this.userColor,
        elementIds,
        bounds
      }
    });
  }

  private handleSelectionBroadcast(payload: any): void {
    if (payload.senderId === this.userId) return;

    if (payload.elementIds.length === 0) {
      this.selectionMap.delete(payload.senderId);
    } else {
      this.selectionMap.set(payload.senderId, {
        odifier: payload.senderId,
        color: payload.color,
        elementIds: payload.elementIds,
        bounds: payload.bounds
      });
    }

    this.onSelectionUpdate?.(this.selectionMap);
  }

  // ============================================================================
  // ACTIVITY FEED
  // ============================================================================

  /**
   * Broadcast activity event
   */
  broadcastActivity(type: ActivityType, description?: string, metadata?: Record<string, any>): void {
    if (!this.channel || !this.userId) return;

    const activity: ActivityItem = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: this.projectId!,
      type,
      actorId: this.userId,
      actorName: this.userName,
      actorAvatar: this.userAvatar || undefined,
      description: description || ACTIVITY_LABELS[type],
      metadata,
      timestamp: new Date().toISOString()
    };

    this.channel.send({
      type: 'broadcast',
      event: 'activity',
      payload: activity
    });

    // Also trigger locally
    this.onActivityEvent?.(activity);
  }

  private handleActivityBroadcast(payload: ActivityItem): void {
    if (payload.actorId === this.userId) return;
    this.onActivityEvent?.(payload);
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================

  /**
   * Create a new comment thread
   */
  async createThread(
    position: CommentThread['position'],
    content: string
  ): Promise<CommentThread> {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const thread: CommentThread = {
      id: threadId,
      projectId: this.projectId!,
      position,
      comments: [{
        id: commentId,
        threadId,
        authorId: this.userId!,
        authorName: this.userName,
        authorAvatar: this.userAvatar || undefined,
        content,
        createdAt: new Date().toISOString()
      }],
      status: 'open',
      createdBy: this.userId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Broadcast to other users
    this.channel?.send({
      type: 'broadcast',
      event: 'comment',
      payload: { action: 'create', thread }
    });

    // Broadcast activity
    this.broadcastActivity('comment', 'added a comment');

    return thread;
  }

  /**
   * Add comment to existing thread
   */
  async addComment(threadId: string, content: string): Promise<Comment> {
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threadId,
      authorId: this.userId!,
      authorName: this.userName,
      authorAvatar: this.userAvatar || undefined,
      content,
      createdAt: new Date().toISOString()
    };

    // Broadcast to other users
    this.channel?.send({
      type: 'broadcast',
      event: 'comment',
      payload: { action: 'add', threadId, comment }
    });

    // Broadcast activity
    this.broadcastActivity('reply', 'replied to a comment');

    return comment;
  }

  /**
   * Resolve a thread
   */
  async resolveThread(threadId: string): Promise<void> {
    this.channel?.send({
      type: 'broadcast',
      event: 'comment',
      payload: {
        action: 'resolve',
        threadId,
        resolvedBy: this.userId,
        resolvedAt: new Date().toISOString()
      }
    });

    this.broadcastActivity('resolve', 'resolved a comment');
  }

  private handleCommentBroadcast(payload: any): void {
    // The parent component handles comment state updates
    this.onCommentEvent?.(payload.thread || { id: payload.threadId }, payload.action);
  }

  // ============================================================================
  // SHARING & INVITATIONS
  // ============================================================================

  /**
   * Generate share link
   */
  async generateShareLink(role: CollaboratorRole = 'viewer'): Promise<string> {
    const token = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/join/${this.projectId}?token=${token}&role=${role}`;

    this.broadcastActivity('share', 'generated a share link');

    return link;
  }

  /**
   * Invite user by email
   */
  async inviteUser(email: string, role: CollaboratorRole): Promise<ProjectInvitation> {
    const invitation: ProjectInvitation = {
      id: `invite_${Date.now()}`,
      projectId: this.projectId!,
      email,
      role,
      invitedBy: this.userId!,
      invitedAt: new Date().toISOString(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    this.broadcastActivity('share', `invited ${email}`);

    return invitation;
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnPresenceUpdate(callback: (users: Map<string, UserPresence>) => void): void {
    this.onPresenceUpdate = callback;
  }

  setOnCursorUpdate(callback: (cursors: Map<string, CursorData>) => void): void {
    this.onCursorUpdate = callback;
  }

  setOnSelectionUpdate(callback: (selections: Map<string, SelectionHighlight>) => void): void {
    this.onSelectionUpdate = callback;
  }

  setOnActivityEvent(callback: (activity: ActivityItem) => void): void {
    this.onActivityEvent = callback;
  }

  setOnCommentEvent(callback: (thread: CommentThread, action: 'create' | 'update' | 'delete') => void): void {
    this.onCommentEvent = callback;
  }

  setOnConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getPresence(): Map<string, UserPresence> {
    return this.presenceMap;
  }

  getCursors(): Map<string, CursorData> {
    return this.cursorMap;
  }

  getSelections(): Map<string, SelectionHighlight> {
    return this.selectionMap;
  }

  getUserColor(): string {
    return this.userColor;
  }

  setUserColor(color: string): void {
    this.userColor = color;
    localStorage.setItem(STORAGE_KEYS.USER_COLOR, color);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const collaborationManager = new CollaborationManager();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format relative time
 */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Check if user can perform action based on role
 */
export function canPerformAction(
  role: CollaboratorRole,
  action: 'edit' | 'comment' | 'share' | 'delete' | 'manage'
): boolean {
  const permissions: Record<CollaboratorRole, Record<string, boolean>> = {
    owner: { edit: true, comment: true, share: true, delete: true, manage: true },
    editor: { edit: true, comment: true, share: true, delete: false, manage: false },
    commenter: { edit: false, comment: true, share: false, delete: false, manage: false },
    viewer: { edit: false, comment: false, share: false, delete: false, manage: false }
  };

  return permissions[role]?.[action] ?? false;
}
