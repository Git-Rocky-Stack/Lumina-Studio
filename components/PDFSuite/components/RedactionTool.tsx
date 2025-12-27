// ============================================
// RedactionTool Component
// Permanent redaction interface with AI-powered detection
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import type { RedactionMark, PrivacyScanResult } from '../types';

interface RedactionToolProps {
  redactions: RedactionMark[];
  scanResults: PrivacyScanResult[];
  isScanning: boolean;
  onAddRedaction: (redaction: Omit<RedactionMark, 'id' | 'createdAt'>) => void;
  onRemoveRedaction: (id: string) => void;
  onApplyRedaction: (id: string) => void;
  onApplyAllRedactions: () => void;
  onStartScan: () => void;
  onAcceptSuggestion: (result: PrivacyScanResult, locationIndex: number) => void;
  onRejectSuggestion: (result: PrivacyScanResult, locationIndex: number) => void;
  onAcceptAllSuggestions: () => void;
  className?: string;
}

type ViewTab = 'pending' | 'suggestions' | 'applied';

export const RedactionTool: React.FC<RedactionToolProps> = ({
  redactions,
  scanResults,
  isScanning,
  onAddRedaction,
  onRemoveRedaction,
  onApplyRedaction,
  onApplyAllRedactions,
  onStartScan,
  onAcceptSuggestion,
  onRejectSuggestion,
  onAcceptAllSuggestions,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('pending');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Categorize redactions
  const pendingRedactions = useMemo(
    () => redactions.filter((r) => !r.isApplied),
    [redactions]
  );

  const appliedRedactions = useMemo(
    () => redactions.filter((r) => r.isApplied),
    [redactions]
  );

  // Get unique data types from scan results
  const dataTypes = useMemo(() => {
    const types = new Set<string>();
    scanResults.forEach((result) => types.add(result.type));
    return Array.from(types);
  }, [scanResults]);

  // Filter scan results by selected type
  const filteredResults = useMemo(() => {
    if (!selectedType) return scanResults;
    return scanResults.filter((result) => result.type === selectedType);
  }, [scanResults, selectedType]);

  // Get type icon and color
  const getTypeInfo = useCallback((type: string) => {
    switch (type) {
      case 'email':
        return { icon: 'fa-envelope', color: '#3B82F6', label: 'Email' };
      case 'phone':
        return { icon: 'fa-phone', color: '#10B981', label: 'Phone' };
      case 'address':
        return { icon: 'fa-map-marker-alt', color: '#F59E0B', label: 'Address' };
      case 'ssn':
        return { icon: 'fa-id-card', color: '#EF4444', label: 'SSN' };
      case 'creditCard':
        return { icon: 'fa-credit-card', color: '#8B5CF6', label: 'Credit Card' };
      case 'name':
        return { icon: 'fa-user', color: '#EC4899', label: 'Name' };
      case 'date':
        return { icon: 'fa-calendar', color: '#6366F1', label: 'Date' };
      default:
        return { icon: 'fa-exclamation-circle', color: '#64748B', label: 'Other' };
    }
  }, []);

  // Total suggestions count
  const totalSuggestions = useMemo(
    () => scanResults.reduce((acc, r) => acc + r.locations.length, 0),
    [scanResults]
  );

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <i className="fas fa-shield-halved text-rose-500"></i>
              Redaction Tool
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Remove sensitive information permanently
            </p>
          </div>
          <button
            onClick={onStartScan}
            disabled={isScanning}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-black disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Scanning...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i>
                AI Scan
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Pending
            {pendingRedactions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] rounded-full">
                {pendingRedactions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
              activeTab === 'suggestions'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            AI Suggestions
            {totalSuggestions > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[10px] rounded-full">
                {totalSuggestions}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('applied')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
              activeTab === 'applied'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Applied
            <span className="ml-1.5 text-slate-400">
              {appliedRedactions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="p-4 space-y-3">
            {pendingRedactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <i className="fas fa-check-circle text-2xl text-slate-300"></i>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  No pending redactions
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the selection tools to mark areas for redaction
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {pendingRedactions.length} pending redaction
                    {pendingRedactions.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={onApplyAllRedactions}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-rose-700 transition-all"
                  >
                    Apply All
                  </button>
                </div>

                {pendingRedactions.map((redaction) => (
                  <div
                    key={redaction.id}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center">
                          <i className="fas fa-eraser text-amber-600 text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700">
                            Page {redaction.pageNumber}
                          </p>
                          {redaction.reason && (
                            <p className="text-[10px] text-slate-500">
                              {redaction.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onApplyRedaction(redaction.id)}
                          className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-rose-700"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => onRemoveRedaction(redaction.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    </div>
                    {redaction.overlayText && (
                      <div className="mt-2 px-2 py-1 bg-white rounded text-xs text-slate-500">
                        Overlay: "{redaction.overlayText}"
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* AI Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="p-4 space-y-4">
            {/* Type Filter */}
            {dataTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedType === null
                      ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  All ({totalSuggestions})
                </button>
                {dataTypes.map((type) => {
                  const info = getTypeInfo(type);
                  const count = scanResults
                    .filter((r) => r.type === type)
                    .reduce((acc, r) => acc + r.locations.length, 0);

                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedType === type
                          ? 'ring-1'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      style={
                        selectedType === type
                          ? {
                              backgroundColor: `${info.color}20`,
                              color: info.color,
                              borderColor: info.color,
                            }
                          : undefined
                      }
                    >
                      <i className={`fas ${info.icon} text-[10px]`}></i>
                      {info.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <i className="fas fa-shield-check text-2xl text-slate-300"></i>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  {scanResults.length === 0
                    ? 'No sensitive data detected'
                    : 'No matches for selected filter'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {scanResults.length === 0
                    ? 'Run AI Scan to detect personal information'
                    : 'Try selecting a different type'}
                </p>
              </div>
            ) : (
              <>
                {/* Accept All Button */}
                <div className="flex justify-end">
                  <button
                    onClick={onAcceptAllSuggestions}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-rose-700 transition-all"
                  >
                    Accept All Suggestions
                  </button>
                </div>

                {/* Results List */}
                {filteredResults.map((result, resultIndex) => {
                  const info = getTypeInfo(result.type);

                  return (
                    <div
                      key={`${result.type}-${result.term}-${resultIndex}`}
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      {/* Result Header */}
                      <div
                        className="px-4 py-3 flex items-center gap-3"
                        style={{ backgroundColor: `${info.color}10` }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${info.color}20` }}
                        >
                          <i
                            className={`fas ${info.icon} text-sm`}
                            style={{ color: info.color }}
                          ></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-700">
                            {result.term}
                          </p>
                          <p className="text-xs text-slate-500">
                            {info.label} • {result.locations.length} occurrence
                            {result.locations.length !== 1 ? 's' : ''} •{' '}
                            {Math.round(result.confidence * 100)}% confidence
                          </p>
                        </div>
                      </div>

                      {/* Locations */}
                      <div className="divide-y divide-slate-100">
                        {result.locations.map((location, locIndex) => (
                          <div
                            key={locIndex}
                            className="px-4 py-2 flex items-center justify-between hover:bg-slate-50"
                          >
                            <div>
                              <span className="text-xs text-slate-400">
                                Page {location.pageNumber}
                              </span>
                              {location.context && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                                  "...{location.context}..."
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  onAcceptSuggestion(result, locIndex)
                                }
                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-100 text-rose-600 hover:bg-rose-200 transition-all"
                                title="Accept and create redaction"
                              >
                                <i className="fas fa-check text-xs"></i>
                              </button>
                              <button
                                onClick={() =>
                                  onRejectSuggestion(result, locIndex)
                                }
                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
                                title="Dismiss suggestion"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Applied Tab */}
        {activeTab === 'applied' && (
          <div className="p-4 space-y-3">
            {appliedRedactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <i className="fas fa-lock text-2xl text-slate-300"></i>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  No applied redactions
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Applied redactions will appear here
                </p>
              </div>
            ) : (
              appliedRedactions.map((redaction) => (
                <div
                  key={redaction.id}
                  className="p-3 bg-slate-900 text-white rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                      <i className="fas fa-lock text-sm text-slate-400"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium">
                        Page {redaction.pageNumber}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Permanently redacted
                      </p>
                    </div>
                    <i className="fas fa-check-circle text-emerald-400"></i>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Warning Footer */}
      <div className="flex-shrink-0 p-4 bg-amber-50 border-t border-amber-200">
        <div className="flex items-start gap-3">
          <i className="fas fa-exclamation-triangle text-amber-500 mt-0.5"></i>
          <div>
            <p className="text-xs font-medium text-amber-700">
              Redactions are permanent
            </p>
            <p className="text-[10px] text-amber-600 mt-0.5">
              Once applied, redacted content cannot be recovered. Always keep a
              backup of your original document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedactionTool;
