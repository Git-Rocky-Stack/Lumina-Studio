-- =============================================
-- Smart Asset Library
-- AI-powered tagging, visual search, duplicate detection
-- =============================================

-- Asset Library
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID,

    -- File info
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    file_hash TEXT, -- For duplicate detection

    -- Dimensions (for images/videos)
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER, -- For video/audio

    -- Type categorization
    asset_type TEXT NOT NULL, -- 'image', 'video', 'audio', 'document', 'font', 'vector'
    format TEXT, -- 'jpg', 'png', 'svg', 'mp4', etc.

    -- AI-generated metadata
    ai_tags TEXT[] DEFAULT '{}',
    ai_description TEXT,
    ai_colors JSONB DEFAULT '[]', -- Dominant colors
    ai_objects JSONB DEFAULT '[]', -- Detected objects
    ai_text_content TEXT, -- OCR extracted text
    ai_embedding vector(1536), -- For visual similarity search
    ai_quality_score DECIMAL(3,2), -- 0-1 quality assessment
    ai_processed_at TIMESTAMPTZ,

    -- User-defined metadata
    user_tags TEXT[] DEFAULT '{}',
    title TEXT,
    description TEXT,
    alt_text TEXT,
    license_type TEXT,
    source_url TEXT,

    -- Organization
    folder_id UUID,
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Status
    upload_status TEXT DEFAULT 'processing', -- 'processing', 'ready', 'failed'
    processing_error TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Folders
CREATE TABLE IF NOT EXISTS asset_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES asset_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Duplicate Groups
CREATE TABLE IF NOT EXISTS asset_duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    similarity_threshold DECIMAL(3,2) DEFAULT 0.95,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_duplicate_members (
    duplicate_group_id UUID NOT NULL REFERENCES asset_duplicates(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    similarity_score DECIMAL(3,2) NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (duplicate_group_id, asset_id)
);

-- Asset Usage Tracking
CREATE TABLE IF NOT EXISTS asset_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    used_in_type TEXT NOT NULL, -- 'canvas', 'template', 'video', 'export'
    used_in_id UUID,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visual Search Queries (for analytics)
CREATE TABLE IF NOT EXISTS visual_search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_type TEXT NOT NULL, -- 'text', 'image', 'color', 'similar'
    query_data JSONB NOT NULL,
    results_count INTEGER DEFAULT 0,
    selected_asset_id UUID REFERENCES assets(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Asset Collections (locked assets for brand consistency)
CREATE TABLE IF NOT EXISTS brand_asset_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_locked BOOLEAN DEFAULT false, -- Locked collections can't be modified
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_asset_items (
    collection_id UUID NOT NULL REFERENCES brand_asset_collections(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    asset_role TEXT, -- 'logo', 'icon', 'background', 'pattern'
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, asset_id)
);

-- Indexes
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_folder ON assets(folder_id);
CREATE INDEX idx_assets_hash ON assets(file_hash);
CREATE INDEX idx_assets_created ON assets(created_at DESC);
CREATE INDEX idx_assets_ai_tags ON assets USING gin(ai_tags);
CREATE INDEX idx_assets_user_tags ON assets USING gin(user_tags);
CREATE INDEX idx_assets_search ON assets USING gin(to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(ai_description, '') || ' ' ||
    COALESCE(ai_text_content, '')
));

-- Vector similarity index (requires pgvector extension)
-- CREATE INDEX idx_assets_embedding ON assets USING ivfflat (ai_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_folders_user ON asset_folders(user_id);
CREATE INDEX idx_folders_parent ON asset_folders(parent_id);
CREATE INDEX idx_usage_asset ON asset_usage(asset_id);
CREATE INDEX idx_duplicates_user ON asset_duplicates(user_id);

-- RLS Policies
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_duplicate_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_asset_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_asset_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own assets"
    ON assets FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own folders"
    ON asset_folders FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own duplicates"
    ON asset_duplicates FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users view duplicate members"
    ON asset_duplicate_members FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM asset_duplicates
        WHERE id = duplicate_group_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users view own usage"
    ON asset_usage FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM assets
        WHERE id = asset_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users manage own search queries"
    ON visual_search_queries FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own brand collections"
    ON brand_asset_collections FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage brand items"
    ON brand_asset_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM brand_asset_collections
        WHERE id = collection_id AND user_id = auth.uid()
    ));

-- Function to find similar assets
CREATE OR REPLACE FUNCTION find_similar_assets(
    p_asset_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_threshold DECIMAL DEFAULT 0.8
)
RETURNS TABLE (
    asset_id UUID,
    similarity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        1 - (a.ai_embedding <=> (SELECT ai_embedding FROM assets WHERE id = p_asset_id))::DECIMAL as sim
    FROM assets a
    WHERE a.id != p_asset_id
        AND a.user_id = (SELECT user_id FROM assets WHERE id = p_asset_id)
        AND a.ai_embedding IS NOT NULL
        AND 1 - (a.ai_embedding <=> (SELECT ai_embedding FROM assets WHERE id = p_asset_id)) >= p_threshold
    ORDER BY sim DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect duplicates for a user
CREATE OR REPLACE FUNCTION detect_asset_duplicates(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Find assets with matching hashes
    INSERT INTO asset_duplicates (user_id, primary_asset_id)
    SELECT DISTINCT p_user_id, MIN(id)
    FROM assets
    WHERE user_id = p_user_id
        AND file_hash IS NOT NULL
    GROUP BY file_hash
    HAVING COUNT(*) > 1;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update asset usage
CREATE OR REPLACE FUNCTION track_asset_usage(
    p_asset_id UUID,
    p_used_in_type TEXT,
    p_used_in_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO asset_usage (asset_id, used_in_type, used_in_id)
    VALUES (p_asset_id, p_used_in_type, p_used_in_id);

    UPDATE assets
    SET usage_count = usage_count + 1, last_used_at = NOW()
    WHERE id = p_asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage stats
CREATE OR REPLACE FUNCTION get_storage_stats(p_user_id UUID)
RETURNS TABLE (
    total_size_bytes BIGINT,
    total_count INTEGER,
    by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(file_size_bytes)::BIGINT,
        COUNT(*)::INTEGER,
        jsonb_object_agg(asset_type, type_stats)
    FROM (
        SELECT
            asset_type,
            jsonb_build_object(
                'count', COUNT(*),
                'size_bytes', SUM(file_size_bytes)
            ) as type_stats
        FROM assets
        WHERE user_id = p_user_id AND is_archived = false
        GROUP BY asset_type
    ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
