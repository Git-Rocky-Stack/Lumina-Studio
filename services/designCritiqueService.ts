// Design Critique AI Service - Automated feedback on typography, spacing, accessibility
// Analyzes designs and provides actionable recommendations

import { supabase } from '../lib/supabase';

// ============================================
// Types
// ============================================

export interface CanvasElement {
  id: string;
  type: 'text' | 'rect' | 'ellipse' | 'image' | 'group' | 'line' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  text?: string;
  children?: CanvasElement[];
  src?: string;
  alt?: string;
}

export interface DesignIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: CritiqueCategory;
  message: string;
  elementId?: string;
  suggestion: string;
  autoFixable: boolean;
  fixAction?: () => void;
}

export type CritiqueCategory =
  | 'typography'
  | 'spacing'
  | 'accessibility'
  | 'color'
  | 'layout'
  | 'alignment'
  | 'consistency';

export type WCAGLevel = 'A' | 'AA' | 'AAA';

export interface CritiqueResult {
  id: string;
  overallScore: number; // 0-1
  typographyScore: number;
  spacingScore: number;
  accessibilityScore: number;
  colorScore: number;
  layoutScore: number;
  issues: DesignIssue[];
  suggestions: string[];
  wcagLevel: WCAGLevel;
  contrastIssues: number;
  altTextMissing: number;
  timestamp: Date;
}

export interface ColorContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
}

// ============================================
// Design Critique Service Class
// ============================================

class DesignCritiqueService {
  // Typography standards
  private readonly MIN_BODY_FONT_SIZE = 14;
  private readonly MIN_HEADING_FONT_SIZE = 18;
  private readonly RECOMMENDED_LINE_HEIGHT_MIN = 1.4;
  private readonly RECOMMENDED_LINE_HEIGHT_MAX = 1.8;
  private readonly MAX_LINE_LENGTH_CHARS = 75;
  private readonly MIN_LINE_LENGTH_CHARS = 45;

  // Spacing standards (8pt grid)
  private readonly GRID_UNIT = 8;
  private readonly MIN_TOUCH_TARGET = 44; // WCAG 2.5.5

  // Color contrast standards (WCAG 2.1)
  private readonly CONTRAST_AA_NORMAL = 4.5;
  private readonly CONTRAST_AA_LARGE = 3;
  private readonly CONTRAST_AAA_NORMAL = 7;
  private readonly CONTRAST_AAA_LARGE = 4.5;

  // ============================================
  // Full Design Critique
  // ============================================

  async analyzeDesign(
    elements: CanvasElement[],
    projectId?: string,
    analysisType: 'full' | 'typography' | 'spacing' | 'accessibility' | 'color' | 'layout' = 'full'
  ): Promise<CritiqueResult> {
    const issues: DesignIssue[] = [];
    const suggestions: string[] = [];

    // Run analyses based on type
    if (analysisType === 'full' || analysisType === 'typography') {
      issues.push(...this.analyzeTypography(elements));
    }
    if (analysisType === 'full' || analysisType === 'spacing') {
      issues.push(...this.analyzeSpacing(elements));
    }
    if (analysisType === 'full' || analysisType === 'accessibility') {
      issues.push(...this.analyzeAccessibility(elements));
    }
    if (analysisType === 'full' || analysisType === 'color') {
      issues.push(...this.analyzeColors(elements));
    }
    if (analysisType === 'full' || analysisType === 'layout') {
      issues.push(...this.analyzeLayout(elements));
    }

    // Calculate scores
    const typographyIssues = issues.filter(i => i.category === 'typography');
    const spacingIssues = issues.filter(i => i.category === 'spacing');
    const accessibilityIssues = issues.filter(i => i.category === 'accessibility');
    const colorIssues = issues.filter(i => i.category === 'color');
    const layoutIssues = issues.filter(i => i.category === 'layout' || i.category === 'alignment');

    const calculateScore = (categoryIssues: DesignIssue[]): number => {
      if (categoryIssues.length === 0) return 1;
      const errorWeight = 0.3;
      const warningWeight = 0.15;
      const infoWeight = 0.05;
      const penalty = categoryIssues.reduce((sum, issue) => {
        switch (issue.severity) {
          case 'error': return sum + errorWeight;
          case 'warning': return sum + warningWeight;
          case 'info': return sum + infoWeight;
        }
      }, 0);
      return Math.max(0, 1 - penalty);
    };

    const typographyScore = calculateScore(typographyIssues);
    const spacingScore = calculateScore(spacingIssues);
    const accessibilityScore = calculateScore(accessibilityIssues);
    const colorScore = calculateScore(colorIssues);
    const layoutScore = calculateScore(layoutIssues);

    const overallScore = (
      typographyScore * 0.2 +
      spacingScore * 0.15 +
      accessibilityScore * 0.3 +
      colorScore * 0.15 +
      layoutScore * 0.2
    );

    // Determine WCAG level
    const contrastIssues = issues.filter(i =>
      i.category === 'accessibility' && i.message.toLowerCase().includes('contrast')
    ).length;
    const altTextMissing = issues.filter(i =>
      i.category === 'accessibility' && i.message.toLowerCase().includes('alt text')
    ).length;

    let wcagLevel: WCAGLevel = 'AAA';
    if (accessibilityIssues.some(i => i.severity === 'error')) {
      wcagLevel = 'A';
    } else if (accessibilityIssues.some(i => i.severity === 'warning')) {
      wcagLevel = 'AA';
    }

    // Generate suggestions
    if (typographyScore < 0.8) {
      suggestions.push('Consider establishing a clearer typographic hierarchy with consistent font sizes and weights.');
    }
    if (spacingScore < 0.8) {
      suggestions.push('Try using an 8-point grid system for more consistent spacing throughout your design.');
    }
    if (accessibilityScore < 0.8) {
      suggestions.push('Improve accessibility by ensuring sufficient color contrast and adding alt text to images.');
    }
    if (colorScore < 0.8) {
      suggestions.push('Review your color palette for consistency and ensure colors work well together.');
    }
    if (layoutScore < 0.8) {
      suggestions.push('Align elements to a grid for a more polished, professional appearance.');
    }

    const result: CritiqueResult = {
      id: crypto.randomUUID(),
      overallScore,
      typographyScore,
      spacingScore,
      accessibilityScore,
      colorScore,
      layoutScore,
      issues,
      suggestions,
      wcagLevel,
      contrastIssues,
      altTextMissing,
      timestamp: new Date(),
    };

    // Save to database if project is specified
    if (projectId) {
      await this.saveCritique(result, projectId, elements, analysisType);
    }

    return result;
  }

  // ============================================
  // Typography Analysis
  // ============================================

  private analyzeTypography(elements: CanvasElement[]): DesignIssue[] {
    const issues: DesignIssue[] = [];
    const textElements = elements.filter(e => e.type === 'text');

    // Collect font sizes for consistency check
    const fontSizes = new Set<number>();
    const fontFamilies = new Set<string>();

    for (const element of textElements) {
      const fontSize = element.fontSize || 16;
      const lineHeight = element.lineHeight || 1.5;
      const text = element.text || '';

      fontSizes.add(fontSize);
      if (element.fontFamily) fontFamilies.add(element.fontFamily);

      // Check minimum font size
      if (fontSize < this.MIN_BODY_FONT_SIZE) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'warning',
          category: 'typography',
          message: `Text is smaller than recommended (${fontSize}px). Minimum body text should be ${this.MIN_BODY_FONT_SIZE}px.`,
          elementId: element.id,
          suggestion: `Increase font size to at least ${this.MIN_BODY_FONT_SIZE}px for better readability.`,
          autoFixable: true,
        });
      }

      // Check line height
      if (lineHeight < this.RECOMMENDED_LINE_HEIGHT_MIN) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'info',
          category: 'typography',
          message: `Line height is tight (${lineHeight}). Recommended range is ${this.RECOMMENDED_LINE_HEIGHT_MIN}-${this.RECOMMENDED_LINE_HEIGHT_MAX}.`,
          elementId: element.id,
          suggestion: `Increase line height to ${this.RECOMMENDED_LINE_HEIGHT_MIN} for improved readability.`,
          autoFixable: true,
        });
      } else if (lineHeight > this.RECOMMENDED_LINE_HEIGHT_MAX) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'info',
          category: 'typography',
          message: `Line height is loose (${lineHeight}). Consider tightening for visual cohesion.`,
          elementId: element.id,
          suggestion: `Reduce line height to ${this.RECOMMENDED_LINE_HEIGHT_MAX} or below.`,
          autoFixable: true,
        });
      }

      // Check line length (if width is set)
      if (element.width && text.length > 0) {
        // Estimate characters per line (rough calculation)
        const avgCharWidth = fontSize * 0.5;
        const charsPerLine = element.width / avgCharWidth;

        if (charsPerLine > this.MAX_LINE_LENGTH_CHARS) {
          issues.push({
            id: crypto.randomUUID(),
            severity: 'warning',
            category: 'typography',
            message: `Line length may be too long (~${Math.round(charsPerLine)} characters). Optimal is ${this.MIN_LINE_LENGTH_CHARS}-${this.MAX_LINE_LENGTH_CHARS}.`,
            elementId: element.id,
            suggestion: `Reduce the text container width for improved readability.`,
            autoFixable: false,
          });
        }
      }
    }

    // Check font consistency
    if (fontFamilies.size > 3) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        category: 'typography',
        message: `Using ${fontFamilies.size} different font families. Consider limiting to 2-3 for consistency.`,
        suggestion: 'Establish a type system with 1-2 primary fonts and one accent font maximum.',
        autoFixable: false,
      });
    }

    // Check font size scale
    if (fontSizes.size > 6) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'info',
        category: 'typography',
        message: `Using ${fontSizes.size} different font sizes. Consider a more limited type scale.`,
        suggestion: 'Use a modular type scale (e.g., 12, 14, 16, 20, 24, 32) for visual harmony.',
        autoFixable: false,
      });
    }

    return issues;
  }

  // ============================================
  // Spacing Analysis
  // ============================================

  private analyzeSpacing(elements: CanvasElement[]): DesignIssue[] {
    const issues: DesignIssue[] = [];

    // Check if spacing follows grid
    for (const element of elements) {
      const xOffset = element.x % this.GRID_UNIT;
      const yOffset = element.y % this.GRID_UNIT;

      if (xOffset !== 0 || yOffset !== 0) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'info',
          category: 'spacing',
          message: `Element is not aligned to ${this.GRID_UNIT}px grid (offset: ${xOffset}px, ${yOffset}px).`,
          elementId: element.id,
          suggestion: `Snap to grid: move to (${Math.round(element.x / this.GRID_UNIT) * this.GRID_UNIT}, ${Math.round(element.y / this.GRID_UNIT) * this.GRID_UNIT}).`,
          autoFixable: true,
        });
      }

      // Check dimensions on grid
      if (element.width % this.GRID_UNIT !== 0 || element.height % this.GRID_UNIT !== 0) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'info',
          category: 'spacing',
          message: `Element dimensions are not multiples of ${this.GRID_UNIT}px.`,
          elementId: element.id,
          suggestion: `Resize to nearest grid values for consistency.`,
          autoFixable: true,
        });
      }
    }

    // Check for inconsistent gaps between elements
    const gaps = new Map<string, number[]>();

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const e1 = elements[i];
        const e2 = elements[j];

        // Check horizontal gap (if elements are on same row)
        const verticalOverlap = !(e1.y + e1.height < e2.y || e2.y + e2.height < e1.y);
        if (verticalOverlap) {
          const hGap = e2.x > e1.x + e1.width
            ? e2.x - (e1.x + e1.width)
            : e1.x > e2.x + e2.width
              ? e1.x - (e2.x + e2.width)
              : 0;

          if (hGap > 0 && hGap < 200) {
            if (!gaps.has('horizontal')) gaps.set('horizontal', []);
            gaps.get('horizontal')!.push(hGap);
          }
        }

        // Check vertical gap (if elements are on same column)
        const horizontalOverlap = !(e1.x + e1.width < e2.x || e2.x + e2.width < e1.x);
        if (horizontalOverlap) {
          const vGap = e2.y > e1.y + e1.height
            ? e2.y - (e1.y + e1.height)
            : e1.y > e2.y + e2.height
              ? e1.y - (e2.y + e2.height)
              : 0;

          if (vGap > 0 && vGap < 200) {
            if (!gaps.has('vertical')) gaps.set('vertical', []);
            gaps.get('vertical')!.push(vGap);
          }
        }
      }
    }

    // Check for gap consistency
    for (const [direction, gapValues] of gaps) {
      const uniqueGaps = new Set(gapValues.map(g => Math.round(g / this.GRID_UNIT) * this.GRID_UNIT));
      if (uniqueGaps.size > 3) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'warning',
          category: 'spacing',
          message: `Inconsistent ${direction} spacing detected (${uniqueGaps.size} different gap sizes).`,
          suggestion: `Standardize ${direction} gaps using consistent spacing values (e.g., 8, 16, 24, 32px).`,
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  // ============================================
  // Accessibility Analysis
  // ============================================

  private analyzeAccessibility(elements: CanvasElement[]): DesignIssue[] {
    const issues: DesignIssue[] = [];

    for (const element of elements) {
      // Check images for alt text
      if (element.type === 'image' && !element.alt) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'error',
          category: 'accessibility',
          message: 'Image is missing alt text for screen readers.',
          elementId: element.id,
          suggestion: 'Add descriptive alt text to improve accessibility.',
          autoFixable: false,
        });
      }

      // Check touch target size
      if (['rect', 'ellipse'].includes(element.type)) {
        if (element.width < this.MIN_TOUCH_TARGET || element.height < this.MIN_TOUCH_TARGET) {
          issues.push({
            id: crypto.randomUUID(),
            severity: 'warning',
            category: 'accessibility',
            message: `Element may be too small for touch (${element.width}x${element.height}px). Minimum is ${this.MIN_TOUCH_TARGET}x${this.MIN_TOUCH_TARGET}px.`,
            elementId: element.id,
            suggestion: `Increase to at least ${this.MIN_TOUCH_TARGET}x${this.MIN_TOUCH_TARGET}px for better touch accessibility.`,
            autoFixable: true,
          });
        }
      }

      // Check text contrast
      if (element.type === 'text' && element.fill) {
        // Find background element
        const bgElement = this.findBackgroundElement(element, elements);
        const bgColor = bgElement?.fill || '#ffffff';

        if (element.fill && bgColor) {
          const contrast = this.calculateColorContrast(element.fill, bgColor);
          const isLargeText = (element.fontSize || 16) >= 18 ||
            ((element.fontSize || 16) >= 14 && (element.fontWeight === 'bold' || element.fontWeight === 700));

          const requiredRatio = isLargeText ? this.CONTRAST_AA_LARGE : this.CONTRAST_AA_NORMAL;

          if (contrast.ratio < requiredRatio) {
            issues.push({
              id: crypto.randomUUID(),
              severity: 'error',
              category: 'accessibility',
              message: `Insufficient color contrast (${contrast.ratio.toFixed(2)}:1). WCAG AA requires ${requiredRatio}:1${isLargeText ? ' for large text' : ''}.`,
              elementId: element.id,
              suggestion: 'Increase contrast by using darker text on light backgrounds or lighter text on dark backgrounds.',
              autoFixable: false,
            });
          } else if (contrast.ratio < (isLargeText ? this.CONTRAST_AAA_LARGE : this.CONTRAST_AAA_NORMAL)) {
            issues.push({
              id: crypto.randomUUID(),
              severity: 'info',
              category: 'accessibility',
              message: `Color contrast (${contrast.ratio.toFixed(2)}:1) passes AA but not AAA standard.`,
              elementId: element.id,
              suggestion: 'Consider increasing contrast for better readability.',
              autoFixable: false,
            });
          }
        }
      }
    }

    return issues;
  }

  // ============================================
  // Color Analysis
  // ============================================

  private analyzeColors(elements: CanvasElement[]): DesignIssue[] {
    const issues: DesignIssue[] = [];

    // Collect all colors
    const colors = new Set<string>();

    for (const element of elements) {
      if (element.fill) colors.add(element.fill);
      if (element.stroke) colors.add(element.stroke);
    }

    // Check color count
    if (colors.size > 7) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        category: 'color',
        message: `Using ${colors.size} different colors. Consider limiting to 5-7 for visual cohesion.`,
        suggestion: 'Establish a color palette with primary, secondary, and accent colors.',
        autoFixable: false,
      });
    }

    // Check for similar colors that might be inconsistent
    const colorArray = Array.from(colors);
    for (let i = 0; i < colorArray.length; i++) {
      for (let j = i + 1; j < colorArray.length; j++) {
        const similarity = this.calculateColorSimilarity(colorArray[i], colorArray[j]);
        if (similarity > 0.85 && similarity < 0.98) {
          issues.push({
            id: crypto.randomUUID(),
            severity: 'info',
            category: 'color',
            message: `Very similar colors detected: ${colorArray[i]} and ${colorArray[j]}. This might be unintentional.`,
            suggestion: 'Consider unifying to a single color for consistency.',
            autoFixable: false,
          });
        }
      }
    }

    return issues;
  }

  // ============================================
  // Layout Analysis
  // ============================================

  private analyzeLayout(elements: CanvasElement[]): DesignIssue[] {
    const issues: DesignIssue[] = [];

    // Check alignment
    const xPositions = elements.map(e => e.x);
    const centerXPositions = elements.map(e => e.x + e.width / 2);
    const rightPositions = elements.map(e => e.x + e.width);

    const yPositions = elements.map(e => e.y);
    const centerYPositions = elements.map(e => e.y + e.height / 2);
    const bottomPositions = elements.map(e => e.y + e.height);

    // Find near-alignments (within 5px but not exact)
    const findNearAlignments = (positions: number[]): number[][] => {
      const nearGroups: number[][] = [];
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const diff = Math.abs(positions[i] - positions[j]);
          if (diff > 0 && diff <= 5) {
            nearGroups.push([i, j]);
          }
        }
      }
      return nearGroups;
    };

    const nearX = findNearAlignments(xPositions);
    const nearY = findNearAlignments(yPositions);

    if (nearX.length > 0) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        category: 'alignment',
        message: `${nearX.length} element pair(s) are nearly aligned horizontally but not exact.`,
        suggestion: 'Snap elements to exact alignment for a more polished look.',
        autoFixable: true,
      });
    }

    if (nearY.length > 0) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        category: 'alignment',
        message: `${nearY.length} element pair(s) are nearly aligned vertically but not exact.`,
        suggestion: 'Snap elements to exact alignment for a more polished look.',
        autoFixable: true,
      });
    }

    // Check for overlapping elements (might be intentional)
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const e1 = elements[i];
        const e2 = elements[j];

        const overlapsX = !(e1.x + e1.width < e2.x || e2.x + e2.width < e1.x);
        const overlapsY = !(e1.y + e1.height < e2.y || e2.y + e2.height < e1.y);

        if (overlapsX && overlapsY) {
          // Calculate overlap area
          const overlapX = Math.min(e1.x + e1.width, e2.x + e2.width) - Math.max(e1.x, e2.x);
          const overlapY = Math.min(e1.y + e1.height, e2.y + e2.height) - Math.max(e1.y, e2.y);
          const overlapArea = overlapX * overlapY;
          const smallerArea = Math.min(e1.width * e1.height, e2.width * e2.height);

          // Only flag if significant overlap
          if (overlapArea > smallerArea * 0.3 && overlapArea < smallerArea * 0.9) {
            issues.push({
              id: crypto.randomUUID(),
              severity: 'info',
              category: 'layout',
              message: 'Elements are partially overlapping. Verify this is intentional.',
              elementId: e1.id,
              suggestion: 'Either fully overlap for layering effect or separate with clear spacing.',
              autoFixable: false,
            });
          }
        }
      }
    }

    return issues;
  }

  // ============================================
  // Color Utilities
  // ============================================

  calculateColorContrast(foreground: string, background: string): ColorContrastResult {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    return {
      foreground,
      background,
      ratio,
      passesAA: ratio >= this.CONTRAST_AA_NORMAL,
      passesAAA: ratio >= this.CONTRAST_AAA_NORMAL,
      passesAALarge: ratio >= this.CONTRAST_AA_LARGE,
      passesAAALarge: ratio >= this.CONTRAST_AAA_LARGE,
    };
  }

  private getLuminance(color: string): number {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private parseColor(color: string): { r: number; g: number; b: number } | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      } else if (hex.length >= 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
    }

    // Handle rgb/rgba
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
      };
    }

    return null;
  }

  private calculateColorSimilarity(color1: string, color2: string): number {
    const c1 = this.parseColor(color1);
    const c2 = this.parseColor(color2);

    if (!c1 || !c2) return 0;

    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );

    // Max distance is sqrt(3 * 255^2) ≈ 441.67
    return 1 - (distance / 441.67);
  }

  private findBackgroundElement(
    element: CanvasElement,
    elements: CanvasElement[]
  ): CanvasElement | null {
    // Find elements that contain this element
    const containers = elements.filter(e =>
      e.id !== element.id &&
      e.x <= element.x &&
      e.y <= element.y &&
      e.x + e.width >= element.x + element.width &&
      e.y + e.height >= element.y + element.height &&
      e.fill
    );

    // Return the smallest container (closest background)
    if (containers.length === 0) return null;

    return containers.reduce((smallest, current) => {
      const smallestArea = smallest.width * smallest.height;
      const currentArea = current.width * current.height;
      return currentArea < smallestArea ? current : smallest;
    });
  }

  // ============================================
  // Database Operations
  // ============================================

  private async saveCritique(
    result: CritiqueResult,
    projectId: string,
    elements: CanvasElement[],
    analysisType: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('design_critiques')
      .insert({
        id: result.id,
        user_id: user.id,
        project_id: projectId,
        analysis_type: analysisType,
        canvas_snapshot: elements,
        overall_score: result.overallScore,
        typography_score: result.typographyScore,
        spacing_score: result.spacingScore,
        accessibility_score: result.accessibilityScore,
        color_score: result.colorScore,
        layout_score: result.layoutScore,
        issues: result.issues,
        suggestions: result.suggestions,
        wcag_level: result.wcagLevel,
        contrast_issues: result.contrastIssues,
        alt_text_missing: result.altTextMissing,
      });

    if (error) {
      console.error('Failed to save critique:', error);
    }
  }

  async getCritiqueHistory(projectId: string): Promise<CritiqueResult[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('design_critiques')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) {
      console.error('Failed to fetch critique history:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      overallScore: row.overall_score,
      typographyScore: row.typography_score,
      spacingScore: row.spacing_score,
      accessibilityScore: row.accessibility_score,
      colorScore: row.color_score,
      layoutScore: row.layout_score,
      issues: row.issues as DesignIssue[],
      suggestions: row.suggestions as string[],
      wcagLevel: row.wcag_level as WCAGLevel,
      contrastIssues: row.contrast_issues,
      altTextMissing: row.alt_text_missing,
      timestamp: new Date(row.created_at),
    }));
  }
}

// Export singleton instance
export const designCritiqueService = new DesignCritiqueService();
