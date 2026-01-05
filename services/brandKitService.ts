// =============================================
// Brand Kit Service
// Brand management and compliance checking
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export interface BrandKit {
  id: string;
  user_id: string;
  workspace_id?: string;
  name: string;
  description?: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  background_color: string;
  text_color: string;
  colors: BrandColor[];
  heading_font: string;
  body_font: string;
  font_scale: number;
  typography_settings: TypographySettings;
  spacing_unit: number;
  border_radius: number;
  tone_keywords: string[];
  writing_guidelines?: string;
  icon_style: 'outline' | 'filled' | 'duotone';
  image_style?: string;
  is_default: boolean;
  enforce_strict: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandColor {
  name: string;
  hex: string;
  usage?: string;
}

export interface TypographySettings {
  headingLineHeight?: number;
  bodyLineHeight?: number;
  letterSpacing?: number;
  headingWeight?: string;
  bodyWeight?: string;
}

export interface BrandGuideline {
  id: string;
  brand_kit_id: string;
  section_name: string;
  section_order: number;
  content: any;
  do_examples: string[];
  dont_examples: string[];
  created_at: string;
}

export interface ComplianceCheck {
  id: string;
  brand_kit_id: string;
  overall_score: number;
  issues: ComplianceIssue[];
  suggestions: ComplianceSuggestion[];
  color_issues: number;
  font_issues: number;
  spacing_issues: number;
  other_issues: number;
  checked_at: string;
}

export interface ComplianceIssue {
  type: 'color' | 'font' | 'spacing' | 'other';
  severity: 'error' | 'warning' | 'info';
  element_id?: string;
  element_name?: string;
  message: string;
  current_value?: string;
  expected_value?: string;
  suggestion?: string;
}

export interface ComplianceSuggestion {
  type: string;
  message: string;
  auto_fixable: boolean;
  fix_action?: () => void;
}

export interface CanvasElement {
  id: string;
  type: string;
  fill?: string;
  stroke?: string;
  fontFamily?: string;
  fontSize?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: CanvasElement[];
}

// =============================================
// Brand Kit Service
// =============================================

class BrandKitService {
  // =============================================
  // Brand Kit CRUD
  // =============================================

  async getBrandKits(): Promise<BrandKit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch brand kits:', error);
      return [];
    }

    return data || [];
  }

  async getDefaultBrandKit(): Promise<BrandKit | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (error) return null;
    return data;
  }

  async getBrandKitById(id: string): Promise<BrandKit | null> {
    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async createBrandKit(kit: Partial<BrandKit>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // If setting as default, unset other defaults
    if (kit.is_default) {
      await supabase
        .from('brand_kits')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('brand_kits')
      .insert({
        ...kit,
        user_id: user.id,
        colors: kit.colors || [],
        typography_settings: kit.typography_settings || {},
        tone_keywords: kit.tone_keywords || [],
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create brand kit:', error);
      return null;
    }

    return data?.id;
  }

  async updateBrandKit(id: string, updates: Partial<BrandKit>): Promise<boolean> {
    // If setting as default, unset other defaults
    if (updates.is_default) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('brand_kits')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }
    }

    const { error } = await supabase
      .from('brand_kits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to update brand kit:', error);
      return false;
    }

    return true;
  }

  async deleteBrandKit(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('brand_kits')
      .delete()
      .eq('id', id);

    return !error;
  }

  // =============================================
  // Brand Guidelines
  // =============================================

  async getGuidelines(brandKitId: string): Promise<BrandGuideline[]> {
    const { data, error } = await supabase
      .from('brand_guidelines')
      .select('*')
      .eq('brand_kit_id', brandKitId)
      .order('section_order', { ascending: true });

    if (error) return [];
    return data || [];
  }

  async saveGuideline(guideline: Partial<BrandGuideline>): Promise<string | null> {
    if (guideline.id) {
      const { error } = await supabase
        .from('brand_guidelines')
        .update(guideline)
        .eq('id', guideline.id);
      return error ? null : guideline.id;
    }

    const { data, error } = await supabase
      .from('brand_guidelines')
      .insert(guideline)
      .select('id')
      .single();

    return error ? null : data?.id;
  }

  async deleteGuideline(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('brand_guidelines')
      .delete()
      .eq('id', id);
    return !error;
  }

  // =============================================
  // Compliance Checking
  // =============================================

  async checkCompliance(
    brandKit: BrandKit,
    elements: CanvasElement[],
    projectId?: string
  ): Promise<ComplianceCheck> {
    const issues: ComplianceIssue[] = [];
    const suggestions: ComplianceSuggestion[] = [];

    // Extract brand colors (including named colors)
    const brandColors = new Set([
      brandKit.primary_color.toLowerCase(),
      brandKit.secondary_color?.toLowerCase(),
      brandKit.accent_color?.toLowerCase(),
      brandKit.background_color.toLowerCase(),
      brandKit.text_color.toLowerCase(),
      ...brandKit.colors.map(c => c.hex.toLowerCase()),
    ].filter(Boolean) as string[]);

    // Extract brand fonts
    const brandFonts = new Set([
      brandKit.heading_font.toLowerCase(),
      brandKit.body_font.toLowerCase(),
    ]);

    // Check each element
    const checkElement = (element: CanvasElement, depth = 0) => {
      // Check colors
      if (element.fill && typeof element.fill === 'string' && element.fill.startsWith('#')) {
        if (!this.isColorInBrand(element.fill, brandColors)) {
          const closestColor = this.findClosestBrandColor(element.fill, brandColors);
          issues.push({
            type: 'color',
            severity: brandKit.enforce_strict ? 'error' : 'warning',
            element_id: element.id,
            element_name: element.type,
            message: `Fill color ${element.fill} is not in brand palette`,
            current_value: element.fill,
            expected_value: closestColor,
            suggestion: `Change to ${closestColor}`,
          });
        }
      }

      if (element.stroke && typeof element.stroke === 'string' && element.stroke.startsWith('#')) {
        if (!this.isColorInBrand(element.stroke, brandColors)) {
          const closestColor = this.findClosestBrandColor(element.stroke, brandColors);
          issues.push({
            type: 'color',
            severity: 'warning',
            element_id: element.id,
            element_name: element.type,
            message: `Stroke color ${element.stroke} is not in brand palette`,
            current_value: element.stroke,
            expected_value: closestColor,
          });
        }
      }

      // Check fonts
      if (element.fontFamily) {
        const fontLower = element.fontFamily.toLowerCase();
        if (!Array.from(brandFonts).some(f => fontLower.includes(f))) {
          issues.push({
            type: 'font',
            severity: brandKit.enforce_strict ? 'error' : 'warning',
            element_id: element.id,
            element_name: element.type,
            message: `Font "${element.fontFamily}" is not in brand fonts`,
            current_value: element.fontFamily,
            expected_value: element.type === 'heading' ? brandKit.heading_font : brandKit.body_font,
          });
        }
      }

      // Check spacing (if elements are positioned)
      if (element.x !== undefined && element.y !== undefined) {
        const spacingUnit = brandKit.spacing_unit;
        if (element.x % spacingUnit !== 0 || element.y % spacingUnit !== 0) {
          issues.push({
            type: 'spacing',
            severity: 'info',
            element_id: element.id,
            element_name: element.type,
            message: `Element position not aligned to ${spacingUnit}px grid`,
            current_value: `(${element.x}, ${element.y})`,
            expected_value: `(${Math.round(element.x / spacingUnit) * spacingUnit}, ${Math.round(element.y / spacingUnit) * spacingUnit})`,
          });
        }
      }

      // Check children
      if (element.children) {
        element.children.forEach(child => checkElement(child, depth + 1));
      }
    };

    elements.forEach(el => checkElement(el));

    // Generate suggestions
    const colorIssueCount = issues.filter(i => i.type === 'color').length;
    const fontIssueCount = issues.filter(i => i.type === 'font').length;
    const spacingIssueCount = issues.filter(i => i.type === 'spacing').length;

    if (colorIssueCount > 0) {
      suggestions.push({
        type: 'color',
        message: `${colorIssueCount} color${colorIssueCount > 1 ? 's' : ''} could be updated to match brand palette`,
        auto_fixable: true,
      });
    }

    if (fontIssueCount > 0) {
      suggestions.push({
        type: 'font',
        message: `${fontIssueCount} text element${fontIssueCount > 1 ? 's' : ''} use${fontIssueCount === 1 ? 's' : ''} off-brand fonts`,
        auto_fixable: true,
      });
    }

    if (spacingIssueCount > 3) {
      suggestions.push({
        type: 'spacing',
        message: 'Consider using "Snap to Grid" for better alignment',
        auto_fixable: false,
      });
    }

    // Calculate overall score
    const totalElements = this.countElements(elements);
    const issueWeight = issues.reduce((sum, issue) => {
      return sum + (issue.severity === 'error' ? 3 : issue.severity === 'warning' ? 1 : 0.5);
    }, 0);
    const overallScore = Math.max(0, Math.min(1, 1 - (issueWeight / (totalElements * 2))));

    // Save check result
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('brand_compliance_checks').insert({
        user_id: user.id,
        brand_kit_id: brandKit.id,
        project_id: projectId,
        overall_score: overallScore,
        issues,
        suggestions,
        color_issues: colorIssueCount,
        font_issues: fontIssueCount,
        spacing_issues: spacingIssueCount,
        other_issues: issues.filter(i => i.type === 'other').length,
      });
    }

    return {
      id: '',
      brand_kit_id: brandKit.id,
      overall_score: overallScore,
      issues,
      suggestions,
      color_issues: colorIssueCount,
      font_issues: fontIssueCount,
      spacing_issues: spacingIssueCount,
      other_issues: issues.filter(i => i.type === 'other').length,
      checked_at: new Date().toISOString(),
    };
  }

  private isColorInBrand(color: string, brandColors: Set<string>): boolean {
    const normalized = color.toLowerCase();
    if (brandColors.has(normalized)) return true;

    // Check if color is close enough (within threshold)
    for (const brandColor of brandColors) {
      if (this.colorDistance(normalized, brandColor) < 15) {
        return true;
      }
    }
    return false;
  }

  private findClosestBrandColor(color: string, brandColors: Set<string>): string {
    let closestColor = '#000000';
    let minDistance = Infinity;

    for (const brandColor of brandColors) {
      const distance = this.colorDistance(color.toLowerCase(), brandColor);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = brandColor;
      }
    }

    return closestColor;
  }

  private colorDistance(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    if (!rgb1 || !rgb2) return Infinity;

    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private countElements(elements: CanvasElement[]): number {
    let count = 0;
    const traverse = (els: CanvasElement[]) => {
      for (const el of els) {
        count++;
        if (el.children) traverse(el.children);
      }
    };
    traverse(elements);
    return count;
  }

  // =============================================
  // Auto-Fix Helpers
  // =============================================

  applyBrandColors(elements: CanvasElement[], brandKit: BrandKit): CanvasElement[] {
    const brandColors = [
      brandKit.primary_color,
      brandKit.secondary_color,
      brandKit.accent_color,
      brandKit.background_color,
      brandKit.text_color,
      ...brandKit.colors.map(c => c.hex),
    ].filter(Boolean) as string[];

    const transform = (el: CanvasElement): CanvasElement => {
      const newEl = { ...el };

      if (newEl.fill && typeof newEl.fill === 'string' && newEl.fill.startsWith('#')) {
        newEl.fill = this.findClosestBrandColor(newEl.fill, new Set(brandColors.map(c => c.toLowerCase())));
      }

      if (newEl.stroke && typeof newEl.stroke === 'string' && newEl.stroke.startsWith('#')) {
        newEl.stroke = this.findClosestBrandColor(newEl.stroke, new Set(brandColors.map(c => c.toLowerCase())));
      }

      if (newEl.children) {
        newEl.children = newEl.children.map(transform);
      }

      return newEl;
    };

    return elements.map(transform);
  }

  applyBrandFonts(elements: CanvasElement[], brandKit: BrandKit): CanvasElement[] {
    const transform = (el: CanvasElement): CanvasElement => {
      const newEl = { ...el };

      if (newEl.fontFamily) {
        // Use heading font for larger text, body font for smaller
        newEl.fontFamily = (newEl.fontSize && newEl.fontSize >= 24)
          ? brandKit.heading_font
          : brandKit.body_font;
      }

      if (newEl.children) {
        newEl.children = newEl.children.map(transform);
      }

      return newEl;
    };

    return elements.map(transform);
  }

  // =============================================
  // Color Suggestions
  // =============================================

  suggestBrandColor(currentColor: string, brandKit: BrandKit): { color: string; name: string } | null {
    const brandColors = [
      { hex: brandKit.primary_color, name: 'Primary' },
      { hex: brandKit.secondary_color, name: 'Secondary' },
      { hex: brandKit.accent_color, name: 'Accent' },
      { hex: brandKit.background_color, name: 'Background' },
      { hex: brandKit.text_color, name: 'Text' },
      ...brandKit.colors.map(c => ({ hex: c.hex, name: c.name })),
    ].filter(c => c.hex) as { hex: string; name: string }[];

    let closestColor: { hex: string; name: string } | null = null;
    let minDistance = Infinity;

    for (const brandColor of brandColors) {
      const distance = this.colorDistance(currentColor.toLowerCase(), brandColor.hex.toLowerCase());
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = brandColor;
      }
    }

    // Only suggest if reasonably close
    if (minDistance < 100) {
      return closestColor ? { color: closestColor.hex, name: closestColor.name } : null;
    }

    return null;
  }
}

// Export singleton
export const brandKit = new BrandKitService();
