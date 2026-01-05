/**
 * Account Settings Page for Lumina Studio
 *
 * Comprehensive user settings management with profile,
 * security, notifications, and billing sections.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Palette,
  Key,
  Mail,
  Camera,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Crown,
  Zap,
  Globe,
  Clock,
  Building,
  Briefcase,
  Link as LinkIcon,
  Trash2,
  Download,
  Lock,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'appearance' | 'billing';

interface UserProfileData {
  display_name: string;
  bio: string;
  company: string;
  job_title: string;
  website: string;
  country: string;
  timezone: string;
}

const AccountSettingsPage: React.FC = () => {
  const { user, userEmail, userName, userAvatar } = useAuthContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Profile form state
  const [profileData, setProfileData] = useState<UserProfileData>({
    display_name: userName || '',
    bio: '',
    company: '',
    job_title: '',
    website: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: {
      updates: true,
      marketing: false,
      collaboration: true,
      security: true,
    },
    push: {
      enabled: true,
      collaboration: true,
      reminders: true,
    },
  });

  // Appearance preferences
  const [appearance, setAppearance] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    accentColor: 'indigo',
    reduceMotion: false,
    compactMode: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfileData({
          display_name: data.display_name || userName || '',
          bio: data.bio || '',
          company: data.company || '',
          job_title: data.job_title || '',
          website: data.website || '',
          country: data.country || '',
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        if (data.preferences) {
          setAppearance({
            theme: data.preferences.theme || 'light',
            accentColor: data.preferences.accentColor || 'indigo',
            reduceMotion: data.preferences.accessibility?.reduceMotion || false,
            compactMode: false,
          });
          setNotifications({
            email: data.preferences.notifications || {
              updates: true,
              marketing: false,
              collaboration: true,
              security: true,
            },
            push: {
              enabled: true,
              collaboration: true,
              reminders: true,
            },
          });
        }
      }
    };

    loadProfile();
  }, [user, userName]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    setSaveStatus('saving');

    try {
      // Upload avatar if changed
      if (avatarPreview && fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;
      }

      // Update profile
      const { error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.new.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new,
      });

      if (error) throw error;

      setPasswordForm({ current: '', new: '', confirm: '' });
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account preferences and settings</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <span className="font-medium">{tab.label}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto ${isActive ? 'text-indigo-400' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Avatar Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Profile Photo</h2>
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        {avatarPreview || userAvatar ? (
                          <img
                            src={avatarPreview || userAvatar || ''}
                            alt="Profile"
                            className="w-24 h-24 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                            {getInitials()}
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          Upload Photo
                        </button>
                        <p className="text-sm text-slate-500 mt-2">
                          JPG, PNG or GIF. Max size 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={profileData.display_name}
                          onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={userEmail || ''}
                            disabled
                            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                          />
                          <button className="px-3 py-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-sm font-medium">
                            Change
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Professional Info</h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Building className="w-4 h-4 inline mr-1.5 text-slate-400" />
                          Company
                        </label>
                        <input
                          type="text"
                          value={profileData.company}
                          onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Briefcase className="w-4 h-4 inline mr-1.5 text-slate-400" />
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={profileData.job_title}
                          onChange={(e) => setProfileData({ ...profileData, job_title: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Your role"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <LinkIcon className="w-4 h-4 inline mr-1.5 text-slate-400" />
                          Website
                        </label>
                        <input
                          type="url"
                          value={profileData.website}
                          onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="https://your-website.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Globe className="w-4 h-4 inline mr-1.5 text-slate-400" />
                          Country
                        </label>
                        <input
                          type="text"
                          value={profileData.country}
                          onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Your country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Clock className="w-4 h-4 inline mr-1.5 text-slate-400" />
                          Timezone
                        </label>
                        <select
                          value={profileData.timezone}
                          onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="Europe/London">GMT/UTC</option>
                          <option value="Europe/Paris">Central European Time (CET)</option>
                          <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3">
                    <button className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {saveStatus === 'saved' && <Check className="w-4 h-4" />}
                      {saveStatus === 'error' && <X className="w-4 h-4" />}
                      {saveStatus === 'idle' && 'Save Changes'}
                      {saveStatus === 'saving' && 'Saving...'}
                      {saveStatus === 'saved' && 'Saved!'}
                      {saveStatus === 'error' && 'Error'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Change Password */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 rounded-xl">
                        <Key className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">Change Password</h2>
                        <p className="text-sm text-slate-500">Update your password regularly for security</p>
                      </div>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                            className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.new}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                            className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                            className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                        className="px-6 py-2.5 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <Lock className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">Active Sessions</h2>
                        <p className="text-sm text-slate-500">Manage your active login sessions</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Current Session</p>
                            <p className="text-sm text-slate-500">Chrome on Windows</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                          Active Now
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
                        <p className="text-sm text-red-600">Irreversible actions for your account</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-slate-800">Export Your Data</p>
                          <p className="text-sm text-slate-500">Download all your data in JSON format</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                        <div>
                          <p className="font-medium text-red-800">Delete Account</p>
                          <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Email Notifications */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-100 rounded-xl">
                        <Mail className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">Email Notifications</h2>
                        <p className="text-sm text-slate-500">Choose what emails you want to receive</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { key: 'updates', label: 'Product Updates', desc: 'New features and improvements' },
                        { key: 'marketing', label: 'Marketing', desc: 'Tips, offers, and promotions' },
                        { key: 'collaboration', label: 'Collaboration', desc: 'When someone shares or mentions you' },
                        { key: 'security', label: 'Security', desc: 'Important account security alerts' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-slate-800">{item.label}</p>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                          </div>
                          <button
                            onClick={() =>
                              setNotifications({
                                ...notifications,
                                email: {
                                  ...notifications.email,
                                  [item.key]: !notifications.email[item.key as keyof typeof notifications.email],
                                },
                              })
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              notifications.email[item.key as keyof typeof notifications.email]
                                ? 'bg-indigo-500'
                                : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                notifications.email[item.key as keyof typeof notifications.email]
                                  ? 'left-7'
                                  : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-violet-100 rounded-xl">
                        <Bell className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">Push Notifications</h2>
                        <p className="text-sm text-slate-500">Browser and mobile notifications</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { key: 'enabled', label: 'Enable Push Notifications', desc: 'Allow push notifications in your browser' },
                        { key: 'collaboration', label: 'Collaboration Updates', desc: 'Real-time updates when collaborating' },
                        { key: 'reminders', label: 'Reminders', desc: 'Scheduled reminders and deadlines' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-slate-800">{item.label}</p>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                          </div>
                          <button
                            onClick={() =>
                              setNotifications({
                                ...notifications,
                                push: {
                                  ...notifications.push,
                                  [item.key]: !notifications.push[item.key as keyof typeof notifications.push],
                                },
                              })
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              notifications.push[item.key as keyof typeof notifications.push]
                                ? 'bg-violet-500'
                                : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                notifications.push[item.key as keyof typeof notifications.push]
                                  ? 'left-7'
                                  : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Theme */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Theme</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', icon: '☀️' },
                        { value: 'dark', label: 'Dark', icon: '🌙' },
                        { value: 'system', label: 'System', icon: '💻' },
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setAppearance({ ...appearance, theme: theme.value as 'light' | 'dark' | 'system' })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            appearance.theme === theme.value
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-2xl mb-2 block">{theme.icon}</span>
                          <span className="font-medium text-slate-800">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Accent Color</h2>
                    <div className="flex gap-3">
                      {[
                        { value: 'indigo', color: 'bg-indigo-500' },
                        { value: 'violet', color: 'bg-violet-500' },
                        { value: 'emerald', color: 'bg-emerald-500' },
                        { value: 'rose', color: 'bg-rose-500' },
                        { value: 'amber', color: 'bg-amber-500' },
                        { value: 'slate', color: 'bg-slate-500' },
                      ].map((accent) => (
                        <button
                          key={accent.value}
                          onClick={() => setAppearance({ ...appearance, accentColor: accent.value })}
                          className={`w-10 h-10 rounded-xl ${accent.color} transition-transform ${
                            appearance.accentColor === accent.value
                              ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                              : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Accessibility</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-slate-800">Reduce Motion</p>
                          <p className="text-sm text-slate-500">Minimize animations and transitions</p>
                        </div>
                        <button
                          onClick={() => setAppearance({ ...appearance, reduceMotion: !appearance.reduceMotion })}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            appearance.reduceMotion ? 'bg-indigo-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                              appearance.reduceMotion ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-slate-800">Compact Mode</p>
                          <p className="text-sm text-slate-500">Reduce spacing and padding for dense layouts</p>
                        </div>
                        <button
                          onClick={() => setAppearance({ ...appearance, compactMode: !appearance.compactMode })}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            appearance.compactMode ? 'bg-indigo-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                              appearance.compactMode ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Current Plan */}
                  <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Crown className="w-8 h-8" />
                        <div>
                          <p className="text-indigo-100 text-sm">Current Plan</p>
                          <p className="text-2xl font-bold">Pro</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors">
                        Manage Plan
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-indigo-100 text-sm">Storage</p>
                        <p className="text-xl font-semibold">50 GB</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-indigo-100 text-sm">AI Credits</p>
                        <p className="text-xl font-semibold">500/mo</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <p className="text-indigo-100 text-sm">Projects</p>
                        <p className="text-xl font-semibold">Unlimited</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-800">Payment Method</h2>
                      <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                        Add New
                      </button>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">•••• •••• •••• 4242</p>
                        <p className="text-sm text-slate-500">Expires 12/25</p>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-800">Billing History</h2>
                      <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                        Download All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { date: 'Jan 1, 2026', amount: '$29.00', status: 'Paid' },
                        { date: 'Dec 1, 2025', amount: '$29.00', status: 'Paid' },
                        { date: 'Nov 1, 2025', amount: '$29.00', status: 'Paid' },
                      ].map((invoice, i) => (
                        <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500 text-sm">{invoice.date}</span>
                            <span className="font-medium text-slate-800">{invoice.amount}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                              {invoice.status}
                            </span>
                            <button className="text-slate-400 hover:text-slate-600">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
