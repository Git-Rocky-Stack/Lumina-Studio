/**
 * User Menu Component
 *
 * Displays the current user's avatar and provides
 * account management options (profile, sign out).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface UserMenuProps {
  collapsed?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ collapsed = false }) => {
  const { isAuthenticated, userName, userEmail, userAvatar, signOut } = useAuthContext();
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

  if (!isAuthenticated) return null;

  const displayName = userName || userEmail?.split('@')[0] || 'User';
  const email = userEmail || '';

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
        {userAvatar ? (
          <img
            src={userAvatar}
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
              {userAvatar ? (
                <img
                  src={userAvatar}
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

            <button
              onClick={() => {
                navigate('/guide');
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm font-medium text-slate-700">User Guide</span>
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
