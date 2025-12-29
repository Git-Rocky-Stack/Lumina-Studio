// ============================================================================
// UNIFIED EXPORT PIPELINE - TYPE DEFINITIONS
// ============================================================================

/**
 * Export file formats
 */
export type ImageFormat = 'png' | 'jpg' | 'webp' | 'avif' | 'svg' | 'gif';
export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'gif';
export type DocumentFormat = 'pdf' | 'pptx' | 'docx';
export type DataFormat = 'json' | 'csv' | 'xml';

export type ExportFormat = ImageFormat | VideoFormat | DocumentFormat | DataFormat;

/**
 * Platform presets with optimized settings
 */
export enum ExportPlatform {
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
  PINTEREST = 'pinterest',

  // Web
  WEB_HERO = 'web_hero',
  WEB_BANNER = 'web_banner',
  WEB_FAVICON = 'web_favicon',
  WEB_OG_IMAGE = 'web_og_image',

  // Email
  EMAIL_HEADER = 'email_header',
  EMAIL_INLINE = 'email_inline',

  // Print
  PRINT_PHOTO = 'print_photo',
  PRINT_POSTER = 'print_poster',
  PRINT_FLYER = 'print_flyer',
  PRINT_CARD = 'print_card',

  // General
  CUSTOM = 'custom',
  ORIGINAL = 'original'
}

/**
 * Platform-specific export configuration
 */
export interface PlatformConfig {
  id: ExportPlatform;
  label: string;
  icon: string;
  category: 'social' | 'web' | 'email' | 'print' | 'general';

  // Dimensions
  width: number;
  height: number;
  aspectRatio: string;

  // Format recommendations
  recommendedFormat: ExportFormat;
  allowedFormats: ExportFormat[];

  // Quality settings
  defaultQuality: number;
  maxFileSize?: number; // in KB

  // Color settings
  colorSpace: 'sRGB' | 'Display P3' | 'CMYK' | 'Adobe RGB';
  colorProfile?: string;

  // Resolution
  dpi: number;

  // Compression hints
  compressionHint: 'lossy' | 'lossless' | 'balanced';

  // Platform-specific notes
  notes?: string[];
}

/**
 * All platform configurations
 */
export const PLATFORM_CONFIGS: PlatformConfig[] = [
  // Social Media
  {
    id: ExportPlatform.INSTAGRAM_POST,
    label: 'Instagram Post',
    icon: 'fa-instagram',
    category: 'social',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png', 'webp'],
    defaultQuality: 85,
    maxFileSize: 30720, // 30MB
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced',
    notes: ['Square format performs best', 'Use high contrast for feed visibility']
  },
  {
    id: ExportPlatform.INSTAGRAM_STORY,
    label: 'Instagram Story',
    icon: 'fa-instagram',
    category: 'social',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png', 'webp'],
    defaultQuality: 85,
    maxFileSize: 30720,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced',
    notes: ['Keep important content in center', 'Leave space for UI elements']
  },
  {
    id: ExportPlatform.FACEBOOK_POST,
    label: 'Facebook Post',
    icon: 'fa-facebook',
    category: 'social',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png', 'webp'],
    defaultQuality: 85,
    maxFileSize: 10240,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced'
  },
  {
    id: ExportPlatform.FACEBOOK_COVER,
    label: 'Facebook Cover',
    icon: 'fa-facebook',
    category: 'social',
    width: 820,
    height: 312,
    aspectRatio: '2.63:1',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png'],
    defaultQuality: 90,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced'
  },
  {
    id: ExportPlatform.TWITTER_POST,
    label: 'Twitter/X Post',
    icon: 'fa-x-twitter',
    category: 'social',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png', 'webp', 'gif'],
    defaultQuality: 85,
    maxFileSize: 5120,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced'
  },
  {
    id: ExportPlatform.LINKEDIN_POST,
    label: 'LinkedIn Post',
    icon: 'fa-linkedin',
    category: 'social',
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png'],
    defaultQuality: 85,
    maxFileSize: 10240,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced'
  },
  {
    id: ExportPlatform.YOUTUBE_THUMBNAIL,
    label: 'YouTube Thumbnail',
    icon: 'fa-youtube',
    category: 'social',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png'],
    defaultQuality: 90,
    maxFileSize: 2048,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced',
    notes: ['Use bold text for visibility at small sizes', 'High contrast recommended']
  },
  {
    id: ExportPlatform.TIKTOK,
    label: 'TikTok',
    icon: 'fa-tiktok',
    category: 'social',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png', 'webp'],
    defaultQuality: 85,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced'
  },
  {
    id: ExportPlatform.PINTEREST,
    label: 'Pinterest Pin',
    icon: 'fa-pinterest',
    category: 'social',
    width: 1000,
    height: 1500,
    aspectRatio: '2:3',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png'],
    defaultQuality: 85,
    maxFileSize: 20480,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced'
  },

  // Web
  {
    id: ExportPlatform.WEB_HERO,
    label: 'Website Hero',
    icon: 'fa-globe',
    category: 'web',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    recommendedFormat: 'webp',
    allowedFormats: ['webp', 'jpg', 'png', 'avif'],
    defaultQuality: 85,
    maxFileSize: 500,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced',
    notes: ['Use WebP for smaller file size', 'Consider lazy loading']
  },
  {
    id: ExportPlatform.WEB_BANNER,
    label: 'Web Banner',
    icon: 'fa-rectangle-ad',
    category: 'web',
    width: 728,
    height: 90,
    aspectRatio: '8:1',
    recommendedFormat: 'webp',
    allowedFormats: ['webp', 'jpg', 'png', 'gif'],
    defaultQuality: 80,
    maxFileSize: 150,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'lossy'
  },
  {
    id: ExportPlatform.WEB_FAVICON,
    label: 'Favicon',
    icon: 'fa-icons',
    category: 'web',
    width: 512,
    height: 512,
    aspectRatio: '1:1',
    recommendedFormat: 'png',
    allowedFormats: ['png', 'svg'],
    defaultQuality: 100,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'lossless'
  },
  {
    id: ExportPlatform.WEB_OG_IMAGE,
    label: 'OG Image (Social Preview)',
    icon: 'fa-share-nodes',
    category: 'web',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png'],
    defaultQuality: 85,
    maxFileSize: 1024,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced'
  },

  // Email
  {
    id: ExportPlatform.EMAIL_HEADER,
    label: 'Email Header',
    icon: 'fa-envelope',
    category: 'email',
    width: 600,
    height: 200,
    aspectRatio: '3:1',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png', 'gif'],
    defaultQuality: 80,
    maxFileSize: 200,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'lossy',
    notes: ['Avoid transparency for better email client support']
  },
  {
    id: ExportPlatform.EMAIL_INLINE,
    label: 'Email Inline Image',
    icon: 'fa-envelope-open-text',
    category: 'email',
    width: 560,
    height: 315,
    aspectRatio: '16:9',
    recommendedFormat: 'jpg',
    allowedFormats: ['jpg', 'png', 'gif'],
    defaultQuality: 75,
    maxFileSize: 100,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'lossy'
  },

  // Print
  {
    id: ExportPlatform.PRINT_PHOTO,
    label: 'Print Photo (4x6)',
    icon: 'fa-print',
    category: 'print',
    width: 1800,
    height: 1200,
    aspectRatio: '3:2',
    recommendedFormat: 'png',
    allowedFormats: ['png', 'jpg'],
    defaultQuality: 100,
    colorSpace: 'Adobe RGB',
    dpi: 300,
    compressionHint: 'lossless'
  },
  {
    id: ExportPlatform.PRINT_POSTER,
    label: 'Print Poster (A4)',
    icon: 'fa-image',
    category: 'print',
    width: 2480,
    height: 3508,
    aspectRatio: '1:1.41',
    recommendedFormat: 'pdf',
    allowedFormats: ['pdf', 'png', 'jpg'],
    defaultQuality: 100,
    colorSpace: 'CMYK',
    dpi: 300,
    compressionHint: 'lossless'
  },
  {
    id: ExportPlatform.PRINT_FLYER,
    label: 'Print Flyer (Letter)',
    icon: 'fa-file-lines',
    category: 'print',
    width: 2550,
    height: 3300,
    aspectRatio: '8.5:11',
    recommendedFormat: 'pdf',
    allowedFormats: ['pdf', 'png', 'jpg'],
    defaultQuality: 100,
    colorSpace: 'CMYK',
    dpi: 300,
    compressionHint: 'lossless'
  },
  {
    id: ExportPlatform.PRINT_CARD,
    label: 'Business Card',
    icon: 'fa-id-card',
    category: 'print',
    width: 1050,
    height: 600,
    aspectRatio: '3.5:2',
    recommendedFormat: 'pdf',
    allowedFormats: ['pdf', 'png'],
    defaultQuality: 100,
    colorSpace: 'CMYK',
    dpi: 300,
    compressionHint: 'lossless'
  },

  // General
  {
    id: ExportPlatform.ORIGINAL,
    label: 'Original Size',
    icon: 'fa-expand',
    category: 'general',
    width: 0, // Use source dimensions
    height: 0,
    aspectRatio: 'original',
    recommendedFormat: 'png',
    allowedFormats: ['png', 'jpg', 'webp', 'avif', 'svg', 'pdf'],
    defaultQuality: 100,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'lossless'
  },
  {
    id: ExportPlatform.CUSTOM,
    label: 'Custom Size',
    icon: 'fa-sliders',
    category: 'general',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    recommendedFormat: 'png',
    allowedFormats: ['png', 'jpg', 'webp', 'avif', 'svg', 'gif', 'pdf'],
    defaultQuality: 90,
    colorSpace: 'sRGB',
    dpi: 72,
    compressionHint: 'balanced'
  }
];

/**
 * Export quality levels
 */
export enum ExportQuality {
  DRAFT = 'draft',       // Fast, lower quality
  STANDARD = 'standard', // Balanced
  HIGH = 'high',         // Better quality
  ULTRA = 'ultra',       // Maximum quality
  PRINT = 'print'        // Print-ready (300 DPI, CMYK)
}

export const QUALITY_SETTINGS: Record<ExportQuality, { quality: number; description: string }> = {
  [ExportQuality.DRAFT]: { quality: 60, description: 'Quick preview, smaller file' },
  [ExportQuality.STANDARD]: { quality: 80, description: 'Good balance of quality and size' },
  [ExportQuality.HIGH]: { quality: 90, description: 'High quality for most uses' },
  [ExportQuality.ULTRA]: { quality: 100, description: 'Maximum quality, larger file' },
  [ExportQuality.PRINT]: { quality: 100, description: 'Print-ready at 300 DPI' }
};

/**
 * Export job configuration
 */
export interface ExportJob {
  id: string;

  // Source
  sourceType: 'canvas' | 'template' | 'image' | 'video' | 'pdf';
  sourceData: any;
  sourceName: string;

  // Output settings
  platform: ExportPlatform;
  format: ExportFormat;
  quality: ExportQuality;

  // Dimensions (if custom)
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;

  // Advanced options
  colorSpace?: 'sRGB' | 'Display P3' | 'CMYK' | 'Adobe RGB';
  dpi?: number;
  transparentBackground?: boolean;
  embedMetadata?: boolean;
  watermark?: WatermarkOptions;

  // Naming
  fileName: string;
  autoName?: boolean;

  // Destination
  destination: 'download' | 'clipboard' | 'cloud';
  cloudService?: 'google_drive' | 'dropbox' | 'one_drive';

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  resultUrl?: string;
  resultSize?: number;

  // Timestamps
  createdAt: string;
  completedAt?: string;
}

/**
 * Watermark configuration
 */
export interface WatermarkOptions {
  enabled: boolean;
  type: 'text' | 'image';
  content: string; // Text or image URL
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  size: number; // Percentage of image
  padding: number;
}

/**
 * Batch export configuration
 */
export interface BatchExportConfig {
  id: string;
  jobs: ExportJob[];
  parallelLimit: number;
  onJobComplete?: (job: ExportJob) => void;
  onAllComplete?: (jobs: ExportJob[]) => void;
  onError?: (job: ExportJob, error: Error) => void;
}

/**
 * AI Quality Analysis result
 */
export interface QualityAnalysis {
  overallScore: number; // 0-100

  issues: QualityIssue[];
  suggestions: string[];

  metrics: {
    resolution: { score: number; message: string };
    colorContrast: { score: number; message: string };
    textReadability: { score: number; message: string };
    composition: { score: number; message: string };
    fileSize: { score: number; message: string };
  };

  platformCompatibility: {
    platform: ExportPlatform;
    compatible: boolean;
    issues: string[];
  }[];
}

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'resolution' | 'color' | 'text' | 'composition' | 'size' | 'format';
  message: string;
  suggestion: string;
  autoFixable: boolean;
}

/**
 * Export history entry
 */
export interface ExportHistoryEntry {
  id: string;
  job: ExportJob;
  thumbnail?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

/**
 * Export service state
 */
export interface ExportState {
  currentJob: ExportJob | null;
  queue: ExportJob[];
  history: ExportHistoryEntry[];
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

/**
 * Smart filename generator options
 */
export interface FileNameOptions {
  baseName: string;
  platform?: ExportPlatform;
  format: ExportFormat;
  width?: number;
  height?: number;
  includeDate?: boolean;
  includeTimestamp?: boolean;
  prefix?: string;
  suffix?: string;
}
