// ============================================
// usePDFPages Hook
// Manages page navigation, zoom, and view settings
// ============================================

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  ViewState,
  ViewMode,
  FitMode,
  SidebarTab,
  PDFPage,
} from '../types';
import { DEFAULT_VIEW_STATE } from '../types';

interface UsePDFPagesOptions {
  initialPage?: number;
  initialZoom?: number;
  initialViewMode?: ViewMode;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
}

interface UsePDFPagesReturn {
  // View state
  viewState: ViewState;

  // Navigation
  currentPage: number;
  goToPage: (pageNumber: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Zoom
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (mode: FitMode) => void;
  canZoomIn: boolean;
  canZoomOut: boolean;

  // Rotation
  rotation: number;
  setRotation: (rotation: number) => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Fit mode
  fitMode: FitMode;
  setFitMode: (mode: FitMode) => void;

  // Sidebar
  showSidebar: boolean;
  toggleSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
  sidebarTab: SidebarTab;

  // Display options
  showRulers: boolean;
  toggleRulers: () => void;
  showGrid: boolean;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;

  // Scroll position
  scrollPosition: { x: number; y: number };
  setScrollPosition: (position: { x: number; y: number }) => void;

  // Container ref for calculating fit
  setContainerRef: (ref: HTMLDivElement | null) => void;

  // Calculate optimal zoom for fit modes
  calculateFitZoom: (
    page: PDFPage,
    containerWidth: number,
    containerHeight: number,
    mode: FitMode
  ) => number;
}

export function usePDFPages(
  pageCount: number,
  options: UsePDFPagesOptions = {}
): UsePDFPagesReturn {
  const {
    initialPage = 1,
    initialZoom = 1,
    initialViewMode = 'single',
    minZoom = 0.25,
    maxZoom = 5,
    zoomStep = 0.25,
    onPageChange,
    onZoomChange,
  } = options;

  // View state
  const [viewState, setViewState] = useState<ViewState>({
    ...DEFAULT_VIEW_STATE,
    currentPage: initialPage,
    zoom: initialZoom,
    mode: initialViewMode,
  });

  // Container ref for fit calculations
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Memoized values
  const canGoNext = useMemo(
    () => viewState.currentPage < pageCount,
    [viewState.currentPage, pageCount]
  );

  const canGoPrevious = useMemo(
    () => viewState.currentPage > 1,
    [viewState.currentPage]
  );

  const canZoomIn = useMemo(
    () => viewState.zoom < maxZoom,
    [viewState.zoom, maxZoom]
  );

  const canZoomOut = useMemo(
    () => viewState.zoom > minZoom,
    [viewState.zoom, minZoom]
  );

  // Navigation functions
  const goToPage = useCallback(
    (pageNumber: number) => {
      const page = Math.max(1, Math.min(pageNumber, pageCount));
      if (page !== viewState.currentPage) {
        setViewState((prev) => ({ ...prev, currentPage: page }));
        onPageChange?.(page);
      }
    },
    [pageCount, viewState.currentPage, onPageChange]
  );

  const nextPage = useCallback(() => {
    if (canGoNext) {
      goToPage(viewState.currentPage + 1);
    }
  }, [canGoNext, viewState.currentPage, goToPage]);

  const previousPage = useCallback(() => {
    if (canGoPrevious) {
      goToPage(viewState.currentPage - 1);
    }
  }, [canGoPrevious, viewState.currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(pageCount);
  }, [goToPage, pageCount]);

  // Zoom functions
  const setZoom = useCallback(
    (zoom: number) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
      if (clampedZoom !== viewState.zoom) {
        setViewState((prev) => ({ ...prev, zoom: clampedZoom, fitMode: 'actual' }));
        onZoomChange?.(clampedZoom);
      }
    },
    [minZoom, maxZoom, viewState.zoom, onZoomChange]
  );

  const zoomIn = useCallback(() => {
    if (canZoomIn) {
      setZoom(viewState.zoom + zoomStep);
    }
  }, [canZoomIn, viewState.zoom, zoomStep, setZoom]);

  const zoomOut = useCallback(() => {
    if (canZoomOut) {
      setZoom(viewState.zoom - zoomStep);
    }
  }, [canZoomOut, viewState.zoom, zoomStep, setZoom]);

  // Calculate fit zoom
  const calculateFitZoom = useCallback(
    (
      page: PDFPage,
      containerWidth: number,
      containerHeight: number,
      mode: FitMode
    ): number => {
      const pageWidth = page.width;
      const pageHeight = page.height;

      // Account for some padding
      const padding = 40;
      const availableWidth = containerWidth - padding;
      const availableHeight = containerHeight - padding;

      switch (mode) {
        case 'width':
          return availableWidth / pageWidth;
        case 'height':
          return availableHeight / pageHeight;
        case 'page':
          return Math.min(
            availableWidth / pageWidth,
            availableHeight / pageHeight
          );
        case 'actual':
        default:
          return 1;
      }
    },
    []
  );

  const zoomToFit = useCallback(
    (mode: FitMode) => {
      setViewState((prev) => ({ ...prev, fitMode: mode }));
      // Actual zoom calculation will happen in the component using container dimensions
    },
    []
  );

  // Rotation functions
  const setRotation = useCallback((rotation: number) => {
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    setViewState((prev) => ({ ...prev, rotation: normalizedRotation }));
  }, []);

  const rotateClockwise = useCallback(() => {
    setRotation(viewState.rotation + 90);
  }, [viewState.rotation, setRotation]);

  const rotateCounterClockwise = useCallback(() => {
    setRotation(viewState.rotation - 90);
  }, [viewState.rotation, setRotation]);

  // View mode functions
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewState((prev) => ({ ...prev, mode }));
  }, []);

  // Fit mode functions
  const setFitMode = useCallback((mode: FitMode) => {
    setViewState((prev) => ({ ...prev, fitMode: mode }));
  }, []);

  // Sidebar functions
  const toggleSidebar = useCallback(() => {
    setViewState((prev) => ({ ...prev, showSidebar: !prev.showSidebar }));
  }, []);

  const setSidebarTab = useCallback((tab: SidebarTab) => {
    setViewState((prev) => ({ ...prev, sidebarTab: tab, showSidebar: true }));
  }, []);

  // Display options
  const toggleRulers = useCallback(() => {
    setViewState((prev) => ({ ...prev, showRulers: !prev.showRulers }));
  }, []);

  const toggleGrid = useCallback(() => {
    setViewState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const setGridSize = useCallback((size: number) => {
    setViewState((prev) => ({ ...prev, gridSize: size }));
  }, []);

  // Scroll position
  const setScrollPosition = useCallback(
    (position: { x: number; y: number }) => {
      setViewState((prev) => ({ ...prev, scrollPosition: position }));
    },
    []
  );

  // Container ref setter
  const setContainerRef = useCallback((ref: HTMLDivElement | null) => {
    containerRef.current = ref;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          previousPage();
          break;
        case 'Home':
          e.preventDefault();
          firstPage();
          break;
        case 'End':
          e.preventDefault();
          lastPage();
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoom(1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, previousPage, firstPage, lastPage, zoomIn, zoomOut, setZoom]);

  return {
    // View state
    viewState,

    // Navigation
    currentPage: viewState.currentPage,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    canGoNext,
    canGoPrevious,

    // Zoom
    zoom: viewState.zoom,
    setZoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    canZoomIn,
    canZoomOut,

    // Rotation
    rotation: viewState.rotation,
    setRotation,
    rotateClockwise,
    rotateCounterClockwise,

    // View mode
    viewMode: viewState.mode,
    setViewMode,

    // Fit mode
    fitMode: viewState.fitMode,
    setFitMode,

    // Sidebar
    showSidebar: viewState.showSidebar,
    toggleSidebar,
    setSidebarTab,
    sidebarTab: viewState.sidebarTab,

    // Display options
    showRulers: viewState.showRulers,
    toggleRulers,
    showGrid: viewState.showGrid,
    toggleGrid,
    setGridSize,

    // Scroll position
    scrollPosition: viewState.scrollPosition,
    setScrollPosition,

    // Container ref
    setContainerRef,

    // Utility
    calculateFitZoom,
  };
}

export default usePDFPages;
