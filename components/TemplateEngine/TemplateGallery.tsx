import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TemplateCategory, OutputFormat, IndustryPreset } from '../../types/template';
import type { AITemplate } from '../../types/template';

interface TemplateGalleryProps {
  onSelectTemplate: (template: AITemplate) => void;
}

// Pre-built template library
const PRESET_TEMPLATES: AITemplate[] = [
  {
    id: 'preset_ig_product',
    name: 'Product Showcase',
    description: 'Clean product presentation with bold headline',
    category: TemplateCategory.SOCIAL_MEDIA,
    industry: [IndustryPreset.ECOMMERCE],
    tags: ['product', 'minimal', 'modern'],
    format: OutputFormat.INSTAGRAM_POST,
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    backgroundColor: '#FFFFFF',
    elements: [
      {
        id: 'el_1', type: 'shape', name: 'Background Accent',
        x: 0, y: 700, width: 1080, height: 380, rotation: 0, zIndex: 1,
        props: { shapeType: 'rectangle', fill: '#6366F1', opacity: 1, borderRadius: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_2', type: 'text', name: 'Headline',
        x: 60, y: 750, width: 960, height: 120, rotation: 0, zIndex: 2,
        props: { content: 'NEW ARRIVAL', fontFamily: 'Inter', fontSize: 72, fontWeight: 800, color: '#FFFFFF', alignment: 'center', lineHeight: 1.1, letterSpacing: 4 },
        locked: false, visible: true
      },
      {
        id: 'el_3', type: 'text', name: 'Subheadline',
        x: 60, y: 880, width: 960, height: 60, rotation: 0, zIndex: 3,
        props: { content: 'Discover our latest collection', fontFamily: 'Inter', fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.8)', alignment: 'center', lineHeight: 1.4, letterSpacing: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_4', type: 'shape', name: 'Image Placeholder',
        x: 140, y: 100, width: 800, height: 550, rotation: 0, zIndex: 0,
        props: { shapeType: 'rectangle', fill: '#F1F5F9', opacity: 1, borderRadius: 24 },
        locked: false, visible: true
      }
    ],
    layout: { type: 'centered', padding: { top: 60, right: 60, bottom: 60, left: 60 } },
    customizable: { text: true, images: true, colors: true, fonts: true },
    brandKitCompatible: true,
    popularity: 95,
    usageCount: 1250,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'preset_ig_story_promo',
    name: 'Flash Sale Story',
    description: 'Eye-catching promotion with countdown urgency',
    category: TemplateCategory.SOCIAL_MEDIA,
    industry: [IndustryPreset.ECOMMERCE],
    tags: ['sale', 'promo', 'urgent'],
    format: OutputFormat.INSTAGRAM_STORY,
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    backgroundColor: '#0F172A',
    elements: [
      {
        id: 'el_1', type: 'shape', name: 'Gradient Overlay',
        x: 0, y: 0, width: 1080, height: 1920, rotation: 0, zIndex: 0,
        props: { shapeType: 'rectangle', fill: 'linear-gradient(180deg, #6366F1 0%, #EC4899 100%)', opacity: 0.9, borderRadius: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_2', type: 'text', name: 'Sale Label',
        x: 340, y: 400, width: 400, height: 60, rotation: 0, zIndex: 2,
        props: { content: 'FLASH SALE', fontFamily: 'Inter', fontSize: 32, fontWeight: 700, color: '#FFFFFF', alignment: 'center', lineHeight: 1, letterSpacing: 8 },
        locked: false, visible: true
      },
      {
        id: 'el_3', type: 'text', name: 'Discount',
        x: 140, y: 500, width: 800, height: 300, rotation: 0, zIndex: 3,
        props: { content: '50% OFF', fontFamily: 'Inter', fontSize: 140, fontWeight: 900, color: '#FFFFFF', alignment: 'center', lineHeight: 1, letterSpacing: -2 },
        locked: false, visible: true
      },
      {
        id: 'el_4', type: 'text', name: 'Details',
        x: 140, y: 820, width: 800, height: 80, rotation: 0, zIndex: 4,
        props: { content: 'Everything in Store', fontFamily: 'Inter', fontSize: 36, fontWeight: 500, color: 'rgba(255,255,255,0.9)', alignment: 'center', lineHeight: 1.3, letterSpacing: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_5', type: 'shape', name: 'CTA Button',
        x: 290, y: 1500, width: 500, height: 80, rotation: 0, zIndex: 5,
        props: { shapeType: 'rectangle', fill: '#FFFFFF', opacity: 1, borderRadius: 40 },
        locked: false, visible: true
      },
      {
        id: 'el_6', type: 'text', name: 'CTA Text',
        x: 290, y: 1510, width: 500, height: 60, rotation: 0, zIndex: 6,
        props: { content: 'SHOP NOW', fontFamily: 'Inter', fontSize: 24, fontWeight: 700, color: '#0F172A', alignment: 'center', lineHeight: 1, letterSpacing: 2 },
        locked: false, visible: true
      }
    ],
    layout: { type: 'centered', padding: { top: 100, right: 60, bottom: 100, left: 60 } },
    customizable: { text: true, images: true, colors: true, fonts: true },
    brandKitCompatible: true,
    popularity: 88,
    usageCount: 890,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'preset_linkedin',
    name: 'Professional Announcement',
    description: 'Corporate style for business updates',
    category: TemplateCategory.SOCIAL_MEDIA,
    industry: [IndustryPreset.TECHNOLOGY, IndustryPreset.FINANCE],
    tags: ['professional', 'corporate', 'announcement'],
    format: OutputFormat.LINKEDIN_POST,
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1',
    backgroundColor: '#F8FAFC',
    elements: [
      {
        id: 'el_1', type: 'shape', name: 'Left Accent',
        x: 0, y: 0, width: 12, height: 627, rotation: 0, zIndex: 1,
        props: { shapeType: 'rectangle', fill: '#3B82F6', opacity: 1, borderRadius: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_2', type: 'text', name: 'Category',
        x: 60, y: 50, width: 200, height: 32, rotation: 0, zIndex: 2,
        props: { content: 'ANNOUNCEMENT', fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: '#3B82F6', alignment: 'left', lineHeight: 1, letterSpacing: 2 },
        locked: false, visible: true
      },
      {
        id: 'el_3', type: 'text', name: 'Headline',
        x: 60, y: 100, width: 700, height: 150, rotation: 0, zIndex: 3,
        props: { content: 'Introducing Our Latest Innovation', fontFamily: 'Inter', fontSize: 48, fontWeight: 700, color: '#0F172A', alignment: 'left', lineHeight: 1.2, letterSpacing: -1 },
        locked: false, visible: true
      },
      {
        id: 'el_4', type: 'text', name: 'Body',
        x: 60, y: 270, width: 600, height: 120, rotation: 0, zIndex: 4,
        props: { content: 'We are excited to share this milestone with our community. This represents months of dedicated work and collaboration.', fontFamily: 'Inter', fontSize: 20, fontWeight: 400, color: '#64748B', alignment: 'left', lineHeight: 1.6, letterSpacing: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_5', type: 'shape', name: 'Decorative Circle',
        x: 900, y: 150, width: 300, height: 300, rotation: 0, zIndex: 0,
        props: { shapeType: 'circle', fill: '#DBEAFE', opacity: 0.5, borderRadius: 0 },
        locked: false, visible: true
      }
    ],
    layout: { type: 'asymmetric', padding: { top: 50, right: 60, bottom: 50, left: 60 } },
    customizable: { text: true, images: true, colors: true, fonts: true },
    brandKitCompatible: true,
    popularity: 82,
    usageCount: 650,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'preset_youtube',
    name: 'Bold Video Thumbnail',
    description: 'High-contrast design for maximum clicks',
    category: TemplateCategory.SOCIAL_MEDIA,
    industry: [IndustryPreset.ENTERTAINMENT, IndustryPreset.EDUCATION],
    tags: ['youtube', 'thumbnail', 'bold'],
    format: OutputFormat.YOUTUBE_THUMBNAIL,
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    backgroundColor: '#18181B',
    elements: [
      {
        id: 'el_1', type: 'shape', name: 'Gradient Background',
        x: 0, y: 0, width: 1280, height: 720, rotation: 0, zIndex: 0,
        props: { shapeType: 'rectangle', fill: '#18181B', opacity: 1, borderRadius: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_2', type: 'shape', name: 'Accent Shape',
        x: 800, y: -100, width: 600, height: 900, rotation: -15, zIndex: 1,
        props: { shapeType: 'rectangle', fill: '#EF4444', opacity: 1, borderRadius: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_3', type: 'text', name: 'Main Title',
        x: 50, y: 200, width: 700, height: 200, rotation: 0, zIndex: 3,
        props: { content: 'HOW TO MASTER', fontFamily: 'Inter', fontSize: 72, fontWeight: 900, color: '#FFFFFF', alignment: 'left', lineHeight: 1.1, letterSpacing: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_4', type: 'text', name: 'Subtitle',
        x: 50, y: 420, width: 600, height: 100, rotation: 0, zIndex: 4,
        props: { content: 'Complete Guide 2024', fontFamily: 'Inter', fontSize: 36, fontWeight: 600, color: '#FBBF24', alignment: 'left', lineHeight: 1.2, letterSpacing: 0 },
        locked: false, visible: true
      }
    ],
    layout: { type: 'asymmetric', padding: { top: 40, right: 40, bottom: 40, left: 40 } },
    customizable: { text: true, images: true, colors: true, fonts: true },
    brandKitCompatible: true,
    popularity: 91,
    usageCount: 1100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'preset_quote',
    name: 'Inspirational Quote',
    description: 'Elegant typography for quotes and testimonials',
    category: TemplateCategory.SOCIAL_MEDIA,
    industry: [IndustryPreset.GENERAL],
    tags: ['quote', 'minimal', 'elegant'],
    format: OutputFormat.INSTAGRAM_POST,
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    backgroundColor: '#FEF3C7',
    elements: [
      {
        id: 'el_1', type: 'text', name: 'Quote Mark',
        x: 80, y: 200, width: 200, height: 200, rotation: 0, zIndex: 1,
        props: { content: '"', fontFamily: 'Playfair Display', fontSize: 280, fontWeight: 700, color: '#F59E0B', alignment: 'left', lineHeight: 1, letterSpacing: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_2', type: 'text', name: 'Quote Text',
        x: 100, y: 350, width: 880, height: 350, rotation: 0, zIndex: 2,
        props: { content: 'The only way to do great work is to love what you do.', fontFamily: 'Playfair Display', fontSize: 52, fontWeight: 500, color: '#78350F', alignment: 'center', lineHeight: 1.4, letterSpacing: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_3', type: 'shape', name: 'Divider',
        x: 440, y: 730, width: 200, height: 3, rotation: 0, zIndex: 3,
        props: { shapeType: 'rectangle', fill: '#F59E0B', opacity: 1, borderRadius: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_4', type: 'text', name: 'Author',
        x: 100, y: 780, width: 880, height: 60, rotation: 0, zIndex: 4,
        props: { content: '- Steve Jobs', fontFamily: 'Inter', fontSize: 24, fontWeight: 500, color: '#92400E', alignment: 'center', lineHeight: 1, letterSpacing: 1 },
        locked: false, visible: true
      }
    ],
    layout: { type: 'centered', padding: { top: 100, right: 100, bottom: 100, left: 100 } },
    customizable: { text: true, images: true, colors: true, fonts: true },
    brandKitCompatible: true,
    popularity: 78,
    usageCount: 520,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'preset_event',
    name: 'Event Announcement',
    description: 'Modern event invitation with key details',
    category: TemplateCategory.MARKETING,
    industry: [IndustryPreset.ENTERTAINMENT, IndustryPreset.EDUCATION],
    tags: ['event', 'invitation', 'modern'],
    format: OutputFormat.INSTAGRAM_POST,
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    backgroundColor: '#1E1B4B',
    elements: [
      {
        id: 'el_1', type: 'shape', name: 'Glow Effect',
        x: 340, y: 340, width: 400, height: 400, rotation: 0, zIndex: 0,
        props: { shapeType: 'circle', fill: '#8B5CF6', opacity: 0.3, borderRadius: 0 },
        locked: false, visible: true
      },
      {
        id: 'el_2', type: 'text', name: 'Event Type',
        x: 100, y: 200, width: 880, height: 40, rotation: 0, zIndex: 2,
        props: { content: 'WEBINAR', fontFamily: 'Inter', fontSize: 18, fontWeight: 600, color: '#A78BFA', alignment: 'center', lineHeight: 1, letterSpacing: 6 },
        locked: false, visible: true
      },
      {
        id: 'el_3', type: 'text', name: 'Event Title',
        x: 80, y: 280, width: 920, height: 200, rotation: 0, zIndex: 3,
        props: { content: 'The Future of Design', fontFamily: 'Inter', fontSize: 64, fontWeight: 700, color: '#FFFFFF', alignment: 'center', lineHeight: 1.2, letterSpacing: -1 },
        locked: false, visible: true
      },
      {
        id: 'el_4', type: 'text', name: 'Date',
        x: 100, y: 520, width: 880, height: 50, rotation: 0, zIndex: 4,
        props: { content: 'March 15, 2024 | 2:00 PM EST', fontFamily: 'Inter', fontSize: 24, fontWeight: 500, color: '#C4B5FD', alignment: 'center', lineHeight: 1, letterSpacing: 1 },
        locked: false, visible: true
      },
      {
        id: 'el_5', type: 'shape', name: 'Register Button',
        x: 340, y: 700, width: 400, height: 70, rotation: 0, zIndex: 5,
        props: { shapeType: 'rectangle', fill: '#8B5CF6', opacity: 1, borderRadius: 35 },
        locked: false, visible: true
      },
      {
        id: 'el_6', type: 'text', name: 'CTA',
        x: 340, y: 715, width: 400, height: 40, rotation: 0, zIndex: 6,
        props: { content: 'Register Free', fontFamily: 'Inter', fontSize: 20, fontWeight: 600, color: '#FFFFFF', alignment: 'center', lineHeight: 1, letterSpacing: 0 },
        locked: false, visible: true
      }
    ],
    layout: { type: 'centered', padding: { top: 80, right: 80, bottom: 80, left: 80 } },
    customizable: { text: true, images: true, colors: true, fonts: true },
    brandKitCompatible: true,
    popularity: 85,
    usageCount: 720,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedFormat] = useState<OutputFormat | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return PRESET_TEMPLATES.filter(template => {
      if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
      if (selectedFormat !== 'all' && template.format !== selectedFormat) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [selectedCategory, selectedFormat, searchQuery]);

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: TemplateCategory.SOCIAL_MEDIA, label: 'Social Media' },
    { value: TemplateCategory.MARKETING, label: 'Marketing' },
    { value: TemplateCategory.PRESENTATIONS, label: 'Presentations' },
    { value: TemplateCategory.PRINT, label: 'Print' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="type-subsection text-slate-800">Template Gallery</h2>
          <p className="type-body-sm text-slate-500">Start with a pre-designed template</p>
        </div>

        {/* Search */}
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="lumina-input pl-11 pr-4 py-2.5 rounded-xl w-64"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value as any)}
              className={`px-4 py-2 rounded-xl type-body-sm font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectTemplate(template)}
            className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
          >
            {/* Preview */}
            <div
              className="aspect-square relative overflow-hidden"
              style={{ backgroundColor: template.backgroundColor }}
            >
              {/* Scaled elements preview */}
              <div className="absolute inset-0 p-4">
                {template.elements.slice(0, 5).map(el => {
                  const scaleX = 1 / (template.width / 250);
                  const scaleY = 1 / (template.height / 250);
                  const scale = Math.min(scaleX, scaleY);

                  return (
                    <div
                      key={el.id}
                      className="absolute"
                      style={{
                        left: el.x * scale,
                        top: el.y * scale,
                        width: el.width * scale,
                        height: el.height * scale,
                        backgroundColor: el.type === 'shape'
                          ? (el.props as any).fill
                          : el.type === 'text'
                            ? 'transparent'
                            : '#E2E8F0',
                        borderRadius: el.type === 'shape' && (el.props as any).shapeType === 'circle'
                          ? '50%'
                          : (el.props as any).borderRadius
                            ? (el.props as any).borderRadius * scale
                            : 0,
                        opacity: (el.props as any).opacity || 1,
                        zIndex: el.zIndex,
                        color: el.type === 'text' ? (el.props as any).color : undefined,
                        fontSize: el.type === 'text' ? Math.max(8, (el.props as any).fontSize * scale) : undefined,
                        fontWeight: el.type === 'text' ? (el.props as any).fontWeight : undefined,
                        fontFamily: el.type === 'text' ? (el.props as any).fontFamily : undefined,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: (el.props as any).alignment === 'center' ? 'center' : 'flex-start',
                        overflow: 'hidden',
                        textAlign: (el.props as any).alignment || 'left'
                      }}
                    >
                      {el.type === 'text' && (
                        <span className="truncate w-full">
                          {(el.props as any).content}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white rounded-xl text-slate-700 font-medium text-sm shadow-lg">
                  Use Template
                </span>
              </div>

              {/* Format badge */}
              <span className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg type-micro text-slate-600">
                {template.format.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="type-body font-semibold text-slate-800 mb-1">{template.name}</h3>
              <p className="type-body-sm text-slate-500 line-clamp-2">{template.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {template.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-slate-100 rounded-full type-micro text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 type-micro text-slate-400">
                <span className="flex items-center gap-1">
                  <i className="fas fa-fire text-orange-400"></i>
                  {template.popularity}%
                </span>
                <span className="flex items-center gap-1">
                  <i className="fas fa-download"></i>
                  {template.usageCount.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-search text-4xl text-slate-300 mb-4"></i>
          <p className="type-body text-slate-500">No templates found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
