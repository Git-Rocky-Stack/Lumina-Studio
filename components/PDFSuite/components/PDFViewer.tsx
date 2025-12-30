// ============================================
// PDFViewer Component
// Core PDF rendering using pdf.js
// ============================================

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { renderPageToCanvas } from '../../../services/pdfService';
import type { PDFPage, PDFAnnotation, PDFFormField, ViewMode, FitMode } from '../types';

interface PDFViewerProps {
  pages: PDFPage[];
  currentPage: number;
  zoom: number;
  rotation: number;
  viewMode: ViewMode;
  fitMode: FitMode;
  annotations?: PDFAnnotation[];
  formFields?: PDFFormField[];
  showGrid?: boolean;
  gridSize?: number;
  onPageClick?: (pageNumber: number, x: number, y: number) => void;
  onTextSelect?: (text: string, pageNumber: number, bounds: DOMRect) => void;
  onAnnotationClick?: (annotation: PDFAnnotation) => void;
  onFormFieldClick?: (field: PDFFormField) => void;
  onZoomChange?: (zoom: number) => void;
  className?: string;
}

export interface PDFViewerHandle {
  scrollToPage: (pageNumber: number) => void;
  getVisiblePages: () => number[];
  getContainerDimensions: () => { width: number; height: number };
}

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(
  (
    {
      pages,
      currentPage,
      zoom,
      rotation,
      viewMode,
      fitMode,
      annotations = [],
      formFields = [],
      showGrid = false,
      gridSize = 10,
      onPageClick,
      onTextSelect,
      onAnnotationClick,
      onFormFieldClick,
      onZoomChange,
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
    const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
    const [isRendering, setIsRendering] = useState(false);
    const renderQueueRef = useRef<number[]>([]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      scrollToPage: (pageNumber: number) => {
        const pageElement = document.getElementById(`pdf-page-${pageNumber}`);
        if (pageElement && containerRef.current) {
          containerRef.current.scrollTo({
            top: pageElement.offsetTop - 20,
            behavior: 'smooth',
          });
        }
      },
      getVisiblePages: () => {
        if (!containerRef.current) return [];
        const container = containerRef.current;
        const { scrollTop, clientHeight } = container;
        const visiblePages: number[] = [];

        pages.forEach((page) => {
          const element = document.getElementById(`pdf-page-${page.pageNumber}`);
          if (element) {
            const { offsetTop, offsetHeight } = element;
            const isVisible =
              offsetTop + offsetHeight > scrollTop &&
              offsetTop < scrollTop + clientHeight;
            if (isVisible) {
              visiblePages.push(page.pageNumber);
            }
          }
        });

        return visiblePages;
      },
      getContainerDimensions: () => {
        if (!containerRef.current) return { width: 0, height: 0 };
        return {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        };
      },
    }));

    // Render a single page
    const renderPage = useCallback(
      async (page: PDFPage) => {
        if (!page.proxy) return;

        const canvas = canvasRefs.current.get(page.pageNumber);
        if (!canvas) return;

        try {
          await renderPageToCanvas(page.proxy, canvas, zoom);
          setRenderedPages((prev) => new Set([...prev, page.pageNumber]));
        } catch (error) {
          console.error(`Failed to render page ${page.pageNumber}:`, error);
        }
      },
      [zoom]
    );

    // Process render queue
    const processRenderQueue = useCallback(async () => {
      if (isRendering || renderQueueRef.current.length === 0) return;

      setIsRendering(true);

      while (renderQueueRef.current.length > 0) {
        const pageNumber = renderQueueRef.current.shift()!;
        const page = pages.find((p) => p.pageNumber === pageNumber);
        if (page) {
          await renderPage(page);
        }
      }

      setIsRendering(false);
    }, [isRendering, pages, renderPage]);

    // Queue page for rendering
    const queuePageRender = useCallback(
      (pageNumber: number) => {
        if (!renderQueueRef.current.includes(pageNumber)) {
          renderQueueRef.current.push(pageNumber);
          processRenderQueue();
        }
      },
      [processRenderQueue]
    );

    // Re-render on zoom change
    useEffect(() => {
      setRenderedPages(new Set());
      renderQueueRef.current = [];

      // Queue visible pages first, then others
      const visiblePages =
        viewMode === 'single' ? [currentPage] : pages.map((p) => p.pageNumber);

      visiblePages.forEach((pageNum) => {
        queuePageRender(pageNum);
      });
    }, [zoom, rotation, pages, currentPage, viewMode, queuePageRender]);

    // Handle scroll for continuous mode
    const handleScroll = useCallback(() => {
      if (viewMode === 'single') return;

      if (!containerRef.current) return;
      const container = containerRef.current;
      const { scrollTop, clientHeight } = container;

      // Find pages that are close to being visible and queue them
      pages.forEach((page) => {
        const element = document.getElementById(`pdf-page-${page.pageNumber}`);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          const buffer = clientHeight; // Pre-render one viewport ahead
          const isNearVisible =
            offsetTop + offsetHeight > scrollTop - buffer &&
            offsetTop < scrollTop + clientHeight + buffer;

          if (isNearVisible && !renderedPages.has(page.pageNumber)) {
            queuePageRender(page.pageNumber);
          }
        }
      });
    }, [viewMode, pages, renderedPages, queuePageRender]);

    // Handle page click
    const handlePageClick = useCallback(
      (e: React.MouseEvent, pageNumber: number) => {
        if (!onPageClick) return;

        const canvas = canvasRefs.current.get(pageNumber);
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        onPageClick(pageNumber, x, y);
      },
      [zoom, onPageClick]
    );

    // Handle text selection
    const handleMouseUp = useCallback(() => {
      if (!onTextSelect) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const text = selection.toString().trim();
      if (!text) return;

      const range = selection.getRangeAt(0);
      const bounds = range.getBoundingClientRect();

      // Find which page the selection is on
      const selectionElement = range.commonAncestorContainer as HTMLElement;
      const pageElement = selectionElement.closest('[data-page-number]');
      if (pageElement) {
        const pageNumber = parseInt(
          pageElement.getAttribute('data-page-number') || '1',
          10
        );
        onTextSelect(text, pageNumber, bounds);
      }
    }, [onTextSelect]);

    // Handle mouse wheel zoom
    const handleWheel = useCallback(
      (e: WheelEvent) => {
        if (!e.ctrlKey && !e.metaKey) return;
        if (!onZoomChange) return;

        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(5, zoom + delta));
        onZoomChange(newZoom);
      },
      [zoom, onZoomChange]
    );

    // Add wheel listener
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // Get pages to render based on view mode
    const visiblePages = useMemo(() => {
      switch (viewMode) {
        case 'single':
          return pages.filter((p) => p.pageNumber === currentPage);
        case 'facing':
          const startPage = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
          return pages.filter(
            (p) => p.pageNumber === startPage || p.pageNumber === startPage + 1
          );
        default:
          return pages;
      }
    }, [pages, currentPage, viewMode]);

    // Grid overlay
    const renderGrid = useCallback(
      (width: number, height: number) => {
        if (!showGrid) return null;

        const lines = [];
        const scaledGridSize = gridSize * zoom;

        // Vertical lines
        for (let x = 0; x <= width; x += scaledGridSize) {
          lines.push(
            <line
              key={`v-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke="rgba(99, 102, 241, 0.2)"
              strokeWidth={1}
            />
          );
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += scaledGridSize) {
          lines.push(
            <line
              key={`h-${y}`}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke="rgba(99, 102, 241, 0.2)"
              strokeWidth={1}
            />
          );
        }

        return (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={width}
            height={height}
          >
            {lines}
          </svg>
        );
      },
      [showGrid, gridSize, zoom]
    );

    // Render annotations for a page
    const renderAnnotations = useCallback(
      (pageNumber: number, pageWidth: number, pageHeight: number) => {
        const pageAnnotations = annotations.filter(
          (a) => a.pageNumber === pageNumber && !a.isHidden
        );

        return pageAnnotations.map((annotation) => {
          const { rect, color, opacity, type } = annotation;

          const style: React.CSSProperties = {
            position: 'absolute',
            left: rect.x * zoom,
            top: rect.y * zoom,
            width: rect.width * zoom,
            height: rect.height * zoom,
            backgroundColor:
              type === 'highlight'
                ? `${color}${Math.round(opacity * 0.5 * 2.55)
                    .toString(16)
                    .padStart(2, '0')}`
                : 'transparent',
            border:
              type === 'rectangle' || type === 'ellipse'
                ? `2px solid ${color}`
                : 'none',
            borderRadius: type === 'ellipse' ? '50%' : 0,
            cursor: 'pointer',
            opacity: opacity / 100,
          };

          return (
            <div
              key={annotation.id}
              style={style}
              onClick={() => onAnnotationClick?.(annotation)}
              title={annotation.contents || ''}
            />
          );
        });
      },
      [annotations, zoom, onAnnotationClick]
    );

    return (
      <div
        ref={containerRef}
        className={`relative overflow-auto bg-slate-200/50 ${className}`}
        onScroll={handleScroll}
        onMouseUp={handleMouseUp}
      >
        <div
          className={`flex ${
            viewMode === 'facing' || viewMode === 'facingContinuous'
              ? 'flex-row flex-wrap justify-center'
              : 'flex-col items-center'
          } gap-6 p-6`}
        >
          {visiblePages.map((page) => {
            const scaledWidth = page.width * zoom;
            const scaledHeight = page.height * zoom;

            return (
              <div
                key={page.pageNumber}
                id={`pdf-page-${page.pageNumber}`}
                data-page-number={page.pageNumber}
                className="relative bg-white shadow-xl rounded-sm overflow-hidden transition-shadow hover:shadow-2xl"
                style={{
                  width: scaledWidth,
                  height: scaledHeight,
                  transform: `rotate(${rotation}deg)`,
                }}
                onClick={(e) => handlePageClick(e, page.pageNumber)}
              >
                {/* Canvas for PDF rendering */}
                <canvas
                  ref={(el) => {
                    if (el) {
                      canvasRefs.current.set(page.pageNumber, el);
                    } else {
                      canvasRefs.current.delete(page.pageNumber);
                    }
                  }}
                  className="absolute inset-0"
                  style={{ width: scaledWidth, height: scaledHeight }}
                />

                {/* Loading placeholder */}
                {!renderedPages.has(page.pageNumber) && (
                  <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                    <div className="text-slate-400 text-sm font-medium">
                      Loading page {page.pageNumber}...
                    </div>
                  </div>
                )}

                {/* Grid overlay */}
                {renderGrid(scaledWidth, scaledHeight)}

                {/* Annotations layer */}
                <div className="absolute inset-0 pointer-events-none">
                  {renderAnnotations(page.pageNumber, page.width, page.height)}
                </div>

                {/* Page number badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 text-white type-micro rounded-full backdrop-blur-sm">
                  {page.pageNumber}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {pages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <i className="fas fa-file-pdf text-6xl text-slate-200 mb-4"></i>
              <p className="text-slate-400 font-medium">No document loaded</p>
              <p className="text-slate-300 text-sm mt-1">
                Upload a PDF to get started
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PDFViewer.displayName = 'PDFViewer';

export default PDFViewer;
