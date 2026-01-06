import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'What AI models power Lumina Studio?',
    answer: 'Lumina Studio is powered by Google Gemini 2.0 for image generation and advanced video creation. These are the latest and most advanced AI models available, ensuring the highest quality outputs for all your creative needs.',
    icon: 'fa-microchip',
  },
  {
    question: 'Can I use generated content commercially?',
    answer: 'Yes! All content generated in Lumina Studio comes with a full commercial license. You own the rights to everything you create and can use it for any purpose, including client work and products for sale.',
    icon: 'fa-briefcase',
  },
  {
    question: 'How does team collaboration work?',
    answer: 'Team plans include shared workspaces where members can collaborate in real-time. You can share brand kits, templates, and assets across your team, with role-based permissions to control access.',
    icon: 'fa-users',
  },
  {
    question: 'What export formats are supported?',
    answer: 'We support all major formats including PNG, JPG, WebP, SVG for images; MP4, WebM, GIF for videos; and PDF for documents. Pro and Team plans include additional formats like PSD and AI.',
    icon: 'fa-file-export',
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes, Pro and Team plans include API access. You can integrate Lumina Studio\'s AI capabilities directly into your own applications and workflows with our comprehensive REST API.',
    icon: 'fa-code',
  },
  {
    question: 'How do credits work?',
    answer: 'Each plan includes monthly credits for AI generations. Unused credits don\'t roll over, but they reset at the start of each billing cycle. You can always upgrade mid-cycle if you need more.',
    icon: 'fa-coins',
  },
];

const FAQItem: React.FC<{
  question: string;
  answer: string;
  icon: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}> = ({ question, answer, icon, isOpen, onClick, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border-b border-slate-800/50 last:border-b-0"
    >
      <button
        onClick={onClick}
        className="w-full py-7 flex items-center justify-between gap-6 text-left group"
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800/50 group-hover:bg-slate-800'
          }`}>
            <i className={`fas ${icon} ${isOpen ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`} />
          </div>
          <span className={`type-subsection transition-colors ${
            isOpen ? 'text-white' : 'text-slate-300 group-hover:text-white'
          }`}>
            {question}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isOpen
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-slate-800/50 text-slate-500 group-hover:bg-slate-800 group-hover:text-slate-300'
          }`}
        >
          <i className="fas fa-plus text-sm" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-7 pl-17 pr-16">
              <div className="pl-[68px]">
                <p className="text-slate-400 leading-relaxed text-base">
                  {answer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 px-6 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-cyan-400 type-body-sm font-semibold mb-8"
          >
            <i className="fas fa-circle-question text-xs" />
            FAQ
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight">
            Frequently Asked{' '}
            <span className="text-gradient-primary">Questions</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Lumina Studio.
          </p>
        </motion.div>

        {/* FAQ list */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl px-8 py-2"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              icon={faq.icon}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              index={i}
            />
          ))}
        </motion.div>

        {/* Support link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="glass-card rounded-2xl p-8 inline-block">
            <p className="text-slate-400 mb-4">Still have questions?</p>
            <a
              href="mailto:support@strategia-x.com"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold hover:from-indigo-600 hover:to-violet-700 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
            >
              <i className="fas fa-envelope" />
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
