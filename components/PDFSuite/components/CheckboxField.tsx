// ============================================
// CheckboxField Component
// Checkbox form field
// ============================================

import React, { useCallback } from 'react';
import type { PDFFormField } from '../types';

interface CheckboxFieldProps {
  field: PDFFormField;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSelected?: boolean;
  isEditing?: boolean;
  errors?: string[];
  zoom?: number;
  className?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  field,
  checked,
  onChange,
  onFocus,
  onBlur,
  isSelected = false,
  isEditing = false,
  errors = [],
  zoom = 1,
  className = '',
}) => {
  const handleChange = useCallback(() => {
    if (!field.readOnly) {
      onChange(!checked);
    }
  }, [checked, field.readOnly, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleChange();
      }
    },
    [handleChange]
  );

  const hasErrors = errors.length > 0;
  const size = Math.min(field.rect.width, field.rect.height) * zoom;

  return (
    <div
      className={`form-field-container ${className}`}
      style={{
        position: 'absolute',
        left: field.rect.x * zoom,
        top: field.rect.y * zoom,
        display: 'flex',
        alignItems: 'center',
        gap: 8 * zoom,
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={field.label || field.name}
        onClick={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={field.readOnly}
        style={{
          width: size,
          height: size,
          borderRadius: 4 * zoom,
          border: `${field.borderWidth || 2}px solid ${
            hasErrors
              ? '#ef4444'
              : checked
              ? field.textColor || '#6366f1'
              : field.borderColor || '#cbd5e1'
          }`,
          backgroundColor: checked
            ? field.textColor || '#6366f1'
            : field.backgroundColor || '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: field.readOnly ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          boxShadow: isSelected
            ? `0 0 0 ${3 * zoom}px rgba(99, 102, 241, 0.3)`
            : 'none',
          opacity: field.readOnly ? 0.6 : 1,
        }}
      >
        {checked && (
          <svg
            width={size * 0.6}
            height={size * 0.6}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </button>

      {/* Label */}
      {field.label && (
        <label
          onClick={handleChange}
          style={{
            fontSize: (field.fontSize || 12) * zoom,
            fontFamily: field.fontFamily || 'inherit',
            color: hasErrors ? '#ef4444' : field.textColor || '#334155',
            cursor: field.readOnly ? 'not-allowed' : 'pointer',
            userSelect: 'none',
          }}
        >
          {field.label}
          {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {/* Error indicator */}
      {hasErrors && (
        <div
          style={{
            position: 'absolute',
            left: (field.label ? size + 8 * zoom + 100 : size + 8 * zoom) * zoom,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          title={errors[0]}
        >
          <i
            className="fas fa-exclamation-circle"
            style={{ fontSize: 12 * zoom, color: '#ef4444' }}
          ></i>
        </div>
      )}
    </div>
  );
};

// ============================================
// RadioGroupField Component
// Radio button group form field
// ============================================

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupFieldProps {
  field: PDFFormField;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSelected?: boolean;
  isEditing?: boolean;
  errors?: string[];
  zoom?: number;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
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
  layout = 'vertical',
  className = '',
}) => {
  const handleChange = useCallback(
    (optionValue: string) => {
      if (!field.readOnly) {
        onChange(optionValue);
      }
    },
    [field.readOnly, onChange]
  );

  const hasErrors = errors.length > 0;
  const radioSize = 18 * zoom;

  return (
    <div
      className={`form-field-container ${className}`}
      style={{
        position: 'absolute',
        left: field.rect.x * zoom,
        top: field.rect.y * zoom,
        width: field.rect.width * zoom,
      }}
      role="radiogroup"
      aria-label={field.label || field.name}
    >
      {/* Group Label */}
      {field.label && (
        <label
          style={{
            display: 'block',
            marginBottom: 8 * zoom,
            fontSize: (field.fontSize || 12) * zoom,
            fontWeight: 600,
            color: hasErrors ? '#ef4444' : field.textColor || '#334155',
          }}
        >
          {field.label}
          {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {/* Options */}
      <div
        style={{
          display: 'flex',
          flexDirection: layout === 'horizontal' ? 'row' : 'column',
          gap: (layout === 'horizontal' ? 16 : 8) * zoom,
          flexWrap: 'wrap',
        }}
      >
        {options.map((option) => {
          const isChecked = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isChecked}
              onClick={() => handleChange(option.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              disabled={field.readOnly}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8 * zoom,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: field.readOnly ? 'not-allowed' : 'pointer',
                opacity: field.readOnly ? 0.6 : 1,
              }}
            >
              {/* Radio circle */}
              <div
                style={{
                  width: radioSize,
                  height: radioSize,
                  borderRadius: '50%',
                  border: `2px solid ${
                    hasErrors
                      ? '#ef4444'
                      : isChecked
                      ? field.textColor || '#6366f1'
                      : field.borderColor || '#cbd5e1'
                  }`,
                  backgroundColor: field.backgroundColor || '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow:
                    isSelected && isChecked
                      ? `0 0 0 ${3 * zoom}px rgba(99, 102, 241, 0.3)`
                      : 'none',
                }}
              >
                {isChecked && (
                  <div
                    style={{
                      width: radioSize * 0.5,
                      height: radioSize * 0.5,
                      borderRadius: '50%',
                      backgroundColor: field.textColor || '#6366f1',
                    }}
                  ></div>
                )}
              </div>

              {/* Option label */}
              <span
                style={{
                  fontSize: (field.fontSize || 12) * zoom,
                  color: field.textColor || '#334155',
                  userSelect: 'none',
                }}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {hasErrors && (
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

export default CheckboxField;
