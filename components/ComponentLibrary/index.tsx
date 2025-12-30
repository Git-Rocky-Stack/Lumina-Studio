// ============================================================================
// COMPONENT LIBRARY - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { componentLibrary } from '../../services/componentLibraryService';
import { CATEGORY_INFO } from '../../types/componentLibrary';
import type {
  MasterComponent,
  ComponentInstance,
  ComponentCategory,
  ComponentCollection,
  ComponentVariant,
  ComponentProperty
} from '../../types/componentLibrary';
import type { DesignElement } from '../../types';

// ============================================================================
// COMPONENT LIBRARY PANEL
// ============================================================================

interface ComponentLibraryPanelProps {
  selectedElements: DesignElement[];
  onInsertComponent: (elements: DesignElement[], x: number, y: number) => void;
  onCreateComponent: (elements: DesignElement[]) => void;
}

export const ComponentLibraryPanel: React.FC<ComponentLibraryPanelProps> = ({
  selectedElements,
  onInsertComponent,
  onCreateComponent
}) => {
  const [components, setComponents] = useState<MasterComponent[]>([]);
  const [collections, setCollections] = useState<ComponentCollection[]>([]);
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<MasterComponent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setComponents(componentLibrary.getAllComponents());
    setCollections(componentLibrary.getCollections());

    componentLibrary.setOnComponentsChange(setComponents);
  }, []);

  const filteredComponents = useMemo(() => {
    let result = components;

    if (activeCategory !== 'all') {
      result = result.filter(c => c.category === activeCategory);
    }

    if (searchQuery) {
      const searchResults = componentLibrary.searchComponents(searchQuery);
      result = searchResults.map(r => r.component);
    }

    return result.sort((a, b) => b.usageCount - a.usageCount);
  }, [components, activeCategory, searchQuery]);

  const handleCreateComponent = useCallback(() => {
    if (selectedElements.length === 0) return;
    setShowCreateModal(true);
  }, [selectedElements]);

  const handleInsert = useCallback((component: MasterComponent) => {
    const instance = componentLibrary.createInstance(component.id, {
      x: 100,
      y: 100
    });

    if (instance) {
      onInsertComponent(instance.resolvedElements, instance.x, instance.y);
    }
  }, [onInsertComponent]);

  return (
    <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm tracking-wide">COMPONENTS</h3>
          <button
            onClick={handleCreateComponent}
            disabled={selectedElements.length === 0}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-plus mr-1.5"></i>
            Create
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-xs"></i>
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-white/50 focus:outline-none focus:bg-white/20"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-2 border-b border-slate-100 overflow-x-auto">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as ComponentCategory)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                activeCategory === key
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <i className={`fas ${info.icon} mr-1`}></i>
              {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Component grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredComponents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <i className="fas fa-puzzle-piece text-3xl mb-3 opacity-50"></i>
            <p className="text-xs">No components yet</p>
            <p className="text-[10px] mt-1">Select elements and create a component</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredComponents.map(component => (
              <ComponentCard
                key={component.id}
                component={component}
                onInsert={() => handleInsert(component)}
                onSelect={() => setSelectedComponent(component)}
                isSelected={selectedComponent?.id === component.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Component details */}
      <AnimatePresence>
        {selectedComponent && (
          <ComponentDetailsPanel
            component={selectedComponent}
            onClose={() => setSelectedComponent(null)}
            onInsert={() => handleInsert(selectedComponent)}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateComponentModal
            elements={selectedElements}
            onClose={() => setShowCreateModal(false)}
            onCreate={(name, category, description) => {
              componentLibrary.createComponent(selectedElements, {
                name,
                category,
                description
              });
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// COMPONENT CARD
// ============================================================================

interface ComponentCardProps {
  component: MasterComponent;
  onInsert: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  onInsert,
  onSelect,
  isSelected
}) => {
  const categoryInfo = CATEGORY_INFO[component.category];

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className={`relative bg-slate-50 rounded-xl overflow-hidden cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-rose-500' : 'hover:bg-slate-100'
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        {component.thumbnail ? (
          <img src={component.thumbnail} alt="" className="w-full h-full object-contain" />
        ) : (
          <i className={`fas ${categoryInfo.icon} text-2xl`} style={{ color: categoryInfo.color }}></i>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="font-bold text-xs text-slate-800 truncate">{component.name}</div>
        <div className="flex items-center justify-between mt-1">
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
            style={{ backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color }}
          >
            {categoryInfo.label}
          </span>
          <span className="text-[10px] text-slate-400">{component.usageCount}×</span>
        </div>
      </div>

      {/* Quick insert */}
      <button
        onClick={e => { e.stopPropagation(); onInsert(); }}
        className="absolute top-2 right-2 w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all"
      >
        <i className="fas fa-plus text-xs"></i>
      </button>
    </motion.div>
  );
};

// ============================================================================
// COMPONENT DETAILS PANEL
// ============================================================================

interface ComponentDetailsPanelProps {
  component: MasterComponent;
  onClose: () => void;
  onInsert: () => void;
}

const ComponentDetailsPanel: React.FC<ComponentDetailsPanelProps> = ({
  component,
  onClose,
  onInsert
}) => {
  const [activeVariant, setActiveVariant] = useState(component.defaultVariantId);
  const categoryInfo = CATEGORY_INFO[component.category];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-t-2xl shadow-xl z-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${categoryInfo.color}20` }}
          >
            <i className={`fas ${categoryInfo.icon}`} style={{ color: categoryInfo.color }}></i>
          </div>
          <div>
            <div className="font-bold text-sm text-slate-800">{component.name}</div>
            <div className="text-[10px] text-slate-500">{component.variants.length} variants</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <i className="fas fa-times text-slate-400"></i>
        </button>
      </div>

      {/* Description */}
      {component.description && (
        <p className="px-3 py-2 text-xs text-slate-500 border-b border-slate-100">
          {component.description}
        </p>
      )}

      {/* Variants */}
      {component.variants.length > 1 && (
        <div className="p-3 border-b border-slate-100">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Variants
          </label>
          <div className="flex gap-1 mt-2 flex-wrap">
            {component.variants.map(variant => (
              <button
                key={variant.id}
                onClick={() => setActiveVariant(variant.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeVariant === variant.id
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-3 flex gap-2">
        <button
          onClick={onInsert}
          className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <i className="fas fa-plus mr-1.5"></i>
          Insert Component
        </button>
        <button
          onClick={() => componentLibrary.duplicateComponent(component.id)}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
        >
          <i className="fas fa-copy"></i>
        </button>
        <button
          onClick={() => {
            if (confirm('Delete this component?')) {
              componentLibrary.deleteComponent(component.id);
              onClose();
            }
          }}
          className="px-4 py-2.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// CREATE COMPONENT MODAL
// ============================================================================

interface CreateComponentModalProps {
  elements: DesignElement[];
  onClose: () => void;
  onCreate: (name: string, category: ComponentCategory, description?: string) => void;
}

const CreateComponentModal: React.FC<CreateComponentModalProps> = ({
  elements,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('New Component');
  const [category, setCategory] = useState<ComponentCategory>('custom');
  const [description, setDescription] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
          <h3 className="font-black text-sm">CREATE COMPONENT</h3>
          <p className="text-[10px] text-white/70 mt-1">
            {elements.length} element{elements.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Component Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              placeholder="Enter component name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Category
            </label>
            <div className="grid grid-cols-3 gap-1 mt-1.5">
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key as ComponentCategory)}
                  className={`p-2 rounded-lg text-xs font-bold transition-colors ${
                    category === key
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={category === key ? { backgroundColor: info.color } : {}}
                >
                  <i className={`fas ${info.icon} mr-1`}></i>
                  {info.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
              rows={2}
              placeholder="Describe this component..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, category, description || undefined)}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            Create Component
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// COMPONENT INSTANCE INDICATOR
// ============================================================================

interface ComponentInstanceIndicatorProps {
  instance: ComponentInstance;
  onDetach: () => void;
  onSwapVariant: (variantId: string) => void;
}

export const ComponentInstanceIndicator: React.FC<ComponentInstanceIndicatorProps> = ({
  instance,
  onDetach,
  onSwapVariant
}) => {
  const component = componentLibrary.getComponent(instance.masterComponentId);
  if (!component) return null;

  const categoryInfo = CATEGORY_INFO[component.category];

  return (
    <div className="absolute -top-8 left-0 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-slate-200 px-2 py-1">
      <div
        className="w-4 h-4 rounded flex items-center justify-center"
        style={{ backgroundColor: `${categoryInfo.color}20` }}
      >
        <i className={`fas ${categoryInfo.icon} text-[8px]`} style={{ color: categoryInfo.color }}></i>
      </div>
      <span className="text-[10px] font-bold text-slate-700">{component.name}</span>

      {component.variants.length > 1 && (
        <select
          value={instance.variantId}
          onChange={e => onSwapVariant(e.target.value)}
          className="ml-1 text-[10px] bg-slate-100 rounded px-1 py-0.5"
        >
          {component.variants.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      )}

      <button
        onClick={onDetach}
        className="ml-1 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
        title="Detach instance"
      >
        <i className="fas fa-unlink text-[8px]"></i>
      </button>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ComponentLibraryPanel;
