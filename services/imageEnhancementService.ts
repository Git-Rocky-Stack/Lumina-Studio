// ============================================================================
// AI IMAGE ENHANCEMENT - SERVICE
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  EnhancementType,
  EnhancementJob,
  EnhancementOptions,
  EnhancementResult,
  EnhancementHistoryEntry,
  ProcessingStatus,
  MaskStroke,
  generateJobId,
  getImageDimensions,
  createThumbnail,
  strokesToMaskData,
  estimateProcessingTime
} from '../types/imageEnhancement';

// ============================================================================
// IMAGE ENHANCEMENT MANAGER
// ============================================================================

class ImageEnhancementManager {
  private jobs: Map<string, EnhancementJob> = new Map();
  private history: EnhancementHistoryEntry[] = [];
  private listeners: Map<string, Set<(job: EnhancementJob) => void>> = new Map();
  private maxHistorySize = 50;

  constructor() {
    this.loadHistory();
  }

  // --------------------------------------------------------------------------
  // Job Management
  // --------------------------------------------------------------------------

  async createJob(
    type: EnhancementType,
    inputImage: string,
    options: EnhancementOptions = {}
  ): Promise<EnhancementJob> {
    const job: EnhancementJob = {
      id: generateJobId(),
      type,
      status: 'idle',
      progress: 0,
      inputImage,
      options,
      createdAt: Date.now()
    };

    this.jobs.set(job.id, job);
    this.emit(job.id, job);

    return job;
  }

  async processJob(jobId: string): Promise<EnhancementResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    try {
      // Update status to processing
      this.updateJob(jobId, { status: 'processing', progress: 0 });

      // Simulate processing with progress updates
      const result = await this.simulateProcessing(job);

      // Update job with result
      this.updateJob(jobId, {
        status: 'complete',
        progress: 100,
        outputImage: result.outputImage,
        completedAt: Date.now()
      });

      // Add to history
      await this.addToHistory(job, result.outputImage!);

      return result;
    } catch (error: any) {
      this.updateJob(jobId, {
        status: 'error',
        error: error.message
      });

      return {
        jobId,
        success: false,
        error: error.message
      };
    }
  }

  private updateJob(jobId: string, updates: Partial<EnhancementJob>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      this.emit(jobId, job);
    }
  }

  getJob(jobId: string): EnhancementJob | undefined {
    return this.jobs.get(jobId);
  }

  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'processing') {
      this.updateJob(jobId, { status: 'error', error: 'Cancelled by user' });
    }
  }

  // --------------------------------------------------------------------------
  // Processing Simulation (Replace with real API calls)
  // --------------------------------------------------------------------------

  private async simulateProcessing(job: EnhancementJob): Promise<EnhancementResult> {
    const dimensions = await getImageDimensions(job.inputImage);
    const estimatedTime = estimateProcessingTime(job.type, job.inputImage.length);

    // Simulate progress
    const progressInterval = 100;
    const steps = Math.ceil((estimatedTime * 1000) / progressInterval);

    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, progressInterval));
      const progress = Math.min(95, Math.round((i / steps) * 100));
      this.updateJob(job.id, { progress });
    }

    // Apply enhancement based on type
    const outputImage = await this.applyEnhancement(job);

    const outputDimensions = await getImageDimensions(outputImage);

    return {
      jobId: job.id,
      success: true,
      outputImage,
      metadata: {
        originalSize: dimensions,
        outputSize: outputDimensions,
        processingTime: Date.now() - job.createdAt,
        fileSize: outputImage.length
      }
    };
  }

  private async applyEnhancement(job: EnhancementJob): Promise<string> {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = job.inputImage;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    switch (job.type) {
      case 'upscale': {
        const factor = job.options.upscaleFactor || 2;
        canvas.width = img.width * factor;
        canvas.height = img.height * factor;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        break;
      }

      case 'background-remove': {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        // Simulate background removal with transparency
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple threshold-based background removal (demo)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Remove near-white backgrounds
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Set alpha to 0
          }
        }
        ctx.putImageData(imageData, 0, 0);
        break;
      }

      case 'background-replace': {
        canvas.width = img.width;
        canvas.height = img.height;

        if (job.options.backgroundType === 'color') {
          ctx.fillStyle = job.options.backgroundColor || '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (job.options.backgroundType === 'blur') {
          ctx.filter = `blur(${job.options.blurIntensity || 10}px)`;
          ctx.drawImage(img, 0, 0);
          ctx.filter = 'none';
        }
        ctx.drawImage(img, 0, 0);
        break;
      }

      case 'style-transfer': {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const style = job.options.stylePreset;
        const strength = job.options.styleStrength || 0.7;

        // Apply style-based filters
        switch (style) {
          case 'anime':
            ctx.filter = `saturate(${1 + strength}) contrast(${1 + strength * 0.3})`;
            break;
          case 'oil-painting':
            ctx.filter = `saturate(${1.2}) contrast(${1.1})`;
            break;
          case 'watercolor':
            ctx.filter = `saturate(${0.8}) brightness(${1.1})`;
            break;
          case 'sketch':
            ctx.filter = `grayscale(1) contrast(${1.5})`;
            break;
          case 'pop-art':
            ctx.filter = `saturate(${2}) contrast(${1.3})`;
            break;
          case 'cyberpunk':
            ctx.filter = `hue-rotate(180deg) saturate(${1.5})`;
            break;
          case 'vintage':
            ctx.filter = `sepia(${strength}) contrast(${1.1})`;
            break;
          case 'comic':
            ctx.filter = `contrast(${1.4}) saturate(${1.3})`;
            break;
          case 'impressionist':
            ctx.filter = `saturate(${1.3}) blur(0.5px)`;
            break;
          case 'minimalist':
            ctx.filter = `contrast(${1.2}) brightness(${1.05})`;
            break;
        }
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        break;
      }

      case 'colorize': {
        canvas.width = img.width;
        canvas.height = img.height;
        // Convert to grayscale first, then simulate colorization
        ctx.filter = 'grayscale(0.3) sepia(0.3) saturate(1.5)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        break;
      }

      case 'denoise': {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.filter = 'blur(0.5px)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        // Sharpen slightly after blur
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        break;
      }

      case 'sharpen': {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.5;
        ctx.filter = 'contrast(1.2)';
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.filter = 'none';
        break;
      }

      case 'hdr': {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.filter = 'contrast(1.2) saturate(1.3) brightness(1.05)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        break;
      }

      case 'restore': {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        break;
      }

      case 'face-enhance': {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.filter = 'contrast(1.05) brightness(1.02)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        break;
      }

      case 'auto-enhance':
      default: {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.filter = 'contrast(1.1) saturate(1.1) brightness(1.02)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
        break;
      }
    }

    return canvas.toDataURL('image/png', job.options.outputQuality || 0.95);
  }

  // --------------------------------------------------------------------------
  // Object Removal with Mask
  // --------------------------------------------------------------------------

  async removeObject(
    inputImage: string,
    strokes: MaskStroke[]
  ): Promise<EnhancementResult> {
    const dimensions = await getImageDimensions(inputImage);
    const maskData = strokesToMaskData(strokes, dimensions.width, dimensions.height);

    const job = await this.createJob('object-remove', inputImage, {
      maskData,
      inpaintingStrength: 0.8
    });

    return this.processJob(job.id);
  }

  // --------------------------------------------------------------------------
  // History Management
  // --------------------------------------------------------------------------

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem('lumina_enhancement_history');
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load enhancement history:', e);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('lumina_enhancement_history', JSON.stringify(this.history));
    } catch (e) {
      console.error('Failed to save enhancement history:', e);
    }
  }

  private async addToHistory(job: EnhancementJob, outputImage: string): Promise<void> {
    const inputThumbnail = await createThumbnail(job.inputImage);
    const outputThumbnail = await createThumbnail(outputImage);

    const entry: EnhancementHistoryEntry = {
      id: job.id,
      type: job.type,
      inputThumbnail,
      outputThumbnail,
      timestamp: Date.now(),
      options: job.options
    };

    this.history.unshift(entry);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }

    this.saveHistory();
  }

  getHistory(): EnhancementHistoryEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  // --------------------------------------------------------------------------
  // Event System
  // --------------------------------------------------------------------------

  subscribe(jobId: string, callback: (job: EnhancementJob) => void): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(callback);

    return () => {
      this.listeners.get(jobId)?.delete(callback);
    };
  }

  private emit(jobId: string, job: EnhancementJob): void {
    this.listeners.get(jobId)?.forEach(callback => callback(job));
  }

  // --------------------------------------------------------------------------
  // Quick Actions
  // --------------------------------------------------------------------------

  async quickUpscale(inputImage: string, factor: 2 | 4 = 2): Promise<EnhancementResult> {
    const job = await this.createJob('upscale', inputImage, { upscaleFactor: factor });
    return this.processJob(job.id);
  }

  async quickRemoveBackground(inputImage: string): Promise<EnhancementResult> {
    const job = await this.createJob('background-remove', inputImage, {
      backgroundType: 'transparent'
    });
    return this.processJob(job.id);
  }

  async quickStyleTransfer(inputImage: string, style: string): Promise<EnhancementResult> {
    const job = await this.createJob('style-transfer', inputImage, {
      stylePreset: style as any,
      styleStrength: 0.8
    });
    return this.processJob(job.id);
  }

  async quickAutoEnhance(inputImage: string): Promise<EnhancementResult> {
    const job = await this.createJob('auto-enhance', inputImage, {});
    return this.processJob(job.id);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const imageEnhancementManager = new ImageEnhancementManager();

// ============================================================================
// REACT HOOK
// ============================================================================

export function useImageEnhancement() {
  const [currentJob, setCurrentJob] = useState<EnhancementJob | null>(null);
  const [history, setHistory] = useState<EnhancementHistoryEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setHistory(imageEnhancementManager.getHistory());
  }, []);

  const enhance = useCallback(async (
    type: EnhancementType,
    inputImage: string,
    options?: EnhancementOptions
  ) => {
    setIsProcessing(true);

    try {
      const job = await imageEnhancementManager.createJob(type, inputImage, options);
      setCurrentJob(job);

      const unsubscribe = imageEnhancementManager.subscribe(job.id, (updatedJob) => {
        setCurrentJob({ ...updatedJob });
      });

      const result = await imageEnhancementManager.processJob(job.id);

      unsubscribe();
      setHistory(imageEnhancementManager.getHistory());
      setIsProcessing(false);

      return result;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, []);

  const quickUpscale = useCallback(async (inputImage: string, factor: 2 | 4 = 2) => {
    setIsProcessing(true);
    const result = await imageEnhancementManager.quickUpscale(inputImage, factor);
    setHistory(imageEnhancementManager.getHistory());
    setIsProcessing(false);
    return result;
  }, []);

  const quickRemoveBackground = useCallback(async (inputImage: string) => {
    setIsProcessing(true);
    const result = await imageEnhancementManager.quickRemoveBackground(inputImage);
    setHistory(imageEnhancementManager.getHistory());
    setIsProcessing(false);
    return result;
  }, []);

  const quickStyleTransfer = useCallback(async (inputImage: string, style: string) => {
    setIsProcessing(true);
    const result = await imageEnhancementManager.quickStyleTransfer(inputImage, style);
    setHistory(imageEnhancementManager.getHistory());
    setIsProcessing(false);
    return result;
  }, []);

  const quickAutoEnhance = useCallback(async (inputImage: string) => {
    setIsProcessing(true);
    const result = await imageEnhancementManager.quickAutoEnhance(inputImage);
    setHistory(imageEnhancementManager.getHistory());
    setIsProcessing(false);
    return result;
  }, []);

  const clearHistory = useCallback(() => {
    imageEnhancementManager.clearHistory();
    setHistory([]);
  }, []);

  return {
    currentJob,
    history,
    isProcessing,
    enhance,
    quickUpscale,
    quickRemoveBackground,
    quickStyleTransfer,
    quickAutoEnhance,
    clearHistory
  };
}
