// ============================================
// usePDFDocument Hook
// Manages PDF document loading, state, and operations
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  loadPDF,
  getPageData,
  getPageThumbnail,
  extractTextContent,
  downloadPDF,
} from '../../../services/pdfService';
import type {
  PDFDocument,
  PDFPage,
  PDFMetadata,
  PDFTextContent,
} from '../types';

interface UsePDFDocumentOptions {
  onLoad?: (document: PDFDocument) => void;
  onError?: (error: Error) => void;
  generateThumbnails?: boolean;
  thumbnailSize?: number;
}

interface UsePDFDocumentReturn {
  // State
  document: PDFDocument | null;
  pages: PDFPage[];
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;

  // Document operations
  loadDocument: (source: File | string | ArrayBuffer) => Promise<PDFDocument | null>;
  closeDocument: () => void;
  saveDocument: (filename?: string) => Promise<void>;

  // Page operations
  getPage: (pageNumber: number) => PDFPage | undefined;
  getPageTextContent: (pageNumber: number) => Promise<PDFTextContent | null>;
  refreshThumbnail: (pageNumber: number) => Promise<void>;

  // Metadata
  updateMetadata: (metadata: Partial<PDFMetadata>) => void;

  // Raw access
  documentProxy: PDFDocumentProxy | null;
}

export function usePDFDocument(
  options: UsePDFDocumentOptions = {}
): UsePDFDocumentReturn {
  const {
    onLoad,
    onError,
    generateThumbnails = true,
    thumbnailSize = 150,
  } = options;

  // State
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const proxyRef = useRef<PDFDocumentProxy | null>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (proxyRef.current) {
        proxyRef.current.destroy();
      }
    };
  }, []);

  // Load document
  const loadDocument = useCallback(
    async (source: File | string | ArrayBuffer): Promise<PDFDocument | null> => {
      // Cancel any previous loading
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Cleanup previous document
      if (proxyRef.current) {
        proxyRef.current.destroy();
        proxyRef.current = null;
      }

      setIsLoading(true);
      setLoadingProgress(0);
      setError(null);
      setPages([]);
      setDocument(null);

      try {
        // Store raw bytes for later modifications
        if (source instanceof File) {
          pdfBytesRef.current = await source.arrayBuffer();
        } else if (source instanceof ArrayBuffer) {
          pdfBytesRef.current = source;
        } else {
          // URL - fetch the bytes
          const response = await fetch(source);
          pdfBytesRef.current = await response.arrayBuffer();
        }

        // Load with pdf.js
        const { proxy, metadata, pageCount } = await loadPDF(pdfBytesRef.current);
        proxyRef.current = proxy;

        // Create document object
        const doc: PDFDocument = {
          id: `doc-${Date.now()}`,
          name: source instanceof File ? source.name : 'Document.pdf',
          source,
          proxy,
          pageCount,
          metadata,
          isModified: false,
          isEncrypted: false,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
        };

        setDocument(doc);
        setLoadingProgress(10);

        // Load page data
        const loadedPages: PDFPage[] = [];
        for (let i = 1; i <= pageCount; i++) {
          const pageData = await getPageData(proxy, i);

          // Generate thumbnail if enabled
          if (generateThumbnails && pageData.proxy) {
            try {
              pageData.thumbnail = await getPageThumbnail(pageData.proxy, thumbnailSize);
            } catch (thumbError) {
              console.warn(`Failed to generate thumbnail for page ${i}:`, thumbError);
            }
          }

          loadedPages.push(pageData);
          setLoadingProgress(10 + Math.floor((i / pageCount) * 90));

          // Check for abort
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Loading cancelled');
          }
        }

        setPages(loadedPages);
        setLoadingProgress(100);

        // Callback
        if (onLoad) {
          onLoad(doc);
        }

        return doc;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
        if (errorMessage !== 'Loading cancelled') {
          setError(errorMessage);
          if (onError) {
            onError(err instanceof Error ? err : new Error(errorMessage));
          }
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [generateThumbnails, thumbnailSize, onLoad, onError]
  );

  // Close document
  const closeDocument = useCallback(() => {
    if (proxyRef.current) {
      proxyRef.current.destroy();
      proxyRef.current = null;
    }
    pdfBytesRef.current = null;
    setDocument(null);
    setPages([]);
    setError(null);
    setLoadingProgress(0);
  }, []);

  // Save document
  const saveDocument = useCallback(
    async (filename?: string) => {
      if (!pdfBytesRef.current) {
        throw new Error('No document loaded');
      }

      const name = filename || document?.name || 'document.pdf';
      const bytes = new Uint8Array(pdfBytesRef.current);
      downloadPDF(bytes, name);
    },
    [document]
  );

  // Get specific page
  const getPage = useCallback(
    (pageNumber: number): PDFPage | undefined => {
      return pages.find((p) => p.pageNumber === pageNumber);
    },
    [pages]
  );

  // Get page text content
  const getPageTextContent = useCallback(
    async (pageNumber: number): Promise<PDFTextContent | null> => {
      const page = pages.find((p) => p.pageNumber === pageNumber);
      if (!page?.proxy) return null;

      try {
        return await extractTextContent(page.proxy);
      } catch (err) {
        console.error(`Failed to extract text from page ${pageNumber}:`, err);
        return null;
      }
    },
    [pages]
  );

  // Refresh thumbnail for a specific page
  const refreshThumbnail = useCallback(
    async (pageNumber: number) => {
      const pageIndex = pages.findIndex((p) => p.pageNumber === pageNumber);
      if (pageIndex === -1) return;

      const page = pages[pageIndex];
      if (!page || !page.proxy) return;

      try {
        const thumbnail = await getPageThumbnail(page.proxy, thumbnailSize);
        setPages((prev) =>
          prev.map((p) =>
            p.pageNumber === pageNumber ? { ...p, thumbnail } : p
          )
        );
      } catch (err) {
        console.error(`Failed to refresh thumbnail for page ${pageNumber}:`, err);
      }
    },
    [pages, thumbnailSize]
  );

  // Update metadata
  const updateMetadata = useCallback(
    (metadata: Partial<PDFMetadata>) => {
      if (!document) return;

      setDocument((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          metadata: { ...prev.metadata, ...metadata },
          isModified: true,
          modifiedAt: Date.now(),
        };
      });
    },
    [document]
  );

  return {
    // State
    document,
    pages,
    isLoading,
    loadingProgress,
    error,

    // Document operations
    loadDocument,
    closeDocument,
    saveDocument,

    // Page operations
    getPage,
    getPageTextContent,
    refreshThumbnail,

    // Metadata
    updateMetadata,

    // Raw access
    documentProxy: proxyRef.current,
  };
}

export default usePDFDocument;
