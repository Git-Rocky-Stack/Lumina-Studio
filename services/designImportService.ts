// =============================================
// Design Import Service
// Import designs from Figma, Canva, and other tools
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export type ImportSource = 'figma' | 'canva' | 'sketch' | 'psd' | 'xd';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';

export interface DesignImport {
  id: string;
  user_id: string;
  source_type: ImportSource;
  source_file_url?: string;
  source_file_name?: string;
  source_file_size?: number;
  figma_file_key?: string;
  figma_node_ids?: string[];
  canva_design_id?: string;
  canva_export_format?: string;
  status: ImportStatus;
  progress_percent: number;
  total_frames: number;
  processed_frames: number;
  result_project_id?: string;
  result_data?: any;
  warnings?: string[];
  errors?: string[];
  import_options: ImportOptions;
  created_at: string;
  completed_at?: string;
}

export interface ImportOptions {
  flattenGroups?: boolean;
  importImages?: boolean;
  importFonts?: boolean;
  preserveConstraints?: boolean;
  convertEffects?: boolean;
  importComments?: boolean;
  selectedFrames?: string[];
}

export interface FigmaFile {
  name: string;
  lastModified: string;
  version: string;
  thumbnailUrl: string;
  pages: FigmaPage[];
}

export interface FigmaPage {
  id: string;
  name: string;
  children: FigmaNode[];
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  style?: any;
  characters?: string;
}

export interface CanvaDesign {
  id: string;
  title: string;
  thumbnail: string;
  width: number;
  height: number;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImportElementMapping {
  sourceId: string;
  sourceType: string;
  resultId?: string;
  resultType?: string;
  mappingData?: {
    fontSubstitution?: { from: string; to: string };
    colorMapping?: { from: string; to: string };
    warnings?: string[];
  };
}

export interface LuminaElement {
  id: string;
  type: 'rect' | 'circle' | 'text' | 'image' | 'group' | 'path' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  fill?: string | any;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  src?: string;
  children?: LuminaElement[];
  effects?: any[];
}

// =============================================
// Design Import Service
// =============================================

class DesignImportService {
  private figmaApiToken: string | null = null;

  // =============================================
  // Figma Import
  // =============================================

  setFigmaToken(token: string): void {
    this.figmaApiToken = token;
  }

  async getFigmaFile(fileKey: string): Promise<FigmaFile | null> {
    if (!this.figmaApiToken) {
      throw new Error('Figma API token not set. Use setFigmaToken() first.');
    }

    try {
      const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': this.figmaApiToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        name: data.name,
        lastModified: data.lastModified,
        version: data.version,
        thumbnailUrl: data.thumbnailUrl,
        pages: data.document.children.map((page: any) => ({
          id: page.id,
          name: page.name,
          children: page.children || [],
        })),
      };
    } catch (err) {
      console.error('Failed to fetch Figma file:', err);
      return null;
    }
  }

  async getFigmaFrameImages(
    fileKey: string,
    nodeIds: string[],
    format: 'png' | 'svg' | 'jpg' = 'png',
    scale: number = 2
  ): Promise<Record<string, string>> {
    if (!this.figmaApiToken) {
      throw new Error('Figma API token not set');
    }

    try {
      const response = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds.join(',')}&format=${format}&scale=${scale}`,
        {
          headers: {
            'X-Figma-Token': this.figmaApiToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status}`);
      }

      const data = await response.json();
      return data.images || {};
    } catch (err) {
      console.error('Failed to fetch Figma images:', err);
      return {};
    }
  }

  async importFromFigma(
    fileKey: string,
    nodeIds?: string[],
    options: ImportOptions = {}
  ): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Create import record
    const { data: importRecord, error } = await supabase
      .from('design_imports')
      .insert({
        user_id: user.id,
        source_type: 'figma',
        figma_file_key: fileKey,
        figma_node_ids: nodeIds,
        import_options: options,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !importRecord) {
      console.error('Failed to create import record:', error);
      return null;
    }

    // Start import process (in production, this would be a background job)
    this.processFigmaImport(importRecord.id, fileKey, nodeIds, options);

    return importRecord.id;
  }

  private async processFigmaImport(
    importId: string,
    fileKey: string,
    nodeIds?: string[],
    options: ImportOptions = {}
  ): Promise<void> {
    try {
      // Update status
      await this.updateImportStatus(importId, 'processing', 0);

      // Fetch Figma file
      const figmaFile = await this.getFigmaFile(fileKey);
      if (!figmaFile) {
        throw new Error('Failed to fetch Figma file');
      }

      // Get frames to import
      const framesToImport = nodeIds?.length
        ? this.findNodesById(figmaFile.pages, nodeIds)
        : this.extractTopLevelFrames(figmaFile.pages);

      await this.updateImportStatus(importId, 'processing', 10, framesToImport.length);

      // Convert each frame
      const results: LuminaElement[] = [];
      const mappings: ImportElementMapping[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < framesToImport.length; i++) {
        const frame = framesToImport[i];
        const { element, elementMappings, elementWarnings } = this.convertFigmaNode(frame, options);

        results.push(element);
        mappings.push(...elementMappings);
        warnings.push(...elementWarnings);

        const progress = 10 + Math.round((i + 1) / framesToImport.length * 80);
        await this.updateImportStatus(importId, 'processing', progress, framesToImport.length, i + 1);
      }

      // Save mappings
      if (mappings.length > 0) {
        await supabase.from('import_element_mappings').insert(
          mappings.map(m => ({ ...m, import_id: importId }))
        );
      }

      // Complete import
      await supabase
        .from('design_imports')
        .update({
          status: 'completed',
          progress_percent: 100,
          result_data: { elements: results, name: figmaFile.name },
          warnings: warnings.length > 0 ? warnings : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importId);

    } catch (err: any) {
      await supabase
        .from('design_imports')
        .update({
          status: 'failed',
          errors: [err.message],
        })
        .eq('id', importId);
    }
  }

  private convertFigmaNode(
    node: FigmaNode,
    options: ImportOptions
  ): { element: LuminaElement; elementMappings: ImportElementMapping[]; elementWarnings: string[] } {
    const mappings: ImportElementMapping[] = [];
    const warnings: string[] = [];

    const element: LuminaElement = {
      id: `imported_${node.id}`,
      type: this.mapFigmaTypeToLumina(node.type),
      x: node.absoluteBoundingBox?.x || 0,
      y: node.absoluteBoundingBox?.y || 0,
      width: node.absoluteBoundingBox?.width || 100,
      height: node.absoluteBoundingBox?.height || 100,
    };

    // Map fills
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        element.fill = this.rgbaToHex(fill.color);
      } else if (fill.type === 'GRADIENT_LINEAR') {
        element.fill = this.convertFigmaGradient(fill);
      } else if (fill.type === 'IMAGE') {
        warnings.push(`Image fill on "${node.name}" requires manual import`);
      }
    }

    // Map strokes
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        element.stroke = this.rgbaToHex(stroke.color);
        element.strokeWidth = (node as any).strokeWeight || 1;
      }
    }

    // Map text properties
    if (node.type === 'TEXT' && node.characters) {
      element.text = node.characters;
      if (node.style) {
        element.fontSize = node.style.fontSize;
        element.fontFamily = node.style.fontFamily;
        element.fontWeight = node.style.fontWeight?.toString();
        element.textAlign = node.style.textAlignHorizontal?.toLowerCase();

        // Check font availability
        if (node.style.fontFamily && !this.isFontAvailable(node.style.fontFamily)) {
          const substitute = this.getSubstituteFont(node.style.fontFamily);
          element.fontFamily = substitute;
          mappings.push({
            sourceId: node.id,
            sourceType: 'text',
            mappingData: {
              fontSubstitution: { from: node.style.fontFamily, to: substitute },
            },
          });
          warnings.push(`Font "${node.style.fontFamily}" substituted with "${substitute}"`);
        }
      }
    }

    // Map effects
    if (node.effects && node.effects.length > 0 && options.convertEffects !== false) {
      element.effects = node.effects.map(effect => this.convertFigmaEffect(effect));
    }

    // Map children (groups)
    if (node.children && node.children.length > 0) {
      if (options.flattenGroups && node.type === 'GROUP') {
        // Flatten: return children directly
        const childResults = node.children.map(child => this.convertFigmaNode(child, options));
        return {
          element,
          elementMappings: childResults.flatMap(r => r.elementMappings),
          elementWarnings: childResults.flatMap(r => r.elementWarnings),
        };
      } else {
        element.children = node.children.map(child => {
          const result = this.convertFigmaNode(child, options);
          mappings.push(...result.elementMappings);
          warnings.push(...result.elementWarnings);
          return result.element;
        });
      }
    }

    mappings.push({
      sourceId: node.id,
      sourceType: node.type.toLowerCase(),
      resultId: element.id,
      resultType: element.type,
    });

    return { element, elementMappings: mappings, elementWarnings: warnings };
  }

  private mapFigmaTypeToLumina(figmaType: string): LuminaElement['type'] {
    const typeMap: Record<string, LuminaElement['type']> = {
      RECTANGLE: 'rect',
      ELLIPSE: 'circle',
      TEXT: 'text',
      FRAME: 'group',
      GROUP: 'group',
      COMPONENT: 'group',
      INSTANCE: 'group',
      VECTOR: 'path',
      LINE: 'line',
      REGULAR_POLYGON: 'path',
      STAR: 'path',
      BOOLEAN_OPERATION: 'path',
    };
    return typeMap[figmaType] || 'rect';
  }

  private rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
    const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  private convertFigmaGradient(fill: any): any {
    return {
      type: 'linear',
      angle: fill.gradientHandlePositions
        ? Math.atan2(
            fill.gradientHandlePositions[1].y - fill.gradientHandlePositions[0].y,
            fill.gradientHandlePositions[1].x - fill.gradientHandlePositions[0].x
          ) * (180 / Math.PI)
        : 0,
      stops: fill.gradientStops?.map((stop: any) => ({
        offset: stop.position,
        color: this.rgbaToHex(stop.color),
      })) || [],
    };
  }

  private convertFigmaEffect(effect: any): any {
    if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
      return {
        type: 'shadow',
        color: effect.color ? this.rgbaToHex(effect.color) : '#000000',
        blur: effect.radius || 0,
        offsetX: effect.offset?.x || 0,
        offsetY: effect.offset?.y || 0,
        spread: effect.spread || 0,
        inner: effect.type === 'INNER_SHADOW',
      };
    }
    if (effect.type === 'LAYER_BLUR') {
      return {
        type: 'blur',
        radius: effect.radius || 0,
      };
    }
    return null;
  }

  private findNodesById(pages: FigmaPage[], nodeIds: string[]): FigmaNode[] {
    const nodes: FigmaNode[] = [];
    const idSet = new Set(nodeIds);

    const traverse = (children: FigmaNode[]) => {
      for (const child of children) {
        if (idSet.has(child.id)) {
          nodes.push(child);
        }
        if (child.children) {
          traverse(child.children);
        }
      }
    };

    for (const page of pages) {
      traverse(page.children);
    }

    return nodes;
  }

  private extractTopLevelFrames(pages: FigmaPage[]): FigmaNode[] {
    const frames: FigmaNode[] = [];
    for (const page of pages) {
      for (const child of page.children) {
        if (child.type === 'FRAME' || child.type === 'COMPONENT') {
          frames.push(child);
        }
      }
    }
    return frames;
  }

  private isFontAvailable(fontFamily: string): boolean {
    // Check if font is available (simplified check)
    const safeFonts = [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
      'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Verdana',
    ];
    return safeFonts.some(f => fontFamily.toLowerCase().includes(f.toLowerCase()));
  }

  private getSubstituteFont(fontFamily: string): string {
    const substitutes: Record<string, string> = {
      'SF Pro': 'Inter',
      'San Francisco': 'Inter',
      'Helvetica Neue': 'Inter',
      'Proxima Nova': 'Montserrat',
      'Avenir': 'Poppins',
      'Futura': 'Poppins',
    };

    for (const [key, value] of Object.entries(substitutes)) {
      if (fontFamily.includes(key)) return value;
    }
    return 'Inter';
  }

  // =============================================
  // Canva Import
  // =============================================

  async parseCanvaExport(file: File): Promise<{ elements: LuminaElement[]; warnings: string[] }> {
    // Canva exports as images or PDF - we'll handle image import
    const warnings: string[] = [];
    const elements: LuminaElement[] = [];

    if (file.type.startsWith('image/')) {
      // Import as image element
      const url = URL.createObjectURL(file);
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          elements.push({
            id: `canva_${Date.now()}`,
            type: 'image',
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
            src: url,
          });
          resolve({ elements, warnings });
        };
        img.onerror = () => {
          warnings.push('Failed to load Canva export image');
          resolve({ elements, warnings });
        };
        img.src = url;
      });
    }

    warnings.push('Canva export format not supported. Please export as PNG or JPG.');
    return { elements, warnings };
  }

  async importFromCanvaFile(file: File, options: ImportOptions = {}): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Create import record
    const { data: importRecord, error } = await supabase
      .from('design_imports')
      .insert({
        user_id: user.id,
        source_type: 'canva',
        source_file_name: file.name,
        source_file_size: file.size,
        import_options: options,
        status: 'processing',
      })
      .select('id')
      .single();

    if (error || !importRecord) return null;

    try {
      const { elements, warnings } = await this.parseCanvaExport(file);

      await supabase
        .from('design_imports')
        .update({
          status: elements.length > 0 ? 'completed' : 'failed',
          progress_percent: 100,
          result_data: { elements },
          warnings: warnings.length > 0 ? warnings : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importRecord.id);

      return importRecord.id;
    } catch (err: any) {
      await supabase
        .from('design_imports')
        .update({
          status: 'failed',
          errors: [err.message],
        })
        .eq('id', importRecord.id);
      return null;
    }
  }

  // =============================================
  // Generic File Import
  // =============================================

  async importFromFile(file: File, options: ImportOptions = {}): Promise<string | null> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'fig':
        // .fig files are Figma's native format - not directly parseable
        // User needs to use Figma API with file key
        throw new Error('Please use importFromFigma() with your Figma file key instead of uploading .fig files');

      case 'sketch':
        return this.importFromSketch(file, options);

      case 'psd':
        return this.importFromPSD(file, options);

      case 'svg':
        return this.importFromSVG(file, options);

      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return this.importFromImage(file, options);

      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  private async importFromSketch(file: File, options: ImportOptions): Promise<string | null> {
    // Sketch files are ZIP archives - would need proper parsing
    throw new Error('Sketch import coming soon. Please export as SVG from Sketch.');
  }

  private async importFromPSD(file: File, options: ImportOptions): Promise<string | null> {
    // PSD parsing requires specialized library
    throw new Error('PSD import coming soon. Please export as PNG from Photoshop.');
  }

  private async importFromSVG(file: File, options: ImportOptions): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: importRecord } = await supabase
      .from('design_imports')
      .insert({
        user_id: user.id,
        source_type: 'sketch', // Using sketch type for SVG
        source_file_name: file.name,
        source_file_size: file.size,
        import_options: options,
        status: 'processing',
      })
      .select('id')
      .single();

    if (!importRecord) return null;

    try {
      const svgText = await file.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      const width = parseInt(svgElement.getAttribute('width') || '800');
      const height = parseInt(svgElement.getAttribute('height') || '600');

      // For now, import SVG as a single element
      // Full SVG parsing would convert each path/shape individually
      const element: LuminaElement = {
        id: `svg_${Date.now()}`,
        type: 'image',
        x: 0,
        y: 0,
        width,
        height,
        src: URL.createObjectURL(file),
      };

      await supabase
        .from('design_imports')
        .update({
          status: 'completed',
          progress_percent: 100,
          result_data: { elements: [element] },
          completed_at: new Date().toISOString(),
        })
        .eq('id', importRecord.id);

      return importRecord.id;
    } catch (err: any) {
      await supabase
        .from('design_imports')
        .update({ status: 'failed', errors: [err.message] })
        .eq('id', importRecord.id);
      return null;
    }
  }

  private async importFromImage(file: File, options: ImportOptions): Promise<string | null> {
    return this.importFromCanvaFile(file, options);
  }

  // =============================================
  // Import Management
  // =============================================

  async getImports(status?: ImportStatus): Promise<DesignImport[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('design_imports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  async getImportById(importId: string): Promise<DesignImport | null> {
    const { data, error } = await supabase
      .from('design_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (error) return null;
    return data;
  }

  async deleteImport(importId: string): Promise<boolean> {
    const { error } = await supabase
      .from('design_imports')
      .delete()
      .eq('id', importId);

    return !error;
  }

  private async updateImportStatus(
    importId: string,
    status: ImportStatus,
    progress: number,
    totalFrames?: number,
    processedFrames?: number
  ): Promise<void> {
    const updates: any = { status, progress_percent: progress };
    if (totalFrames !== undefined) updates.total_frames = totalFrames;
    if (processedFrames !== undefined) updates.processed_frames = processedFrames;

    await supabase
      .from('design_imports')
      .update(updates)
      .eq('id', importId);
  }
}

// Export singleton
export const designImport = new DesignImportService();
