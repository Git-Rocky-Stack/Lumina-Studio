import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  collaborationManager,
  formatRelativeTime,
  getInitials,
  canPerformAction
} from '../../services/collaborationService';
import { ACTIVITY_ICONS, generateRandomColor } from '../../types/collaboration';
import type {
  UserPresence,
  CursorData,
  SelectionHighlight,
  CommentThread,
  Comment,
  ActivityItem,
  CollaboratorRole
} from '../../types/collaboration';

// ============================================================================
// CURSOR OVERLAY
// ============================================================================

interface CursorOverlayProps {
  cursors: Map<string, CursorData>;
  containerRef: React.RefObject<HTMLElement>;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({ cursors, containerRef }) => {
  const cursorArray = useMemo(() => Array.from(cursors.values()), [cursors]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {cursorArray.map(cursor => (
          <motion.div
            key={cursor.odifier}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="absolute"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-2px, -2px)'
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
            >
              <path
                d="M5.65 2.65L20.35 12L12 14.5L9 21.35L5.65 2.65Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Name label */}
            <div
              className="absolute left-5 top-5 px-2 py-1 rounded-lg text-white text-xs font-medium whitespace-nowrap shadow-lg"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// SELECTION OVERLAY
// ============================================================================

interface SelectionOverlayProps {
  selections: Map<string, SelectionHighlight>;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ selections }) => {
  const selectionArray = useMemo(() => Array.from(selections.values()), [selections]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {selectionArray.map(selection => (
        selection.bounds && (
          <div
            key={selection.odifier}
            className="absolute border-2 rounded"
            style={{
              left: selection.bounds.x,
              top: selection.bounds.y,
              width: selection.bounds.width,
              height: selection.bounds.height,
              borderColor: selection.color,
              backgroundColor: `${selection.color}10`
            }}
          />
        )
      ))}
    </div>
  );
};

// ============================================================================
// PRESENCE PANEL
// ============================================================================

interface PresencePanelProps {
  users: Map<string, UserPresence>;
  currentUserId?: string;
  onInvite?: () => void;
}

export const PresencePanel: React.FC<PresencePanelProps> = ({
  users,
  currentUserId,
  onInvite
}) => {
  const userArray = useMemo(() => Array.from(users.values()), [users]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-elevated p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="type-card text-slate-900">Online Now</h3>
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full type-caption">
          {userArray.length + 1} active
        </span>
      </div>

      <div className="space-y-2">
        {/* Current user */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-accent-soft">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: collaborationManager.getUserColor() }}
          >
            You
          </div>
          <div className="flex-1">
            <p className="type-label text-slate-900">You</p>
            <p className="type-caption text-slate-500">Editing</p>
          </div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        </div>

        {/* Other users */}
        {userArray.map(user => (
          <div key={user.odifier} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.color }}
              >
                {getInitials(user.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="type-label text-slate-900 truncate">{user.name}</p>
              <p className="type-caption text-slate-500">
                {user.currentView === 'canvas' ? 'Editing' : user.currentView}
              </p>
            </div>
            <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-emerald-500 animate-pulse' :
                user.status === 'away' ? 'bg-amber-500' :
                  'bg-slate-300'
              }`}></div>
          </div>
        ))}
      </div>

      {/* Invite button */}
      {onInvite && (
        <button
          onClick={onInvite}
          className="mt-4 w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl type-label text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-user-plus"></i>
          Invite Collaborator
        </button>
      )}
    </div>
  );
};

// ============================================================================
// COMMENTS PANEL
// ============================================================================

interface CommentsPanelProps {
  threads: CommentThread[];
  onCreateThread: (content: string) => void;
  onAddComment: (threadId: string, content: string) => void;
  onResolveThread: (threadId: string) => void;
  activeThread: CommentThread | null;
  onSelectThread: (thread: CommentThread | null) => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  threads,
  onCreateThread,
  onAddComment,
  onResolveThread,
  activeThread,
  onSelectThread
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const filteredThreads = useMemo(() => {
    if (filter === 'all') return threads;
    return threads.filter(t => t.status === filter);
  }, [threads, filter]);

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    if (activeThread) {
      onAddComment(activeThread.id, newComment);
    } else {
      onCreateThread(newComment);
    }
    setNewComment('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-elevated overflow-hidden w-[360px] max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="type-subtitle text-slate-900">Comments</h3>
          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full type-caption">
            {threads.filter(t => t.status === 'open').length} open
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'open', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg type-caption transition-all ${filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-comments text-slate-400"></i>
            </div>
            <p className="type-body text-slate-600 mb-1">No comments yet</p>
            <p className="type-caption text-slate-400">Start a conversation below</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredThreads.map(thread => (
              <div
                key={thread.id}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${activeThread?.id === thread.id ? 'bg-violet-50' : ''
                  }`}
                onClick={() => onSelectThread(activeThread?.id === thread.id ? null : thread)}
              >
                {/* First comment */}
                <div className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: generateRandomColor() }}
                  >
                    {getInitials(thread.comments[0].authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="type-label text-slate-900">{thread.comments[0].authorName}</span>
                      <span className="type-caption text-slate-400">
                        {formatRelativeTime(thread.comments[0].createdAt)}
                      </span>
                    </div>
                    <p className="type-body text-slate-600 line-clamp-2">{thread.comments[0].content}</p>

                    {/* Thread stats */}
                    <div className="flex items-center gap-3 mt-2">
                      {thread.comments.length > 1 && (
                        <span className="type-caption text-slate-400">
                          <i className="fas fa-reply mr-1"></i>
                          {thread.comments.length - 1} replies
                        </span>
                      )}
                      {thread.status === 'resolved' && (
                        <span className="type-caption text-emerald-600">
                          <i className="fas fa-check-circle mr-1"></i>
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded thread */}
                <AnimatePresence>
                  {activeThread?.id === thread.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pl-11 space-y-3 overflow-hidden"
                    >
                      {/* Replies */}
                      {thread.comments.slice(1).map(comment => (
                        <div key={comment.id} className="flex gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: generateRandomColor() }}
                          >
                            {getInitials(comment.authorName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="type-caption font-medium text-slate-700">{comment.authorName}</span>
                              <span className="type-caption text-slate-400">{formatRelativeTime(comment.createdAt)}</span>
                            </div>
                            <p className="type-caption text-slate-600">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Reply input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Reply..."
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg type-caption focus:outline-none focus:ring-2 focus:ring-accent/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && replyContent.trim()) {
                              onAddComment(thread.id, replyContent);
                              setReplyContent('');
                            }
                          }}
                        />
                        {thread.status === 'open' && (
                          <button
                            onClick={() => onResolveThread(thread.id)}
                            className="px-2 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg type-caption hover:bg-emerald-200 transition-all"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New comment input */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl type-body focus:outline-none focus:ring-2 focus:ring-accent/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            className="px-4 py-2.5 bg-accent text-white rounded-xl type-label hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ACTIVITY FEED
// ============================================================================

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 20
}) => {
  const displayActivities = useMemo(
    () => activities.slice(0, maxItems),
    [activities, maxItems]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-elevated overflow-hidden w-[320px]">
      <div className="p-4 border-b border-slate-100">
        <h3 className="type-subtitle text-slate-900">Activity</h3>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {displayActivities.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-stream text-2xl text-slate-300 mb-2"></i>
            <p className="type-caption text-slate-400">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {displayActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={index === 0 ? { opacity: 0, y: -10 } : false}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <i className={`fas ${ACTIVITY_ICONS[activity.type]} text-slate-500 text-xs`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="type-caption text-slate-600">
                    <span className="font-medium text-slate-900">{activity.actorName}</span>
                    {' '}{activity.description}
                  </p>
                  <p className="type-caption text-slate-400 mt-0.5">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SHARE MODAL
// ============================================================================

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onInvite: (email: string, role: CollaboratorRole) => void;
  shareLink?: string;
  onGenerateLink: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  projectName,
  onInvite,
  shareLink,
  onGenerateLink
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('editor');
  const [copied, setCopied] = useState(false);

  const handleInvite = () => {
    if (!email.trim()) return;
    onInvite(email, role);
    setEmail('');
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-dramatic w-[480px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="type-subtitle text-slate-900">Share Project</h2>
              <p className="type-caption text-slate-500">{projectName}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invite by email */}
          <div>
            <label className="type-label text-slate-700 mb-2 block">Invite by email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl type-body focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CollaboratorRole)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl type-body focus:outline-none"
              >
                <option value="editor">Can edit</option>
                <option value="commenter">Can comment</option>
                <option value="viewer">Can view</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={!email.trim()}
                className="px-4 py-2.5 bg-accent text-white rounded-xl type-label hover:brightness-110 disabled:opacity-50 transition-all"
              >
                Invite
              </button>
            </div>
          </div>

          {/* Share link */}
          <div>
            <label className="type-label text-slate-700 mb-2 block">Or share via link</label>
            {shareLink ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl type-body text-slate-500"
                />
                <button
                  onClick={copyLink}
                  className={`px-4 py-2.5 rounded-xl type-label transition-all ${copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <button
                onClick={onGenerateLink}
                className="w-full py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl type-label text-slate-600 hover:bg-slate-100 transition-all"
              >
                <i className="fas fa-link mr-2"></i>
                Generate share link
              </button>
            )}
          </div>

          {/* Permissions note */}
          <div className="p-3 bg-amber-50 rounded-xl">
            <div className="flex gap-2">
              <i className="fas fa-info-circle text-amber-500 mt-0.5"></i>
              <p className="type-caption text-amber-700">
                Anyone with the link can access this project with the permissions you set.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// COLLABORATION TOOLBAR
// ============================================================================

interface CollaborationToolbarProps {
  users: Map<string, UserPresence>;
  unresolvedComments: number;
  onShowPresence: () => void;
  onShowComments: () => void;
  onShowActivity: () => void;
  onShare: () => void;
  isConnected: boolean;
}

export const CollaborationToolbar: React.FC<CollaborationToolbarProps> = ({
  users,
  unresolvedComments,
  onShowPresence,
  onShowComments,
  onShowActivity,
  onShare,
  isConnected
}) => {
  const userArray = useMemo(() => Array.from(users.values()).slice(0, 3), [users]);
  const extraUsers = users.size - 3;

  return (
    <div className="flex items-center gap-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {isConnected ? (
          <>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Live
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
            Offline
          </>
        )}
      </div>

      {/* Avatars */}
      <button onClick={onShowPresence} className="flex -space-x-2 hover:opacity-80 transition-opacity">
        {userArray.map((user, i) => (
          <div
            key={user.odifier}
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-sm"
            style={{ backgroundColor: user.color, zIndex: 3 - i }}
            title={user.name}
          >
            {getInitials(user.name)}
          </div>
        ))}
        {extraUsers > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
            +{extraUsers}
          </div>
        )}
      </button>

      {/* Comments button */}
      <button
        onClick={onShowComments}
        className="relative w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-accent transition-all"
      >
        <i className="fas fa-comment"></i>
        {unresolvedComments > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            {unresolvedComments}
          </span>
        )}
      </button>

      {/* Activity button */}
      <button
        onClick={onShowActivity}
        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-accent transition-all"
      >
        <i className="fas fa-stream"></i>
      </button>

      {/* Share button */}
      <button
        onClick={onShare}
        className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
      >
        Share
      </button>
    </div>
  );
};

// Re-export new room-based collaboration components
export { LiveCursors, PresenceAvatars, ConnectionStatus } from './LiveCursors';

export default {
  CursorOverlay,
  SelectionOverlay,
  PresencePanel,
  CommentsPanel,
  ActivityFeed,
  ShareModal,
  CollaborationToolbar
};
