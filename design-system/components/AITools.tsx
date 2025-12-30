import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// AI Color Palette Generator
interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  mood?: string;
}

interface AIColorPaletteProps {
  onSelect: (palette: ColorPalette) => void;
  className?: string;
}

export const AIColorPalette: React.FC<AIColorPaletteProps> = ({ onSelect, className = '' }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);

  // Simulated AI color generation
  const generatePalettes = useCallback(async () => {
    setIsGenerating(true);

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate palettes based on prompt keywords
    const moods: Record<string, string[][]> = {
      warm: [
        ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF'],
        ['#E63946', '#F4A261', '#E9C46A', '#2A9D8F', '#264653'],
      ],
      cool: [
        ['#3D5A80', '#98C1D9', '#E0FBFC', '#EE6C4D', '#293241'],
        ['#006D77', '#83C5BE', '#EDF6F9', '#FFDDD2', '#E29578'],
      ],
      vibrant: [
        ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
        ['#7400B8', '#6930C3', '#5E60CE', '#5390D9', '#4EA8DE'],
      ],
      pastel: [
        ['#FFB5E8', '#B28DFF', '#AFF8DB', '#BFFCC6', '#FFC9DE'],
        ['#E7C6FF', '#BBD0FF', '#C8E7FF', '#D0F4DE', '#FCF6BD'],
      ],
      dark: [
        ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'],
        ['#10002B', '#240046', '#3C096C', '#5A189A', '#7B2CBF'],
      ],
      nature: [
        ['#606C38', '#283618', '#FEFAE0', '#DDA15E', '#BC6C25'],
        ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'],
      ],
    };

    const keyword = Object.keys(moods).find(k => prompt.toLowerCase().includes(k)) || 'vibrant';
    const moodPalettes = moods[keyword];

    const generated: ColorPalette[] = moodPalettes.map((colors, i) => ({
      id: `palette-${Date.now()}-${i}`,
      name: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Palette ${i + 1}`,
      colors,
      mood: keyword,
    }));

    setPalettes(generated);
    setIsGenerating(false);
  }, [prompt]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${className}`}>
      <h3 className="type-subsection text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <i className="fas fa-palette text-accent" />
        AI Color Palette Generator
      </h3>

      {/* Input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe your mood... (warm, cool, vibrant, pastel, dark, nature)"
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
        />
        <motion.button
          onClick={generatePalettes}
          disabled={isGenerating || !prompt.trim()}
          className="px-6 py-3 bg-accent text-white rounded-xl font-medium disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGenerating ? (
            <i className="fas fa-spinner fa-spin" />
          ) : (
            <>
              <i className="fas fa-wand-magic-sparkles mr-2" />
              Generate
            </>
          )}
        </motion.button>
      </div>

      {/* Generated Palettes */}
      <div className="space-y-4">
        <AnimatePresence>
          {palettes.map((palette, index) => (
            <motion.div
              key={palette.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                setSelectedPalette(palette.id);
                onSelect(palette);
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPalette === palette.id
                  ? 'border-accent bg-accent/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-900 dark:text-white">{palette.name}</span>
                <span className="text-xs text-slate-500 uppercase">{palette.mood}</span>
              </div>
              <div className="flex rounded-lg overflow-hidden">
                {palette.colors.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 h-12 relative group"
                    style={{ backgroundColor: color }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {palettes.length === 0 && !isGenerating && (
        <div className="text-center py-8 text-slate-400">
          <i className="fas fa-wand-magic-sparkles text-4xl mb-3 opacity-30" />
          <p>Enter a mood or theme to generate color palettes</p>
        </div>
      )}
    </div>
  );
};

// AI Copy Generator
interface AITextGeneratorProps {
  onGenerate: (text: string) => void;
  className?: string;
}

export const AITextGenerator: React.FC<AITextGeneratorProps> = ({ onGenerate, className = '' }) => {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'headline' | 'tagline' | 'description' | 'cta'>('headline');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const templates: Record<string, string[]> = {
    headline: [
      'Unleash Your Creative Potential',
      'Design Without Limits',
      'Where Ideas Come to Life',
      'Create. Inspire. Transform.',
      'Your Vision, Perfected',
    ],
    tagline: [
      'Simple. Beautiful. Powerful.',
      'Design made easy.',
      'Create with confidence.',
      'Bring ideas to life.',
      'The future of design.',
    ],
    description: [
      'A comprehensive design platform that empowers creators to build stunning visuals with ease.',
      'Transform your creative workflow with intelligent tools designed for modern designers.',
      'Everything you need to create, collaborate, and share beautiful designs.',
    ],
    cta: [
      'Get Started Free',
      'Start Creating Now',
      'Try It Today',
      'Join the Revolution',
      'Unlock Your Creativity',
    ],
  };

  const generate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Shuffle and pick templates
    const shuffled = [...templates[type]].sort(() => Math.random() - 0.5);
    setResults(shuffled.slice(0, 3));
    setIsGenerating(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${className}`}>
      <h3 className="type-subsection text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <i className="fas fa-pen-fancy text-accent" />
        AI Copy Generator
      </h3>

      {/* Type selector */}
      <div className="flex gap-2 mb-4">
        {(['headline', 'tagline', 'description', 'cta'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 rounded-lg type-body-sm font-semibold transition-colors ${
              type === t
                ? 'bg-accent text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Topic input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="What's your product or topic?"
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
        />
        <motion.button
          onClick={generate}
          disabled={isGenerating}
          className="px-6 py-3 bg-accent text-white rounded-xl font-medium disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGenerating ? <i className="fas fa-spinner fa-spin" /> : 'Generate'}
        </motion.button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.map((text, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 group"
          >
            <p className="flex-1 text-slate-700 dark:text-slate-300">{text}</p>
            <motion.button
              onClick={() => onGenerate(text)}
              className="px-3 py-1.5 bg-accent/10 text-accent rounded-lg type-body-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Use This
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// AI Layout Suggestions
interface LayoutSuggestion {
  id: string;
  name: string;
  preview: string;
  description: string;
}

interface AILayoutSuggestionsProps {
  contentType: 'social' | 'presentation' | 'print' | 'web';
  onSelect: (layout: LayoutSuggestion) => void;
  className?: string;
}

export const AILayoutSuggestions: React.FC<AILayoutSuggestionsProps> = ({
  contentType,
  onSelect,
  className = '',
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<LayoutSuggestion[]>([]);

  const layouts: Record<string, LayoutSuggestion[]> = {
    social: [
      { id: '1', name: 'Hero Focus', preview: '🖼️', description: 'Large image with overlay text' },
      { id: '2', name: 'Split View', preview: '📊', description: 'Image left, text right' },
      { id: '3', name: 'Grid Gallery', preview: '🔲', description: '4-image grid layout' },
      { id: '4', name: 'Story Card', preview: '📱', description: 'Vertical mobile-first' },
    ],
    presentation: [
      { id: '1', name: 'Title Slide', preview: '📑', description: 'Centered title with subtitle' },
      { id: '2', name: 'Two Column', preview: '📰', description: 'Content split 50/50' },
      { id: '3', name: 'Feature List', preview: '✅', description: 'Icon + text rows' },
      { id: '4', name: 'Data Chart', preview: '📈', description: 'Chart with annotations' },
    ],
    print: [
      { id: '1', name: 'Magazine', preview: '📖', description: 'Editorial style layout' },
      { id: '2', name: 'Flyer', preview: '📄', description: 'Bold header, clear CTA' },
      { id: '3', name: 'Brochure', preview: '📋', description: 'Tri-fold compatible' },
      { id: '4', name: 'Poster', preview: '🪧', description: 'Large format impact' },
    ],
    web: [
      { id: '1', name: 'Landing Hero', preview: '🌐', description: 'Full-width hero section' },
      { id: '2', name: 'Feature Grid', preview: '⬜', description: '3-column features' },
      { id: '3', name: 'Testimonials', preview: '💬', description: 'Quote carousel layout' },
      { id: '4', name: 'CTA Section', preview: '🎯', description: 'Conversion-focused' },
    ],
  };

  const analyze = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setSuggestions(layouts[contentType]);
    setIsAnalyzing(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="type-subsection text-slate-900 dark:text-white flex items-center gap-2">
          <i className="fas fa-th-large text-accent" />
          AI Layout Suggestions
        </h3>
        <motion.button
          onClick={analyze}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-accent text-white rounded-lg type-body-sm font-semibold disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isAnalyzing ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <i className="fas fa-magic mr-2" />
              Get Suggestions
            </>
          )}
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {suggestions.map((layout, index) => (
          <motion.button
            key={layout.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(layout)}
            className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-accent text-left transition-colors group"
          >
            <div className="text-4xl mb-3">{layout.preview}</div>
            <div className="font-medium text-slate-900 dark:text-white group-hover:text-accent transition-colors">
              {layout.name}
            </div>
            <div className="type-body-sm text-slate-500">{layout.description}</div>
          </motion.button>
        ))}
      </div>

      {suggestions.length === 0 && !isAnalyzing && (
        <div className="text-center py-8 text-slate-400">
          <i className="fas fa-lightbulb text-4xl mb-3 opacity-30" />
          <p>Click "Get Suggestions" to receive AI-powered layout recommendations</p>
        </div>
      )}
    </div>
  );
};

// Image Upscaler Preview
interface ImageUpscalerProps {
  imageUrl?: string;
  onUpscale: (scale: number) => void;
  className?: string;
}

export const ImageUpscaler: React.FC<ImageUpscalerProps> = ({
  imageUrl,
  onUpscale,
  className = '',
}) => {
  const [scale, setScale] = useState(2);
  const [isUpscaling, setIsUpscaling] = useState(false);

  const handleUpscale = async () => {
    setIsUpscaling(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    onUpscale(scale);
    setIsUpscaling(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${className}`}>
      <h3 className="type-subsection text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <i className="fas fa-expand text-accent" />
        AI Image Upscaler
      </h3>

      {/* Image preview */}
      <div className="relative aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="To upscale" className="w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <i className="fas fa-image text-4xl mb-2" />
            <p>Drop an image or paste URL</p>
          </div>
        )}
      </div>

      {/* Scale selector */}
      <div className="flex items-center gap-4 mb-4">
        <span className="type-body-sm text-slate-500">Scale:</span>
        {[2, 4, 8].map(s => (
          <button
            key={s}
            onClick={() => setScale(s)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              scale === s
                ? 'bg-accent text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
        <div className="type-body-sm text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Output:</span>{' '}
          {scale * 1920} x {scale * 1080}px
        </div>
        <div className="type-body-sm text-emerald-500">
          <i className="fas fa-check-circle mr-1" />
          AI Enhanced
        </div>
      </div>

      <motion.button
        onClick={handleUpscale}
        disabled={!imageUrl || isUpscaling}
        className="w-full py-3 bg-accent text-white rounded-xl font-medium disabled:opacity-50"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {isUpscaling ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2" />
            Upscaling...
          </>
        ) : (
          <>
            <i className="fas fa-wand-magic-sparkles mr-2" />
            Upscale Image
          </>
        )}
      </motion.button>
    </div>
  );
};

export default AIColorPalette;
