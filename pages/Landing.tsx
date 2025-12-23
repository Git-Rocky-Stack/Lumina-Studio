/**
 * Landing Page for Lumina Studio
 *
 * A world-class marketing landing page with animations and premium design.
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

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden noise-overlay">
      {/* Fixed Navigation */}
      <Navigation />

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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
