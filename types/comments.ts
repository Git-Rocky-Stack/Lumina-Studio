// ============================================================================
// COMMENTS & ANNOTATIONS - TYPE DEFINITIONS
// ============================================================================

/**
 * Comment status
 */
export type CommentStatus = 'open' | 'resolved' | 'archived';

/**
 * Comment priority
 */
export type CommentPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Annotation type
 */
export type AnnotationType = 'pin' | 'area' | 'arrow' | 'freehand' | 'text';

/**
 * User info for comments
 */
export interface CommentUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

/**
 * Position on canvas
 */
export interface CommentPosition {
  x: number;
  y: number;
  // For area annotations
  width?: number;
  height?: number;
  // For arrow annotations
  endX?: number;
  endY?: number;
  // For freehand annotations
  path?: { x: number; y: number }[];
}

/**
 * Comment reply
 */
export interface CommentReply {
  id: string;
  commentId: string;
  author: CommentUser;
  content: string;
  createdAt: number;
  editedAt?: number;
  mentions: string[];
  reactions: CommentReaction[];
}

/**
 * Comment reaction
 */
export interface CommentReaction {
  emoji: string;
  users: string[];
}

/**
 * Comment attachment
 */
export interface CommentAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  name: string;
  url: string;
  thumbnail?: string;
  size?: number;
}

/**
 * Comment thread
 */
export interface Comment {
  id: string;
  projectId: string;
  elementId?: string;
  author: CommentUser;
  content: string;
  position: CommentPosition;
  annotationType: AnnotationType;
  status: CommentStatus;
  priority: CommentPriority;
  replies: CommentReply[];
  reactions: CommentReaction[];
  attachments: CommentAttachment[];
  mentions: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolvedBy?: CommentUser;
}

/**
 * Comment filter options
 */
export interface CommentFilter {
  status?: CommentStatus | 'all';
  priority?: CommentPriority | 'all';
  author?: string;
  assignee?: string;
  tag?: string;
  dateRange?: {
    start: number;
    end: number;
  };
  searchQuery?: string;
}

/**
 * Comment notification
 */
export interface CommentNotification {
  id: string;
  type: 'mention' | 'reply' | 'resolve' | 'assign';
  commentId: string;
  fromUser: CommentUser;
  message: string;
  read: boolean;
  createdAt: number;
}

/**
 * Annotation drawing state
 */
export interface AnnotationDrawState {
  isDrawing: boolean;
  type: AnnotationType;
  startPosition?: CommentPosition;
  currentPath?: { x: number; y: number }[];
}

/**
 * Comments settings
 */
export interface CommentsSettings {
  showResolved: boolean;
  showPins: boolean;
  notifyOnMention: boolean;
  notifyOnReply: boolean;
  defaultPriority: CommentPriority;
  autoResolveOnComplete: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_SETTINGS: CommentsSettings = {
  showResolved: false,
  showPins: true,
  notifyOnMention: true,
  notifyOnReply: true,
  defaultPriority: 'medium',
  autoResolveOnComplete: true
};

export const STATUS_INFO: Record<CommentStatus, { label: string; icon: string; color: string }> = {
  open: { label: 'Open', icon: 'fa-circle-dot', color: '#3b82f6' },
  resolved: { label: 'Resolved', icon: 'fa-check-circle', color: '#22c55e' },
  archived: { label: 'Archived', icon: 'fa-archive', color: '#6b7280' }
};

export const PRIORITY_INFO: Record<CommentPriority, { label: string; icon: string; color: string }> = {
  low: { label: 'Low', icon: 'fa-arrow-down', color: '#6b7280' },
  medium: { label: 'Medium', icon: 'fa-minus', color: '#f59e0b' },
  high: { label: 'High', icon: 'fa-arrow-up', color: '#f97316' },
  urgent: { label: 'Urgent', icon: 'fa-exclamation', color: '#ef4444' }
};

export const ANNOTATION_INFO: Record<AnnotationType, { label: string; icon: string; cursor: string }> = {
  pin: { label: 'Pin Comment', icon: 'fa-map-pin', cursor: 'crosshair' },
  area: { label: 'Area Selection', icon: 'fa-square-dashed', cursor: 'crosshair' },
  arrow: { label: 'Arrow', icon: 'fa-arrow-right', cursor: 'crosshair' },
  freehand: { label: 'Freehand', icon: 'fa-pen', cursor: 'crosshair' },
  text: { label: 'Text Note', icon: 'fa-font', cursor: 'text' }
};

export const REACTION_EMOJIS = ['👍', '👎', '❤️', '🎉', '🤔', '👀', '🔥', '✅'];

export const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate comment ID
 */
export function generateCommentId(): string {
  return `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate reply ID
 */
export function generateReplyId(): string {
  return `rpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get random user color
 */
export function getRandomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

/**
 * Extract mentions from content
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map(m => m.slice(1)) : [];
}

/**
 * Format mention in content
 */
export function formatMentions(content: string): string {
  return content.replace(
    /@(\w+)/g,
    '<span class="text-blue-400 font-medium">@$1</span>'
  );
}

/**
 * Format time ago
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return new Date(timestamp).toLocaleDateString();
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
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
    .slice(0, 2);
}

/**
 * Sort comments
 */
export function sortComments(
  comments: Comment[],
  by: 'newest' | 'oldest' | 'priority' | 'status'
): Comment[] {
  return [...comments].sort((a, b) => {
    switch (by) {
      case 'newest':
        return b.createdAt - a.createdAt;
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'priority': {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      case 'status': {
        const statusOrder = { open: 0, resolved: 1, archived: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      default:
        return 0;
    }
  });
}

/**
 * Filter comments
 */
export function filterComments(comments: Comment[], filter: CommentFilter): Comment[] {
  return comments.filter(comment => {
    if (filter.status && filter.status !== 'all' && comment.status !== filter.status) {
      return false;
    }
    if (filter.priority && filter.priority !== 'all' && comment.priority !== filter.priority) {
      return false;
    }
    if (filter.author && comment.author.id !== filter.author) {
      return false;
    }
    if (filter.tag && !comment.tags.includes(filter.tag)) {
      return false;
    }
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesContent = comment.content.toLowerCase().includes(query);
      const matchesAuthor = comment.author.name.toLowerCase().includes(query);
      if (!matchesContent && !matchesAuthor) {
        return false;
      }
    }
    if (filter.dateRange) {
      if (comment.createdAt < filter.dateRange.start || comment.createdAt > filter.dateRange.end) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get comment count by status
 */
export function getCommentCounts(comments: Comment[]): Record<CommentStatus | 'total', number> {
  return {
    total: comments.length,
    open: comments.filter(c => c.status === 'open').length,
    resolved: comments.filter(c => c.status === 'resolved').length,
    archived: comments.filter(c => c.status === 'archived').length
  };
}

/**
 * Calculate annotation bounds
 */
export function getAnnotationBounds(position: CommentPosition): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  if (position.path && position.path.length > 0) {
    const xs = position.path.map(p => p.x);
    const ys = position.path.map(p => p.y);
    return {
      left: Math.min(...xs),
      top: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }

  return {
    left: position.x,
    top: position.y,
    width: position.width || 0,
    height: position.height || 0
  };
}
