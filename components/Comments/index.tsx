// ============================================================================
// COMMENTS & ANNOTATIONS - UI COMPONENTS
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Comment,
  CommentReply,
  CommentPosition,
  CommentStatus,
  CommentPriority,
  AnnotationType,
  STATUS_INFO,
  PRIORITY_INFO,
  ANNOTATION_INFO,
  REACTION_EMOJIS,
  formatTimeAgo,
  formatMentions,
  getInitials
} from '../../types/comments';
import { useComments } from '../../services/commentsService';

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

interface AvatarProps {
  name: string;
  avatar?: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ name, avatar, color, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white`}
      style={{ backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  );
};

// ============================================================================
// REACTION BAR
// ============================================================================

interface ReactionBarProps {
  reactions: { emoji: string; users: string[] }[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}

const ReactionBar: React.FC<ReactionBarProps> = ({ reactions, currentUserId, onToggle }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactions.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => onToggle(reaction.emoji)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
            reaction.users.includes(currentUserId)
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.users.length}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 text-white/30 hover:text-white/60 hover:bg-white/5 rounded transition-colors"
        >
          <i className="fa-solid fa-face-smile text-xs" />
        </button>
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute left-0 top-full mt-1 p-2 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-50"
            >
              <div className="flex gap-1">
                {REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onToggle(emoji);
                      setShowPicker(false);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// COMMENT REPLY COMPONENT
// ============================================================================

interface ReplyItemProps {
  reply: CommentReply;
  currentUserId: string;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ reply, currentUserId, onDelete, onReaction }) => {
  return (
    <div className="pl-8 border-l-2 border-white/10 ml-4">
      <div className="flex items-start gap-2 py-2">
        <Avatar name={reply.author.name} avatar={reply.author.avatar} color={reply.author.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm">{reply.author.name}</span>
            <span className="text-xs text-white/40">{formatTimeAgo(reply.createdAt)}</span>
            {reply.editedAt && (
              <span className="text-xs text-white/30">(edited)</span>
            )}
          </div>
          <p
            className="text-sm text-white/70 mt-0.5"
            dangerouslySetInnerHTML={{ __html: formatMentions(reply.content) }}
          />
          <div className="mt-1">
            <ReactionBar
              reactions={reply.reactions}
              currentUserId={currentUserId}
              onToggle={onReaction}
            />
          </div>
        </div>
        {reply.author.id === currentUserId && (
          <button
            onClick={onDelete}
            className="p-1 text-white/30 hover:text-red-400 transition-colors"
          >
            <i className="fa-solid fa-trash text-xs" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMMENT CARD COMPONENT
// ============================================================================

interface CommentCardProps {
  comment: Comment;
  currentUserId: string;
  isSelected?: boolean;
  onSelect: () => void;
  onResolve: () => void;
  onReopen: () => void;
  onDelete: () => void;
  onReply: (content: string) => void;
  onReaction: (emoji: string, replyId?: string) => void;
  onDeleteReply: (replyId: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUserId,
  isSelected,
  onSelect,
  onResolve,
  onReopen,
  onDelete,
  onReply,
  onReaction,
  onDeleteReply
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [expanded, setExpanded] = useState(false);

  const statusInfo = STATUS_INFO[comment.status];
  const priorityInfo = PRIORITY_INFO[comment.priority];

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent);
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white/5 rounded-lg border transition-colors ${
        isSelected ? 'border-blue-500' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Header */}
      <div className="p-3 cursor-pointer" onClick={onSelect}>
        <div className="flex items-start gap-3">
          <Avatar name={comment.author.name} avatar={comment.author.avatar} color={comment.author.color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white text-sm">{comment.author.name}</span>
              <span className="text-xs text-white/40">{formatTimeAgo(comment.createdAt)}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1"
                style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
              >
                <i className={`fa-solid ${statusInfo.icon}`} />
                {statusInfo.label}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1"
                style={{ backgroundColor: `${priorityInfo.color}20`, color: priorityInfo.color }}
              >
                <i className={`fa-solid ${priorityInfo.icon}`} />
                {priorityInfo.label}
              </span>
            </div>
            <p
              className="text-sm text-white/70 mt-1"
              dangerouslySetInnerHTML={{ __html: formatMentions(comment.content) }}
            />
          </div>
        </div>

        {/* Tags */}
        {comment.tags.length > 0 && (
          <div className="flex gap-1 mt-2 ml-11">
            {comment.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-white/10 text-white/50 text-[10px] rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Reactions */}
        <div className="mt-2 ml-11">
          <ReactionBar
            reactions={comment.reactions}
            currentUserId={currentUserId}
            onToggle={emoji => onReaction(emoji)}
          />
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-white/50 hover:text-white/70 mb-2"
          >
            {expanded ? (
              <>
                <i className="fa-solid fa-chevron-up mr-1" />
                Hide replies
              </>
            ) : (
              <>
                <i className="fa-solid fa-chevron-down mr-1" />
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </>
            )}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {comment.replies.map(reply => (
                  <ReplyItem
                    key={reply.id}
                    reply={reply}
                    currentUserId={currentUserId}
                    onDelete={() => onDeleteReply(reply.id)}
                    onReaction={emoji => onReaction(emoji, reply.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmitReply()}
              placeholder="Write a reply... Use @mention to notify"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
              autoFocus
            />
            <button
              onClick={handleSubmitReply}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Reply
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
        <button
          onClick={() => setShowReplyInput(!showReplyInput)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 rounded transition-colors"
        >
          <i className="fa-solid fa-reply" />
          Reply
        </button>
        {comment.status === 'open' ? (
          <button
            onClick={onResolve}
            className="flex items-center gap-1 px-2 py-1 text-xs text-green-400 hover:bg-green-500/10 rounded transition-colors"
          >
            <i className="fa-solid fa-check" />
            Resolve
          </button>
        ) : comment.status === 'resolved' ? (
          <button
            onClick={onReopen}
            className="flex items-center gap-1 px-2 py-1 text-xs text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors"
          >
            <i className="fa-solid fa-rotate-left" />
            Reopen
          </button>
        ) : null}
        {comment.author.id === currentUserId && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors ml-auto"
          >
            <i className="fa-solid fa-trash" />
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// ANNOTATION TOOLBAR
// ============================================================================

interface AnnotationToolbarProps {
  selectedTool: AnnotationType;
  onSelectTool: (tool: AnnotationType) => void;
  isActive: boolean;
  onToggleActive: () => void;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  selectedTool,
  onSelectTool,
  isActive,
  onToggleActive
}) => {
  const tools: AnnotationType[] = ['pin', 'area', 'arrow', 'freehand', 'text'];

  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
      <button
        onClick={onToggleActive}
        className={`p-2 rounded transition-colors ${
          isActive ? 'bg-blue-500 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
        }`}
        title="Toggle Comments Mode"
      >
        <i className="fa-solid fa-comments" />
      </button>
      <div className="w-px h-6 bg-white/10" />
      {tools.map(tool => {
        const info = ANNOTATION_INFO[tool];
        return (
          <button
            key={tool}
            onClick={() => onSelectTool(tool)}
            disabled={!isActive}
            className={`p-2 rounded transition-colors ${
              selectedTool === tool && isActive
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30'
            }`}
            title={info.label}
          >
            <i className={`fa-solid ${info.icon}`} />
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// COMMENTS PANEL
// ============================================================================

export const CommentsPanel: React.FC = () => {
  const {
    comments,
    filter,
    sortBy,
    setFilter,
    setSortBy,
    createComment,
    deleteComment,
    addReply,
    deleteReply,
    toggleReaction,
    resolveComment,
    reopenComment,
    statistics,
    currentUser
  } = useComments();

  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [showNewComment, setShowNewComment] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');

  const handleCreateComment = () => {
    if (newCommentContent.trim()) {
      createComment(
        newCommentContent,
        { x: 100, y: 100 },
        'pin'
      );
      setNewCommentContent('');
      setShowNewComment(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-comments text-blue-400" />
            Comments
          </h2>
          <button
            onClick={() => setShowNewComment(true)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <i className="fa-solid fa-plus" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs">
          <span className="text-white/50">
            <span className="text-blue-400 font-semibold">{statistics.open}</span> Open
          </span>
          <span className="text-white/50">
            <span className="text-green-400 font-semibold">{statistics.resolved}</span> Resolved
          </span>
          <span className="text-white/50">
            <span className="text-white font-semibold">{statistics.total}</span> Total
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex gap-2">
          {(['all', 'open', 'resolved'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter({ ...filter, status })}
              className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${
                filter.status === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">By Priority</option>
          <option value="status">By Status</option>
        </select>
      </div>

      {/* New Comment Modal */}
      <AnimatePresence>
        {showNewComment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-white/10"
          >
            <textarea
              value={newCommentContent}
              onChange={e => setNewCommentContent(e.target.value)}
              placeholder="Add a comment... Use @mention to notify team members"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-blue-500/50"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowNewComment(false)}
                className="px-3 py-1.5 text-sm text-white/50 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateComment}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
              >
                Add Comment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {comments.length > 0 ? (
            comments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUserId={currentUser?.id || ''}
                isSelected={selectedCommentId === comment.id}
                onSelect={() => setSelectedCommentId(comment.id)}
                onResolve={() => resolveComment(comment.id)}
                onReopen={() => reopenComment(comment.id)}
                onDelete={() => deleteComment(comment.id)}
                onReply={content => addReply(comment.id, content)}
                onReaction={(emoji, replyId) => toggleReaction(comment.id, emoji, replyId)}
                onDeleteReply={replyId => deleteReply(comment.id, replyId)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <i className="fa-solid fa-comments text-4xl text-white/20 mb-3" />
              <p className="text-white/50">No comments yet</p>
              <p className="text-white/30 text-sm">Add a comment to start the discussion</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// COMMENT PIN (Canvas Overlay)
// ============================================================================

interface CommentPinProps {
  comment: Comment;
  isSelected: boolean;
  onClick: () => void;
}

export const CommentPin: React.FC<CommentPinProps> = ({ comment, isSelected, onClick }) => {
  const statusInfo = STATUS_INFO[comment.status];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute cursor-pointer"
      style={{
        left: comment.position.x,
        top: comment.position.y,
        transform: 'translate(-50%, -100%)'
      }}
      onClick={onClick}
    >
      <div
        className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform ${
          isSelected ? 'scale-125' : 'hover:scale-110'
        }`}
        style={{ backgroundColor: comment.author.color }}
      >
        <i className="fa-solid fa-comment text-white text-sm" />
        {comment.replies.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {comment.replies.length}
          </span>
        )}
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 rotate-45"
        style={{ backgroundColor: comment.author.color }}
      />
    </motion.div>
  );
};

export default CommentsPanel;
