// ============================================
// TextInputField Component
// Text input form field with validation
// ============================================

import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { PDFFormField } from '../types';

interface TextInputFieldProps {
  field: PDFFormField;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSelected?: boolean;
  isEditing?: boolean;
  errors?: string[];
  zoom?: number;
  className?: string;
}

export const TextInputField: React.FC<TextInputFieldProps> = ({
  field,
  value,
  onChange,
  onFocus,
  onBlur,
  isSelected = false,
  isEditing = false,
  errors = [],
  zoom = 1,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Focus input when selected
  useEffect(() => {
    if (isSelected && isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected, isEditing]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Handle change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let newValue = e.target.value;

      // Apply input masks/formatting
      if (field.validation?.pattern) {
        // For masked inputs like phone, SSN, etc.
        // This is a simple implementation - could be enhanced
      }

      // Check maxLength
      if (field.validation?.maxLength && newValue.length > field.validation.maxLength) {
        return;
      }

      onChange(newValue);
    },
    [field.validation, onChange]
  );

  // Determine input type
  const getInputType = (): string => {
    if (field.inputType) return field.inputType;
    if (field.name.toLowerCase().includes('email')) return 'email';
    if (field.name.toLowerCase().includes('password')) return 'password';
    if (field.name.toLowerCase().includes('phone') || field.name.toLowerCase().includes('tel')) return 'tel';
    if (field.name.toLowerCase().includes('url') || field.name.toLowerCase().includes('website')) return 'url';
    return 'text';
  };

  const inputType = getInputType();
  const hasErrors = errors.length > 0;
  const isTextArea = field.type === 'textarea';

  // Common styles
  const baseStyles: React.CSSProperties = {
    position: 'absolute',
    left: field.rect.x * zoom,
    top: field.rect.y * zoom,
    width: field.rect.width * zoom,
    height: field.rect.height * zoom,
    fontSize: (field.fontSize || 12) * zoom,
    fontFamily: field.fontFamily || 'inherit',
    color: field.textColor || '#000000',
    backgroundColor: field.backgroundColor || '#ffffff',
    border: `${field.borderWidth || 1}px solid ${hasErrors ? '#ef4444' : isFocused ? '#6366f1' : field.borderColor || '#cccccc'}`,
    borderRadius: (field.borderRadius || 4) * zoom,
    padding: `${4 * zoom}px ${8 * zoom}px`,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: isFocused ? `0 0 0 ${3 * zoom}px rgba(99, 102, 241, 0.1)` : 'none',
    resize: isTextArea ? 'none' : undefined,
    opacity: field.readOnly ? 0.7 : 1,
    cursor: field.readOnly ? 'not-allowed' : 'text',
  };

  // Selected state styles
  if (isSelected && !isEditing) {
    baseStyles.border = `${2 * zoom}px solid #6366f1`;
    baseStyles.boxShadow = `0 0 0 ${4 * zoom}px rgba(99, 102, 241, 0.2)`;
  }

  return (
    <div className={`form-field-container ${className}`}>
      {/* Label (if outside field) */}
      {field.label && field.labelPosition !== 'inside' && (
        <label
          style={{
            position: 'absolute',
            left: field.rect.x * zoom,
            top: (field.rect.y - 20) * zoom,
            fontSize: 11 * zoom,
            fontWeight: 500,
            color: hasErrors ? '#ef4444' : '#475569',
          }}
        >
          {field.label}
          {field.required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input/Textarea */}
      {isTextArea ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={field.placeholder || (field.labelPosition === 'inside' ? field.label : '')}
          readOnly={field.readOnly}
          required={field.required}
          maxLength={field.validation?.maxLength}
          style={baseStyles}
          className="scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={inputType === 'password' && showPassword ? 'text' : inputType}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={field.placeholder || (field.labelPosition === 'inside' ? field.label : '')}
            readOnly={field.readOnly}
            required={field.required}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
            style={baseStyles}
          />

          {/* Password toggle */}
          {inputType === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: (field.rect.x + field.rect.width - 28) * zoom,
                top: (field.rect.y + field.rect.height / 2 - 10) * zoom,
                width: 20 * zoom,
                height: 20 * zoom,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: 10 * zoom }}></i>
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {hasErrors && (
        <div
          style={{
            position: 'absolute',
            left: field.rect.x * zoom,
            top: (field.rect.y + field.rect.height + 4) * zoom,
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

      {/* Character counter */}
      {field.validation?.maxLength && isFocused && (
        <div
          style={{
            position: 'absolute',
            right: field.rect.x * zoom,
            top: (field.rect.y + field.rect.height + 4) * zoom,
            fontSize: 9 * zoom,
            color: value.length > (field.validation.maxLength * 0.9) ? '#f59e0b' : '#94a3b8',
          }}
        >
          {value.length}/{field.validation.maxLength}
        </div>
      )}

      {/* Required indicator (if inside) */}
      {field.required && !value && !isFocused && field.labelPosition === 'inside' && (
        <div
          style={{
            position: 'absolute',
            right: (field.rect.x + field.rect.width - 24) * zoom,
            top: (field.rect.y + field.rect.height / 2 - 8) * zoom,
            fontSize: 10 * zoom,
            color: '#ef4444',
          }}
        >
          *
        </div>
      )}
    </div>
  );
};

export default TextInputField;
