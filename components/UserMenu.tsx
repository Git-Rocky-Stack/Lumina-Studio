/**
 * User Menu Component
 *
 * Displays the current user's avatar and provides
 * account management options (profile, sign out).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface UserMenuProps {
  collapsed?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ collapsed = false }) => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  const displayName = user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User';
  const email = user.primaryEmailAddress?.emailAddress || '';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 w-full p-2 rounded-xl
          hover:bg-white/10 transition-all
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={displayName}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        {!collapsed && (
          <div className="flex-1 text-left min-w-0">
            <div className="font-semibold text-white text-sm truncate">{displayName}</div>
            <div className="text-xs text-slate-400 truncate">{email}</div>
          </div>
        )}

        {!collapsed && (
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={`
          absolute z-50 w-64 py-2 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200
          ${collapsed ? 'left-full ml-2 bottom-0' : 'bottom-full mb-2 left-0'}
        `}>
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">{displayName}</div>
                <div className="text-xs text-slate-500 truncate">{email}</div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                openUserProfile();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-slate-700">Manage Account</span>
            </button>

            <button
              onClick={() => {
                navigate('/studio');
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-medium text-slate-700">Dashboard</span>
            </button>

            <hr className="my-1 border-slate-100" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-red-50 transition-colors group"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium text-slate-700 group-hover:text-red-600 transition-colors">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
