import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  dimensions: { width: number; height: number };
  premium?: boolean;
  new?: boolean;
  popular?: boolean;
}

const templates: Template[] = [
  // Social Media
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    category: 'Social Media',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
    dimensions: { width: 1080, height: 1080 },
    popular: true,
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    category: 'Social Media',
    thumbnail: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=711&fit=crop',
    dimensions: { width: 1080, height: 1920 },
    popular: true,
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    category: 'Social Media',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=820&h=312&fit=crop',
    dimensions: { width: 820, height: 312 },
  },
  {
    id: 'twitter-header',
    name: 'Twitter/X Header',
    category: 'Social Media',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1500&h=500&fit=crop',
    dimensions: { width: 1500, height: 500 },
  },
  {
    id: 'linkedin-banner',
    name: 'LinkedIn Banner',
    category: 'Social Media',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1584&h=396&fit=crop',
    dimensions: { width: 1584, height: 396 },
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    category: 'Social Media',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1280&h=720&fit=crop',
    dimensions: { width: 1280, height: 720 },
    popular: true,
  },
  // Marketing
  {
    id: 'email-header',
    name: 'Email Header',
    category: 'Marketing',
    thumbnail: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&h=200&fit=crop',
    dimensions: { width: 600, height: 200 },
  },
  {
    id: 'web-banner',
    name: 'Web Banner',
    category: 'Marketing',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop',
    dimensions: { width: 1200, height: 400 },
  },
  {
    id: 'flyer',
    name: 'Flyer / Poster',
    category: 'Marketing',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop',
    dimensions: { width: 1080, height: 1620 },
    new: true,
  },
  // Business
  {
    id: 'presentation-16-9',
    name: 'Presentation 16:9',
    category: 'Business',
    thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1920&h=1080&fit=crop',
    dimensions: { width: 1920, height: 1080 },
    popular: true,
  },
  {
    id: 'business-card',
    name: 'Business Card',
    category: 'Business',
    thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=350&h=200&fit=crop',
    dimensions: { width: 1050, height: 600 },
  },
  {
    id: 'invoice',
    name: 'Invoice Template',
    category: 'Business',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=565&fit=crop',
    dimensions: { width: 595, height: 842 },
    premium: true,
  },
  // Print
  {
    id: 'a4-document',
    name: 'A4 Document',
    category: 'Print',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=565&fit=crop',
    dimensions: { width: 2480, height: 3508 },
  },
  {
    id: 'letter',
    name: 'US Letter',
    category: 'Print',
    thumbnail: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=517&fit=crop',
    dimensions: { width: 2550, height: 3300 },
  },
];

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  className?: string;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = [...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDimensions = (w: number, h: number) => `${w} × ${h}`;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-3">
            <i className="fas fa-grid-2 text-indigo-400" aria-hidden="true" />
            Template Gallery
          </h3>
          <p className="text-slate-400 text-sm mt-1">Start with a professionally designed template</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-xl bg-white/5 p-1">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fas fa-grid-2" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fas fa-list" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none transition-colors"
          aria-label="Search templates"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !selectedCategory
              ? 'bg-indigo-500 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          All Templates
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grid/list */}
      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {filteredTemplates.map((template, index) => (
              <motion.button
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelectTemplate(template)}
                className="group relative rounded-xl overflow-hidden bg-slate-800 border border-white/5 hover:border-indigo-500/50 transition-all text-left"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {template.new && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold">
                        NEW
                      </span>
                    )}
                    {template.popular && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold">
                        POPULAR
                      </span>
                    )}
                    {template.premium && (
                      <span className="px-2 py-0.5 rounded-md bg-violet-500 text-white text-[10px] font-bold flex items-center gap-1">
                        <i className="fas fa-crown text-[8px]" aria-hidden="true" />
                        PRO
                      </span>
                    )}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-medium shadow-lg">
                      Use Template
                    </span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-white text-sm font-medium truncate">{template.name}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {formatDimensions(template.dimensions.width, template.dimensions.height)}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div layout className="space-y-2">
            {filteredTemplates.map((template, index) => (
              <motion.button
                key={template.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onSelectTemplate(template)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-800 transition-all text-left group"
              >
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-16 h-12 object-cover rounded-lg"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">{template.name}</p>
                    {template.new && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold">NEW</span>
                    )}
                    {template.premium && (
                      <span className="px-1.5 py-0.5 rounded bg-violet-500 text-white text-[9px] font-bold">PRO</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {template.category} • {formatDimensions(template.dimensions.width, template.dimensions.height)}
                  </p>
                </div>
                <i className="fas fa-arrow-right text-slate-500 group-hover:text-indigo-400 transition-colors" aria-hidden="true" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <i className="fas fa-search text-3xl text-slate-600 mb-4" aria-hidden="true" />
          <p className="text-slate-400">No templates found</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
