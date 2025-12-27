// ============================================
// FormFieldPalette Component
// Draggable palette of form field tools
// ============================================

import React, { useCallback, useState } from 'react';
import type { FormFieldType } from '../types';

interface FormFieldTool {
  type: FormFieldType;
  label: string;
  icon: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
}

const FORM_FIELD_TOOLS: FormFieldTool[] = [
  {
    type: 'text',
    label: 'Text Field',
    icon: 'fa-font',
    description: 'Single line text input',
    defaultWidth: 200,
    defaultHeight: 32,
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: 'fa-align-left',
    description: 'Multi-line text input',
    defaultWidth: 300,
    defaultHeight: 100,
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: 'fa-check-square',
    description: 'Single checkbox option',
    defaultWidth: 24,
    defaultHeight: 24,
  },
  {
    type: 'radio',
    label: 'Radio Button',
    icon: 'fa-circle-dot',
    description: 'Radio button group',
    defaultWidth: 24,
    defaultHeight: 24,
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: 'fa-caret-square-down',
    description: 'Select from options',
    defaultWidth: 200,
    defaultHeight: 32,
  },
  {
    type: 'date',
    label: 'Date Picker',
    icon: 'fa-calendar',
    description: 'Date selection field',
    defaultWidth: 150,
    defaultHeight: 32,
  },
  {
    type: 'signature',
    label: 'Signature',
    icon: 'fa-signature',
    description: 'Digital signature capture',
    defaultWidth: 250,
    defaultHeight: 80,
  },
];

interface FormFieldPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onFieldSelect: (type: FormFieldType, defaultWidth: number, defaultHeight: number) => void;
  onDragStart?: (type: FormFieldType, defaultWidth: number, defaultHeight: number) => void;
  onDragEnd?: () => void;
  selectedType?: FormFieldType;
  className?: string;
}

export const FormFieldPalette: React.FC<FormFieldPaletteProps> = ({
  isOpen,
  onClose,
  onFieldSelect,
  onDragStart,
  onDragEnd,
  selectedType,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'input' | 'selection' | 'special'>('all');

  // Filter tools
  const filteredTools = FORM_FIELD_TOOLS.filter((tool) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tool.label.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.type.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (activeCategory === 'input') {
      return ['text', 'textarea'].includes(tool.type);
    }
    if (activeCategory === 'selection') {
      return ['checkbox', 'radio', 'dropdown'].includes(tool.type);
    }
    if (activeCategory === 'special') {
      return ['date', 'signature'].includes(tool.type);
    }

    return true;
  });

  // Handle tool click
  const handleToolClick = useCallback(
    (tool: FormFieldTool) => {
      onFieldSelect(tool.type, tool.defaultWidth, tool.defaultHeight);
    },
    [onFieldSelect]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent, tool: FormFieldTool) => {
      setIsDragging(true);
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'formField',
        fieldType: tool.type,
        defaultWidth: tool.defaultWidth,
        defaultHeight: tool.defaultHeight,
      }));

      if (onDragStart) {
        onDragStart(tool.type, tool.defaultWidth, tool.defaultHeight);
      }
    },
    [onDragStart]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd();
    }
  }, [onDragEnd]);

  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-0 left-0 w-72 bg-white rounded-br-2xl shadow-2xl border-r border-b border-slate-200 z-50 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <i className="fas fa-wpforms text-indigo-500"></i>
          <span className="text-sm font-bold text-slate-700">Form Fields</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fields..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex px-3 py-2 gap-1 border-b border-slate-100">
        {[
          { id: 'all', label: 'All' },
          { id: 'input', label: 'Input' },
          { id: 'selection', label: 'Selection' },
          { id: 'special', label: 'Special' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool Grid */}
      <div className="p-3 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {filteredTools.map((tool) => (
            <button
              key={tool.type}
              draggable
              onClick={() => handleToolClick(tool)}
              onDragStart={(e) => handleDragStart(e, tool)}
              onDragEnd={handleDragEnd}
              className={`p-3 rounded-xl border-2 transition-all text-left group cursor-grab active:cursor-grabbing ${
                selectedType === tool.type
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    selectedType === tool.type
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-500'
                  }`}
                >
                  <i className={`fas ${tool.icon} text-sm`}></i>
                </div>
                <span className="text-xs font-bold text-slate-700">{tool.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {tool.description}
              </p>
            </button>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="py-8 text-center">
            <i className="fas fa-search text-2xl text-slate-300 mb-2"></i>
            <p className="text-sm text-slate-400">No fields found</p>
          </div>
        )}
      </div>

      {/* Drag Hint */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <i className="fas fa-hand-pointer"></i>
          <span>Drag field onto document or click to select</span>
        </div>
      </div>

      {/* Quick Add Templates */}
      <div className="px-4 pb-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
          Quick Templates
        </p>
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'Name', fields: ['text'] },
            { label: 'Email', fields: ['text'] },
            { label: 'Phone', fields: ['text'] },
            { label: 'Address', fields: ['textarea'] },
            { label: 'Yes/No', fields: ['radio'] },
            { label: 'Agreement', fields: ['checkbox', 'signature'] },
          ].map((template) => (
            <button
              key={template.label}
              className="px-2 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded-md text-[10px] font-medium transition-colors"
              title={`Add ${template.label} field(s)`}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dragging indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-500/10 rounded-br-2xl pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg">
              <i className="fas fa-arrows-alt mr-2"></i>
              Drop on document
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormFieldPalette;
