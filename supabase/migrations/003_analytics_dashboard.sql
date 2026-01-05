-- ============================================
-- Analytics Dashboard Database Schema
-- Comprehensive analytics storage for Lumina Studio
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================
-- Analytics Events Table
-- Raw event storage for detailed analysis
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Event identification
    event_name TEXT NOT NULL,
    event_category TEXT NOT NULL CHECK (event_category IN (
        'page_view', 'user_action', 'feature_usage', 'conversion',
        'engagement', 'error', 'performance', 'ai_usage'
    )),

    -- Session context
    session_id TEXT NOT NULL,

    -- Event data
    properties JSONB DEFAULT '{}',

    -- Page/Location context
    page_path TEXT,
    page_title TEXT,
    referrer TEXT,

    -- Device/Browser info
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser TEXT,
    os TEXT,
    screen_width INTEGER,
    screen_height INTEGER,

    -- Geographic data (anonymized)
    country_code CHAR(2),
    region TEXT,
    timezone TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Partition by date for performance
    event_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
) PARTITION BY RANGE (event_date);

-- Create partitions for the current year
CREATE TABLE IF NOT EXISTS analytics_events_2025_q1 PARTITION OF analytics_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS analytics_events_2025_q2 PARTITION OF analytics_events
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS analytics_events_2025_q3 PARTITION OF analytics_events
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS analytics_events_2025_q4 PARTITION OF analytics_events
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE IF NOT EXISTS analytics_events_2026_q1 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS analytics_events_2026_q2 PARTITION OF analytics_events
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

-- ============================================
-- Daily Aggregates Table
-- Pre-computed daily metrics for fast queries
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_daily_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Aggregation dimensions
    date DATE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Page views
    page_views INTEGER DEFAULT 0,
    unique_pages INTEGER DEFAULT 0,

    -- Session metrics
    sessions INTEGER DEFAULT 0,
    session_duration_seconds INTEGER DEFAULT 0,
    bounce_rate REAL DEFAULT 0,

    -- Feature usage counts
    canvas_opens INTEGER DEFAULT 0,
    video_studio_opens INTEGER DEFAULT 0,
    pdf_opens INTEGER DEFAULT 0,
    template_uses INTEGER DEFAULT 0,
    ai_generations INTEGER DEFAULT 0,
    exports INTEGER DEFAULT 0,

    -- Asset metrics
    assets_created INTEGER DEFAULT 0,
    assets_modified INTEGER DEFAULT 0,
    assets_deleted INTEGER DEFAULT 0,

    -- Collaboration
    shares INTEGER DEFAULT 0,
    comments_added INTEGER DEFAULT 0,

    -- Storage
    storage_added_bytes BIGINT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(date, user_id)
);

-- ============================================
-- Feature Usage Metrics
-- Track feature adoption and usage patterns
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Feature identification
    feature_name TEXT NOT NULL,
    feature_category TEXT NOT NULL,

    -- Usage metrics
    first_used_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    total_duration_seconds INTEGER DEFAULT 0,

    -- Feature-specific data
    metadata JSONB DEFAULT '{}',

    UNIQUE(user_id, feature_name)
);

-- ============================================
-- AI Usage Tracking
-- Track AI credit consumption and patterns
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- AI operation details
    operation_type TEXT NOT NULL CHECK (operation_type IN (
        'image_generation', 'text_generation', 'image_editing',
        'background_removal', 'upscaling', 'style_transfer',
        'prompt_enhancement', 'auto_caption', 'translation'
    )),
    model_used TEXT,

    -- Request/Response
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    credits_used INTEGER NOT NULL DEFAULT 1,

    -- Performance
    latency_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,

    -- Input/Output references
    input_asset_id UUID,
    output_asset_id UUID,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Performance Metrics
-- Track app performance and errors
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Session context
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Performance metrics
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'page_load', 'first_contentful_paint', 'largest_contentful_paint',
        'first_input_delay', 'cumulative_layout_shift', 'time_to_interactive',
        'api_latency', 'render_time', 'memory_usage', 'error'
    )),
    metric_value REAL NOT NULL,

    -- Context
    page_path TEXT,
    component_name TEXT,

    -- Error details (if applicable)
    error_message TEXT,
    error_stack TEXT,

    -- Device context
    device_type TEXT,
    connection_type TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Funnel Tracking
-- Track conversion funnels
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Funnel identification
    funnel_name TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,

    -- User context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,

    -- Completion
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,

    -- Time spent on step
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    time_in_step_seconds INTEGER,

    -- Drop-off reason (if applicable)
    drop_off_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Dashboard Widgets Configuration
-- User-customizable dashboard layouts
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_dashboard_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Dashboard name
    name TEXT NOT NULL DEFAULT 'My Dashboard',
    is_default BOOLEAN DEFAULT FALSE,

    -- Widget configuration
    widgets JSONB NOT NULL DEFAULT '[]',
    layout JSONB NOT NULL DEFAULT '{}',

    -- Sharing
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with UUID[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(event_date);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily_aggregates(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_user ON analytics_daily_aggregates(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_feature_user ON analytics_feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_feature_name ON analytics_feature_usage(feature_name);

CREATE INDEX IF NOT EXISTS idx_analytics_ai_user ON analytics_ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ai_type ON analytics_ai_usage(operation_type);
CREATE INDEX IF NOT EXISTS idx_analytics_ai_date ON analytics_ai_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_performance_type ON analytics_performance(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_performance_date ON analytics_performance(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_funnels_name ON analytics_funnels(funnel_name);
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_user ON analytics_funnels(user_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_dashboard_config ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics
CREATE POLICY "Users can view their own events"
    ON analytics_events FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own events"
    ON analytics_events FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can view their own aggregates"
    ON analytics_daily_aggregates FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own feature usage"
    ON analytics_feature_usage FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own AI usage"
    ON analytics_ai_usage FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own performance metrics"
    ON analytics_performance FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own funnels"
    ON analytics_funnels FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their dashboard configs"
    ON analytics_dashboard_config FOR ALL
    USING (user_id = auth.uid());

-- ============================================
-- Materialized Views for Fast Queries
-- ============================================

-- Daily active users
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_active_users AS
SELECT
    event_date as date,
    COUNT(DISTINCT user_id) as dau,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(*) as total_events
FROM analytics_events
WHERE user_id IS NOT NULL
GROUP BY event_date
ORDER BY event_date DESC;

-- Feature popularity
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_feature_popularity AS
SELECT
    feature_name,
    feature_category,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(usage_count) as total_uses,
    AVG(total_duration_seconds) as avg_duration_seconds
FROM analytics_feature_usage
GROUP BY feature_name, feature_category
ORDER BY total_uses DESC;

-- AI usage summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ai_usage_summary AS
SELECT
    DATE(created_at) as date,
    operation_type,
    COUNT(*) as operations,
    SUM(credits_used) as credits_consumed,
    AVG(latency_ms) as avg_latency_ms,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::REAL / COUNT(*)::REAL as success_rate
FROM analytics_ai_usage
GROUP BY DATE(created_at), operation_type
ORDER BY date DESC, operations DESC;

-- ============================================
-- Functions for Analytics
-- ============================================

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sessions', COALESCE(SUM(sessions), 0),
        'total_page_views', COALESCE(SUM(page_views), 0),
        'avg_session_duration', COALESCE(AVG(session_duration_seconds), 0),
        'total_exports', COALESCE(SUM(exports), 0),
        'total_ai_generations', COALESCE(SUM(ai_generations), 0),
        'total_assets_created', COALESCE(SUM(assets_created), 0),
        'daily_breakdown', (
            SELECT json_agg(json_build_object(
                'date', date,
                'page_views', page_views,
                'sessions', sessions,
                'ai_generations', ai_generations
            ) ORDER BY date DESC)
            FROM analytics_daily_aggregates
            WHERE user_id = p_user_id
            AND date >= CURRENT_DATE - p_days
        )
    ) INTO result
    FROM analytics_daily_aggregates
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - p_days;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track an event
CREATE OR REPLACE FUNCTION track_analytics_event(
    p_user_id UUID,
    p_event_name TEXT,
    p_event_category TEXT,
    p_session_id TEXT,
    p_properties JSONB DEFAULT '{}',
    p_page_path TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO analytics_events (
        user_id, event_name, event_category, session_id,
        properties, page_path, device_type
    ) VALUES (
        p_user_id, p_event_name, p_event_category, p_session_id,
        p_properties, p_page_path, p_device_type
    )
    RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily aggregates
CREATE OR REPLACE FUNCTION update_daily_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO analytics_daily_aggregates (
        date, user_id, page_views, sessions
    ) VALUES (
        DATE(NEW.created_at),
        NEW.user_id,
        CASE WHEN NEW.event_name = 'page_view' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_name = 'session_start' THEN 1 ELSE 0 END
    )
    ON CONFLICT (date, user_id) DO UPDATE SET
        page_views = analytics_daily_aggregates.page_views +
            CASE WHEN NEW.event_name = 'page_view' THEN 1 ELSE 0 END,
        sessions = analytics_daily_aggregates.sessions +
            CASE WHEN NEW.event_name = 'session_start' THEN 1 ELSE 0 END,
        ai_generations = analytics_daily_aggregates.ai_generations +
            CASE WHEN NEW.event_name = 'ai_generate' THEN 1 ELSE 0 END,
        exports = analytics_daily_aggregates.exports +
            CASE WHEN NEW.event_name = 'export' THEN 1 ELSE 0 END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update daily aggregates
CREATE OR REPLACE TRIGGER trigger_update_daily_aggregates
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    WHEN (NEW.user_id IS NOT NULL)
    EXECUTE FUNCTION update_daily_aggregates();

-- Function to refresh materialized views (run via cron)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_active_users;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_feature_popularity;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ai_usage_summary;
END;
$$ LANGUAGE plpgsql;
