// ============================================
// TextEditor Component
// Inline text editing overlay for PDF text
// ============================================

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import type { PDFTextItem, PDFTextContent } from '../types';

interface TextEditorProps {
  pageNumber: number;
  textContent: PDFTextContent | null;
  zoom: number;
  isActive: boolean;
  onTextEdit: (textItemId: string, newText: string) => void;
  onTextSelect?: (text: string, bounds: DOMRect) => void;
  highlightedItems?: Set<string>;
  searchMatches?: Array<{ textItemId: string; start: number; end: number }>;
  className?: string;
}

interface EditingState {
  textItemId: string;
  originalText: string;
  currentText: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export const TextEditor: React.FC<TextEditorProps> = ({
  pageNumber,
  textContent,
  zoom,
  isActive,
  onTextEdit,
  onTextSelect,
  highlightedItems = new Set(),
  searchMatches = [],
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Group search matches by text item
  const matchesByItem = useMemo(() => {
    const map = new Map<string, Array<{ start: number; end: number }>>();
    searchMatches.forEach((match) => {
      const existing = map.get(match.textItemId) || [];
      existing.push({ start: match.start, end: match.end });
      map.set(match.textItemId, existing);
    });
    return map;
  }, [searchMatches]);

  // Start editing a text item
  const handleDoubleClick = useCallback(
    (item: PDFTextItem, e: React.MouseEvent) => {
      if (!isActive) return;

      e.preventDefault();
      e.stopPropagation();

      setEditingState({
        textItemId: item.id,
        originalText: item.text,
        currentText: item.text,
        bounds: {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        },
      });
    },
    [isActive]
  );

  // Focus input when editing starts
  useEffect(() => {
    if (editingState && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingState]);

  // Handle text change
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editingState) return;

      setEditingState((prev) => {
        if (!prev) return null;
        return { ...prev, currentText: e.target.value };
      });
    },
    [editingState]
  );

  // Commit edit
  const commitEdit = useCallback(() => {
    if (!editingState) return;

    if (editingState.currentText !== editingState.originalText) {
      onTextEdit(editingState.textItemId, editingState.currentText);
    }

    setEditingState(null);
  }, [editingState, onTextEdit]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingState(null);
  }, []);

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit]
  );

  // Handle blur
  const handleBlur = useCallback(() => {
    commitEdit();
  }, [commitEdit]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    if (!onTextSelect) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const bounds = range.getBoundingClientRect();
    onTextSelect(text, bounds);
  }, [onTextSelect]);

  // Render text with search highlighting
  const renderHighlightedText = useCallback(
    (item: PDFTextItem) => {
      const matches = matchesByItem.get(item.id);

      if (!matches || matches.length === 0) {
        return item.text;
      }

      // Sort matches by start position
      const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      sortedMatches.forEach((match, i) => {
        // Add text before match
        if (match.start > lastIndex) {
          parts.push(
            <span key={`text-${i}-before`}>
              {item.text.substring(lastIndex, match.start)}
            </span>
          );
        }

        // Add highlighted match
        parts.push(
          <mark
            key={`match-${i}`}
            className="bg-yellow-300 text-slate-900 px-0.5 rounded"
          >
            {item.text.substring(match.start, match.end)}
          </mark>
        );

        lastIndex = match.end;
      });

      // Add remaining text
      if (lastIndex < item.text.length) {
        parts.push(
          <span key="text-end">{item.text.substring(lastIndex)}</span>
        );
      }

      return parts;
    },
    [matchesByItem]
  );

  if (!textContent || !isActive) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      onMouseUp={handleMouseUp}
    >
      {/* Text layer */}
      <div className="absolute inset-0">
        {textContent.items.map((item) => {
          const isEditing = editingState?.textItemId === item.id;
          const isHovered = hoveredItem === item.id;
          const isHighlighted = highlightedItems.has(item.id);
          const hasMatches = matchesByItem.has(item.id);

          const style: React.CSSProperties = {
            position: 'absolute',
            left: item.x * zoom,
            top: item.y * zoom,
            fontSize: item.fontSize * zoom,
            fontFamily: textContent.styles[item.fontName]?.fontFamily || 'sans-serif',
            fontWeight: item.fontWeight,
            fontStyle: item.fontStyle,
            color: 'transparent',
            whiteSpace: 'nowrap',
            pointerEvents: isActive ? 'auto' : 'none',
            cursor: isActive ? 'text' : 'default',
            userSelect: 'text',
            transform: `matrix(${item.transform.slice(0, 4).join(',')},0,0)`,
          };

          if (isEditing) {
            return (
              <input
                key={item.id}
                ref={inputRef}
                type="text"
                value={editingState.currentText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="absolute bg-white border-2 border-indigo-500 rounded px-1 outline-none shadow-lg"
                style={{
                  left: item.x * zoom - 2,
                  top: item.y * zoom - 2,
                  fontSize: item.fontSize * zoom,
                  fontFamily:
                    textContent.styles[item.fontName]?.fontFamily || 'sans-serif',
                  fontWeight: item.fontWeight,
                  fontStyle: item.fontStyle,
                  minWidth: Math.max(item.width * zoom, 100),
                  height: (item.height || item.fontSize) * zoom + 4,
                }}
              />
            );
          }

          return (
            <span
              key={item.id}
              style={{
                ...style,
                backgroundColor: isHighlighted
                  ? 'rgba(255, 235, 59, 0.3)'
                  : isHovered
                  ? 'rgba(99, 102, 241, 0.1)'
                  : hasMatches
                  ? 'rgba(255, 235, 59, 0.2)'
                  : 'transparent',
                color: hasMatches ? 'inherit' : 'transparent',
                borderRadius: 2,
                transition: 'background-color 0.15s',
              }}
              onDoubleClick={(e) => handleDoubleClick(item, e)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              title={isActive ? 'Double-click to edit' : undefined}
            >
              {hasMatches ? renderHighlightedText(item) : item.text}
            </span>
          );
        })}
      </div>

      {/* Edit indicator */}
      {isActive && !editingState && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900/90 text-white text-xs font-medium rounded-full backdrop-blur-sm pointer-events-none">
          <i className="fas fa-edit mr-2"></i>
          Double-click text to edit
        </div>
      )}
    </div>
  );
};

export default TextEditor;
