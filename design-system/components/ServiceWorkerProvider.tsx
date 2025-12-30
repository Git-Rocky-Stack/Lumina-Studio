import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Wifi, WifiOff, Download, X, Check } from 'lucide-react';
import { springPresets } from '../animations';

interface ServiceWorkerContextValue {
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isOfflineReady: boolean;
  updateServiceWorker: () => void;
  cacheSize: number;
  clearCache: () => Promise<void>;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextValue | null>(null);

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered');
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                  setShowUpdateToast(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle controller change (after update)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get cache size periodically
  useEffect(() => {
    const getCacheSize = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          setCacheSize(estimate.usage || 0);
        } catch (error) {
          console.error('Failed to get storage estimate:', error);
        }
      }
    };

    getCacheSize();
    const interval = setInterval(getCacheSize, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateToast(false);
  }, [registration]);

  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      setCacheSize(0);
    }
  }, []);

  return (
    <ServiceWorkerContext.Provider
      value={{
        isOnline,
        isUpdateAvailable,
        isOfflineReady,
        updateServiceWorker,
        cacheSize,
        clearCache,
      }}
    >
      {children}

      {/* Update available toast */}
      <AnimatePresence>
        {showUpdateToast && (
          <UpdateToast
            onUpdate={updateServiceWorker}
            onDismiss={() => setShowUpdateToast(false)}
          />
        )}
      </AnimatePresence>

      {/* Offline toast */}
      <AnimatePresence>
        {showOfflineToast && (
          <OfflineToast onDismiss={() => setShowOfflineToast(false)} />
        )}
      </AnimatePresence>
    </ServiceWorkerContext.Provider>
  );
};

export const useServiceWorker = () => {
  const context = useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorker must be used within ServiceWorkerProvider');
  }
  return context;
};

// Update available toast
interface UpdateToastProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateToast: React.FC<UpdateToastProps> = ({ onUpdate, onDismiss }) => {
  return (
    <motion.div
      className="fixed bottom-4 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700"
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      transition={springPresets.snappy}
    >
      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
        <Download size={18} className="text-indigo-500" />
      </div>

      <div className="flex-1">
        <p className="font-medium text-zinc-900 dark:text-white">Update available</p>
        <p className="type-body-sm text-zinc-500 dark:text-zinc-400">
          A new version is ready to install
        </p>
      </div>

      <motion.button
        onClick={onUpdate}
        className="px-4 py-2 rounded-lg bg-indigo-500 text-white type-body-sm font-semibold hover:bg-indigo-600"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Update
      </motion.button>

      <motion.button
        onClick={onDismiss}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X size={16} />
      </motion.button>
    </motion.div>
  );
};

// Offline toast
interface OfflineToastProps {
  onDismiss: () => void;
}

const OfflineToast: React.FC<OfflineToastProps> = ({ onDismiss }) => {
  return (
    <motion.div
      className="fixed bottom-4 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700"
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      transition={springPresets.snappy}
    >
      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
        <WifiOff size={18} className="text-amber-600 dark:text-amber-400" />
      </div>

      <div>
        <p className="font-medium text-amber-900 dark:text-amber-100">You're offline</p>
        <p className="type-body-sm text-amber-700 dark:text-amber-300">
          Some features may be unavailable
        </p>
      </div>

      <motion.button
        onClick={onDismiss}
        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X size={16} />
      </motion.button>
    </motion.div>
  );
};

// Connection status indicator component
export const ConnectionIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = useServiceWorker();

  return (
    <motion.div
      className={`flex items-center gap-1.5 type-caption font-semibold ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {isOnline ? (
        <>
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-emerald-600 dark:text-emerald-400">Online</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-amber-600 dark:text-amber-400">Offline</span>
        </>
      )}
    </motion.div>
  );
};

// Install prompt for PWA
export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={springPresets.snappy}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
          <Download size={24} className="text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            Install Lumina Studio
          </h3>
          <p className="type-body-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Install the app for a better experience with offline access
          </p>

          <div className="flex gap-2 mt-3">
            <motion.button
              onClick={handleInstall}
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white type-body-sm font-semibold hover:bg-indigo-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Install
            </motion.button>
            <motion.button
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 type-body-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Not now
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceWorkerProvider;
