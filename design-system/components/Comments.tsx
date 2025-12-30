import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
    color?: string;
  };
  content: string;
  timestamp: Date;
  position?: { x: number; y: number };
  resolved?: boolean;
  replies?: Comment[];
}

interface CommentsProps {
  comments: Comment[];
  onAdd: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
  currentUser: { name: string; avatar?: string };
  className?: string;
}

export const CommentsPanel: React.FC<CommentsProps> = ({
  comments,
  onAdd,
  onResolve,
  onDelete,
  onReply,
  currentUser,
  className = '',
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const filteredComments = comments.filter(c => {
    if (filter === 'open') return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAdd({
      author: currentUser,
      content: newComment,
    });
    setNewComment('');
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    onReply(parentId, replyContent);
    setReplyContent('');
    setReplyingTo(null);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <i className="fas fa-comments text-accent" />
            Comments
            <span className="text-sm font-normal text-slate-500">({comments.length})</span>
          </h3>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'open', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg type-body-sm font-semibold transition-colors ${
                filter === f
                  ? 'bg-accent text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Comments list */}
      <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {filteredComments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-4 rounded-xl border ${
                comment.resolved
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Author */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: comment.author.color || '#6366f1' }}
                >
                  {comment.author.avatar ? (
                    <img src={comment.author.avatar} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    comment.author.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="type-body-sm font-semibold text-slate-900 dark:text-white">
                    {comment.author.name}
                  </div>
                  <div className="type-caption text-slate-500">{formatTime(comment.timestamp)}</div>
                </div>
                {comment.resolved && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                    Resolved
                  </span>
                )}
              </div>

              {/* Content */}
              <p className="type-body-sm text-slate-700 dark:text-slate-300 mb-3">{comment.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="type-caption text-slate-500 hover:text-accent"
                >
                  <i className="fas fa-reply mr-1" />
                  Reply
                </button>
                {!comment.resolved && (
                  <button
                    onClick={() => onResolve(comment.id)}
                    className="type-caption text-slate-500 hover:text-emerald-500"
                  >
                    <i className="fas fa-check mr-1" />
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => onDelete(comment.id)}
                  className="type-caption text-slate-500 hover:text-red-500"
                >
                  <i className="fas fa-trash mr-1" />
                  Delete
                </button>
              </div>

              {/* Reply input */}
              <AnimatePresence>
                {replyingTo === comment.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                        onKeyDown={e => e.key === 'Enter' && handleReply(comment.id)}
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        className="px-3 py-2 bg-accent text-white rounded-lg text-sm"
                      >
                        Send
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-slate-200 dark:border-slate-600 space-y-2">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {reply.author.name}:
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-400">{reply.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredComments.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <i className="fas fa-comments text-3xl mb-2 opacity-30" />
            <p>No comments yet</p>
          </div>
        )}
      </div>

      {/* New comment input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <motion.button
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-accent text-white rounded-xl font-medium disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className="fas fa-paper-plane" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// Pin-style annotation on canvas
interface AnnotationPinProps {
  comment: Comment;
  isSelected?: boolean;
  onClick: () => void;
  onDrag?: (position: { x: number; y: number }) => void;
}

export const AnnotationPin: React.FC<AnnotationPinProps> = ({
  comment,
  isSelected = false,
  onClick,
  onDrag,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ left: comment.position?.x, top: comment.position?.y }}
      drag={!!onDrag}
      onDragEnd={(_, info) => {
        if (onDrag && comment.position) {
          onDrag({
            x: comment.position.x + info.offset.x,
            y: comment.position.y + info.offset.y,
          });
        }
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <div
        className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg ${
          comment.resolved ? 'bg-emerald-500' : 'bg-accent'
        } ${isSelected ? 'ring-2 ring-offset-2 ring-accent' : ''}`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ backgroundColor: comment.author.color }}
      >
        {comment.resolved ? <i className="fas fa-check text-xs" /> : comment.author.name.charAt(0)}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute left-full ml-2 top-0 w-48 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10"
          >
            <div className="type-body-sm font-semibold text-slate-900 dark:text-white mb-1">
              {comment.author.name}
            </div>
            <p className="type-caption text-slate-600 dark:text-slate-400 line-clamp-2">
              {comment.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CommentsPanel;
