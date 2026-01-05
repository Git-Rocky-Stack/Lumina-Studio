-- =============================================
-- Design Import/Export & Brand Kit
-- Figma/Canva import, design tokens, brand enforcement
-- =============================================

-- Import Jobs (track import progress)
CREATE TABLE IF NOT EXISTS design_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Source info
    source_type TEXT NOT NULL, -- 'figma', 'canva', 'sketch', 'psd', 'xd'
    source_file_url TEXT,
    source_file_name TEXT,
    source_file_size BIGINT,

    -- Figma-specific
    figma_file_key TEXT,
    figma_node_ids TEXT[], -- Specific frames to import

    -- Canva-specific
    canva_design_id TEXT,
    canva_export_format TEXT,

    -- Processing
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'partial'
    progress_percent INTEGER DEFAULT 0,
    total_frames INTEGER DEFAULT 0,
    processed_frames INTEGER DEFAULT 0,

    -- Results
    result_project_id UUID,
    result_data JSONB, -- Imported elements, mappings
    warnings TEXT[],
    errors TEXT[],

    -- Metadata
    import_options JSONB DEFAULT '{}', -- flatten_groups, import_images, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Imported Elements Mapping (track source to result mapping)
CREATE TABLE IF NOT EXISTS import_element_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES design_imports(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL, -- Original element ID from source
    source_type TEXT NOT NULL, -- 'frame', 'group', 'text', 'image', 'shape'
    result_id TEXT, -- Lumina element ID
    result_type TEXT,
    mapping_data JSONB, -- Style mappings, font substitutions, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Kits
CREATE TABLE IF NOT EXISTS brand_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID,

    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,

    -- Colors (up to 10 brand colors)
    primary_color TEXT NOT NULL DEFAULT '#6366f1',
    secondary_color TEXT,
    accent_color TEXT,
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#111827',
    colors JSONB DEFAULT '[]', -- Additional colors with names

    -- Typography
    heading_font TEXT DEFAULT 'Inter',
    body_font TEXT DEFAULT 'Inter',
    font_scale DECIMAL(3,2) DEFAULT 1.0,
    typography_settings JSONB DEFAULT '{}',

    -- Spacing & Layout
    spacing_unit INTEGER DEFAULT 8, -- Base spacing in pixels
    border_radius INTEGER DEFAULT 8,

    -- Voice & Tone
    tone_keywords TEXT[] DEFAULT '{}',
    writing_guidelines TEXT,

    -- Assets
    icon_style TEXT DEFAULT 'outline', -- 'outline', 'filled', 'duotone'
    image_style TEXT, -- 'photography', 'illustration', 'abstract'

    -- Settings
    is_default BOOLEAN DEFAULT false,
    enforce_strict BOOLEAN DEFAULT false, -- Block off-brand elements

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Guidelines Documents
CREATE TABLE IF NOT EXISTS brand_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_kit_id UUID NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    section_order INTEGER DEFAULT 0,
    content JSONB NOT NULL, -- Rich content with examples
    do_examples TEXT[],
    dont_examples TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Compliance Checks
CREATE TABLE IF NOT EXISTS brand_compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_kit_id UUID NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
    project_id UUID,

    -- Check results
    overall_score DECIMAL(3,2), -- 0-1 compliance score
    issues JSONB DEFAULT '[]', -- List of violations
    suggestions JSONB DEFAULT '[]', -- Improvement suggestions

    -- Issue counts
    color_issues INTEGER DEFAULT 0,
    font_issues INTEGER DEFAULT 0,
    spacing_issues INTEGER DEFAULT 0,
    other_issues INTEGER DEFAULT 0,

    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design Tokens
CREATE TABLE IF NOT EXISTS design_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_kit_id UUID REFERENCES brand_kits(id) ON DELETE SET NULL,

    -- Token info
    name TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0.0',

    -- Token data (Design Tokens Community Group format)
    tokens JSONB NOT NULL, -- Full token structure

    -- Categories
    color_tokens JSONB DEFAULT '{}',
    typography_tokens JSONB DEFAULT '{}',
    spacing_tokens JSONB DEFAULT '{}',
    shadow_tokens JSONB DEFAULT '{}',
    border_tokens JSONB DEFAULT '{}',

    -- Export formats cache
    css_output TEXT,
    scss_output TEXT,
    tailwind_output JSONB,
    figma_output JSONB,
    json_output JSONB,

    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic Resize Presets
CREATE TABLE IF NOT EXISTS resize_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system presets

    -- Preset info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'social', 'print', 'web', 'video', 'custom'
    platform TEXT, -- 'instagram', 'facebook', etc.

    -- Dimensions
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    aspect_ratio TEXT,

    -- Resize behavior
    resize_mode TEXT DEFAULT 'smart', -- 'smart', 'crop', 'fit', 'fill', 'stretch'
    anchor_point TEXT DEFAULT 'center', -- 'center', 'top', 'bottom', 'left', 'right'

    -- Element handling
    scale_text BOOLEAN DEFAULT true,
    maintain_hierarchy BOOLEAN DEFAULT true,
    crop_images BOOLEAN DEFAULT false,

    -- Display
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resize Jobs
CREATE TABLE IF NOT EXISTS resize_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_project_id UUID,
    source_canvas_data JSONB NOT NULL,

    -- Resize settings
    target_presets UUID[] DEFAULT '{}', -- Array of preset IDs
    custom_sizes JSONB DEFAULT '[]', -- Custom width/height pairs
    resize_mode TEXT DEFAULT 'smart',

    -- Results
    status TEXT DEFAULT 'pending',
    results JSONB DEFAULT '[]', -- Array of {preset_id, canvas_data, thumbnail_url}

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enhanced Publishing Schedule (extends existing)
CREATE TABLE IF NOT EXISTS publishing_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Schedule info
    name TEXT NOT NULL,
    description TEXT,

    -- Timing
    schedule_type TEXT DEFAULT 'optimal', -- 'optimal', 'fixed', 'recurring'
    fixed_times TIMESTAMPTZ[],
    recurrence_rule TEXT, -- iCal RRULE
    timezone TEXT DEFAULT 'UTC',

    -- Platform preferences
    platforms TEXT[] DEFAULT '{}',
    platform_settings JSONB DEFAULT '{}', -- Per-platform timing adjustments

    -- Content queue
    auto_queue BOOLEAN DEFAULT false,
    queue_from_folder UUID, -- Asset folder to auto-queue from

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_imports_user ON design_imports(user_id);
CREATE INDEX idx_imports_status ON design_imports(status);
CREATE INDEX idx_import_mappings ON import_element_mappings(import_id);

CREATE INDEX idx_brand_kits_user ON brand_kits(user_id);
CREATE INDEX idx_brand_kits_default ON brand_kits(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_brand_guidelines ON brand_guidelines(brand_kit_id);
CREATE INDEX idx_compliance_checks ON brand_compliance_checks(user_id, brand_kit_id);

CREATE INDEX idx_design_tokens_user ON design_tokens(user_id);
CREATE INDEX idx_design_tokens_brand ON design_tokens(brand_kit_id);

CREATE INDEX idx_resize_presets_category ON resize_presets(category);
CREATE INDEX idx_resize_presets_user ON resize_presets(user_id);
CREATE INDEX idx_resize_jobs_user ON resize_jobs(user_id);

CREATE INDEX idx_publishing_schedules_user ON publishing_schedules(user_id);

-- RLS Policies
ALTER TABLE design_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_element_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE resize_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE resize_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own imports"
    ON design_imports FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own import mappings"
    ON import_element_mappings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM design_imports WHERE id = import_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users manage own brand kits"
    ON brand_kits FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own guidelines"
    ON brand_guidelines FOR ALL
    USING (EXISTS (
        SELECT 1 FROM brand_kits WHERE id = brand_kit_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users manage own compliance checks"
    ON brand_compliance_checks FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own design tokens"
    ON design_tokens FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users view all presets, manage own"
    ON resize_presets FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users create own presets"
    ON resize_presets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own presets"
    ON resize_presets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own resize jobs"
    ON resize_jobs FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own schedules"
    ON publishing_schedules FOR ALL
    USING (auth.uid() = user_id);

-- Insert default resize presets
INSERT INTO resize_presets (name, description, category, platform, width, height, aspect_ratio, sort_order, is_featured) VALUES
    -- Instagram
    ('Instagram Post', 'Square post for feed', 'social', 'instagram', 1080, 1080, '1:1', 1, true),
    ('Instagram Portrait', 'Portrait post for feed', 'social', 'instagram', 1080, 1350, '4:5', 2, false),
    ('Instagram Story', 'Full-screen story', 'social', 'instagram', 1080, 1920, '9:16', 3, true),
    ('Instagram Reel', 'Vertical video cover', 'social', 'instagram', 1080, 1920, '9:16', 4, false),

    -- Facebook
    ('Facebook Post', 'Standard feed post', 'social', 'facebook', 1200, 630, '1.91:1', 10, true),
    ('Facebook Story', 'Full-screen story', 'social', 'facebook', 1080, 1920, '9:16', 11, false),
    ('Facebook Cover', 'Page cover photo', 'social', 'facebook', 820, 312, '2.63:1', 12, false),
    ('Facebook Event', 'Event cover image', 'social', 'facebook', 1920, 1005, '1.91:1', 13, false),

    -- Twitter/X
    ('Twitter Post', 'Standard tweet image', 'social', 'twitter', 1200, 675, '16:9', 20, true),
    ('Twitter Header', 'Profile header', 'social', 'twitter', 1500, 500, '3:1', 21, false),

    -- LinkedIn
    ('LinkedIn Post', 'Feed post image', 'social', 'linkedin', 1200, 627, '1.91:1', 30, true),
    ('LinkedIn Banner', 'Profile banner', 'social', 'linkedin', 1584, 396, '4:1', 31, false),

    -- TikTok
    ('TikTok Video', 'Vertical video cover', 'social', 'tiktok', 1080, 1920, '9:16', 40, true),

    -- YouTube
    ('YouTube Thumbnail', 'Video thumbnail', 'social', 'youtube', 1280, 720, '16:9', 50, true),
    ('YouTube Banner', 'Channel banner', 'social', 'youtube', 2560, 1440, '16:9', 51, false),

    -- Pinterest
    ('Pinterest Pin', 'Standard pin', 'social', 'pinterest', 1000, 1500, '2:3', 60, true),

    -- Web
    ('Website Banner', 'Hero banner', 'web', NULL, 1920, 600, '16:5', 100, true),
    ('Blog Header', 'Blog post header', 'web', NULL, 1200, 630, '1.91:1', 101, false),
    ('Email Header', 'Email campaign header', 'web', NULL, 600, 200, '3:1', 102, false),
    ('Ad Banner', 'Display ad', 'web', NULL, 728, 90, '8:1', 103, false),

    -- Print
    ('Business Card', 'Standard business card', 'print', NULL, 1050, 600, '7:4', 200, true),
    ('Flyer A4', 'A4 flyer portrait', 'print', NULL, 2480, 3508, '1:1.41', 201, false),
    ('Poster', '24x36 inch poster', 'print', NULL, 7200, 10800, '2:3', 202, false);
