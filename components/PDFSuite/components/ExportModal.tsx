// ============================================
// ExportModal Component
// PDF export with format and quality options
// ============================================

import React, { useState, useCallback, useMemo } from 'react';

type ExportFormat = 'pdf' | 'pdfa' | 'image' | 'print';
type ImageFormat = 'png' | 'jpg' | 'webp';
type PDFVersion = '1.4' | '1.5' | '1.6' | '1.7' | '2.0';
type ImageQuality = 'low' | 'medium' | 'high' | 'maximum';

interface ExportOptions {
  format: ExportFormat;
  // PDF options
  pdfVersion?: PDFVersion;
  linearize?: boolean; // Fast web view
  embedFonts?: boolean;
  flattenAnnotations?: boolean;
  flattenForms?: boolean;
  // PDF/A options
  pdfaLevel?: '1b' | '2b' | '3b';
  // Image options
  imageFormat?: ImageFormat;
  imageQuality?: ImageQuality;
  imageDpi?: number;
  exportPages?: 'all' | 'current' | 'range';
  pageRange?: string;
  // Compression
  compressImages?: boolean;
  compressionLevel?: 'none' | 'low' | 'medium' | 'high';
  // Security
  password?: string;
  permissions?: {
    print: boolean;
    copy: boolean;
    modify: boolean;
    annotate: boolean;
  };
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  documentName?: string;
  totalPages?: number;
  currentPage?: number;
  className?: string;
}

const EXPORT_FORMATS: { id: ExportFormat; label: string; icon: string; description: string }[] = [
  { id: 'pdf', label: 'PDF Document', icon: 'fa-file-pdf', description: 'Standard PDF with optional compression' },
  { id: 'pdfa', label: 'PDF/A Archive', icon: 'fa-archive', description: 'Long-term archival format' },
  { id: 'image', label: 'Images', icon: 'fa-images', description: 'Export pages as image files' },
  { id: 'print', label: 'Print', icon: 'fa-print', description: 'Send directly to printer' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  documentName = 'document',
  totalPages = 1,
  currentPage = 1,
  className = '',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    pdfVersion: '1.7',
    linearize: true,
    embedFonts: true,
    flattenAnnotations: false,
    flattenForms: false,
    pdfaLevel: '2b',
    imageFormat: 'png',
    imageQuality: 'high',
    imageDpi: 300,
    exportPages: 'all',
    pageRange: '',
    compressImages: true,
    compressionLevel: 'medium',
    permissions: {
      print: true,
      copy: true,
      modify: true,
      annotate: true,
    },
  });
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'format' | 'pages' | 'security'>('format');

  // Get estimated file size
  const estimatedSize = useMemo(() => {
    let base = 500; // Base KB
    if (options.compressionLevel === 'none') base *= 2;
    if (options.compressionLevel === 'low') base *= 1.5;
    if (options.compressionLevel === 'high') base *= 0.6;
    if (options.embedFonts) base += 200;
    base *= totalPages;

    if (base < 1024) return `~${Math.round(base)} KB`;
    return `~${(base / 1024).toFixed(1)} MB`;
  }, [options.compressionLevel, options.embedFonts, totalPages]);

  // Handle format change
  const handleFormatChange = useCallback((format: ExportFormat) => {
    setSelectedFormat(format);
    setOptions((prev) => ({ ...prev, format }));
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90));
      }, 150);

      await onExport({ ...options, format: selectedFormat });

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setProgress(0);
    }
  }, [options, selectedFormat, onExport, onClose]);

  // Parse page range
  const getPageCount = useCallback((): number => {
    if (options.exportPages === 'all') return totalPages;
    if (options.exportPages === 'current') return 1;

    // Parse range like "1-5, 8, 10-12"
    const ranges = options.pageRange?.split(',') || [];
    let count = 0;
    ranges.forEach((range) => {
      const parts = range.trim().split('-');
      if (parts.length === 2) {
        const start = parseInt(parts[0]!);
        const end = parseInt(parts[1]!);
        if (!isNaN(start) && !isNaN(end)) {
          count += Math.max(0, end - start + 1);
        }
      } else if (parts.length === 1) {
        if (!isNaN(parseInt(parts[0]!))) count++;
      }
    });
    return count || totalPages;
  }, [options.exportPages, options.pageRange, totalPages]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[700px] max-w-[90vw] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-file-export text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Export Document</h2>
              <p className="text-xs text-white/70">{documentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Format selector */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-2">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => handleFormatChange(format.id)}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                  selectedFormat === format.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <i className={`fas ${format.icon} ${selectedFormat === format.id ? 'text-emerald-500' : 'text-slate-400'}`}></i>
                  <span className={`text-sm font-bold ${selectedFormat === format.id ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {format.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{format.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: 'format', label: 'Format Options', icon: 'fa-cog' },
            { id: 'pages', label: 'Page Range', icon: 'fa-file-alt' },
            { id: 'security', label: 'Security', icon: 'fa-lock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {/* Format Options Tab */}
          {activeTab === 'format' && (
            <div className="space-y-6">
              {/* PDF Options */}
              {(selectedFormat === 'pdf' || selectedFormat === 'pdfa') && (
                <>
                  {selectedFormat === 'pdf' && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                        PDF Version
                      </label>
                      <select
                        value={options.pdfVersion}
                        onChange={(e) => setOptions({ ...options, pdfVersion: e.target.value as PDFVersion })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="1.4">PDF 1.4 (Acrobat 5)</option>
                        <option value="1.5">PDF 1.5 (Acrobat 6)</option>
                        <option value="1.6">PDF 1.6 (Acrobat 7)</option>
                        <option value="1.7">PDF 1.7 (Acrobat 8+)</option>
                        <option value="2.0">PDF 2.0 (Latest)</option>
                      </select>
                    </div>
                  )}

                  {selectedFormat === 'pdfa' && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                        PDF/A Conformance Level
                      </label>
                      <select
                        value={options.pdfaLevel}
                        onChange={(e) => setOptions({ ...options, pdfaLevel: e.target.value as '1b' | '2b' | '3b' })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="1b">PDF/A-1b (Basic)</option>
                        <option value="2b">PDF/A-2b (Recommended)</option>
                        <option value="3b">PDF/A-3b (With Attachments)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                      Compression
                    </label>
                    <select
                      value={options.compressionLevel}
                      onChange={(e) => setOptions({ ...options, compressionLevel: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="none">None (Largest file)</option>
                      <option value="low">Low (Better quality)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Smallest file)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.embedFonts}
                        onChange={(e) => setOptions({ ...options, embedFonts: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Embed all fonts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.linearize}
                        onChange={(e) => setOptions({ ...options, linearize: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Optimize for fast web view</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.flattenAnnotations}
                        onChange={(e) => setOptions({ ...options, flattenAnnotations: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Flatten annotations</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.flattenForms}
                        onChange={(e) => setOptions({ ...options, flattenForms: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">Flatten form fields</span>
                    </label>
                  </div>
                </>
              )}

              {/* Image Options */}
              {selectedFormat === 'image' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                        Image Format
                      </label>
                      <select
                        value={options.imageFormat}
                        onChange={(e) => setOptions({ ...options, imageFormat: e.target.value as ImageFormat })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="png">PNG (Lossless)</option>
                        <option value="jpg">JPEG (Smaller)</option>
                        <option value="webp">WebP (Modern)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                        Quality
                      </label>
                      <select
                        value={options.imageQuality}
                        onChange={(e) => setOptions({ ...options, imageQuality: e.target.value as ImageQuality })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="low">Low (72 DPI)</option>
                        <option value="medium">Medium (150 DPI)</option>
                        <option value="high">High (300 DPI)</option>
                        <option value="maximum">Maximum (600 DPI)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                      Custom DPI
                    </label>
                    <input
                      type="number"
                      value={options.imageDpi}
                      onChange={(e) => setOptions({ ...options, imageDpi: parseInt(e.target.value) || 300 })}
                      min={72}
                      max={1200}
                      className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All pages', desc: `Export all ${totalPages} pages` },
                  { value: 'current', label: 'Current page', desc: `Export page ${currentPage} only` },
                  { value: 'range', label: 'Page range', desc: 'Specify pages to export' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      options.exportPages === opt.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportPages"
                      value={opt.value}
                      checked={options.exportPages === opt.value}
                      onChange={(e) => setOptions({ ...options, exportPages: e.target.value as any })}
                      className="w-4 h-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {options.exportPages === 'range' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                    Page Range
                  </label>
                  <input
                    type="text"
                    value={options.pageRange}
                    onChange={(e) => setOptions({ ...options, pageRange: e.target.value })}
                    placeholder="e.g., 1-5, 8, 10-12"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Separate pages with commas, use dash for ranges
                  </p>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Pages to export:</span>
                  <span className="font-bold text-slate-800">{getPageCount()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && selectedFormat !== 'image' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                  Password Protection
                </label>
                <input
                  type="password"
                  value={options.password || ''}
                  onChange={(e) => setOptions({ ...options, password: e.target.value })}
                  placeholder="Leave empty for no password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {options.password && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">
                    Permissions
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: 'print', label: 'Allow printing' },
                      { key: 'copy', label: 'Allow copying text' },
                      { key: 'modify', label: 'Allow modifications' },
                      { key: 'annotate', label: 'Allow annotations' },
                    ].map((perm) => (
                      <label key={perm.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.permissions?.[perm.key as keyof typeof options.permissions] ?? true}
                          onChange={(e) =>
                            setOptions({
                              ...options,
                              permissions: {
                                ...options.permissions!,
                                [perm.key]: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && selectedFormat === 'image' && (
                <div className="py-8 text-center text-slate-400">
                  <i className="fas fa-info-circle text-2xl mb-2"></i>
                  <p className="text-sm">Security options are not available for image export</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-500">
            <i className="fas fa-file mr-2"></i>
            Estimated size: <span className="font-medium text-slate-700">{estimatedSize}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Exporting... {progress}%
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
