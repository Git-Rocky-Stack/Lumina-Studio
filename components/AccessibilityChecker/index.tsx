// ============================================================================
// ACCESSIBILITY CHECKER PANEL - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { accessibilityChecker } from '../../services/accessibilityService';
import {
  SEVERITY_INFO,
  CATEGORY_INFO,
  COLOR_BLINDNESS_INFO,
  formatWcagCriteria,
  simulateColorBlindness
} from '../../types/accessibility';
import type {
  AccessibilityIssue,
  AccessibilityScanResult,
  IssueSeverity,
  IssueCategory,
  WCAGLevel,
  ColorBlindnessType
} from '../../types/accessibility';
import type { DesignElement } from '../../types';

// ============================================================================
// DESIGN SYSTEM TOKENS
// ============================================================================

const colors = {
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a24',
    elevated: '#1e1e2a',
    hover: '#252532'
  },
  border: {
    subtle: '#2a2a3a',
    default: '#3a3a4a',
    focus: '#6366f1'
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    tertiary: '#707080',
    muted: '#505060'
  },
  accent: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

// ============================================================================
// MAIN ACCESSIBILITY PANEL
// ============================================================================

interface AccessibilityPanelProps {
  elements: DesignElement[];
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: Partial<DesignElement>) => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  elements,
  onElementSelect,
  onElementUpdate
}) => {
  const [scanResult, setScanResult] = useState<AccessibilityScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<IssueCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'issues' | 'simulation' | 'settings'>('issues');
  const [targetLevel, setTargetLevel] = useState<WCAGLevel>('AA');
  const [colorBlindnessMode, setColorBlindnessMode] = useState<ColorBlindnessType | null>(null);

  // Load last scan result
  useEffect(() => {
    const lastResult = accessibilityChecker.getLastScanResult();
    if (lastResult) {
      setScanResult(lastResult);
    }
  }, []);

  // Run scan
  const handleScan = useCallback(() => {
    setIsScanning(true);

    // Simulate async scan
    setTimeout(() => {
      const result = accessibilityChecker.scan(elements, { targetLevel });
      setScanResult(result);
      setIsScanning(false);
    }, 500);
  }, [elements, targetLevel]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    if (!scanResult) return [];

    let issues = scanResult.issues;

    if (filterSeverity !== 'all') {
      issues = issues.filter(i => i.severity === filterSeverity);
    }

    if (filterCategory !== 'all') {
      issues = issues.filter(i => i.category === filterCategory);
    }

    return issues;
  }, [scanResult, filterSeverity, filterCategory]);

  // Handle issue select
  const handleIssueSelect = useCallback((issue: AccessibilityIssue) => {
    setSelectedIssue(issue);
    onElementSelect?.(issue.elementId);
  }, [onElementSelect]);

  // Handle auto-fix
  const handleAutoFix = useCallback((issue: AccessibilityIssue) => {
    const element = elements.find(el => el.id === issue.elementId);
    if (!element) return;

    const fixResult = accessibilityChecker.autoFix(issue, element);

    if (fixResult.success) {
      const updates: Partial<DesignElement> = {};
      fixResult.changes.forEach(change => {
        (updates as any)[change.property] = change.newValue;
      });
      onElementUpdate?.(element.id, updates);

      // Re-scan after fix
      handleScan();
    }
  }, [elements, onElementUpdate, handleScan]);

  // Export report
  const handleExportReport = useCallback(() => {
    const report = accessibilityChecker.exportReport(scanResult || undefined);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessibility-report.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [scanResult]);

  return (
    <div
      className="w-80 h-full flex flex-col border-l"
      style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.subtle }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: colors.border.subtle }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.accent.success + '20' }}
            >
              <i className="fa-solid fa-universal-access" style={{ color: colors.accent.success }} />
            </div>
            <span className="font-medium" style={{ color: colors.text.primary }}>
              Accessibility
            </span>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: colors.accent.primary, color: '#fff' }}
          >
            {isScanning ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-1.5" />
                Scanning...
              </>
            ) : (
              <>
                <i className="fa-solid fa-search mr-1.5" />
                Scan
              </>
            )}
          </button>
        </div>

        {/* Score Display */}
        {scanResult && (
          <div className="flex items-center gap-4">
            <ScoreGauge score={scanResult.score} />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <IssueBadge severity="critical" count={scanResult.issueCount.critical} />
                <IssueBadge severity="serious" count={scanResult.issueCount.serious} />
                <IssueBadge severity="moderate" count={scanResult.issueCount.moderate} />
                <IssueBadge severity="minor" count={scanResult.issueCount.minor} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: colors.border.subtle }}>
        {(['issues', 'simulation', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 text-sm capitalize transition-colors relative"
            style={{
              color: activeTab === tab ? colors.accent.primary : colors.text.secondary
            }}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="a11y-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: colors.accent.primary }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'issues' && (
          <IssuesTab
            issues={filteredIssues}
            selectedIssue={selectedIssue}
            filterSeverity={filterSeverity}
            filterCategory={filterCategory}
            onFilterSeverity={setFilterSeverity}
            onFilterCategory={setFilterCategory}
            onIssueSelect={handleIssueSelect}
            onAutoFix={handleAutoFix}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationTab
            colorBlindnessMode={colorBlindnessMode}
            onColorBlindnessChange={setColorBlindnessMode}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            targetLevel={targetLevel}
            onTargetLevelChange={setTargetLevel}
            onExportReport={handleExportReport}
          />
        )}
      </div>

      {/* Issue Detail Drawer */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailDrawer
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onAutoFix={() => handleAutoFix(selectedIssue)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// SCORE GAUGE
// ============================================================================

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const getColor = () => {
    if (score >= 90) return colors.accent.success;
    if (score >= 70) return colors.accent.warning;
    return colors.accent.error;
  };

  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke={colors.background.tertiary}
          strokeWidth="4"
        />
        <motion.circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke={getColor()}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${score * 1.5} 150`}
          initial={{ strokeDasharray: '0 150' }}
          animate={{ strokeDasharray: `${score * 1.5} 150` }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-bold"
        style={{ color: getColor() }}
      >
        {score}
      </div>
    </div>
  );
};

// ============================================================================
// ISSUE BADGE
// ============================================================================

interface IssueBadgeProps {
  severity: IssueSeverity;
  count: number;
}

const IssueBadge: React.FC<IssueBadgeProps> = ({ severity, count }) => {
  if (count === 0) return null;

  return (
    <span
      className="px-1.5 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: SEVERITY_INFO[severity].color + '20',
        color: SEVERITY_INFO[severity].color
      }}
    >
      {count}
    </span>
  );
};

// ============================================================================
// ISSUES TAB
// ============================================================================

interface IssuesTabProps {
  issues: AccessibilityIssue[];
  selectedIssue: AccessibilityIssue | null;
  filterSeverity: IssueSeverity | 'all';
  filterCategory: IssueCategory | 'all';
  onFilterSeverity: (severity: IssueSeverity | 'all') => void;
  onFilterCategory: (category: IssueCategory | 'all') => void;
  onIssueSelect: (issue: AccessibilityIssue) => void;
  onAutoFix: (issue: AccessibilityIssue) => void;
}

const IssuesTab: React.FC<IssuesTabProps> = ({
  issues,
  selectedIssue,
  filterSeverity,
  filterCategory,
  onFilterSeverity,
  onFilterCategory,
  onIssueSelect,
  onAutoFix
}) => (
  <div className="p-3">
    {/* Filters */}
    <div className="flex gap-2 mb-3">
      <select
        value={filterSeverity}
        onChange={e => onFilterSeverity(e.target.value as any)}
        className="flex-1 px-2 py-1.5 text-xs rounded-lg outline-none"
        style={{
          backgroundColor: colors.background.tertiary,
          color: colors.text.primary,
          border: `1px solid ${colors.border.subtle}`
        }}
      >
        <option value="all">All Severity</option>
        <option value="critical">Critical</option>
        <option value="serious">Serious</option>
        <option value="moderate">Moderate</option>
        <option value="minor">Minor</option>
      </select>

      <select
        value={filterCategory}
        onChange={e => onFilterCategory(e.target.value as any)}
        className="flex-1 px-2 py-1.5 text-xs rounded-lg outline-none"
        style={{
          backgroundColor: colors.background.tertiary,
          color: colors.text.primary,
          border: `1px solid ${colors.border.subtle}`
        }}
      >
        <option value="all">All Categories</option>
        {Object.entries(CATEGORY_INFO).map(([key, info]) => (
          <option key={key} value={key}>{info.label}</option>
        ))}
      </select>
    </div>

    {/* Issue List */}
    <div className="space-y-2">
      {issues.map(issue => (
        <IssueCard
          key={issue.id}
          issue={issue}
          isSelected={selectedIssue?.id === issue.id}
          onClick={() => onIssueSelect(issue)}
          onAutoFix={() => onAutoFix(issue)}
        />
      ))}

      {issues.length === 0 && (
        <div className="text-center py-8">
          <i
            className="fa-solid fa-check-circle text-3xl mb-2"
            style={{ color: colors.accent.success }}
          />
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            No issues found!
          </p>
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// ISSUE CARD
// ============================================================================

interface IssueCardProps {
  issue: AccessibilityIssue;
  isSelected: boolean;
  onClick: () => void;
  onAutoFix: () => void;
}

const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  isSelected,
  onClick,
  onAutoFix
}) => (
  <motion.div
    layout
    onClick={onClick}
    className="p-3 rounded-lg cursor-pointer transition-colors"
    style={{
      backgroundColor: isSelected ? colors.accent.primary + '15' : colors.background.tertiary,
      border: `1px solid ${isSelected ? colors.accent.primary : colors.border.subtle}`
    }}
  >
    <div className="flex items-start gap-2">
      <i
        className={`fa-solid ${SEVERITY_INFO[issue.severity].icon} text-sm mt-0.5`}
        style={{ color: SEVERITY_INFO[issue.severity].color }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{ color: colors.text.primary }}
        >
          {issue.title}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: CATEGORY_INFO[issue.category] ?
                colors.background.elevated : colors.background.tertiary,
              color: colors.text.tertiary
            }}
          >
            {CATEGORY_INFO[issue.category]?.label || issue.category}
          </span>
          <span className="text-xs" style={{ color: colors.text.tertiary }}>
            WCAG {issue.wcagCriteria}
          </span>
        </div>
      </div>

      {issue.autoFixable && (
        <button
          onClick={e => {
            e.stopPropagation();
            onAutoFix();
          }}
          className="p-1.5 rounded transition-colors hover:bg-white/10"
          title="Auto-fix"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-xs" style={{ color: colors.accent.success }} />
        </button>
      )}
    </div>
  </motion.div>
);

// ============================================================================
// ISSUE DETAIL DRAWER
// ============================================================================

interface IssueDetailDrawerProps {
  issue: AccessibilityIssue;
  onClose: () => void;
  onAutoFix: () => void;
}

const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  issue,
  onClose,
  onAutoFix
}) => (
  <motion.div
    initial={{ y: '100%' }}
    animate={{ y: 0 }}
    exit={{ y: '100%' }}
    transition={{ type: 'spring', damping: 25 }}
    className="absolute bottom-0 left-0 right-0 max-h-[60%] overflow-y-auto rounded-t-xl"
    style={{
      backgroundColor: colors.background.elevated,
      borderTop: `1px solid ${colors.border.default}`
    }}
  >
    <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{
      backgroundColor: colors.background.elevated,
      borderColor: colors.border.subtle
    }}>
      <div className="flex items-center gap-2">
        <i
          className={`fa-solid ${SEVERITY_INFO[issue.severity].icon}`}
          style={{ color: SEVERITY_INFO[issue.severity].color }}
        />
        <span className="font-medium" style={{ color: colors.text.primary }}>
          {issue.title}
        </span>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded hover:bg-white/10"
      >
        <i className="fa-solid fa-xmark" style={{ color: colors.text.secondary }} />
      </button>
    </div>

    <div className="p-4 space-y-4">
      {/* WCAG Info */}
      <div>
        <div className="text-xs font-medium mb-1" style={{ color: colors.text.tertiary }}>
          WCAG Criterion
        </div>
        <div className="text-sm" style={{ color: colors.text.secondary }}>
          {formatWcagCriteria(issue.wcagCriteria)}
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="text-xs font-medium mb-1" style={{ color: colors.text.tertiary }}>
          Description
        </div>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {issue.description}
        </p>
      </div>

      {/* Impact */}
      <div>
        <div className="text-xs font-medium mb-1" style={{ color: colors.text.tertiary }}>
          Impact
        </div>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {issue.impact}
        </p>
      </div>

      {/* Recommendation */}
      <div>
        <div className="text-xs font-medium mb-1" style={{ color: colors.text.tertiary }}>
          How to Fix
        </div>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {issue.recommendation}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {issue.autoFixable && (
          <button
            onClick={onAutoFix}
            className="flex-1 py-2 text-sm rounded-lg transition-colors"
            style={{ backgroundColor: colors.accent.success, color: '#fff' }}
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-1.5" />
            Auto-Fix
          </button>
        )}
        {issue.helpUrl && (
          <a
            href={issue.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.secondary
            }}
          >
            <i className="fa-solid fa-external-link mr-1.5" />
            Learn More
          </a>
        )}
      </div>
    </div>
  </motion.div>
);

// ============================================================================
// SIMULATION TAB
// ============================================================================

interface SimulationTabProps {
  colorBlindnessMode: ColorBlindnessType | null;
  onColorBlindnessChange: (mode: ColorBlindnessType | null) => void;
}

const SimulationTab: React.FC<SimulationTabProps> = ({
  colorBlindnessMode,
  onColorBlindnessChange
}) => (
  <div className="p-3 space-y-4">
    <div>
      <h4 className="text-sm font-medium mb-3" style={{ color: colors.text.primary }}>
        Color Blindness Simulation
      </h4>
      <p className="text-xs mb-3" style={{ color: colors.text.tertiary }}>
        Preview how your design appears to users with different types of color vision deficiency.
      </p>

      <div className="space-y-2">
        <button
          onClick={() => onColorBlindnessChange(null)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: !colorBlindnessMode ? colors.accent.primary + '20' : colors.background.tertiary,
            border: `1px solid ${!colorBlindnessMode ? colors.accent.primary : colors.border.subtle}`
          }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-eye" style={{ color: colors.text.secondary }} />
            <span className="text-sm" style={{ color: colors.text.primary }}>Normal Vision</span>
          </div>
          {!colorBlindnessMode && (
            <i className="fa-solid fa-check text-sm" style={{ color: colors.accent.primary }} />
          )}
        </button>

        {(Object.entries(COLOR_BLINDNESS_INFO) as [ColorBlindnessType, typeof COLOR_BLINDNESS_INFO[ColorBlindnessType]][]).map(([type, info]) => (
          <button
            key={type}
            onClick={() => onColorBlindnessChange(type)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: colorBlindnessMode === type ? colors.accent.primary + '20' : colors.background.tertiary,
              border: `1px solid ${colorBlindnessMode === type ? colors.accent.primary : colors.border.subtle}`
            }}
          >
            <div>
              <div className="text-sm text-left" style={{ color: colors.text.primary }}>
                {info.label}
              </div>
              <div className="text-xs text-left" style={{ color: colors.text.tertiary }}>
                {info.description}
              </div>
            </div>
            {colorBlindnessMode === type && (
              <i className="fa-solid fa-check text-sm" style={{ color: colors.accent.primary }} />
            )}
          </button>
        ))}
      </div>
    </div>

    {/* Color Preview */}
    <div>
      <h4 className="text-sm font-medium mb-3" style={{ color: colors.text.primary }}>
        Color Preview
      </h4>
      <div className="grid grid-cols-4 gap-2">
        {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map(color => (
          <div key={color} className="text-center">
            <div
              className="w-full aspect-square rounded-lg mb-1"
              style={{
                backgroundColor: colorBlindnessMode
                  ? simulateColorBlindness(color, colorBlindnessMode)
                  : color
              }}
            />
            <span className="text-xs font-mono" style={{ color: colors.text.tertiary }}>
              {color}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// SETTINGS TAB
// ============================================================================

interface SettingsTabProps {
  targetLevel: WCAGLevel;
  onTargetLevelChange: (level: WCAGLevel) => void;
  onExportReport: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  targetLevel,
  onTargetLevelChange,
  onExportReport
}) => (
  <div className="p-3 space-y-4">
    {/* WCAG Level */}
    <div>
      <h4 className="text-sm font-medium mb-3" style={{ color: colors.text.primary }}>
        WCAG Conformance Target
      </h4>
      <div className="flex gap-2">
        {(['A', 'AA', 'AAA'] as WCAGLevel[]).map(level => (
          <button
            key={level}
            onClick={() => onTargetLevelChange(level)}
            className="flex-1 py-2 text-sm rounded-lg transition-colors"
            style={{
              backgroundColor: targetLevel === level ? colors.accent.primary : colors.background.tertiary,
              color: targetLevel === level ? '#fff' : colors.text.secondary
            }}
          >
            Level {level}
          </button>
        ))}
      </div>
      <p className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
        {targetLevel === 'A' && 'Minimum level of accessibility.'}
        {targetLevel === 'AA' && 'Recommended level for most websites.'}
        {targetLevel === 'AAA' && 'Highest level of accessibility.'}
      </p>
    </div>

    {/* Export */}
    <div>
      <h4 className="text-sm font-medium mb-3" style={{ color: colors.text.primary }}>
        Export Report
      </h4>
      <button
        onClick={onExportReport}
        className="w-full py-2 text-sm rounded-lg transition-colors"
        style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
      >
        <i className="fa-solid fa-file-export mr-1.5" />
        Export Accessibility Report
      </button>
    </div>

    {/* About */}
    <div
      className="p-3 rounded-lg"
      style={{ backgroundColor: colors.background.tertiary }}
    >
      <h4 className="text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
        About WCAG
      </h4>
      <p className="text-xs" style={{ color: colors.text.tertiary }}>
        Web Content Accessibility Guidelines (WCAG) provide recommendations for making web
        content more accessible to people with disabilities.
      </p>
      <a
        href="https://www.w3.org/WAI/WCAG21/quickref/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs mt-2"
        style={{ color: colors.accent.primary }}
      >
        Learn more about WCAG
        <i className="fa-solid fa-external-link ml-1" />
      </a>
    </div>
  </div>
);

// ============================================================================
// ACCESSIBILITY OVERLAY (for canvas)
// ============================================================================

interface AccessibilityOverlayProps {
  elements: DesignElement[];
  issues: AccessibilityIssue[];
  highlightedIssue?: AccessibilityIssue;
  scale?: number;
}

export const AccessibilityOverlay: React.FC<AccessibilityOverlayProps> = ({
  elements,
  issues,
  highlightedIssue,
  scale = 1
}) => {
  const issuesByElement = useMemo(() => {
    const map = new Map<string, AccessibilityIssue[]>();
    issues.forEach(issue => {
      if (!map.has(issue.elementId)) {
        map.set(issue.elementId, []);
      }
      map.get(issue.elementId)!.push(issue);
    });
    return map;
  }, [issues]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {elements.map(element => {
        const elementIssues = issuesByElement.get(element.id) || [];
        if (elementIssues.length === 0) return null;

        const worstSeverity = elementIssues.reduce((worst, issue) => {
          const severityOrder: IssueSeverity[] = ['minor', 'moderate', 'serious', 'critical'];
          return severityOrder.indexOf(issue.severity) > severityOrder.indexOf(worst)
            ? issue.severity
            : worst;
        }, 'minor' as IssueSeverity);

        const isHighlighted = highlightedIssue && elementIssues.some(i => i.id === highlightedIssue.id);

        return (
          <motion.div
            key={element.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute rounded"
            style={{
              left: element.x * scale,
              top: element.y * scale,
              width: element.width * scale,
              height: element.height * scale,
              border: `2px ${isHighlighted ? 'solid' : 'dashed'} ${SEVERITY_INFO[worstSeverity].color}`,
              backgroundColor: isHighlighted ? SEVERITY_INFO[worstSeverity].color + '20' : 'transparent'
            }}
          >
            {/* Issue indicator */}
            <div
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: SEVERITY_INFO[worstSeverity].color,
                color: '#fff'
              }}
            >
              {elementIssues.length}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AccessibilityPanel;
