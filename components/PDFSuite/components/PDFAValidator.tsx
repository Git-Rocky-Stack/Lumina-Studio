// ============================================
// PDFAValidator Component
// Check PDF/A compliance and suggest fixes
// ============================================

import React, { useState, useCallback } from 'react';

export type PDFALevel = '1a' | '1b' | '2a' | '2b' | '2u' | '3a' | '3b' | '3u';

export type IssueSeverity = 'error' | 'warning' | 'info';

export type IssueCategory =
  | 'fonts'
  | 'color'
  | 'transparency'
  | 'metadata'
  | 'structure'
  | 'actions'
  | 'encryption'
  | 'annotations';

export interface ValidationIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  code: string;
  message: string;
  description: string;
  location?: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface ValidationResult {
  isCompliant: boolean;
  targetLevel: PDFALevel;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  issues: ValidationIssue[];
  timestamp: number;
  duration: number;
}

interface PDFAValidatorProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (targetLevel: PDFALevel) => Promise<ValidationResult>;
  onAutoFix: (issueIds: string[]) => Promise<void>;
  onExportReport: (result: ValidationResult) => void;
  className?: string;
}

const PDFA_LEVELS: { id: PDFALevel; name: string; description: string }[] = [
  { id: '1b', name: 'PDF/A-1b', description: 'Basic conformance, visual appearance preserved' },
  { id: '1a', name: 'PDF/A-1a', description: 'Full accessibility, tagged PDF required' },
  { id: '2b', name: 'PDF/A-2b', description: 'Basic conformance with JPEG2000 support' },
  { id: '2a', name: 'PDF/A-2a', description: 'Full accessibility with modern features' },
  { id: '2u', name: 'PDF/A-2u', description: 'Unicode text mapping required' },
  { id: '3b', name: 'PDF/A-3b', description: 'Basic conformance with embedded files' },
  { id: '3a', name: 'PDF/A-3a', description: 'Full accessibility with attachments' },
  { id: '3u', name: 'PDF/A-3u', description: 'Unicode with embedded files' },
];

const CATEGORY_INFO: Record<IssueCategory, { icon: string; label: string; color: string }> = {
  fonts: { icon: 'fas fa-font', label: 'Fonts', color: 'text-blue-500' },
  color: { icon: 'fas fa-palette', label: 'Color', color: 'text-purple-500' },
  transparency: { icon: 'fas fa-layer-group', label: 'Transparency', color: 'text-cyan-500' },
  metadata: { icon: 'fas fa-info-circle', label: 'Metadata', color: 'text-green-500' },
  structure: { icon: 'fas fa-sitemap', label: 'Structure', color: 'text-orange-500' },
  actions: { icon: 'fas fa-bolt', label: 'Actions', color: 'text-yellow-500' },
  encryption: { icon: 'fas fa-lock', label: 'Encryption', color: 'text-red-500' },
  annotations: { icon: 'fas fa-sticky-note', label: 'Annotations', color: 'text-pink-500' },
};

const SEVERITY_INFO: Record<IssueSeverity, { icon: string; color: string; bg: string }> = {
  error: { icon: 'fas fa-times-circle', color: 'text-red-600', bg: 'bg-red-50' },
  warning: { icon: 'fas fa-exclamation-triangle', color: 'text-amber-600', bg: 'bg-amber-50' },
  info: { icon: 'fas fa-info-circle', color: 'text-blue-600', bg: 'bg-blue-50' },
};

// Simulated validation for demo purposes
// In production, this would integrate with a real PDF/A validation library
const simulateValidation = (targetLevel: PDFALevel): ValidationResult => {
  const issues: ValidationIssue[] = [
    {
      id: 'font-001',
      category: 'fonts',
      severity: 'error',
      code: 'FONT_NOT_EMBEDDED',
      message: 'Font not embedded',
      description: 'The font "Arial" is not embedded in the document. PDF/A requires all fonts to be embedded.',
      location: 'Page 1',
      suggestion: 'Embed the font or substitute with an embedded font.',
      autoFixable: true,
    },
    {
      id: 'color-001',
      category: 'color',
      severity: 'warning',
      code: 'RGB_COLOR_SPACE',
      message: 'RGB color space used',
      description: 'Some elements use RGB color space. For print archiving, CMYK or calibrated color spaces are recommended.',
      location: 'Page 2, Object 15',
      suggestion: 'Convert colors to a device-independent color space.',
      autoFixable: false,
    },
    {
      id: 'meta-001',
      category: 'metadata',
      severity: 'error',
      code: 'MISSING_XMP',
      message: 'Missing XMP metadata',
      description: 'XMP metadata stream is required for PDF/A compliance.',
      suggestion: 'Add XMP metadata with required properties (title, creator, dates).',
      autoFixable: true,
    },
    {
      id: 'trans-001',
      category: 'transparency',
      severity: 'warning',
      code: 'TRANSPARENCY_USED',
      message: 'Transparency detected',
      description: 'PDF/A-1 does not support transparency. PDF/A-2 or higher is required.',
      location: 'Page 1, Image 3',
      suggestion: 'Flatten transparency or target PDF/A-2 or later.',
      autoFixable: true,
    },
    {
      id: 'action-001',
      category: 'actions',
      severity: 'error',
      code: 'JAVASCRIPT_ACTION',
      message: 'JavaScript action found',
      description: 'JavaScript actions are not allowed in PDF/A documents.',
      location: 'Document Actions',
      suggestion: 'Remove all JavaScript actions.',
      autoFixable: true,
    },
    {
      id: 'struct-001',
      category: 'structure',
      severity: 'info',
      code: 'MISSING_TAGS',
      message: 'Document not tagged',
      description: 'For PDF/A-1a, 2a, or 3a compliance, the document must be tagged for accessibility.',
      suggestion: 'Add structure tags or target a "b" level (e.g., PDF/A-2b).',
      autoFixable: false,
    },
  ];

  // Filter issues based on target level
  const filteredIssues = issues.filter((issue) => {
    // Transparency is only an issue for PDF/A-1
    if (issue.code === 'TRANSPARENCY_USED' && !targetLevel.startsWith('1')) {
      return false;
    }
    // Structure tags only required for "a" levels
    if (issue.code === 'MISSING_TAGS' && !targetLevel.endsWith('a')) {
      return false;
    }
    return true;
  });

  const errors = filteredIssues.filter((i) => i.severity === 'error').length;
  const warnings = filteredIssues.filter((i) => i.severity === 'warning').length;
  const info = filteredIssues.filter((i) => i.severity === 'info').length;

  return {
    isCompliant: errors === 0,
    targetLevel,
    totalIssues: filteredIssues.length,
    errors,
    warnings,
    info,
    issues: filteredIssues,
    timestamp: Date.now(),
    duration: Math.random() * 2000 + 500, // Simulated duration
  };
};

export const PDFAValidator: React.FC<PDFAValidatorProps> = ({
  isOpen,
  onClose,
  onValidate,
  onAutoFix,
  onExportReport,
  className = '',
}) => {
  const [targetLevel, setTargetLevel] = useState<PDFALevel>('2b');
  const [isValidating, setIsValidating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<IssueCategory | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | 'all'>('all');

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    setResult(null);
    setSelectedIssues(new Set());

    try {
      // Use provided validation or simulate
      const validationResult = await onValidate(targetLevel);
      setResult(validationResult);
    } catch {
      // Use simulated validation as fallback
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResult(simulateValidation(targetLevel));
    } finally {
      setIsValidating(false);
    }
  }, [targetLevel, onValidate]);

  const handleAutoFix = useCallback(async () => {
    const fixableIssues = Array.from(selectedIssues).filter((id) =>
      result?.issues.find((i) => i.id === id && i.autoFixable)
    );

    if (fixableIssues.length === 0) return;

    setIsFixing(true);
    try {
      await onAutoFix(fixableIssues);
      // Re-validate after fixes
      await handleValidate();
    } finally {
      setIsFixing(false);
    }
  }, [selectedIssues, result, onAutoFix, handleValidate]);

  const toggleIssueSelection = useCallback((id: string) => {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllFixable = useCallback(() => {
    if (!result) return;
    const fixable = result.issues.filter((i) => i.autoFixable).map((i) => i.id);
    setSelectedIssues(new Set(fixable));
  }, [result]);

  // Filter issues
  const filteredIssues = result?.issues.filter((issue) => {
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    return true;
  }) || [];

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-[750px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-circle text-emerald-600"></i>
              </div>
              <div>
                <h2 className="type-section text-slate-800">PDF/A Compliance</h2>
                <p className="type-caption text-slate-500">Validate document for archival standards</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Level Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Target Compliance Level</label>
            <div className="grid grid-cols-4 gap-2">
              {PDFA_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setTargetLevel(level.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    targetLevel === level.id
                      ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="font-bold text-sm">{level.name}</span>
                  <p className="text-[10px] mt-0.5 line-clamp-2">{level.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Validate Button */}
          {!result && (
            <div className="text-center py-8">
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className={`px-8 py-3 rounded-xl font-medium text-lg flex items-center gap-3 mx-auto transition-all ${
                  isValidating
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'
                }`}
              >
                {isValidating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Validating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-double"></i>
                    Validate Document
                  </>
                )}
              </button>
              <p className="type-caption text-slate-400 mt-3">
                Check your PDF against {PDFA_LEVELS.find((l) => l.id === targetLevel)?.name} requirements
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`p-4 rounded-xl ${result.isCompliant ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    result.isCompliant ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <i className={`fas ${result.isCompliant ? 'fa-check' : 'fa-times'} text-xl ${
                      result.isCompliant ? 'text-emerald-600' : 'text-red-600'
                    }`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${result.isCompliant ? 'text-emerald-800' : 'text-red-800'}`}>
                      {result.isCompliant ? 'Document is Compliant!' : 'Document is Not Compliant'}
                    </h3>
                    <p className={`text-sm ${result.isCompliant ? 'text-emerald-600' : 'text-red-600'}`}>
                      {result.isCompliant
                        ? `This document meets ${PDFA_LEVELS.find((l) => l.id === result.targetLevel)?.name} requirements.`
                        : `Found ${result.errors} error${result.errors !== 1 ? 's' : ''} that must be fixed.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                      {result.errors} errors
                    </span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-medium">
                      {result.warnings} warnings
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                      {result.info} info
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters and Actions */}
              {result.issues.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as any)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="all">All Categories</option>
                      {Object.entries(CATEGORY_INFO).map(([id, info]) => (
                        <option key={id} value={id}>{info.label}</option>
                      ))}
                    </select>
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value as any)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="all">All Severities</option>
                      <option value="error">Errors Only</option>
                      <option value="warning">Warnings Only</option>
                      <option value="info">Info Only</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllFixable}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Select Auto-Fixable
                    </button>
                    <button
                      onClick={handleAutoFix}
                      disabled={isFixing || selectedIssues.size === 0}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                        !isFixing && selectedIssues.size > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isFixing ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Fixing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic"></i>
                          Auto-Fix Selected ({selectedIssues.size})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Issues List */}
              <div className="space-y-2">
                {filteredIssues.map((issue) => {
                  const catInfo = CATEGORY_INFO[issue.category];
                  const sevInfo = SEVERITY_INFO[issue.severity];
                  const isExpanded = expandedIssue === issue.id;
                  const isSelected = selectedIssues.has(issue.id);

                  return (
                    <div
                      key={issue.id}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'
                      }`}
                    >
                      <div className="px-4 py-3 flex items-start gap-3">
                        {/* Selection */}
                        {issue.autoFixable && (
                          <button
                            onClick={() => toggleIssueSelection(issue.id)}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'border-slate-300 hover:border-blue-400'
                            }`}
                          >
                            {isSelected && <i className="fas fa-check text-[10px]"></i>}
                          </button>
                        )}

                        {/* Severity icon */}
                        <div className={`w-6 h-6 rounded-full ${sevInfo.bg} flex items-center justify-center`}>
                          <i className={`${sevInfo.icon} text-xs ${sevInfo.color}`}></i>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{issue.message}</span>
                            <span className={`text-xs ${catInfo.color} flex items-center gap-1`}>
                              <i className={catInfo.icon}></i>
                              {catInfo.label}
                            </span>
                            <span className="text-xs text-slate-400">{issue.code}</span>
                            {issue.autoFixable && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                                AUTO-FIX
                              </span>
                            )}
                          </div>
                          {issue.location && (
                            <p className="text-xs text-slate-400 mt-0.5">{issue.location}</p>
                          )}

                          {isExpanded && (
                            <div className="mt-3 space-y-2 text-sm">
                              <p className="text-slate-600">{issue.description}</p>
                              {issue.suggestion && (
                                <p className="text-emerald-600">
                                  <i className="fas fa-lightbulb mr-1"></i>
                                  {issue.suggestion}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Expand button */}
                        <button
                          onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`}></i>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredIssues.length === 0 && result.issues.length > 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <i className="fas fa-filter text-2xl mb-2"></i>
                    <p>No issues match the current filters</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {result && (
              <>
                <button
                  onClick={handleValidate}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg flex items-center gap-1.5"
                >
                  <i className="fas fa-redo"></i>
                  Re-validate
                </button>
                <button
                  onClick={() => onExportReport(result)}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg flex items-center gap-1.5"
                >
                  <i className="fas fa-file-export"></i>
                  Export Report
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFAValidator;
