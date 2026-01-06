/**
 * User Guide Page for Lumina Studio OS
 *
 * Comprehensive documentation with premium design matching the landing page.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';

// Guide sections configuration
const guideSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'fa-rocket',
    color: 'from-indigo-500 to-violet-600',
    description: 'Quick setup guide to get you creating in minutes',
  },
  {
    id: 'workspace',
    title: 'Workspace Overview',
    icon: 'fa-th-large',
    color: 'from-sky-500 to-blue-600',
    description: 'Navigate the interface and manage your projects',
  },
  {
    id: 'canvas',
    title: 'Design Canvas',
    icon: 'fa-palette',
    color: 'from-pink-500 to-rose-600',
    description: 'Professional graphic design with AI-powered tools',
  },
  {
    id: 'video',
    title: 'Video Studio',
    icon: 'fa-video',
    color: 'from-violet-500 to-purple-600',
    description: 'Create stunning videos with timeline editing',
  },
  {
    id: 'stock',
    title: 'AI Stock Generator',
    icon: 'fa-wand-magic-sparkles',
    color: 'from-amber-500 to-orange-600',
    description: 'Generate unique stock images with AI',
  },
  {
    id: 'pdf',
    title: 'PDF Suite',
    icon: 'fa-file-pdf',
    color: 'from-red-500 to-rose-600',
    description: 'Complete PDF editing and management tools',
  },
  {
    id: 'photo',
    title: 'Pro Photo',
    icon: 'fa-camera',
    color: 'from-cyan-500 to-blue-600',
    description: 'Professional photo editing and enhancement',
  },
  {
    id: 'brand',
    title: 'Brand Hub',
    icon: 'fa-star',
    color: 'from-emerald-500 to-teal-600',
    description: 'Manage your brand assets and guidelines',
  },
  {
    id: 'marketing',
    title: 'Marketing Hub',
    icon: 'fa-bullhorn',
    color: 'from-fuchsia-500 to-pink-600',
    description: 'Create marketing campaigns and content',
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    icon: 'fa-robot',
    color: 'from-blue-500 to-indigo-600',
    description: 'Your intelligent creative companion',
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    icon: 'fa-users',
    color: 'from-green-500 to-emerald-600',
    description: 'Work together with teams in real-time',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: 'fa-plug',
    color: 'from-orange-500 to-red-600',
    description: 'Connect with your favorite tools and services',
  },
  {
    id: 'enterprise',
    title: 'Enterprise Features',
    icon: 'fa-building',
    color: 'from-emerald-500 to-green-600',
    description: 'Team workspaces, approval workflows, SSO, and compliance tools',
  },
  {
    id: 'export',
    title: 'Export & Sharing',
    icon: 'fa-share-nodes',
    color: 'from-teal-500 to-cyan-600',
    description: 'Export your work in various formats',
  },
  {
    id: 'billing',
    title: 'Billing & Plans',
    icon: 'fa-credit-card',
    color: 'from-purple-500 to-violet-600',
    description: 'Manage subscriptions and billing',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: 'fa-keyboard',
    color: 'from-slate-500 to-gray-600',
    description: 'Master productivity with keyboard shortcuts',
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: 'fa-wrench',
    color: 'from-rose-500 to-pink-600',
    description: 'Solutions to common problems',
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: 'fa-circle-question',
    color: 'from-indigo-500 to-blue-600',
    description: 'Frequently asked questions',
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    icon: 'fa-universal-access',
    color: 'from-lime-500 to-green-600',
    description: 'Making Lumina Studio accessible to everyone',
  },
];

// Detailed content for each section
const sectionContent: Record<string, { features: { title: string; description: string; icon: string }[]; tips: string[]; shortcuts?: { key: string; action: string }[] }> = {
  'getting-started': {
    features: [
      { title: 'Create an Account', description: 'Sign up for free and access all creative tools instantly. No credit card required to start.', icon: 'fa-user-plus' },
      { title: 'Choose Your Workspace', description: 'Select from Design Canvas, Video Studio, or any other tool from the sidebar.', icon: 'fa-th-large' },
      { title: 'Import or Create', description: 'Upload existing assets or start fresh with AI-powered templates and generators.', icon: 'fa-cloud-upload-alt' },
      { title: 'Export Anywhere', description: 'Download in multiple formats or sync directly to cloud storage services.', icon: 'fa-download' },
    ],
    tips: [
      'Use keyboard shortcuts (Ctrl+1, Ctrl+2, etc.) to quickly switch between tools',
      'Enable auto-save in settings to never lose your work',
      'Explore the AI Assistant for creative suggestions and help',
      'Set up your Brand Hub first to maintain consistency across all projects',
    ],
  },
  canvas: {
    features: [
      { title: 'Infinite Canvas', description: 'Work on an unlimited workspace with smooth zoom and pan controls. No boundaries to your creativity.', icon: 'fa-expand' },
      { title: 'Smart Layers', description: 'Organize elements with an intelligent layer system. Group, lock, and blend with ease.', icon: 'fa-layer-group' },
      { title: 'AI Design Assist', description: 'Get intelligent suggestions for layouts, color schemes, and typography combinations.', icon: 'fa-magic' },
      { title: 'Template Library', description: 'Access thousands of professionally designed templates for any occasion.', icon: 'fa-clone' },
      { title: 'Shape & Icon Library', description: 'Browse millions of vector shapes, icons, and illustrations to enhance your designs.', icon: 'fa-shapes' },
      { title: 'Advanced Typography', description: 'Fine-tune fonts with kerning, leading, and custom text effects.', icon: 'fa-font' },
    ],
    tips: [
      'Hold Space + Drag to pan around the canvas',
      'Use Ctrl+Scroll to zoom in and out',
      'Double-click any element to edit its properties',
      'Right-click for context-specific actions',
    ],
    shortcuts: [
      { key: 'V', action: 'Select tool' },
      { key: 'T', action: 'Text tool' },
      { key: 'R', action: 'Rectangle tool' },
      { key: 'E', action: 'Ellipse tool' },
      { key: 'L', action: 'Line tool' },
      { key: 'Ctrl+G', action: 'Group selection' },
      { key: 'Ctrl+Shift+G', action: 'Ungroup' },
    ],
  },
  video: {
    features: [
      { title: 'Timeline Editor', description: 'Professional multi-track timeline with precise frame-by-frame control.', icon: 'fa-film' },
      { title: 'Transitions & Effects', description: 'Choose from hundreds of smooth transitions and stunning visual effects.', icon: 'fa-wand-sparkles' },
      { title: 'Audio Mixer', description: 'Balance audio tracks, add music, and sync sound perfectly with your visuals.', icon: 'fa-music' },
      { title: 'Text Animations', description: 'Create animated titles, captions, and text overlays with prebuilt animations.', icon: 'fa-closed-captioning' },
      { title: 'Color Grading', description: 'Professional color correction and grading tools for cinematic looks.', icon: 'fa-sliders-h' },
      { title: 'Export Presets', description: 'Optimized export settings for YouTube, Instagram, TikTok, and more.', icon: 'fa-share-square' },
    ],
    tips: [
      'Use J, K, L keys for playback control (reverse, pause, forward)',
      'Drag the edges of clips to trim them on the timeline',
      'Add markers with M to note important moments',
      'Use split-screen preview to compare before/after effects',
    ],
    shortcuts: [
      { key: 'Space', action: 'Play/Pause' },
      { key: 'J', action: 'Reverse playback' },
      { key: 'K', action: 'Stop' },
      { key: 'L', action: 'Forward playback' },
      { key: 'I', action: 'Set in point' },
      { key: 'O', action: 'Set out point' },
      { key: 'S', action: 'Split clip' },
    ],
  },
  stock: {
    features: [
      { title: 'AI Image Generation', description: 'Describe what you need and watch AI create unique, royalty-free images.', icon: 'fa-image' },
      { title: 'Style Presets', description: 'Choose from photorealistic, illustration, 3D render, and artistic styles.', icon: 'fa-brush' },
      { title: 'Aspect Ratios', description: 'Generate images in any aspect ratio for social media, print, or web.', icon: 'fa-crop-alt' },
      { title: 'Batch Generation', description: 'Create multiple variations at once to find the perfect image.', icon: 'fa-images' },
      { title: 'Upscaling', description: 'Enhance resolution up to 4K without losing quality.', icon: 'fa-search-plus' },
      { title: 'Background Removal', description: 'Automatically remove backgrounds with one click.', icon: 'fa-eraser' },
    ],
    tips: [
      'Be specific in your prompts for better results',
      'Add style keywords like "cinematic lighting" or "minimal design"',
      'Use negative prompts to exclude unwanted elements',
      'Save favorite styles for consistent brand imagery',
    ],
  },
  pdf: {
    features: [
      { title: 'Edit PDF Text', description: 'Modify text directly in any PDF document without conversion.', icon: 'fa-edit' },
      { title: 'Merge & Split', description: 'Combine multiple PDFs or extract specific pages easily.', icon: 'fa-object-group' },
      { title: 'Annotate & Comment', description: 'Add highlights, notes, and drawings for collaboration.', icon: 'fa-comment-alt' },
      { title: 'Form Filling', description: 'Fill out and sign PDF forms electronically.', icon: 'fa-file-signature' },
      { title: 'Convert Formats', description: 'Convert to/from Word, Excel, PowerPoint, and images.', icon: 'fa-exchange-alt' },
      { title: 'Compress PDFs', description: 'Reduce file size while maintaining quality for easy sharing.', icon: 'fa-compress-arrows-alt' },
    ],
    tips: [
      'Drag and drop files directly onto the PDF Suite',
      'Use the thumbnail view to quickly rearrange pages',
      'Enable OCR for scanned documents to make text searchable',
      'Set up templates for frequently used forms',
    ],
  },
  photo: {
    features: [
      { title: 'One-Click Enhance', description: 'AI-powered automatic enhancement for perfect photos every time.', icon: 'fa-bolt' },
      { title: 'Advanced Retouching', description: 'Remove blemishes, smooth skin, and perfect portraits.', icon: 'fa-user' },
      { title: 'Filters & Presets', description: 'Apply professional filters or create your own presets.', icon: 'fa-adjust' },
      { title: 'Background Tools', description: 'Replace, blur, or remove backgrounds with AI precision.', icon: 'fa-object-ungroup' },
      { title: 'Batch Processing', description: 'Apply edits to hundreds of photos simultaneously.', icon: 'fa-copy' },
      { title: 'RAW Support', description: 'Edit RAW files from any camera with full quality.', icon: 'fa-camera-retro' },
    ],
    tips: [
      'Use the histogram to check exposure and color balance',
      'Non-destructive editing preserves your original files',
      'Create presets from your best edits for consistent style',
      'Use masking for selective adjustments',
    ],
  },
  brand: {
    features: [
      { title: 'Brand Guidelines', description: 'Document and share your complete brand identity in one place.', icon: 'fa-book' },
      { title: 'Color Palettes', description: 'Store and access brand colors across all your projects.', icon: 'fa-palette' },
      { title: 'Font Library', description: 'Upload and manage custom brand fonts for consistency.', icon: 'fa-text-height' },
      { title: 'Logo Variations', description: 'Store all logo versions with usage guidelines.', icon: 'fa-shapes' },
      { title: 'Asset Library', description: 'Organize approved brand assets for easy access.', icon: 'fa-folder-open' },
      { title: 'Team Sharing', description: 'Share brand kits with team members and collaborators.', icon: 'fa-users' },
    ],
    tips: [
      'Set up your brand kit first for faster project creation',
      'Export brand guidelines as a PDF for external partners',
      'Use the brand checker to ensure consistency',
      'Link brand colors to automatically update across projects',
    ],
  },
  marketing: {
    features: [
      { title: 'Social Media Posts', description: 'Create perfectly sized content for every platform.', icon: 'fa-share-alt' },
      { title: 'Ad Templates', description: 'Professional templates for Facebook, Instagram, and Google ads.', icon: 'fa-ad' },
      { title: 'Email Headers', description: 'Design eye-catching email marketing graphics.', icon: 'fa-envelope' },
      { title: 'Analytics Integration', description: 'Track performance of your marketing materials.', icon: 'fa-chart-line' },
      { title: 'Campaign Manager', description: 'Organize and schedule content across channels.', icon: 'fa-calendar-alt' },
      { title: 'A/B Testing', description: 'Create variations to test what performs best.', icon: 'fa-vials' },
    ],
    tips: [
      'Use the content calendar to plan campaigns ahead',
      'Preview how designs look on different devices',
      'Save top-performing designs as templates',
      'Track UTM parameters for better analytics',
    ],
  },
  assistant: {
    features: [
      { title: 'Creative Suggestions', description: 'Get AI-powered ideas for designs, copy, and campaigns.', icon: 'fa-lightbulb' },
      { title: 'Content Writing', description: 'Generate headlines, taglines, and marketing copy.', icon: 'fa-pen-fancy' },
      { title: 'Design Feedback', description: 'Get instant feedback on your designs with improvement tips.', icon: 'fa-comments' },
      { title: 'Task Automation', description: 'Automate repetitive tasks with natural language commands.', icon: 'fa-cogs' },
      { title: 'Learning Resources', description: 'Get tutorials and tips tailored to your skill level.', icon: 'fa-graduation-cap' },
      { title: 'Voice Commands', description: 'Control the studio hands-free with voice input.', icon: 'fa-microphone' },
    ],
    tips: [
      'Be specific about your goals for better suggestions',
      'Ask for multiple options to explore different directions',
      'Use the assistant to explain unfamiliar features',
      'Save helpful responses for future reference',
    ],
  },
  shortcuts: {
    features: [
      { title: 'Global Navigation', description: 'Switch between tools instantly without using the mouse.', icon: 'fa-compass' },
      { title: 'Tool Shortcuts', description: 'Access any tool with a single keystroke.', icon: 'fa-tools' },
      { title: 'Edit Commands', description: 'Undo, redo, copy, paste, and more at lightning speed.', icon: 'fa-edit' },
      { title: 'View Controls', description: 'Zoom, pan, and navigate your workspace efficiently.', icon: 'fa-eye' },
      { title: 'Custom Shortcuts', description: 'Create your own shortcuts for frequently used actions.', icon: 'fa-cog' },
      { title: 'Shortcut Guide', description: 'Press Ctrl+/ anytime to see available shortcuts.', icon: 'fa-question-circle' },
    ],
    tips: [
      'Learn 5 new shortcuts each week to build muscle memory',
      'Use one hand for shortcuts while the other uses the mouse',
      'Print the shortcut cheat sheet for quick reference',
      'Customize shortcuts to match your workflow',
    ],
    shortcuts: [
      { key: 'Ctrl+1', action: 'Open Design Canvas' },
      { key: 'Ctrl+2', action: 'Open Video Studio' },
      { key: 'Ctrl+S', action: 'Open AI Stock Generator' },
      { key: 'Ctrl+P', action: 'Open PDF Suite' },
      { key: 'Ctrl+B', action: 'Open Brand Hub' },
      { key: 'Ctrl+M', action: 'Open Marketing Hub' },
      { key: 'Ctrl+K', action: 'Open AI Assistant' },
      { key: 'Ctrl+D', action: 'Go to Dashboard' },
      { key: 'Ctrl+A', action: 'Open Assets' },
      { key: 'Ctrl+/', action: 'Show Shortcut Guide' },
      { key: 'Ctrl+Z', action: 'Undo' },
      { key: 'Ctrl+Shift+Z', action: 'Redo' },
      { key: 'Escape', action: 'Close dialogs/menus' },
    ],
  },
  workspace: {
    features: [
      { title: 'Dashboard Overview', description: 'Your central hub showing recent projects, activity feed, and quick actions.', icon: 'fa-tachometer-alt' },
      { title: 'Project Management', description: 'Create, organize, and manage projects with folders and tags.', icon: 'fa-folder-tree' },
      { title: 'Asset Library', description: 'Store and organize all your creative assets in one central location.', icon: 'fa-images' },
      { title: 'Quick Actions', description: 'Access frequently used actions with one click from the sidebar.', icon: 'fa-bolt' },
      { title: 'Recent Files', description: 'Instantly access your most recently edited projects and files.', icon: 'fa-clock' },
      { title: 'Search Everything', description: 'Powerful search across all projects, assets, and content.', icon: 'fa-search' },
    ],
    tips: [
      'Pin frequently used projects to the top of your dashboard',
      'Use folders and tags together for powerful organization',
      'Star important assets to find them quickly later',
      'Use the command palette (Ctrl+K) for lightning-fast navigation',
    ],
    shortcuts: [
      { key: 'Ctrl+N', action: 'New project' },
      { key: 'Ctrl+O', action: 'Open project' },
      { key: 'Ctrl+F', action: 'Search' },
      { key: 'Ctrl+K', action: 'Command palette' },
    ],
  },
  collaboration: {
    features: [
      { title: 'Real-Time Editing', description: 'Work simultaneously with team members and see changes as they happen.', icon: 'fa-sync' },
      { title: 'Live Cursors', description: 'See where team members are working with colored cursors and names.', icon: 'fa-mouse-pointer' },
      { title: 'Comments & Annotations', description: 'Leave feedback directly on designs with threaded comments.', icon: 'fa-comment-dots' },
      { title: 'Version Control', description: 'Track all changes with automatic versioning and restore previous states.', icon: 'fa-code-branch' },
      { title: 'Team Workspaces', description: 'Create dedicated spaces for different teams or projects.', icon: 'fa-users-cog' },
      { title: 'Permission Controls', description: 'Fine-grained access control for viewers, editors, and admins.', icon: 'fa-user-lock' },
    ],
    tips: [
      'Use @mentions to notify specific team members in comments',
      'Set up workspace roles to control who can edit vs view',
      'Enable notifications to stay updated on project changes',
      'Use version history to track and review all changes',
    ],
  },
  integrations: {
    features: [
      { title: 'Cloud Storage', description: 'Connect Google Drive, Dropbox, OneDrive, and other cloud services.', icon: 'fa-cloud' },
      { title: 'Design Tools', description: 'Import from Figma, Sketch, Adobe XD, and Photoshop.', icon: 'fa-bezier-curve' },
      { title: 'Marketing Platforms', description: 'Publish directly to social media and marketing platforms.', icon: 'fa-share-alt' },
      { title: 'Project Management', description: 'Sync with Slack, Notion, Asana, and Trello.', icon: 'fa-tasks' },
      { title: 'Developer Tools', description: 'API access and webhooks for custom integrations.', icon: 'fa-code' },
      { title: 'Stock Libraries', description: 'Access millions of photos, icons, and illustrations from Unsplash, Pexels, and more.', icon: 'fa-photo-video' },
    ],
    tips: [
      'Connect cloud storage to automatically backup your projects',
      'Use the Slack integration for real-time notifications',
      'Import your existing designs to continue work in Lumina Studio',
      'Check the API documentation for custom integration options',
    ],
  },
  enterprise: {
    features: [
      { title: 'Team Workspaces', description: 'Create dedicated spaces for teams with shared assets, unified permissions, and role-based access control.', icon: 'fa-users-cog' },
      { title: 'Approval Workflows', description: 'Set up multi-stage review processes with custom templates, sequential approvers, and deadline tracking.', icon: 'fa-check-double' },
      { title: 'Audit Logs', description: 'Track all user actions for compliance with detailed filtering, risk indicators, and export capabilities.', icon: 'fa-clipboard-list' },
      { title: 'SSO/SAML', description: 'Enterprise authentication with SAML 2.0 and OIDC support for Okta, Azure AD, Google, and more.', icon: 'fa-key' },
      { title: 'White-labeling', description: 'Complete branding customization including logos, colors, custom domains, and branded emails.', icon: 'fa-palette' },
      { title: 'Domain Verification', description: 'Verify your organization domains with DNS TXT records for enhanced security.', icon: 'fa-shield-alt' },
    ],
    tips: [
      'Set up SSO first to streamline team onboarding',
      'Create approval workflow templates for recurring project types',
      'Configure audit log retention policies based on your compliance requirements',
      'Use white-labeling to present a professional, branded experience to clients',
      'Organize teams into separate workspaces for better asset management',
      'Enable domain allowlists to restrict sign-ups to verified domains',
    ],
    shortcuts: [
      { key: 'Ctrl+Shift+W', action: 'Switch workspace' },
      { key: 'Ctrl+Shift+A', action: 'View pending approvals' },
      { key: 'Ctrl+Shift+L', action: 'Open audit logs' },
    ],
  },
  export: {
    features: [
      { title: 'Multiple Formats', description: 'Export to PNG, JPG, SVG, PDF, WebP, AVIF, and more.', icon: 'fa-file-image' },
      { title: 'Quality Settings', description: 'Fine-tune compression and quality for perfect file sizes.', icon: 'fa-sliders-h' },
      { title: 'Batch Export', description: 'Export multiple files or all project assets at once.', icon: 'fa-file-export' },
      { title: 'Social Media Presets', description: 'Pre-configured sizes for every major platform.', icon: 'fa-hashtag' },
      { title: 'Direct Publishing', description: 'Publish directly to social media or embed on websites.', icon: 'fa-globe' },
      { title: 'Link Sharing', description: 'Generate shareable links with optional password protection.', icon: 'fa-link' },
    ],
    tips: [
      'Use WebP format for web to reduce file sizes by up to 30%',
      'Export @2x resolution for retina displays',
      'Create export presets for frequently used settings',
      'Use batch export to save time on multi-asset projects',
    ],
    shortcuts: [
      { key: 'Ctrl+E', action: 'Quick export' },
      { key: 'Ctrl+Shift+E', action: 'Export with options' },
      { key: 'Ctrl+Shift+S', action: 'Save as' },
    ],
  },
  billing: {
    features: [
      { title: 'Plan Comparison', description: 'Compare Free, Pro, and Enterprise plans to find your perfect fit.', icon: 'fa-tags' },
      { title: 'Payment Methods', description: 'Pay with credit card, PayPal, or bank transfer (Enterprise).', icon: 'fa-wallet' },
      { title: 'Usage Tracking', description: 'Monitor your storage, AI credits, and export usage in real-time.', icon: 'fa-chart-pie' },
      { title: 'Invoices & Receipts', description: 'Access and download all billing documents from your account.', icon: 'fa-file-invoice' },
      { title: 'Team Billing', description: 'Centralized billing for teams with seat management.', icon: 'fa-users' },
      { title: 'Annual Savings', description: 'Save up to 40% with annual billing compared to monthly.', icon: 'fa-percentage' },
    ],
    tips: [
      'Switch to annual billing to save up to 40%',
      'Use the usage dashboard to optimize your plan',
      'Team plans include admin billing controls',
      'Contact support for custom enterprise pricing',
    ],
  },
  troubleshooting: {
    features: [
      { title: 'Performance Issues', description: 'Solutions for slow loading, lag, and memory problems.', icon: 'fa-tachometer-alt' },
      { title: 'Export Problems', description: 'Fix common export errors and format compatibility issues.', icon: 'fa-exclamation-circle' },
      { title: 'Account & Login', description: 'Resolve sign-in issues, password resets, and account recovery.', icon: 'fa-user-circle' },
      { title: 'Sync Issues', description: 'Troubleshoot cloud sync and collaboration problems.', icon: 'fa-sync-alt' },
      { title: 'Browser Compatibility', description: 'Ensure optimal performance across different browsers.', icon: 'fa-globe' },
      { title: 'File Recovery', description: 'Recover lost or corrupted files from auto-save and backups.', icon: 'fa-undo-alt' },
    ],
    tips: [
      'Clear browser cache if you experience display issues',
      'Use Chrome or Edge for best performance',
      'Check your internet connection for sync problems',
      'Enable auto-save to prevent data loss',
      'Contact support if issues persist after troubleshooting',
    ],
  },
  faq: {
    features: [
      { title: 'Getting Started', description: 'Common questions about signing up and first steps.', icon: 'fa-play-circle' },
      { title: 'Pricing & Plans', description: 'Questions about costs, upgrades, and billing cycles.', icon: 'fa-dollar-sign' },
      { title: 'Features', description: 'Learn about specific tools and capabilities.', icon: 'fa-puzzle-piece' },
      { title: 'AI Features', description: 'Understanding AI image generation and limitations.', icon: 'fa-robot' },
      { title: 'Privacy & Security', description: 'How we protect your data and content.', icon: 'fa-shield-alt' },
      { title: 'Technical Requirements', description: 'Browser, device, and internet requirements.', icon: 'fa-desktop' },
    ],
    tips: [
      'Check the FAQ before contacting support for faster answers',
      'Use the search bar to find specific topics quickly',
      'Join our community Discord for peer support',
      'Submit feature requests through the feedback portal',
    ],
  },
  accessibility: {
    features: [
      { title: 'Keyboard Navigation', description: 'Full keyboard support for all features and tools.', icon: 'fa-keyboard' },
      { title: 'Screen Reader Support', description: 'Optimized for NVDA, JAWS, VoiceOver, and other screen readers.', icon: 'fa-assistive-listening-systems' },
      { title: 'High Contrast Mode', description: 'Enhanced visibility with high contrast color schemes.', icon: 'fa-adjust' },
      { title: 'Focus Indicators', description: 'Clear visual focus states for keyboard navigation.', icon: 'fa-crosshairs' },
      { title: 'Text Scaling', description: 'Support for browser text zoom up to 200%.', icon: 'fa-text-height' },
      { title: 'Motion Preferences', description: 'Respect system settings for reduced motion.', icon: 'fa-running' },
    ],
    tips: [
      'Use Tab and Shift+Tab to navigate between elements',
      'Press Enter or Space to activate buttons and controls',
      'Enable high contrast mode in Settings > Accessibility',
      'Use keyboard shortcuts for faster workflow',
      'Report accessibility issues to help us improve',
    ],
    shortcuts: [
      { key: 'Tab', action: 'Move to next element' },
      { key: 'Shift+Tab', action: 'Move to previous element' },
      { key: 'Enter', action: 'Activate button/link' },
      { key: 'Escape', action: 'Close modal/menu' },
      { key: 'Arrow Keys', action: 'Navigate within components' },
    ],
  },
};

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Handle hash navigation
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && guideSections.find(s => s.id === hash)) {
      setActiveSection(hash);
    }
  }, [location.hash]);

  // Filter sections based on search
  const filteredSections = guideSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSection = guideSections.find(s => s.id === activeSection);
  const currentContent = sectionContent[activeSection];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden noise-overlay">
      <Navigation />

      {/* Progress bar */}
      <motion.div
        className="fixed top-20 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 z-40 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-grid opacity-30" />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-40 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-60 right-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-300">Documentation</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            User{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Guide
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            Everything you need to master Lumina Studio OS and unleash your creative potential.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-lg opacity-30 group-focus-within:opacity-50 transition-opacity" />
              <div className="relative flex items-center">
                <i className="fas fa-search absolute left-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-5 text-slate-500 hover:text-white transition-colors"
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main content area */}
      <section className="relative pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8">
            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className={`hidden lg:block w-72 flex-shrink-0 ${sidebarOpen ? '' : 'lg:hidden'}`}
            >
              <div className="sticky top-28">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="type-body-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
                    Documentation
                  </h3>
                  <nav className="space-y-1">
                    {filteredSections.map((section, index) => (
                      <motion.button
                        key={section.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white border border-indigo-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
                          <i className={`fas ${section.icon} text-sm text-white`} />
                        </span>
                        <span className="text-sm font-medium">{section.title}</span>
                      </motion.button>
                    ))}
                  </nav>
                </div>

                {/* Quick links */}
                <div className="glass-card rounded-2xl p-4 mt-4">
                  <h3 className="type-body-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
                    Quick Links
                  </h3>
                  <div className="space-y-2">
                    <Link
                      to="/studio"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                    >
                      <i className="fas fa-arrow-right text-indigo-400" />
                      Open Studio
                    </Link>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                    >
                      <i className="fab fa-discord text-indigo-400" />
                      Join Discord
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                    >
                      <i className="fab fa-youtube text-indigo-400" />
                      Video Tutorials
                    </a>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Main content */}
            <div ref={contentRef} className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Section header */}
                  {currentSection && (
                    <div className="glass-card rounded-3xl p-8 mb-8">
                      <div className="flex items-start gap-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentSection.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <i className={`fas ${currentSection.icon} text-2xl text-white`} />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold mb-2">{currentSection.title}</h2>
                          <p className="text-lg text-slate-400">{currentSection.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Features grid */}
                  {currentContent && (
                    <>
                      <h3 className="type-subsection mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                          <i className="fas fa-sparkles text-indigo-400 text-sm" />
                        </span>
                        Features
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-12">
                        {currentContent.features.map((feature, index) => (
                          <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card rounded-2xl p-6 group hover:border-indigo-500/30 transition-all"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-indigo-500/30 group-hover:to-violet-500/30 transition-all">
                                <i className={`fas ${feature.icon} text-indigo-400`} />
                              </div>
                              <div>
                                <h4 className="font-semibold mb-1 text-white">{feature.title}</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Tips section */}
                      <h3 className="type-subsection mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <i className="fas fa-lightbulb text-amber-400 text-sm" />
                        </span>
                        Pro Tips
                      </h3>
                      <div className="glass-card rounded-2xl p-6 mb-12">
                        <ul className="space-y-4">
                          {currentContent.tips.map((tip, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-3"
                            >
                              <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs text-amber-400 font-bold">{index + 1}</span>
                              </span>
                              <span className="text-slate-300">{tip}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Shortcuts table */}
                      {currentContent.shortcuts && (
                        <>
                          <h3 className="type-subsection mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                              <i className="fas fa-keyboard text-violet-400 text-sm" />
                            </span>
                            Keyboard Shortcuts
                          </h3>
                          <div className="glass-card rounded-2xl overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-slate-700/50">
                                  <th className="text-left px-6 py-4 type-body-sm font-semibold text-slate-400">Shortcut</th>
                                  <th className="text-left px-6 py-4 type-body-sm font-semibold text-slate-400">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentContent.shortcuts.map((shortcut, index) => (
                                  <motion.tr
                                    key={shortcut.key}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="border-b border-slate-800/50 last:border-b-0 hover:bg-white/5 transition-colors"
                                  >
                                    <td className="px-6 py-4">
                                      <kbd className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono text-indigo-300">
                                        {shortcut.key}
                                      </kbd>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{shortcut.action}</td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-800">
                {guideSections.findIndex(s => s.id === activeSection) > 0 ? (
                  <button
                    onClick={() => {
                      const currentIndex = guideSections.findIndex(s => s.id === activeSection);
                      setActiveSection(guideSections[currentIndex - 1].id);
                    }}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl glass-card hover:border-indigo-500/30 transition-all group"
                  >
                    <i className="fas fa-arrow-left text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-slate-300 group-hover:text-white transition-colors">
                      {guideSections[guideSections.findIndex(s => s.id === activeSection) - 1]?.title}
                    </span>
                  </button>
                ) : (
                  <div />
                )}

                {guideSections.findIndex(s => s.id === activeSection) < guideSections.length - 1 && (
                  <button
                    onClick={() => {
                      const currentIndex = guideSections.findIndex(s => s.id === activeSection);
                      setActiveSection(guideSections[currentIndex + 1].id);
                    }}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl glass-card hover:border-indigo-500/30 transition-all group"
                  >
                    <span className="text-slate-300 group-hover:text-white transition-colors">
                      {guideSections[guideSections.findIndex(s => s.id === activeSection) + 1]?.title}
                    </span>
                    <i className="fas fa-arrow-right text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/30 to-transparent" />
        <div className="absolute inset-0 bg-grid opacity-20" />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to start creating?
            </h2>
            <p className="text-slate-400 mb-8">
              Jump into the studio and put what you've learned into practice.
            </p>
            <Link
              to="/studio"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold hover:from-indigo-600 hover:to-violet-700 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
            >
              Open Studio
              <i className="fas fa-arrow-right" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UserGuide;
