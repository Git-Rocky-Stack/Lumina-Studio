// ============================================
// TextLayer Component
// Renders selectable text overlay from PDF.js
// ============================================

import React, { useRef, useEffect, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

interface TextLayerProps {
  page: any; // PDFPageProxy
  scale: number;
  rotation: number;
  onTextSelect?: (text: string, bounds: DOMRect) => void;
  className?: string;
}

export const TextLayer: React.FC<TextLayerProps> = ({
  page,
  scale,
  rotation,
  onTextSelect,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const renderTextLayer = async () => {
      if (!containerRef.current || !page) return;

      // Clear previous content
      containerRef.current.innerHTML = '';
      setIsRendered(false);

      try {
        const viewport = page.getViewport({ scale, rotation });
        const textContent = await page.getTextContent();

        // Set container dimensions
        containerRef.current.style.width = `${viewport.width}px`;
        containerRef.current.style.height = `${viewport.height}px`;

        // Render text layer
        const textLayerRenderTask = pdfjs.renderTextLayer({
          textContentSource: textContent,
          container: containerRef.current,
          viewport,
          textDivs: [],
        });

        await textLayerRenderTask.promise;
        setIsRendered(true);
      } catch (error) {
        console.error('Failed to render text layer:', error);
      }
    };

    renderTextLayer();
  }, [page, scale, rotation]);

  // Handle text selection
  const handleMouseUp = () => {
    if (!onTextSelect) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const bounds = range.getBoundingClientRect();

    onTextSelect(text, bounds);
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 text-layer ${className}`}
      onMouseUp={handleMouseUp}
      style={{
        // Make text selectable but invisible (styled via CSS)
        opacity: isRendered ? 1 : 0,
        lineHeight: 1,
      }}
    />
  );
};

export default TextLayer;
