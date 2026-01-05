// ============================================
// Annotation Service
// Supabase backend integration for enhanced annotations
// ============================================

import { supabase } from '../../../lib/supabase';
import type {
  AnnotationLayer,
  EnhancedAnnotation,
  VoiceNote,
  AISuggestion,
  AnnotationTemplate,
  CollaboratorPresence,
} from '../hooks/useEnhancedAnnotations';
import type { AnnotationRect, AnnotationType } from '../types';

// ============================================
// Types
// ============================================

export interface PDFDocument {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  page_count: number;
  metadata: Record<string, unknown>;
  checksum?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface AnnotationSession {
  id: string;
  document_id: string;
  session_name?: string;
  is_active: boolean;
  created_by: string;
  share_token?: string;
  access_level: 'view' | 'comment' | 'edit' | 'admin';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AnnotationReply {
  id: string;
  annotation_id: string;
  parent_reply_id?: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  reactions: Record<string, string[]>;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

// Database row types
interface DBAnnotation {
  id: string;
  document_id: string;
  layer_id?: string;
  parent_id?: string;
  type: string;
  page_number: number;
  rect: AnnotationRect;
  color: string;
  opacity: number;
  border_width: number;
  border_style: string;
  rich_text_content?: Record<string, unknown>;
  font_settings?: Record<string, unknown>;
  contents?: string;
  text_markup_quads?: number[][];
  ink_paths?: { x: number; y: number }[][];
  line_points?: { x: number; y: number }[];
  vertices?: { x: number; y: number }[];
  stamp_type?: string;
  link_destination?: Record<string, unknown>;
  voice_note_id?: string;
  is_locked: boolean;
  is_hidden: boolean;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_by: string;
  author_name?: string;
  author_color?: string;
  is_ai_suggested: boolean;
  ai_confidence?: number;
  ai_category?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

interface DBLayer {
  id: string;
  document_id: string;
  name: string;
  description?: string;
  color: string;
  is_visible: boolean;
  is_locked: boolean;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DBVoiceNote {
  id: string;
  annotation_id: string;
  storage_path: string;
  duration_seconds: number;
  file_size: number;
  mime_type: string;
  transcription?: string;
  transcription_status: string;
  transcription_language: string;
  created_by: string;
  created_at: string;
}

interface DBAISuggestion {
  id: string;
  document_id: string;
  page_number: number;
  suggestion_type: string;
  rect: AnnotationRect;
  confidence: number;
  suggested_content?: string;
  metadata?: Record<string, unknown>;
  is_accepted: boolean;
  is_dismissed: boolean;
  accepted_annotation_id?: string;
  created_at: string;
}

interface DBTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail_url?: string;
  template_data: Partial<EnhancedAnnotation>[];
  is_system: boolean;
  is_public: boolean;
  created_by: string;
  use_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Document Service
// ============================================

export const DocumentService = {
  /**
   * Create a new PDF document record
   */
  async create(data: {
    name: string;
    filePath: string;
    fileSize: number;
    pageCount: number;
    metadata?: Record<string, unknown>;
    checksum?: string;
  }): Promise<PDFDocument | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: doc, error } = await supabase
      .from('pdf_documents')
      .insert({
        user_id: user.user.id,
        name: data.name,
        file_path: data.filePath,
        file_size: data.fileSize,
        page_count: data.pageCount,
        metadata: data.metadata || {},
        checksum: data.checksum,
      })
      .select()
      .single();

    if (error) throw error;
    return doc;
  },

  /**
   * Get a document by ID
   */
  async getById(id: string): Promise<PDFDocument | null> {
    const { data, error } = await supabase
      .from('pdf_documents')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * List all documents for the current user
   */
  async list(): Promise<PDFDocument[]> {
    const { data, error } = await supabase
      .from('pdf_documents')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update document metadata
   */
  async update(
    id: string,
    updates: Partial<Pick<PDFDocument, 'name' | 'metadata'>>
  ): Promise<PDFDocument | null> {
    const { data, error } = await supabase
      .from('pdf_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete a document
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pdf_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// Annotation Layer Service
// ============================================

export const LayerService = {
  /**
   * Create a new annotation layer
   */
  async create(
    documentId: string,
    data: {
      name: string;
      color?: string;
      description?: string;
    }
  ): Promise<AnnotationLayer | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Get current max order
    const { data: layers } = await supabase
      .from('annotation_layers')
      .select('order_index')
      .eq('document_id', documentId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = layers && layers.length > 0 ? layers[0].order_index + 1 : 0;

    const { data: layer, error } = await supabase
      .from('annotation_layers')
      .insert({
        document_id: documentId,
        name: data.name,
        description: data.description,
        color: data.color || '#6366F1',
        order_index: nextOrder,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDBLayerToLayer(layer);
  },

  /**
   * Get all layers for a document
   */
  async getByDocument(documentId: string): Promise<AnnotationLayer[]> {
    const { data, error } = await supabase
      .from('annotation_layers')
      .select('*')
      .eq('document_id', documentId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapDBLayerToLayer);
  },

  /**
   * Update a layer
   */
  async update(
    layerId: string,
    updates: Partial<Pick<DBLayer, 'name' | 'color' | 'is_visible' | 'is_locked' | 'order_index'>>
  ): Promise<AnnotationLayer | null> {
    const { data, error } = await supabase
      .from('annotation_layers')
      .update(updates)
      .eq('id', layerId)
      .select()
      .single();

    if (error) throw error;
    return mapDBLayerToLayer(data);
  },

  /**
   * Delete a layer
   */
  async delete(layerId: string): Promise<void> {
    const { error } = await supabase
      .from('annotation_layers')
      .delete()
      .eq('id', layerId);

    if (error) throw error;
  },

  /**
   * Reorder layers
   */
  async reorder(layerIds: string[]): Promise<void> {
    const updates = layerIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    for (const update of updates) {
      await supabase
        .from('annotation_layers')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }
  },
};

// ============================================
// Annotation Service
// ============================================

export const AnnotationService = {
  /**
   * Create a new annotation
   */
  async create(
    documentId: string,
    data: {
      type: AnnotationType;
      pageNumber: number;
      rect: AnnotationRect;
      layerId?: string;
      color?: string;
      opacity?: number;
      contents?: string;
      richTextContent?: Record<string, unknown>;
      inkPaths?: { x: number; y: number }[][];
      linePoints?: { x: number; y: number }[];
      vertices?: { x: number; y: number }[];
      stampType?: string;
      textMarkupQuads?: number[][];
    }
  ): Promise<EnhancedAnnotation | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: annotation, error } = await supabase
      .from('annotations')
      .insert({
        document_id: documentId,
        layer_id: data.layerId,
        type: data.type,
        page_number: data.pageNumber,
        rect: data.rect,
        color: data.color || '#FFEB3B',
        opacity: data.opacity ?? 1.0,
        contents: data.contents,
        rich_text_content: data.richTextContent,
        ink_paths: data.inkPaths,
        line_points: data.linePoints,
        vertices: data.vertices,
        stamp_type: data.stampType,
        text_markup_quads: data.textMarkupQuads,
        created_by: user.user.id,
        author_name: user.user.email?.split('@')[0] || 'Unknown',
      })
      .select()
      .single();

    if (error) throw error;
    return mapDBAnnotationToAnnotation(annotation);
  },

  /**
   * Get all annotations for a document
   */
  async getByDocument(documentId: string): Promise<EnhancedAnnotation[]> {
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapDBAnnotationToAnnotation);
  },

  /**
   * Get annotations for a specific page
   */
  async getByPage(documentId: string, pageNumber: number): Promise<EnhancedAnnotation[]> {
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('document_id', documentId)
      .eq('page_number', pageNumber)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapDBAnnotationToAnnotation);
  },

  /**
   * Update an annotation with optimistic locking
   */
  async update(
    annotationId: string,
    currentVersion: number,
    updates: Partial<
      Pick<
        DBAnnotation,
        | 'rect'
        | 'color'
        | 'opacity'
        | 'contents'
        | 'rich_text_content'
        | 'is_locked'
        | 'is_hidden'
        | 'is_resolved'
        | 'layer_id'
      >
    >
  ): Promise<EnhancedAnnotation | null> {
    const { data, error } = await supabase
      .from('annotations')
      .update({
        ...updates,
        version: currentVersion + 1,
      })
      .eq('id', annotationId)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Concurrent modification detected. Please refresh and try again.');
      }
      throw error;
    }
    return mapDBAnnotationToAnnotation(data);
  },

  /**
   * Delete an annotation
   */
  async delete(annotationId: string): Promise<void> {
    const { error } = await supabase.from('annotations').delete().eq('id', annotationId);

    if (error) throw error;
  },

  /**
   * Batch create annotations
   */
  async batchCreate(
    documentId: string,
    annotations: Array<{
      type: AnnotationType;
      pageNumber: number;
      rect: AnnotationRect;
      color?: string;
      contents?: string;
    }>
  ): Promise<EnhancedAnnotation[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const records = annotations.map((ann) => ({
      document_id: documentId,
      type: ann.type,
      page_number: ann.pageNumber,
      rect: ann.rect,
      color: ann.color || '#FFEB3B',
      opacity: 1.0,
      contents: ann.contents,
      created_by: user.user!.id,
      author_name: user.user!.email?.split('@')[0] || 'Unknown',
    }));

    const { data, error } = await supabase.from('annotations').insert(records).select();

    if (error) throw error;
    return (data || []).map(mapDBAnnotationToAnnotation);
  },

  /**
   * Move annotation to different layer
   */
  async moveToLayer(annotationId: string, layerId: string | null): Promise<void> {
    const { error } = await supabase
      .from('annotations')
      .update({ layer_id: layerId })
      .eq('id', annotationId);

    if (error) throw error;
  },

  /**
   * Resolve an annotation
   */
  async resolve(annotationId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('annotations')
      .update({
        is_resolved: true,
        resolved_by: user.user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', annotationId);

    if (error) throw error;
  },

  /**
   * Unresolve an annotation
   */
  async unresolve(annotationId: string): Promise<void> {
    const { error } = await supabase
      .from('annotations')
      .update({
        is_resolved: false,
        resolved_by: null,
        resolved_at: null,
      })
      .eq('id', annotationId);

    if (error) throw error;
  },
};

// ============================================
// Voice Note Service
// ============================================

export const VoiceNoteService = {
  /**
   * Upload and create a voice note
   */
  async create(
    annotationId: string,
    audioBlob: Blob,
    durationSeconds: number
  ): Promise<VoiceNote | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Upload audio file to storage
    const fileName = `${annotationId}_${Date.now()}.webm`;
    const filePath = `voice-notes/${user.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('annotations')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
      });

    if (uploadError) throw uploadError;

    // Create voice note record
    const { data, error } = await supabase
      .from('voice_notes')
      .insert({
        annotation_id: annotationId,
        storage_path: filePath,
        duration_seconds: durationSeconds,
        file_size: audioBlob.size,
        mime_type: 'audio/webm',
        created_by: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDBVoiceNoteToVoiceNote(data, audioBlob);
  },

  /**
   * Get voice notes for an annotation
   */
  async getByAnnotation(annotationId: string): Promise<VoiceNote[]> {
    const { data, error } = await supabase
      .from('voice_notes')
      .select('*')
      .eq('annotation_id', annotationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Download audio blobs
    const voiceNotes: VoiceNote[] = [];
    for (const vn of data || []) {
      const { data: audioData } = await supabase.storage
        .from('annotations')
        .download(vn.storage_path);

      if (audioData) {
        voiceNotes.push(mapDBVoiceNoteToVoiceNote(vn, audioData));
      }
    }

    return voiceNotes;
  },

  /**
   * Delete a voice note
   */
  async delete(voiceNoteId: string): Promise<void> {
    // Get the voice note to find storage path
    const { data: vn } = await supabase
      .from('voice_notes')
      .select('storage_path')
      .eq('id', voiceNoteId)
      .single();

    if (vn) {
      // Delete from storage
      await supabase.storage.from('annotations').remove([vn.storage_path]);
    }

    // Delete record
    const { error } = await supabase.from('voice_notes').delete().eq('id', voiceNoteId);

    if (error) throw error;
  },

  /**
   * Update transcription
   */
  async updateTranscription(
    voiceNoteId: string,
    transcription: string,
    language: string = 'en'
  ): Promise<void> {
    const { error } = await supabase
      .from('voice_notes')
      .update({
        transcription,
        transcription_status: 'completed',
        transcription_language: language,
      })
      .eq('id', voiceNoteId);

    if (error) throw error;
  },
};

// ============================================
// AI Suggestion Service
// ============================================

export const AISuggestionService = {
  /**
   * Create an AI suggestion
   */
  async create(
    documentId: string,
    data: {
      pageNumber: number;
      suggestionType: string;
      rect: AnnotationRect;
      confidence: number;
      suggestedContent?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AISuggestion | null> {
    const { data: suggestion, error } = await supabase
      .from('ai_annotation_suggestions')
      .insert({
        document_id: documentId,
        page_number: data.pageNumber,
        suggestion_type: data.suggestionType,
        rect: data.rect,
        confidence: data.confidence,
        suggested_content: data.suggestedContent,
        metadata: data.metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDBAISuggestionToSuggestion(suggestion);
  },

  /**
   * Get suggestions for a document page
   */
  async getByPage(documentId: string, pageNumber: number): Promise<AISuggestion[]> {
    const { data, error } = await supabase
      .from('ai_annotation_suggestions')
      .select('*')
      .eq('document_id', documentId)
      .eq('page_number', pageNumber)
      .eq('is_dismissed', false)
      .order('confidence', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDBAISuggestionToSuggestion);
  },

  /**
   * Accept a suggestion (creates annotation)
   */
  async accept(suggestionId: string, annotationId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_annotation_suggestions')
      .update({
        is_accepted: true,
        accepted_annotation_id: annotationId,
      })
      .eq('id', suggestionId);

    if (error) throw error;
  },

  /**
   * Dismiss a suggestion
   */
  async dismiss(suggestionId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_annotation_suggestions')
      .update({ is_dismissed: true })
      .eq('id', suggestionId);

    if (error) throw error;
  },
};

// ============================================
// Template Service
// ============================================

export const TemplateService = {
  /**
   * Create a new template
   */
  async create(data: {
    name: string;
    description?: string;
    category: string;
    annotations: Partial<EnhancedAnnotation>[];
    tags?: string[];
    isPublic?: boolean;
  }): Promise<AnnotationTemplate | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: template, error } = await supabase
      .from('annotation_templates')
      .insert({
        name: data.name,
        description: data.description,
        category: data.category,
        template_data: data.annotations,
        tags: data.tags || [],
        is_public: data.isPublic || false,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDBTemplateToTemplate(template);
  },

  /**
   * Get all available templates (public + user's own)
   */
  async list(): Promise<AnnotationTemplate[]> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('annotation_templates')
      .select('*')
      .or(`is_public.eq.true,is_system.eq.true${user.user ? `,created_by.eq.${user.user.id}` : ''}`)
      .order('use_count', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDBTemplateToTemplate);
  },

  /**
   * Get templates by category
   */
  async getByCategory(category: string): Promise<AnnotationTemplate[]> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('annotation_templates')
      .select('*')
      .eq('category', category)
      .or(`is_public.eq.true,is_system.eq.true${user.user ? `,created_by.eq.${user.user.id}` : ''}`)
      .order('use_count', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDBTemplateToTemplate);
  },

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId: string): Promise<void> {
    const { data: template } = await supabase
      .from('annotation_templates')
      .select('use_count')
      .eq('id', templateId)
      .single();

    if (template) {
      await supabase
        .from('annotation_templates')
        .update({ use_count: template.use_count + 1 })
        .eq('id', templateId);
    }
  },

  /**
   * Delete a user-owned template
   */
  async delete(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('annotation_templates')
      .delete()
      .eq('id', templateId)
      .eq('is_system', false);

    if (error) throw error;
  },

  /**
   * Update a template
   */
  async update(
    templateId: string,
    updates: Partial<Pick<DBTemplate, 'name' | 'description' | 'tags' | 'is_public'>>
  ): Promise<AnnotationTemplate | null> {
    const { data, error } = await supabase
      .from('annotation_templates')
      .update(updates)
      .eq('id', templateId)
      .eq('is_system', false)
      .select()
      .single();

    if (error) throw error;
    return mapDBTemplateToTemplate(data);
  },
};

// ============================================
// Collaboration Service
// ============================================

export const CollaborationService = {
  /**
   * Create a collaboration session
   */
  async createSession(
    documentId: string,
    options?: {
      sessionName?: string;
      accessLevel?: 'view' | 'comment' | 'edit' | 'admin';
      expiresAt?: Date;
    }
  ): Promise<AnnotationSession | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Generate share token
    const shareToken = generateShareToken();

    const { data, error } = await supabase
      .from('annotation_sessions')
      .insert({
        document_id: documentId,
        session_name: options?.sessionName,
        created_by: user.user.id,
        share_token: shareToken,
        access_level: options?.accessLevel || 'view',
        expires_at: options?.expiresAt?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Join a session via share token
   */
  async joinSession(shareToken: string): Promise<AnnotationSession | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('annotation_sessions')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (sessionError) throw sessionError;
    if (!session) throw new Error('Session not found or expired');

    // Check expiration
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      throw new Error('Session has expired');
    }

    // Add participant
    await supabase.from('session_participants').upsert({
      session_id: session.id,
      user_id: user.user.id,
      role: mapAccessLevelToRole(session.access_level),
    });

    return session;
  },

  /**
   * Update participant presence
   */
  async updatePresence(
    sessionId: string,
    data: {
      currentPage: number;
      cursorPosition?: { x: number; y: number };
      selectedAnnotationId?: string;
    }
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('session_participants')
      .update({
        current_page: data.currentPage,
        cursor_position: data.cursorPosition,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  },

  /**
   * Get active participants in a session
   */
  async getParticipants(sessionId: string): Promise<CollaboratorPresence[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('session_participants')
      .select(
        `
        user_id,
        current_page,
        cursor_position,
        last_seen_at,
        users:user_id (
          email,
          raw_user_meta_data
        )
      `
      )
      .eq('session_id', sessionId)
      .gte('last_seen_at', fiveMinutesAgo);

    if (error) throw error;

    return (data || []).map((p: any) => ({
      userId: p.user_id,
      userName: p.users?.raw_user_meta_data?.name || p.users?.email?.split('@')[0] || 'Unknown',
      userColor: generateUserColor(p.user_id),
      currentPage: p.current_page || 1,
      cursor: p.cursor_position,
      lastActivity: new Date(p.last_seen_at).getTime(),
    }));
  },

  /**
   * Subscribe to real-time annotation changes
   */
  subscribeToAnnotations(
    documentId: string,
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new?: EnhancedAnnotation;
      old?: { id: string };
    }) => void
  ) {
    return supabase
      .channel(`annotations:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'annotations',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new ? mapDBAnnotationToAnnotation(payload.new as DBAnnotation) : undefined,
            old: payload.old ? { id: (payload.old as { id: string }).id } : undefined,
          });
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to participant presence
   */
  subscribeToPresence(
    sessionId: string,
    callback: (participants: CollaboratorPresence[]) => void
  ) {
    const channel = supabase.channel(`presence:${sessionId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const participants = Object.values(state)
          .flat()
          .map((p: any) => ({
            userId: p.user_id,
            userName: p.user_name,
            userColor: p.user_color,
            currentPage: p.current_page,
            cursor: p.cursor,
            lastActivity: Date.now(),
          }));
        callback(participants);
      })
      .subscribe();

    return channel;
  },

  /**
   * Leave a session
   */
  async leaveSession(sessionId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase
      .from('session_participants')
      .update({ is_online: false })
      .eq('session_id', sessionId)
      .eq('user_id', user.user.id);
  },

  /**
   * End a session (creator only)
   */
  async endSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('annotation_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) throw error;
  },
};

// ============================================
// Reply Service
// ============================================

export const ReplyService = {
  /**
   * Create a reply to an annotation
   */
  async create(
    annotationId: string,
    content: string,
    parentReplyId?: string
  ): Promise<AnnotationReply | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('annotation_replies')
      .insert({
        annotation_id: annotationId,
        parent_reply_id: parentReplyId,
        author_id: user.user.id,
        author_name: user.user.email?.split('@')[0] || 'Unknown',
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get replies for an annotation
   */
  async getByAnnotation(annotationId: string): Promise<AnnotationReply[]> {
    const { data, error } = await supabase
      .from('annotation_replies')
      .select('*')
      .eq('annotation_id', annotationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update a reply
   */
  async update(replyId: string, content: string): Promise<AnnotationReply | null> {
    const { data, error } = await supabase
      .from('annotation_replies')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', replyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a reply
   */
  async delete(replyId: string): Promise<void> {
    const { error } = await supabase.from('annotation_replies').delete().eq('id', replyId);

    if (error) throw error;
  },

  /**
   * Add reaction to a reply
   */
  async addReaction(replyId: string, emoji: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: reply } = await supabase
      .from('annotation_replies')
      .select('reactions')
      .eq('id', replyId)
      .single();

    if (reply) {
      const reactions = reply.reactions || {};
      const users = reactions[emoji] || [];
      if (!users.includes(user.user.id)) {
        reactions[emoji] = [...users, user.user.id];
        await supabase
          .from('annotation_replies')
          .update({ reactions })
          .eq('id', replyId);
      }
    }
  },

  /**
   * Remove reaction from a reply
   */
  async removeReaction(replyId: string, emoji: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: reply } = await supabase
      .from('annotation_replies')
      .select('reactions')
      .eq('id', replyId)
      .single();

    if (reply) {
      const reactions = reply.reactions || {};
      const users = reactions[emoji] || [];
      reactions[emoji] = users.filter((id: string) => id !== user.user!.id);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
      await supabase
        .from('annotation_replies')
        .update({ reactions })
        .eq('id', replyId);
    }
  },
};

// ============================================
// Mappers
// ============================================

function mapDBLayerToLayer(db: DBLayer): AnnotationLayer {
  return {
    id: db.id,
    name: db.name,
    isVisible: db.is_visible,
    isLocked: db.is_locked,
    opacity: 100, // Not stored in DB
    order: db.order_index,
    color: db.color,
    createdAt: new Date(db.created_at).getTime(),
    annotationIds: [], // Loaded separately
  };
}

function mapDBAnnotationToAnnotation(db: DBAnnotation): EnhancedAnnotation {
  return {
    id: db.id,
    type: db.type as AnnotationType,
    pageNumber: db.page_number,
    rect: db.rect,
    color: db.color,
    opacity: db.opacity * 100,
    borderWidth: db.border_width,
    borderStyle: db.border_style as 'solid' | 'dashed' | 'dotted',
    contents: db.contents,
    richContent: db.rich_text_content
      ? {
          html: '',
          formatting: db.rich_text_content as any,
        }
      : undefined,
    layerId: db.layer_id,
    isLocked: db.is_locked,
    isHidden: db.is_hidden,
    isResolved: db.is_resolved,
    resolvedBy: db.resolved_by,
    resolvedAt: db.resolved_at ? new Date(db.resolved_at).getTime() : undefined,
    author: db.author_name || 'Unknown',
    createdAt: new Date(db.created_at).getTime(),
    modifiedAt: new Date(db.updated_at).getTime(),
    voiceNotes: [],
    aiSuggestions: [],
    reactions: [],
    tags: [],
    mentions: [],
  };
}

function mapDBVoiceNoteToVoiceNote(db: DBVoiceNote, audioBlob: Blob): VoiceNote {
  return {
    id: db.id,
    annotationId: db.annotation_id,
    audioBlob,
    duration: db.duration_seconds,
    waveformData: [], // Would be generated client-side
    transcript: db.transcription,
    createdAt: new Date(db.created_at).getTime(),
    author: db.created_by,
  };
}

function mapDBAISuggestionToSuggestion(db: DBAISuggestion): AISuggestion {
  return {
    id: db.id,
    annotationId: '', // AI suggestions aren't tied to specific annotations yet
    type: db.suggestion_type as AISuggestion['type'],
    originalText: '',
    suggestedText: db.suggested_content || '',
    reason: (db.metadata as any)?.reason || 'AI suggestion',
    confidence: db.confidence,
    status: db.is_accepted ? 'accepted' : db.is_dismissed ? 'dismissed' : 'pending',
    createdAt: new Date(db.created_at).getTime(),
  };
}

function mapDBTemplateToTemplate(db: DBTemplate): AnnotationTemplate {
  return {
    id: db.id,
    name: db.name,
    description: db.description || '',
    category: db.category as AnnotationTemplate['category'],
    thumbnail: db.thumbnail_url || '',
    annotations: db.template_data,
    tags: db.tags,
    isPublic: db.is_public || db.is_system,
    createdBy: db.is_system ? 'System' : db.created_by,
    createdAt: new Date(db.created_at).getTime(),
    usageCount: db.use_count,
  };
}

// ============================================
// Helpers
// ============================================

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function mapAccessLevelToRole(
  accessLevel: 'view' | 'comment' | 'edit' | 'admin'
): 'viewer' | 'commenter' | 'editor' | 'admin' {
  const map: Record<string, 'viewer' | 'commenter' | 'editor' | 'admin'> = {
    view: 'viewer',
    comment: 'commenter',
    edit: 'editor',
    admin: 'admin',
  };
  return map[accessLevel] || 'viewer';
}

function generateUserColor(userId: string): string {
  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#84CC16', // Lime
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#EC4899', // Pink
  ];

  // Hash the userId to get a consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export default {
  Document: DocumentService,
  Layer: LayerService,
  Annotation: AnnotationService,
  VoiceNote: VoiceNoteService,
  AISuggestion: AISuggestionService,
  Template: TemplateService,
  Collaboration: CollaborationService,
  Reply: ReplyService,
};
