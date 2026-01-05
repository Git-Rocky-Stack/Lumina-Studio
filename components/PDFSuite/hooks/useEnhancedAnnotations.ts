// ============================================
// useEnhancedAnnotations Hook
// Enhanced annotation system with layers, AI, voice notes, and collaboration
// ============================================

import { useState, useCallback, useMemo, useRef } from 'react';
import type {
  PDFAnnotation,
  AnnotationType,
  AnnotationRect,
} from '../types';

// ============================================
// EXTENDED TYPES FOR ENHANCED FEATURES
// ============================================

export interface AnnotationLayer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number;
  order: number;
  color: string;
  createdAt: number;
  annotationIds: string[];
}

export interface RichTextAnnotation extends PDFAnnotation {
  richContent?: {
    html: string;
    formatting: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      fontSize?: number;
      fontFamily?: string;
      textColor?: string;
      backgroundColor?: string;
      alignment?: 'left' | 'center' | 'right' | 'justify';
      listType?: 'bullet' | 'numbered' | null;
    };
  };
}

export interface VoiceNote {
  id: string;
  annotationId: string;
  audioBlob: Blob;
  duration: number;
  waveformData: number[];
  transcript?: string;
  createdAt: number;
  author: string;
}

export interface AISuggestion {
  id: string;
  annotationId: string;
  type: 'grammar' | 'clarity' | 'tone' | 'summary' | 'translation' | 'improvement';
  originalText: string;
  suggestedText: string;
  reason: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: number;
}

export interface AnnotationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'review' | 'legal' | 'educational' | 'technical' | 'custom';
  thumbnail: string;
  annotations: Partial<PDFAnnotation>[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: number;
  usageCount: number;
}

export interface CollaboratorPresence {
  userId: string;
  userName: string;
  userColor: string;
  currentPage: number;
  selectedAnnotationId?: string;
  cursor?: { x: number; y: number };
  lastActivity: number;
}

export interface AnnotationReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface EnhancedAnnotation extends RichTextAnnotation {
  layerId?: string;
  voiceNotes?: VoiceNote[];
  aiSuggestions?: AISuggestion[];
  reactions?: AnnotationReaction[];
  tags?: string[];
  mentions?: string[];
  isResolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

// ============================================
// HOOK INTERFACE
// ============================================

interface UseEnhancedAnnotationsOptions {
  userId: string;
  userName: string;
  onAnnotationChange?: (annotations: EnhancedAnnotation[]) => void;
  onLayerChange?: (layers: AnnotationLayer[]) => void;
  enableCollaboration?: boolean;
  enableAI?: boolean;
}

interface UseEnhancedAnnotationsReturn {
  // Annotations
  annotations: EnhancedAnnotation[];
  selectedIds: string[];

  // Layers
  layers: AnnotationLayer[];
  activeLayerId: string | null;

  // Voice Notes
  voiceNotes: VoiceNote[];
  isRecording: boolean;

  // AI Suggestions
  aiSuggestions: AISuggestion[];
  isGeneratingAI: boolean;

  // Templates
  templates: AnnotationTemplate[];

  // Collaboration
  collaborators: CollaboratorPresence[];

  // Layer Operations
  createLayer: (name: string, color?: string) => AnnotationLayer;
  updateLayer: (id: string, updates: Partial<AnnotationLayer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayers: (layerIds: string[]) => void;
  setActiveLayer: (id: string | null) => void;
  moveAnnotationToLayer: (annotationId: string, layerId: string) => void;

  // Annotation Operations
  addAnnotation: (
    type: AnnotationType,
    pageNumber: number,
    rect: AnnotationRect,
    options?: Partial<EnhancedAnnotation>
  ) => EnhancedAnnotation;
  updateAnnotation: (id: string, updates: Partial<EnhancedAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string, multiSelect?: boolean) => void;
  deselectAll: () => void;

  // Voice Note Operations
  startRecording: (annotationId: string) => Promise<void>;
  stopRecording: () => Promise<VoiceNote | null>;
  deleteVoiceNote: (voiceNoteId: string) => void;
  transcribeVoiceNote: (voiceNoteId: string) => Promise<void>;

  // AI Operations
  generateAISuggestions: (annotationId: string) => Promise<void>;
  acceptSuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;

  // Template Operations
  saveAsTemplate: (
    name: string,
    description: string,
    annotationIds: string[],
    category?: AnnotationTemplate['category']
  ) => AnnotationTemplate;
  applyTemplate: (templateId: string, pageNumber: number) => void;
  deleteTemplate: (templateId: string) => void;

  // Reaction Operations
  addReaction: (annotationId: string, emoji: string) => void;
  removeReaction: (annotationId: string, emoji: string) => void;

  // Search & Filter
  searchAnnotations: (query: string) => EnhancedAnnotation[];
  filterAnnotations: (filters: AnnotationFilters) => EnhancedAnnotation[];

  // Collaboration
  updatePresence: (page: number, cursor?: { x: number; y: number }) => void;

  // Statistics
  getAnnotationStats: () => AnnotationStats;
}

export interface AnnotationFilters {
  types?: AnnotationType[];
  authors?: string[];
  dateRange?: { start: number; end: number };
  layers?: string[];
  tags?: string[];
  hasVoiceNotes?: boolean;
  hasAISuggestions?: boolean;
  isResolved?: boolean;
}

export interface AnnotationStats {
  totalAnnotations: number;
  byType: Record<AnnotationType, number>;
  byLayer: Record<string, number>;
  byAuthor: Record<string, number>;
  withVoiceNotes: number;
  withAISuggestions: number;
  resolved: number;
  unresolved: number;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useEnhancedAnnotations(
  options: UseEnhancedAnnotationsOptions
): UseEnhancedAnnotationsReturn {
  const { userId, userName, onAnnotationChange, onLayerChange, enableAI = true } = options;

  // State
  const [annotations, setAnnotations] = useState<EnhancedAnnotation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [layers, setLayers] = useState<AnnotationLayer[]>([
    {
      id: 'default',
      name: 'Default Layer',
      isVisible: true,
      isLocked: false,
      opacity: 100,
      order: 0,
      color: '#6366F1',
      createdAt: Date.now(),
      annotationIds: [],
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>('default');
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [templates, setTemplates] = useState<AnnotationTemplate[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingAnnotationIdRef = useRef<string | null>(null);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // ============================================
  // LAYER OPERATIONS
  // ============================================

  const createLayer = useCallback(
    (name: string, color = '#6366F1'): AnnotationLayer => {
      const layer: AnnotationLayer = {
        id: generateId(),
        name,
        isVisible: true,
        isLocked: false,
        opacity: 100,
        order: layers.length,
        color,
        createdAt: Date.now(),
        annotationIds: [],
      };

      setLayers((prev) => [...prev, layer]);
      if (onLayerChange) onLayerChange([...layers, layer]);
      return layer;
    },
    [generateId, layers, onLayerChange]
  );

  const updateLayer = useCallback(
    (id: string, updates: Partial<AnnotationLayer>) => {
      setLayers((prev) =>
        prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer))
      );
    },
    []
  );

  const deleteLayer = useCallback(
    (id: string) => {
      if (id === 'default') return; // Cannot delete default layer

      // Move annotations from deleted layer to default
      setAnnotations((prev) =>
        prev.map((ann) => (ann.layerId === id ? { ...ann, layerId: 'default' } : ann))
      );

      setLayers((prev) => prev.filter((layer) => layer.id !== id));
      if (activeLayerId === id) setActiveLayerId('default');
    },
    [activeLayerId]
  );

  const reorderLayers = useCallback((layerIds: string[]) => {
    setLayers((prev) => {
      const reordered = layerIds
        .map((id) => prev.find((l) => l.id === id))
        .filter(Boolean) as AnnotationLayer[];
      return reordered.map((layer, index) => ({ ...layer, order: index }));
    });
  }, []);

  const setActiveLayer = useCallback((id: string | null) => {
    setActiveLayerId(id);
  }, []);

  const moveAnnotationToLayer = useCallback((annotationId: string, layerId: string) => {
    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === annotationId ? { ...ann, layerId } : ann))
    );
  }, []);

  // ============================================
  // ANNOTATION OPERATIONS
  // ============================================

  const addAnnotation = useCallback(
    (
      type: AnnotationType,
      pageNumber: number,
      rect: AnnotationRect,
      options: Partial<EnhancedAnnotation> = {}
    ): EnhancedAnnotation => {
      const now = Date.now();
      const annotation: EnhancedAnnotation = {
        id: generateId(),
        type,
        pageNumber,
        rect,
        color: '#FFEB3B',
        opacity: 100,
        borderWidth: 2,
        borderStyle: 'solid',
        createdAt: now,
        modifiedAt: now,
        isLocked: false,
        isHidden: false,
        author: userName,
        layerId: activeLayerId || 'default',
        voiceNotes: [],
        aiSuggestions: [],
        reactions: [],
        tags: [],
        mentions: [],
        isResolved: false,
        ...options,
      };

      setAnnotations((prev) => [...prev, annotation]);
      if (onAnnotationChange) onAnnotationChange([...annotations, annotation]);

      return annotation;
    },
    [generateId, userName, activeLayerId, annotations, onAnnotationChange]
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<EnhancedAnnotation>) => {
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === id ? { ...ann, ...updates, modifiedAt: Date.now() } : ann
        )
      );
    },
    []
  );

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    setSelectedIds((prev) => prev.filter((selId) => selId !== id));
    setVoiceNotes((prev) => prev.filter((vn) => vn.annotationId !== id));
    setAISuggestions((prev) => prev.filter((sug) => sug.annotationId !== id));
  }, []);

  const selectAnnotation = useCallback((id: string, multiSelect = false) => {
    setSelectedIds((prev) => {
      if (multiSelect) {
        return prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id];
      }
      return [id];
    });
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // ============================================
  // VOICE NOTE OPERATIONS
  // ============================================

  const startRecording = useCallback(async (annotationId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      recordingAnnotationIdRef.current = annotationId;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<VoiceNote | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      const annotationId = recordingAnnotationIdRef.current;

      if (!mediaRecorder || !annotationId) {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Generate waveform data (simplified)
        const waveformData = Array.from({ length: 100 }, () => Math.random());

        const voiceNote: VoiceNote = {
          id: generateId(),
          annotationId,
          audioBlob,
          duration: 0, // Would be calculated from actual audio
          waveformData,
          author: userName,
          createdAt: Date.now(),
        };

        setVoiceNotes((prev) => [...prev, voiceNote]);
        setIsRecording(false);

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        resolve(voiceNote);
      };

      mediaRecorder.stop();
    });
  }, [generateId, userName]);

  const deleteVoiceNote = useCallback((voiceNoteId: string) => {
    setVoiceNotes((prev) => prev.filter((vn) => vn.id !== voiceNoteId));
  }, []);

  const transcribeVoiceNote = useCallback(async (voiceNoteId: string) => {
    // Placeholder for Web Speech API or external transcription service
    // In production, this would call an API endpoint
    const voiceNote = voiceNotes.find((vn) => vn.id === voiceNoteId);
    if (!voiceNote) return;

    // Simulated transcription
    setTimeout(() => {
      setVoiceNotes((prev) =>
        prev.map((vn) =>
          vn.id === voiceNoteId
            ? { ...vn, transcript: 'Transcription would appear here' }
            : vn
        )
      );
    }, 1000);
  }, [voiceNotes]);

  // ============================================
  // AI OPERATIONS
  // ============================================

  const generateAISuggestions = useCallback(async (annotationId: string) => {
    if (!enableAI) return;

    const annotation = annotations.find((a) => a.id === annotationId);
    if (!annotation || !annotation.contents) return;

    setIsGeneratingAI(true);

    // Simulated AI suggestions (in production, call AI API)
    setTimeout(() => {
      const suggestions: AISuggestion[] = [
        {
          id: generateId(),
          annotationId,
          type: 'grammar',
          originalText: annotation.contents || '',
          suggestedText: 'Improved version of the text',
          reason: 'Grammar and clarity improvement',
          confidence: 0.92,
          status: 'pending',
          createdAt: Date.now(),
        },
      ];

      setAISuggestions((prev) => [...prev, ...suggestions]);
      setIsGeneratingAI(false);
    }, 1500);
  }, [annotations, enableAI, generateId]);

  const acceptSuggestion = useCallback((suggestionId: string) => {
    const suggestion = aiSuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    updateAnnotation(suggestion.annotationId, {
      contents: suggestion.suggestedText,
    });

    setAISuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, status: 'accepted' } : s))
    );
  }, [aiSuggestions, updateAnnotation]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setAISuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, status: 'dismissed' } : s))
    );
  }, []);

  // ============================================
  // TEMPLATE OPERATIONS
  // ============================================

  const saveAsTemplate = useCallback(
    (
      name: string,
      description: string,
      annotationIds: string[],
      category: AnnotationTemplate['category'] = 'custom'
    ): AnnotationTemplate => {
      const templateAnnotations = annotations
        .filter((a) => annotationIds.includes(a.id))
        .map(({ id, createdAt, modifiedAt, ...rest }) => rest);

      const template: AnnotationTemplate = {
        id: generateId(),
        name,
        description,
        category,
        thumbnail: '', // Would generate thumbnail
        annotations: templateAnnotations,
        tags: [],
        isPublic: false,
        createdBy: userName,
        createdAt: Date.now(),
        usageCount: 0,
      };

      setTemplates((prev) => [...prev, template]);
      return template;
    },
    [annotations, generateId, userName]
  );

  const applyTemplate = useCallback(
    (templateId: string, pageNumber: number) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      template.annotations.forEach((annTemplate) => {
        addAnnotation(
          annTemplate.type!,
          pageNumber,
          annTemplate.rect!,
          annTemplate as Partial<EnhancedAnnotation>
        );
      });

      // Update usage count
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, usageCount: t.usageCount + 1 } : t
        )
      );
    },
    [templates, addAnnotation]
  );

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }, []);

  // ============================================
  // REACTION OPERATIONS
  // ============================================

  const addReaction = useCallback(
    (annotationId: string, emoji: string) => {
      const reaction: AnnotationReaction = {
        emoji,
        userId,
        userName,
        timestamp: Date.now(),
      };

      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === annotationId
            ? {
                ...ann,
                reactions: [...(ann.reactions || []), reaction],
              }
            : ann
        )
      );
    },
    [userId, userName]
  );

  const removeReaction = useCallback(
    (annotationId: string, emoji: string) => {
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === annotationId
            ? {
                ...ann,
                reactions: (ann.reactions || []).filter(
                  (r) => !(r.emoji === emoji && r.userId === userId)
                ),
              }
            : ann
        )
      );
    },
    [userId]
  );

  // ============================================
  // SEARCH & FILTER
  // ============================================

  const searchAnnotations = useCallback(
    (query: string): EnhancedAnnotation[] => {
      const lowerQuery = query.toLowerCase();
      return annotations.filter(
        (ann) =>
          ann.contents?.toLowerCase().includes(lowerQuery) ||
          ann.author?.toLowerCase().includes(lowerQuery) ||
          ann.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    },
    [annotations]
  );

  const filterAnnotations = useCallback(
    (filters: AnnotationFilters): EnhancedAnnotation[] => {
      return annotations.filter((ann) => {
        if (filters.types && !filters.types.includes(ann.type)) return false;
        if (filters.authors && !filters.authors.includes(ann.author || '')) return false;
        if (filters.layers && !filters.layers.includes(ann.layerId || '')) return false;
        if (filters.dateRange) {
          if (
            ann.createdAt < filters.dateRange.start ||
            ann.createdAt > filters.dateRange.end
          )
            return false;
        }
        if (filters.hasVoiceNotes !== undefined) {
          const hasVN = (ann.voiceNotes?.length || 0) > 0;
          if (hasVN !== filters.hasVoiceNotes) return false;
        }
        if (filters.hasAISuggestions !== undefined) {
          const hasAI = (ann.aiSuggestions?.length || 0) > 0;
          if (hasAI !== filters.hasAISuggestions) return false;
        }
        if (filters.isResolved !== undefined && ann.isResolved !== filters.isResolved)
          return false;

        return true;
      });
    },
    [annotations]
  );

  // ============================================
  // COLLABORATION
  // ============================================

  const updatePresence = useCallback(
    (page: number, cursor?: { x: number; y: number }) => {
      // Update own presence
      setCollaborators((prev) => {
        const others = prev.filter((c) => c.userId !== userId);
        return [
          ...others,
          {
            userId,
            userName,
            userColor: '#6366F1',
            currentPage: page,
            cursor,
            lastActivity: Date.now(),
          },
        ];
      });
    },
    [userId, userName]
  );

  // ============================================
  // STATISTICS
  // ============================================

  const getAnnotationStats = useCallback((): AnnotationStats => {
    const byType: Record<string, number> = {};
    const byLayer: Record<string, number> = {};
    const byAuthor: Record<string, number> = {};
    let withVoiceNotes = 0;
    let withAISuggestions = 0;
    let resolved = 0;
    let unresolved = 0;

    annotations.forEach((ann) => {
      byType[ann.type] = (byType[ann.type] || 0) + 1;
      byLayer[ann.layerId || 'default'] = (byLayer[ann.layerId || 'default'] || 0) + 1;
      byAuthor[ann.author || 'Unknown'] = (byAuthor[ann.author || 'Unknown'] || 0) + 1;

      if (ann.voiceNotes && ann.voiceNotes.length > 0) withVoiceNotes++;
      if (ann.aiSuggestions && ann.aiSuggestions.length > 0) withAISuggestions++;
      if (ann.isResolved) resolved++;
      else unresolved++;
    });

    return {
      totalAnnotations: annotations.length,
      byType: byType as Record<AnnotationType, number>,
      byLayer,
      byAuthor,
      withVoiceNotes,
      withAISuggestions,
      resolved,
      unresolved,
    };
  }, [annotations]);

  return {
    // Annotations
    annotations,
    selectedIds,

    // Layers
    layers,
    activeLayerId,

    // Voice Notes
    voiceNotes,
    isRecording,

    // AI Suggestions
    aiSuggestions,
    isGeneratingAI,

    // Templates
    templates,

    // Collaboration
    collaborators,

    // Layer Operations
    createLayer,
    updateLayer,
    deleteLayer,
    reorderLayers,
    setActiveLayer,
    moveAnnotationToLayer,

    // Annotation Operations
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    deselectAll,

    // Voice Note Operations
    startRecording,
    stopRecording,
    deleteVoiceNote,
    transcribeVoiceNote,

    // AI Operations
    generateAISuggestions,
    acceptSuggestion,
    dismissSuggestion,

    // Template Operations
    saveAsTemplate,
    applyTemplate,
    deleteTemplate,

    // Reaction Operations
    addReaction,
    removeReaction,

    // Search & Filter
    searchAnnotations,
    filterAnnotations,

    // Collaboration
    updatePresence,

    // Statistics
    getAnnotationStats,
  };
}

export default useEnhancedAnnotations;
