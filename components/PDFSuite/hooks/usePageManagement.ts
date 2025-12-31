// ============================================
// usePageManagement Hook
// Manages page manipulation: reorder, delete, rotate, extract
// ============================================

import { useState, useCallback } from 'react';
import type { PDFPage } from '../types';

interface UsePageManagementOptions {
  onPagesChange?: (pages: PDFPage[]) => void;
  onPageDelete?: (pageNumber: number) => void;
  onPageExtract?: (pageNumbers: number[]) => void;
}

interface UsePageManagementReturn {
  // Page array management
  managedPages: PDFPage[];
  setManagedPages: (pages: PDFPage[]) => void;

  // Page operations
  reorderPage: (fromIndex: number, toIndex: number) => void;
  deletePage: (pageNumber: number) => void;
  deletePages: (pageNumbers: number[]) => void;
  rotatePage: (pageNumber: number, direction: 'cw' | 'ccw') => void;
  rotatePages: (pageNumbers: number[], direction: 'cw' | 'ccw') => void;
  extractPages: (pageNumbers: number[]) => void;
  duplicatePage: (pageNumber: number) => void;
  movePagesToStart: (pageNumbers: number[]) => void;
  movePagesToEnd: (pageNumbers: number[]) => void;

  // Selection
  selectedPages: number[];
  setSelectedPages: (pages: number[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  togglePageSelection: (pageNumber: number) => void;
  selectRange: (start: number, end: number) => void;

  // Utilities
  getPageRotation: (pageNumber: number) => number;
  hasChanges: boolean;
  resetChanges: () => void;
}

export function usePageManagement(
  initialPages: PDFPage[] = [],
  options: UsePageManagementOptions = {}
): UsePageManagementReturn {
  const { onPagesChange, onPageDelete, onPageExtract } = options;

  // Track managed pages with their modifications
  const [managedPages, setManagedPagesInternal] = useState<PDFPage[]>(initialPages);
  const [pageRotations, setPageRotations] = useState<Map<number, number>>(new Map());
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [originalPages, setOriginalPages] = useState<PDFPage[]>(initialPages);
  const [hasChanges, setHasChanges] = useState(false);

  // Set managed pages
  const setManagedPages = useCallback((pages: PDFPage[]) => {
    setManagedPagesInternal(pages);
    setOriginalPages(pages);
    setHasChanges(false);
    setPageRotations(new Map());
  }, []);

  // Reorder pages
  const reorderPage = useCallback((fromIndex: number, toIndex: number) => {
    setManagedPagesInternal((prev) => {
      const newPages = [...prev];
      const [removed] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, removed);

      // Renumber pages
      const renumbered = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      onPagesChange?.(renumbered);
      return renumbered;
    });
    setHasChanges(true);
  }, [onPagesChange]);

  // Delete single page
  const deletePage = useCallback((pageNumber: number) => {
    setManagedPagesInternal((prev) => {
      if (prev.length <= 1) {
        console.warn('Cannot delete the last page');
        return prev;
      }

      const newPages = prev
        .filter((p) => p.pageNumber !== pageNumber)
        .map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        }));

      onPageDelete?.(pageNumber);
      onPagesChange?.(newPages);
      return newPages;
    });

    // Remove from selection
    setSelectedPages((prev) => prev.filter((p) => p !== pageNumber));
    setHasChanges(true);
  }, [onPageDelete, onPagesChange]);

  // Delete multiple pages
  const deletePages = useCallback((pageNumbers: number[]) => {
    setManagedPagesInternal((prev) => {
      const remaining = prev.filter((p) => !pageNumbers.includes(p.pageNumber));
      if (remaining.length === 0) {
        console.warn('Cannot delete all pages');
        return prev;
      }

      const renumbered = remaining.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      pageNumbers.forEach((pn) => onPageDelete?.(pn));
      onPagesChange?.(renumbered);
      return renumbered;
    });

    setSelectedPages([]);
    setHasChanges(true);
  }, [onPageDelete, onPagesChange]);

  // Rotate single page
  const rotatePage = useCallback((pageNumber: number, direction: 'cw' | 'ccw') => {
    setPageRotations((prev) => {
      const newMap = new Map(prev);
      const currentRotation = newMap.get(pageNumber) || 0;
      const delta = direction === 'cw' ? 90 : -90;
      const newRotation = ((currentRotation + delta) % 360 + 360) % 360;
      newMap.set(pageNumber, newRotation);
      return newMap;
    });

    setManagedPagesInternal((prev) => {
      const newPages = prev.map((page) => {
        if (page.pageNumber === pageNumber) {
          const currentRotation = page.rotation || 0;
          const delta = direction === 'cw' ? 90 : -90;
          return {
            ...page,
            rotation: ((currentRotation + delta) % 360 + 360) % 360,
          };
        }
        return page;
      });
      onPagesChange?.(newPages);
      return newPages;
    });

    setHasChanges(true);
  }, [onPagesChange]);

  // Rotate multiple pages
  const rotatePages = useCallback((pageNumbers: number[], direction: 'cw' | 'ccw') => {
    pageNumbers.forEach((pn) => rotatePage(pn, direction));
  }, [rotatePage]);

  // Extract pages (creates downloadable PDF with selected pages)
  const extractPages = useCallback((pageNumbers: number[]) => {
    onPageExtract?.(pageNumbers);
  }, [onPageExtract]);

  // Duplicate page
  const duplicatePage = useCallback((pageNumber: number) => {
    setManagedPagesInternal((prev) => {
      const pageIndex = prev.findIndex((p) => p.pageNumber === pageNumber);
      if (pageIndex === -1) return prev;

      const pageToDuplicate = prev[pageIndex];
      const newPage: PDFPage = {
        ...pageToDuplicate,
        pageNumber: pageNumber + 1,
      };

      const newPages = [...prev];
      newPages.splice(pageIndex + 1, 0, newPage);

      // Renumber pages after the insertion
      const renumbered = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      onPagesChange?.(renumbered);
      return renumbered;
    });

    setHasChanges(true);
  }, [onPagesChange]);

  // Move pages to start
  const movePagesToStart = useCallback((pageNumbers: number[]) => {
    setManagedPagesInternal((prev) => {
      const toMove = prev.filter((p) => pageNumbers.includes(p.pageNumber));
      const remaining = prev.filter((p) => !pageNumbers.includes(p.pageNumber));
      const newPages = [...toMove, ...remaining].map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      onPagesChange?.(newPages);
      return newPages;
    });

    setHasChanges(true);
  }, [onPagesChange]);

  // Move pages to end
  const movePagesToEnd = useCallback((pageNumbers: number[]) => {
    setManagedPagesInternal((prev) => {
      const toMove = prev.filter((p) => pageNumbers.includes(p.pageNumber));
      const remaining = prev.filter((p) => !pageNumbers.includes(p.pageNumber));
      const newPages = [...remaining, ...toMove].map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      onPagesChange?.(newPages);
      return newPages;
    });

    setHasChanges(true);
  }, [onPagesChange]);

  // Selection functions
  const selectAll = useCallback(() => {
    setSelectedPages(managedPages.map((p) => p.pageNumber));
  }, [managedPages]);

  const deselectAll = useCallback(() => {
    setSelectedPages([]);
  }, []);

  const togglePageSelection = useCallback((pageNumber: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNumber)
        ? prev.filter((p) => p !== pageNumber)
        : [...prev, pageNumber]
    );
  }, []);

  const selectRange = useCallback((start: number, end: number) => {
    const [min, max] = start < end ? [start, end] : [end, start];
    const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    setSelectedPages((prev) => [...new Set([...prev, ...range])]);
  }, []);

  // Get rotation for a specific page
  const getPageRotation = useCallback((pageNumber: number): number => {
    return pageRotations.get(pageNumber) || 0;
  }, [pageRotations]);

  // Reset changes
  const resetChanges = useCallback(() => {
    setManagedPagesInternal(originalPages);
    setPageRotations(new Map());
    setSelectedPages([]);
    setHasChanges(false);
  }, [originalPages]);

  return {
    managedPages,
    setManagedPages,
    reorderPage,
    deletePage,
    deletePages,
    rotatePage,
    rotatePages,
    extractPages,
    duplicatePage,
    movePagesToStart,
    movePagesToEnd,
    selectedPages,
    setSelectedPages,
    selectAll,
    deselectAll,
    togglePageSelection,
    selectRange,
    getPageRotation,
    hasChanges,
    resetChanges,
  };
}

export default usePageManagement;
