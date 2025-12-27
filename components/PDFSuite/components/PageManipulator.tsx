// ============================================
// PageManipulator - Reorder, Rotate, Delete Pages
// ============================================

import React, { useState, useCallback, useRef } from 'react';

// Types
interface PageInfo {
  id: string;
  pageNumber: number;
  rotation: 0 | 90 | 180 | 270;
  thumbnail?: string;
  isDeleted: boolean;
  isSelected: boolean;
}

interface PageManipulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (changes: PageChange[]) => Promise<void>;
  totalPages: number;
  getThumbnail?: (pageNum: number) => string | undefined;
  className?: string;
}

interface PageChange {
  type: 'reorder' | 'rotate' | 'delete' | 'duplicate';
  originalPage: number;
  newPosition?: number;
  rotation?: 0 | 90 | 180 | 270;
}

// Helper
const generateId = () => Math.random().toString(36).substring(2, 9);

export const PageManipulator: React.FC<PageManipulatorProps> = ({
  isOpen,
  onClose,
  onApply,
  totalPages,
  getThumbnail,
  className = ''
}) => {
  // Initialize pages
  const [pages, setPages] = useState<PageInfo[]>(() =>
    Array.from({ length: totalPages }, (_, i) => ({
      id: generateId(),
      pageNumber: i + 1,
      rotation: 0,
      thumbnail: getThumbnail?.(i + 1),
      isDeleted: false,
      isSelected: false
    }))
  );

  const [draggedPage, setDraggedPage] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showDeleted, setShowDeleted] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Selection
  const selectedCount = pages.filter(p => p.isSelected && !p.isDeleted).length;
  const activePages = pages.filter(p => !p.isDeleted);
  const deletedPages = pages.filter(p => p.isDeleted);

  // Toggle selection
  const toggleSelection = (id: string, event: React.MouseEvent) => {
    if (event.shiftKey && pages.some(p => p.isSelected)) {
      // Shift-click: select range
      const activePageIds = activePages.map(p => p.id);
      const lastSelectedIndex = activePageIds.findIndex(pid =>
        pages.find(p => p.id === pid)?.isSelected
      );
      const clickedIndex = activePageIds.indexOf(id);

      if (lastSelectedIndex !== -1 && clickedIndex !== -1) {
        const [start, end] = [
          Math.min(lastSelectedIndex, clickedIndex),
          Math.max(lastSelectedIndex, clickedIndex)
        ];

        setPages(prev => prev.map(p => ({
          ...p,
          isSelected: activePageIds.slice(start, end + 1).includes(p.id) || p.isSelected
        })));
        return;
      }
    }

    if (event.ctrlKey || event.metaKey) {
      // Ctrl-click: toggle single
      setPages(prev => prev.map(p =>
        p.id === id ? { ...p, isSelected: !p.isSelected } : p
      ));
    } else {
      // Normal click: select only this one
      setPages(prev => prev.map(p => ({
        ...p,
        isSelected: p.id === id
      })));
    }
  };

  // Select all
  const selectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, isSelected: !p.isDeleted })));
  };

  // Deselect all
  const deselectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, isSelected: false })));
  };

  // Rotate selected pages
  const rotateSelected = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : -90;
    setPages(prev => prev.map(p => {
      if (!p.isSelected || p.isDeleted) return p;
      const newRotation = ((p.rotation + delta + 360) % 360) as 0 | 90 | 180 | 270;
      return { ...p, rotation: newRotation };
    }));
  };

  // Delete selected pages
  const deleteSelected = () => {
    setPages(prev => prev.map(p =>
      p.isSelected ? { ...p, isDeleted: true, isSelected: false } : p
    ));
  };

  // Restore deleted page
  const restorePage = (id: string) => {
    setPages(prev => prev.map(p =>
      p.id === id ? { ...p, isDeleted: false } : p
    ));
  };

  // Duplicate selected pages
  const duplicateSelected = () => {
    const selectedPages = pages.filter(p => p.isSelected && !p.isDeleted);
    if (selectedPages.length === 0) return;

    const newPages: PageInfo[] = selectedPages.map(p => ({
      ...p,
      id: generateId(),
      isSelected: false
    }));

    // Insert after last selected
    const lastSelectedIndex = pages.reduce((lastIdx, p, idx) =>
      p.isSelected && !p.isDeleted ? idx : lastIdx, -1
    );

    const updatedPages = [...pages];
    updatedPages.splice(lastSelectedIndex + 1, 0, ...newPages);
    setPages(updatedPages);
  };

  // Drag and drop handlers
  const handleDragStart = (id: string) => {
    setDraggedPage(id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTarget(index);
  };

  const handleDragEnd = () => {
    if (draggedPage && dropTarget !== null) {
      const draggedIndex = activePages.findIndex(p => p.id === draggedPage);
      if (draggedIndex !== dropTarget) {
        const newActivePages = [...activePages];
        const [moved] = newActivePages.splice(draggedIndex, 1);
        newActivePages.splice(dropTarget, 0, moved);

        // Reconstruct full pages array with deleted pages at end
        setPages([...newActivePages, ...deletedPages]);
      }
    }
    setDraggedPage(null);
    setDropTarget(null);
  };

  // Move page up/down
  const movePage = (id: string, direction: 'up' | 'down') => {
    const index = activePages.findIndex(p => p.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= activePages.length) return;

    const newActivePages = [...activePages];
    [newActivePages[index], newActivePages[newIndex]] = [newActivePages[newIndex], newActivePages[index]];
    setPages([...newActivePages, ...deletedPages]);
  };

  // Reset all changes
  const resetChanges = () => {
    setPages(
      Array.from({ length: totalPages }, (_, i) => ({
        id: generateId(),
        pageNumber: i + 1,
        rotation: 0,
        thumbnail: getThumbnail?.(i + 1),
        isDeleted: false,
        isSelected: false
      }))
    );
  };

  // Calculate changes
  const calculateChanges = useCallback((): PageChange[] => {
    const changes: PageChange[] = [];

    activePages.forEach((page, newIndex) => {
      // Check for reorder
      if (page.pageNumber !== newIndex + 1) {
        changes.push({
          type: 'reorder',
          originalPage: page.pageNumber,
          newPosition: newIndex + 1
        });
      }

      // Check for rotation
      if (page.rotation !== 0) {
        changes.push({
          type: 'rotate',
          originalPage: page.pageNumber,
          rotation: page.rotation
        });
      }
    });

    // Check for deletions
    deletedPages.forEach(page => {
      changes.push({
        type: 'delete',
        originalPage: page.pageNumber
      });
    });

    return changes;
  }, [activePages, deletedPages]);

  // Handle apply
  const handleApply = async () => {
    const changes = calculateChanges();
    if (changes.length === 0) {
      onClose();
      return;
    }

    setIsApplying(true);
    try {
      await onApply(changes);
      onClose();
    } catch (error) {
      console.error('Apply failed:', error);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-[#1a1a2e] w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Organize Pages</h2>
              <p className="text-sm text-white/50">
                {activePages.length} of {totalPages} pages
                {deletedPages.length > 0 && ` • ${deletedPages.length} deleted`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              disabled={selectedCount === 0}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-40"
            >
              Deselect
            </button>
            <div className="w-px h-5 bg-white/20 mx-2" />
            <button
              onClick={() => rotateSelected('ccw')}
              disabled={selectedCount === 0}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-40"
              title="Rotate Left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={() => rotateSelected('cw')}
              disabled={selectedCount === 0}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-40"
              title="Rotate Right"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
            <div className="w-px h-5 bg-white/20 mx-2" />
            <button
              onClick={duplicateSelected}
              disabled={selectedCount === 0}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-40"
              title="Duplicate"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={deleteSelected}
              disabled={selectedCount === 0}
              className="p-2 rounded-lg hover:bg-red-500/20 text-white/70 hover:text-red-400 disabled:opacity-40"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              Show deleted
            </label>
            <button
              onClick={resetChanges}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
          {/* Active Pages Grid */}
          <div className="grid grid-cols-6 gap-4">
            {activePages.map((page, index) => (
              <div
                key={page.id}
                draggable
                onDragStart={() => handleDragStart(page.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={(e) => toggleSelection(page.id, e)}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all group ${
                  draggedPage === page.id ? 'opacity-50 scale-95' : ''
                } ${dropTarget === index && draggedPage !== page.id ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#1a1a2e]' : ''
                } ${page.isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                {/* Thumbnail */}
                <div
                  className="absolute inset-0 bg-white/10 flex items-center justify-center"
                  style={{ transform: `rotate(${page.rotation}deg)` }}
                >
                  {page.thumbnail ? (
                    <img src={page.thumbnail} alt={`Page ${page.pageNumber}`} className="w-full h-full object-contain" />
                  ) : (
                    <svg className="w-12 h-12 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    </svg>
                  )}
                </div>

                {/* Page Number Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded-full text-xs text-white">
                  {page.pageNumber}
                </div>

                {/* Rotation Badge */}
                {page.rotation !== 0 && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">{page.rotation}°</span>
                  </div>
                )}

                {/* Selection Overlay */}
                {page.isSelected && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      movePage(page.id, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1 rounded bg-white/20 hover:bg-white/30 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      movePage(page.id, 'down');
                    }}
                    disabled={index === activePages.length - 1}
                    className="p-1 rounded bg-white/20 hover:bg-white/30 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* New Position */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded-full text-xs text-white/60">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Deleted Pages */}
          {showDeleted && deletedPages.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/50 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Deleted Pages ({deletedPages.length})
              </h3>
              <div className="grid grid-cols-8 gap-3">
                {deletedPages.map(page => (
                  <div
                    key={page.id}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden opacity-50 group"
                  >
                    <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                      </svg>
                    </div>
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded-full text-[10px] text-white">
                      {page.pageNumber}
                    </div>
                    <button
                      onClick={() => restorePage(page.id)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
          <div className="text-sm text-white/50">
            {selectedCount > 0 && `${selectedCount} selected • `}
            {calculateChanges().length} change{calculateChanges().length !== 1 ? 's' : ''} pending
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apply Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageManipulator;
