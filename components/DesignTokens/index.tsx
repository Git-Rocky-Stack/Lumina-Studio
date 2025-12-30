// ============================================================================
// DESIGN TOKENS PANEL - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { designTokensManager } from '../../services/designTokensService';
import {
  CATEGORY_INFO,
  formatTokenValue,
  isLightColor
} from '../../types/designTokens';
import type {
  DesignToken,
  TokenCategory,
  TokenValue,
  TokenExportFormat,
  ColorValue,
  DimensionValue,
  TypographyValue,
  ShadowValue
} from '../../types/designTokens';

// ============================================================================
// DESIGN SYSTEM TOKENS
// ============================================================================

const colors = {
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a24',
    elevated: '#1e1e2a',
    hover: '#252532'
  },
  border: {
    subtle: '#2a2a3a',
    default: '#3a3a4a',
    focus: '#6366f1'
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    tertiary: '#707080',
    muted: '#505060'
  },
  accent: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

// ============================================================================
// MAIN TOKENS PANEL
// ============================================================================

interface DesignTokensPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesignTokensPanel: React.FC<DesignTokensPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [activeCategory, setActiveCategory] = useState<TokenCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<DesignToken | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('default');

  // Load tokens
  useEffect(() => {
    setTokens(designTokensManager.getAllTokens());
    setActiveMode(designTokensManager.getActiveMode());

    designTokensManager.setOnTokensChange((updated) => {
      setTokens(updated);
    });

    return () => {
      designTokensManager.setOnTokensChange(() => {});
    };
  }, []);

  // Filter tokens
  const filteredTokens = useMemo(() => {
    let result = tokens;

    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [tokens, activeCategory, searchQuery]);

  // Group tokens by category
  const groupedTokens = useMemo(() => {
    const groups: Record<string, DesignToken[]> = {};

    filteredTokens.forEach(token => {
      if (!groups[token.category]) {
        groups[token.category] = [];
      }
      groups[token.category].push(token);
    });

    return groups;
  }, [filteredTokens]);

  // Token counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tokens.length };
    tokens.forEach(token => {
      counts[token.category] = (counts[token.category] || 0) + 1;
    });
    return counts;
  }, [tokens]);

  // Handle mode change
  const handleModeChange = useCallback((mode: string) => {
    designTokensManager.setActiveMode(mode);
    setActiveMode(mode);
  }, []);

  // Handle token delete
  const handleDeleteToken = useCallback((id: string) => {
    designTokensManager.deleteToken(id);
    if (selectedToken?.id === id) {
      setSelectedToken(null);
    }
  }, [selectedToken]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex"
          style={{ backgroundColor: colors.background.secondary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Left Panel - Token Browser */}
          <div className="w-80 flex flex-col border-r" style={{ borderColor: colors.border.subtle }}>
            {/* Header */}
            <div className="p-4 border-b" style={{ borderColor: colors.border.subtle }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.accent.secondary + '20' }}
                  >
                    <i className="fa-solid fa-swatchbook" style={{ color: colors.accent.secondary }} />
                  </div>
                  <div>
                    <h2 className="type-subsection" style={{ color: colors.text.primary }}>
                      Design Tokens
                    </h2>
                    <p className="text-xs" style={{ color: colors.text.tertiary }}>
                      {tokens.length} tokens
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: colors.background.tertiary }}
              >
                <i className="fa-solid fa-search text-sm" style={{ color: colors.text.tertiary }} />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: colors.text.primary }}
                />
              </div>
            </div>

            {/* Categories */}
            <div className="p-2 border-b" style={{ borderColor: colors.border.subtle }}>
              <div className="flex flex-wrap gap-1">
                <CategoryPill
                  label="All"
                  count={categoryCounts.all || 0}
                  isActive={activeCategory === 'all'}
                  onClick={() => setActiveCategory('all')}
                />
                {(Object.keys(CATEGORY_INFO) as TokenCategory[]).map(category => (
                  <CategoryPill
                    key={category}
                    label={CATEGORY_INFO[category].label}
                    count={categoryCounts[category] || 0}
                    isActive={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                    color={CATEGORY_INFO[category].color}
                  />
                ))}
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto p-2">
              {activeCategory === 'all' ? (
                Object.entries(groupedTokens).map(([category, categoryTokens]) => (
                  <div key={category} className="mb-4">
                    <div
                      className="type-label px-2 py-1 mb-1"
                      style={{ color: colors.text.tertiary }}
                    >
                      {CATEGORY_INFO[category as TokenCategory]?.label || category}
                    </div>
                    {categoryTokens.map(token => (
                      <TokenListItem
                        key={token.id}
                        token={token}
                        isSelected={selectedToken?.id === token.id}
                        onClick={() => setSelectedToken(token)}
                      />
                    ))}
                  </div>
                ))
              ) : (
                filteredTokens.map(token => (
                  <TokenListItem
                    key={token.id}
                    token={token}
                    isSelected={selectedToken?.id === token.id}
                    onClick={() => setSelectedToken(token)}
                  />
                ))
              )}

              {filteredTokens.length === 0 && (
                <div className="text-center py-8">
                  <i
                    className="fa-solid fa-swatchbook text-3xl mb-2"
                    style={{ color: colors.text.tertiary }}
                  />
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    No tokens found
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t" style={{ borderColor: colors.border.subtle }}>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex-1 py-2 text-sm rounded-lg transition-colors"
                  style={{ backgroundColor: colors.accent.primary, color: '#fff' }}
                >
                  <i className="fa-solid fa-plus mr-1.5" />
                  New Token
                </button>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-4 py-2 text-sm rounded-lg transition-colors"
                  style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
                >
                  <i className="fa-solid fa-download" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Token Details */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: colors.border.subtle }}
            >
              <div className="flex items-center gap-4">
                {/* Mode Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: colors.text.tertiary }}>Mode:</span>
                  <select
                    value={activeMode}
                    onChange={e => handleModeChange(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg outline-none"
                    style={{
                      backgroundColor: colors.background.tertiary,
                      color: colors.text.primary,
                      border: `1px solid ${colors.border.subtle}`
                    }}
                  >
                    <option value="default">Default</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: colors.text.secondary }}
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedToken ? (
                <TokenDetailView
                  token={selectedToken}
                  onUpdate={(updates) => {
                    const updated = designTokensManager.updateToken(selectedToken.id, updates);
                    if (updated) setSelectedToken(updated);
                  }}
                  onDelete={() => handleDeleteToken(selectedToken.id)}
                  onDuplicate={() => {
                    const duplicate = designTokensManager.duplicateToken(selectedToken.id);
                    if (duplicate) setSelectedToken(duplicate);
                  }}
                />
              ) : (
                <TokenOverview tokens={tokens} />
              )}
            </div>
          </div>
        </motion.div>

        {/* Create Token Modal */}
        {isCreateModalOpen && (
          <CreateTokenModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={(token) => {
              setSelectedToken(token);
              setIsCreateModalOpen(false);
            }}
          />
        )}

        {/* Export Modal */}
        {isExportModalOpen && (
          <ExportModal onClose={() => setIsExportModalOpen(false)} />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// CATEGORY PILL
// ============================================================================

interface CategoryPillProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}

const CategoryPill: React.FC<CategoryPillProps> = ({
  label,
  count,
  isActive,
  onClick,
  color
}) => (
  <button
    onClick={onClick}
    className="px-2 py-1 text-xs rounded-full transition-colors"
    style={{
      backgroundColor: isActive
        ? (color || colors.accent.primary) + '30'
        : colors.background.tertiary,
      color: isActive ? (color || colors.accent.primary) : colors.text.secondary
    }}
  >
    {label} ({count})
  </button>
);

// ============================================================================
// TOKEN LIST ITEM
// ============================================================================

interface TokenListItemProps {
  token: DesignToken;
  isSelected: boolean;
  onClick: () => void;
}

const TokenListItem: React.FC<TokenListItemProps> = ({
  token,
  isSelected,
  onClick
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
    style={{
      backgroundColor: isSelected ? colors.accent.primary + '20' : 'transparent'
    }}
  >
    <TokenPreview token={token} size="sm" />
    <div className="flex-1 min-w-0">
      <div
        className="type-body-sm font-semibold truncate"
        style={{ color: isSelected ? colors.accent.primary : colors.text.primary }}
      >
        {token.name}
      </div>
      <div className="text-xs truncate" style={{ color: colors.text.tertiary }}>
        {formatTokenValue(token.value)}
      </div>
    </div>
    {token.deprecated && (
      <i
        className="fa-solid fa-triangle-exclamation text-xs"
        style={{ color: colors.accent.warning }}
      />
    )}
  </button>
);

// ============================================================================
// TOKEN PREVIEW
// ============================================================================

interface TokenPreviewProps {
  token: DesignToken;
  size?: 'sm' | 'md' | 'lg';
}

const TokenPreview: React.FC<TokenPreviewProps> = ({ token, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  switch (token.value.type) {
    case 'color':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg border`}
          style={{
            backgroundColor: token.value.value,
            borderColor: colors.border.subtle
          }}
        />
      );

    case 'typography':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center border`}
          style={{
            backgroundColor: colors.background.tertiary,
            borderColor: colors.border.subtle
          }}
        >
          <span
            style={{
              fontFamily: (token.value as TypographyValue).value.fontFamily,
              fontSize: size === 'sm' ? 12 : size === 'md' ? 16 : 24,
              fontWeight: (token.value as TypographyValue).value.fontWeight,
              color: colors.text.primary
            }}
          >
            Aa
          </span>
        </div>
      );

    case 'shadow':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center`}
          style={{ backgroundColor: colors.background.tertiary }}
        >
          <div
            className="w-3/4 h-3/4 rounded bg-white"
            style={{
              boxShadow: (token.value as ShadowValue).value.map(s =>
                `${s.inset ? 'inset ' : ''}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`
              ).join(', ')
            }}
          />
        </div>
      );

    case 'dimension':
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center border`}
          style={{
            backgroundColor: colors.background.tertiary,
            borderColor: colors.border.subtle
          }}
        >
          <span className="text-xs font-mono" style={{ color: colors.text.secondary }}>
            {(token.value as DimensionValue).value}
            {(token.value as DimensionValue).unit}
          </span>
        </div>
      );

    default:
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center border`}
          style={{
            backgroundColor: colors.background.tertiary,
            borderColor: colors.border.subtle
          }}
        >
          <i className="fa-solid fa-code text-sm" style={{ color: colors.text.tertiary }} />
        </div>
      );
  }
};

// ============================================================================
// TOKEN DETAIL VIEW
// ============================================================================

interface TokenDetailViewProps {
  token: DesignToken;
  onUpdate: (updates: Partial<DesignToken>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TokenDetailView: React.FC<TokenDetailViewProps> = ({
  token,
  onUpdate,
  onDelete,
  onDuplicate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(token.name);
  const [editDescription, setEditDescription] = useState(token.description || '');

  useEffect(() => {
    setEditName(token.name);
    setEditDescription(token.description || '');
    setIsEditing(false);
  }, [token]);

  const handleSave = () => {
    onUpdate({
      name: editName,
      description: editDescription || undefined
    });
    setIsEditing(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <TokenPreview token={token} size="lg" />
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="text-xl font-semibold bg-transparent outline-none border-b-2"
                style={{
                  color: colors.text.primary,
                  borderColor: colors.accent.primary
                }}
              />
            ) : (
              <h3 className="type-subsection" style={{ color: colors.text.primary }}>
                {token.name}
              </h3>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: CATEGORY_INFO[token.category].color + '20',
                  color: CATEGORY_INFO[token.category].color
                }}
              >
                {CATEGORY_INFO[token.category].label}
              </span>
              {token.deprecated && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: colors.accent.warning + '20',
                    color: colors.accent.warning
                  }}
                >
                  Deprecated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm rounded-lg"
                style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm rounded-lg"
                style={{ backgroundColor: colors.accent.primary, color: '#fff' }}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                title="Edit"
              >
                <i className="fa-solid fa-pen text-sm" style={{ color: colors.text.secondary }} />
              </button>
              <button
                onClick={onDuplicate}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                title="Duplicate"
              >
                <i className="fa-solid fa-copy text-sm" style={{ color: colors.text.secondary }} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                title="Delete"
              >
                <i className="fa-solid fa-trash text-sm" style={{ color: colors.accent.error }} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="type-body-sm font-semibold mb-2 block" style={{ color: colors.text.secondary }}>
          Description
        </label>
        {isEditing ? (
          <textarea
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.primary,
              border: `1px solid ${colors.border.subtle}`
            }}
          />
        ) : (
          <p className="text-sm" style={{ color: colors.text.tertiary }}>
            {token.description || 'No description'}
          </p>
        )}
      </div>

      {/* Value */}
      <div className="mb-6">
        <label className="type-body-sm font-semibold mb-2 block" style={{ color: colors.text.secondary }}>
          Value
        </label>
        <TokenValueEditor token={token} onUpdate={onUpdate} />
      </div>

      {/* Tags */}
      <div className="mb-6">
        <label className="type-body-sm font-semibold mb-2 block" style={{ color: colors.text.secondary }}>
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {token.tags?.map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: colors.background.tertiary,
                color: colors.text.secondary
              }}
            >
              {tag}
            </span>
          ))}
          {(!token.tags || token.tags.length === 0) && (
            <span className="text-sm" style={{ color: colors.text.tertiary }}>No tags</span>
          )}
        </div>
      </div>

      {/* CSS Variable */}
      <div className="mb-6">
        <label className="type-body-sm font-semibold mb-2 block" style={{ color: colors.text.secondary }}>
          CSS Variable
        </label>
        <code
          className="block px-4 py-3 rounded-lg text-sm font-mono"
          style={{
            backgroundColor: colors.background.tertiary,
            color: colors.accent.primary
          }}
        >
          --lumina-{token.name.toLowerCase().replace(/\s+/g, '-')}: {formatTokenValue(token.value)};
        </code>
      </div>

      {/* Metadata */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: colors.background.tertiary }}
      >
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: colors.text.tertiary }}>Created</span>
            <p style={{ color: colors.text.secondary }}>
              {new Date(token.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span style={{ color: colors.text.tertiary }}>Updated</span>
            <p style={{ color: colors.text.secondary }}>
              {new Date(token.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TOKEN VALUE EDITOR
// ============================================================================

interface TokenValueEditorProps {
  token: DesignToken;
  onUpdate: (updates: Partial<DesignToken>) => void;
}

const TokenValueEditor: React.FC<TokenValueEditorProps> = ({ token, onUpdate }) => {
  switch (token.value.type) {
    case 'color':
      return (
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={token.value.value}
            onChange={e => onUpdate({ value: { type: 'color', value: e.target.value } })}
            className="w-16 h-10 rounded cursor-pointer"
            style={{ backgroundColor: 'transparent' }}
          />
          <input
            type="text"
            value={token.value.value}
            onChange={e => onUpdate({ value: { type: 'color', value: e.target.value } })}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.primary,
              border: `1px solid ${colors.border.subtle}`
            }}
          />
        </div>
      );

    case 'dimension':
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(token.value as DimensionValue).value}
            onChange={e => onUpdate({
              value: {
                type: 'dimension',
                value: parseFloat(e.target.value) || 0,
                unit: (token.value as DimensionValue).unit
              }
            })}
            className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.primary,
              border: `1px solid ${colors.border.subtle}`
            }}
          />
          <select
            value={(token.value as DimensionValue).unit}
            onChange={e => onUpdate({
              value: {
                type: 'dimension',
                value: (token.value as DimensionValue).value,
                unit: e.target.value as any
              }
            })}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.primary,
              border: `1px solid ${colors.border.subtle}`
            }}
          >
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="em">em</option>
            <option value="%">%</option>
            <option value="vw">vw</option>
            <option value="vh">vh</option>
          </select>
        </div>
      );

    default:
      return (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: colors.background.tertiary,
            color: colors.text.secondary
          }}
        >
          {formatTokenValue(token.value)}
        </div>
      );
  }
};

// ============================================================================
// TOKEN OVERVIEW
// ============================================================================

interface TokenOverviewProps {
  tokens: DesignToken[];
}

const TokenOverview: React.FC<TokenOverviewProps> = ({ tokens }) => {
  const colorTokens = tokens.filter(t => t.value.type === 'color');
  const typographyTokens = tokens.filter(t => t.value.type === 'typography');
  const spacingTokens = tokens.filter(t => t.category === 'spacing');

  return (
    <div>
      <h3 className="type-subsection mb-6" style={{ color: colors.text.primary }}>
        Token Overview
      </h3>

      {/* Color Palette */}
      <div className="mb-8">
        <h4 className="type-body-sm font-semibold mb-3" style={{ color: colors.text.secondary }}>
          Color Palette
        </h4>
        <div className="flex flex-wrap gap-2">
          {colorTokens.slice(0, 16).map(token => (
            <div key={token.id} className="group relative">
              <div
                className="w-12 h-12 rounded-lg border cursor-pointer transition-transform hover:scale-110"
                style={{
                  backgroundColor: (token.value as ColorValue).value,
                  borderColor: colors.border.subtle
                }}
              />
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  backgroundColor: colors.background.elevated,
                  color: colors.text.primary
                }}
              >
                {token.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Scale */}
      <div className="mb-8">
        <h4 className="type-body-sm font-semibold mb-3" style={{ color: colors.text.secondary }}>
          Typography Scale
        </h4>
        <div className="space-y-3">
          {typographyTokens.slice(0, 6).map(token => {
            const typo = (token.value as TypographyValue).value;
            return (
              <div key={token.id} className="flex items-baseline gap-4">
                <span
                  className="w-24 text-xs"
                  style={{ color: colors.text.tertiary }}
                >
                  {token.name}
                </span>
                <span
                  style={{
                    fontFamily: typo.fontFamily,
                    fontSize: typo.fontSize,
                    fontWeight: typo.fontWeight,
                    color: colors.text.primary
                  }}
                >
                  The quick brown fox
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spacing Scale */}
      <div>
        <h4 className="type-body-sm font-semibold mb-3" style={{ color: colors.text.secondary }}>
          Spacing Scale
        </h4>
        <div className="flex items-end gap-2">
          {spacingTokens.map(token => {
            const value = (token.value as DimensionValue).value;
            return (
              <div
                key={token.id}
                className="group relative flex flex-col items-center"
              >
                <div
                  className="w-4 rounded-t transition-all"
                  style={{
                    height: Math.min(value * 2, 100),
                    backgroundColor: colors.accent.primary
                  }}
                />
                <span className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                  {value}
                </span>
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    backgroundColor: colors.background.elevated,
                    color: colors.text.primary
                  }}
                >
                  {token.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CREATE TOKEN MODAL
// ============================================================================

interface CreateTokenModalProps {
  onClose: () => void;
  onCreate: (token: DesignToken) => void;
}

const CreateTokenModal: React.FC<CreateTokenModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TokenCategory>('colors');
  const [valueType, setValueType] = useState<'color' | 'dimension'>('color');
  const [colorValue, setColorValue] = useState('#6366f1');
  const [dimensionValue, setDimensionValue] = useState(16);
  const [dimensionUnit, setDimensionUnit] = useState<'px' | 'rem' | 'em'>('px');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;

    let value: TokenValue;
    if (valueType === 'color') {
      value = { type: 'color', value: colorValue };
    } else {
      value = { type: 'dimension', value: dimensionValue, unit: dimensionUnit };
    }

    const token = designTokensManager.createToken(name, category, value, {
      description: description || undefined
    });

    onCreate(token);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md p-6 rounded-xl"
        style={{ backgroundColor: colors.background.secondary }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="type-subsection mb-4" style={{ color: colors.text.primary }}>
          Create Token
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm block mb-1.5" style={{ color: colors.text.secondary }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Primary Blue"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: colors.background.tertiary,
                color: colors.text.primary,
                border: `1px solid ${colors.border.subtle}`
              }}
            />
          </div>

          <div>
            <label className="text-sm block mb-1.5" style={{ color: colors.text.secondary }}>
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as TokenCategory)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: colors.background.tertiary,
                color: colors.text.primary,
                border: `1px solid ${colors.border.subtle}`
              }}
            >
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1.5" style={{ color: colors.text.secondary }}>
              Value Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setValueType('color')}
                className="flex-1 py-2 text-sm rounded-lg transition-colors"
                style={{
                  backgroundColor: valueType === 'color' ? colors.accent.primary : colors.background.tertiary,
                  color: valueType === 'color' ? '#fff' : colors.text.secondary
                }}
              >
                Color
              </button>
              <button
                onClick={() => setValueType('dimension')}
                className="flex-1 py-2 text-sm rounded-lg transition-colors"
                style={{
                  backgroundColor: valueType === 'dimension' ? colors.accent.primary : colors.background.tertiary,
                  color: valueType === 'dimension' ? '#fff' : colors.text.secondary
                }}
              >
                Dimension
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm block mb-1.5" style={{ color: colors.text.secondary }}>
              Value
            </label>
            {valueType === 'color' ? (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorValue}
                  onChange={e => setColorValue(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={colorValue}
                  onChange={e => setColorValue(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
                  style={{
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    border: `1px solid ${colors.border.subtle}`
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dimensionValue}
                  onChange={e => setDimensionValue(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    border: `1px solid ${colors.border.subtle}`
                  }}
                />
                <select
                  value={dimensionUnit}
                  onChange={e => setDimensionUnit(e.target.value as any)}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    border: `1px solid ${colors.border.subtle}`
                  }}
                >
                  <option value="px">px</option>
                  <option value="rem">rem</option>
                  <option value="em">em</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm block mb-1.5" style={{ color: colors.text.secondary }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{
                backgroundColor: colors.background.tertiary,
                color: colors.text.primary,
                border: `1px solid ${colors.border.subtle}`
              }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg"
            style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-2 text-sm rounded-lg transition-colors"
            style={{
              backgroundColor: name.trim() ? colors.accent.primary : colors.background.tertiary,
              color: name.trim() ? '#fff' : colors.text.tertiary
            }}
          >
            Create
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// EXPORT MODAL
// ============================================================================

interface ExportModalProps {
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const [format, setFormat] = useState<TokenExportFormat>('css');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const exported = designTokensManager.exportTokens({
      format,
      includeDescriptions: true
    });
    setPreview(exported);
  }, [format]);

  const handleDownload = () => {
    const extensions: Record<TokenExportFormat, string> = {
      css: 'css',
      scss: 'scss',
      less: 'less',
      json: 'json',
      js: 'js',
      ts: 'ts',
      figma: 'json',
      'style-dictionary': 'json'
    };

    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-tokens.${extensions[format]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(preview);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl flex flex-col"
        style={{ backgroundColor: colors.background.secondary }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b" style={{ borderColor: colors.border.subtle }}>
          <h3 className="type-subsection" style={{ color: colors.text.primary }}>
            Export Tokens
          </h3>
        </div>

        <div className="p-4 border-b" style={{ borderColor: colors.border.subtle }}>
          <div className="flex gap-2">
            {(['css', 'scss', 'json', 'js', 'ts', 'style-dictionary'] as TokenExportFormat[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                style={{
                  backgroundColor: format === f ? colors.accent.primary : colors.background.tertiary,
                  color: format === f ? '#fff' : colors.text.secondary
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <pre
            className="text-sm font-mono p-4 rounded-lg overflow-auto"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.primary
            }}
          >
            {preview}
          </pre>
        </div>

        <div className="p-4 border-t flex gap-3" style={{ borderColor: colors.border.subtle }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg"
            style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm rounded-lg"
            style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
          >
            <i className="fa-solid fa-copy mr-1.5" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="ml-auto px-4 py-2 text-sm rounded-lg"
            style={{ backgroundColor: colors.accent.primary, color: '#fff' }}
          >
            <i className="fa-solid fa-download mr-1.5" />
            Download
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DesignTokensPanel;
