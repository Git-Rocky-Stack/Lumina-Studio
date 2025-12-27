// ============================================
// FindReplacePanel Component
// Document-wide search and replace interface
// ============================================

import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { SearchMatch } from '../hooks/useFindReplace';

interface FindReplacePanelProps {
  isOpen: boolean;
  onClose: () => void;

  // Search state
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  replaceText: string;
  onReplaceTextChange: (text: string) => void;

  // Options
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  onCaseSensitiveChange: (value: boolean) => void;
  onWholeWordChange: (value: boolean) => void;
  onRegexChange: (value: boolean) => void;

  // Results
  matches: SearchMatch[];
  currentMatchIndex: number;
  isSearching: boolean;

  // Actions
  onNextMatch: () => void;
  onPreviousMatch: () => void;
  onReplaceMatch: () => void;
  onReplaceAll: () => void;
  onGoToMatch: (index: number) => void;

  className?: string;
}

export const FindReplacePanel: React.FC<FindReplacePanelProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchQueryChange,
  replaceText,
  onReplaceTextChange,
  caseSensitive,
  wholeWord,
  useRegex,
  onCaseSensitiveChange,
  onWholeWordChange,
  onRegexChange,
  matches,
  currentMatchIndex,
  isSearching,
  onNextMatch,
  onPreviousMatch,
  onReplaceMatch,
  onReplaceAll,
  onGoToMatch,
  className = '',
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showReplace, setShowReplace] = useState(false);
  const [showMatchList, setShowMatchList] = useState(false);

  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          onPreviousMatch();
        } else {
          onNextMatch();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [onNextMatch, onPreviousMatch, onClose]
  );

  // Group matches by page for the match list
  const matchesByPage = React.useMemo(() => {
    const grouped = new Map<number, SearchMatch[]>();
    matches.forEach((match) => {
      const existing = grouped.get(match.pageNumber) || [];
      existing.push(match);
      grouped.set(match.pageNumber, existing);
    });
    return grouped;
  }, [matches]);

  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-0 right-0 w-96 bg-white rounded-bl-2xl shadow-2xl border-l border-b border-slate-200 z-50 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <i className="fas fa-search text-slate-400"></i>
          <span className="text-sm font-bold text-slate-700">Find & Replace</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              showReplace
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={showReplace ? 'Hide Replace' : 'Show Replace'}
          >
            <i className="fas fa-exchange-alt text-xs"></i>
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find in document..."
            className="w-full pl-4 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching ? (
              <i className="fas fa-spinner fa-spin text-slate-400 text-sm"></i>
            ) : (
              <span className="text-xs text-slate-400 font-medium">
                {matches.length > 0
                  ? `${currentMatchIndex + 1}/${matches.length}`
                  : searchQuery
                  ? '0'
                  : ''}
              </span>
            )}
            <button
              onClick={onPreviousMatch}
              disabled={matches.length === 0}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <i className="fas fa-chevron-up text-[10px]"></i>
            </button>
            <button
              onClick={onNextMatch}
              disabled={matches.length === 0}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <i className="fas fa-chevron-down text-[10px]"></i>
            </button>
          </div>
        </div>

        {/* Replace Input */}
        {showReplace && (
          <div className="relative">
            <input
              type="text"
              value={replaceText}
              onChange={(e) => onReplaceTextChange(e.target.value)}
              placeholder="Replace with..."
              className="w-full pl-4 pr-28 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={onReplaceMatch}
                disabled={matches.length === 0}
                className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-lg hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Replace
              </button>
              <button
                onClick={onReplaceAll}
                disabled={matches.length === 0}
                className="px-2.5 py-1 bg-slate-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                All
              </button>
            </div>
          </div>
        )}

        {/* Search Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCaseSensitiveChange(!caseSensitive)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
              caseSensitive
                ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title="Match Case"
          >
            Aa
          </button>
          <button
            onClick={() => onWholeWordChange(!wholeWord)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
              wholeWord
                ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title="Match Whole Word"
          >
            <i className="fas fa-text-width"></i>
          </button>
          <button
            onClick={() => onRegexChange(!useRegex)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
              useRegex
                ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title="Use Regular Expression"
          >
            .*
          </button>
          <div className="flex-1"></div>
          <button
            onClick={() => setShowMatchList(!showMatchList)}
            disabled={matches.length === 0}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
              showMatchList
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            } disabled:opacity-30`}
          >
            <i className="fas fa-list mr-1"></i>
            List
          </button>
        </div>
      </div>

      {/* Match List */}
      {showMatchList && matches.length > 0 && (
        <div className="max-h-64 overflow-y-auto border-t border-slate-100">
          {Array.from(matchesByPage.entries()).map(([pageNumber, pageMatches]) => (
            <div key={pageNumber}>
              <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide sticky top-0">
                Page {pageNumber}
                <span className="ml-2 text-slate-400">
                  ({pageMatches.length})
                </span>
              </div>
              {pageMatches.map((match, i) => {
                const globalIndex = matches.findIndex((m) => m.id === match.id);
                const isActive = globalIndex === currentMatchIndex;

                return (
                  <button
                    key={match.id}
                    onClick={() => onGoToMatch(globalIndex)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                      isActive ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        isActive ? 'text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      "{match.text}"
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchQuery && matches.length === 0 && !isSearching && (
        <div className="px-4 pb-4 text-center">
          <div className="py-6 bg-slate-50 rounded-xl">
            <i className="fas fa-search text-2xl text-slate-300 mb-2"></i>
            <p className="text-sm text-slate-500">No matches found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search options
            </p>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="px-4 pb-3 flex items-center justify-center gap-4 text-[10px] text-slate-400">
        <span>
          <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">Enter</kbd>{' '}
          Next
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">Shift</kbd>+
          <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">Enter</kbd>{' '}
          Prev
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">Esc</kbd>{' '}
          Close
        </span>
      </div>
    </div>
  );
};

export default FindReplacePanel;
