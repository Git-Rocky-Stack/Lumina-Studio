// ============================================
// EncryptionSettings - PDF Password Protection
// ============================================

import React, { useState, useMemo } from 'react';

// Types
type EncryptionLevel = '40bit' | '128bit' | '256bit';

interface EncryptionOptions {
  enabled: boolean;
  userPassword: string; // Password to open document
  ownerPassword: string; // Password for full access
  encryptionLevel: EncryptionLevel;
  permissions: {
    printing: 'none' | 'lowres' | 'highres';
    copying: boolean;
    editing: boolean;
    annotating: boolean;
    fillingForms: boolean;
    contentAccessibility: boolean;
    documentAssembly: boolean;
  };
}

interface EncryptionSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: EncryptionOptions) => Promise<void>;
  hasExistingEncryption?: boolean;
  className?: string;
}

// Password strength calculation
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: 'None', color: 'bg-white/20' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
  if (score <= 5) return { score: 3, label: 'Strong', color: 'bg-green-500' };
  return { score: 4, label: 'Very Strong', color: 'bg-emerald-500' };
};

export const EncryptionSettings: React.FC<EncryptionSettingsProps> = ({
  isOpen,
  onClose,
  onApply,
  hasExistingEncryption = false,
  className = ''
}) => {
  // State
  const [options, setOptions] = useState<EncryptionOptions>({
    enabled: true,
    userPassword: '',
    ownerPassword: '',
    encryptionLevel: '256bit',
    permissions: {
      printing: 'highres',
      copying: true,
      editing: true,
      annotating: true,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: true
    }
  });

  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [useOwnerPassword, setUseOwnerPassword] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [removeEncryption, setRemoveEncryption] = useState(false);

  // Password strength
  const userPasswordStrength = useMemo(() => calculatePasswordStrength(options.userPassword), [options.userPassword]);
  const ownerPasswordStrength = useMemo(() => calculatePasswordStrength(options.ownerPassword), [options.ownerPassword]);

  // Validation
  const isValid = useMemo(() => {
    if (removeEncryption) return true;
    if (!options.enabled) return true;
    if (!options.userPassword && !useOwnerPassword) return false;
    if (useOwnerPassword && !options.ownerPassword) return false;
    return true;
  }, [options, useOwnerPassword, removeEncryption]);

  // Update permission
  const updatePermission = <K extends keyof EncryptionOptions['permissions']>(
    key: K,
    value: EncryptionOptions['permissions'][K]
  ) => {
    setOptions(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  };

  // Handle apply
  const handleApply = async () => {
    if (!isValid) return;

    setIsApplying(true);
    try {
      await onApply(removeEncryption ? { ...options, enabled: false } : options);
      onClose();
    } catch (error) {
      console.error('Encryption failed:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Generate random password
  const generatePassword = (target: 'user' | 'owner') => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const password = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    setOptions(prev => ({
      ...prev,
      [target === 'user' ? 'userPassword' : 'ownerPassword']: password
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-[#1a1a2e] w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="type-subsection text-white">Security Settings</h2>
              <p className="text-sm text-white/50">Password protect your PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Existing encryption warning */}
          {hasExistingEncryption && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-yellow-400">This document is encrypted</h4>
                  <p className="text-xs text-white/60 mt-1">You can modify the security settings or remove encryption.</p>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeEncryption}
                      onChange={(e) => setRemoveEncryption(e.target.checked)}
                      className="w-4 h-4 rounded accent-yellow-500"
                    />
                    <span className="text-sm text-yellow-400">Remove encryption</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {!removeEncryption && (
            <>
              {/* Encryption Level */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Encryption Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: '40bit', label: '40-bit RC4', desc: 'Legacy compatibility' },
                    { id: '128bit', label: '128-bit AES', desc: 'Good security' },
                    { id: '256bit', label: '256-bit AES', desc: 'Best security' }
                  ] as const).map(level => (
                    <button
                      key={level.id}
                      onClick={() => setOptions(prev => ({ ...prev, encryptionLevel: level.id }))}
                      className={`p-3 rounded-xl text-center transition-all ${
                        options.encryptionLevel === level.id
                          ? 'bg-yellow-500/20 border-2 border-yellow-500'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <span className="text-sm text-white block">{level.label}</span>
                      <span className="text-xs text-white/50">{level.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Open Password */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="type-body-sm font-semibold text-white flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Document Open Password
                  </h3>
                  <button
                    onClick={() => generatePassword('user')}
                    className="text-xs text-yellow-400 hover:text-yellow-300"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-white/50 mb-3">
                  Users will need this password to open the document.
                </p>
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    value={options.userPassword}
                    onChange={(e) => setOptions(prev => ({ ...prev, userPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-20 bg-white/10 rounded-lg text-white border border-white/10 focus:border-yellow-500/50 focus:outline-none"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white"
                  >
                    {showUserPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Strength indicator */}
                {options.userPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= userPasswordStrength.score
                              ? userPasswordStrength.color
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-white/50">{userPasswordStrength.label}</span>
                  </div>
                )}
              </div>

              {/* Owner Password (Optional) */}
              <div className="bg-white/5 rounded-xl p-4">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useOwnerPassword}
                    onChange={(e) => setUseOwnerPassword(e.target.checked)}
                    className="w-4 h-4 rounded accent-yellow-500"
                  />
                  <span className="type-body-sm font-semibold text-white">Use separate permissions password</span>
                </label>

                {useOwnerPassword && (
                  <>
                    <p className="text-xs text-white/50 mb-3">
                      The owner password grants full access to change security settings and permissions.
                    </p>
                    <div className="relative">
                      <input
                        type={showOwnerPassword ? 'text' : 'password'}
                        value={options.ownerPassword}
                        onChange={(e) => setOptions(prev => ({ ...prev, ownerPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-20 bg-white/10 rounded-lg text-white border border-white/10 focus:border-yellow-500/50 focus:outline-none"
                        placeholder="Enter owner password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white"
                      >
                        {showOwnerPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => generatePassword('owner')}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        Generate password
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Permissions */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="type-body-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Document Permissions
                </h3>

                <div className="space-y-3">
                  {/* Printing */}
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Printing</label>
                    <div className="flex gap-2">
                      {(['none', 'lowres', 'highres'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => updatePermission('printing', opt)}
                          className={`flex-1 py-2 text-xs rounded-lg capitalize transition-all ${
                            options.permissions.printing === opt
                              ? 'bg-yellow-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {opt === 'none' ? 'Not allowed' : opt === 'lowres' ? 'Low resolution' : 'High resolution'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other permissions */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.permissions.copying}
                        onChange={(e) => updatePermission('copying', e.target.checked)}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                      Copy content
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.permissions.editing}
                        onChange={(e) => updatePermission('editing', e.target.checked)}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                      Edit document
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.permissions.annotating}
                        onChange={(e) => updatePermission('annotating', e.target.checked)}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                      Add annotations
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.permissions.fillingForms}
                        onChange={(e) => updatePermission('fillingForms', e.target.checked)}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                      Fill forms
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.permissions.contentAccessibility}
                        onChange={(e) => updatePermission('contentAccessibility', e.target.checked)}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                      Accessibility access
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.permissions.documentAssembly}
                        onChange={(e) => updatePermission('documentAssembly', e.target.checked)}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                      Assemble document
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
          <div className="text-sm text-white/50">
            {removeEncryption ? (
              <span className="text-yellow-400">Encryption will be removed</span>
            ) : options.userPassword ? (
              <span>Document will be protected with {options.encryptionLevel} encryption</span>
            ) : (
              <span className="text-white/30">Enter a password to protect the document</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying || !isValid}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {removeEncryption ? 'Remove Security' : 'Apply Security'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptionSettings;
