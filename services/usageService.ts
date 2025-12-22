/**
 * Usage Tracking Service
 *
 * Tracks AI generation usage per user with tier-based limits.
 * Uses localStorage for immediate checks + backend sync for persistence.
 */

export type UsageType = 'image' | 'video' | 'text';

export interface TierLimits {
  images: number;
  videos: number;
  text: number;
}

export interface UsageRecord {
  userId: string;
  month: string; // YYYY-MM format
  images: number;
  videos: number;
  text: number;
  lastUpdated: number;
}

// Tier limits per month
export const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    images: 20,
    videos: 3,
    text: 100,
  },
  pro: {
    images: 500,
    videos: 50,
    text: 2000,
  },
  team: {
    images: 2000,
    videos: 200,
    text: 10000,
  },
  enterprise: {
    images: -1, // unlimited
    videos: -1,
    text: -1,
  },
};

const STORAGE_KEY = 'lumina_usage';

// Get current month in YYYY-MM format
const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Get usage record from localStorage
const getStoredUsage = (userId: string): UsageRecord => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) {
      const record = JSON.parse(stored) as UsageRecord;
      // Reset if it's a new month
      if (record.month !== getCurrentMonth()) {
        return createEmptyRecord(userId);
      }
      return record;
    }
  } catch (e) {
    console.error('Error reading usage from localStorage:', e);
  }
  return createEmptyRecord(userId);
};

// Create empty usage record
const createEmptyRecord = (userId: string): UsageRecord => ({
  userId,
  month: getCurrentMonth(),
  images: 0,
  videos: 0,
  text: 0,
  lastUpdated: Date.now(),
});

// Save usage record to localStorage
const saveUsage = (record: UsageRecord): void => {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${record.userId}`, JSON.stringify(record));
  } catch (e) {
    console.error('Error saving usage to localStorage:', e);
  }
};

// Get user's current tier (defaults to free)
export const getUserTier = (userId: string): string => {
  // In production, this would check against backend/Clerk metadata
  // For now, default to free
  try {
    const tierData = localStorage.getItem(`${STORAGE_KEY}_tier_${userId}`);
    return tierData || 'free';
  } catch {
    return 'free';
  }
};

// Set user tier (for testing/admin)
export const setUserTier = (userId: string, tier: string): void => {
  localStorage.setItem(`${STORAGE_KEY}_tier_${userId}`, tier);
};

// Check if user can perform an action
export const canUse = (userId: string, type: UsageType, count: number = 1): boolean => {
  const usage = getStoredUsage(userId);
  const tier = getUserTier(userId);
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  const limit = type === 'image' ? limits.images :
                type === 'video' ? limits.videos : limits.text;

  // -1 means unlimited
  if (limit === -1) return true;

  const current = type === 'image' ? usage.images :
                  type === 'video' ? usage.videos : usage.text;

  return current + count <= limit;
};

// Record usage
export const recordUsage = (userId: string, type: UsageType, count: number = 1): void => {
  const usage = getStoredUsage(userId);

  if (type === 'image') {
    usage.images += count;
  } else if (type === 'video') {
    usage.videos += count;
  } else {
    usage.text += count;
  }

  usage.lastUpdated = Date.now();
  saveUsage(usage);

  // Sync to backend (fire and forget)
  syncUsageToBackend(usage).catch(console.error);
};

// Get remaining quota
export const getRemaining = (userId: string): { images: number; videos: number; text: number } => {
  const usage = getStoredUsage(userId);
  const tier = getUserTier(userId);
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  return {
    images: limits.images === -1 ? Infinity : Math.max(0, limits.images - usage.images),
    videos: limits.videos === -1 ? Infinity : Math.max(0, limits.videos - usage.videos),
    text: limits.text === -1 ? Infinity : Math.max(0, limits.text - usage.text),
  };
};

// Get usage stats for display
export const getUsageStats = (userId: string): {
  tier: string;
  limits: TierLimits;
  used: { images: number; videos: number; text: number };
  remaining: { images: number; videos: number; text: number };
  month: string;
} => {
  const usage = getStoredUsage(userId);
  const tier = getUserTier(userId);
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const remaining = getRemaining(userId);

  return {
    tier,
    limits,
    used: {
      images: usage.images,
      videos: usage.videos,
      text: usage.text,
    },
    remaining,
    month: usage.month,
  };
};

// Sync usage to backend
const syncUsageToBackend = async (usage: UsageRecord): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return;

  try {
    // Get auth token from Clerk
    const token = await (window as any).Clerk?.session?.getToken();
    if (!token) return;

    await fetch(`${apiUrl}/v1/usage/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        month: usage.month,
        images: usage.images,
        videos: usage.videos,
        text: usage.text,
      }),
    });
  } catch (e) {
    // Silently fail - localStorage is the source of truth for now
    console.debug('Failed to sync usage to backend:', e);
  }
};

// Load usage from backend (call on login)
export const loadUsageFromBackend = async (userId: string): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return;

  try {
    const token = await (window as any).Clerk?.session?.getToken();
    if (!token) return;

    const response = await fetch(`${apiUrl}/v1/usage/current`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.month === getCurrentMonth()) {
        const record: UsageRecord = {
          userId,
          month: data.month,
          images: data.images || 0,
          videos: data.videos || 0,
          text: data.text || 0,
          lastUpdated: Date.now(),
        };
        saveUsage(record);
      }
    }
  } catch (e) {
    console.debug('Failed to load usage from backend:', e);
  }
};

export default {
  canUse,
  recordUsage,
  getRemaining,
  getUsageStats,
  getUserTier,
  setUserTier,
  loadUsageFromBackend,
  TIER_LIMITS,
};
