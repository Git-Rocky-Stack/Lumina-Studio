import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { springPresets } from '../animations';

interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  danger?: boolean;
  children?: DropdownOption[];
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (option: DropdownOption) => void;
  trigger?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right' | 'center';
  side?: 'bottom' | 'top';
  glassmorphism?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  onSelect,
  trigger,
  placeholder = 'Select option',
  disabled = false,
  className = '',
  align = 'left',
  side = 'bottom',
  glassmorphism = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveSubmenu(null);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        break;
    }
  }, [disabled, isOpen]);

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    if (option.children) {
      setActiveSubmenu(activeSubmenu === option.value ? null : option.value);
      return;
    }

    onChange?.(option.value);
    onSelect?.(option);
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  const sideClasses = {
    bottom: 'top-full mt-2',
    top: 'bottom-full mb-2',
  };

  const menuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: side === 'bottom' ? -10 : 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: springPresets.snappy,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: side === 'bottom' ? -10 : 10,
      transition: { duration: 0.15 },
    },
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      {trigger ? (
        <div onClick={() => !disabled && setIsOpen(!isOpen)}>
          {trigger}
        </div>
      ) : (
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            flex items-center justify-between gap-2 px-4 py-2.5 min-w-[180px] rounded-xl
            bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
            text-zinc-900 dark:text-white text-sm font-medium
            hover:border-zinc-300 dark:hover:border-zinc-600
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
          whileHover={!disabled ? { scale: 1.01 } : undefined}
          whileTap={!disabled ? { scale: 0.99 } : undefined}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.icon}
            <span>{selectedOption?.label || placeholder}</span>
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-zinc-400" />
          </motion.span>
        </motion.button>
      )}

      {/* Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              absolute z-50 ${alignClasses[align]} ${sideClasses[side]}
              min-w-[200px] py-1.5 rounded-xl overflow-hidden
              ${glassmorphism
                ? 'bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700'}
              shadow-xl
            `}
          >
            {options.map((option, index) => (
              <DropdownItem
                key={option.value}
                option={option}
                isSelected={option.value === value}
                onSelect={handleSelect}
                index={index}
                hasSubmenu={!!option.children}
                isSubmenuOpen={activeSubmenu === option.value}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual dropdown item
interface DropdownItemProps {
  option: DropdownOption;
  isSelected: boolean;
  onSelect: (option: DropdownOption) => void;
  index: number;
  hasSubmenu?: boolean;
  isSubmenuOpen?: boolean;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  option,
  isSelected,
  onSelect,
  index,
  hasSubmenu,
  isSubmenuOpen,
}) => {
  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => onSelect(option)}
        disabled={option.disabled}
        className={`
          flex items-center justify-between w-full px-3 py-2 text-left text-sm
          ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${option.danger
            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            : isSelected
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
          transition-colors
        `}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <span className="flex items-center gap-2">
          {option.icon && <span className="w-4 h-4">{option.icon}</span>}
          <span className="flex flex-col">
            <span>{option.label}</span>
            {option.description && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{option.description}</span>
            )}
          </span>
        </span>

        <span className="flex items-center gap-1">
          {isSelected && !hasSubmenu && <Check size={14} className="text-indigo-500" />}
          {hasSubmenu && <ChevronRight size={14} />}
        </span>
      </motion.button>

      {/* Submenu */}
      <AnimatePresence>
        {hasSubmenu && isSubmenuOpen && option.children && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-full top-0 ml-1 min-w-[180px] py-1.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 shadow-xl"
          >
            {option.children.map((child, i) => (
              <DropdownItem
                key={child.value}
                option={child}
                isSelected={false}
                onSelect={onSelect}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Context Menu (right-click)
interface ContextMenuProps {
  children: React.ReactNode;
  options: DropdownOption[];
  onSelect?: (option: DropdownOption) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  options,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClick = () => setIsOpen(false);
    const handleScroll = () => setIsOpen(false);

    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-[180px] py-1.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 shadow-xl"
            style={{ left: position.x, top: position.y }}
          >
            {options.map((option, index) => (
              <DropdownItem
                key={option.value}
                option={option}
                isSelected={false}
                onSelect={(opt) => {
                  onSelect?.(opt);
                  setIsOpen(false);
                }}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Dropdown;
