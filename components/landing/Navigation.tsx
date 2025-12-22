import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Lumina<span className="text-indigo-400">Studio</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors font-medium">
              Pricing
            </a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors font-medium">
              Resources
            </a>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/sign-in"
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-slate-300`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[72px] z-40 bg-slate-900/98 backdrop-blur-xl border-b border-slate-800 md:hidden"
          >
            <div className="px-6 py-6 space-y-4">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-slate-300 hover:text-white font-medium"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-slate-300 hover:text-white font-medium"
              >
                Pricing
              </a>
              <a
                href="#"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-slate-300 hover:text-white font-medium"
              >
                Resources
              </a>
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <Link
                  to="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-center text-slate-300 hover:text-white font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
