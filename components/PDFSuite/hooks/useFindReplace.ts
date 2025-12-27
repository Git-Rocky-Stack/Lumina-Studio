// ============================================
// useFindReplace Hook
// Manages document-wide search and replace operations
// ============================================

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { PDFTextItem, PDFTextContent } from '../types';

export interface SearchMatch {
  id: string;
  pageNumber: number;
  textItemId: string;
  text: string;
  matchStart: number;
  matchEnd: number;
  bounds: { x: number; y: number; width: number; height: number };
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

interface UseFindReplaceOptions {
  textContent: Map<number, PDFTextContent>;
  onReplace?: (match: SearchMatch, newText: string) => void;
  onReplaceAll?: (matches: SearchMatch[], newText: string) => void;
  onNavigate?: (match: SearchMatch) => void;
}

interface UseFindReplaceReturn {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  replaceText: string;
  setReplaceText: (text: string) => void;
  options: SearchOptions;
  setOptions: (options: Partial<SearchOptions>) => void;

  // Results
  matches: SearchMatch[];
  matchCount: number;
  currentMatchIndex: number;
  currentMatch: SearchMatch | null;
  isSearching: boolean;

  // Actions
  search: () => void;
  clearSearch: () => void;
  nextMatch: () => void;
  previousMatch: () => void;
  goToMatch: (index: number) => void;

  // Replace
  replaceCurrentMatch: () => void;
  replaceAll: () => void;

  // Status
  hasMatches: boolean;
  searchStatus: string;
}

export function useFindReplace(options: UseFindReplaceOptions): UseFindReplaceReturn {
  const { textContent, onReplace, onReplaceAll, onNavigate } = options;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set search options
  const setOptions = useCallback((opts: Partial<SearchOptions>) => {
    setSearchOptions((prev) => ({ ...prev, ...opts }));
  }, []);

  // Generate match ID
  const generateMatchId = useCallback((pageNumber: number, itemId: string, start: number) => {
    return `match-${pageNumber}-${itemId}-${start}`;
  }, []);

  // Perform search
  const search = useCallback(() => {
    if (!searchQuery.trim()) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    setIsSearching(true);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const results: SearchMatch[] = [];

      textContent.forEach((content, pageNumber) => {
        content.items.forEach((item) => {
          const matchPositions = findMatchPositions(
            item.text,
            searchQuery,
            searchOptions
          );

          matchPositions.forEach(({ start, end }) => {
            results.push({
              id: generateMatchId(pageNumber, item.id, start),
              pageNumber,
              textItemId: item.id,
              text: item.text.substring(start, end),
              matchStart: start,
              matchEnd: end,
              bounds: {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
              },
            });
          });
        });
      });

      // Sort by page number, then by position
      results.sort((a, b) => {
        if (a.pageNumber !== b.pageNumber) {
          return a.pageNumber - b.pageNumber;
        }
        return a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x;
      });

      setMatches(results);
      setCurrentMatchIndex(results.length > 0 ? 0 : -1);
      setIsSearching(false);

      // Navigate to first match
      if (results.length > 0 && onNavigate) {
        onNavigate(results[0]!);
      }
    }, 150);
  }, [searchQuery, textContent, searchOptions, generateMatchId, onNavigate]);

  // Find match positions in text
  const findMatchPositions = useCallback(
    (
      text: string,
      query: string,
      opts: SearchOptions
    ): Array<{ start: number; end: number }> => {
      const positions: Array<{ start: number; end: number }> = [];

      if (!query) return positions;

      let searchText = text;
      let searchQuery = query;

      if (!opts.caseSensitive) {
        searchText = text.toLowerCase();
        searchQuery = query.toLowerCase();
      }

      if (opts.regex) {
        try {
          const flags = opts.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(query, flags);
          let match;

          while ((match = regex.exec(text)) !== null) {
            positions.push({
              start: match.index,
              end: match.index + match[0].length,
            });
            // Prevent infinite loop for zero-length matches
            if (match[0].length === 0) {
              regex.lastIndex++;
            }
          }
        } catch {
          // Invalid regex, treat as literal
          return findMatchPositions(text, query, { ...opts, regex: false });
        }
      } else if (opts.wholeWord) {
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedQuery}\\b`, 'gi');
        let match;

        while ((match = regex.exec(text)) !== null) {
          positions.push({
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      } else {
        let index = searchText.indexOf(searchQuery);
        while (index !== -1) {
          positions.push({
            start: index,
            end: index + searchQuery.length,
          });
          index = searchText.indexOf(searchQuery, index + 1);
        }
      }

      return positions;
    },
    []
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setReplaceText('');
    setMatches([]);
    setCurrentMatchIndex(0);
  }, []);

  // Navigate to next match
  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;

    const newIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(newIndex);

    const match = matches[newIndex];
    if (match && onNavigate) {
      onNavigate(match);
    }
  }, [matches, currentMatchIndex, onNavigate]);

  // Navigate to previous match
  const previousMatch = useCallback(() => {
    if (matches.length === 0) return;

    const newIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(newIndex);

    const match = matches[newIndex];
    if (match && onNavigate) {
      onNavigate(match);
    }
  }, [matches, currentMatchIndex, onNavigate]);

  // Go to specific match
  const goToMatch = useCallback(
    (index: number) => {
      if (index < 0 || index >= matches.length) return;

      setCurrentMatchIndex(index);

      const match = matches[index];
      if (match && onNavigate) {
        onNavigate(match);
      }
    },
    [matches, onNavigate]
  );

  // Replace current match
  const replaceCurrentMatch = useCallback(() => {
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
    if (!replaceText && replaceText !== '') return;

    const match = matches[currentMatchIndex];
    if (!match) return;

    if (onReplace) {
      onReplace(match, replaceText);
    }

    // Remove match from list and update index
    setMatches((prev) => prev.filter((_, i) => i !== currentMatchIndex));
    setCurrentMatchIndex((prev) => Math.min(prev, matches.length - 2));
  }, [currentMatchIndex, matches, replaceText, onReplace]);

  // Replace all matches
  const replaceAll = useCallback(() => {
    if (matches.length === 0) return;
    if (!replaceText && replaceText !== '') return;

    if (onReplaceAll) {
      onReplaceAll(matches, replaceText);
    }

    setMatches([]);
    setCurrentMatchIndex(0);
  }, [matches, replaceText, onReplaceAll]);

  // Current match
  const currentMatch = useMemo(() => {
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) {
      return null;
    }
    return matches[currentMatchIndex] ?? null;
  }, [matches, currentMatchIndex]);

  // Search status message
  const searchStatus = useMemo(() => {
    if (isSearching) return 'Searching...';
    if (!searchQuery) return '';
    if (matches.length === 0) return 'No matches found';
    return `${currentMatchIndex + 1} of ${matches.length} matches`;
  }, [isSearching, searchQuery, matches.length, currentMatchIndex]);

  // Auto-search when query changes
  useEffect(() => {
    search();
  }, [searchQuery, searchOptions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        // Let the parent component handle opening the find panel
        return;
      }

      // Only handle when find is active
      if (!searchQuery) return;

      if (e.key === 'Enter') {
        if (e.shiftKey) {
          e.preventDefault();
          previousMatch();
        } else {
          e.preventDefault();
          nextMatch();
        }
      }

      if (e.key === 'Escape') {
        clearSearch();
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'h') {
        e.preventDefault();
        replaceCurrentMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, nextMatch, previousMatch, clearSearch, replaceCurrentMatch]);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    replaceText,
    setReplaceText,
    options: searchOptions,
    setOptions,

    // Results
    matches,
    matchCount: matches.length,
    currentMatchIndex,
    currentMatch,
    isSearching,

    // Actions
    search,
    clearSearch,
    nextMatch,
    previousMatch,
    goToMatch,

    // Replace
    replaceCurrentMatch,
    replaceAll,

    // Status
    hasMatches: matches.length > 0,
    searchStatus,
  };
}

export default useFindReplace;
