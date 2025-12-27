// ============================================
// DropdownField Component
// Select dropdown form field
// ============================================

import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { PDFFormField } from '../types';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownFieldProps {
  field: PDFFormField;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSelected?: boolean;
  isEditing?: boolean;
  errors?: string[];
  zoom?: number;
  searchable?: boolean;
  className?: string;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({
  field,
  value,
  options,
  onChange,
  onFocus,
  onBlur,
  isSelected = false,
  isEditing = false,
  errors = [],
  zoom = 1,
  searchable = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Get selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search
  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Toggle dropdown
  const handleToggle = useCallback(() => {
    if (!field.readOnly) {
      setIsOpen(!isOpen);
      setHighlightedIndex(-1);
      setSearchQuery('');
    }
  }, [field.readOnly, isOpen]);

  // Select option
  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
      onBlur?.();
    },
    [onChange, onBlur]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (field.readOnly) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            const option = filteredOptions[highlightedIndex];
            if (option && !option.disabled) {
              handleSelect(option.value);
            }
          } else {
            setIsOpen(true);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchQuery('');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearchQuery('');
          }
          break;
      }
    },
    [field.readOnly, isOpen, highlightedIndex, filteredOptions, handleSelect]
  );

  const hasErrors = errors.length > 0;

  return (
    <div
      ref={containerRef}
      className={`form-field-container ${className}`}
      style={{
        position: 'absolute',
        left: field.rect.x * zoom,
        top: field.rect.y * zoom,
        width: field.rect.width * zoom,
      }}
    >
      {/* Label */}
      {field.label && (
        <label
          style={{
            display: 'block',
            marginBottom: 4 * zoom,
            fontSize: 11 * zoom,
            fontWeight: 500,
            color: hasErrors ? '#ef4444' : '#475569',
          }}
        >
          {field.label}
          {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        disabled={field.readOnly}
        style={{
          width: '100%',
          height: field.rect.height * zoom,
          padding: `${4 * zoom}px ${32 * zoom}px ${4 * zoom}px ${8 * zoom}px`,
          fontSize: (field.fontSize || 12) * zoom,
          fontFamily: field.fontFamily || 'inherit',
          color: value ? (field.textColor || '#000000') : '#94a3b8',
          backgroundColor: field.backgroundColor || '#ffffff',
          border: `${field.borderWidth || 1}px solid ${
            hasErrors
              ? '#ef4444'
              : isOpen
              ? '#6366f1'
              : field.borderColor || '#cccccc'
          }`,
          borderRadius: (field.borderRadius || 4) * zoom,
          textAlign: 'left',
          cursor: field.readOnly ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? `0 0 0 ${3 * zoom}px rgba(99, 102, 241, 0.1)`
            : isSelected
            ? `0 0 0 ${3 * zoom}px rgba(99, 102, 241, 0.3)`
            : 'none',
          opacity: field.readOnly ? 0.6 : 1,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          position: 'relative',
        }}
      >
        {selectedOption?.label || field.placeholder || 'Select...'}

        {/* Arrow icon */}
        <i
          className={`fas fa-chevron-down`}
          style={{
            position: 'absolute',
            right: 10 * zoom,
            top: '50%',
            transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
            transition: 'transform 0.2s',
            fontSize: 10 * zoom,
            color: '#94a3b8',
          }}
        ></i>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: (field.label ? field.rect.height + 24 : field.rect.height + 4) * zoom,
            left: 0,
            width: '100%',
            maxHeight: 200 * zoom,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8 * zoom,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {/* Search input */}
          {searchable && (
            <div style={{ padding: 8 * zoom, borderBottom: '1px solid #e2e8f0' }}>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                style={{
                  width: '100%',
                  padding: `${6 * zoom}px ${8 * zoom}px`,
                  fontSize: 12 * zoom,
                  border: '1px solid #e2e8f0',
                  borderRadius: 4 * zoom,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Options list */}
          <div
            style={{
              maxHeight: searchable ? 150 * zoom : 200 * zoom,
              overflowY: 'auto',
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  disabled={option.disabled}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: `${8 * zoom}px ${12 * zoom}px`,
                    fontSize: 12 * zoom,
                    textAlign: 'left',
                    backgroundColor:
                      option.value === value
                        ? '#eef2ff'
                        : highlightedIndex === index
                        ? '#f1f5f9'
                        : 'transparent',
                    color: option.disabled
                      ? '#94a3b8'
                      : option.value === value
                      ? '#4f46e5'
                      : '#334155',
                    border: 'none',
                    cursor: option.disabled ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 * zoom }}>
                    {option.value === value && (
                      <i className="fas fa-check" style={{ fontSize: 10 * zoom, color: '#4f46e5' }}></i>
                    )}
                    <span style={{ marginLeft: option.value === value ? 0 : 18 * zoom }}>
                      {option.label}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div
                style={{
                  padding: `${16 * zoom}px`,
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: 12 * zoom,
                }}
              >
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {hasErrors && !isOpen && (
        <div
          style={{
            marginTop: 4 * zoom,
            fontSize: 10 * zoom,
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 4 * zoom,
          }}
        >
          <i className="fas fa-exclamation-circle"></i>
          {errors[0]}
        </div>
      )}
    </div>
  );
};

export default DropdownField;
