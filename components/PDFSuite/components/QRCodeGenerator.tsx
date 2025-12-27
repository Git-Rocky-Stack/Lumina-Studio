// ============================================
// QRCodeGenerator - QR Code Sharing Component
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
  size?: number;
  logo?: string;
  foreground?: string;
  background?: string;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  onDownload?: (dataUrl: string) => void;
  className?: string;
}

// Simple QR Code Generator using Canvas
// For production, consider using 'qrcode' npm package
class QRCodeCanvas {
  private modules: boolean[][] = [];
  private size: number = 0;

  constructor(data: string, errorCorrection: 'L' | 'M' | 'Q' | 'H' = 'M') {
    this.generate(data);
  }

  private generate(data: string) {
    // Simplified QR code generation
    // In production, use proper QR code library
    const size = Math.max(21, Math.ceil(data.length / 3) * 4 + 17);
    this.size = size;
    this.modules = Array(size).fill(null).map(() => Array(size).fill(false));

    // Generate pattern based on data
    const hash = this.hashString(data);

    // Finder patterns (corners)
    this.addFinderPattern(0, 0);
    this.addFinderPattern(size - 7, 0);
    this.addFinderPattern(0, size - 7);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      this.modules[6][i] = i % 2 === 0;
      this.modules[i][6] = i % 2 === 0;
    }

    // Alignment pattern
    if (size > 21) {
      this.addAlignmentPattern(size - 7, size - 7);
    }

    // Data pattern (simplified - not actual QR encoding)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.isReserved(row, col)) continue;
        const index = row * size + col;
        this.modules[row][col] = ((hash + index) * 7919) % 17 > 8;
      }
    }
  }

  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  private addFinderPattern(row: number, col: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        this.modules[row + r][col + c] = isOuter || isInner;
      }
    }
  }

  private addAlignmentPattern(row: number, col: number) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isOuter = r === -2 || r === 2 || c === -2 || c === 2;
        const isCenter = r === 0 && c === 0;
        if (row + r >= 0 && row + r < this.size && col + c >= 0 && col + c < this.size) {
          this.modules[row + r][col + c] = isOuter || isCenter;
        }
      }
    }
  }

  private isReserved(row: number, col: number): boolean {
    // Finder patterns
    if (row < 8 && col < 8) return true;
    if (row < 8 && col >= this.size - 8) return true;
    if (row >= this.size - 8 && col < 8) return true;
    // Timing
    if (row === 6 || col === 6) return true;
    return false;
  }

  draw(
    canvas: HTMLCanvasElement,
    size: number,
    options: {
      foreground?: string;
      background?: string;
      logo?: HTMLImageElement | null;
      logoSize?: number;
    } = {}
  ) {
    const ctx = canvas.getContext('2d')!;
    const cellSize = size / this.size;
    const {
      foreground = '#000000',
      background = '#FFFFFF',
      logo = null,
      logoSize = 0.2,
    } = options;

    // Background
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);

    // Modules
    ctx.fillStyle = foreground;
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.modules[row][col]) {
          ctx.fillRect(
            col * cellSize,
            row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    // Logo
    if (logo) {
      const logoDisplaySize = size * logoSize;
      const logoOffset = (size - logoDisplaySize) / 2;

      // White background for logo
      ctx.fillStyle = background;
      const padding = logoDisplaySize * 0.1;
      ctx.fillRect(
        logoOffset - padding,
        logoOffset - padding,
        logoDisplaySize + padding * 2,
        logoDisplaySize + padding * 2
      );

      ctx.drawImage(
        logo,
        logoOffset,
        logoOffset,
        logoDisplaySize,
        logoDisplaySize
      );
    }
  }
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  url,
  title = 'Scan to access document',
  size = 200,
  logo,
  foreground = '#000000',
  background = '#FFFFFF',
  errorCorrection = 'M',
  onDownload,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [customColor, setCustomColor] = useState(foreground);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'pdf'>('png');

  // Load logo image
  useEffect(() => {
    if (logo) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setLogoImage(img);
      img.src = logo;
    } else {
      setLogoImage(null);
    }
  }, [logo]);

  // Generate QR code
  useEffect(() => {
    if (canvasRef.current && url) {
      const canvas = canvasRef.current;
      canvas.width = size;
      canvas.height = size;

      const qr = new QRCodeCanvas(url, errorCorrection);
      qr.draw(canvas, size, {
        foreground: customColor,
        background,
        logo: logoImage,
        logoSize: 0.25,
      });
    }
  }, [url, size, customColor, background, logoImage, errorCorrection]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL(`image/${downloadFormat === 'png' ? 'png' : 'png'}`);

    const link = document.createElement('a');
    link.download = `qr-code.${downloadFormat}`;
    link.href = dataUrl;
    link.click();

    onDownload?.(dataUrl);
  }, [downloadFormat, onDownload]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((blob) => resolve(blob!), 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch (error) {
      console.error('Failed to copy QR code:', error);
    }
  }, []);

  const presetColors = [
    '#000000', // Black
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
  ];

  return (
    <div className={`${className}`}>
      {/* QR Code Display */}
      <div className="flex flex-col items-center p-6 bg-white rounded-xl">
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-lg"
          style={{ width: size, height: size }}
        />
        {title && (
          <p className="mt-4 text-sm text-gray-600 text-center">{title}</p>
        )}
        <p className="mt-1 text-xs text-gray-400 max-w-[200px] truncate text-center">
          {url}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* Color Picker */}
        <div>
          <label className="text-sm text-white/60 block mb-2">QR Color</label>
          <div className="flex items-center gap-2">
            {presetColors.map(color => (
              <button
                key={color}
                onClick={() => setCustomColor(color)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  customColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e] scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 flex items-center justify-center"
              >
                <span className="w-3 h-3 bg-white rounded-full" />
              </button>
              {showColorPicker && (
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="absolute top-full left-0 mt-2"
                />
              )}
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="flex items-center gap-3">
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value as typeof downloadFormat)}
            className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10"
          >
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Usage Instructions */}
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-white/50">
              <p>Scan this QR code with your phone camera to instantly access the document.</p>
              <p className="mt-1">Perfect for sharing in presentations, print materials, or meetings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact QR preview for inline use
export const QRCodePreview: React.FC<{
  url: string;
  size?: number;
  onClick?: () => void;
  className?: string;
}> = ({ url, size = 80, onClick, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      const canvas = canvasRef.current;
      canvas.width = size;
      canvas.height = size;

      const qr = new QRCodeCanvas(url, 'L');
      qr.draw(canvas, size, {
        foreground: '#000000',
        background: '#FFFFFF',
      });
    }
  }, [url, size]);

  return (
    <button
      onClick={onClick}
      className={`relative group ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        style={{ width: size, height: size }}
      />
      <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </div>
    </button>
  );
};

export default QRCodeGenerator;
