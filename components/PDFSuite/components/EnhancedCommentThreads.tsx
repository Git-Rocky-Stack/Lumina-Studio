// ============================================
// EnhancedCommentThreads Component
// Comment threads with reactions, mentions, and resolution
// ============================================

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Reply,
  Smile,
  AtSign,
  Check,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  Pin,
} from 'lucide-react';
import type {
  EnhancedAnnotation,
  AnnotationReaction,
} from '../hooks/useEnhancedAnnotations';
import type { PDFAnnotationReply } from '../types';

interface EnhancedCommentThreadsProps {
  annotations: EnhancedAnnotation[];
  currentUserId: string;
  currentUserName: string;
  onAddReply: (annotationId: string, content: string) => void;
  onDeleteReply: (annotationId: string, replyId: string) => void;
  onUpdateAnnotation: (id: string, updates: Partial<EnhancedAnnotation>) => void;
  onAddReaction: (annotationId: string, emoji: string) => void;
  onRemoveReaction: (annotationId: string, emoji: string) => void;
  onGoToAnnotation: (annotation: EnhancedAnnotation) => void;
  className?: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '😊', '🎉', '👀', '🔥'];

export const EnhancedCommentThreads: React.FC<EnhancedCommentThreadsProps> = ({
  annotations,
  currentUserId,
  currentUserName,
  onAddReply,
  onDeleteReply,
  onUpdateAnnotation,
  onAddReaction,
  onRemoveReaction,
  onGoToAnnotation,
  className = '',
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Handle add reply
  const handleAddReply = useCallback(
    (annotationId: string) => {
      if (!replyText.trim()) return;

      onAddReply(annotationId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    },
    [replyText, onAddReply]
  );

  // Handle save edit
  const handleSaveEdit = useCallback(
    (annotationId: string) => {
      if (!editText.trim()) return;

      onUpdateAnnotation(annotationId, { contents: editText.trim() });
      setEditingContentId(null);
      setEditText('');
    },
    [editText, onUpdateAnnotation]
  );

  // Handle resolve toggle
  const handleToggleResolve = useCallback(
    (annotation: EnhancedAnnotation) => {
      onUpdateAnnotation(annotation.id, {
        isResolved: !annotation.isResolved,
        resolvedBy: !annotation.isResolved ? currentUserName : undefined,
        resolvedAt: !annotation.isResolved ? Date.now() : undefined,
      });
    },
    [currentUserName, onUpdateAnnotation]
  );

  // Group annotations by resolved status
  const { unresolvedAnnotations, resolvedAnnotations } = React.useMemo(() => {
    const unresolved = annotations.filter((a) => !a.isResolved);
    const resolved = annotations.filter((a) => a.isResolved);
    return {
      unresolvedAnnotations: unresolved.sort((a, b) => b.createdAt - a.createdAt),
      resolvedAnnotations: resolved.sort((a, b) => b.createdAt - a.createdAt),
    };
  }, [annotations]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-700">Comments</h3>
          <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
            {unresolvedAnnotations.length}
          </span>
        </div>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto">
        {/* Unresolved Comments */}
        {unresolvedAnnotations.length > 0 && (
          <div>
            <div className="sticky top-0 z-10 px-4 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Active Comments ({unresolvedAnnotations.length})
              </span>
            </div>

            {unresolvedAnnotations.map((annotation) => (
              <CommentThread
                key={annotation.id}
                annotation={annotation}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                isReplying={replyingTo === annotation.id}
                replyText={replyText}
                isEditingContent={editingContentId === annotation.id}
                editText={editText}
                showReactionPicker={showReactionPicker === annotation.id}
                onStartReply={() => {
                  setReplyingTo(annotation.id);
                  setTimeout(() => replyInputRef.current?.focus(), 100);
                }}
                onCancelReply={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                onReplyTextChange={setReplyText}
                onSubmitReply={() => handleAddReply(annotation.id)}
                onDeleteReply={(replyId) => onDeleteReply(annotation.id, replyId)}
                onStartEdit={() => {
                  setEditingContentId(annotation.id);
                  setEditText(annotation.contents || '');
                }}
                onCancelEdit={() => {
                  setEditingContentId(null);
                  setEditText('');
                }}
                onEditTextChange={setEditText}
                onSaveEdit={() => handleSaveEdit(annotation.id)}
                onToggleResolve={() => handleToggleResolve(annotation)}
                onGoTo={() => onGoToAnnotation(annotation)}
                onShowReactionPicker={() =>
                  setShowReactionPicker(
                    showReactionPicker === annotation.id ? null : annotation.id
                  )
                }
                onAddReaction={(emoji) => onAddReaction(annotation.id, emoji)}
                onRemoveReaction={(emoji) => onRemoveReaction(annotation.id, emoji)}
                replyInputRef={replyInputRef}
              />
            ))}
          </div>
        )}

        {/* Resolved Comments */}
        {resolvedAnnotations.length > 0 && (
          <div>
            <div className="sticky top-0 z-10 px-4 py-2 bg-emerald-50 border-b border-emerald-100">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                Resolved ({resolvedAnnotations.length})
              </span>
            </div>

            {resolvedAnnotations.map((annotation) => (
              <CommentThread
                key={annotation.id}
                annotation={annotation}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                isReplying={false}
                replyText=""
                isEditingContent={false}
                editText=""
                showReactionPicker={false}
                onToggleResolve={() => handleToggleResolve(annotation)}
                onGoTo={() => onGoToAnnotation(annotation)}
                onAddReaction={(emoji) => onAddReaction(annotation.id, emoji)}
                onRemoveReaction={(emoji) => onRemoveReaction(annotation.id, emoji)}
                isResolved
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {annotations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              No comments yet
            </p>
            <p className="text-xs text-slate-500">
              Add annotations to start discussions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// CommentThread Component
// ============================================

interface CommentThreadProps {
  annotation: EnhancedAnnotation;
  currentUserId: string;
  currentUserName: string;
  isReplying: boolean;
  replyText: string;
  isEditingContent: boolean;
  editText: string;
  showReactionPicker: boolean;
  onStartReply?: () => void;
  onCancelReply?: () => void;
  onReplyTextChange?: (text: string) => void;
  onSubmitReply?: () => void;
  onDeleteReply?: (replyId: string) => void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onEditTextChange?: (text: string) => void;
  onSaveEdit?: () => void;
  onToggleResolve: () => void;
  onGoTo: () => void;
  onShowReactionPicker?: () => void;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  replyInputRef?: React.RefObject<HTMLTextAreaElement>;
  isResolved?: boolean;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  annotation,
  currentUserId,
  currentUserName,
  isReplying,
  replyText,
  isEditingContent,
  editText,
  showReactionPicker,
  onStartReply,
  onCancelReply,
  onReplyTextChange,
  onSubmitReply,
  onDeleteReply,
  onStartEdit,
  onCancelEdit,
  onEditTextChange,
  onSaveEdit,
  onToggleResolve,
  onGoTo,
  onShowReactionPicker,
  onAddReaction,
  onRemoveReaction,
  replyInputRef,
  isResolved = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Group reactions
  const reactionGroups = React.useMemo(() => {
    const groups: Record<string, AnnotationReaction[]> = {};
    annotation.reactions?.forEach((reaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = [];
      }
      groups[reaction.emoji].push(reaction);
    });
    return groups;
  }, [annotation.reactions]);

  return (
    <div
      className={`border-b border-slate-100 transition-colors ${
        isResolved ? 'opacity-60' : ''
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: annotation.color }}
          >
            {annotation.author?.charAt(0).toUpperCase() || 'A'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-700">
                {annotation.author || 'Anonymous'}
              </span>
              <span className="text-xs text-slate-400">
                {formatDate(annotation.createdAt)}
              </span>
              {annotation.isResolved && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Resolved
                </span>
              )}
            </div>

            {/* Tags */}
            {annotation.tags && annotation.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {annotation.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onGoTo}
              className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-colors"
              title="Go to annotation"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
                  >
                    {onStartEdit && (
                      <button
                        onClick={() => {
                          onStartEdit();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onToggleResolve();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {annotation.isResolved ? 'Unresolve' : 'Resolve'}
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {annotation.contents && (
          <div className="ml-11 mb-3">
            {isEditingContent && onEditTextChange && onSaveEdit && onCancelEdit ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => onEditTextChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onCancelEdit}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSaveEdit}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">
                {annotation.contents}
              </p>
            )}
          </div>
        )}

        {/* Reactions */}
        {(annotation.reactions && annotation.reactions.length > 0) ||
        showReactionPicker ? (
          <div className="ml-11 mb-3">
            <div className="flex flex-wrap items-center gap-1">
              {Object.entries(reactionGroups).map(([emoji, reactions]) => {
                const hasReacted = reactions.some((r) => r.userId === currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() =>
                      hasReacted ? onRemoveReaction(emoji) : onAddReaction(emoji)
                    }
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
                      hasReacted
                        ? 'bg-indigo-100 ring-2 ring-indigo-500'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                    title={reactions.map((r) => r.userName).join(', ')}
                  >
                    <span>{emoji}</span>
                    <span className="text-xs font-medium text-slate-600">
                      {reactions.length}
                    </span>
                  </button>
                );
              })}

              {/* Add Reaction Button */}
              {onShowReactionPicker && (
                <div className="relative">
                  <button
                    onClick={onShowReactionPicker}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {showReactionPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={onShowReactionPicker}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex gap-1 z-20"
                      >
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onAddReaction(emoji);
                              onShowReactionPicker();
                            }}
                            className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          onShowReactionPicker && (
            <div className="ml-11 mb-3">
              <button
                onClick={onShowReactionPicker}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <Smile className="w-3.5 h-3.5" />
                Add reaction
              </button>
            </div>
          )
        )}

        {/* Replies */}
        {annotation.replies && annotation.replies.length > 0 && (
          <div className="ml-11 space-y-2 mb-3">
            {annotation.replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                onDelete={onDeleteReply ? () => onDeleteReply(reply.id) : undefined}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Reply Input */}
        {!isResolved && (
          <>
            {isReplying && onReplyTextChange && onSubmitReply && onCancelReply ? (
              <div className="ml-11 space-y-2">
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => onReplyTextChange(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onCancelReply}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSubmitReply}
                    disabled={!replyText.trim()}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ) : (
              onStartReply && (
                <button
                  onClick={onStartReply}
                  className="ml-11 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Reply
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// ReplyItem Component
// ============================================

interface ReplyItemProps {
  reply: PDFAnnotationReply;
  currentUserId: string;
  onDelete?: () => void;
  formatDate: (timestamp: number) => string;
}

const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  currentUserId,
  onDelete,
  formatDate,
}) => (
  <div className="flex gap-2 p-2 bg-slate-50 rounded-lg group">
    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-600">
      {reply.author.charAt(0).toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs font-medium text-slate-700">{reply.author}</span>
        <span className="text-[10px] text-slate-400">{formatDate(reply.createdAt)}</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{reply.contents}</p>
    </div>
    {onDelete && (
      <button
        onClick={onDelete}
        className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    )}
  </div>
);

export default EnhancedCommentThreads;
