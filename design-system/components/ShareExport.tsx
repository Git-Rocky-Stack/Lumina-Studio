import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Share Link Generator
interface ShareLinkProps {
  projectId: string;
  projectName: string;
  onGenerate: (settings: ShareSettings) => Promise<string>;
  className?: string;
}

interface ShareSettings {
  allowComments: boolean;
  allowDownload: boolean;
  requirePassword: boolean;
  password?: string;
  expiresIn?: '1h' | '24h' | '7d' | '30d' | 'never';
}

export const ShareLink: React.FC<ShareLinkProps> = ({
  projectId,
  projectName,
  onGenerate,
  className = '',
}) => {
  const [settings, setSettings] = useState<ShareSettings>({
    allowComments: true,
    allowDownload: false,
    requirePassword: false,
    expiresIn: '7d',
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const link = await onGenerate(settings);
      setGeneratedLink(link);
    } catch (error) {
      console.error('Failed to generate link:', error);
    }
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <i className="fas fa-share-nodes text-accent" />
        Share "{projectName}"
      </h3>

      {/* Settings */}
      <div className="space-y-4 mb-6">
        {/* Permissions */}
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <i className="fas fa-comment text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Allow comments</span>
            </div>
            <input
              type="checkbox"
              checked={settings.allowComments}
              onChange={e => setSettings({ ...settings, allowComments: e.target.checked })}
              className="w-5 h-5 rounded accent-accent"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <i className="fas fa-download text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Allow download</span>
            </div>
            <input
              type="checkbox"
              checked={settings.allowDownload}
              onChange={e => setSettings({ ...settings, allowDownload: e.target.checked })}
              className="w-5 h-5 rounded accent-accent"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <i className="fas fa-lock text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Require password</span>
            </div>
            <input
              type="checkbox"
              checked={settings.requirePassword}
              onChange={e => setSettings({ ...settings, requirePassword: e.target.checked })}
              className="w-5 h-5 rounded accent-accent"
            />
          </label>

          <AnimatePresence>
            {settings.requirePassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="password"
                  placeholder="Enter password"
                  value={settings.password || ''}
                  onChange={e => setSettings({ ...settings, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expiration */}
        <div>
          <label className="text-sm text-slate-500 mb-2 block">Link expires in</label>
          <div className="flex gap-2">
            {(['1h', '24h', '7d', '30d', 'never'] as const).map(option => (
              <button
                key={option}
                onClick={() => setSettings({ ...settings, expiresIn: option })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.expiresIn === option
                    ? 'bg-accent text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {option === 'never' ? 'Never' : option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Link */}
      {generatedLink ? (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={generatedLink}
              readOnly
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono"
            />
            <motion.button
              onClick={handleCopy}
              className="px-4 py-3 bg-accent text-white rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {copied ? <i className="fas fa-check" /> : <i className="fas fa-copy" />}
            </motion.button>
          </div>
          {copied && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-emerald-500 mt-2"
            >
              Link copied to clipboard!
            </motion.p>
          )}
        </div>
      ) : (
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 bg-accent text-white rounded-xl font-medium disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isGenerating ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <i className="fas fa-link mr-2" />
              Generate Share Link
            </>
          )}
        </motion.button>
      )}

      {/* Social share buttons */}
      {generatedLink && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 mb-3">Share on social</p>
          <div className="flex gap-2">
            {[
              { icon: 'fa-twitter', color: '#1DA1F2', name: 'Twitter' },
              { icon: 'fa-facebook', color: '#4267B2', name: 'Facebook' },
              { icon: 'fa-linkedin', color: '#0077B5', name: 'LinkedIn' },
              { icon: 'fa-whatsapp', color: '#25D366', name: 'WhatsApp' },
            ].map(social => (
              <motion.button
                key={social.name}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: social.color }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={social.name}
              >
                <i className={`fab ${social.icon}`} />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export Presets
interface ExportPreset {
  id: string;
  name: string;
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'webp';
  quality: number;
  scale: number;
  width?: number;
  height?: number;
}

interface ExportPresetsProps {
  presets: ExportPreset[];
  onSave: (preset: Omit<ExportPreset, 'id'>) => void;
  onDelete: (id: string) => void;
  onExport: (preset: ExportPreset) => void;
  className?: string;
}

export const ExportPresets: React.FC<ExportPresetsProps> = ({
  presets,
  onSave,
  onDelete,
  onExport,
  className = '',
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPreset, setNewPreset] = useState<Omit<ExportPreset, 'id'>>({
    name: '',
    format: 'png',
    quality: 90,
    scale: 1,
  });

  const formatIcons = {
    png: 'fa-image',
    jpg: 'fa-file-image',
    svg: 'fa-bezier-curve',
    pdf: 'fa-file-pdf',
    webp: 'fa-file',
  };

  const handleSave = () => {
    if (newPreset.name.trim()) {
      onSave(newPreset);
      setNewPreset({ name: '', format: 'png', quality: 90, scale: 1 });
      setIsCreating(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <i className="fas fa-file-export text-accent" />
          Export Presets
        </h3>
        <motion.button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-sm font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className={`fas ${isCreating ? 'fa-times' : 'fa-plus'} mr-1`} />
          {isCreating ? 'Cancel' : 'New Preset'}
        </motion.button>
      </div>

      {/* Create new preset form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-4"
          >
            <input
              type="text"
              placeholder="Preset name"
              value={newPreset.name}
              onChange={e => setNewPreset({ ...newPreset, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Format</label>
                <select
                  value={newPreset.format}
                  onChange={e =>
                    setNewPreset({ ...newPreset, format: e.target.value as ExportPreset['format'] })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {['png', 'jpg', 'svg', 'pdf', 'webp'].map(f => (
                    <option key={f} value={f}>
                      {f.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-500 mb-1 block">Scale</label>
                <select
                  value={newPreset.scale}
                  onChange={e => setNewPreset({ ...newPreset, scale: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {[0.5, 1, 2, 3, 4].map(s => (
                    <option key={s} value={s}>
                      {s}x
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-500 mb-1 block">
                Quality: {newPreset.quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={newPreset.quality}
                onChange={e => setNewPreset({ ...newPreset, quality: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            <motion.button
              onClick={handleSave}
              className="w-full py-2 bg-accent text-white rounded-lg font-medium"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Save Preset
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presets list */}
      <div className="space-y-2">
        {presets.map(preset => (
          <motion.div
            key={preset.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 group"
            whileHover={{ scale: 1.01 }}
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <i className={`fas ${formatIcons[preset.format]} text-accent`} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-900 dark:text-white">{preset.name}</div>
              <div className="text-xs text-slate-500">
                {preset.format.toUpperCase()} · {preset.scale}x · {preset.quality}%
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                onClick={() => onExport(preset)}
                className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Export
              </motion.button>
              <motion.button
                onClick={() => onDelete(preset.id)}
                className="px-2 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-trash" />
              </motion.button>
            </div>
          </motion.div>
        ))}

        {presets.length === 0 && !isCreating && (
          <div className="text-center py-8 text-slate-400">
            <i className="fas fa-file-export text-3xl mb-2 opacity-30" />
            <p>No export presets yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-accent hover:underline mt-2"
            >
              Create your first preset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareLink;
