/**
 * Landing Page for Lumina Studio
 *
 * A world-class marketing landing page with animations and premium design.
 * Enhanced with UX improvements including exit-intent capture and sticky CTA.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/landing/Navigation';
import HeroSection from '../components/landing/HeroSection';
import SocialProofBar from '../components/landing/SocialProofBar';
import ProductShowcase from '../components/landing/ProductShowcase';
import FeatureGrid from '../components/landing/FeatureGrid';
import PowerFeatures from '../components/landing/PowerFeatures';
import WorkflowSteps from '../components/landing/WorkflowSteps';
import Testimonials from '../components/landing/Testimonials';
import ComparisonSection from '../components/landing/ComparisonSection';
import BYOKSection from '../components/landing/BYOKSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';
import ExitIntentModal from '../components/landing/ExitIntentModal';
import StickyCTA from '../components/landing/StickyCTA';
import CookieConsent from '../components/CookieConsent';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import WhatsNewModal from '../components/WhatsNewModal';
import { CursorProvider, CursorTrigger } from '../design-system';
import { useAuthContext } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthContext();

  // Redirect authenticated users to studio
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/studio', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state briefly while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    );
  }

  // Don't render landing page if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <CursorProvider>
      <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden noise-overlay cursor-none">
        {/* Fixed Navigation */}
        <Navigation />

        {/* Main content with landmark for accessibility */}
        <main id="main-content">
          {/* Hero - The "wow" moment */}
          <HeroSection />

          {/* Social Proof - Build trust */}
          <SocialProofBar />

          {/* Product Showcase - Show the product */}
          <ProductShowcase />

          {/* Features Grid - What it does */}
          <FeatureGrid />

          {/* Power Features - Advanced capabilities */}
          <PowerFeatures />

          {/* Workflow Steps - How it works */}
          <WorkflowSteps />

          {/* Testimonials - Social proof */}
          <Testimonials />

          {/* Comparison - Why choose us */}
          <ComparisonSection />

          {/* BYOK - Bring Your Own Key option */}
          <BYOKSection />

          {/* Pricing - Convert visitors */}
          <PricingSection />

          {/* FAQ - Remove objections */}
          <FAQSection />

          {/* Final CTA - Last chance to convert */}
          <CTASection />
        </main>

        {/* Footer */}
        <Footer />

        {/* UX Enhancements */}
        <ExitIntentModal enabled={true} />
        <StickyCTA threshold={800} />
        <CookieConsent />
        <KeyboardShortcutsModal />
        <WhatsNewModal />
      </div>
    </CursorProvider>
  );
};

export default LandingPage;
