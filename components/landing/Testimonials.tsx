import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Creative Director',
    company: 'DesignCo',
    avatar: 'SC',
    content: 'Lumina Studio has completely transformed our creative workflow. What used to take our team days now takes hours. The AI-generated assets are incredibly high quality.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Marketing Lead',
    company: 'TechStart',
    avatar: 'MJ',
    content: 'The marketing hub alone is worth the subscription. We\'ve increased our content output by 300% while maintaining consistent brand quality across all channels.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Freelance Designer',
    company: 'Self-employed',
    avatar: 'ER',
    content: 'As a freelancer, having an all-in-one tool that handles everything from image generation to video editing has been a game-changer for my business.',
    rating: 5,
  },
];

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-semibold mb-6">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Loved by Creators Worldwide
          </h2>
        </motion.div>

        {/* Testimonial carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-8 md:p-12 text-center"
            >
              {/* Quote icon */}
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-8">
                <i className="fas fa-quote-left text-2xl text-indigo-400" />
              </div>

              {/* Content */}
              <p className="text-xl md:text-2xl text-slate-300 leading-relaxed mb-8 max-w-3xl mx-auto">
                "{testimonials[activeIndex].content}"
              </p>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                  <i key={i} className="fas fa-star text-amber-400" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-lg">
                  {testimonials[activeIndex].avatar}
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">{testimonials[activeIndex].name}</div>
                  <div className="text-sm text-slate-400">
                    {testimonials[activeIndex].role} at {testimonials[activeIndex].company}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === activeIndex
                    ? 'bg-indigo-500 w-8'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
