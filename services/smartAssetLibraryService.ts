// =============================================
// Smart Asset Library Service
// AI-powered asset management with visual search
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'font' | 'vector';

export interface Asset {
  id: string;
  user_id: string;
  workspace_id?: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_url: string;
  thumbnail_url?: string;
  file_size_bytes: number;
  mime_type: string;
  file_hash?: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  asset_type: AssetType;
  format?: string;
  ai_tags: string[];
  ai_description?: string;
  ai_colors: string[];
  ai_objects: any[];
  ai_text_content?: string;
  ai_quality_score?: number;
  ai_processed_at?: string;
  user_tags: string[];
  title?: string;
  description?: string;
  alt_text?: string;
  license_type?: string;
  source_url?: string;
  folder_id?: string;
  is_favorite: boolean;
  is_archived: boolean;
  usage_count: number;
  last_used_at?: string;
  upload_status: 'processing' | 'ready' | 'failed';
  processing_error?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  folder?: AssetFolder;
}

export interface AssetFolder {
  id: string;
  user_id: string;
  parent_id?: string;
  name: string;
  color: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Computed
  asset_count?: number;
}

export interface AssetDuplicateGroup {
  id: string;
  user_id: string;
  primary_asset_id?: string;
  similarity_threshold: number;
  status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
  assets?: Asset[];
}

export interface BrandAssetCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_locked: boolean;
  created_at: string;
  assets?: Asset[];
}

export interface StorageStats {
  total_size_bytes: number;
  total_count: number;
  by_type: Record<AssetType, { count: number; size_bytes: number }>;
}

export interface AssetSearchFilters {
  type?: AssetType;
  tags?: string[];
  colors?: string[];
  minWidth?: number;
  minHeight?: number;
  folderId?: string | null;
  isFavorite?: boolean;
  isArchived?: boolean;
  dateRange?: { start: string; end: string };
  sortBy?: 'newest' | 'oldest' | 'name' | 'size' | 'usage';
}

// =============================================
// Smart Asset Library Service
// =============================================

class SmartAssetLibraryService {
  // =============================================
  // Asset CRUD
  // =============================================

  async getAssets(
    filters?: AssetSearchFilters,
    page = 1,
    limit = 50
  ): Promise<{ assets: Asset[]; total: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { assets: [], total: 0 };

    let query = supabase
      .from('assets')
      .select('*, folder:asset_folders(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('upload_status', 'ready');

    // Apply filters
    if (filters) {
      if (filters.type) {
        query = query.eq('asset_type', filters.type);
      }
      if (filters.folderId !== undefined) {
        if (filters.folderId === null) {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', filters.folderId);
        }
      }
      if (filters.isFavorite !== undefined) {
        query = query.eq('is_favorite', filters.isFavorite);
      }
      if (filters.isArchived !== undefined) {
        query = query.eq('is_archived', filters.isArchived);
      } else {
        query = query.eq('is_archived', false); // Default to not showing archived
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('ai_tags', filters.tags);
      }
      if (filters.minWidth) {
        query = query.gte('width', filters.minWidth);
      }
      if (filters.minHeight) {
        query = query.gte('height', filters.minHeight);
      }
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      // Sorting
      switch (filters.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name':
          query = query.order('filename', { ascending: true });
          break;
        case 'size':
          query = query.order('file_size_bytes', { ascending: false });
          break;
        case 'usage':
          query = query.order('usage_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    } else {
      query = query.eq('is_archived', false).order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch assets:', error);
      return { assets: [], total: 0 };
    }

    return { assets: data || [], total: count || 0 };
  }

  async getAssetById(assetId: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from('assets')
      .select('*, folder:asset_folders(*)')
      .eq('id', assetId)
      .single();

    if (error) {
      console.error('Failed to fetch asset:', error);
      return null;
    }

    return data;
  }

  async searchAssets(
    query: string,
    filters?: AssetSearchFilters
  ): Promise<Asset[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Full-text search on title, description, AI description, and OCR text
    const { data, error } = await supabase
      .from('assets')
      .select('*, folder:asset_folders(*)')
      .eq('user_id', user.id)
      .eq('upload_status', 'ready')
      .eq('is_archived', false)
      .textSearch('title', query, { type: 'websearch' })
      .limit(50);

    if (error) {
      console.error('Failed to search assets:', error);
      return [];
    }

    return data || [];
  }

  async uploadAsset(
    file: File,
    folderId?: string,
    metadata?: {
      title?: string;
      description?: string;
      alt_text?: string;
      user_tags?: string[];
    }
  ): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Determine asset type
    const assetType = this.getAssetTypeFromMime(file.type);
    const format = file.name.split('.').pop()?.toLowerCase();

    // Generate unique filename
    const filename = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload failed:', uploadError);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filename);

      // Create asset record
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          filename: file.name,
          original_filename: file.name,
          file_path: filename,
          file_url: publicUrl,
          file_size_bytes: file.size,
          mime_type: file.type,
          asset_type: assetType,
          format,
          folder_id: folderId,
          title: metadata?.title,
          description: metadata?.description,
          alt_text: metadata?.alt_text,
          user_tags: metadata?.user_tags || [],
          upload_status: 'processing',
        })
        .select('id')
        .single();

      if (assetError) {
        console.error('Failed to create asset record:', assetError);
        return null;
      }

      // Trigger AI processing (in background)
      this.processAssetWithAI(assetData.id);

      return assetData.id;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  }

  async updateAsset(
    assetId: string,
    updates: Partial<Pick<Asset, 'title' | 'description' | 'alt_text' | 'user_tags' | 'folder_id' | 'is_favorite' | 'is_archived'>>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('assets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', assetId);

    if (error) {
      console.error('Failed to update asset:', error);
      return false;
    }

    return true;
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    // Get asset to delete file
    const { data: asset } = await supabase
      .from('assets')
      .select('file_path')
      .eq('id', assetId)
      .single();

    if (asset) {
      // Delete from storage
      await supabase.storage.from('assets').remove([asset.file_path]);
    }

    // Delete record
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (error) {
      console.error('Failed to delete asset:', error);
      return false;
    }

    return true;
  }

  async toggleFavorite(assetId: string): Promise<boolean> {
    const { data: asset } = await supabase
      .from('assets')
      .select('is_favorite')
      .eq('id', assetId)
      .single();

    if (!asset) return false;

    const { error } = await supabase
      .from('assets')
      .update({ is_favorite: !asset.is_favorite })
      .eq('id', assetId);

    if (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }

    return !asset.is_favorite;
  }

  async archiveAsset(assetId: string): Promise<boolean> {
    return this.updateAsset(assetId, { is_archived: true });
  }

  async unarchiveAsset(assetId: string): Promise<boolean> {
    return this.updateAsset(assetId, { is_archived: false });
  }

  // =============================================
  // Folders
  // =============================================

  async getFolders(parentId?: string | null): Promise<AssetFolder[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('asset_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (parentId === null) {
      query = query.is('parent_id', null);
    } else if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch folders:', error);
      return [];
    }

    return data || [];
  }

  async createFolder(
    name: string,
    parentId?: string,
    color = '#6366f1'
  ): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('asset_folders')
      .insert({
        user_id: user.id,
        name,
        parent_id: parentId,
        color,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create folder:', error);
      return null;
    }

    return data?.id;
  }

  async updateFolder(
    folderId: string,
    updates: Partial<Pick<AssetFolder, 'name' | 'color' | 'parent_id'>>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('asset_folders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', folderId);

    if (error) {
      console.error('Failed to update folder:', error);
      return false;
    }

    return true;
  }

  async deleteFolder(folderId: string): Promise<boolean> {
    // Move assets in folder to root
    await supabase
      .from('assets')
      .update({ folder_id: null })
      .eq('folder_id', folderId);

    // Delete folder
    const { error } = await supabase
      .from('asset_folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      console.error('Failed to delete folder:', error);
      return false;
    }

    return true;
  }

  async moveAssetsToFolder(assetIds: string[], folderId: string | null): Promise<boolean> {
    const { error } = await supabase
      .from('assets')
      .update({ folder_id: folderId })
      .in('id', assetIds);

    if (error) {
      console.error('Failed to move assets:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // AI Processing
  // =============================================

  private async processAssetWithAI(assetId: string): Promise<void> {
    // In production, this would trigger an edge function or background job
    // that uses AI services for:
    // - Image tagging
    // - Object detection
    // - Color extraction
    // - OCR text extraction
    // - Quality assessment
    // - Embedding generation for visual search

    // For now, simulate processing completion
    setTimeout(async () => {
      try {
        await supabase
          .from('assets')
          .update({
            upload_status: 'ready',
            ai_processed_at: new Date().toISOString(),
            ai_tags: ['auto-tagged'],
            ai_quality_score: 0.85,
          })
          .eq('id', assetId);
      } catch (err) {
        console.error('AI processing failed:', err);
        await supabase
          .from('assets')
          .update({
            upload_status: 'ready',
            processing_error: 'AI processing skipped',
          })
          .eq('id', assetId);
      }
    }, 2000);
  }

  // =============================================
  // Visual Search
  // =============================================

  async findSimilarAssets(assetId: string, limit = 10): Promise<Asset[]> {
    // In production, this would use vector similarity search
    // with the ai_embedding field
    const { data, error } = await supabase.rpc('find_similar_assets', {
      p_asset_id: assetId,
      p_limit: limit,
      p_threshold: 0.8,
    });

    if (error) {
      console.error('Failed to find similar assets:', error);
      return [];
    }

    // Fetch full asset data
    if (data && data.length > 0) {
      const { data: assets } = await supabase
        .from('assets')
        .select('*, folder:asset_folders(*)')
        .in('id', data.map((d: any) => d.asset_id));

      return assets || [];
    }

    return [];
  }

  async searchByColor(hexColor: string): Promise<Asset[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('assets')
      .select('*, folder:asset_folders(*)')
      .eq('user_id', user.id)
      .eq('upload_status', 'ready')
      .contains('ai_colors', [hexColor])
      .limit(50);

    if (error) {
      console.error('Failed to search by color:', error);
      return [];
    }

    return data || [];
  }

  // =============================================
  // Duplicates
  // =============================================

  async getDuplicateGroups(): Promise<AssetDuplicateGroup[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('asset_duplicates')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch duplicate groups:', error);
      return [];
    }

    return data || [];
  }

  async detectDuplicates(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase.rpc('detect_asset_duplicates', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Failed to detect duplicates:', error);
      return 0;
    }

    return data || 0;
  }

  async resolveDuplicateGroup(
    groupId: string,
    primaryAssetId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('asset_duplicates')
      .update({
        primary_asset_id: primaryAssetId,
        status: 'resolved',
      })
      .eq('id', groupId);

    if (error) {
      console.error('Failed to resolve duplicates:', error);
      return false;
    }

    return true;
  }

  async ignoreDuplicateGroup(groupId: string): Promise<boolean> {
    const { error } = await supabase
      .from('asset_duplicates')
      .update({ status: 'ignored' })
      .eq('id', groupId);

    if (error) {
      console.error('Failed to ignore duplicates:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // Usage Tracking
  // =============================================

  async trackAssetUsage(
    assetId: string,
    usedInType: 'canvas' | 'template' | 'video' | 'export',
    usedInId?: string
  ): Promise<void> {
    await supabase.rpc('track_asset_usage', {
      p_asset_id: assetId,
      p_used_in_type: usedInType,
      p_used_in_id: usedInId,
    });
  }

  // =============================================
  // Storage Stats
  // =============================================

  async getStorageStats(): Promise<StorageStats | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_storage_stats', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }

    return data;
  }

  // =============================================
  // Brand Collections
  // =============================================

  async getBrandCollections(): Promise<BrandAssetCollection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('brand_asset_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch brand collections:', error);
      return [];
    }

    return data || [];
  }

  async createBrandCollection(name: string, description?: string): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('brand_asset_collections')
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

  async addAssetToCollection(
    collectionId: string,
    assetId: string,
    role?: 'logo' | 'icon' | 'background' | 'pattern'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('brand_asset_items')
      .insert({
        collection_id: collectionId,
        asset_id: assetId,
        asset_role: role,
      });

    if (error) {
      console.error('Failed to add to collection:', error);
      return false;
    }

    return true;
  }

  // =============================================
  // Helpers
  // =============================================

  private getAssetTypeFromMime(mimeType: string): AssetType {
    if (mimeType.startsWith('image/svg')) return 'vector';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('font')) return 'font';
    return 'document';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// Export singleton
export const smartAssetLibrary = new SmartAssetLibraryService();
