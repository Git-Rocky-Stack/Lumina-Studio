import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useFabricCanvas } from '../hooks/useFabricCanvas';
import { useBrushEngine } from '../hooks/useBrushEngine';
import type { PhotoLayerExtended, PhotoTool, BrushPreset, BrushStroke, CanvasState } from '../types';
import { DEFAULT_BRUSH_PRESET } from '../types';

interface PhotoCanvasProps {
  layers: PhotoLayerExtended[];
  selectedLayerIds: string[];
  activeTool: PhotoTool;
  brushPreset: BrushPreset;
  primaryColor: string;
  secondaryColor: string;
  zoom: number;
  className?: string;
  onLayerUpdate: (id: string, updates: Partial<PhotoLayerExtended>) => void;
  onSelectionChange: (ids: string[]) => void;
  onBrushStroke: (stroke: BrushStroke) => void;
  onCanvasReady?: (state: CanvasState) => void;
  onZoomChange?: (zoom: number) => void;
}

const DRAWING_TOOLS: PhotoTool[] = ['brush', 'pencil', 'eraser', 'clone', 'mixer'];

export default function PhotoCanvas({
  layers,
  selectedLayerIds,
  activeTool,
  brushPreset,
  primaryColor,
  secondaryColor,
  zoom,
  className = '',
  onLayerUpdate,
  onSelectionChange,
  onBrushStroke,
  onCanvasReady,
  onZoomChange,
}: PhotoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingOverlayRef = useRef<HTMLCanvasElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Get active layer for drawing
  const activeLayer = layers.find(l => selectedLayerIds.includes(l.id)) || null;

  // Initialize Fabric.js canvas
  const {
    canvas,
    isReady,
    canvasState,
    addImageLayer,
    removeLayer,
    updateLayer: updateFabricLayer,
    setZoom,
    setPan,
    fitToView,
    centerCanvas,
  } = useFabricCanvas({
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    onSelectionChange,
    onObjectModified: onLayerUpdate,
    onCanvasReady: () => {
      onCanvasReady?.(canvasState);
    },
  });

  // Initialize brush engine
  const {
    isDrawing,
    startStroke,
    continueStroke,
    endStroke,
    cancelStroke,
    drawingCanvasRef,
    clearDrawingCanvas,
  } = useBrushEngine({
    canvas,
    activeLayer,
    brushPreset: brushPreset || DEFAULT_BRUSH_PRESET,
    primaryColor,
    secondaryColor,
    blendMode: 'normal',
    onStrokeEnd: (stroke) => {
      onBrushStroke(stroke);
      clearDrawingCanvas();
    },
  });

  // Assign drawing canvas ref
  useEffect(() => {
    if (drawingOverlayRef.current) {
      (drawingCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = drawingOverlayRef.current;
    }
  }, [drawingCanvasRef]);

  // Sync layers with Fabric canvas
  useEffect(() => {
    if (!isReady || !canvas) return;

    // Add new layers
    layers.forEach(async (layer) => {
      const existing = canvas.getObjects().find(o => o.get('layerId') === layer.id);
      if (!existing) {
        await addImageLayer(layer);
      } else {
        // Update existing layer
        updateFabricLayer(layer.id, layer);
      }
    });

    // Remove deleted layers
    const layerIds = layers.map(l => l.id);
    canvas.getObjects().forEach(obj => {
      const id = obj.get('layerId') as string;
      if (id && !layerIds.includes(id)) {
        removeLayer(id);
      }
    });
  }, [layers, isReady, canvas, addImageLayer, updateFabricLayer, removeLayer]);

  // Sync zoom
  useEffect(() => {
    if (isReady) {
      setZoom(zoom);
    }
  }, [zoom, isReady, setZoom]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
        e.preventDefault();
      }

      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          const newZoom = Math.min(zoom * 1.25, 10);
          onZoomChange?.(newZoom);
        } else if (e.key === '-') {
          e.preventDefault();
          const newZoom = Math.max(zoom / 1.25, 0.1);
          onZoomChange?.(newZoom);
        } else if (e.key === '0') {
          e.preventDefault();
          onZoomChange?.(1);
          centerCanvas();
        } else if (e.key === '1') {
          e.preventDefault();
          fitToView();
        }
      }

      // Cancel brush stroke on Escape
      if (e.key === 'Escape' && isDrawing) {
        cancelStroke();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [zoom, spacePressed, isDrawing, cancelStroke, centerCanvas, fitToView, onZoomChange]);

  // Determine if drawing mode is active
  const isDrawingMode = DRAWING_TOOLS.includes(activeTool);

  // Pointer event handlers for drawing
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || (e.pointerType === 'mouse' ? 1 : 0.5);

    // Space + click = pan
    if (spacePressed || activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Drawing tools
    if (isDrawingMode && activeLayer && !activeLayer.locked) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startStroke(x, y, pressure, e.tiltX, e.tiltY);
    }
  }, [spacePressed, activeTool, isDrawingMode, activeLayer, startStroke]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || (e.pointerType === 'mouse' ? 1 : 0.5);

    // Panning
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan(canvasState.panX + dx, canvasState.panY + dy);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Drawing
    if (isDrawing) {
      continueStroke(x, y, pressure, e.tiltX, e.tiltY);
    }
  }, [isPanning, panStart, canvasState.panX, canvasState.panY, isDrawing, continueStroke, setPan]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing) {
      endStroke();
    }
  }, [isPanning, isDrawing, endStroke]);

  const handlePointerLeave = useCallback(() => {
    if (isDrawing) {
      endStroke();
    }
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isDrawing, isPanning, endStroke]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, zoom * delta));
      onZoomChange?.(newZoom);
    }
  }, [zoom, onZoomChange]);

  // Resize drawing canvas to match container
  useEffect(() => {
    const resizeDrawingCanvas = () => {
      const container = containerRef.current;
      const drawCanvas = drawingOverlayRef.current;
      if (!container || !drawCanvas) return;

      const dpr = window.devicePixelRatio || 1;
      drawCanvas.width = container.clientWidth * dpr;
      drawCanvas.height = container.clientHeight * dpr;
      drawCanvas.style.width = `${container.clientWidth}px`;
      drawCanvas.style.height = `${container.clientHeight}px`;

      const ctx = drawCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeDrawingCanvas();

    const resizeObserver = new ResizeObserver(resizeDrawingCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Get cursor based on active tool
  const getCursor = () => {
    if (spacePressed || activeTool === 'hand') {
      return isPanning ? 'grabbing' : 'grab';
    }
    if (activeTool === 'zoom') return 'zoom-in';
    if (isDrawingMode) return 'crosshair';
    if (activeTool === 'eyedropper') return 'crosshair';
    if (activeTool === 'move') return 'move';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#1a1a1a] ${className}`}
      style={{ cursor: getCursor() }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Fabric.js canvas container - canvas element is injected by useFabricCanvas */}

      {/* Drawing overlay canvas */}
      <canvas
        ref={drawingOverlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          mixBlendMode: activeTool === 'eraser' ? 'difference' : 'normal',
        }}
      />

      {/* Canvas info overlay */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[10px] font-mono text-slate-500">
        <span>{Math.round(zoom * 100)}%</span>
        <span>{canvasState.width} × {canvasState.height}</span>
        {isDrawing && <span className="text-accent">Drawing...</span>}
      </div>

      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Initializing Canvas</span>
          </div>
        </div>
      )}
    </div>
  );
}
