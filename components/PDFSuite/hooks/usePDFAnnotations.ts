// ============================================
// usePDFAnnotations Hook
// Manages annotation CRUD operations
// ============================================

import { useState, useCallback, useMemo } from 'react';
import type {
  PDFAnnotation,
  AnnotationType,
  AnnotationRect,
  PDFAnnotationReply,
  StampType,
  LineEndStyle,
  Point,
} from '../types';
import { ANNOTATION_COLORS } from '../types';

interface UseAnnotationsOptions {
  onAnnotationAdd?: (annotation: PDFAnnotation) => void;
  onAnnotationUpdate?: (annotation: PDFAnnotation) => void;
  onAnnotationDelete?: (id: string) => void;
  defaultColor?: string;
  defaultOpacity?: number;
}

interface UseAnnotationsReturn {
  // State
  annotations: PDFAnnotation[];
  selectedIds: string[];
  hoveredId: string | null;

  // CRUD operations
  addAnnotation: (
    type: AnnotationType,
    pageNumber: number,
    rect: AnnotationRect,
    options?: Partial<PDFAnnotation>
  ) => PDFAnnotation;
  updateAnnotation: (id: string, updates: Partial<PDFAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  deleteMultiple: (ids: string[]) => void;
  duplicateAnnotation: (id: string) => PDFAnnotation | null;

  // Selection
  selectAnnotation: (id: string, addToSelection?: boolean) => void;
  deselectAnnotation: (id: string) => void;
  deselectAll: () => void;
  selectAll: (pageNumber?: number) => void;
  isSelected: (id: string) => boolean;

  // Hover
  setHovered: (id: string | null) => void;

  // Queries
  getAnnotation: (id: string) => PDFAnnotation | undefined;
  getAnnotationsForPage: (pageNumber: number) => PDFAnnotation[];
  getAnnotationsByType: (type: AnnotationType) => PDFAnnotation[];
  getSelectedAnnotations: () => PDFAnnotation[];

  // Replies/Comments
  addReply: (annotationId: string, content: string, author: string) => void;
  deleteReply: (annotationId: string, replyId: string) => void;

  // Bulk operations
  setAnnotations: (annotations: PDFAnnotation[]) => void;
  clearAnnotations: (pageNumber?: number) => void;
  moveAnnotations: (ids: string[], deltaX: number, deltaY: number) => void;
  resizeAnnotation: (id: string, newRect: AnnotationRect) => void;

  // Import/Export
  exportAnnotations: () => PDFAnnotation[];
  importAnnotations: (annotations: PDFAnnotation[]) => void;

  // Statistics
  annotationCount: number;
  annotationCountByPage: Map<number, number>;
  annotationCountByType: Map<AnnotationType, number>;
}

export function usePDFAnnotations(
  options: UseAnnotationsOptions = {}
): UseAnnotationsReturn {
  const {
    onAnnotationAdd,
    onAnnotationUpdate,
    onAnnotationDelete,
    defaultColor = ANNOTATION_COLORS[0],
    defaultOpacity = 100,
  } = options;

  // State
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add annotation
  const addAnnotation = useCallback(
    (
      type: AnnotationType,
      pageNumber: number,
      rect: AnnotationRect,
      annotationOptions: Partial<PDFAnnotation> = {}
    ): PDFAnnotation => {
      const now = Date.now();
      const annotation: PDFAnnotation = {
        id: generateId(),
        type,
        pageNumber,
        rect,
        color: defaultColor,
        opacity: defaultOpacity,
        borderWidth: type === 'highlight' ? 0 : 2,
        borderStyle: 'solid',
        createdAt: now,
        modifiedAt: now,
        isLocked: false,
        isHidden: false,
        ...annotationOptions,
      };

      setAnnotations((prev) => [...prev, annotation]);

      if (onAnnotationAdd) {
        onAnnotationAdd(annotation);
      }

      return annotation;
    },
    [generateId, defaultColor, defaultOpacity, onAnnotationAdd]
  );

  // Update annotation
  const updateAnnotation = useCallback(
    (id: string, updates: Partial<PDFAnnotation>) => {
      setAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id === id) {
            const updated = { ...ann, ...updates, modifiedAt: Date.now() };
            if (onAnnotationUpdate) {
              onAnnotationUpdate(updated);
            }
            return updated;
          }
          return ann;
        })
      );
    },
    [onAnnotationUpdate]
  );

  // Delete annotation
  const deleteAnnotation = useCallback(
    (id: string) => {
      setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
      setSelectedIds((prev) => prev.filter((selId) => selId !== id));

      if (onAnnotationDelete) {
        onAnnotationDelete(id);
      }
    },
    [onAnnotationDelete]
  );

  // Delete multiple annotations
  const deleteMultiple = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      setAnnotations((prev) => prev.filter((ann) => !idSet.has(ann.id)));
      setSelectedIds((prev) => prev.filter((selId) => !idSet.has(selId)));

      ids.forEach((id) => {
        if (onAnnotationDelete) {
          onAnnotationDelete(id);
        }
      });
    },
    [onAnnotationDelete]
  );

  // Duplicate annotation
  const duplicateAnnotation = useCallback(
    (id: string): PDFAnnotation | null => {
      const original = annotations.find((ann) => ann.id === id);
      if (!original) return null;

      const duplicate: PDFAnnotation = {
        ...original,
        id: generateId(),
        rect: {
          ...original.rect,
          x: original.rect.x + 20,
          y: original.rect.y + 20,
        },
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };

      setAnnotations((prev) => [...prev, duplicate]);

      if (onAnnotationAdd) {
        onAnnotationAdd(duplicate);
      }

      return duplicate;
    },
    [annotations, generateId, onAnnotationAdd]
  );

  // Selection operations
  const selectAnnotation = useCallback(
    (id: string, addToSelection = false) => {
      setSelectedIds((prev) => {
        if (addToSelection) {
          return prev.includes(id) ? prev : [...prev, id];
        }
        return [id];
      });
    },
    []
  );

  const deselectAnnotation = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((selId) => selId !== id));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectAll = useCallback(
    (pageNumber?: number) => {
      const targetAnnotations =
        pageNumber !== undefined
          ? annotations.filter((ann) => ann.pageNumber === pageNumber)
          : annotations;
      setSelectedIds(targetAnnotations.map((ann) => ann.id));
    },
    [annotations]
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  // Hover
  const setHovered = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  // Query operations
  const getAnnotation = useCallback(
    (id: string): PDFAnnotation | undefined => {
      return annotations.find((ann) => ann.id === id);
    },
    [annotations]
  );

  const getAnnotationsForPage = useCallback(
    (pageNumber: number): PDFAnnotation[] => {
      return annotations.filter((ann) => ann.pageNumber === pageNumber);
    },
    [annotations]
  );

  const getAnnotationsByType = useCallback(
    (type: AnnotationType): PDFAnnotation[] => {
      return annotations.filter((ann) => ann.type === type);
    },
    [annotations]
  );

  const getSelectedAnnotations = useCallback((): PDFAnnotation[] => {
    return annotations.filter((ann) => selectedIds.includes(ann.id));
  }, [annotations, selectedIds]);

  // Reply operations
  const addReply = useCallback(
    (annotationId: string, content: string, author: string) => {
      const reply: PDFAnnotationReply = {
        id: generateId(),
        parentId: annotationId,
        author,
        contents: content,
        createdAt: Date.now(),
      };

      updateAnnotation(annotationId, {
        replies: [
          ...(annotations.find((a) => a.id === annotationId)?.replies || []),
          reply,
        ],
      });
    },
    [annotations, generateId, updateAnnotation]
  );

  const deleteReply = useCallback(
    (annotationId: string, replyId: string) => {
      const annotation = annotations.find((a) => a.id === annotationId);
      if (!annotation || !annotation.replies) return;

      updateAnnotation(annotationId, {
        replies: annotation.replies.filter((r) => r.id !== replyId),
      });
    },
    [annotations, updateAnnotation]
  );

  // Bulk operations
  const clearAnnotations = useCallback(
    (pageNumber?: number) => {
      if (pageNumber !== undefined) {
        setAnnotations((prev) =>
          prev.filter((ann) => ann.pageNumber !== pageNumber)
        );
      } else {
        setAnnotations([]);
      }
      setSelectedIds([]);
    },
    []
  );

  const moveAnnotations = useCallback(
    (ids: string[], deltaX: number, deltaY: number) => {
      setAnnotations((prev) =>
        prev.map((ann) => {
          if (ids.includes(ann.id)) {
            return {
              ...ann,
              rect: {
                ...ann.rect,
                x: ann.rect.x + deltaX,
                y: ann.rect.y + deltaY,
              },
              modifiedAt: Date.now(),
            };
          }
          return ann;
        })
      );
    },
    []
  );

  const resizeAnnotation = useCallback(
    (id: string, newRect: AnnotationRect) => {
      updateAnnotation(id, { rect: newRect });
    },
    [updateAnnotation]
  );

  // Import/Export
  const exportAnnotations = useCallback((): PDFAnnotation[] => {
    return [...annotations];
  }, [annotations]);

  const importAnnotations = useCallback((newAnnotations: PDFAnnotation[]) => {
    setAnnotations(newAnnotations);
    setSelectedIds([]);
  }, []);

  // Statistics
  const annotationCount = annotations.length;

  const annotationCountByPage = useMemo(() => {
    const counts = new Map<number, number>();
    annotations.forEach((ann) => {
      counts.set(ann.pageNumber, (counts.get(ann.pageNumber) || 0) + 1);
    });
    return counts;
  }, [annotations]);

  const annotationCountByType = useMemo(() => {
    const counts = new Map<AnnotationType, number>();
    annotations.forEach((ann) => {
      counts.set(ann.type, (counts.get(ann.type) || 0) + 1);
    });
    return counts;
  }, [annotations]);

  return {
    // State
    annotations,
    selectedIds,
    hoveredId,

    // CRUD operations
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteMultiple,
    duplicateAnnotation,

    // Selection
    selectAnnotation,
    deselectAnnotation,
    deselectAll,
    selectAll,
    isSelected,

    // Hover
    setHovered,

    // Queries
    getAnnotation,
    getAnnotationsForPage,
    getAnnotationsByType,
    getSelectedAnnotations,

    // Replies/Comments
    addReply,
    deleteReply,

    // Bulk operations
    setAnnotations,
    clearAnnotations,
    moveAnnotations,
    resizeAnnotation,

    // Import/Export
    exportAnnotations,
    importAnnotations,

    // Statistics
    annotationCount,
    annotationCountByPage,
    annotationCountByType,
  };
}

export default usePDFAnnotations;
