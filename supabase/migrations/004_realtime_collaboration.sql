-- ============================================
-- Real-time Collaboration System
-- Database Schema for Lumina Studio
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Collaboration Rooms
-- Represents a shared workspace/document session
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Room identification
    name TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN (
        'canvas', 'pdf', 'video', 'document', 'whiteboard', 'presentation'
    )),

    -- Associated resource
    resource_id UUID NOT NULL,
    resource_type TEXT NOT NULL,

    -- Owner
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Room settings
    settings JSONB DEFAULT '{
        "allowAnonymous": false,
        "maxParticipants": 10,
        "autoSave": true,
        "autoSaveInterval": 30000,
        "showCursors": true,
        "showSelections": true,
        "allowComments": true,
        "allowVoiceChat": false
    }',

    -- Access control
    access_type TEXT DEFAULT 'private' CHECK (access_type IN ('private', 'link', 'public')),
    share_token TEXT UNIQUE,
    password_hash TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Room Participants
-- Users currently in a collaboration room
-- ============================================
CREATE TABLE IF NOT EXISTS room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Participant info
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    color TEXT NOT NULL, -- Unique color for this user in this room

    -- Role and permissions
    role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'commenter', 'viewer')),
    permissions JSONB DEFAULT '{
        "canEdit": true,
        "canComment": true,
        "canInvite": false,
        "canDelete": false,
        "canExport": true
    }',

    -- Presence state
    is_online BOOLEAN DEFAULT TRUE,
    presence_state TEXT DEFAULT 'active' CHECK (presence_state IN ('active', 'idle', 'away')),

    -- Cursor/Selection state (for real-time sync)
    cursor_position JSONB, -- {x, y, page?, element?}
    selection JSONB, -- {start, end} or element IDs
    current_tool TEXT,
    viewport JSONB, -- {x, y, zoom, page}

    -- Connection info
    connection_id TEXT,
    device_type TEXT,

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,

    UNIQUE(room_id, user_id)
);

-- ============================================
-- Collaboration Invitations
-- Pending invitations to join rooms
-- ============================================
CREATE TABLE IF NOT EXISTS room_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,

    -- Invitation details
    invited_by UUID REFERENCES auth.users(id),
    invited_email TEXT,
    invited_user_id UUID REFERENCES auth.users(id),

    -- Role to assign on accept
    role TEXT DEFAULT 'editor',

    -- Token for email invites
    token TEXT UNIQUE,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    responded_at TIMESTAMPTZ
);

-- ============================================
-- Real-time Operations (CRDT-style)
-- Track all collaborative operations for sync
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),

    -- Operation details
    operation_type TEXT NOT NULL CHECK (operation_type IN (
        'insert', 'update', 'delete', 'move', 'resize', 'style',
        'undo', 'redo', 'lock', 'unlock', 'comment', 'resolve'
    )),

    -- Target
    target_type TEXT NOT NULL, -- 'element', 'text', 'annotation', etc.
    target_id TEXT NOT NULL,

    -- Operation data
    data JSONB NOT NULL,
    previous_data JSONB,

    -- Vector clock for ordering
    vector_clock JSONB NOT NULL,
    sequence_number BIGINT NOT NULL,

    -- Status
    applied BOOLEAN DEFAULT FALSE,
    reverted BOOLEAN DEFAULT FALSE,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Collaboration Comments
-- In-context comments and discussions
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES collaboration_comments(id) ON DELETE CASCADE,

    -- Author
    user_id UUID REFERENCES auth.users(id),
    author_name TEXT NOT NULL,
    author_avatar TEXT,

    -- Comment content
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}', -- User IDs mentioned

    -- Position/anchor
    anchor_type TEXT CHECK (anchor_type IN ('point', 'element', 'selection', 'page')),
    anchor_data JSONB, -- {x, y, elementId, selectionRange, pageNumber}

    -- Status
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,

    -- Reactions
    reactions JSONB DEFAULT '{}', -- {"👍": ["user1", "user2"]}

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE
);

-- ============================================
-- Collaboration Activity Feed
-- Activity log for room events
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),

    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'join', 'leave', 'edit', 'comment', 'resolve', 'invite',
        'role_change', 'settings_change', 'export', 'version_save'
    )),

    -- Activity data
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Document Versions (Snapshots)
-- Save points for collaboration sessions
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES collaboration_rooms(id) ON DELETE CASCADE,

    -- Version info
    version_number INTEGER NOT NULL,
    name TEXT,
    description TEXT,

    -- Snapshot data
    snapshot JSONB NOT NULL,
    thumbnail_url TEXT,

    -- Creator
    created_by UUID REFERENCES auth.users(id),

    -- Auto vs manual
    is_auto_save BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(room_id, version_number)
);

-- ============================================
-- User Presence (Global)
-- Track user presence across the app
-- ============================================
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Status
    status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    status_message TEXT,
    status_emoji TEXT,

    -- Current location
    current_room_id UUID REFERENCES collaboration_rooms(id),
    current_page TEXT,

    -- Device info
    device_type TEXT,
    platform TEXT,

    -- Timestamps
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    status_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_collab_rooms_owner ON collaboration_rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_resource ON collaboration_rooms(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_token ON collaboration_rooms(share_token);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_active ON collaboration_rooms(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_online ON room_participants(room_id) WHERE is_online = TRUE;

CREATE INDEX IF NOT EXISTS idx_room_invitations_room ON room_invitations(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_email ON room_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_room_invitations_token ON room_invitations(token);

CREATE INDEX IF NOT EXISTS idx_collab_operations_room ON collaboration_operations(room_id);
CREATE INDEX IF NOT EXISTS idx_collab_operations_sequence ON collaboration_operations(room_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_collab_operations_created ON collaboration_operations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collab_comments_room ON collaboration_comments(room_id);
CREATE INDEX IF NOT EXISTS idx_collab_comments_parent ON collaboration_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_collab_comments_unresolved ON collaboration_comments(room_id) WHERE is_resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_collab_activity_room ON collaboration_activity(room_id);
CREATE INDEX IF NOT EXISTS idx_collab_activity_created ON collaboration_activity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collab_versions_room ON collaboration_versions(room_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE collaboration_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Rooms: participants can view, owners can manage
CREATE POLICY "Room participants can view rooms"
    ON collaboration_rooms FOR SELECT
    USING (
        owner_id = auth.uid()
        OR access_type = 'public'
        OR EXISTS (
            SELECT 1 FROM room_participants rp
            WHERE rp.room_id = collaboration_rooms.id
            AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create rooms"
    ON collaboration_rooms FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update rooms"
    ON collaboration_rooms FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete rooms"
    ON collaboration_rooms FOR DELETE
    USING (owner_id = auth.uid());

-- Participants: visible to other participants
CREATE POLICY "Participants can view other participants"
    ON room_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM room_participants rp
            WHERE rp.room_id = room_participants.room_id
            AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join rooms"
    ON room_participants FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participant record"
    ON room_participants FOR UPDATE
    USING (user_id = auth.uid());

-- Comments: visible to participants
CREATE POLICY "Participants can view comments"
    ON collaboration_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM room_participants rp
            WHERE rp.room_id = collaboration_comments.room_id
            AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can create comments"
    ON collaboration_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM room_participants rp
            WHERE rp.room_id = room_id
            AND rp.user_id = auth.uid()
            AND (rp.permissions->>'canComment')::boolean = TRUE
        )
    );

CREATE POLICY "Users can update their own comments"
    ON collaboration_comments FOR UPDATE
    USING (user_id = auth.uid());

-- Operations: visible to participants
CREATE POLICY "Participants can view operations"
    ON collaboration_operations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM room_participants rp
            WHERE rp.room_id = collaboration_operations.room_id
            AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can create operations"
    ON collaboration_operations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM room_participants rp
            WHERE rp.room_id = room_id
            AND rp.user_id = auth.uid()
            AND (rp.permissions->>'canEdit')::boolean = TRUE
        )
    );

-- User presence
CREATE POLICY "Users can view presence"
    ON user_presence FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can update their own presence"
    ON user_presence FOR ALL
    USING (user_id = auth.uid());

-- ============================================
-- Triggers
-- ============================================

-- Update room last activity
CREATE OR REPLACE FUNCTION update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE collaboration_rooms
    SET last_activity_at = NOW()
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_activity
    AFTER INSERT ON collaboration_operations
    FOR EACH ROW EXECUTE FUNCTION update_room_activity();

-- Update participant last seen
CREATE OR REPLACE FUNCTION update_participant_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_participant_last_seen
    BEFORE UPDATE OF cursor_position, selection, viewport ON room_participants
    FOR EACH ROW EXECUTE FUNCTION update_participant_last_seen();

-- Auto-update timestamps
CREATE TRIGGER collaboration_rooms_updated_at
    BEFORE UPDATE ON collaboration_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER collaboration_comments_updated_at
    BEFORE UPDATE ON collaboration_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Functions for Collaboration
-- ============================================

-- Generate unique participant color
CREATE OR REPLACE FUNCTION generate_participant_color(p_room_id UUID)
RETURNS TEXT AS $$
DECLARE
    colors TEXT[] := ARRAY[
        '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
        '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
        '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
    ];
    used_colors TEXT[];
    new_color TEXT;
BEGIN
    -- Get already used colors in the room
    SELECT ARRAY_AGG(color) INTO used_colors
    FROM room_participants
    WHERE room_id = p_room_id;

    -- Find first available color
    FOREACH new_color IN ARRAY colors LOOP
        IF new_color != ALL(COALESCE(used_colors, ARRAY[]::TEXT[])) THEN
            RETURN new_color;
        END IF;
    END LOOP;

    -- If all colors used, return a random one
    RETURN colors[1 + floor(random() * array_length(colors, 1))::int];
END;
$$ LANGUAGE plpgsql;

-- Join a room
CREATE OR REPLACE FUNCTION join_collaboration_room(
    p_room_id UUID,
    p_user_id UUID,
    p_display_name TEXT,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    participant_id UUID;
    user_color TEXT;
BEGIN
    -- Generate color for user
    user_color := generate_participant_color(p_room_id);

    -- Insert or update participant
    INSERT INTO room_participants (
        room_id, user_id, display_name, avatar_url, color, is_online
    ) VALUES (
        p_room_id, p_user_id, p_display_name, p_avatar_url, user_color, TRUE
    )
    ON CONFLICT (room_id, user_id) DO UPDATE SET
        is_online = TRUE,
        display_name = p_display_name,
        avatar_url = COALESCE(p_avatar_url, room_participants.avatar_url),
        last_seen_at = NOW()
    RETURNING id INTO participant_id;

    -- Log activity
    INSERT INTO collaboration_activity (room_id, user_id, activity_type, description)
    VALUES (p_room_id, p_user_id, 'join', p_display_name || ' joined the room');

    RETURN participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave a room
CREATE OR REPLACE FUNCTION leave_collaboration_room(
    p_room_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE room_participants
    SET is_online = FALSE, left_at = NOW()
    WHERE room_id = p_room_id AND user_id = p_user_id;

    -- Log activity
    INSERT INTO collaboration_activity (room_id, user_id, activity_type, description)
    SELECT p_room_id, p_user_id, 'leave', display_name || ' left the room'
    FROM room_participants
    WHERE room_id = p_room_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new version snapshot
CREATE OR REPLACE FUNCTION create_version_snapshot(
    p_room_id UUID,
    p_user_id UUID,
    p_name TEXT,
    p_snapshot JSONB,
    p_is_auto BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    version_id UUID;
    next_version INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM collaboration_versions
    WHERE room_id = p_room_id;

    -- Insert version
    INSERT INTO collaboration_versions (
        room_id, version_number, name, snapshot, created_by, is_auto_save
    ) VALUES (
        p_room_id, next_version, p_name, p_snapshot, p_user_id, p_is_auto
    )
    RETURNING id INTO version_id;

    -- Log activity (only for manual saves)
    IF NOT p_is_auto THEN
        INSERT INTO collaboration_activity (room_id, user_id, activity_type, description, metadata)
        VALUES (p_room_id, p_user_id, 'version_save', 'Saved version: ' || p_name,
                jsonb_build_object('version', next_version));
    END IF;

    RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Supabase Realtime Configuration
-- Enable real-time for collaboration tables
-- ============================================

-- Note: Run these via Supabase Dashboard or CLI
-- ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
-- ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_operations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
