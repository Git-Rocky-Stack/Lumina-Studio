// =============================================
// Template Detail Modal Component
// Full template view with purchase/use options
// =============================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Star,
  Download,
  Eye,
  User,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Check,
  ShoppingCart,
  Share2,
  Flag,
  Loader2,
  Lock,
  MessageSquare,
} from 'lucide-react';
import {
  MarketplaceTemplate,
  TemplateReview,
  templateMarketplace,
} from '../../services/templateMarketplaceService';

// =============================================
// Types
// =============================================

interface TemplateDetailModalProps {
  template: MarketplaceTemplate;
  isPurchased: boolean;
  isFavorited: boolean;
  onClose: () => void;
  onUse: (template: MarketplaceTemplate) => void;
  onPurchase: () => Promise<void>;
  onFavoriteToggle: (isFavorited: boolean) => void;
}

// =============================================
// Template Detail Modal Component
// =============================================

export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  isPurchased,
  isFavorited,
  onClose,
  onUse,
  onPurchase,
  onFavoriteToggle,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(isFavorited);

  const isFree = template.price_cents === 0;
  const canUse = isFree || isPurchased;

  const allImages = [
    template.thumbnail_url,
    ...template.preview_images,
  ].filter(Boolean) as string[];

  // =============================================
  // Load Reviews
  // =============================================

  useEffect(() => {
    loadReviews();
  }, [template.id]);

  const loadReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const data = await templateMarketplace.getTemplateReviews(template.id);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // =============================================
  // Handlers
  // =============================================

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await onPurchase();
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleFavorite = async () => {
    const newState = await templateMarketplace.toggleFavorite(template.id);
    setLocalFavorited(newState);
    onFavoriteToggle(newState);
  };

  const nextImage = () => {
    setCurrentImageIndex((i) => (i + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((i) => (i - 1 + allImages.length) % allImages.length);
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // =============================================
  // Render
  // =============================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-zinc-900 rounded-2xl
          border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {template.category && (
              <span className="px-2 py-1 text-xs rounded-lg bg-violet-500/20 text-violet-400">
                {template.category.name}
              </span>
            )}
            <h2 className="text-xl font-semibold text-zinc-100">{template.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                localFavorited
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${localFavorited ? 'fill-rose-400' : ''}`} />
            </button>
            <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row">
            {/* Image Gallery */}
            <div className="lg:w-3/5 p-6">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800">
                {allImages.length > 0 ? (
                  <>
                    <img
                      src={allImages[currentImageIndex]}
                      alt={template.name}
                      className="w-full h-full object-contain"
                    />
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full
                            bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full
                            bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                          {allImages.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentImageIndex(i)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                i === currentImageIndex ? 'bg-white' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye className="w-12 h-12 text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2
                        transition-colors ${
                          i === currentImageIndex
                            ? 'border-violet-500'
                            : 'border-transparent hover:border-zinc-700'
                        }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="lg:w-2/5 p-6 lg:border-l border-zinc-800 space-y-6">
              {/* Price & Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-3xl font-bold ${isFree ? 'text-emerald-400' : 'text-zinc-100'}`}>
                      {formatPrice(template.price_cents)}
                    </span>
                    {template.is_premium && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
                        Premium
                      </span>
                    )}
                  </div>
                  {isPurchased && (
                    <span className="flex items-center gap-1 px-2 py-1 text-sm rounded-lg
                      bg-emerald-500/20 text-emerald-400">
                      <Check className="w-4 h-4" />
                      Owned
                    </span>
                  )}
                </div>

                {canUse ? (
                  <button
                    onClick={() => onUse(template)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3
                      rounded-xl bg-violet-500 text-white font-medium
                      hover:bg-violet-600 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    Use This Template
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3
                      rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600
                      text-white font-medium hover:opacity-90 disabled:opacity-50
                      transition-opacity"
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Purchase Now
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-zinc-800/50">
                  <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-semibold">{template.rating_average.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{template.rating_count} reviews</span>
                </div>
                <div className="text-center p-3 rounded-xl bg-zinc-800/50">
                  <div className="font-semibold text-zinc-200 mb-1">
                    {template.download_count.toLocaleString()}
                  </div>
                  <span className="text-xs text-zinc-500">Downloads</span>
                </div>
                <div className="text-center p-3 rounded-xl bg-zinc-800/50">
                  <div className="font-semibold text-zinc-200 mb-1">
                    {template.favorite_count.toLocaleString()}
                  </div>
                  <span className="text-xs text-zinc-500">Favorites</span>
                </div>
              </div>

              {/* Description */}
              {template.description && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">{template.description}</p>
                </div>
              )}

              {/* Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400">Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Eye className="w-4 h-4" />
                    <span>{template.width} x {template.height}px</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Tag className="w-4 h-4" />
                    <span className="capitalize">{template.format_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(template.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <User className="w-4 h-4" />
                    <span>Creator</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-zinc-400" />
                Reviews ({reviews.length})
              </h3>
              {isPurchased && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400
                    hover:bg-violet-500/30 text-sm transition-colors"
                >
                  Write a Review
                </button>
              )}
            </div>

            {isLoadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-200">
                              {review.user?.full_name || 'Anonymous'}
                            </span>
                            {review.is_verified_purchase && (
                              <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-400">
                                Verified
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-500">{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-zinc-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-medium text-zinc-200 mb-1">{review.title}</h4>
                    )}
                    {review.content && (
                      <p className="text-sm text-zinc-400">{review.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetailModal;
