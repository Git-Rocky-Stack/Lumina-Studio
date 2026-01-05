-- =============================================
-- Offline Mode Support
-- Sync queue and conflict resolution
-- =============================================

-- Sync Queue (pending changes to sync)
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL, -- Unique device identifier

    -- Operation details
    operation_type TEXT NOT NULL, -- 'create', 'update', 'delete'
    entity_type TEXT NOT NULL, -- 'project', 'asset', 'template', etc.
    entity_id UUID NOT NULL,
    entity_data JSONB, -- Full entity data for create/update

    -- Change tracking
    local_timestamp TIMESTAMPTZ NOT NULL, -- When change was made locally
    server_timestamp TIMESTAMPTZ, -- When synced to server
    version INTEGER DEFAULT 1,

    -- Conflict handling
    base_version INTEGER, -- Version this change was based on
    conflict_status TEXT DEFAULT 'none', -- 'none', 'detected', 'resolved', 'rejected'
    conflict_resolution TEXT, -- 'local_wins', 'server_wins', 'merged', 'manual'
    conflict_data JSONB, -- Server data that conflicted

    -- Status
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed', 'conflict'
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- Device Registry
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL UNIQUE,
    device_name TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    last_sync_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    push_subscription JSONB, -- Web Push subscription
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- Offline Cache Manifest
CREATE TABLE IF NOT EXISTS offline_cache_manifest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    cache_type TEXT NOT NULL, -- 'projects', 'assets', 'templates', 'fonts'
    cache_key TEXT NOT NULL,
    cache_version INTEGER DEFAULT 1,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    size_bytes BIGINT DEFAULT 0,
    UNIQUE(user_id, device_id, cache_type, cache_key)
);

-- Sync Checkpoints (for incremental sync)
CREATE TABLE IF NOT EXISTS sync_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    last_sync_timestamp TIMESTAMPTZ NOT NULL,
    last_sync_version INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id, entity_type)
);

-- Version History (for conflict resolution)
CREATE TABLE IF NOT EXISTS entity_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    change_summary TEXT,
    UNIQUE(entity_type, entity_id, version)
);

-- Sync Conflicts Log
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_queue_id UUID REFERENCES sync_queue(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    local_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    local_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ NOT NULL,
    resolution TEXT, -- 'local_wins', 'server_wins', 'merged', 'pending'
    resolved_data JSONB,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(sync_status);
CREATE INDEX idx_sync_queue_device ON sync_queue(device_id);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
CREATE INDEX idx_sync_queue_pending ON sync_queue(user_id, sync_status) WHERE sync_status = 'pending';

CREATE INDEX idx_devices_user ON user_devices(user_id);
CREATE INDEX idx_devices_active ON user_devices(user_id, is_active) WHERE is_active = true;

CREATE INDEX idx_cache_manifest_user ON offline_cache_manifest(user_id, device_id);
CREATE INDEX idx_cache_manifest_expires ON offline_cache_manifest(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_checkpoints_user ON sync_checkpoints(user_id, device_id);
CREATE INDEX idx_entity_versions ON entity_versions(entity_type, entity_id, version DESC);
CREATE INDEX idx_conflicts_user ON sync_conflicts(user_id);

-- RLS Policies
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_cache_manifest ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sync queue"
    ON sync_queue FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own devices"
    ON user_devices FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own cache manifest"
    ON offline_cache_manifest FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own checkpoints"
    ON sync_checkpoints FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own entity versions"
    ON entity_versions FOR SELECT
    USING (auth.uid() = changed_by);

CREATE POLICY "Users manage own conflicts"
    ON sync_conflicts FOR ALL
    USING (auth.uid() = user_id);

-- Function to queue sync operation
CREATE OR REPLACE FUNCTION queue_sync_operation(
    p_user_id UUID,
    p_device_id TEXT,
    p_operation_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_entity_data JSONB,
    p_local_timestamp TIMESTAMPTZ,
    p_base_version INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_queue_id UUID;
BEGIN
    INSERT INTO sync_queue (
        user_id, device_id, operation_type, entity_type,
        entity_id, entity_data, local_timestamp, base_version
    ) VALUES (
        p_user_id, p_device_id, p_operation_type, p_entity_type,
        p_entity_id, p_entity_data, p_local_timestamp, p_base_version
    )
    RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process sync queue
CREATE OR REPLACE FUNCTION process_sync_item(p_queue_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_item sync_queue%ROWTYPE;
    v_current_version INTEGER;
    v_result JSONB;
BEGIN
    SELECT * INTO v_item FROM sync_queue WHERE id = p_queue_id;

    IF v_item IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Item not found');
    END IF;

    -- Update status to syncing
    UPDATE sync_queue SET sync_status = 'syncing' WHERE id = p_queue_id;

    -- Check for conflicts (simplified)
    SELECT MAX(version) INTO v_current_version
    FROM entity_versions
    WHERE entity_type = v_item.entity_type AND entity_id = v_item.entity_id;

    IF v_item.base_version IS NOT NULL AND v_current_version > v_item.base_version THEN
        -- Conflict detected
        UPDATE sync_queue
        SET sync_status = 'conflict', conflict_status = 'detected'
        WHERE id = p_queue_id;

        -- Log conflict
        INSERT INTO sync_conflicts (
            user_id, sync_queue_id, entity_type, entity_id,
            local_data, server_data, local_timestamp, server_timestamp
        )
        SELECT
            v_item.user_id, p_queue_id, v_item.entity_type, v_item.entity_id,
            v_item.entity_data,
            (SELECT data FROM entity_versions
             WHERE entity_type = v_item.entity_type AND entity_id = v_item.entity_id
             ORDER BY version DESC LIMIT 1),
            v_item.local_timestamp,
            (SELECT changed_at FROM entity_versions
             WHERE entity_type = v_item.entity_type AND entity_id = v_item.entity_id
             ORDER BY version DESC LIMIT 1);

        RETURN jsonb_build_object('success', false, 'conflict', true);
    END IF;

    -- Record new version
    INSERT INTO entity_versions (entity_type, entity_id, version, data, changed_by)
    VALUES (
        v_item.entity_type,
        v_item.entity_id,
        COALESCE(v_current_version, 0) + 1,
        v_item.entity_data,
        v_item.user_id
    );

    -- Update sync queue
    UPDATE sync_queue
    SET
        sync_status = 'synced',
        synced_at = NOW(),
        server_timestamp = NOW(),
        version = COALESCE(v_current_version, 0) + 1
    WHERE id = p_queue_id;

    RETURN jsonb_build_object('success', true, 'version', COALESCE(v_current_version, 0) + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending changes for sync
CREATE OR REPLACE FUNCTION get_pending_sync(p_user_id UUID, p_device_id TEXT)
RETURNS SETOF sync_queue AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM sync_queue
    WHERE user_id = p_user_id
        AND device_id = p_device_id
        AND sync_status IN ('pending', 'failed')
        AND retry_count < max_retries
    ORDER BY local_timestamp ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get changes since last sync
CREATE OR REPLACE FUNCTION get_changes_since(
    p_user_id UUID,
    p_device_id TEXT,
    p_entity_type TEXT
)
RETURNS TABLE (
    entity_id UUID,
    operation TEXT,
    data JSONB,
    version INTEGER,
    changed_at TIMESTAMPTZ
) AS $$
DECLARE
    v_last_sync TIMESTAMPTZ;
BEGIN
    SELECT last_sync_timestamp INTO v_last_sync
    FROM sync_checkpoints
    WHERE user_id = p_user_id AND device_id = p_device_id AND entity_type = p_entity_type;

    RETURN QUERY
    SELECT
        ev.entity_id,
        'update'::TEXT as operation,
        ev.data,
        ev.version,
        ev.changed_at
    FROM entity_versions ev
    WHERE ev.entity_type = p_entity_type
        AND ev.changed_by = p_user_id
        AND (v_last_sync IS NULL OR ev.changed_at > v_last_sync)
    ORDER BY ev.changed_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update sync checkpoint
CREATE OR REPLACE FUNCTION update_sync_checkpoint(
    p_user_id UUID,
    p_device_id TEXT,
    p_entity_type TEXT,
    p_timestamp TIMESTAMPTZ,
    p_version INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO sync_checkpoints (user_id, device_id, entity_type, last_sync_timestamp, last_sync_version)
    VALUES (p_user_id, p_device_id, p_entity_type, p_timestamp, p_version)
    ON CONFLICT (user_id, device_id, entity_type)
    DO UPDATE SET
        last_sync_timestamp = p_timestamp,
        last_sync_version = p_version,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
