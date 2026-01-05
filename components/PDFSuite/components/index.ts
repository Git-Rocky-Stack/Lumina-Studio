// ============================================
// PDFSuite Components - Barrel Export
// ============================================

// Phase 1 - Core viewer components
export { PDFViewer } from './PDFViewer';
export { PDFToolbar } from './PDFToolbar';
export { PageThumbnails } from './PageThumbnails';
export { PDFSidebar } from './PDFSidebar';

// Phase 2 - Text editing and annotations
export { TextEditor } from './TextEditor';
export { FindReplacePanel } from './FindReplacePanel';
export { CommentPanel } from './CommentPanel';
export { RedactionTool } from './RedactionTool';

// Phase 3 - Forms and templates
export { FormFieldPalette } from './FormFieldPalette';
export { TextInputField } from './TextInputField';
export { CheckboxField, RadioGroupField } from './CheckboxField';
export { DropdownField } from './DropdownField';
export { DatePickerField } from './DatePickerField';
export { SignatureField } from './SignatureField';
export { TemplateGallery, TEMPLATES } from './TemplateGallery';

// Phase 4 - Import/Export & Page Manipulation
export { ImportModal } from './ImportModal';
export { ExportModal } from './ExportModal';
export { MergePanel } from './MergePanel';
export { SplitPanel } from './SplitPanel';
export { PageManipulator } from './PageManipulator';
export { CompressionSettings } from './CompressionSettings';
export { EncryptionSettings } from './EncryptionSettings';

// Phase 5 - Creative Tools & Typography
export { DrawingCanvas } from './DrawingCanvas';
export { ShapeTools } from './ShapeTools';
export { StampPicker } from './StampPicker';
export { WatermarkEditor } from './WatermarkEditor';
export { FontPicker } from './FontPicker';
export { TextStylePanel } from './TextStylePanel';

// Phase 6 - Cloud Integration & Sharing
export { CloudStoragePanel } from './CloudStoragePanel';
export { SyncStatusIndicator, SyncStatusBadge } from './SyncStatusIndicator';
export { ShareModal } from './ShareModal';
export { QRCodeGenerator, QRCodePreview } from './QRCodeGenerator';
export { VersionHistoryPanel, VersionBadge } from './VersionHistoryPanel';

// Phase 7 - Enhanced Annotations (NEW)
export { AnnotationLayersPanel } from './AnnotationLayersPanel';
export { RichTextToolbar } from './RichTextToolbar';
export { VoiceNoteRecorder } from './VoiceNoteRecorder';
export { AISuggestionsPanel } from './AISuggestionsPanel';
export { AnnotationTemplatesGallery } from './AnnotationTemplatesGallery';
export { CollaboratorPresence } from './CollaboratorPresence';
export { AnnotationSearchFilter } from './AnnotationSearchFilter';
export { EnhancedCommentThreads } from './EnhancedCommentThreads';
export { EnhancedPDFAnnotationDemo } from './EnhancedPDFAnnotationDemo';

// Type exports
export type { PDFViewerHandle } from './PDFViewer';
export type { FormTemplate, TemplateCategory } from './TemplateGallery';
export type { ShapeType, ShapeConfig } from './ShapeTools';
export type { Stamp, StampCategory } from './StampPicker';
export type { WatermarkConfig, WatermarkPosition } from './WatermarkEditor';
