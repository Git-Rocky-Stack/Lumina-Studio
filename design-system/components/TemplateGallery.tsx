import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Star, Download, Heart, Eye,
  Grid, List, Sparkles, Palette, Layout, Image,
  Video, FileText, Briefcase, ShoppingBag, Megaphone,
  ChevronDown, X, Check, Wand2
} from 'lucide-react';
import { springPresets } from '../animations';

// Types
interface Template {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  tags: string[];
  isPremium?: boolean;
  isFavorite?: boolean;
  downloads: number;
  likes: number;
  author: {
    name: string;
    avatar?: string;
  };
  dimensions?: { width: number; height: number };
  createdAt: Date;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
}

// Main Template Gallery
interface TemplateGalleryProps {
  templates: Template[];
  categories: Category[];
  onSelect: (template: Template) => void;
  onPreview: (template: Template) => void;
  onFavorite: (templateId: string) => void;
  className?: string;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  categories,
  onSelect,
  onPreview,
  onFavorite,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'likes'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach(t => t.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [templates]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory);
    }

    // Tags filter
    if (selectedTags.size > 0) {
      result = result.filter(t =>
        t.tags.some(tag => selectedTags.has(tag))
      );
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result = [...result].sort((a, b) => b.downloads - a.downloads);
        break;
      case 'recent':
        result = [...result].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'likes':
        result = [...result].sort((a, b) => b.likes - a.likes);
        break;
    }

    return result;
  }, [templates, searchQuery, selectedCategory, sortBy, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Filter toggle */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl font-semibold type-body-sm transition-colors
              ${showFilters
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <Filter size={16} />
            Filters
            {selectedTags.size > 0 && (
              <span className="px-1.5 py-0.5 type-caption bg-indigo-500 text-white rounded-full">
                {selectedTags.size}
              </span>
            )}
          </motion.button>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 type-body-sm outline-none"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="likes">Most Liked</option>
          </select>

          {/* View toggle */}
          <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
            >
              <Grid size={16} className={viewMode === 'grid' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
            >
              <List size={16} className={viewMode === 'list' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'} />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <motion.button
            onClick={() => setSelectedCategory(null)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full type-body-sm font-semibold whitespace-nowrap
              ${!selectedCategory
                ? 'bg-indigo-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            All Templates
          </motion.button>
          {categories.map(category => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full type-body-sm font-semibold whitespace-nowrap
                ${selectedCategory === category.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}
              `}
              whileTap={{ scale: 0.95 }}
            >
              {category.icon}
              {category.label}
              <span className="type-caption opacity-70">({category.count})</span>
            </motion.button>
          ))}
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <motion.button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`
                      px-2.5 py-1 rounded-lg type-label transition-colors
                      ${selectedTags.has(tag)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}
                    `}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template grid/list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Search size={24} className="text-zinc-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              No templates found
            </h3>
            <p className="type-body-sm text-zinc-500 dark:text-zinc-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                onSelect={() => onSelect(template)}
                onPreview={() => onPreview(template)}
                onFavorite={() => onFavorite(template.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTemplates.map((template, index) => (
              <TemplateListItem
                key={template.id}
                template={template}
                index={index}
                onSelect={() => onSelect(template)}
                onPreview={() => onPreview(template)}
                onFavorite={() => onFavorite(template.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Template card for grid view
interface TemplateCardProps {
  template: Template;
  index: number;
  onSelect: () => void;
  onPreview: () => void;
  onFavorite: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  index,
  onSelect,
  onPreview,
  onFavorite,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.img
          src={template.thumbnail}
          alt={template.title}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Premium badge */}
        {template.isPremium && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white type-micro">
            <Star size={10} fill="currentColor" />
            PRO
          </div>
        )}

        {/* Favorite button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          className={`
            absolute top-2 right-2 p-1.5 rounded-full transition-colors
            ${template.isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-black/30 text-white hover:bg-red-500'}
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart size={14} fill={template.isFavorite ? 'currentColor' : 'none'} />
        </motion.button>

        {/* Hover overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                onClick={onPreview}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 text-white type-body-sm font-semibold backdrop-blur-sm hover:bg-white/30"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye size={14} />
                Preview
              </motion.button>
              <motion.button
                onClick={onSelect}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500 text-white type-body-sm font-semibold hover:bg-indigo-600"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download size={14} />
                Use
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-zinc-900 dark:text-white truncate">
          {template.title}
        </h3>
        <p className="type-caption text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          {template.description}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 type-caption text-zinc-400">
            <span className="flex items-center gap-0.5">
              <Download size={10} />
              {template.downloads}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart size={10} />
              {template.likes}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Template list item
const TemplateListItem: React.FC<TemplateCardProps> = ({
  template,
  index,
  onSelect,
  onPreview,
  onFavorite,
}) => {
  return (
    <motion.div
      className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0">
        <img src={template.thumbnail} alt="" className="w-full h-full object-cover" />
        {template.isPremium && (
          <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white type-micro">
            <Star size={8} fill="currentColor" />
            PRO
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-zinc-900 dark:text-white truncate">
          {template.title}
        </h3>
        <p className="type-caption text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          {template.description}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 type-caption text-zinc-400">
            <Download size={10} />
            {template.downloads}
          </span>
          <span className="flex items-center gap-1 type-caption text-zinc-400">
            <Heart size={10} />
            {template.likes}
          </span>
          <div className="flex gap-1">
            {template.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 type-micro bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <motion.button
          onClick={onFavorite}
          className={`p-2 rounded-lg transition-colors ${template.isFavorite ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart size={16} fill={template.isFavorite ? 'currentColor' : 'none'} />
        </motion.button>
        <motion.button
          onClick={onPreview}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Eye size={16} />
        </motion.button>
        <motion.button
          onClick={onSelect}
          className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white type-body-sm font-semibold hover:bg-indigo-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Use Template
        </motion.button>
      </div>
    </motion.div>
  );
};

// AI Design Suggestions panel
interface AIDesignSuggestionsProps {
  currentDesign?: any;
  onApplySuggestion: (suggestion: DesignSuggestion) => void;
  className?: string;
}

interface DesignSuggestion {
  id: string;
  type: 'color' | 'layout' | 'typography' | 'spacing' | 'style';
  title: string;
  description: string;
  preview?: string;
  changes: any;
  confidence: number;
}

export const AIDesignSuggestions: React.FC<AIDesignSuggestionsProps> = ({
  currentDesign,
  onApplySuggestion,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);

  // Mock suggestions
  const mockSuggestions: DesignSuggestion[] = [
    {
      id: '1',
      type: 'color',
      title: 'Improve Contrast',
      description: 'Increase text contrast for better readability',
      confidence: 0.92,
      changes: {},
    },
    {
      id: '2',
      type: 'layout',
      title: 'Balance Spacing',
      description: 'Apply consistent spacing between elements',
      confidence: 0.88,
      changes: {},
    },
    {
      id: '3',
      type: 'typography',
      title: 'Typography Hierarchy',
      description: 'Strengthen visual hierarchy with font sizes',
      confidence: 0.85,
      changes: {},
    },
  ];

  const generateSuggestions = async () => {
    setIsLoading(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSuggestions(mockSuggestions);
    setIsLoading(false);
  };

  const typeIcons = {
    color: <Palette size={14} />,
    layout: <Layout size={14} />,
    typography: <FileText size={14} />,
    spacing: <Grid size={14} />,
    style: <Sparkles size={14} />,
  };

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Wand2 size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">AI Suggestions</h3>
            <p className="type-caption text-zinc-500 dark:text-zinc-400">Improve your design</p>
          </div>
        </div>

        <motion.button
          onClick={generateSuggestions}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white type-body-sm font-semibold disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <Sparkles size={14} />
          )}
          {isLoading ? 'Analyzing...' : 'Analyze Design'}
        </motion.button>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${suggestion.type === 'color' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-500' :
                    suggestion.type === 'layout' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' :
                    suggestion.type === 'typography' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' :
                    suggestion.type === 'spacing' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' :
                    'bg-purple-100 dark:bg-purple-900/30 text-purple-500'}
                `}>
                  {typeIcons[suggestion.type]}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-zinc-900 dark:text-white">
                      {suggestion.title}
                    </h4>
                    <span className="type-caption text-zinc-400">
                      {Math.round(suggestion.confidence * 100)}% confident
                    </span>
                  </div>
                  <p className="type-caption text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {suggestion.description}
                  </p>

                  <motion.button
                    onClick={() => onApplySuggestion(suggestion)}
                    className="flex items-center gap-1 mt-2 type-label text-indigo-500 hover:text-indigo-600"
                    whileHover={{ x: 2 }}
                  >
                    Apply suggestion
                    <ChevronDown size={12} className="rotate-[-90deg]" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : !isLoading && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <Wand2 size={20} className="text-zinc-400" />
          </div>
          <p className="type-body-sm text-zinc-500 dark:text-zinc-400">
            Click "Analyze Design" to get AI-powered suggestions
          </p>
        </div>
      )}
    </div>
  );
};

// Default categories
export const defaultCategories: Category[] = [
  { id: 'social', label: 'Social Media', icon: <Image size={14} />, count: 0 },
  { id: 'presentation', label: 'Presentations', icon: <Layout size={14} />, count: 0 },
  { id: 'video', label: 'Video', icon: <Video size={14} />, count: 0 },
  { id: 'marketing', label: 'Marketing', icon: <Megaphone size={14} />, count: 0 },
  { id: 'business', label: 'Business', icon: <Briefcase size={14} />, count: 0 },
  { id: 'ecommerce', label: 'E-commerce', icon: <ShoppingBag size={14} />, count: 0 },
];

export default TemplateGallery;
