// ============================================================================
// AI TEMPLATE ENGINE - TYPE DEFINITIONS
// ============================================================================

/**
 * Template categories with hierarchical structure
 */
export enum TemplateCategory {
  SOCIAL_MEDIA = 'social_media',
  MARKETING = 'marketing',
  PRESENTATIONS = 'presentations',
  PRINT = 'print',
  WEB_GRAPHICS = 'web_graphics',
  BRANDED_CONTENT = 'branded_content',
  CUSTOM = 'custom'
}

/**
 * Output format presets with predefined dimensions
 */
export enum OutputFormat {
  // Social Media
  INSTAGRAM_POST = 'instagram_post',
  INSTAGRAM_STORY = 'instagram_story',
  INSTAGRAM_REEL = 'instagram_reel',
  FACEBOOK_POST = 'facebook_post',
  FACEBOOK_COVER = 'facebook_cover',
  TWITTER_POST = 'twitter_post',
  LINKEDIN_POST = 'linkedin_post',
  YOUTUBE_THUMBNAIL = 'youtube_thumbnail',
  TIKTOK = 'tiktok',

  // Marketing
  EMAIL_HEADER = 'email_header',
  BANNER_AD = 'banner_ad',
  HERO_IMAGE = 'hero_image',

  // Presentations
  SLIDE_16_9 = 'slide_16_9',
  SLIDE_4_3 = 'slide_4_3',

  // Print
  FLYER_LETTER = 'flyer_letter',
  BUSINESS_CARD = 'business_card',
  POSTER_A4 = 'poster_a4',

  // Custom
  CUSTOM = 'custom'
}

/**
 * Industry presets for context-aware generation
 */
export enum IndustryPreset {
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  EDUCATION = 'education',
  ECOMMERCE = 'ecommerce',
  REAL_ESTATE = 'real_estate',
  FOOD_BEVERAGE = 'food_beverage',
  FASHION = 'fashion',
  AUTOMOTIVE = 'automotive',
  ENTERTAINMENT = 'entertainment',
  NON_PROFIT = 'non_profit',
  FITNESS = 'fitness',
  TRAVEL = 'travel',
  GENERAL = 'general'
}

/**
 * Output format dimensions configuration
 */
export interface FormatDimensions {
  format: OutputFormat;
  width: number;
  height: number;
  aspectRatio: string;
  label: string;
  category: TemplateCategory;
}

export const FORMAT_DIMENSIONS: FormatDimensions[] = [
  // Social Media
  { format: OutputFormat.INSTAGRAM_POST, width: 1080, height: 1080, aspectRatio: '1:1', label: 'Instagram Post', category: TemplateCategory.SOCIAL_MEDIA },
  { format: OutputFormat.INSTAGRAM_STORY, width: 1080, height: 1920, aspectRatio: '9:16', label: 'Instagram Story', category: TemplateCategory.SOCIAL_MEDIA },
  { format: OutputFormat.INSTAGRAM_REEL, width: 1080, height: 1920, aspectRatio: '9:16', label: 'Instagram Reel Cover', category: TemplateCategory.SOCIAL_MEDIA },
  { format: OutputFormat.FACEBOOK_POST, width: 1200, height: 630, aspectRatio: '1.91:1', label: 'Facebook Post', category: TemplateCategory.SOCIAL_MEDIA },
  { format: OutputFormat.FACEBOOK_COVER, width: 820, height: 312, aspectRatio: '2.63:1', label: 'Facebook Cover', category: TemplateCategory.SOCIAL_MEDIA },
  { format: OutputFormat.TWITTER_POST, width: 1200, height: 675, aspectRatio: '16:9', label: 'Twitter/X Post', category: TemplateCategory.SOCIAL_MEDIA },
  { format: OutputFormat.LINKEDIN_POST, width: 1200, height: 627, aspectRatio: '1.91:1', label: 'LinkedIn Post', category: TemplateCategory.SOCIAL_MEDIA },
  { format: OutputFormat.YOUTUBE_THUMBNAIL, width: 1280, height: 720, aspectRatio: '16:9', label: 'YouTube Thumbnail', category: TemplateCategory.SOCIAL_MEDIA },
  { format: OutputFormat.TIKTOK, width: 1080, height: 1920, aspectRatio: '9:16', label: 'TikTok', category: TemplateCategory.SOCIAL_MEDIA },

  // Marketing
  { format: OutputFormat.EMAIL_HEADER, width: 600, height: 200, aspectRatio: '3:1', label: 'Email Header', category: TemplateCategory.MARKETING },
  { format: OutputFormat.BANNER_AD, width: 728, height: 90, aspectRatio: '8:1', label: 'Banner Ad', category: TemplateCategory.MARKETING },
  { format: OutputFormat.HERO_IMAGE, width: 1920, height: 1080, aspectRatio: '16:9', label: 'Hero Image', category: TemplateCategory.MARKETING },

  // Presentations
  { format: OutputFormat.SLIDE_16_9, width: 1920, height: 1080, aspectRatio: '16:9', label: 'Slide (16:9)', category: TemplateCategory.PRESENTATIONS },
  { format: OutputFormat.SLIDE_4_3, width: 1024, height: 768, aspectRatio: '4:3', label: 'Slide (4:3)', category: TemplateCategory.PRESENTATIONS },

  // Print
  { format: OutputFormat.FLYER_LETTER, width: 2550, height: 3300, aspectRatio: '8.5:11', label: 'Flyer (Letter)', category: TemplateCategory.PRINT },
  { format: OutputFormat.BUSINESS_CARD, width: 1050, height: 600, aspectRatio: '3.5:2', label: 'Business Card', category: TemplateCategory.PRINT },
  { format: OutputFormat.POSTER_A4, width: 2480, height: 3508, aspectRatio: '1:1.41', label: 'Poster (A4)', category: TemplateCategory.PRINT },

  // Custom
  { format: OutputFormat.CUSTOM, width: 1080, height: 1080, aspectRatio: '1:1', label: 'Custom Size', category: TemplateCategory.CUSTOM }
];

/**
 * Template element types for canvas
 */
export type TemplateElementType = 'text' | 'image' | 'shape' | 'icon' | 'background' | 'logo' | 'group';

/**
 * Text element properties
 */
export interface TextElementProps {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  shadow?: boolean;
}

/**
 * Image element properties
 */
export interface ImageElementProps {
  src: string;
  alt?: string;
  opacity: number;
  fit: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  aiPrompt?: string; // For AI-generated images
}

/**
 * Shape element properties
 */
export interface ShapeElementProps {
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'line';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity: number;
  borderRadius?: number;
}

/**
 * Template element - composable design unit
 */
export interface TemplateElement {
  id: string;
  type: TemplateElementType;
  name: string;

  // Position & dimensions
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;

  // Element-specific properties
  props: TextElementProps | ImageElementProps | ShapeElementProps;

  // State
  locked: boolean;
  visible: boolean;

  // Brand kit mapping
  brandMapping?: {
    color?: 'primary' | 'secondary' | 'accent' | 'neutral';
    font?: 'heading' | 'body';
  };

  // AI generation context
  aiGenerated?: boolean;
  aiPrompt?: string;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  type: 'grid' | 'freeform' | 'centered' | 'asymmetric';
  columns?: number;
  rows?: number;
  gap?: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Full template structure
 */
export interface AITemplate {
  id: string;
  name: string;
  description: string;

  // Classification
  category: TemplateCategory;
  subcategory?: string;
  industry: IndustryPreset[];
  tags: string[];

  // Visual data
  thumbnail?: string;
  preview?: string;

  // Dimensions
  format: OutputFormat;
  width: number;
  height: number;
  aspectRatio: string;

  // Design elements
  elements: TemplateElement[];
  layout: LayoutConfig;
  backgroundColor: string;
  backgroundImage?: string;

  // Customization options
  customizable: {
    text: boolean;
    images: boolean;
    colors: boolean;
    fonts: boolean;
  };

  // Brand kit compatibility
  brandKitCompatible: boolean;

  // Metadata
  popularity: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;

  // AI generation info
  generatedWith?: {
    model: string;
    prompt: string;
    confidence: number;
  };
}

/**
 * User prompt for template generation
 */
export interface TemplatePrompt {
  id: string;

  // User's description
  prompt: string;

  // Target configuration
  category?: TemplateCategory;
  format: OutputFormat;
  industry?: IndustryPreset;

  // Brand kit
  applyBrandKit: boolean;

  // Preferences
  preferences: GenerationPreferences;

  // Reference images (optional)
  referenceImages?: string[];

  createdAt: string;
}

/**
 * Generation preferences for AI
 */
export interface GenerationPreferences {
  colorScheme: 'vibrant' | 'muted' | 'monochrome' | 'pastel' | 'brand' | 'auto';
  layoutComplexity: 'minimal' | 'moderate' | 'complex';
  textDensity: 'low' | 'medium' | 'high';
  imageStyle: 'photo' | 'illustration' | 'abstract' | 'geometric' | 'auto';
  tone: 'professional' | 'casual' | 'playful' | 'elegant' | 'bold' | 'auto';
}

/**
 * Generated template result
 */
export interface GeneratedTemplate {
  id: string;
  promptId: string;
  template: AITemplate;

  // Generation metadata
  metadata: {
    model: string;
    generationTime: number;
    tokensUsed?: number;
    confidence: number;
  };

  // AI reasoning
  insights: {
    reasoning: string;
    colorRationale?: string;
    layoutRationale?: string;
    suggestions?: string[];
    brandAlignmentScore?: number;
  };

  // Variations
  variations?: AITemplate[];

  // Status
  status: 'generating' | 'completed' | 'failed' | 'refining';
  error?: string;

  createdAt: string;
}

/**
 * Brand kit structure (extended from existing)
 */
export interface ExtendedBrandKit {
  id: string;
  name: string;
  personality: string;

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string[];
  };

  fonts: {
    heading: string;
    body: string;
  };

  traits: string[];
  tone: string;

  logoUrl?: string;
}

/**
 * Template library state
 */
export interface TemplateLibraryState {
  templates: AITemplate[];
  generatedTemplates: GeneratedTemplate[];
  favorites: string[];
  recent: string[];
  loading: boolean;
  error: string | null;
}

/**
 * Template search query
 */
export interface TemplateSearchQuery {
  query?: string;
  category?: TemplateCategory;
  industry?: IndustryPreset;
  format?: OutputFormat;
  tags?: string[];
  sortBy?: 'popularity' | 'recent' | 'relevance';
  limit?: number;
  offset?: number;
}

/**
 * Industry preset configuration
 */
export interface IndustryConfig {
  id: IndustryPreset;
  label: string;
  icon: string;
  defaultColors: string[];
  keywords: string[];
  tone: string;
}

export const INDUSTRY_CONFIGS: IndustryConfig[] = [
  { id: IndustryPreset.TECHNOLOGY, label: 'Technology', icon: 'fa-microchip', defaultColors: ['#3B82F6', '#6366F1', '#8B5CF6'], keywords: ['innovation', 'digital', 'modern'], tone: 'professional yet innovative' },
  { id: IndustryPreset.HEALTHCARE, label: 'Healthcare', icon: 'fa-heart-pulse', defaultColors: ['#10B981', '#14B8A6', '#0891B2'], keywords: ['trust', 'care', 'wellness'], tone: 'compassionate and trustworthy' },
  { id: IndustryPreset.FINANCE, label: 'Finance', icon: 'fa-chart-line', defaultColors: ['#0F172A', '#1E40AF', '#047857'], keywords: ['security', 'growth', 'stability'], tone: 'professional and reliable' },
  { id: IndustryPreset.EDUCATION, label: 'Education', icon: 'fa-graduation-cap', defaultColors: ['#7C3AED', '#2563EB', '#F59E0B'], keywords: ['learning', 'growth', 'knowledge'], tone: 'approachable and inspiring' },
  { id: IndustryPreset.ECOMMERCE, label: 'E-Commerce', icon: 'fa-shopping-cart', defaultColors: ['#F97316', '#EF4444', '#EC4899'], keywords: ['deals', 'shopping', 'value'], tone: 'exciting and persuasive' },
  { id: IndustryPreset.REAL_ESTATE, label: 'Real Estate', icon: 'fa-house', defaultColors: ['#78716C', '#0D9488', '#1E3A5F'], keywords: ['home', 'investment', 'luxury'], tone: 'sophisticated and trustworthy' },
  { id: IndustryPreset.FOOD_BEVERAGE, label: 'Food & Beverage', icon: 'fa-utensils', defaultColors: ['#DC2626', '#F59E0B', '#84CC16'], keywords: ['fresh', 'delicious', 'quality'], tone: 'appetizing and inviting' },
  { id: IndustryPreset.FASHION, label: 'Fashion', icon: 'fa-shirt', defaultColors: ['#0F0F0F', '#D4AF37', '#9333EA'], keywords: ['style', 'trendy', 'elegant'], tone: 'stylish and aspirational' },
  { id: IndustryPreset.AUTOMOTIVE, label: 'Automotive', icon: 'fa-car', defaultColors: ['#1F2937', '#DC2626', '#3B82F6'], keywords: ['performance', 'power', 'innovation'], tone: 'dynamic and powerful' },
  { id: IndustryPreset.ENTERTAINMENT, label: 'Entertainment', icon: 'fa-film', defaultColors: ['#7C3AED', '#EC4899', '#F59E0B'], keywords: ['fun', 'exciting', 'engaging'], tone: 'energetic and captivating' },
  { id: IndustryPreset.NON_PROFIT, label: 'Non-Profit', icon: 'fa-hand-holding-heart', defaultColors: ['#059669', '#0284C7', '#8B5CF6'], keywords: ['impact', 'community', 'change'], tone: 'heartfelt and inspiring' },
  { id: IndustryPreset.FITNESS, label: 'Fitness', icon: 'fa-dumbbell', defaultColors: ['#EF4444', '#F97316', '#22C55E'], keywords: ['energy', 'strength', 'motivation'], tone: 'motivational and energetic' },
  { id: IndustryPreset.TRAVEL, label: 'Travel', icon: 'fa-plane', defaultColors: ['#0EA5E9', '#10B981', '#F59E0B'], keywords: ['adventure', 'explore', 'discover'], tone: 'adventurous and inspiring' },
  { id: IndustryPreset.GENERAL, label: 'General', icon: 'fa-shapes', defaultColors: ['#6366F1', '#8B5CF6', '#EC4899'], keywords: ['creative', 'versatile', 'modern'], tone: 'versatile and professional' }
];

/**
 * Style presets for quick generation
 */
export interface StylePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  preferences: Partial<GenerationPreferences>;
}

export const STYLE_PRESETS: StylePreset[] = [
  { id: 'minimal', name: 'Minimal', icon: 'fa-minus', description: 'Clean, simple, lots of whitespace', preferences: { layoutComplexity: 'minimal', textDensity: 'low', tone: 'elegant' } },
  { id: 'bold', name: 'Bold', icon: 'fa-bolt', description: 'Strong colors, impactful typography', preferences: { colorScheme: 'vibrant', tone: 'bold', textDensity: 'medium' } },
  { id: 'elegant', name: 'Elegant', icon: 'fa-feather', description: 'Sophisticated, refined aesthetics', preferences: { colorScheme: 'muted', tone: 'elegant', layoutComplexity: 'moderate' } },
  { id: 'playful', name: 'Playful', icon: 'fa-face-smile', description: 'Fun, colorful, engaging', preferences: { colorScheme: 'vibrant', tone: 'playful', imageStyle: 'illustration' } },
  { id: 'professional', name: 'Professional', icon: 'fa-briefcase', description: 'Corporate, trustworthy, clean', preferences: { tone: 'professional', colorScheme: 'muted', layoutComplexity: 'moderate' } },
  { id: 'creative', name: 'Creative', icon: 'fa-palette', description: 'Artistic, unique, expressive', preferences: { layoutComplexity: 'complex', imageStyle: 'abstract', colorScheme: 'vibrant' } }
];
