// ============================================
// DrawingCanvas - Fabric.js Annotation Layer
// ============================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDrawingLayer, DrawingTool, DrawingSettings } from '../hooks/useDrawingLayer';

// Color presets
const COLOR_PRESETS = [
  '#FF0000', '#FF6B00', '#FFD000', '#00C853', '#00BCD4',
  '#2196F3', '#3F51B5', '#9C27B0', '#E91E63', '#000000',
  '#FFFFFF', '#9E9E9E', '#795548', '#607D8B', 'transparent'
];

// Stroke width presets
const STROKE_PRESETS = [1, 2, 3, 5, 8, 12];

interface DrawingCanvasProps {
  width: number;
  height: number;
  pageNumber: number;
  onSave?: (imageData: string, jsonData: string) => void;
  initialData?: string;
  className?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width,
  height,
  pageNumber,
  onSave,
  initialData,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState<'stroke' | 'fill' | null>(null);

  const {
    canvas,
    activeTool,
    settings,
    selectedObjects,
    canUndo,
    canRedo,
    initCanvas,
    setActiveTool,
    updateSettings,
    addRectangle,
    addEllipse,
    addLine,
    addArrow,
    addText,
    deleteSelected,
    clearAll,
    bringToFront,
    sendToBack,
    undo,
    redo,
    exportAsImage,
    exportAsJSON,
    importFromJSON,
  } = useDrawingLayer({ width, height, pageNumber });

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      initCanvas(canvasRef.current);
    }
  }, [initCanvas]);

  // Load initial data
  useEffect(() => {
    if (canvas && initialData) {
      importFromJSON(initialData);
    }
  }, [canvas, initialData, importFromJSON]);

  // Handle shape drawing
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvas || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (['rectangle', 'ellipse', 'line', 'arrow'].includes(activeTool)) {
      setIsDrawingShape(true);
      setShapeStart({ x, y });
    } else if (activeTool === 'text') {
      addText(x, y);
    }
  }, [canvas, activeTool, addText]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawingShape || !shapeStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = Math.abs(x - shapeStart.x);
    const height = Math.abs(y - shapeStart.y);
    const left = Math.min(x, shapeStart.x);
    const top = Math.min(y, shapeStart.y);

    switch (activeTool) {
      case 'rectangle':
        if (width > 5 && height > 5) addRectangle(left, top, width, height);
        break;
      case 'ellipse':
        if (width > 5 && height > 5) addEllipse(left, top, width / 2, height / 2);
        break;
      case 'line':
        if (width > 5 || height > 5) addLine(shapeStart.x, shapeStart.y, x, y);
        break;
      case 'arrow':
        if (width > 5 || height > 5) addArrow(shapeStart.x, shapeStart.y, x, y);
        break;
    }

    setIsDrawingShape(false);
    setShapeStart(null);
  }, [isDrawingShape, shapeStart, activeTool, addRectangle, addEllipse, addLine, addArrow]);

  // Handle save
  const handleSave = useCallback(() => {
    const imageData = exportAsImage('png');
    const jsonData = exportAsJSON();
    onSave?.(imageData, jsonData);
  }, [exportAsImage, exportAsJSON, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'v') {
        setActiveTool('select');
      } else if (e.key === 'p') {
        setActiveTool('pen');
      } else if (e.key === 'h') {
        setActiveTool('highlighter');
      } else if (e.key === 'r') {
        setActiveTool('rectangle');
      } else if (e.key === 'e') {
        setActiveTool('ellipse');
      } else if (e.key === 'l') {
        setActiveTool('line');
      } else if (e.key === 'a') {
        setActiveTool('arrow');
      } else if (e.key === 't') {
        setActiveTool('text');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo, setActiveTool]);

  // Tool definitions
  const tools: { id: DrawingTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      )
    },
    {
      id: 'pen',
      label: 'Pen',
      shortcut: 'P',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    {
      id: 'highlighter',
      label: 'Highlighter',
      shortcut: 'H',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.5 4l-1-1-7.5 7.5v3l-1.5 1.5v2l2-2h2l7-7-1-1zm-10 13.5l-1.5 1.5 1.5 1.5 1.5-1.5-1.5-1.5z" />
        </svg>
      )
    },
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
        </svg>
      )
    },
    {
      id: 'ellipse',
      label: 'Ellipse',
      shortcut: 'E',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="9" ry="7" strokeWidth={2} />
        </svg>
      )
    },
    {
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="5" y1="19" x2="19" y2="5" strokeWidth={2} strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'arrow',
      label: 'Arrow',
      shortcut: 'A',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      )
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'T',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 6v12m-4 0h8" />
        </svg>
      )
    },
  ];

  return (
    <div className={`flex flex-col bg-[#1a1a2e] rounded-xl overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-white/5">
        {/* Tools */}
        <div className="flex items-center gap-1 px-2">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              className={`p-2 rounded-lg transition-all ${
                activeTool === tool.id
                  ? 'bg-purple-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-white/20" />

        {/* Stroke Color */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(showColorPicker === 'stroke' ? null : 'stroke')}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10"
          >
            <div
              className="w-5 h-5 rounded border border-white/30"
              style={{ backgroundColor: settings.strokeColor }}
            />
            <span className="text-xs text-white/70">Stroke</span>
          </button>

          {showColorPicker === 'stroke' && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-[#252540] rounded-lg shadow-xl border border-white/10 z-50">
              <div className="grid grid-cols-5 gap-1">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      updateSettings({ strokeColor: color });
                      setShowColorPicker(null);
                    }}
                    className={`w-6 h-6 rounded border ${
                      settings.strokeColor === color ? 'border-white' : 'border-white/20'
                    } ${color === 'transparent' ? 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%228%22%20height%3D%228%22%3E%3Crect%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E")]' : ''}`}
                    style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fill Color */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10"
          >
            <div
              className={`w-5 h-5 rounded border border-white/30 ${
                settings.fillColor === 'transparent'
                  ? 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%228%22%20height%3D%228%22%3E%3Crect%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23666%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23666%22%2F%3E%3C%2Fsvg%3E")]'
                  : ''
              }`}
              style={{ backgroundColor: settings.fillColor === 'transparent' ? undefined : settings.fillColor }}
            />
            <span className="text-xs text-white/70">Fill</span>
          </button>

          {showColorPicker === 'fill' && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-[#252540] rounded-lg shadow-xl border border-white/10 z-50">
              <div className="grid grid-cols-5 gap-1">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      updateSettings({ fillColor: color });
                      setShowColorPicker(null);
                    }}
                    className={`w-6 h-6 rounded border ${
                      settings.fillColor === color ? 'border-white' : 'border-white/20'
                    } ${color === 'transparent' ? 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%228%22%20height%3D%228%22%3E%3Crect%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E")]' : ''}`}
                    style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-1 px-2">
          <span className="text-xs text-white/50">Width:</span>
          <div className="flex gap-1">
            {STROKE_PRESETS.map(w => (
              <button
                key={w}
                onClick={() => updateSettings({ strokeWidth: w })}
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  settings.strokeWidth === w ? 'bg-purple-500/30 text-purple-300' : 'hover:bg-white/10 text-white/60'
                }`}
              >
                <span className="text-xs">{w}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-white/50">Opacity:</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={settings.opacity}
            onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
            className="w-16 accent-purple-500"
          />
          <span className="text-xs text-white/60 w-8">{Math.round(settings.opacity * 100)}%</span>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {selectedObjects.length > 0 && (
            <>
              <button
                onClick={bringToFront}
                title="Bring to Front"
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={sendToBack}
                title="Send to Back"
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={deleteSelected}
                title="Delete (Del)"
                className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
            </>
          )}

          <button
            onClick={clearAll}
            title="Clear All"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {onSave && (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative bg-white/5"
        style={{ width, height }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <canvas ref={canvasRef} />

        {/* Drawing preview overlay */}
        {isDrawingShape && shapeStart && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-purple-400"
            style={{
              left: shapeStart.x,
              top: shapeStart.y,
              width: 0,
              height: 0,
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/10 bg-white/5 text-xs text-white/50">
        <span>{activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} tool active</span>
        <span>{selectedObjects.length > 0 ? `${selectedObjects.length} selected` : 'Click to draw'}</span>
      </div>
    </div>
  );
};

export default DrawingCanvas;
