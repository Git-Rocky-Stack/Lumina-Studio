// ============================================================================
// ACCESSIBILITY CHECKER SERVICE
// ============================================================================

import {
  generateIssueId,
  calculateContrastRatio,
  checkContrast,
  getContrastSeverity,
  isLargeText,
  calculateAccessibilityScore,
  getRecommendation,
  WCAG_CRITERIA
} from '../types/accessibility';
import type {
  AccessibilityIssue,
  AccessibilityScanResult,
  AccessibilityScanOptions,
  ElementAccessibility,
  AutoFixResult,
  IssueSeverity,
  IssueCategory,
  WCAGLevel,
  SimulationOptions,
  ColorBlindnessType
} from '../types/accessibility';
import type { DesignElement } from '../types';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  SCAN_HISTORY: 'lumina_accessibility_scans',
  SETTINGS: 'lumina_accessibility_settings'
};

// ============================================================================
// ACCESSIBILITY CHECKER
// ============================================================================

class AccessibilityChecker {
  private lastScanResult: AccessibilityScanResult | null = null;
  private scanHistory: AccessibilityScanResult[] = [];
  private settings = {
    targetLevel: 'AA' as WCAGLevel,
    autoScan: false,
    showOverlay: true
  };

  // Callbacks
  private onScanComplete: ((result: AccessibilityScanResult) => void) | null = null;
  private onIssueSelected: ((issue: AccessibilityIssue) => void) | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const historyJson = localStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (historyJson) {
        this.scanHistory = JSON.parse(historyJson);
      }

      if (settingsJson) {
        this.settings = { ...this.settings, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(this.scanHistory.slice(-10)));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  // ============================================================================
  // SCANNING
  // ============================================================================

  /**
   * Run accessibility scan on elements
   */
  scan(elements: DesignElement[], options?: AccessibilityScanOptions): AccessibilityScanResult {
    const scanOptions: AccessibilityScanOptions = {
      targetLevel: options?.targetLevel || this.settings.targetLevel,
      ...options
    };

    const issues: AccessibilityIssue[] = [];
    const elementResults = new Map<string, ElementAccessibility>();

    // Filter elements if specific IDs provided
    let elementsToScan = elements;
    if (scanOptions.elementIds && scanOptions.elementIds.length > 0) {
      elementsToScan = elements.filter(el => scanOptions.elementIds!.includes(el.id));
    }

    // Scan each element
    elementsToScan.forEach(element => {
      const elementIssues = this.scanElement(element, elements, scanOptions);
      const passed: string[] = [];
      const warnings: string[] = [];

      // Categorize results
      if (elementIssues.length === 0) {
        passed.push('No accessibility issues detected');
      } else {
        elementIssues.forEach(issue => {
          if (issue.severity === 'minor') {
            warnings.push(issue.title);
          }
        });
      }

      issues.push(...elementIssues);

      elementResults.set(element.id, {
        elementId: element.id,
        elementType: element.type,
        issues: elementIssues,
        passed,
        warnings
      });
    });

    // Calculate issue counts
    const issueCount = {
      critical: issues.filter(i => i.severity === 'critical').length,
      serious: issues.filter(i => i.severity === 'serious').length,
      moderate: issues.filter(i => i.severity === 'moderate').length,
      minor: issues.filter(i => i.severity === 'minor').length
    };

    // Calculate WCAG compliance
    const wcagCompliance = {
      a: !issues.some(i => this.getWcagLevel(i.wcagCriteria) === 'A'),
      aa: !issues.some(i => ['A', 'AA'].includes(this.getWcagLevel(i.wcagCriteria))),
      aaa: issues.length === 0
    };

    const result: AccessibilityScanResult = {
      timestamp: Date.now(),
      totalElements: elements.length,
      scannedElements: elementsToScan.length,
      issueCount,
      issues,
      elementResults,
      score: calculateAccessibilityScore(issues),
      wcagCompliance
    };

    this.lastScanResult = result;
    this.scanHistory.push(result);
    this.saveToStorage();

    this.onScanComplete?.(result);

    return result;
  }

  /**
   * Scan a single element
   */
  private scanElement(
    element: DesignElement,
    allElements: DesignElement[],
    options: AccessibilityScanOptions
  ): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Run checks based on element type
    if (element.type === 'text') {
      issues.push(...this.checkTextContrast(element, allElements));
      issues.push(...this.checkTextSize(element));
      issues.push(...this.checkTextContent(element));
    }

    if (element.type === 'image') {
      issues.push(...this.checkImageAccessibility(element));
    }

    if (element.type === 'shape' || element.type === 'button') {
      issues.push(...this.checkInteractiveElement(element));
      issues.push(...this.checkNonTextContrast(element, allElements));
    }

    // Filter by categories if specified
    if (options.includeCategories && options.includeCategories.length > 0) {
      return issues.filter(i => options.includeCategories!.includes(i.category));
    }

    if (options.excludeCategories && options.excludeCategories.length > 0) {
      return issues.filter(i => !options.excludeCategories!.includes(i.category));
    }

    // Filter by target level
    return issues.filter(i => this.isWithinLevel(i.wcagLevel, options.targetLevel));
  }

  // ============================================================================
  // CHECK FUNCTIONS
  // ============================================================================

  /**
   * Check text contrast
   */
  private checkTextContrast(element: DesignElement, allElements: DesignElement[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    const foreground = (element as any).fill || (element as any).color || '#000000';
    const background = this.findBackgroundColor(element, allElements);

    if (!background) return issues;

    const ratio = calculateContrastRatio(foreground, background);
    const contrastResult = checkContrast(ratio);
    const fontSize = (element as any).fontSize || 16;
    const fontWeight = (element as any).fontWeight || 400;
    const isLarge = isLargeText(fontSize, fontWeight >= 700);

    const meetsAA = isLarge ? contrastResult.meetsAALarge : contrastResult.meetsAA;
    const meetsAAA = isLarge ? contrastResult.meetsAAALarge : contrastResult.meetsAAA;

    if (!meetsAA) {
      const severity = getContrastSeverity(ratio, isLarge);

      issues.push({
        id: generateIssueId(),
        elementId: element.id,
        category: 'contrast',
        severity,
        wcagCriteria: '1.4.3',
        wcagLevel: 'AA',
        title: 'Insufficient text contrast',
        description: `Text contrast ratio is ${ratio.toFixed(2)}:1, which is below the required ${isLarge ? '3:1' : '4.5:1'} for ${isLarge ? 'large' : 'normal'} text.`,
        impact: 'Users with low vision may have difficulty reading this text.',
        recommendation: getRecommendation('contrast', 'low'),
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        autoFixable: true
      });
    } else if (!meetsAAA) {
      issues.push({
        id: generateIssueId(),
        elementId: element.id,
        category: 'contrast',
        severity: 'minor',
        wcagCriteria: '1.4.6',
        wcagLevel: 'AAA',
        title: 'Enhanced contrast not met',
        description: `Text contrast ratio is ${ratio.toFixed(2)}:1. For AAA compliance, ${isLarge ? '4.5:1' : '7:1'} is required.`,
        impact: 'Some users may benefit from higher contrast.',
        recommendation: 'Consider increasing contrast for enhanced accessibility.',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html',
        autoFixable: true
      });
    }

    return issues;
  }

  /**
   * Check text size
   */
  private checkTextSize(element: DesignElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const fontSize = (element as any).fontSize || 16;

    if (fontSize < 12) {
      issues.push({
        id: generateIssueId(),
        elementId: element.id,
        category: 'text',
        severity: 'moderate',
        wcagCriteria: '1.4.4',
        wcagLevel: 'AA',
        title: 'Text may be too small',
        description: `Font size is ${fontSize}px, which may be difficult to read for some users.`,
        impact: 'Users may have difficulty reading small text.',
        recommendation: getRecommendation('text', 'small-text'),
        autoFixable: true
      });
    }

    return issues;
  }

  /**
   * Check text content
   */
  private checkTextContent(element: DesignElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const text = (element as any).text || '';

    // Check for all caps
    if (text.length > 10 && text === text.toUpperCase()) {
      issues.push({
        id: generateIssueId(),
        elementId: element.id,
        category: 'text',
        severity: 'minor',
        wcagCriteria: '1.4.12',
        wcagLevel: 'AA',
        title: 'Extended use of uppercase text',
        description: 'Long passages of uppercase text can be harder to read.',
        impact: 'May reduce reading speed and comprehension.',
        recommendation: 'Consider using sentence case or title case for better readability.',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Check image accessibility
   */
  private checkImageAccessibility(element: DesignElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const alt = (element as any).alt || (element as any).altText;

    if (!alt || alt.trim() === '') {
      issues.push({
        id: generateIssueId(),
        elementId: element.id,
        category: 'images',
        severity: 'serious',
        wcagCriteria: '1.1.1',
        wcagLevel: 'A',
        title: 'Image missing alt text',
        description: 'This image does not have alternative text.',
        impact: 'Screen reader users will not understand the image content.',
        recommendation: getRecommendation('images', 'missing-alt'),
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Check interactive element accessibility
   */
  private checkInteractiveElement(element: DesignElement): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check touch target size
    if (element.width < 44 || element.height < 44) {
      issues.push({
        id: generateIssueId(),
        elementId: element.id,
        category: 'interactive',
        severity: 'moderate',
        wcagCriteria: '2.5.5',
        wcagLevel: 'AAA',
        title: 'Touch target too small',
        description: `Element size is ${Math.round(element.width)}x${Math.round(element.height)}px. Minimum recommended is 44x44px.`,
        impact: 'Users with motor impairments may have difficulty tapping this element.',
        recommendation: getRecommendation('interactive', 'target-size'),
        autoFixable: true
      });
    }

    return issues;
  }

  /**
   * Check non-text contrast
   */
  private checkNonTextContrast(element: DesignElement, allElements: DesignElement[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    const fill = (element as any).fill || (element as any).backgroundColor;
    const stroke = (element as any).stroke || (element as any).borderColor;
    const background = this.findBackgroundColor(element, allElements);

    if (!background) return issues;

    // Check fill contrast
    if (fill && fill !== 'transparent') {
      const ratio = calculateContrastRatio(fill, background);
      if (ratio < 3) {
        issues.push({
          id: generateIssueId(),
          elementId: element.id,
          category: 'contrast',
          severity: 'moderate',
          wcagCriteria: '1.4.11',
          wcagLevel: 'AA',
          title: 'Insufficient non-text contrast',
          description: `UI component contrast is ${ratio.toFixed(2)}:1, which is below the required 3:1.`,
          impact: 'Users with low vision may not perceive this element.',
          recommendation: 'Increase the contrast of this UI element to at least 3:1.',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html',
          autoFixable: true
        });
      }
    }

    return issues;
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Find background color for an element
   */
  private findBackgroundColor(element: DesignElement, allElements: DesignElement[]): string | null {
    // Look for elements behind this one
    const elementsBehind = allElements.filter(el =>
      el.id !== element.id &&
      el.x <= element.x &&
      el.y <= element.y &&
      el.x + el.width >= element.x + element.width &&
      el.y + el.height >= element.y + element.height
    );

    for (const bg of elementsBehind) {
      const fill = (bg as any).fill || (bg as any).backgroundColor;
      if (fill && fill !== 'transparent') {
        return fill;
      }
    }

    // Default to white background
    return '#ffffff';
  }

  /**
   * Get WCAG level from criteria
   */
  private getWcagLevel(criteria: string): WCAGLevel {
    return WCAG_CRITERIA[criteria]?.level || 'A';
  }

  /**
   * Check if issue level is within target level
   */
  private isWithinLevel(issueLevel: WCAGLevel, targetLevel: WCAGLevel): boolean {
    const levels: WCAGLevel[] = ['A', 'AA', 'AAA'];
    const issueIndex = levels.indexOf(issueLevel);
    const targetIndex = levels.indexOf(targetLevel);
    return issueIndex <= targetIndex;
  }

  // ============================================================================
  // AUTO-FIX
  // ============================================================================

  /**
   * Attempt to auto-fix an issue
   */
  autoFix(issue: AccessibilityIssue, element: DesignElement): AutoFixResult {
    const changes: { property: string; oldValue: any; newValue: any }[] = [];

    switch (issue.category) {
      case 'contrast':
        if (issue.wcagCriteria === '1.4.3' || issue.wcagCriteria === '1.4.6') {
          // Suggest darker/lighter color
          const currentColor = (element as any).fill || (element as any).color || '#000000';
          const newColor = this.adjustContrastColor(currentColor);

          changes.push({
            property: 'fill',
            oldValue: currentColor,
            newValue: newColor
          });
        }
        break;

      case 'text':
        if (issue.title.includes('too small')) {
          const currentSize = (element as any).fontSize || 16;
          const newSize = Math.max(currentSize, 14);

          changes.push({
            property: 'fontSize',
            oldValue: currentSize,
            newValue: newSize
          });
        }
        break;

      case 'interactive':
        if (issue.title.includes('target too small')) {
          changes.push({
            property: 'width',
            oldValue: element.width,
            newValue: Math.max(element.width, 44)
          });
          changes.push({
            property: 'height',
            oldValue: element.height,
            newValue: Math.max(element.height, 44)
          });
        }
        break;
    }

    return {
      success: changes.length > 0,
      issueId: issue.id,
      changes
    };
  }

  /**
   * Adjust color for better contrast
   */
  private adjustContrastColor(color: string): string {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Adjust based on brightness
    if (brightness > 128) {
      // Darken
      r = Math.max(0, r - 60);
      g = Math.max(0, g - 60);
      b = Math.max(0, b - 60);
    } else {
      // Lighten
      r = Math.min(255, r + 60);
      g = Math.min(255, g + 60);
      b = Math.min(255, b + 60);
    }

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // ============================================================================
  // GETTERS & SETTERS
  // ============================================================================

  /**
   * Get last scan result
   */
  getLastScanResult(): AccessibilityScanResult | null {
    return this.lastScanResult;
  }

  /**
   * Get scan history
   */
  getScanHistory(): AccessibilityScanResult[] {
    return this.scanHistory;
  }

  /**
   * Get settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<typeof this.settings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
  }

  /**
   * Clear scan history
   */
  clearHistory(): void {
    this.scanHistory = [];
    this.lastScanResult = null;
    this.saveToStorage();
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnScanComplete(callback: (result: AccessibilityScanResult) => void): void {
    this.onScanComplete = callback;
  }

  setOnIssueSelected(callback: (issue: AccessibilityIssue) => void): void {
    this.onIssueSelected = callback;
  }

  selectIssue(issue: AccessibilityIssue): void {
    this.onIssueSelected?.(issue);
  }

  // ============================================================================
  // EXPORT REPORT
  // ============================================================================

  /**
   * Export accessibility report
   */
  exportReport(result?: AccessibilityScanResult): string {
    const report = result || this.lastScanResult;
    if (!report) return '';

    const lines: string[] = [
      '# Accessibility Report',
      '',
      `**Generated:** ${new Date(report.timestamp).toLocaleString()}`,
      `**Elements Scanned:** ${report.scannedElements}/${report.totalElements}`,
      `**Accessibility Score:** ${report.score}/100`,
      '',
      '## WCAG Compliance',
      `- Level A: ${report.wcagCompliance.a ? 'Pass' : 'Fail'}`,
      `- Level AA: ${report.wcagCompliance.aa ? 'Pass' : 'Fail'}`,
      `- Level AAA: ${report.wcagCompliance.aaa ? 'Pass' : 'Fail'}`,
      '',
      '## Issue Summary',
      `- Critical: ${report.issueCount.critical}`,
      `- Serious: ${report.issueCount.serious}`,
      `- Moderate: ${report.issueCount.moderate}`,
      `- Minor: ${report.issueCount.minor}`,
      '',
      '## Issues'
    ];

    // Group issues by severity
    const groupedIssues = {
      critical: report.issues.filter(i => i.severity === 'critical'),
      serious: report.issues.filter(i => i.severity === 'serious'),
      moderate: report.issues.filter(i => i.severity === 'moderate'),
      minor: report.issues.filter(i => i.severity === 'minor')
    };

    Object.entries(groupedIssues).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        lines.push('', `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${issues.length})`);

        issues.forEach((issue, index) => {
          lines.push(
            '',
            `#### ${index + 1}. ${issue.title}`,
            `**Element:** ${issue.elementId}`,
            `**WCAG:** ${issue.wcagCriteria} (Level ${issue.wcagLevel})`,
            '',
            issue.description,
            '',
            `**Impact:** ${issue.impact}`,
            '',
            `**Recommendation:** ${issue.recommendation}`
          );

          if (issue.helpUrl) {
            lines.push('', `[Learn more](${issue.helpUrl})`);
          }
        });
      }
    });

    return lines.join('\n');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const accessibilityChecker = new AccessibilityChecker();
