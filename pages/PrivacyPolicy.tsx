/**
 * Privacy Policy Page for Lumina Studio OS
 *
 * Comprehensive privacy policy with premium design matching the landing page.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = 'December 22, 2025';

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      content: `Welcome to Lumina Studio OS ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered creative suite platform, including our website, applications, and services (collectively, the "Service").

By accessing or using Lumina Studio OS, you agree to this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the Service.`,
    },
    {
      id: 'information-we-collect',
      title: 'Information We Collect',
      content: `We collect information that you provide directly to us, information we obtain automatically when you use our Service, and information from third-party sources.

**Information You Provide:**
- **Account Information:** When you create an account, we collect your name, email address, password, and optional profile information.
- **Payment Information:** When you subscribe to our premium services, we collect payment details through our secure payment processor (Stripe). We do not store complete credit card numbers on our servers.
- **Content and Files:** We collect the content you create, upload, or receive through our Service, including images, videos, designs, and documents.
- **Communications:** When you contact us for support or feedback, we collect the information you provide in those communications.
- **Survey Responses:** If you participate in surveys or research, we collect the responses you provide.

**Information Collected Automatically:**
- **Usage Data:** We collect information about how you interact with our Service, including features used, actions taken, time spent, and navigation patterns.
- **Device Information:** We collect device type, operating system, browser type, unique device identifiers, and mobile network information.
- **Log Data:** Our servers automatically record information including your IP address, access times, pages viewed, and the page you visited before navigating to our Service.
- **Cookies and Similar Technologies:** We use cookies, pixels, and similar technologies to collect information about your browsing activities and to distinguish you from other users.

**Information from Third Parties:**
- **Social Login:** If you sign in using Google, Apple, or other social providers, we receive information from those services as permitted by your settings.
- **Analytics Partners:** We receive aggregated analytics data from our partners to help improve our Service.`,
    },
    {
      id: 'how-we-use-information',
      title: 'How We Use Your Information',
      content: `We use the information we collect for various purposes, including:

**Service Delivery:**
- Provide, maintain, and improve our Service
- Process transactions and send related information
- Create and manage your account
- Enable features like AI image generation, video creation, and design tools
- Store and process your creative projects

**Communication:**
- Send you technical notices, updates, security alerts, and administrative messages
- Respond to your comments, questions, and customer service requests
- Send promotional communications (with your consent)
- Provide news and information about our products and services

**Personalization:**
- Personalize and improve your experience
- Provide content recommendations
- Remember your preferences and settings

**AI and Machine Learning:**
- Improve our AI models and algorithms
- Develop new features and services
- Analyze usage patterns to enhance user experience

**Safety and Security:**
- Detect, prevent, and address fraud, abuse, and security issues
- Protect the rights, property, and safety of our users and others
- Enforce our Terms of Service and other policies

**Legal Compliance:**
- Comply with applicable laws, regulations, and legal processes
- Respond to lawful requests from public authorities`,
    },
    {
      id: 'ai-generated-content',
      title: 'AI-Generated Content and Data Processing',
      content: `Lumina Studio OS uses artificial intelligence to provide creative tools and generate content. Here's how we handle AI-related data:

**Content Generation:**
- When you use our AI features (image generation, video creation, etc.), your prompts and inputs are processed to generate content.
- Generated content is stored in your account and can be accessed, downloaded, or deleted at any time.

**Model Training:**
- We may use aggregated, anonymized usage data to improve our AI models.
- We do NOT use your personal creative content to train our AI models without explicit consent.
- You retain full ownership of the content you create using our tools.

**Third-Party AI Services:**
- Some AI features may utilize third-party services (such as Google AI, OpenAI, or similar providers).
- When using these services, your data is processed according to both our privacy policy and the respective third-party's privacy policy.
- We carefully select AI partners who maintain strong privacy and security standards.

**Content Moderation:**
- AI-generated content may be automatically scanned to prevent the creation of harmful or prohibited content.
- This scanning is automated and designed to protect our community.`,
    },
    {
      id: 'data-sharing',
      title: 'How We Share Your Information',
      content: `We do not sell your personal information. We may share your information in the following circumstances:

**Service Providers:**
We share information with third-party vendors who perform services on our behalf, including:
- Cloud hosting and storage (Cloudflare, AWS)
- Payment processing (Stripe)
- Authentication services (Clerk)
- Analytics and monitoring
- Customer support tools
- Email delivery services

**Business Transfers:**
If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.

**Legal Requirements:**
We may disclose your information if required by law or in response to valid legal requests, such as subpoenas, court orders, or government requests.

**Protection of Rights:**
We may disclose information when we believe it is necessary to:
- Protect our rights, privacy, safety, or property
- Protect the rights, privacy, safety, or property of our users or others
- Enforce our Terms of Service
- Respond to claims that content violates the rights of third parties

**With Your Consent:**
We may share your information with third parties when you give us explicit consent to do so.

**Aggregated or De-identified Data:**
We may share aggregated or de-identified information that cannot reasonably be used to identify you.`,
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: `We implement robust security measures to protect your information:

**Technical Safeguards:**
- Encryption of data in transit (TLS/SSL) and at rest (AES-256)
- Secure cloud infrastructure with regular security audits
- Multi-factor authentication options
- Regular security testing and vulnerability assessments
- Automated threat detection and monitoring

**Organizational Measures:**
- Limited access to personal data on a need-to-know basis
- Employee security training and awareness programs
- Incident response procedures
- Regular review and update of security policies

**Your Responsibilities:**
- Keep your login credentials confidential
- Use strong, unique passwords
- Enable two-factor authentication when available
- Log out of your account on shared devices
- Report any suspected security incidents to us immediately

While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.`,
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      content: `We retain your information for as long as necessary to provide our Service and fulfill the purposes described in this Privacy Policy:

**Account Data:**
- Active accounts: Retained while your account is active
- Deleted accounts: Personal data is deleted within 30 days of account deletion
- Some data may be retained longer for legal, tax, or regulatory purposes

**Content and Projects:**
- Your creative content is retained while your account is active
- Upon account deletion, content is permanently removed within 30 days
- Backups may retain data for up to 90 days

**Usage and Analytics Data:**
- Aggregated analytics: Retained indefinitely in anonymized form
- Individual usage logs: Retained for 12 months

**Communication Records:**
- Support tickets and communications: Retained for 3 years
- Marketing consent records: Retained for the duration of consent plus 3 years

**Legal Holds:**
- Data subject to legal proceedings may be retained until the matter is resolved`,
    },
    {
      id: 'your-rights',
      title: 'Your Privacy Rights',
      content: `Depending on your location, you may have certain rights regarding your personal information:

**Access and Portability:**
- Request a copy of the personal information we hold about you
- Receive your data in a structured, machine-readable format

**Correction:**
- Request correction of inaccurate or incomplete personal information
- Update your account information directly through your account settings

**Deletion:**
- Request deletion of your personal information
- Delete your account and associated data
- Note: Some data may be retained for legal or legitimate business purposes

**Restriction and Objection:**
- Request restriction of processing in certain circumstances
- Object to processing based on legitimate interests
- Opt out of marketing communications

**Withdraw Consent:**
- Withdraw consent where processing is based on consent
- This will not affect the lawfulness of processing before withdrawal

**Lodge a Complaint:**
- File a complaint with your local data protection authority

**Exercising Your Rights:**
To exercise these rights, contact us at support@strategia-x.com or through your account settings. We will respond to requests within 30 days (or as required by applicable law).

**Non-Discrimination:**
We will not discriminate against you for exercising your privacy rights.`,
    },
    {
      id: 'international-transfers',
      title: 'International Data Transfers',
      content: `Lumina Studio OS operates globally, and your information may be transferred to and processed in countries other than your country of residence.

**Transfer Mechanisms:**
- We use Standard Contractual Clauses (SCCs) approved by relevant authorities
- We rely on adequacy decisions where available
- We implement additional safeguards as appropriate

**Data Storage:**
- Primary data storage is in the United States
- We may use servers in other locations for performance and redundancy
- All data centers meet our security and compliance requirements

**Your Choices:**
By using our Service, you consent to the transfer of your information as described in this Privacy Policy. If you do not consent to such transfers, you may choose not to use our Service.`,
    },
    {
      id: 'childrens-privacy',
      title: "Children's Privacy",
      content: `Lumina Studio OS is not intended for children under the age of 13 (or 16 in certain jurisdictions).

**Our Policy:**
- We do not knowingly collect personal information from children under 13
- If we discover we have collected information from a child under 13, we will delete it promptly
- Parents or guardians who believe their child has provided us with personal information should contact us

**Age Verification:**
- We may implement age verification measures
- Users must confirm they meet the minimum age requirement during registration

**Parental Rights:**
If you are a parent or guardian and believe your child has provided personal information to us, please contact us at support@strategia-x.com to request deletion.`,
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking Technologies',
      content: `We use cookies and similar tracking technologies to collect and store information about your interactions with our Service.

**Types of Cookies We Use:**

*Essential Cookies:*
Required for the Service to function properly. These cannot be disabled.
- Authentication and session management
- Security features
- Load balancing

*Functional Cookies:*
Remember your preferences and settings.
- Language preferences
- Display settings
- Recently used features

*Analytics Cookies:*
Help us understand how users interact with our Service.
- Page views and navigation patterns
- Feature usage statistics
- Performance monitoring

*Marketing Cookies:*
Used to deliver relevant advertisements and measure campaign effectiveness.
- Interest-based advertising
- Conversion tracking
- Retargeting

**Managing Cookies:**
- Browser settings: Most browsers allow you to control cookies through settings
- Our cookie banner: You can manage preferences when you first visit
- Opt-out tools: You can opt out of certain advertising cookies through industry tools

**Do Not Track:**
We currently do not respond to "Do Not Track" browser signals, as there is no consistent industry standard for compliance.`,
    },
    {
      id: 'third-party-links',
      title: 'Third-Party Links and Services',
      content: `Our Service may contain links to third-party websites, services, or applications that are not operated by us.

**Third-Party Services:**
- Social media platforms
- Payment processors
- Analytics providers
- Integration partners

**Your Interactions:**
- We are not responsible for the privacy practices of third parties
- We encourage you to review the privacy policies of any third-party services you access
- Information you share with third parties is governed by their privacy policies

**Integrations:**
When you connect third-party services to your Lumina Studio OS account:
- We only access information necessary for the integration
- You can disconnect integrations at any time through your account settings
- Disconnecting will stop data sharing but may not delete previously shared data`,
    },
    {
      id: 'changes',
      title: 'Changes to This Privacy Policy',
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors.

**Notification of Changes:**
- We will post the updated Privacy Policy on this page
- We will update the "Last Updated" date at the top
- For material changes, we will provide prominent notice (e.g., email notification, in-app notice)

**Your Continued Use:**
Your continued use of the Service after any changes indicates your acceptance of the updated Privacy Policy. If you do not agree with the changes, you should stop using the Service.

**Review Regularly:**
We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.`,
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: `If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:

**Email:** support@strategia-x.com

**General Support:** support@strategia-x.com

**Data Protection Officer:**
For EU/EEA residents, you may contact our Data Protection Officer at support@strategia-x.com

**Response Time:**
We aim to respond to all privacy-related inquiries within 30 days.

**Preferred Contact Method:**
For fastest response, please use email and include:
- Your account email (if applicable)
- A detailed description of your question or request
- Any relevant documentation`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden noise-overlay">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -15, 0], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-40 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-60 right-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl"
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
          >
            <i className="fas fa-shield-halved text-indigo-400" />
            <span className="text-sm text-slate-300">Legal</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Privacy{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Policy
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Your privacy is important to us. This policy explains how Lumina Studio OS collects, uses, and protects your information.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-sm text-slate-500"
          >
            Last updated: {lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="relative py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="type-subsection mb-4 flex items-center gap-2">
              <i className="fas fa-list text-indigo-400" />
              Table of Contents
            </h2>
            <div className="grid md:grid-cols-2 gap-2">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <span className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
                    {index + 1}
                  </span>
                  <span className="text-sm">{section.title}</span>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="relative py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: 0.1 }}
              className="scroll-mt-28"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-indigo-400 font-semibold">
                  {index + 1}
                </span>
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <div className="prose prose-invert prose-slate max-w-none">
                  {section.content.split('\n\n').map((paragraph, pIndex) => {
                    // Handle bold headers
                    if (paragraph.startsWith('**') && paragraph.includes(':**')) {
                      const [header, ...rest] = paragraph.split(':**');
                      return (
                        <div key={pIndex} className="mb-4">
                          <h3 className="type-subsection text-white mb-2">
                            {header.replace(/\*\*/g, '')}
                          </h3>
                          <p className="text-slate-400 leading-relaxed whitespace-pre-line">
                            {rest.join(':**')}
                          </p>
                        </div>
                      );
                    }
                    // Handle italic sub-headers
                    if (paragraph.startsWith('*') && paragraph.endsWith('*') && !paragraph.startsWith('**')) {
                      return (
                        <h4 key={pIndex} className="text-base font-medium text-indigo-300 mt-4 mb-2">
                          {paragraph.replace(/\*/g, '')}
                        </h4>
                      );
                    }
                    // Handle list items
                    if (paragraph.startsWith('- ')) {
                      return (
                        <ul key={pIndex} className="list-none space-y-2 mb-4">
                          {paragraph.split('\n').map((item, iIndex) => (
                            <li key={iIndex} className="flex items-start gap-3 text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                              <span className="leading-relaxed">
                                {item.replace(/^- /, '').split('**').map((part, partIndex) =>
                                  partIndex % 2 === 1 ? <strong key={partIndex} className="text-slate-200">{part}</strong> : part
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    // Regular paragraphs
                    return (
                      <p key={pIndex} className="text-slate-400 leading-relaxed mb-4">
                        {paragraph.split('**').map((part, partIndex) =>
                          partIndex % 2 === 1 ? <strong key={partIndex} className="text-slate-200">{part}</strong> : part
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              If you have any questions about this Privacy Policy or our data practices, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:privacy@lumina-os.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold hover:from-indigo-600 hover:to-violet-700 transition-all hover:scale-105"
              >
                <i className="fas fa-envelope" />
                Contact Privacy Team
              </a>
              <Link
                to="/guide"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-card hover:border-indigo-500/30 transition-all"
              >
                <i className="fas fa-book" />
                View User Guide
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
