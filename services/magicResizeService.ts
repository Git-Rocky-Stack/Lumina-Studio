// =============================================
// Magic Resize Service
// Smart canvas resizing with content-aware adjustments
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export interface ResizePreset {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  category: 'social' | 'print' | 'web' | 'video' | 'custom';
  platform?: string;
  width: number;
  height: number;
  aspect_ratio?: string;
  resize_mode: 'smart' | 'crop' | 'fit' | 'fill' | 'stretch';
  anchor_point: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  scale_text: boolean;
  maintain_hierarchy: boolean;
  crop_images: boolean;
  icon?: string;
  sort_order: number;
  is_featured: boolean;
}

export interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  fill?: string | any;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  text?: string;
  src?: string;
  children?: CanvasElement[];
  locked?: boolean;
  visible?: boolean;
  zIndex?: number;
  // Smart resize metadata
  importance?: 'high' | 'medium' | 'low';
  anchorTo?: 'center' | 'edge' | 'relative';
}

export interface ResizeResult {
  preset_id: string;
  preset_name: string;
  width: number;
  height: number;
  canvas_data: CanvasElement[];
  thumbnail_url?: string;
}

export interface ResizeJob {
  id: string;
  user_id: string;
  source_project_id?: string;
  source_canvas_data: CanvasElement[];
  target_presets: string[];
  custom_sizes: Array<{ width: number; height: number; name?: string }>;
  resize_mode: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: ResizeResult[];
  created_at: string;
  completed_at?: string;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

// =============================================
// Magic Resize Service Class
// =============================================

class MagicResizeService {
  // =============================================
  // Preset Management
  // =============================================

  async getPresets(category?: string): Promise<ResizePreset[]> {
    let query = supabase
      .from('resize_presets')
      .select('*')
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch presets:', error);
      return [];
    }

    return data || [];
  }

  async getFeaturedPresets(): Promise<ResizePreset[]> {
    const { data, error } = await supabase
      .from('resize_presets')
      .select('*')
      .eq('is_featured', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch featured presets:', error);
      return [];
    }

    return data || [];
  }

  async getPresetsByPlatform(platform: string): Promise<ResizePreset[]> {
    const { data, error } = await supabase
      .from('resize_presets')
      .select('*')
      .eq('platform', platform)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch platform presets:', error);
      return [];
    }

    return data || [];
  }

  async createCustomPreset(preset: Partial<ResizePreset>): Promise<ResizePreset | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('resize_presets')
      .insert({
        ...preset,
        user_id: user.id,
        category: 'custom',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create preset:', error);
      return null;
    }

    return data;
  }

  async deleteCustomPreset(presetId: string): Promise<boolean> {
    const { error } = await supabase
      .from('resize_presets')
      .delete()
      .eq('id', presetId);

    if (error) {
      console.error('Failed to delete preset:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // Smart Resize Operations
  // =============================================

  async resizeCanvas(
    elements: CanvasElement[],
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    options: {
      mode?: 'smart' | 'crop' | 'fit' | 'fill' | 'stretch';
      anchor?: string;
      scaleText?: boolean;
      maintainHierarchy?: boolean;
    } = {}
  ): Promise<CanvasElement[]> {
    const {
      mode = 'smart',
      anchor = 'center',
      scaleText = true,
      maintainHierarchy = true,
    } = options;

    // Calculate scale factors
    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;

    switch (mode) {
      case 'stretch':
        return this.stretchResize(elements, scaleX, scaleY);

      case 'fit':
        return this.fitResize(elements, sourceWidth, sourceHeight, targetWidth, targetHeight);

      case 'fill':
        return this.fillResize(elements, sourceWidth, sourceHeight, targetWidth, targetHeight, anchor);

      case 'crop':
        return this.cropResize(elements, sourceWidth, sourceHeight, targetWidth, targetHeight, anchor);

      case 'smart':
      default:
        return this.smartResize(
          elements,
          sourceWidth,
          sourceHeight,
          targetWidth,
          targetHeight,
          { scaleText, maintainHierarchy }
        );
    }
  }

  // Stretch resize - simple proportional scaling
  private stretchResize(
    elements: CanvasElement[],
    scaleX: number,
    scaleY: number
  ): CanvasElement[] {
    return elements.map(el => this.scaleElement(el, scaleX, scaleY, true));
  }

  // Fit resize - maintain aspect ratio, letterbox if needed
  private fitResize(
    elements: CanvasElement[],
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): CanvasElement[] {
    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = targetWidth / targetHeight;

    let scale: number;
    let offsetX = 0;
    let offsetY = 0;

    if (sourceAspect > targetAspect) {
      // Source is wider - fit to width
      scale = targetWidth / sourceWidth;
      offsetY = (targetHeight - sourceHeight * scale) / 2;
    } else {
      // Source is taller - fit to height
      scale = targetHeight / sourceHeight;
      offsetX = (targetWidth - sourceWidth * scale) / 2;
    }

    return elements.map(el => {
      const scaled = this.scaleElement(el, scale, scale, true);
      return {
        ...scaled,
        x: scaled.x + offsetX,
        y: scaled.y + offsetY,
      };
    });
  }

  // Fill resize - maintain aspect ratio, crop to fill
  private fillResize(
    elements: CanvasElement[],
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    anchor: string
  ): CanvasElement[] {
    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = targetWidth / targetHeight;

    let scale: number;

    if (sourceAspect > targetAspect) {
      // Source is wider - fit to height, crop sides
      scale = targetHeight / sourceHeight;
    } else {
      // Source is taller - fit to width, crop top/bottom
      scale = targetWidth / sourceWidth;
    }

    const scaledWidth = sourceWidth * scale;
    const scaledHeight = sourceHeight * scale;

    // Calculate offset based on anchor
    const { offsetX, offsetY } = this.calculateAnchorOffset(
      scaledWidth,
      scaledHeight,
      targetWidth,
      targetHeight,
      anchor
    );

    return elements.map(el => {
      const scaled = this.scaleElement(el, scale, scale, true);
      return {
        ...scaled,
        x: scaled.x + offsetX,
        y: scaled.y + offsetY,
      };
    });
  }

  // Crop resize - crop from specified anchor point
  private cropResize(
    elements: CanvasElement[],
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    anchor: string
  ): CanvasElement[] {
    const { offsetX, offsetY } = this.calculateAnchorOffset(
      sourceWidth,
      sourceHeight,
      targetWidth,
      targetHeight,
      anchor
    );

    return elements
      .map(el => ({
        ...el,
        x: el.x + offsetX,
        y: el.y + offsetY,
      }))
      .filter(el => this.isElementVisible(el, targetWidth, targetHeight));
  }

  // Smart resize - content-aware intelligent resizing
  private smartResize(
    elements: CanvasElement[],
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    options: { scaleText: boolean; maintainHierarchy: boolean }
  ): CanvasElement[] {
    // Analyze content layout
    const contentBounds = this.calculateContentBounds(elements);
    const layout = this.analyzeLayout(elements, sourceWidth, sourceHeight);

    // Calculate optimal transformation
    const transformation = this.calculateSmartTransformation(
      contentBounds,
      layout,
      sourceWidth,
      sourceHeight,
      targetWidth,
      targetHeight
    );

    // Apply transformations with content awareness
    return elements.map(el => {
      const importance = el.importance || this.inferImportance(el, layout);

      return this.applySmartTransformation(
        el,
        transformation,
        importance,
        options
      );
    });
  }

  // =============================================
  // Layout Analysis
  // =============================================

  private calculateContentBounds(elements: CanvasElement[]): BoundingBox {
    if (elements.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(el => {
      if (el.visible === false) return;

      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private analyzeLayout(
    elements: CanvasElement[],
    canvasWidth: number,
    canvasHeight: number
  ): {
    hasHeader: boolean;
    hasFooter: boolean;
    hasCenteredContent: boolean;
    hasBackground: boolean;
    primaryElement?: CanvasElement;
    textElements: CanvasElement[];
    imageElements: CanvasElement[];
  } {
    const textElements = elements.filter(el => el.type === 'text');
    const imageElements = elements.filter(el => el.type === 'image');

    // Check for header (element in top 20%)
    const hasHeader = elements.some(el =>
      el.y < canvasHeight * 0.2 && el.width > canvasWidth * 0.3
    );

    // Check for footer (element in bottom 20%)
    const hasFooter = elements.some(el =>
      el.y + el.height > canvasHeight * 0.8 && el.width > canvasWidth * 0.3
    );

    // Check for centered content
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const hasCenteredContent = elements.some(el => {
      const elCenterX = el.x + el.width / 2;
      const elCenterY = el.y + el.height / 2;
      const distFromCenter = Math.sqrt(
        Math.pow(elCenterX - centerX, 2) + Math.pow(elCenterY - centerY, 2)
      );
      return distFromCenter < Math.min(canvasWidth, canvasHeight) * 0.2;
    });

    // Check for background (full-size element)
    const hasBackground = elements.some(el =>
      el.width >= canvasWidth * 0.95 && el.height >= canvasHeight * 0.95
    );

    // Find primary element (largest non-background element)
    const nonBackgroundElements = elements.filter(el =>
      !(el.width >= canvasWidth * 0.95 && el.height >= canvasHeight * 0.95)
    );
    const primaryElement = nonBackgroundElements.reduce((largest, el) => {
      if (!largest) return el;
      const area = el.width * el.height;
      const largestArea = largest.width * largest.height;
      return area > largestArea ? el : largest;
    }, null as CanvasElement | null);

    return {
      hasHeader,
      hasFooter,
      hasCenteredContent,
      hasBackground,
      primaryElement: primaryElement || undefined,
      textElements,
      imageElements,
    };
  }

  private inferImportance(
    element: CanvasElement,
    layout: ReturnType<typeof this.analyzeLayout>
  ): 'high' | 'medium' | 'low' {
    // Primary element is high importance
    if (layout.primaryElement?.id === element.id) return 'high';

    // Text is usually important
    if (element.type === 'text') {
      const fontSize = element.fontSize || 16;
      if (fontSize >= 24) return 'high';
      if (fontSize >= 16) return 'medium';
      return 'low';
    }

    // Large images are important
    if (element.type === 'image') {
      const area = element.width * element.height;
      if (area > 10000) return 'high';
      if (area > 5000) return 'medium';
    }

    return 'medium';
  }

  // =============================================
  // Transformation Calculations
  // =============================================

  private calculateSmartTransformation(
    contentBounds: BoundingBox,
    layout: ReturnType<typeof this.analyzeLayout>,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): {
    scaleX: number;
    scaleY: number;
    offsetX: number;
    offsetY: number;
    uniformScale: number;
  } {
    // Calculate uniform scale to fit content
    const contentAspect = contentBounds.width / contentBounds.height;
    const targetAspect = targetWidth / targetHeight;

    let uniformScale: number;
    if (contentAspect > targetAspect) {
      uniformScale = targetWidth / contentBounds.width;
    } else {
      uniformScale = targetHeight / contentBounds.height;
    }

    // Don't scale up too much
    uniformScale = Math.min(uniformScale, 1.5);

    // Calculate offsets to center content
    const scaledContentWidth = contentBounds.width * uniformScale;
    const scaledContentHeight = contentBounds.height * uniformScale;

    const offsetX = (targetWidth - scaledContentWidth) / 2 - contentBounds.minX * uniformScale;
    const offsetY = (targetHeight - scaledContentHeight) / 2 - contentBounds.minY * uniformScale;

    return {
      scaleX: uniformScale,
      scaleY: uniformScale,
      offsetX,
      offsetY,
      uniformScale,
    };
  }

  private applySmartTransformation(
    element: CanvasElement,
    transformation: {
      scaleX: number;
      scaleY: number;
      offsetX: number;
      offsetY: number;
      uniformScale: number;
    },
    importance: 'high' | 'medium' | 'low',
    options: { scaleText: boolean; maintainHierarchy: boolean }
  ): CanvasElement {
    const { scaleX, scaleY, offsetX, offsetY, uniformScale } = transformation;

    // Base transformation
    let newElement: CanvasElement = {
      ...element,
      x: element.x * scaleX + offsetX,
      y: element.y * scaleY + offsetY,
      width: element.width * scaleX,
      height: element.height * scaleY,
    };

    // Handle text scaling
    if (element.type === 'text' && element.fontSize) {
      if (options.scaleText) {
        // Scale text but maintain readability
        let scaledFontSize = element.fontSize * uniformScale;

        // Apply importance-based minimum
        const minFontSize = importance === 'high' ? 14 : importance === 'medium' ? 12 : 10;
        scaledFontSize = Math.max(scaledFontSize, minFontSize);

        newElement.fontSize = Math.round(scaledFontSize);
      }
    }

    // Handle children recursively
    if (element.children && element.children.length > 0) {
      newElement.children = element.children.map(child =>
        this.applySmartTransformation(child, transformation, importance, options)
      );
    }

    return newElement;
  }

  private calculateAnchorOffset(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    anchor: string
  ): { offsetX: number; offsetY: number } {
    let offsetX = 0;
    let offsetY = 0;

    const diffX = targetWidth - sourceWidth;
    const diffY = targetHeight - sourceHeight;

    switch (anchor) {
      case 'top-left':
        offsetX = 0;
        offsetY = 0;
        break;
      case 'top':
        offsetX = diffX / 2;
        offsetY = 0;
        break;
      case 'top-right':
        offsetX = diffX;
        offsetY = 0;
        break;
      case 'left':
        offsetX = 0;
        offsetY = diffY / 2;
        break;
      case 'center':
        offsetX = diffX / 2;
        offsetY = diffY / 2;
        break;
      case 'right':
        offsetX = diffX;
        offsetY = diffY / 2;
        break;
      case 'bottom-left':
        offsetX = 0;
        offsetY = diffY;
        break;
      case 'bottom':
        offsetX = diffX / 2;
        offsetY = diffY;
        break;
      case 'bottom-right':
        offsetX = diffX;
        offsetY = diffY;
        break;
    }

    return { offsetX, offsetY };
  }

  private scaleElement(
    element: CanvasElement,
    scaleX: number,
    scaleY: number,
    scaleText: boolean
  ): CanvasElement {
    const scaled: CanvasElement = {
      ...element,
      x: element.x * scaleX,
      y: element.y * scaleY,
      width: element.width * scaleX,
      height: element.height * scaleY,
    };

    if (element.type === 'text' && element.fontSize && scaleText) {
      const avgScale = (scaleX + scaleY) / 2;
      scaled.fontSize = Math.round(element.fontSize * avgScale);
    }

    if (element.strokeWidth) {
      const avgScale = (scaleX + scaleY) / 2;
      scaled.strokeWidth = element.strokeWidth * avgScale;
    }

    if (element.children) {
      scaled.children = element.children.map(child =>
        this.scaleElement(child, scaleX, scaleY, scaleText)
      );
    }

    return scaled;
  }

  private isElementVisible(
    element: CanvasElement,
    canvasWidth: number,
    canvasHeight: number
  ): boolean {
    // Check if element is at least partially visible
    return (
      element.x < canvasWidth &&
      element.y < canvasHeight &&
      element.x + element.width > 0 &&
      element.y + element.height > 0
    );
  }

  // =============================================
  // Batch Resize Operations
  // =============================================

  async resizeToMultipleFormats(
    elements: CanvasElement[],
    sourceWidth: number,
    sourceHeight: number,
    presetIds: string[],
    customSizes: Array<{ width: number; height: number; name?: string }> = []
  ): Promise<ResizeResult[]> {
    const results: ResizeResult[] = [];

    // Get presets
    const presets = await this.getPresets();
    const selectedPresets = presets.filter(p => presetIds.includes(p.id));

    // Process presets
    for (const preset of selectedPresets) {
      const resizedElements = await this.resizeCanvas(
        elements,
        sourceWidth,
        sourceHeight,
        preset.width,
        preset.height,
        {
          mode: preset.resize_mode,
          anchor: preset.anchor_point,
          scaleText: preset.scale_text,
          maintainHierarchy: preset.maintain_hierarchy,
        }
      );

      results.push({
        preset_id: preset.id,
        preset_name: preset.name,
        width: preset.width,
        height: preset.height,
        canvas_data: resizedElements,
      });
    }

    // Process custom sizes
    for (const custom of customSizes) {
      const resizedElements = await this.resizeCanvas(
        elements,
        sourceWidth,
        sourceHeight,
        custom.width,
        custom.height,
        { mode: 'smart' }
      );

      results.push({
        preset_id: `custom-${custom.width}x${custom.height}`,
        preset_name: custom.name || `${custom.width}x${custom.height}`,
        width: custom.width,
        height: custom.height,
        canvas_data: resizedElements,
      });
    }

    return results;
  }

  async createResizeJob(
    sourceCanvasData: CanvasElement[],
    presetIds: string[],
    customSizes: Array<{ width: number; height: number; name?: string }> = [],
    sourceProjectId?: string
  ): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('resize_jobs')
      .insert({
        user_id: user.id,
        source_project_id: sourceProjectId,
        source_canvas_data: sourceCanvasData,
        target_presets: presetIds,
        custom_sizes: customSizes,
        resize_mode: 'smart',
        status: 'pending',
        results: [],
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create resize job:', error);
      return null;
    }

    return data.id;
  }

  async getResizeJob(jobId: string): Promise<ResizeJob | null> {
    const { data, error } = await supabase
      .from('resize_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Failed to get resize job:', error);
      return null;
    }

    return data;
  }

  async updateResizeJobResults(
    jobId: string,
    results: ResizeResult[]
  ): Promise<boolean> {
    const { error } = await supabase
      .from('resize_jobs')
      .update({
        results,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('Failed to update resize job:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // Preset Categories
  // =============================================

  getPresetCategories(): Array<{ id: string; name: string; icon: string }> {
    return [
      { id: 'social', name: 'Social Media', icon: 'share-2' },
      { id: 'web', name: 'Web & Display', icon: 'monitor' },
      { id: 'print', name: 'Print', icon: 'printer' },
      { id: 'video', name: 'Video', icon: 'video' },
      { id: 'custom', name: 'My Presets', icon: 'bookmark' },
    ];
  }

  getPlatforms(): Array<{ id: string; name: string; icon: string }> {
    return [
      { id: 'instagram', name: 'Instagram', icon: 'instagram' },
      { id: 'facebook', name: 'Facebook', icon: 'facebook' },
      { id: 'twitter', name: 'Twitter/X', icon: 'twitter' },
      { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
      { id: 'tiktok', name: 'TikTok', icon: 'video' },
      { id: 'youtube', name: 'YouTube', icon: 'youtube' },
      { id: 'pinterest', name: 'Pinterest', icon: 'pin' },
    ];
  }
}

// =============================================
// Export Singleton
// =============================================

export const magicResize = new MagicResizeService();
export default magicResize;
