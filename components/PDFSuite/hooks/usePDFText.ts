// ============================================
// usePDFText Hook
// Manages text extraction, selection, and modification
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { extractTextContent } from '../../../services/pdfService';
import type { PDFTextContent, PDFTextItem, TextSelection } from '../types';

interface TextEdit {
  id: string;
  pageNumber: number;
  originalText: string;
  newText: string;
  textItemId: string;
  bounds: { x: number; y: number; width: number; height: number };
  timestamp: number;
}

interface UsePDFTextOptions {
  onTextSelect?: (selection: TextSelection) => void;
  onTextEdit?: (edit: TextEdit) => void;
}

interface UsePDFTextReturn {
  // Text content
  textContent: Map<number, PDFTextContent>;
  isExtracting: boolean;

  // Extraction
  extractPageText: (page: PDFPageProxy, pageNumber: number) => Promise<PDFTextContent | null>;
  extractAllText: (pages: Array<{ proxy: PDFPageProxy | null; pageNumber: number }>) => Promise<void>;
  getPageText: (pageNumber: number) => PDFTextContent | undefined;
  getFullText: () => string;

  // Selection
  currentSelection: TextSelection | null;
  setSelection: (selection: TextSelection | null) => void;
  clearSelection: () => void;

  // Text editing
  textEdits: TextEdit[];
  editText: (pageNumber: number, textItemId: string, newText: string) => void;
  revertEdit: (editId: string) => void;
  getEditedText: (pageNumber: number, textItemId: string) => string | null;
  hasEdits: boolean;

  // Search within text
  findInPage: (pageNumber: number, query: string, options?: SearchOptions) => PDFTextItem[];
  findAll: (query: string, options?: SearchOptions) => Array<{ pageNumber: number; items: PDFTextItem[] }>;
}

interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

export function usePDFText(options: UsePDFTextOptions = {}): UsePDFTextReturn {
  const { onTextSelect, onTextEdit } = options;

  // State
  const [textContent, setTextContent] = useState<Map<number, PDFTextContent>>(new Map());
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const [textEdits, setTextEdits] = useState<TextEdit[]>([]);

  // Refs
  const extractionCacheRef = useRef<Map<number, PDFTextContent>>(new Map());

  // Extract text from a single page
  const extractPageText = useCallback(
    async (page: PDFPageProxy, pageNumber: number): Promise<PDFTextContent | null> => {
      // Check cache first
      if (extractionCacheRef.current.has(pageNumber)) {
        return extractionCacheRef.current.get(pageNumber)!;
      }

      try {
        const content = await extractTextContent(page);
        extractionCacheRef.current.set(pageNumber, content);
        setTextContent((prev) => new Map(prev).set(pageNumber, content));
        return content;
      } catch (error) {
        console.error(`Failed to extract text from page ${pageNumber}:`, error);
        return null;
      }
    },
    []
  );

  // Extract text from all pages
  const extractAllText = useCallback(
    async (pages: Array<{ proxy: PDFPageProxy | null; pageNumber: number }>) => {
      setIsExtracting(true);

      try {
        const results = new Map<number, PDFTextContent>();

        for (const page of pages) {
          if (page.proxy) {
            const content = await extractPageText(page.proxy, page.pageNumber);
            if (content) {
              results.set(page.pageNumber, content);
            }
          }
        }

        setTextContent(results);
      } finally {
        setIsExtracting(false);
      }
    },
    [extractPageText]
  );

  // Get text content for a specific page
  const getPageText = useCallback(
    (pageNumber: number): PDFTextContent | undefined => {
      return textContent.get(pageNumber);
    },
    [textContent]
  );

  // Get full document text
  const getFullText = useCallback((): string => {
    const pages = Array.from(textContent.entries()).sort(([a], [b]) => a - b);
    return pages
      .map(([_, content]) => content.items.map((item) => item.text).join(' '))
      .join('\n\n');
  }, [textContent]);

  // Set selection
  const setSelection = useCallback(
    (selection: TextSelection | null) => {
      setCurrentSelection(selection);
      if (selection && onTextSelect) {
        onTextSelect(selection);
      }
    },
    [onTextSelect]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setCurrentSelection(null);
  }, []);

  // Edit text
  const editText = useCallback(
    (pageNumber: number, textItemId: string, newText: string) => {
      const pageContent = textContent.get(pageNumber);
      if (!pageContent) return;

      const textItem = pageContent.items.find((item) => item.id === textItemId);
      if (!textItem) return;

      const edit: TextEdit = {
        id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pageNumber,
        originalText: textItem.text,
        newText,
        textItemId,
        bounds: {
          x: textItem.x,
          y: textItem.y,
          width: textItem.width,
          height: textItem.height,
        },
        timestamp: Date.now(),
      };

      setTextEdits((prev) => [...prev, edit]);

      // Update text content
      setTextContent((prev) => {
        const newMap = new Map(prev);
        const content = newMap.get(pageNumber);
        if (content) {
          const newItems = content.items.map((item) =>
            item.id === textItemId
              ? { ...item, text: newText, isEdited: true, originalText: item.text }
              : item
          );
          newMap.set(pageNumber, { ...content, items: newItems });
        }
        return newMap;
      });

      if (onTextEdit) {
        onTextEdit(edit);
      }
    },
    [textContent, onTextEdit]
  );

  // Revert an edit
  const revertEdit = useCallback(
    (editId: string) => {
      const edit = textEdits.find((e) => e.id === editId);
      if (!edit) return;

      // Restore original text
      setTextContent((prev) => {
        const newMap = new Map(prev);
        const content = newMap.get(edit.pageNumber);
        if (content) {
          const newItems = content.items.map((item) =>
            item.id === edit.textItemId
              ? { ...item, text: edit.originalText, isEdited: false }
              : item
          );
          newMap.set(edit.pageNumber, { ...content, items: newItems });
        }
        return newMap;
      });

      // Remove from edits
      setTextEdits((prev) => prev.filter((e) => e.id !== editId));
    },
    [textEdits]
  );

  // Get edited text for a specific item
  const getEditedText = useCallback(
    (pageNumber: number, textItemId: string): string | null => {
      const edit = textEdits.find(
        (e) => e.pageNumber === pageNumber && e.textItemId === textItemId
      );
      return edit ? edit.newText : null;
    },
    [textEdits]
  );

  // Search within a page
  const findInPage = useCallback(
    (pageNumber: number, query: string, options: SearchOptions = {}): PDFTextItem[] => {
      const content = textContent.get(pageNumber);
      if (!content || !query) return [];

      const { caseSensitive = false, wholeWord = false, regex = false } = options;

      return content.items.filter((item) => {
        let text = item.text;
        let searchQuery = query;

        if (!caseSensitive) {
          text = text.toLowerCase();
          searchQuery = searchQuery.toLowerCase();
        }

        if (regex) {
          try {
            const re = new RegExp(searchQuery, caseSensitive ? '' : 'i');
            return re.test(item.text);
          } catch {
            return false;
          }
        }

        if (wholeWord) {
          const re = new RegExp(`\\b${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, caseSensitive ? '' : 'i');
          return re.test(item.text);
        }

        return text.includes(searchQuery);
      });
    },
    [textContent]
  );

  // Search across all pages
  const findAll = useCallback(
    (query: string, options: SearchOptions = {}): Array<{ pageNumber: number; items: PDFTextItem[] }> => {
      const results: Array<{ pageNumber: number; items: PDFTextItem[] }> = [];

      textContent.forEach((_, pageNumber) => {
        const items = findInPage(pageNumber, query, options);
        if (items.length > 0) {
          results.push({ pageNumber, items });
        }
      });

      return results.sort((a, b) => a.pageNumber - b.pageNumber);
    },
    [textContent, findInPage]
  );

  // Listen for text selection events
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }

      const text = selection.toString().trim();
      if (!text) return;

      const range = selection.getRangeAt(0);
      const bounds = range.getBoundingClientRect();

      // Try to find which page the selection is on
      const container = range.commonAncestorContainer as HTMLElement;
      const pageElement = container.closest?.('[data-page-number]');

      if (pageElement) {
        const pageNumber = parseInt(
          pageElement.getAttribute('data-page-number') || '1',
          10
        );

        const textSelection: TextSelection = {
          pageNumber,
          startIndex: 0, // Would need more complex calculation
          endIndex: text.length,
          text,
          bounds,
        };

        setSelection(textSelection);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [setSelection]);

  return {
    // Text content
    textContent,
    isExtracting,

    // Extraction
    extractPageText,
    extractAllText,
    getPageText,
    getFullText,

    // Selection
    currentSelection,
    setSelection,
    clearSelection,

    // Text editing
    textEdits,
    editText,
    revertEdit,
    getEditedText,
    hasEdits: textEdits.length > 0,

    // Search
    findInPage,
    findAll,
  };
}

export default usePDFText;
