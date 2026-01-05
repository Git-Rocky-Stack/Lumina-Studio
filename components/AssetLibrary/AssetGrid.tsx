// =============================================
// Asset Grid Component
// Display and manage assets in a grid layout
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  Upload,
  Folder,
  FolderPlus,
  Image,
  Video,
  FileText,
  Music,
  Type,
  MoreVertical,
  Heart,
  Download,
  Trash2,
  Edit,
  Copy,
  Move,
  Archive,
  X,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  Eye,
} from 'lucide-react';
import {
  smartAssetLibrary,
  Asset,
  AssetFolder,
  AssetType,
  AssetSearchFilters,
} from '../../services/smartAssetLibraryService';

// =============================================
// Types
// =============================================

interface AssetGridProps {
  onAssetSelect?: (asset: Asset) => void;
  onAssetUse?: (asset: Asset) => void;
  multiSelect?: boolean;
  className?: string;
}

const assetTypeIcons: Record<AssetType, typeof Image> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  font: Type,
  vector: Star,
};

const assetTypeColors: Record<AssetType, string> = {
  image: '#10b981',
  video: '#f59e0b',
  audio: '#8b5cf6',
  document: '#3b82f6',
  font: '#ec4899',
  vector: '#06b6d4',
};

// =============================================
// Asset Grid Component
// =============================================

export const AssetGrid: React.FC<AssetGridProps> = ({
  onAssetSelect,
  onAssetUse,
  multiSelect = false,
  className = '',
}) => {
  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<AssetFolder[]>([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AssetSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ assetId: string; x: number; y: number } | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  const ITEMS_PER_PAGE = 50;

  // =============================================
  // Data Loading
  // =============================================

  useEffect(() => {
    loadData();
  }, [currentFolder, filters, page]);

  useEffect(() => {
    if (searchQuery) {
      searchAssets();
    } else {
      loadData();
    }
  }, [searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [foldersData, assetsData] = await Promise.all([
        smartAssetLibrary.getFolders(currentFolder),
        smartAssetLibrary.getAssets(
          { ...filters, folderId: currentFolder },
          page,
          ITEMS_PER_PAGE
        ),
      ]);
      setFolders(foldersData);
      setAssets(assetsData.assets);
      setTotalAssets(assetsData.total);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await smartAssetLibrary.searchAssets(searchQuery, filters);
      setAssets(results);
      setTotalAssets(results.length);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters]);

  // =============================================
  // Handlers
  // =============================================

  const handleFolderClick = (folder: AssetFolder) => {
    setFolderPath([...folderPath, folder]);
    setCurrentFolder(folder.id);
    setPage(1);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setFolderPath([]);
      setCurrentFolder(null);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1]?.id || null);
    }
    setPage(1);
  };

  const handleAssetClick = (asset: Asset, e: React.MouseEvent) => {
    if (multiSelect && (e.ctrlKey || e.metaKey)) {
      setSelectedAssets((prev) => {
        const next = new Set(prev);
        if (next.has(asset.id)) {
          next.delete(asset.id);
        } else {
          next.add(asset.id);
        }
        return next;
      });
    } else {
      setSelectedAssets(new Set([asset.id]));
      onAssetSelect?.(asset);
    }
  };

  const handleAssetDoubleClick = (asset: Asset) => {
    onAssetUse?.(asset);
    smartAssetLibrary.trackAssetUsage(asset.id, 'canvas');
  };

  const handleContextMenu = (e: React.MouseEvent, assetId: string) => {
    e.preventDefault();
    setContextMenu({ assetId, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleToggleFavorite = async (assetId: string) => {
    const newState = await smartAssetLibrary.toggleFavorite(assetId);
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, is_favorite: newState } : a))
    );
    closeContextMenu();
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    const success = await smartAssetLibrary.deleteAsset(assetId);
    if (success) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    }
    closeContextMenu();
  };

  const handleArchiveAsset = async (assetId: string) => {
    const success = await smartAssetLibrary.archiveAsset(assetId);
    if (success) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    }
    closeContextMenu();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    setUploadingFiles(fileArray);

    for (const file of fileArray) {
      try {
        await smartAssetLibrary.uploadAsset(file, currentFolder || undefined);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setUploadingFiles([]);
    loadData();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // =============================================
  // Filter Handlers
  // =============================================

  const handleTypeFilter = (type: AssetType | undefined) => {
    setFilters((prev) => ({ ...prev, type }));
    setPage(1);
  };

  const toggleFavoritesFilter = () => {
    setFilters((prev) => ({
      ...prev,
      isFavorite: prev.isFavorite ? undefined : true,
    }));
    setPage(1);
  };

  const handleSortChange = (sortBy: AssetSearchFilters['sortBy']) => {
    setFilters((prev) => ({ ...prev, sortBy }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  // =============================================
  // Render
  // =============================================

  const totalPages = Math.ceil(totalAssets / ITEMS_PER_PAGE);

  return (
    <div
      className={`asset-grid flex flex-col h-full ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => closeContextMenu()}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-800 space-y-3">
        {/* Title & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-violet-400" />
            <h2 className="font-semibold text-zinc-200">Asset Library</h2>
            <span className="text-sm text-zinc-500">({totalAssets})</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer
              bg-violet-500 text-white hover:bg-violet-600 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.svg"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50
                text-zinc-200 placeholder-zinc-500 text-sm
                focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filters */}
            {(Object.keys(assetTypeIcons) as AssetType[]).map((type) => {
              const Icon = assetTypeIcons[type];
              return (
                <button
                  key={type}
                  onClick={() => handleTypeFilter(filters.type === type ? undefined : type)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    filters.type === type
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              );
            })}
            <button
              onClick={toggleFavoritesFilter}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                filters.isFavorite
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Favorites
            </button>
            {(filters.type || filters.isFavorite || searchQuery) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500
                  hover:text-zinc-400 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className={`px-2 py-1 rounded hover:bg-zinc-800 transition-colors ${
              currentFolder === null ? 'text-zinc-200' : 'text-zinc-500'
            }`}
          >
            All Assets
          </button>
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <span className="text-zinc-600">/</span>
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`px-2 py-1 rounded hover:bg-zinc-800 transition-colors ${
                  index === folderPath.length - 1 ? 'text-zinc-200' : 'text-zinc-500'
                }`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Uploading Indicator */}
            {uploadingFiles.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  <span className="text-sm text-violet-400">
                    Uploading {uploadingFiles.length} file(s)...
                  </span>
                </div>
              </div>
            )}

            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Folders
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl
                        bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30
                        hover:border-zinc-700/50 transition-all group"
                    >
                      <Folder
                        className="w-8 h-8 transition-transform group-hover:scale-110"
                        style={{ color: folder.color }}
                      />
                      <span className="text-xs text-zinc-400 truncate max-w-full">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assets Grid */}
            {assets.length === 0 ? (
              <div className="text-center py-20">
                <Image className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No assets found</p>
                <p className="text-sm text-zinc-600 mt-1">
                  Upload files or try different filters
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {assets.map((asset) => (
                  <AssetThumbnail
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAssets.has(asset.id)}
                    onClick={(e) => handleAssetClick(asset, e)}
                    onDoubleClick={() => handleAssetDoubleClick(asset)}
                    onContextMenu={(e) => handleContextMenu(e, asset.id)}
                    onFavorite={() => handleToggleFavorite(asset.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {assets.map((asset) => (
                  <AssetListItem
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAssets.has(asset.id)}
                    onClick={(e) => handleAssetClick(asset, e)}
                    onDoubleClick={() => handleAssetDoubleClick(asset)}
                    onContextMenu={(e) => handleContextMenu(e, asset.id)}
                    onFavorite={() => handleToggleFavorite(asset.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400
                    hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-zinc-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400
                    hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 py-1 rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleToggleFavorite(contextMenu.assetId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400
              hover:bg-zinc-700 hover:text-zinc-300"
          >
            <Heart className="w-4 h-4" />
            Toggle Favorite
          </button>
          <button
            onClick={() => closeContextMenu()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400
              hover:bg-zinc-700 hover:text-zinc-300"
          >
            <Move className="w-4 h-4" />
            Move to Folder
          </button>
          <button
            onClick={() => handleArchiveAsset(contextMenu.assetId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400
              hover:bg-zinc-700 hover:text-zinc-300"
          >
            <Archive className="w-4 h-4" />
            Archive
          </button>
          <hr className="my-1 border-zinc-700" />
          <button
            onClick={() => handleDeleteAsset(contextMenu.assetId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
              hover:bg-zinc-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// =============================================
// Asset Thumbnail Component
// =============================================

interface AssetThumbnailProps {
  asset: Asset;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onFavorite: () => void;
}

const AssetThumbnail: React.FC<AssetThumbnailProps> = ({
  asset,
  isSelected,
  onClick,
  onDoubleClick,
  onContextMenu,
  onFavorite,
}) => {
  const Icon = assetTypeIcons[asset.asset_type];

  return (
    <div
      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer
        border-2 transition-all ${
          isSelected
            ? 'border-violet-500 ring-2 ring-violet-500/30'
            : 'border-transparent hover:border-zinc-700'
        }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      {/* Thumbnail */}
      <div className="w-full h-full bg-zinc-800">
        {asset.thumbnail_url || (asset.asset_type === 'image' && asset.file_url) ? (
          <img
            src={asset.thumbnail_url || asset.file_url}
            alt={asset.title || asset.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon
              className="w-10 h-10"
              style={{ color: assetTypeColors[asset.asset_type] }}
            />
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <p className="text-xs text-white truncate">{asset.title || asset.filename}</p>
      </div>

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavorite();
        }}
        className={`absolute top-1.5 right-1.5 p-1 rounded-lg transition-all ${
          asset.is_favorite
            ? 'bg-rose-500/80 text-white'
            : 'bg-black/40 text-white/80 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${asset.is_favorite ? 'fill-white' : ''}`} />
      </button>

      {/* Type Badge */}
      <div
        className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-xs text-white"
        style={{ backgroundColor: assetTypeColors[asset.asset_type] + 'CC' }}
      >
        {asset.asset_type}
      </div>
    </div>
  );
};

// =============================================
// Asset List Item Component
// =============================================

interface AssetListItemProps {
  asset: Asset;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onFavorite: () => void;
}

const AssetListItem: React.FC<AssetListItemProps> = ({
  asset,
  isSelected,
  onClick,
  onDoubleClick,
  onContextMenu,
  onFavorite,
}) => {
  const Icon = assetTypeIcons[asset.asset_type];

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-violet-500/20 border border-violet-500/30'
          : 'hover:bg-zinc-800/50 border border-transparent'
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
        {asset.thumbnail_url || (asset.asset_type === 'image' && asset.file_url) ? (
          <img
            src={asset.thumbnail_url || asset.file_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-6 h-6" style={{ color: assetTypeColors[asset.asset_type] }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate">{asset.title || asset.filename}</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{asset.asset_type}</span>
          <span>•</span>
          <span>{smartAssetLibrary.formatFileSize(asset.file_size_bytes)}</span>
          {asset.width && asset.height && (
            <>
              <span>•</span>
              <span>{asset.width}x{asset.height}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            asset.is_favorite
              ? 'text-rose-400'
              : 'text-zinc-500 hover:text-zinc-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${asset.is_favorite ? 'fill-rose-400' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default AssetGrid;
