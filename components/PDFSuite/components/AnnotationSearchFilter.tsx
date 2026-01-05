// ============================================
// AnnotationSearchFilter Component
// Advanced search and filtering for annotations
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Tag,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react';
import type {
  EnhancedAnnotation,
  AnnotationFilters,
} from '../hooks/useEnhancedAnnotations';
import type { AnnotationType } from '../types';

interface AnnotationSearchFilterProps {
  annotations: EnhancedAnnotation[];
  onFilterChange: (filters: AnnotationFilters) => void;
  onSearch: (query: string) => void;
  availableAuthors: string[];
  availableLayers: Array<{ id: string; name: string; color: string }>;
  className?: string;
}

const ANNOTATION_TYPES: Array<{
  value: AnnotationType;
  label: string;
  icon: string;
}> = [
  { value: 'highlight', label: 'Highlight', icon: 'fa-highlighter' },
  { value: 'underline', label: 'Underline', icon: 'fa-underline' },
  { value: 'strikethrough', label: 'Strikethrough', icon: 'fa-strikethrough' },
  { value: 'note', label: 'Note', icon: 'fa-sticky-note' },
  { value: 'freeText', label: 'Text', icon: 'fa-font' },
  { value: 'stamp', label: 'Stamp', icon: 'fa-stamp' },
  { value: 'ink', label: 'Drawing', icon: 'fa-pen' },
  { value: 'redaction', label: 'Redaction', icon: 'fa-eraser' },
];

export const AnnotationSearchFilter: React.FC<AnnotationSearchFilterProps> = ({
  annotations,
  onFilterChange,
  onSearch,
  availableAuthors,
  availableLayers,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AnnotationFilters>({});

  // Handle search
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearch(query);
    },
    [onSearch]
  );

  // Handle filter change
  const updateFilters = useCallback(
    (newFilters: Partial<AnnotationFilters>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    onFilterChange({});
    setSearchQuery('');
    onSearch('');
  }, [onFilterChange, onSearch]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.types && filters.types.length > 0) count++;
    if (filters.authors && filters.authors.length > 0) count++;
    if (filters.layers && filters.layers.length > 0) count++;
    if (filters.dateRange) count++;
    if (filters.hasVoiceNotes !== undefined) count++;
    if (filters.hasAISuggestions !== undefined) count++;
    if (filters.isResolved !== undefined) count++;
    return count;
  }, [filters]);

  // Filtered results count
  const filteredCount = useMemo(() => {
    if (!searchQuery && activeFilterCount === 0) return annotations.length;

    let filtered = annotations;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ann) =>
          ann.contents?.toLowerCase().includes(query) ||
          ann.author?.toLowerCase().includes(query) ||
          ann.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters (simplified version)
    if (filters.types?.length) {
      filtered = filtered.filter((ann) => filters.types!.includes(ann.type));
    }
    if (filters.authors?.length) {
      filtered = filtered.filter((ann) =>
        filters.authors!.includes(ann.author || '')
      );
    }
    if (filters.layers?.length) {
      filtered = filtered.filter((ann) =>
        filters.layers!.includes(ann.layerId || '')
      );
    }

    return filtered.length;
  }, [annotations, searchQuery, filters, activeFilterCount]);

  return (
    <div className={`bg-white ${className}`}>
      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search annotations..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />

          {/* Filter Toggle */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {(searchQuery || activeFilterCount > 0) && (
              <button
                onClick={clearFilters}
                className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
                title="Clear all"
                aria-label="Clear all filters"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              aria-label="Toggle filters"
            >
              <Filter className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Results Count */}
        {(searchQuery || activeFilterCount > 0) && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-xs text-slate-500 mt-2"
          >
            {filteredCount} of {annotations.length} annotation
            {annotations.length !== 1 ? 's' : ''}
          </motion.p>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-slate-200 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Type Filter */}
              <FilterSection
                icon={SlidersHorizontal}
                label="Type"
                count={filters.types?.length || 0}
              >
                <div className="grid grid-cols-2 gap-2">
                  {ANNOTATION_TYPES.map((type) => (
                    <FilterCheckbox
                      key={type.value}
                      label={type.label}
                      icon={type.icon}
                      checked={filters.types?.includes(type.value) || false}
                      onChange={(checked) => {
                        const types = filters.types || [];
                        updateFilters({
                          types: checked
                            ? [...types, type.value]
                            : types.filter((t) => t !== type.value),
                        });
                      }}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Author Filter */}
              {availableAuthors.length > 0 && (
                <FilterSection
                  icon={User}
                  label="Author"
                  count={filters.authors?.length || 0}
                >
                  <div className="space-y-1">
                    {availableAuthors.map((author) => (
                      <FilterCheckbox
                        key={author}
                        label={author}
                        checked={filters.authors?.includes(author) || false}
                        onChange={(checked) => {
                          const authors = filters.authors || [];
                          updateFilters({
                            authors: checked
                              ? [...authors, author]
                              : authors.filter((a) => a !== author),
                          });
                        }}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Layer Filter */}
              {availableLayers.length > 1 && (
                <FilterSection
                  icon={Layers}
                  label="Layer"
                  count={filters.layers?.length || 0}
                >
                  <div className="space-y-1">
                    {availableLayers.map((layer) => (
                      <FilterCheckbox
                        key={layer.id}
                        label={layer.name}
                        checked={filters.layers?.includes(layer.id) || false}
                        onChange={(checked) => {
                          const layers = filters.layers || [];
                          updateFilters({
                            layers: checked
                              ? [...layers, layer.id]
                              : layers.filter((l) => l !== layer.id),
                          });
                        }}
                        color={layer.color}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Additional Filters */}
              <FilterSection icon={Tag} label="Additional">
                <div className="space-y-2">
                  <FilterToggle
                    label="Has voice notes"
                    checked={filters.hasVoiceNotes === true}
                    onChange={(checked) =>
                      updateFilters({ hasVoiceNotes: checked ? true : undefined })
                    }
                  />
                  <FilterToggle
                    label="Has AI suggestions"
                    checked={filters.hasAISuggestions === true}
                    onChange={(checked) =>
                      updateFilters({ hasAISuggestions: checked ? true : undefined })
                    }
                  />
                  <FilterToggle
                    label="Resolved"
                    checked={filters.isResolved === true}
                    onChange={(checked) =>
                      updateFilters({ isResolved: checked ? true : undefined })
                    }
                  />
                  <FilterToggle
                    label="Unresolved"
                    checked={filters.isResolved === false}
                    onChange={(checked) =>
                      updateFilters({ isResolved: checked ? false : undefined })
                    }
                  />
                </div>
              </FilterSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// FilterSection Component
// ============================================

interface FilterSectionProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  icon: Icon,
  label,
  count,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">{label}</span>
          {count !== undefined && count > 0 && (
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// FilterCheckbox Component
// ============================================

interface FilterCheckboxProps {
  label: string;
  icon?: string;
  color?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({
  label,
  icon,
  color,
  checked,
  onChange,
}) => (
  <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors">
    <div
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
        checked
          ? 'bg-indigo-600 border-indigo-600'
          : 'border-slate-300 group-hover:border-slate-400'
      }`}
    >
      {checked && <Check className="w-3 h-3 text-white" />}
    </div>

    {color && (
      <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
    )}

    {icon && <i className={`fas ${icon} text-xs text-slate-400`} />}

    <span className="text-xs text-slate-700 flex-1">{label}</span>

    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
  </label>
);

// ============================================
// FilterToggle Component
// ============================================

interface FilterToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const FilterToggle: React.FC<FilterToggleProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
    <span className="text-xs text-slate-700">{label}</span>

    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
    >
      <motion.div
        layout
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  </label>
);

export default AnnotationSearchFilter;
