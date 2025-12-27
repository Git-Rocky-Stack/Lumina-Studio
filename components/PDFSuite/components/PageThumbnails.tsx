// ============================================
// PageThumbnails Component
// Left sidebar with page previews and navigation
// ============================================

import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { PDFPage } from '../types';

interface PageThumbnailsProps {
  pages: PDFPage[];
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  onPageReorder?: (fromIndex: number, toIndex: number) => void;
  onPageDelete?: (pageNumber: number) => void;
  onPageRotate?: (pageNumber: number, direction: 'cw' | 'ccw') => void;
  selectedPages?: number[];
  onSelectionChange?: (pages: number[]) => void;
  isLoading?: boolean;
  className?: string;
}

export const PageThumbnails: React.FC<PageThumbnailsProps> = ({
  pages,
  currentPage,
  onPageSelect,
  onPageReorder,
  onPageDelete,
  onPageRotate,
  selectedPages = [],
  onSelectionChange,
  isLoading = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const [dragOverPage, setDragOverPage] = useState<number | null>(null);

  // Scroll to current page when it changes
  useEffect(() => {
    if (containerRef.current) {
      const currentThumbnail = containerRef.current.querySelector(
        `[data-page="${currentPage}"]`
      );
      if (currentThumbnail) {
        currentThumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [currentPage]);

  // Handle click with multi-select support
  const handleClick = useCallback(
    (pageNumber: number, e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Toggle selection
        if (onSelectionChange) {
          const newSelection = selectedPages.includes(pageNumber)
            ? selectedPages.filter((p) => p !== pageNumber)
            : [...selectedPages, pageNumber];
          onSelectionChange(newSelection);
        }
      } else if (e.shiftKey && selectedPages.length > 0) {
        // Range selection
        if (onSelectionChange) {
          const lastSelected = selectedPages[selectedPages.length - 1] ?? pageNumber;
          const start = Math.min(lastSelected, pageNumber);
          const end = Math.max(lastSelected, pageNumber);
          const range = Array.from(
            { length: end - start + 1 },
            (_, i) => start + i
          );
          onSelectionChange([...new Set([...selectedPages, ...range])]);
        }
      } else {
        // Single selection
        onPageSelect(pageNumber);
        if (onSelectionChange) {
          onSelectionChange([pageNumber]);
        }
      }
    },
    [selectedPages, onPageSelect, onSelectionChange]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent, pageNumber: number) => {
      setDraggedPage(pageNumber);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', pageNumber.toString());

      // Create custom drag image
      const element = e.currentTarget as HTMLElement;
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-1000px';
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 50, 50);
      setTimeout(() => document.body.removeChild(clone), 0);
    },
    []
  );

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent, pageNumber: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverPage(pageNumber);
    },
    []
  );

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent, targetPage: number) => {
      e.preventDefault();
      setDraggedPage(null);
      setDragOverPage(null);

      if (draggedPage !== null && onPageReorder) {
        const fromIndex = pages.findIndex((p) => p.pageNumber === draggedPage);
        const toIndex = pages.findIndex((p) => p.pageNumber === targetPage);
        if (fromIndex !== toIndex) {
          onPageReorder(fromIndex, toIndex);
        }
      }
    },
    [draggedPage, pages, onPageReorder]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedPage(null);
    setDragOverPage(null);
  }, []);

  // Context menu handler
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, pageNumber: number) => {
      e.preventDefault();
      // Could implement a custom context menu here
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-y-auto bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent ${className}`}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pages
          </h3>
          <span className="text-xs text-slate-400">{pages.length}</span>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="p-3 space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-200 rounded-lg aspect-[1/1.414]"
            />
          ))
        ) : pages.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <i className="fas fa-file-pdf text-3xl text-slate-200 mb-2"></i>
            <p className="text-xs text-slate-400">No pages</p>
          </div>
        ) : (
          pages.map((page) => {
            const isSelected = selectedPages.includes(page.pageNumber);
            const isCurrent = page.pageNumber === currentPage;
            const isDragging = draggedPage === page.pageNumber;
            const isDragOver = dragOverPage === page.pageNumber;

            return (
              <div
                key={page.pageNumber}
                data-page={page.pageNumber}
                draggable={!!onPageReorder}
                onDragStart={(e) => handleDragStart(e, page.pageNumber)}
                onDragOver={(e) => handleDragOver(e, page.pageNumber)}
                onDrop={(e) => handleDrop(e, page.pageNumber)}
                onDragEnd={handleDragEnd}
                onClick={(e) => handleClick(page.pageNumber, e)}
                onContextMenu={(e) => handleContextMenu(e, page.pageNumber)}
                className={`
                  relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-200
                  ${isDragging ? 'opacity-50 scale-95' : ''}
                  ${isDragOver ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                  ${
                    isCurrent
                      ? 'ring-2 ring-indigo-600 shadow-lg shadow-indigo-600/20'
                      : isSelected
                      ? 'ring-2 ring-indigo-400'
                      : 'ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md'
                  }
                `}
              >
                {/* Thumbnail Image */}
                <div className="relative bg-white aspect-[1/1.414] overflow-hidden">
                  {page.thumbnail ? (
                    <img
                      src={page.thumbnail}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <i className="fas fa-file text-slate-300 text-2xl"></i>
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                  {/* Selection checkbox */}
                  {onSelectionChange && (
                    <div
                      className={`absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/80 text-transparent group-hover:text-slate-300 border border-slate-200'
                      }`}
                    >
                      <i className="fas fa-check text-[10px]"></i>
                    </div>
                  )}

                  {/* Page actions (on hover) */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onPageRotate && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPageRotate(page.pageNumber, 'ccw');
                          }}
                          className="w-6 h-6 rounded bg-white/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white transition-all"
                          title="Rotate Left"
                        >
                          <i className="fas fa-rotate-left text-[10px]"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPageRotate(page.pageNumber, 'cw');
                          }}
                          className="w-6 h-6 rounded bg-white/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white transition-all"
                          title="Rotate Right"
                        >
                          <i className="fas fa-rotate-right text-[10px]"></i>
                        </button>
                      </>
                    )}
                    {onPageDelete && pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPageDelete(page.pageNumber);
                        }}
                        className="w-6 h-6 rounded bg-white/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-white transition-all"
                        title="Delete Page"
                      >
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Page number */}
                <div
                  className={`px-2 py-1.5 text-center text-[10px] font-bold transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {page.pageNumber}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add page button */}
      {pages.length > 0 && (
        <div className="p-3 border-t border-slate-200">
          <button
            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
            title="Add Page"
          >
            <i className="fas fa-plus"></i>
            Add Page
          </button>
        </div>
      )}
    </div>
  );
};

export default PageThumbnails;
