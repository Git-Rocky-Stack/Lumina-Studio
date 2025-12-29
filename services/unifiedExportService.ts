// ============================================================================
// UNIFIED EXPORT PIPELINE SERVICE
// ============================================================================

import { getAIClient } from './geminiService';
import { Type } from '@google/genai';
import {
  ExportPlatform,
  ExportQuality,
  PLATFORM_CONFIGS,
  QUALITY_SETTINGS
} from '../types/export';
import type {
  ExportFormat,
  ExportJob,
  BatchExportConfig,
  QualityAnalysis,
  QualityIssue,
  PlatformConfig,
  ExportHistoryEntry,
  FileNameOptions,
  WatermarkOptions
} from '../types/export';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID
 */
const generateId = () => `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Get platform configuration
 */
export const getPlatformConfig = (platform: ExportPlatform): PlatformConfig => {
  return PLATFORM_CONFIGS.find(p => p.id === platform) || PLATFORM_CONFIGS.find(p => p.id === ExportPlatform.CUSTOM)!;
};

/**
 * Get recommended format for platform
 */
export const getRecommendedFormat = (platform: ExportPlatform): ExportFormat => {
  const config = getPlatformConfig(platform);
  return config.recommendedFormat;
};

/**
 * Get optimal dimensions for platform
 */
export const getOptimalDimensions = (
  platform: ExportPlatform,
  sourceWidth?: number,
  sourceHeight?: number
): { width: number; height: number } => {
  const config = getPlatformConfig(platform);

  if (platform === ExportPlatform.ORIGINAL && sourceWidth && sourceHeight) {
    return { width: sourceWidth, height: sourceHeight };
  }

  return { width: config.width, height: config.height };
};

/**
 * Generate smart filename
 */
export const generateFileName = (options: FileNameOptions): string => {
  const parts: string[] = [];

  if (options.prefix) parts.push(options.prefix);

  // Sanitize base name
  const baseName = options.baseName
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 50);

  parts.push(baseName);

  // Add platform suffix
  if (options.platform && options.platform !== ExportPlatform.CUSTOM) {
    parts.push(options.platform.replace(/_/g, '-'));
  }

  // Add dimensions
  if (options.width && options.height) {
    parts.push(`${options.width}x${options.height}`);
  }

  // Add date/timestamp
  if (options.includeDate) {
    const date = new Date();
    parts.push(date.toISOString().split('T')[0] ?? 'unknown');
  }

  if (options.includeTimestamp) {
    parts.push(Date.now().toString(36));
  }

  if (options.suffix) parts.push(options.suffix);

  return `${parts.join('_')}.${options.format}`;
};

/**
 * Calculate estimated file size
 */
export const estimateFileSize = (
  width: number,
  height: number,
  format: ExportFormat,
  quality: ExportQuality
): { size: number; unit: string } => {
  const pixels = width * height;
  const qualityMultiplier = QUALITY_SETTINGS[quality].quality / 100;

  let bytesPerPixel: number;

  switch (format) {
    case 'png':
      bytesPerPixel = 3; // Lossless
      break;
    case 'jpg':
      bytesPerPixel = 0.3 * qualityMultiplier + 0.1;
      break;
    case 'webp':
      bytesPerPixel = 0.2 * qualityMultiplier + 0.05;
      break;
    case 'avif':
      bytesPerPixel = 0.15 * qualityMultiplier + 0.03;
      break;
    case 'svg':
      bytesPerPixel = 0.01;
      break;
    case 'gif':
      bytesPerPixel = 1;
      break;
    case 'pdf':
      bytesPerPixel = 0.5;
      break;
    default:
      bytesPerPixel = 0.3;
  }

  const bytes = pixels * bytesPerPixel;

  if (bytes < 1024) {
    return { size: Math.round(bytes), unit: 'B' };
  } else if (bytes < 1024 * 1024) {
    return { size: Math.round(bytes / 1024), unit: 'KB' };
  } else {
    return { size: Math.round(bytes / (1024 * 1024) * 10) / 10, unit: 'MB' };
  }
};

// ============================================================================
// AI QUALITY ANALYSIS
// ============================================================================

/**
 * Analyze export quality before processing
 */
export async function analyzeExportQuality(
  imageData: string,
  targetPlatform: ExportPlatform,
  targetWidth: number,
  targetHeight: number
): Promise<QualityAnalysis> {
  const config = getPlatformConfig(targetPlatform);

  try {
    const ai = getAIClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageData.replace(/^data:image\/\w+;base64,/, ''),
              mimeType: 'image/png'
            }
          },
          {
            text: `Analyze this image for export to ${config.label} (${targetWidth}x${targetHeight}px).

Evaluate:
1. Resolution adequacy (will it look pixelated at target size?)
2. Color contrast and visibility
3. Text readability (if any text present)
4. Composition and safe zones
5. Estimated file size appropriateness

Return JSON with:
- overallScore (0-100)
- issues: array of {severity, category, message, suggestion, autoFixable}
- suggestions: array of improvement tips
- metrics: {resolution, colorContrast, textReadability, composition, fileSize} each with score and message`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING },
                  category: { type: Type.STRING },
                  message: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  autoFixable: { type: Type.BOOLEAN }
                }
              }
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            metrics: { type: Type.OBJECT }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');

    return {
      overallScore: result.overallScore || 75,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      metrics: result.metrics || {
        resolution: { score: 80, message: 'Resolution appears adequate' },
        colorContrast: { score: 85, message: 'Good color contrast' },
        textReadability: { score: 90, message: 'Text is readable' },
        composition: { score: 80, message: 'Good composition' },
        fileSize: { score: 85, message: 'File size is appropriate' }
      },
      platformCompatibility: [{
        platform: targetPlatform,
        compatible: result.overallScore >= 60,
        issues: result.issues?.filter((i: any) => i.severity === 'error').map((i: any) => i.message) || []
      }]
    };

  } catch (error) {
    console.error('Quality analysis failed:', error);

    // Return basic analysis without AI
    return performBasicQualityCheck(targetWidth, targetHeight, config);
  }
}

/**
 * Basic quality check without AI
 */
function performBasicQualityCheck(
  targetWidth: number,
  targetHeight: number,
  config: PlatformConfig
): QualityAnalysis {
  const issues: QualityIssue[] = [];
  let overallScore = 100;

  // Check resolution
  if (targetWidth < config.width * 0.5 || targetHeight < config.height * 0.5) {
    issues.push({
      severity: 'error',
      category: 'resolution',
      message: 'Source resolution is too low for this platform',
      suggestion: `Use an image at least ${config.width}x${config.height}px`,
      autoFixable: false
    });
    overallScore -= 30;
  } else if (targetWidth < config.width || targetHeight < config.height) {
    issues.push({
      severity: 'warning',
      category: 'resolution',
      message: 'Image will be upscaled slightly',
      suggestion: 'Consider using a higher resolution source',
      autoFixable: false
    });
    overallScore -= 10;
  }

  // Check file size constraint
  if (config.maxFileSize) {
    const estimated = estimateFileSize(config.width, config.height, config.recommendedFormat, ExportQuality.STANDARD);
    if (estimated.unit === 'MB' && estimated.size * 1024 > config.maxFileSize) {
      issues.push({
        severity: 'warning',
        category: 'size',
        message: `File may exceed ${config.maxFileSize}KB limit`,
        suggestion: 'Consider reducing quality or using a more compressed format',
        autoFixable: true
      });
      overallScore -= 5;
    }
  }

  return {
    overallScore: Math.max(0, overallScore),
    issues,
    suggestions: [
      'Preview your export before finalizing',
      'Use the recommended format for best results'
    ],
    metrics: {
      resolution: { score: overallScore, message: issues.find(i => i.category === 'resolution')?.message || 'Good resolution' },
      colorContrast: { score: 85, message: 'Color contrast not analyzed' },
      textReadability: { score: 85, message: 'Text readability not analyzed' },
      composition: { score: 85, message: 'Composition not analyzed' },
      fileSize: { score: issues.find(i => i.category === 'size') ? 70 : 90, message: 'File size acceptable' }
    },
    platformCompatibility: [{
      platform: config.id,
      compatible: overallScore >= 60,
      issues: issues.filter(i => i.severity === 'error').map(i => i.message)
    }]
  };
}

// ============================================================================
// CANVAS TO IMAGE CONVERSION
// ============================================================================

/**
 * Convert canvas/content to image blob
 */
export async function convertToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = getMimeType(format);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality / 100
    );
  });
}

/**
 * Get MIME type for format
 */
export const getMimeType = (format: ExportFormat): string => {
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    json: 'application/json',
    csv: 'text/csv',
    xml: 'application/xml'
  };
  return mimeTypes[format] || 'application/octet-stream';
};

/**
 * Resize canvas to target dimensions
 */
export function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio: boolean = true
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');

  let width = targetWidth;
  let height = targetHeight;

  if (maintainAspectRatio) {
    const sourceRatio = sourceCanvas.width / sourceCanvas.height;
    const targetRatio = targetWidth / targetHeight;

    if (sourceRatio > targetRatio) {
      height = Math.round(targetWidth / sourceRatio);
    } else {
      width = Math.round(targetHeight * sourceRatio);
    }
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d')!;

  // Center the image
  const x = (targetWidth - width) / 2;
  const y = (targetHeight - height) / 2;

  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(sourceCanvas, x, y, width, height);

  return canvas;
}

/**
 * Apply watermark to canvas
 */
export function applyWatermark(
  canvas: HTMLCanvasElement,
  options: WatermarkOptions
): HTMLCanvasElement {
  if (!options.enabled) return canvas;

  const ctx = canvas.getContext('2d')!;
  ctx.globalAlpha = options.opacity;

  const padding = options.padding;
  const size = (canvas.width * options.size) / 100;

  let x = 0, y = 0;

  switch (options.position) {
    case 'top-left':
      x = padding;
      y = padding + size;
      break;
    case 'top-right':
      x = canvas.width - padding;
      y = padding + size;
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - padding;
      break;
    case 'bottom-right':
      x = canvas.width - padding;
      y = canvas.height - padding;
      break;
    case 'center':
      x = canvas.width / 2;
      y = canvas.height / 2;
      break;
  }

  if (options.type === 'text') {
    ctx.font = `${size}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    const textAlign = options.position.includes('right') ? 'right' :
                      options.position === 'center' ? 'center' : 'left';
    ctx.textAlign = textAlign as CanvasTextAlign;

    ctx.strokeText(options.content, x, y);
    ctx.fillText(options.content, x, y);
  }

  ctx.globalAlpha = 1;
  return canvas;
}

// ============================================================================
// EXPORT EXECUTION
// ============================================================================

/**
 * Execute single export job
 */
export async function executeExport(job: ExportJob): Promise<ExportJob> {
  let updatedJob: ExportJob = { ...job, status: 'processing', progress: 0 };

  try {
    const config = getPlatformConfig(job.platform);
    const targetWidth = job.width || config.width;
    const targetHeight = job.height || config.height;
    const quality = QUALITY_SETTINGS[job.quality].quality;

    // Create canvas from source
    let canvas: HTMLCanvasElement;

    if (job.sourceType === 'canvas' && job.sourceData instanceof HTMLCanvasElement) {
      canvas = job.sourceData;
    } else if (job.sourceType === 'image' && typeof job.sourceData === 'string') {
      canvas = await imageToCanvas(job.sourceData);
    } else {
      throw new Error(`Unsupported source type: ${job.sourceType}`);
    }

    updatedJob.progress = 20;

    // Resize if needed
    if (targetWidth > 0 && targetHeight > 0) {
      canvas = resizeCanvas(canvas, targetWidth, targetHeight, job.maintainAspectRatio ?? true);
    }

    updatedJob.progress = 40;

    // Apply watermark if configured
    if (job.watermark) {
      canvas = applyWatermark(canvas, job.watermark);
    }

    updatedJob.progress = 60;

    // Convert to blob
    const blob = await convertToBlob(canvas, job.format, quality);

    updatedJob.progress = 80;

    // Handle destination
    if (job.destination === 'download') {
      const url = URL.createObjectURL(blob);
      downloadBlob(url, job.fileName);
      URL.revokeObjectURL(url);
      updatedJob.resultUrl = 'downloaded';
    } else if (job.destination === 'clipboard') {
      await copyToClipboard(blob);
      updatedJob.resultUrl = 'clipboard';
    } else if (job.destination === 'cloud') {
      updatedJob.resultUrl = await uploadToCloud(blob, job.fileName, job.cloudService);
    }

    updatedJob.resultSize = blob.size;
    updatedJob.progress = 100;
    updatedJob.status = 'completed';
    updatedJob.completedAt = new Date().toISOString();

    return updatedJob;

  } catch (error) {
    console.error('Export failed:', error);
    return {
      ...updatedJob,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Export failed',
      progress: 0
    };
  }
}

/**
 * Convert image URL to canvas
 */
async function imageToCanvas(imageUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Download blob as file
 */
function downloadBlob(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy image to clipboard
 */
async function copyToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('Clipboard API not supported');
  }

  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob })
  ]);
}

/**
 * Upload to cloud storage (stub - integrate with actual services)
 */
async function uploadToCloud(
  blob: Blob,
  fileName: string,
  service?: 'google_drive' | 'dropbox' | 'one_drive'
): Promise<string> {
  // This would integrate with actual cloud APIs
  console.log(`Uploading ${fileName} (${blob.size} bytes) to ${service}...`);

  // Simulate upload
  await new Promise(resolve => setTimeout(resolve, 2000));

  return `https://cloud.example.com/${fileName}`;
}

// ============================================================================
// BATCH EXPORT
// ============================================================================

/**
 * Execute batch export
 */
export async function executeBatchExport(config: BatchExportConfig): Promise<ExportJob[]> {
  const results: ExportJob[] = [];
  const queue = [...config.jobs];

  const processJob = async (job: ExportJob): Promise<void> => {
    try {
      const result = await executeExport(job);
      results.push(result);
      config.onJobComplete?.(result);
    } catch (error) {
      const failedJob = { ...job, status: 'failed' as const, error: String(error) };
      results.push(failedJob);
      config.onError?.(failedJob, error as Error);
    }
  };

  // Process in parallel with limit
  while (queue.length > 0) {
    const batch = queue.splice(0, config.parallelLimit);
    await Promise.all(batch.map(processJob));
  }

  config.onAllComplete?.(results);
  return results;
}

// ============================================================================
// EXPORT JOB FACTORY
// ============================================================================

/**
 * Create export job with smart defaults
 */
export function createExportJob(
  sourceType: ExportJob['sourceType'],
  sourceData: any,
  sourceName: string,
  platform: ExportPlatform,
  overrides: Partial<ExportJob> = {}
): ExportJob {
  const config = getPlatformConfig(platform);
  const format = overrides.format || config.recommendedFormat;

  return {
    id: generateId(),
    sourceType,
    sourceData,
    sourceName,
    platform,
    format,
    quality: overrides.quality || ExportQuality.HIGH,
    width: overrides.width || config.width,
    height: overrides.height || config.height,
    maintainAspectRatio: overrides.maintainAspectRatio ?? true,
    colorSpace: overrides.colorSpace || config.colorSpace,
    dpi: overrides.dpi || config.dpi,
    transparentBackground: overrides.transparentBackground ?? false,
    embedMetadata: overrides.embedMetadata ?? true,
    watermark: overrides.watermark,
    fileName: overrides.fileName || generateFileName({
      baseName: sourceName,
      platform,
      format,
      width: config.width,
      height: config.height,
      includeDate: true
    }),
    autoName: overrides.autoName ?? true,
    destination: overrides.destination || 'download',
    cloudService: overrides.cloudService,
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString()
  };
}

// ============================================================================
// EXPORT HISTORY
// ============================================================================

const HISTORY_KEY = 'lumina_export_history';
const MAX_HISTORY = 50;

/**
 * Save export to history
 */
export function saveToHistory(job: ExportJob, thumbnail?: string): void {
  const history = getExportHistory();

  const entry: ExportHistoryEntry = {
    id: job.id,
    job,
    thumbnail,
    downloadUrl: job.resultUrl,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  };

  history.unshift(entry);

  // Limit history size
  if (history.length > MAX_HISTORY) {
    history.splice(MAX_HISTORY);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Get export history
 */
export function getExportHistory(): ExportHistoryEntry[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Clear export history
 */
export function clearExportHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Configuration
  getPlatformConfig,
  getRecommendedFormat,
  getOptimalDimensions,
  generateFileName,
  estimateFileSize,

  // Quality analysis
  analyzeExportQuality,

  // Conversion
  convertToBlob,
  resizeCanvas,
  applyWatermark,

  // Execution
  executeExport,
  executeBatchExport,
  createExportJob,

  // History
  saveToHistory,
  getExportHistory,
  clearExportHistory
};
