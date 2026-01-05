// ============================================
// RichTextToolbar Component
// Rich text formatting toolbar for text annotations
// ============================================

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Type,
  Palette,
  ChevronDown,
} from 'lucide-react';

interface RichTextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  listType?: 'bullet' | 'numbered' | null;
}

interface RichTextToolbarProps {
  format: RichTextFormat;
  onFormatChange: (format: Partial<RichTextFormat>) => void;
  className?: string;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
];

const TEXT_COLORS = [
  '#000000',
  '#374151',
  '#6B7280',
  '#DC2626',
  '#EA580C',
  '#F59E0B',
  '#84CC16',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
];

const BACKGROUND_COLORS = [
  'transparent',
  '#FEF3C7',
  '#DBEAFE',
  '#D1FAE5',
  '#FCE7F3',
  '#E0E7FF',
  '#FEE2E2',
  '#FED7AA',
  '#D9F99D',
];

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  format,
  onFormatChange,
  className = '',
}) => {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  // Toggle style
  const toggleStyle = useCallback(
    (style: keyof RichTextFormat) => {
      onFormatChange({ [style]: !format[style] });
    },
    [format, onFormatChange]
  );

  // Set alignment
  const setAlignment = useCallback(
    (alignment: RichTextFormat['alignment']) => {
      onFormatChange({ alignment });
    },
    [onFormatChange]
  );

  // Set list type
  const setListType = useCallback(
    (listType: RichTextFormat['listType']) => {
      onFormatChange({ listType: format.listType === listType ? null : listType });
    },
    [format.listType, onFormatChange]
  );

  return (
    <div
      className={`flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}
      role="toolbar"
      aria-label="Text formatting toolbar"
    >
      {/* Font Family */}
      <div className="relative">
        <button
          onClick={() => {
            setShowFontMenu(!showFontMenu);
            setShowSizeMenu(false);
            setShowColorPicker(false);
            setShowBgColorPicker(false);
          }}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 transition-colors flex items-center gap-2 min-w-[120px]"
          aria-label="Select font family"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="flex-1 text-left truncate">
            {FONT_FAMILIES.find((f) => f.value === format.fontFamily)?.name || 'Inter'}
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showFontMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowFontMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 max-h-64 overflow-y-auto"
            >
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    onFormatChange({ fontFamily: font.value });
                    setShowFontMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                    format.fontFamily === font.value ? 'bg-indigo-50 text-indigo-600' : ''
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* Font Size */}
      <div className="relative">
        <button
          onClick={() => {
            setShowSizeMenu(!showSizeMenu);
            setShowFontMenu(false);
            setShowColorPicker(false);
            setShowBgColorPicker(false);
          }}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 transition-colors flex items-center gap-2 min-w-[60px]"
          aria-label="Select font size"
        >
          <span className="flex-1 text-left">{format.fontSize || 12}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showSizeMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowSizeMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-1 w-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 max-h-64 overflow-y-auto"
            >
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    onFormatChange({ fontSize: size });
                    setShowSizeMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                    format.fontSize === size ? 'bg-indigo-50 text-indigo-600' : ''
                  }`}
                >
                  {size}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200" />

      {/* Text Styles */}
      <div className="flex items-center gap-0.5">
        <FormatButton
          icon={<Bold className="w-4 h-4" />}
          isActive={format.bold || false}
          onClick={() => toggleStyle('bold')}
          label="Bold"
        />
        <FormatButton
          icon={<Italic className="w-4 h-4" />}
          isActive={format.italic || false}
          onClick={() => toggleStyle('italic')}
          label="Italic"
        />
        <FormatButton
          icon={<Underline className="w-4 h-4" />}
          isActive={format.underline || false}
          onClick={() => toggleStyle('underline')}
          label="Underline"
        />
        <FormatButton
          icon={<Strikethrough className="w-4 h-4" />}
          isActive={format.strikethrough || false}
          onClick={() => toggleStyle('strikethrough')}
          label="Strikethrough"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200" />

      {/* Text Color */}
      <div className="relative">
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowFontMenu(false);
            setShowSizeMenu(false);
            setShowBgColorPicker(false);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors relative"
          aria-label="Text color"
        >
          <Palette className="w-4 h-4 text-slate-600" />
          <div
            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
            style={{ backgroundColor: format.textColor || '#000000' }}
          />
        </button>

        {showColorPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowColorPicker(false)}
            />
            <ColorPicker
              colors={TEXT_COLORS}
              selectedColor={format.textColor || '#000000'}
              onSelectColor={(color) => {
                onFormatChange({ textColor: color });
                setShowColorPicker(false);
              }}
              label="Text Color"
            />
          </>
        )}
      </div>

      {/* Background Color */}
      <div className="relative">
        <button
          onClick={() => {
            setShowBgColorPicker(!showBgColorPicker);
            setShowFontMenu(false);
            setShowSizeMenu(false);
            setShowColorPicker(false);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors relative"
          aria-label="Background color"
        >
          <div className="w-4 h-4 border border-slate-300 rounded relative">
            <div
              className="absolute inset-0.5 rounded"
              style={{ backgroundColor: format.backgroundColor || 'transparent' }}
            />
          </div>
        </button>

        {showBgColorPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowBgColorPicker(false)}
            />
            <ColorPicker
              colors={BACKGROUND_COLORS}
              selectedColor={format.backgroundColor || 'transparent'}
              onSelectColor={(color) => {
                onFormatChange({ backgroundColor: color });
                setShowBgColorPicker(false);
              }}
              label="Background Color"
            />
          </>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <FormatButton
          icon={<AlignLeft className="w-4 h-4" />}
          isActive={format.alignment === 'left' || !format.alignment}
          onClick={() => setAlignment('left')}
          label="Align left"
        />
        <FormatButton
          icon={<AlignCenter className="w-4 h-4" />}
          isActive={format.alignment === 'center'}
          onClick={() => setAlignment('center')}
          label="Align center"
        />
        <FormatButton
          icon={<AlignRight className="w-4 h-4" />}
          isActive={format.alignment === 'right'}
          onClick={() => setAlignment('right')}
          label="Align right"
        />
        <FormatButton
          icon={<AlignJustify className="w-4 h-4" />}
          isActive={format.alignment === 'justify'}
          onClick={() => setAlignment('justify')}
          label="Justify"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200" />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <FormatButton
          icon={<List className="w-4 h-4" />}
          isActive={format.listType === 'bullet'}
          onClick={() => setListType('bullet')}
          label="Bullet list"
        />
        <FormatButton
          icon={<ListOrdered className="w-4 h-4" />}
          isActive={format.listType === 'numbered'}
          onClick={() => setListType('numbered')}
          label="Numbered list"
        />
      </div>
    </div>
  );
};

// ============================================
// FormatButton Component
// ============================================

interface FormatButtonProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

const FormatButton: React.FC<FormatButtonProps> = ({
  icon,
  isActive,
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
      isActive
        ? 'bg-indigo-100 text-indigo-600'
        : 'text-slate-600 hover:bg-slate-100'
    }`}
    title={label}
    aria-label={label}
    aria-pressed={isActive}
  >
    {icon}
  </button>
);

// ============================================
// ColorPicker Component
// ============================================

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onSelectColor,
  label,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-20"
  >
    <p className="text-xs font-medium text-slate-700 mb-2">{label}</p>
    <div className="grid grid-cols-5 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelectColor(color)}
          className={`w-8 h-8 rounded-lg transition-all ${
            selectedColor === color
              ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
              : 'hover:scale-105'
          } ${color === 'transparent' ? 'bg-slate-100' : ''}`}
          style={{
            backgroundColor: color === 'transparent' ? undefined : color,
          }}
          aria-label={`Select color ${color}`}
        >
          {color === 'transparent' && (
            <svg
              viewBox="0 0 32 32"
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="28" x2="28" y2="4" />
            </svg>
          )}
        </button>
      ))}
    </div>
  </motion.div>
);

export default RichTextToolbar;
