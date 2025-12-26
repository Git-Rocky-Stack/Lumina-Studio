import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'API', href: '#' },
    { label: 'Integrations', href: '#' },
    { label: 'Changelog', href: '#' },
  ],
  resources: [
    { label: 'User Guide', href: '/guide', isRoute: true },
    { label: 'Tutorials', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Community', href: '#' },
    { label: 'Templates', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Press Kit', href: '#' },
    { label: 'Partners', href: '#' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy', isRoute: true },
    { label: 'Terms', href: '/terms', isRoute: true },
    { label: 'Security', href: '#' },
    { label: 'Cookies', href: '#' },
  ],
};

const socialLinks = [
  { icon: 'fa-twitter', href: '#', label: 'Twitter' },
  { icon: 'fa-discord', href: '#', label: 'Discord' },
  { icon: 'fa-github', href: '#', label: 'GitHub' },
  { icon: 'fa-linkedin', href: '#', label: 'LinkedIn' },
  { icon: 'fa-youtube', href: '#', label: 'YouTube' },
];

const Footer: React.FC = () => {
  return (
    <footer className="relative pt-24 pb-12 px-6 overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

      {/* Background */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="relative max-w-7xl mx-auto">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 md:gap-8 mb-16">
          {/* Brand column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
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

            <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed">
              The all-in-one AI creative suite for designers, marketers, and content creators. Create without limits.
            </p>

            {/* Newsletter signup */}
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-5 py-4 pr-32 rounded-xl bg-slate-900/50 border border-slate-800 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 font-semibold text-sm transition-all hover:scale-105">
                Subscribe
              </button>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="font-semibold text-white mb-5">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map(link => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all" />
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all" />
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all" />
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all" />
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-10 border-t border-slate-800/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <p className="text-slate-600 text-sm">
                &copy; 2025 Lumina Studio OS. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                <span className="text-emerald-400 font-medium">All systems operational</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-xl glass-card flex items-center justify-center text-slate-500 hover:text-white hover:border-indigo-500/30 transition-all"
                  aria-label={social.label}
                >
                  <i className={`fab ${social.icon}`} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Strategia-X Logo */}
          <div className="flex justify-center mt-8">
            <motion.a
              href="https://www.strategia-x.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              className="opacity-80 transition-opacity hover:opacity-100"
              aria-label="Strategia-X"
            >
              <img
                src="/footer_logo.png"
                alt="Strategia-X"
                className="h-16 w-auto mix-blend-lighten"
              />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
