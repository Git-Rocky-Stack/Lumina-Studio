-- =============================================
-- Keyboard Shortcuts, Plugins, Activity & History
-- Advanced productivity and extensibility features
-- =============================================

-- Custom Keyboard Shortcuts
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Shortcut info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- 'general', 'editing', 'navigation', 'tools', 'vim', 'custom'

    -- Key combination
    key_combo TEXT NOT NULL, -- e.g., 'ctrl+shift+a', 'g g' (vim), ':w' (vim command)
    key_code TEXT, -- Physical key code
    modifiers TEXT[] DEFAULT '{}', -- ['ctrl', 'shift', 'alt', 'meta']

    -- Action
    action_type TEXT NOT NULL, -- 'command', 'macro', 'vim_command', 'script'
    action_data JSONB NOT NULL, -- Command ID, macro steps, or script

    -- Settings
    is_enabled BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false, -- Works outside canvas
    requires_selection BOOLEAN DEFAULT false,

    -- Priority for conflict resolution
    priority INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, key_combo)
);

-- Recorded Macros
CREATE TABLE IF NOT EXISTS recorded_macros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Macro info
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6366f1',

    -- Recording
    steps JSONB NOT NULL DEFAULT '[]', -- Array of actions
    recorded_duration_ms INTEGER,

    -- Settings
    playback_speed DECIMAL(3,2) DEFAULT 1.0,
    loop_count INTEGER DEFAULT 1,

    -- Usage stats
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Shortcut binding
    shortcut_id UUID REFERENCES keyboard_shortcuts(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log (for heatmaps)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID,

    -- Activity info
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'move', 'resize', 'style', etc.
    element_id TEXT,
    element_type TEXT,

    -- Position data (for heatmap)
    x DECIMAL(10,2),
    y DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),

    -- Change details
    changes JSONB, -- What changed
    previous_value JSONB,
    new_value JSONB,

    -- Session info
    session_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Aggregates (pre-computed heatmap data)
CREATE TABLE IF NOT EXISTS activity_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID,

    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL, -- 'hour', 'day', 'week'

    -- Grid cell (for spatial heatmap)
    grid_x INTEGER,
    grid_y INTEGER,
    grid_size INTEGER DEFAULT 50, -- pixels per cell

    -- Aggregated data
    action_counts JSONB DEFAULT '{}', -- { 'create': 5, 'update': 20, ... }
    total_actions INTEGER DEFAULT 0,
    unique_elements INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design Critique Results
CREATE TABLE IF NOT EXISTS design_critiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID,

    -- Analysis info
    analysis_type TEXT NOT NULL, -- 'full', 'typography', 'spacing', 'accessibility', 'color', 'layout'
    canvas_snapshot JSONB, -- Elements at time of analysis

    -- Results
    overall_score DECIMAL(3,2), -- 0-1

    -- Category scores
    typography_score DECIMAL(3,2),
    spacing_score DECIMAL(3,2),
    accessibility_score DECIMAL(3,2),
    color_score DECIMAL(3,2),
    layout_score DECIMAL(3,2),

    -- Issues found
    issues JSONB DEFAULT '[]', -- Array of { severity, category, message, element_id, suggestion }

    -- Suggestions
    suggestions JSONB DEFAULT '[]', -- Array of improvement suggestions

    -- Accessibility specifics
    wcag_level TEXT, -- 'A', 'AA', 'AAA'
    contrast_issues INTEGER DEFAULT 0,
    alt_text_missing INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canvas History (for undo/redo timeline)
CREATE TABLE IF NOT EXISTS canvas_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,

    -- History entry
    version_number INTEGER NOT NULL,
    action_label TEXT NOT NULL, -- Human-readable action description
    action_type TEXT NOT NULL,

    -- State
    canvas_state JSONB NOT NULL, -- Full canvas state at this point
    thumbnail_url TEXT, -- Pre-rendered thumbnail

    -- Change details
    changed_elements TEXT[], -- IDs of elements that changed
    delta JSONB, -- Just the changes (for efficient storage)

    -- Branching support
    parent_version INTEGER,
    branch_name TEXT DEFAULT 'main',

    -- Metadata
    is_checkpoint BOOLEAN DEFAULT false, -- Manual save point
    is_autosave BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, version_number, branch_name)
);

-- Plugin Registry
CREATE TABLE IF NOT EXISTS plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Plugin info
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    version TEXT NOT NULL,
    author TEXT,
    author_url TEXT,
    homepage_url TEXT,
    repository_url TEXT,

    -- Icon and media
    icon_url TEXT,
    banner_url TEXT,
    screenshots TEXT[] DEFAULT '{}',

    -- Categories and tags
    category TEXT NOT NULL, -- 'tools', 'filters', 'effects', 'templates', 'integration', 'ai'
    tags TEXT[] DEFAULT '{}',

    -- Technical
    entry_point TEXT NOT NULL, -- Main JS file URL
    manifest JSONB NOT NULL, -- Plugin manifest with capabilities
    permissions TEXT[] DEFAULT '{}', -- Required permissions

    -- Stats
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Versioning
    min_app_version TEXT,
    max_app_version TEXT,

    published_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Installed Plugins
CREATE TABLE IF NOT EXISTS user_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,

    -- Installation info
    installed_version TEXT NOT NULL,
    auto_update BOOLEAN DEFAULT true,

    -- Status
    is_enabled BOOLEAN DEFAULT true,

    -- Settings
    settings JSONB DEFAULT '{}', -- User-specific plugin settings

    -- Usage
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    installed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, plugin_id)
);

-- Plugin Hooks (registered by plugins)
CREATE TABLE IF NOT EXISTS plugin_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,

    -- Hook info
    hook_name TEXT NOT NULL, -- 'onCanvasReady', 'beforeSave', 'onElementSelect', etc.
    handler_id TEXT NOT NULL, -- ID in plugin code
    priority INTEGER DEFAULT 0,

    -- Filter
    element_types TEXT[], -- Only trigger for these element types

    is_async BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(plugin_id, hook_name, handler_id)
);

-- Custom Plugin Tools (tools added by plugins)
CREATE TABLE IF NOT EXISTS plugin_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,

    -- Tool info
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,

    -- Tool type
    tool_type TEXT NOT NULL, -- 'draw', 'select', 'transform', 'effect', 'action'

    -- Configuration
    config JSONB DEFAULT '{}',

    -- UI
    panel_component TEXT, -- Component ID for tool panel
    cursor_url TEXT,

    -- Shortcut
    default_shortcut TEXT,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shortcuts_user ON keyboard_shortcuts(user_id);
CREATE INDEX idx_shortcuts_category ON keyboard_shortcuts(category);
CREATE INDEX idx_macros_user ON recorded_macros(user_id);
CREATE INDEX idx_activity_user_project ON activity_log(user_id, project_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_type ON activity_log(action_type);
CREATE INDEX idx_aggregates_user_project ON activity_aggregates(user_id, project_id);
CREATE INDEX idx_aggregates_period ON activity_aggregates(period_start, period_end);
CREATE INDEX idx_critiques_user_project ON design_critiques(user_id, project_id);
CREATE INDEX idx_history_project ON canvas_history(project_id);
CREATE INDEX idx_history_version ON canvas_history(project_id, version_number DESC);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_featured ON plugins(is_featured) WHERE is_featured = true;
CREATE INDEX idx_user_plugins_user ON user_plugins(user_id);
CREATE INDEX idx_plugin_hooks ON plugin_hooks(plugin_id, hook_name);

-- RLS Policies
ALTER TABLE keyboard_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recorded_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_critiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shortcuts"
    ON keyboard_shortcuts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own macros"
    ON recorded_macros FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own activity"
    ON activity_log FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own aggregates"
    ON activity_aggregates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own critiques"
    ON design_critiques FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own history"
    ON canvas_history FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active plugins"
    ON plugins FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users manage own plugin installations"
    ON user_plugins FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view plugin hooks"
    ON plugin_hooks FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view plugin tools"
    ON plugin_tools FOR SELECT
    USING (is_active = true);

-- Insert default keyboard shortcuts
INSERT INTO keyboard_shortcuts (user_id, name, category, key_combo, modifiers, action_type, action_data, is_global) VALUES
    -- Will use a placeholder user_id that gets replaced by the app
    (gen_random_uuid(), 'Select All', 'editing', 'ctrl+a', ARRAY['ctrl'], 'command', '{"command": "selectAll"}', false),
    (gen_random_uuid(), 'Copy', 'editing', 'ctrl+c', ARRAY['ctrl'], 'command', '{"command": "copy"}', false),
    (gen_random_uuid(), 'Paste', 'editing', 'ctrl+v', ARRAY['ctrl'], 'command', '{"command": "paste"}', false),
    (gen_random_uuid(), 'Cut', 'editing', 'ctrl+x', ARRAY['ctrl'], 'command', '{"command": "cut"}', false),
    (gen_random_uuid(), 'Undo', 'editing', 'ctrl+z', ARRAY['ctrl'], 'command', '{"command": "undo"}', false),
    (gen_random_uuid(), 'Redo', 'editing', 'ctrl+shift+z', ARRAY['ctrl', 'shift'], 'command', '{"command": "redo"}', false),
    (gen_random_uuid(), 'Delete', 'editing', 'delete', ARRAY[]::TEXT[], 'command', '{"command": "delete"}', false),
    (gen_random_uuid(), 'Duplicate', 'editing', 'ctrl+d', ARRAY['ctrl'], 'command', '{"command": "duplicate"}', false),
    (gen_random_uuid(), 'Group', 'editing', 'ctrl+g', ARRAY['ctrl'], 'command', '{"command": "group"}', false),
    (gen_random_uuid(), 'Ungroup', 'editing', 'ctrl+shift+g', ARRAY['ctrl', 'shift'], 'command', '{"command": "ungroup"}', false),
    (gen_random_uuid(), 'Bring Forward', 'editing', 'ctrl+]', ARRAY['ctrl'], 'command', '{"command": "bringForward"}', false),
    (gen_random_uuid(), 'Send Backward', 'editing', 'ctrl+[', ARRAY['ctrl'], 'command', '{"command": "sendBackward"}', false),
    (gen_random_uuid(), 'Zoom In', 'navigation', 'ctrl+=', ARRAY['ctrl'], 'command', '{"command": "zoomIn"}', true),
    (gen_random_uuid(), 'Zoom Out', 'navigation', 'ctrl+-', ARRAY['ctrl'], 'command', '{"command": "zoomOut"}', true),
    (gen_random_uuid(), 'Fit to Screen', 'navigation', 'ctrl+0', ARRAY['ctrl'], 'command', '{"command": "fitToScreen"}', true),
    (gen_random_uuid(), 'Pan Tool', 'tools', 'h', ARRAY[]::TEXT[], 'command', '{"command": "setTool", "tool": "pan"}', false),
    (gen_random_uuid(), 'Select Tool', 'tools', 'v', ARRAY[]::TEXT[], 'command', '{"command": "setTool", "tool": "select"}', false),
    (gen_random_uuid(), 'Rectangle Tool', 'tools', 'r', ARRAY[]::TEXT[], 'command', '{"command": "setTool", "tool": "rect"}', false),
    (gen_random_uuid(), 'Ellipse Tool', 'tools', 'o', ARRAY[]::TEXT[], 'command', '{"command": "setTool", "tool": "ellipse"}', false),
    (gen_random_uuid(), 'Text Tool', 'tools', 't', ARRAY[]::TEXT[], 'command', '{"command": "setTool", "tool": "text"}', false),
    (gen_random_uuid(), 'Line Tool', 'tools', 'l', ARRAY[]::TEXT[], 'command', '{"command": "setTool", "tool": "line"}', false),
    (gen_random_uuid(), 'Pen Tool', 'tools', 'p', ARRAY[]::TEXT[], 'command', '{"command": "setTool", "tool": "pen"}', false);

-- Insert some sample plugins (for demo purposes)
INSERT INTO plugins (name, slug, description, version, author, category, entry_point, manifest, is_verified, is_featured) VALUES
    ('Background Remover', 'bg-remover', 'AI-powered background removal for images', '1.0.0', 'Lumina', 'ai', '/plugins/bg-remover/index.js', '{"name": "Background Remover", "version": "1.0.0", "capabilities": ["imageProcessing"]}', true, true),
    ('Social Templates', 'social-templates', 'Pre-designed templates for social media', '2.1.0', 'Lumina', 'templates', '/plugins/social-templates/index.js', '{"name": "Social Templates", "version": "2.1.0", "capabilities": ["templates"]}', true, true),
    ('Color Harmonies', 'color-harmonies', 'Generate color palettes from any color', '1.2.0', 'Lumina', 'tools', '/plugins/color-harmonies/index.js', '{"name": "Color Harmonies", "version": "1.2.0", "capabilities": ["colorTools"]}', true, false),
    ('Blur Effects', 'blur-effects', 'Advanced blur and depth effects', '1.0.0', 'Lumina', 'effects', '/plugins/blur-effects/index.js', '{"name": "Blur Effects", "version": "1.0.0", "capabilities": ["filters"]}', true, false),
    ('Figma Sync', 'figma-sync', 'Two-way sync with Figma files', '0.9.0', 'Lumina', 'integration', '/plugins/figma-sync/index.js', '{"name": "Figma Sync", "version": "0.9.0", "capabilities": ["import", "export"]}', true, true);
