# Lumina Studio Backend Architecture

## Overview

This document defines the complete backend architecture for Lumina Studio, an AI-powered creative suite. The architecture leverages Cloudflare's edge infrastructure for low-latency, globally distributed services.

**Tech Stack:**
- **Hosting:** Cloudflare Pages (Landing + SPA)
- **API:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (Assets)
- **Auth:** Clerk
- **Domain:** lumina-os.com

---

## 1. Service Architecture

```
                                    +------------------+
                                    |   lumina-os.com  |
                                    | (Cloudflare DNS) |
                                    +--------+---------+
                                             |
              +------------------------------+------------------------------+
              |                              |                              |
    +---------v----------+      +------------v-----------+      +-----------v-----------+
    |  Cloudflare Pages  |      |   Cloudflare Workers   |      |   Cloudflare Workers  |
    |   (Landing + SPA)  |      |     (API Gateway)      |      |    (AI Processing)    |
    |   app.lumina-os.com|      |   api.lumina-os.com    |      |   ai.lumina-os.com    |
    +--------------------+      +------------+-----------+      +-----------+-----------+
                                             |                              |
              +------------------------------+------------------------------+
              |                              |                              |
    +---------v----------+      +------------v-----------+      +-----------v-----------+
    |   Clerk Auth       |      |    Cloudflare D1       |      |    Cloudflare R2      |
    | (User Management)  |      |     (Database)         |      |   (Asset Storage)     |
    +--------------------+      +------------------------+      +-----------------------+
```

---

## 2. Cloudflare D1 Database Schema

### 2.1 Core Tables

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Users table (synced from Clerk via webhooks)
CREATE TABLE users (
    id TEXT PRIMARY KEY,                          -- Clerk user ID (e.g., 'user_2abc123')
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,

    -- Subscription & Tier
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
    subscription_id TEXT,                         -- LemonSqueezy/Stripe subscription ID
    subscription_expires_at INTEGER,              -- Unix timestamp

    -- Preferences
    theme_color TEXT DEFAULT 'indigo',
    default_workspace_id TEXT,

    -- Metadata
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_login_at INTEGER,

    FOREIGN KEY (default_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);

-- ============================================
-- WORKSPACES & PROJECTS
-- ============================================

-- Workspaces (Team/Org level containers)
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,                    -- URL-friendly name
    owner_id TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,

    -- Settings
    default_brand_kit_id TEXT,
    settings_json TEXT,                           -- JSON blob for workspace settings

    -- Metadata
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);

-- Workspace Members (for collaboration)
CREATE TABLE workspace_members (
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

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- Projects (Individual creative projects)
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    project_type TEXT NOT NULL CHECK (project_type IN ('design', 'video', 'document', 'brand', 'campaign')),

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'archived')),
    is_template INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 0,

    -- Thumbnail
    thumbnail_url TEXT,
    thumbnail_asset_id TEXT,

    -- Version Control
    current_version INTEGER DEFAULT 1,

    -- Metadata
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_opened_at INTEGER,

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (thumbnail_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_type ON projects(project_type);
CREATE INDEX idx_projects_status ON projects(status);

-- Project Versions (for version history)
CREATE TABLE project_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,

    -- Snapshot of project state
    state_json TEXT NOT NULL,                     -- Full project state as JSON

    -- Change metadata
    changed_by TEXT NOT NULL,
    change_summary TEXT,

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    UNIQUE(project_id, version_number),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_project_versions_project ON project_versions(project_id);

-- ============================================
-- ASSETS & STORAGE
-- ============================================

-- Assets (Files stored in R2)
CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,

    -- File information
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,                   -- Bytes

    -- Asset type categorization
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', 'document', 'font', 'model3d', 'other')),

    -- R2 storage path
    storage_key TEXT NOT NULL UNIQUE,             -- R2 object key
    cdn_url TEXT,                                 -- Public CDN URL if enabled

    -- Processing status
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),

    -- AI-generated metadata
    is_ai_generated INTEGER DEFAULT 0,
    generation_prompt TEXT,
    generation_model TEXT,

    -- Image/Video specific
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,                        -- For video/audio

    -- Tags and search
    tags_json TEXT,                               -- JSON array of tags
    description TEXT,
    alt_text TEXT,

    -- Color analysis (for images)
    dominant_colors_json TEXT,                    -- JSON array of hex colors

    -- Metadata
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_assets_workspace ON assets(workspace_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_uploaded_by ON assets(uploaded_by);
CREATE INDEX idx_assets_processing_status ON assets(processing_status);

-- Asset Versions (for edited versions)
CREATE TABLE asset_versions (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,

    storage_key TEXT NOT NULL,
    file_size INTEGER NOT NULL,

    -- Edit metadata
    edit_operations_json TEXT,                    -- JSON describing edits applied
    created_by TEXT NOT NULL,

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    UNIQUE(asset_id, version_number),
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_asset_versions_asset ON asset_versions(asset_id);

-- Asset Usage (tracks where assets are used)
CREATE TABLE asset_usage (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    element_id TEXT,                              -- ID within project state

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_asset_usage_asset ON asset_usage(asset_id);
CREATE INDEX idx_asset_usage_project ON asset_usage(project_id);

-- ============================================
-- BRAND KITS
-- ============================================

CREATE TABLE brand_kits (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    created_by TEXT NOT NULL,

    name TEXT NOT NULL,
    description TEXT,

    -- Brand personality for AI
    personality TEXT,                             -- Brand voice description
    tone_keywords_json TEXT,                      -- JSON array of tone keywords

    -- Visual identity
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    colors_json TEXT,                             -- Full palette as JSON array

    -- Typography
    heading_font TEXT,
    body_font TEXT,
    fonts_json TEXT,                              -- Full font stack as JSON

    -- Logos
    logo_primary_asset_id TEXT,
    logo_dark_asset_id TEXT,
    logo_icon_asset_id TEXT,

    -- Guidelines document
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

CREATE INDEX idx_brand_kits_workspace ON brand_kits(workspace_id);

-- ============================================
-- MARKETING CAMPAIGNS
-- ============================================

CREATE TABLE campaigns (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    brand_kit_id TEXT,

    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,

    -- Campaign timeline
    start_date INTEGER,
    end_date INTEGER,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),

    -- Target platforms
    platforms_json TEXT,                          -- JSON array: ['instagram', 'linkedin', 'tiktok', 'twitter']

    -- AI-generated content settings
    target_audience TEXT,
    content_themes_json TEXT,

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_kit_id) REFERENCES brand_kits(id) ON DELETE SET NULL
);

CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Campaign Posts (individual content pieces)
CREATE TABLE campaign_posts (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,

    platform TEXT NOT NULL,

    -- Content
    headline TEXT,
    body TEXT,
    hashtags_json TEXT,                           -- JSON array

    -- Assets
    media_asset_ids_json TEXT,                    -- JSON array of asset IDs

    -- Scheduling
    scheduled_at INTEGER,
    published_at INTEGER,

    -- AI generation info
    is_ai_generated INTEGER DEFAULT 0,
    generation_prompt TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'bold', 'professional')),

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX idx_campaign_posts_campaign ON campaign_posts(campaign_id);
CREATE INDEX idx_campaign_posts_platform ON campaign_posts(platform);
CREATE INDEX idx_campaign_posts_status ON campaign_posts(status);
CREATE INDEX idx_campaign_posts_scheduled ON campaign_posts(scheduled_at);

-- ============================================
-- VIDEO PROJECTS (Storyboards)
-- ============================================

CREATE TABLE storyboards (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

    title TEXT NOT NULL,
    master_concept TEXT,

    aspect_ratio TEXT DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:3', '3:2')),

    -- Audio
    audio_track_id TEXT,
    audio_prompt TEXT,

    -- Metadata
    total_duration_seconds REAL,

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_storyboards_project ON storyboards(project_id);

CREATE TABLE storyboard_shots (
    id TEXT PRIMARY KEY,
    storyboard_id TEXT NOT NULL,
    position INTEGER NOT NULL,                    -- Order in timeline

    -- Shot description
    prompt TEXT NOT NULL,
    camera TEXT,
    lighting TEXT,
    lens_type TEXT,
    motion_description TEXT,
    cinematic_detail TEXT,
    motion_score INTEGER,

    -- Duration
    duration_seconds REAL DEFAULT 5,

    -- Generation
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'extending', 'error')),
    video_asset_id TEXT,
    thumbnail_asset_id TEXT,

    -- Transition to next shot
    transition_type TEXT DEFAULT 'cut' CHECK (transition_type IN ('cut', 'crossfade', 'glitch', 'dissolve', 'zoom', 'slide')),
    transition_intensity INTEGER DEFAULT 5,
    transition_duration_seconds REAL DEFAULT 1.0,

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
    FOREIGN KEY (video_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    FOREIGN KEY (thumbnail_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_storyboard_shots_storyboard ON storyboard_shots(storyboard_id);
CREATE INDEX idx_storyboard_shots_position ON storyboard_shots(storyboard_id, position);

-- ============================================
-- DESIGN PROJECTS (Canvas)
-- ============================================

CREATE TABLE canvas_projects (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

    -- Canvas dimensions
    width INTEGER NOT NULL DEFAULT 500,
    height INTEGER NOT NULL DEFAULT 700,

    -- Background
    background_color TEXT,
    background_asset_id TEXT,

    -- Elements state (stored as JSON for flexibility)
    elements_json TEXT NOT NULL DEFAULT '[]',

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (background_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_canvas_projects_project ON canvas_projects(project_id);

-- ============================================
-- USAGE TRACKING & QUOTAS
-- ============================================

CREATE TABLE usage_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT,

    -- Usage type
    usage_type TEXT NOT NULL CHECK (usage_type IN (
        'ai_image_generation',
        'ai_video_generation',
        'ai_text_generation',
        'ai_audio_generation',
        'video_extension',
        'storage_bytes',
        'export_render'
    )),

    -- Quantification
    quantity INTEGER NOT NULL DEFAULT 1,          -- Count or bytes

    -- Context
    model_used TEXT,
    project_id TEXT,
    asset_id TEXT,

    -- Billing period (for quota tracking)
    billing_period TEXT,                          -- Format: 'YYYY-MM'

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX idx_usage_records_user ON usage_records(user_id);
CREATE INDEX idx_usage_records_type ON usage_records(usage_type);
CREATE INDEX idx_usage_records_period ON usage_records(billing_period);
CREATE INDEX idx_usage_records_user_period ON usage_records(user_id, billing_period);

-- Quota definitions per tier
CREATE TABLE tier_quotas (
    id TEXT PRIMARY KEY,
    tier TEXT NOT NULL,
    usage_type TEXT NOT NULL,

    monthly_limit INTEGER NOT NULL,               -- -1 for unlimited
    overage_allowed INTEGER DEFAULT 0,
    overage_price_cents INTEGER,                  -- Per unit overage cost

    UNIQUE(tier, usage_type)
);

-- Insert default quotas
INSERT INTO tier_quotas (id, tier, usage_type, monthly_limit, overage_allowed) VALUES
    ('q1', 'free', 'ai_image_generation', 50, 0),
    ('q2', 'free', 'ai_video_generation', 5, 0),
    ('q3', 'free', 'ai_text_generation', 100, 0),
    ('q4', 'free', 'storage_bytes', 1073741824, 0),  -- 1GB
    ('q5', 'free', 'export_render', 20, 0),

    ('q6', 'pro', 'ai_image_generation', 500, 1),
    ('q7', 'pro', 'ai_video_generation', 50, 1),
    ('q8', 'pro', 'ai_text_generation', 1000, 1),
    ('q9', 'pro', 'storage_bytes', 53687091200, 1),  -- 50GB
    ('q10', 'pro', 'export_render', -1, 0),           -- Unlimited

    ('q11', 'team', 'ai_image_generation', 2000, 1),
    ('q12', 'team', 'ai_video_generation', 200, 1),
    ('q13', 'team', 'ai_text_generation', 5000, 1),
    ('q14', 'team', 'storage_bytes', 214748364800, 1), -- 200GB
    ('q15', 'team', 'export_render', -1, 0),

    ('q16', 'enterprise', 'ai_image_generation', -1, 0),
    ('q17', 'enterprise', 'ai_video_generation', -1, 0),
    ('q18', 'enterprise', 'ai_text_generation', -1, 0),
    ('q19', 'enterprise', 'storage_bytes', -1, 0),
    ('q20', 'enterprise', 'export_render', -1, 0);

-- ============================================
-- AI CHAT / ASSISTANT
-- ============================================

CREATE TABLE chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT,
    project_id TEXT,

    title TEXT,

    -- Context for AI
    context_type TEXT CHECK (context_type IN ('general', 'project', 'brand', 'campaign')),
    context_id TEXT,                              -- ID of related entity

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_project ON chat_sessions(project_id);

CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,

    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- If message generated content
    generated_asset_ids_json TEXT,

    -- Token usage
    tokens_used INTEGER,

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- ============================================
-- ACTIVITY & AUDIT LOG
-- ============================================

CREATE TABLE activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    workspace_id TEXT,

    action TEXT NOT NULL,                         -- 'create', 'update', 'delete', 'share', 'export', etc.
    entity_type TEXT NOT NULL,                    -- 'project', 'asset', 'campaign', etc.
    entity_id TEXT,

    details_json TEXT,                            -- Additional action details

    ip_address TEXT,
    user_agent TEXT,

    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_workspace ON activity_log(workspace_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);
```

---

## 3. Cloudflare R2 Bucket Structure

### 3.1 Bucket Organization

```
lumina-studio-assets/
|
+-- workspaces/
|   +-- {workspace_id}/
|       +-- assets/
|       |   +-- images/
|       |   |   +-- {asset_id}.{ext}
|       |   |   +-- {asset_id}_thumb.webp
|       |   |   +-- {asset_id}_preview.webp
|       |   +-- videos/
|       |   |   +-- {asset_id}.mp4
|       |   |   +-- {asset_id}_thumb.jpg
|       |   |   +-- {asset_id}_preview.webp
|       |   +-- audio/
|       |   |   +-- {asset_id}.mp3
|       |   |   +-- {asset_id}_waveform.png
|       |   +-- documents/
|       |   |   +-- {asset_id}.pdf
|       |   |   +-- {asset_id}_thumb.png
|       |   +-- fonts/
|       |   |   +-- {font_id}.woff2
|       |   +-- models/
|       |       +-- {model_id}.glb
|       |
|       +-- brand-kits/
|       |   +-- {brand_kit_id}/
|       |       +-- logo_primary.svg
|       |       +-- logo_dark.svg
|       |       +-- logo_icon.svg
|       |       +-- guidelines.pdf
|       |
|       +-- exports/
|           +-- {project_id}/
|               +-- {export_id}.{format}
|
+-- ai-generated/
|   +-- images/
|   |   +-- {date}/
|   |       +-- {generation_id}.png
|   +-- videos/
|       +-- {date}/
|           +-- {generation_id}.mp4
|
+-- temp/
|   +-- uploads/
|       +-- {upload_token}/
|           +-- chunk_{n}
|
+-- public/
    +-- templates/
    |   +-- {template_id}/
    |       +-- preview.png
    |       +-- thumbnail.webp
    +-- stock/
        +-- audio/
            +-- {track_id}.mp3
```

### 3.2 Storage Key Conventions

```
Pattern: {category}/{workspace_id}/{type}/{asset_id}[_{variant}].{ext}

Examples:
- workspaces/ws_abc123/assets/images/ast_xyz789.png
- workspaces/ws_abc123/assets/images/ast_xyz789_thumb.webp
- workspaces/ws_abc123/assets/videos/ast_def456.mp4
- ai-generated/images/2025-01-15/gen_qrs012.png
- temp/uploads/upl_tok123/chunk_0
```

### 3.3 R2 Bucket Configuration

```typescript
// wrangler.toml configuration
[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "lumina-studio-assets"
preview_bucket_name = "lumina-studio-assets-preview"

// CORS configuration (via R2 API)
const corsRules = [
  {
    AllowedOrigins: ["https://app.lumina-os.com", "https://lumina-os.com"],
    AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag", "Content-Length"],
    MaxAgeSeconds: 3600
  }
];
```

---

## 4. API Endpoint Specification

### 4.1 Base Configuration

```
Base URL: https://api.lumina-os.com/v1
Content-Type: application/json
Authentication: Bearer token (Clerk JWT)
```

### 4.2 Authentication Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/webhook` | Clerk Signature | Clerk webhook handler |
| GET | `/auth/me` | Required | Get current user profile |
| PATCH | `/auth/me` | Required | Update user profile |
| GET | `/auth/quota` | Required | Get usage quota status |

### 4.3 Workspace Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/workspaces` | Required | List user's workspaces |
| POST | `/workspaces` | Required | Create new workspace |
| GET | `/workspaces/:id` | Required | Get workspace details |
| PATCH | `/workspaces/:id` | Required | Update workspace |
| DELETE | `/workspaces/:id` | Owner | Delete workspace |
| GET | `/workspaces/:id/members` | Required | List workspace members |
| POST | `/workspaces/:id/members` | Admin+ | Invite member |
| PATCH | `/workspaces/:id/members/:userId` | Admin+ | Update member role |
| DELETE | `/workspaces/:id/members/:userId` | Admin+ | Remove member |

### 4.4 Project Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/workspaces/:wsId/projects` | Required | List projects |
| POST | `/workspaces/:wsId/projects` | Required | Create project |
| GET | `/projects/:id` | Required | Get project details |
| PATCH | `/projects/:id` | Editor+ | Update project |
| DELETE | `/projects/:id` | Owner | Delete project |
| GET | `/projects/:id/versions` | Required | List project versions |
| POST | `/projects/:id/versions` | Editor+ | Create version snapshot |
| GET | `/projects/:id/versions/:version` | Required | Get specific version |
| POST | `/projects/:id/restore/:version` | Editor+ | Restore to version |

### 4.5 Asset Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/workspaces/:wsId/assets` | Required | List assets |
| POST | `/workspaces/:wsId/assets/upload` | Required | Get upload URL |
| POST | `/workspaces/:wsId/assets/upload/complete` | Required | Complete upload |
| GET | `/assets/:id` | Required | Get asset details |
| PATCH | `/assets/:id` | Editor+ | Update asset metadata |
| DELETE | `/assets/:id` | Editor+ | Delete asset |
| GET | `/assets/:id/download` | Required | Get download URL |
| POST | `/assets/:id/duplicate` | Required | Duplicate asset |

### 4.6 Brand Kit Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/workspaces/:wsId/brand-kits` | Required | List brand kits |
| POST | `/workspaces/:wsId/brand-kits` | Editor+ | Create brand kit |
| GET | `/brand-kits/:id` | Required | Get brand kit |
| PATCH | `/brand-kits/:id` | Editor+ | Update brand kit |
| DELETE | `/brand-kits/:id` | Admin+ | Delete brand kit |
| POST | `/brand-kits/:id/generate-guide` | Editor+ | AI generate style guide |

### 4.7 Campaign Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/workspaces/:wsId/campaigns` | Required | List campaigns |
| POST | `/workspaces/:wsId/campaigns` | Editor+ | Create campaign |
| GET | `/campaigns/:id` | Required | Get campaign |
| PATCH | `/campaigns/:id` | Editor+ | Update campaign |
| DELETE | `/campaigns/:id` | Admin+ | Delete campaign |
| GET | `/campaigns/:id/posts` | Required | List campaign posts |
| POST | `/campaigns/:id/posts` | Editor+ | Create post |
| PATCH | `/campaigns/:id/posts/:postId` | Editor+ | Update post |
| DELETE | `/campaigns/:id/posts/:postId` | Editor+ | Delete post |
| POST | `/campaigns/:id/generate` | Editor+ | AI generate campaign content |

### 4.8 AI Generation Endpoints

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/ai/generate/image` | Required | Tier-based | Generate image |
| POST | `/ai/generate/video` | Required | Tier-based | Generate video |
| POST | `/ai/generate/video/extend` | Required | Tier-based | Extend video |
| GET | `/ai/generate/video/:operationId` | Required | - | Poll video status |
| POST | `/ai/generate/text` | Required | Tier-based | Generate text/copy |
| POST | `/ai/generate/storyboard` | Required | Tier-based | Generate storyboard |
| POST | `/ai/generate/background` | Required | Tier-based | Generate background |
| POST | `/ai/analyze/image` | Required | Tier-based | Analyze image |
| POST | `/ai/analyze/video` | Required | Tier-based | Analyze video |
| POST | `/ai/suggest/tags` | Required | Tier-based | Suggest asset tags |

### 4.9 Chat/Assistant Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/chat/sessions` | Required | List chat sessions |
| POST | `/chat/sessions` | Required | Create session |
| GET | `/chat/sessions/:id` | Required | Get session with messages |
| DELETE | `/chat/sessions/:id` | Required | Delete session |
| POST | `/chat/sessions/:id/messages` | Required | Send message |
| POST | `/chat/sessions/:id/messages/stream` | Required | Stream response |

### 4.10 Export Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/projects/:id/export` | Editor+ | Start export |
| GET | `/exports/:id` | Required | Get export status |
| GET | `/exports/:id/download` | Required | Download export |

---

## 5. Clerk Integration

### 5.1 Webhook Events to Handle

```typescript
// Clerk webhook payload types
type ClerkWebhookEvent =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'session.created'
  | 'session.ended'
  | 'organization.created'
  | 'organization.updated'
  | 'organization.deleted'
  | 'organizationMembership.created'
  | 'organizationMembership.updated'
  | 'organizationMembership.deleted';
```

### 5.2 Webhook Handler Implementation

```typescript
// src/routes/auth/webhook.ts

import { Hono } from 'hono';
import { Webhook } from 'svix';

const app = new Hono<{ Bindings: Env }>();

app.post('/webhook', async (c) => {
  const CLERK_WEBHOOK_SECRET = c.env.CLERK_WEBHOOK_SECRET;

  // Verify webhook signature
  const svix_id = c.req.header('svix-id');
  const svix_timestamp = c.req.header('svix-timestamp');
  const svix_signature = c.req.header('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.json({ error: 'Missing svix headers' }, 400);
  }

  const body = await c.req.text();
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let payload: any;
  try {
    payload = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const { type, data } = payload;

  switch (type) {
    case 'user.created':
      await handleUserCreated(c.env.DB, data);
      break;
    case 'user.updated':
      await handleUserUpdated(c.env.DB, data);
      break;
    case 'user.deleted':
      await handleUserDeleted(c.env.DB, data);
      break;
    // ... handle other events
  }

  return c.json({ received: true });
});

async function handleUserCreated(db: D1Database, data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data;

  const email = email_addresses.find((e: any) => e.id === data.primary_email_address_id)?.email_address;
  const displayName = [first_name, last_name].filter(Boolean).join(' ') || email?.split('@')[0];

  // Create user record
  await db.prepare(`
    INSERT INTO users (id, email, display_name, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
  `).bind(id, email, displayName, image_url).run();

  // Create default personal workspace
  const workspaceId = `ws_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

  await db.prepare(`
    INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
  `).bind(workspaceId, 'Personal Workspace', `personal-${id.substring(5, 13)}`, id).run();

  // Add user as workspace owner
  await db.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
    VALUES (?, ?, ?, 'owner', strftime('%s', 'now'))
  `).bind(`wm_${crypto.randomUUID().substring(0, 16)}`, workspaceId, id).run();

  // Set default workspace
  await db.prepare(`
    UPDATE users SET default_workspace_id = ? WHERE id = ?
  `).bind(workspaceId, id).run();
}

async function handleUserUpdated(db: D1Database, data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data;

  const email = email_addresses.find((e: any) => e.id === data.primary_email_address_id)?.email_address;
  const displayName = [first_name, last_name].filter(Boolean).join(' ');

  await db.prepare(`
    UPDATE users
    SET email = ?, display_name = ?, avatar_url = ?, updated_at = strftime('%s', 'now')
    WHERE id = ?
  `).bind(email, displayName, image_url, id).run();
}

async function handleUserDeleted(db: D1Database, data: any) {
  const { id } = data;

  // Soft delete or cascade - handled by FK constraints
  await db.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
}

export default app;
```

### 5.3 JWT Verification Middleware

```typescript
// src/middleware/auth.ts

import { Context, Next } from 'hono';
import { createClerkClient } from '@clerk/backend';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
    const payload = await clerk.verifyToken(token);

    // Attach user to context
    c.set('userId', payload.sub);
    c.set('sessionId', payload.sid);

    return next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

// Role-based access control
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    const workspaceId = c.req.param('wsId') || c.req.param('workspaceId');

    if (!workspaceId) {
      return next(); // No workspace context
    }

    const member = await c.env.DB.prepare(`
      SELECT role FROM workspace_members
      WHERE workspace_id = ? AND user_id = ?
    `).bind(workspaceId, userId).first();

    if (!member || !roles.includes(member.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    c.set('userRole', member.role);
    return next();
  };
}
```

---

## 6. Rate Limiting Strategy

### 6.1 Rate Limit Configuration

```typescript
// src/middleware/rateLimit.ts

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix: string;     // KV key prefix
}

const RATE_LIMITS: Record<string, Record<string, RateLimitConfig>> = {
  free: {
    'ai_image': { windowMs: 60000, maxRequests: 5, keyPrefix: 'rl:img' },
    'ai_video': { windowMs: 3600000, maxRequests: 2, keyPrefix: 'rl:vid' },
    'ai_text': { windowMs: 60000, maxRequests: 10, keyPrefix: 'rl:txt' },
    'api_general': { windowMs: 60000, maxRequests: 100, keyPrefix: 'rl:api' },
    'upload': { windowMs: 60000, maxRequests: 10, keyPrefix: 'rl:upl' },
  },
  pro: {
    'ai_image': { windowMs: 60000, maxRequests: 20, keyPrefix: 'rl:img' },
    'ai_video': { windowMs: 3600000, maxRequests: 10, keyPrefix: 'rl:vid' },
    'ai_text': { windowMs: 60000, maxRequests: 50, keyPrefix: 'rl:txt' },
    'api_general': { windowMs: 60000, maxRequests: 500, keyPrefix: 'rl:api' },
    'upload': { windowMs: 60000, maxRequests: 50, keyPrefix: 'rl:upl' },
  },
  team: {
    'ai_image': { windowMs: 60000, maxRequests: 50, keyPrefix: 'rl:img' },
    'ai_video': { windowMs: 3600000, maxRequests: 30, keyPrefix: 'rl:vid' },
    'ai_text': { windowMs: 60000, maxRequests: 100, keyPrefix: 'rl:txt' },
    'api_general': { windowMs: 60000, maxRequests: 1000, keyPrefix: 'rl:api' },
    'upload': { windowMs: 60000, maxRequests: 100, keyPrefix: 'rl:upl' },
  },
  enterprise: {
    'ai_image': { windowMs: 60000, maxRequests: 200, keyPrefix: 'rl:img' },
    'ai_video': { windowMs: 3600000, maxRequests: 100, keyPrefix: 'rl:vid' },
    'ai_text': { windowMs: 60000, maxRequests: 500, keyPrefix: 'rl:txt' },
    'api_general': { windowMs: 60000, maxRequests: 5000, keyPrefix: 'rl:api' },
    'upload': { windowMs: 60000, maxRequests: 500, keyPrefix: 'rl:upl' },
  },
};
```

### 6.2 Rate Limit Middleware

```typescript
// Using Cloudflare's built-in rate limiting (recommended) or KV-based

import { Context, Next } from 'hono';

export function rateLimit(limitType: string) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');

    // Get user tier
    const user = await c.env.DB.prepare(
      'SELECT tier FROM users WHERE id = ?'
    ).bind(userId).first();

    const tier = user?.tier || 'free';
    const config = RATE_LIMITS[tier]?.[limitType] || RATE_LIMITS.free.api_general;

    const key = `${config.keyPrefix}:${userId}`;
    const windowStart = Math.floor(Date.now() / config.windowMs);
    const kvKey = `${key}:${windowStart}`;

    // Get current count from KV
    const currentCount = parseInt(await c.env.RATE_LIMIT_KV.get(kvKey) || '0');

    if (currentCount >= config.maxRequests) {
      return c.json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((windowStart + 1) * config.windowMs / 1000 - Date.now() / 1000),
        limit: config.maxRequests,
        remaining: 0,
      }, 429);
    }

    // Increment counter
    await c.env.RATE_LIMIT_KV.put(kvKey, String(currentCount + 1), {
      expirationTtl: Math.ceil(config.windowMs / 1000) + 60
    });

    // Add rate limit headers
    c.header('X-RateLimit-Limit', String(config.maxRequests));
    c.header('X-RateLimit-Remaining', String(config.maxRequests - currentCount - 1));
    c.header('X-RateLimit-Reset', String(Math.ceil((windowStart + 1) * config.windowMs / 1000)));

    return next();
  };
}
```

### 6.3 Cloudflare Rate Limiting Rules (Alternative)

```toml
# In wrangler.toml - using Cloudflare's built-in rate limiting

[[rate_limiting]]
simple = { limit = 100, period = 60 }  # 100 req/min default

# Custom rules via Cloudflare dashboard or API:
# - Free tier AI: 5 req/min for /ai/generate/*
# - Pro tier AI: 20 req/min for /ai/generate/*
# - Team tier AI: 50 req/min for /ai/generate/*
```

---

## 7. Pricing Tier Structure

### 7.1 Tier Comparison

| Feature | Free | Pro ($19/mo) | Team ($49/mo) | Enterprise |
|---------|------|--------------|---------------|------------|
| **AI Image Generation** | 50/month | 500/month | 2000/month | Unlimited |
| **AI Video Generation** | 5/month | 50/month | 200/month | Unlimited |
| **AI Text Generation** | 100/month | 1000/month | 5000/month | Unlimited |
| **Video Extensions** | 0 | 10/month | 50/month | Unlimited |
| **Storage** | 1 GB | 50 GB | 200 GB | Custom |
| **Projects** | 5 | Unlimited | Unlimited | Unlimited |
| **Export Quality** | Standard | 4K | 8K | 8K+ |
| **Brand Kits** | 1 | 5 | 20 | Unlimited |
| **Team Members** | 1 | 1 | 10 | Custom |
| **Priority Support** | No | Email | Chat + Email | Dedicated |
| **API Access** | No | No | Yes | Yes |
| **Custom Integrations** | No | No | No | Yes |
| **SSO/SAML** | No | No | No | Yes |

### 7.2 Overage Pricing (Pro & Team)

| Feature | Pro Overage | Team Overage |
|---------|-------------|--------------|
| AI Image | $0.02/image | $0.015/image |
| AI Video (5s) | $0.50/video | $0.40/video |
| AI Text (1k tokens) | $0.005/req | $0.003/req |
| Storage | $0.02/GB/mo | $0.015/GB/mo |

---

## 8. Worker Implementation Structure

### 8.1 Project Structure

```
lumina-studio-api/
|
+-- src/
|   +-- index.ts                 # Main entry point
|   +-- routes/
|   |   +-- auth/
|   |   |   +-- webhook.ts       # Clerk webhooks
|   |   |   +-- me.ts            # User profile
|   |   +-- workspaces/
|   |   |   +-- index.ts         # Workspace CRUD
|   |   |   +-- members.ts       # Member management
|   |   +-- projects/
|   |   |   +-- index.ts         # Project CRUD
|   |   |   +-- versions.ts      # Version control
|   |   +-- assets/
|   |   |   +-- index.ts         # Asset CRUD
|   |   |   +-- upload.ts        # Upload handling
|   |   +-- ai/
|   |   |   +-- generate.ts      # AI generation
|   |   |   +-- analyze.ts       # AI analysis
|   |   +-- brand-kits/
|   |   +-- campaigns/
|   |   +-- chat/
|   |   +-- exports/
|   +-- middleware/
|   |   +-- auth.ts              # JWT verification
|   |   +-- rateLimit.ts         # Rate limiting
|   |   +-- cors.ts              # CORS handling
|   |   +-- logging.ts           # Request logging
|   +-- services/
|   |   +-- ai/
|   |   |   +-- imageGen.ts      # Image generation
|   |   |   +-- videoGen.ts      # Video generation
|   |   |   +-- textGen.ts       # Text generation
|   |   +-- storage.ts           # R2 operations
|   |   +-- quota.ts             # Usage tracking
|   |   +-- email.ts             # Email service
|   +-- utils/
|   |   +-- id.ts                # ID generation
|   |   +-- validation.ts        # Input validation
|   |   +-- errors.ts            # Error handling
|   +-- types/
|       +-- env.d.ts             # Environment types
|       +-- models.ts            # Data models
|
+-- wrangler.toml                # Worker configuration
+-- package.json
+-- tsconfig.json
```

### 8.2 Main Entry Point

```typescript
// src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import projectRoutes from './routes/projects';
import assetRoutes from './routes/assets';
import aiRoutes from './routes/ai';
import brandKitRoutes from './routes/brand-kits';
import campaignRoutes from './routes/campaigns';
import chatRoutes from './routes/chat';
import exportRoutes from './routes/exports';

type Bindings = {
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  RATE_LIMIT_KV: KVNamespace;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  AI_GATEWAY_URL: string;
  // ... other bindings
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://app.lumina-os.com', 'https://lumina-os.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// Public routes
app.route('/v1/auth', authRoutes);

// Protected routes
app.use('/v1/*', authMiddleware);
app.route('/v1/workspaces', workspaceRoutes);
app.route('/v1/projects', projectRoutes);
app.route('/v1/assets', assetRoutes);
app.route('/v1/ai', aiRoutes);
app.route('/v1/brand-kits', brandKitRoutes);
app.route('/v1/campaigns', campaignRoutes);
app.route('/v1/chat', chatRoutes);
app.route('/v1/exports', exportRoutes);

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: 'Internal server error',
    message: err.message,
    requestId: c.req.header('cf-ray'),
  }, 500);
});

export default app;
```

### 8.3 Wrangler Configuration

```toml
# wrangler.toml

name = "lumina-studio-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"

# Environment variables (non-secret)
[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "lumina-studio-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# R2 Bucket binding
[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "lumina-studio-assets"

# KV Namespace for rate limiting
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# AI Gateway binding (if using Cloudflare AI Gateway)
[[ai]]
binding = "AI"

# Routes
[routes]
pattern = "api.lumina-os.com/*"
zone_name = "lumina-os.com"

# Secrets (set via `wrangler secret put`)
# CLERK_SECRET_KEY
# CLERK_WEBHOOK_SECRET
# GOOGLE_AI_API_KEY (for Gemini)
```

---

## 9. Environment Variables & Secrets

### 9.1 Required Secrets

```bash
# Clerk Authentication
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_WEBHOOK_SECRET
wrangler secret put CLERK_PUBLISHABLE_KEY

# AI Services
wrangler secret put GOOGLE_AI_API_KEY          # Gemini API
wrangler secret put POLLINATIONS_API_KEY       # Image generation

# Payment (LemonSqueezy)
wrangler secret put LEMONSQUEEZY_API_KEY
wrangler secret put LEMONSQUEEZY_WEBHOOK_SECRET
wrangler secret put LEMONSQUEEZY_STORE_ID

# Optional
wrangler secret put SENTRY_DSN                 # Error tracking
wrangler secret put RESEND_API_KEY             # Email service
```

### 9.2 Environment Variables

```toml
[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"
ALLOWED_ORIGINS = "https://app.lumina-os.com,https://lumina-os.com"
MAX_UPLOAD_SIZE_MB = "100"
THUMBNAIL_SIZE = "400"
PREVIEW_SIZE = "1200"
```

---

## 10. Example API Requests/Responses

### 10.1 Create Project

**Request:**
```http
POST /v1/workspaces/ws_abc123/projects
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "name": "Summer Campaign 2025",
  "description": "Marketing materials for summer product launch",
  "project_type": "design"
}
```

**Response:**
```json
{
  "id": "prj_xyz789",
  "workspace_id": "ws_abc123",
  "owner_id": "user_2abc123",
  "name": "Summer Campaign 2025",
  "description": "Marketing materials for summer product launch",
  "project_type": "design",
  "status": "draft",
  "is_template": false,
  "is_public": false,
  "current_version": 1,
  "created_at": 1705334400,
  "updated_at": 1705334400
}
```

### 10.2 Generate AI Image

**Request:**
```http
POST /v1/ai/generate/image
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "prompt": "Modern minimalist product photography of a wireless speaker, soft shadows, white background, professional lighting",
  "style": "cinematic",
  "aspect_ratio": "1:1",
  "quality": "hd",
  "brand_kit_id": "bk_def456"
}
```

**Response:**
```json
{
  "id": "gen_abc123",
  "status": "completed",
  "asset": {
    "id": "ast_xyz789",
    "storage_key": "ai-generated/images/2025-01-15/gen_abc123.png",
    "cdn_url": "https://assets.lumina-os.com/ai-generated/images/2025-01-15/gen_abc123.png",
    "width": 1024,
    "height": 1024,
    "file_size": 1048576
  },
  "usage": {
    "type": "ai_image_generation",
    "remaining": 45,
    "limit": 50
  },
  "generation_time_ms": 3245
}
```

### 10.3 Upload Asset (Presigned URL Flow)

**Request 1: Get upload URL**
```http
POST /v1/workspaces/ws_abc123/assets/upload
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "filename": "hero-image.png",
  "mime_type": "image/png",
  "file_size": 5242880
}
```

**Response 1:**
```json
{
  "upload_id": "upl_abc123",
  "upload_url": "https://lumina-studio-assets.r2.cloudflarestorage.com/...",
  "expires_at": 1705338000,
  "asset_id": "ast_pending_xyz"
}
```

**Request 2: Complete upload**
```http
POST /v1/workspaces/ws_abc123/assets/upload/complete
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "upload_id": "upl_abc123",
  "tags": ["marketing", "hero"],
  "description": "Main hero image for landing page"
}
```

**Response 2:**
```json
{
  "id": "ast_xyz789",
  "workspace_id": "ws_abc123",
  "filename": "hero-image.png",
  "original_filename": "hero-image.png",
  "mime_type": "image/png",
  "file_size": 5242880,
  "asset_type": "image",
  "storage_key": "workspaces/ws_abc123/assets/images/ast_xyz789.png",
  "cdn_url": "https://assets.lumina-os.com/workspaces/ws_abc123/assets/images/ast_xyz789.png",
  "processing_status": "processing",
  "width": 2400,
  "height": 1600,
  "tags": ["marketing", "hero"],
  "description": "Main hero image for landing page",
  "created_at": 1705334400
}
```

### 10.4 Get Usage Quota

**Request:**
```http
GET /v1/auth/quota
Authorization: Bearer eyJ...
```

**Response:**
```json
{
  "tier": "pro",
  "billing_period": "2025-01",
  "subscription_status": "active",
  "subscription_expires_at": 1707955200,
  "usage": {
    "ai_image_generation": {
      "used": 123,
      "limit": 500,
      "remaining": 377,
      "overage_allowed": true
    },
    "ai_video_generation": {
      "used": 12,
      "limit": 50,
      "remaining": 38,
      "overage_allowed": true
    },
    "ai_text_generation": {
      "used": 456,
      "limit": 1000,
      "remaining": 544,
      "overage_allowed": true
    },
    "storage_bytes": {
      "used": 5368709120,
      "limit": 53687091200,
      "remaining": 48318382080,
      "used_formatted": "5.0 GB",
      "limit_formatted": "50.0 GB"
    }
  }
}
```

---

## 11. Scaling Considerations

### 11.1 Potential Bottlenecks

1. **AI Generation Queuing**
   - Video generation can take 30-120 seconds
   - Solution: Use Durable Objects or Queues for async processing

2. **Large File Uploads**
   - R2 has 5GB single object limit
   - Solution: Multipart uploads for files >100MB

3. **Database Read/Write Hotspots**
   - `usage_records` table with high write frequency
   - Solution: Batch writes, use Workers Analytics Engine for high-volume metrics

4. **Real-time Collaboration (Future)**
   - WebSocket connections for live updates
   - Solution: Durable Objects with WebSocket support

### 11.2 Performance Optimizations

```typescript
// Caching strategy for frequently accessed data
// Using Cache API for read-heavy endpoints

async function getCachedWorkspace(c: Context, workspaceId: string) {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache.lumina-os.com/workspace/${workspaceId}`);

  let response = await cache.match(cacheKey);
  if (response) {
    return response.json();
  }

  const workspace = await c.env.DB.prepare(
    'SELECT * FROM workspaces WHERE id = ?'
  ).bind(workspaceId).first();

  if (workspace) {
    response = new Response(JSON.stringify(workspace), {
      headers: { 'Cache-Control': 's-maxage=60' }
    });
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return workspace;
}
```

### 11.3 Database Optimization Recommendations

1. **Regular VACUUM** - Schedule periodic D1 maintenance
2. **Index Coverage** - All WHERE clauses have covering indexes
3. **Query Batching** - Combine related queries
4. **Pagination** - All list endpoints use cursor-based pagination

---

## 12. Security Checklist

- [ ] All endpoints require authentication except webhooks (signed)
- [ ] Webhook signatures verified (Clerk, LemonSqueezy)
- [ ] Rate limiting on all AI generation endpoints
- [ ] File upload validation (MIME type, size, extension)
- [ ] SQL injection prevention via parameterized queries
- [ ] CORS restricted to known origins
- [ ] Secrets stored in Cloudflare Secrets, never in code
- [ ] Audit logging for sensitive operations
- [ ] Input sanitization on all user-provided content
- [ ] R2 bucket not publicly accessible (CDN proxy only)

---

## 13. Deployment Commands

```bash
# Development
npm run dev                       # Local development with Miniflare

# Database migrations
wrangler d1 execute lumina-studio-db --local --file=./migrations/001_initial.sql
wrangler d1 execute lumina-studio-db --file=./migrations/001_initial.sql

# Deploy
wrangler deploy                   # Production deployment
wrangler deploy --env staging     # Staging deployment

# Secrets
wrangler secret put CLERK_SECRET_KEY
wrangler secret list

# Logs
wrangler tail                     # Real-time logs
wrangler tail --format=pretty     # Formatted logs
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-15 | Claude | Initial architecture design |
