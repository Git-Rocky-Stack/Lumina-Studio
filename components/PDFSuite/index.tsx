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

// Components
import PDFViewer, { PDFViewerHandle } from './components/PDFViewer';
import PDFToolbar from './components/PDFToolbar';
import PageThumbnails from './components/PageThumbnails';
import PDFSidebar from './components/PDFSidebar';
import FindReplacePanel from './components/FindReplacePanel';
import TextEditor from './components/TextEditor';
import CommentPanel from './components/CommentPanel';
import RedactionTool from './components/RedactionTool';

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

  // Local state
  const [activeTool, setActiveTool] = useState<PDFTool>('select');
  const [toolSettings, setToolSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS);
  const [glyphSettings, setGlyphSettings] = useState<GlyphSettings>(DEFAULT_GLYPH_SETTINGS);
  const [formFields, setFormFields] = useState<PDFFormField[]>([]);
  const [selectedFormFieldId, setSelectedFormFieldId] = useState<string>();
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showRedactionTool, setShowRedactionTool] = useState(false);
  const [redactionMarks, setRedactionMarks] = useState<RedactionMark[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<PrivacyScanResult[]>([]);

  // File handling
  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await loadDocument(file);
        clearHistory();
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [loadDocument, clearHistory]
  );

  const handleSave = useCallback(async () => {
    if (document) {
      await saveDocument(document.name);
    }
  }, [document, saveDocument]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

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
        await loadDocument(file);
        clearHistory();
      }
    },
    [loadDocument, clearHistory]
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
        {/* Left Sidebar - Page Thumbnails */}
        {showThumbnails && document && (
          <div className="w-48 flex-shrink-0 border-r border-slate-200">
            <PageThumbnails
              pages={pages}
              currentPage={currentPage}
              onPageSelect={goToPage}
              isLoading={isLoading}
            />
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
              <div className="text-center max-w-md">
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
                <button
                  onClick={handleOpenFile}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl type-label hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 mx-auto"
                >
                  <i className="fas fa-folder-open"></i>
                  Open PDF
                </button>
                <p className="type-caption text-slate-400 mt-4">
                  Supports PDF files up to 100MB
                </p>
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
                annotations={annotations}
                formFields={formFields}
                showGrid={showGrid}
                onPageClick={handlePageClick}
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
    </div>
  );
};

export default PDFSuite;
