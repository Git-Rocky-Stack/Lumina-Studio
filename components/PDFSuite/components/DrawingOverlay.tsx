// ============================================
// DrawingOverlay Component
// Enables drag-to-draw for shape tools
// ============================================

import React, { useState, useCallback, useRef } from 'react';
import type { PDFTool } from '../types';

interface Point {
  x: number;
  y: number;
}

interface DrawingOverlayProps {
  activeTool: PDFTool;
  zoom: number;
  color: string;
  opacity: number;
  borderWidth: number;
  onShapeComplete: (
    tool: PDFTool,
    rect: { x: number; y: number; width: number; height: number }
  ) => void;
  className?: string;
}

const SHAPE_TOOLS: PDFTool[] = ['rectangle', 'ellipse', 'line', 'arrow', 'highlight', 'freeText'];

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  activeTool,
  zoom,
  color,
  opacity,
  borderWidth,
  onShapeComplete,
  className = '',
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isShapeTool = SHAPE_TOOLS.includes(activeTool);

  const getMousePosition = useCallback((e: React.MouseEvent): Point => {
    if (!overlayRef.current) return { x: 0, y: 0 };
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isShapeTool) return;
    e.preventDefault();
    e.stopPropagation();

    const pos = getMousePosition(e);
    setStartPoint(pos);
    setCurrentPoint(pos);
    setIsDrawing(true);
  }, [isShapeTool, getMousePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    e.preventDefault();

    const pos = getMousePosition(e);
    setCurrentPoint(pos);
  }, [isDrawing, startPoint, getMousePosition]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !currentPoint) return;
    e.preventDefault();

    // Calculate final rectangle
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    // Only create shape if it has meaningful size
    if (width > 5 || height > 5) {
      onShapeComplete(activeTool, { x, y, width, height });
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isDrawing, startPoint, currentPoint, activeTool, onShapeComplete]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  }, [isDrawing]);

  // Calculate preview shape bounds
  const getPreviewBounds = () => {
    if (!startPoint || !currentPoint) return null;

    const x = Math.min(startPoint.x, currentPoint.x) * zoom;
    const y = Math.min(startPoint.y, currentPoint.y) * zoom;
    const width = Math.abs(currentPoint.x - startPoint.x) * zoom;
    const height = Math.abs(currentPoint.y - startPoint.y) * zoom;

    return { x, y, width, height };
  };

  const renderPreview = () => {
    const bounds = getPreviewBounds();
    if (!bounds || !isDrawing) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: bounds.x,
      top: bounds.y,
      width: bounds.width,
      height: bounds.height,
      pointerEvents: 'none',
    };

    switch (activeTool) {
      case 'rectangle':
        return (
          <div
            style={{
              ...style,
              border: `${borderWidth}px solid ${color}`,
              backgroundColor: 'transparent',
              opacity: opacity / 100,
            }}
          />
        );

      case 'ellipse':
        return (
          <div
            style={{
              ...style,
              border: `${borderWidth}px solid ${color}`,
              borderRadius: '50%',
              backgroundColor: 'transparent',
              opacity: opacity / 100,
            }}
          />
        );

      case 'line':
      case 'arrow':
        const lineLength = Math.sqrt(bounds.width ** 2 + bounds.height ** 2);
        const angle = Math.atan2(
          (currentPoint!.y - startPoint!.y),
          (currentPoint!.x - startPoint!.x)
        ) * (180 / Math.PI);

        return (
          <div
            style={{
              position: 'absolute',
              left: startPoint!.x * zoom,
              top: startPoint!.y * zoom,
              width: lineLength,
              height: borderWidth,
              backgroundColor: color,
              opacity: opacity / 100,
              transformOrigin: '0 50%',
              transform: `rotate(${angle}deg)`,
              pointerEvents: 'none',
            }}
          >
            {activeTool === 'arrow' && (
              <div
                style={{
                  position: 'absolute',
                  right: -8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: `12px solid ${color}`,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                }}
              />
            )}
          </div>
        );

      case 'highlight':
        return (
          <div
            style={{
              ...style,
              backgroundColor: color,
              opacity: 0.4,
            }}
          />
        );

      case 'freeText':
        return (
          <div
            style={{
              ...style,
              border: `1px dashed ${color}`,
              backgroundColor: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: opacity / 100,
            }}
          >
            <span className="text-slate-400 text-xs">Text box</span>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isShapeTool) return null;

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 drawing-layer ${isDrawing ? 'active' : ''} ${className}`}
      style={{
        cursor: isDrawing ? 'crosshair' : 'crosshair',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {renderPreview()}
    </div>
  );
};

export default DrawingOverlay;
