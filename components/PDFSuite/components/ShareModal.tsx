// ============================================
// ShareModal - File Sharing & Permissions
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import cloudStorageService, {
  CloudProvider,
  CloudFile,
  ShareSettings,
  SharePermission,
} from '../../../services/cloudStorageService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: CloudFile;
  onShare?: (settings: ShareSettings) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  file,
  onShare,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'people'>('link');
  const [settings, setSettings] = useState<ShareSettings>({
    linkEnabled: false,
    permissions: [],
    allowDownload: true,
    allowEdit: false,
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<SharePermission['role']>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState<'never' | '7days' | '30days' | 'custom'>('never');
  const [customExpiry, setCustomExpiry] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');

  // Load share settings
  useEffect(() => {
    if (isOpen) {
      loadShareSettings();
    }
  }, [isOpen, file.id]);

  const loadShareSettings = async () => {
    setIsLoading(true);
    try {
      const shareSettings = await cloudStorageService.getShareSettings(file.provider, file.id);
      setSettings(shareSettings);
    } catch (error) {
      console.error('Failed to load share settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLink = async () => {
    try {
      if (!settings.linkEnabled) {
        // Create share link
        const linkUrl = await cloudStorageService.createShareLink(file.provider, file.id, {
          expiry: getExpiryDate(),
          password: usePassword ? password : undefined,
          allowDownload: settings.allowDownload,
        });
        setSettings(prev => ({
          ...prev,
          linkEnabled: true,
          linkUrl,
        }));
      } else {
        // Disable link
        await cloudStorageService.updateShareSettings(file.provider, file.id, {
          linkEnabled: false,
        });
        setSettings(prev => ({
          ...prev,
          linkEnabled: false,
          linkUrl: undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to toggle link:', error);
    }
  };

  const getExpiryDate = (): Date | undefined => {
    if (linkExpiry === 'never') return undefined;
    if (linkExpiry === 'custom' && customExpiry) {
      return new Date(customExpiry);
    }
    const days = linkExpiry === '7days' ? 7 : 30;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  const handleCopyLink = async () => {
    if (settings.linkUrl) {
      await navigator.clipboard.writeText(settings.linkUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      const permission = await cloudStorageService.shareWithUser(
        file.provider,
        file.id,
        inviteEmail,
        inviteRole
      );
      setSettings(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission],
      }));
      setInviteEmail('');
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      await cloudStorageService.removeShare(file.provider, file.id, permissionId);
      setSettings(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p.id !== permissionId),
      }));
    } catch (error) {
      console.error('Failed to remove permission:', error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const updated = await cloudStorageService.updateShareSettings(file.provider, file.id, {
        ...settings,
        linkExpiry: getExpiryDate(),
        password: usePassword ? password : undefined,
      });
      setSettings(updated);
      onShare?.(updated);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const getRoleIcon = (role: SharePermission['role']) => {
    switch (role) {
      case 'owner':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
          </svg>
        );
      case 'editor':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'commenter':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div>
                <h2 className="type-subsection text-white">Share Document</h2>
                <p className="text-sm text-white/50 truncate max-w-xs">{file.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-3 type-body-sm font-semibold transition-colors ${
              activeTab === 'link'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Share Link
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 py-3 type-body-sm font-semibold transition-colors ${
              activeTab === 'people'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-white/50 hover:text-white'
            }`}
          >
            People
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'link' && (
            <div className="space-y-4">
              {/* Link Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <div>
                    <p className="text-sm text-white">Anyone with the link</p>
                    <p className="text-xs text-white/40">
                      {settings.linkEnabled ? 'Can view this document' : 'Link sharing is off'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleLink}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.linkEnabled ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.linkEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Link URL */}
              {settings.linkEnabled && settings.linkUrl && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.linkUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg type-body-sm font-semibold transition-colors ${
                      isCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}

              {/* Link Options */}
              {settings.linkEnabled && (
                <div className="space-y-3 pt-2">
                  {/* Expiry */}
                  <div>
                    <label className="text-sm text-white/60 block mb-2">Link expires</label>
                    <div className="flex gap-2">
                      {(['never', '7days', '30days'] as const).map(option => (
                        <button
                          key={option}
                          onClick={() => setLinkExpiry(option)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            linkExpiry === option
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {option === 'never' ? 'Never' : option === '7days' ? '7 days' : '30 days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password Protection */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm text-white">Password protect</span>
                    </div>
                    <button
                      onClick={() => setUsePassword(!usePassword)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        usePassword ? 'bg-purple-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          usePassword ? 'left-4' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {usePassword && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    />
                  )}

                  {/* Permissions */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">Allow download</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, allowDownload: !prev.allowDownload }))}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        settings.allowDownload ? 'bg-purple-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.allowDownload ? 'left-4' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-4">
              {/* Invite Input */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as SharePermission['role'])}
                  className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10"
                >
                  <option value="viewer">Viewer</option>
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white type-body-sm font-semibold transition-colors"
                >
                  Invite
                </button>
              </div>

              {/* People List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {settings.permissions.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <svg className="w-10 h-10 mx-auto mb-2 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">No one has access yet</p>
                    <p className="text-xs mt-1">Invite people by email</p>
                  </div>
                ) : (
                  settings.permissions.map(permission => (
                    <div
                      key={permission.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        {permission.avatar ? (
                          <img src={permission.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-sm text-purple-300">
                            {permission.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {permission.name || permission.email}
                        </p>
                        {permission.name && (
                          <p className="text-xs text-white/40 truncate">{permission.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(permission.role)}
                        <span className="text-xs text-white/40 capitalize">{permission.role}</span>
                      </div>
                      {permission.role !== 'owner' && (
                        <button
                          onClick={() => handleRemovePermission(permission.id)}
                          className="p-1.5 rounded hover:bg-white/10 text-red-400 hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleUpdateSettings();
              onClose();
            }}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white type-body-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
