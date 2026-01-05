// =============================================
// Brand Kit Panel Component
// Manage brand colors, fonts, and compliance
// =============================================

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  RefreshCw,
  Shield,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { brandKit, BrandKit, ComplianceCheck, ComplianceIssue } from '../../services/brandKitService';

// =============================================
// Types
// =============================================

interface BrandKitPanelProps {
  className?: string;
  onApplyBrandKit?: (kit: BrandKit) => void;
  canvasElements?: any[];
}

// =============================================
// Component
// =============================================

export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({
  className = '',
  onApplyBrandKit,
  canvasElements = [],
}) => {
  // State
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [selectedKit, setSelectedKit] = useState<BrandKit | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<BrandKit>>({});
  const [compliance, setCompliance] = useState<ComplianceCheck | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('colors');
  const [isLoading, setIsLoading] = useState(true);

  // =============================================
  // Effects
  // =============================================

  useEffect(() => {
    loadBrandKits();
  }, []);

  useEffect(() => {
    if (selectedKit && canvasElements.length > 0) {
      checkCompliance();
    }
  }, [selectedKit, canvasElements]);

  // =============================================
  // Data Loading
  // =============================================

  const loadBrandKits = async () => {
    setIsLoading(true);
    const kits = await brandKit.getBrandKits();
    setBrandKits(kits);

    // Select default kit
    const defaultKit = kits.find(k => k.is_default) || kits[0];
    if (defaultKit) {
      setSelectedKit(defaultKit);
    }
    setIsLoading(false);
  };

  const checkCompliance = async () => {
    if (!selectedKit || canvasElements.length === 0) return;
    const result = await brandKit.checkCompliance(selectedKit, canvasElements);
    setCompliance(result);
  };

  // =============================================
  // Handlers
  // =============================================

  const handleCreateKit = async () => {
    const newKit = await brandKit.createBrandKit({
      name: 'New Brand Kit',
      primary_color: '#6366f1',
    });

    if (newKit) {
      setBrandKits([...brandKits, newKit]);
      setSelectedKit(newKit);
      setIsEditing(true);
      setEditForm(newKit);
    }
  };

  const handleSaveKit = async () => {
    if (!selectedKit || !editForm) return;

    const updated = await brandKit.updateBrandKit(selectedKit.id, editForm);
    if (updated) {
      setBrandKits(brandKits.map(k => k.id === updated.id ? updated : k));
      setSelectedKit(updated);
      setIsEditing(false);
    }
  };

  const handleDeleteKit = async () => {
    if (!selectedKit) return;

    const confirmed = await brandKit.deleteBrandKit(selectedKit.id);
    if (confirmed) {
      const newKits = brandKits.filter(k => k.id !== selectedKit.id);
      setBrandKits(newKits);
      setSelectedKit(newKits[0] || null);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedKit) return;

    const updated = await brandKit.setDefaultBrandKit(selectedKit.id);
    if (updated) {
      setBrandKits(brandKits.map(k => ({
        ...k,
        is_default: k.id === selectedKit.id,
      })));
      setSelectedKit({ ...selectedKit, is_default: true });
    }
  };

  const handleApplyColors = () => {
    if (!selectedKit || !onApplyBrandKit) return;
    onApplyBrandKit(selectedKit);
  };

  // =============================================
  // Render Helpers
  // =============================================

  const renderColorPicker = (
    label: string,
    value: string,
    onChange: (color: string) => void
  ) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          disabled={!isEditing}
        />
        <span className="text-xs text-zinc-500 font-mono">{value}</span>
      </div>
    </div>
  );

  const renderComplianceScore = () => {
    if (!compliance) return null;

    const score = compliance.overall_score || 0;
    const scoreColor = score >= 0.8 ? 'emerald' : score >= 0.5 ? 'amber' : 'red';

    return (
      <div className={`p-4 rounded-xl bg-${scoreColor}-500/10 border border-${scoreColor}-500/20`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 text-${scoreColor}-400`} />
            <span className="text-sm font-medium text-white">Brand Compliance</span>
          </div>
          <span className={`text-lg font-bold text-${scoreColor}-400`}>
            {Math.round(score * 100)}%
          </span>
        </div>

        {/* Issue counts */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-zinc-900/50">
            <div className="text-lg font-bold text-red-400">{compliance.color_issues}</div>
            <div className="text-xs text-zinc-500">Colors</div>
          </div>
          <div className="p-2 rounded-lg bg-zinc-900/50">
            <div className="text-lg font-bold text-amber-400">{compliance.font_issues}</div>
            <div className="text-xs text-zinc-500">Fonts</div>
          </div>
          <div className="p-2 rounded-lg bg-zinc-900/50">
            <div className="text-lg font-bold text-blue-400">{compliance.spacing_issues}</div>
            <div className="text-xs text-zinc-500">Spacing</div>
          </div>
          <div className="p-2 rounded-lg bg-zinc-900/50">
            <div className="text-lg font-bold text-zinc-400">{compliance.other_issues}</div>
            <div className="text-xs text-zinc-500">Other</div>
          </div>
        </div>
      </div>
    );
  };

  const renderIssueList = () => {
    if (!compliance || !compliance.issues?.length) return null;

    return (
      <div className="space-y-2">
        {compliance.issues.slice(0, 5).map((issue: ComplianceIssue, index: number) => (
          <div
            key={index}
            className={`p-3 rounded-lg flex items-start gap-3 ${
              issue.severity === 'error'
                ? 'bg-red-500/10 border border-red-500/20'
                : issue.severity === 'warning'
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-blue-500/10 border border-blue-500/20'
            }`}
          >
            {issue.severity === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            ) : issue.severity === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300">{issue.message}</p>
              {issue.current_value && issue.expected_value && (
                <p className="text-xs text-zinc-500 mt-1">
                  Current: {issue.current_value} → Expected: {issue.expected_value}
                </p>
              )}
            </div>
          </div>
        ))}
        {compliance.issues.length > 5 && (
          <p className="text-xs text-zinc-500 text-center">
            +{compliance.issues.length - 5} more issues
          </p>
        )}
      </div>
    );
  };

  // =============================================
  // Render
  // =============================================

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`bg-zinc-900/95 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-violet-400" />
            <h3 className="font-medium text-white">Brand Kit</h3>
          </div>
          <button
            onClick={handleCreateKit}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white
              transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Kit Selector */}
        {brandKits.length > 0 && (
          <select
            value={selectedKit?.id || ''}
            onChange={(e) => {
              const kit = brandKits.find(k => k.id === e.target.value);
              setSelectedKit(kit || null);
              setIsEditing(false);
            }}
            className="w-full mt-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
              text-sm text-white focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          >
            {brandKits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.name} {kit.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {selectedKit ? (
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Edit Mode Toggle */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveKit}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium
                    bg-violet-500 text-white hover:bg-violet-600 transition-colors
                    flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(selectedKit);
                  }}
                  className="px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white
                    hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditForm(selectedKit);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-zinc-400
                    hover:text-white hover:bg-zinc-800 transition-colors
                    flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                {!selectedKit.is_default && (
                  <button
                    onClick={handleSetDefault}
                    className="px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white
                      hover:bg-zinc-800 transition-colors"
                  >
                    Set Default
                  </button>
                )}
              </>
            )}
          </div>

          {/* Name (in edit mode) */}
          {isEditing && (
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Brand Kit Name"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                text-sm text-white placeholder-zinc-500 focus:border-violet-500/50"
            />
          )}

          {/* Colors Section */}
          <div className="border border-zinc-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'colors' ? '' : 'colors')}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">Colors</span>
              </div>
              {expandedSection === 'colors' ? (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            {expandedSection === 'colors' && (
              <div className="px-4 pb-4 space-y-3 border-t border-zinc-700/50 pt-3">
                {renderColorPicker(
                  'Primary',
                  isEditing ? (editForm.primary_color || '') : selectedKit.primary_color,
                  (color) => setEditForm({ ...editForm, primary_color: color })
                )}
                {renderColorPicker(
                  'Secondary',
                  isEditing ? (editForm.secondary_color || '') : (selectedKit.secondary_color || ''),
                  (color) => setEditForm({ ...editForm, secondary_color: color })
                )}
                {renderColorPicker(
                  'Accent',
                  isEditing ? (editForm.accent_color || '') : (selectedKit.accent_color || ''),
                  (color) => setEditForm({ ...editForm, accent_color: color })
                )}
                {renderColorPicker(
                  'Background',
                  isEditing ? (editForm.background_color || '') : (selectedKit.background_color || '#ffffff'),
                  (color) => setEditForm({ ...editForm, background_color: color })
                )}
                {renderColorPicker(
                  'Text',
                  isEditing ? (editForm.text_color || '') : (selectedKit.text_color || '#111827'),
                  (color) => setEditForm({ ...editForm, text_color: color })
                )}
              </div>
            )}
          </div>

          {/* Typography Section */}
          <div className="border border-zinc-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'typography' ? '' : 'typography')}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">Typography</span>
              </div>
              {expandedSection === 'typography' ? (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            {expandedSection === 'typography' && (
              <div className="px-4 pb-4 space-y-3 border-t border-zinc-700/50 pt-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Heading Font</label>
                  <input
                    type="text"
                    value={isEditing ? (editForm.heading_font || '') : (selectedKit.heading_font || 'Inter')}
                    onChange={(e) => setEditForm({ ...editForm, heading_font: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                      text-sm text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Body Font</label>
                  <input
                    type="text"
                    value={isEditing ? (editForm.body_font || '') : (selectedKit.body_font || 'Inter')}
                    onChange={(e) => setEditForm({ ...editForm, body_font: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                      text-sm text-white disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Compliance Check */}
          {compliance && (
            <div className="space-y-3">
              {renderComplianceScore()}
              {renderIssueList()}

              {/* Auto-fix Button */}
              {compliance.issues && compliance.issues.length > 0 && (
                <button
                  onClick={handleApplyColors}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium
                    bg-violet-500/20 text-violet-400 hover:bg-violet-500/30
                    transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto-fix Brand Colors
                </button>
              )}
            </div>
          )}

          {/* Delete Button */}
          {!isEditing && brandKits.length > 1 && (
            <button
              onClick={handleDeleteKit}
              className="w-full px-4 py-2 rounded-lg text-sm text-red-400
                hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Kit
            </button>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Palette className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 mb-4">No brand kit selected</p>
          <button
            onClick={handleCreateKit}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500 text-white
              hover:bg-violet-600 transition-colors"
          >
            Create Brand Kit
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandKitPanel;
