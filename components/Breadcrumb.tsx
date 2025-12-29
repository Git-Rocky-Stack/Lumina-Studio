import React from 'react';
import { StudioMode } from '../types';

interface BreadcrumbItem {
  label: string;
  icon?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  currentMode: StudioMode;
  subPage?: string;
  onNavigate: (mode: StudioMode) => void;
}

const modeLabels: Record<StudioMode, { label: string; icon: string }> = {
  [StudioMode.WORKSPACE]: { label: 'Dashboard', icon: 'fa-house' },
  [StudioMode.ASSETS]: { label: 'Assets', icon: 'fa-boxes-stacked' },
  [StudioMode.CANVAS]: { label: 'Canvas', icon: 'fa-layer-group' },
  [StudioMode.TEMPLATES]: { label: 'AI Templates', icon: 'fa-wand-magic-sparkles' },
  [StudioMode.PRO_PHOTO]: { label: 'Pro Photo', icon: 'fa-image-portrait' },
  [StudioMode.VIDEO]: { label: 'Video Studio', icon: 'fa-video' },
  [StudioMode.STOCK]: { label: 'AI Stock', icon: 'fa-camera-retro' },
  [StudioMode.PDF]: { label: 'PDF Suite', icon: 'fa-file-pdf' },
  [StudioMode.BRANDING]: { label: 'Brand Hub', icon: 'fa-fingerprint' },
  [StudioMode.MARKETING]: { label: 'Marketing', icon: 'fa-bullhorn' },
  [StudioMode.ASSISTANT]: { label: 'AI Assistant', icon: 'fa-microphone' },
  [StudioMode.PERSONALIZATION]: { label: 'Settings', icon: 'fa-sliders' },
  [StudioMode.FEATURES]: { label: 'Features', icon: 'fa-sparkles' },
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentMode, subPage, onNavigate }) => {
  const currentModeInfo = modeLabels[currentMode];

  const items: BreadcrumbItem[] = [
    {
      label: 'Home',
      icon: 'fa-house',
      onClick: () => onNavigate(StudioMode.WORKSPACE),
    },
    {
      label: currentModeInfo.label,
      icon: currentModeInfo.icon,
      onClick: subPage ? () => onNavigate(currentMode) : undefined,
    },
  ];

  if (subPage) {
    items.push({ label: subPage });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <ol className="flex items-center gap-1" role="list">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <i
                className="fas fa-chevron-right text-slate-600 text-[10px] mx-2"
                aria-hidden="true"
              />
            )}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {item.icon && (
                  <i className={`fas ${item.icon} text-xs`} aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </button>
            ) : (
              <span
                className="flex items-center gap-2 px-3 py-1.5 text-white font-medium"
                aria-current="page"
              >
                {item.icon && (
                  <i className={`fas ${item.icon} text-xs text-indigo-400`} aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
