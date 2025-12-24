import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalCreditsEarned: number;
  referralCode: string;
  referralLink: string;
}

interface ReferralSystemProps {
  userId?: string;
  className?: string;
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({ userId = 'user123', className = '' }) => {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 12,
    pendingReferrals: 3,
    completedReferrals: 9,
    totalCreditsEarned: 180,
    referralCode: 'LUMINA-' + userId.toUpperCase().slice(0, 6),
    referralLink: `https://lumina.studio/ref/${userId}`,
  });
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLinks = [
    {
      name: 'Twitter',
      icon: 'fa-twitter',
      color: 'bg-sky-500',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm creating stunning AI designs with Lumina Studio! Get 20 free AI generations when you sign up: ${stats.referralLink}`)}`,
    },
    {
      name: 'LinkedIn',
      icon: 'fa-linkedin-in',
      color: 'bg-blue-600',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stats.referralLink)}`,
    },
    {
      name: 'Facebook',
      icon: 'fa-facebook-f',
      color: 'bg-blue-500',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stats.referralLink)}`,
    },
    {
      name: 'Email',
      icon: 'fa-envelope',
      color: 'bg-slate-600',
      url: `mailto:?subject=${encodeURIComponent('Try Lumina Studio - AI Creative Suite')}&body=${encodeURIComponent(`Hey! I've been using Lumina Studio to create amazing AI-powered designs. Sign up with my link and get 20 free AI generations: ${stats.referralLink}`)}`,
    },
  ];

  const rewards = [
    { threshold: 1, reward: '20 AI Credits', achieved: stats.completedReferrals >= 1 },
    { threshold: 5, reward: '1 Month Pro Free', achieved: stats.completedReferrals >= 5 },
    { threshold: 10, reward: 'Lifetime 20% Off', achieved: stats.completedReferrals >= 10 },
    { threshold: 25, reward: 'Exclusive Beta Access', achieved: stats.completedReferrals >= 25 },
  ];

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
          <i className="fas fa-gift text-2xl text-white" aria-hidden="true" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Invite Friends, Earn Rewards</h3>
        <p className="text-slate-400">
          Get <span className="text-emerald-400 font-semibold">20 free AI credits</span> for each friend who signs up
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5 text-center">
          <p className="text-3xl font-bold text-white mb-1">{stats.totalReferrals}</p>
          <p className="text-slate-500 text-sm">Total Invited</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-3xl font-bold text-emerald-400 mb-1">{stats.completedReferrals}</p>
          <p className="text-slate-500 text-sm">Signed Up</p>
        </div>
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
          <p className="text-3xl font-bold text-indigo-400 mb-1">{stats.totalCreditsEarned}</p>
          <p className="text-slate-500 text-sm">Credits Earned</p>
        </div>
      </div>

      {/* Referral code/link */}
      <div className="space-y-4 mb-8">
        {/* Code */}
        <div>
          <label className="text-sm font-medium text-slate-400 mb-2 block">Your Referral Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 font-mono text-lg text-white tracking-wider">
              {stats.referralCode}
            </div>
            <button
              onClick={() => copyToClipboard(stats.referralCode, 'code')}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Copy referral code"
            >
              <i className={`fas ${copied === 'code' ? 'fa-check text-emerald-400' : 'fa-copy'}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Link */}
        <div>
          <label className="text-sm font-medium text-slate-400 mb-2 block">Or share your link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-slate-300 text-sm truncate">
              {stats.referralLink}
            </div>
            <button
              onClick={() => copyToClipboard(stats.referralLink, 'link')}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Copy referral link"
            >
              <i className={`fas ${copied === 'link' ? 'fa-check text-emerald-400' : 'fa-copy'}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-400 mb-3">Share via</p>
        <div className="flex items-center gap-3">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-12 h-12 rounded-xl ${link.color} flex items-center justify-center text-white hover:opacity-90 hover:scale-105 transition-all shadow-lg`}
              aria-label={`Share on ${link.name}`}
            >
              <i className={`fab ${link.icon}`} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      {/* Rewards tiers */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="fas fa-trophy text-amber-400" aria-hidden="true" />
          Reward Milestones
        </h4>
        <div className="space-y-3">
          {rewards.map((tier, index) => (
            <motion.div
              key={tier.threshold}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                tier.achieved
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-slate-800/50 border-white/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                tier.achieved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {tier.achieved ? (
                  <i className="fas fa-check" aria-hidden="true" />
                ) : (
                  tier.threshold
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${tier.achieved ? 'text-emerald-400' : 'text-white'}`}>
                  {tier.reward}
                </p>
                <p className="text-slate-500 text-sm">
                  {tier.threshold} referral{tier.threshold > 1 ? 's' : ''}
                </p>
              </div>
              {tier.achieved && (
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  UNLOCKED
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Progress to next tier */}
      {stats.completedReferrals < 25 && (
        <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-indigo-300">Progress to next reward</span>
            <span className="text-sm font-bold text-indigo-400">
              {stats.completedReferrals} / {rewards.find(r => !r.achieved)?.threshold || 25}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{
                width: `${(stats.completedReferrals / (rewards.find(r => !r.achieved)?.threshold || 25)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSystem;
