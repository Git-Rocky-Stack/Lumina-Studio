// ============================================================================
// DESIGN HANDOFF SYSTEM - UI COMPONENTS
// ============================================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { handoffManager } from '../../services/handoffService';
import { CODE_TARGETS, STYLE_FORMATS, EXPORT_SCALES, EXPORT_FORMATS } from '../../types/handoff';
import type {
  ElementSpec,
  ColorEntry,
  TypographyStyle,
  GeneratedCode,
  CodeTarget,
  StyleFormat,
  HandoffViewMode,
  CodeSnippet,
  MeasurementOverlay
} from '../../types/handoff';
import type { DesignElement } from '../../types';

// ============================================================================
// DESIGN HANDOFF PANEL
// ============================================================================

interface DesignHandoffPanelProps {
  elements: DesignElement[];
  selectedIds: string[];
  canvasSize: { width: number; height: number };
}

export const DesignHandoffPanel: React.FC<DesignHandoffPanelProps> = ({
  elements,
  selectedIds,
  canvasSize
}) => {
  const [viewMode, setViewMode] = useState<HandoffViewMode>('specs');
  const [codeTarget, setCodeTarget] = useState<CodeTarget>('react');
  const [styleFormat, setStyleFormat] = useState<StyleFormat>('css');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const selectedElements = useMemo(() =>
    elements.filter(el => selectedIds.includes(el.id)),
    [elements, selectedIds]
  );

  const specs = useMemo(() =>
    selectedElements.map(el => handoffManager.extractElementSpec(el)),
    [selectedElements]
  );

  const colors = useMemo(() =>
    handoffManager.extractColors(elements),
    [elements]
  );

  const typography = useMemo(() =>
    handoffManager.extractTypography(elements),
    [elements]
  );

  const generatedCode = useMemo(() =>
    handoffManager.generateCode(selectedElements, codeTarget, styleFormat),
    [selectedElements, codeTarget, styleFormat]
  );

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  }, []);

  const handleExportPackage = useCallback(() => {
    const pkg = handoffManager.createHandoffPackage(elements, canvasSize);
    const json = handoffManager.exportPackage(pkg);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-handoff.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [elements, canvasSize]);

  return (
    <div className="w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm tracking-wide">DESIGN HANDOFF</h3>
          <button
            onClick={handleExportPackage}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            <i className="fas fa-download mr-1.5"></i>
            Export
          </button>
        </div>
        <p className="text-[10px] text-white/70 mt-1">
          {selectedElements.length} element{selectedElements.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-slate-200">
        {([
          { id: 'specs', label: 'Specs', icon: 'fa-ruler-combined' },
          { id: 'code', label: 'Code', icon: 'fa-code' },
          { id: 'tokens', label: 'Tokens', icon: 'fa-palette' },
          { id: 'assets', label: 'Assets', icon: 'fa-image' }
        ] as { id: HandoffViewMode; label: string; icon: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
              viewMode === tab.id
                ? 'text-emerald-600 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className={`fas ${tab.icon} mr-1.5`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {viewMode === 'specs' && (
            <SpecsView
              key="specs"
              specs={specs}
              onCopy={handleCopy}
              copiedSnippet={copiedSnippet}
            />
          )}
          {viewMode === 'code' && (
            <CodeView
              key="code"
              code={generatedCode}
              codeTarget={codeTarget}
              styleFormat={styleFormat}
              onTargetChange={setCodeTarget}
              onFormatChange={setStyleFormat}
              onCopy={handleCopy}
              copiedSnippet={copiedSnippet}
            />
          )}
          {viewMode === 'tokens' && (
            <TokensView
              key="tokens"
              colors={colors}
              typography={typography}
              onCopy={handleCopy}
              copiedSnippet={copiedSnippet}
            />
          )}
          {viewMode === 'assets' && (
            <AssetsView
              key="assets"
              elements={selectedElements}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// SPECS VIEW
// ============================================================================

interface SpecsViewProps {
  specs: ElementSpec[];
  onCopy: (text: string, id: string) => void;
  copiedSnippet: string | null;
}

const SpecsView: React.FC<SpecsViewProps> = ({ specs, onCopy, copiedSnippet }) => {
  if (specs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <i className="fas fa-mouse-pointer text-3xl mb-3 opacity-50"></i>
        <p className="text-xs">Select an element to view specs</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 space-y-4"
    >
      {specs.map(spec => (
        <div key={spec.elementId} className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-slate-800">{spec.name}</h4>
            <span className="px-2 py-0.5 bg-slate-200 rounded text-[10px] uppercase font-bold text-slate-500">
              {spec.type}
            </span>
          </div>

          {/* Position & Size */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <SpecValue label="X" value={`${spec.position.x}px`} onCopy={() => onCopy(`${spec.position.x}px`, 'x')} copied={copiedSnippet === 'x'} />
            <SpecValue label="Y" value={`${spec.position.y}px`} onCopy={() => onCopy(`${spec.position.y}px`, 'y')} copied={copiedSnippet === 'y'} />
            <SpecValue label="Width" value={`${spec.size.width}px`} onCopy={() => onCopy(`${spec.size.width}px`, 'w')} copied={copiedSnippet === 'w'} />
            <SpecValue label="Height" value={`${spec.size.height}px`} onCopy={() => onCopy(`${spec.size.height}px`, 'h')} copied={copiedSnippet === 'h'} />
          </div>

          {/* Typography */}
          {spec.typography && (
            <div className="border-t border-slate-200 pt-3 mt-3">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Typography</h5>
              <div className="grid grid-cols-2 gap-2">
                <SpecValue
                  label="Font"
                  value={spec.typography.fontFamily.split(',')[0]}
                  onCopy={() => onCopy(spec.typography!.fontFamily, 'font')}
                  copied={copiedSnippet === 'font'}
                />
                <SpecValue
                  label="Size"
                  value={`${spec.typography.fontSize}px`}
                  onCopy={() => onCopy(`${spec.typography!.fontSize}px`, 'size')}
                  copied={copiedSnippet === 'size'}
                />
                <SpecValue
                  label="Weight"
                  value={String(spec.typography.fontWeight)}
                  onCopy={() => onCopy(String(spec.typography!.fontWeight), 'weight')}
                  copied={copiedSnippet === 'weight'}
                />
                <SpecValue
                  label="Color"
                  value={spec.typography.color}
                  onCopy={() => onCopy(spec.typography!.color, 'color')}
                  copied={copiedSnippet === 'color'}
                  isColor
                />
              </div>
            </div>
          )}

          {/* Transform */}
          {spec.transform && (
            <div className="border-t border-slate-200 pt-3 mt-3">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Transform</h5>
              <div className="grid grid-cols-3 gap-2">
                {spec.transform.rotation !== 0 && (
                  <SpecValue label="Rotate" value={`${spec.transform.rotation}°`} onCopy={() => onCopy(`${spec.transform!.rotation}deg`, 'rotate')} copied={copiedSnippet === 'rotate'} />
                )}
                {spec.transform.skewX !== 0 && (
                  <SpecValue label="Skew X" value={`${spec.transform.skewX}°`} onCopy={() => onCopy(`${spec.transform!.skewX}deg`, 'skewx')} copied={copiedSnippet === 'skewx'} />
                )}
                {spec.transform.skewY !== 0 && (
                  <SpecValue label="Skew Y" value={`${spec.transform.skewY}°`} onCopy={() => onCopy(`${spec.transform!.skewY}deg`, 'skewy')} copied={copiedSnippet === 'skewy'} />
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
};

// ============================================================================
// SPEC VALUE COMPONENT
// ============================================================================

interface SpecValueProps {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  isColor?: boolean;
}

const SpecValue: React.FC<SpecValueProps> = ({ label, value, onCopy, copied, isColor }) => (
  <button
    onClick={onCopy}
    className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-emerald-50 transition-colors text-left group"
  >
    {isColor && (
      <div
        className="w-4 h-4 rounded border border-slate-300"
        style={{ backgroundColor: value }}
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-slate-400 uppercase">{label}</div>
      <div className="text-xs font-mono font-bold text-slate-700 truncate">{value}</div>
    </div>
    <i className={`fas fa-${copied ? 'check text-emerald-500' : 'copy text-slate-300 group-hover:text-slate-500'} text-xs transition-colors`}></i>
  </button>
);

// ============================================================================
// CODE VIEW
// ============================================================================

interface CodeViewProps {
  code: GeneratedCode;
  codeTarget: CodeTarget;
  styleFormat: StyleFormat;
  onTargetChange: (target: CodeTarget) => void;
  onFormatChange: (format: StyleFormat) => void;
  onCopy: (text: string, id: string) => void;
  copiedSnippet: string | null;
}

const CodeView: React.FC<CodeViewProps> = ({
  code,
  codeTarget,
  styleFormat,
  onTargetChange,
  onFormatChange,
  onCopy,
  copiedSnippet
}) => {
  const [activeTab, setActiveTab] = useState<'component' | 'styles'>('component');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 space-y-4"
    >
      {/* Target selector */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Framework</label>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {CODE_TARGETS.map(target => (
            <button
              key={target.id}
              onClick={() => onTargetChange(target.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                codeTarget === target.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className={`fab ${target.icon} mr-1.5`}></i>
              {target.name}
            </button>
          ))}
        </div>
      </div>

      {/* Style format selector */}
      {(codeTarget === 'react' || codeTarget === 'vue' || codeTarget === 'html') && (
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Style Format</label>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {STYLE_FORMATS.map(format => (
              <button
                key={format.id}
                onClick={() => onFormatChange(format.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  styleFormat === format.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {format.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Code tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab('component')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'component'
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          Component
        </button>
        {code.styles && (
          <button
            onClick={() => setActiveTab('styles')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'styles'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Styles
          </button>
        )}
      </div>

      {/* Code block */}
      <div className="relative">
        <button
          onClick={() => onCopy(activeTab === 'component' ? code.component : code.styles, 'code')}
          className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white transition-colors"
        >
          {copiedSnippet === 'code' ? (
            <><i className="fas fa-check mr-1"></i>Copied</>
          ) : (
            <><i className="fas fa-copy mr-1"></i>Copy</>
          )}
        </button>
        <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto text-xs text-slate-300 font-mono max-h-80">
          <code>{activeTab === 'component' ? code.component : code.styles}</code>
        </pre>
      </div>
    </motion.div>
  );
};

// ============================================================================
// TOKENS VIEW
// ============================================================================

interface TokensViewProps {
  colors: ColorEntry[];
  typography: TypographyStyle[];
  onCopy: (text: string, id: string) => void;
  copiedSnippet: string | null;
}

const TokensView: React.FC<TokensViewProps> = ({
  colors,
  typography,
  onCopy,
  copiedSnippet
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="p-4 space-y-6"
  >
    {/* Colors */}
    <div>
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
        <i className="fas fa-palette mr-1.5"></i>
        Colors ({colors.length})
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {colors.map((color, i) => (
          <button
            key={i}
            onClick={() => onCopy(color.hex, `color-${i}`)}
            className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-emerald-50 transition-colors group"
          >
            <div
              className="w-10 h-10 rounded-lg shadow-inner border border-slate-200"
              style={{ backgroundColor: color.hex }}
            />
            <div className="flex-1 text-left">
              <div className="text-xs font-bold text-slate-700">{color.name}</div>
              <div className="text-[10px] font-mono text-slate-500">{color.hex}</div>
            </div>
            <div className="text-[10px] text-slate-400">{color.count}x</div>
            <i className={`fas fa-${copiedSnippet === `color-${i}` ? 'check text-emerald-500' : 'copy text-slate-300'} text-xs`}></i>
          </button>
        ))}
      </div>
    </div>

    {/* Typography */}
    <div>
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
        <i className="fas fa-font mr-1.5"></i>
        Typography ({typography.length})
      </h4>
      <div className="space-y-2">
        {typography.map((style, i) => (
          <button
            key={i}
            onClick={() => onCopy(`font-size: ${style.fontSize}px; font-weight: ${style.fontWeight};`, `typo-${i}`)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-emerald-50 transition-colors group text-left"
          >
            <div>
              <div
                className="text-slate-800 font-bold"
                style={{ fontSize: Math.min(style.fontSize, 24) }}
              >
                {style.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {style.fontSize}px • {style.fontWeight} • {style.usage.length} uses
              </div>
            </div>
            <i className={`fas fa-${copiedSnippet === `typo-${i}` ? 'check text-emerald-500' : 'copy text-slate-300'} text-xs`}></i>
          </button>
        ))}
      </div>
    </div>
  </motion.div>
);

// ============================================================================
// ASSETS VIEW
// ============================================================================

interface AssetsViewProps {
  elements: DesignElement[];
}

const AssetsView: React.FC<AssetsViewProps> = ({ elements }) => {
  const [exportScale, setExportScale] = useState(2);
  const [exportFormat, setExportFormat] = useState('png');

  const imageElements = elements.filter(el => el.type === 'image');

  if (imageElements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-8 text-center text-slate-400"
      >
        <i className="fas fa-image text-3xl mb-3 opacity-50"></i>
        <p className="text-xs">No image elements selected</p>
        <p className="text-[10px] mt-1">Select image elements to export</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 space-y-4"
    >
      {/* Export settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scale</label>
          <div className="flex gap-1 mt-1.5">
            {EXPORT_SCALES.map(scale => (
              <button
                key={scale.value}
                onClick={() => setExportScale(scale.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  exportScale === scale.value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Format</label>
          <div className="flex gap-1 mt-1.5">
            {EXPORT_FORMATS.slice(0, 3).map(format => (
              <button
                key={format.id}
                onClick={() => setExportFormat(format.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  exportFormat === format.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {format.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Asset list */}
      <div className="space-y-2">
        {imageElements.map(el => (
          <div
            key={el.id}
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200">
              <img
                src={el.content}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-700 truncate">
                Image {el.id.substring(0, 6)}
              </div>
              <div className="text-[10px] text-slate-500">
                {el.width} × {el.height}px
              </div>
            </div>
            <button className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors">
              <i className="fas fa-download mr-1"></i>
              Export
            </button>
          </div>
        ))}
      </div>

      {/* Export all button */}
      <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors">
        <i className="fas fa-download mr-2"></i>
        Export All Assets ({imageElements.length})
      </button>
    </motion.div>
  );
};

// ============================================================================
// MEASUREMENT OVERLAY
// ============================================================================

interface MeasurementOverlayComponentProps {
  measurements: MeasurementOverlay[];
  scale?: number;
}

export const MeasurementOverlayComponent: React.FC<MeasurementOverlayComponentProps> = ({
  measurements,
  scale = 1
}) => (
  <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
      </marker>
    </defs>
    {measurements.map((m, i) => (
      <g key={i}>
        <line
          x1={m.startPoint.x * scale}
          y1={m.startPoint.y * scale}
          x2={m.endPoint.x * scale}
          y2={m.endPoint.y * scale}
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
        <rect
          x={(m.startPoint.x + m.endPoint.x) / 2 * scale - 20}
          y={(m.startPoint.y + m.endPoint.y) / 2 * scale - 10}
          width="40"
          height="20"
          fill="#ef4444"
          rx="4"
        />
        <text
          x={(m.startPoint.x + m.endPoint.x) / 2 * scale}
          y={(m.startPoint.y + m.endPoint.y) / 2 * scale + 4}
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
        >
          {m.value}px
        </text>
      </g>
    ))}
  </svg>
);

// ============================================================================
// QUICK INSPECT TOOLTIP
// ============================================================================

interface QuickInspectTooltipProps {
  element: DesignElement;
  position: { x: number; y: number };
}

export const QuickInspectTooltip: React.FC<QuickInspectTooltipProps> = ({
  element,
  position
}) => {
  const snippets = handoffManager.getCodeSnippets(element);
  const [activeSnippet, setActiveSnippet] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute z-50 bg-slate-900 rounded-xl shadow-2xl p-3 text-white min-w-64"
      style={{ left: position.x, top: position.y }}
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {snippets.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveSnippet(i)}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
              activeSnippet === i
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            <i className={`${s.icon} mr-1`}></i>
            {s.label}
          </button>
        ))}
      </div>

      {/* Code */}
      <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap max-h-32 overflow-auto">
        {snippets[activeSnippet]?.code}
      </pre>

      {/* Copy button */}
      <button
        onClick={() => navigator.clipboard.writeText(snippets[activeSnippet]?.code || '')}
        className="mt-2 w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-[10px] font-bold transition-colors"
      >
        <i className="fas fa-copy mr-1"></i>
        Copy Code
      </button>
    </motion.div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default DesignHandoffPanel;
