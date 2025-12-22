import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'What AI models power Lumina Studio?',
    answer: 'Lumina Studio is powered by Google Gemini 3 Pro for image generation and Veo 3.1 for video creation. These are the latest and most advanced AI models available, ensuring the highest quality outputs.',
  },
  {
    question: 'Can I use generated content commercially?',
    answer: 'Yes! All content generated in Lumina Studio comes with a full commercial license. You own the rights to everything you create and can use it for any purpose, including client work and products for sale.',
  },
  {
    question: 'How does team collaboration work?',
    answer: 'Team plans include shared workspaces where members can collaborate in real-time. You can share brand kits, templates, and assets across your team, with role-based permissions to control access.',
  },
  {
    question: 'What export formats are supported?',
    answer: 'We support all major formats including PNG, JPG, WebP, SVG for images; MP4, WebM, GIF for videos; and PDF for documents. Pro and Team plans include additional formats like PSD and AI.',
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes, Pro and Team plans include API access. You can integrate Lumina Studio\'s AI capabilities directly into your own applications and workflows.',
  },
  {
    question: 'How do credits work?',
    answer: 'Each plan includes monthly credits for AI generations. Unused credits don\'t roll over, but they reset at the start of each billing cycle. You can always upgrade mid-cycle if you need more.',
  },
];

const FAQItem: React.FC<{
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between gap-4 text-left group"
      >
        <span className="text-lg font-semibold group-hover:text-indigo-400 transition-colors">
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"
        >
          <i className="fas fa-plus text-sm text-slate-400" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-400 leading-relaxed pr-12">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-slate-900 to-slate-900/50">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-semibold mb-6">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-400">
            Everything you need to know about Lumina Studio.
          </p>
        </motion.div>

        {/* FAQ list */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-800/30 border border-slate-700/50 rounded-3xl px-8"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>

        {/* Support link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-slate-400 mb-4">Still have questions?</p>
          <a
            href="mailto:support@lumina-os.com"
            className="inline-flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
          >
            <i className="fas fa-envelope" />
            Contact our support team
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
