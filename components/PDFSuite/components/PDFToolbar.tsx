// ============================================
// PDFToolbar Component
// Main toolbar with tools, navigation, and actions
// ============================================

import React, { useCallback, useState } from 'react';
import type { PDFTool, ViewMode, FitMode } from '../types';

interface PDFToolbarProps {
  // Document state
  documentName?: string;
  isDocumentLoaded: boolean;
  isModified: boolean;

  // Navigation
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Zoom
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;

  // Rotation
  onRotateClockwise: () => void;
  onRotateCounterClockwise: () => void;

  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  fitMode: FitMode;
  onFitModeChange: (mode: FitMode) => void;

  // Tools
  activeTool: PDFTool;
  onToolChange: (tool: PDFTool) => void;

  // History
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  // Actions
  onOpenFile: () => void;
  onSave: () => void;
  onPrint: () => void;
  onSearch: () => void;

  className?: string;
}

interface ToolButtonProps {
  icon: string;
  label: string;
  tool: PDFTool;
  activeTool: PDFTool;
  onClick: (tool: PDFTool) => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  tool,
  activeTool,
  onClick,
}) => (
  <button
    onClick={() => onClick(tool)}
    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
      activeTool === tool
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`}
    title={label}
  >
    <i className={`fas ${icon} text-sm`}></i>
  </button>
);

export const PDFToolbar: React.FC<PDFToolbarProps> = ({
  documentName,
  isDocumentLoaded,
  isModified,
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPreviousPage,
  canGoNext,
  canGoPrevious,
  zoom,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  canZoomIn,
  canZoomOut,
  onRotateClockwise,
  onRotateCounterClockwise,
  viewMode,
  onViewModeChange,
  fitMode,
  onFitModeChange,
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenFile,
  onSave,
  onPrint,
  onSearch,
  className = '',
}) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Update page input when current page changes
  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Handle page input change
  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageInput(e.target.value);
    },
    []
  );

  // Handle page input submit
  const handlePageInputSubmit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const page = parseInt(pageInput, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          onPageChange(page);
        } else {
          setPageInput(currentPage.toString());
        }
      }
    },
    [pageInput, totalPages, currentPage, onPageChange]
  );

  // Handle zoom presets
  const zoomPresets = [
    { label: 'Fit Page', value: 'page' as const, isFit: true },
    { label: 'Fit Width', value: 'width' as const, isFit: true },
    { label: '50%', value: 0.5, isFit: false },
    { label: '75%', value: 0.75, isFit: false },
    { label: '100%', value: 1, isFit: false },
    { label: '125%', value: 1.25, isFit: false },
    { label: '150%', value: 1.5, isFit: false },
    { label: '200%', value: 2, isFit: false },
  ];

  // Tool groups
  const selectionTools: Array<{ icon: string; label: string; tool: PDFTool }> = [
    { icon: 'fa-mouse-pointer', label: 'Select', tool: 'select' },
    { icon: 'fa-hand', label: 'Hand Tool', tool: 'hand' },
    { icon: 'fa-i-cursor', label: 'Text Select', tool: 'textSelect' },
  ];

  const annotationTools: Array<{ icon: string; label: string; tool: PDFTool }> = [
    { icon: 'fa-highlighter', label: 'Highlight', tool: 'highlight' },
    { icon: 'fa-underline', label: 'Underline', tool: 'underline' },
    { icon: 'fa-strikethrough', label: 'Strikethrough', tool: 'strikethrough' },
    { icon: 'fa-eraser', label: 'Redact', tool: 'redact' },
  ];

  const drawingTools: Array<{ icon: string; label: string; tool: PDFTool }> = [
    { icon: 'fa-pen', label: 'Ink', tool: 'ink' },
    { icon: 'fa-sticky-note', label: 'Note', tool: 'note' },
    { icon: 'fa-font', label: 'Text Box', tool: 'freeText' },
    { icon: 'fa-stamp', label: 'Stamp', tool: 'stamp' },
  ];

  const shapeTools: Array<{ icon: string; label: string; tool: PDFTool }> = [
    { icon: 'fa-square', label: 'Rectangle', tool: 'rectangle' },
    { icon: 'fa-circle', label: 'Ellipse', tool: 'ellipse' },
    { icon: 'fa-arrow-right', label: 'Arrow', tool: 'arrow' },
    { icon: 'fa-minus', label: 'Line', tool: 'line' },
  ];

  const formTools: Array<{ icon: string; label: string; tool: PDFTool }> = [
    { icon: 'fa-text-width', label: 'Text Field', tool: 'formText' },
    { icon: 'fa-check-square', label: 'Checkbox', tool: 'formCheckbox' },
    { icon: 'fa-circle-dot', label: 'Radio Button', tool: 'formRadio' },
    { icon: 'fa-caret-down', label: 'Dropdown', tool: 'formDropdown' },
    { icon: 'fa-signature', label: 'Signature', tool: 'formSignature' },
  ];

  return (
    <div
      className={`bg-white border-b border-slate-200 shadow-sm ${className}`}
    >
      {/* Main Toolbar */}
      <div className="px-6 py-3 flex items-center gap-4">
        {/* File Actions */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
          <button
            onClick={onOpenFile}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl type-micro hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <i className="fas fa-folder-open"></i>
            Open
          </button>

          <button
            onClick={onSave}
            disabled={!isDocumentLoaded}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Save"
          >
            <i className="fas fa-save"></i>
          </button>

          <button
            onClick={onPrint}
            disabled={!isDocumentLoaded}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Print"
          >
            <i className="fas fa-print"></i>
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 pr-4 border-r border-slate-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Undo (Ctrl+Z)"
          >
            <i className="fas fa-undo"></i>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Redo (Ctrl+Y)"
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
          <button
            onClick={onPreviousPage}
            disabled={!canGoPrevious}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous Page"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              onBlur={() => setPageInput(currentPage.toString())}
              className="w-12 h-8 text-center text-sm font-medium bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400 text-sm">/ {totalPages}</span>
          </div>

          <button
            onClick={onNextPage}
            disabled={!canGoNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next Page"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
          <button
            onClick={onZoomOut}
            disabled={!canZoomOut}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Zoom Out"
          >
            <i className="fas fa-minus text-xs"></i>
          </button>

          <select
            value={fitMode !== 'actual' ? fitMode : zoom}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'page' || val === 'width' || val === 'height') {
                onFitModeChange(val);
              } else {
                onZoomChange(parseFloat(val));
              }
            }}
            className="h-8 px-2 text-sm font-medium bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {zoomPresets.map((preset) => (
              <option
                key={preset.label}
                value={preset.value}
              >
                {preset.label}
              </option>
            ))}
          </select>

          <button
            onClick={onZoomIn}
            disabled={!canZoomIn}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Zoom In"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-1 pr-4 border-r border-slate-200">
          <button
            onClick={onRotateCounterClockwise}
            disabled={!isDocumentLoaded}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Rotate Left"
          >
            <i className="fas fa-rotate-left text-xs"></i>
          </button>
          <button
            onClick={onRotateClockwise}
            disabled={!isDocumentLoaded}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Rotate Right"
          >
            <i className="fas fa-rotate-right text-xs"></i>
          </button>
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1 pr-4 border-r border-slate-200">
          <button
            onClick={() => onViewModeChange('single')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              viewMode === 'single'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Single Page"
          >
            <i className="fas fa-file text-xs"></i>
          </button>
          <button
            onClick={() => onViewModeChange('continuous')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              viewMode === 'continuous'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Continuous"
          >
            <i className="fas fa-bars-staggered text-xs"></i>
          </button>
          <button
            onClick={() => onViewModeChange('facing')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              viewMode === 'facing'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Facing Pages"
          >
            <i className="fas fa-book-open text-xs"></i>
          </button>
        </div>

        {/* Search */}
        <button
          onClick={onSearch}
          disabled={!isDocumentLoaded}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Search (Ctrl+F)"
        >
          <i className="fas fa-search"></i>
        </button>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Document name */}
        {documentName && (
          <div className="flex items-center gap-2 text-sm">
            <i className="fas fa-file-pdf text-rose-500"></i>
            <span className="text-slate-600 font-medium truncate max-w-[200px]">
              {documentName}
            </span>
            {isModified && (
              <span className="w-2 h-2 bg-amber-500 rounded-full" title="Unsaved changes"></span>
            )}
          </div>
        )}
      </div>

      {/* Tools Bar */}
      <div className="px-6 py-2 flex items-center gap-4 bg-slate-50 border-t border-slate-100">
        {/* Selection Tools */}
        <div className="flex items-center gap-1">
          {selectionTools.map((tool) => (
            <ToolButton
              key={tool.tool}
              icon={tool.icon}
              label={tool.label}
              tool={tool.tool}
              activeTool={activeTool}
              onClick={onToolChange}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200"></div>

        {/* Annotation Tools */}
        <div className="flex items-center gap-1">
          {annotationTools.map((tool) => (
            <ToolButton
              key={tool.tool}
              icon={tool.icon}
              label={tool.label}
              tool={tool.tool}
              activeTool={activeTool}
              onClick={onToolChange}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200"></div>

        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          {drawingTools.map((tool) => (
            <ToolButton
              key={tool.tool}
              icon={tool.icon}
              label={tool.label}
              tool={tool.tool}
              activeTool={activeTool}
              onClick={onToolChange}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200"></div>

        {/* Shape Tools */}
        <div className="flex items-center gap-1">
          {shapeTools.map((tool) => (
            <ToolButton
              key={tool.tool}
              icon={tool.icon}
              label={tool.label}
              tool={tool.tool}
              activeTool={activeTool}
              onClick={onToolChange}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200"></div>

        {/* Form Tools */}
        <div className="flex items-center gap-1">
          {formTools.map((tool) => (
            <ToolButton
              key={tool.tool}
              icon={tool.icon}
              label={tool.label}
              tool={tool.tool}
              activeTool={activeTool}
              onClick={onToolChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFToolbar;
