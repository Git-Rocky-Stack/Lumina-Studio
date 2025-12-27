// ============================================
// useTextFormatting - Typography State Management
// ============================================

import { useState, useCallback, useMemo } from 'react';

// Types
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  color: string;
  backgroundColor: string;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface ParagraphStyle {
  marginTop: number;
  marginBottom: number;
  firstLineIndent: number;
  textIndent: number;
  columns: number;
  columnGap: number;
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export interface StylePreset {
  id: string;
  name: string;
  textStyle: Partial<TextStyle>;
  paragraphStyle?: Partial<ParagraphStyle>;
  category: 'heading' | 'body' | 'accent' | 'custom';
}

// Default styles
const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 12,
  fontWeight: 400,
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  lineHeight: 1.5,
  letterSpacing: 0,
  color: '#000000',
  backgroundColor: 'transparent',
  textTransform: 'none',
};

const DEFAULT_PARAGRAPH_STYLE: ParagraphStyle = {
  marginTop: 0,
  marginBottom: 12,
  firstLineIndent: 0,
  textIndent: 0,
  columns: 1,
  columnGap: 20,
};

// Built-in presets
const BUILT_IN_PRESETS: StylePreset[] = [
  {
    id: 'heading-1',
    name: 'Heading 1',
    category: 'heading',
    textStyle: { fontSize: 32, fontWeight: 700, lineHeight: 1.2 },
    paragraphStyle: { marginTop: 24, marginBottom: 16 }
  },
  {
    id: 'heading-2',
    name: 'Heading 2',
    category: 'heading',
    textStyle: { fontSize: 24, fontWeight: 700, lineHeight: 1.3 },
    paragraphStyle: { marginTop: 20, marginBottom: 12 }
  },
  {
    id: 'heading-3',
    name: 'Heading 3',
    category: 'heading',
    textStyle: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
    paragraphStyle: { marginTop: 16, marginBottom: 8 }
  },
  {
    id: 'body',
    name: 'Body Text',
    category: 'body',
    textStyle: { fontSize: 12, fontWeight: 400, lineHeight: 1.6 },
    paragraphStyle: { marginTop: 0, marginBottom: 12 }
  },
  {
    id: 'body-large',
    name: 'Body Large',
    category: 'body',
    textStyle: { fontSize: 14, fontWeight: 400, lineHeight: 1.6 },
    paragraphStyle: { marginTop: 0, marginBottom: 14 }
  },
  {
    id: 'caption',
    name: 'Caption',
    category: 'body',
    textStyle: { fontSize: 10, fontWeight: 400, fontStyle: 'italic', color: '#666666' },
    paragraphStyle: { marginTop: 4, marginBottom: 4 }
  },
  {
    id: 'quote',
    name: 'Block Quote',
    category: 'accent',
    textStyle: { fontSize: 14, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.8 },
    paragraphStyle: { marginTop: 16, marginBottom: 16, textIndent: 24 }
  },
  {
    id: 'code',
    name: 'Code',
    category: 'accent',
    textStyle: { fontFamily: 'Courier New', fontSize: 11, backgroundColor: '#f5f5f5' },
    paragraphStyle: { marginTop: 8, marginBottom: 8 }
  },
];

export function useTextFormatting() {
  // State
  const [textStyle, setTextStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE);
  const [paragraphStyle, setParagraphStyle] = useState<ParagraphStyle>(DEFAULT_PARAGRAPH_STYLE);
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [customPresets, setCustomPresets] = useState<StylePreset[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // All presets
  const allPresets = useMemo(() => [...BUILT_IN_PRESETS, ...customPresets], [customPresets]);

  // Update text style
  const updateTextStyle = useCallback((updates: Partial<TextStyle>) => {
    setTextStyle(prev => ({ ...prev, ...updates }));
    setActivePreset(null); // Clear active preset when manually editing
  }, []);

  // Update paragraph style
  const updateParagraphStyle = useCallback((updates: Partial<ParagraphStyle>) => {
    setParagraphStyle(prev => ({ ...prev, ...updates }));
    setActivePreset(null);
  }, []);

  // Toggle bold
  const toggleBold = useCallback(() => {
    setTextStyle(prev => ({
      ...prev,
      fontWeight: prev.fontWeight >= 700 ? 400 : 700
    }));
  }, []);

  // Toggle italic
  const toggleItalic = useCallback(() => {
    setTextStyle(prev => ({
      ...prev,
      fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
    }));
  }, []);

  // Toggle underline
  const toggleUnderline = useCallback(() => {
    setTextStyle(prev => ({
      ...prev,
      textDecoration: prev.textDecoration === 'underline' ? 'none' : 'underline'
    }));
  }, []);

  // Toggle strikethrough
  const toggleStrikethrough = useCallback(() => {
    setTextStyle(prev => ({
      ...prev,
      textDecoration: prev.textDecoration === 'line-through' ? 'none' : 'line-through'
    }));
  }, []);

  // Set text alignment
  const setAlignment = useCallback((align: TextStyle['textAlign']) => {
    setTextStyle(prev => ({ ...prev, textAlign: align }));
  }, []);

  // Set text transform
  const setTransform = useCallback((transform: TextStyle['textTransform']) => {
    setTextStyle(prev => ({ ...prev, textTransform: transform }));
  }, []);

  // Increase font size
  const increaseFontSize = useCallback((amount: number = 1) => {
    setTextStyle(prev => ({
      ...prev,
      fontSize: Math.min(200, prev.fontSize + amount)
    }));
  }, []);

  // Decrease font size
  const decreaseFontSize = useCallback((amount: number = 1) => {
    setTextStyle(prev => ({
      ...prev,
      fontSize: Math.max(6, prev.fontSize - amount)
    }));
  }, []);

  // Apply preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = allPresets.find(p => p.id === presetId);
    if (!preset) return;

    setTextStyle(prev => ({ ...prev, ...preset.textStyle }));
    if (preset.paragraphStyle) {
      setParagraphStyle(prev => ({ ...prev, ...preset.paragraphStyle }));
    }
    setActivePreset(presetId);
  }, [allPresets]);

  // Save custom preset
  const saveCustomPreset = useCallback((name: string, category: StylePreset['category'] = 'custom') => {
    const preset: StylePreset = {
      id: `custom-${Date.now()}`,
      name,
      category,
      textStyle: { ...textStyle },
      paragraphStyle: { ...paragraphStyle }
    };

    setCustomPresets(prev => [...prev, preset]);

    // Save to localStorage
    try {
      const saved = localStorage.getItem('lumina-text-presets');
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem('lumina-text-presets', JSON.stringify([...existing, preset]));
    } catch {
      // Ignore storage errors
    }

    return preset.id;
  }, [textStyle, paragraphStyle]);

  // Delete custom preset
  const deleteCustomPreset = useCallback((presetId: string) => {
    setCustomPresets(prev => prev.filter(p => p.id !== presetId));

    // Update localStorage
    try {
      const saved = localStorage.getItem('lumina-text-presets');
      if (saved) {
        const existing = JSON.parse(saved);
        localStorage.setItem('lumina-text-presets', JSON.stringify(
          existing.filter((p: StylePreset) => p.id !== presetId)
        ));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Reset to defaults
  const resetStyles = useCallback(() => {
    setTextStyle(DEFAULT_TEXT_STYLE);
    setParagraphStyle(DEFAULT_PARAGRAPH_STYLE);
    setActivePreset(null);
  }, []);

  // Get CSS from current styles
  const getCSS = useCallback((): React.CSSProperties => {
    return {
      fontFamily: textStyle.fontFamily,
      fontSize: `${textStyle.fontSize}px`,
      fontWeight: textStyle.fontWeight,
      fontStyle: textStyle.fontStyle,
      textDecoration: textStyle.textDecoration,
      textAlign: textStyle.textAlign,
      lineHeight: textStyle.lineHeight,
      letterSpacing: `${textStyle.letterSpacing}px`,
      color: textStyle.color,
      backgroundColor: textStyle.backgroundColor === 'transparent' ? undefined : textStyle.backgroundColor,
      textTransform: textStyle.textTransform,
      marginTop: `${paragraphStyle.marginTop}px`,
      marginBottom: `${paragraphStyle.marginBottom}px`,
      textIndent: `${paragraphStyle.firstLineIndent}px`,
      paddingLeft: `${paragraphStyle.textIndent}px`,
    };
  }, [textStyle, paragraphStyle]);

  // Get inline style string
  const getInlineStyle = useCallback((): string => {
    const css = getCSS();
    return Object.entries(css)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }, [getCSS]);

  // Copy style
  const copyStyle = useCallback((): { textStyle: TextStyle; paragraphStyle: ParagraphStyle } => {
    return {
      textStyle: { ...textStyle },
      paragraphStyle: { ...paragraphStyle }
    };
  }, [textStyle, paragraphStyle]);

  // Paste style
  const pasteStyle = useCallback((style: { textStyle?: Partial<TextStyle>; paragraphStyle?: Partial<ParagraphStyle> }) => {
    if (style.textStyle) {
      setTextStyle(prev => ({ ...prev, ...style.textStyle }));
    }
    if (style.paragraphStyle) {
      setParagraphStyle(prev => ({ ...prev, ...style.paragraphStyle }));
    }
  }, []);

  // Font size presets
  const fontSizePresets = useMemo(() => [
    8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72
  ], []);

  // Font weight presets
  const fontWeightPresets = useMemo(() => [
    { value: 100, label: 'Thin' },
    { value: 200, label: 'Extra Light' },
    { value: 300, label: 'Light' },
    { value: 400, label: 'Regular' },
    { value: 500, label: 'Medium' },
    { value: 600, label: 'Semi Bold' },
    { value: 700, label: 'Bold' },
    { value: 800, label: 'Extra Bold' },
    { value: 900, label: 'Black' },
  ], []);

  // Line height presets
  const lineHeightPresets = useMemo(() => [
    { value: 1, label: 'Single' },
    { value: 1.15, label: '1.15' },
    { value: 1.5, label: '1.5' },
    { value: 2, label: 'Double' },
    { value: 2.5, label: '2.5' },
    { value: 3, label: 'Triple' },
  ], []);

  return {
    // State
    textStyle,
    paragraphStyle,
    selection,
    activePreset,
    presets: allPresets,
    customPresets,

    // Setters
    setTextStyle,
    setParagraphStyle,
    setSelection,
    updateTextStyle,
    updateParagraphStyle,

    // Toggle actions
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikethrough,

    // Set actions
    setAlignment,
    setTransform,
    increaseFontSize,
    decreaseFontSize,

    // Preset actions
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,
    resetStyles,

    // Style utilities
    getCSS,
    getInlineStyle,
    copyStyle,
    pasteStyle,

    // Presets
    fontSizePresets,
    fontWeightPresets,
    lineHeightPresets,

    // Computed
    isBold: textStyle.fontWeight >= 700,
    isItalic: textStyle.fontStyle === 'italic',
    isUnderline: textStyle.textDecoration === 'underline',
    isStrikethrough: textStyle.textDecoration === 'line-through',
  };
}

export default useTextFormatting;
