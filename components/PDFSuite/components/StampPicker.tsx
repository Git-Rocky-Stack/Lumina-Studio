// ============================================
// StampPicker - Predefined and Custom Stamps
// ============================================

import React, { useState, useRef, useCallback } from 'react';

// Types
export type StampCategory = 'status' | 'review' | 'signature' | 'business' | 'symbols' | 'custom';

export interface Stamp {
  id: string;
  category: StampCategory;
  name: string;
  text?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  icon?: string;
  imageUrl?: string;
  isCustom?: boolean;
}

interface StampPickerProps {
  onSelectStamp: (stamp: Stamp) => void;
  customStamps?: Stamp[];
  onAddCustomStamp?: (stamp: Stamp) => void;
  onDeleteCustomStamp?: (stampId: string) => void;
  className?: string;
}

// Built-in stamps
const BUILT_IN_STAMPS: Record<StampCategory, Stamp[]> = {
  status: [
    { id: 'approved', category: 'status', name: 'Approved', text: 'APPROVED', color: '#16a34a', backgroundColor: '#dcfce7', borderColor: '#16a34a' },
    { id: 'rejected', category: 'status', name: 'Rejected', text: 'REJECTED', color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#dc2626' },
    { id: 'pending', category: 'status', name: 'Pending', text: 'PENDING', color: '#ca8a04', backgroundColor: '#fefce8', borderColor: '#ca8a04' },
    { id: 'draft', category: 'status', name: 'Draft', text: 'DRAFT', color: '#6b7280', backgroundColor: '#f3f4f6', borderColor: '#6b7280' },
    { id: 'final', category: 'status', name: 'Final', text: 'FINAL', color: '#2563eb', backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    { id: 'void', category: 'status', name: 'Void', text: 'VOID', color: '#dc2626', backgroundColor: 'transparent', borderColor: '#dc2626' },
  ],
  review: [
    { id: 'reviewed', category: 'review', name: 'Reviewed', text: 'REVIEWED', color: '#16a34a', backgroundColor: '#dcfce7', borderColor: '#16a34a' },
    { id: 'for-review', category: 'review', name: 'For Review', text: 'FOR REVIEW', color: '#ca8a04', backgroundColor: '#fefce8', borderColor: '#ca8a04' },
    { id: 'not-approved', category: 'review', name: 'Not Approved', text: 'NOT APPROVED', color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#dc2626' },
    { id: 'revision', category: 'review', name: 'Revision Required', text: 'REVISION REQUIRED', color: '#ea580c', backgroundColor: '#fff7ed', borderColor: '#ea580c' },
    { id: 'sign-here', category: 'review', name: 'Sign Here', text: 'SIGN HERE', color: '#2563eb', backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    { id: 'initial-here', category: 'review', name: 'Initial Here', text: 'INITIAL HERE', color: '#7c3aed', backgroundColor: '#f5f3ff', borderColor: '#7c3aed' },
  ],
  signature: [
    { id: 'signed', category: 'signature', name: 'Signed', text: 'SIGNED', color: '#2563eb', backgroundColor: 'transparent', borderColor: '#2563eb' },
    { id: 'witnessed', category: 'signature', name: 'Witnessed', text: 'WITNESSED', color: '#16a34a', backgroundColor: 'transparent', borderColor: '#16a34a' },
    { id: 'notarized', category: 'signature', name: 'Notarized', text: 'NOTARIZED', color: '#b45309', backgroundColor: 'transparent', borderColor: '#b45309' },
    { id: 'certified', category: 'signature', name: 'Certified', text: 'CERTIFIED', color: '#0891b2', backgroundColor: 'transparent', borderColor: '#0891b2' },
  ],
  business: [
    { id: 'confidential', category: 'business', name: 'Confidential', text: 'CONFIDENTIAL', color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#dc2626' },
    { id: 'copy', category: 'business', name: 'Copy', text: 'COPY', color: '#6b7280', backgroundColor: '#f3f4f6', borderColor: '#6b7280' },
    { id: 'original', category: 'business', name: 'Original', text: 'ORIGINAL', color: '#2563eb', backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    { id: 'urgent', category: 'business', name: 'Urgent', text: 'URGENT', color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#dc2626' },
    { id: 'paid', category: 'business', name: 'Paid', text: 'PAID', color: '#16a34a', backgroundColor: '#dcfce7', borderColor: '#16a34a' },
    { id: 'received', category: 'business', name: 'Received', text: 'RECEIVED', color: '#2563eb', backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  ],
  symbols: [
    { id: 'checkmark', category: 'symbols', name: 'Checkmark', icon: '✓', color: '#16a34a' },
    { id: 'crossmark', category: 'symbols', name: 'Cross', icon: '✗', color: '#dc2626' },
    { id: 'star', category: 'symbols', name: 'Star', icon: '★', color: '#ca8a04' },
    { id: 'arrow-right', category: 'symbols', name: 'Arrow Right', icon: '→', color: '#2563eb' },
    { id: 'arrow-left', category: 'symbols', name: 'Arrow Left', icon: '←', color: '#2563eb' },
    { id: 'question', category: 'symbols', name: 'Question', icon: '?', color: '#7c3aed' },
    { id: 'exclamation', category: 'symbols', name: 'Exclamation', icon: '!', color: '#dc2626' },
    { id: 'info', category: 'symbols', name: 'Info', icon: 'ⓘ', color: '#2563eb' },
  ],
  custom: []
};

const CATEGORY_INFO: Record<StampCategory, { label: string; icon: string }> = {
  status: { label: 'Status', icon: '📋' },
  review: { label: 'Review', icon: '✍️' },
  signature: { label: 'Signature', icon: '🔏' },
  business: { label: 'Business', icon: '💼' },
  symbols: { label: 'Symbols', icon: '✨' },
  custom: { label: 'Custom', icon: '🎨' },
};

export const StampPicker: React.FC<StampPickerProps> = ({
  onSelectStamp,
  customStamps = [],
  onAddCustomStamp,
  onDeleteCustomStamp,
  className = ''
}) => {
  const [activeCategory, setActiveCategory] = useState<StampCategory>('status');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStamp, setNewStamp] = useState<Partial<Stamp>>({
    text: '',
    color: '#000000',
    backgroundColor: '#ffffff',
    borderColor: '#000000',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get stamps for current category
  const stamps = activeCategory === 'custom'
    ? customStamps
    : BUILT_IN_STAMPS[activeCategory];

  // Handle image upload for custom stamp
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setNewStamp(prev => ({ ...prev, imageUrl }));
    };
    reader.readAsDataURL(file);
  }, []);

  // Create custom stamp
  const handleCreateStamp = useCallback(() => {
    if (!newStamp.text && !newStamp.imageUrl) return;

    const stamp: Stamp = {
      id: `custom-${Date.now()}`,
      category: 'custom',
      name: newStamp.text || 'Custom Stamp',
      text: newStamp.text,
      color: newStamp.color,
      backgroundColor: newStamp.backgroundColor,
      borderColor: newStamp.borderColor,
      imageUrl: newStamp.imageUrl,
      isCustom: true,
    };

    onAddCustomStamp?.(stamp);
    setShowCreateModal(false);
    setNewStamp({
      text: '',
      color: '#000000',
      backgroundColor: '#ffffff',
      borderColor: '#000000',
    });
  }, [newStamp, onAddCustomStamp]);

  // Render stamp preview
  const renderStamp = (stamp: Stamp, isLarge: boolean = false) => {
    const size = isLarge ? 'text-xl py-3 px-6' : 'text-xs py-1.5 px-3';

    if (stamp.imageUrl) {
      return (
        <img
          src={stamp.imageUrl}
          alt={stamp.name}
          className={`${isLarge ? 'max-h-16' : 'max-h-8'} object-contain`}
        />
      );
    }

    if (stamp.icon) {
      return (
        <span
          className={`${isLarge ? 'text-4xl' : 'text-2xl'}`}
          style={{ color: stamp.color }}
        >
          {stamp.icon}
        </span>
      );
    }

    return (
      <div
        className={`font-bold ${size} rounded border-2 whitespace-nowrap`}
        style={{
          color: stamp.color,
          backgroundColor: stamp.backgroundColor === 'transparent' ? 'transparent' : stamp.backgroundColor,
          borderColor: stamp.borderColor,
        }}
      >
        {stamp.text}
      </div>
    );
  };

  return (
    <div className={`bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Category Tabs */}
      <div className="flex flex-wrap border-b border-white/10">
        {(Object.keys(CATEGORY_INFO) as StampCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1 px-3 py-2 text-xs transition-colors ${
              activeCategory === cat
                ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{CATEGORY_INFO[cat].icon}</span>
            <span>{CATEGORY_INFO[cat].label}</span>
          </button>
        ))}
      </div>

      {/* Stamps Grid */}
      <div className="p-3">
        {stamps.length === 0 && activeCategory === 'custom' ? (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm mb-3">No custom stamps yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30"
            >
              Create Your First Stamp
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {stamps.map(stamp => (
              <button
                key={stamp.id}
                onClick={() => onSelectStamp(stamp)}
                className="group relative p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center min-h-[60px]"
              >
                {renderStamp(stamp)}

                {/* Delete button for custom stamps */}
                {stamp.isCustom && onDeleteCustomStamp && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomStamp(stamp.id);
                    }}
                    className="absolute top-1 right-1 p-1 rounded bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Button */}
      {activeCategory === 'custom' && stamps.length > 0 && (
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Custom Stamp
          </button>
        </div>
      )}

      {/* Create Stamp Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="type-subsection text-white">Create Custom Stamp</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded hover:bg-white/10 text-white/60"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Preview */}
              <div className="flex items-center justify-center p-6 bg-white/5 rounded-xl min-h-[100px]">
                {newStamp.text || newStamp.imageUrl ? (
                  renderStamp(newStamp as Stamp, true)
                ) : (
                  <span className="text-white/30">Preview</span>
                )}
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm text-white/70 mb-1">Stamp Text</label>
                <input
                  type="text"
                  value={newStamp.text || ''}
                  onChange={(e) => setNewStamp(prev => ({ ...prev, text: e.target.value.toUpperCase() }))}
                  placeholder="APPROVED"
                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-white border border-white/10 focus:border-purple-500/50 focus:outline-none"
                />
              </div>

              {/* Or upload image */}
              <div className="text-center text-white/50 text-xs">- OR -</div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-lg border border-dashed border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"
              >
                Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Colors */}
              {!newStamp.imageUrl && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={newStamp.color}
                      onChange={(e) => setNewStamp(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Background</label>
                    <input
                      type="color"
                      value={newStamp.backgroundColor}
                      onChange={(e) => setNewStamp(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Border</label>
                    <input
                      type="color"
                      value={newStamp.borderColor}
                      onChange={(e) => setNewStamp(prev => ({ ...prev, borderColor: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-white/10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStamp}
                disabled={!newStamp.text && !newStamp.imageUrl}
                className="flex-1 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Stamp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StampPicker;
