-- Lumina Studio D1 Database Schema
-- Migration: 002_add_stripe_customer_id
-- Created: 2025-01-15
-- Description: Add Stripe customer ID to users table for payment integration

-- Add stripe_customer_id column to users table
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;

-- Add index for faster lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Update tier enum to include 'starter' tier
-- Note: SQLite doesn't support ALTER COLUMN, so we use a workaround
-- The CHECK constraint will need to be handled at application level
-- since we can't modify existing CHECK constraints in SQLite

-- Add starter tier quotas
INSERT OR IGNORE INTO tier_quotas (id, tier, usage_type, monthly_limit, overage_allowed) VALUES
    ('q21', 'starter', 'ai_image_generation', -1, 0),   -- Unlimited with BYOK
    ('q22', 'starter', 'ai_video_generation', -1, 0),   -- Unlimited with BYOK
    ('q23', 'starter', 'ai_text_generation', -1, 0),    -- Unlimited with BYOK
    ('q24', 'starter', 'storage_bytes', 0, 0),          -- No platform storage (uses cloud sync)
    ('q25', 'starter', 'export_render', -1, 0);         -- Unlimited exports

-- Update free tier quotas to match new pricing (15 images, 2 videos)
UPDATE tier_quotas SET monthly_limit = 15 WHERE tier = 'free' AND usage_type = 'ai_image_generation';
UPDATE tier_quotas SET monthly_limit = 2 WHERE tier = 'free' AND usage_type = 'ai_video_generation';

-- Update pro tier quotas to match new pricing (150 images, 12 videos)
UPDATE tier_quotas SET monthly_limit = 150 WHERE tier = 'pro' AND usage_type = 'ai_image_generation';
UPDATE tier_quotas SET monthly_limit = 12 WHERE tier = 'pro' AND usage_type = 'ai_video_generation';

-- Update team tier quotas to match new pricing (500 images, 40 videos)
UPDATE tier_quotas SET monthly_limit = 500 WHERE tier = 'team' AND usage_type = 'ai_image_generation';
UPDATE tier_quotas SET monthly_limit = 40 WHERE tier = 'team' AND usage_type = 'ai_video_generation';
