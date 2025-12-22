/**
 * Lumina Studio API - Environment Type Definitions
 */

export interface Env {
  // Cloudflare D1 Database
  DB: D1Database;

  // Cloudflare R2 Bucket (optional - enable in Cloudflare Dashboard first)
  ASSETS_BUCKET?: R2Bucket;

  // Cloudflare KV for rate limiting and caching
  RATE_LIMIT_KV: KVNamespace;

  // Cloudflare Workers AI
  AI: Ai;

  // Environment variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  API_VERSION: string;
  ALLOWED_ORIGINS: string;
  MAX_UPLOAD_SIZE_MB: string;
  THUMBNAIL_SIZE: string;
  PREVIEW_SIZE: string;

  // Clerk Authentication (secrets)
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  CLERK_PUBLISHABLE_KEY: string;

  // Google AI / Gemini (secrets)
  GOOGLE_AI_API_KEY: string;

  // LemonSqueezy Payments (secrets)
  LEMONSQUEEZY_API_KEY: string;
  LEMONSQUEEZY_WEBHOOK_SECRET: string;
  LEMONSQUEEZY_STORE_ID: string;

  // Optional integrations
  SENTRY_DSN?: string;
  RESEND_API_KEY?: string;
}

// Augment Hono's context with our custom variables
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    sessionId: string;
    userRole?: 'owner' | 'admin' | 'editor' | 'viewer';
    userTier?: 'free' | 'pro' | 'team' | 'enterprise';
  }
}

// Database model types
export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  subscription_id: string | null;
  subscription_expires_at: number | null;
  theme_color: string;
  default_workspace_id: string | null;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  description: string | null;
  logo_url: string | null;
  default_brand_kit_id: string | null;
  settings_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string | null;
  invited_at: number | null;
  accepted_at: number | null;
  created_at: number;
}

export interface Project {
  id: string;
  workspace_id: string;
  owner_id: string;
  name: string;
  description: string | null;
  project_type: 'design' | 'video' | 'document' | 'brand' | 'campaign';
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';
  is_template: number;
  is_public: number;
  thumbnail_url: string | null;
  thumbnail_asset_id: string | null;
  current_version: number;
  created_at: number;
  updated_at: number;
  last_opened_at: number | null;
}

export interface Asset {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  asset_type: 'image' | 'video' | 'audio' | 'document' | 'font' | 'model3d' | 'other';
  storage_key: string;
  cdn_url: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  is_ai_generated: number;
  generation_prompt: string | null;
  generation_model: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  tags_json: string | null;
  description: string | null;
  alt_text: string | null;
  dominant_colors_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface BrandKit {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description: string | null;
  personality: string | null;
  tone_keywords_json: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  colors_json: string | null;
  heading_font: string | null;
  body_font: string | null;
  fonts_json: string | null;
  logo_primary_asset_id: string | null;
  logo_dark_asset_id: string | null;
  logo_icon_asset_id: string | null;
  guidelines_asset_id: string | null;
  is_default: number;
  created_at: number;
  updated_at: number;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  created_by: string;
  brand_kit_id: string | null;
  name: string;
  description: string | null;
  objective: string | null;
  start_date: number | null;
  end_date: number | null;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  platforms_json: string | null;
  target_audience: string | null;
  content_themes_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface CampaignPost {
  id: string;
  campaign_id: string;
  platform: string;
  headline: string | null;
  body: string | null;
  hashtags_json: string | null;
  media_asset_ids_json: string | null;
  scheduled_at: number | null;
  published_at: number | null;
  is_ai_generated: number;
  generation_prompt: string | null;
  sentiment: 'positive' | 'neutral' | 'bold' | 'professional' | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  created_at: number;
  updated_at: number;
}

export interface Storyboard {
  id: string;
  project_id: string;
  title: string;
  master_concept: string | null;
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:3' | '3:2';
  audio_track_id: string | null;
  audio_prompt: string | null;
  total_duration_seconds: number | null;
  created_at: number;
  updated_at: number;
}

export interface StoryboardShot {
  id: string;
  storyboard_id: string;
  position: number;
  prompt: string;
  camera: string | null;
  lighting: string | null;
  lens_type: string | null;
  motion_description: string | null;
  cinematic_detail: string | null;
  motion_score: number | null;
  duration_seconds: number;
  status: 'pending' | 'generating' | 'ready' | 'extending' | 'error';
  video_asset_id: string | null;
  thumbnail_asset_id: string | null;
  transition_type: 'cut' | 'crossfade' | 'glitch' | 'dissolve' | 'zoom' | 'slide';
  transition_intensity: number;
  transition_duration_seconds: number;
  created_at: number;
  updated_at: number;
}

export interface CanvasProject {
  id: string;
  project_id: string;
  width: number;
  height: number;
  background_color: string | null;
  background_asset_id: string | null;
  elements_json: string;
  created_at: number;
  updated_at: number;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  workspace_id: string | null;
  usage_type: 'ai_image_generation' | 'ai_video_generation' | 'ai_text_generation' | 'ai_audio_generation' | 'video_extension' | 'storage_bytes' | 'export_render';
  quantity: number;
  model_used: string | null;
  project_id: string | null;
  asset_id: string | null;
  billing_period: string | null;
  created_at: number;
}

export interface TierQuota {
  id: string;
  tier: string;
  usage_type: string;
  monthly_limit: number;
  overage_allowed: number;
  overage_price_cents: number | null;
}

export interface ChatSession {
  id: string;
  user_id: string;
  workspace_id: string | null;
  project_id: string | null;
  title: string | null;
  context_type: 'general' | 'project' | 'brand' | 'campaign' | null;
  context_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  generated_asset_ids_json: string | null;
  tokens_used: number | null;
  created_at: number;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  workspace_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details_json: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: number;
}

// API Request/Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface QuotaStatus {
  tier: string;
  billing_period: string;
  subscription_status: string;
  subscription_expires_at: number | null;
  usage: Record<string, {
    used: number;
    limit: number;
    remaining: number;
    overage_allowed: boolean;
    used_formatted?: string;
    limit_formatted?: string;
  }>;
}

export interface UploadRequest {
  filename: string;
  mime_type: string;
  file_size: number;
}

export interface UploadResponse {
  upload_id: string;
  upload_url: string;
  expires_at: number;
  asset_id: string;
}

export interface AIGenerationRequest {
  prompt: string;
  style?: string;
  aspect_ratio?: string;
  quality?: 'standard' | 'hd' | 'ultra';
  brand_kit_id?: string;
  project_id?: string;
}

export interface AIGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  asset?: Asset;
  usage: {
    type: string;
    remaining: number;
    limit: number;
  };
  generation_time_ms?: number;
  error?: string;
}
