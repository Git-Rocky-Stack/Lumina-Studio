// ============================================
// WatermarkPanel Component
// Add text or image watermarks to PDF pages
// ============================================

import React, { useState, useCallback, useRef } from 'react';

export interface WatermarkSettings {
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  rotation: number;
  position: 'center' | 'diagonal' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
  customX?: number;
  customY?: number;
  scale: number;
  imageData?: string;
  applyTo: 'all' | 'even' | 'odd' | 'range';
  pageRange?: string;
}

interface WatermarkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (settings: WatermarkSettings) => void;
  totalPages: number;
  className?: string;
}

const DEFAULT_SETTINGS: WatermarkSettings = {
  type: 'text',
  text: 'CONFIDENTIAL',
  fontSize: 48,
  fontFamily: 'Helvetica',
  color: '#000000',
  opacity: 30,
  rotation: -45,
  position: 'diagonal',
  scale: 1,
  applyTo: 'all',
};

const FONT_OPTIONS = [
  'Helvetica',
  'Times-Roman',
  'Courier',
  'Helvetica-Bold',
  'Times-Bold',
  'Courier-Bold',
];

const POSITION_OPTIONS = [
  { value: 'center', label: 'Center', icon: 'fas fa-compress-alt' },
  { value: 'diagonal', label: 'Diagonal', icon: 'fas fa-slash' },
  { value: 'top-left', label: 'Top Left', icon: 'fas fa-arrow-up-left' },
  { value: 'top-right', label: 'Top Right', icon: 'fas fa-arrow-up-right' },
  { value: 'bottom-left', label: 'Bottom Left', icon: 'fas fa-arrow-down-left' },
  { value: 'bottom-right', label: 'Bottom Right', icon: 'fas fa-arrow-down-right' },
];

const PRESET_TEXTS = [
  'CONFIDENTIAL',
  'DRAFT',
  'SAMPLE',
  'COPY',
  'DO NOT COPY',
  'APPROVED',
  'FINAL',
  'INTERNAL USE ONLY',
];

export const WatermarkPanel: React.FC<WatermarkPanelProps> = ({
  isOpen,
  onClose,
  onApply,
  totalPages,
  className = '',
}) => {
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);
  const [isApplying, setIsApplying] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const updateSettings = useCallback((updates: Partial<WatermarkSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateSettings({
          type: 'image',
          imageData: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, [updateSettings]);

  const handleApply = useCallback(async () => {
    setIsApplying(true);
    try {
      await onApply(settings);
      onClose();
    } catch (error) {
      console.error('Failed to apply watermark:', error);
    } finally {
      setIsApplying(false);
    }
  }, [settings, onApply, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-stamp text-blue-600"></i>
            </div>
            <div>
              <h2 className="type-section text-slate-800">Add Watermark</h2>
              <p className="type-caption text-slate-500">Apply text or image watermark to pages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Hidden image input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Watermark Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ type: 'text' })}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  settings.type === 'text'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fas fa-font mr-2"></i>
                Text
              </button>
              <button
                onClick={() => updateSettings({ type: 'image' })}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  settings.type === 'image'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <i className="fas fa-image mr-2"></i>
                Image
              </button>
            </div>
          </div>

          {/* Text settings */}
          {settings.type === 'text' && (
            <>
              {/* Text input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Text</label>
                <input
                  type="text"
                  value={settings.text}
                  onChange={(e) => updateSettings({ text: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter watermark text..."
                />
                {/* Preset texts */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_TEXTS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => updateSettings({ text: preset })}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        settings.text === preset
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Font</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={settings.fontSize}
                      onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="w-12 text-center text-sm text-slate-600">{settings.fontSize}pt</span>
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => updateSettings({ color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200"
                  />
                  <input
                    type="text"
                    value={settings.color}
                    onChange={(e) => updateSettings({ color: e.target.value })}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Image settings */}
          {settings.type === 'image' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Image</label>
              {settings.imageData ? (
                <div className="relative">
                  <img
                    src={settings.imageData}
                    alt="Watermark"
                    className="w-full max-h-32 object-contain bg-slate-50 rounded-xl border border-slate-200"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="absolute top-2 right-2 px-3 py-1 bg-white/90 text-sm text-slate-600 rounded-lg hover:bg-white transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  <i className="fas fa-cloud-upload-alt text-2xl mb-2"></i>
                  <p className="text-sm">Click to upload image</p>
                </button>
              )}
            </div>
          )}

          {/* Common settings */}
          <div className="grid grid-cols-2 gap-4">
            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Opacity</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={settings.opacity}
                  onChange={(e) => updateSettings({ opacity: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-12 text-center text-sm text-slate-600">{settings.opacity}%</span>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rotation</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={settings.rotation}
                  onChange={(e) => updateSettings({ rotation: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-12 text-center text-sm text-slate-600">{settings.rotation}°</span>
              </div>
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {POSITION_OPTIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => updateSettings({ position: pos.value as any })}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    settings.position === pos.value
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <i className={`${pos.icon} mr-1`}></i>
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Apply to Pages</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All Pages' },
                { value: 'even', label: 'Even Pages' },
                { value: 'odd', label: 'Odd Pages' },
                { value: 'range', label: 'Custom Range' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ applyTo: opt.value as any })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    settings.applyTo === opt.value
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {settings.applyTo === 'range' && (
              <input
                type="text"
                value={settings.pageRange || ''}
                onChange={(e) => updateSettings({ pageRange: e.target.value })}
                placeholder="e.g., 1-5, 8, 10-12"
                className="mt-2 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
            <div className="bg-slate-100 rounded-xl p-8 flex items-center justify-center min-h-[120px]">
              <div
                style={{
                  transform: `rotate(${settings.rotation}deg)`,
                  opacity: settings.opacity / 100,
                }}
              >
                {settings.type === 'text' ? (
                  <span
                    style={{
                      fontSize: `${Math.min(settings.fontSize, 48)}px`,
                      fontFamily: settings.fontFamily,
                      color: settings.color,
                    }}
                  >
                    {settings.text || 'Watermark'}
                  </span>
                ) : settings.imageData ? (
                  <img
                    src={settings.imageData}
                    alt="Preview"
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-400">No image selected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            <i className="fas fa-info-circle mr-2"></i>
            Will be applied to {settings.applyTo === 'all' ? 'all' : settings.applyTo === 'range' ? 'selected' : settings.applyTo} {totalPages} pages
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying || (settings.type === 'image' && !settings.imageData)}
              className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                !isApplying && (settings.type === 'text' || settings.imageData)
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isApplying ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Applying...
                </>
              ) : (
                <>
                  <i className="fas fa-stamp"></i>
                  Apply Watermark
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatermarkPanel;
