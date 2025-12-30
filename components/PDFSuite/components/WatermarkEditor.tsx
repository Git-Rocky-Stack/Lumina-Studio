// ============================================
// WatermarkEditor - Text/Image Watermarks
// ============================================

import React, { useState, useRef, useCallback, useMemo } from 'react';

// Types
export type WatermarkType = 'text' | 'image';
export type WatermarkPosition = 'center' | 'diagonal' | 'tile' | 'top' | 'bottom' | 'corners';

export interface WatermarkConfig {
  type: WatermarkType;
  text?: string;
  imageUrl?: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  scale: number;
  spacing: number; // For tile pattern
  pages: 'all' | 'first' | 'last' | 'odd' | 'even' | number[];
}

interface WatermarkEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: WatermarkConfig) => Promise<void>;
  pageCount: number;
  className?: string;
}

const DEFAULT_CONFIG: WatermarkConfig = {
  type: 'text',
  text: 'CONFIDENTIAL',
  fontFamily: 'Arial',
  fontSize: 48,
  color: '#888888',
  opacity: 0.3,
  rotation: -45,
  position: 'diagonal',
  scale: 1,
  spacing: 200,
  pages: 'all'
};

const POSITION_OPTIONS: { value: WatermarkPosition; label: string; icon: string }[] = [
  { value: 'center', label: 'Center', icon: '⊕' },
  { value: 'diagonal', label: 'Diagonal', icon: '⤢' },
  { value: 'tile', label: 'Tile', icon: '⊞' },
  { value: 'top', label: 'Top', icon: '⬆' },
  { value: 'bottom', label: 'Bottom', icon: '⬇' },
  { value: 'corners', label: 'Corners', icon: '⬚' },
];

const PRESET_TEXTS = [
  'CONFIDENTIAL',
  'DRAFT',
  'COPY',
  'SAMPLE',
  'DO NOT COPY',
  'VOID',
  'APPROVED',
  'ORIGINAL'
];

export const WatermarkEditor: React.FC<WatermarkEditorProps> = ({
  isOpen,
  onClose,
  onApply,
  pageCount,
  className = ''
}) => {
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_CONFIG);
  const [isApplying, setIsApplying] = useState(false);
  const [customPages, setCustomPages] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update config
  const updateConfig = useCallback((updates: Partial<WatermarkConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      updateConfig({ type: 'image', imageUrl });
    };
    reader.readAsDataURL(file);
  }, [updateConfig]);

  // Parse custom page input
  const parsePages = useCallback((input: string): number[] => {
    const pages: number[] = [];
    const parts = input.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(pageCount, end); i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= pageCount && !pages.includes(num)) {
          pages.push(num);
        }
      }
    }

    return pages.sort((a, b) => a - b);
  }, [pageCount]);

  // Handle page selection change
  const handlePageSelection = useCallback((value: string) => {
    if (value === 'custom') {
      const pages = parsePages(customPages);
      updateConfig({ pages: pages.length > 0 ? pages : 'all' });
    } else {
      updateConfig({ pages: value as WatermarkConfig['pages'] });
    }
  }, [customPages, parsePages, updateConfig]);

  // Preview component
  const Preview = useMemo(() => {
    const previewStyle: React.CSSProperties = {
      color: config.color,
      opacity: config.opacity,
      transform: `rotate(${config.rotation}deg) scale(${config.scale})`,
      fontFamily: config.fontFamily,
      fontSize: `${config.fontSize / 3}px`, // Scaled down for preview
    };

    if (config.type === 'image' && config.imageUrl) {
      return (
        <img
          src={config.imageUrl}
          alt="Watermark"
          style={{ ...previewStyle, maxWidth: '80%', maxHeight: '80%' }}
        />
      );
    }

    return (
      <span style={previewStyle} className="font-bold whitespace-nowrap">
        {config.text || 'WATERMARK'}
      </span>
    );
  }, [config]);

  // Handle apply
  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(config);
      onClose();
    } catch (error) {
      console.error('Failed to apply watermark:', error);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-[#1a1a2e] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h2 className="type-subsection text-white">Add Watermark</h2>
              <p className="text-sm text-white/50">Protect your document with a watermark</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Preview */}
            <div className="col-span-2">
              <label className="block text-sm text-white/70 mb-2">Preview</label>
              <div className="aspect-[4/3] bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Page representation */}
                  <div className="w-3/4 h-3/4 bg-gray-100 border border-gray-300 shadow-md flex items-center justify-center">
                    {Preview}
                  </div>
                </div>
              </div>
            </div>

            {/* Type Selection */}
            <div className="col-span-2">
              <label className="block text-sm text-white/70 mb-2">Watermark Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateConfig({ type: 'text' })}
                  className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                    config.type === 'text'
                      ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500'
                      : 'bg-white/5 text-white/60 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Text
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                    config.type === 'image'
                      ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500'
                      : 'bg-white/5 text-white/60 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Text Settings */}
            {config.type === 'text' && (
              <>
                <div className="col-span-2">
                  <label className="block text-sm text-white/70 mb-2">Text</label>
                  <input
                    type="text"
                    value={config.text || ''}
                    onChange={(e) => updateConfig({ text: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white border border-white/10 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="Enter watermark text"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {PRESET_TEXTS.map(text => (
                      <button
                        key={text}
                        onClick={() => updateConfig({ text })}
                        className="px-2 py-1 text-xs rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Font Size</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={12}
                      max={200}
                      value={config.fontSize}
                      onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value) })}
                      className="flex-1 accent-cyan-500"
                    />
                    <span className="text-white/60 w-12 text-sm">{config.fontSize}pt</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Color</label>
                  <input
                    type="color"
                    value={config.color}
                    onChange={(e) => updateConfig({ color: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* Position */}
            <div className="col-span-2">
              <label className="block text-sm text-white/70 mb-2">Position</label>
              <div className="grid grid-cols-6 gap-2">
                {POSITION_OPTIONS.map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => updateConfig({ position: pos.value })}
                    className={`py-2 rounded-lg text-center transition-all ${
                      config.position === pos.value
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500'
                        : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg block">{pos.icon}</span>
                    <span className="text-xs">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Opacity</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={config.opacity * 100}
                  onChange={(e) => updateConfig({ opacity: parseInt(e.target.value) / 100 })}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-white/60 w-12 text-sm">{Math.round(config.opacity * 100)}%</span>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Rotation</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={config.rotation}
                  onChange={(e) => updateConfig({ rotation: parseInt(e.target.value) })}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-white/60 w-12 text-sm">{config.rotation}°</span>
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Scale</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={25}
                  max={200}
                  value={config.scale * 100}
                  onChange={(e) => updateConfig({ scale: parseInt(e.target.value) / 100 })}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-white/60 w-12 text-sm">{Math.round(config.scale * 100)}%</span>
              </div>
            </div>

            {/* Spacing (for tile) */}
            {config.position === 'tile' && (
              <div>
                <label className="block text-sm text-white/70 mb-2">Spacing</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={50}
                    max={500}
                    value={config.spacing}
                    onChange={(e) => updateConfig({ spacing: parseInt(e.target.value) })}
                    className="flex-1 accent-cyan-500"
                  />
                  <span className="text-white/60 w-12 text-sm">{config.spacing}px</span>
                </div>
              </div>
            )}

            {/* Page Selection */}
            <div className="col-span-2">
              <label className="block text-sm text-white/70 mb-2">Apply to Pages</label>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'first', 'last', 'odd', 'even'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => handlePageSelection(opt)}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                      config.pages === opt
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  value={customPages}
                  onChange={(e) => {
                    setCustomPages(e.target.value);
                    if (e.target.value) {
                      const pages = parsePages(e.target.value);
                      updateConfig({ pages: pages.length > 0 ? pages : 'all' });
                    }
                  }}
                  placeholder="Custom: 1, 3, 5-10"
                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              'Apply Watermark'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatermarkEditor;
