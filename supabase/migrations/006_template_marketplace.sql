-- =============================================
-- Template Marketplace
-- Browse, purchase, share templates
-- =============================================

-- Template Categories
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES template_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Templates
CREATE TABLE IF NOT EXISTS marketplace_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    category_id UUID REFERENCES template_categories(id),

    -- Basic info
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    tags TEXT[] DEFAULT '{}',

    -- Template data
    template_data JSONB NOT NULL, -- The actual template content
    thumbnail_url TEXT,
    preview_images TEXT[] DEFAULT '{}',

    -- Dimensions & compatibility
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    format_type TEXT NOT NULL, -- 'social_post', 'story', 'banner', 'presentation', etc.

    -- Pricing
    price_cents INTEGER DEFAULT 0, -- 0 = free
    currency TEXT DEFAULT 'USD',
    is_premium BOOLEAN DEFAULT false,

    -- Stats
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    rating_average DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'rejected', 'archived'
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Template Reviews
CREATE TABLE IF NOT EXISTS template_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

-- Template Purchases
CREATE TABLE IF NOT EXISTS template_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES marketplace_templates(id),
    price_paid_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_provider TEXT, -- 'stripe', 'free', 'promo'
    payment_id TEXT,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

-- Template Favorites
CREATE TABLE IF NOT EXISTS template_favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, template_id)
);

-- Template Collections (user-created)
CREATE TABLE IF NOT EXISTS template_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_collection_items (
    collection_id UUID NOT NULL REFERENCES template_collections(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, template_id)
);

-- Creator Payouts
CREATE TABLE IF NOT EXISTS creator_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    payout_method TEXT, -- 'stripe', 'paypal'
    payout_reference TEXT,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_templates_category ON marketplace_templates(category_id);
CREATE INDEX idx_templates_creator ON marketplace_templates(creator_id);
CREATE INDEX idx_templates_status ON marketplace_templates(status);
CREATE INDEX idx_templates_price ON marketplace_templates(price_cents);
CREATE INDEX idx_templates_rating ON marketplace_templates(rating_average DESC);
CREATE INDEX idx_templates_downloads ON marketplace_templates(download_count DESC);
CREATE INDEX idx_templates_published ON marketplace_templates(published_at DESC);
CREATE INDEX idx_templates_search ON marketplace_templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_templates_tags ON marketplace_templates USING gin(tags);

CREATE INDEX idx_reviews_template ON template_reviews(template_id);
CREATE INDEX idx_purchases_user ON template_purchases(user_id);
CREATE INDEX idx_favorites_user ON template_favorites(user_id);

-- RLS Policies
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_collection_items ENABLE ROW LEVEL SECURITY;

-- Categories are public
CREATE POLICY "Categories are viewable by all"
    ON template_categories FOR SELECT
    USING (true);

-- Templates
CREATE POLICY "Approved templates are public"
    ON marketplace_templates FOR SELECT
    USING (status = 'approved' OR creator_id = auth.uid());

CREATE POLICY "Users can create templates"
    ON marketplace_templates FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own templates"
    ON marketplace_templates FOR UPDATE
    USING (auth.uid() = creator_id);

-- Reviews
CREATE POLICY "Reviews are public"
    ON template_reviews FOR SELECT
    USING (true);

CREATE POLICY "Purchasers can review"
    ON template_reviews FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM template_purchases WHERE user_id = auth.uid() AND template_id = template_reviews.template_id)
    );

-- Purchases
CREATE POLICY "Users see own purchases"
    ON template_purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Favorites
CREATE POLICY "Users manage own favorites"
    ON template_favorites FOR ALL
    USING (auth.uid() = user_id);

-- Collections
CREATE POLICY "Public collections viewable"
    ON template_collections FOR SELECT
    USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users manage own collections"
    ON template_collections FOR ALL
    USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO template_categories (name, slug, description, icon, sort_order, is_featured) VALUES
    ('Social Media', 'social-media', 'Templates for social platforms', 'fa-share-alt', 1, true),
    ('Instagram Post', 'instagram-post', 'Square posts for Instagram', 'fa-instagram', 2, false),
    ('Instagram Story', 'instagram-story', 'Vertical stories', 'fa-mobile-alt', 3, false),
    ('Facebook', 'facebook', 'Facebook posts and covers', 'fa-facebook', 4, false),
    ('Twitter/X', 'twitter', 'Twitter posts and headers', 'fa-twitter', 5, false),
    ('LinkedIn', 'linkedin', 'Professional content', 'fa-linkedin', 6, false),
    ('TikTok', 'tiktok', 'TikTok thumbnails and covers', 'fa-tiktok', 7, false),
    ('YouTube', 'youtube', 'Thumbnails and banners', 'fa-youtube', 8, false),
    ('Marketing', 'marketing', 'Marketing materials', 'fa-bullhorn', 10, true),
    ('Presentations', 'presentations', 'Slide decks', 'fa-presentation', 11, false),
    ('Print', 'print', 'Print-ready designs', 'fa-print', 12, false),
    ('Business', 'business', 'Business documents', 'fa-briefcase', 13, false);

-- Function to update template stats
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_templates
    SET
        rating_average = (SELECT AVG(rating) FROM template_reviews WHERE template_id = NEW.template_id),
        rating_count = (SELECT COUNT(*) FROM template_reviews WHERE template_id = NEW.template_id)
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON template_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_template_rating();

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_template_download(p_template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE marketplace_templates
    SET download_count = download_count + 1
    WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
