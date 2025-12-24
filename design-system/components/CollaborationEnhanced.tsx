/**
 * Enhanced Collaboration Features
 * Approval workflow, Canvas comments, Realtime typing indicators
 */

import React, { useState, useEffect } from 'react';

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

interface ApprovalRequest {
  id: string;
  projectId: string;
  projectName: string;
  requester: {
    id: string;
    name: string;
    avatar?: string;
  };
  reviewers: ApprovalReviewer[];
  status: 'pending' | 'approved' | 'rejected' | 'changes-requested';
  createdAt: Date;
  message?: string;
  version: number;
}

interface ApprovalReviewer {
  id: string;
  name: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes-requested';
  comment?: string;
  respondedAt?: Date;
}

interface ApprovalWorkflowProps {
  requests: ApprovalRequest[];
  currentUserId: string;
  onApprove: (requestId: string, comment?: string) => void;
  onReject: (requestId: string, comment: string) => void;
  onRequestChanges: (requestId: string, comment: string) => void;
  onCreateRequest?: () => void;
  className?: string;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  requests,
  currentUserId,
  onApprove,
  onReject,
  onRequestChanges,
  onCreateRequest,
  className = '',
}) => {
  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const pendingForMe = requests.filter(
    r => r.reviewers.some(rev => rev.id === currentUserId && rev.status === 'pending')
  );
  const myRequests = requests.filter(r => r.requester.id === currentUserId);

  const getStatusColor = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'approved': return 'text-emerald-500 bg-emerald-50';
      case 'rejected': return 'text-rose-500 bg-rose-50';
      case 'changes-requested': return 'text-amber-500 bg-amber-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const getStatusIcon = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'approved': return 'fa-check-circle';
      case 'rejected': return 'fa-times-circle';
      case 'changes-requested': return 'fa-exclamation-circle';
      default: return 'fa-clock';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Approvals</h4>
        {onCreateRequest && (
          <button
            onClick={onCreateRequest}
            className="px-3 py-1.5 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <i className="fas fa-plus mr-1" />
            Request Review
          </button>
        )}
      </div>

      {/* Pending for me */}
      {pendingForMe.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Awaiting Your Review ({pendingForMe.length})
          </h5>
          {pendingForMe.map((request) => (
            <div
              key={request.id}
              className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                {request.requester.avatar ? (
                  <img
                    src={request.requester.avatar}
                    alt={request.requester.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold">
                    {request.requester.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{request.projectName}</p>
                  <p className="text-xs text-slate-500">
                    {request.requester.name} • v{request.version} • {formatTime(request.createdAt)}
                  </p>
                  {request.message && (
                    <p className="text-xs text-slate-600 mt-2 italic">"{request.message}"</p>
                  )}
                </div>
              </div>

              {activeRequest === request.id && showCommentInput ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onApprove(request.id, comment); setActiveRequest(null); setComment(''); }}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:brightness-110"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => { onRequestChanges(request.id, comment); setActiveRequest(null); setComment(''); }}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:brightness-110"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => { onReject(request.id, comment); setActiveRequest(null); setComment(''); }}
                      className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:brightness-110"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => { setActiveRequest(null); setShowCommentInput(false); }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onApprove(request.id)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1"
                  >
                    <i className="fas fa-check" />
                    Approve
                  </button>
                  <button
                    onClick={() => { setActiveRequest(request.id); setShowCommentInput(true); }}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    Add Comment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* My requests */}
      {myRequests.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Your Requests ({myRequests.length})
          </h5>
          {myRequests.map((request) => (
            <div
              key={request.id}
              className="p-4 bg-white border border-slate-200 rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">{request.projectName}</p>
                  <p className="text-xs text-slate-400">v{request.version} • {formatTime(request.createdAt)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(request.status)}`}>
                  <i className={`fas ${getStatusIcon(request.status)} mr-1`} />
                  {request.status.replace('-', ' ')}
                </span>
              </div>

              <div className="flex -space-x-2">
                {request.reviewers.map((reviewer) => (
                  <div
                    key={reviewer.id}
                    className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${
                      reviewer.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      reviewer.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                      reviewer.status === 'changes-requested' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-400'
                    }`}
                    title={`${reviewer.name}: ${reviewer.status}`}
                  >
                    {reviewer.avatar ? (
                      <img src={reviewer.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      reviewer.name.charAt(0)
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingForMe.length === 0 && myRequests.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <i className="fas fa-check-double text-2xl mb-2 opacity-50" />
          <p className="text-sm">No pending approvals</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CANVAS COMMENT PIN
// ============================================================================

interface CanvasComment {
  id: string;
  x: number;
  y: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  createdAt: Date;
  resolved?: boolean;
  replies?: CanvasComment[];
}

interface CanvasCommentsLayerProps {
  comments: CanvasComment[];
  onAddComment: (x: number, y: number, text: string) => void;
  onReplyComment: (commentId: string, text: string) => void;
  onResolveComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  isAddingMode?: boolean;
  showResolved?: boolean;
  className?: string;
}

export const CanvasCommentsLayer: React.FC<CanvasCommentsLayerProps> = ({
  comments,
  onAddComment,
  onReplyComment,
  onResolveComment,
  onDeleteComment,
  isAddingMode = false,
  showResolved = false,
  className = '',
}) => {
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentPos, setNewCommentPos] = useState<{ x: number; y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyText, setReplyText] = useState('');

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isAddingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setNewCommentPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleSubmitComment = () => {
    if (newCommentPos && newCommentText.trim()) {
      onAddComment(newCommentPos.x, newCommentPos.y, newCommentText);
      setNewCommentPos(null);
      setNewCommentText('');
    }
  };

  const filteredComments = showResolved ? comments : comments.filter(c => !c.resolved);

  return (
    <div
      className={`absolute inset-0 ${isAddingMode ? 'cursor-crosshair' : ''} ${className}`}
      onClick={handleCanvasClick}
    >
      {filteredComments.map((comment, idx) => (
        <div
          key={comment.id}
          className="absolute"
          style={{ left: comment.x, top: comment.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pin */}
          <button
            onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all hover:scale-110 ${
              comment.resolved ? 'bg-emerald-500' : 'bg-accent'
            }`}
          >
            {idx + 1}
          </button>

          {/* Comment bubble */}
          {activeCommentId === comment.id && (
            <div className="absolute left-10 top-0 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  {comment.author.avatar ? (
                    <img src={comment.author.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">
                      {comment.author.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-700">{comment.author.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{comment.text}</p>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="p-4 border-b border-slate-100 space-y-3 max-h-40 overflow-y-auto">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[8px] font-bold flex-shrink-0">
                        {reply.author.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-600">{reply.author.name}</span>
                        <p className="text-xs text-slate-500">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="p-3">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && replyText.trim()) {
                        onReplyComment(comment.id, replyText);
                        setReplyText('');
                      }
                    }}
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => onResolveComment(comment.id)}
                    className={`text-[10px] font-bold ${comment.resolved ? 'text-slate-400' : 'text-emerald-500 hover:underline'}`}
                  >
                    {comment.resolved ? 'Resolved' : 'Resolve'}
                  </button>
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* New comment input */}
      {newCommentPos && (
        <div
          className="absolute z-50"
          style={{ left: newCommentPos.x, top: newCommentPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-plus text-xs" />
          </div>
          <div className="absolute left-10 top-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-3 animate-in fade-in slide-in-from-left-2">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setNewCommentPos(null)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComment}
                className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-bold"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SHARE LINK MODAL
// ============================================================================

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  shareUrl: string;
  permissions: 'view' | 'comment' | 'edit';
  onPermissionsChange: (permissions: 'view' | 'comment' | 'edit') => void;
  onCopyLink: () => void;
  expiresAt?: Date;
  onExpiryChange?: (date: Date | null) => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  projectName,
  shareUrl,
  permissions,
  onPermissionsChange,
  onCopyLink,
  expiresAt,
  onExpiryChange,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onCopyLink();
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-share-nodes text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Share Project</h3>
                <p className="text-xs text-slate-500">{projectName}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Share Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-accent text-white hover:brightness-110'
                }`}
              >
                {copied ? <i className="fas fa-check" /> : <i className="fas fa-copy" />}
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Permissions</label>
            <div className="grid grid-cols-3 gap-2">
              {(['view', 'comment', 'edit'] as const).map((perm) => (
                <button
                  key={perm}
                  onClick={() => onPermissionsChange(perm)}
                  className={`py-3 rounded-xl text-xs font-bold capitalize transition-all ${
                    permissions === perm
                      ? 'bg-accent text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <i className={`fas ${perm === 'view' ? 'fa-eye' : perm === 'comment' ? 'fa-comment' : 'fa-pencil'} mr-1`} />
                  {perm}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry */}
          {onExpiryChange && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Link Expiry</label>
              <div className="flex gap-2">
                <select
                  value={expiresAt ? 'custom' : 'never'}
                  onChange={(e) => {
                    if (e.target.value === 'never') {
                      onExpiryChange(null);
                    } else {
                      const days = parseInt(e.target.value);
                      const date = new Date();
                      date.setDate(date.getDate() + days);
                      onExpiryChange(date);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <option value="never">Never expires</option>
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            Anyone with this link can {permissions} this project
          </p>
        </div>
      </div>
    </div>
  );
};

export default {
  ApprovalWorkflow,
  CanvasCommentsLayer,
  ShareLinkModal,
};
