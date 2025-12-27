// ============================================
// LUMINA PDF SUITE PRO - TYPE DEFINITIONS
// ============================================

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// ============================================
// CORE PDF TYPES
// ============================================

export interface PDFDocument {
  id: string;
  name: string;
  source: File | string | ArrayBuffer;
  proxy: PDFDocumentProxy | null;
  pageCount: number;
  metadata: PDFMetadata;
  isModified: boolean;
  isEncrypted: boolean;
  permissions?: PDFPermissions;
  createdAt: number;
  modifiedAt: number;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  version?: string;
}

export interface PDFPermissions {
  printing: boolean;
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
  fillingForms: boolean;
  contentAccessibility: boolean;
  documentAssembly: boolean;
}

export interface PDFPage {
  pageNumber: number;
  proxy: PDFPageProxy | null;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  thumbnail?: string;
  textContent?: PDFTextContent;
  annotations: PDFAnnotation[];
  formFields: PDFFormField[];
}

// ============================================
// TEXT CONTENT TYPES
// ============================================

export interface PDFTextContent {
  items: PDFTextItem[];
  styles: Record<string, PDFTextStyle>;
}

export interface PDFTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic' | 'oblique';
  color: string;
  transform: number[];
  isEdited: boolean;
  originalText?: string;
}

export interface PDFTextStyle {
  fontFamily: string;
  ascent: number;
  descent: number;
  vertical: boolean;
}

export interface TextSelection {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
  text: string;
  bounds: DOMRect;
}

// ============================================
// ANNOTATION TYPES
// ============================================

export type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'squiggly'
  | 'redaction'
  | 'text'
  | 'freeText'
  | 'note'
  | 'stamp'
  | 'ink'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'polyline'
  | 'link'
  | 'fileAttachment'
  | 'sound'
  | 'watermark';

export interface PDFAnnotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  rect: AnnotationRect;
  color: string;
  opacity: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'beveled' | 'inset' | 'underline';
  contents?: string;
  author?: string;
  createdAt: number;
  modifiedAt: number;
  isLocked: boolean;
  isHidden: boolean;
  replies?: PDFAnnotationReply[];
  // Type-specific properties
  textMarkupQuads?: number[][]; // For highlight, underline, strikethrough
  inkPaths?: InkPath[]; // For freehand drawing
  linePoints?: LinePoints; // For lines/arrows
  vertices?: Point[]; // For polygons/polylines
  stampType?: StampType; // For stamps
  linkDestination?: LinkDestination; // For links
  fontSettings?: AnnotationFontSettings; // For text annotations
}

export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationFontSettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface PDFAnnotationReply {
  id: string;
  parentId: string;
  author: string;
  contents: string;
  createdAt: number;
}

export interface InkPath {
  points: Point[];
  strokeWidth: number;
  strokeColor: string;
}

export interface LinePoints {
  start: Point;
  end: Point;
  startStyle?: LineEndStyle;
  endStyle?: LineEndStyle;
}

export type LineEndStyle = 'none' | 'openArrow' | 'closedArrow' | 'circle' | 'square' | 'diamond' | 'butt' | 'slash';

export interface Point {
  x: number;
  y: number;
}

export type StampType =
  | 'approved'
  | 'notApproved'
  | 'draft'
  | 'final'
  | 'completed'
  | 'confidential'
  | 'forPublicRelease'
  | 'notForPublicRelease'
  | 'void'
  | 'forComment'
  | 'preliminaryResults'
  | 'informationOnly'
  | 'custom';

export interface LinkDestination {
  type: 'page' | 'url' | 'named';
  page?: number;
  url?: string;
  name?: string;
  zoom?: number;
  x?: number;
  y?: number;
}

// ============================================
// FORM FIELD TYPES
// ============================================

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'listbox'
  | 'signature'
  | 'date'
  | 'button';

export interface PDFFormField {
  id: string;
  name: string;
  type: FormFieldType;
  pageNumber: number;
  rect: AnnotationRect;
  value: string | boolean | string[];
  defaultValue?: string | boolean | string[];
  isRequired: boolean;
  isReadOnly: boolean;
  isHidden: boolean;
  maxLength?: number;
  options?: FormFieldOption[]; // For dropdown/listbox/radio
  validation?: FormFieldValidation;
  appearance?: FormFieldAppearance;
  tooltip?: string;
  groupName?: string; // For radio buttons
}

export interface FormFieldOption {
  label: string;
  value: string;
  isSelected?: boolean;
}

export interface FormFieldValidation {
  type: 'none' | 'email' | 'phone' | 'number' | 'date' | 'regex' | 'custom';
  pattern?: string;
  min?: number;
  max?: number;
  errorMessage?: string;
}

export interface FormFieldAppearance {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface SignatureField extends PDFFormField {
  type: 'signature';
  signatureData?: SignatureData;
  signatureImage?: string;
}

export interface SignatureData {
  signedBy: string;
  signedAt: Date;
  reason?: string;
  location?: string;
  contactInfo?: string;
  certificate?: string;
}

// ============================================
// REDACTION TYPES
// ============================================

export interface RedactionMark {
  id: string;
  pageNumber: number;
  rect: AnnotationRect;
  overlayText?: string;
  fillColor: string;
  isApplied: boolean;
  reason?: string;
  createdAt: number;
}

export interface PrivacyScanResult {
  term: string;
  type: 'email' | 'phone' | 'address' | 'ssn' | 'creditCard' | 'name' | 'date' | 'custom';
  locations: Array<{
    pageNumber: number;
    rect: AnnotationRect;
    context: string;
  }>;
  confidence: number;
}

// ============================================
// DOCUMENT OPERATIONS
// ============================================

export interface PageRange {
  start: number;
  end: number;
}

export interface MergeOptions {
  documents: PDFDocument[];
  outputName: string;
}

export interface SplitOptions {
  document: PDFDocument;
  ranges: PageRange[];
  extractAsIndividual?: boolean;
}

export interface CompressionOptions {
  quality: 'low' | 'medium' | 'high' | 'maximum';
  removeMetadata?: boolean;
  removeAnnotations?: boolean;
  removeFormFields?: boolean;
  removeBookmarks?: boolean;
  downsampleImages?: boolean;
  imageQuality?: number; // 1-100
}

export interface EncryptionOptions {
  userPassword?: string;
  ownerPassword: string;
  permissions: Partial<PDFPermissions>;
  encryptionLevel: 'AES-128' | 'AES-256' | 'RC4-40' | 'RC4-128';
}

// ============================================
// EXPORT/IMPORT TYPES
// ============================================

export type ImportFormat = 'pdf' | 'docx' | 'doc' | 'png' | 'jpg' | 'jpeg' | 'tiff' | 'bmp' | 'gif' | 'html' | 'txt';
export type ExportFormat = 'pdf' | 'pdfa' | 'png' | 'jpg' | 'tiff' | 'svg' | 'html' | 'txt';

export interface ImportOptions {
  format: ImportFormat;
  file: File;
  ocr?: boolean;
  ocrLanguage?: string;
}

export interface ExportOptions {
  format: ExportFormat;
  pages?: PageRange[];
  quality?: number;
  dpi?: number;
  includeAnnotations?: boolean;
  includeFormData?: boolean;
  flattenLayers?: boolean;
  pdfaConformance?: 'PDF/A-1b' | 'PDF/A-2b' | 'PDF/A-3b';
}

// ============================================
// TOOL TYPES
// ============================================

export type PDFTool =
  | 'select'
  | 'hand'
  | 'zoom'
  | 'textSelect'
  | 'textEdit'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'redact'
  | 'note'
  | 'freeText'
  | 'stamp'
  | 'ink'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'polyline'
  | 'link'
  | 'formText'
  | 'formCheckbox'
  | 'formRadio'
  | 'formDropdown'
  | 'formSignature'
  | 'formDate'
  | 'formButton'
  | 'measure'
  | 'crop';

export interface ToolSettings {
  // General
  color: string;
  secondaryColor: string;
  opacity: number;
  borderWidth: number;

  // Text tools
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';

  // Ink/drawing tools
  strokeWidth: number;
  smoothing: number;

  // Stamp settings
  stampType: StampType;
  customStampImage?: string;

  // Shape settings
  fillColor: string;
  fillOpacity: number;
  lineEndStyle: LineEndStyle;
}

// ============================================
// VIEW STATE TYPES
// ============================================

export type ViewMode = 'single' | 'continuous' | 'facing' | 'facingContinuous' | 'book';
export type FitMode = 'page' | 'width' | 'height' | 'actual';
export type SidebarTab = 'thumbnails' | 'bookmarks' | 'annotations' | 'attachments' | 'layers';

export interface ViewState {
  mode: ViewMode;
  fitMode: FitMode;
  zoom: number;
  rotation: number;
  currentPage: number;
  scrollPosition: { x: number; y: number };
  showSidebar: boolean;
  sidebarTab: SidebarTab;
  showToolbar: boolean;
  showRulers: boolean;
  showGrid: boolean;
  gridSize: number;
}

// ============================================
// HISTORY TYPES
// ============================================

export type HistoryActionType =
  | 'addAnnotation'
  | 'updateAnnotation'
  | 'deleteAnnotation'
  | 'addFormField'
  | 'updateFormField'
  | 'deleteFormField'
  | 'editText'
  | 'addPage'
  | 'deletePage'
  | 'rotatePage'
  | 'reorderPages'
  | 'addRedaction'
  | 'applyRedaction'
  | 'updateMetadata'
  | 'batch';

export interface HistoryAction {
  id: string;
  type: HistoryActionType;
  timestamp: number;
  description: string;
  data: unknown;
  inverse: unknown; // Data to undo the action
}

export interface HistoryState {
  actions: HistoryAction[];
  currentIndex: number;
  maxHistory: number;
  canUndo: boolean;
  canRedo: boolean;
}

// ============================================
// CLOUD STORAGE TYPES
// ============================================

export type CloudProvider = 'googleDrive' | 'dropbox' | 'oneDrive' | 'local';

export interface CloudFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  provider: CloudProvider;
  createdAt: Date;
  modifiedAt: Date;
  thumbnailUrl?: string;
  downloadUrl?: string;
  isFolder: boolean;
  parentId?: string;
}

export interface CloudConnection {
  provider: CloudProvider;
  isConnected: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt?: Date;
  pendingChanges: number;
  syncError?: string;
}

export interface FileVersion {
  id: string;
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
  size: number;
  comment?: string;
  downloadUrl?: string;
}

// ============================================
// TYPOGRAPHY TYPES
// ============================================

export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  version: string;
  lastModified: string;
  files: Record<string, string>;
  popularity?: number;
}

export interface FontPairing {
  primary: GoogleFont;
  secondary: GoogleFont;
  usage: string;
  mood: string;
  confidence: number;
}

export interface GlyphSettings {
  weight: number; // 100-900
  width: number; // 50-200 (stretch)
  slant: number; // -10 to 10
  opticalSize: number; // 8-144
  letterSpacing: number; // -0.5 to 1.0 em
  lineHeight: number; // 1.0 to 3.0
  wordSpacing: number; // -0.5 to 1.0 em
}

// ============================================
// TEMPLATE TYPES
// ============================================

export type TemplateCategory = 'contracts' | 'applications' | 'surveys' | 'business' | 'legal' | 'education' | 'personal';

export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  pages: number;
  formFields: PDFFormField[];
  tags: string[];
  isPremium: boolean;
  createdAt: Date;
  downloads: number;
}

// ============================================
// WATERMARK TYPES
// ============================================

export type WatermarkType = 'text' | 'image';
export type WatermarkPosition = 'center' | 'tile' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'custom';

export interface Watermark {
  id: string;
  type: WatermarkType;
  text?: string;
  imageUrl?: string;
  position: WatermarkPosition;
  customPosition?: { x: number; y: number };
  rotation: number;
  opacity: number;
  scale: number;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  pages: 'all' | 'even' | 'odd' | number[];
  isBackground: boolean; // true = behind content, false = on top
}

// ============================================
// CONTEXT TYPES
// ============================================

export interface PDFDocumentContextType {
  document: PDFDocument | null;
  pages: PDFPage[];
  isLoading: boolean;
  error: string | null;
  loadDocument: (source: File | string | ArrayBuffer) => Promise<void>;
  closeDocument: () => void;
  saveDocument: () => Promise<Blob>;
  getPage: (pageNumber: number) => PDFPage | undefined;
}

export interface PDFViewContextType {
  viewState: ViewState;
  setViewMode: (mode: ViewMode) => void;
  setFitMode: (mode: FitMode) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setRotation: (rotation: number) => void;
  goToPage: (pageNumber: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
}

export interface PDFToolContextType {
  activeTool: PDFTool;
  toolSettings: ToolSettings;
  setActiveTool: (tool: PDFTool) => void;
  updateToolSettings: (settings: Partial<ToolSettings>) => void;
  resetToolSettings: () => void;
}

export interface PDFAnnotationContextType {
  annotations: PDFAnnotation[];
  selectedAnnotationIds: string[];
  addAnnotation: (annotation: Omit<PDFAnnotation, 'id' | 'createdAt' | 'modifiedAt'>) => string;
  updateAnnotation: (id: string, updates: Partial<PDFAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  getAnnotationsForPage: (pageNumber: number) => PDFAnnotation[];
}

export interface PDFFormContextType {
  formFields: PDFFormField[];
  formData: Record<string, unknown>;
  addFormField: (field: Omit<PDFFormField, 'id'>) => string;
  updateFormField: (id: string, updates: Partial<PDFFormField>) => void;
  deleteFormField: (id: string) => void;
  setFieldValue: (id: string, value: unknown) => void;
  validateForm: () => Record<string, string>;
  exportFormData: (format: 'json' | 'csv' | 'xml') => Promise<Blob>;
  importFormData: (data: Record<string, unknown>) => void;
  getFieldsForPage: (pageNumber: number) => PDFFormField[];
}

export interface PDFHistoryContextType {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  addAction: (action: Omit<HistoryAction, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  getHistory: () => HistoryAction[];
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  color: '#FFEB3B',
  secondaryColor: '#000000',
  opacity: 100,
  borderWidth: 2,
  fontFamily: 'Inter',
  fontSize: 12,
  fontWeight: 400,
  fontStyle: 'normal',
  textAlign: 'left',
  strokeWidth: 2,
  smoothing: 0.5,
  stampType: 'approved',
  fillColor: 'transparent',
  fillOpacity: 0,
  lineEndStyle: 'none',
};

export const DEFAULT_VIEW_STATE: ViewState = {
  mode: 'single',
  fitMode: 'width',
  zoom: 1,
  rotation: 0,
  currentPage: 1,
  scrollPosition: { x: 0, y: 0 },
  showSidebar: true,
  sidebarTab: 'thumbnails',
  showToolbar: true,
  showRulers: false,
  showGrid: false,
  gridSize: 10,
};

export const DEFAULT_GLYPH_SETTINGS: GlyphSettings = {
  weight: 400,
  width: 100,
  slant: 0,
  opticalSize: 16,
  letterSpacing: 0,
  lineHeight: 1.5,
  wordSpacing: 0,
};

export const ANNOTATION_COLORS = [
  '#FFEB3B', // Yellow
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF5722', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FF9800', // Amber
  '#F44336', // Red
  '#607D8B', // Blue Grey
];

export const STAMP_TYPES: Record<StampType, { label: string; color: string }> = {
  approved: { label: 'APPROVED', color: '#4CAF50' },
  notApproved: { label: 'NOT APPROVED', color: '#F44336' },
  draft: { label: 'DRAFT', color: '#FF9800' },
  final: { label: 'FINAL', color: '#2196F3' },
  completed: { label: 'COMPLETED', color: '#4CAF50' },
  confidential: { label: 'CONFIDENTIAL', color: '#F44336' },
  forPublicRelease: { label: 'FOR PUBLIC RELEASE', color: '#2196F3' },
  notForPublicRelease: { label: 'NOT FOR PUBLIC RELEASE', color: '#F44336' },
  void: { label: 'VOID', color: '#9E9E9E' },
  forComment: { label: 'FOR COMMENT', color: '#FF9800' },
  preliminaryResults: { label: 'PRELIMINARY RESULTS', color: '#9C27B0' },
  informationOnly: { label: 'INFORMATION ONLY', color: '#00BCD4' },
  custom: { label: 'CUSTOM', color: '#607D8B' },
};

export const FORM_FIELD_DEFAULTS: Record<FormFieldType, Partial<PDFFormField>> = {
  text: {
    maxLength: 255,
    isRequired: false,
    validation: { type: 'none' },
  },
  textarea: {
    maxLength: 1000,
    isRequired: false,
  },
  checkbox: {
    value: false,
    isRequired: false,
  },
  radio: {
    options: [],
    isRequired: false,
  },
  dropdown: {
    options: [],
    isRequired: false,
  },
  listbox: {
    options: [],
    isRequired: false,
  },
  signature: {
    isRequired: false,
  },
  date: {
    isRequired: false,
    validation: { type: 'date' },
  },
  button: {
    isRequired: false,
  },
};
