// ============================================
// AnnotationTemplatesGallery Component
// Browse, preview, and apply annotation templates
// ============================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Star,
  Download,
  Trash2,
  Search,
  Filter,
  Layout,
  FileText,
  Briefcase,
  Scale,
  GraduationCap,
  User,
  Check,
} from 'lucide-react';
import type { AnnotationTemplate } from '../hooks/useEnhancedAnnotations';

interface AnnotationTemplatesGalleryProps {
  templates: AnnotationTemplate[];
  selectedAnnotationIds: string[];
  onApplyTemplate: (templateId: string, pageNumber: number) => void;
  onSaveAsTemplate: (
    name: string,
    description: string,
    annotationIds: string[],
    category: AnnotationTemplate['category']
  ) => void;
  onDeleteTemplate: (templateId: string) => void;
  currentPage: number;
  className?: string;
}

const CATEGORY_CONFIG = {
  review: {
    icon: FileText,
    label: 'Review',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  legal: {
    icon: Scale,
    label: 'Legal',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  educational: {
    icon: GraduationCap,
    label: 'Educational',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  technical: {
    icon: Layout,
    label: 'Technical',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  business: {
    icon: Briefcase,
    label: 'Business',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  custom: {
    icon: User,
    label: 'Custom',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
};

export const AnnotationTemplatesGallery: React.FC<
  AnnotationTemplatesGalleryProps
> = ({
  templates,
  selectedAnnotationIds,
  onApplyTemplate,
  onSaveAsTemplate,
  onDeleteTemplate,
  currentPage,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    AnnotationTemplate['category'] | 'all'
  >('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom' as AnnotationTemplate['category'],
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'all' || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  // Handle save new template
  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim() || selectedAnnotationIds.length === 0) return;

    onSaveAsTemplate(
      newTemplate.name.trim(),
      newTemplate.description.trim(),
      selectedAnnotationIds,
      newTemplate.category
    );

    setNewTemplate({ name: '', description: '', category: 'custom' });
    setIsCreating(false);
  };

  // Get category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { all: templates.length };
    templates.forEach((template) => {
      stats[template.category] = (stats[template.category] || 0) + 1;
    });
    return stats;
  }, [templates]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">Templates</h3>
          <button
            onClick={() => setIsCreating(true)}
            disabled={selectedAnnotationIds.length === 0}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              selectedAnnotationIds.length === 0
                ? 'Select annotations to create a template'
                : 'Create template from selection'
            }
          >
            <Plus className="w-3.5 h-3.5" />
            Save as Template
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          <CategoryButton
            icon={Filter}
            label="All"
            count={categoryStats.all || 0}
            isActive={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          />
          {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map(
            (category) => {
              const config = CATEGORY_CONFIG[category];
              return (
                <CategoryButton
                  key={category}
                  icon={config.icon}
                  label={config.label}
                  count={categoryStats[category] || 0}
                  isActive={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                />
              );
            }
          )}
        </div>
      </div>

      {/* Create Template Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-indigo-50 border-b border-indigo-100"
          >
            <h4 className="text-xs font-bold text-indigo-900 mb-3">
              Create Template from {selectedAnnotationIds.length} annotation
              {selectedAnnotationIds.length !== 1 ? 's' : ''}
            </h4>

            <input
              type="text"
              value={newTemplate.name}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, name: e.target.value })
              }
              placeholder="Template name"
              className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />

            <textarea
              value={newTemplate.description}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, description: e.target.value })
              }
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
              rows={2}
            />

            <select
              value={newTemplate.category}
              onChange={(e) =>
                setNewTemplate({
                  ...newTemplate,
                  category: e.target.value as AnnotationTemplate['category'],
                })
              }
              className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            >
              {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewTemplate({ name: '', description: '', category: 'custom' });
                }}
                className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplate.name.trim()}
                className="flex-1 px-3 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Create Template
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => setSelectedTemplateId(template.id)}
                onApply={() => onApplyTemplate(template.id, currentPage)}
                onDelete={() => onDeleteTemplate(template.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Layout className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {searchQuery || selectedCategory !== 'all'
                ? 'No templates found'
                : 'No templates yet'}
            </p>
            <p className="text-xs text-slate-500 max-w-[200px]">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Create reusable annotation templates for faster workflows'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredTemplates.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              {filteredTemplates.length} template
              {filteredTemplates.length !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-500">
              {templates.reduce((sum, t) => sum + t.usageCount, 0)} total uses
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// CategoryButton Component
// ============================================

interface CategoryButtonProps {
  icon: React.ElementType;
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  icon: Icon,
  label,
  count,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
      isActive
        ? 'bg-indigo-100 text-indigo-700'
        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
    <span
      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
        isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600'
      }`}
    >
      {count}
    </span>
  </button>
);

// ============================================
// TemplateCard Component
// ============================================

interface TemplateCardProps {
  template: AnnotationTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onApply: () => void;
  onDelete: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  onApply,
  onDelete,
}) => {
  const config = CATEGORY_CONFIG[template.category];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`group relative bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`h-24 ${config.bgColor} flex items-center justify-center relative`}
      >
        <Icon className={`w-10 h-10 ${config.color} opacity-50`} />

        {/* Premium Badge */}
        {template.isPremium && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 rounded-md flex items-center gap-1">
            <Star className="w-3 h-3 text-white fill-current" />
            <span className="text-[10px] font-bold text-white">PRO</span>
          </div>
        )}

        {/* Annotation Count */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md">
          <span className="text-xs font-bold text-slate-700">
            {template.annotations.length} annotation
            {template.annotations.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-700 truncate mb-1">
              {template.name}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {template.description || 'No description'}
            </p>
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">
                +{template.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {template.usageCount} uses
          </span>
          <span>{template.createdBy}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Apply
          </button>

          {!template.isPublic && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this template?')) {
                  onDelete();
                }
              }}
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors"
              aria-label="Delete template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          layoutId="selectedIndicator"
          className="absolute inset-0 border-4 border-indigo-500 rounded-xl pointer-events-none"
        />
      )}
    </motion.div>
  );
};

export default AnnotationTemplatesGallery;
