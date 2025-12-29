import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RECOMMENDATION_CATEGORIES,
  DEFAULT_RECOMMENDATION_CONFIG
} from '../../types/recommendation';
import type {
  RecommendedAsset,
  DesignAnalysis,
  PaletteRecommendation,
  FontPairing,
  AssetCategory,
  DesignContext,
  TrendData
} from '../../types/recommendation';
import {
  analyzeDesignContext,
  generateRecommendations,
  generateColorHarmonies,
  generatePaletteRecommendations,
  generateFontPairings,
  getTrendingStyles,
  getUserPreferences,
  recordInteraction,
  getQuickRecommendations
} from '../../services/recommendationService';

interface SmartRecommendationsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: RecommendedAsset) => void;
  currentContext?: {
    projectType?: string;
    colors?: string[];
    style?: string;
    keywords?: string[];
  };
  mode?: 'panel' | 'modal' | 'inline';
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  currentContext,
  mode = 'panel'
}) => {
  // State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<RecommendedAsset[]>([]);
  const [palettes, setPalettes] = useState<PaletteRecommendation[]>([]);
  const [fontPairings, setFontPairings] = useState<FontPairing[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);

  // Context analysis
  const [designContext, setDesignContext] = useState<DesignAnalysis | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'assets' | 'colors' | 'fonts' | 'trends'>('assets');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // User preferences
  const userPrefs = useMemo(() => getUserPreferences(), []);

  // Analyze context on mount or when context changes
  useEffect(() => {
    if (isOpen && currentContext) {
      analyzeContext();
    }
  }, [isOpen, currentContext]);

  // Load trends
  useEffect(() => {
    setTrends(getTrendingStyles());
  }, []);

  const analyzeContext = async () => {
    if (!currentContext) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDesignContext({
        projectType: currentContext.projectType,
        existingColors: currentContext.colors,
        description: currentContext.keywords?.join(', ')
      });
      setDesignContext(analysis);

      // Generate recommendations based on analysis
      await loadRecommendations(analysis);
    } catch (error) {
      console.error('Context analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadRecommendations = async (context: DesignAnalysis) => {
    setIsLoading(true);
    try {
      // Load all recommendation types in parallel
      const [assetsRes, palettesRes, fontsRes] = await Promise.all([
        generateRecommendations({
          context,
          limit: 20
        }),
        generatePaletteRecommendations(context, 5),
        generateFontPairings(context, 5)
      ]);

      setRecommendations(assetsRes.recommendations);
      setPalettes(palettesRes);
      setFontPairings(fontsRes);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const results = await getQuickRecommendations(
        searchQuery.split(' '),
        activeCategory !== 'all' ? activeCategory as AssetCategory : undefined
      );
      setRecommendations(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssetClick = (asset: RecommendedAsset) => {
    // Record interaction
    recordInteraction({
      id: `int_${Date.now()}`,
      userId: 'current_user',
      assetId: asset.id,
      interactionType: 'view',
      timestamp: new Date().toISOString(),
      context: designContext?.projectType
    });

    onSelectAsset(asset);
  };

  const handleAssetUse = (asset: RecommendedAsset) => {
    recordInteraction({
      id: `int_${Date.now()}`,
      userId: 'current_user',
      assetId: asset.id,
      interactionType: 'use_in_design',
      timestamp: new Date().toISOString(),
      context: designContext?.projectType
    });

    onSelectAsset(asset);
    onClose();
  };

  const filteredRecommendations = useMemo(() => {
    if (activeCategory === 'all') return recommendations;
    const categoryConfig = RECOMMENDATION_CATEGORIES.find(c => c.id === activeCategory);
    if (!categoryConfig) return recommendations;
    return recommendations.filter(r =>
      categoryConfig.assetCategories.includes(r.category)
    );
  }, [recommendations, activeCategory]);

  if (!isOpen) return null;

  const containerClasses = mode === 'modal'
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
    : mode === 'panel'
      ? 'fixed right-0 top-0 h-full w-[480px] z-40 shadow-dramatic'
      : 'w-full';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: mode === 'panel' ? 480 : 0 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: mode === 'panel' ? 480 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={containerClasses}
      >
        <div className={`bg-white h-full flex flex-col ${mode === 'modal' ? 'rounded-4xl w-[900px] max-h-[85vh]' : ''}`}>
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-wand-magic-sparkles"></i>
                </div>
                <div>
                  <h2 className="type-subtitle text-slate-900">Smart Recommendations</h2>
                  <p className="type-caption text-slate-400">AI-powered suggestions for your design</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for assets, colors, fonts..."
                className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-2xl type-body focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              {searchQuery && (
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-accent text-white rounded-xl type-label hover:brightness-110 transition-all"
                >
                  Search
                </button>
              )}
            </div>

            {/* Context Summary */}
            {designContext && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-violet-50 rounded-xl border border-violet-100"
              >
                <div className="flex items-start gap-3">
                  <i className="fas fa-brain text-violet-500 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="type-label text-violet-700 mb-1">Context Detected</p>
                    <p className="type-caption text-violet-600">
                      {designContext.style} style, {designContext.mood} mood
                      {designContext.industry && ` for ${designContext.industry}`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {designContext.keywords.slice(0, 5).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-violet-100 rounded-lg type-caption text-violet-700">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-slate-100 flex gap-2">
            {[
              { id: 'assets', label: 'Assets', icon: 'fa-images' },
              { id: 'colors', label: 'Colors', icon: 'fa-palette' },
              { id: 'fonts', label: 'Fonts', icon: 'fa-font' },
              { id: 'trends', label: 'Trending', icon: 'fa-fire' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl type-label flex items-center gap-2 transition-all ${activeTab === tab.id
                    ? 'bg-accent text-white shadow-accent-elevated'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <i className={`fas ${tab.icon} text-sm`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading || isAnalyzing ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                      <i className="fas fa-wand-magic-sparkles text-violet-500 text-xl animate-bounce"></i>
                    </div>
                  </div>
                  <p className="type-body text-slate-600">
                    {isAnalyzing ? 'Analyzing your design...' : 'Finding perfect matches...'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Assets Tab */}
                {activeTab === 'assets' && (
                  <div className="p-4">
                    {/* Category Pills */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-3 py-1.5 rounded-full type-label whitespace-nowrap transition-all ${activeCategory === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        All
                      </button>
                      {RECOMMENDATION_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-full type-label whitespace-nowrap flex items-center gap-2 transition-all ${activeCategory === cat.id
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          <i className={`fas ${cat.icon} text-xs`}></i>
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Asset Grid */}
                    {filteredRecommendations.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {filteredRecommendations.map((asset, index) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            index={index}
                            onClick={() => handleAssetClick(asset)}
                            onUse={() => handleAssetUse(asset)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon="fa-images"
                        title="No recommendations yet"
                        description="Search or describe your project to get AI-powered suggestions"
                      />
                    )}
                  </div>
                )}

                {/* Colors Tab */}
                {activeTab === 'colors' && (
                  <div className="p-4">
                    <h3 className="type-card text-slate-900 mb-4">Recommended Palettes</h3>
                    {palettes.length > 0 ? (
                      <div className="space-y-4">
                        {palettes.map((palette, index) => (
                          <PaletteCard key={palette.id} palette={palette} index={index} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon="fa-palette"
                        title="No color recommendations"
                        description="Describe your design to get harmonious color palettes"
                      />
                    )}
                  </div>
                )}

                {/* Fonts Tab */}
                {activeTab === 'fonts' && (
                  <div className="p-4">
                    <h3 className="type-card text-slate-900 mb-4">Font Pairings</h3>
                    {fontPairings.length > 0 ? (
                      <div className="space-y-4">
                        {fontPairings.map((pairing, index) => (
                          <FontPairingCard key={pairing.id} pairing={pairing} index={index} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon="fa-font"
                        title="No font recommendations"
                        description="Tell us about your project to get typography suggestions"
                      />
                    )}
                  </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                  <div className="p-4">
                    <h3 className="type-card text-slate-900 mb-4">What's Trending</h3>
                    <div className="space-y-3">
                      {trends.map((trend, index) => (
                        <TrendCard key={trend.id} trend={trend} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <i className="fas fa-shield-check"></i>
                <span className="type-caption">AI-powered by Gemini</span>
              </div>
              {userPrefs && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="type-caption text-slate-500">
                    Personalized ({userPrefs.totalInteractions} interactions)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AssetCardProps {
  asset: RecommendedAsset;
  index: number;
  onClick: () => void;
  onUse: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, index, onClick, onUse }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-elevated hover:border-slate-200 transition-all cursor-pointer"
    onClick={onClick}
  >
    {/* Image */}
    <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
      <img
        src={asset.thumbnailUrl}
        alt={asset.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onUse(); }}
            className="px-3 py-1.5 bg-white rounded-lg type-label text-slate-900 hover:bg-accent hover:text-white transition-all"
          >
            <i className="fas fa-plus mr-1"></i> Use
          </button>
          <div className="flex gap-1">
            <button className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-all">
              <i className="fas fa-heart text-sm"></i>
            </button>
            <button className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-all">
              <i className="fas fa-download text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Score badge */}
      <div className="absolute top-2 right-2">
        <div className={`px-2 py-0.5 rounded-lg type-caption font-medium ${asset.score >= 80 ? 'bg-emerald-500 text-white' :
            asset.score >= 60 ? 'bg-amber-500 text-white' :
              'bg-slate-500 text-white'
          }`}>
          {asset.score}% match
        </div>
      </div>

      {/* Category badge */}
      <div className="absolute top-2 left-2">
        <div className="px-2 py-0.5 bg-white/90 backdrop-blur rounded-lg type-caption text-slate-700">
          {asset.category}
        </div>
      </div>
    </div>

    {/* Info */}
    <div className="p-3">
      <h4 className="type-label text-slate-900 truncate mb-1">{asset.name}</h4>
      <p className="type-caption text-slate-500 line-clamp-2 mb-2">{asset.reasonText}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {asset.tags.slice(0, 3).map((tag, i) => (
          <span key={i} className="px-2 py-0.5 bg-slate-100 rounded type-caption text-slate-600">
            {tag}
          </span>
        ))}
      </div>

      {/* Colors */}
      {asset.colors && asset.colors.length > 0 && (
        <div className="flex gap-1 mt-2">
          {asset.colors.slice(0, 5).map((color, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-md border border-white shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  </motion.div>
);

interface PaletteCardProps {
  palette: PaletteRecommendation;
  index: number;
}

const PaletteCard: React.FC<PaletteCardProps> = ({ palette, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-elevated transition-all"
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="type-card text-slate-900">{palette.name}</h4>
        <p className="type-caption text-slate-500">{palette.mood} | {palette.harmony.harmonyType}</p>
      </div>
      <div className={`px-2 py-0.5 rounded-lg type-caption font-medium ${palette.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
          palette.score >= 60 ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-700'
        }`}>
        {palette.score}%
      </div>
    </div>

    {/* Color swatches */}
    <div className="flex gap-1 mb-3">
      {palette.colors.map((color, i) => (
        <div
          key={i}
          className="flex-1 h-12 first:rounded-l-xl last:rounded-r-xl cursor-pointer hover:scale-y-110 transition-transform relative group"
          style={{ backgroundColor: color }}
          title={color}
        >
          <div className="absolute inset-x-0 -bottom-6 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="type-caption text-slate-600">{color}</span>
          </div>
        </div>
      ))}
    </div>

    {/* Reasons */}
    <div className="flex flex-wrap gap-1 mt-4">
      {palette.reasons.slice(0, 3).map((reason, i) => (
        <span key={i} className="px-2 py-0.5 bg-violet-50 rounded type-caption text-violet-600">
          {reason}
        </span>
      ))}
    </div>

    {/* Copy button */}
    <button
      onClick={() => navigator.clipboard.writeText(palette.colors.join(', '))}
      className="mt-3 w-full py-2 bg-slate-50 rounded-xl type-label text-slate-600 hover:bg-slate-100 transition-all"
    >
      <i className="fas fa-copy mr-2"></i>
      Copy Palette
    </button>
  </motion.div>
);

interface FontPairingCardProps {
  pairing: FontPairing;
  index: number;
}

const FontPairingCard: React.FC<FontPairingCardProps> = ({ pairing, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-elevated transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`px-2 py-0.5 rounded-lg type-caption ${pairing.harmonyScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
            pairing.harmonyScore >= 60 ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-700'
          }`}>
          {pairing.harmonyScore}% harmony
        </div>
        <span className="type-caption text-slate-400">|</span>
        <span className="type-caption text-slate-500">{pairing.mood}</span>
      </div>
    </div>

    {/* Font preview */}
    <div className="space-y-3">
      <div className="p-3 bg-slate-50 rounded-xl">
        <p className="type-caption text-slate-400 mb-1">Primary: {pairing.primary.category}</p>
        <p className="text-2xl text-slate-900" style={{ fontFamily: `"${pairing.primary.name}", sans-serif` }}>
          {pairing.primary.name}
        </p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl">
        <p className="type-caption text-slate-400 mb-1">Secondary: {pairing.secondary.category}</p>
        <p className="text-lg text-slate-700" style={{ fontFamily: `"${pairing.secondary.name}", sans-serif` }}>
          {pairing.secondary.name}
        </p>
      </div>
    </div>

    {/* Use cases */}
    <div className="mt-3 flex flex-wrap gap-1">
      {pairing.useCases.slice(0, 3).map((useCase, i) => (
        <span key={i} className="px-2 py-0.5 bg-indigo-50 rounded type-caption text-indigo-600">
          {useCase}
        </span>
      ))}
    </div>

    {/* Load fonts button */}
    <button
      onClick={() => {
        // In production, this would load the fonts via Google Fonts API
        console.log('Loading fonts:', pairing.primary.name, pairing.secondary.name);
      }}
      className="mt-3 w-full py-2 bg-slate-50 rounded-xl type-label text-slate-600 hover:bg-slate-100 transition-all"
    >
      <i className="fas fa-font mr-2"></i>
      Load Fonts
    </button>
  </motion.div>
);

interface TrendCardProps {
  trend: TrendData;
  index: number;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-elevated transition-all flex items-center gap-4"
  >
    {/* Icon/Color preview */}
    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
      style={trend.type === 'color' ? { backgroundColor: trend.value } : undefined}
    >
      {trend.type !== 'color' && (
        <i className={`fas ${trend.type === 'style' ? 'fa-paintbrush' :
            trend.type === 'category' ? 'fa-folder' : 'fa-image'
          } text-xl text-slate-400`}></i>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h4 className="type-card text-slate-900 truncate">{trend.value}</h4>
        <span className={`px-2 py-0.5 rounded-full type-caption ${trend.growthRate > 30 ? 'bg-emerald-100 text-emerald-700' :
            trend.growthRate > 10 ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
          }`}>
          <i className="fas fa-arrow-up mr-1"></i>
          {trend.growthRate.toFixed(1)}%
        </span>
      </div>
      <p className="type-caption text-slate-500">
        {trend.usageCount.toLocaleString()} uses this {trend.period}
      </p>
      <div className="flex gap-1 mt-1">
        {trend.industries.slice(0, 2).map((ind, i) => (
          <span key={i} className="px-2 py-0.5 bg-slate-100 rounded type-caption text-slate-600">
            {ind}
          </span>
        ))}
      </div>
    </div>

    {/* Use trend */}
    <button className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 hover:bg-accent hover:text-white text-slate-600 flex items-center justify-center transition-all">
      <i className="fas fa-plus"></i>
    </button>
  </motion.div>
);

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="h-64 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
        <i className={`fas ${icon} text-2xl text-slate-400`}></i>
      </div>
      <h4 className="type-card text-slate-900 mb-1">{title}</h4>
      <p className="type-caption text-slate-500 max-w-xs">{description}</p>
    </div>
  </div>
);

export default SmartRecommendations;
