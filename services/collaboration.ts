/**
 * Real-time Collaboration Service
 *
 * Provides multiplayer features:
 * - Live cursors
 * - Presence indicators
 * - Real-time sync
 * - Conflict resolution
 */

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: string[];
  lastSeen: number;
  isActive: boolean;
}

export interface CollaborationState {
  roomId: string;
  collaborators: Map<string, Collaborator>;
  isConnected: boolean;
  isSyncing: boolean;
}

export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
}

export interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'change' | 'presence' | 'comment';
  userId: string;
  payload: any;
  timestamp: number;
}

// Collaborator colors palette
const COLLABORATOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#06b6d4',
];

class CollaborationService {
  private state: CollaborationState;
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<(event: CollaborationEvent) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: number | null = null;
  private userId: string;
  private userName: string;

  constructor() {
    this.userId = this.generateUserId();
    this.userName = 'Anonymous';
    this.state = {
      roomId: '',
      collaborators: new Map(),
      isConnected: false,
      isSyncing: false,
    };
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomColor(): string {
    return COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
  }

  /**
   * Connect to a collaboration room
   */
  async connect(roomId: string, userName?: string): Promise<void> {
    if (userName) this.userName = userName;
    this.state.roomId = roomId;

    // In production, connect to WebSocket server
    // For now, simulate connection
    console.log(`[Collab] Connecting to room: ${roomId}`);

    return new Promise((resolve) => {
      // Simulate connection delay
      setTimeout(() => {
        this.state.isConnected = true;
        this.startHeartbeat();
        this.emit('presence', { type: 'join', userId: this.userId, userName: this.userName });
        resolve();
      }, 500);
    });
  }

  /**
   * Disconnect from collaboration
   */
  disconnect(): void {
    this.emit('presence', { type: 'leave', userId: this.userId });
    this.stopHeartbeat();
    this.socket?.close();
    this.state.isConnected = false;
    this.state.collaborators.clear();
  }

  /**
   * Update cursor position
   */
  updateCursor(x: number, y: number): void {
    if (!this.state.isConnected) return;

    this.emit('cursor', {
      userId: this.userId,
      x,
      y,
      timestamp: Date.now(),
    });
  }

  /**
   * Update selection
   */
  updateSelection(elementIds: string[]): void {
    if (!this.state.isConnected) return;

    this.emit('selection', {
      userId: this.userId,
      selection: elementIds,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast a change
   */
  broadcastChange(change: any): void {
    if (!this.state.isConnected) return;

    this.emit('change', {
      userId: this.userId,
      change,
      timestamp: Date.now(),
    });
  }

  /**
   * Add a comment
   */
  addComment(elementId: string, text: string, position?: { x: number; y: number }): void {
    if (!this.state.isConnected) return;

    this.emit('comment', {
      userId: this.userId,
      userName: this.userName,
      elementId,
      text,
      position,
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: CollaborationEvent) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event
   */
  private emit(type: string, payload: any): void {
    const event: CollaborationEvent = {
      type: type as any,
      userId: this.userId,
      payload,
      timestamp: Date.now(),
    };

    // Notify local listeners
    this.listeners.get(type)?.forEach((callback) => callback(event));
    this.listeners.get('*')?.forEach((callback) => callback(event));

    // In production, send to WebSocket
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
    }
  }

  /**
   * Get current collaborators
   */
  getCollaborators(): Collaborator[] {
    return Array.from(this.state.collaborators.values());
  }

  /**
   * Get active collaborators (seen in last 30 seconds)
   */
  getActiveCollaborators(): Collaborator[] {
    const threshold = Date.now() - 30000;
    return this.getCollaborators().filter((c) => c.lastSeen > threshold);
  }

  /**
   * Start heartbeat to maintain presence
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      this.emit('presence', { type: 'heartbeat', userId: this.userId });
    }, 10000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get connection state
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Get current user ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Get room ID
   */
  getRoomId(): string {
    return this.state.roomId;
  }
}

// Singleton instance
export const collaboration = new CollaborationService();

export default collaboration;
