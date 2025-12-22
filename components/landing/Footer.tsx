import React from 'react';
import { Link } from 'react-router-dom';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'API', href: '#' },
    { label: 'Integrations', href: '#' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Tutorials', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Community', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Press Kit', href: '#' },
  ],
  legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Security', href: '#' },
  ],
};

const Footer: React.FC = () => {
  return (
    <footer className="py-16 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold">
                Lumina<span className="text-indigo-400">Studio</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm mb-6 max-w-xs">
              The all-in-one AI creative suite for designers, marketers, and content creators.
            </p>

            {/* Newsletter signup */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
              <button className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-sm transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <p className="text-slate-500 text-sm">
              &copy; 2025 Lumina Studio. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <i className="fab fa-twitter" />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <i className="fab fa-discord" />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <i className="fab fa-github" />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <i className="fab fa-linkedin" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
