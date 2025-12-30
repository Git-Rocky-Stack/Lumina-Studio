// ============================================
// SplitPanel - PDF Split/Page Extraction
// ============================================

import React, { useState, useCallback, useMemo } from 'react';

// Types
type SplitMode = 'range' | 'extract' | 'every' | 'size' | 'bookmarks';

interface PageRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

interface SplitOptions {
  mode: SplitMode;
  ranges: PageRange[];
  extractPages: number[];
  everyNPages: number;
  maxFileSize: number; // in MB
  outputPrefix: string;
  keepOriginal: boolean;
}

interface SplitPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSplit: (options: SplitOptions) => Promise<void>;
  totalPages: number;
  documentName: string;
  className?: string;
}

// Helper
const generateId = () => Math.random().toString(36).substring(2, 9);

export const SplitPanel: React.FC<SplitPanelProps> = ({
  isOpen,
  onClose,
  onSplit,
  totalPages,
  documentName,
  className = ''
}) => {
  // State
  const [mode, setMode] = useState<SplitMode>('range');
  const [ranges, setRanges] = useState<PageRange[]>([
    { id: generateId(), start: 1, end: Math.min(5, totalPages), name: 'Part 1' }
  ]);
  const [extractPages, setExtractPages] = useState<number[]>([1]);
  const [everyNPages, setEveryNPages] = useState(5);
  const [maxFileSize, setMaxFileSize] = useState(10);
  const [outputPrefix, setOutputPrefix] = useState(documentName.replace('.pdf', ''));
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [isSplitting, setIsSplitting] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('1');

  // Split mode options
  const splitModes = [
    { id: 'range' as SplitMode, label: 'By Range', icon: '📄', desc: 'Split into custom page ranges' },
    { id: 'extract' as SplitMode, label: 'Extract Pages', icon: '📋', desc: 'Extract specific pages' },
    { id: 'every' as SplitMode, label: 'Every N Pages', icon: '📑', desc: 'Split every N pages' },
    { id: 'size' as SplitMode, label: 'By Size', icon: '📦', desc: 'Split by file size limit' },
    { id: 'bookmarks' as SplitMode, label: 'By Bookmarks', icon: '🔖', desc: 'Split at bookmark points' }
  ];

  // Calculate output files
  const outputInfo = useMemo(() => {
    switch (mode) {
      case 'range':
        return { count: ranges.length, pages: ranges.reduce((sum, r) => sum + (r.end - r.start + 1), 0) };
      case 'extract':
        return { count: 1, pages: extractPages.length };
      case 'every':
        return { count: Math.ceil(totalPages / everyNPages), pages: totalPages };
      case 'size':
        return { count: '~2-5', pages: totalPages };
      case 'bookmarks':
        return { count: '~3-10', pages: totalPages };
      default:
        return { count: 0, pages: 0 };
    }
  }, [mode, ranges, extractPages, everyNPages, totalPages]);

  // Add range
  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newStart = lastRange ? Math.min(lastRange.end + 1, totalPages) : 1;
    const newEnd = Math.min(newStart + 4, totalPages);

    setRanges([
      ...ranges,
      {
        id: generateId(),
        start: newStart,
        end: newEnd,
        name: `Part ${ranges.length + 1}`
      }
    ]);
  };

  // Update range
  const updateRange = (id: string, field: 'start' | 'end' | 'name', value: number | string) => {
    setRanges(prev => prev.map(r => {
      if (r.id !== id) return r;

      if (field === 'name') {
        return { ...r, name: value as string };
      }

      const numValue = Math.max(1, Math.min(totalPages, value as number));
      if (field === 'start') {
        return { ...r, start: numValue, end: Math.max(numValue, r.end) };
      }
      return { ...r, end: numValue, start: Math.min(numValue, r.start) };
    }));
  };

  // Remove range
  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges(prev => prev.filter(r => r.id !== id));
    }
  };

  // Toggle page for extraction
  const togglePage = (pageNum: number) => {
    setExtractPages(prev =>
      prev.includes(pageNum)
        ? prev.filter(p => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  // Parse page input (e.g., "1, 3, 5-10")
  const parsePageInput = useCallback((input: string) => {
    const pages: number[] = [];
    const parts = input.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= totalPages && !pages.includes(num)) {
          pages.push(num);
        }
      }
    }

    return pages.sort((a, b) => a - b);
  }, [totalPages]);

  // Handle page input change
  const handlePageInputChange = (value: string) => {
    setPageInputValue(value);
    const pages = parsePageInput(value);
    setExtractPages(pages);
  };

  // Handle split
  const handleSplit = async () => {
    setIsSplitting(true);
    try {
      await onSplit({
        mode,
        ranges,
        extractPages,
        everyNPages,
        maxFileSize,
        outputPrefix,
        keepOriginal
      });
      onClose();
    } catch (error) {
      console.error('Split failed:', error);
    } finally {
      setIsSplitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-[#1a1a2e] w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h2 className="type-subsection text-white">Split PDF</h2>
              <p className="text-sm text-white/50">{documentName} • {totalPages} pages</p>
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
          {/* Mode Selection */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {splitModes.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-3 rounded-xl text-center transition-all ${
                  mode === m.id
                    ? 'bg-purple-500/20 border-2 border-purple-500'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                }`}
              >
                <span className="text-2xl block mb-1">{m.icon}</span>
                <span className="text-xs text-white/70 block">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Mode-specific content */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            {mode === 'range' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Custom Ranges</span>
                  <button
                    onClick={addRange}
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Range
                  </button>
                </div>

                {ranges.map((range, index) => (
                  <div key={range.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                    <span className="text-white/40 text-sm w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={range.name}
                      onChange={(e) => updateRange(range.id, 'name', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
                      placeholder="Output name"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-sm">Pages</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={range.start}
                        onChange={(e) => updateRange(range.id, 'start', parseInt(e.target.value))}
                        className="w-16 px-2 py-1.5 bg-white/10 rounded-lg text-white text-sm text-center border border-white/10 focus:border-purple-500/50 focus:outline-none"
                      />
                      <span className="text-white/50">to</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={range.end}
                        onChange={(e) => updateRange(range.id, 'end', parseInt(e.target.value))}
                        className="w-16 px-2 py-1.5 bg-white/10 rounded-lg text-white text-sm text-center border border-white/10 focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeRange(range.id)}
                      disabled={ranges.length === 1}
                      className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {mode === 'extract' && (
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Enter page numbers (e.g., 1, 3, 5-10)
                </label>
                <input
                  type="text"
                  value={pageInputValue}
                  onChange={(e) => handlePageInputChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-white border border-white/10 focus:border-purple-500/50 focus:outline-none mb-4"
                  placeholder="1, 3, 5-10"
                />

                {/* Visual page selector */}
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(totalPages, 30) }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => togglePage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        extractPages.includes(pageNum)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  {totalPages > 30 && (
                    <div className="flex items-center px-3 text-white/40 text-sm">
                      +{totalPages - 30} more pages
                    </div>
                  )}
                </div>

                <p className="text-sm text-white/50 mt-3">
                  {extractPages.length} page{extractPages.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {mode === 'every' && (
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Split every N pages
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={Math.min(totalPages, 50)}
                    value={everyNPages}
                    onChange={(e) => setEveryNPages(parseInt(e.target.value))}
                    className="flex-1 accent-purple-500"
                  />
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={everyNPages}
                    onChange={(e) => setEveryNPages(Math.max(1, Math.min(totalPages, parseInt(e.target.value))))}
                    className="w-20 px-3 py-2 bg-white/10 rounded-lg text-white text-center border border-white/10 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <p className="text-sm text-white/50 mt-3">
                  This will create {Math.ceil(totalPages / everyNPages)} file{Math.ceil(totalPages / everyNPages) !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {mode === 'size' && (
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Maximum file size (MB)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={maxFileSize}
                    onChange={(e) => setMaxFileSize(parseInt(e.target.value))}
                    className="flex-1 accent-purple-500"
                  />
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={maxFileSize}
                    onChange={(e) => setMaxFileSize(Math.max(1, Math.min(100, parseInt(e.target.value))))}
                    className="w-20 px-3 py-2 bg-white/10 rounded-lg text-white text-center border border-white/10 focus:border-purple-500/50 focus:outline-none"
                  />
                  <span className="text-white/50">MB</span>
                </div>
                <p className="text-sm text-white/50 mt-3">
                  Split when file exceeds {maxFileSize} MB
                </p>
              </div>
            )}

            {mode === 'bookmarks' && (
              <div className="text-center py-4">
                <svg className="w-12 h-12 mx-auto text-white/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <p className="text-white/70 mb-2">Split at bookmark boundaries</p>
                <p className="text-white/40 text-sm">
                  Each top-level bookmark will become a separate file
                </p>
              </div>
            )}
          </div>

          {/* Output Settings */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="type-body-sm font-semibold text-white mb-3">Output Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Filename prefix</label>
                <input
                  type="text"
                  value={outputPrefix}
                  onChange={(e) => setOutputPrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
                  placeholder="document"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepOriginal}
                    onChange={(e) => setKeepOriginal(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  Keep original file
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <span className="text-xs text-white/50">Output preview:</span>
              <div className="mt-1 text-sm text-white/70">
                {mode === 'range' && ranges.map((r, i) => (
                  <div key={r.id}>{outputPrefix}_{r.name || `part${i + 1}`}.pdf</div>
                ))}
                {mode === 'extract' && <div>{outputPrefix}_extracted.pdf</div>}
                {mode === 'every' && (
                  <>
                    <div>{outputPrefix}_001.pdf</div>
                    {Math.ceil(totalPages / everyNPages) > 1 && <div>{outputPrefix}_002.pdf</div>}
                    {Math.ceil(totalPages / everyNPages) > 2 && <div className="text-white/40">...</div>}
                  </>
                )}
                {mode === 'size' && <div>{outputPrefix}_001.pdf, {outputPrefix}_002.pdf, ...</div>}
                {mode === 'bookmarks' && <div>{outputPrefix}_[bookmark-name].pdf</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
          <div className="text-sm text-white/50">
            Will create {outputInfo.count} file{typeof outputInfo.count === 'number' && outputInfo.count !== 1 ? 's' : ''}
            {' '}with {outputInfo.pages} pages total
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSplit}
              disabled={isSplitting || (mode === 'extract' && extractPages.length === 0)}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSplitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Splitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Split PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPanel;
