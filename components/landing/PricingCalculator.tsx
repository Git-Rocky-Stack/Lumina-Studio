import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface UsageEstimate {
  images: number;
  videos: number;
}

const STOCK_PHOTO_COST = 0.50; // Average stock photo site cost
const STOCK_VIDEO_COST = 15.00; // Average stock video cost
const DESIGNER_HOURLY = 75; // Average designer hourly rate
const DESIGNS_PER_HOUR = 2; // Designs a designer can make per hour

const plans = [
  { name: 'Free', monthlyPrice: 0, images: 15, videos: 2 },
  { name: 'Pro', monthlyPrice: 29, images: 150, videos: 12 },
  { name: 'Team', monthlyPrice: 79, images: 500, videos: 40 },
];

const PricingCalculator: React.FC = () => {
  const [usage, setUsage] = useState<UsageEstimate>({ images: 50, videos: 5 });
  const [showComparison, setShowComparison] = useState(false);

  const recommendedPlan = useMemo(() => {
    if (usage.images <= 15 && usage.videos <= 2) return plans[0];
    if (usage.images <= 150 && usage.videos <= 12) return plans[1];
    return plans[2];
  }, [usage]);

  const savings = useMemo(() => {
    const stockPhotoCost = usage.images * STOCK_PHOTO_COST;
    const stockVideoCost = usage.videos * STOCK_VIDEO_COST;
    const designerCost = (usage.images / DESIGNS_PER_HOUR) * DESIGNER_HOURLY;
    const totalTraditional = stockPhotoCost + stockVideoCost + designerCost;
    const luminaCost = recommendedPlan.monthlyPrice;

    return {
      stockPhotos: stockPhotoCost,
      stockVideos: stockVideoCost,
      designer: designerCost,
      total: totalTraditional,
      luminaCost,
      saved: Math.max(0, totalTraditional - luminaCost),
      percentage: totalTraditional > 0 ? Math.round(((totalTraditional - luminaCost) / totalTraditional) * 100) : 0,
    };
  }, [usage, recommendedPlan]);

  const costPerImage = useMemo(() => {
    if (recommendedPlan.monthlyPrice === 0) return 0;
    return (recommendedPlan.monthlyPrice / recommendedPlan.images).toFixed(3);
  }, [recommendedPlan]);

  return (
    <div className="glass-card rounded-3xl p-8 md:p-10">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-4">
          <i className="fas fa-calculator" aria-hidden="true" />
          ROI Calculator
        </span>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          See How Much You'll Save
        </h3>
        <p className="text-slate-400">
          Calculate your savings compared to traditional creative tools
        </p>
      </div>

      {/* Sliders */}
      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div>
          <label className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">AI Images per month</span>
            <span className="text-2xl font-bold text-indigo-400">{usage.images}</span>
          </label>
          <input
            type="range"
            min="5"
            max="500"
            step="5"
            value={usage.images}
            onChange={(e) => setUsage({ ...usage, images: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
            aria-label="Number of AI images per month"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>5</span>
            <span>150</span>
            <span>500</span>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">AI Videos per month</span>
            <span className="text-2xl font-bold text-violet-400">{usage.videos}</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="2"
            value={usage.videos}
            onChange={(e) => setUsage({ ...usage, videos: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-violet-500"
            aria-label="Number of AI videos per month"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>0</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <motion.div
        layout
        className="bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 rounded-2xl p-6 md:p-8 border border-indigo-500/20"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
          <div>
            <p className="text-slate-400 text-sm mb-1">Recommended Plan</p>
            <p className="text-3xl font-bold text-white">
              {recommendedPlan.name}
              <span className="text-lg font-normal text-slate-400 ml-2">
                ${recommendedPlan.monthlyPrice}/mo
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm mb-1">Cost per image</p>
            <p className="text-3xl font-bold text-emerald-400">
              ${costPerImage}
              <span className="text-lg font-normal text-slate-400 ml-2">
                vs $0.50 stock
              </span>
            </p>
          </div>
        </div>

        {/* Savings highlight */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <i className="fas fa-piggy-bank text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-emerald-400 font-semibold">Monthly Savings</p>
                <p className="text-slate-400 text-sm">Compared to traditional methods</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-400">${savings.saved.toFixed(0)}</p>
              <p className="text-emerald-400/70 text-sm">{savings.percentage}% less</p>
            </div>
          </div>
        </div>

        {/* Detailed comparison toggle */}
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full text-center text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {showComparison ? 'Hide' : 'Show'} detailed comparison
          <i className={`fas fa-chevron-${showComparison ? 'up' : 'down'} text-xs`} aria-hidden="true" />
        </button>

        {/* Detailed comparison */}
        <motion.div
          initial={false}
          animate={{ height: showComparison ? 'auto' : 0, opacity: showComparison ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Stock photos ({usage.images} × $0.50)</span>
              <span className="text-white font-medium">${savings.stockPhotos.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Stock videos ({usage.videos} × $15)</span>
              <span className="text-white font-medium">${savings.stockVideos.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Designer time ({Math.round(usage.images / DESIGNS_PER_HOUR)}h × $75/hr)</span>
              <span className="text-white font-medium">${savings.designer.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-white font-semibold">Traditional total</span>
              <span className="text-white font-bold text-lg">${savings.total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-indigo-400 font-semibold">Lumina Studio {recommendedPlan.name}</span>
              <span className="text-indigo-400 font-bold text-lg">${savings.luminaCost}/mo</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <a
          href="/sign-up"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          Start Saving Today
          <i className="fas fa-arrow-right" aria-hidden="true" />
        </a>
        <p className="text-slate-500 text-sm mt-3">
          No credit card required • 20 free generations
        </p>
      </div>
    </div>
  );
};

export default PricingCalculator;
