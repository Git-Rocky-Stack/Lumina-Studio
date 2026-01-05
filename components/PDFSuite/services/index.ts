// ============================================
// PDF Suite Services Index
// Export all services for easy importing
// ============================================

export {
  DocumentService,
  LayerService,
  AnnotationService,
  VoiceNoteService,
  AISuggestionService,
  TemplateService,
  CollaborationService,
  ReplyService,
} from './annotationService';

export type {
  PDFDocument,
  AnnotationSession,
  AnnotationReply,
} from './annotationService';

export { default as AnnotationServiceBundle } from './annotationService';
