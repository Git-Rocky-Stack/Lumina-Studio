import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalVariants } from '../animations';
import { tokens } from '../tokens';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  glassmorphism?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  glassmorphism = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  // Focus trap and escape handler
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      // Focus the modal
      setTimeout(() => modalRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleEscape]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={modalVariants.backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleBackdropClick}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
            tabIndex={-1}
            variants={modalVariants.content}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              relative w-full ${sizeClasses[size]} rounded-2xl
              ${glassmorphism
                ? 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700'}
              shadow-2xl outline-none
              ${className}
            `}
            style={{
              boxShadow: glassmorphism
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                : tokens.shadows.xl,
            }}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-6 pb-0">
                <div>
                  {title && (
                    /* Typography: type-subsection - 20px/700 */
                    <h2
                      id="modal-title"
                      className="type-subsection text-zinc-900 dark:text-white"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    /* Typography: type-body-sm - 13px/400 */
                    <p
                      id="modal-description"
                      className="mt-1 type-body-sm"
                    >
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 -m-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Confirm Dialog variant
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title} description={description}>
      <div className="flex gap-3 mt-6">
        {/* Typography: Button style - 13px/600 */}
        <motion.button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl text-[0.8125rem] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {cancelText}
        </motion.button>
        {/* Typography: Button style - 13px/600 */}
        <motion.button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 px-4 py-2.5 rounded-xl text-[0.8125rem] font-semibold transition-colors disabled:opacity-50 ${variantStyles[variant]}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <motion.div
              className="w-5 h-5 mx-auto border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : confirmText}
        </motion.button>
      </div>
    </Modal>
  );
};

// Sheet variant (bottom drawer)
interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'bottom' | 'right';
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'bottom',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sheetVariants = {
    bottom: {
      hidden: { y: '100%' },
      visible: { y: 0 },
      exit: { y: '100%' },
    },
    right: {
      hidden: { x: '100%' },
      visible: { x: 0 },
      exit: { x: '100%' },
    },
  };

  const positionClasses = {
    bottom: 'inset-x-0 bottom-0 rounded-t-3xl max-h-[90vh]',
    right: 'inset-y-0 right-0 rounded-l-3xl max-w-md w-full',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            variants={sheetVariants[side]}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`absolute ${positionClasses[side]} bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-white/20 dark:border-zinc-700/50 overflow-auto`}
          >
            {/* Drag handle for bottom sheet */}
            {side === 'bottom' && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              </div>
            )}

            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                {/* Typography: type-subsection - 20px/700 */}
                <h3 className="type-subsection text-zinc-900 dark:text-white">{title}</h3>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            )}

            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
