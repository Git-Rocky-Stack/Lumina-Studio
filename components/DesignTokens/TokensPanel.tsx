// =============================================
// Design Tokens Panel Component
// View, edit, and export design tokens
// =============================================

import React, { useState, useEffect } from 'react';
import {
  Code,
  Palette,
  Type,
  Ruler,
  Box,
  Sun,
  Download,
  Upload,
  Cloud,
  CloudOff,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  FileCode,
  FileJson,
  File,
} from 'lucide-react';
import { designTokensManager } from '../../services/designTokensService';
import type { DesignToken, TokenCategory, TokenExportFormat } from '../../types/designTokens';

// =============================================
// Types
// =============================================

interface TokensPanelProps {
  className?: string;
}

// =============================================
// Category Icons
// =============================================

const CategoryIcon: React.FC<{ category: TokenCategory; className?: string }> = ({
  category,
  className = 'w-4 h-4',
}) => {
  switch (category) {
    case 'colors':
      return <Palette className={className} />;
    case 'typography':
      return <Type className={className} />;
    case 'spacing':
      return <Ruler className={className} />;
    case 'borders':
      return <Box className={className} />;
    case 'shadows':
      return <Sun className={className} />;
    default:
      return <Code className={className} />;
  }
};

// =============================================
// Component
// =============================================

export const TokensPanel: React.FC<TokensPanelProps> = ({ className = '' }) => {
  // State
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<TokenCategory>('colors');
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'error'>('local');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  // =============================================
  // Effects
  // =============================================

  useEffect(() => {
    loadTokens();

    designTokensManager.setOnTokensChange((updatedTokens) => {
      setTokens(updatedTokens);
    });

    return () => {
      designTokensManager.setOnTokensChange(() => {});
    };
  }, []);

  // =============================================
  // Data Loading
  // =============================================

  const loadTokens = () => {
    const allTokens = designTokensManager.getAllTokens();
    setTokens(allTokens);
  };

  // =============================================
  // Handlers
  // =============================================

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      const success = await designTokensManager.syncToCloud();
      setSyncStatus(success ? 'synced' : 'error');
    } catch (error) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadFromCloud = async () => {
    setIsSyncing(true);
    try {
      const success = await designTokensManager.loadFromCloud();
      if (success) {
        loadTokens();
        setSyncStatus('synced');
      }
    } catch (error) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = (format: TokenExportFormat) => {
    designTokensManager.downloadTokens(format, 'design-tokens');
    setShowExportMenu(false);
  };

  const handleImport = () => {
    if (!importData.trim()) return;

    try {
      const result = designTokensManager.importTokens(importData);
      if (result.success) {
        loadTokens();
        setShowImportModal(false);
        setImportData('');
      } else {
        console.error('Import errors:', result.errors);
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleStartEdit = (token: DesignToken) => {
    setEditingToken(token.id);
    setEditValue(token.value);
  };

  const handleSaveEdit = (tokenId: string) => {
    if (editValue) {
      designTokensManager.updateToken(tokenId, { value: editValue });
    }
    setEditingToken(null);
    setEditValue(null);
  };

  const handleCancelEdit = () => {
    setEditingToken(null);
    setEditValue(null);
  };

  const handleDeleteToken = (tokenId: string) => {
    designTokensManager.deleteToken(tokenId);
  };

  const handleCopyValue = (token: DesignToken) => {
    const cssValue = designTokensManager.getCssValue(token.id);
    navigator.clipboard.writeText(cssValue);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // =============================================
  // Render Helpers
  // =============================================

  const categories: TokenCategory[] = ['colors', 'typography', 'spacing', 'borders', 'shadows', 'animations'];

  const renderTokenValue = (token: DesignToken, isEditing: boolean) => {
    const value = isEditing ? editValue : token.value;

    if (value.type === 'color') {
      return (
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="color"
              value={value.value}
              onChange={(e) => setEditValue({ ...value, value: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
          ) : (
            <div
              className="w-6 h-6 rounded border border-zinc-700"
              style={{ backgroundColor: value.value }}
            />
          )}
          <span className="text-xs font-mono text-zinc-400">{value.value}</span>
        </div>
      );
    }

    if (value.type === 'dimension') {
      return isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value.value}
            onChange={(e) => setEditValue({ ...value, value: parseFloat(e.target.value) })}
            className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          />
          <select
            value={value.unit || 'px'}
            onChange={(e) => setEditValue({ ...value, unit: e.target.value })}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          >
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="em">em</option>
            <option value="%">%</option>
          </select>
        </div>
      ) : (
        <span className="text-xs font-mono text-zinc-400">
          {value.value}{value.unit || 'px'}
        </span>
      );
    }

    return (
      <span className="text-xs font-mono text-zinc-400">
        {JSON.stringify(value.value)}
      </span>
    );
  };

  const renderTokensByCategory = (category: TokenCategory) => {
    const categoryTokens = tokens.filter(t => t.category === category);

    return (
      <div className="border border-zinc-700/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedCategory(
            expandedCategory === category ? ('' as TokenCategory) : category
          )}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50"
        >
          <div className="flex items-center gap-2">
            <CategoryIcon category={category} className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300 capitalize">{category}</span>
            <span className="text-xs text-zinc-500">({categoryTokens.length})</span>
          </div>
          {expandedCategory === category ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )}
        </button>

        {expandedCategory === category && categoryTokens.length > 0 && (
          <div className="border-t border-zinc-700/50">
            {categoryTokens.map((token) => {
              const isEditing = editingToken === token.id;

              return (
                <div
                  key={token.id}
                  className="px-4 py-3 border-b border-zinc-700/30 last:border-b-0
                    hover:bg-zinc-800/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-white font-medium truncate">
                          {token.name}
                        </span>
                        {token.deprecated && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            Deprecated
                          </span>
                        )}
                      </div>
                      {renderTokenValue(token, isEditing)}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(token.id)}
                            className="p-1.5 rounded hover:bg-zinc-700 text-emerald-400"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleCopyValue(token)}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          >
                            {copiedId === token.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleStartEdit(token)}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteToken(token.id)}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {expandedCategory === category && categoryTokens.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-zinc-500 border-t border-zinc-700/50">
            No tokens in this category
          </div>
        )}
      </div>
    );
  };

  // =============================================
  // Render
  // =============================================

  return (
    <div className={`bg-zinc-900/95 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-violet-400" />
            <h3 className="font-medium text-white">Design Tokens</h3>
          </div>

          <div className="flex items-center gap-1">
            {/* Sync Status */}
            <button
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white
                transition-colors"
              title="Sync to cloud"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : syncStatus === 'synced' ? (
                <Cloud className="w-4 h-4 text-emerald-400" />
              ) : syncStatus === 'error' ? (
                <CloudOff className="w-4 h-4 text-red-400" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
            </button>

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white
                  transition-colors"
                title="Export tokens"
              >
                <Download className="w-4 h-4" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700
                  rounded-xl shadow-xl py-1 z-10">
                  <button
                    onClick={() => handleExport('css')}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700/50
                      flex items-center gap-2"
                  >
                    <FileCode className="w-4 h-4 text-blue-400" />
                    CSS Variables
                  </button>
                  <button
                    onClick={() => handleExport('scss')}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700/50
                      flex items-center gap-2"
                  >
                    <FileCode className="w-4 h-4 text-pink-400" />
                    SCSS Variables
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700/50
                      flex items-center gap-2"
                  >
                    <FileJson className="w-4 h-4 text-amber-400" />
                    JSON (W3C DTCG)
                  </button>
                  <button
                    onClick={() => handleExport('ts')}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700/50
                      flex items-center gap-2"
                  >
                    <FileCode className="w-4 h-4 text-blue-500" />
                    TypeScript
                  </button>
                  <button
                    onClick={() => handleExport('style-dictionary')}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700/50
                      flex items-center gap-2"
                  >
                    <File className="w-4 h-4 text-emerald-400" />
                    Style Dictionary
                  </button>
                </div>
              )}
            </div>

            {/* Import */}
            <button
              onClick={() => setShowImportModal(true)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white
                transition-colors"
              title="Import tokens"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {categories.map((category) => (
          <div key={category}>
            {renderTokensByCategory(category)}
          </div>
        ))}

        {/* Add Token */}
        <button
          onClick={() => {
            // Create a new token
            designTokensManager.createToken(
              'New Token',
              expandedCategory || 'colors',
              { type: 'color', value: '#6366f1' }
            );
          }}
          className="w-full px-4 py-3 rounded-xl border border-dashed border-zinc-700
            text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-600
            transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Token
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowImportModal(false)}
          />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800
            rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Import Tokens</h3>

            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON token data here..."
              className="w-full h-64 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl
                text-sm text-white placeholder-zinc-500 font-mono resize-none
                focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                }}
                className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white
                  hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-violet-500 text-white
                  hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

export default TokensPanel;
