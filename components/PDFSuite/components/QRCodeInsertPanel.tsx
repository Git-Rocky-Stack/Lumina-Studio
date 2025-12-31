// ============================================
// QRCodeInsertPanel Component
// Insert QR codes into PDF pages
// ============================================

import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface QRCodeInsertSettings {
  content: string;
  type: 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard';
  size: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  foreground: string;
  background: string;
  margin: number;
  pageNumber: number;
}

interface QRCodeInsertPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (qrCodeDataUrl: string, settings: QRCodeInsertSettings) => void;
  currentPage: number;
  totalPages: number;
  className?: string;
}

const QR_TYPES = [
  { id: 'url', label: 'URL', icon: 'fas fa-link', placeholder: 'https://example.com' },
  { id: 'text', label: 'Text', icon: 'fas fa-font', placeholder: 'Enter your text' },
  { id: 'email', label: 'Email', icon: 'fas fa-envelope', placeholder: 'email@example.com' },
  { id: 'phone', label: 'Phone', icon: 'fas fa-phone', placeholder: '+1234567890' },
  { id: 'sms', label: 'SMS', icon: 'fas fa-sms', placeholder: '+1234567890' },
  { id: 'wifi', label: 'WiFi', icon: 'fas fa-wifi', placeholder: 'Network name' },
  { id: 'vcard', label: 'Contact', icon: 'fas fa-address-card', placeholder: 'Name' },
];

const ERROR_LEVELS = [
  { id: 'L', label: 'Low (7%)', desc: 'Smallest code' },
  { id: 'M', label: 'Medium (15%)', desc: 'Balanced' },
  { id: 'Q', label: 'Quartile (25%)', desc: 'Better recovery' },
  { id: 'H', label: 'High (30%)', desc: 'Best recovery' },
];

const DEFAULT_SETTINGS: QRCodeInsertSettings = {
  content: '',
  type: 'url',
  size: 150,
  errorCorrection: 'M',
  foreground: '#000000',
  background: '#ffffff',
  margin: 4,
  pageNumber: 1,
};

// Generate QR code using free API
const generateQRCode = async (
  content: string,
  size: number,
  foreground: string,
  background: string,
  margin: number,
  errorLevel: string
): Promise<string> => {
  const params = new URLSearchParams({
    data: content,
    size: `${size}x${size}`,
    color: foreground.replace('#', ''),
    bgcolor: background.replace('#', ''),
    margin: margin.toString(),
    ecc: errorLevel,
    format: 'png',
  });

  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;

  try {
    const response = await fetch(apiUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // Fallback: generate a simple placeholder
    return generateFallbackQR(content, size, foreground, background);
  }
};

// Fallback QR code placeholder
const generateFallbackQR = (
  content: string,
  size: number,
  foreground: string,
  background: string
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = foreground;
    const blockSize = size / 25;
    const hash = content.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);

    // Corner finder patterns
    const drawCorner = (x: number, y: number) => {
      ctx.fillRect(x, y, blockSize * 7, blockSize);
      ctx.fillRect(x, y, blockSize, blockSize * 7);
      ctx.fillRect(x + blockSize * 6, y, blockSize, blockSize * 7);
      ctx.fillRect(x, y + blockSize * 6, blockSize * 7, blockSize);
      ctx.fillRect(x + blockSize * 2, y + blockSize * 2, blockSize * 3, blockSize * 3);
    };

    drawCorner(blockSize, blockSize);
    drawCorner(size - blockSize * 8, blockSize);
    drawCorner(blockSize, size - blockSize * 8);

    // Data pattern
    for (let i = 0; i < 80; i++) {
      const x = ((Math.abs(hash * (i + 1) * 17) % 15) + 9) * blockSize;
      const y = ((Math.abs(hash * (i + 1) * 23) % 15) + 9) * blockSize;
      if (x < size - blockSize * 2 && y < size - blockSize * 2) {
        ctx.fillRect(x, y, blockSize, blockSize);
      }
    }
  }

  return canvas.toDataURL('image/png');
};

// Format content for QR code type
const formatContent = (type: string, content: string, extras?: Record<string, string>): string => {
  switch (type) {
    case 'url':
      return content.startsWith('http') ? content : `https://${content}`;
    case 'email':
      return `mailto:${content}${extras?.subject ? `?subject=${encodeURIComponent(extras.subject)}` : ''}`;
    case 'phone':
      return `tel:${content.replace(/[^\d+]/g, '')}`;
    case 'sms':
      return `sms:${content.replace(/[^\d+]/g, '')}${extras?.message ? `?body=${encodeURIComponent(extras.message)}` : ''}`;
    case 'wifi':
      return `WIFI:T:${extras?.encryption || 'WPA'};S:${content};P:${extras?.password || ''};;`;
    case 'vcard':
      return `BEGIN:VCARD\nVERSION:3.0\nN:${content}\nFN:${content}\nTEL:${extras?.phone || ''}\nEMAIL:${extras?.email || ''}\nEND:VCARD`;
    default:
      return content;
  }
};

export const QRCodeInsertPanel: React.FC<QRCodeInsertPanelProps> = ({
  isOpen,
  onClose,
  onInsert,
  currentPage,
  totalPages,
  className = '',
}) => {
  const [settings, setSettings] = useState<QRCodeInsertSettings>({
    ...DEFAULT_SETTINGS,
    pageNumber: currentPage,
  });
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setSettings((prev) => ({ ...prev, pageNumber: currentPage }));
  }, [currentPage]);

  // Generate preview with debounce
  useEffect(() => {
    if (!settings.content.trim()) {
      setPreviewUrl('');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsGenerating(true);
      try {
        const formatted = formatContent(settings.type, settings.content, extras);
        const dataUrl = await generateQRCode(
          formatted,
          settings.size,
          settings.foreground,
          settings.background,
          settings.margin,
          settings.errorCorrection
        );
        setPreviewUrl(dataUrl);
      } catch (error) {
        console.error('QR generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [settings, extras]);

  const updateSettings = useCallback((updates: Partial<QRCodeInsertSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleInsert = useCallback(async () => {
    if (!previewUrl || !settings.content.trim()) return;

    setIsInserting(true);
    try {
      onInsert(previewUrl, settings);
      onClose();
    } finally {
      setIsInserting(false);
    }
  }, [previewUrl, settings, onInsert, onClose]);

  const currentType = QR_TYPES.find((t) => t.id === settings.type);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-qrcode text-violet-600"></i>
            </div>
            <div>
              <h2 className="type-section text-slate-800">Insert QR Code</h2>
              <p className="type-caption text-slate-500">Generate and insert a QR code into your PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-6">
            {/* Left: Settings */}
            <div className="flex-1 space-y-4">
              {/* QR Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {QR_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        updateSettings({ type: type.id as any, content: '' });
                        setExtras({});
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                        settings.type === type.id
                          ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <i className={type.icon}></i>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {currentType?.label}
                </label>
                <input
                  type="text"
                  value={settings.content}
                  onChange={(e) => updateSettings({ content: e.target.value })}
                  placeholder={currentType?.placeholder}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Type-specific extras */}
              {settings.type === 'email' && (
                <input
                  type="text"
                  value={extras.subject || ''}
                  onChange={(e) => setExtras({ ...extras, subject: e.target.value })}
                  placeholder="Subject (optional)"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              )}

              {settings.type === 'sms' && (
                <textarea
                  value={extras.message || ''}
                  onChange={(e) => setExtras({ ...extras, message: e.target.value })}
                  placeholder="Message (optional)"
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              )}

              {settings.type === 'wifi' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={extras.password || ''}
                    onChange={(e) => setExtras({ ...extras, password: e.target.value })}
                    placeholder="Password"
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <select
                    value={extras.encryption || 'WPA'}
                    onChange={(e) => setExtras({ ...extras, encryption: e.target.value })}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None</option>
                  </select>
                </div>
              )}

              {settings.type === 'vcard' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={extras.phone || ''}
                    onChange={(e) => setExtras({ ...extras, phone: e.target.value })}
                    placeholder="Phone"
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <input
                    type="email"
                    value={extras.email || ''}
                    onChange={(e) => setExtras({ ...extras, email: e.target.value })}
                    placeholder="Email"
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              )}

              {/* Size and Error Correction */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Size: {settings.size}px
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="300"
                    step="10"
                    value={settings.size}
                    onChange={(e) => updateSettings({ size: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Error Correction</label>
                  <select
                    value={settings.errorCorrection}
                    onChange={(e) => updateSettings({ errorCorrection: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {ERROR_LEVELS.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Foreground</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.foreground}
                      onChange={(e) => updateSettings({ foreground: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                    />
                    <input
                      type="text"
                      value={settings.foreground}
                      onChange={(e) => updateSettings({ foreground: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.background}
                      onChange={(e) => updateSettings({ background: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                    />
                    <input
                      type="text"
                      value={settings.background}
                      onChange={(e) => updateSettings({ background: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Page selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Insert on page</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSettings({ pageNumber: Math.max(1, settings.pageNumber - 1) })}
                    disabled={settings.pageNumber <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <span className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm min-w-[80px] text-center">
                    {settings.pageNumber} / {totalPages}
                  </span>
                  <button
                    onClick={() => updateSettings({ pageNumber: Math.min(totalPages, settings.pageNumber + 1) })}
                    disabled={settings.pageNumber >= totalPages}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="w-56 flex-shrink-0">
              <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
              <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[180px]">
                {isGenerating ? (
                  <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-2xl text-violet-500 mb-2"></i>
                    <p className="type-caption text-slate-500">Generating...</p>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="QR Preview"
                    className="max-w-full max-h-40 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="text-center">
                    <i className="fas fa-qrcode text-4xl text-slate-300 mb-2"></i>
                    <p className="type-caption text-slate-400">Enter content</p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-violet-50 rounded-xl">
                <p className="type-caption text-violet-700 flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5"></i>
                  <span>The QR code will be inserted as an image that can be moved and resized.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={isInserting || !previewUrl || !settings.content.trim()}
            className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
              !isInserting && previewUrl && settings.content.trim()
                ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isInserting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Inserting...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i>
                Insert QR Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeInsertPanel;
