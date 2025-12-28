/**
 * AI Studio API Key Management (BYOK System)
 *
 * Handles secure storage, retrieval, and validation of Google AI API keys.
 * Keys are stored in localStorage for persistence.
 *
 * BYOK = Bring Your Own Key - allows users to use their own API keys
 * for unlimited AI generation without consuming platform credits.
 */

const STORAGE_KEY = 'lumina_gemini_api_key';
const KEY_STATUS_STORAGE = 'lumina_api_key_status';

export interface KeyStatus {
  isValid: boolean;
  lastChecked: number;
  source: 'byok' | 'platform' | 'none';
  maskedKey?: string;
}

interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
  getApiKey: () => string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  validateApiKey: (key: string) => Promise<{ valid: boolean; error?: string }>;
  getKeyStatus: () => KeyStatus;
  getMaskedKey: () => string | null;
}

// Create modal for API key input
function createKeyModal(): Promise<string | null> {
  return new Promise((resolve) => {
    // Check if modal already exists
    const existing = document.getElementById('aistudio-key-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'aistudio-key-modal';
    overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';

    overlay.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Connect Google AI</h2>
          <p class="text-slate-500 text-sm">Enter your Google AI Studio API key to enable Gemini features.</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">API Key</label>
            <input
              type="password"
              id="aistudio-key-input"
              placeholder="AIza..."
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-900"
            />
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            class="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Get an API key from Google AI Studio →
          </a>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            id="aistudio-cancel-btn"
            class="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            id="aistudio-save-btn"
            class="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:from-indigo-600 hover:to-violet-700 transition-all"
          >
            Connect
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('aistudio-key-input') as HTMLInputElement;
    const cancelBtn = document.getElementById('aistudio-cancel-btn');
    const saveBtn = document.getElementById('aistudio-save-btn');

    const close = (value: string | null) => {
      overlay.remove();
      resolve(value);
    };

    cancelBtn?.addEventListener('click', () => close(null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });

    saveBtn?.addEventListener('click', () => {
      const key = input?.value?.trim();
      if (key && key.length > 10) {
        close(key);
      } else {
        input?.classList.add('border-red-500');
        input?.focus();
      }
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveBtn?.click();
      } else if (e.key === 'Escape') {
        close(null);
      }
    });

    setTimeout(() => input?.focus(), 100);
  });
}

// Helper to mask API key for display
function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

// Validate API key by making a minimal API call
async function testApiKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Use a minimal models.list call to validate the key
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (response.ok) {
      return { valid: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;

    if (response.status === 400 || response.status === 403) {
      return { valid: false, error: 'Invalid API key. Please check and try again.' };
    } else if (response.status === 429) {
      return { valid: true, error: 'Key is valid but rate limited. Try again later.' };
    }

    return { valid: false, error: errorMessage };
  } catch (e) {
    return { valid: false, error: 'Network error. Please check your connection.' };
  }
}

// AI Studio implementation
const aistudio: AIStudio = {
  hasSelectedApiKey: async () => {
    const key = localStorage.getItem(STORAGE_KEY);
    return !!key && key.length > 10;
  },

  openSelectKey: async () => {
    const key = await createKeyModal();
    if (key) {
      // Validate before saving
      const validation = await testApiKey(key);
      if (validation.valid) {
        localStorage.setItem(STORAGE_KEY, key);
        (window as any).__GEMINI_API_KEY__ = key;

        // Store validation status
        const status: KeyStatus = {
          isValid: true,
          lastChecked: Date.now(),
          source: 'byok',
          maskedKey: maskApiKey(key)
        };
        localStorage.setItem(KEY_STATUS_STORAGE, JSON.stringify(status));
      } else {
        // Show error but still save if user wants to try
        console.warn('API key validation warning:', validation.error);
        localStorage.setItem(STORAGE_KEY, key);
        (window as any).__GEMINI_API_KEY__ = key;
      }
    }
  },

  getApiKey: () => {
    return localStorage.getItem(STORAGE_KEY) || (window as any).__GEMINI_API_KEY__ || null;
  },

  setApiKey: (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    (window as any).__GEMINI_API_KEY__ = key;

    // Update status
    const status: KeyStatus = {
      isValid: true,
      lastChecked: Date.now(),
      source: 'byok',
      maskedKey: maskApiKey(key)
    };
    localStorage.setItem(KEY_STATUS_STORAGE, JSON.stringify(status));
  },

  clearApiKey: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(KEY_STATUS_STORAGE);
    delete (window as any).__GEMINI_API_KEY__;
  },

  validateApiKey: async (key: string) => {
    return await testApiKey(key);
  },

  getKeyStatus: (): KeyStatus => {
    const key = localStorage.getItem(STORAGE_KEY);
    const storedStatus = localStorage.getItem(KEY_STATUS_STORAGE);

    if (key && key.length > 10) {
      if (storedStatus) {
        try {
          return JSON.parse(storedStatus);
        } catch {
          // Fall through to default
        }
      }
      return {
        isValid: true,
        lastChecked: 0,
        source: 'byok',
        maskedKey: maskApiKey(key)
      };
    }

    // Check for platform key
    const platformKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (platformKey) {
      return {
        isValid: true,
        lastChecked: Date.now(),
        source: 'platform',
        maskedKey: 'Platform Credits'
      };
    }

    return {
      isValid: false,
      lastChecked: 0,
      source: 'none'
    };
  },

  getMaskedKey: () => {
    const key = localStorage.getItem(STORAGE_KEY);
    return key ? maskApiKey(key) : null;
  }
};

// Expose to window
(window as any).aistudio = aistudio;

// Initialize key from localStorage on load
const storedKey = localStorage.getItem(STORAGE_KEY);
if (storedKey) {
  (window as any).__GEMINI_API_KEY__ = storedKey;
}

export default aistudio;
