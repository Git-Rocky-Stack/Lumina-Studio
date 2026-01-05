// =============================================
// Template Card Component
// Display template in marketplace grid
// =============================================

import React, { useState } from 'react';
import {
  Heart,
  Star,
  Download,
  Eye,
  Lock,
  Check,
  ShoppingCart,
} from 'lucide-react';
import { MarketplaceTemplate, templateMarketplace } from '../../services/templateMarketplaceService';

// =============================================
// Types
// =============================================

interface TemplateCardProps {
  template: MarketplaceTemplate;
  isPurchased?: boolean;
  isFavorited?: boolean;
  onSelect?: (template: MarketplaceTemplate) => void;
  onUse?: (template: MarketplaceTemplate) => void;
  onFavoriteToggle?: (isFavorited: boolean) => void;
}

// =============================================
// Template Card Component
// =============================================

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isPurchased = false,
  isFavorited = false,
  onSelect,
  onUse,
  onFavoriteToggle,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(isFavorited);

  const isFree = template.price_cents === 0;
  const canUse = isFree || isPurchased;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = await templateMarketplace.toggleFavorite(template.id);
    setLocalFavorited(newState);
    onFavoriteToggle?.(newState);
  };

  const handleUseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canUse) {
      onUse?.(template);
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div
      className="group relative bg-zinc-900/50 rounded-xl border border-zinc-800
        hover:border-zinc-700 overflow-hidden cursor-pointer
        transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(template)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="w-full h-full object-cover transition-transform duration-500
              group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-zinc-600">
              <Eye className="w-8 h-8" />
            </div>
          </div>
        )}

        {/* Overlay on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
            flex items-end justify-between p-3 transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <button
            onClick={handleUseClick}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors
              ${canUse
                ? 'bg-violet-500 text-white hover:bg-violet-600'
                : 'bg-white/10 text-white hover:bg-white/20'
              }
            `}
          >
            {canUse ? (
              <>
                <Check className="w-4 h-4" />
                Use
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {formatPrice(template.price_cents)}
              </>
            )}
          </button>
          <button
            onClick={handleFavoriteClick}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${localFavorited ? 'text-rose-400 fill-rose-400' : 'text-white'}`}
            />
          </button>
        </div>

        {/* Premium Badge */}
        {template.is_premium && !isPurchased && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full
              bg-amber-500/90 text-amber-950 text-xs font-medium">
              <Lock className="w-3 h-3" />
              Premium
            </div>
          </div>
        )}

        {/* Purchased Badge */}
        {isPurchased && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full
              bg-emerald-500/90 text-white text-xs font-medium">
              <Check className="w-3 h-3" />
              Owned
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* Category */}
        {template.category && (
          <span className="text-xs text-violet-400 font-medium">
            {template.category.name}
          </span>
        )}

        {/* Name */}
        <h3 className="font-medium text-zinc-200 line-clamp-1 group-hover:text-white
          transition-colors">
          {template.name}
        </h3>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {/* Rating */}
            {template.rating_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-zinc-400">{template.rating_average.toFixed(1)}</span>
              </div>
            )}
            {/* Downloads */}
            <div className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>{formatDownloadCount(template.download_count)}</span>
            </div>
          </div>

          {/* Price */}
          <span className={`text-sm font-medium ${isFree ? 'text-emerald-400' : 'text-zinc-300'}`}>
            {formatPrice(template.price_cents)}
          </span>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-xs rounded bg-zinc-800 text-zinc-500"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-zinc-600">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================
// Helpers
// =============================================

function formatDownloadCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default TemplateCard;
