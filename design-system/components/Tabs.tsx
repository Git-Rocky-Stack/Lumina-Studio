import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springPresets } from '../animations';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
}) => {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || '');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const active = activeTab ?? internalActive;

  // Update indicator position
  useEffect(() => {
    const activeElement = tabRefs.current.get(active);
    if (activeElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeElement.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [active, tabs]);

  const handleTabClick = (tabId: string) => {
    if (tabs.find(t => t.id === tabId)?.disabled) return;
    setInternalActive(tabId);
    onChange?.(tabId);
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  const variantStyles = {
    default: {
      container: 'bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl',
      tab: 'rounded-lg',
      activeTab: 'text-zinc-900 dark:text-white',
      inactiveTab: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
      indicator: 'bg-white dark:bg-zinc-700 rounded-lg shadow-sm',
    },
    pills: {
      container: 'gap-2',
      tab: 'rounded-full',
      activeTab: 'bg-indigo-500 text-white',
      inactiveTab: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
      indicator: '',
    },
    underline: {
      container: 'border-b border-zinc-200 dark:border-zinc-700',
      tab: '',
      activeTab: 'text-indigo-600 dark:text-indigo-400',
      inactiveTab: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
      indicator: 'h-0.5 bg-indigo-500 bottom-0',
    },
    enclosed: {
      container: 'border-b border-zinc-200 dark:border-zinc-700',
      tab: 'rounded-t-lg border border-transparent -mb-px',
      activeTab: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 border-b-white dark:border-b-zinc-900 text-zinc-900 dark:text-white',
      inactiveTab: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
      indicator: '',
    },
  };

  const style = variantStyles[variant];
  const activeTabContent = tabs.find(t => t.id === active)?.content;

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        ref={containerRef}
        role="tablist"
        className={`
          relative flex ${fullWidth ? 'w-full' : 'inline-flex'}
          ${style.container}
        `}
      >
        {/* Animated indicator for default variant */}
        {variant === 'default' && (
          <motion.div
            className={`absolute ${style.indicator}`}
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={springPresets.snappy}
            style={{ top: 4, bottom: 4 }}
          />
        )}

        {/* Underline indicator */}
        {variant === 'underline' && (
          <motion.div
            className={`absolute ${style.indicator}`}
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={springPresets.snappy}
          />
        )}

        {/* Tabs */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
            }}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id)}
            className={`
              relative z-10 flex items-center gap-2 font-medium transition-colors
              ${sizeClasses[size]}
              ${style.tab}
              ${fullWidth ? 'flex-1 justify-center' : ''}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${active === tab.id
                ? variant === 'pills' ? style.activeTab : style.activeTab
                : style.inactiveTab}
              ${variant === 'enclosed' && active === tab.id ? style.activeTab : ''}
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`
                px-1.5 py-0.5 text-xs font-medium rounded-full
                ${active === tab.id
                  ? 'bg-white/20 text-current'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <AnimatePresence mode="wait">
        {(activeTabContent || children) && (
          <motion.div
            key={active}
            role="tabpanel"
            id={`tabpanel-${active}`}
            aria-labelledby={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            {activeTabContent || children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Vertical tabs variant
interface VerticalTabsProps extends Omit<TabsProps, 'variant' | 'fullWidth'> {
  contentClassName?: string;
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  size = 'md',
  className = '',
  contentClassName = '',
}) => {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || '');
  const active = activeTab ?? internalActive;

  const handleTabClick = (tabId: string) => {
    if (tabs.find(t => t.id === tabId)?.disabled) return;
    setInternalActive(tabId);
    onChange?.(tabId);
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  const activeTabContent = tabs.find(t => t.id === active)?.content;

  return (
    <div className={`flex gap-6 ${className}`}>
      {/* Tab list */}
      <div role="tablist" className="flex flex-col w-48 shrink-0">
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id)}
            className={`
              relative flex items-center gap-2 text-left font-medium rounded-lg transition-colors
              ${sizeClasses[size]}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${active === tab.id
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
            `}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Active indicator */}
            {active === tab.id && (
              <motion.div
                layoutId="vertical-tab-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-r-full"
                transition={springPresets.snappy}
              />
            )}

            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-auto px-1.5 py-0.5 text-xs font-medium rounded-full bg-zinc-200 dark:bg-zinc-700">
                {tab.badge}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTabContent && (
          <motion.div
            key={active}
            role="tabpanel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={`flex-1 ${contentClassName}`}
          >
            {activeTabContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tabs;
