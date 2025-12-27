// ============================================
// usePDFForm Hook
// Manages form field state, interactions, and data
// ============================================

import { useState, useCallback, useMemo, useRef } from 'react';
import type {
  PDFFormField,
  FormFieldType,
  FormFieldValidation,
  AnnotationRect,
} from '../types';

interface FormFieldValue {
  fieldId: string;
  value: string | boolean | string[] | Date | null;
  isValid: boolean;
  errors: string[];
  isDirty: boolean;
  isTouched: boolean;
}

interface UsePDFFormOptions {
  onFieldAdd?: (field: PDFFormField) => void;
  onFieldUpdate?: (field: PDFFormField) => void;
  onFieldDelete?: (id: string) => void;
  onValueChange?: (fieldId: string, value: FormFieldValue['value']) => void;
  onFormSubmit?: (data: Record<string, FormFieldValue['value']>) => void;
}

interface UsePDFFormReturn {
  // Form fields
  fields: PDFFormField[];
  fieldCount: number;

  // Field CRUD
  addField: (
    type: FormFieldType,
    pageNumber: number,
    rect: AnnotationRect,
    options?: Partial<PDFFormField>
  ) => PDFFormField;
  updateField: (id: string, updates: Partial<PDFFormField>) => void;
  deleteField: (id: string) => void;
  duplicateField: (id: string) => PDFFormField | null;

  // Field queries
  getField: (id: string) => PDFFormField | undefined;
  getFieldsForPage: (pageNumber: number) => PDFFormField[];
  getFieldsByType: (type: FormFieldType) => PDFFormField[];

  // Selection
  selectedFieldId: string | null;
  selectField: (id: string | null) => void;
  hoveredFieldId: string | null;
  setHoveredField: (id: string | null) => void;

  // Values
  values: Map<string, FormFieldValue>;
  getValue: (fieldId: string) => FormFieldValue['value'];
  setValue: (fieldId: string, value: FormFieldValue['value']) => void;
  setFieldTouched: (fieldId: string) => void;

  // Validation
  validateField: (fieldId: string) => boolean;
  validateAll: () => boolean;
  isFormValid: boolean;
  getFieldErrors: (fieldId: string) => string[];

  // Form actions
  resetForm: () => void;
  clearForm: () => void;
  submitForm: () => Record<string, FormFieldValue['value']> | null;

  // Import/Export
  exportFields: () => PDFFormField[];
  importFields: (fields: PDFFormField[]) => void;
  exportData: () => Record<string, FormFieldValue['value']>;
  importData: (data: Record<string, FormFieldValue['value']>) => void;

  // Tab order
  tabOrder: string[];
  setTabOrder: (order: string[]) => void;
  getNextField: (currentId: string) => string | null;
  getPreviousField: (currentId: string) => string | null;

  // Bulk operations
  setFields: (fields: PDFFormField[]) => void;
  moveFields: (ids: string[], deltaX: number, deltaY: number) => void;
  alignFields: (ids: string[], alignment: 'left' | 'right' | 'top' | 'bottom' | 'center') => void;
  distributeFields: (ids: string[], direction: 'horizontal' | 'vertical') => void;
}

export function usePDFForm(options: UsePDFFormOptions = {}): UsePDFFormReturn {
  const {
    onFieldAdd,
    onFieldUpdate,
    onFieldDelete,
    onValueChange,
    onFormSubmit,
  } = options;

  // State
  const [fields, setFields] = useState<PDFFormField[]>([]);
  const [values, setValues] = useState<Map<string, FormFieldValue>>(new Map());
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [tabOrder, setTabOrder] = useState<string[]>([]);

  // Refs
  const idCounterRef = useRef(0);

  // Generate unique ID
  const generateId = useCallback(() => {
    idCounterRef.current += 1;
    return `field-${Date.now()}-${idCounterRef.current}`;
  }, []);

  // Initialize field value
  const initializeFieldValue = useCallback((field: PDFFormField): FormFieldValue => {
    let defaultValue: FormFieldValue['value'] = null;

    switch (field.type) {
      case 'text':
      case 'textarea':
        defaultValue = field.defaultValue || '';
        break;
      case 'checkbox':
        defaultValue = field.defaultValue === 'true' || field.defaultValue === true;
        break;
      case 'radio':
        defaultValue = field.defaultValue || '';
        break;
      case 'dropdown':
        defaultValue = field.defaultValue || '';
        break;
      case 'date':
        defaultValue = field.defaultValue ? new Date(field.defaultValue as string) : null;
        break;
      case 'signature':
        defaultValue = '';
        break;
      default:
        defaultValue = '';
    }

    return {
      fieldId: field.id,
      value: defaultValue,
      isValid: true,
      errors: [],
      isDirty: false,
      isTouched: false,
    };
  }, []);

  // Add field
  const addField = useCallback(
    (
      type: FormFieldType,
      pageNumber: number,
      rect: AnnotationRect,
      fieldOptions: Partial<PDFFormField> = {}
    ): PDFFormField => {
      const now = Date.now();
      const field: PDFFormField = {
        id: generateId(),
        type,
        pageNumber,
        rect,
        name: fieldOptions.name || `${type}_${idCounterRef.current}`,
        label: fieldOptions.label || '',
        placeholder: fieldOptions.placeholder || '',
        required: fieldOptions.required || false,
        readOnly: fieldOptions.readOnly || false,
        hidden: fieldOptions.hidden || false,
        validation: fieldOptions.validation,
        options: fieldOptions.options || [],
        defaultValue: fieldOptions.defaultValue,
        fontSize: fieldOptions.fontSize || 12,
        fontFamily: fieldOptions.fontFamily || 'Helvetica',
        textColor: fieldOptions.textColor || '#000000',
        backgroundColor: fieldOptions.backgroundColor || '#ffffff',
        borderColor: fieldOptions.borderColor || '#cccccc',
        borderWidth: fieldOptions.borderWidth ?? 1,
        borderRadius: fieldOptions.borderRadius ?? 4,
        tabIndex: fieldOptions.tabIndex ?? fields.length,
        createdAt: now,
        modifiedAt: now,
        ...fieldOptions,
      };

      setFields((prev) => [...prev, field]);
      setValues((prev) => new Map(prev).set(field.id, initializeFieldValue(field)));
      setTabOrder((prev) => [...prev, field.id]);

      if (onFieldAdd) {
        onFieldAdd(field);
      }

      return field;
    },
    [generateId, fields.length, initializeFieldValue, onFieldAdd]
  );

  // Update field
  const updateField = useCallback(
    (id: string, updates: Partial<PDFFormField>) => {
      setFields((prev) =>
        prev.map((field) => {
          if (field.id === id) {
            const updated = { ...field, ...updates, modifiedAt: Date.now() };
            if (onFieldUpdate) {
              onFieldUpdate(updated);
            }
            return updated;
          }
          return field;
        })
      );
    },
    [onFieldUpdate]
  );

  // Delete field
  const deleteField = useCallback(
    (id: string) => {
      setFields((prev) => prev.filter((field) => field.id !== id));
      setValues((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      setTabOrder((prev) => prev.filter((fieldId) => fieldId !== id));

      if (selectedFieldId === id) {
        setSelectedFieldId(null);
      }

      if (onFieldDelete) {
        onFieldDelete(id);
      }
    },
    [selectedFieldId, onFieldDelete]
  );

  // Duplicate field
  const duplicateField = useCallback(
    (id: string): PDFFormField | null => {
      const original = fields.find((f) => f.id === id);
      if (!original) return null;

      const duplicate: PDFFormField = {
        ...original,
        id: generateId(),
        name: `${original.name}_copy`,
        rect: {
          ...original.rect,
          x: original.rect.x + 20,
          y: original.rect.y + 20,
        },
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };

      setFields((prev) => [...prev, duplicate]);
      setValues((prev) => new Map(prev).set(duplicate.id, initializeFieldValue(duplicate)));
      setTabOrder((prev) => [...prev, duplicate.id]);

      if (onFieldAdd) {
        onFieldAdd(duplicate);
      }

      return duplicate;
    },
    [fields, generateId, initializeFieldValue, onFieldAdd]
  );

  // Get field
  const getField = useCallback(
    (id: string): PDFFormField | undefined => {
      return fields.find((f) => f.id === id);
    },
    [fields]
  );

  // Get fields for page
  const getFieldsForPage = useCallback(
    (pageNumber: number): PDFFormField[] => {
      return fields.filter((f) => f.pageNumber === pageNumber);
    },
    [fields]
  );

  // Get fields by type
  const getFieldsByType = useCallback(
    (type: FormFieldType): PDFFormField[] => {
      return fields.filter((f) => f.type === type);
    },
    [fields]
  );

  // Select field
  const selectField = useCallback((id: string | null) => {
    setSelectedFieldId(id);
  }, []);

  // Set hovered field
  const setHoveredField = useCallback((id: string | null) => {
    setHoveredFieldId(id);
  }, []);

  // Get value
  const getValue = useCallback(
    (fieldId: string): FormFieldValue['value'] => {
      return values.get(fieldId)?.value ?? null;
    },
    [values]
  );

  // Set value
  const setValue = useCallback(
    (fieldId: string, value: FormFieldValue['value']) => {
      setValues((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(fieldId);
        if (existing) {
          newMap.set(fieldId, {
            ...existing,
            value,
            isDirty: true,
          });
        }
        return newMap;
      });

      if (onValueChange) {
        onValueChange(fieldId, value);
      }
    },
    [onValueChange]
  );

  // Set field touched
  const setFieldTouched = useCallback((fieldId: string) => {
    setValues((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(fieldId);
      if (existing) {
        newMap.set(fieldId, {
          ...existing,
          isTouched: true,
        });
      }
      return newMap;
    });
  }, []);

  // Validate single field
  const validateField = useCallback(
    (fieldId: string): boolean => {
      const field = fields.find((f) => f.id === fieldId);
      const fieldValue = values.get(fieldId);

      if (!field || !fieldValue) return true;

      const errors: string[] = [];
      const value = fieldValue.value;

      // Required validation
      if (field.required) {
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          errors.push(`${field.label || field.name} is required`);
        }
      }

      // Custom validation
      if (field.validation && value !== null && value !== '') {
        const { pattern, minLength, maxLength, min, max, custom } = field.validation;

        if (typeof value === 'string') {
          if (pattern && !new RegExp(pattern).test(value)) {
            errors.push(field.validation.message || 'Invalid format');
          }
          if (minLength && value.length < minLength) {
            errors.push(`Minimum ${minLength} characters required`);
          }
          if (maxLength && value.length > maxLength) {
            errors.push(`Maximum ${maxLength} characters allowed`);
          }
        }

        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors.push(`Minimum value is ${min}`);
          }
          if (max !== undefined && value > max) {
            errors.push(`Maximum value is ${max}`);
          }
        }

        if (custom) {
          const customResult = custom(value);
          if (typeof customResult === 'string') {
            errors.push(customResult);
          } else if (!customResult) {
            errors.push(field.validation.message || 'Validation failed');
          }
        }
      }

      const isValid = errors.length === 0;

      setValues((prev) => {
        const newMap = new Map(prev);
        newMap.set(fieldId, {
          ...fieldValue,
          isValid,
          errors,
        });
        return newMap;
      });

      return isValid;
    },
    [fields, values]
  );

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    let allValid = true;

    for (const field of fields) {
      const isValid = validateField(field.id);
      if (!isValid) {
        allValid = false;
      }
    }

    return allValid;
  }, [fields, validateField]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return Array.from(values.values()).every((v) => v.isValid);
  }, [values]);

  // Get field errors
  const getFieldErrors = useCallback(
    (fieldId: string): string[] => {
      return values.get(fieldId)?.errors || [];
    },
    [values]
  );

  // Reset form to default values
  const resetForm = useCallback(() => {
    setValues((prev) => {
      const newMap = new Map();
      fields.forEach((field) => {
        newMap.set(field.id, initializeFieldValue(field));
      });
      return newMap;
    });
  }, [fields, initializeFieldValue]);

  // Clear all form data
  const clearForm = useCallback(() => {
    setFields([]);
    setValues(new Map());
    setTabOrder([]);
    setSelectedFieldId(null);
  }, []);

  // Submit form
  const submitForm = useCallback((): Record<string, FormFieldValue['value']> | null => {
    const isValid = validateAll();

    if (!isValid) {
      return null;
    }

    const data: Record<string, FormFieldValue['value']> = {};
    fields.forEach((field) => {
      const fieldValue = values.get(field.id);
      data[field.name] = fieldValue?.value ?? null;
    });

    if (onFormSubmit) {
      onFormSubmit(data);
    }

    return data;
  }, [fields, values, validateAll, onFormSubmit]);

  // Export fields
  const exportFields = useCallback((): PDFFormField[] => {
    return [...fields];
  }, [fields]);

  // Import fields
  const importFields = useCallback((newFields: PDFFormField[]) => {
    setFields(newFields);
    const newValues = new Map<string, FormFieldValue>();
    newFields.forEach((field) => {
      newValues.set(field.id, initializeFieldValue(field));
    });
    setValues(newValues);
    setTabOrder(newFields.map((f) => f.id));
  }, [initializeFieldValue]);

  // Export data
  const exportData = useCallback((): Record<string, FormFieldValue['value']> => {
    const data: Record<string, FormFieldValue['value']> = {};
    fields.forEach((field) => {
      const fieldValue = values.get(field.id);
      data[field.name] = fieldValue?.value ?? null;
    });
    return data;
  }, [fields, values]);

  // Import data
  const importData = useCallback((data: Record<string, FormFieldValue['value']>) => {
    fields.forEach((field) => {
      if (data.hasOwnProperty(field.name)) {
        setValue(field.id, data[field.name]);
      }
    });
  }, [fields, setValue]);

  // Get next field in tab order
  const getNextField = useCallback(
    (currentId: string): string | null => {
      const currentIndex = tabOrder.indexOf(currentId);
      if (currentIndex === -1 || currentIndex === tabOrder.length - 1) {
        return tabOrder[0] || null;
      }
      return tabOrder[currentIndex + 1] || null;
    },
    [tabOrder]
  );

  // Get previous field in tab order
  const getPreviousField = useCallback(
    (currentId: string): string | null => {
      const currentIndex = tabOrder.indexOf(currentId);
      if (currentIndex <= 0) {
        return tabOrder[tabOrder.length - 1] || null;
      }
      return tabOrder[currentIndex - 1] || null;
    },
    [tabOrder]
  );

  // Move fields
  const moveFields = useCallback(
    (ids: string[], deltaX: number, deltaY: number) => {
      setFields((prev) =>
        prev.map((field) => {
          if (ids.includes(field.id)) {
            return {
              ...field,
              rect: {
                ...field.rect,
                x: field.rect.x + deltaX,
                y: field.rect.y + deltaY,
              },
              modifiedAt: Date.now(),
            };
          }
          return field;
        })
      );
    },
    []
  );

  // Align fields
  const alignFields = useCallback(
    (ids: string[], alignment: 'left' | 'right' | 'top' | 'bottom' | 'center') => {
      const targetFields = fields.filter((f) => ids.includes(f.id));
      if (targetFields.length < 2) return;

      let targetValue: number;

      switch (alignment) {
        case 'left':
          targetValue = Math.min(...targetFields.map((f) => f.rect.x));
          setFields((prev) =>
            prev.map((field) =>
              ids.includes(field.id)
                ? { ...field, rect: { ...field.rect, x: targetValue }, modifiedAt: Date.now() }
                : field
            )
          );
          break;
        case 'right':
          targetValue = Math.max(...targetFields.map((f) => f.rect.x + f.rect.width));
          setFields((prev) =>
            prev.map((field) =>
              ids.includes(field.id)
                ? { ...field, rect: { ...field.rect, x: targetValue - field.rect.width }, modifiedAt: Date.now() }
                : field
            )
          );
          break;
        case 'top':
          targetValue = Math.min(...targetFields.map((f) => f.rect.y));
          setFields((prev) =>
            prev.map((field) =>
              ids.includes(field.id)
                ? { ...field, rect: { ...field.rect, y: targetValue }, modifiedAt: Date.now() }
                : field
            )
          );
          break;
        case 'bottom':
          targetValue = Math.max(...targetFields.map((f) => f.rect.y + f.rect.height));
          setFields((prev) =>
            prev.map((field) =>
              ids.includes(field.id)
                ? { ...field, rect: { ...field.rect, y: targetValue - field.rect.height }, modifiedAt: Date.now() }
                : field
            )
          );
          break;
        case 'center':
          const centerX = targetFields.reduce((sum, f) => sum + f.rect.x + f.rect.width / 2, 0) / targetFields.length;
          setFields((prev) =>
            prev.map((field) =>
              ids.includes(field.id)
                ? { ...field, rect: { ...field.rect, x: centerX - field.rect.width / 2 }, modifiedAt: Date.now() }
                : field
            )
          );
          break;
      }
    },
    [fields]
  );

  // Distribute fields evenly
  const distributeFields = useCallback(
    (ids: string[], direction: 'horizontal' | 'vertical') => {
      const targetFields = fields.filter((f) => ids.includes(f.id));
      if (targetFields.length < 3) return;

      const sorted = [...targetFields].sort((a, b) =>
        direction === 'horizontal' ? a.rect.x - b.rect.x : a.rect.y - b.rect.y
      );

      const first = sorted[0]!;
      const last = sorted[sorted.length - 1]!;

      const totalSpace = direction === 'horizontal'
        ? (last.rect.x + last.rect.width) - first.rect.x
        : (last.rect.y + last.rect.height) - first.rect.y;

      const totalFieldSize = sorted.reduce(
        (sum, f) => sum + (direction === 'horizontal' ? f.rect.width : f.rect.height),
        0
      );

      const gap = (totalSpace - totalFieldSize) / (sorted.length - 1);

      let currentPos = direction === 'horizontal' ? first.rect.x : first.rect.y;

      const updates: Record<string, number> = {};
      sorted.forEach((field, index) => {
        if (index === 0) {
          currentPos += direction === 'horizontal' ? field.rect.width : field.rect.height;
          currentPos += gap;
          return;
        }

        updates[field.id] = currentPos;
        currentPos += direction === 'horizontal' ? field.rect.width : field.rect.height;
        currentPos += gap;
      });

      setFields((prev) =>
        prev.map((field) => {
          if (updates[field.id] !== undefined) {
            return {
              ...field,
              rect: {
                ...field.rect,
                [direction === 'horizontal' ? 'x' : 'y']: updates[field.id],
              },
              modifiedAt: Date.now(),
            };
          }
          return field;
        })
      );
    },
    [fields]
  );

  return {
    // Form fields
    fields,
    fieldCount: fields.length,

    // Field CRUD
    addField,
    updateField,
    deleteField,
    duplicateField,

    // Field queries
    getField,
    getFieldsForPage,
    getFieldsByType,

    // Selection
    selectedFieldId,
    selectField,
    hoveredFieldId,
    setHoveredField,

    // Values
    values,
    getValue,
    setValue,
    setFieldTouched,

    // Validation
    validateField,
    validateAll,
    isFormValid,
    getFieldErrors,

    // Form actions
    resetForm,
    clearForm,
    submitForm,

    // Import/Export
    exportFields,
    importFields,
    exportData,
    importData,

    // Tab order
    tabOrder,
    setTabOrder,
    getNextField,
    getPreviousField,

    // Bulk operations
    setFields,
    moveFields,
    alignFields,
    distributeFields,
  };
}

export default usePDFForm;
