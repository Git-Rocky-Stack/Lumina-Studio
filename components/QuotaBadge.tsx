/**
 * Quota Badge Component
 *
 * Displays remaining usage quota for the current user.
 */

import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { getUsageStats, TIER_LIMITS } from '../services/usageService';

interface QuotaBadgeProps {
  type: 'image' | 'video' | 'text';
  className?: string;
}

const QuotaBadge: React.FC<QuotaBadgeProps> = ({ type, className = '' }) => {
  const { user } = useUser();
  const userId = user?.id || 'anonymous';
  const stats = getUsageStats(userId);

  const used = type === 'image' ? stats.used.images :
               type === 'video' ? stats.used.videos : stats.used.text;

  const limit = type === 'image' ? stats.limits.images :
                type === 'video' ? stats.limits.videos : stats.limits.text;

  const remaining = type === 'image' ? stats.remaining.images :
                    type === 'video' ? stats.remaining.videos : stats.remaining.text;

  const isUnlimited = limit === -1;
  const percentUsed = isUnlimited ? 0 : (used / limit) * 100;
  const isLow = !isUnlimited && percentUsed >= 80;
  const isEmpty = !isUnlimited && remaining <= 0;

  const typeLabel = type === 'image' ? 'Images' : type === 'video' ? 'Videos' : 'Text';
  const icon = type === 'image' ? 'fa-image' : type === 'video' ? 'fa-film' : 'fa-font';

  if (isEmpty) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 ${className}`}>
        <i className={`fas ${icon} text-red-500 text-xs`}></i>
        <span className="text-xs font-bold text-red-600">
          No {typeLabel.toLowerCase()} remaining
        </span>
        <a
          href="/pricing"
          className="text-[10px] font-bold text-red-500 hover:text-red-700 underline ml-1"
        >
          Upgrade
        </a>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
      isLow ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100'
    } ${className}`}>
      <i className={`fas ${icon} ${isLow ? 'text-amber-500' : 'text-slate-400'} text-xs`}></i>
      <span className={`text-xs font-bold ${isLow ? 'text-amber-600' : 'text-slate-500'}`}>
        {isUnlimited ? (
          <>{typeLabel}: Unlimited</>
        ) : (
          <>{remaining} {typeLabel.toLowerCase()} left</>
        )}
      </span>
      {!isUnlimited && (
        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isLow ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${100 - percentUsed}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const QuotaPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { user } = useUser();
  const userId = user?.id || 'anonymous';
  const stats = getUsageStats(userId);

  const tierColors: Record<string, string> = {
    free: 'bg-slate-100 text-slate-600',
    pro: 'bg-indigo-100 text-indigo-600',
    team: 'bg-violet-100 text-violet-600',
    enterprise: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Usage</span>
        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${tierColors[stats.tier] || tierColors.free}`}>
          {stats.tier}
        </span>
      </div>

      <div className="space-y-3">
        <UsageBar
          label="Images"
          icon="fa-image"
          used={stats.used.images}
          limit={stats.limits.images}
        />
        <UsageBar
          label="Videos"
          icon="fa-film"
          used={stats.used.videos}
          limit={stats.limits.videos}
        />
        <UsageBar
          label="Text"
          icon="fa-font"
          used={stats.used.text}
          limit={stats.limits.text}
        />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">
          Resets {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

const UsageBar: React.FC<{
  label: string;
  icon: string;
  used: number;
  limit: number;
}> = ({ label, icon, used, limit }) => {
  const isUnlimited = limit === -1;
  const percentUsed = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const remaining = limit - used;
  const isLow = !isUnlimited && percentUsed >= 80;
  const isCritical = !isUnlimited && percentUsed >= 95;

  return (
    <div className="flex items-center gap-3" role="meter" aria-label={`${label} usage`} aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}>
      <i className={`fas ${icon} w-4 text-center text-slate-400 text-xs`} aria-hidden="true"></i>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          <span className={`text-[10px] font-bold ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-400'}`}>
            {isUnlimited ? '∞ Unlimited' : `${used}/${limit}`}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: isUnlimited ? '0%' : `${percentUsed}%` }}
          />
        </div>
        {/* Remaining count indicator */}
        {!isUnlimited && remaining <= 5 && remaining > 0 && (
          <p className="text-[9px] text-amber-600 mt-1 font-medium">
            Only {remaining} {label.toLowerCase()} remaining this month
          </p>
        )}
      </div>
    </div>
  );
};

export default QuotaBadge;
