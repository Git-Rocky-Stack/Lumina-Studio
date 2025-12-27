// ============================================
// useFormValidation Hook
// Provides validation rules and utilities for form fields
// ============================================

import { useCallback, useMemo } from 'react';
import type { FormFieldValidation } from '../types';

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-()]{10,}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  ssn: /^\d{3}-?\d{2}-?\d{4}$/,
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]?\d|2[0-3]):[0-5]\d$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alpha: /^[a-zA-Z]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+\.?\d*$/,
  currency: /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/,
} as const;

// Validation rule types
export type ValidationRuleType =
  | 'required'
  | 'email'
  | 'phone'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'zipCode'
  | 'ssn'
  | 'creditCard'
  | 'url'
  | 'date'
  | 'alphanumeric'
  | 'numeric'
  | 'custom';

export interface ValidationRule {
  type: ValidationRuleType;
  value?: number | string | RegExp | ((value: unknown) => boolean | string);
  message?: string;
}

interface UseFormValidationReturn {
  // Pre-built validation configs
  emailValidation: FormFieldValidation;
  phoneValidation: FormFieldValidation;
  requiredValidation: FormFieldValidation;
  zipCodeValidation: FormFieldValidation;
  ssnValidation: FormFieldValidation;
  creditCardValidation: FormFieldValidation;
  urlValidation: FormFieldValidation;

  // Validation builders
  createMinLength: (min: number, message?: string) => FormFieldValidation;
  createMaxLength: (max: number, message?: string) => FormFieldValidation;
  createRange: (min: number, max: number, message?: string) => FormFieldValidation;
  createPattern: (pattern: string | RegExp, message?: string) => FormFieldValidation;
  createCustom: (validator: (value: unknown) => boolean | string, message?: string) => FormFieldValidation;

  // Combine validations
  combineValidations: (...validations: FormFieldValidation[]) => FormFieldValidation;

  // Validation utilities
  validate: (value: unknown, validation: FormFieldValidation) => { isValid: boolean; errors: string[] };
  validateRules: (value: unknown, rules: ValidationRule[]) => { isValid: boolean; errors: string[] };

  // Format helpers
  formatPhone: (value: string) => string;
  formatSSN: (value: string) => string;
  formatCreditCard: (value: string) => string;
  formatZipCode: (value: string) => string;
  formatCurrency: (value: string) => string;
}

export function useFormValidation(): UseFormValidationReturn {
  // Pre-built validation configs
  const emailValidation: FormFieldValidation = useMemo(() => ({
    pattern: VALIDATION_PATTERNS.email.source,
    message: 'Please enter a valid email address',
  }), []);

  const phoneValidation: FormFieldValidation = useMemo(() => ({
    pattern: VALIDATION_PATTERNS.phone.source,
    message: 'Please enter a valid phone number',
  }), []);

  const requiredValidation: FormFieldValidation = useMemo(() => ({
    message: 'This field is required',
  }), []);

  const zipCodeValidation: FormFieldValidation = useMemo(() => ({
    pattern: VALIDATION_PATTERNS.zipCode.source,
    message: 'Please enter a valid ZIP code',
  }), []);

  const ssnValidation: FormFieldValidation = useMemo(() => ({
    pattern: VALIDATION_PATTERNS.ssn.source,
    message: 'Please enter a valid SSN (XXX-XX-XXXX)',
  }), []);

  const creditCardValidation: FormFieldValidation = useMemo(() => ({
    pattern: VALIDATION_PATTERNS.creditCard.source,
    message: 'Please enter a valid credit card number',
    custom: (value: unknown) => {
      if (typeof value !== 'string') return false;
      // Luhn algorithm check
      const digits = value.replace(/\D/g, '');
      let sum = 0;
      let isEven = false;
      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]!, 10);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0 || 'Invalid credit card number';
    },
  }), []);

  const urlValidation: FormFieldValidation = useMemo(() => ({
    pattern: VALIDATION_PATTERNS.url.source,
    message: 'Please enter a valid URL',
  }), []);

  // Validation builders
  const createMinLength = useCallback((min: number, message?: string): FormFieldValidation => ({
    minLength: min,
    message: message || `Minimum ${min} characters required`,
  }), []);

  const createMaxLength = useCallback((max: number, message?: string): FormFieldValidation => ({
    maxLength: max,
    message: message || `Maximum ${max} characters allowed`,
  }), []);

  const createRange = useCallback((min: number, max: number, message?: string): FormFieldValidation => ({
    min,
    max,
    message: message || `Value must be between ${min} and ${max}`,
  }), []);

  const createPattern = useCallback((pattern: string | RegExp, message?: string): FormFieldValidation => ({
    pattern: typeof pattern === 'string' ? pattern : pattern.source,
    message: message || 'Invalid format',
  }), []);

  const createCustom = useCallback((
    validator: (value: unknown) => boolean | string,
    message?: string
  ): FormFieldValidation => ({
    custom: validator,
    message: message || 'Validation failed',
  }), []);

  // Combine validations
  const combineValidations = useCallback((...validations: FormFieldValidation[]): FormFieldValidation => {
    const combined: FormFieldValidation = {};

    for (const validation of validations) {
      if (validation.pattern && !combined.pattern) {
        combined.pattern = validation.pattern;
      }
      if (validation.minLength !== undefined) {
        combined.minLength = Math.max(combined.minLength ?? 0, validation.minLength);
      }
      if (validation.maxLength !== undefined) {
        combined.maxLength = Math.min(combined.maxLength ?? Infinity, validation.maxLength);
      }
      if (validation.min !== undefined) {
        combined.min = Math.max(combined.min ?? -Infinity, validation.min);
      }
      if (validation.max !== undefined) {
        combined.max = Math.min(combined.max ?? Infinity, validation.max);
      }
      if (validation.custom) {
        const prevCustom = combined.custom;
        combined.custom = (value: unknown) => {
          if (prevCustom) {
            const prevResult = prevCustom(value);
            if (typeof prevResult === 'string') return prevResult;
            if (!prevResult) return validation.message || 'Validation failed';
          }
          return validation.custom!(value);
        };
      }
      if (validation.message && !combined.message) {
        combined.message = validation.message;
      }
    }

    return combined;
  }, []);

  // Validate a value against a validation config
  const validate = useCallback((
    value: unknown,
    validation: FormFieldValidation
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (value === null || value === undefined || value === '') {
      return { isValid: true, errors: [] };
    }

    const strValue = typeof value === 'string' ? value : String(value);

    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(strValue)) {
        errors.push(validation.message || 'Invalid format');
      }
    }

    if (validation.minLength !== undefined && strValue.length < validation.minLength) {
      errors.push(`Minimum ${validation.minLength} characters required`);
    }

    if (validation.maxLength !== undefined && strValue.length > validation.maxLength) {
      errors.push(`Maximum ${validation.maxLength} characters allowed`);
    }

    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push(`Minimum value is ${validation.min}`);
      }
      if (validation.max !== undefined && value > validation.max) {
        errors.push(`Maximum value is ${validation.max}`);
      }
    }

    if (validation.custom) {
      const result = validation.custom(value);
      if (typeof result === 'string') {
        errors.push(result);
      } else if (!result) {
        errors.push(validation.message || 'Validation failed');
      }
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  // Validate against multiple rules
  const validateRules = useCallback((
    value: unknown,
    rules: ValidationRule[]
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const strValue = typeof value === 'string' ? value : String(value);

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (value === null || value === undefined || value === '') {
            errors.push(rule.message || 'This field is required');
          }
          break;

        case 'email':
          if (value && !VALIDATION_PATTERNS.email.test(strValue)) {
            errors.push(rule.message || 'Invalid email address');
          }
          break;

        case 'phone':
          if (value && !VALIDATION_PATTERNS.phone.test(strValue)) {
            errors.push(rule.message || 'Invalid phone number');
          }
          break;

        case 'minLength':
          if (typeof rule.value === 'number' && strValue.length < rule.value) {
            errors.push(rule.message || `Minimum ${rule.value} characters`);
          }
          break;

        case 'maxLength':
          if (typeof rule.value === 'number' && strValue.length > rule.value) {
            errors.push(rule.message || `Maximum ${rule.value} characters`);
          }
          break;

        case 'min':
          if (typeof rule.value === 'number' && typeof value === 'number' && value < rule.value) {
            errors.push(rule.message || `Minimum value is ${rule.value}`);
          }
          break;

        case 'max':
          if (typeof rule.value === 'number' && typeof value === 'number' && value > rule.value) {
            errors.push(rule.message || `Maximum value is ${rule.value}`);
          }
          break;

        case 'pattern':
          if (rule.value) {
            const pattern = typeof rule.value === 'string' ? new RegExp(rule.value) : rule.value as RegExp;
            if (value && !pattern.test(strValue)) {
              errors.push(rule.message || 'Invalid format');
            }
          }
          break;

        case 'zipCode':
          if (value && !VALIDATION_PATTERNS.zipCode.test(strValue)) {
            errors.push(rule.message || 'Invalid ZIP code');
          }
          break;

        case 'ssn':
          if (value && !VALIDATION_PATTERNS.ssn.test(strValue)) {
            errors.push(rule.message || 'Invalid SSN');
          }
          break;

        case 'creditCard':
          if (value && !VALIDATION_PATTERNS.creditCard.test(strValue)) {
            errors.push(rule.message || 'Invalid credit card');
          }
          break;

        case 'url':
          if (value && !VALIDATION_PATTERNS.url.test(strValue)) {
            errors.push(rule.message || 'Invalid URL');
          }
          break;

        case 'alphanumeric':
          if (value && !VALIDATION_PATTERNS.alphanumeric.test(strValue)) {
            errors.push(rule.message || 'Only letters and numbers allowed');
          }
          break;

        case 'numeric':
          if (value && !VALIDATION_PATTERNS.numeric.test(strValue)) {
            errors.push(rule.message || 'Only numbers allowed');
          }
          break;

        case 'custom':
          if (typeof rule.value === 'function') {
            const result = rule.value(value);
            if (typeof result === 'string') {
              errors.push(result);
            } else if (!result) {
              errors.push(rule.message || 'Validation failed');
            }
          }
          break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  // Format helpers
  const formatPhone = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }, []);

  const formatSSN = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  }, []);

  const formatCreditCard = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  }, []);

  const formatZipCode = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  }, []);

  const formatCurrency = useCallback((value: string): string => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numValue);
  }, []);

  return {
    // Pre-built validation configs
    emailValidation,
    phoneValidation,
    requiredValidation,
    zipCodeValidation,
    ssnValidation,
    creditCardValidation,
    urlValidation,

    // Validation builders
    createMinLength,
    createMaxLength,
    createRange,
    createPattern,
    createCustom,

    // Combine validations
    combineValidations,

    // Validation utilities
    validate,
    validateRules,

    // Format helpers
    formatPhone,
    formatSSN,
    formatCreditCard,
    formatZipCode,
    formatCurrency,
  };
}

export default useFormValidation;
