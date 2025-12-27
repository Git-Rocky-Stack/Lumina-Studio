// ============================================
// useDrawingLayer - Fabric.js Canvas Integration
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { fabric } from 'fabric';

// Types
export type DrawingTool =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'stamp';

export interface DrawingSettings {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
}

export interface DrawingObject {
  id: string;
  type: string;
  data: fabric.Object;
  pageNumber: number;
  timestamp: number;
}

interface UseDrawingLayerOptions {
  width: number;
  height: number;
  pageNumber: number;
  onObjectAdded?: (obj: DrawingObject) => void;
  onObjectModified?: (obj: DrawingObject) => void;
  onObjectRemoved?: (id: string) => void;
}

const DEFAULT_SETTINGS: DrawingSettings = {
  strokeColor: '#FF0000',
  fillColor: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
  fontFamily: 'Arial'
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export function useDrawingLayer(options: UseDrawingLayerOptions) {
  const { width, height, pageNumber, onObjectAdded, onObjectModified, onObjectRemoved } = options;

  // State
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [settings, setSettings] = useState<DrawingSettings>(DEFAULT_SETTINGS);
  const [objects, setObjects] = useState<DrawingObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });

  // Initialize canvas
  const initCanvas = useCallback((canvasElement: HTMLCanvasElement) => {
    if (canvas) {
      canvas.dispose();
    }

    const fabricCanvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      selection: activeTool === 'select',
      isDrawingMode: activeTool === 'pen' || activeTool === 'highlighter',
      backgroundColor: 'transparent',
    });

    // Configure free drawing brush
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = settings.strokeColor;
      fabricCanvas.freeDrawingBrush.width = settings.strokeWidth;
    }

    // Event handlers
    fabricCanvas.on('object:added', (e) => {
      if (e.target && !e.target.data?.id) {
        const id = generateId();
        e.target.set('data', { id });

        const drawingObj: DrawingObject = {
          id,
          type: e.target.type || 'unknown',
          data: e.target,
          pageNumber,
          timestamp: Date.now()
        };

        setObjects(prev => [...prev, drawingObj]);
        onObjectAdded?.(drawingObj);
        saveHistory(fabricCanvas);
      }
    });

    fabricCanvas.on('object:modified', (e) => {
      if (e.target?.data?.id) {
        const drawingObj: DrawingObject = {
          id: e.target.data.id,
          type: e.target.type || 'unknown',
          data: e.target,
          pageNumber,
          timestamp: Date.now()
        };

        setObjects(prev => prev.map(obj =>
          obj.id === e.target?.data?.id ? drawingObj : obj
        ));
        onObjectModified?.(drawingObj);
        saveHistory(fabricCanvas);
      }
    });

    fabricCanvas.on('object:removed', (e) => {
      if (e.target?.data?.id) {
        setObjects(prev => prev.filter(obj => obj.id !== e.target?.data?.id));
        onObjectRemoved?.(e.target.data.id);
        saveHistory(fabricCanvas);
      }
    });

    fabricCanvas.on('selection:created', (e) => {
      const ids = e.selected?.map(obj => obj.data?.id).filter(Boolean) || [];
      setSelectedObjects(ids);
    });

    fabricCanvas.on('selection:updated', (e) => {
      const ids = e.selected?.map(obj => obj.data?.id).filter(Boolean) || [];
      setSelectedObjects(ids);
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObjects([]);
    });

    canvasRef.current = canvasElement;
    setCanvas(fabricCanvas);

    return fabricCanvas;
  }, [width, height, activeTool, settings, pageNumber, onObjectAdded, onObjectModified, onObjectRemoved]);

  // Save history for undo/redo
  const saveHistory = useCallback((fabricCanvas: fabric.Canvas) => {
    const json = JSON.stringify(fabricCanvas.toJSON(['data']));
    historyRef.current.past.push(json);
    historyRef.current.future = [];

    // Limit history size
    if (historyRef.current.past.length > 50) {
      historyRef.current.past.shift();
    }
  }, []);

  // Update canvas when tool changes
  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'pen' || activeTool === 'highlighter';
    canvas.selection = activeTool === 'select';

    if (canvas.freeDrawingBrush) {
      if (activeTool === 'highlighter') {
        canvas.freeDrawingBrush.color = settings.strokeColor;
        canvas.freeDrawingBrush.width = settings.strokeWidth * 3;
        (canvas.freeDrawingBrush as any).opacity = 0.4;
      } else {
        canvas.freeDrawingBrush.color = settings.strokeColor;
        canvas.freeDrawingBrush.width = settings.strokeWidth;
        (canvas.freeDrawingBrush as any).opacity = settings.opacity;
      }
    }

    canvas.renderAll();
  }, [canvas, activeTool, settings]);

  // Drawing shape helpers
  const startDrawingShape = useCallback((
    type: 'rectangle' | 'ellipse' | 'line' | 'arrow',
    startX: number,
    startY: number
  ) => {
    if (!canvas) return;

    setIsDrawing(true);
    let shape: fabric.Object;

    const commonProps = {
      left: startX,
      top: startY,
      stroke: settings.strokeColor,
      strokeWidth: settings.strokeWidth,
      fill: settings.fillColor === 'transparent' ? '' : settings.fillColor,
      opacity: settings.opacity,
      selectable: false,
      evented: false,
    };

    switch (type) {
      case 'rectangle':
        shape = new fabric.Rect({
          ...commonProps,
          width: 0,
          height: 0,
        });
        break;
      case 'ellipse':
        shape = new fabric.Ellipse({
          ...commonProps,
          rx: 0,
          ry: 0,
        });
        break;
      case 'line':
      case 'arrow':
        shape = new fabric.Line([startX, startY, startX, startY], {
          ...commonProps,
          fill: undefined,
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.renderAll();
    return shape;
  }, [canvas, settings]);

  // Add rectangle
  const addRectangle = useCallback((x: number, y: number, width: number, height: number) => {
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: x,
      top: y,
      width,
      height,
      stroke: settings.strokeColor,
      strokeWidth: settings.strokeWidth,
      fill: settings.fillColor === 'transparent' ? '' : settings.fillColor,
      opacity: settings.opacity,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }, [canvas, settings]);

  // Add ellipse
  const addEllipse = useCallback((x: number, y: number, rx: number, ry: number) => {
    if (!canvas) return;

    const ellipse = new fabric.Ellipse({
      left: x,
      top: y,
      rx,
      ry,
      stroke: settings.strokeColor,
      strokeWidth: settings.strokeWidth,
      fill: settings.fillColor === 'transparent' ? '' : settings.fillColor,
      opacity: settings.opacity,
    });

    canvas.add(ellipse);
    canvas.setActiveObject(ellipse);
    canvas.renderAll();
  }, [canvas, settings]);

  // Add line
  const addLine = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (!canvas) return;

    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: settings.strokeColor,
      strokeWidth: settings.strokeWidth,
      opacity: settings.opacity,
    });

    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  }, [canvas, settings]);

  // Add arrow
  const addArrow = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (!canvas) return;

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;

    // Main line
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: settings.strokeColor,
      strokeWidth: settings.strokeWidth,
      opacity: settings.opacity,
    });

    // Arrow head
    const head = new fabric.Triangle({
      left: x2,
      top: y2,
      width: headLength,
      height: headLength,
      fill: settings.strokeColor,
      angle: (angle * 180 / Math.PI) + 90,
      originX: 'center',
      originY: 'center',
      opacity: settings.opacity,
    });

    // Group them
    const arrow = new fabric.Group([line, head], {
      selectable: true,
    });

    canvas.add(arrow);
    canvas.setActiveObject(arrow);
    canvas.renderAll();
  }, [canvas, settings]);

  // Add text
  const addText = useCallback((x: number, y: number, text: string = 'Text') => {
    if (!canvas) return;

    const textObj = new fabric.IText(text, {
      left: x,
      top: y,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      fill: settings.strokeColor,
      opacity: settings.opacity,
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    textObj.enterEditing();
    canvas.renderAll();
  }, [canvas, settings]);

  // Add image (for stamps)
  const addImage = useCallback(async (url: string, x: number, y: number, scale: number = 1) => {
    if (!canvas) return;

    return new Promise<void>((resolve) => {
      fabric.Image.fromURL(url, (img) => {
        img.set({
          left: x,
          top: y,
          scaleX: scale,
          scaleY: scale,
          opacity: settings.opacity,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        resolve();
      }, { crossOrigin: 'anonymous' });
    });
  }, [canvas, settings]);

  // Delete selected objects
  const deleteSelected = useCallback(() => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    canvas.discardActiveObject();
    activeObjects.forEach(obj => canvas.remove(obj));
    canvas.renderAll();
  }, [canvas]);

  // Clear all objects
  const clearAll = useCallback(() => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
    setObjects([]);
  }, [canvas]);

  // Undo
  const undo = useCallback(() => {
    if (!canvas || historyRef.current.past.length === 0) return;

    const current = JSON.stringify(canvas.toJSON(['data']));
    historyRef.current.future.unshift(current);

    const previous = historyRef.current.past.pop();
    if (previous) {
      canvas.loadFromJSON(previous, () => {
        canvas.renderAll();
      });
    }
  }, [canvas]);

  // Redo
  const redo = useCallback(() => {
    if (!canvas || historyRef.current.future.length === 0) return;

    const current = JSON.stringify(canvas.toJSON(['data']));
    historyRef.current.past.push(current);

    const next = historyRef.current.future.shift();
    if (next) {
      canvas.loadFromJSON(next, () => {
        canvas.renderAll();
      });
    }
  }, [canvas]);

  // Bring to front
  const bringToFront = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringToFront(activeObject);
      canvas.renderAll();
    }
  }, [canvas]);

  // Send to back
  const sendToBack = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendToBack(activeObject);
      canvas.renderAll();
    }
  }, [canvas]);

  // Export canvas as image
  const exportAsImage = useCallback((format: 'png' | 'jpg' = 'png'): string => {
    if (!canvas) return '';
    return canvas.toDataURL({
      format,
      quality: format === 'jpg' ? 0.9 : 1,
      multiplier: 2,
    });
  }, [canvas]);

  // Export as JSON
  const exportAsJSON = useCallback((): string => {
    if (!canvas) return '{}';
    return JSON.stringify(canvas.toJSON(['data']));
  }, [canvas]);

  // Import from JSON
  const importFromJSON = useCallback((json: string) => {
    if (!canvas) return;
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
    });
  }, [canvas]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<DrawingSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));

    // Apply to selected objects
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => {
        if (newSettings.strokeColor) obj.set('stroke', newSettings.strokeColor);
        if (newSettings.fillColor) obj.set('fill', newSettings.fillColor === 'transparent' ? '' : newSettings.fillColor);
        if (newSettings.strokeWidth) obj.set('strokeWidth', newSettings.strokeWidth);
        if (newSettings.opacity) obj.set('opacity', newSettings.opacity);
        if (obj.type === 'i-text' || obj.type === 'text') {
          if (newSettings.fontSize) (obj as fabric.IText).set('fontSize', newSettings.fontSize);
          if (newSettings.fontFamily) (obj as fabric.IText).set('fontFamily', newSettings.fontFamily);
        }
      });
      canvas.renderAll();
    }
  }, [canvas]);

  return {
    // State
    canvas,
    activeTool,
    settings,
    objects,
    selectedObjects,
    isDrawing,
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,

    // Actions
    initCanvas,
    setActiveTool,
    updateSettings,

    // Drawing
    startDrawingShape,
    addRectangle,
    addEllipse,
    addLine,
    addArrow,
    addText,
    addImage,

    // Object manipulation
    deleteSelected,
    clearAll,
    bringToFront,
    sendToBack,

    // History
    undo,
    redo,

    // Export/Import
    exportAsImage,
    exportAsJSON,
    importFromJSON,
  };
}

export default useDrawingLayer;
