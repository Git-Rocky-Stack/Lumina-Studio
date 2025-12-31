// ============================================
// BookmarksPanel Component
// Document outline/bookmarks navigation sidebar
// ============================================

import React, { useState, useCallback } from 'react';

export interface BookmarkItem {
  title: string;
  pageNumber: number;
  dest?: unknown;
  items?: BookmarkItem[];
  isExpanded?: boolean;
}

interface BookmarksPanelProps {
  bookmarks: BookmarkItem[];
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
  onClose?: () => void;
  className?: string;
}

interface BookmarkTreeItemProps {
  item: BookmarkItem;
  depth: number;
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
  expandedItems: Set<string>;
  toggleExpanded: (id: string) => void;
}

const BookmarkTreeItem: React.FC<BookmarkTreeItemProps> = ({
  item,
  depth,
  currentPage,
  onNavigate,
  expandedItems,
  toggleExpanded,
}) => {
  const hasChildren = item.items && item.items.length > 0;
  const id = `${item.title}-${item.pageNumber}-${depth}`;
  const isExpanded = expandedItems.has(id);
  const isCurrentPage = item.pageNumber === currentPage;

  return (
    <div>
      <div
        className={`
          group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all
          ${isCurrentPage ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onNavigate(item.pageNumber)}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(id);
            }}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-[10px]`}></i>
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Bookmark icon */}
        <i className={`fas fa-bookmark text-xs ${isCurrentPage ? 'text-indigo-500' : 'text-slate-300'}`}></i>

        {/* Title */}
        <span className="flex-1 text-sm truncate" title={item.title}>
          {item.title}
        </span>

        {/* Page number */}
        <span className={`text-xs ${isCurrentPage ? 'text-indigo-500' : 'text-slate-400'}`}>
          {item.pageNumber}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {item.items!.map((child, index) => (
            <BookmarkTreeItem
              key={`${child.title}-${child.pageNumber}-${index}`}
              item={child}
              depth={depth + 1}
              currentPage={currentPage}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  bookmarks,
  currentPage,
  onNavigate,
  onClose,
  className = '',
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (items: BookmarkItem[], depth: number) => {
      items.forEach((item) => {
        if (item.items && item.items.length > 0) {
          allIds.add(`${item.title}-${item.pageNumber}-${depth}`);
          collectIds(item.items, depth + 1);
        }
      });
    };
    collectIds(bookmarks, 0);
    setExpandedItems(allIds);
  }, [bookmarks]);

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

  // Filter bookmarks based on search
  const filterBookmarks = useCallback((items: BookmarkItem[], query: string): BookmarkItem[] => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();
    return items.reduce<BookmarkItem[]>((acc, item) => {
      const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
      const filteredChildren = item.items ? filterBookmarks(item.items, query) : [];

      if (matchesTitle || filteredChildren.length > 0) {
        acc.push({
          ...item,
          items: filteredChildren.length > 0 ? filteredChildren : item.items,
        });
      }
      return acc;
    }, []);
  }, []);

  const filteredBookmarks = filterBookmarks(bookmarks, searchQuery);

  if (bookmarks.length === 0) {
    return (
      <div className={`h-full flex flex-col bg-white ${className}`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fas fa-bookmark text-indigo-500"></i>
            <h3 className="type-card text-slate-700">Bookmarks</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <i className="fas fa-bookmark text-2xl text-slate-300"></i>
            </div>
            <p className="type-label text-slate-500 mb-1">No bookmarks</p>
            <p className="type-caption text-slate-400">
              This document has no table of contents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-bookmark text-indigo-500"></i>
            <h3 className="type-card text-slate-700">Bookmarks</h3>
            <span className="text-xs text-slate-400">({bookmarks.length})</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>

        {/* Expand/Collapse controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={expandAll}
            className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Expand All
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Bookmarks list */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">No matching bookmarks</p>
          </div>
        ) : (
          filteredBookmarks.map((bookmark, index) => (
            <BookmarkTreeItem
              key={`${bookmark.title}-${bookmark.pageNumber}-${index}`}
              item={bookmark}
              depth={0}
              currentPage={currentPage}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BookmarksPanel;
