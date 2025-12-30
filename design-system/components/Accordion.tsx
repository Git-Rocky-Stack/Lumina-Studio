import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { springPresets } from '../animations';

interface AccordionContextValue {
  openItems: string[];
  toggle: (id: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultOpen?: string[];
  className?: string;
  variant?: 'default' | 'bordered' | 'separated' | 'ghost';
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  type = 'single',
  defaultOpen = [],
  className = '',
  variant = 'default',
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggle = useCallback((id: string) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(id) ? [] : [id];
      }
      return prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
    });
  }, [type]);

  const variantClasses = {
    default: 'divide-y divide-zinc-200 dark:divide-zinc-700',
    bordered: 'border border-zinc-200 dark:border-zinc-700 rounded-xl divide-y divide-zinc-200 dark:divide-zinc-700',
    separated: 'space-y-3',
    ghost: '',
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div className={`${variantClasses[variant]} ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  children,
  className = '',
  disabled = false,
}) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const isOpen = context.openItems.includes(id);

  return (
    <div
      className={`
        ${className}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { id, isOpen });
        }
        return child;
      })}
    </div>
  );
};

interface AccordionTriggerProps {
  id?: string;
  isOpen?: boolean;
  children: React.ReactNode;
  icon?: 'chevron' | 'plus-minus' | 'none';
  className?: string;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  id,
  isOpen,
  children,
  icon = 'chevron',
  className = '',
}) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');

  const handleClick = () => {
    if (id) context.toggle(id);
  };

  const renderIcon = () => {
    if (icon === 'none') return null;

    if (icon === 'plus-minus') {
      return (
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springPresets.snappy}
        >
          {isOpen ? (
            <Minus size={18} className="text-zinc-400" />
          ) : (
            <Plus size={18} className="text-zinc-400" />
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={false}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={springPresets.snappy}
      >
        <ChevronDown size={18} className="text-zinc-400" />
      </motion.div>
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={isOpen}
      className={`
        flex items-center justify-between w-full py-4 px-1
        text-left font-medium text-zinc-900 dark:text-white
        hover:text-zinc-600 dark:hover:text-zinc-300
        transition-colors
        ${className}
      `}
    >
      <span>{children}</span>
      {renderIcon()}
    </button>
  );
};

interface AccordionContentProps {
  isOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  isOpen,
  children,
  className = '',
}) => {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`pb-4 px-1 text-zinc-600 dark:text-zinc-400 ${className}`}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// FAQ Accordion (pre-styled for FAQs)
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items,
  className = '',
}) => {
  return (
    <Accordion type="single" variant="separated" className={className}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          id={`faq-${index}`}
          className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-5"
        >
          <AccordionTrigger icon="plus-minus">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

// Collapsible (single item accordion)
interface CollapsibleProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  trigger,
  children,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Expandable Card
interface ExpandableCardProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  header,
  children,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      className={`
        rounded-xl border border-zinc-200 dark:border-zinc-700
        bg-white dark:bg-zinc-900 overflow-hidden
        ${className}
      `}
      layout
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 text-left"
      >
        <div>{header}</div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={springPresets.snappy}
        >
          <ChevronDown size={18} className="text-zinc-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Details/Summary styled component
interface DetailsProps {
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Details: React.FC<DetailsProps> = ({
  summary,
  children,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-l-2 border-indigo-500 pl-4 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 type-body-sm font-semibold text-zinc-900 dark:text-white hover:text-indigo-500 transition-colors"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={springPresets.snappy}
        >
          <ChevronDown size={14} className="transform -rotate-90" />
        </motion.div>
        {summary}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="type-body-sm text-zinc-600 dark:text-zinc-400">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accordion;
