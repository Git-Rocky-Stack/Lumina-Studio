// =============================================
// Template Marketplace Service
// Browse, purchase, and manage templates
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

export interface MarketplaceTemplate {
  id: string;
  creator_id: string;
  category_id?: string;
  name: string;
  slug: string;
  description?: string;
  tags: string[];
  template_data: any;
  thumbnail_url?: string;
  preview_images: string[];
  width: number;
  height: number;
  format_type: string;
  price_cents: number;
  currency: string;
  is_premium: boolean;
  download_count: number;
  view_count: number;
  favorite_count: number;
  rating_average: number;
  rating_count: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  rejection_reason?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  // Joined data
  creator?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  category?: TemplateCategory;
}

export interface TemplateReview {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface TemplatePurchase {
  id: string;
  user_id: string;
  template_id: string;
  price_paid_cents: number;
  currency: string;
  payment_provider: string;
  payment_id?: string;
  purchased_at: string;
}

export interface TemplateCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  templates?: MarketplaceTemplate[];
}

export interface SearchFilters {
  category?: string;
  priceRange?: { min: number; max: number };
  formatType?: string;
  tags?: string[];
  isPremium?: boolean;
  isFree?: boolean;
  minRating?: number;
  sortBy?: 'newest' | 'popular' | 'rating' | 'downloads';
}

// =============================================
// Template Marketplace Service
// =============================================

class TemplateMarketplaceService {
  // =============================================
  // Categories
  // =============================================

  async getCategories(): Promise<TemplateCategory[]> {
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }

    return data || [];
  }

  async getFeaturedCategories(): Promise<TemplateCategory[]> {
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .eq('is_featured', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch featured categories:', error);
      return [];
    }

    return data || [];
  }

  // =============================================
  // Templates - Browse
  // =============================================

  async searchTemplates(
    query?: string,
    filters?: SearchFilters,
    page = 1,
    limit = 20
  ): Promise<{ templates: MarketplaceTemplate[]; total: number }> {
    let queryBuilder = supabase
      .from('marketplace_templates')
      .select('*, category:template_categories(*)', { count: 'exact' })
      .eq('status', 'approved');

    // Text search
    if (query) {
      queryBuilder = queryBuilder.textSearch('name', query, { type: 'websearch' });
    }

    // Filters
    if (filters) {
      if (filters.category) {
        queryBuilder = queryBuilder.eq('category_id', filters.category);
      }
      if (filters.formatType) {
        queryBuilder = queryBuilder.eq('format_type', filters.formatType);
      }
      if (filters.isPremium !== undefined) {
        queryBuilder = queryBuilder.eq('is_premium', filters.isPremium);
      }
      if (filters.isFree) {
        queryBuilder = queryBuilder.eq('price_cents', 0);
      }
      if (filters.priceRange) {
        queryBuilder = queryBuilder
          .gte('price_cents', filters.priceRange.min)
          .lte('price_cents', filters.priceRange.max);
      }
      if (filters.minRating) {
        queryBuilder = queryBuilder.gte('rating_average', filters.minRating);
      }
      if (filters.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', filters.tags);
      }

      // Sorting
      switch (filters.sortBy) {
        case 'newest':
          queryBuilder = queryBuilder.order('published_at', { ascending: false });
          break;
        case 'popular':
          queryBuilder = queryBuilder.order('download_count', { ascending: false });
          break;
        case 'rating':
          queryBuilder = queryBuilder.order('rating_average', { ascending: false });
          break;
        case 'downloads':
          queryBuilder = queryBuilder.order('download_count', { ascending: false });
          break;
        default:
          queryBuilder = queryBuilder.order('published_at', { ascending: false });
      }
    } else {
      queryBuilder = queryBuilder.order('published_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Failed to search templates:', error);
      return { templates: [], total: 0 };
    }

    return { templates: data || [], total: count || 0 };
  }

  async getTemplateById(id: string): Promise<MarketplaceTemplate | null> {
    const { data, error } = await supabase
      .from('marketplace_templates')
      .select('*, category:template_categories(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch template:', error);
      return null;
    }

    // Increment view count
    await supabase.rpc('increment', { row_id: id, table_name: 'marketplace_templates', column_name: 'view_count' });

    return data;
  }

  async getFeaturedTemplates(limit = 8): Promise<MarketplaceTemplate[]> {
    const { data, error } = await supabase
      .from('marketplace_templates')
      .select('*, category:template_categories(*)')
      .eq('status', 'approved')
      .order('download_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch featured templates:', error);
      return [];
    }

    return data || [];
  }

  async getTemplatesByCategory(categorySlug: string, limit = 20): Promise<MarketplaceTemplate[]> {
    const { data: category } = await supabase
      .from('template_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (!category) return [];

    const { data, error } = await supabase
      .from('marketplace_templates')
      .select('*, category:template_categories(*)')
      .eq('category_id', category.id)
      .eq('status', 'approved')
      .order('download_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch templates by category:', error);
      return [];
    }

    return data || [];
  }

  // =============================================
  // Templates - Creator
  // =============================================

  async getMyTemplates(): Promise<MarketplaceTemplate[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('marketplace_templates')
      .select('*, category:template_categories(*)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch my templates:', error);
      return [];
    }

    return data || [];
  }

  async createTemplate(template: Partial<MarketplaceTemplate>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Generate slug from name
    const slug = template.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const { data, error } = await supabase
      .from('marketplace_templates')
      .insert({
        ...template,
        creator_id: user.id,
        slug,
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create template:', error);
      return null;
    }

    return data?.id;
  }

  async updateTemplate(id: string, updates: Partial<MarketplaceTemplate>): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to update template:', error);
      return false;
    }

    return true;
  }

  async submitForReview(templateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_templates')
      .update({ status: 'pending' })
      .eq('id', templateId);

    if (error) {
      console.error('Failed to submit template:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // Purchases
  // =============================================

  async purchaseTemplate(
    templateId: string,
    paymentProvider: string,
    paymentId?: string
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get template price
    const { data: template } = await supabase
      .from('marketplace_templates')
      .select('price_cents, currency')
      .eq('id', templateId)
      .single();

    if (!template) return false;

    const { error } = await supabase
      .from('template_purchases')
      .insert({
        user_id: user.id,
        template_id: templateId,
        price_paid_cents: template.price_cents,
        currency: template.currency,
        payment_provider: paymentProvider,
        payment_id: paymentId,
      });

    if (error) {
      console.error('Failed to record purchase:', error);
      return false;
    }

    // Increment download count
    await supabase.rpc('increment_template_download', { p_template_id: templateId });

    return true;
  }

  async getMyPurchases(): Promise<(TemplatePurchase & { template: MarketplaceTemplate })[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('template_purchases')
      .select('*, template:marketplace_templates(*)')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch purchases:', error);
      return [];
    }

    return data || [];
  }

  async hasUserPurchased(templateId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('template_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', templateId)
      .single();

    return !!data;
  }

  // =============================================
  // Favorites
  // =============================================

  async toggleFavorite(templateId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if already favorited
    const { data: existing } = await supabase
      .from('template_favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('template_id', templateId)
      .single();

    if (existing) {
      // Remove favorite
      await supabase
        .from('template_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('template_id', templateId);
      return false;
    } else {
      // Add favorite
      await supabase
        .from('template_favorites')
        .insert({ user_id: user.id, template_id: templateId });
      return true;
    }
  }

  async getMyFavorites(): Promise<MarketplaceTemplate[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('template_favorites')
      .select('template:marketplace_templates(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch favorites:', error);
      return [];
    }

    return (data || []).map((d: any) => d.template).filter(Boolean);
  }

  async isTemplateFavorited(templateId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('template_favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('template_id', templateId)
      .single();

    return !!data;
  }

  // =============================================
  // Reviews
  // =============================================

  async getTemplateReviews(templateId: string): Promise<TemplateReview[]> {
    const { data, error } = await supabase
      .from('template_reviews')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch reviews:', error);
      return [];
    }

    return data || [];
  }

  async submitReview(
    templateId: string,
    rating: number,
    title?: string,
    content?: string
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user has purchased
    const hasPurchased = await this.hasUserPurchased(templateId);

    const { error } = await supabase
      .from('template_reviews')
      .upsert({
        template_id: templateId,
        user_id: user.id,
        rating,
        title,
        content,
        is_verified_purchase: hasPurchased,
      });

    if (error) {
      console.error('Failed to submit review:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // Collections
  // =============================================

  async getMyCollections(): Promise<TemplateCollection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('template_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch collections:', error);
      return [];
    }

    return data || [];
  }

  async createCollection(name: string, description?: string): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('template_collections')
      .insert({
        user_id: user.id,
        name,
        description,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create collection:', error);
      return null;
    }

    return data?.id;
  }

  async addToCollection(collectionId: string, templateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('template_collection_items')
      .insert({ collection_id: collectionId, template_id: templateId });

    if (error) {
      console.error('Failed to add to collection:', error);
      return false;
    }

    return true;
  }

  async removeFromCollection(collectionId: string, templateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('template_collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('template_id', templateId);

    if (error) {
      console.error('Failed to remove from collection:', error);
      return false;
    }

    return true;
  }
}

// Export singleton
export const templateMarketplace = new TemplateMarketplaceService();
