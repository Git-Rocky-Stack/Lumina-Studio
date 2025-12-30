// ============================================================================
// STOCK PHOTO INTEGRATION - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StockPhoto,
  StockProvider,
  ImageOrientation,
  PROVIDER_INFO,
  CURATED_CATEGORIES,
  TRENDING_SEARCHES,
  COLOR_OPTIONS,
  generateAttribution,
  formatCount
} from '../../types/stockPhotos';
import { useStockPhotos } from '../../services/stockPhotosService';

// ============================================================================
// PHOTO CARD
// ============================================================================

interface PhotoCardProps {
  photo: StockPhoto;
  isFavorite: boolean;
  onSelect: () => void;
  onFavorite: () => void;
  onDownload: () => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  isFavorite,
  onSelect,
  onFavorite,
  onDownload
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const providerInfo = PROVIDER_INFO[photo.provider as Exclude<StockProvider, 'all'>];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-lg overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <img
        src={photo.urls.small}
        alt={photo.title}
        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          >
            {/* Top Actions */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={e => { e.stopPropagation(); onFavorite(); }}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite
                    ? 'bg-red-500 text-white'
                    : 'bg-black/50 text-white hover:bg-black/70'
                }`}
              >
                <i className={`fa-${isFavorite ? 'solid' : 'regular'} fa-heart text-sm`} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDownload(); }}
                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <i className="fa-solid fa-download text-sm" />
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-2 mb-1">
                {photo.photographer.avatar ? (
                  <img
                    src={photo.photographer.avatar}
                    alt={photo.photographer.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <i className="fa-solid fa-user text-xs text-white" />
                  </div>
                )}
                {/* Typography: type-body-sm - 13px */}
                <span className="text-white type-body-sm font-medium truncate">
                  {photo.photographer.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-heart" />
                  {formatCount(photo.likes || 0)}
                </span>
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-download" />
                  {formatCount(photo.downloads || 0)}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{ backgroundColor: providerInfo.color, color: '#fff' }}
                >
                  {providerInfo.name}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// PHOTO DETAIL MODAL
// ============================================================================

interface PhotoDetailModalProps {
  photo: StockPhoto;
  isFavorite: boolean;
  onClose: () => void;
  onFavorite: () => void;
  onDownload: (size: 'small' | 'medium' | 'large' | 'original') => void;
  onInsert: () => void;
}

const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  isFavorite,
  onClose,
  onFavorite,
  onDownload,
  onInsert
}) => {
  const providerInfo = PROVIDER_INFO[photo.provider as Exclude<StockProvider, 'all'>];
  const attribution = generateAttribution(photo);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1a2e] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[400px]">
          <img
            src={photo.urls.large}
            alt={photo.title}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Info Panel */}
        <div className="w-80 flex flex-col border-l border-white/10">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: providerInfo.color }}
                >
                  {providerInfo.name}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-white/50 hover:text-white"
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
            {/* Typography: type-subsection - 20px/700 */}
            <h3 className="type-subsection text-white mb-2">{photo.title}</h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <i className="fa-solid fa-user text-white/50" />
              </div>
              <div>
                <p className="text-sm text-white">{photo.photographer.name}</p>
                <a
                  href={photo.photographer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline"
                >
                  View profile
                </a>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/50">Dimensions</p>
                <p className="text-sm text-white">
                  {photo.dimensions.width} x {photo.dimensions.height}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Downloads</p>
                <p className="text-sm text-white">{formatCount(photo.downloads || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Likes</p>
                <p className="text-sm text-white">{formatCount(photo.likes || 0)}</p>
              </div>
              {photo.color && (
                <div>
                  <p className="text-xs text-white/50">Color</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: photo.color }}
                    />
                    <span className="text-sm text-white">{photo.color}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {photo.tags.length > 0 && (
            <div className="p-4 border-b border-white/10">
              <p className="text-xs text-white/50 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {photo.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attribution */}
          <div className="p-4 border-b border-white/10">
            <p className="text-xs text-white/50 mb-1">Attribution</p>
            <p className="text-sm text-white/70">{attribution}</p>
          </div>

          {/* Actions */}
          <div className="p-4 mt-auto space-y-2">
            <button
              onClick={onInsert}
              className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              <i className="fa-solid fa-plus mr-2" />
              Insert to Canvas
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onFavorite}
                className={`py-2 rounded-lg font-medium ${
                  isFavorite
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <i className={`fa-${isFavorite ? 'solid' : 'regular'} fa-heart mr-1`} />
                {isFavorite ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => onDownload('large')}
                className="py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 font-medium"
              >
                <i className="fa-solid fa-download mr-1" />
                Download
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// CATEGORY CARD
// ============================================================================

interface CategoryCardProps {
  category: typeof CURATED_CATEGORIES[0];
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${category.color}20` }}
      >
        <i className={`fa-solid ${category.icon}`} style={{ color: category.color }} />
      </div>
      <span className="text-white font-medium">{category.name}</span>
    </motion.button>
  );
};

// ============================================================================
// MAIN PANEL
// ============================================================================

export const StockPhotosPanel: React.FC<{
  onInsert?: (url: string, attribution: string) => void;
}> = ({ onInsert }) => {
  const {
    searchResults,
    isLoading,
    favorites,
    trending,
    search,
    loadMore,
    downloadPhoto,
    toggleFavorite,
    isFavorite
  } = useStockPhotos();

  const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'history'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [provider, setProvider] = useState<StockProvider>('all');
  const [orientation, setOrientation] = useState<ImageOrientation>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<StockPhoto | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      search({ query: searchQuery, provider, orientation });
      setHasSearched(true);
    }
  }, [searchQuery, provider, orientation, search]);

  const handleCategoryClick = useCallback((query: string) => {
    setSearchQuery(query);
    search({ query, provider, orientation });
    setHasSearched(true);
  }, [provider, orientation, search]);

  const handleInsert = useCallback(async (photo: StockPhoto) => {
    const url = await downloadPhoto(photo, 'large');
    const attribution = generateAttribution(photo);
    onInsert?.(url, attribution);
    setSelectedPhoto(null);
  }, [downloadPhoto, onInsert]);

  const handleDownload = useCallback(async (photo: StockPhoto, size: 'small' | 'medium' | 'large' | 'original') => {
    const url = await downloadPhoto(photo, size);
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${photo.title.replace(/\s+/g, '_')}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [downloadPhoto]);

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        {/* Typography: type-subsection - 20px/700 */}
        <h2 className="type-subsection text-white flex items-center gap-2 mb-4">
          <i className="fa-solid fa-images text-green-400" />
          Stock Photos
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-4">
          {(['search', 'favorites'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 type-body-sm font-semibold rounded capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab}
              {tab === 'favorites' && favorites.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search photos..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? (
                  <i className="fa-solid fa-spinner animate-spin" />
                ) : (
                  <i className="fa-solid fa-search" />
                )}
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as StockProvider)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="all">All Sources</option>
                <option value="unsplash">Unsplash</option>
                <option value="pexels">Pexels</option>
                <option value="pixabay">Pixabay</option>
              </select>
              <select
                value={orientation}
                onChange={e => setOrientation(e.target.value as ImageOrientation)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="all">Any Orientation</option>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
                <option value="square">Square</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'search' && (
          <>
            {!hasSearched ? (
              <div className="space-y-6">
                {/* Trending Searches */}
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-3">Trending Searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map(term => (
                      <button
                        key={term}
                        onClick={() => handleCategoryClick(term)}
                        className="px-3 py-1.5 bg-white/5 text-white/70 text-sm rounded-full hover:bg-white/10 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-3">Browse by Category</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {CURATED_CATEGORIES.slice(0, 8).map(category => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        onClick={() => handleCategoryClick(category.searchQuery)}
                      />
                    ))}
                  </div>
                </div>

                {/* Trending Photos */}
                {trending.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-3">Trending Photos</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {trending.slice(0, 4).map(photo => (
                        <PhotoCard
                          key={`${photo.provider}_${photo.id}`}
                          photo={photo}
                          isFavorite={isFavorite(photo)}
                          onSelect={() => setSelectedPhoto(photo)}
                          onFavorite={() => toggleFavorite(photo)}
                          onDownload={() => handleDownload(photo, 'large')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Search Results */}
                {searchResults && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-white/50">
                        {searchResults.totalResults} results for "{searchQuery}"
                      </p>
                    </div>

                    {searchResults.photos.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {searchResults.photos.map(photo => (
                            <PhotoCard
                              key={`${photo.provider}_${photo.id}`}
                              photo={photo}
                              isFavorite={isFavorite(photo)}
                              onSelect={() => setSelectedPhoto(photo)}
                              onFavorite={() => toggleFavorite(photo)}
                              onDownload={() => handleDownload(photo, 'large')}
                            />
                          ))}
                        </div>

                        {searchResults.hasMore && (
                          <button
                            onClick={() => loadMore({ query: searchQuery, provider, orientation })}
                            disabled={isLoading}
                            className="w-full mt-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <>
                                <i className="fa-solid fa-spinner animate-spin mr-2" />
                                Loading...
                              </>
                            ) : (
                              'Load More'
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <i className="fa-solid fa-image-slash text-4xl text-white/20 mb-3" />
                        <p className="text-white/50">No photos found</p>
                        <p className="text-white/30 text-sm">Try a different search term</p>
                      </div>
                    )}
                  </div>
                )}

                {isLoading && !searchResults && (
                  <div className="flex items-center justify-center py-12">
                    <i className="fa-solid fa-spinner animate-spin text-2xl text-white/50" />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {favorites.map(fav => (
                  <PhotoCard
                    key={`${fav.photo.provider}_${fav.photo.id}`}
                    photo={fav.photo}
                    isFavorite={true}
                    onSelect={() => setSelectedPhoto(fav.photo)}
                    onFavorite={() => toggleFavorite(fav.photo)}
                    onDownload={() => handleDownload(fav.photo, 'large')}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fa-solid fa-heart text-4xl text-white/20 mb-3" />
                <p className="text-white/50">No favorites yet</p>
                <p className="text-white/30 text-sm">Save photos to access them quickly</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoDetailModal
            photo={selectedPhoto}
            isFavorite={isFavorite(selectedPhoto)}
            onClose={() => setSelectedPhoto(null)}
            onFavorite={() => toggleFavorite(selectedPhoto)}
            onDownload={(size) => handleDownload(selectedPhoto, size)}
            onInsert={() => handleInsert(selectedPhoto)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockPhotosPanel;
