import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AITemplate, TextElementProps, ShapeElementProps, ImageElementProps } from '../../types/template';

interface TemplatePreviewProps {
  template: AITemplate;
  insights?: {
    reasoning?: string;
    colorRationale?: string;
    suggestions?: string[];
    brandAlignmentScore?: number;
  };
  onApply?: () => void;
  onRegenerate?: () => void;
  scale?: number;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  insights,
  onApply,
  onRegenerate,
  scale: customScale
}) => {
  // Calculate scale to fit preview area
  const scale = useMemo(() => {
    if (customScale) return customScale;
    const maxWidth = 600;
    const maxHeight = 500;
    const scaleX = maxWidth / template.width;
    const scaleY = maxHeight / template.height;
    return Math.min(scaleX, scaleY, 1);
  }, [template.width, template.height, customScale]);

  const previewWidth = template.width * scale;
  const previewHeight = template.height * scale;

  // Render element based on type
  const renderElement = (element: typeof template.elements[0]) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x * scale,
      top: element.y * scale,
      width: element.width * scale,
      height: element.height * scale,
      transform: `rotate(${element.rotation || 0}deg)`,
      zIndex: element.zIndex
    };

    switch (element.type) {
      case 'text': {
        const props = element.props as TextElementProps;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              color: props.color,
              fontFamily: props.fontFamily,
              fontSize: props.fontSize * scale,
              fontWeight: props.fontWeight,
              textAlign: props.alignment,
              lineHeight: props.lineHeight,
              letterSpacing: props.letterSpacing * scale,
              textTransform: props.textTransform as any,
              display: 'flex',
              alignItems: 'center',
              justifyContent: props.alignment === 'center' ? 'center' :
                             props.alignment === 'right' ? 'flex-end' : 'flex-start',
              overflow: 'hidden'
            }}
          >
            {props.content}
          </div>
        );
      }

      case 'shape': {
        const props = element.props as ShapeElementProps;
        const shapeStyle: React.CSSProperties = {
          ...baseStyle,
          backgroundColor: props.fill,
          opacity: props.opacity,
          borderRadius: props.shapeType === 'circle' ? '50%' :
                       props.borderRadius ? props.borderRadius * scale : 0,
          border: props.stroke ? `${(props.strokeWidth || 1) * scale}px solid ${props.stroke}` : undefined
        };

        return <div key={element.id} style={shapeStyle} />;
      }

      case 'image': {
        const props = element.props as ImageElementProps;
        if (!props.src) {
          // Placeholder for AI image
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                backgroundColor: '#E2E8F0',
                borderRadius: props.borderRadius ? props.borderRadius * scale : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-image text-slate-400" style={{ fontSize: 24 * scale }}></i>
            </div>
          );
        }
        return (
          <img
            key={element.id}
            src={props.src}
            alt={props.alt}
            style={{
              ...baseStyle,
              objectFit: props.fit,
              opacity: props.opacity,
              borderRadius: props.borderRadius ? props.borderRadius * scale : 0
            }}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex gap-6">
      {/* Preview Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="type-subsection text-slate-800">{template.name}</h3>
            <p className="type-body-sm text-slate-500">
              {template.width} x {template.height}px | {template.aspectRatio}
            </p>
          </div>
          <div className="flex gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 type-body-sm font-medium transition-colors"
              >
                <i className="fas fa-arrows-rotate mr-2"></i>
                Regenerate
              </button>
            )}
            {onApply && (
              <button
                onClick={onApply}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 type-body-sm font-medium transition-colors"
              >
                <i className="fas fa-check mr-2"></i>
                Apply to Canvas
              </button>
            )}
          </div>
        </div>

        {/* Canvas Preview */}
        <div className="flex-1 flex items-center justify-center bg-slate-100 rounded-2xl p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: previewWidth,
              height: previewHeight,
              backgroundColor: template.backgroundColor
            }}
          >
            {/* Background image if present */}
            {template.backgroundImage && (
              <img
                src={template.backgroundImage}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Render all elements */}
            {template.elements
              .filter(el => el.visible !== false)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(renderElement)}
          </motion.div>
        </div>

        {/* Element List */}
        <div className="mt-4">
          <p className="type-label text-slate-400 mb-2">
            {template.elements.length} Elements
          </p>
          <div className="flex flex-wrap gap-2">
            {template.elements.map(el => (
              <span
                key={el.id}
                className="px-3 py-1 bg-white rounded-full type-micro text-slate-600 border border-slate-200"
              >
                <i className={`fas ${
                  el.type === 'text' ? 'fa-font' :
                  el.type === 'shape' ? 'fa-shapes' :
                  el.type === 'image' ? 'fa-image' : 'fa-layer-group'
                } mr-1.5 text-slate-400`}></i>
                {el.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      {insights && (
        <div className="w-72 space-y-4">
          {/* AI Reasoning */}
          {insights.reasoning && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <i className="fas fa-brain text-violet-600"></i>
                </div>
                <span className="type-body-sm font-medium text-slate-700">AI Reasoning</span>
              </div>
              <p className="type-body-sm text-slate-600 leading-relaxed">
                {insights.reasoning}
              </p>
            </motion.div>
          )}

          {/* Color Rationale */}
          {insights.colorRationale && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <i className="fas fa-palette text-amber-600"></i>
                </div>
                <span className="type-body-sm font-medium text-slate-700">Color Choice</span>
              </div>
              <p className="type-body-sm text-slate-600 leading-relaxed">
                {insights.colorRationale}
              </p>
            </motion.div>
          )}

          {/* Brand Alignment */}
          {insights.brandAlignmentScore !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <i className="fas fa-check-double text-emerald-600"></i>
                </div>
                <span className="type-body-sm font-medium text-slate-700">Brand Alignment</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${insights.brandAlignmentScore * 100}%` }}
                  />
                </div>
                <span className="type-body-sm font-medium text-slate-700">
                  {Math.round(insights.brandAlignmentScore * 100)}%
                </span>
              </div>
            </motion.div>
          )}

          {/* Suggestions */}
          {insights.suggestions && insights.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-lightbulb text-blue-600"></i>
                </div>
                <span className="type-body-sm font-medium text-slate-700">Suggestions</span>
              </div>
              <ul className="space-y-2">
                {insights.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 type-body-sm text-slate-600">
                    <i className="fas fa-arrow-right text-slate-400 mt-1 text-xs"></i>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Template Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-50 rounded-2xl p-5"
          >
            <p className="type-label text-slate-400 mb-3">Template Details</p>
            <div className="space-y-2 type-body-sm text-slate-600">
              <div className="flex justify-between">
                <span>Format</span>
                <span className="font-medium">{template.format.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Category</span>
                <span className="font-medium capitalize">{template.category.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Elements</span>
                <span className="font-medium">{template.elements.length}</span>
              </div>
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="type-micro text-slate-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white rounded-full type-micro text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;
