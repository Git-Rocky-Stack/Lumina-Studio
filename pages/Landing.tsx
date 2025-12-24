/**
 * Landing Page for Lumina Studio
 *
 * A world-class marketing landing page with animations and premium design.
 * Enhanced with UX improvements including exit-intent capture and sticky CTA.
 */

import React from 'react';
import Navigation from '../components/landing/Navigation';
import HeroSection from '../components/landing/HeroSection';
import SocialProofBar from '../components/landing/SocialProofBar';
import ProductShowcase from '../components/landing/ProductShowcase';
import FeatureGrid from '../components/landing/FeatureGrid';
import WorkflowSteps from '../components/landing/WorkflowSteps';
import Testimonials from '../components/landing/Testimonials';
import ComparisonSection from '../components/landing/ComparisonSection';
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

const LandingPage: React.FC = () => {
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

          {/* Workflow Steps - How it works */}
          <WorkflowSteps />

          {/* Testimonials - Social proof */}
          <Testimonials />

          {/* Comparison - Why choose us */}
          <ComparisonSection />

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
