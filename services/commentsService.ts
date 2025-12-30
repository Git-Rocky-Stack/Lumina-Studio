// ============================================================================
// COMMENTS & ANNOTATIONS - SERVICE
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Comment,
  CommentReply,
  CommentUser,
  CommentPosition,
  CommentStatus,
  CommentPriority,
  CommentFilter,
  CommentNotification,
  CommentsSettings,
  AnnotationType,
  DEFAULT_SETTINGS,
  generateCommentId,
  generateReplyId,
  extractMentions,
  getRandomUserColor,
  filterComments,
  sortComments
} from '../types/comments';

// ============================================================================
// COMMENTS MANAGER CLASS
// ============================================================================

class CommentsManager {
  private comments: Map<string, Comment> = new Map();
  private notifications: CommentNotification[] = [];
  private settings: CommentsSettings = DEFAULT_SETTINGS;
  private currentUser: CommentUser | null = null;
  private listeners: Set<() => void> = new Set();
  private storageKey = 'lumina_comments';

  constructor() {
    this.loadFromStorage();
    this.initializeCurrentUser();
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  private initializeCurrentUser(): void {
    // In a real app, this would come from auth context
    this.currentUser = {
      id: 'user_current',
      name: 'Current User',
      email: 'user@example.com',
      color: getRandomUserColor()
    };
  }

  setCurrentUser(user: CommentUser): void {
    this.currentUser = user;
  }

  getCurrentUser(): CommentUser | null {
    return this.currentUser;
  }

  // --------------------------------------------------------------------------
  // Storage
  // --------------------------------------------------------------------------

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        data.comments?.forEach((c: Comment) => this.comments.set(c.id, c));
        this.notifications = data.notifications || [];
        this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      }
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        comments: Array.from(this.comments.values()),
        notifications: this.notifications,
        settings: this.settings
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save comments:', e);
    }
  }

  // --------------------------------------------------------------------------
  // Comment CRUD
  // --------------------------------------------------------------------------

  createComment(
    content: string,
    position: CommentPosition,
    annotationType: AnnotationType,
    options: {
      projectId?: string;
      elementId?: string;
      priority?: CommentPriority;
      tags?: string[];
      attachments?: any[];
    } = {}
  ): Comment {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    const mentions = extractMentions(content);

    const comment: Comment = {
      id: generateCommentId(),
      projectId: options.projectId || 'default',
      elementId: options.elementId,
      author: this.currentUser,
      content,
      position,
      annotationType,
      status: 'open',
      priority: options.priority || this.settings.defaultPriority,
      replies: [],
      reactions: [],
      attachments: options.attachments || [],
      mentions,
      tags: options.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.comments.set(comment.id, comment);
    this.saveToStorage();
    this.notifyListeners();

    // Create notifications for mentions
    mentions.forEach(userId => {
      this.addNotification({
        type: 'mention',
        commentId: comment.id,
        fromUser: this.currentUser!,
        message: `mentioned you in a comment`
      });
    });

    return comment;
  }

  updateComment(
    commentId: string,
    updates: Partial<Pick<Comment, 'content' | 'priority' | 'tags' | 'status'>>
  ): Comment | null {
    const comment = this.comments.get(commentId);
    if (!comment) return null;

    Object.assign(comment, updates, { updatedAt: Date.now() });

    if (updates.content) {
      comment.mentions = extractMentions(updates.content);
    }

    if (updates.status === 'resolved' && this.currentUser) {
      comment.resolvedAt = Date.now();
      comment.resolvedBy = this.currentUser;
    }

    this.saveToStorage();
    this.notifyListeners();

    return comment;
  }

  deleteComment(commentId: string): boolean {
    const deleted = this.comments.delete(commentId);
    if (deleted) {
      this.saveToStorage();
      this.notifyListeners();
    }
    return deleted;
  }

  getComment(commentId: string): Comment | undefined {
    return this.comments.get(commentId);
  }

  getAllComments(projectId?: string): Comment[] {
    const comments = Array.from(this.comments.values());
    if (projectId) {
      return comments.filter(c => c.projectId === projectId);
    }
    return comments;
  }

  // --------------------------------------------------------------------------
  // Replies
  // --------------------------------------------------------------------------

  addReply(commentId: string, content: string): CommentReply | null {
    const comment = this.comments.get(commentId);
    if (!comment || !this.currentUser) return null;

    const mentions = extractMentions(content);

    const reply: CommentReply = {
      id: generateReplyId(),
      commentId,
      author: this.currentUser,
      content,
      createdAt: Date.now(),
      mentions,
      reactions: []
    };

    comment.replies.push(reply);
    comment.updatedAt = Date.now();

    this.saveToStorage();
    this.notifyListeners();

    // Notify comment author
    if (comment.author.id !== this.currentUser.id) {
      this.addNotification({
        type: 'reply',
        commentId,
        fromUser: this.currentUser,
        message: `replied to your comment`
      });
    }

    // Notify mentions
    mentions.forEach(userId => {
      this.addNotification({
        type: 'mention',
        commentId,
        fromUser: this.currentUser!,
        message: `mentioned you in a reply`
      });
    });

    return reply;
  }

  updateReply(commentId: string, replyId: string, content: string): CommentReply | null {
    const comment = this.comments.get(commentId);
    if (!comment) return null;

    const reply = comment.replies.find(r => r.id === replyId);
    if (!reply) return null;

    reply.content = content;
    reply.editedAt = Date.now();
    reply.mentions = extractMentions(content);

    this.saveToStorage();
    this.notifyListeners();

    return reply;
  }

  deleteReply(commentId: string, replyId: string): boolean {
    const comment = this.comments.get(commentId);
    if (!comment) return false;

    const index = comment.replies.findIndex(r => r.id === replyId);
    if (index === -1) return false;

    comment.replies.splice(index, 1);
    comment.updatedAt = Date.now();

    this.saveToStorage();
    this.notifyListeners();

    return true;
  }

  // --------------------------------------------------------------------------
  // Reactions
  // --------------------------------------------------------------------------

  toggleReaction(commentId: string, emoji: string, replyId?: string): void {
    const comment = this.comments.get(commentId);
    if (!comment || !this.currentUser) return;

    const target = replyId
      ? comment.replies.find(r => r.id === replyId)
      : comment;

    if (!target) return;

    const existingReaction = target.reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.users.indexOf(this.currentUser.id);
      if (userIndex > -1) {
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          target.reactions = target.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(this.currentUser.id);
      }
    } else {
      target.reactions.push({
        emoji,
        users: [this.currentUser.id]
      });
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  // --------------------------------------------------------------------------
  // Status Management
  // --------------------------------------------------------------------------

  resolveComment(commentId: string): Comment | null {
    return this.updateComment(commentId, { status: 'resolved' });
  }

  reopenComment(commentId: string): Comment | null {
    const comment = this.comments.get(commentId);
    if (!comment) return null;

    comment.status = 'open';
    comment.resolvedAt = undefined;
    comment.resolvedBy = undefined;
    comment.updatedAt = Date.now();

    this.saveToStorage();
    this.notifyListeners();

    return comment;
  }

  archiveComment(commentId: string): Comment | null {
    return this.updateComment(commentId, { status: 'archived' });
  }

  // --------------------------------------------------------------------------
  // Filtering & Sorting
  // --------------------------------------------------------------------------

  getFilteredComments(filter: CommentFilter, sortBy: 'newest' | 'oldest' | 'priority' | 'status' = 'newest'): Comment[] {
    const comments = this.getAllComments();
    const filtered = filterComments(comments, filter);
    return sortComments(filtered, sortBy);
  }

  getCommentsByElement(elementId: string): Comment[] {
    return this.getAllComments().filter(c => c.elementId === elementId);
  }

  getOpenComments(): Comment[] {
    return this.getAllComments().filter(c => c.status === 'open');
  }

  getResolvedComments(): Comment[] {
    return this.getAllComments().filter(c => c.status === 'resolved');
  }

  // --------------------------------------------------------------------------
  // Notifications
  // --------------------------------------------------------------------------

  private addNotification(data: Omit<CommentNotification, 'id' | 'read' | 'createdAt'>): void {
    const notification: CommentNotification = {
      ...data,
      id: `notif_${Date.now()}`,
      read: false,
      createdAt: Date.now()
    };

    this.notifications.unshift(notification);

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveToStorage();
  }

  getNotifications(): CommentNotification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markNotificationRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  markAllNotificationsRead(): void {
    this.notifications.forEach(n => (n.read = true));
    this.saveToStorage();
    this.notifyListeners();
  }

  // --------------------------------------------------------------------------
  // Settings
  // --------------------------------------------------------------------------

  getSettings(): CommentsSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<CommentsSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  // --------------------------------------------------------------------------
  // Event System
  // --------------------------------------------------------------------------

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStatistics(): {
    total: number;
    open: number;
    resolved: number;
    archived: number;
    byPriority: Record<CommentPriority, number>;
    byAuthor: { author: CommentUser; count: number }[];
  } {
    const comments = this.getAllComments();
    const byAuthor = new Map<string, { author: CommentUser; count: number }>();

    comments.forEach(c => {
      const existing = byAuthor.get(c.author.id);
      if (existing) {
        existing.count++;
      } else {
        byAuthor.set(c.author.id, { author: c.author, count: 1 });
      }
    });

    return {
      total: comments.length,
      open: comments.filter(c => c.status === 'open').length,
      resolved: comments.filter(c => c.status === 'resolved').length,
      archived: comments.filter(c => c.status === 'archived').length,
      byPriority: {
        low: comments.filter(c => c.priority === 'low').length,
        medium: comments.filter(c => c.priority === 'medium').length,
        high: comments.filter(c => c.priority === 'high').length,
        urgent: comments.filter(c => c.priority === 'urgent').length
      },
      byAuthor: Array.from(byAuthor.values())
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const commentsManager = new CommentsManager();

// ============================================================================
// REACT HOOK
// ============================================================================

export function useComments(projectId?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<CommentNotification[]>([]);
  const [settings, setSettings] = useState<CommentsSettings>(commentsManager.getSettings());
  const [filter, setFilter] = useState<CommentFilter>({ status: 'all' });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'status'>('newest');

  useEffect(() => {
    const update = () => {
      setComments(commentsManager.getFilteredComments(filter, sortBy));
      setNotifications(commentsManager.getNotifications());
      setSettings(commentsManager.getSettings());
    };

    update();
    return commentsManager.subscribe(update);
  }, [filter, sortBy]);

  const createComment = useCallback((
    content: string,
    position: CommentPosition,
    annotationType: AnnotationType,
    options?: {
      elementId?: string;
      priority?: CommentPriority;
      tags?: string[];
    }
  ) => {
    return commentsManager.createComment(content, position, annotationType, {
      ...options,
      projectId
    });
  }, [projectId]);

  const updateComment = useCallback((commentId: string, updates: Partial<Comment>) => {
    return commentsManager.updateComment(commentId, updates);
  }, []);

  const deleteComment = useCallback((commentId: string) => {
    return commentsManager.deleteComment(commentId);
  }, []);

  const addReply = useCallback((commentId: string, content: string) => {
    return commentsManager.addReply(commentId, content);
  }, []);

  const deleteReply = useCallback((commentId: string, replyId: string) => {
    return commentsManager.deleteReply(commentId, replyId);
  }, []);

  const toggleReaction = useCallback((commentId: string, emoji: string, replyId?: string) => {
    commentsManager.toggleReaction(commentId, emoji, replyId);
  }, []);

  const resolveComment = useCallback((commentId: string) => {
    return commentsManager.resolveComment(commentId);
  }, []);

  const reopenComment = useCallback((commentId: string) => {
    return commentsManager.reopenComment(commentId);
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    commentsManager.markNotificationRead(notificationId);
  }, []);

  const updateSettings = useCallback((updates: Partial<CommentsSettings>) => {
    commentsManager.updateSettings(updates);
  }, []);

  return {
    comments,
    notifications,
    settings,
    filter,
    sortBy,
    setFilter,
    setSortBy,
    createComment,
    updateComment,
    deleteComment,
    addReply,
    deleteReply,
    toggleReaction,
    resolveComment,
    reopenComment,
    markNotificationRead,
    updateSettings,
    unreadCount: commentsManager.getUnreadCount(),
    statistics: commentsManager.getStatistics(),
    currentUser: commentsManager.getCurrentUser()
  };
}
