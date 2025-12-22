-- Lumina Studio D1 Database Schema
-- Migration: 001_initial_schema
-- Created: 2025-01-15

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
    subscription_id TEXT,
    subscription_expires_at INTEGER,
    theme_color TEXT DEFAULT 'indigo',
    default_workspace_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_login_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- ============================================
-- WORKSPACES & PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    default_brand_kit_id TEXT,
    settings_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

CREATE TABLE IF NOT EXISTS workspace_members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    invited_by TEXT,
    invited_at INTEGER,
    accepted_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    UNIQUE(workspace_id, user_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    project_type TEXT NOT NULL CHECK (project_type IN ('design', 'video', 'document', 'brand', 'campaign')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'archived')),
    is_template INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    thumbnail_asset_id TEXT,
    current_version INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_opened_at INTEGER,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS project_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    state_json TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    change_summary TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    UNIQUE(project_id, version_number),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_project_versions_project ON project_versions(project_id);

-- ============================================
-- ASSETS & STORAGE
-- ============================================

CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', 'document', 'font', 'model3d', 'other')),
    storage_key TEXT NOT NULL UNIQUE,
    cdn_url TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    is_ai_generated INTEGER DEFAULT 0,
    generation_prompt TEXT,
    generation_model TEXT,
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,
    tags_json TEXT,
    description TEXT,
    alt_text TEXT,
    dominant_colors_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_workspace ON assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_assets_processing_status ON assets(processing_status);

CREATE TABLE IF NOT EXISTS asset_versions (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    storage_key TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    edit_operations_json TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    UNIQUE(asset_id, version_number),
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_asset_versions_asset ON asset_versions(asset_id);

CREATE TABLE IF NOT EXISTS asset_usage (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    element_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_asset_usage_asset ON asset_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_usage_project ON asset_usage(project_id);

-- ============================================
-- BRAND KITS
-- ============================================

CREATE TABLE IF NOT EXISTS brand_kits (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    personality TEXT,
    tone_keywords_json TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    colors_json TEXT,
    heading_font TEXT,
    body_font TEXT,
    fonts_json TEXT,
    logo_primary_asset_id TEXT,
    logo_dark_asset_id TEXT,
    logo_icon_asset_id TEXT,
    guidelines_asset_id TEXT,
    is_default INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (logo_primary_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY (logo_dark_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY (logo_icon_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY (guidelines_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_brand_kits_workspace ON brand_kits(workspace_id);

-- ============================================
-- MARKETING CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    brand_kit_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    start_date INTEGER,
    end_date INTEGER,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
    platforms_json TEXT,
    target_audience TEXT,
    content_themes_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_kit_id) REFERENCES brand_kits(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

CREATE TABLE IF NOT EXISTS campaign_posts (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    headline TEXT,
    body TEXT,
    hashtags_json TEXT,
    media_asset_ids_json TEXT,
    scheduled_at INTEGER,
    published_at INTEGER,
    is_ai_generated INTEGER DEFAULT 0,
    generation_prompt TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'bold', 'professional')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_posts_campaign ON campaign_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_platform ON campaign_posts(platform);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_status ON campaign_posts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_scheduled ON campaign_posts(scheduled_at);

-- ============================================
-- VIDEO PROJECTS (Storyboards)
-- ============================================

CREATE TABLE IF NOT EXISTS storyboards (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    master_concept TEXT,
    aspect_ratio TEXT DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:3', '3:2')),
    audio_track_id TEXT,
    audio_prompt TEXT,
    total_duration_seconds REAL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_storyboards_project ON storyboards(project_id);

CREATE TABLE IF NOT EXISTS storyboard_shots (
    id TEXT PRIMARY KEY,
    storyboard_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    camera TEXT,
    lighting TEXT,
    lens_type TEXT,
    motion_description TEXT,
    cinematic_detail TEXT,
    motion_score INTEGER,
    duration_seconds REAL DEFAULT 5,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'extending', 'error')),
    video_asset_id TEXT,
    thumbnail_asset_id TEXT,
    transition_type TEXT DEFAULT 'cut' CHECK (transition_type IN ('cut', 'crossfade', 'glitch', 'dissolve', 'zoom', 'slide')),
    transition_intensity INTEGER DEFAULT 5,
    transition_duration_seconds REAL DEFAULT 1.0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
    FOREIGN KEY (video_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY (thumbnail_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_storyboard_shots_storyboard ON storyboard_shots(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_storyboard_shots_position ON storyboard_shots(storyboard_id, position);

-- ============================================
-- DESIGN PROJECTS (Canvas)
-- ============================================

CREATE TABLE IF NOT EXISTS canvas_projects (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    width INTEGER NOT NULL DEFAULT 500,
    height INTEGER NOT NULL DEFAULT 700,
    background_color TEXT,
    background_asset_id TEXT,
    elements_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (background_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_canvas_projects_project ON canvas_projects(project_id);

-- ============================================
-- USAGE TRACKING & QUOTAS
-- ============================================

CREATE TABLE IF NOT EXISTS usage_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT,
    usage_type TEXT NOT NULL CHECK (usage_type IN (
        'ai_image_generation',
        'ai_video_generation',
        'ai_text_generation',
        'ai_audio_generation',
        'video_extension',
        'storage_bytes',
        'export_render'
    )),
    quantity INTEGER NOT NULL DEFAULT 1,
    model_used TEXT,
    project_id TEXT,
    asset_id TEXT,
    billing_period TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_type ON usage_records(usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(billing_period);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_period ON usage_records(user_id, billing_period);

CREATE TABLE IF NOT EXISTS tier_quotas (
    id TEXT PRIMARY KEY,
    tier TEXT NOT NULL,
    usage_type TEXT NOT NULL,
    monthly_limit INTEGER NOT NULL,
    overage_allowed INTEGER DEFAULT 0,
    overage_price_cents INTEGER,
    UNIQUE(tier, usage_type)
);

-- Insert default quotas
INSERT OR IGNORE INTO tier_quotas (id, tier, usage_type, monthly_limit, overage_allowed) VALUES
    ('q1', 'free', 'ai_image_generation', 50, 0),
    ('q2', 'free', 'ai_video_generation', 5, 0),
    ('q3', 'free', 'ai_text_generation', 100, 0),
    ('q4', 'free', 'storage_bytes', 1073741824, 0),
    ('q5', 'free', 'export_render', 20, 0),
    ('q6', 'pro', 'ai_image_generation', 500, 1),
    ('q7', 'pro', 'ai_video_generation', 50, 1),
    ('q8', 'pro', 'ai_text_generation', 1000, 1),
    ('q9', 'pro', 'storage_bytes', 53687091200, 1),
    ('q10', 'pro', 'export_render', -1, 0),
    ('q11', 'team', 'ai_image_generation', 2000, 1),
    ('q12', 'team', 'ai_video_generation', 200, 1),
    ('q13', 'team', 'ai_text_generation', 5000, 1),
    ('q14', 'team', 'storage_bytes', 214748364800, 1),
    ('q15', 'team', 'export_render', -1, 0),
    ('q16', 'enterprise', 'ai_image_generation', -1, 0),
    ('q17', 'enterprise', 'ai_video_generation', -1, 0),
    ('q18', 'enterprise', 'ai_text_generation', -1, 0),
    ('q19', 'enterprise', 'storage_bytes', -1, 0),
    ('q20', 'enterprise', 'export_render', -1, 0);

-- ============================================
-- AI CHAT / ASSISTANT
-- ============================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT,
    project_id TEXT,
    title TEXT,
    context_type TEXT CHECK (context_type IN ('general', 'project', 'brand', 'campaign')),
    context_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project ON chat_sessions(project_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    generated_asset_ids_json TEXT,
    tokens_used INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- ============================================
-- ACTIVITY & AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    workspace_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details_json TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_workspace ON activity_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);

-- ============================================
-- Add foreign key for users.default_workspace_id after workspaces table exists
-- ============================================
-- Note: SQLite does not support ALTER TABLE ADD CONSTRAINT for foreign keys
-- The relationship is enforced at application level
