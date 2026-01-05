// =============================================
// Template Browser Component
// Browse and search marketplace templates
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Star,
  TrendingUp,
  Clock,
  Download,
  Grid,
  List,
  Loader2,
  SlidersHorizontal,
  Tag,
  Sparkles,
} from 'lucide-react';
import {
  templateMarketplace,
  MarketplaceTemplate,
  TemplateCategory,
  SearchFilters,
} from '../../services/templateMarketplaceService';
import { TemplateCard } from './TemplateCard';
import { TemplateDetailModal } from './TemplateDetailModal';

// =============================================
// Types
// =============================================

interface TemplateBrowserProps {
  onTemplateSelect?: (template: MarketplaceTemplate) => void;
  onTemplateUse?: (template: MarketplaceTemplate) => void;
  className?: string;
}

const sortOptions = [
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'popular', label: 'Popular', icon: TrendingUp },
  { value: 'rating', label: 'Top Rated', icon: Star },
  { value: 'downloads', label: 'Most Downloaded', icon: Download },
];

const formatTypes = [
  'All Formats',
  'social_post',
  'story',
  'banner',
  'presentation',
  'thumbnail',
  'cover',
  'ad',
];

// =============================================
// Template Browser Component
// =============================================

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  onTemplateSelect,
  onTemplateUse,
  className = '',
}) => {
  // State
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<MarketplaceTemplate[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({ sortBy: 'popular' });
  const [showFilters, setShowFilters] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);

  const ITEMS_PER_PAGE = 20;

  // =============================================
  // Data Loading
  // =============================================

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    searchTemplates();
  }, [searchQuery, selectedCategory, filters, page]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [cats, featured, purchases, favorites] = await Promise.all([
        templateMarketplace.getCategories(),
        templateMarketplace.getFeaturedTemplates(6),
        templateMarketplace.getMyPurchases(),
        templateMarketplace.getMyFavorites(),
      ]);

      setCategories(cats);
      setFeaturedTemplates(featured);
      setPurchasedIds(new Set(purchases.map(p => p.template_id)));
      setFavoritedIds(new Set(favorites.map(t => t.id)));
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchFilters: SearchFilters = {
        ...filters,
        category: selectedCategory || undefined,
      };

      const { templates: results, total } = await templateMarketplace.searchTemplates(
        searchQuery || undefined,
        searchFilters,
        page,
        ITEMS_PER_PAGE
      );

      setTemplates(results);
      setTotalTemplates(total);
    } catch (err) {
      console.error('Failed to search templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, filters, page]);

  // =============================================
  // Handlers
  // =============================================

  const handleTemplateSelect = (template: MarketplaceTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleTemplateUse = (template: MarketplaceTemplate) => {
    setSelectedTemplate(null);
    onTemplateUse?.(template);
  };

  const handleFavoriteToggle = (templateId: string, isFavorited: boolean) => {
    setFavoritedIds(prev => {
      const next = new Set(prev);
      if (isFavorited) {
        next.add(templateId);
      } else {
        next.delete(templateId);
      }
      return next;
    });
  };

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
    setPage(1);
  };

  const togglePriceFilter = (type: 'free' | 'premium') => {
    setFilters(prev => {
      if (type === 'free') {
        return { ...prev, isFree: !prev.isFree, isPremium: false };
      } else {
        return { ...prev, isPremium: !prev.isPremium, isFree: false };
      }
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ sortBy: 'popular' });
    setSelectedCategory(null);
    setSearchQuery('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalTemplates / ITEMS_PER_PAGE);

  // =============================================
  // Render
  // =============================================

  return (
    <div className={`template-browser flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800 space-y-4">
        {/* Title & Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Template Marketplace</h2>
              <p className="text-sm text-zinc-500">{totalTemplates.toLocaleString()} templates</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50
                  text-zinc-200 placeholder-zinc-500
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
                  transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg
                    hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-800/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-transparent'
            }`}
          >
            All
          </button>
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              {cat.name}
            </button>
          ))}
          {categories.length > 8 && (
            <button className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm text-zinc-500
              hover:text-zinc-400 hover:bg-zinc-800/50 transition-colors">
              More <ChevronDown className="w-3 h-3 inline ml-1" />
            </button>
          )}
        </div>

        {/* Filters Bar */}
        <div className="flex items-center justify-between">
          {/* Sort & Quick Filters */}
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50
                  text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {sortOptions.find(o => o.value === filters.sortBy)?.label || 'Sort'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showFilters && (
                <div className="absolute top-full left-0 mt-1 w-48 py-1 rounded-xl bg-zinc-800
                  border border-zinc-700 shadow-xl z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleSortChange(option.value as SearchFilters['sortBy']);
                        setShowFilters(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm
                        transition-colors ${
                          filters.sortBy === option.value
                            ? 'text-violet-400 bg-violet-500/10'
                            : 'text-zinc-400 hover:bg-zinc-700/50'
                        }`}
                    >
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Filters */}
            <button
              onClick={() => togglePriceFilter('free')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filters.isFree
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => togglePriceFilter('premium')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filters.isPremium
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              Premium
            </button>
          </div>

          {/* Clear Filters */}
          {(selectedCategory || filters.isFree || filters.isPremium || searchQuery) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500
                hover:text-zinc-400 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No templates found</h3>
            <p className="text-zinc-500 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400
                hover:bg-violet-500/30 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured Section (only show on first page with no filters) */}
            {page === 1 && !selectedCategory && !searchQuery && featuredTemplates.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Featured Templates
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {featuredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isPurchased={purchasedIds.has(template.id)}
                      isFavorited={favoritedIds.has(template.id)}
                      onSelect={handleTemplateSelect}
                      onUse={handleTemplateUse}
                      onFavoriteToggle={(fav) => handleFavoriteToggle(template.id, fav)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Main Grid */}
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'space-y-3'
            }>
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isPurchased={purchasedIds.has(template.id)}
                  isFavorited={favoritedIds.has(template.id)}
                  onSelect={handleTemplateSelect}
                  onUse={handleTemplateUse}
                  onFavoriteToggle={(fav) => handleFavoriteToggle(template.id, fav)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400
                    hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-zinc-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400
                    hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          isPurchased={purchasedIds.has(selectedTemplate.id)}
          isFavorited={favoritedIds.has(selectedTemplate.id)}
          onClose={() => setSelectedTemplate(null)}
          onUse={handleTemplateUse}
          onPurchase={async () => {
            // Handle purchase flow
            const success = await templateMarketplace.purchaseTemplate(
              selectedTemplate.id,
              'free', // In production, integrate with payment provider
              undefined
            );
            if (success) {
              setPurchasedIds(prev => new Set([...prev, selectedTemplate.id]));
            }
          }}
          onFavoriteToggle={(fav) => handleFavoriteToggle(selectedTemplate.id, fav)}
        />
      )}
    </div>
  );
};

export default TemplateBrowser;
