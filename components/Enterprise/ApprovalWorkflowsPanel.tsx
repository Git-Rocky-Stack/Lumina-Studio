// Approval Workflows Panel - Review/approve designs before publishing
import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  User,
  ChevronRight,
  Plus,
  Filter,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Send,
  X,
} from 'lucide-react';
import {
  approvalWorkflowService,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalComment,
} from '../../services/approvalWorkflowService';

interface ApprovalWorkflowsPanelProps {
  workspaceId: string;
  onClose?: () => void;
}

export const ApprovalWorkflowsPanel: React.FC<ApprovalWorkflowsPanelProps> = ({
  workspaceId,
  onClose,
}) => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [myPending, setMyPending] = useState<ApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comments, setComments] = useState<ApprovalComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'my_requests'>('pending');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [newComment, setNewComment] = useState('');
  const [decisionComment, setDecisionComment] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    loadData();
  }, [workspaceId, activeTab, statusFilter]);

  useEffect(() => {
    if (selectedRequest) {
      loadComments(selectedRequest.id);
    }
  }, [selectedRequest]);

  const loadData = async () => {
    setIsLoading(true);

    if (activeTab === 'pending') {
      const pending = await approvalWorkflowService.getMyPendingApprovals(workspaceId);
      setMyPending(pending);
    } else {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const allRequests = await approvalWorkflowService.getApprovalRequests(workspaceId, filters);
      setRequests(allRequests);
    }

    setIsLoading(false);
  };

  const loadComments = async (requestId: string) => {
    const data = await approvalWorkflowService.getComments(requestId);
    setComments(data);
  };

  const handleDecision = async () => {
    if (!selectedRequest || !pendingDecision) return;

    const result = await approvalWorkflowService.makeDecision(
      selectedRequest.id,
      pendingDecision,
      decisionComment
    );

    if (result.success) {
      setShowDecisionModal(false);
      setDecisionComment('');
      setPendingDecision(null);
      loadData();
      if (result.request) {
        setSelectedRequest(result.request);
      }
    }
  };

  const handleAddComment = async () => {
    if (!selectedRequest || !newComment.trim()) return;

    const comment = await approvalWorkflowService.addComment(
      selectedRequest.id,
      newComment
    );

    if (comment) {
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      case 'in_review':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
      case 'in_review':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'normal':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayRequests = activeTab === 'pending' ? myPending : requests;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Approval Workflows</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'pending'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending ({myPending.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'all'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Requests
        </button>
        <button
          onClick={() => setActiveTab('my_requests')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'my_requests'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Submissions
        </button>
      </div>

      {/* Filter Bar */}
      {activeTab !== 'pending' && (
        <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ApprovalStatus | 'all')}
            className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Request List */}
        <div className={`${selectedRequest ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'} overflow-auto`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
              <CheckCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-center">
                {activeTab === 'pending'
                  ? 'No pending approvals'
                  : 'No approval requests found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {displayRequests.map(request => (
                <button
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedRequest?.id === request.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(request.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {request.title}
                        </h3>
                        <span className={`text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {request.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className={`px-2 py-0.5 rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                        <span>Stage {request.current_stage + 1}</span>
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Request Details */}
        {selectedRequest && (
          <div className="w-1/2 flex flex-col overflow-hidden">
            {/* Detail Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedRequest.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              {['pending', 'in_review'].includes(selectedRequest.status) && activeTab === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setPendingDecision('approved');
                      setShowDecisionModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setPendingDecision('rejected');
                      setShowDecisionModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Reject
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>
              )}
            </div>

            {/* Workflow Progress */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Workflow Progress
              </h4>
              <div className="flex items-center gap-2">
                {selectedRequest.workflow_template?.stages?.map((stage, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        idx < selectedRequest.current_stage
                          ? 'bg-green-500 text-white'
                          : idx === selectedRequest.current_stage
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {idx < selectedRequest.current_stage ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < (selectedRequest.workflow_template?.stages?.length || 0) - 1 && (
                      <div
                        className={`flex-1 h-1 rounded ${
                          idx < selectedRequest.current_stage
                            ? 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                {selectedRequest.workflow_template?.stages?.map((stage, idx) => (
                  <span key={idx} className="text-center">
                    {stage.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-auto p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Comments ({comments.length})
              </h4>
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.user?.full_name || 'User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Comment */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {pendingDecision === 'approved' ? 'Approve Request' : 'Reject Request'}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comment {pendingDecision === 'rejected' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={decisionComment}
                  onChange={e => setDecisionComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder={pendingDecision === 'rejected' ? 'Please explain the reason...' : 'Add any comments...'}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDecisionModal(false);
                    setDecisionComment('');
                    setPendingDecision(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecision}
                  disabled={pendingDecision === 'rejected' && !decisionComment.trim()}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    pendingDecision === 'approved'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  Confirm {pendingDecision === 'approved' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflowsPanel;
