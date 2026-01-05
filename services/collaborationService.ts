// ============================================================================
// REAL-TIME COLLABORATION SERVICE
// ============================================================================

import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
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
  ActivityType,
  // New room-based types
  CollaborationRoom,
  CollaborationResourceType,
  RoomParticipant,
  CursorPosition,
  SelectionRange,
  CollaborationOperation,
  OperationType,
  CollaborationVersion,
  RoomInvitation,
  RoomPresenceState
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

// ============================================================================
// ROOM-BASED COLLABORATION SERVICE
// ============================================================================

/**
 * Room-based collaboration manager with database persistence
 * Integrates with Supabase Realtime for presence and operations
 */
class RoomCollaborationManager {
  private roomChannel: RealtimeChannel | null = null;
  private currentRoom: CollaborationRoom | null = null;
  private userId: string | null = null;
  private vectorClock: Record<string, number> = {};

  // State
  private roomPresence: RoomPresenceState = {
    participants: [],
    cursors: new Map(),
    selections: new Map(),
    lastUpdated: 0,
  };

  // Callbacks
  private onPresenceChange: ((state: RoomPresenceState) => void) | null = null;
  private onOperationReceived: ((operation: CollaborationOperation) => void) | null = null;
  private onCommentChange: ((comment: any, action: 'insert' | 'update' | 'delete') => void) | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  // Throttling
  private cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingCursor: CursorPosition | null = null;
  private isConnected = false;

  // ============================================================================
  // ROOM MANAGEMENT
  // ============================================================================

  /**
   * Create a new collaboration room
   */
  async createRoom(
    resourceType: CollaborationResourceType,
    resourceId: string,
    name: string,
    options: {
      isPublic?: boolean;
      maxParticipants?: number;
      settings?: Record<string, any>;
    } = {}
  ): Promise<CollaborationRoom | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.onError?.('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('collaboration_rooms')
      .insert({
        name,
        resource_type: resourceType,
        resource_id: resourceId,
        created_by: user.id,
        is_public: options.isPublic ?? false,
        max_participants: options.maxParticipants ?? 10,
        settings: options.settings ?? {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create room:', error);
      this.onError?.('Failed to create collaboration room');
      return null;
    }

    return data;
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<CollaborationRoom | null> {
    const { data, error } = await supabase
      .from('collaboration_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Failed to get room:', error);
      return null;
    }

    return data;
  }

  /**
   * Find or create room for a resource
   */
  async getOrCreateRoom(
    resourceType: CollaborationResourceType,
    resourceId: string,
    name: string
  ): Promise<CollaborationRoom | null> {
    // Try to find existing room
    const { data: existing } = await supabase
      .from('collaboration_rooms')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .single();

    if (existing) return existing;

    // Create new room
    return this.createRoom(resourceType, resourceId, name);
  }

  /**
   * Delete a collaboration room
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    const { error } = await supabase
      .from('collaboration_rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      console.error('Failed to delete room:', error);
      return false;
    }

    return true;
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Join a collaboration room
   */
  async joinRoom(roomId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.onError?.('User not authenticated');
      return false;
    }

    // Leave current room if any
    if (this.currentRoom) {
      await this.leaveRoom();
    }

    // Get room info
    const room = await this.getRoom(roomId);
    if (!room) {
      this.onError?.('Room not found');
      return false;
    }

    this.currentRoom = room;
    this.userId = user.id;
    this.vectorClock = { [user.id]: 0 };

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single();

    const displayName = profile?.display_name || user.email?.split('@')[0] || 'Anonymous';
    const avatarUrl = profile?.avatar_url;

    // Join room in database (calls the stored procedure)
    const { data: participant, error: joinError } = await supabase
      .rpc('join_collaboration_room', {
        p_room_id: roomId,
        p_user_id: user.id,
      });

    if (joinError) {
      console.error('Failed to join room:', joinError);
      this.onError?.('Failed to join room');
      return false;
    }

    // Set up Realtime channel
    this.roomChannel = supabase.channel(`collab-room:${roomId}`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: false },
      },
    });

    // Handle presence sync
    this.roomChannel.on('presence', { event: 'sync' }, () => {
      this.handleRoomPresenceSync();
    });

    this.roomChannel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log(`User ${key} joined room`);
      this.handleRoomPresenceSync();
    });

    this.roomChannel.on('presence', { event: 'leave' }, ({ key }) => {
      console.log(`User ${key} left room`);
      this.roomPresence.cursors.delete(key);
      this.roomPresence.selections.delete(key);
      this.handleRoomPresenceSync();
    });

    // Handle cursor broadcasts
    this.roomChannel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload.user_id !== this.userId) {
        this.roomPresence.cursors.set(payload.user_id, payload.position);
        this.notifyPresenceChange();
      }
    });

    // Handle selection broadcasts
    this.roomChannel.on('broadcast', { event: 'selection' }, ({ payload }) => {
      if (payload.user_id !== this.userId) {
        if (payload.selection) {
          this.roomPresence.selections.set(payload.user_id, payload.selection);
        } else {
          this.roomPresence.selections.delete(payload.user_id);
        }
        this.notifyPresenceChange();
      }
    });

    // Handle operation broadcasts
    this.roomChannel.on('broadcast', { event: 'operation' }, ({ payload }) => {
      if (payload.user_id !== this.userId) {
        this.mergeVectorClock(payload.vector_clock);
        this.onOperationReceived?.(payload);
      }
    });

    // Subscribe to database changes for comments
    this.roomChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'collaboration_comments',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const action = payload.eventType.toLowerCase() as 'insert' | 'update' | 'delete';
        this.onCommentChange?.(payload.new || payload.old, action);
      }
    );

    // Subscribe
    await this.roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.isConnected = true;
        this.onConnectionChange?.(true);

        // Track presence
        await this.roomChannel?.track({
          user_id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          color: participant?.color || generateRandomColor(),
          status: 'active',
          joined_at: new Date().toISOString(),
        });
      }
    });

    return true;
  }

  /**
   * Leave current room
   */
  async leaveRoom(): Promise<void> {
    if (!this.roomChannel || !this.currentRoom || !this.userId) return;

    // Leave room in database
    await supabase.rpc('leave_collaboration_room', {
      p_room_id: this.currentRoom.id,
      p_user_id: this.userId,
    });

    // Untrack and unsubscribe
    await this.roomChannel.untrack();
    await this.roomChannel.unsubscribe();

    // Reset state
    this.roomChannel = null;
    this.currentRoom = null;
    this.userId = null;
    this.vectorClock = {};
    this.isConnected = false;
    this.roomPresence = {
      participants: [],
      cursors: new Map(),
      selections: new Map(),
      lastUpdated: 0,
    };

    this.onConnectionChange?.(false);
  }

  // ============================================================================
  // PRESENCE & CURSOR
  // ============================================================================

  /**
   * Update cursor position (throttled)
   */
  updateCursor(position: CursorPosition): void {
    if (!this.roomChannel || !this.isConnected) return;

    this.pendingCursor = position;

    if (!this.cursorThrottleTimer) {
      this.cursorThrottleTimer = setTimeout(() => {
        if (this.pendingCursor && this.roomChannel) {
          this.roomChannel.send({
            type: 'broadcast',
            event: 'cursor',
            payload: {
              user_id: this.userId,
              position: this.pendingCursor,
              timestamp: Date.now(),
            },
          });
        }
        this.cursorThrottleTimer = null;
        this.pendingCursor = null;
      }, 16); // ~60fps
    }
  }

  /**
   * Update selection
   */
  updateSelection(selection: SelectionRange | null): void {
    if (!this.roomChannel || !this.isConnected) return;

    this.roomChannel.send({
      type: 'broadcast',
      event: 'selection',
      payload: {
        user_id: this.userId,
        selection,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Update user status
   */
  async updateStatus(status: 'active' | 'idle' | 'away'): Promise<void> {
    if (!this.roomChannel || !this.isConnected) return;

    const presenceState = this.roomChannel.presenceState();
    const myPresence = presenceState[this.userId!]?.[0];

    if (myPresence) {
      await this.roomChannel.track({
        ...myPresence,
        status,
        last_seen_at: new Date().toISOString(),
      });
    }
  }

  // ============================================================================
  // OPERATIONS (CRDT-STYLE)
  // ============================================================================

  /**
   * Send an operation to the room
   */
  async sendOperation(
    operationType: OperationType,
    targetType: string,
    operationData: Record<string, any>,
    targetId?: string
  ): Promise<CollaborationOperation | null> {
    if (!this.currentRoom || !this.userId) return null;

    // Increment vector clock
    this.vectorClock[this.userId] = (this.vectorClock[this.userId] || 0) + 1;

    const operation = {
      room_id: this.currentRoom.id,
      user_id: this.userId,
      operation_type: operationType,
      target_type: targetType,
      target_id: targetId,
      operation_data: operationData,
      vector_clock: { ...this.vectorClock },
      client_timestamp: new Date().toISOString(),
    };

    // Persist to database
    const { data, error } = await supabase
      .from('collaboration_operations')
      .insert(operation)
      .select()
      .single();

    if (error) {
      console.error('Failed to save operation:', error);
      return null;
    }

    // Broadcast to others
    if (this.roomChannel && this.isConnected) {
      this.roomChannel.send({
        type: 'broadcast',
        event: 'operation',
        payload: data,
      });
    }

    return data;
  }

  /**
   * Get operation history
   */
  async getOperationHistory(since?: Date, limit = 100): Promise<CollaborationOperation[]> {
    if (!this.currentRoom) return [];

    let query = supabase
      .from('collaboration_operations')
      .select('*')
      .eq('room_id', this.currentRoom.id)
      .order('server_timestamp', { ascending: true })
      .limit(limit);

    if (since) {
      query = query.gte('server_timestamp', since.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get operations:', error);
      return [];
    }

    // Merge vector clocks
    for (const op of data || []) {
      this.mergeVectorClock(op.vector_clock);
    }

    return data || [];
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================

  /**
   * Add a comment to the room
   */
  async addComment(
    content: string,
    positionData?: Record<string, any>,
    parentId?: string
  ): Promise<any | null> {
    if (!this.currentRoom || !this.userId) return null;

    const { data, error } = await supabase
      .from('collaboration_comments')
      .insert({
        room_id: this.currentRoom.id,
        user_id: this.userId,
        parent_id: parentId,
        content,
        position_data: positionData,
      })
      .select(`
        *,
        author:user_profiles(display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Failed to add comment:', error);
      return null;
    }

    return data;
  }

  /**
   * Get all comments for the room
   */
  async getComments(): Promise<any[]> {
    if (!this.currentRoom) return [];

    const { data, error } = await supabase
      .from('collaboration_comments')
      .select(`
        *,
        author:user_profiles(display_name, avatar_url)
      `)
      .eq('room_id', this.currentRoom.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to get comments:', error);
      return [];
    }

    // Get replies
    const withReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('collaboration_comments')
          .select(`*, author:user_profiles(display_name, avatar_url)`)
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true });
        return { ...comment, replies: replies || [] };
      })
    );

    return withReplies;
  }

  /**
   * Resolve a comment
   */
  async resolveComment(commentId: string, resolved = true): Promise<boolean> {
    const { error } = await supabase
      .from('collaboration_comments')
      .update({ is_resolved: resolved })
      .eq('id', commentId);

    if (error) {
      console.error('Failed to resolve comment:', error);
      return false;
    }

    return true;
  }

  // ============================================================================
  // INVITATIONS
  // ============================================================================

  /**
   * Invite user to room by email
   */
  async inviteUser(
    email: string,
    permissionLevel: 'view' | 'comment' | 'edit' | 'admin' = 'edit'
  ): Promise<RoomInvitation | null> {
    if (!this.currentRoom || !this.userId) return null;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    const { data, error } = await supabase
      .from('room_invitations')
      .insert({
        room_id: this.currentRoom.id,
        inviter_id: this.userId,
        invitee_email: email,
        invitee_id: existingUser?.id,
        permission_level: permissionLevel,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create invitation:', error);
      return null;
    }

    return data;
  }

  /**
   * Get pending invitations for current user
   */
  async getPendingInvitations(): Promise<RoomInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('room_invitations')
      .select(`
        *,
        room:collaboration_rooms(name, resource_type),
        inviter:user_profiles!inviter_id(display_name, avatar_url)
      `)
      .or(`invitee_id.eq.${user.id},invitee_email.eq.${user.email}`)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to get invitations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(invitationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('room_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (error) {
      console.error('Failed to accept invitation:', error);
      return false;
    }

    return true;
  }

  // ============================================================================
  // VERSION SNAPSHOTS
  // ============================================================================

  /**
   * Create a version snapshot
   */
  async createSnapshot(
    snapshotData: Record<string, any>,
    description?: string
  ): Promise<string | null> {
    if (!this.currentRoom || !this.userId) return null;

    const { data, error } = await supabase.rpc('create_version_snapshot', {
      p_room_id: this.currentRoom.id,
      p_user_id: this.userId,
      p_snapshot_data: snapshotData,
      p_description: description,
    });

    if (error) {
      console.error('Failed to create snapshot:', error);
      return null;
    }

    return data;
  }

  /**
   * Get version history
   */
  async getVersionHistory(): Promise<CollaborationVersion[]> {
    if (!this.currentRoom) return [];

    const { data, error } = await supabase
      .from('collaboration_versions')
      .select(`
        id,
        version_number,
        description,
        created_at,
        author:user_profiles!created_by(display_name, avatar_url)
      `)
      .eq('room_id', this.currentRoom.id)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Failed to get versions:', error);
      return [];
    }

    return (data || []).map((v: any) => ({
      ...v,
      room_id: this.currentRoom!.id,
      snapshot_data: {},
      created_by: '',
    }));
  }

  /**
   * Restore a version snapshot
   */
  async restoreVersion(versionId: string): Promise<Record<string, any> | null> {
    const { data, error } = await supabase
      .from('collaboration_versions')
      .select('snapshot_data')
      .eq('id', versionId)
      .single();

    if (error) {
      console.error('Failed to restore version:', error);
      return null;
    }

    return data?.snapshot_data;
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnPresenceChange(callback: (state: RoomPresenceState) => void): void {
    this.onPresenceChange = callback;
  }

  setOnOperationReceived(callback: (operation: CollaborationOperation) => void): void {
    this.onOperationReceived = callback;
  }

  setOnCommentChange(callback: (comment: any, action: 'insert' | 'update' | 'delete') => void): void {
    this.onCommentChange = callback;
  }

  setOnConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getCurrentRoom(): CollaborationRoom | null {
    return this.currentRoom;
  }

  getPresenceState(): RoomPresenceState {
    return this.roomPresence;
  }

  isInRoom(): boolean {
    return this.isConnected && !!this.currentRoom;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private handleRoomPresenceSync(): void {
    if (!this.roomChannel) return;

    const state = this.roomChannel.presenceState() as RealtimePresenceState<any>;
    const participants: RoomParticipant[] = [];

    for (const [userId, presences] of Object.entries(state)) {
      const presence = presences[0];
      if (presence) {
        participants.push({
          id: `${this.currentRoom?.id}-${userId}`,
          room_id: this.currentRoom?.id || '',
          user_id: userId,
          display_name: presence.display_name,
          avatar_url: presence.avatar_url,
          color: presence.color,
          permission_level: 'edit',
          cursor_position: this.roomPresence.cursors.get(userId),
          selection_range: this.roomPresence.selections.get(userId),
          status: presence.status,
          joined_at: presence.joined_at,
          last_seen_at: presence.last_seen_at || presence.joined_at,
        });
      }
    }

    this.roomPresence.participants = participants;
    this.roomPresence.lastUpdated = Date.now();
    this.notifyPresenceChange();
  }

  private notifyPresenceChange(): void {
    this.onPresenceChange?.(this.roomPresence);
  }

  private mergeVectorClock(remoteClock: Record<string, number>): void {
    for (const [userId, timestamp] of Object.entries(remoteClock)) {
      this.vectorClock[userId] = Math.max(
        this.vectorClock[userId] || 0,
        timestamp
      );
    }
  }
}

// Export room collaboration manager singleton
export const roomCollaborationManager = new RoomCollaborationManager();
