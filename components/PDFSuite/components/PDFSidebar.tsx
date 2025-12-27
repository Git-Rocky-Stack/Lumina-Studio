// ============================================
// PDFSidebar Component
// Right sidebar with properties, tools settings, and panels
// ============================================

import React, { useState, useCallback } from 'react';
import type {
  PDFTool,
  ToolSettings,
  PDFAnnotation,
  PDFFormField,
  GlyphSettings,
  SidebarTab,
} from '../types';
import { ANNOTATION_COLORS, STAMP_TYPES, DEFAULT_GLYPH_SETTINGS } from '../types';

type RightPanelTab = 'properties' | 'annotations' | 'forms' | 'typography';

interface PDFSidebarProps {
  // Tool settings
  activeTool: PDFTool;
  toolSettings: ToolSettings;
  onToolSettingsChange: (settings: Partial<ToolSettings>) => void;

  // Annotations
  annotations: PDFAnnotation[];
  selectedAnnotationId?: string;
  onAnnotationSelect: (id: string) => void;
  onAnnotationDelete: (id: string) => void;

  // Form fields
  formFields: PDFFormField[];
  selectedFormFieldId?: string;
  onFormFieldSelect: (id: string) => void;
  onFormFieldDelete: (id: string) => void;

  // Typography
  glyphSettings: GlyphSettings;
  onGlyphSettingsChange: (settings: Partial<GlyphSettings>) => void;

  // Document info
  pageCount: number;
  currentPage: number;

  // AI features
  onAIReflow?: () => void;
  onAIScan?: () => void;
  isAIProcessing?: boolean;

  className?: string;
}

export const PDFSidebar: React.FC<PDFSidebarProps> = ({
  activeTool,
  toolSettings,
  onToolSettingsChange,
  annotations,
  selectedAnnotationId,
  onAnnotationSelect,
  onAnnotationDelete,
  formFields,
  selectedFormFieldId,
  onFormFieldSelect,
  onFormFieldDelete,
  glyphSettings,
  onGlyphSettingsChange,
  pageCount,
  currentPage,
  onAIReflow,
  onAIScan,
  isAIProcessing = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

  const tabs: Array<{ id: RightPanelTab; icon: string; label: string }> = [
    { id: 'properties', icon: 'fa-sliders', label: 'Properties' },
    { id: 'annotations', icon: 'fa-comment-dots', label: 'Annotations' },
    { id: 'forms', icon: 'fa-square-check', label: 'Forms' },
    { id: 'typography', icon: 'fa-font', label: 'Typography' },
  ];

  // Color picker
  const renderColorPicker = useCallback(
    (
      value: string,
      onChange: (color: string) => void,
      label: string
    ) => (
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ANNOTATION_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`w-7 h-7 rounded-lg transition-all hover:scale-110 ${
                value === color
                  ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105'
                  : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-7 h-7 rounded-lg cursor-pointer border-0"
          />
        </div>
      </div>
    ),
    []
  );

  // Slider control
  const renderSlider = useCallback(
    (
      value: number,
      onChange: (value: number) => void,
      label: string,
      min: number,
      max: number,
      step: number = 1,
      unit: string = ''
    ) => (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            {value}{unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
        />
      </div>
    ),
    []
  );

  return (
    <div
      className={`w-80 bg-white border-l border-slate-200 flex flex-col h-full ${className}`}
    >
      {/* Tab Header */}
      <div className="flex border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title={tab.label}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="text-[8px]">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <>
            {/* Tool Settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-palette text-indigo-500"></i>
                Tool Settings
              </h4>

              {renderColorPicker(
                toolSettings.color,
                (color) => onToolSettingsChange({ color }),
                'Color'
              )}

              {renderSlider(
                toolSettings.opacity,
                (opacity) => onToolSettingsChange({ opacity }),
                'Opacity',
                0,
                100,
                1,
                '%'
              )}

              {renderSlider(
                toolSettings.borderWidth,
                (borderWidth) => onToolSettingsChange({ borderWidth }),
                'Border Width',
                1,
                20,
                1,
                'px'
              )}

              {(activeTool === 'ink' || activeTool === 'eraser') && (
                <>
                  {renderSlider(
                    toolSettings.strokeWidth,
                    (strokeWidth) => onToolSettingsChange({ strokeWidth }),
                    'Stroke Width',
                    1,
                    50,
                    1,
                    'px'
                  )}
                  {renderSlider(
                    toolSettings.smoothing,
                    (smoothing) => onToolSettingsChange({ smoothing }),
                    'Smoothing',
                    0,
                    1,
                    0.1,
                    ''
                  )}
                </>
              )}
            </div>

            {/* Text Settings */}
            {(activeTool === 'freeText' || activeTool === 'textEdit') && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-text-height text-indigo-500"></i>
                  Text Settings
                </h4>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Font Family
                  </label>
                  <select
                    value={toolSettings.fontFamily}
                    onChange={(e) =>
                      onToolSettingsChange({ fontFamily: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>

                {renderSlider(
                  toolSettings.fontSize,
                  (fontSize) => onToolSettingsChange({ fontSize }),
                  'Font Size',
                  8,
                  72,
                  1,
                  'pt'
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      onToolSettingsChange({
                        fontWeight: toolSettings.fontWeight === 700 ? 400 : 700,
                      })
                    }
                    className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${
                      toolSettings.fontWeight === 700
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <i className="fas fa-bold"></i>
                  </button>
                  <button
                    onClick={() =>
                      onToolSettingsChange({
                        fontStyle:
                          toolSettings.fontStyle === 'italic'
                            ? 'normal'
                            : 'italic',
                      })
                    }
                    className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${
                      toolSettings.fontStyle === 'italic'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <i className="fas fa-italic"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Stamp Settings */}
            {activeTool === 'stamp' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-stamp text-indigo-500"></i>
                  Stamp Type
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STAMP_TYPES).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() =>
                        onToolSettingsChange({ stampType: key as any })
                      }
                      className={`p-2 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${
                        toolSettings.stampType === key
                          ? 'ring-2 ring-indigo-500'
                          : 'hover:bg-slate-50'
                      }`}
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                        borderColor: color,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Document Info */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-info-circle text-indigo-500"></i>
                Document Info
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Pages</span>
                  <span className="text-slate-700 font-medium">{pageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Page</span>
                  <span className="text-slate-700 font-medium">{currentPage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Annotations</span>
                  <span className="text-slate-700 font-medium">
                    {annotations.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Form Fields</span>
                  <span className="text-slate-700 font-medium">
                    {formFields.length}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Annotations Tab */}
        {activeTab === 'annotations' && (
          <>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Annotations ({annotations.length})
              </h4>
            </div>

            {annotations.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                <i className="fas fa-comment-dots text-4xl text-slate-200 mb-3"></i>
                <p className="text-xs text-slate-400 font-medium">
                  No annotations yet
                </p>
                <p className="text-[10px] text-slate-300 mt-1">
                  Use the toolbar to add annotations
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    onClick={() => onAnnotationSelect(annotation.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      selectedAnnotationId === annotation.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: annotation.color }}
                      >
                        <i
                          className={`fas ${
                            annotation.type === 'highlight'
                              ? 'fa-highlighter'
                              : annotation.type === 'note'
                              ? 'fa-sticky-note'
                              : annotation.type === 'stamp'
                              ? 'fa-stamp'
                              : 'fa-pen'
                          }`}
                        ></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 capitalize">
                          {annotation.type}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          Page {annotation.pageNumber}
                          {annotation.contents && ` - ${annotation.contents}`}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnnotationDelete(annotation.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                      >
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Form Fields ({formFields.length})
              </h4>
            </div>

            {formFields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                <i className="fas fa-square-check text-4xl text-slate-200 mb-3"></i>
                <p className="text-xs text-slate-400 font-medium">
                  No form fields yet
                </p>
                <p className="text-[10px] text-slate-300 mt-1">
                  Use form tools to add interactive fields
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {formFields.map((field) => (
                  <div
                    key={field.id}
                    onClick={() => onFormFieldSelect(field.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      selectedFormFieldId === field.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                        <i
                          className={`fas ${
                            field.type === 'text'
                              ? 'fa-text-width'
                              : field.type === 'checkbox'
                              ? 'fa-check-square'
                              : field.type === 'radio'
                              ? 'fa-circle-dot'
                              : field.type === 'dropdown'
                              ? 'fa-caret-down'
                              : field.type === 'signature'
                              ? 'fa-signature'
                              : 'fa-square'
                          }`}
                        ></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700">
                          {field.name || 'Unnamed Field'}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {field.type} - Page {field.pageNumber}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFormFieldDelete(field.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                      >
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <>
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-sparkles text-indigo-500"></i>
                AI Typography
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {['Editorial', 'Corporate', 'Swiss', 'Brutalist'].map(
                  (style) => (
                    <button
                      key={style}
                      className="p-4 rounded-xl border border-slate-100 text-[10px] font-bold uppercase tracking-wide hover:border-indigo-300 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl font-serif">Aa</span>
                      {style}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Variable Font Settings
              </h4>

              {renderSlider(
                glyphSettings.weight,
                (weight) => onGlyphSettingsChange({ weight }),
                'Weight',
                100,
                900,
                100,
                ''
              )}

              {renderSlider(
                glyphSettings.width,
                (width) => onGlyphSettingsChange({ width }),
                'Width',
                50,
                200,
                5,
                '%'
              )}

              {renderSlider(
                glyphSettings.letterSpacing,
                (letterSpacing) => onGlyphSettingsChange({ letterSpacing }),
                'Letter Spacing',
                -0.5,
                1,
                0.05,
                'em'
              )}

              {renderSlider(
                glyphSettings.lineHeight,
                (lineHeight) => onGlyphSettingsChange({ lineHeight }),
                'Line Height',
                1,
                3,
                0.1,
                ''
              )}
            </div>

            {/* AI Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                onClick={onAIReflow}
                disabled={isAIProcessing}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isAIProcessing ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-wind"></i>
                )}
                AI Reflow Content
              </button>
              <button
                onClick={onAIScan}
                disabled={isAIProcessing}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isAIProcessing ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-shield-halved"></i>
                )}
                Scan for Privacy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PDFSidebar;
