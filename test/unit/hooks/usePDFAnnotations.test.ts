// Unit tests for usePDFAnnotations hook
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePDFAnnotations } from '../../../components/PDFSuite/hooks/usePDFAnnotations';
import { annotationFixtures, createAnnotationFixture } from '../../fixtures/annotations';
import type { PDFAnnotation } from '../../../components/PDFSuite/types';

describe('usePDFAnnotations', () => {
  describe('initialization', () => {
    it('should initialize with empty annotations', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      expect(result.current.annotations).toEqual([]);
      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.hoveredId).toBeNull();
      expect(result.current.annotationCount).toBe(0);
    });

    it('should use default color and opacity from options', () => {
      const defaultColor = '#FF0000';
      const defaultOpacity = 75;

      const { result } = renderHook(() =>
        usePDFAnnotations({ defaultColor, defaultOpacity })
      );

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
      });

      const annotation = result.current.annotations[0];
      expect(annotation?.color).toBe(defaultColor);
      expect(annotation?.opacity).toBe(defaultOpacity);
    });
  });

  describe('adding annotations', () => {
    it('should add a highlight annotation', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 100, y: 100, width: 200, height: 20 });
      });

      expect(result.current.annotations).toHaveLength(1);
      expect(result.current.annotations[0]).toMatchObject({
        type: 'highlight',
        pageNumber: 1,
        rect: { x: 100, y: 100, width: 200, height: 20 },
      });
    });

    it('should add a note annotation with custom content', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation(
          'note',
          2,
          { x: 50, y: 50, width: 24, height: 24 },
          { contents: 'Test note content' }
        );
      });

      const annotation = result.current.annotations[0];
      expect(annotation?.type).toBe('note');
      expect(annotation?.contents).toBe('Test note content');
      expect(annotation?.pageNumber).toBe(2);
    });

    it('should generate unique IDs for each annotation', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 });
        result.current.addAnnotation('rectangle', 1, { x: 0, y: 0, width: 100, height: 100 });
      });

      const ids = result.current.annotations.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('should set creation and modification timestamps', () => {
      const beforeTime = Date.now();
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
      });

      const afterTime = Date.now();
      const annotation = result.current.annotations[0];

      expect(annotation?.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(annotation?.createdAt).toBeLessThanOrEqual(afterTime);
      expect(annotation?.modifiedAt).toBe(annotation?.createdAt);
    });

    it('should call onAnnotationAdd callback', () => {
      const onAnnotationAdd = vi.fn();
      const { result } = renderHook(() => usePDFAnnotations({ onAnnotationAdd }));

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
      });

      expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
      expect(onAnnotationAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'highlight' })
      );
    });

    it('should add multiple annotations', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('note', 1, { x: 50, y: 50, width: 24, height: 24 });
        result.current.addAnnotation('rectangle', 2, { x: 100, y: 100, width: 150, height: 100 });
      });

      expect(result.current.annotations).toHaveLength(3);
      expect(result.current.annotationCount).toBe(3);
    });
  });

  describe('updating annotations', () => {
    it('should update annotation properties', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let annotationId: string;

      act(() => {
        const annotation = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        });
        annotationId = annotation.id;
      });

      act(() => {
        result.current.updateAnnotation(annotationId, {
          color: '#FF0000',
          opacity: 80,
        });
      });

      const updated = result.current.annotations.find((a) => a.id === annotationId);
      expect(updated?.color).toBe('#FF0000');
      expect(updated?.opacity).toBe(80);
    });

    it('should update modification timestamp on update', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let annotationId: string;
      let originalModifiedAt: number;

      act(() => {
        const annotation = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        });
        annotationId = annotation.id;
        originalModifiedAt = annotation.modifiedAt;
      });

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        act(() => {
          result.current.updateAnnotation(annotationId, { contents: 'Updated' });
        });

        const updated = result.current.annotations.find((a) => a.id === annotationId);
        expect(updated?.modifiedAt).toBeGreaterThan(originalModifiedAt);
      }, 10);
    });

    it('should call onAnnotationUpdate callback', () => {
      const onAnnotationUpdate = vi.fn();
      const { result } = renderHook(() => usePDFAnnotations({ onAnnotationUpdate }));

      let annotationId: string;

      act(() => {
        const annotation = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        });
        annotationId = annotation.id;
      });

      act(() => {
        result.current.updateAnnotation(annotationId, { color: '#0000FF' });
      });

      expect(onAnnotationUpdate).toHaveBeenCalledTimes(1);
      expect(onAnnotationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: annotationId, color: '#0000FF' })
      );
    });

    it('should not update non-existent annotation', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
      });

      const initialLength = result.current.annotations.length;

      act(() => {
        result.current.updateAnnotation('non-existent-id', { color: '#FF0000' });
      });

      expect(result.current.annotations).toHaveLength(initialLength);
    });
  });

  describe('deleting annotations', () => {
    it('should delete annotation by ID', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let annotationId: string;

      act(() => {
        const annotation = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        });
        annotationId = annotation.id;
      });

      expect(result.current.annotations).toHaveLength(1);

      act(() => {
        result.current.deleteAnnotation(annotationId);
      });

      expect(result.current.annotations).toHaveLength(0);
    });

    it('should call onAnnotationDelete callback', () => {
      const onAnnotationDelete = vi.fn();
      const { result } = renderHook(() => usePDFAnnotations({ onAnnotationDelete }));

      let annotationId: string;

      act(() => {
        const annotation = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        });
        annotationId = annotation.id;
      });

      act(() => {
        result.current.deleteAnnotation(annotationId);
      });

      expect(onAnnotationDelete).toHaveBeenCalledTimes(1);
      expect(onAnnotationDelete).toHaveBeenCalledWith(annotationId);
    });

    it('should delete multiple annotations', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      const ids: string[] = [];

      act(() => {
        ids.push(
          result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 }).id
        );
        ids.push(result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 }).id);
        ids.push(
          result.current.addAnnotation('rectangle', 1, { x: 0, y: 0, width: 100, height: 100 }).id
        );
      });

      expect(result.current.annotations).toHaveLength(3);

      act(() => {
        result.current.deleteMultiple([ids[0]!, ids[2]!]);
      });

      expect(result.current.annotations).toHaveLength(1);
      expect(result.current.annotations[0]?.id).toBe(ids[1]);
    });
  });

  describe('selection', () => {
    it('should select annotation', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let annotationId: string;

      act(() => {
        annotationId = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        }).id;
      });

      act(() => {
        result.current.selectAnnotation(annotationId);
      });

      expect(result.current.selectedIds).toContain(annotationId);
      expect(result.current.isSelected(annotationId)).toBe(true);
    });

    it('should add to selection when addToSelection is true', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      const ids: string[] = [];

      act(() => {
        ids.push(
          result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 }).id
        );
        ids.push(result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 }).id);
      });

      act(() => {
        result.current.selectAnnotation(ids[0]!);
        result.current.selectAnnotation(ids[1]!, true);
      });

      expect(result.current.selectedIds).toHaveLength(2);
      expect(result.current.selectedIds).toContain(ids[0]);
      expect(result.current.selectedIds).toContain(ids[1]);
    });

    it('should deselect annotation', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let annotationId: string;

      act(() => {
        annotationId = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        }).id;
        result.current.selectAnnotation(annotationId);
      });

      expect(result.current.selectedIds).toContain(annotationId);

      act(() => {
        result.current.deselectAnnotation(annotationId);
      });

      expect(result.current.selectedIds).not.toContain(annotationId);
    });

    it('should deselect all annotations', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        const id1 = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        }).id;
        const id2 = result.current.addAnnotation('note', 1, {
          x: 0,
          y: 0,
          width: 24,
          height: 24,
        }).id;
        result.current.selectAnnotation(id1);
        result.current.selectAnnotation(id2, true);
      });

      expect(result.current.selectedIds).toHaveLength(2);

      act(() => {
        result.current.deselectAll();
      });

      expect(result.current.selectedIds).toHaveLength(0);
    });

    it('should select all annotations on a page', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 });
        result.current.addAnnotation('rectangle', 2, { x: 0, y: 0, width: 100, height: 100 });
      });

      act(() => {
        result.current.selectAll(1);
      });

      expect(result.current.selectedIds).toHaveLength(2);
    });
  });

  describe('queries', () => {
    it('should get annotations for a specific page', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 });
        result.current.addAnnotation('rectangle', 2, { x: 0, y: 0, width: 100, height: 100 });
      });

      const page1Annotations = result.current.getAnnotationsForPage(1);
      expect(page1Annotations).toHaveLength(2);

      const page2Annotations = result.current.getAnnotationsForPage(2);
      expect(page2Annotations).toHaveLength(1);
    });

    it('should get annotations by type', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('highlight', 2, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 });
      });

      const highlights = result.current.getAnnotationsByType('highlight');
      expect(highlights).toHaveLength(2);

      const notes = result.current.getAnnotationsByType('note');
      expect(notes).toHaveLength(1);
    });

    it('should get selected annotations', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let id1: string, id2: string;

      act(() => {
        id1 = result.current.addAnnotation('highlight', 1, {
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        }).id;
        id2 = result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 }).id;
        result.current.addAnnotation('rectangle', 1, { x: 0, y: 0, width: 100, height: 100 });
      });

      act(() => {
        result.current.selectAnnotation(id1);
        result.current.selectAnnotation(id2, true);
      });

      const selected = result.current.getSelectedAnnotations();
      expect(selected).toHaveLength(2);
      expect(selected.map((a) => a.id)).toContain(id1);
      expect(selected.map((a) => a.id)).toContain(id2);
    });

    it('should count annotations correctly', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 });
        result.current.addAnnotation('rectangle', 2, { x: 0, y: 0, width: 100, height: 100 });
      });

      expect(result.current.annotationCount).toBe(3);

      const byPage = result.current.annotationCountByPage;
      expect(byPage.get(1)).toBe(2);
      expect(byPage.get(2)).toBe(1);

      const byType = result.current.annotationCountByType;
      expect(byType.get('highlight')).toBe(1);
      expect(byType.get('note')).toBe(1);
      expect(byType.get('rectangle')).toBe(1);
    });
  });

  describe('replies', () => {
    it('should add reply to annotation', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let annotationId: string;

      act(() => {
        annotationId = result.current.addAnnotation('note', 1, {
          x: 0,
          y: 0,
          width: 24,
          height: 24,
        }).id;
      });

      act(() => {
        result.current.addReply(annotationId, 'Test reply', 'Test User');
      });

      const annotation = result.current.getAnnotation(annotationId);
      expect(annotation?.replies).toHaveLength(1);
      expect(annotation?.replies?.[0]?.content).toBe('Test reply');
      expect(annotation?.replies?.[0]?.author).toBe('Test User');
    });

    it('should delete reply from annotation', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let annotationId: string;
      let replyId: string;

      act(() => {
        annotationId = result.current.addAnnotation('note', 1, {
          x: 0,
          y: 0,
          width: 24,
          height: 24,
        }).id;
        result.current.addReply(annotationId, 'Test reply', 'Test User');
      });

      const annotation = result.current.getAnnotation(annotationId);
      replyId = annotation?.replies?.[0]?.id!;

      act(() => {
        result.current.deleteReply(annotationId, replyId);
      });

      const updated = result.current.getAnnotation(annotationId);
      expect(updated?.replies).toHaveLength(0);
    });
  });

  describe('bulk operations', () => {
    it('should clear all annotations', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('note', 2, { x: 0, y: 0, width: 24, height: 24 });
      });

      expect(result.current.annotations).toHaveLength(2);

      act(() => {
        result.current.clearAnnotations();
      });

      expect(result.current.annotations).toHaveLength(0);
    });

    it('should clear annotations for specific page', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      act(() => {
        result.current.addAnnotation('highlight', 1, { x: 0, y: 0, width: 100, height: 20 });
        result.current.addAnnotation('note', 1, { x: 0, y: 0, width: 24, height: 24 });
        result.current.addAnnotation('rectangle', 2, { x: 0, y: 0, width: 100, height: 100 });
      });

      act(() => {
        result.current.clearAnnotations(1);
      });

      expect(result.current.annotations).toHaveLength(1);
      expect(result.current.annotations[0]?.pageNumber).toBe(2);
    });

    it('should duplicate annotation', () => {
      const { result } = renderHook(() => usePDFAnnotations());

      let originalId: string;

      act(() => {
        originalId = result.current.addAnnotation(
          'highlight',
          1,
          { x: 100, y: 100, width: 200, height: 20 },
          { contents: 'Original annotation' }
        ).id;
      });

      let duplicate: PDFAnnotation | null = null;

      act(() => {
        duplicate = result.current.duplicateAnnotation(originalId);
      });

      expect(duplicate).not.toBeNull();
      expect(duplicate?.id).not.toBe(originalId);
      expect(duplicate?.contents).toBe('Original annotation');
      expect(result.current.annotations).toHaveLength(2);
    });
  });
});
