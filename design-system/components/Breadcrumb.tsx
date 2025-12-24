import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import { springPresets } from '../animations';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  showHome?: boolean;
  onHomeClick?: () => void;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight size={14} className="text-zinc-400" />,
  maxItems = 4,
  showHome = true,
  onHomeClick,
  className = '',
}) => {
  // Collapse middle items if too many
  const shouldCollapse = items.length > maxItems;
  const visibleItems = shouldCollapse
    ? [items[0], { label: '...', isCollapsed: true }, ...items.slice(-2)]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-sm">
        {/* Home */}
        {showHome && (
          <>
            <li>
              <motion.button
                onClick={onHomeClick}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home size={14} />
              </motion.button>
            </li>
            <li className="flex items-center" aria-hidden>
              {separator}
            </li>
          </>
        )}

        {/* Items */}
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isCollapsed = 'isCollapsed' in item && item.isCollapsed;

          return (
            <React.Fragment key={index}>
              <li>
                {isCollapsed ? (
                  <CollapsedMenu items={items.slice(1, -2)} />
                ) : (
                  <BreadcrumbLink item={item} isLast={isLast} />
                )}
              </li>

              {!isLast && (
                <li className="flex items-center" aria-hidden>
                  {separator}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

// Individual breadcrumb link
interface BreadcrumbLinkProps {
  item: BreadcrumbItem;
  isLast: boolean;
}

const BreadcrumbLink: React.FC<BreadcrumbLinkProps> = ({ item, isLast }) => {
  const baseClasses = 'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors';

  if (isLast) {
    return (
      <span
        className={`${baseClasses} font-medium text-zinc-900 dark:text-white`}
        aria-current="page"
      >
        {item.icon}
        {item.label}
      </span>
    );
  }

  if (item.href) {
    return (
      <motion.a
        href={item.href}
        className={`${baseClasses} text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {item.icon}
        {item.label}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={item.onClick}
      className={`${baseClasses} text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {item.icon}
      {item.label}
    </motion.button>
  );
};

// Collapsed menu for middle items
interface CollapsedMenuProps {
  items: BreadcrumbItem[];
}

const CollapsedMenu: React.FC<CollapsedMenuProps> = ({ items }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-2 py-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MoreHorizontal size={16} />
      </motion.button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            className="absolute left-0 top-full mt-1 z-50 min-w-[150px] py-1 rounded-lg bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.snappy}
          >
            {items.map((item, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                whileHover={{ x: 2 }}
              >
                {item.icon}
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

// Path breadcrumb (for file systems)
interface PathBreadcrumbProps {
  path: string;
  separator?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const PathBreadcrumb: React.FC<PathBreadcrumbProps> = ({
  path,
  separator = '/',
  onNavigate,
  className = '',
}) => {
  const segments = path.split(separator).filter(Boolean);

  const handleClick = (index: number) => {
    const newPath = separator + segments.slice(0, index + 1).join(separator);
    onNavigate?.(newPath);
  };

  return (
    <div className={`flex items-center gap-1 text-sm font-mono ${className}`}>
      <motion.button
        onClick={() => onNavigate?.(separator)}
        className="px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        whileTap={{ scale: 0.95 }}
      >
        {separator}
      </motion.button>

      {segments.map((segment, index) => (
        <React.Fragment key={index}>
          <motion.button
            onClick={() => handleClick(index)}
            className={`
              px-1.5 py-0.5 rounded transition-colors
              ${index === segments.length - 1
                ? 'font-medium text-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            {segment}
          </motion.button>

          {index < segments.length - 1 && (
            <span className="text-zinc-400">{separator}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Page breadcrumb with back button
interface PageBreadcrumbProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({
  title,
  subtitle,
  onBack,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        {onBack && (
          <motion.button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </motion.button>
        )}

        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default Breadcrumb;
