/**
 * User Profile Dropdown Component
 *
 * Compact dropdown for user account access in the sidebar/header.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  LogOut,
  Crown,
  ChevronDown,
  Shield,
  CreditCard,
  HelpCircle,
  Moon,
  Sun,
  Bell,
  Zap,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

interface UserProfileDropdownProps {
  className?: string;
  compact?: boolean;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  className = '',
  compact = false,
}) => {
  const navigate = useNavigate();
  const { user, userName, userEmail, userAvatar, signOut, isAuthenticated } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock subscription data - in production, this would come from useAuth hook with profile
  const subscription = {
    tier: 'pro' as const,
    isActive: true,
  };

  const tierConfig = {
    free: { label: 'Free', color: 'text-slate-400', bg: 'bg-slate-500/20' },
    pro: { label: 'Pro', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Crown },
    team: { label: 'Team', color: 'text-indigo-400', bg: 'bg-indigo-500/20', icon: Shield },
    enterprise: { label: 'Enterprise', color: 'text-violet-400', bg: 'bg-violet-500/20', icon: Zap },
  };

  const currentTier = tierConfig[subscription.tier] || tierConfig.free;
  const TierIcon = currentTier.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <Link
        to="/sign-in"
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-xl transition-all ${className}`}
      >
        <User className="w-4 h-4" />
        Sign In
      </Link>
    );
  }

  // Get initials for fallback avatar
  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userEmail) {
      return userEmail.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-colors ${
          isOpen ? 'bg-slate-100' : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="relative">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName || 'User'}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {getInitials()}
            </div>
          )}

          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
        </div>

        {/* User info (not shown in compact mode) */}
        {!compact && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {userName || 'User'}
            </p>
            <div className="flex items-center gap-1.5">
              {TierIcon && <TierIcon className={`w-3 h-3 ${currentTier.color}`} />}
              <span className={`text-xs font-medium ${currentTier.color}`}>
                {currentTier.label}
              </span>
            </div>
          </div>
        )}

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName || 'User'}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                    {getInitials()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {userName || 'User'}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>

              {/* Subscription Badge */}
              <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${currentTier.bg}`}>
                {TierIcon && <TierIcon className={`w-3.5 h-3.5 ${currentTier.color}`} />}
                <span className={`text-xs font-semibold ${currentTier.color}`}>
                  {currentTier.label} Plan
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link
                to="/studio/settings/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Your Profile</span>
              </Link>

              <Link
                to="/studio/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Settings</span>
              </Link>

              <Link
                to="/studio/settings/billing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Billing</span>
              </Link>

              <Link
                to="/studio/settings/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Bell className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Notifications</span>
              </Link>

              <div className="my-2 h-px bg-slate-100" />

              <Link
                to="/guide"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Help & Support</span>
              </Link>

              <div className="my-2 h-px bg-slate-100" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfileDropdown;
