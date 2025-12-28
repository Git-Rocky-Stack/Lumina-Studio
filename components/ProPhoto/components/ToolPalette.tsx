import React from 'react';
import type { PhotoTool } from '../types';

interface ToolConfig {
  id: PhotoTool;
  icon: string;
  label: string;
  shortcut?: string;
  group: string;
}

const TOOLS: ToolConfig[] = [
  // Selection Tools
  { id: 'move', icon: 'fa-arrows-up-down-left-right', label: 'Move', shortcut: 'V', group: 'selection' },
  { id: 'select', icon: 'fa-mouse-pointer', label: 'Selection', shortcut: 'M', group: 'selection' },
  { id: 'lassoFree', icon: 'fa-draw-polygon', label: 'Lasso', shortcut: 'L', group: 'selection' },
  { id: 'magicWand', icon: 'fa-wand-magic-sparkles', label: 'Magic Wand', shortcut: 'W', group: 'selection' },

  // Transform Tools
  { id: 'crop', icon: 'fa-crop-simple', label: 'Crop', shortcut: 'C', group: 'transform' },
  { id: 'rotate', icon: 'fa-rotate', label: 'Rotate', shortcut: 'R', group: 'transform' },

  // Drawing Tools
  { id: 'brush', icon: 'fa-paintbrush', label: 'Brush', shortcut: 'B', group: 'drawing' },
  { id: 'pencil', icon: 'fa-pencil', label: 'Pencil', shortcut: 'N', group: 'drawing' },
  { id: 'eraser', icon: 'fa-eraser', label: 'Eraser', shortcut: 'E', group: 'drawing' },

  // Retouching Tools
  { id: 'clone', icon: 'fa-stamp', label: 'Clone Stamp', shortcut: 'S', group: 'retouch' },
  { id: 'blur', icon: 'fa-droplet', label: 'Blur', group: 'retouch' },
  { id: 'sharpen', icon: 'fa-diamond', label: 'Sharpen', group: 'retouch' },
  { id: 'dodge', icon: 'fa-sun', label: 'Dodge', shortcut: 'O', group: 'retouch' },
  { id: 'burn', icon: 'fa-fire', label: 'Burn', group: 'retouch' },

  // Fill Tools
  { id: 'gradient', icon: 'fa-palette', label: 'Gradient', shortcut: 'G', group: 'fill' },
  { id: 'paintBucket', icon: 'fa-fill-drip', label: 'Paint Bucket', shortcut: 'K', group: 'fill' },
  { id: 'eyedropper', icon: 'fa-eye-dropper', label: 'Eyedropper', shortcut: 'I', group: 'fill' },

  // Shape Tools
  { id: 'rectangle', icon: 'fa-square', label: 'Rectangle', shortcut: 'U', group: 'shape' },
  { id: 'ellipse', icon: 'fa-circle', label: 'Ellipse', group: 'shape' },
  { id: 'line', icon: 'fa-minus', label: 'Line', group: 'shape' },

  // Text & Path
  { id: 'text', icon: 'fa-t', label: 'Text', shortcut: 'T', group: 'text' },
  { id: 'pen', icon: 'fa-pen-nib', label: 'Pen', shortcut: 'P', group: 'path' },

  // Navigation
  { id: 'hand', icon: 'fa-hand', label: 'Hand', shortcut: 'H', group: 'nav' },
  { id: 'zoom', icon: 'fa-magnifying-glass', label: 'Zoom', shortcut: 'Z', group: 'nav' },
];

interface ToolPaletteProps {
  activeTool: PhotoTool;
  onToolChange: (tool: PhotoTool) => void;
  orientation?: 'vertical' | 'horizontal';
  compact?: boolean;
}

export default function ToolPalette({
  activeTool,
  onToolChange,
  orientation = 'vertical',
  compact = false,
}: ToolPaletteProps) {
  const isVertical = orientation === 'vertical';

  // Group tools for visual separation
  const groupedTools = TOOLS.reduce((acc, tool) => {
    if (!acc[tool.group]) acc[tool.group] = [];
    acc[tool.group]!.push(tool);
    return acc;
  }, {} as Record<string, ToolConfig[]>);

  const groupOrder = ['selection', 'transform', 'drawing', 'retouch', 'fill', 'shape', 'text', 'path', 'nav'];

  return (
    <aside
      className={`
        bg-[#252526] border-white/5 flex items-center
        ${isVertical
          ? 'w-12 flex-col py-2 border-r shadow-2xl'
          : 'h-10 flex-row px-2 border-b'
        }
        ${compact ? 'gap-0.5' : 'gap-1'}
      `}
    >
      {groupOrder.map((groupId, groupIndex) => {
        const groupTools = groupedTools[groupId];
        if (!groupTools) return null;

        return (
          <React.Fragment key={groupId}>
            {/* Group separator */}
            {groupIndex > 0 && (
              <div
                className={`
                  bg-white/10
                  ${isVertical ? 'w-6 h-px my-1' : 'h-6 w-px mx-1'}
                `}
              />
            )}

            {/* Tools in group */}
            {groupTools.map((tool) => {
              const isActive = activeTool === tool.id;

              return (
                <button
                  key={tool.id}
                  onClick={() => onToolChange(tool.id)}
                  title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                  className={`
                    relative group
                    ${compact ? 'w-7 h-7' : 'w-8 h-8'}
                    rounded flex items-center justify-center
                    transition-all duration-150
                    ${isActive
                      ? 'bg-accent/20 text-accent shadow-inner border border-accent/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }
                  `}
                >
                  <i className={`fas ${tool.icon} ${compact ? 'text-xs' : 'text-sm'}`} />

                  {/* Tooltip */}
                  <div
                    className={`
                      absolute z-50 opacity-0 group-hover:opacity-100
                      pointer-events-none transition-opacity delay-500
                      px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-medium
                      whitespace-nowrap shadow-xl border border-white/10
                      ${isVertical ? 'left-full ml-2' : 'top-full mt-2'}
                    `}
                  >
                    {tool.label}
                    {tool.shortcut && (
                      <span className="ml-2 text-slate-400 font-mono">{tool.shortcut}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </React.Fragment>
        );
      })}
    </aside>
  );
}
