import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'lumina_cookie_consent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: true,
    marketing: false,
    personalization: true,
  });

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptSelected = () => {
    saveConsent(preferences);
  };

  const handleRejectOptional = () => {
    const minimal: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    saveConsent(minimal);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);

    // Dispatch event for analytics tools to check consent
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }));
  };

  const cookieCategories = [
    {
      id: 'necessary',
      label: 'Necessary',
      description: 'Essential for the website to function. Cannot be disabled.',
      required: true,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Help us understand how visitors interact with our website.',
      required: false,
    },
    {
      id: 'marketing',
      label: 'Marketing',
      description: 'Used to deliver personalized advertisements.',
      required: false,
    },
    {
      id: 'personalization',
      label: 'Personalization',
      description: 'Remember your preferences and settings.',
      required: false,
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 inset-x-0 z-[90] p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-title"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Main banner */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Icon and text */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-cookie-bite text-xl text-indigo-400" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 id="cookie-title" className="text-white font-semibold mb-2">
                        We value your privacy
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                        By clicking "Accept All", you consent to our use of cookies.{' '}
                        <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">
                          Learn more
                        </Link>
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 md:flex-shrink-0">
                    <button
                      onClick={() => setShowPreferences(!showPreferences)}
                      className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white font-medium text-sm transition-all"
                    >
                      Customize
                    </button>
                    <button
                      onClick={handleRejectOptional}
                      className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white font-medium text-sm transition-all"
                    >
                      Reject Optional
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              </div>

              {/* Preferences panel */}
              <AnimatePresence>
                {showPreferences && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/10 overflow-hidden"
                  >
                    <div className="p-6">
                      <h4 className="text-white font-semibold mb-4">Cookie Preferences</h4>
                      <div className="space-y-4">
                        {cookieCategories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                          >
                            <div>
                              <p className="text-white font-medium text-sm mb-1">
                                {category.label}
                                {category.required && (
                                  <span className="ml-2 text-xs text-slate-500">(Required)</span>
                                )}
                              </p>
                              <p className="text-slate-400 text-xs">{category.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={preferences[category.id as keyof CookiePreferences]}
                                onChange={(e) => {
                                  if (!category.required) {
                                    setPreferences({
                                      ...preferences,
                                      [category.id]: e.target.checked,
                                    });
                                  }
                                }}
                                disabled={category.required}
                                className="sr-only peer"
                                aria-label={`${category.label} cookies`}
                              />
                              <div className={`w-11 h-6 rounded-full transition-colors ${
                                preferences[category.id as keyof CookiePreferences]
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-700'
                              } ${category.required ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                  preferences[category.id as keyof CookiePreferences] ? 'translate-x-5' : ''
                                }`} />
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleAcceptSelected}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                          Save Preferences
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
