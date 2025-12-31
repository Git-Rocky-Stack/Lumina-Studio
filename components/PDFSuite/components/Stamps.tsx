// ============================================
// Stamp SVG Components
// Visual representations for all stamp types
// ============================================

import React from 'react';
import type { StampType } from '../types';
import { STAMP_TYPES } from '../types';

interface StampProps {
  type: StampType;
  width?: number;
  height?: number;
  className?: string;
}

// Individual stamp SVG component
export const StampSVG: React.FC<StampProps> = ({
  type,
  width = 150,
  height = 50,
  className = '',
}) => {
  const config = STAMP_TYPES[type];
  if (!config) return null;

  const { label, color } = config;

  // Calculate font size based on width and label length
  const baseFontSize = Math.min(width / (label.length * 0.6), height * 0.4);
  const fontSize = Math.max(8, Math.min(24, baseFontSize));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer border with rounded corners */}
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx="4"
        ry="4"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="none"
      />

      {/* Inner border for double-line effect */}
      <rect
        x="6"
        y="6"
        width={width - 12}
        height={height - 12}
        rx="2"
        ry="2"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />

      {/* Stamp text */}
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        letterSpacing="2"
      >
        {label}
      </text>

      {/* Decorative stars for special stamps */}
      {(type === 'approved' || type === 'completed') && (
        <>
          <text
            x="12"
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={fontSize * 0.8}
          >
            ★
          </text>
          <text
            x={width - 12}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={fontSize * 0.8}
          >
            ★
          </text>
        </>
      )}

      {/* X marks for rejection stamps */}
      {(type === 'notApproved' || type === 'void') && (
        <>
          <line
            x1="10"
            y1="10"
            x2={width - 10}
            y2={height - 10}
            stroke={color}
            strokeWidth="1"
            opacity="0.3"
          />
          <line
            x1={width - 10}
            y1="10"
            x2="10"
            y2={height - 10}
            stroke={color}
            strokeWidth="1"
            opacity="0.3"
          />
        </>
      )}

      {/* Lock icon for confidential */}
      {type === 'confidential' && (
        <g transform={`translate(${width - 20}, 8)`}>
          <rect x="2" y="6" width="10" height="8" fill="none" stroke={color} strokeWidth="1" rx="1" />
          <path d="M4 6 V4 A3 3 0 0 1 10 4 V6" fill="none" stroke={color} strokeWidth="1" />
        </g>
      )}

      {/* Draft diagonal lines */}
      {type === 'draft' && (
        <g opacity="0.2">
          {Array.from({ length: Math.floor(width / 15) }).map((_, i) => (
            <line
              key={i}
              x1={i * 15}
              y1="0"
              x2={i * 15 + height}
              y2={height}
              stroke={color}
              strokeWidth="1"
            />
          ))}
        </g>
      )}
    </svg>
  );
};

// Stamp picker grid component
interface StampPickerGridProps {
  selectedType?: StampType;
  onSelect: (type: StampType) => void;
  className?: string;
}

export const StampPickerGrid: React.FC<StampPickerGridProps> = ({
  selectedType,
  onSelect,
  className = '',
}) => {
  const stampTypes = Object.keys(STAMP_TYPES).filter(t => t !== 'custom') as StampType[];

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {stampTypes.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`
            p-3 rounded-xl border-2 transition-all duration-200
            hover:scale-105 hover:shadow-lg
            ${selectedType === type
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300'
            }
          `}
        >
          <StampSVG type={type} width={120} height={40} />
        </button>
      ))}
    </div>
  );
};

// Stamp preview for the annotation layer
interface StampAnnotationProps {
  type: StampType;
  width: number;
  height: number;
  opacity?: number;
  rotation?: number;
  className?: string;
}

export const StampAnnotation: React.FC<StampAnnotationProps> = ({
  type,
  width,
  height,
  opacity = 100,
  rotation = 0,
  className = '',
}) => {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        opacity: opacity / 100,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
      }}
    >
      <StampSVG type={type} width={width} height={height} />
    </div>
  );
};

export default StampSVG;
