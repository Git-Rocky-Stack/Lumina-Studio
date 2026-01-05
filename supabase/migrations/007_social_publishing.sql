-- =============================================
-- Direct Social Publishing
-- One-click publish to social platforms
-- =============================================

-- Connected Social Accounts
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'twitter', 'linkedin', 'facebook', 'youtube', 'pinterest'
    platform_user_id TEXT NOT NULL,
    platform_username TEXT,
    platform_display_name TEXT,
    platform_avatar_url TEXT,
    access_token TEXT, -- Encrypted
    refresh_token TEXT, -- Encrypted
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform, platform_user_id)
);

-- Platform Format Specifications
CREATE TABLE IF NOT EXISTS platform_formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    format_name TEXT NOT NULL, -- 'post', 'story', 'reel', 'cover', 'header'
    display_name TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    aspect_ratio TEXT, -- '1:1', '9:16', '16:9'
    max_file_size_mb INTEGER,
    supported_formats TEXT[] DEFAULT '{jpg,png}',
    max_duration_seconds INTEGER, -- For video
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(platform, format_name)
);

-- Scheduled Posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,

    -- Content
    design_id UUID, -- Reference to saved design
    design_data JSONB, -- Snapshot of design at time of scheduling
    media_url TEXT, -- Generated image/video URL
    media_type TEXT DEFAULT 'image', -- 'image', 'video', 'carousel'
    caption TEXT,
    hashtags TEXT[] DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    link_url TEXT,

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'UTC',

    -- Status
    status TEXT DEFAULT 'scheduled', -- 'draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'
    published_at TIMESTAMPTZ,
    platform_post_id TEXT, -- ID from the platform after publishing
    platform_post_url TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Analytics (populated after publish)
    initial_likes INTEGER,
    initial_comments INTEGER,
    initial_shares INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Publishing Queue (for immediate publishes)
CREATE TABLE IF NOT EXISTS publishing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    locked_by TEXT, -- Worker ID
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Analytics History
CREATE TABLE IF NOT EXISTS post_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    clicks INTEGER DEFAULT 0,
    profile_visits INTEGER DEFAULT 0,
    raw_data JSONB DEFAULT '{}'
);

-- Content Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'post', -- 'post', 'campaign', 'reminder', 'holiday'
    color TEXT DEFAULT '#6366f1',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    is_all_day BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- iCal RRULE format
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimal Posting Times (AI-suggested)
CREATE TABLE IF NOT EXISTS optimal_post_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0-6, Sunday = 0
    hour_utc INTEGER NOT NULL, -- 0-23
    score DECIMAL(3,2) NOT NULL, -- 0.00-1.00
    sample_size INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(social_account_id, day_of_week, hour_utc)
);

-- Indexes
CREATE INDEX idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled ON scheduled_posts(scheduled_for);
CREATE INDEX idx_publishing_queue_next ON publishing_queue(next_attempt_at) WHERE locked_by IS NULL;
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time);

-- RLS Policies
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimal_post_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social accounts"
    ON social_accounts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Platform formats are public"
    ON platform_formats FOR SELECT
    USING (true);

CREATE POLICY "Users manage own scheduled posts"
    ON scheduled_posts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own post analytics"
    ON post_analytics FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduled_posts
        WHERE id = post_analytics.scheduled_post_id
        AND user_id = auth.uid()
    ));

CREATE POLICY "Users manage own calendar"
    ON calendar_events FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own optimal times"
    ON optimal_post_times FOR SELECT
    USING (auth.uid() = user_id);

-- Insert platform formats
INSERT INTO platform_formats (platform, format_name, display_name, width, height, aspect_ratio, max_file_size_mb, supported_formats, max_duration_seconds) VALUES
    -- Instagram
    ('instagram', 'post_square', 'Square Post', 1080, 1080, '1:1', 30, '{jpg,png}', NULL),
    ('instagram', 'post_portrait', 'Portrait Post', 1080, 1350, '4:5', 30, '{jpg,png}', NULL),
    ('instagram', 'post_landscape', 'Landscape Post', 1080, 566, '1.91:1', 30, '{jpg,png}', NULL),
    ('instagram', 'story', 'Story', 1080, 1920, '9:16', 30, '{jpg,png,mp4}', 60),
    ('instagram', 'reel', 'Reel', 1080, 1920, '9:16', 100, '{mp4}', 90),

    -- TikTok
    ('tiktok', 'video', 'Video', 1080, 1920, '9:16', 287, '{mp4}', 180),
    ('tiktok', 'thumbnail', 'Thumbnail', 1080, 1920, '9:16', 10, '{jpg,png}', NULL),

    -- Twitter/X
    ('twitter', 'post', 'Post Image', 1200, 675, '16:9', 5, '{jpg,png,gif}', NULL),
    ('twitter', 'header', 'Header', 1500, 500, '3:1', 5, '{jpg,png}', NULL),

    -- LinkedIn
    ('linkedin', 'post', 'Post Image', 1200, 627, '1.91:1', 5, '{jpg,png}', NULL),
    ('linkedin', 'story', 'Story', 1080, 1920, '9:16', 30, '{jpg,png,mp4}', 20),
    ('linkedin', 'banner', 'Profile Banner', 1584, 396, '4:1', 8, '{jpg,png}', NULL),

    -- Facebook
    ('facebook', 'post', 'Post Image', 1200, 630, '1.91:1', 30, '{jpg,png}', NULL),
    ('facebook', 'story', 'Story', 1080, 1920, '9:16', 30, '{jpg,png,mp4}', 20),
    ('facebook', 'cover', 'Page Cover', 820, 312, '2.63:1', 10, '{jpg,png}', NULL),

    -- YouTube
    ('youtube', 'thumbnail', 'Thumbnail', 1280, 720, '16:9', 2, '{jpg,png}', NULL),
    ('youtube', 'banner', 'Channel Banner', 2560, 1440, '16:9', 6, '{jpg,png}', NULL),

    -- Pinterest
    ('pinterest', 'pin', 'Pin', 1000, 1500, '2:3', 20, '{jpg,png}', NULL),
    ('pinterest', 'pin_square', 'Square Pin', 1000, 1000, '1:1', 20, '{jpg,png}', NULL);

-- Function to get next optimal posting time
CREATE OR REPLACE FUNCTION get_next_optimal_time(
    p_social_account_id UUID,
    p_after TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_best_time optimal_post_times%ROWTYPE;
    v_result TIMESTAMPTZ;
BEGIN
    -- Get highest scoring time slot
    SELECT * INTO v_best_time
    FROM optimal_post_times
    WHERE social_account_id = p_social_account_id
    ORDER BY score DESC
    LIMIT 1;

    IF v_best_time IS NULL THEN
        -- Default to next hour if no data
        RETURN date_trunc('hour', p_after) + interval '1 hour';
    END IF;

    -- Calculate next occurrence of this time slot
    v_result := date_trunc('day', p_after) + (v_best_time.hour_utc || ' hours')::interval;

    -- Adjust to correct day of week
    WHILE EXTRACT(DOW FROM v_result) != v_best_time.day_of_week OR v_result <= p_after LOOP
        v_result := v_result + interval '1 day';
    END LOOP;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
