import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LEDProgressBar from './LEDProgressBar';
import { useAuthContext } from '../contexts/AuthContext';
import {
  generateText,
  suggestAssetMetadata,
  generateHighQualityImage,
  analyzeAssetDeep,
  bulkSuggestTags,
  suggestRelatedAssets
} from '../services/geminiService';

interface AssetVersion {
  id: string;
  url: string;
  date: number;
  label: string;
  changeLog?: string;
  metadata?: any;
}

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'design' | 'audio' | 'model3d';
  project: string;
  date: number;
  size: string;
  tags: string[];
  thumbnail?: string;
  color: string;
  description?: string;
  versions: AssetVersion[];
  priority: 'low' | 'medium' | 'high';
  resolution?: { width: number; height: number };
  duration?: number;
  dominantColors?: string[];
  telemetry?: any;
}

// File type configurations
const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  image: { icon: 'fa-image', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Image' },
  video: { icon: 'fa-video', color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Video' },
  pdf: { icon: 'fa-file-pdf', color: 'text-rose-500', bgColor: 'bg-rose-500/10', label: 'PDF' },
  design: { icon: 'fa-pen-ruler', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', label: 'Design' },
  audio: { icon: 'fa-music', color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Audio' },
  model3d: { icon: 'fa-cube', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: '3D Model' },
};

// Empty state component
const EmptyState: React.FC<{ onUpload: () => void }> = ({ onUpload }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="flex-1 flex items-center justify-center p-12"
  >
    <div className="max-w-lg text-center">
      <div className="relative mb-8">
        <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center">
          <i className="fas fa-cloud-arrow-up text-5xl text-indigo-400" />
        </div>
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <i className="fas fa-plus text-white text-sm" />
        </motion.div>
      </div>

      <h3 className="text-2xl font-bold text-slate-900 mb-3">
        Your creative workspace awaits
      </h3>
      <p className="text-slate-500 mb-8 leading-relaxed">
        Upload your first asset to get started. We support images, videos, PDFs, 3D models, and more.
        Your files are securely stored and synced across all your devices.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onUpload}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
        >
          <i className="fas fa-upload" />
          Upload Assets
        </button>
        <button className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 flex items-center justify-center gap-3">
          <i className="fab fa-google-drive" />
          Import from Drive
        </button>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100">
        <p className="text-sm text-slate-400 mb-4">Supported formats</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['PNG', 'JPG', 'SVG', 'MP4', 'MOV', 'PDF', 'OBJ', 'GLB', 'PSD', 'AI'].map(format => (
            <span key={format} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
              {format}
            </span>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

// Asset card component - redesigned for clarity
const AssetCard: React.FC<{
  asset: Asset;
  isSelected: boolean;
  view: 'grid' | 'list';
  onSelect: () => void;
  onPreview: () => void;
}> = ({ asset, isSelected, view, onSelect, onPreview }) => {
  const config = FILE_TYPE_CONFIG[asset.type] || FILE_TYPE_CONFIG.image;
  const formattedDate = new Date(asset.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: asset.date < Date.now() - 365 * 24 * 60 * 60 * 1000 ? 'numeric' : undefined
  });

  if (view === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onSelect}
        className={`group flex items-center gap-6 p-4 rounded-2xl bg-white border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
          isSelected
            ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg'
            : 'border-transparent hover:border-slate-200'
        }`}
      >
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden relative">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${config.bgColor}`}>
              <i className={`fas ${config.icon} text-2xl ${config.color}`} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate mb-1" title={asset.name}>
            {asset.name}
          </h3>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className={`flex items-center gap-1.5 ${config.color}`}>
              <i className={`fas ${config.icon} text-xs`} />
              {config.label}
            </span>
            <span className="text-slate-300">•</span>
            <span>{asset.size}</span>
            <span className="text-slate-300">•</span>
            <span>{formattedDate}</span>
          </div>
          {asset.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {asset.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs">
                  {tag}
                </span>
              ))}
              {asset.tags.length > 3 && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-xs">
                  +{asset.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-500 hover:text-white transition-colors flex items-center justify-center"
            title="Preview"
          >
            <i className="fas fa-eye" />
          </button>
          <button
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center"
            title="Download"
          >
            <i className="fas fa-download" />
          </button>
          <button
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center"
            title="More options"
          >
            <i className="fas fa-ellipsis-v" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Grid view (default)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onSelect}
      className={`group relative rounded-3xl bg-white overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl ${
        isSelected
          ? 'ring-4 ring-indigo-500/20 shadow-xl'
          : 'shadow-sm hover:shadow-lg'
      }`}
    >
      {/* Thumbnail area */}
      <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
        {asset.thumbnail ? (
          <img
            src={asset.thumbnail}
            alt={asset.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${config.bgColor}`}>
            <i className={`fas ${config.icon} text-5xl ${config.color} opacity-40`} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm text-slate-900 text-sm font-medium hover:bg-white transition-colors flex items-center gap-2"
            >
              <i className="fas fa-expand" />
              Preview
            </button>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white transition-colors flex items-center justify-center">
                <i className="fas fa-download text-sm" />
              </button>
              <button className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white transition-colors flex items-center justify-center">
                <i className="fas fa-ellipsis-h text-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* File type badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg ${config.bgColor} backdrop-blur-sm flex items-center gap-1.5`}>
          <i className={`fas ${config.icon} text-xs ${config.color}`} />
          <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center">
            <i className="fas fa-check text-white text-xs" />
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-5">
        <h3 className="font-semibold text-slate-900 leading-snug mb-2 line-clamp-2" title={asset.name}>
          {asset.name}
        </h3>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{asset.size}</span>
          <span className="text-slate-400">{formattedDate}</span>
        </div>

        {/* Tags (optional, show on hover) */}
        {asset.tags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {asset.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AssetHub: React.FC = () => {
  const { isAuthenticated } = useAuthContext();

  // Start with empty array for authenticated users
  const [assets, setAssets] = useState<Asset[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticSearchType, setSemanticSearchType] = useState<'keyword' | 'lumina'>('keyword');

  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [filterProject, setFilterProject] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isAnalyzingDeep, setIsAnalyzingDeep] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<any>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const [analysisProgress, setAnalysisProgress] = useState(0);

  const projects = useMemo(() => Array.from(new Set(assets.map(a => a.project))), [assets]);

  const selectedAsset = useMemo(() =>
    assets.find(a => a.id === selectedAssetId),
    [assets, selectedAssetId]
  );

  const activeVersion = useMemo(() => {
    if (!selectedAsset) return null;
    return selectedAsset.versions.find(v => v.id === activeVersionId) || selectedAsset.versions[selectedAsset.versions.length - 1];
  }, [selectedAsset, activeVersionId]);

  const filteredAssets = useMemo(() => {
    let results = assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || asset.type === filterType;
      const matchesProject = filterProject === 'all' || asset.project === filterProject;
      return matchesSearch && matchesType && matchesProject;
    });

    return results.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'size') comparison = parseFloat(b.size) - parseFloat(a.size);
      else comparison = b.date - a.date;
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [assets, searchQuery, filterType, filterProject, sortBy, sortOrder]);

  const handleDeepAnalysis = async () => {
    if (!selectedAsset) return;
    setIsAnalyzingDeep(true);
    setAnalysisProgress(0);
    const interval = setInterval(() => setAnalysisProgress(p => p < 90 ? p + 2 : p), 100);

    try {
      const analysis = await analyzeAssetDeep(selectedAsset.name, selectedAsset.description || "", selectedAsset.tags);
      setDeepAnalysis(analysis);
      setAnalysisProgress(100);
    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(interval);
      setTimeout(() => setIsAnalyzingDeep(false), 500);
    }
  };

  const handleUpload = () => {
    // Trigger file upload dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,.pdf,.obj,.glb,.gltf,.psd,.ai,.svg';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        // Handle file upload logic here
        console.log('Files to upload:', files);
      }
    };
    input.click();
  };

  const assetTypes = [
    { id: 'all', label: 'All Types', icon: 'fa-layer-group' },
    { id: 'image', label: 'Images', icon: 'fa-image' },
    { id: 'video', label: 'Videos', icon: 'fa-video' },
    { id: 'pdf', label: 'PDFs', icon: 'fa-file-pdf' },
    { id: 'model3d', label: '3D Models', icon: 'fa-cube' },
    { id: 'design', label: 'Designs', icon: 'fa-pen-ruler' },
    { id: 'audio', label: 'Audio', icon: 'fa-music' },
  ];

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden font-sans">
      {/* Left Sidebar - Workspaces */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspaces</h4>
            <button className="w-7 h-7 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors flex items-center justify-center">
              <i className="fas fa-plus text-xs" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <button
            onClick={() => setFilterProject('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              filterProject === 'all'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-border-all text-sm w-5" />
            <span className="font-medium">All Assets</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              filterProject === 'all' ? 'bg-white/20' : 'bg-slate-200'
            }`}>
              {assets.length}
            </span>
          </button>

          {projects.map((project) => {
            const projectCount = assets.filter(a => a.project === project).length;
            return (
              <button
                key={project}
                onClick={() => setFilterProject(project)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  filterProject === project
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <i className="fas fa-folder text-sm w-5" />
                <span className="font-medium truncate flex-1 text-left">{project}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filterProject === project ? 'bg-white/20' : 'bg-slate-200'
                }`}>
                  {projectCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Production Status */}
        <div className="p-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Status</h4>
          <div className="space-y-1">
            {[
              { label: 'Synced', icon: 'fa-cloud-check', color: 'text-emerald-500', count: 0 },
              { label: 'In Review', icon: 'fa-clock', color: 'text-amber-500', count: 0 },
              { label: 'Drafts', icon: 'fa-file-pen', color: 'text-indigo-500', count: 0 },
              { label: 'Archived', icon: 'fa-box-archive', color: 'text-slate-400', count: 0 },
            ].map((status) => (
              <button
                key={status.label}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
              >
                <i className={`fas ${status.icon} ${status.color} text-sm w-5`} />
                <span className="text-sm">{status.label}</span>
                <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-200">
                  {status.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Your Assets</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-slate-500">
                  Live syncing with project: <span className="text-indigo-600 font-medium">{filterProject === 'all' ? 'All' : filterProject}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleUpload}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
              >
                <i className="fas fa-plus" />
                Upload
              </button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, tag, or description..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              />
            </div>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer"
            >
              {assetTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as 'date' | 'name' | 'size');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>

            {/* View toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setView('grid')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  view === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-grid-2" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  view === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-list" />
              </button>
            </div>
          </div>
        </header>

        {/* Asset Grid/List */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {filteredAssets.length === 0 ? (
              <EmptyState onUpload={handleUpload} />
            ) : (
              <div className={
                view === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
                  : 'space-y-3'
              }>
                <AnimatePresence mode="popLayout">
                  {filteredAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      isSelected={selectedAssetId === asset.id}
                      view={view}
                      onSelect={() => {
                        setSelectedAssetId(asset.id);
                        setActiveVersionId(null);
                        setDeepAnalysis(null);
                      }}
                      onPreview={() => setPreviewAsset(asset)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selectedAsset && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-[420px] bg-white border-l border-slate-200 flex flex-col overflow-hidden"
              >
                {/* Panel header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Asset Details</h3>
                  <button
                    onClick={() => setSelectedAssetId(null)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Preview */}
                  <div className="aspect-video rounded-2xl bg-slate-100 overflow-hidden relative">
                    {activeVersion?.url || selectedAsset.thumbnail ? (
                      <img
                        src={activeVersion?.url || selectedAsset.thumbnail}
                        alt={selectedAsset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${FILE_TYPE_CONFIG[selectedAsset.type]?.bgColor}`}>
                        <i className={`fas ${FILE_TYPE_CONFIG[selectedAsset.type]?.icon} text-4xl ${FILE_TYPE_CONFIG[selectedAsset.type]?.color}`} />
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 text-lg leading-snug">
                      {selectedAsset.name}
                    </h4>

                    {selectedAsset.description && (
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {selectedAsset.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-400 mb-1">Type</p>
                        <p className="font-medium text-slate-700">{FILE_TYPE_CONFIG[selectedAsset.type]?.label}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-400 mb-1">Size</p>
                        <p className="font-medium text-slate-700">{selectedAsset.size}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-400 mb-1">Project</p>
                        <p className="font-medium text-slate-700 truncate">{selectedAsset.project}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50">
                        <p className="text-xs text-slate-400 mb-1">Priority</p>
                        <p className="font-medium text-slate-700 capitalize">{selectedAsset.priority}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedAsset.tags.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAsset.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Analysis */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Intelligence</p>
                        <button
                          onClick={handleDeepAnalysis}
                          disabled={isAnalyzingDeep}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isAnalyzingDeep ? (
                            <>
                              <i className="fas fa-spinner fa-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-wand-magic-sparkles" />
                              Analyze
                            </>
                          )}
                        </button>
                      </div>

                      {isAnalyzingDeep && (
                        <div className="mb-4">
                          <LEDProgressBar progress={analysisProgress} segments={10} />
                        </div>
                      )}

                      {deepAnalysis && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {deepAnalysis.summary || 'Analysis complete.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Panel actions */}
                <div className="p-6 border-t border-slate-100 flex gap-3">
                  <button className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                    <i className="fas fa-download" />
                    Download
                  </button>
                  <button className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors">
                    <i className="fas fa-share-alt" />
                  </button>
                  <button className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors">
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setPreviewAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative max-w-5xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewAsset(null)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                <span className="text-sm">Close</span>
                <i className="fas fa-times" />
              </button>

              {previewAsset.thumbnail ? (
                <img
                  src={previewAsset.thumbnail}
                  alt={previewAsset.name}
                  className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl"
                />
              ) : (
                <div className={`w-96 h-64 rounded-2xl flex items-center justify-center ${FILE_TYPE_CONFIG[previewAsset.type]?.bgColor}`}>
                  <i className={`fas ${FILE_TYPE_CONFIG[previewAsset.type]?.icon} text-6xl ${FILE_TYPE_CONFIG[previewAsset.type]?.color}`} />
                </div>
              )}

              <div className="mt-4 text-center">
                <h3 className="text-white font-semibold text-lg">{previewAsset.name}</h3>
                <p className="text-white/60 text-sm mt-1">
                  {FILE_TYPE_CONFIG[previewAsset.type]?.label} • {previewAsset.size}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetHub;
