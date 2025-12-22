/**
 * Landing Page for Lumina Studio
 *
 * Marketing landing page for lumina-os.com
 * This will be expanded with full marketing content.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Lumina<span className="text-indigo-400">Studio</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/sign-in" className="text-slate-300 hover:text-white transition-colors font-medium">
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 font-semibold shadow-lg shadow-indigo-500/25 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-indigo-300 font-medium">Powered by Google Gemini AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            Create Stunning Content
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              with AI Superpowers
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            The all-in-one creative suite for designers, marketers, and content creators.
            Generate images, videos, and marketing campaigns in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/sign-up"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 font-bold text-lg shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105"
            >
              Start Creating Free
            </Link>
            <a
              href="#demo"
              className="px-8 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 font-semibold text-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Demo
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-slate-500">AI Models</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">10M+</div>
              <div className="text-slate-500">Assets Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-slate-500">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Everything You Need to Create
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'Canvas Editor',
                description: 'Design stunning graphics with timeline animations and smart layers.',
              },
              {
                icon: '🎬',
                title: 'Video Studio',
                description: 'AI-powered storyboarding and video generation from text.',
              },
              {
                icon: '🖼️',
                title: 'AI Stock Gen',
                description: 'Generate unlimited stock images and animated loops.',
              },
              {
                icon: '📄',
                title: 'PDF Suite',
                description: 'Edit documents, redact PII, and manage typography.',
              },
              {
                icon: '📸',
                title: 'Pro Photo',
                description: 'Professional photo editing with AI-powered tools.',
              },
              {
                icon: '📣',
                title: 'Marketing Hub',
                description: 'Plan and schedule social media campaigns.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/30 transition-all group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 mb-16">Start free, upgrade when you need more power.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50">
              <div className="text-sm font-medium text-slate-400 mb-2">Free</div>
              <div className="text-4xl font-bold mb-4">$0</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 50 AI images/month
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 5 AI videos/month
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 1GB storage
                </li>
              </ul>
              <Link
                to="/sign-up"
                className="block w-full py-3 rounded-xl border border-slate-600 hover:bg-slate-700 font-semibold transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-bold">
                Popular
              </div>
              <div className="text-sm font-medium text-indigo-400 mb-2">Pro</div>
              <div className="text-4xl font-bold mb-4">$19<span className="text-lg text-slate-400">/mo</span></div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 500 AI images/month
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 50 AI videos/month
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 50GB storage
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> Priority support
                </li>
              </ul>
              <Link
                to="/sign-up"
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 font-semibold transition-all"
              >
                Start Pro Trial
              </Link>
            </div>

            {/* Team */}
            <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50">
              <div className="text-sm font-medium text-slate-400 mb-2">Team</div>
              <div className="text-4xl font-bold mb-4">$49<span className="text-lg text-slate-400">/mo</span></div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 2000 AI images/month
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 200 AI videos/month
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> 200GB storage
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400">✓</span> Up to 10 team members
                </li>
              </ul>
              <Link
                to="/sign-up"
                className="block w-full py-3 rounded-xl border border-slate-600 hover:bg-slate-700 font-semibold transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Creative Workflow?
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Join thousands of creators already using Lumina Studio.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 font-bold text-xl shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold">Lumina Studio</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2025 Lumina Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
