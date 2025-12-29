import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, FabricImage, FabricObject, Shadow, filters } from 'fabric';
import type { PhotoLayerExtended, CanvasState, ExtendedBlendMode, ExtendedPhotoFilter } from '../types';

interface UseFabricCanvasOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  initialWidth?: number;
  initialHeight?: number;
  backgroundColor?: string;
  onSelectionChange?: (ids: string[]) => void;
  onObjectModified?: (layerId: string, updates: Partial<PhotoLayerExtended>) => void;
  onCanvasReady?: (canvas: Canvas) => void;
}

interface UseFabricCanvasReturn {
  canvas: Canvas | null;
  isReady: boolean;
  canvasState: CanvasState;
  // Layer operations
  addImageLayer: (layer: PhotoLayerExtended) => Promise<FabricObject | null>;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<PhotoLayerExtended>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  getLayerObject: (layerId: string) => FabricObject | null;
  // Canvas operations
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  fitToView: () => void;
  centerCanvas: () => void;
  // Selection
  selectLayer: (layerId: string) => void;
  selectMultiple: (layerIds: string[]) => void;
  clearSelection: () => void;
  getSelectedIds: () => string[];
  // Export
  exportPNG: (multiplier?: number) => Promise<string>;
  exportJSON: () => string;
  importJSON: (json: string) => Promise<void>;
  // State
  getCanvasDataUrl: () => string;
  setBackgroundColor: (color: string) => void;
}

// Map blend modes to Fabric.js globalCompositeOperation values
const BLEND_MODE_MAP: Record<ExtendedBlendMode, GlobalCompositeOperation> = {
  'normal': 'source-over',
  'dissolve': 'source-over',
  'darken': 'darken',
  'multiply': 'multiply',
  'color-burn': 'color-burn',
  'linear-burn': 'color-burn',
  'darker-color': 'darken',
  'lighten': 'lighten',
  'screen': 'screen',
  'color-dodge': 'color-dodge',
  'linear-dodge': 'lighter',
  'lighter-color': 'lighten',
  'overlay': 'overlay',
  'soft-light': 'soft-light',
  'hard-light': 'hard-light',
  'vivid-light': 'hard-light',
  'linear-light': 'hard-light',
  'pin-light': 'hard-light',
  'hard-mix': 'hard-light',
  'difference': 'difference',
  'exclusion': 'exclusion',
  'subtract': 'difference',
  'divide': 'difference',
  'hue': 'hue',
  'saturation': 'saturation',
  'color': 'color',
  'luminosity': 'luminosity',
};

export function useFabricCanvas(options: UseFabricCanvasOptions): UseFabricCanvasReturn {
  const {
    containerRef,
    initialWidth = 1920,
    initialHeight = 1080,
    backgroundColor = '#ffffff',
    onSelectionChange,
    onObjectModified,
    onCanvasReady,
  } = options;

  const canvasRef = useRef<Canvas | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    width: initialWidth,
    height: initialHeight,
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    backgroundColor,
    showGrid: false,
    showRulers: true,
    showGuides: true,
    snapToGrid: false,
    snapToGuides: true,
    gridSize: 10,
    guides: [],
  });

  // Initialize canvas
  useEffect(() => {
    if (!containerRef.current || canvasRef.current) return;

    // Create canvas element
    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'proPhotoCanvas';
    containerRef.current.appendChild(canvasEl);
    canvasElementRef.current = canvasEl;

    // Initialize Fabric canvas
    const fabricCanvas = new Canvas(canvasEl, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      imageSmoothingEnabled: true,
      stopContextMenu: true,
      fireRightClick: true,
      fireMiddleClick: true,
    });

    // Set up virtual canvas size (work area)
    fabricCanvas.setDimensions({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    canvasRef.current = fabricCanvas;

    // Event handlers
    fabricCanvas.on('selection:created', (e) => {
      const ids = e.selected?.map(obj => obj.get('layerId') as string).filter(Boolean) || [];
      onSelectionChange?.(ids);
    });

    fabricCanvas.on('selection:updated', (e) => {
      const ids = e.selected?.map(obj => obj.get('layerId') as string).filter(Boolean) || [];
      onSelectionChange?.(ids);
    });

    fabricCanvas.on('selection:cleared', () => {
      onSelectionChange?.([]);
    });

    fabricCanvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;

      const layerId = obj.get('layerId') as string;
      if (!layerId) return;

      const updates: Partial<PhotoLayerExtended> = {
        x: obj.left || 0,
        y: obj.top || 0,
        width: (obj.width || 0) * (obj.scaleX || 1),
        height: (obj.height || 0) * (obj.scaleY || 1),
        rotation: obj.angle || 0,
        skewX: obj.skewX || 0,
        skewY: obj.skewY || 0,
      };

      onObjectModified?.(layerId, updates);
    });

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvas) return;
      fabricCanvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      fabricCanvas.renderAll();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    setIsReady(true);
    onCanvasReady?.(fabricCanvas);

    return () => {
      resizeObserver.disconnect();
      fabricCanvas.dispose();
      canvasRef.current = null;
      if (canvasElementRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasElementRef.current);
      }
    };
  }, [containerRef, onSelectionChange, onObjectModified, onCanvasReady]);

  // Add image layer
  const addImageLayer = useCallback(async (layer: PhotoLayerExtended): Promise<FabricObject | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    try {
      const img = await FabricImage.fromURL(layer.content, {
        crossOrigin: 'anonymous',
      });

      // Set layer properties
      img.set({
        left: layer.x,
        top: layer.y,
        scaleX: layer.width / (img.width || 1),
        scaleY: layer.height / (img.height || 1),
        angle: layer.rotation,
        skewX: layer.skewX,
        skewY: layer.skewY,
        opacity: layer.opacity,
        visible: layer.visible,
        selectable: !layer.locked,
        evented: !layer.locked,
        globalCompositeOperation: BLEND_MODE_MAP[layer.blendMode] || 'source-over',
      });

      // Store layer ID
      img.set('layerId', layer.id);
      img.set('layerName', layer.name);

      // Apply shadow if effects include drop shadow
      const dropShadow = layer.effects?.find(e => e.type === 'dropShadow' && e.enabled);
      if (dropShadow) {
        const settings = dropShadow.settings as any;
        img.shadow = new Shadow({
          color: settings.color,
          blur: settings.size,
          offsetX: Math.cos((settings.angle * Math.PI) / 180) * settings.distance,
          offsetY: Math.sin((settings.angle * Math.PI) / 180) * settings.distance,
        });
      }

      canvas.add(img);
      canvas.renderAll();

      return img;
    } catch (error) {
      console.error('Failed to add image layer:', error);
      return null;
    }
  }, []);

  // Remove layer
  const removeLayer = useCallback((layerId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const obj = objects.find(o => o.get('layerId') === layerId);
    if (obj) {
      canvas.remove(obj);
      canvas.renderAll();
    }
  }, []);

  // Helper to apply filters to a Fabric image
  const applyFiltersToImage = useCallback((img: FabricImage, layerFilters: ExtendedPhotoFilter[]) => {
    // Clear existing filters
    img.filters = [];

    // Apply each enabled filter
    layerFilters.forEach(filter => {
      if (!filter.enabled) return;

      const value = typeof filter.value === 'number' ? filter.value : 0;

      switch (filter.type) {
        case 'brightness':
          img.filters?.push(new filters.Brightness({ brightness: value / 100 }));
          break;
        case 'contrast':
          img.filters?.push(new filters.Contrast({ contrast: value / 100 }));
          break;
        case 'saturation':
          img.filters?.push(new filters.Saturation({ saturation: value / 100 }));
          break;
        case 'hue':
          img.filters?.push(new filters.HueRotation({ rotation: value }));
          break;
        case 'exposure':
          // Exposure approximated with brightness
          img.filters?.push(new filters.Brightness({ brightness: value / 50 }));
          break;
        case 'vibrance':
          // Vibrance approximated with saturation boost
          img.filters?.push(new filters.Saturation({ saturation: value / 50 }));
          break;
        case 'gamma':
          img.filters?.push(new filters.Gamma({ gamma: [1 + value / 100, 1 + value / 100, 1 + value / 100] }));
          break;
        case 'blur':
          if (value > 0) {
            img.filters?.push(new filters.Blur({ blur: value / 100 }));
          }
          break;
        case 'sharpen':
          if (value > 0) {
            img.filters?.push(new filters.Convolute({
              matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
            }));
          }
          break;
        case 'noise':
          if (value > 0) {
            img.filters?.push(new filters.Noise({ noise: value }));
          }
          break;
        case 'grayscale':
          if (value > 0) {
            img.filters?.push(new filters.Grayscale());
          }
          break;
        case 'sepia':
          if (value > 0) {
            img.filters?.push(new filters.Sepia());
          }
          break;
        case 'invert':
          if (value > 0) {
            img.filters?.push(new filters.Invert());
          }
          break;
        case 'pixelate':
          if (value > 1) {
            img.filters?.push(new filters.Pixelate({ blocksize: value }));
          }
          break;
      }
    });

    // Apply the filters
    img.applyFilters();
  }, []);

  // Update layer
  const updateLayer = useCallback((layerId: string, updates: Partial<PhotoLayerExtended>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const obj = objects.find(o => o.get('layerId') === layerId);
    if (!obj) return;

    if (updates.x !== undefined) obj.set('left', updates.x);
    if (updates.y !== undefined) obj.set('top', updates.y);
    if (updates.rotation !== undefined) obj.set('angle', updates.rotation);
    if (updates.skewX !== undefined) obj.set('skewX', updates.skewX);
    if (updates.skewY !== undefined) obj.set('skewY', updates.skewY);
    if (updates.opacity !== undefined) obj.set('opacity', updates.opacity);
    if (updates.visible !== undefined) obj.set('visible', updates.visible);
    if (updates.locked !== undefined) {
      obj.set('selectable', !updates.locked);
      obj.set('evented', !updates.locked);
    }
    if (updates.blendMode) {
      obj.set('globalCompositeOperation', BLEND_MODE_MAP[updates.blendMode] || 'source-over');
    }

    // Handle width/height updates with scaling
    if (updates.width !== undefined && obj.width) {
      obj.set('scaleX', updates.width / obj.width);
    }
    if (updates.height !== undefined && obj.height) {
      obj.set('scaleY', updates.height / obj.height);
    }

    // Apply filters if the object is an image and filters are provided
    if (updates.filters !== undefined && obj instanceof FabricImage) {
      applyFiltersToImage(obj, updates.filters);
    }

    obj.setCoords();
    canvas.renderAll();
  }, [applyFiltersToImage]);

  // Reorder layers
  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    if (fromIndex < 0 || fromIndex >= objects.length) return;
    if (toIndex < 0 || toIndex >= objects.length) return;

    const obj = objects[fromIndex];
    if (!obj) return;
    // Move object to new position in stack
    canvas.remove(obj);
    canvas.insertAt(toIndex, obj);
    canvas.renderAll();
  }, []);

  // Get layer object
  const getLayerObject = useCallback((layerId: string): FabricObject | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return canvas.getObjects().find(o => o.get('layerId') === layerId) || null;
  }, []);

  // Zoom
  const setZoom = useCallback((zoom: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clampedZoom = Math.max(0.1, Math.min(10, zoom));
    canvas.setZoom(clampedZoom);
    setCanvasState(prev => ({ ...prev, zoom: clampedZoom }));
    canvas.renderAll();
  }, []);

  // Pan
  const setPan = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const vpt = canvas.viewportTransform;
    if (!vpt) return;

    vpt[4] = x;
    vpt[5] = y;
    canvas.setViewportTransform(vpt);
    setCanvasState(prev => ({ ...prev, panX: x, panY: y }));
    canvas.renderAll();
  }, []);

  // Fit to view
  const fitToView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const scaleX = (containerWidth - 100) / canvasState.width;
    const scaleY = (containerHeight - 100) / canvasState.height;
    const scale = Math.min(scaleX, scaleY, 1);

    setZoom(scale);
    centerCanvas();
  }, [canvasState.width, canvasState.height, setZoom]);

  // Center canvas
  const centerCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const zoom = canvas.getZoom();
    const x = (containerWidth - canvasState.width * zoom) / 2;
    const y = (containerHeight - canvasState.height * zoom) / 2;

    setPan(x, y);
  }, [canvasState.width, canvasState.height, setPan]);

  // Selection methods
  const selectLayer = useCallback((layerId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.discardActiveObject();
    const obj = canvas.getObjects().find(o => o.get('layerId') === layerId);
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  }, []);

  const selectMultiple = useCallback((layerIds: string[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.discardActiveObject();
    const objects = canvas.getObjects().filter(o => layerIds.includes(o.get('layerId') as string));

    if (objects.length > 0) {
      // For multiple selection, we'd use ActiveSelection but that's more complex
      // For now, just select the first one
      const firstObj = objects[0];
      if (firstObj) {
        canvas.setActiveObject(firstObj);
        canvas.renderAll();
      }
    }
  }, []);

  const clearSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.discardActiveObject();
    canvas.renderAll();
  }, []);

  const getSelectedIds = useCallback((): string[] => {
    const canvas = canvasRef.current;
    if (!canvas) return [];

    const active = canvas.getActiveObject();
    if (!active) return [];

    // Check if it's a group selection
    if (active.type === 'activeSelection') {
      const group = active as any;
      return group.getObjects().map((obj: FabricObject) => obj.get('layerId') as string).filter(Boolean);
    }

    const id = active.get('layerId') as string;
    return id ? [id] : [];
  }, []);

  // Export methods
  const exportPNG = useCallback(async (multiplier = 1): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    return canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier,
    });
  }, []);

  const exportJSON = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '{}';

    // Fabric.js v6 toJSON doesn't take arguments, custom properties should be set via toObject
    return JSON.stringify(canvas.toJSON());
  }, []);

  const importJSON = useCallback(async (json: string): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const data = JSON.parse(json);
    await canvas.loadFromJSON(data);
    canvas.renderAll();
  }, []);

  // Get canvas data URL
  const getCanvasDataUrl = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    return canvas.toDataURL();
  }, []);

  // Set background color
  const setBackgroundColor = useCallback((color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.backgroundColor = color;
    setCanvasState(prev => ({ ...prev, backgroundColor: color }));
    canvas.renderAll();
  }, []);

  return {
    canvas: canvasRef.current,
    isReady,
    canvasState,
    addImageLayer,
    removeLayer,
    updateLayer,
    reorderLayers,
    getLayerObject,
    setZoom,
    setPan,
    fitToView,
    centerCanvas,
    selectLayer,
    selectMultiple,
    clearSelection,
    getSelectedIds,
    exportPNG,
    exportJSON,
    importJSON,
    getCanvasDataUrl,
    setBackgroundColor,
  };
}
