// Test fixtures for PDF annotations
import type { PDFAnnotation } from '../../components/PDFSuite/types';

export const createAnnotationFixture = (overrides: Partial<PDFAnnotation> = {}): PDFAnnotation => {
  const defaults: PDFAnnotation = {
    id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'highlight',
    pageNumber: 1,
    rect: { x: 100, y: 100, width: 200, height: 20 },
    color: '#FFEB3B',
    opacity: 50,
    borderWidth: 0,
    borderStyle: 'solid',
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    isLocked: false,
    isHidden: false,
    contents: 'Test annotation',
  };

  return { ...defaults, ...overrides };
};

// Common annotation patterns
export const annotationFixtures = {
  highlight: createAnnotationFixture({
    type: 'highlight',
    color: '#FFEB3B',
    opacity: 50,
    contents: 'Highlighted text',
  }),

  note: createAnnotationFixture({
    type: 'note',
    rect: { x: 100, y: 100, width: 24, height: 24 },
    color: '#FFC107',
    contents: 'This is a note annotation',
    replies: [
      {
        id: 'reply-1',
        content: 'This is a reply',
        author: 'Test User',
        createdAt: Date.now(),
      },
    ],
  }),

  freeText: createAnnotationFixture({
    type: 'freeText',
    rect: { x: 100, y: 100, width: 200, height: 60 },
    color: '#2196F3',
    contents: 'Free text annotation',
    fontSize: 14,
    fontFamily: 'Helvetica',
  }),

  rectangle: createAnnotationFixture({
    type: 'rectangle',
    rect: { x: 100, y: 100, width: 150, height: 100 },
    color: '#F44336',
    borderWidth: 2,
    fillColor: 'transparent',
  }),

  ellipse: createAnnotationFixture({
    type: 'ellipse',
    rect: { x: 100, y: 100, width: 120, height: 80 },
    color: '#4CAF50',
    borderWidth: 2,
    fillColor: 'transparent',
  }),

  line: createAnnotationFixture({
    type: 'line',
    rect: { x: 100, y: 100, width: 200, height: 2 },
    color: '#9C27B0',
    borderWidth: 2,
    points: [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
    ],
  }),

  arrow: createAnnotationFixture({
    type: 'arrow',
    rect: { x: 100, y: 100, width: 200, height: 2 },
    color: '#FF5722',
    borderWidth: 2,
    lineEndStyle: 'arrow',
    points: [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
    ],
  }),

  underline: createAnnotationFixture({
    type: 'underline',
    rect: { x: 100, y: 100, width: 200, height: 2 },
    color: '#00BCD4',
    contents: 'Underlined text',
  }),

  strikethrough: createAnnotationFixture({
    type: 'strikethrough',
    rect: { x: 100, y: 108, width: 200, height: 2 },
    color: '#E91E63',
    contents: 'Strikethrough text',
  }),

  stamp: createAnnotationFixture({
    type: 'stamp',
    rect: { x: 100, y: 100, width: 100, height: 30 },
    color: '#3F51B5',
    stampType: 'approved',
  }),

  ink: createAnnotationFixture({
    type: 'ink',
    rect: { x: 100, y: 100, width: 150, height: 100 },
    color: '#000000',
    borderWidth: 2,
    inkPaths: [
      [
        { x: 100, y: 100 },
        { x: 120, y: 110 },
        { x: 140, y: 105 },
        { x: 160, y: 115 },
      ],
    ],
  }),
};

// Annotation sets for different scenarios
export const annotationSets = {
  empty: [],

  singlePage: [
    annotationFixtures.highlight,
    annotationFixtures.note,
    annotationFixtures.freeText,
  ],

  multiPage: [
    createAnnotationFixture({ pageNumber: 1, type: 'highlight' }),
    createAnnotationFixture({ pageNumber: 1, type: 'note' }),
    createAnnotationFixture({ pageNumber: 2, type: 'rectangle' }),
    createAnnotationFixture({ pageNumber: 2, type: 'freeText' }),
    createAnnotationFixture({ pageNumber: 3, type: 'stamp' }),
  ],

  withReplies: [
    createAnnotationFixture({
      type: 'note',
      contents: 'Note with replies',
      replies: [
        {
          id: 'reply-1',
          content: 'First reply',
          author: 'User A',
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'reply-2',
          content: 'Second reply',
          author: 'User B',
          createdAt: Date.now() - 1800000,
        },
      ],
    }),
  ],

  locked: [
    createAnnotationFixture({ isLocked: true, contents: 'Locked annotation' }),
  ],

  hidden: [
    createAnnotationFixture({ isHidden: true, contents: 'Hidden annotation' }),
  ],

  large: Array.from({ length: 100 }, (_, i) =>
    createAnnotationFixture({
      pageNumber: Math.floor(i / 10) + 1,
      type: ['highlight', 'note', 'rectangle'][i % 3] as PDFAnnotation['type'],
      rect: {
        x: (i % 5) * 100 + 50,
        y: Math.floor(i / 5) * 50 + 50,
        width: 80,
        height: 30,
      },
      contents: `Annotation ${i + 1}`,
    })
  ),
};

// Layer fixtures
export interface LayerFixture {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  annotationIds: string[];
}

export const createLayerFixture = (overrides: Partial<LayerFixture> = {}): LayerFixture => ({
  id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Layer',
  visible: true,
  locked: false,
  opacity: 100,
  zIndex: 0,
  annotationIds: [],
  ...overrides,
});

export const layerFixtures = {
  default: createLayerFixture({ name: 'Default Layer' }),
  hidden: createLayerFixture({ name: 'Hidden Layer', visible: false }),
  locked: createLayerFixture({ name: 'Locked Layer', locked: true }),
  withAnnotations: createLayerFixture({
    name: 'Layer with Annotations',
    annotationIds: ['ann-1', 'ann-2', 'ann-3'],
  }),
};

// Voice note fixtures
export interface VoiceNoteFixture {
  id: string;
  annotationId: string;
  audioUrl: string;
  transcription?: string;
  duration: number;
  createdAt: number;
}

export const createVoiceNoteFixture = (overrides: Partial<VoiceNoteFixture> = {}): VoiceNoteFixture => ({
  id: `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  annotationId: 'ann-test',
  audioUrl: 'blob:http://localhost:3000/mock-audio',
  transcription: 'This is a test voice note transcription',
  duration: 5000,
  createdAt: Date.now(),
  ...overrides,
});

export const voiceNoteFixtures = {
  short: createVoiceNoteFixture({ duration: 3000 }),
  long: createVoiceNoteFixture({ duration: 30000 }),
  withTranscription: createVoiceNoteFixture({
    transcription: 'This is a detailed transcription of the voice note',
  }),
  withoutTranscription: createVoiceNoteFixture({ transcription: undefined }),
};

// AI suggestion fixtures
export interface AISuggestionFixture {
  id: string;
  annotationId: string;
  suggestionType: 'correction' | 'enhancement' | 'translation' | 'summary';
  content: Record<string, unknown>;
  confidence: number;
  applied: boolean;
  createdAt: number;
}

export const createAISuggestionFixture = (
  overrides: Partial<AISuggestionFixture> = {}
): AISuggestionFixture => ({
  id: `ai-sug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  annotationId: 'ann-test',
  suggestionType: 'correction',
  content: {
    original: 'Ths is a typo',
    suggested: 'This is a typo',
  },
  confidence: 0.95,
  applied: false,
  createdAt: Date.now(),
  ...overrides,
});

export const aiSuggestionFixtures = {
  correction: createAISuggestionFixture({
    suggestionType: 'correction',
    content: {
      original: 'recieve',
      suggested: 'receive',
      reason: 'Spelling correction',
    },
    confidence: 0.99,
  }),

  enhancement: createAISuggestionFixture({
    suggestionType: 'enhancement',
    content: {
      original: 'The report is good',
      suggested: 'The report demonstrates comprehensive analysis',
      reason: 'More professional phrasing',
    },
    confidence: 0.85,
  }),

  translation: createAISuggestionFixture({
    suggestionType: 'translation',
    content: {
      original: 'Hello, how are you?',
      suggested: 'Hola, ¿cómo estás?',
      targetLanguage: 'es',
    },
    confidence: 0.92,
  }),

  summary: createAISuggestionFixture({
    suggestionType: 'summary',
    content: {
      original: 'This is a very long paragraph with lots of detailed information...',
      suggested: 'Key points: detail 1, detail 2, detail 3',
    },
    confidence: 0.88,
  }),

  lowConfidence: createAISuggestionFixture({
    confidence: 0.45,
  }),

  applied: createAISuggestionFixture({
    applied: true,
  }),
};

// Template fixtures
export interface TemplateFixture {
  id: string;
  name: string;
  category: string;
  annotations: PDFAnnotation[];
  layers: LayerFixture[];
  createdAt: number;
}

export const createTemplateFixture = (overrides: Partial<TemplateFixture> = {}): TemplateFixture => ({
  id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Template',
  category: 'general',
  annotations: [],
  layers: [],
  createdAt: Date.now(),
  ...overrides,
});

export const templateFixtures = {
  review: createTemplateFixture({
    name: 'Document Review',
    category: 'review',
    annotations: [
      createAnnotationFixture({ type: 'stamp', stampType: 'approved' }),
      createAnnotationFixture({ type: 'note', contents: 'Review notes' }),
    ],
  }),

  contract: createTemplateFixture({
    name: 'Contract Template',
    category: 'legal',
    annotations: [
      createAnnotationFixture({ type: 'highlight', color: '#FFEB3B' }),
      createAnnotationFixture({ type: 'freeText', contents: 'Party A:' }),
      createAnnotationFixture({ type: 'freeText', contents: 'Party B:' }),
    ],
  }),

  markup: createTemplateFixture({
    name: 'Design Markup',
    category: 'design',
    annotations: [
      createAnnotationFixture({ type: 'rectangle', color: '#F44336' }),
      createAnnotationFixture({ type: 'arrow', color: '#FF5722' }),
      createAnnotationFixture({ type: 'freeText', contents: 'Change this' }),
    ],
  }),
};
