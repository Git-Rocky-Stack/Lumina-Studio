// ============================================
// CloudStoragePanel - Multi-Provider File Browser
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import cloudStorageService, {
  CloudProvider,
  CloudConnection,
  CloudFile,
  CloudFolder,
  UploadProgress,
} from '../../../services/cloudStorageService';

interface CloudStoragePanelProps {
  onFileSelect?: (file: CloudFile) => void;
  onFileUpload?: (file: CloudFile) => void;
  allowUpload?: boolean;
  fileFilter?: string; // e.g., 'application/pdf'
  className?: string;
}

export const CloudStoragePanel: React.FC<CloudStoragePanelProps> = ({
  onFileSelect,
  onFileUpload,
  allowUpload = true,
  fileFilter,
  className = '',
}) => {
  const [activeProvider, setActiveProvider] = useState<CloudProvider | null>(null);
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Provider icons
  const providerIcons: Record<CloudProvider, React.ReactNode> = {
    'google-drive': (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.71 3.5L1.15 15l3.43 5.95 6.56-11.45L7.71 3.5zm1.29 0l6.57 11.45 3.43-5.95L12.43 3.5H9zm8.57 8L12 21.5h6.85l3.43-5.95-4.42-4.05z" />
      </svg>
    ),
    'dropbox': (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2l6 3.75L6 9.5 0 5.75 6 2zm12 0l6 3.75-6 3.75-6-3.75L18 2zM0 13.25L6 9.5l6 3.75-6 3.75-6-3.75zm18-3.75l6 3.75-6 3.75-6-3.75 6-3.75zM6 18.25l6-3.75 6 3.75-6 3.75-6-3.75z" />
      </svg>
    ),
    'onedrive': (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.5 18.5h8.25a4.25 4.25 0 001.5-8.23 5.25 5.25 0 00-9.63-1.92A6 6 0 106 18.5h4.5z" />
      </svg>
    ),
  };

  // Load connections on mount
  useEffect(() => {
    const loadConnections = () => {
      const conns = cloudStorageService.getAllConnections();
      setConnections(conns);
      if (conns.length > 0 && !activeProvider) {
        setActiveProvider(conns[0].provider);
      }
    };

    loadConnections();

    const unsubConnect = cloudStorageService.on('connected', loadConnections);
    const unsubDisconnect = cloudStorageService.on('disconnected', loadConnections);

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, [activeProvider]);

  // Load files when provider or folder changes
  useEffect(() => {
    if (activeProvider && cloudStorageService.isConnected(activeProvider)) {
      loadFiles();
    }
  }, [activeProvider, currentFolderId, searchQuery]);

  const loadFiles = async () => {
    if (!activeProvider) return;

    setIsLoading(true);
    try {
      const result = await cloudStorageService.listFiles(activeProvider, currentFolderId, {
        query: searchQuery,
        mimeType: fileFilter,
      });

      let sortedFiles = [...result.files];

      // Apply sorting
      sortedFiles.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'date':
            comparison = new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
            break;
          case 'size':
            comparison = b.size - a.size;
            break;
        }
        return sortOrder === 'asc' ? -comparison : comparison;
      });

      setFiles(sortedFiles);
      setFolders(result.folders);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (provider: CloudProvider) => {
    // In production, this would open OAuth flow
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const authUrl = cloudStorageService.getAuthUrl(provider, redirectUri);

    // For demo, simulate connection
    cloudStorageService.connect(provider, 'mock_auth_code', redirectUri).then(() => {
      setActiveProvider(provider);
    });
  };

  const handleDisconnect = async (provider: CloudProvider) => {
    await cloudStorageService.disconnect(provider);
    if (activeProvider === provider) {
      const remaining = connections.filter(c => c.provider !== provider);
      setActiveProvider(remaining.length > 0 ? remaining[0].provider : null);
    }
  };

  const handleFolderClick = (folder: CloudFolder) => {
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setFolderPath([]);
      setCurrentFolderId(undefined);
    } else {
      setFolderPath(folderPath.slice(0, index + 1));
      setCurrentFolderId(folderPath[index].id);
    }
  };

  const handleFileClick = (file: CloudFile) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProvider) return;

    try {
      const cloudFile = await cloudStorageService.uploadFile(
        activeProvider,
        file,
        file.name,
        currentFolderId,
        setUploadProgress
      );
      setUploadProgress(null);
      onFileUpload?.(cloudFile);
      loadFiles();
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatSize = (bytes: number) => {
    return cloudStorageService.formatFileSize(bytes);
  };

  // Provider tabs
  const ProviderTabs = () => (
    <div className="flex border-b border-white/10">
      {(['google-drive', 'dropbox', 'onedrive'] as CloudProvider[]).map(provider => {
        const isConnected = cloudStorageService.isConnected(provider);
        const config = cloudStorageService.getProviderConfig(provider);

        return (
          <button
            key={provider}
            onClick={() => isConnected ? setActiveProvider(provider) : handleConnect(provider)}
            className={`flex items-center gap-2 px-4 py-3 transition-colors ${
              activeProvider === provider
                ? 'bg-white/10 border-b-2 border-purple-500'
                : 'hover:bg-white/5'
            }`}
            style={{ color: isConnected ? config.color : 'rgba(255,255,255,0.4)' }}
          >
            {providerIcons[provider]}
            <span className={`text-sm ${isConnected ? 'text-white' : 'text-white/40'}`}>
              {config.name}
            </span>
            {!isConnected && (
              <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/50">
                Connect
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // File list item
  const FileItem = ({ file }: { file: CloudFile }) => (
    <button
      onClick={() => handleFileClick(file)}
      className={`w-full p-3 rounded-lg text-left transition-all ${
        selectedFile?.id === file.id
          ? 'bg-purple-500/20 border border-purple-500'
          : 'bg-white/5 border border-transparent hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white truncate">{file.name}</span>
            {file.starred && (
              <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            {file.shared && (
              <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-white/40">{formatSize(file.size)}</span>
            <span className="text-xs text-white/40">{formatDate(file.modifiedAt)}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Open context menu
          }}
          className="p-1.5 rounded hover:bg-white/10"
        >
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </button>
  );

  // Folder item
  const FolderItem = ({ folder }: { folder: CloudFolder }) => (
    <button
      onClick={() => handleFolderClick(folder)}
      className="w-full p-3 rounded-lg bg-white/5 border border-transparent hover:bg-white/10 text-left transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-white truncate block">{folder.name}</span>
          {folder.itemCount !== undefined && (
            <span className="text-xs text-white/40">{folder.itemCount} items</span>
          )}
        </div>
        <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );

  // Not connected view
  if (!activeProvider || !cloudStorageService.isConnected(activeProvider)) {
    return (
      <div className={`bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden ${className}`}>
        <ProviderTabs />
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg text-white mb-2">Connect Cloud Storage</h3>
          <p className="text-sm text-white/50 mb-6 max-w-sm mx-auto">
            Connect your cloud storage to access, save, and sync your PDF documents.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {(['google-drive', 'dropbox', 'onedrive'] as CloudProvider[]).map(provider => {
              const config = cloudStorageService.getProviderConfig(provider);
              return (
                <button
                  key={provider}
                  onClick={() => handleConnect(provider)}
                  className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
                  style={{ borderColor: `${config.color}40` }}
                >
                  <span style={{ color: config.color }}>{providerIcons[provider]}</span>
                  <span className="text-white">Connect {config.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden ${className}`}>
      <ProviderTabs />

      {/* Toolbar */}
      <div className="p-3 border-b border-white/10 flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Sort */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            setSortBy(by as typeof sortBy);
            setSortOrder(order as typeof sortOrder);
          }}
          className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="size-desc">Largest first</option>
          <option value="size-asc">Smallest first</option>
        </select>

        {/* View mode */}
        <div className="flex bg-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/20' : ''}`}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/20' : ''}`}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>

        {/* Upload */}
        {allowUpload && (
          <label className="px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm cursor-pointer transition-colors">
            <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
            Upload
          </label>
        )}

        {/* Refresh */}
        <button
          onClick={loadFiles}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-1 text-sm">
        <button
          onClick={() => handleBreadcrumbClick(-1)}
          className="text-white/60 hover:text-white transition-colors"
        >
          {cloudStorageService.getProviderName(activeProvider)}
        </button>
        {folderPath.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className={`${
                index === folderPath.length - 1
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              } transition-colors`}
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="px-3 py-2 border-b border-white/10 bg-purple-500/10">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-white truncate">{uploadProgress.fileName}</span>
            <span className="text-white/60">{uploadProgress.percentage}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* File List */}
      <div className="h-80 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {folders.map(folder => (
              <FolderItem key={folder.id} folder={folder} />
            ))}
            {files.map(file => (
              <FileItem key={file.id} file={file} />
            ))}
            {folders.length === 0 && files.length === 0 && (
              <div className="text-center py-12 text-white/40">
                <svg className="w-12 h-12 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                <p>No files in this folder</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Account Info */}
      {connections.find(c => c.provider === activeProvider)?.user && (
        <div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-xs text-purple-300">
                {connections.find(c => c.provider === activeProvider)?.user?.name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <p className="text-sm text-white">
                {connections.find(c => c.provider === activeProvider)?.user?.name}
              </p>
              <p className="text-xs text-white/40">
                {connections.find(c => c.provider === activeProvider)?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDisconnect(activeProvider)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default CloudStoragePanel;
