// ============================================
// CommentPanel Component
// Threaded comments and annotations sidebar
// ============================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { PDFAnnotation, PDFAnnotationReply } from '../types';

interface CommentPanelProps {
  annotations: PDFAnnotation[];
  selectedAnnotationId?: string;
  currentPage: number;
  currentUser: string;
  onAnnotationSelect: (id: string) => void;
  onAnnotationUpdate: (id: string, updates: Partial<PDFAnnotation>) => void;
  onAnnotationDelete: (id: string) => void;
  onAddReply: (annotationId: string, content: string) => void;
  onDeleteReply: (annotationId: string, replyId: string) => void;
  onGoToAnnotation: (annotation: PDFAnnotation) => void;
  className?: string;
}

type SortOption = 'page' | 'date' | 'type' | 'author';
type FilterOption = 'all' | 'highlight' | 'note' | 'redact' | 'stamp' | 'ink';

export const CommentPanel: React.FC<CommentPanelProps> = ({
  annotations,
  selectedAnnotationId,
  currentPage,
  currentUser,
  onAnnotationSelect,
  onAnnotationUpdate,
  onAnnotationDelete,
  onAddReply,
  onDeleteReply,
  onGoToAnnotation,
  className = '',
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('page');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingContent, setEditingContent] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus reply input when starting to reply
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  // Filter annotations
  const filteredAnnotations = React.useMemo(() => {
    if (filterBy === 'all') return annotations;
    return annotations.filter((ann) => ann.type === filterBy);
  }, [annotations, filterBy]);

  // Sort annotations
  const sortedAnnotations = React.useMemo(() => {
    const sorted = [...filteredAnnotations];

    switch (sortBy) {
      case 'page':
        return sorted.sort((a, b) => a.pageNumber - b.pageNumber);
      case 'date':
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      case 'author':
        return sorted.sort((a, b) =>
          (a.author || '').localeCompare(b.author || '')
        );
      default:
        return sorted;
    }
  }, [filteredAnnotations, sortBy]);

  // Get annotation icon
  const getAnnotationIcon = useCallback((type: string) => {
    switch (type) {
      case 'highlight':
        return 'fa-highlighter';
      case 'underline':
        return 'fa-underline';
      case 'strikethrough':
        return 'fa-strikethrough';
      case 'note':
        return 'fa-sticky-note';
      case 'freeText':
        return 'fa-font';
      case 'stamp':
        return 'fa-stamp';
      case 'ink':
        return 'fa-pen';
      case 'redaction':
      case 'redact':
        return 'fa-eraser';
      case 'rectangle':
        return 'fa-square';
      case 'ellipse':
        return 'fa-circle';
      case 'line':
      case 'arrow':
        return 'fa-arrow-right';
      default:
        return 'fa-comment';
    }
  }, []);

  // Format date
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  }, []);

  // Handle reply submit
  const handleReplySubmit = useCallback(
    (annotationId: string) => {
      if (!replyText.trim()) return;

      onAddReply(annotationId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    },
    [replyText, onAddReply]
  );

  // Handle content edit save
  const handleContentSave = useCallback(() => {
    if (!editingContent) return;

    onAnnotationUpdate(editingContent.id, { contents: editingContent.text });
    setEditingContent(null);
  }, [editingContent, onAnnotationUpdate]);

  // Group annotations by page for display
  const annotationsByPage = React.useMemo(() => {
    if (sortBy !== 'page') return null;

    const grouped = new Map<number, PDFAnnotation[]>();
    sortedAnnotations.forEach((ann) => {
      const existing = grouped.get(ann.pageNumber) || [];
      existing.push(ann);
      grouped.set(ann.pageNumber, existing);
    });
    return grouped;
  }, [sortedAnnotations, sortBy]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">
            Comments
            <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
              {annotations.length}
            </span>
          </h3>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="page">Sort: Page</option>
            <option value="date">Sort: Date</option>
            <option value="type">Sort: Type</option>
            <option value="author">Sort: Author</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="highlight">Highlights</option>
            <option value="note">Notes</option>
            <option value="stamp">Stamps</option>
            <option value="ink">Drawings</option>
            <option value="redact">Redactions</option>
          </select>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        {annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <i className="fas fa-comments text-4xl text-slate-200 mb-3"></i>
            <p className="text-sm text-slate-500 font-medium">No comments yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add annotations to the document to see them here
            </p>
          </div>
        ) : sortBy === 'page' && annotationsByPage ? (
          // Grouped by page view
          Array.from(annotationsByPage.entries()).map(([pageNumber, pageAnns]) => (
            <div key={pageNumber}>
              <div className="sticky top-0 z-10 px-4 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Page {pageNumber}
                </span>
                <span className="ml-2 text-xs text-slate-400">
                  ({pageAnns.length})
                </span>
              </div>
              {pageAnns.map((annotation) => (
                <AnnotationCard
                  key={annotation.id}
                  annotation={annotation}
                  isSelected={selectedAnnotationId === annotation.id}
                  currentUser={currentUser}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  editingContent={editingContent}
                  onSelect={() => onAnnotationSelect(annotation.id)}
                  onGoTo={() => onGoToAnnotation(annotation)}
                  onDelete={() => onAnnotationDelete(annotation.id)}
                  onStartReply={() => setReplyingTo(annotation.id)}
                  onCancelReply={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  onReplyTextChange={setReplyText}
                  onSubmitReply={() => handleReplySubmit(annotation.id)}
                  onDeleteReply={(replyId) =>
                    onDeleteReply(annotation.id, replyId)
                  }
                  onStartEditContent={() =>
                    setEditingContent({
                      id: annotation.id,
                      text: annotation.contents || '',
                    })
                  }
                  onEditContentChange={(text) =>
                    setEditingContent((prev) =>
                      prev ? { ...prev, text } : null
                    )
                  }
                  onSaveContent={handleContentSave}
                  onCancelEditContent={() => setEditingContent(null)}
                  getIcon={getAnnotationIcon}
                  formatDate={formatDate}
                  replyInputRef={replyInputRef}
                />
              ))}
            </div>
          ))
        ) : (
          // Flat list view
          sortedAnnotations.map((annotation) => (
            <AnnotationCard
              key={annotation.id}
              annotation={annotation}
              isSelected={selectedAnnotationId === annotation.id}
              currentUser={currentUser}
              replyingTo={replyingTo}
              replyText={replyText}
              editingContent={editingContent}
              onSelect={() => onAnnotationSelect(annotation.id)}
              onGoTo={() => onGoToAnnotation(annotation)}
              onDelete={() => onAnnotationDelete(annotation.id)}
              onStartReply={() => setReplyingTo(annotation.id)}
              onCancelReply={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
              onReplyTextChange={setReplyText}
              onSubmitReply={() => handleReplySubmit(annotation.id)}
              onDeleteReply={(replyId) => onDeleteReply(annotation.id, replyId)}
              onStartEditContent={() =>
                setEditingContent({
                  id: annotation.id,
                  text: annotation.contents || '',
                })
              }
              onEditContentChange={(text) =>
                setEditingContent((prev) => (prev ? { ...prev, text } : null))
              }
              onSaveContent={handleContentSave}
              onCancelEditContent={() => setEditingContent(null)}
              getIcon={getAnnotationIcon}
              formatDate={formatDate}
              replyInputRef={replyInputRef}
              showPageBadge
            />
          ))
        )}
      </div>
    </div>
  );
};

// Annotation Card Sub-component
interface AnnotationCardProps {
  annotation: PDFAnnotation;
  isSelected: boolean;
  currentUser: string;
  replyingTo: string | null;
  replyText: string;
  editingContent: { id: string; text: string } | null;
  onSelect: () => void;
  onGoTo: () => void;
  onDelete: () => void;
  onStartReply: () => void;
  onCancelReply: () => void;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: () => void;
  onDeleteReply: (replyId: string) => void;
  onStartEditContent: () => void;
  onEditContentChange: (text: string) => void;
  onSaveContent: () => void;
  onCancelEditContent: () => void;
  getIcon: (type: string) => string;
  formatDate: (timestamp: number) => string;
  replyInputRef: React.RefObject<HTMLTextAreaElement>;
  showPageBadge?: boolean;
}

const AnnotationCard: React.FC<AnnotationCardProps> = ({
  annotation,
  isSelected,
  currentUser,
  replyingTo,
  replyText,
  editingContent,
  onSelect,
  onGoTo,
  onDelete,
  onStartReply,
  onCancelReply,
  onReplyTextChange,
  onSubmitReply,
  onDeleteReply,
  onStartEditContent,
  onEditContentChange,
  onSaveContent,
  onCancelEditContent,
  getIcon,
  formatDate,
  replyInputRef,
  showPageBadge = false,
}) => {
  const isEditingThis = editingContent?.id === annotation.id;
  const isReplyingThis = replyingTo === annotation.id;

  return (
    <div
      className={`border-b border-slate-100 transition-colors ${
        isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${annotation.color}30` }}
          >
            <i
              className={`fas ${getIcon(annotation.type)} text-sm`}
              style={{ color: annotation.color }}
            ></i>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 capitalize">
                {annotation.type.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              {showPageBadge && (
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded">
                  Page {annotation.pageNumber}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {annotation.author || 'Anonymous'} • {formatDate(annotation.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onGoTo}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              title="Go to annotation"
            >
              <i className="fas fa-external-link-alt text-[10px]"></i>
            </button>
            <button
              onClick={onDelete}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
              title="Delete"
            >
              <i className="fas fa-trash text-[10px]"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        {(annotation.contents || isEditingThis) && (
          <div className="mt-3 ml-11">
            {isEditingThis ? (
              <div className="space-y-2">
                <textarea
                  value={editingContent.text}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onCancelEditContent}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSaveContent}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="text-sm text-slate-600 cursor-pointer hover:bg-slate-100 rounded p-1 -m-1"
                onClick={onStartEditContent}
                title="Click to edit"
              >
                {annotation.contents}
              </p>
            )}
          </div>
        )}

        {/* Replies */}
        {annotation.replies && annotation.replies.length > 0 && (
          <div className="mt-3 ml-11 space-y-2">
            {annotation.replies.map((reply) => (
              <div
                key={reply.id}
                className="flex gap-2 p-2 bg-slate-50 rounded-lg group"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user text-[8px] text-slate-400"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700">
                      {reply.author}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {reply.contents}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteReply(reply.id)}
                  className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <i className="fas fa-times text-[8px]"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reply Input */}
        {isReplyingThis ? (
          <div className="mt-3 ml-11 space-y-2">
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
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={onSubmitReply}
                disabled={!replyText.trim()}
                className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onStartReply}
            className="mt-2 ml-11 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <i className="fas fa-reply mr-1"></i>
            Reply
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentPanel;
