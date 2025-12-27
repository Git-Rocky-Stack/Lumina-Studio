// ============================================
// DatePickerField Component
// Date selection form field with calendar
// ============================================

import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import type { PDFFormField } from '../types';

interface DatePickerFieldProps {
  field: PDFFormField;
  value: Date | null;
  onChange: (value: Date | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSelected?: boolean;
  isEditing?: boolean;
  errors?: string[];
  zoom?: number;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  field,
  value,
  onChange,
  onFocus,
  onBlur,
  isSelected = false,
  isEditing = false,
  errors = [],
  zoom = 1,
  minDate,
  maxDate,
  dateFormat = 'MM/DD/YYYY',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display
  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return '';

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
      default:
        return `${month}/${day}/${year}`;
    }
  }, [dateFormat]);

  // Get calendar days for current view
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; isDisabled: boolean }> = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: value ? date.toDateString() === value.toDateString() : false,
        isDisabled: (minDate && date < minDate) || (maxDate && date > maxDate) || false,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: value ? date.toDateString() === value.toDateString() : false,
        isDisabled: (minDate && date < minDate) || (maxDate && date > maxDate) || false,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: value ? date.toDateString() === value.toDateString() : false,
        isDisabled: (minDate && date < minDate) || (maxDate && date > maxDate) || false,
      });
    }

    return days;
  }, [viewDate, value, minDate, maxDate]);

  // Navigation
  const goToPreviousMonth = useCallback(() => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }, [viewDate]);

  const goToNextMonth = useCallback(() => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }, [viewDate]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setViewDate(today);
    onChange(today);
    setIsOpen(false);
  }, [onChange]);

  // Select date
  const handleSelectDate = useCallback(
    (date: Date) => {
      onChange(date);
      setIsOpen(false);
      onBlur?.();
    },
    [onChange, onBlur]
  );

  // Clear date
  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

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

      {/* Input trigger */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => !field.readOnly && setIsOpen(!isOpen)}
          onFocus={onFocus}
          disabled={field.readOnly}
          style={{
            width: '100%',
            height: field.rect.height * zoom,
            padding: `${4 * zoom}px ${36 * zoom}px ${4 * zoom}px ${8 * zoom}px`,
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
          }}
        >
          {formatDate(value) || field.placeholder || 'Select date...'}
        </button>

        {/* Calendar icon */}
        <i
          className="fas fa-calendar-alt"
          style={{
            position: 'absolute',
            right: 10 * zoom,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 12 * zoom,
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        ></i>

        {/* Clear button */}
        {value && !field.readOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            style={{
              position: 'absolute',
              right: 28 * zoom,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16 * zoom,
              height: 16 * zoom,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              borderRadius: '50%',
            }}
          >
            <i className="fas fa-times" style={{ fontSize: 10 * zoom }}></i>
          </button>
        )}
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: (field.label ? field.rect.height + 28 : field.rect.height + 8) * zoom,
            left: 0,
            width: 280 * zoom,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12 * zoom,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 100,
            padding: 12 * zoom,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12 * zoom,
            }}
          >
            <button
              type="button"
              onClick={goToPreviousMonth}
              style={{
                width: 28 * zoom,
                height: 28 * zoom,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 6 * zoom,
                color: '#64748b',
              }}
            >
              <i className="fas fa-chevron-left" style={{ fontSize: 12 * zoom }}></i>
            </button>

            <span
              style={{
                fontSize: 14 * zoom,
                fontWeight: 600,
                color: '#334155',
              }}
            >
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>

            <button
              type="button"
              onClick={goToNextMonth}
              style={{
                width: 28 * zoom,
                height: 28 * zoom,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 6 * zoom,
                color: '#64748b',
              }}
            >
              <i className="fas fa-chevron-right" style={{ fontSize: 12 * zoom }}></i>
            </button>
          </div>

          {/* Day headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2 * zoom,
              marginBottom: 4 * zoom,
            }}
          >
            {DAYS.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: 10 * zoom,
                  fontWeight: 600,
                  color: '#94a3b8',
                  padding: `${4 * zoom}px 0`,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2 * zoom,
            }}
          >
            {calendarDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => !day.isDisabled && handleSelectDate(day.date)}
                disabled={day.isDisabled}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12 * zoom,
                  fontWeight: day.isSelected ? 600 : 400,
                  color: day.isDisabled
                    ? '#cbd5e1'
                    : day.isSelected
                    ? '#ffffff'
                    : day.isCurrentMonth
                    ? day.isToday
                      ? '#6366f1'
                      : '#334155'
                    : '#94a3b8',
                  backgroundColor: day.isSelected
                    ? '#6366f1'
                    : day.isToday && !day.isSelected
                    ? '#eef2ff'
                    : 'transparent',
                  border: 'none',
                  borderRadius: 6 * zoom,
                  cursor: day.isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 12 * zoom,
              paddingTop: 12 * zoom,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={goToToday}
              style={{
                padding: `${6 * zoom}px ${12 * zoom}px`,
                fontSize: 11 * zoom,
                fontWeight: 600,
                color: '#6366f1',
                backgroundColor: '#eef2ff',
                border: 'none',
                borderRadius: 6 * zoom,
                cursor: 'pointer',
              }}
            >
              Today
            </button>
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

export default DatePickerField;
