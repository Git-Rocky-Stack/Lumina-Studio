/**
 * AI Studio API Key Management
 *
 * Handles secure storage and retrieval of Google AI API keys.
 * Keys are stored in localStorage for persistence.
 */

const STORAGE_KEY = 'lumina_gemini_api_key';

interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
  getApiKey: () => string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
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

// AI Studio implementation
const aistudio: AIStudio = {
  hasSelectedApiKey: async () => {
    const key = localStorage.getItem(STORAGE_KEY);
    return !!key && key.length > 10;
  },

  openSelectKey: async () => {
    const key = await createKeyModal();
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
      // Update process.env for the current session
      (window as any).__GEMINI_API_KEY__ = key;
    }
  },

  getApiKey: () => {
    return localStorage.getItem(STORAGE_KEY) || (window as any).__GEMINI_API_KEY__ || null;
  },

  setApiKey: (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    (window as any).__GEMINI_API_KEY__ = key;
  },

  clearApiKey: () => {
    localStorage.removeItem(STORAGE_KEY);
    delete (window as any).__GEMINI_API_KEY__;
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
