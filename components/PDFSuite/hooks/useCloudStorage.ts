// ============================================
// useCloudStorage - Cloud Storage React Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import cloudStorageService, {
  CloudProvider,
  CloudConnection,
  CloudFile,
  CloudFolder,
  SyncStatus,
  UploadProgress,
  ShareSettings,
  FileVersion,
} from '../../../services/cloudStorageService';

interface UseCloudStorageOptions {
  autoConnect?: boolean;
  provider?: CloudProvider;
}

interface UseCloudStorageReturn {
  // State
  connections: CloudConnection[];
  activeProvider: CloudProvider | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  files: CloudFile[];
  folders: CloudFolder[];
  syncStatuses: SyncStatus[];
  uploadProgress: UploadProgress | null;

  // Actions
  connect: (provider: CloudProvider) => Promise<void>;
  disconnect: (provider: CloudProvider) => Promise<void>;
  setActiveProvider: (provider: CloudProvider | null) => void;
  listFiles: (folderId?: string, options?: { query?: string }) => Promise<void>;
  uploadFile: (file: File | Blob, fileName: string, folderId?: string) => Promise<CloudFile>;
  downloadFile: (fileId: string) => Promise<Blob>;
  deleteFile: (fileId: string) => Promise<void>;
  syncNow: (provider?: CloudProvider) => Promise<void>;

  // Share
  getShareSettings: (fileId: string) => Promise<ShareSettings>;
  createShareLink: (fileId: string, options?: { expiry?: Date; password?: string }) => Promise<string>;

  // Version
  getVersionHistory: (fileId: string) => Promise<FileVersion[]>;
  restoreVersion: (fileId: string, versionId: string) => Promise<CloudFile>;

  // Utils
  formatFileSize: (bytes: number) => string;
  getProviderName: (provider: CloudProvider) => string;
  getProviderColor: (provider: CloudProvider) => string;
}

export function useCloudStorage(options: UseCloudStorageOptions = {}): UseCloudStorageReturn {
  const { autoConnect = false, provider: defaultProvider } = options;

  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [activeProvider, setActiveProvider] = useState<CloudProvider | null>(defaultProvider || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Load connections on mount
  useEffect(() => {
    const loadConnections = () => {
      const conns = cloudStorageService.getAllConnections();
      setConnections(conns);

      if (!activeProvider && conns.length > 0) {
        setActiveProvider(conns[0].provider);
      }

      setSyncStatuses(cloudStorageService.getAllSyncStatuses());
    };

    loadConnections();

    // Subscribe to events
    const unsubConnect = cloudStorageService.on('connected', loadConnections);
    const unsubDisconnect = cloudStorageService.on('disconnected', loadConnections);
    const unsubSync = cloudStorageService.on('syncCompleted', () => {
      setSyncStatuses(cloudStorageService.getAllSyncStatuses());
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubSync();
    };
  }, []);

  // Check if currently connected
  const isConnected = activeProvider ? cloudStorageService.isConnected(activeProvider) : false;

  // Connect to provider
  const connect = useCallback(async (provider: CloudProvider) => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would open OAuth flow
      const redirectUri = `${window.location.origin}/oauth/callback`;
      await cloudStorageService.connect(provider, 'mock_auth_code', redirectUri);
      setActiveProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect from provider
  const disconnect = useCallback(async (provider: CloudProvider) => {
    setIsLoading(true);
    try {
      await cloudStorageService.disconnect(provider);
      if (activeProvider === provider) {
        const remaining = connections.filter(c => c.provider !== provider);
        setActiveProvider(remaining.length > 0 ? remaining[0].provider : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  }, [activeProvider, connections]);

  // List files in folder
  const listFiles = useCallback(async (
    folderId?: string,
    options: { query?: string } = {}
  ) => {
    if (!activeProvider || !isConnected) {
      setError('Not connected to any provider');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await cloudStorageService.listFiles(activeProvider, folderId, options);
      setFiles(result.files);
      setFolders(result.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list files');
    } finally {
      setIsLoading(false);
    }
  }, [activeProvider, isConnected]);

  // Upload file
  const uploadFile = useCallback(async (
    file: File | Blob,
    fileName: string,
    folderId?: string
  ): Promise<CloudFile> => {
    if (!activeProvider || !isConnected) {
      throw new Error('Not connected to any provider');
    }

    setError(null);

    try {
      const cloudFile = await cloudStorageService.uploadFile(
        activeProvider,
        file,
        fileName,
        folderId,
        (progress) => setUploadProgress(progress)
      );
      setUploadProgress(null);
      return cloudFile;
    } catch (err) {
      setUploadProgress(null);
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      throw new Error(message);
    }
  }, [activeProvider, isConnected]);

  // Download file
  const downloadFile = useCallback(async (fileId: string): Promise<Blob> => {
    if (!activeProvider || !isConnected) {
      throw new Error('Not connected to any provider');
    }

    try {
      return await cloudStorageService.downloadFile(activeProvider, fileId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download file';
      setError(message);
      throw new Error(message);
    }
  }, [activeProvider, isConnected]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    if (!activeProvider || !isConnected) {
      throw new Error('Not connected to any provider');
    }

    try {
      await cloudStorageService.deleteFile(activeProvider, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      setError(message);
      throw new Error(message);
    }
  }, [activeProvider, isConnected]);

  // Sync now
  const syncNow = useCallback(async (provider?: CloudProvider) => {
    const p = provider || activeProvider;
    if (!p) return;

    try {
      await cloudStorageService.syncNow(p);
      setSyncStatuses(cloudStorageService.getAllSyncStatuses());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, [activeProvider]);

  // Get share settings
  const getShareSettings = useCallback(async (fileId: string): Promise<ShareSettings> => {
    if (!activeProvider || !isConnected) {
      throw new Error('Not connected to any provider');
    }

    return cloudStorageService.getShareSettings(activeProvider, fileId);
  }, [activeProvider, isConnected]);

  // Create share link
  const createShareLink = useCallback(async (
    fileId: string,
    options?: { expiry?: Date; password?: string }
  ): Promise<string> => {
    if (!activeProvider || !isConnected) {
      throw new Error('Not connected to any provider');
    }

    return cloudStorageService.createShareLink(activeProvider, fileId, options);
  }, [activeProvider, isConnected]);

  // Get version history
  const getVersionHistory = useCallback(async (fileId: string): Promise<FileVersion[]> => {
    if (!activeProvider || !isConnected) {
      throw new Error('Not connected to any provider');
    }

    return cloudStorageService.getVersionHistory(activeProvider, fileId);
  }, [activeProvider, isConnected]);

  // Restore version
  const restoreVersion = useCallback(async (
    fileId: string,
    versionId: string
  ): Promise<CloudFile> => {
    if (!activeProvider || !isConnected) {
      throw new Error('Not connected to any provider');
    }

    return cloudStorageService.restoreVersion(activeProvider, fileId, versionId);
  }, [activeProvider, isConnected]);

  return {
    // State
    connections,
    activeProvider,
    isConnected,
    isLoading,
    error,
    files,
    folders,
    syncStatuses,
    uploadProgress,

    // Actions
    connect,
    disconnect,
    setActiveProvider,
    listFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    syncNow,

    // Share
    getShareSettings,
    createShareLink,

    // Version
    getVersionHistory,
    restoreVersion,

    // Utils
    formatFileSize: cloudStorageService.formatFileSize,
    getProviderName: cloudStorageService.getProviderName,
    getProviderColor: cloudStorageService.getProviderColor,
  };
}

export default useCloudStorage;
