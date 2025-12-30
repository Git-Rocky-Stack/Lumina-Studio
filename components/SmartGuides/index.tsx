// ============================================================================
// SMART GUIDES - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartGuidesManager } from '../../services/smartGuidesService';
import {
  formatDistance,
  ALIGNMENT_INFO,
  DISTRIBUTION_INFO
} from '../../types/smartGuides';
import type {
  SmartGuide,
  SpacingIndicator,
  RulerGuide,
  SmartGuidesSettings,
  AlignmentType,
  DistributionType
} from '../../types/smartGuides';
import type { DesignElement } from '../../types';

// ============================================================================
// DESIGN SYSTEM TOKENS
// ============================================================================

const colors = {
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a24'
  },
  border: {
    subtle: '#2a2a3a',
    default: '#3a3a4a'
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    tertiary: '#707080'
  },
  accent: {
    primary: '#6366f1',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  guide: {
    edge: '#6366f1',
    center: '#ec4899',
    spacing: '#22c55e',
    ruler: '#f59e0b'
  }
};

// ============================================================================
// SMART GUIDES OVERLAY (Canvas Overlay)
// ============================================================================

interface SmartGuidesOverlayProps {
  guides: SmartGuide[];
  spacingIndicators: SpacingIndicator[];
  rulerGuides: RulerGuide[];
  scale?: number;
  showDistances?: boolean;
}

export const SmartGuidesOverlay: React.FC<SmartGuidesOverlayProps> = ({
  guides,
  spacingIndicators,
  rulerGuides,
  scale = 1,
  showDistances = true
}) => {
  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 1000 }}>
      <defs>
        <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke={colors.border.subtle} strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Ruler Guides */}
      {rulerGuides.map(guide => (
        <RulerGuideLine key={guide.id} guide={guide} scale={scale} />
      ))}

      {/* Smart Guides */}
      <AnimatePresence>
        {guides.map(guide => (
          <SmartGuideLine key={guide.id} guide={guide} scale={scale} />
        ))}
      </AnimatePresence>

      {/* Spacing Indicators */}
      <AnimatePresence>
        {spacingIndicators.map(indicator => (
          <SpacingIndicatorLine
            key={indicator.id}
            indicator={indicator}
            scale={scale}
            showDistance={showDistances}
          />
        ))}
      </AnimatePresence>
    </svg>
  );
};

// ============================================================================
// SMART GUIDE LINE
// ============================================================================

interface SmartGuideLineProps {
  guide: SmartGuide;
  scale: number;
}

const SmartGuideLine: React.FC<SmartGuideLineProps> = ({ guide, scale }) => {
  const color = guide.type === 'center' ? colors.guide.center : colors.guide.edge;

  if (guide.orientation === 'vertical') {
    return (
      <motion.line
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        x1={guide.position * scale}
        y1={guide.start * scale}
        x2={guide.position * scale}
        y2={guide.end * scale}
        stroke={color}
        strokeWidth={1}
        strokeDasharray={guide.type === 'center' ? '4,4' : 'none'}
      />
    );
  }

  return (
    <motion.line
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      x1={guide.start * scale}
      y1={guide.position * scale}
      x2={guide.end * scale}
      y2={guide.position * scale}
      stroke={color}
      strokeWidth={1}
      strokeDasharray={guide.type === 'center' ? '4,4' : 'none'}
    />
  );
};

// ============================================================================
// RULER GUIDE LINE
// ============================================================================

interface RulerGuideLineProps {
  guide: RulerGuide;
  scale: number;
}

const RulerGuideLine: React.FC<RulerGuideLineProps> = ({ guide, scale }) => {
  const color = guide.color || colors.guide.ruler;

  if (guide.orientation === 'vertical') {
    return (
      <line
        x1={guide.position * scale}
        y1={0}
        x2={guide.position * scale}
        y2="100%"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.7}
      />
    );
  }

  return (
    <line
      x1={0}
      y1={guide.position * scale}
      x2="100%"
      y2={guide.position * scale}
      stroke={color}
      strokeWidth={1}
      strokeOpacity={0.7}
    />
  );
};

// ============================================================================
// SPACING INDICATOR LINE
// ============================================================================

interface SpacingIndicatorLineProps {
  indicator: SpacingIndicator;
  scale: number;
  showDistance: boolean;
}

const SpacingIndicatorLine: React.FC<SpacingIndicatorLineProps> = ({
  indicator,
  scale,
  showDistance
}) => {
  const { position, length, orientation, value } = indicator;

  if (orientation === 'horizontal') {
    const x = position.x * scale;
    const y = position.y * scale;
    const len = length * scale;

    return (
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {/* Line */}
        <line
          x1={x}
          y1={y}
          x2={x + len}
          y2={y}
          stroke={colors.guide.spacing}
          strokeWidth={1}
        />
        {/* End caps */}
        <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke={colors.guide.spacing} strokeWidth={1} />
        <line x1={x + len} y1={y - 4} x2={x + len} y2={y + 4} stroke={colors.guide.spacing} strokeWidth={1} />
        {/* Distance label */}
        {showDistance && (
          <g transform={`translate(${x + len / 2}, ${y - 8})`}>
            <rect
              x={-20}
              y={-10}
              width={40}
              height={16}
              rx={4}
              fill={colors.guide.spacing}
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={10}
              fontWeight={500}
            >
              {formatDistance(value)}
            </text>
          </g>
        )}
      </motion.g>
    );
  }

  // Vertical spacing
  const x = position.x * scale;
  const y = position.y * scale;
  const len = length * scale;

  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y + len}
        stroke={colors.guide.spacing}
        strokeWidth={1}
      />
      <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke={colors.guide.spacing} strokeWidth={1} />
      <line x1={x - 4} y1={y + len} x2={x + 4} y2={y + len} stroke={colors.guide.spacing} strokeWidth={1} />
      {showDistance && (
        <g transform={`translate(${x + 24}, ${y + len / 2})`}>
          <rect
            x={-20}
            y={-8}
            width={40}
            height={16}
            rx={4}
            fill={colors.guide.spacing}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={10}
            fontWeight={500}
          >
            {formatDistance(value)}
          </text>
        </g>
      )}
    </motion.g>
  );
};

// ============================================================================
// ALIGNMENT TOOLBAR
// ============================================================================

interface AlignmentToolbarProps {
  selectedElements: DesignElement[];
  onAlign: (updates: Map<string, { x: number; y: number }>) => void;
}

export const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({
  selectedElements,
  onAlign
}) => {
  const handleAlign = useCallback((type: AlignmentType) => {
    const updates = smartGuidesManager.alignElements(selectedElements, type);
    onAlign(updates);
  }, [selectedElements, onAlign]);

  const handleDistribute = useCallback((type: DistributionType) => {
    const updates = smartGuidesManager.distributeElements(selectedElements, type);
    onAlign(updates);
  }, [selectedElements, onAlign]);

  if (selectedElements.length < 2) return null;

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg"
      style={{ backgroundColor: colors.background.tertiary }}
    >
      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        {(Object.entries(ALIGNMENT_INFO) as [AlignmentType, typeof ALIGNMENT_INFO[AlignmentType]][]).map(([type, info]) => (
          <button
            key={type}
            onClick={() => handleAlign(type)}
            className="p-2 rounded transition-colors hover:bg-white/10"
            title={info.label}
          >
            <i className={`fa-solid ${info.icon} text-sm`} style={{ color: colors.text.secondary }} />
          </button>
        ))}
      </div>

      <div className="w-px h-6 mx-1" style={{ backgroundColor: colors.border.subtle }} />

      {/* Distribution */}
      {selectedElements.length >= 3 && (
        <div className="flex items-center gap-0.5">
          {(Object.entries(DISTRIBUTION_INFO) as [DistributionType, typeof DISTRIBUTION_INFO[DistributionType]][]).map(([type, info]) => (
            <button
              key={type}
              onClick={() => handleDistribute(type)}
              className="p-2 rounded transition-colors hover:bg-white/10"
              title={info.label}
            >
              <i className={`fa-solid ${info.icon} text-sm`} style={{ color: colors.text.secondary }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SMART GUIDES SETTINGS PANEL
// ============================================================================

interface SmartGuidesSettingsProps {
  onClose?: () => void;
}

export const SmartGuidesSettings: React.FC<SmartGuidesSettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<SmartGuidesSettings>(smartGuidesManager.getSettings());

  const handleUpdate = useCallback((updates: Partial<SmartGuidesSettings>) => {
    smartGuidesManager.updateSettings(updates);
    setSettings(smartGuidesManager.getSettings());
  }, []);

  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: colors.background.secondary }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium" style={{ color: colors.text.primary }}>
          Smart Guides Settings
        </h4>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <i className="fa-solid fa-xmark" style={{ color: colors.text.secondary }} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Enable/Disable */}
        <SettingToggle
          label="Enable Smart Guides"
          value={settings.enabled}
          onChange={v => handleUpdate({ enabled: v })}
        />

        <div className="border-t pt-4" style={{ borderColor: colors.border.subtle }}>
          <h5 className="text-sm font-medium mb-3" style={{ color: colors.text.secondary }}>
            Guide Types
          </h5>

          <div className="space-y-2">
            <SettingToggle
              label="Edge Alignment"
              description="Snap to element edges"
              value={settings.showEdgeGuides}
              onChange={v => handleUpdate({ showEdgeGuides: v })}
              disabled={!settings.enabled}
            />

            <SettingToggle
              label="Center Alignment"
              description="Snap to element centers"
              value={settings.showCenterGuides}
              onChange={v => handleUpdate({ showCenterGuides: v })}
              disabled={!settings.enabled}
            />

            <SettingToggle
              label="Spacing Guides"
              description="Show equal spacing indicators"
              value={settings.showSpacingGuides}
              onChange={v => handleUpdate({ showSpacingGuides: v })}
              disabled={!settings.enabled}
            />

            <SettingToggle
              label="Size Matches"
              description="Highlight matching sizes"
              value={settings.showSizeMatches}
              onChange={v => handleUpdate({ showSizeMatches: v })}
              disabled={!settings.enabled}
            />

            <SettingToggle
              label="Show Distances"
              description="Display distance labels"
              value={settings.showDistances}
              onChange={v => handleUpdate({ showDistances: v })}
              disabled={!settings.enabled}
            />
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: colors.border.subtle }}>
          <h5 className="text-sm font-medium mb-3" style={{ color: colors.text.secondary }}>
            Snap Behavior
          </h5>

          <div className="space-y-3">
            <SettingToggle
              label="Snap to Objects"
              value={settings.snapToObjects}
              onChange={v => handleUpdate({ snapToObjects: v })}
              disabled={!settings.enabled}
            />

            <SettingToggle
              label="Snap to Canvas"
              value={settings.snapToCanvas}
              onChange={v => handleUpdate({ snapToCanvas: v })}
              disabled={!settings.enabled}
            />

            <SettingToggle
              label="Snap to Grid"
              value={settings.snapToGrid}
              onChange={v => handleUpdate({ snapToGrid: v })}
              disabled={!settings.enabled}
            />

            {settings.snapToGrid && (
              <div className="ml-6">
                <label className="text-xs block mb-1" style={{ color: colors.text.tertiary }}>
                  Grid Size
                </label>
                <input
                  type="number"
                  value={settings.gridSize}
                  onChange={e => handleUpdate({ gridSize: Math.max(1, parseInt(e.target.value) || 10) })}
                  className="w-20 px-2 py-1 text-sm rounded"
                  style={{
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    border: `1px solid ${colors.border.subtle}`
                  }}
                  min={1}
                  max={100}
                />
                <span className="text-xs ml-1" style={{ color: colors.text.tertiary }}>px</span>
              </div>
            )}

            <div>
              <label className="text-xs block mb-1" style={{ color: colors.text.tertiary }}>
                Snap Threshold
              </label>
              <input
                type="range"
                value={settings.snapThreshold}
                onChange={e => handleUpdate({ snapThreshold: parseInt(e.target.value) })}
                min={2}
                max={20}
                className="w-full"
              />
              <div className="flex justify-between text-xs" style={{ color: colors.text.tertiary }}>
                <span>Precise</span>
                <span>{settings.snapThreshold}px</span>
                <span>Loose</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: colors.border.subtle }}>
          <h5 className="text-sm font-medium mb-3" style={{ color: colors.text.secondary }}>
            Colors
          </h5>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: colors.text.tertiary }}>Guides</label>
              <input
                type="color"
                value={settings.guideColor}
                onChange={e => handleUpdate({ guideColor: e.target.value })}
                className="w-8 h-6 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: colors.text.tertiary }}>Spacing</label>
              <input
                type="color"
                value={settings.spacingColor}
                onChange={e => handleUpdate({ spacingColor: e.target.value })}
                className="w-8 h-6 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SETTING TOGGLE
// ============================================================================

interface SettingToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  value,
  onChange,
  disabled
}) => (
  <div className="flex items-center justify-between">
    <div>
      <span
        className="text-sm"
        style={{ color: disabled ? colors.text.tertiary : colors.text.primary }}
      >
        {label}
      </span>
      {description && (
        <p className="text-xs" style={{ color: colors.text.tertiary }}>
          {description}
        </p>
      )}
    </div>
    <button
      onClick={() => !disabled && onChange(!value)}
      className="w-10 h-5 rounded-full transition-colors relative"
      style={{
        backgroundColor: value && !disabled ? colors.accent.primary : colors.background.tertiary,
        opacity: disabled ? 0.5 : 1
      }}
      disabled={disabled}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
      />
    </button>
  </div>
);

// ============================================================================
// RULER GUIDES PANEL
// ============================================================================

interface RulerGuidesPanelProps {
  onGuideAdd?: (guide: RulerGuide) => void;
  onGuideRemove?: (guideId: string) => void;
}

export const RulerGuidesPanel: React.FC<RulerGuidesPanelProps> = ({
  onGuideAdd,
  onGuideRemove
}) => {
  const [guides, setGuides] = useState<RulerGuide[]>(smartGuidesManager.getRulerGuides());
  const [newPosition, setNewPosition] = useState('');
  const [newOrientation, setNewOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const handleAddGuide = useCallback(() => {
    const position = parseInt(newPosition);
    if (isNaN(position)) return;

    const guide = smartGuidesManager.addRulerGuide(newOrientation, position);
    setGuides(smartGuidesManager.getRulerGuides());
    setNewPosition('');
    onGuideAdd?.(guide);
  }, [newPosition, newOrientation, onGuideAdd]);

  const handleRemoveGuide = useCallback((guideId: string) => {
    smartGuidesManager.removeRulerGuide(guideId);
    setGuides(smartGuidesManager.getRulerGuides());
    onGuideRemove?.(guideId);
  }, [onGuideRemove]);

  const handleToggleLock = useCallback((guideId: string) => {
    smartGuidesManager.toggleRulerGuideLock(guideId);
    setGuides(smartGuidesManager.getRulerGuides());
  }, []);

  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: colors.background.secondary }}
    >
      <h4 className="font-medium mb-4" style={{ color: colors.text.primary }}>
        Ruler Guides
      </h4>

      {/* Add Guide */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={newOrientation}
          onChange={e => setNewOrientation(e.target.value as 'horizontal' | 'vertical')}
          className="px-2 py-1.5 text-sm rounded"
          style={{
            backgroundColor: colors.background.tertiary,
            color: colors.text.primary,
            border: `1px solid ${colors.border.subtle}`
          }}
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>

        <input
          type="number"
          value={newPosition}
          onChange={e => setNewPosition(e.target.value)}
          placeholder="Position"
          className="w-20 px-2 py-1.5 text-sm rounded"
          style={{
            backgroundColor: colors.background.tertiary,
            color: colors.text.primary,
            border: `1px solid ${colors.border.subtle}`
          }}
        />

        <button
          onClick={handleAddGuide}
          disabled={!newPosition}
          className="px-3 py-1.5 text-sm rounded transition-colors"
          style={{
            backgroundColor: newPosition ? colors.accent.primary : colors.background.tertiary,
            color: newPosition ? '#fff' : colors.text.tertiary
          }}
        >
          Add
        </button>
      </div>

      {/* Guide List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {guides.map(guide => (
          <div
            key={guide.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ backgroundColor: colors.background.tertiary }}
          >
            <div className="flex items-center gap-2">
              <i
                className={`fa-solid ${guide.orientation === 'horizontal' ? 'fa-arrows-left-right' : 'fa-arrows-up-down'} text-xs`}
                style={{ color: colors.text.tertiary }}
              />
              <span className="text-sm" style={{ color: colors.text.primary }}>
                {guide.position}px
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleLock(guide.id)}
                className="p-1.5 rounded hover:bg-white/10"
                title={guide.locked ? 'Unlock' : 'Lock'}
              >
                <i
                  className={`fa-solid ${guide.locked ? 'fa-lock' : 'fa-lock-open'} text-xs`}
                  style={{ color: guide.locked ? colors.accent.warning : colors.text.tertiary }}
                />
              </button>
              <button
                onClick={() => handleRemoveGuide(guide.id)}
                className="p-1.5 rounded hover:bg-white/10"
                title="Remove"
              >
                <i className="fa-solid fa-trash text-xs" style={{ color: colors.accent.error }} />
              </button>
            </div>
          </div>
        ))}

        {guides.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: colors.text.tertiary }}>
            No ruler guides. Drag from rulers to add.
          </p>
        )}
      </div>

      {guides.length > 0 && (
        <button
          onClick={() => {
            smartGuidesManager.clearRulerGuides();
            setGuides([]);
          }}
          className="w-full mt-4 py-2 text-sm rounded-lg transition-colors"
          style={{
            backgroundColor: colors.accent.error + '20',
            color: colors.accent.error
          }}
        >
          Clear All Guides
        </button>
      )}
    </div>
  );
};

export default SmartGuidesOverlay;
