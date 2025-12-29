import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  generateTemplate,
  getStyleSuggestions,
  getQuickTemplateSuggestions,
  templateToCanvasElements,
  getFormatDimensions
} from '../../services/templateService';
import {
  TemplateCategory,
  OutputFormat,
  IndustryPreset,
  INDUSTRY_CONFIGS,
  STYLE_PRESETS
} from '../../types/template';
import type {
  GenerationPreferences,
  GeneratedTemplate,
  TemplatePrompt
} from '../../types/template';
import { BrandKit } from '../../types';
import TemplatePreview from './TemplatePreview';
import TemplateGallery from './TemplateGallery';

interface TemplateEngineProps {
  onApplyTemplate?: (elements: any[], dimensions: { width: number; height: number }) => void;
  brandKit?: BrandKit;
}

const TemplateEngine: React.FC<TemplateEngineProps> = ({ onApplyTemplate, brandKit }) => {
  // Core state
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration state
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(OutputFormat.INSTAGRAM_POST);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryPreset>(IndustryPreset.GENERAL);
  const [selectedStyle, setSelectedStyle] = useState<string>('professional');
  const [applyBrandKit, setApplyBrandKit] = useState(true);

  // Preferences
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    colorScheme: 'auto',
    layoutComplexity: 'moderate',
    textDensity: 'medium',
    imageStyle: 'auto',
    tone: 'auto'
  });

  // Results state
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [templateHistory, setTemplateHistory] = useState<GeneratedTemplate[]>([]);
  const [styleSuggestions, setStyleSuggestions] = useState<string[]>([]);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'create' | 'gallery' | 'history'>('create');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get dimensions for current format
  const dimensions = getFormatDimensions(selectedFormat);

  // Load quick suggestions on mount
  useEffect(() => {
    getQuickTemplateSuggestions(TemplateCategory.SOCIAL_MEDIA, selectedIndustry)
      .then(setQuickSuggestions)
      .catch(console.error);
  }, [selectedIndustry]);

  // Update style suggestions when prompt changes
  useEffect(() => {
    if (prompt.length <= 10) {
      return;
    }
    const timer = setTimeout(() => {
      getStyleSuggestions(prompt)
        .then(setStyleSuggestions)
        .catch(console.error);
    }, 1000);
    return () => clearTimeout(timer);
  }, [prompt]);

  // Generate template
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your template');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Apply style preset preferences
      const stylePreset = STYLE_PRESETS.find(s => s.id === selectedStyle);
      const mergedPreferences = {
        ...preferences,
        ...stylePreset?.preferences
      };

      const templatePrompt: TemplatePrompt = {
        id: `prompt_${Date.now()}`,
        prompt: prompt.trim(),
        format: selectedFormat,
        industry: selectedIndustry,
        applyBrandKit: applyBrandKit && !!brandKit,
        preferences: mergedPreferences,
        createdAt: new Date().toISOString()
      };

      const result = await generateTemplate(
        templatePrompt,
        applyBrandKit ? brandKit : null
      );

      setGeneratedTemplate(result);
      setTemplateHistory(prev => [result, ...prev].slice(0, 20));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate template');
      console.error('Template generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedFormat, selectedIndustry, selectedStyle, preferences, applyBrandKit, brandKit]);

  // Apply template to canvas
  const handleApplyToCanvas = useCallback(() => {
    if (!generatedTemplate || !onApplyTemplate) return;

    const elements = templateToCanvasElements(generatedTemplate.template);
    const dims = {
      width: generatedTemplate.template.width,
      height: generatedTemplate.template.height
    };

    onApplyTemplate(elements, dims);
  }, [generatedTemplate, onApplyTemplate]);

  // Format groups for organized display
  const formatGroups = [
    {
      label: 'Social Media',
      formats: [
        OutputFormat.INSTAGRAM_POST,
        OutputFormat.INSTAGRAM_STORY,
        OutputFormat.FACEBOOK_POST,
        OutputFormat.TWITTER_POST,
        OutputFormat.LINKEDIN_POST,
        OutputFormat.YOUTUBE_THUMBNAIL,
        OutputFormat.TIKTOK
      ]
    },
    {
      label: 'Marketing',
      formats: [
        OutputFormat.EMAIL_HEADER,
        OutputFormat.BANNER_AD,
        OutputFormat.HERO_IMAGE
      ]
    },
    {
      label: 'Presentations',
      formats: [
        OutputFormat.SLIDE_16_9,
        OutputFormat.SLIDE_4_3
      ]
    },
    {
      label: 'Print',
      formats: [
        OutputFormat.FLYER_LETTER,
        OutputFormat.BUSINESS_CARD,
        OutputFormat.POSTER_A4
      ]
    }
  ];

  const formatLabels: Record<OutputFormat, string> = {
    [OutputFormat.INSTAGRAM_POST]: 'Instagram Post',
    [OutputFormat.INSTAGRAM_STORY]: 'Instagram Story',
    [OutputFormat.INSTAGRAM_REEL]: 'Reel Cover',
    [OutputFormat.FACEBOOK_POST]: 'Facebook Post',
    [OutputFormat.FACEBOOK_COVER]: 'Facebook Cover',
    [OutputFormat.TWITTER_POST]: 'Twitter/X Post',
    [OutputFormat.LINKEDIN_POST]: 'LinkedIn Post',
    [OutputFormat.YOUTUBE_THUMBNAIL]: 'YouTube Thumbnail',
    [OutputFormat.TIKTOK]: 'TikTok',
    [OutputFormat.EMAIL_HEADER]: 'Email Header',
    [OutputFormat.BANNER_AD]: 'Banner Ad',
    [OutputFormat.HERO_IMAGE]: 'Hero Image',
    [OutputFormat.SLIDE_16_9]: 'Slide 16:9',
    [OutputFormat.SLIDE_4_3]: 'Slide 4:3',
    [OutputFormat.FLYER_LETTER]: 'Flyer (Letter)',
    [OutputFormat.BUSINESS_CARD]: 'Business Card',
    [OutputFormat.POSTER_A4]: 'Poster A4',
    [OutputFormat.CUSTOM]: 'Custom'
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-violet-50 text-violet-600 type-micro mb-2">
              AI Template Engine
            </div>
            <h1 className="type-section text-slate-900">
              Create Stunning Templates Instantly
            </h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { id: 'create', label: 'Create', icon: 'fa-wand-magic-sparkles' },
              { id: 'gallery', label: 'Gallery', icon: 'fa-grid-2' },
              { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg type-body-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'create' && (
          <>
            {/* Left Panel - Configuration */}
            <div className="w-[420px] bg-white border-r border-slate-200 overflow-y-auto p-6 space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="type-label text-slate-500 mb-2 block">
                  Describe your template
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Instagram post for tech startup announcing a new AI product launch..."
                  className="lumina-input w-full h-32 rounded-xl p-4 text-base resize-none"
                />

                {/* Quick Suggestions */}
                {quickSuggestions.length > 0 && !prompt && (
                  <div className="mt-3">
                    <p className="type-body-sm text-slate-400 mb-2">Quick ideas:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickSuggestions.slice(0, 4).map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(suggestion)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full type-body-sm text-slate-600 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Style Suggestions */}
                {styleSuggestions.length > 0 && prompt && (
                  <div className="mt-3">
                    <p className="type-body-sm text-slate-400 mb-2">
                      <i className="fas fa-lightbulb text-amber-500 mr-1"></i>
                      AI style suggestions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {styleSuggestions.slice(0, 4).map((style, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(prev => `${prev}. Style: ${style}`)}
                          className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 rounded-full type-body-sm text-violet-600 transition-colors"
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Format Selection */}
              <div>
                <label className="type-label text-slate-500 mb-3 block">Output Format</label>
                <div className="space-y-4">
                  {formatGroups.map(group => (
                    <div key={group.label}>
                      <p className="type-micro text-slate-400 mb-2">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.formats.map(format => (
                          <button
                            key={format}
                            onClick={() => setSelectedFormat(format)}
                            className={`px-3 py-2 rounded-lg type-body-sm transition-all ${
                              selectedFormat === format
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {formatLabels[format]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dimensions display */}
                <div className="mt-3 flex items-center gap-2 text-slate-400 type-body-sm">
                  <i className="fas fa-ruler-combined"></i>
                  <span>{dimensions.width} x {dimensions.height}px</span>
                  <span className="text-slate-300">|</span>
                  <span>{dimensions.aspectRatio}</span>
                </div>
              </div>

              {/* Industry Selection */}
              <div>
                <label className="type-label text-slate-500 mb-3 block">Industry</label>
                <div className="grid grid-cols-4 gap-2">
                  {INDUSTRY_CONFIGS.slice(0, 8).map(industry => (
                    <button
                      key={industry.id}
                      onClick={() => setSelectedIndustry(industry.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                        selectedIndustry === industry.id
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <i className={`fas ${industry.icon} text-lg`}></i>
                      <span className="type-micro">{industry.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div>
                <label className="type-label text-slate-500 mb-3 block">Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        selectedStyle === style.id
                          ? 'bg-violet-600 text-white ring-2 ring-violet-600 ring-offset-2'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <i className={`fas ${style.icon} text-xl`}></i>
                      <span className="type-body-sm font-medium">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Kit Toggle */}
              {brandKit && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <i className="fas fa-palette text-white"></i>
                    </div>
                    <div>
                      <p className="type-body-sm font-medium text-slate-700">Apply Brand Kit</p>
                      <p className="type-micro text-slate-400">Use your brand colors & fonts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setApplyBrandKit(!applyBrandKit)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      applyBrandKit ? 'bg-violet-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        applyBrandKit ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Advanced Options */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 type-body-sm text-slate-500 hover:text-slate-700"
                >
                  <i className={`fas fa-chevron-${showAdvanced ? 'up' : 'down'}`}></i>
                  Advanced options
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 space-y-4 overflow-hidden"
                    >
                      {/* Color Scheme */}
                      <div>
                        <label className="type-micro text-slate-400 mb-2 block">Color Scheme</label>
                        <select
                          value={preferences.colorScheme}
                          onChange={(e) => setPreferences(p => ({ ...p, colorScheme: e.target.value as any }))}
                          className="lumina-input w-full rounded-lg"
                        >
                          <option value="auto">Auto</option>
                          <option value="vibrant">Vibrant</option>
                          <option value="muted">Muted</option>
                          <option value="monochrome">Monochrome</option>
                          <option value="pastel">Pastel</option>
                        </select>
                      </div>

                      {/* Layout Complexity */}
                      <div>
                        <label className="type-micro text-slate-400 mb-2 block">Layout Complexity</label>
                        <div className="flex gap-2">
                          {['minimal', 'moderate', 'complex'].map(level => (
                            <button
                              key={level}
                              onClick={() => setPreferences(p => ({ ...p, layoutComplexity: level as any }))}
                              className={`flex-1 py-2 rounded-lg type-body-sm capitalize ${
                                preferences.layoutComplexity === level
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Text Density */}
                      <div>
                        <label className="type-micro text-slate-400 mb-2 block">Text Amount</label>
                        <div className="flex gap-2">
                          {['low', 'medium', 'high'].map(level => (
                            <button
                              key={level}
                              onClick={() => setPreferences(p => ({ ...p, textDensity: level as any }))}
                              className={`flex-1 py-2 rounded-lg type-body-sm capitalize ${
                                preferences.textDensity === level
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 type-body-sm">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                  isGenerating || !prompt.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-200'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-3">
                    <i className="fas fa-spinner-third fa-spin"></i>
                    Generating Template...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-wand-magic-sparkles"></i>
                    Generate Template
                  </span>
                )}
              </button>
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {generatedTemplate ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <TemplatePreview
                      template={generatedTemplate.template}
                      insights={generatedTemplate.insights}
                      onApply={handleApplyToCanvas}
                      onRegenerate={handleGenerate}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex items-center justify-center"
                  >
                    <div className="text-center max-w-md">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                        <i className="fas fa-wand-magic-sparkles text-4xl text-violet-500"></i>
                      </div>
                      <h3 className="type-subsection text-slate-700 mb-2">
                        AI-Powered Templates
                      </h3>
                      <p className="type-body text-slate-500">
                        Describe your vision and let AI create a stunning template customized for your needs.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {activeTab === 'gallery' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <TemplateGallery
              onSelectTemplate={(template) => {
                setGeneratedTemplate({
                  id: `gen_${Date.now()}`,
                  promptId: '',
                  template,
                  metadata: { model: 'preset', generationTime: 0, confidence: 1 },
                  insights: { reasoning: 'Pre-built template' },
                  status: 'completed',
                  createdAt: new Date().toISOString()
                });
                setActiveTab('create');
              }}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 p-6 overflow-y-auto">
            {templateHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-clock-rotate-left text-4xl text-slate-300 mb-4"></i>
                  <p className="type-body text-slate-500">No templates generated yet</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {templateHistory.map((gen, i) => (
                  <motion.div
                    key={gen.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setGeneratedTemplate(gen);
                      setActiveTab('create');
                    }}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                  >
                    <div
                      className="aspect-square relative"
                      style={{ backgroundColor: gen.template.backgroundColor }}
                    >
                      {/* Mini preview */}
                      <div className="absolute inset-4">
                        {gen.template.elements.slice(0, 3).map(el => (
                          <div
                            key={el.id}
                            className="absolute bg-slate-300/30 rounded"
                            style={{
                              left: `${(el.x / gen.template.width) * 100}%`,
                              top: `${(el.y / gen.template.height) * 100}%`,
                              width: `${(el.width / gen.template.width) * 100}%`,
                              height: `${(el.height / gen.template.height) * 100}%`
                            }}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="p-4">
                      <p className="type-body-sm font-medium text-slate-700 truncate">
                        {gen.template.name}
                      </p>
                      <p className="type-micro text-slate-400">
                        {new Date(gen.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEngine;
