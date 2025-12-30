// ============================================================================
// REAL-TIME COLLABORATION SYSTEM - TYPE DEFINITIONS
// ============================================================================

/**
 * Collaboration roles
 */
export type CollaboratorRole = 'owner' | 'editor' | 'commenter' | 'viewer';

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * Comment status
 */
export type CommentStatus = 'open' | 'resolved' | 'archived';

/**
 * Activity types for the feed
 */
export type ActivityType =
  | 'join'
  | 'leave'
  | 'edit'
  | 'comment'
  | 'reply'
  | 'resolve'
  | 'export'
  | 'share'
  | 'rename'
  | 'version_save';

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Collaborator information
 */
export interface Collaborator {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: CollaboratorRole;
  color: string; // Unique color for cursor/highlights
  joinedAt: string;
  lastActiveAt: string;
}

/**
 * Real-time presence data
 */
export interface UserPresence {
  id: string;
  odifier: string;
  name: string;
  avatar?: string;
  color: string;
  status: PresenceStatus;

  // Cursor position
  cursor?: {
    x: number;
    y: number;
    viewportX: number;
    viewportY: number;
  };

  // Current selection
  selection?: {
    elementIds: string[];
    bounds?: { x: number; y: number; width: number; height: number };
  };

  // Current view/context
  currentView?: string;
  currentTool?: string;

  // Timestamps
  lastUpdate: number;
  joinedAt: number;
}

/**
 * Cursor data for rendering
 */
export interface CursorData {
  odifier: string;
  name: string;
  color: string;
  x: number;
  y: number;
  isTyping?: boolean;
  isSelecting?: boolean;
}

/**
 * Selection highlight
 */
export interface SelectionHighlight {
  odifier: string;
  color: string;
  elementIds: string[];
  bounds?: { x: number; y: number; width: number; height: number };
}

// ============================================================================
// COMMENTS & ANNOTATIONS
// ============================================================================

/**
 * Comment thread
 */
export interface CommentThread {
  id: string;
  projectId: string;

  // Position (for pinned comments)
  position?: {
    x: number;
    y: number;
    elementId?: string;
    pageId?: string;
  };

  // Thread content
  comments: Comment[];
  status: CommentStatus;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

/**
 * Individual comment
 */
export interface Comment {
  id: string;
  threadId: string;

  // Author
  authorId: string;
  authorName: string;
  authorAvatar?: string;

  // Content
  content: string;
  mentions?: string[]; // User IDs
  attachments?: CommentAttachment[];

  // Reactions
  reactions?: CommentReaction[];

  // Timestamps
  createdAt: string;
  editedAt?: string;
  isEdited?: boolean;
}

/**
 * Comment attachment
 */
export interface CommentAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

/**
 * Comment reaction
 */
export interface CommentReaction {
  emoji: string;
  users: string[];
  count: number;
}

// ============================================================================
// ACTIVITY FEED
// ============================================================================

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: string;
  projectId: string;
  type: ActivityType;

  // Actor
  actorId: string;
  actorName: string;
  actorAvatar?: string;

  // Activity details
  description: string;
  metadata?: Record<string, any>;

  // Target (optional)
  targetId?: string;
  targetType?: 'element' | 'comment' | 'page' | 'project';

  // Timestamp
  timestamp: string;
}

// ============================================================================
// PROJECT & SESSION
// ============================================================================

/**
 * Collaboration session
 */
export interface CollaborationSession {
  id: string;
  projectId: string;
  projectName: string;

  // Participants
  collaborators: Collaborator[];
  activeUsers: UserPresence[];

  // State
  isConnected: boolean;
  connectionQuality: 'good' | 'fair' | 'poor';

  // Comments
  threads: CommentThread[];
  unresolvedCount: number;

  // Activity
  recentActivity: ActivityItem[];

  // Permissions
  userRole: CollaboratorRole;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
}

/**
 * Project sharing settings
 */
export interface SharingSettings {
  projectId: string;

  // Access level
  isPublic: boolean;
  publicRole: CollaboratorRole;

  // Link sharing
  shareLink?: string;
  linkExpiresAt?: string;

  // Invited users
  invitations: ProjectInvitation[];
}

/**
 * Project invitation
 */
export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  role: CollaboratorRole;
  invitedBy: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt?: string;
}

// ============================================================================
// REAL-TIME EVENTS
// ============================================================================

/**
 * Real-time event types
 */
export type RealtimeEventType =
  | 'presence:join'
  | 'presence:leave'
  | 'presence:update'
  | 'cursor:move'
  | 'selection:change'
  | 'element:create'
  | 'element:update'
  | 'element:delete'
  | 'comment:create'
  | 'comment:update'
  | 'comment:delete'
  | 'thread:resolve'
  | 'thread:reopen';

/**
 * Real-time event payload
 */
export interface RealtimeEvent<T = any> {
  type: RealtimeEventType;
  senderId: string;
  senderName: string;
  timestamp: number;
  payload: T;
}

/**
 * Cursor move event payload
 */
export interface CursorMovePayload {
  x: number;
  y: number;
  viewportX: number;
  viewportY: number;
}

/**
 * Selection change event payload
 */
export interface SelectionChangePayload {
  elementIds: string[];
  bounds?: { x: number; y: number; width: number; height: number };
}

/**
 * Element update event payload
 */
export interface ElementUpdatePayload {
  elementId: string;
  changes: Record<string, any>;
  timestamp: number;
}

// ============================================================================
// COLLABORATION CONTEXT
// ============================================================================

/**
 * Collaboration context state
 */
export interface CollaborationState {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  connectionError?: string;

  // Session
  session: CollaborationSession | null;
  projectId: string | null;

  // Presence
  activeUsers: Map<string, UserPresence>;
  cursors: Map<string, CursorData>;
  selections: Map<string, SelectionHighlight>;

  // User state
  currentUser: {
    id: string;
    name: string;
    color: string;
    role: CollaboratorRole;
  } | null;

  // Comments
  threads: CommentThread[];
  activeThread: CommentThread | null;

  // Activity
  activityFeed: ActivityItem[];

  // UI state
  showPresencePanel: boolean;
  showCommentsPanel: boolean;
  showActivityFeed: boolean;
}

/**
 * Collaboration context actions
 */
export interface CollaborationActions {
  // Connection
  connect: (projectId: string) => Promise<void>;
  disconnect: () => void;

  // Presence
  updatePresence: (data: Partial<UserPresence>) => void;
  updateCursor: (x: number, y: number) => void;
  updateSelection: (elementIds: string[]) => void;

  // Comments
  createThread: (position: CommentThread['position'], content: string) => Promise<CommentThread>;
  addComment: (threadId: string, content: string) => Promise<Comment>;
  resolveThread: (threadId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

  // Sharing
  inviteUser: (email: string, role: CollaboratorRole) => Promise<ProjectInvitation>;
  removeCollaborator: (userId: string) => Promise<void>;
  updateRole: (userId: string, role: CollaboratorRole) => Promise<void>;
  generateShareLink: () => Promise<string>;

  // UI
  togglePresencePanel: () => void;
  toggleCommentsPanel: () => void;
  toggleActivityFeed: () => void;
  setActiveThread: (thread: CommentThread | null) => void;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate random collaborator color
 */
export const COLLABORATOR_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

export function getCollaboratorColor(index: number): string {
  return COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length];
}

export function generateRandomColor(): string {
  return COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
}

/**
 * Role permissions
 */
export const ROLE_PERMISSIONS: Record<CollaboratorRole, {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}> = {
  owner: { canEdit: true, canComment: true, canShare: true, canDelete: true, canManageUsers: true },
  editor: { canEdit: true, canComment: true, canShare: true, canDelete: false, canManageUsers: false },
  commenter: { canEdit: false, canComment: true, canShare: false, canDelete: false, canManageUsers: false },
  viewer: { canEdit: false, canComment: false, canShare: false, canDelete: false, canManageUsers: false },
};

/**
 * Activity type labels
 */
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  join: 'joined the project',
  leave: 'left the project',
  edit: 'made changes',
  comment: 'added a comment',
  reply: 'replied to a comment',
  resolve: 'resolved a comment',
  export: 'exported the design',
  share: 'shared the project',
  rename: 'renamed the project',
  version_save: 'saved a version',
};

/**
 * Activity type icons
 */
export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  join: 'fa-user-plus',
  leave: 'fa-user-minus',
  edit: 'fa-pen',
  comment: 'fa-comment',
  reply: 'fa-reply',
  resolve: 'fa-check-circle',
  export: 'fa-download',
  share: 'fa-share',
  rename: 'fa-tag',
  version_save: 'fa-save',
};
