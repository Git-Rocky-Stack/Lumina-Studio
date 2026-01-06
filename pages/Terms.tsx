/**
 * Terms and Conditions Page for Lumina Studio OS
 *
 * Comprehensive legal terms with premium design matching the landing page.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';

const termsData = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    icon: 'fa-handshake',
    content: `
      <p>By accessing or using Lumina Studio OS ("the Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not access or use the Service.</p>

      <p>These Terms apply to all visitors, users, and others who access or use the Service. By using the Service, you represent that you are at least 18 years of age, or if you are under 18, that you have obtained parental or guardian consent to use the Service.</p>

      <p>We reserve the right to update or modify these Terms at any time without prior notice. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms. We encourage you to review these Terms periodically.</p>
    `,
  },
  {
    id: 'description',
    title: '2. Description of Service',
    icon: 'fa-info-circle',
    content: `
      <p>Lumina Studio OS is a comprehensive creative platform that provides:</p>

      <ul>
        <li><strong>Design Canvas:</strong> Professional graphic design tools with AI assistance</li>
        <li><strong>Video Studio:</strong> Video editing and production capabilities</li>
        <li><strong>AI Stock Generator:</strong> AI-powered image and video generation</li>
        <li><strong>PDF Suite:</strong> PDF editing, conversion, and management</li>
        <li><strong>Pro Photo:</strong> Advanced photo editing tools</li>
        <li><strong>Brand Hub:</strong> Brand asset management</li>
        <li><strong>Marketing Hub:</strong> Marketing content creation tools</li>
        <li><strong>AI Assistant:</strong> Intelligent creative assistance</li>
      </ul>

      <p>The Service may be updated, modified, or discontinued at any time without notice. We reserve the right to add or remove features, change pricing, or modify the functionality of the Service.</p>
    `,
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    icon: 'fa-user-shield',
    content: `
      <h4>3.1 Account Creation</h4>
      <p>To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.</p>

      <h4>3.2 Account Security</h4>
      <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party and to notify us immediately of any unauthorized use of your account.</p>

      <h4>3.3 Account Termination</h4>
      <p>We reserve the right to suspend or terminate your account at any time, with or without cause, and with or without notice. Upon termination, your right to use the Service will immediately cease.</p>

      <h4>3.4 Data Retention</h4>
      <p>Upon account termination, we may retain certain data as required by law or for legitimate business purposes. You may request deletion of your personal data in accordance with our Privacy Policy.</p>
    `,
  },
  {
    id: 'subscription',
    title: '4. Subscription and Billing',
    icon: 'fa-credit-card',
    content: `
      <h4>4.1 Free and Paid Plans</h4>
      <p>Lumina Studio OS offers both free and paid subscription plans. Free plans have limited features and usage quotas. Paid plans unlock additional features and higher usage limits.</p>

      <h4>4.2 Payment Terms</h4>
      <p>For paid subscriptions, you agree to pay all fees associated with your selected plan. Fees are billed in advance on a monthly or annual basis, depending on your subscription choice. All payments are non-refundable except as expressly set forth herein.</p>

      <h4>4.3 Automatic Renewal</h4>
      <p>Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date. You may cancel your subscription at any time through your account settings.</p>

      <h4>4.4 Price Changes</h4>
      <p>We reserve the right to change our prices at any time. If we change prices for your subscription, we will notify you at least 30 days before the change takes effect. Your continued use of the Service after the price change constitutes your agreement to pay the new price.</p>

      <h4>4.5 Refund Policy</h4>
      <p>We offer a 14-day money-back guarantee for annual subscriptions. Monthly subscriptions are non-refundable. To request a refund, contact our support team within 14 days of your purchase.</p>
    `,
  },
  {
    id: 'usage',
    title: '5. Acceptable Use Policy',
    icon: 'fa-shield-check',
    content: `
      <h4>5.1 Permitted Use</h4>
      <p>You may use the Service only for lawful purposes and in accordance with these Terms. You agree to use the Service in a manner consistent with any applicable laws and regulations.</p>

      <h4>5.2 Prohibited Activities</h4>
      <p>You agree NOT to:</p>
      <ul>
        <li>Use the Service for any illegal or unauthorized purpose</li>
        <li>Violate any laws in your jurisdiction</li>
        <li>Infringe upon the intellectual property rights of others</li>
        <li>Upload or transmit viruses, malware, or other malicious code</li>
        <li>Attempt to gain unauthorized access to the Service or its systems</li>
        <li>Interfere with or disrupt the Service or servers</li>
        <li>Use the Service to generate content that is illegal, harmful, or offensive</li>
        <li>Impersonate any person or entity</li>
        <li>Collect or store personal data about other users without consent</li>
        <li>Use automated systems to access the Service without permission</li>
        <li>Resell, sublicense, or redistribute the Service without authorization</li>
        <li>Remove or alter any proprietary notices from the Service</li>
      </ul>

      <h4>5.3 AI-Generated Content</h4>
      <p>When using AI features to generate content, you are responsible for ensuring that such content complies with applicable laws and does not infringe upon third-party rights. AI-generated content must not be used to create deepfakes, misleading content, or content that could harm individuals or groups.</p>
    `,
  },
  {
    id: 'intellectual-property',
    title: '6. Intellectual Property Rights',
    icon: 'fa-copyright',
    content: `
      <h4>6.1 Our Intellectual Property</h4>
      <p>The Service and its original content, features, and functionality are owned by Lumina Studio and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

      <h4>6.2 Your Content</h4>
      <p>You retain all rights to the content you create using the Service ("User Content"). By uploading or creating content through the Service, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display such content solely for the purpose of providing the Service.</p>

      <h4>6.3 AI-Generated Content Ownership</h4>
      <p>Content generated using our AI tools is owned by you, subject to the following conditions:</p>
      <ul>
        <li>Free plan users: Limited commercial use rights</li>
        <li>Pro plan users: Full commercial use rights</li>
        <li>Enterprise plan users: Full commercial use rights with extended licensing</li>
      </ul>

      <h4>6.4 Feedback</h4>
      <p>Any feedback, suggestions, or ideas you provide regarding the Service may be used by us without any obligation to compensate you.</p>

      <h4>6.5 Third-Party Content</h4>
      <p>The Service may include content from third parties, including templates, stock images, and fonts. Your use of such content is subject to the applicable third-party licenses.</p>
    `,
  },
  {
    id: 'privacy',
    title: '7. Privacy and Data Protection',
    icon: 'fa-lock',
    content: `
      <h4>7.1 Privacy Policy</h4>
      <p>Your privacy is important to us. Our <a href="/privacy" class="text-indigo-400 hover:text-indigo-300 underline">Privacy Policy</a> explains how we collect, use, and protect your personal information. By using the Service, you consent to our collection and use of data as described in the Privacy Policy.</p>

      <h4>7.2 Data Processing</h4>
      <p>We process your data in accordance with applicable data protection laws, including GDPR where applicable. You have rights regarding your personal data, including access, correction, deletion, and portability.</p>

      <h4>7.3 Data Security</h4>
      <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>

      <h4>7.4 Third-Party Services</h4>
      <p>The Service may integrate with third-party services. Your use of such integrations is subject to the privacy policies of those third parties.</p>
    `,
  },
  {
    id: 'disclaimers',
    title: '8. Disclaimers and Limitations',
    icon: 'fa-exclamation-triangle',
    content: `
      <h4>8.1 Service "As Is"</h4>
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

      <h4>8.2 No Guarantee of Availability</h4>
      <p>We do not guarantee that the Service will be uninterrupted, secure, or error-free. We may experience hardware, software, or other problems that may result in downtime or data loss.</p>

      <h4>8.3 AI Limitations</h4>
      <p>Our AI features may produce inaccurate, incomplete, or unexpected results. You are solely responsible for reviewing and verifying any AI-generated content before use.</p>

      <h4>8.4 Limitation of Liability</h4>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL LUMINA STUDIO, ITS AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.</p>

      <h4>8.5 Maximum Liability</h4>
      <p>Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.</p>
    `,
  },
  {
    id: 'indemnification',
    title: '9. Indemnification',
    icon: 'fa-shield-alt',
    content: `
      <p>You agree to defend, indemnify, and hold harmless Lumina Studio, its affiliates, and their respective officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from:</p>

      <ul>
        <li>Your use of and access to the Service</li>
        <li>Your violation of these Terms</li>
        <li>Your violation of any third-party rights, including intellectual property rights</li>
        <li>Any content you upload, post, or transmit through the Service</li>
        <li>Your negligent or wrongful conduct</li>
      </ul>

      <p>We reserve the right to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you will cooperate with us in asserting any available defenses.</p>
    `,
  },
  {
    id: 'termination',
    title: '10. Termination',
    icon: 'fa-times-circle',
    content: `
      <h4>10.1 Termination by You</h4>
      <p>You may terminate your account at any time by contacting us or through your account settings. Upon termination, your right to use the Service will immediately cease.</p>

      <h4>10.2 Termination by Us</h4>
      <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including but not limited to:</p>
      <ul>
        <li>Breach of these Terms</li>
        <li>Suspected fraudulent, abusive, or illegal activity</li>
        <li>Non-payment of fees</li>
        <li>Extended periods of inactivity</li>
        <li>Requests by law enforcement or government agencies</li>
      </ul>

      <h4>10.3 Effect of Termination</h4>
      <p>Upon termination:</p>
      <ul>
        <li>All rights granted to you under these Terms will cease</li>
        <li>You must stop using the Service</li>
        <li>We may delete your account and data (subject to legal retention requirements)</li>
        <li>Provisions that by their nature should survive termination will survive</li>
      </ul>
    `,
  },
  {
    id: 'governing-law',
    title: '11. Governing Law and Disputes',
    icon: 'fa-gavel',
    content: `
      <h4>11.1 Governing Law</h4>
      <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.</p>

      <h4>11.2 Dispute Resolution</h4>
      <p>Any dispute arising from these Terms or your use of the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>

      <h4>11.3 Class Action Waiver</h4>
      <p>YOU AGREE THAT ANY CLAIMS MUST BE BROUGHT IN YOUR INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.</p>

      <h4>11.4 Time Limitation</h4>
      <p>Any claim or cause of action arising out of or related to these Terms or the Service must be filed within one (1) year after such claim or cause of action arose.</p>
    `,
  },
  {
    id: 'miscellaneous',
    title: '12. Miscellaneous',
    icon: 'fa-ellipsis-h',
    content: `
      <h4>12.1 Entire Agreement</h4>
      <p>These Terms, together with our Privacy Policy and any other legal notices published on the Service, constitute the entire agreement between you and Lumina Studio regarding the Service.</p>

      <h4>12.2 Severability</h4>
      <p>If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will continue in full force and effect.</p>

      <h4>12.3 Waiver</h4>
      <p>Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>

      <h4>12.4 Assignment</h4>
      <p>You may not assign or transfer these Terms without our prior written consent. We may assign our rights and obligations under these Terms without restriction.</p>

      <h4>12.5 Force Majeure</h4>
      <p>We shall not be liable for any failure or delay in performing our obligations due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, riots, embargoes, or acts of civil or military authorities.</p>

      <h4>12.6 Contact Information</h4>
      <p>For questions about these Terms, please contact us at:</p>
      <p>Email: support@strategia-x.com</p>
    `,
  },
];

const Terms: React.FC = () => {
  const [activeSection, setActiveSection] = useState('acceptance');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden noise-overlay">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-grid opacity-30" />

        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-40 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <i className="fas fa-file-contract text-indigo-400" />
            <span className="text-sm text-slate-300">Legal</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            Terms and{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Conditions
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-6"
          >
            Please read these terms carefully before using Lumina Studio OS.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-slate-500"
          >
            Last updated: December 2024
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <motion.aside
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden lg:block w-72 flex-shrink-0"
            >
              <div className="sticky top-28">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
                    Table of Contents
                  </h3>
                  <nav className="space-y-1">
                    {termsData.map((section, index) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm transition-all ${
                          activeSection === section.id
                            ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <i className={`fas ${section.icon} w-4 text-center text-xs`} />
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Quick Links */}
                <div className="glass-card rounded-2xl p-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
                    Related Pages
                  </h3>
                  <div className="space-y-2">
                    <Link
                      to="/privacy"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                    >
                      <i className="fas fa-shield-alt text-indigo-400" />
                      Privacy Policy
                    </Link>
                    <Link
                      to="/guide"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                    >
                      <i className="fas fa-book text-indigo-400" />
                      User Guide
                    </Link>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="glass-card rounded-3xl p-8 md:p-12">
                {/* Introduction */}
                <div className="mb-12 pb-8 border-b border-slate-700/50">
                  <p className="text-slate-300 leading-relaxed">
                    Welcome to Lumina Studio OS. These Terms and Conditions ("Terms") govern your access to and use of
                    our website, applications, and services (collectively, the "Service"). By using Lumina Studio OS,
                    you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
                  </p>
                </div>

                {/* Terms Sections */}
                <div className="space-y-12">
                  {termsData.map((section, index) => (
                    <motion.div
                      key={section.id}
                      id={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      onViewportEnter={() => setActiveSection(section.id)}
                      className="scroll-mt-32"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                          <i className={`fas ${section.icon} text-indigo-400`} />
                        </div>
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                      </div>
                      <div
                        className="prose prose-invert prose-slate max-w-none
                          prose-headings:text-white prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                          prose-h4:text-lg prose-h4:text-slate-200
                          prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
                          prose-ul:text-slate-300 prose-ul:my-4
                          prose-li:text-slate-300 prose-li:my-1
                          prose-strong:text-white prose-strong:font-semibold
                          prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Agreement Notice */}
                <div className="mt-16 pt-8 border-t border-slate-700/50">
                  <div className="glass-card rounded-2xl p-6 bg-indigo-500/10 border-indigo-500/20">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-check-circle text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-2">Your Agreement</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          By creating an account or using Lumina Studio OS, you acknowledge that you have read,
                          understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.
                          If you have any questions, please contact us at legal@luminastudio.com.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print/Download */}
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card hover:bg-white/10 transition-colors text-sm"
                  >
                    <i className="fas fa-print" />
                    Print Terms
                  </button>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card hover:bg-white/10 transition-colors text-sm"
                  >
                    <i className="fas fa-download" />
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
