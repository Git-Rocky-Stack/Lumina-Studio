import { useRef, useCallback, useState, useEffect } from 'react';
import type { Canvas } from 'fabric';
import type { BrushPreset, BrushPoint, BrushStroke, PhotoLayerExtended, ExtendedBlendMode } from '../types';
import { DEFAULT_BRUSH_PRESET } from '../types';

interface UseBrushEngineOptions {
  canvas: Canvas | null;
  activeLayer: PhotoLayerExtended | null;
  brushPreset: BrushPreset;
  primaryColor: string;
  secondaryColor: string;
  blendMode: ExtendedBlendMode;
  onStrokeStart?: () => void;
  onStrokeEnd?: (stroke: BrushStroke) => void;
  onStrokeUpdate?: (points: BrushPoint[]) => void;
}

interface UseBrushEngineReturn {
  isDrawing: boolean;
  currentStroke: BrushPoint[];
  brushPreset: BrushPreset;
  // Brush methods
  setBrushPreset: (preset: BrushPreset) => void;
  setBrushSize: (size: number) => void;
  setBrushHardness: (hardness: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushFlow: (flow: number) => void;
  // Drawing methods
  startStroke: (x: number, y: number, pressure: number, tiltX?: number, tiltY?: number) => void;
  continueStroke: (x: number, y: number, pressure: number, tiltX?: number, tiltY?: number) => void;
  endStroke: () => void;
  cancelStroke: () => void;
  // Drawing canvas
  drawingCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  clearDrawingCanvas: () => void;
}

export function useBrushEngine(options: UseBrushEngineOptions): UseBrushEngineReturn {
  const {
    // canvas is available for future use with Fabric.js brush integration
    activeLayer,
    brushPreset: initialPreset,
    primaryColor,
    blendMode,
    onStrokeStart,
    onStrokeEnd,
    onStrokeUpdate,
  } = options;

  const [isDrawing, setIsDrawing] = useState(false);
  const [brushPreset, setBrushPresetState] = useState<BrushPreset>(initialPreset || DEFAULT_BRUSH_PRESET);
  const currentStrokeRef = useRef<BrushPoint[]>([]);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<BrushPoint | null>(null);

  // Update brush preset from props
  useEffect(() => {
    if (initialPreset) {
      setBrushPresetState(initialPreset);
    }
  }, [initialPreset]);

  // Get drawing context
  const getDrawingContext = useCallback((): CanvasRenderingContext2D | null => {
    const drawCanvas = drawingCanvasRef.current;
    if (!drawCanvas) return null;
    return drawCanvas.getContext('2d');
  }, []);

  // Calculate brush properties based on pressure
  const calculateBrushProperties = useCallback((pressure: number) => {
    const { pressureSensitivity, size, opacity, hardness, flow } = brushPreset;

    return {
      size: pressureSensitivity.size ? size * pressure : size,
      opacity: pressureSensitivity.opacity ? (opacity / 100) * pressure : opacity / 100,
      hardness: pressureSensitivity.hardness ? hardness * pressure : hardness,
      flow: pressureSensitivity.flow ? (flow / 100) * pressure : flow / 100,
    };
  }, [brushPreset]);

  // Draw a single brush dab
  const drawDab = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, pressure: number) => {
    const props = calculateBrushProperties(pressure);
    const radius = props.size / 2;

    ctx.save();

    // Create radial gradient for soft brushes
    if (brushPreset.type === 'soft' || brushPreset.type === 'airbrush') {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const innerRadius = radius * (props.hardness / 100);

      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(innerRadius / radius || 0.01, primaryColor);
      gradient.addColorStop(1, `${primaryColor}00`);

      ctx.globalAlpha = props.opacity * props.flow;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Hard brush
      ctx.globalAlpha = props.opacity;
      ctx.fillStyle = primaryColor;
      ctx.beginPath();

      // Apply roundness
      if (brushPreset.roundness < 100) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((brushPreset.angle * Math.PI) / 180);
        ctx.scale(1, brushPreset.roundness / 100);
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.restore();
      } else {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
      }

      ctx.fill();
    }

    ctx.restore();
  }, [brushPreset, primaryColor, calculateBrushProperties]);

  // Draw line between two points with proper spacing
  const drawLineBetweenPoints = useCallback((
    ctx: CanvasRenderingContext2D,
    from: BrushPoint,
    to: BrushPoint
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const spacing = brushPreset.size * (brushPreset.spacing / 100);
    const steps = Math.max(1, Math.floor(distance / spacing));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;
      const pressure = from.pressure + (to.pressure - from.pressure) * t;

      // Apply scattering
      let finalX = x;
      let finalY = y;
      if (brushPreset.scattering > 0) {
        const scatter = (brushPreset.scattering / 100) * brushPreset.size;
        finalX += (Math.random() - 0.5) * scatter;
        finalY += (Math.random() - 0.5) * scatter;
      }

      drawDab(ctx, finalX, finalY, pressure);
    }
  }, [brushPreset, drawDab]);

  // Start a new stroke
  const startStroke = useCallback((
    x: number,
    y: number,
    pressure: number,
    tiltX = 0,
    tiltY = 0
  ) => {
    if (!activeLayer || activeLayer.locked) return;

    const ctx = getDrawingContext();
    if (!ctx) return;

    setIsDrawing(true);
    onStrokeStart?.();

    const point: BrushPoint = {
      x,
      y,
      pressure: Math.max(0.1, pressure), // Ensure minimum pressure
      tiltX,
      tiltY,
      timestamp: Date.now(),
    };

    currentStrokeRef.current = [point];
    lastPointRef.current = point;

    // Draw initial dab
    drawDab(ctx, x, y, point.pressure);
  }, [activeLayer, getDrawingContext, onStrokeStart, drawDab]);

  // Continue stroke
  const continueStroke = useCallback((
    x: number,
    y: number,
    pressure: number,
    tiltX = 0,
    tiltY = 0
  ) => {
    if (!isDrawing) return;

    const ctx = getDrawingContext();
    if (!ctx) return;

    const point: BrushPoint = {
      x,
      y,
      pressure: Math.max(0.1, pressure),
      tiltX,
      tiltY,
      timestamp: Date.now(),
    };

    currentStrokeRef.current.push(point);

    // Draw line from last point to current
    const lastPoint = lastPointRef.current;
    if (lastPoint) {
      drawLineBetweenPoints(ctx, lastPoint, point);
    }

    lastPointRef.current = point;
    onStrokeUpdate?.(currentStrokeRef.current);
  }, [isDrawing, getDrawingContext, drawLineBetweenPoints, onStrokeUpdate]);

  // End stroke
  const endStroke = useCallback(() => {
    if (!isDrawing || !activeLayer) return;

    setIsDrawing(false);

    const stroke: BrushStroke = {
      id: `stroke-${Date.now()}`,
      layerId: activeLayer.id,
      points: [...currentStrokeRef.current],
      brush: { ...brushPreset },
      color: primaryColor,
      blendMode,
      timestamp: Date.now(),
    };

    onStrokeEnd?.(stroke);
    currentStrokeRef.current = [];
    lastPointRef.current = null;
  }, [isDrawing, activeLayer, brushPreset, primaryColor, blendMode, onStrokeEnd]);

  // Cancel stroke
  const cancelStroke = useCallback(() => {
    setIsDrawing(false);
    currentStrokeRef.current = [];
    lastPointRef.current = null;
    clearDrawingCanvas();
  }, []);

  // Clear drawing canvas
  const clearDrawingCanvas = useCallback(() => {
    const ctx = getDrawingContext();
    const drawCanvas = drawingCanvasRef.current;
    if (!ctx || !drawCanvas) return;

    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  }, [getDrawingContext]);

  // Brush modification methods
  const setBrushPreset = useCallback((preset: BrushPreset) => {
    setBrushPresetState(preset);
  }, []);

  const setBrushSize = useCallback((size: number) => {
    setBrushPresetState(prev => ({ ...prev, size: Math.max(1, Math.min(1000, size)) }));
  }, []);

  const setBrushHardness = useCallback((hardness: number) => {
    setBrushPresetState(prev => ({ ...prev, hardness: Math.max(0, Math.min(100, hardness)) }));
  }, []);

  const setBrushOpacity = useCallback((opacity: number) => {
    setBrushPresetState(prev => ({ ...prev, opacity: Math.max(0, Math.min(100, opacity)) }));
  }, []);

  const setBrushFlow = useCallback((flow: number) => {
    setBrushPresetState(prev => ({ ...prev, flow: Math.max(0, Math.min(100, flow)) }));
  }, []);

  return {
    isDrawing,
    currentStroke: currentStrokeRef.current,
    brushPreset,
    setBrushPreset,
    setBrushSize,
    setBrushHardness,
    setBrushOpacity,
    setBrushFlow,
    startStroke,
    continueStroke,
    endStroke,
    cancelStroke,
    drawingCanvasRef,
    clearDrawingCanvas,
  };
}
