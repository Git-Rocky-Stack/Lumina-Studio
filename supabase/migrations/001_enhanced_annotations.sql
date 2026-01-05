-- ============================================
-- Enhanced PDF Annotation System
-- Database Schema for Lumina-Studio
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PDF Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS pdf_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    page_count INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    checksum TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================
-- Annotation Layers Table
-- Supports grouping annotations into layers
-- ============================================
CREATE TABLE IF NOT EXISTS annotation_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_visible BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Main Annotations Table
-- ============================================
CREATE TABLE IF NOT EXISTS annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES annotation_layers(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES annotations(id) ON DELETE CASCADE,

    -- Core properties
    type TEXT NOT NULL CHECK (type IN (
        'highlight', 'underline', 'strikethrough', 'squiggly',
        'redaction', 'text', 'freeText', 'note', 'stamp', 'ink',
        'line', 'arrow', 'rectangle', 'ellipse', 'polygon',
        'polyline', 'link', 'fileAttachment', 'sound', 'watermark',
        'voiceNote', 'richText'
    )),
    page_number INTEGER NOT NULL,

    -- Position and bounds
    rect JSONB NOT NULL, -- {x, y, width, height}

    -- Styling
    color TEXT DEFAULT '#FFEB3B',
    opacity REAL DEFAULT 1.0,
    border_width REAL DEFAULT 2,
    border_style TEXT DEFAULT 'solid',

    -- Rich text formatting (for text annotations)
    rich_text_content JSONB,
    font_settings JSONB,

    -- Content
    contents TEXT,

    -- Type-specific data
    text_markup_quads JSONB,
    ink_paths JSONB,
    line_points JSONB,
    vertices JSONB,
    stamp_type TEXT,
    link_destination JSONB,

    -- Voice note reference
    voice_note_id UUID,

    -- Status flags
    is_locked BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,

    -- Collaboration metadata
    created_by UUID REFERENCES auth.users(id),
    author_name TEXT,
    author_color TEXT,

    -- AI-generated flag
    is_ai_suggested BOOLEAN DEFAULT FALSE,
    ai_confidence REAL,
    ai_category TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Optimistic locking
    version INTEGER DEFAULT 1
);

-- ============================================
-- Annotation Replies (Threaded Comments)
-- ============================================
CREATE TABLE IF NOT EXISTS annotation_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES annotation_replies(id) ON DELETE CASCADE,

    author_id UUID REFERENCES auth.users(id),
    author_name TEXT NOT NULL,
    author_avatar TEXT,

    content TEXT NOT NULL,

    -- Reactions (emoji reactions)
    reactions JSONB DEFAULT '{}',

    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Voice Notes Storage
-- ============================================
CREATE TABLE IF NOT EXISTS voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,

    storage_path TEXT NOT NULL,
    duration_seconds REAL NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT DEFAULT 'audio/webm',

    -- Transcription
    transcription TEXT,
    transcription_status TEXT DEFAULT 'pending',
    transcription_language TEXT DEFAULT 'en',

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Annotation Templates
-- ============================================
CREATE TABLE IF NOT EXISTS annotation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    thumbnail_url TEXT,

    -- Template data
    template_data JSONB NOT NULL, -- Array of annotation definitions

    -- Ownership
    is_system BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),

    -- Usage stats
    use_count INTEGER DEFAULT 0,

    tags TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI Suggestions Cache
-- ============================================
CREATE TABLE IF NOT EXISTS ai_annotation_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,

    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
        'form_field', 'key_term', 'signature_area',
        'date_field', 'header', 'table', 'summary'
    )),

    rect JSONB NOT NULL,
    confidence REAL NOT NULL,
    suggested_content TEXT,
    metadata JSONB,

    -- Status
    is_accepted BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    accepted_annotation_id UUID REFERENCES annotations(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Collaboration Sessions
-- ============================================
CREATE TABLE IF NOT EXISTS annotation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,

    session_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Access control
    created_by UUID REFERENCES auth.users(id),
    share_token TEXT UNIQUE,
    access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'comment', 'edit', 'admin')),

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Session Participants
-- ============================================
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES annotation_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'commenter', 'editor', 'admin')),

    -- Presence tracking
    cursor_position JSONB,
    current_page INTEGER,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),

    joined_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(session_id, user_id)
);

-- ============================================
-- Annotation History (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS annotation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,

    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore')),

    previous_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],

    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_annotations_document ON annotations(document_id);
CREATE INDEX IF NOT EXISTS idx_annotations_page ON annotations(document_id, page_number);
CREATE INDEX IF NOT EXISTS idx_annotations_layer ON annotations(layer_id);
CREATE INDEX IF NOT EXISTS idx_annotations_type ON annotations(type);
CREATE INDEX IF NOT EXISTS idx_annotations_created_by ON annotations(created_by);
CREATE INDEX IF NOT EXISTS idx_annotations_ai_suggested ON annotations(is_ai_suggested) WHERE is_ai_suggested = TRUE;

CREATE INDEX IF NOT EXISTS idx_replies_annotation ON annotation_replies(annotation_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_annotation ON voice_notes(annotation_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_document ON ai_annotation_suggestions(document_id, page_number);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_annotation_history_annotation ON annotation_history(annotation_id);

-- ============================================
-- Row Level Security Policies
-- ============================================
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Document owner policy
CREATE POLICY "Users can view their own documents"
    ON pdf_documents FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own documents"
    ON pdf_documents FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
    ON pdf_documents FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
    ON pdf_documents FOR DELETE
    USING (user_id = auth.uid());

-- Annotations access based on document ownership or session participation
CREATE POLICY "Users can view annotations on accessible documents"
    ON annotations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pdf_documents d
            WHERE d.id = annotations.document_id
            AND (
                d.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM annotation_sessions s
                    JOIN session_participants sp ON sp.session_id = s.id
                    WHERE s.document_id = d.id
                    AND sp.user_id = auth.uid()
                    AND s.is_active = TRUE
                )
            )
        )
    );

CREATE POLICY "Users can create annotations on accessible documents"
    ON annotations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pdf_documents d
            WHERE d.id = document_id
            AND (
                d.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM annotation_sessions s
                    JOIN session_participants sp ON sp.session_id = s.id
                    WHERE s.document_id = d.id
                    AND sp.user_id = auth.uid()
                    AND sp.role IN ('editor', 'admin')
                    AND s.is_active = TRUE
                )
            )
        )
    );

CREATE POLICY "Users can update their own annotations"
    ON annotations FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own annotations"
    ON annotations FOR DELETE
    USING (created_by = auth.uid());

-- Annotation layers policies
CREATE POLICY "Users can view layers on accessible documents"
    ON annotation_layers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pdf_documents d
            WHERE d.id = annotation_layers.document_id
            AND (
                d.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM annotation_sessions s
                    JOIN session_participants sp ON sp.session_id = s.id
                    WHERE s.document_id = d.id
                    AND sp.user_id = auth.uid()
                    AND s.is_active = TRUE
                )
            )
        )
    );

CREATE POLICY "Users can create layers on their documents"
    ON annotation_layers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pdf_documents d
            WHERE d.id = document_id
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Layer creators can update their layers"
    ON annotation_layers FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Layer creators can delete their layers"
    ON annotation_layers FOR DELETE
    USING (created_by = auth.uid());

-- Public templates policy
CREATE POLICY "Anyone can view public templates"
    ON annotation_templates FOR SELECT
    USING (is_public = TRUE OR is_system = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates"
    ON annotation_templates FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
    ON annotation_templates FOR UPDATE
    USING (created_by = auth.uid() AND is_system = FALSE);

CREATE POLICY "Users can delete their own templates"
    ON annotation_templates FOR DELETE
    USING (created_by = auth.uid() AND is_system = FALSE);

-- Voice notes policies
CREATE POLICY "Users can view voice notes on accessible annotations"
    ON voice_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM annotations a
            JOIN pdf_documents d ON d.id = a.document_id
            WHERE a.id = voice_notes.annotation_id
            AND (
                d.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM annotation_sessions s
                    JOIN session_participants sp ON sp.session_id = s.id
                    WHERE s.document_id = d.id
                    AND sp.user_id = auth.uid()
                    AND s.is_active = TRUE
                )
            )
        )
    );

CREATE POLICY "Users can create voice notes on their annotations"
    ON voice_notes FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own voice notes"
    ON voice_notes FOR DELETE
    USING (created_by = auth.uid());

-- ============================================
-- Triggers for Updated Timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pdf_documents_updated_at
    BEFORE UPDATE ON pdf_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER annotations_updated_at
    BEFORE UPDATE ON annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER annotation_layers_updated_at
    BEFORE UPDATE ON annotation_layers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER annotation_replies_updated_at
    BEFORE UPDATE ON annotation_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER annotation_templates_updated_at
    BEFORE UPDATE ON annotation_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER annotation_sessions_updated_at
    BEFORE UPDATE ON annotation_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Function for Optimistic Locking
-- ============================================
CREATE OR REPLACE FUNCTION check_annotation_version()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.version != NEW.version - 1 THEN
        RAISE EXCEPTION 'Concurrent modification detected. Please refresh and try again.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER annotation_version_check
    BEFORE UPDATE ON annotations
    FOR EACH ROW EXECUTE FUNCTION check_annotation_version();

-- ============================================
-- Insert Default System Templates
-- ============================================
INSERT INTO annotation_templates (name, description, category, is_system, is_public, template_data, tags)
VALUES
    ('Contract Review', 'Standard highlights for reviewing legal contracts', 'legal', TRUE, TRUE,
     '[{"type": "highlight", "relativeRect": {"xPercent": 0, "yPercent": 0, "widthPercent": 100, "heightPercent": 2}, "color": "#FFEB3B", "opacity": 0.5, "borderWidth": 0, "contents": "Key clause"}]'::jsonb,
     ARRAY['legal', 'contract', 'review']),

    ('Document Approval', 'Stamps and signature fields for document approval workflow', 'business', TRUE, TRUE,
     '[{"type": "stamp", "relativeRect": {"xPercent": 70, "yPercent": 85, "widthPercent": 25, "heightPercent": 10}, "color": "#4CAF50", "opacity": 1, "borderWidth": 2, "metadata": {"stampType": "approved"}}]'::jsonb,
     ARRAY['approval', 'stamp', 'signature']),

    ('Study Notes', 'Color-coded highlights for academic study', 'education', TRUE, TRUE,
     '[{"type": "highlight", "relativeRect": {"xPercent": 0, "yPercent": 0, "widthPercent": 100, "heightPercent": 2}, "color": "#2196F3", "opacity": 0.4, "borderWidth": 0, "contents": "Definition"}, {"type": "highlight", "relativeRect": {"xPercent": 0, "yPercent": 0, "widthPercent": 100, "heightPercent": 2}, "color": "#4CAF50", "opacity": 0.4, "borderWidth": 0, "contents": "Important"}, {"type": "highlight", "relativeRect": {"xPercent": 0, "yPercent": 0, "widthPercent": 100, "heightPercent": 2}, "color": "#FF5722", "opacity": 0.4, "borderWidth": 0, "contents": "Review needed"}]'::jsonb,
     ARRAY['study', 'education', 'notes']);

-- ============================================
-- Create Storage Buckets for Voice Notes
-- ============================================
-- Note: This needs to be run via Supabase Dashboard or CLI
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('annotations', 'annotations', FALSE);