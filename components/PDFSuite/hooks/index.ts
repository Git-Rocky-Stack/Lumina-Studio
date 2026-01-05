// ============================================
// PDFSuite Hooks - Barrel Export
// ============================================

// Phase 1 - Core document management
export { usePDFDocument } from './usePDFDocument';
export { usePDFPages } from './usePDFPages';
export { usePDFHistory } from './usePDFHistory';

// Phase 2 - Text editing and annotations
export { usePDFText } from './usePDFText';
export { usePDFAnnotations } from './usePDFAnnotations';
export { useFindReplace } from './useFindReplace';

// Phase 3 - Forms and validation
export { usePDFForm } from './usePDFForm';
export { useFormValidation } from './useFormValidation';
export { useFormData } from './useFormData';

// Phase 5 - Creative tools and typography
export { useDrawingLayer } from './useDrawingLayer';
export { useFontLoader } from './useFontLoader';
export { useTextFormatting } from './useTextFormatting';

// Phase 6 - Cloud integration
export { useCloudStorage } from './useCloudStorage';

// Phase 7 - Enhanced annotations (NEW)
export { useEnhancedAnnotations } from './useEnhancedAnnotations';

// Type exports
export type { default as UsePDFDocumentReturn } from './usePDFDocument';
export type { default as UsePDFPagesReturn } from './usePDFPages';
export type { default as UsePDFHistoryReturn } from './usePDFHistory';
export type { SearchMatch } from './useFindReplace';
export type { ValidationRule, ValidationRuleType } from './useFormValidation';
export type { DrawingTool, DrawingSettings, DrawingObject } from './useDrawingLayer';
export type { GoogleFont, FontVariant, FontPairing } from './useFontLoader';
export type { TextStyle, ParagraphStyle, StylePreset } from './useTextFormatting';
export type {
  AnnotationLayer,
  RichTextAnnotation,
  VoiceNote,
  AISuggestion,
  AnnotationTemplate,
  CollaboratorPresence,
  AnnotationReaction,
  EnhancedAnnotation,
  AnnotationFilters,
  AnnotationStats,
} from './useEnhancedAnnotations';
