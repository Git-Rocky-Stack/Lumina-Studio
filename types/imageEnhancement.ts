// ============================================================================
// AI IMAGE ENHANCEMENT - TYPE DEFINITIONS
// ============================================================================

/**
 * Enhancement operation type
 */
export type EnhancementType =
  | 'upscale'
  | 'background-remove'
  | 'background-replace'
  | 'object-remove'
  | 'style-transfer'
  | 'colorize'
  | 'denoise'
  | 'sharpen'
  | 'restore'
  | 'hdr'
  | 'face-enhance'
  | 'auto-enhance';

/**
 * Processing status
 */
export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

/**
 * Upscale factor
 */
export type UpscaleFactor = 2 | 4 | 8;

/**
 * Style transfer preset
 */
export type StylePreset =
  | 'anime'
  | 'oil-painting'
  | 'watercolor'
  | 'sketch'
  | 'pop-art'
  | 'cyberpunk'
  | 'vintage'
  | 'comic'
  | 'impressionist'
  | 'minimalist';

/**
 * Enhancement job
 */
export interface EnhancementJob {
  id: string;
  type: EnhancementType;
  status: ProcessingStatus;
  progress: number;
  inputImage: string;
  outputImage?: string;
  options: EnhancementOptions;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

/**
 * Enhancement options
 */
export interface EnhancementOptions {
  // Upscale options
  upscaleFactor?: UpscaleFactor;
  preserveDetails?: boolean;
  denoiseLevel?: number;

  // Background options
  backgroundType?: 'transparent' | 'color' | 'image' | 'blur';
  backgroundColor?: string;
  backgroundImage?: string;
  blurIntensity?: number;
  featherEdge?: number;

  // Object removal
  maskData?: string;
  inpaintingStrength?: number;

  // Style transfer
  stylePreset?: StylePreset;
  styleStrength?: number;
  preserveColor?: boolean;

  // General
  outputFormat?: 'png' | 'jpg' | 'webp';
  outputQuality?: number;
}

/**
 * Enhancement result
 */
export interface EnhancementResult {
  jobId: string;
  success: boolean;
  outputImage?: string;
  outputUrl?: string;
  metadata?: {
    originalSize: { width: number; height: number };
    outputSize: { width: number; height: number };
    processingTime: number;
    fileSize: number;
  };
  error?: string;
}

/**
 * Mask point for object removal
 */
export interface MaskPoint {
  x: number;
  y: number;
}

/**
 * Mask stroke
 */
export interface MaskStroke {
  points: MaskPoint[];
  brushSize: number;
  isEraser: boolean;
}

/**
 * Enhancement history entry
 */
export interface EnhancementHistoryEntry {
  id: string;
  type: EnhancementType;
  inputThumbnail: string;
  outputThumbnail: string;
  timestamp: number;
  options: EnhancementOptions;
}

/**
 * Enhancement preset
 */
export interface EnhancementPreset {
  id: string;
  name: string;
  description: string;
  type: EnhancementType;
  options: EnhancementOptions;
  icon: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ENHANCEMENT_INFO: Record<EnhancementType, {
  label: string;
  description: string;
  icon: string;
  color: string;
  isPro?: boolean;
}> = {
  'upscale': {
    label: 'AI Upscale',
    description: 'Increase image resolution up to 8x with AI',
    icon: 'fa-expand',
    color: '#3b82f6'
  },
  'background-remove': {
    label: 'Remove Background',
    description: 'Automatically remove image background',
    icon: 'fa-eraser',
    color: '#10b981'
  },
  'background-replace': {
    label: 'Replace Background',
    description: 'Replace background with color, image, or blur',
    icon: 'fa-image',
    color: '#8b5cf6'
  },
  'object-remove': {
    label: 'Remove Object',
    description: 'Remove unwanted objects from images',
    icon: 'fa-wand-magic-sparkles',
    color: '#f59e0b'
  },
  'style-transfer': {
    label: 'Style Transfer',
    description: 'Apply artistic styles to your images',
    icon: 'fa-palette',
    color: '#ec4899'
  },
  'colorize': {
    label: 'Colorize',
    description: 'Add color to black and white photos',
    icon: 'fa-fill-drip',
    color: '#06b6d4'
  },
  'denoise': {
    label: 'Denoise',
    description: 'Remove noise and grain from images',
    icon: 'fa-broom',
    color: '#64748b'
  },
  'sharpen': {
    label: 'Sharpen',
    description: 'Enhance image sharpness and clarity',
    icon: 'fa-diamond',
    color: '#6366f1'
  },
  'restore': {
    label: 'Photo Restore',
    description: 'Restore old or damaged photos',
    icon: 'fa-clock-rotate-left',
    color: '#f97316',
    isPro: true
  },
  'hdr': {
    label: 'HDR Effect',
    description: 'Apply high dynamic range effect',
    icon: 'fa-sun',
    color: '#eab308'
  },
  'face-enhance': {
    label: 'Face Enhance',
    description: 'Enhance facial features and details',
    icon: 'fa-face-smile',
    color: '#14b8a6',
    isPro: true
  },
  'auto-enhance': {
    label: 'Auto Enhance',
    description: 'Automatically improve image quality',
    icon: 'fa-magic',
    color: '#a855f7'
  }
};

export const STYLE_PRESETS: Record<StylePreset, {
  label: string;
  thumbnail: string;
  description: string;
}> = {
  'anime': {
    label: 'Anime',
    thumbnail: '🎌',
    description: 'Japanese anime art style'
  },
  'oil-painting': {
    label: 'Oil Painting',
    thumbnail: '🖼️',
    description: 'Classic oil painting texture'
  },
  'watercolor': {
    label: 'Watercolor',
    thumbnail: '🎨',
    description: 'Soft watercolor effect'
  },
  'sketch': {
    label: 'Pencil Sketch',
    thumbnail: '✏️',
    description: 'Hand-drawn pencil sketch'
  },
  'pop-art': {
    label: 'Pop Art',
    thumbnail: '🎪',
    description: 'Bold pop art style'
  },
  'cyberpunk': {
    label: 'Cyberpunk',
    thumbnail: '🌃',
    description: 'Neon cyberpunk aesthetic'
  },
  'vintage': {
    label: 'Vintage',
    thumbnail: '📷',
    description: 'Retro vintage look'
  },
  'comic': {
    label: 'Comic Book',
    thumbnail: '💥',
    description: 'Comic book illustration'
  },
  'impressionist': {
    label: 'Impressionist',
    thumbnail: '🌻',
    description: 'Impressionist painting style'
  },
  'minimalist': {
    label: 'Minimalist',
    thumbnail: '⬜',
    description: 'Clean minimalist design'
  }
};

export const DEFAULT_PRESETS: EnhancementPreset[] = [
  {
    id: 'quick-upscale-2x',
    name: 'Quick Upscale 2x',
    description: 'Double image resolution',
    type: 'upscale',
    options: { upscaleFactor: 2, preserveDetails: true },
    icon: 'fa-expand'
  },
  {
    id: 'hd-upscale-4x',
    name: 'HD Upscale 4x',
    description: 'Quadruple resolution for HD',
    type: 'upscale',
    options: { upscaleFactor: 4, preserveDetails: true, denoiseLevel: 0.3 },
    icon: 'fa-up-right-and-down-left-from-center'
  },
  {
    id: 'transparent-bg',
    name: 'Transparent Background',
    description: 'Remove background to transparent',
    type: 'background-remove',
    options: { backgroundType: 'transparent', featherEdge: 2 },
    icon: 'fa-chess-board'
  },
  {
    id: 'white-bg',
    name: 'White Background',
    description: 'Replace with clean white',
    type: 'background-replace',
    options: { backgroundType: 'color', backgroundColor: '#ffffff' },
    icon: 'fa-square'
  },
  {
    id: 'blur-bg',
    name: 'Blur Background',
    description: 'Apply bokeh blur effect',
    type: 'background-replace',
    options: { backgroundType: 'blur', blurIntensity: 15 },
    icon: 'fa-circle-dot'
  },
  {
    id: 'anime-style',
    name: 'Anime Style',
    description: 'Convert to anime art',
    type: 'style-transfer',
    options: { stylePreset: 'anime', styleStrength: 0.8 },
    icon: 'fa-star'
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    description: 'Classic painted look',
    type: 'style-transfer',
    options: { stylePreset: 'oil-painting', styleStrength: 0.7 },
    icon: 'fa-brush'
  },
  {
    id: 'auto-enhance',
    name: 'Auto Enhance',
    description: 'One-click improvement',
    type: 'auto-enhance',
    options: { outputQuality: 95 },
    icon: 'fa-wand-magic-sparkles'
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate job ID
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get image dimensions from data URL
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Convert file to data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Download image
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Resize image
 */
export function resizeImage(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Create thumbnail
 */
export function createThumbnail(dataUrl: string, size: number = 100): Promise<string> {
  return resizeImage(dataUrl, size, size);
}

/**
 * Apply simple image filter (for preview)
 */
export function applyFilter(
  ctx: CanvasRenderingContext2D,
  filter: string
): void {
  ctx.filter = filter;
}

/**
 * Convert mask strokes to image data
 */
export function strokesToMaskData(
  strokes: MaskStroke[],
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  strokes.forEach(stroke => {
    ctx.strokeStyle = stroke.isEraser ? 'black' : 'white';
    ctx.lineWidth = stroke.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  });

  return canvas.toDataURL('image/png');
}

/**
 * Estimate processing time
 */
export function estimateProcessingTime(type: EnhancementType, imageSize: number): number {
  const baseTimes: Record<EnhancementType, number> = {
    'upscale': 15,
    'background-remove': 8,
    'background-replace': 10,
    'object-remove': 12,
    'style-transfer': 20,
    'colorize': 10,
    'denoise': 5,
    'sharpen': 3,
    'restore': 25,
    'hdr': 8,
    'face-enhance': 15,
    'auto-enhance': 10
  };

  // Adjust for image size (base is 1MB)
  const sizeFactor = Math.max(1, imageSize / (1024 * 1024));
  return Math.round(baseTimes[type] * sizeFactor);
}
