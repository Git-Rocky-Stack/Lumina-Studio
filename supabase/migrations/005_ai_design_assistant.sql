-- =============================================
-- AI Design Assistant
-- Natural language commands for design editing
-- =============================================

-- AI Command History
CREATE TABLE IF NOT EXISTS ai_command_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID,
    command_text TEXT NOT NULL,
    command_type TEXT NOT NULL, -- 'generate', 'edit', 'style', 'layout', 'content'
    context_data JSONB DEFAULT '{}', -- Selected elements, current state
    response_data JSONB DEFAULT '{}', -- AI response and actions taken
    execution_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    execution_time_ms INTEGER,
    tokens_used INTEGER DEFAULT 0,
    model_used TEXT DEFAULT 'gemini-pro',
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- AI Command Templates (common commands users can quick-select)
CREATE TABLE IF NOT EXISTS ai_command_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    command_template TEXT NOT NULL, -- Template with {{placeholders}}
    category TEXT NOT NULL, -- 'text', 'image', 'layout', 'style', 'color'
    icon TEXT,
    is_system BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Generated Suggestions (proactive suggestions)
CREATE TABLE IF NOT EXISTS ai_design_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID,
    suggestion_type TEXT NOT NULL, -- 'improvement', 'alternative', 'accessibility', 'trend'
    target_element_id TEXT,
    suggestion_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    is_dismissed BOOLEAN DEFAULT false,
    is_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Style Presets (learned user preferences)
CREATE TABLE IF NOT EXISTS ai_style_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    style_data JSONB NOT NULL, -- Colors, fonts, spacing, etc.
    source_type TEXT DEFAULT 'manual', -- 'manual', 'learned', 'imported'
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_command_history_user ON ai_command_history(user_id);
CREATE INDEX idx_ai_command_history_created ON ai_command_history(created_at DESC);
CREATE INDEX idx_ai_command_history_type ON ai_command_history(command_type);
CREATE INDEX idx_ai_suggestions_user ON ai_design_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_project ON ai_design_suggestions(project_id);
CREATE INDEX idx_ai_style_presets_user ON ai_style_presets(user_id);

-- RLS Policies
ALTER TABLE ai_command_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_command_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_design_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_style_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own command history"
    ON ai_command_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commands"
    ON ai_command_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commands"
    ON ai_command_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view system templates"
    ON ai_command_templates FOR SELECT
    USING (is_system = true OR auth.uid() = created_by);

CREATE POLICY "Users can create templates"
    ON ai_command_templates FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view own suggestions"
    ON ai_design_suggestions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
    ON ai_design_suggestions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own style presets"
    ON ai_style_presets FOR ALL
    USING (auth.uid() = user_id);

-- Insert default command templates
INSERT INTO ai_command_templates (name, description, command_template, category, icon, is_system) VALUES
    ('Make Bold', 'Increase visual weight', 'Make {{element}} more bold and prominent', 'style', 'fa-bold', true),
    ('Add Shadow', 'Add depth with shadow', 'Add a subtle shadow to {{element}}', 'style', 'fa-clone', true),
    ('Center Align', 'Center the element', 'Center {{element}} on the canvas', 'layout', 'fa-align-center', true),
    ('Add CTA Button', 'Create call-to-action', 'Add a {{color}} CTA button that says "{{text}}"', 'content', 'fa-square', true),
    ('Improve Contrast', 'Better readability', 'Improve the contrast of {{element}} for better readability', 'accessibility', 'fa-adjust', true),
    ('Make Minimal', 'Simplify design', 'Make the design more minimal and clean', 'style', 'fa-minus', true),
    ('Add Animation', 'Subtle motion', 'Add a subtle {{type}} animation to {{element}}', 'style', 'fa-play', true),
    ('Generate Headline', 'AI headline', 'Generate a catchy headline for {{topic}}', 'content', 'fa-heading', true),
    ('Color Palette', 'Suggest colors', 'Suggest a color palette for {{mood}} mood', 'color', 'fa-palette', true),
    ('Resize for Social', 'Format adaptation', 'Resize this design for {{platform}}', 'layout', 'fa-expand', true);

-- Function to track command usage
CREATE OR REPLACE FUNCTION track_ai_command()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user AI credits
    UPDATE user_profiles
    SET ai_credits_used = ai_credits_used + NEW.tokens_used
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ai_command_complete
    AFTER UPDATE OF execution_status ON ai_command_history
    FOR EACH ROW
    WHEN (NEW.execution_status = 'completed')
    EXECUTE FUNCTION track_ai_command();
