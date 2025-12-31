// ============================================
// LUMINA PDF SUITE PRO
// Full-featured PDF editor inspired by Acrobat Pro
// ============================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import CollaborationHeader from '../CollaborationHeader';

// Hooks
import { usePDFDocument } from './hooks/usePDFDocument';
import { usePDFPages } from './hooks/usePDFPages';
import { usePDFHistory } from './hooks/usePDFHistory';
import { usePDFText } from './hooks/usePDFText';
import { usePDFAnnotations } from './hooks/usePDFAnnotations';
import { useFindReplace } from './hooks/useFindReplace';
import { useRecentFiles } from './hooks/useRecentFiles';
import { usePageManagement } from './hooks/usePageManagement';

// Components
import PDFViewer, { PDFViewerHandle } from './components/PDFViewer';
import PDFToolbar from './components/PDFToolbar';
import PageThumbnails from './components/PageThumbnails';
import PDFSidebar from './components/PDFSidebar';
import FindReplacePanel from './components/FindReplacePanel';
import TextEditor from './components/TextEditor';
import CommentPanel from './components/CommentPanel';
import RedactionTool from './components/RedactionTool';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';
import RecentFilesPanel from './components/RecentFilesPanel';
import PageActionsToolbar from './components/PageActionsToolbar';
import PDFMergePanel from './components/PDFMergePanel';
import BookmarksPanel from './components/BookmarksPanel';
import WatermarkPanel from './components/WatermarkPanel';
import FormFieldCreator from './components/FormFieldCreator';
import QRCodeInsertPanel from './components/QRCodeInsertPanel';
import VersionHistory from './components/VersionHistory';
import PDFAValidator from './components/PDFAValidator';
import TemplateGallery from './components/TemplateGallery';
import type { FormFieldType } from './components/FormFieldCreator';
import type { WatermarkSettings } from './components/WatermarkPanel';
import type { BookmarkItem } from './components/BookmarksPanel';
import type { RecentFile } from './hooks/useRecentFiles';
import type { QRCodeInsertSettings } from './components/QRCodeInsertPanel';
import type { DocumentVersion, ValidationResult, PDFALevel } from './components/PDFAValidator';

// Types
import type {
  PDFTool,
  ToolSettings,
  PDFAnnotation,
  PDFFormField,
  GlyphSettings,
  ViewMode,
  RedactionMark,
  PrivacyScanResult,
} from './types';
import { DEFAULT_TOOL_SETTINGS, DEFAULT_GLYPH_SETTINGS } from './types';

// Services
import { scanForSensitiveData, reflowDocumentText } from '../../services/geminiService';
import { getBookmarks } from '../../services/pdfService';

interface PDFSuiteProps {
  className?: string;
}

const PDFSuite: React.FC<PDFSuiteProps> = ({ className = '' }) => {
  // Refs
  const viewerRef = useRef<PDFViewerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document hook
  const {
    document,
    pages,
    isLoading,
    loadingProgress,
    error,
    loadDocument,
    closeDocument,
    saveDocument,
    getPageTextContent,
    documentProxy,
  } = usePDFDocument({
    generateThumbnails: true,
    thumbnailSize: 150,
    onLoad: (doc) => {
      console.log('Document loaded:', doc.name);
    },
    onError: (err) => {
      console.error('Document error:', err);
    },
  });

  // Load bookmarks when document changes
  useEffect(() => {
    async function loadBookmarks() {
      if (documentProxy) {
        try {
          const pdfBookmarks = await getBookmarks(documentProxy);
          // Convert to BookmarkItem format
          const convertBookmark = (b: any): BookmarkItem => ({
            title: b.title,
            pageNumber: b.pageNumber,
            dest: b.dest,
            items: b.items?.map(convertBookmark),
          });
          setBookmarks(pdfBookmarks.map(convertBookmark));
        } catch (error) {
          console.error('Failed to load bookmarks:', error);
          setBookmarks([]);
        }
      } else {
        setBookmarks([]);
      }
    }
    loadBookmarks();
  }, [documentProxy]);

  // Pages hook
  const {
    viewState,
    currentPage,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    canZoomIn,
    canZoomOut,
    rotation,
    rotateClockwise,
    rotateCounterClockwise,
    viewMode,
    setViewMode,
    fitMode,
    setFitMode,
    showSidebar,
    toggleSidebar,
    sidebarTab,
    setSidebarTab,
    showGrid,
    toggleGrid,
  } = usePDFPages(pages.length, {
    initialPage: 1,
    initialZoom: 1,
    onPageChange: (page) => {
      viewerRef.current?.scrollToPage(page);
    },
  });

  // History hook
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    addAction,
    clearHistory,
  } = usePDFHistory({
    maxHistory: 50,
    onUndo: (action) => {
      console.log('Undid:', action.description);
    },
    onRedo: (action) => {
      console.log('Redid:', action.description);
    },
  });

  // Text extraction and editing hook
  const {
    textContent,
    isExtracting,
    extractAllText,
    getPageText,
    getFullText,
    currentSelection,
    setSelection: setTextSelection,
    editText,
    textEdits,
    hasEdits: hasTextEdits,
  } = usePDFText({
    onTextEdit: (edit) => {
      addAction({
        type: 'editText',
        description: `Edited text on page ${edit.pageNumber}`,
        data: edit,
        inverse: { ...edit, newText: edit.originalText },
      });
    },
  });

  // Annotations hook
  const {
    annotations,
    selectedIds: selectedAnnotationIds,
    hoveredId: hoveredAnnotationId,
    addAnnotation: addAnnotationToStore,
    updateAnnotation,
    deleteAnnotation: deleteAnnotationFromStore,
    selectAnnotation,
    deselectAll: deselectAllAnnotations,
    setHovered: setAnnotationHovered,
    getAnnotationsForPage,
    addReply,
    deleteReply,
    annotationCount,
  } = usePDFAnnotations({
    onAnnotationAdd: (annotation) => {
      addAction({
        type: 'addAnnotation',
        description: `Added ${annotation.type} annotation`,
        data: annotation,
        inverse: null,
      });
    },
    onAnnotationDelete: (id) => {
      const annotation = annotations.find((a) => a.id === id);
      if (annotation) {
        addAction({
          type: 'deleteAnnotation',
          description: `Deleted ${annotation.type} annotation`,
          data: null,
          inverse: annotation,
        });
      }
    },
  });

  // Find and replace hook
  const {
    searchQuery,
    setSearchQuery,
    replaceText,
    setReplaceText,
    options: searchOptions,
    setOptions: setSearchOptions,
    matches: searchMatches,
    currentMatchIndex,
    currentMatch,
    isSearching,
    nextMatch,
    previousMatch,
    goToMatch,
    replaceCurrentMatch,
    replaceAll,
    hasMatches,
  } = useFindReplace({
    textContent,
    onNavigate: (match) => {
      goToPage(match.pageNumber);
      viewerRef.current?.scrollToPage(match.pageNumber);
    },
    onReplace: (match, newText) => {
      editText(match.pageNumber, match.textItemId, newText);
    },
    onReplaceAll: (matches, newText) => {
      matches.forEach((match) => {
        editText(match.pageNumber, match.textItemId, newText);
      });
    },
  });

  // Recent files hook
  const {
    recentFiles,
    addRecentFile,
    removeRecentFile,
    clearRecentFiles,
    formatFileSize,
    formatDate,
  } = useRecentFiles();

  // Page management hook
  const {
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
    selectAll: selectAllPages,
    deselectAll: deselectAllPages,
    hasChanges: hasPageChanges,
  } = usePageManagement(pages, {
    onPagesChange: (newPages) => {
      console.log('Pages changed:', newPages.length);
    },
    onPageExtract: (pageNumbers) => {
      console.log('Extract pages:', pageNumbers);
      // TODO: Implement actual PDF extraction with pdf-lib
    },
  });

  // Sync pages from document to page management
  useEffect(() => {
    if (pages.length > 0) {
      setManagedPages(pages);
    }
  }, [pages, setManagedPages]);

  // Local state
  const [activeTool, setActiveTool] = useState<PDFTool>('select');
  const [toolSettings, setToolSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [glyphSettings, setGlyphSettings] = useState<GlyphSettings>(DEFAULT_GLYPH_SETTINGS);
  const [formFields, setFormFields] = useState<PDFFormField[]>([]);
  const [selectedFormFieldId, setSelectedFormFieldId] = useState<string>();
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showRedactionTool, setShowRedactionTool] = useState(false);
  const [showMergePanel, setShowMergePanel] = useState(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState<'thumbnails' | 'bookmarks'>('thumbnails');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showWatermarkPanel, setShowWatermarkPanel] = useState(false);
  const [showFormFieldCreator, setShowFormFieldCreator] = useState(false);
  const [selectedFormFieldType, setSelectedFormFieldType] = useState<FormFieldType | null>(null);
  const [redactionMarks, setRedactionMarks] = useState<RedactionMark[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<PrivacyScanResult[]>([]);
  const [showQRCodePanel, setShowQRCodePanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPDFAValidator, setShowPDFAValidator] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string>('initial');

  // File handling
  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const doc = await loadDocument(file);
        clearHistory();
        // Add to recent files
        if (doc) {
          addRecentFile({
            name: file.name,
            size: file.size,
            pageCount: doc.pageCount,
          });
        }
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [loadDocument, clearHistory, addRecentFile]
  );

  const handleSave = useCallback(async () => {
    if (document) {
      await saveDocument(document.name);
    }
  }, [document, saveDocument]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle merge complete - download the merged PDF
  const handleMergeComplete = useCallback((mergedPdf: Uint8Array, filename: string) => {
    const blob = new Blob([mergedPdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Handle watermark apply
  const handleWatermarkApply = useCallback((settings: WatermarkSettings) => {
    console.log('Applying watermark:', settings);
    // For now, create watermark as annotations on each page
    // In a full implementation, this would modify the PDF directly using pdf-lib
    const pagesToApply: number[] = [];
    const totalPageCount = managedPages.length || pages.length;

    if (settings.applyTo === 'all') {
      for (let i = 1; i <= totalPageCount; i++) {
        pagesToApply.push(i);
      }
    } else if (settings.applyTo === 'even') {
      for (let i = 2; i <= totalPageCount; i += 2) {
        pagesToApply.push(i);
      }
    } else if (settings.applyTo === 'odd') {
      for (let i = 1; i <= totalPageCount; i += 2) {
        pagesToApply.push(i);
      }
    } else if (settings.applyTo === 'range' && settings.pageRange) {
      // Parse page range like "1-5, 8, 10-12"
      const ranges = settings.pageRange.split(',').map(s => s.trim());
      ranges.forEach(range => {
        if (range.includes('-')) {
          const [start, end] = range.split('-').map(n => parseInt(n.trim()));
          for (let i = start; i <= Math.min(end, totalPageCount); i++) {
            pagesToApply.push(i);
          }
        } else {
          const page = parseInt(range);
          if (page >= 1 && page <= totalPageCount) {
            pagesToApply.push(page);
          }
        }
      });
    }

    // Add watermark as freeText annotations (visual approximation)
    pagesToApply.forEach(pageNumber => {
      if (settings.type === 'text') {
        addAnnotationToStore('freeText', pageNumber, {
          x: 100,
          y: 400,
          width: 400,
          height: 100,
        }, {
          contents: settings.text,
          color: settings.color,
          opacity: settings.opacity,
          fontSize: settings.fontSize,
          isLocked: true,
        });
      }
    });

    addAction({
      type: 'addWatermark',
      description: `Added watermark to ${pagesToApply.length} pages`,
      data: settings,
      inverse: null,
    });
  }, [managedPages, pages, addAnnotationToStore, addAction]);

  // Handle form field creation
  const handleCreateFormField = useCallback((fieldConfig: Partial<PDFFormField>) => {
    const newField: PDFFormField = {
      id: fieldConfig.id || `field-${Date.now()}`,
      name: fieldConfig.name || 'unnamed_field',
      type: fieldConfig.type || 'text',
      pageNumber: currentPage,
      rect: { x: 100, y: 100, width: 200, height: 30 },
      required: fieldConfig.required || false,
      placeholder: fieldConfig.placeholder,
      value: '',
      isLocked: false,
      isHidden: false,
      ...fieldConfig,
    };

    setFormFields((prev) => [...prev, newField]);
    setShowFormFieldCreator(false);
    setSelectedFormFieldType(null);

    addAction({
      type: 'addFormField',
      description: `Added ${fieldConfig.type} form field`,
      data: newField,
      inverse: null,
    });

    // Switch to form tool to allow placement
    setActiveTool('formField');
  }, [currentPage, addAction]);

  // Handle QR code insertion
  const handleQRCodeInsert = useCallback((qrCodeDataUrl: string, settings: QRCodeInsertSettings) => {
    // Insert QR code as an image annotation
    addAnnotationToStore('image' as any, settings.pageNumber, {
      x: 50,
      y: 50,
      width: settings.size,
      height: settings.size,
    }, {
      contents: `QR Code: ${settings.content}`,
      imageData: qrCodeDataUrl,
      isLocked: false,
    });

    addAction({
      type: 'addQRCode',
      description: `Added QR code on page ${settings.pageNumber}`,
      data: settings,
      inverse: null,
    });
  }, [addAnnotationToStore, addAction]);

  // Handle version history operations
  const handleCreateVersion = useCallback((name: string, description: string) => {
    const newVersion: DocumentVersion = {
      id: `version-${Date.now()}`,
      name,
      description,
      author: 'You',
      timestamp: Date.now(),
      changeType: 'edit',
      changeCount: textEdits.length + annotations.length,
      isCurrent: false,
      isAutoSave: false,
    };

    setDocumentVersions((prev) => [newVersion, ...prev.map((v) => ({ ...v, isCurrent: false }))]);
    setCurrentVersionId(newVersion.id);
  }, [textEdits.length, annotations.length]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    console.log('Restoring version:', versionId);
    // In a full implementation, this would restore the document state
    setCurrentVersionId(versionId);
    setDocumentVersions((prev) =>
      prev.map((v) => ({ ...v, isCurrent: v.id === versionId }))
    );
  }, []);

  const handleCompareVersions = useCallback((versionA: string, versionB: string) => {
    console.log('Comparing versions:', versionA, versionB);
    // In a full implementation, this would show a diff view
  }, []);

  const handleDeleteVersion = useCallback((versionId: string) => {
    setDocumentVersions((prev) => prev.filter((v) => v.id !== versionId));
  }, []);

  const handleDownloadVersion = useCallback((versionId: string) => {
    console.log('Downloading version:', versionId);
    // In a full implementation, this would download the version as PDF
  }, []);

  // Handle PDF/A validation
  const handlePDFAValidate = useCallback(async (targetLevel: PDFALevel): Promise<ValidationResult> => {
    // Simulated validation - in production, use a real PDF/A validation library
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      isCompliant: false,
      targetLevel,
      totalIssues: 3,
      errors: 1,
      warnings: 1,
      info: 1,
      issues: [
        {
          id: 'meta-001',
          category: 'metadata',
          severity: 'error',
          code: 'MISSING_XMP',
          message: 'Missing XMP metadata',
          description: 'XMP metadata stream is required for PDF/A compliance.',
          suggestion: 'Add XMP metadata with required properties.',
          autoFixable: true,
        },
        {
          id: 'font-001',
          category: 'fonts',
          severity: 'warning',
          code: 'FONT_NOT_EMBEDDED',
          message: 'Font not fully embedded',
          description: 'Some font subsets may not be complete.',
          location: 'Page 1',
          suggestion: 'Embed complete fonts.',
          autoFixable: true,
        },
        {
          id: 'struct-001',
          category: 'structure',
          severity: 'info',
          code: 'MISSING_TAGS',
          message: 'Document not tagged',
          description: 'For accessibility compliance, add structure tags.',
          suggestion: 'Enable tagging in export settings.',
          autoFixable: false,
        },
      ],
      timestamp: Date.now(),
      duration: 1500,
    };
  }, []);

  const handlePDFAAutoFix = useCallback(async (issueIds: string[]) => {
    console.log('Auto-fixing issues:', issueIds);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, []);

  const handleExportPDFAReport = useCallback((result: ValidationResult) => {
    const report = `PDF/A Compliance Report\n` +
      `=========================\n\n` +
      `Target Level: PDF/A-${result.targetLevel}\n` +
      `Status: ${result.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}\n\n` +
      `Summary:\n` +
      `- Errors: ${result.errors}\n` +
      `- Warnings: ${result.warnings}\n` +
      `- Info: ${result.info}\n\n` +
      `Issues:\n` +
      result.issues.map((i) => `[${i.severity.toUpperCase()}] ${i.message}\n  ${i.description}`).join('\n\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = 'pdfa-compliance-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: any) => {
    console.log('Selected template:', template.name);
    // Apply template fields to current document
    if (template.fields && Array.isArray(template.fields)) {
      const newFields = template.fields.map((field: any, index: number) => ({
        ...field,
        id: `field-${Date.now()}-${index}`,
        pageNumber: currentPage,
      }));
      setFormFields((prev) => [...prev, ...newFields]);
    }
    setShowTemplateGallery(false);
  }, [currentPage]);

  // Tool handling
  const handleToolChange = useCallback((tool: PDFTool) => {
    setActiveTool(tool);
  }, []);

  const handleToolSettingsChange = useCallback(
    (settings: Partial<ToolSettings>) => {
      setToolSettings((prev) => ({ ...prev, ...settings }));
    },
    []
  );

  // Annotation handling
  const handleAnnotationSelect = useCallback((id: string) => {
    selectAnnotation(id);
  }, [selectAnnotation]);

  const handleAnnotationDelete = useCallback(
    (id: string) => {
      deleteAnnotationFromStore(id);
    },
    [deleteAnnotationFromStore]
  );

  // Redaction handling
  const handleAddRedaction = useCallback(
    (mark: RedactionMark) => {
      setRedactionMarks((prev) => [...prev, mark]);
    },
    []
  );

  const handleRemoveRedaction = useCallback((markId: string) => {
    setRedactionMarks((prev) => prev.filter((m) => m.id !== markId));
  }, []);

  const handleApplyRedaction = useCallback(
    async (markId: string) => {
      const mark = redactionMarks.find((m) => m.id === markId);
      if (!mark) return;

      // Apply redaction (create black rectangle overlay)
      const redactionAnnotation: PDFAnnotation = {
        id: `redact-${Date.now()}`,
        type: 'rectangle',
        pageNumber: mark.pageNumber,
        rect: mark.rect,
        color: '#000000',
        opacity: 100,
        borderWidth: 0,
        borderStyle: 'solid',
        fillColor: '#000000',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        isLocked: true,
        isHidden: false,
        contents: '[REDACTED]',
      };

      addAnnotationToStore('rectangle', mark.pageNumber, mark.rect, {
        color: '#000000',
        fillColor: '#000000',
        opacity: 100,
        borderWidth: 0,
        isLocked: true,
        contents: '[REDACTED]',
      });

      // Remove from pending list
      setRedactionMarks((prev) =>
        prev.map((m) =>
          m.id === markId ? { ...m, isApplied: true } : m
        )
      );
    },
    [redactionMarks, addAnnotationToStore]
  );

  const handleApplyAllRedactions = useCallback(async () => {
    for (const mark of redactionMarks.filter((m) => !m.isApplied)) {
      await handleApplyRedaction(mark.id);
    }
  }, [redactionMarks, handleApplyRedaction]);

  // Comment panel handling
  const handleAddComment = useCallback(
    (annotationId: string, content: string) => {
      addReply(annotationId, content, 'You');
    },
    [addReply]
  );

  const handleDeleteComment = useCallback(
    (annotationId: string, replyId: string) => {
      deleteReply(annotationId, replyId);
    },
    [deleteReply]
  );

  // Form field handling
  const handleFormFieldSelect = useCallback((id: string) => {
    setSelectedFormFieldId(id);
  }, []);

  const handleFormFieldDelete = useCallback(
    (id: string) => {
      const field = formFields.find((f) => f.id === id);
      if (field) {
        setFormFields((prev) => prev.filter((f) => f.id !== id));
        addAction({
          type: 'deleteFormField',
          description: `Deleted ${field.type} form field`,
          data: null,
          inverse: field,
        });
      }
      if (selectedFormFieldId === id) {
        setSelectedFormFieldId(undefined);
      }
    },
    [formFields, selectedFormFieldId, addAction]
  );

  // Glyph settings
  const handleGlyphSettingsChange = useCallback(
    (settings: Partial<GlyphSettings>) => {
      setGlyphSettings((prev) => ({ ...prev, ...settings }));
    },
    []
  );

  // AI features
  const handleAIReflow = useCallback(async () => {
    if (!document || pages.length === 0) return;

    setIsAIProcessing(true);
    try {
      // Get text from current page
      const textContent = await getPageTextContent(currentPage);
      if (textContent) {
        const text = textContent.items.map((item) => item.text).join(' ');
        const reflowed = await reflowDocumentText(text);
        console.log('AI Reflow result:', reflowed);
        // TODO: Apply reflowed text to document
      }
    } catch (error) {
      console.error('AI Reflow error:', error);
    } finally {
      setIsAIProcessing(false);
    }
  }, [document, pages, currentPage, getPageTextContent]);

  const handleAIScan = useCallback(async () => {
    if (!document || pages.length === 0) return;

    setIsAIProcessing(true);
    try {
      // Get text from all pages
      let allText = '';
      for (const page of pages) {
        const textContent = await getPageTextContent(page.pageNumber);
        if (textContent) {
          allText += textContent.items.map((item) => item.text).join(' ') + ' ';
        }
      }

      const sensitiveTerms = await scanForSensitiveData(allText);
      console.log('Privacy scan found:', sensitiveTerms);
      // TODO: Create redaction suggestions from sensitive terms
    } catch (error) {
      console.error('Privacy scan error:', error);
    } finally {
      setIsAIProcessing(false);
    }
  }, [document, pages, getPageTextContent]);

  // Page click handling
  const handlePageClick = useCallback(
    (pageNumber: number, x: number, y: number) => {
      console.log(`Page ${pageNumber} clicked at (${x}, ${y})`);

      // Handle based on active tool
      switch (activeTool) {
        case 'note':
          // Create a note annotation
          addAnnotationToStore('note', pageNumber, { x, y, width: 24, height: 24 }, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth,
          });
          break;

        case 'stamp':
          // Create a stamp annotation
          addAnnotationToStore('stamp', pageNumber, { x: x - 50, y: y - 15, width: 100, height: 30 }, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            stampType: toolSettings.stampType,
            borderWidth: 0,
          });
          break;

        case 'redact':
          // Create a redaction mark
          const redactionMark: RedactionMark = {
            id: `redact-${Date.now()}`,
            pageNumber,
            rect: { x, y, width: 100, height: 20 },
            reason: 'Manual selection',
            isApplied: false,
            createdAt: Date.now(),
          };
          handleAddRedaction(redactionMark);
          break;

        case 'freeText':
          // Create a text box annotation
          addAnnotationToStore('freeText', pageNumber, { x, y, width: 150, height: 40 }, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            contents: 'Double-click to edit',
            fontSize: toolSettings.fontSize || 12,
            borderWidth: 1,
          });
          break;

        case 'rectangle':
          // Create a rectangle annotation
          addAnnotationToStore('rectangle', pageNumber, { x, y, width: 100, height: 60 }, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth || 2,
            fillColor: 'transparent',
          });
          break;

        case 'ellipse':
          // Create an ellipse annotation
          addAnnotationToStore('ellipse', pageNumber, { x, y, width: 80, height: 60 }, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth || 2,
            fillColor: 'transparent',
          });
          break;

        case 'line':
          // Create a line annotation
          addAnnotationToStore('line', pageNumber, { x, y, width: 100, height: 2 }, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth || 2,
          });
          break;

        case 'arrow':
          // Create an arrow annotation
          addAnnotationToStore('arrow', pageNumber, { x, y, width: 100, height: 2 }, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth || 2,
          });
          break;

        case 'highlight':
          // Create a highlight annotation at click position
          addAnnotationToStore('highlight', pageNumber, { x, y, width: 100, height: 20 }, {
            color: toolSettings.color,
            opacity: 50,
            borderWidth: 0,
          });
          break;

        default:
          break;
      }
    },
    [activeTool, toolSettings, addAnnotationToStore, handleAddRedaction]
  );

  // Text selection handling
  const handleTextSelect = useCallback(
    (text: string, pageNumber: number, bounds: DOMRect) => {
      console.log(`Selected text on page ${pageNumber}:`, text);

      if (activeTool === 'highlight') {
        addAnnotationToStore('highlight', pageNumber, {
          x: bounds.x / zoom,
          y: bounds.y / zoom,
          width: bounds.width / zoom,
          height: bounds.height / zoom,
        }, {
          color: toolSettings.color,
          opacity: 50,
          contents: text,
          borderWidth: 0,
        });
      } else if (activeTool === 'underline') {
        addAnnotationToStore('underline', pageNumber, {
          x: bounds.x / zoom,
          y: bounds.y / zoom,
          width: bounds.width / zoom,
          height: bounds.height / zoom,
        }, {
          color: toolSettings.color,
          contents: text,
        });
      } else if (activeTool === 'strikethrough') {
        addAnnotationToStore('strikethrough', pageNumber, {
          x: bounds.x / zoom,
          y: bounds.y / zoom,
          width: bounds.width / zoom,
          height: bounds.height / zoom,
        }, {
          color: toolSettings.color,
          contents: text,
        });
      } else if (activeTool === 'redact') {
        // Create redaction mark from selection
        const redactionMark: RedactionMark = {
          id: `redact-${Date.now()}`,
          pageNumber,
          rect: {
            x: bounds.x / zoom,
            y: bounds.y / zoom,
            width: bounds.width / zoom,
            height: bounds.height / zoom,
          },
          originalText: text,
          reason: 'Text selection',
          isApplied: false,
          createdAt: Date.now(),
        };
        handleAddRedaction(redactionMark);
      }
    },
    [activeTool, toolSettings, zoom, addAnnotationToStore, handleAddRedaction]
  );

  // Shape completion handling (drag-to-draw)
  const handleShapeComplete = useCallback(
    (pageNumber: number, tool: PDFTool, rect: { x: number; y: number; width: number; height: number }) => {
      console.log(`Shape completed on page ${pageNumber}:`, tool, rect);

      switch (tool) {
        case 'rectangle':
          addAnnotationToStore('rectangle', pageNumber, rect, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth || 2,
            fillColor: 'transparent',
          });
          break;

        case 'ellipse':
          addAnnotationToStore('ellipse', pageNumber, rect, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth || 2,
            fillColor: 'transparent',
          });
          break;

        case 'line':
          addAnnotationToStore('line', pageNumber, rect, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth || 2,
          });
          break;

        case 'arrow':
          addAnnotationToStore('arrow', pageNumber, rect, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            borderWidth: toolSettings.borderWidth || 2,
          });
          break;

        case 'highlight':
          addAnnotationToStore('highlight', pageNumber, rect, {
            color: toolSettings.color,
            opacity: 50,
            borderWidth: 0,
          });
          break;

        case 'freeText':
          addAnnotationToStore('freeText', pageNumber, rect, {
            color: toolSettings.color,
            opacity: toolSettings.opacity,
            contents: 'Double-click to edit',
            fontSize: toolSettings.fontSize || 12,
            borderWidth: 1,
          });
          break;

        default:
          break;
      }
    },
    [toolSettings, addAnnotationToStore]
  );

  // Annotation click handling
  const handleAnnotationClick = useCallback((annotation: PDFAnnotation) => {
    selectAnnotation(annotation.id);
  }, [selectAnnotation]);

  // Text edit handling
  const handleTextEdit = useCallback(
    (textItemId: string, newText: string) => {
      editText(currentPage, textItemId, newText);
    },
    [currentPage, editText]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key) {
          case '?':
            setShowKeyboardShortcuts(true);
            break;
        }
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            break;
          case 'h':
            setActiveTool('hand');
            break;
          case 't':
            setActiveTool('textSelect');
            break;
          case 'n':
            setActiveTool('note');
            break;
          case 'delete':
          case 'backspace':
            if (selectedAnnotationIds.length > 0) {
              selectedAnnotationIds.forEach((id) => handleAnnotationDelete(id));
            }
            break;
          case 'escape':
            setShowSearch(false);
            setShowComments(false);
            setShowRedactionTool(false);
            setShowKeyboardShortcuts(false);
            deselectAllAnnotations();
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'o':
            e.preventDefault();
            handleOpenFile();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            break;
          case 'g':
            e.preventDefault();
            toggleGrid();
            break;
          case 'h':
            if (e.shiftKey) {
              e.preventDefault();
              setShowRedactionTool(!showRedactionTool);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedAnnotationIds,
    handleAnnotationDelete,
    handleOpenFile,
    handleSave,
    toggleGrid,
    showRedactionTool,
    deselectAllAnnotations,
  ]);

  // Recent file handling
  const handleRecentFileSelect = useCallback((_file: RecentFile) => {
    // Since we can't store actual file data in localStorage,
    // we prompt the user to re-open the file
    handleOpenFile();
  }, [handleOpenFile]);

  // Drop zone handling
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        const doc = await loadDocument(file);
        clearHistory();
        // Add to recent files
        if (doc) {
          addRecentFile({
            name: file.name,
            size: file.size,
            pageCount: doc.pageCount,
          });
        }
      }
    },
    [loadDocument, clearHistory, addRecentFile]
  );

  return (
    <div
      className={`h-full flex flex-col bg-slate-100 font-sans overflow-hidden ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <CollaborationHeader title={document?.name || 'Lumina PDF Suite Pro'} />

      {/* Toolbar */}
      <PDFToolbar
        documentName={document?.name}
        isDocumentLoaded={!!document}
        isModified={document?.isModified || false}
        currentPage={currentPage}
        totalPages={pages.length}
        onPageChange={goToPage}
        onNextPage={nextPage}
        onPreviousPage={previousPage}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        zoom={zoom}
        onZoomChange={setZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onRotateClockwise={rotateClockwise}
        onRotateCounterClockwise={rotateCounterClockwise}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fitMode={fitMode}
        onFitModeChange={setFitMode}
        activeTool={activeTool}
        onToolChange={handleToolChange}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onOpenFile={handleOpenFile}
        onSave={handleSave}
        onPrint={handlePrint}
        onSearch={() => setShowSearch(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Page Thumbnails & Bookmarks */}
        {showThumbnails && document && (
          <div className="w-48 flex-shrink-0 border-r border-slate-200 flex flex-col">
            {/* Tab buttons */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setLeftSidebarTab('thumbnails')}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  leftSidebarTab === 'thumbnails'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-images mr-1"></i>
                Pages
              </button>
              <button
                onClick={() => setLeftSidebarTab('bookmarks')}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  leftSidebarTab === 'bookmarks'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-bookmark mr-1"></i>
                Bookmarks
                {bookmarks.length > 0 && (
                  <span className="ml-1 text-[10px] bg-slate-200 px-1 rounded">{bookmarks.length}</span>
                )}
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {leftSidebarTab === 'thumbnails' ? (
                <PageThumbnails
                  pages={managedPages.length > 0 ? managedPages : pages}
                  currentPage={currentPage}
                  onPageSelect={goToPage}
                  onPageReorder={reorderPage}
                  onPageDelete={deletePage}
                  onPageRotate={rotatePage}
                  selectedPages={selectedPages}
                  onSelectionChange={setSelectedPages}
                  isLoading={isLoading}
                />
              ) : (
                <BookmarksPanel
                  bookmarks={bookmarks}
                  currentPage={currentPage}
                  onNavigate={(page) => {
                    goToPage(page);
                    viewerRef.current?.scrollToPage(page);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Main Viewer */}
        <div className="flex-1 relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-50">
              <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Loading... {loadingProgress}%
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-exclamation-triangle text-5xl text-rose-400 mb-4"></i>
                <p className="text-slate-600 font-medium mb-2">
                  Failed to load document
                </p>
                <p className="text-sm text-slate-400 mb-4">{error}</p>
                <button
                  onClick={handleOpenFile}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!document && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-8 items-start max-w-4xl mx-auto px-8">
                {/* Main CTA */}
                <div className="text-center flex-1">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                    <i className="fas fa-file-pdf text-5xl text-white"></i>
                  </div>
                  <h2 className="type-page text-slate-800 mb-2">
                    PDF Suite
                  </h2>
                  <p className="type-body text-slate-500 mb-6">
                    Open a PDF to start editing, annotating, and creating forms.
                    Drag and drop a file here or click the button below.
                  </p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={handleOpenFile}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl type-label hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                    >
                      <i className="fas fa-folder-open"></i>
                      Open PDF
                    </button>
                    <button
                      onClick={() => setShowMergePanel(true)}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl type-label hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                    >
                      <i className="fas fa-object-group"></i>
                      Merge PDFs
                    </button>
                  </div>
                  <p className="type-caption text-slate-400 mt-4">
                    Supports PDF files up to 100MB
                  </p>
                </div>

                {/* Recent Files Panel */}
                {recentFiles.length > 0 && (
                  <div className="w-80 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <RecentFilesPanel
                      recentFiles={recentFiles}
                      onFileSelect={handleRecentFileSelect}
                      onFileRemove={removeRecentFile}
                      onClearAll={clearRecentFiles}
                      formatFileSize={formatFileSize}
                      formatDate={formatDate}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {document && !error && (
            <>
              <PDFViewer
                ref={viewerRef}
                pages={pages}
                currentPage={currentPage}
                zoom={zoom}
                rotation={rotation}
                viewMode={viewMode}
                fitMode={fitMode}
                activeTool={activeTool}
                toolColor={toolSettings.color}
                toolOpacity={toolSettings.opacity}
                toolBorderWidth={toolSettings.borderWidth}
                annotations={annotations}
                formFields={formFields}
                showGrid={showGrid}
                onPageClick={handlePageClick}
                onShapeComplete={handleShapeComplete}
                onTextSelect={handleTextSelect}
                onAnnotationClick={handleAnnotationClick}
                onZoomChange={setZoom}
                className="h-full"
              />

              {/* Text Editor Overlay - Active when text editing tool selected */}
              {activeTool === 'textEdit' && (
                <TextEditor
                  pageNumber={currentPage}
                  textContent={getPageText(currentPage) || null}
                  zoom={zoom}
                  isActive={true}
                  onTextEdit={handleTextEdit}
                  onTextSelect={(text, bounds) => {
                    setTextSelection({
                      pageNumber: currentPage,
                      text,
                      bounds,
                      startIndex: 0,
                      endIndex: text.length,
                    });
                  }}
                  className="z-20"
                />
              )}
            </>
          )}

          {/* Find & Replace Panel */}
          {showSearch && document && (
            <FindReplacePanel
              isOpen={showSearch}
              onClose={() => setShowSearch(false)}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              replaceText={replaceText}
              onReplaceTextChange={setReplaceText}
              caseSensitive={searchOptions.caseSensitive}
              wholeWord={searchOptions.wholeWord}
              useRegex={searchOptions.regex}
              onCaseSensitiveChange={(v) => setSearchOptions({ caseSensitive: v })}
              onWholeWordChange={(v) => setSearchOptions({ wholeWord: v })}
              onRegexChange={(v) => setSearchOptions({ regex: v })}
              matches={searchMatches}
              currentMatchIndex={currentMatchIndex}
              isSearching={isSearching}
              onNextMatch={nextMatch}
              onPreviousMatch={previousMatch}
              onReplaceMatch={replaceCurrentMatch}
              onReplaceAll={replaceAll}
              onGoToMatch={goToMatch}
            />
          )}

          {/* Comment Panel */}
          {showComments && document && (
            <CommentPanel
              isOpen={showComments}
              onClose={() => setShowComments(false)}
              annotations={annotations.filter((a) => a.type === 'note' || a.replies?.length)}
              onAnnotationSelect={handleAnnotationSelect}
              onAnnotationDelete={handleAnnotationDelete}
              onAddReply={handleAddComment}
              onDeleteReply={handleDeleteComment}
              onGoToAnnotation={(annotation) => {
                goToPage(annotation.pageNumber);
                viewerRef.current?.scrollToPage(annotation.pageNumber);
                selectAnnotation(annotation.id);
              }}
              currentPage={currentPage}
            />
          )}

          {/* Redaction Tool Panel */}
          {showRedactionTool && document && (
            <RedactionTool
              isOpen={showRedactionTool}
              onClose={() => setShowRedactionTool(false)}
              redactionMarks={redactionMarks}
              aiSuggestions={aiSuggestions}
              onAddRedaction={handleAddRedaction}
              onRemoveRedaction={handleRemoveRedaction}
              onApplyRedaction={handleApplyRedaction}
              onApplyAll={handleApplyAllRedactions}
              onScanForSensitiveData={async () => {
                setIsAIProcessing(true);
                try {
                  const fullText = getFullText();
                  const results = await scanForSensitiveData(fullText);
                  // Convert results to PrivacyScanResult format
                  const suggestions: PrivacyScanResult[] = results.map((term, i) => ({
                    id: `suggestion-${i}`,
                    type: 'name' as const,
                    text: term,
                    pageNumber: 1,
                    confidence: 0.9,
                    rect: { x: 0, y: 0, width: 100, height: 20 },
                  }));
                  setAISuggestions(suggestions);
                } catch (error) {
                  console.error('AI scan error:', error);
                } finally {
                  setIsAIProcessing(false);
                }
              }}
              isScanning={isAIProcessing}
              currentPage={currentPage}
            />
          )}
        </div>

        {/* Right Sidebar */}
        {showRightSidebar && document && (
          <PDFSidebar
            activeTool={activeTool}
            toolSettings={toolSettings}
            onToolSettingsChange={handleToolSettingsChange}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationIds[0]}
            onAnnotationSelect={handleAnnotationSelect}
            onAnnotationDelete={handleAnnotationDelete}
            formFields={formFields}
            selectedFormFieldId={selectedFormFieldId}
            onFormFieldSelect={handleFormFieldSelect}
            onFormFieldDelete={handleFormFieldDelete}
            glyphSettings={glyphSettings}
            onGlyphSettingsChange={handleGlyphSettingsChange}
            pageCount={pages.length}
            currentPage={currentPage}
            onAIReflow={handleAIReflow}
            onAIScan={handleAIScan}
            isAIProcessing={isAIProcessing}
          />
        )}
      </div>

      {/* Toggle buttons for sidebars */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={() => setShowThumbnails(!showThumbnails)}
          className={`w-6 h-12 rounded-r-lg flex items-center justify-center transition-all ${
            showThumbnails
              ? 'bg-slate-200 text-slate-500'
              : 'bg-indigo-600 text-white'
          }`}
          title={showThumbnails ? 'Hide Thumbnails' : 'Show Thumbnails'}
        >
          <i
            className={`fas fa-chevron-${showThumbnails ? 'left' : 'right'} text-xs`}
          ></i>
        </button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className={`w-6 h-12 rounded-l-lg flex items-center justify-center transition-all ${
            showRightSidebar
              ? 'bg-slate-200 text-slate-500'
              : 'bg-indigo-600 text-white'
          }`}
          title={showRightSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          <i
            className={`fas fa-chevron-${showRightSidebar ? 'right' : 'left'} text-xs`}
          ></i>
        </button>
      </div>

      {/* Status Bar */}
      {document && (
        <div className="h-8 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Page {currentPage} of {pages.length}
            </span>
            <span>|</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            {rotation !== 0 && (
              <>
                <span>|</span>
                <span>Rotation: {rotation}°</span>
              </>
            )}
            {hasMatches && (
              <>
                <span>|</span>
                <span className="text-indigo-600">
                  {currentMatchIndex + 1}/{searchMatches.length} matches
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Quick action buttons */}
            <button
              onClick={() => setShowSearch(true)}
              className="hover:text-indigo-600 transition-colors"
              title="Find & Replace (Ctrl+F)"
            >
              <i className="fas fa-search"></i>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className={`transition-colors ${showComments ? 'text-indigo-600' : 'hover:text-indigo-600'}`}
              title="Comments"
            >
              <i className="fas fa-comments"></i>
            </button>
            <button
              onClick={() => setShowRedactionTool(!showRedactionTool)}
              className={`transition-colors ${showRedactionTool ? 'text-rose-600' : 'hover:text-rose-600'}`}
              title="Redaction Tool (Ctrl+Shift+H)"
            >
              <i className="fas fa-eraser"></i>
            </button>
            <button
              onClick={() => setShowWatermarkPanel(true)}
              className="hover:text-blue-600 transition-colors"
              title="Add Watermark"
            >
              <i className="fas fa-stamp"></i>
            </button>
            <button
              onClick={() => setShowFormFieldCreator(true)}
              className="hover:text-violet-600 transition-colors"
              title="Create Form Field"
            >
              <i className="fas fa-wpforms"></i>
            </button>
            <button
              onClick={() => setShowQRCodePanel(true)}
              className="hover:text-violet-600 transition-colors"
              title="Insert QR Code"
            >
              <i className="fas fa-qrcode"></i>
            </button>
            <button
              onClick={() => setShowVersionHistory(true)}
              className="hover:text-amber-600 transition-colors"
              title="Version History"
            >
              <i className="fas fa-history"></i>
            </button>
            <button
              onClick={() => setShowPDFAValidator(true)}
              className="hover:text-emerald-600 transition-colors"
              title="PDF/A Compliance"
            >
              <i className="fas fa-check-circle"></i>
            </button>
            <button
              onClick={() => setShowTemplateGallery(true)}
              className="hover:text-indigo-600 transition-colors"
              title="Template Gallery"
            >
              <i className="fas fa-layer-group"></i>
            </button>
            <span>|</span>
            <span>
              {annotationCount} annotation{annotationCount !== 1 ? 's' : ''}
            </span>
            {hasTextEdits && (
              <>
                <span>|</span>
                <span className="text-blue-600">
                  {textEdits.length} text edit{textEdits.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
            {redactionMarks.filter((m) => !m.isApplied).length > 0 && (
              <>
                <span>|</span>
                <span className="text-rose-600">
                  {redactionMarks.filter((m) => !m.isApplied).length} pending redaction{redactionMarks.filter((m) => !m.isApplied).length !== 1 ? 's' : ''}
                </span>
              </>
            )}
            <span>|</span>
            <span>
              {formFields.length} form field{formFields.length !== 1 ? 's' : ''}
            </span>
            {(document.isModified || hasTextEdits) && (
              <>
                <span>|</span>
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <i className="fas fa-circle text-[6px]"></i>
                  Unsaved changes
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Page Actions Toolbar - appears when pages are selected */}
      {document && selectedPages.length > 0 && (
        <PageActionsToolbar
          selectedCount={selectedPages.length}
          totalPages={managedPages.length || pages.length}
          onRotateLeft={() => rotatePages(selectedPages, 'ccw')}
          onRotateRight={() => rotatePages(selectedPages, 'cw')}
          onDelete={() => deletePages(selectedPages)}
          onExtract={() => extractPages(selectedPages)}
          onDuplicate={() => selectedPages.length === 1 && duplicatePage(selectedPages[0])}
          onMoveToStart={() => movePagesToStart(selectedPages)}
          onMoveToEnd={() => movePagesToEnd(selectedPages)}
          onSelectAll={selectAllPages}
          onDeselectAll={deselectAllPages}
        />
      )}

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* PDF Merge Panel */}
      <PDFMergePanel
        isOpen={showMergePanel}
        onClose={() => setShowMergePanel(false)}
        onMergeComplete={handleMergeComplete}
      />

      {/* Watermark Panel */}
      <WatermarkPanel
        isOpen={showWatermarkPanel}
        onClose={() => setShowWatermarkPanel(false)}
        onApply={handleWatermarkApply}
        totalPages={managedPages.length || pages.length}
      />

      {/* Form Field Creator */}
      <FormFieldCreator
        isOpen={showFormFieldCreator}
        onClose={() => {
          setShowFormFieldCreator(false);
          setSelectedFormFieldType(null);
        }}
        onCreateField={handleCreateFormField}
        selectedFieldType={selectedFormFieldType}
        onFieldTypeChange={setSelectedFormFieldType}
      />

      {/* QR Code Insert Panel */}
      <QRCodeInsertPanel
        isOpen={showQRCodePanel}
        onClose={() => setShowQRCodePanel(false)}
        onInsert={handleQRCodeInsert}
        currentPage={currentPage}
        totalPages={pages.length}
      />

      {/* Version History */}
      <VersionHistory
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        versions={documentVersions}
        currentVersionId={currentVersionId}
        onRestoreVersion={handleRestoreVersion}
        onCompareVersions={handleCompareVersions}
        onCreateVersion={handleCreateVersion}
        onDeleteVersion={handleDeleteVersion}
        onDownloadVersion={handleDownloadVersion}
      />

      {/* PDF/A Validator */}
      <PDFAValidator
        isOpen={showPDFAValidator}
        onClose={() => setShowPDFAValidator(false)}
        onValidate={handlePDFAValidate}
        onAutoFix={handlePDFAAutoFix}
        onExportReport={handleExportPDFAReport}
      />

      {/* Template Gallery */}
      <TemplateGallery
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

export default PDFSuite;
