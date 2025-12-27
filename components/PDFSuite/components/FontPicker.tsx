// ============================================
// FontPicker - Google Fonts Browser
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFontLoader, GoogleFont, FontPairing } from '../hooks/useFontLoader';

interface FontPickerProps {
  selectedFont: string;
  onSelectFont: (fontFamily: string) => void;
  showPairings?: boolean;
  className?: string;
}

export const FontPicker: React.FC<FontPickerProps> = ({
  selectedFont,
  onSelectFont,
  showPairings = true,
  className = ''
}) => {
  const {
    fonts,
    loadedFonts,
    recentFonts,
    isLoading,
    searchQuery,
    selectedCategory,
    loadFont,
    searchFonts,
    setSearchQuery,
    filterByCategory,
    getFontVariants,
    getFontPairings,
    getPopularFonts,
    isFontLoaded,
    categories,
    popularPairings
  } = useFontLoader();

  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'pairings'>('all');
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [hoveredFont, setHoveredFont] = useState<string | null>(null);

  // Filtered fonts
  const filteredFonts = useMemo(() => {
    return searchFonts(searchQuery);
  }, [searchFonts, searchQuery]);

  // Popular fonts
  const popularFonts = useMemo(() => getPopularFonts(20), [getPopularFonts]);

  // Font pairings based on selected font
  const pairings = useMemo(() => getFontPairings(selectedFont), [getFontPairings, selectedFont]);

  // Handle font selection
  const handleSelectFont = useCallback(async (fontFamily: string) => {
    await loadFont(fontFamily);
    onSelectFont(fontFamily);
  }, [loadFont, onSelectFont]);

  // Preload hovered font for preview
  useEffect(() => {
    if (hoveredFont && !isFontLoaded(hoveredFont)) {
      loadFont(hoveredFont);
    }
  }, [hoveredFont, isFontLoaded, loadFont]);

  // Font preview component
  const FontPreview: React.FC<{ font: GoogleFont; isSelected: boolean }> = ({ font, isSelected }) => (
    <button
      onClick={() => handleSelectFont(font.family)}
      onMouseEnter={() => setHoveredFont(font.family)}
      onMouseLeave={() => setHoveredFont(null)}
      className={`w-full p-3 rounded-lg text-left transition-all ${
        isSelected
          ? 'bg-purple-500/20 border-2 border-purple-500'
          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-white">{font.family}</span>
        <span className="text-xs text-white/40 capitalize">{font.category}</span>
      </div>
      <p
        className="text-lg text-white/70 truncate"
        style={{ fontFamily: isFontLoaded(font.family) ? font.family : 'inherit' }}
      >
        {previewText}
      </p>
      <div className="flex gap-1 mt-1">
        {font.variants.slice(0, 5).map(v => (
          <span key={v} className="text-[10px] px-1 py-0.5 bg-white/5 rounded text-white/40">
            {v}
          </span>
        ))}
        {font.variants.length > 5 && (
          <span className="text-[10px] px-1 py-0.5 bg-white/5 rounded text-white/40">
            +{font.variants.length - 5}
          </span>
        )}
      </div>
    </button>
  );

  // Pairing preview component
  const PairingPreview: React.FC<{ pairing: FontPairing }> = ({ pairing }) => (
    <button
      onClick={() => handleSelectFont(pairing.heading)}
      className="w-full p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
    >
      <h4
        className="text-xl text-white mb-1"
        style={{ fontFamily: isFontLoaded(pairing.heading) ? pairing.heading : 'inherit' }}
      >
        {pairing.heading}
      </h4>
      <p
        className="text-sm text-white/60 mb-2"
        style={{ fontFamily: isFontLoaded(pairing.body) ? pairing.body : 'inherit' }}
      >
        Paired with {pairing.body}
      </p>
      <p className="text-xs text-white/40">{pairing.description}</p>
      <div className="flex gap-1 mt-2">
        {pairing.tags.map(tag => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 rounded text-purple-300">
            {tag}
          </span>
        ))}
      </div>
    </button>
  );

  return (
    <div className={`bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Search & Filters */}
      <div className="p-3 border-b border-white/10">
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fonts..."
            className="w-full pl-9 pr-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => filterByCategory(null)}
            className={`px-2 py-1 rounded text-xs ${
              !selectedCategory
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => filterByCategory(cat)}
              className={`px-2 py-1 rounded text-xs capitalize ${
                selectedCategory === cat
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {cat.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-sm ${
            activeTab === 'all'
              ? 'text-purple-300 border-b-2 border-purple-500'
              : 'text-white/50 hover:text-white'
          }`}
        >
          All Fonts
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-2 text-sm ${
            activeTab === 'recent'
              ? 'text-purple-300 border-b-2 border-purple-500'
              : 'text-white/50 hover:text-white'
          }`}
        >
          Recent
        </button>
        {showPairings && (
          <button
            onClick={() => setActiveTab('pairings')}
            className={`flex-1 py-2 text-sm ${
              activeTab === 'pairings'
                ? 'text-purple-300 border-b-2 border-purple-500'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Pairings
          </button>
        )}
      </div>

      {/* Preview Text */}
      <div className="p-3 border-b border-white/10">
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Type to preview..."
          className="w-full px-3 py-1.5 bg-white/5 rounded text-white/80 text-sm border border-white/10 focus:border-white/30 focus:outline-none"
        />
      </div>

      {/* Font List */}
      <div className="h-80 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && activeTab === 'all' && (
          <>
            {filteredFonts.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                No fonts found matching "{searchQuery}"
              </div>
            ) : (
              filteredFonts.slice(0, 50).map(font => (
                <FontPreview
                  key={font.family}
                  font={font}
                  isSelected={font.family === selectedFont}
                />
              ))
            )}
            {filteredFonts.length > 50 && (
              <div className="text-center py-4 text-white/40 text-sm">
                Showing 50 of {filteredFonts.length} fonts. Search to find more.
              </div>
            )}
          </>
        )}

        {!isLoading && activeTab === 'recent' && (
          <>
            {recentFonts.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                No recently used fonts
              </div>
            ) : (
              recentFonts.map(family => {
                const font = fonts.find(f => f.family === family);
                return font ? (
                  <FontPreview
                    key={font.family}
                    font={font}
                    isSelected={font.family === selectedFont}
                  />
                ) : null;
              })
            )}

            {/* Popular fonts suggestion */}
            {recentFonts.length < 5 && (
              <>
                <div className="text-xs text-white/40 pt-4 pb-2">Popular fonts</div>
                {popularFonts.slice(0, 5).map(font => (
                  <FontPreview
                    key={font.family}
                    font={font}
                    isSelected={font.family === selectedFont}
                  />
                ))}
              </>
            )}
          </>
        )}

        {!isLoading && activeTab === 'pairings' && (
          <div className="space-y-3">
            {selectedFont && (
              <div className="text-xs text-white/50 mb-2">
                Suggested pairings for {selectedFont}
              </div>
            )}
            {pairings.map((pairing, index) => (
              <PairingPreview key={index} pairing={pairing} />
            ))}
          </div>
        )}
      </div>

      {/* Selected Font Info */}
      {selectedFont && (
        <div className="p-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white">Selected: </span>
              <span
                className="text-sm text-purple-300"
                style={{ fontFamily: isFontLoaded(selectedFont) ? selectedFont : 'inherit' }}
              >
                {selectedFont}
              </span>
            </div>
            <div className="flex gap-1">
              {getFontVariants(selectedFont).slice(0, 4).map(v => (
                <span key={v.label} className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 rounded text-purple-300">
                  {v.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FontPicker;
