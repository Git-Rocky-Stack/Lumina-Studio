import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptSuggestion {
  id: string;
  category: string;
  prompt: string;
  preview?: string;
  tags: string[];
}

const suggestions: PromptSuggestion[] = [
  // Backgrounds
  {
    id: 'bg-1',
    category: 'Backgrounds',
    prompt: 'Abstract flowing gradient with purple and blue tones, smooth liquid motion, 4K wallpaper style',
    tags: ['abstract', 'gradient', 'purple'],
  },
  {
    id: 'bg-2',
    category: 'Backgrounds',
    prompt: 'Minimalist geometric pattern, soft pastel colors, modern design, subtle shadows',
    tags: ['minimal', 'geometric', 'pastel'],
  },
  {
    id: 'bg-3',
    category: 'Backgrounds',
    prompt: 'Dark cosmic nebula with stars and galaxies, deep space photography style, vibrant colors',
    tags: ['space', 'cosmic', 'dark'],
  },
  // Products
  {
    id: 'prod-1',
    category: 'Products',
    prompt: 'Professional product photography, white background, soft studio lighting, commercial quality',
    tags: ['product', 'professional', 'studio'],
  },
  {
    id: 'prod-2',
    category: 'Products',
    prompt: 'Lifestyle product shot in modern home setting, natural lighting, warm tones',
    tags: ['lifestyle', 'natural', 'warm'],
  },
  // Social Media
  {
    id: 'social-1',
    category: 'Social Media',
    prompt: 'Eye-catching Instagram story background, bold colors, trendy aesthetic, vertical format',
    tags: ['instagram', 'trendy', 'bold'],
  },
  {
    id: 'social-2',
    category: 'Social Media',
    prompt: 'Professional LinkedIn banner, corporate blue tones, subtle pattern, business style',
    tags: ['linkedin', 'corporate', 'professional'],
  },
  // Marketing
  {
    id: 'mkt-1',
    category: 'Marketing',
    prompt: 'Hero image for tech startup landing page, futuristic elements, gradient overlays',
    tags: ['tech', 'startup', 'futuristic'],
  },
  {
    id: 'mkt-2',
    category: 'Marketing',
    prompt: 'Email header graphic, holiday theme, festive colors, celebration mood',
    tags: ['holiday', 'festive', 'email'],
  },
  // Art & Creative
  {
    id: 'art-1',
    category: 'Art & Creative',
    prompt: 'Surrealist digital art, dreamlike landscape, floating objects, Salvador Dali inspired',
    tags: ['surreal', 'art', 'dreamlike'],
  },
  {
    id: 'art-2',
    category: 'Art & Creative',
    prompt: 'Retro synthwave aesthetic, neon grid, 80s style, cyberpunk vibes',
    tags: ['retro', 'synthwave', 'neon'],
  },
];

interface AIPromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

const AIPromptSuggestions: React.FC<AIPromptSuggestionsProps> = ({
  onSelectPrompt,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [...new Set(suggestions.map(s => s.category))];

  const filteredSuggestions = suggestions.filter(s => {
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      s.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const randomSuggestion = () => {
    const random = suggestions[Math.floor(Math.random() * suggestions.length)];
    onSelectPrompt(random.prompt);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="type-subsection text-white flex items-center gap-3">
            <i className="fas fa-wand-magic-sparkles text-violet-400" aria-hidden="true" />
            Prompt Ideas
          </h3>
          <p className="text-slate-400 text-sm mt-1">Get inspired with curated prompts</p>
        </div>
        <button
          onClick={randomSuggestion}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 text-violet-400 type-body-sm font-semibold border border-violet-500/20 hover:bg-violet-500/20 transition-all"
        >
          <i className="fas fa-shuffle" aria-hidden="true" />
          Surprise Me
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none transition-colors"
          aria-label="Search prompts"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl type-body-sm font-semibold transition-all ${
            !selectedCategory
              ? 'bg-indigo-500 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl type-body-sm font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Suggestions list */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        <AnimatePresence mode="popLayout">
          {filteredSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelectPrompt(suggestion.prompt)}
              className="w-full p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-800 text-left transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white text-sm leading-relaxed mb-3">
                    {suggestion.prompt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-white/5 text-slate-500 text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <i className="fas fa-arrow-right text-white text-xs" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {filteredSuggestions.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-search text-2xl text-slate-600 mb-3" aria-hidden="true" />
            <p className="text-slate-400">No prompts found</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <p className="text-sm text-indigo-300">
          <i className="fas fa-lightbulb text-amber-400 mr-2" aria-hidden="true" />
          <strong>Pro tip:</strong> Add details like style, colors, and mood for better results.
          Try adding "4K, highly detailed, professional" for higher quality outputs.
        </p>
      </div>
    </div>
  );
};

export default AIPromptSuggestions;
