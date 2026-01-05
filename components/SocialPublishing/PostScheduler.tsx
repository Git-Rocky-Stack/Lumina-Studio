// =============================================
// Post Scheduler Component
// Schedule and manage social media posts
// =============================================

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Send,
  Save,
  Hash,
  AtSign,
  Link,
  Image,
  Video,
  X,
  ChevronDown,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  socialPublishing,
  SocialAccount,
  PlatformFormat,
  ScheduledPost,
  platformConfig,
} from '../../services/socialPublishingService';

// =============================================
// Types
// =============================================

interface PostSchedulerProps {
  designData?: any;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  onScheduled?: (post: ScheduledPost) => void;
  onPublished?: (post: ScheduledPost) => void;
  className?: string;
}

// =============================================
// Post Scheduler Component
// =============================================

export const PostScheduler: React.FC<PostSchedulerProps> = ({
  designData,
  mediaUrl,
  mediaType = 'image',
  onScheduled,
  onPublished,
  className = '',
}) => {
  // State
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [formats, setFormats] = useState<PlatformFormat[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<PlatformFormat | null>(null);

  // Form state
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [newHashtag, setNewHashtag] = useState('');
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [optimalTime, setOptimalTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // =============================================
  // Data Loading
  // =============================================

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAccount && caption) {
      const suggestions = socialPublishing.suggestHashtags(
        caption,
        selectedAccount.platform
      );
      setSuggestedHashtags(suggestions.filter(h => !hashtags.includes(h)));
    }
  }, [caption, selectedAccount, hashtags]);

  useEffect(() => {
    if (selectedAccount) {
      loadOptimalTime();
    }
  }, [selectedAccount]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accts, fmts] = await Promise.all([
        socialPublishing.getConnectedAccounts(),
        socialPublishing.getPlatformFormats(),
      ]);
      setAccounts(accts);
      setFormats(fmts);
      if (accts.length > 0) {
        setSelectedAccount(accts[0]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load social accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptimalTime = async () => {
    if (!selectedAccount) return;
    const time = await socialPublishing.getNextOptimalTime(selectedAccount.id);
    setOptimalTime(time);
  };

  // =============================================
  // Handlers
  // =============================================

  const handleAddHashtag = () => {
    if (newHashtag && !hashtags.includes(newHashtag)) {
      const tag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
      setHashtags([...hashtags, tag]);
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const handleAddSuggestedHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
  };

  const handleUseOptimalTime = () => {
    if (optimalTime) {
      setScheduledFor(optimalTime.toISOString().slice(0, 16));
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedAccount) return;

    setIsSaving(true);
    setError(null);

    try {
      const postId = await socialPublishing.createScheduledPost({
        social_account_id: selectedAccount.id,
        design_data: designData,
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        hashtags,
        mentions,
        link_url: linkUrl || undefined,
        scheduled_for: scheduledFor || new Date().toISOString(),
        timezone,
        status: 'draft',
      });

      if (postId) {
        const post = await socialPublishing.getPostById(postId);
        if (post) onScheduled?.(post);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedAccount || !scheduledFor) {
      setError('Please select an account and schedule time');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const postId = await socialPublishing.createScheduledPost({
        social_account_id: selectedAccount.id,
        design_data: designData,
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        hashtags,
        mentions,
        link_url: linkUrl || undefined,
        scheduled_for: scheduledFor,
        timezone,
        status: 'scheduled',
      });

      if (postId) {
        const post = await socialPublishing.getPostById(postId);
        if (post) onScheduled?.(post);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule post');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const postId = await socialPublishing.createScheduledPost({
        social_account_id: selectedAccount.id,
        design_data: designData,
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        hashtags,
        mentions,
        link_url: linkUrl || undefined,
        scheduled_for: new Date().toISOString(),
        timezone,
        status: 'scheduled',
      });

      if (postId) {
        await socialPublishing.publishNow(postId);
        const post = await socialPublishing.getPostById(postId);
        if (post) onPublished?.(post);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  // =============================================
  // Render
  // =============================================

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`post-scheduler ${className}`}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-zinc-200">Schedule Post</h3>
          </div>
          {accounts.length === 0 && (
            <span className="text-xs text-amber-400">No accounts connected</span>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Account Selector */}
          <div className="relative">
            <label className="block text-sm text-zinc-400 mb-1.5">Account</label>
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                bg-zinc-800/50 border border-zinc-700/50 text-left
                hover:border-zinc-600/50 transition-colors"
            >
              {selectedAccount ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: platformConfig[selectedAccount.platform].color }}
                  >
                    {selectedAccount.platform_username?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <span className="text-sm text-zinc-200">
                      {selectedAccount.platform_display_name || selectedAccount.platform_username}
                    </span>
                    <span className="text-xs text-zinc-500 block">
                      {platformConfig[selectedAccount.platform].name}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-zinc-500">Select an account</span>
              )}
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>

            {showAccountDropdown && accounts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-xl
                bg-zinc-800 border border-zinc-700 shadow-xl z-10">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowAccountDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700/50
                      transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: platformConfig[account.platform].color }}
                    >
                      {account.platform_username?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="text-left">
                      <span className="text-sm text-zinc-200 block">
                        {account.platform_display_name || account.platform_username}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {platformConfig[account.platform].name}
                      </span>
                    </div>
                    {selectedAccount?.id === account.id && (
                      <Check className="w-4 h-4 text-violet-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Media Preview */}
          {mediaUrl && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Media</label>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/50">
                {mediaType === 'video' ? (
                  <video src={mediaUrl} className="w-full h-full object-contain" controls />
                ) : (
                  <img src={mediaUrl} alt="Post media" className="w-full h-full object-contain" />
                )}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/50 text-xs text-white flex items-center gap-1">
                  {mediaType === 'video' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                  {mediaType}
                </div>
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50
                text-zinc-200 placeholder-zinc-500 resize-none
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-zinc-500">{caption.length} characters</span>
              {selectedAccount && (
                <span className="text-xs text-zinc-500">
                  {selectedAccount.platform === 'twitter' && caption.length > 280 && (
                    <span className="text-amber-400">Exceeds Twitter limit</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Hashtags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-sm"
                >
                  {tag}
                  <button onClick={() => handleRemoveHashtag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => setShowHashtagInput(!showHashtagInput)}
                className="px-2 py-1 rounded-lg bg-zinc-800/50 text-zinc-500 text-sm
                  hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
              >
                + Add
              </button>
            </div>
            {showHashtagInput && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
                  placeholder="#hashtag"
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50
                    text-zinc-200 placeholder-zinc-500 text-sm
                    focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <button
                  onClick={handleAddHashtag}
                  className="px-3 py-2 rounded-lg bg-violet-500 text-white text-sm
                    hover:bg-violet-600 transition-colors"
                >
                  Add
                </button>
              </div>
            )}
            {suggestedHashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-zinc-500 mr-1">Suggestions:</span>
                {suggestedHashtags.slice(0, 8).map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddSuggestedHashtag(tag)}
                    className="px-2 py-0.5 rounded text-xs bg-zinc-800/50 text-zinc-500
                      hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Link (optional)
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50
                text-zinc-200 placeholder-zinc-500 text-sm
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
            />
          </div>

          {/* Schedule Time */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule For
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50
                  text-zinc-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
              />
              {optimalTime && (
                <button
                  onClick={handleUseOptimalTime}
                  className="flex items-center gap-1 px-3 py-2.5 rounded-xl
                    bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm
                    hover:bg-emerald-500/20 transition-colors"
                  title={`Optimal time: ${optimalTime.toLocaleString()}`}
                >
                  <Zap className="w-4 h-4" />
                  Best Time
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || !selectedAccount}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-zinc-800 text-zinc-300 hover:bg-zinc-700
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              onClick={handleSchedule}
              disabled={isSaving || !selectedAccount || !scheduledFor}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-violet-500/20 text-violet-400 hover:bg-violet-500/30
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Schedule
            </button>
            <button
              onClick={handlePublishNow}
              disabled={isPublishing || !selectedAccount}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-gradient-to-r from-violet-500 to-indigo-600 text-white
                hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostScheduler;
