// ============================================
// TextStylePanel - Typography Controls
// ============================================

import React, { useState } from 'react';
import { useTextFormatting, TextStyle, StylePreset } from '../hooks/useTextFormatting';

interface TextStylePanelProps {
  onStyleChange?: (style: TextStyle) => void;
  onFontPickerOpen?: () => void;
  className?: string;
}

export const TextStylePanel: React.FC<TextStylePanelProps> = ({
  onStyleChange,
  onFontPickerOpen,
  className = ''
}) => {
  const {
    textStyle,
    paragraphStyle,
    presets,
    activePreset,
    updateTextStyle,
    updateParagraphStyle,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikethrough,
    setAlignment,
    setTransform,
    applyPreset,
    saveCustomPreset,
    resetStyles,
    fontSizePresets,
    fontWeightPresets,
    lineHeightPresets,
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
  } = useTextFormatting();

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('character');

  // Handle style change and notify parent
  const handleStyleChange = (updates: Partial<TextStyle>) => {
    updateTextStyle(updates);
    onStyleChange?.({ ...textStyle, ...updates });
  };

  // Section header component
  const SectionHeader: React.FC<{ id: string; label: string }> = ({ id, label }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      className="w-full flex items-center justify-between py-2 type-body-sm font-semibold text-white/80 hover:text-white"
    >
      {label}
      <svg
        className={`w-4 h-4 transition-transform ${expandedSection === id ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className={`bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5">
        {/* Font Family */}
        <button
          onClick={onFontPickerOpen}
          className="flex-1 px-2 py-1.5 bg-white/10 rounded text-left truncate text-sm text-white/80 hover:bg-white/20"
        >
          {textStyle.fontFamily}
        </button>

        {/* Font Size */}
        <select
          value={textStyle.fontSize}
          onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
          className="w-16 px-2 py-1.5 bg-white/10 rounded text-sm text-white border-none focus:ring-1 focus:ring-purple-500"
        >
          {fontSizePresets.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <div className="w-px h-6 bg-white/20 mx-1" />

        {/* Bold */}
        <button
          onClick={toggleBold}
          className={`p-1.5 rounded ${isBold ? 'bg-purple-500/30 text-purple-300' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        {/* Italic */}
        <button
          onClick={toggleItalic}
          className={`p-1.5 rounded ${isItalic ? 'bg-purple-500/30 text-purple-300' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>

        {/* Underline */}
        <button
          onClick={toggleUnderline}
          className={`p-1.5 rounded ${isUnderline ? 'bg-purple-500/30 text-purple-300' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          title="Underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
            <line x1="4" y1="21" x2="20" y2="21" />
          </svg>
        </button>

        {/* Strikethrough */}
        <button
          onClick={toggleStrikethrough}
          className={`p-1.5 rounded ${isStrikethrough ? 'bg-purple-500/30 text-purple-300' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          title="Strikethrough"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <line x1="4" y1="12" x2="20" y2="12" />
            <path d="M17.5 7.5c-1-1.5-3-2.5-5.5-2.5-3 0-5.5 1.5-5.5 4 0 5 11 5 11 10 0 2.5-2.5 4-5.5 4-2.5 0-4.5-1-5.5-2.5" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/20 mx-1" />

        {/* Text Color */}
        <div className="relative">
          <input
            type="color"
            value={textStyle.color}
            onChange={(e) => handleStyleChange({ color: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border-2 border-white/20"
            title="Text Color"
          />
        </div>
      </div>

      {/* Alignment Bar */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10">
        {(['left', 'center', 'right', 'justify'] as const).map(align => (
          <button
            key={align}
            onClick={() => setAlignment(align)}
            className={`flex-1 p-1.5 rounded ${
              textStyle.textAlign === align
                ? 'bg-purple-500/30 text-purple-300'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={`Align ${align}`}
          >
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {align === 'left' && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></>}
              {align === 'center' && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>}
              {align === 'right' && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" /></>}
              {align === 'justify' && <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        ))}

        <div className="w-px h-6 bg-white/20 mx-2" />

        {/* Text Transform */}
        {(['none', 'uppercase', 'lowercase', 'capitalize'] as const).map(transform => (
          <button
            key={transform}
            onClick={() => setTransform(transform)}
            className={`px-2 py-1 rounded text-xs ${
              textStyle.textTransform === transform
                ? 'bg-purple-500/30 text-purple-300'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={transform}
          >
            {transform === 'none' ? 'Aa' : transform === 'uppercase' ? 'AA' : transform === 'lowercase' ? 'aa' : 'Aa'}
          </button>
        ))}
      </div>

      {/* Expandable Sections */}
      <div className="p-3 space-y-1">
        {/* Character Section */}
        <div className="border-b border-white/10 pb-2">
          <SectionHeader id="character" label="Character" />
          {expandedSection === 'character' && (
            <div className="space-y-3 pt-2">
              {/* Font Weight */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Font Weight</label>
                <select
                  value={textStyle.fontWeight}
                  onChange={(e) => handleStyleChange({ fontWeight: parseInt(e.target.value) })}
                  className="w-full px-2 py-1.5 bg-white/10 rounded text-sm text-white border-none focus:ring-1 focus:ring-purple-500"
                >
                  {fontWeightPresets.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Letter Spacing</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-5}
                    max={20}
                    value={textStyle.letterSpacing}
                    onChange={(e) => handleStyleChange({ letterSpacing: parseFloat(e.target.value) })}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-xs text-white/60 w-10">{textStyle.letterSpacing}px</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Paragraph Section */}
        <div className="border-b border-white/10 pb-2">
          <SectionHeader id="paragraph" label="Paragraph" />
          {expandedSection === 'paragraph' && (
            <div className="space-y-3 pt-2">
              {/* Line Height */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Line Height</label>
                <div className="flex gap-1">
                  {lineHeightPresets.map(lh => (
                    <button
                      key={lh.value}
                      onClick={() => handleStyleChange({ lineHeight: lh.value })}
                      className={`flex-1 py-1 text-xs rounded ${
                        textStyle.lineHeight === lh.value
                          ? 'bg-purple-500/30 text-purple-300'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {lh.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Space Before</label>
                  <input
                    type="number"
                    min={0}
                    value={paragraphStyle.marginTop}
                    onChange={(e) => updateParagraphStyle({ marginTop: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 bg-white/10 rounded text-sm text-white border-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Space After</label>
                  <input
                    type="number"
                    min={0}
                    value={paragraphStyle.marginBottom}
                    onChange={(e) => updateParagraphStyle({ marginBottom: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 bg-white/10 rounded text-sm text-white border-none"
                  />
                </div>
              </div>

              {/* First Line Indent */}
              <div>
                <label className="block text-xs text-white/50 mb-1">First Line Indent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={paragraphStyle.firstLineIndent}
                    onChange={(e) => updateParagraphStyle({ firstLineIndent: parseInt(e.target.value) })}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-xs text-white/60 w-10">{paragraphStyle.firstLineIndent}px</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Style Presets Section */}
        <div>
          <SectionHeader id="presets" label="Style Presets" />
          {expandedSection === 'presets' && (
            <div className="pt-2">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {presets.slice(0, 8).map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`p-2 rounded-lg text-left transition-all ${
                      activePreset === preset.id
                        ? 'bg-purple-500/20 border border-purple-500'
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs text-white/80 block">{preset.name}</span>
                    <span
                      className="text-lg truncate block mt-1"
                      style={{
                        fontSize: preset.textStyle.fontSize ? `${preset.textStyle.fontSize / 2}px` : undefined,
                        fontWeight: preset.textStyle.fontWeight,
                        fontStyle: preset.textStyle.fontStyle,
                      }}
                    >
                      Sample
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPresetModal(true)}
                  className="flex-1 py-1.5 text-xs rounded bg-white/5 text-white/60 hover:bg-white/10"
                >
                  Save Current Style
                </button>
                <button
                  onClick={resetStyles}
                  className="flex-1 py-1.5 text-xs rounded bg-white/5 text-white/60 hover:bg-white/10"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <label className="block text-xs text-white/50 mb-2">Preview</label>
        <div
          className="p-3 bg-white rounded min-h-[60px]"
          style={{
            fontFamily: textStyle.fontFamily,
            fontSize: `${textStyle.fontSize}px`,
            fontWeight: textStyle.fontWeight,
            fontStyle: textStyle.fontStyle,
            textDecoration: textStyle.textDecoration,
            textAlign: textStyle.textAlign,
            lineHeight: textStyle.lineHeight,
            letterSpacing: `${textStyle.letterSpacing}px`,
            color: textStyle.color,
            textTransform: textStyle.textTransform,
          }}
        >
          The quick brown fox jumps over the lazy dog.
        </div>
      </div>

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] w-full max-w-sm rounded-xl border border-white/10 p-4">
            <h3 className="type-subsection text-white mb-3">Save Style Preset</h3>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name..."
              className="w-full px-3 py-2 bg-white/10 rounded text-white border border-white/10 focus:border-purple-500/50 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPresetModal(false)}
                className="flex-1 py-2 rounded bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newPresetName.trim()) {
                    saveCustomPreset(newPresetName.trim());
                    setNewPresetName('');
                    setShowPresetModal(false);
                  }
                }}
                disabled={!newPresetName.trim()}
                className="flex-1 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextStylePanel;
