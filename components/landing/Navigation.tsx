import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import ThemeToggle from '../ThemeToggle';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Guide', href: '/guide', isRoute: true },
];

const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();
  const navBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(2, 6, 23, 0)', 'rgba(2, 6, 23, 0.85)']
  );
  const navBorder = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.05)']
  );

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
        ref={navRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: navBackground,
          borderBottomColor: navBorder,
        }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrolled ? 'backdrop-blur-2xl shadow-2xl shadow-black/10' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group relative">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </motion.div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">
                  Lumina<span className="text-indigo-400">Studio</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider bg-gradient-to-r from-indigo-500 to-violet-600 rounded text-white">OS</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center">
              <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-full glass-card">
                {navLinks.map((link) =>
                  link.isRoute ? (
                    <Link
                      key={link.label}
                      to={link.href}
                      onMouseEnter={() => setHoveredLink(link.label)}
                      onMouseLeave={() => setHoveredLink(null)}
                      className="relative px-5 py-2 type-body-sm font-semibold text-slate-300 hover:text-white transition-colors rounded-full"
                    >
                      {hoveredLink === link.label && (
                        <motion.div
                          layoutId="navHover"
                          className="absolute inset-0 bg-white/10 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      onMouseEnter={() => setHoveredLink(link.label)}
                      onMouseLeave={() => setHoveredLink(null)}
                      className="relative px-5 py-2 type-body-sm font-semibold text-slate-300 hover:text-white transition-colors rounded-full"
                    >
                      {hoveredLink === link.label && (
                        <motion.div
                          layoutId="navHover"
                          className="absolute inset-0 bg-white/10 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle variant="icon" />
              <Link
                to="/sign-in"
                className="px-5 py-2.5 type-body-sm font-semibold text-slate-300 hover:text-white transition-colors rounded-xl hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="group relative px-6 py-2.5 rounded-xl type-body-sm font-semibold overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-violet-500" />
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <i className="fas fa-arrow-right text-xs group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="md:hidden w-11 h-11 rounded-xl glass-card flex items-center justify-center"
            >
              <div className="relative w-5 h-4 flex flex-col justify-between" aria-hidden="true">
                <motion.span
                  animate={{
                    rotate: mobileMenuOpen ? 45 : 0,
                    y: mobileMenuOpen ? 6 : 0,
                  }}
                  className="w-full h-0.5 bg-white rounded-full origin-left"
                />
                <motion.span
                  animate={{
                    opacity: mobileMenuOpen ? 0 : 1,
                    x: mobileMenuOpen ? 10 : 0,
                  }}
                  className="w-3/4 h-0.5 bg-white rounded-full"
                />
                <motion.span
                  animate={{
                    rotate: mobileMenuOpen ? -45 : 0,
                    y: mobileMenuOpen ? -6 : 0,
                  }}
                  className="w-full h-0.5 bg-white rounded-full origin-left"
                />
              </div>
            </motion.button>
          </div>
        </div>

        {/* Subtle glow line at bottom when scrolled */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"
            />
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Menu panel */}
            <motion.div
              id="mobile-menu"
              role="navigation"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 top-24 z-50 md:hidden"
            >
              <div className="glass-card rounded-3xl p-6 shadow-2xl">
                <div className="space-y-1 mb-6">
                  {navLinks.map((link, i) =>
                    link.isRoute ? (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Link
                          to={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-4 px-4 type-subsection text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ) : (
                      <motion.a
                        key={link.label}
                        href={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-4 px-4 type-subsection text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        {link.label}
                      </motion.a>
                    )
                  )}
                </div>

                <div className="pt-6 border-t border-white/10 space-y-3">
                  <Link
                    to="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-4 text-center text-slate-300 hover:text-white font-medium rounded-xl hover:bg-white/5 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-4 text-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold shadow-lg shadow-indigo-500/25"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
