// White-Label Panel - Custom branding for agencies
import React, { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  Image,
  Globe,
  Mail,
  Eye,
  Save,
  RefreshCw,
  Check,
  X,
  Upload,
  Link,
  Sun,
  Moon,
  Code,
  ExternalLink,
} from 'lucide-react';
import {
  whiteLabelService,
  WhiteLabelConfig,
  UpdateWhiteLabelInput,
} from '../../services/whiteLabelService';

interface WhiteLabelPanelProps {
  workspaceId: string;
  onClose?: () => void;
}

export const WhiteLabelPanel: React.FC<WhiteLabelPanelProps> = ({
  workspaceId,
  onClose,
}) => {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'colors' | 'domain' | 'email' | 'advanced'>('branding');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateWhiteLabelInput>({});

  useEffect(() => {
    loadConfig();
  }, [workspaceId]);

  const loadConfig = async () => {
    setIsLoading(true);
    let data = await whiteLabelService.getConfig(workspaceId);
    if (!data) {
      data = await whiteLabelService.createConfig(workspaceId);
    }
    setConfig(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updated = await whiteLabelService.updateConfig(workspaceId, formData);
    if (updated) {
      setConfig(updated);
      setFormData({});
      setHasChanges(false);
    }
    setIsSaving(false);
  };

  const handleToggleEnabled = async () => {
    if (!config) return;
    if (config.is_enabled) {
      await whiteLabelService.disableWhiteLabel(workspaceId);
    } else {
      await whiteLabelService.enableWhiteLabel(workspaceId);
    }
    setConfig({ ...config, is_enabled: !config.is_enabled });
  };

  const updateFormData = (updates: Partial<UpdateWhiteLabelInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const getPreviewValue = <T extends keyof WhiteLabelConfig>(key: T): WhiteLabelConfig[T] => {
    // Check formData first, then config
    const formKey = key as string;
    if (formKey.startsWith('dark_')) {
      const darkKey = formKey.replace('dark_', '') as keyof typeof formData.dark_colors;
      return (formData.dark_colors?.[darkKey] || config?.[key]) as WhiteLabelConfig[T];
    }
    if (formKey.endsWith('_color')) {
      const colorKey = formKey as keyof typeof formData.colors;
      return (formData.colors?.[colorKey] || config?.[key]) as WhiteLabelConfig[T];
    }
    return (formData[formKey as keyof UpdateWhiteLabelInput] || config?.[key]) as WhiteLabelConfig[T];
  };

  const ColorInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
  }> = ({ label, value, onChange }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">White-Label</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleEnabled}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              config?.is_enabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {config?.is_enabled ? 'Enabled' : 'Disabled'}
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1.5 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: 'branding', label: 'Branding', icon: Image },
          { id: 'colors', label: 'Colors', icon: Palette },
          { id: 'domain', label: 'Domain', icon: Globe },
          { id: 'email', label: 'Email', icon: Mail },
          { id: 'advanced', label: 'Advanced', icon: Code },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name ?? config?.company_name ?? ''}
                    onChange={e => updateFormData({ company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="Your Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline ?? config?.tagline ?? ''}
                    onChange={e => updateFormData({ tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="Create stunning designs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Logo (Light Mode)
                  </label>
                  <input
                    type="text"
                    value={formData.logo_light_url ?? config?.logo_light_url ?? ''}
                    onChange={e => updateFormData({ logo_light_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Logo (Dark Mode)
                  </label>
                  <input
                    type="text"
                    value={formData.logo_dark_url ?? config?.logo_dark_url ?? ''}
                    onChange={e => updateFormData({ logo_dark_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Favicon
                  </label>
                  <input
                    type="text"
                    value={formData.favicon_url ?? config?.favicon_url ?? ''}
                    onChange={e => updateFormData({ favicon_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Font Family
                  </label>
                  <select
                    value={formData.font_family ?? config?.font_family ?? 'Inter'}
                    onChange={e => updateFormData({ font_family: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Montserrat">Montserrat</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Preview</h4>
                  <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewMode('light')}
                      className={`p-1.5 rounded ${previewMode === 'light' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('dark')}
                      className={`p-1.5 rounded ${previewMode === 'dark' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-lg ${
                    previewMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                  }`}
                  style={{
                    fontFamily: formData.font_family ?? config?.font_family ?? 'Inter',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {(formData.logo_light_url || config?.logo_light_url) && previewMode === 'light' ? (
                      <img
                        src={formData.logo_light_url ?? config?.logo_light_url}
                        alt="Logo"
                        className="h-8 object-contain"
                      />
                    ) : (formData.logo_dark_url || config?.logo_dark_url) && previewMode === 'dark' ? (
                      <img
                        src={formData.logo_dark_url ?? config?.logo_dark_url}
                        alt="Logo"
                        className="h-8 object-contain"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{
                          backgroundColor: previewMode === 'dark'
                            ? getPreviewValue('dark_primary_color')
                            : getPreviewValue('primary_color'),
                        }}
                      >
                        {(formData.company_name ?? config?.company_name ?? 'L').charAt(0)}
                      </div>
                    )}
                    <span className="font-semibold">
                      {formData.company_name ?? config?.company_name ?? 'Your Company'}
                    </span>
                  </div>
                  <p className="text-sm opacity-70 mb-4">
                    {formData.tagline ?? config?.tagline ?? 'Your tagline here'}
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm"
                    style={{
                      backgroundColor: previewMode === 'dark'
                        ? getPreviewValue('dark_primary_color')
                        : getPreviewValue('primary_color'),
                    }}
                  >
                    Sample Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-8">
            {/* Light Mode Colors */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-5 h-5" />
                <h3 className="font-medium text-gray-900 dark:text-white">Light Mode</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <ColorInput
                  label="Primary"
                  value={formData.colors?.primary_color ?? config?.primary_color ?? '#6366f1'}
                  onChange={v => updateFormData({ colors: { ...formData.colors, primary_color: v } })}
                />
                <ColorInput
                  label="Secondary"
                  value={formData.colors?.secondary_color ?? config?.secondary_color ?? '#8b5cf6'}
                  onChange={v => updateFormData({ colors: { ...formData.colors, secondary_color: v } })}
                />
                <ColorInput
                  label="Accent"
                  value={formData.colors?.accent_color ?? config?.accent_color ?? '#f59e0b'}
                  onChange={v => updateFormData({ colors: { ...formData.colors, accent_color: v } })}
                />
                <ColorInput
                  label="Background"
                  value={formData.colors?.background_color ?? config?.background_color ?? '#ffffff'}
                  onChange={v => updateFormData({ colors: { ...formData.colors, background_color: v } })}
                />
                <ColorInput
                  label="Surface"
                  value={formData.colors?.surface_color ?? config?.surface_color ?? '#f8fafc'}
                  onChange={v => updateFormData({ colors: { ...formData.colors, surface_color: v } })}
                />
                <ColorInput
                  label="Text"
                  value={formData.colors?.text_color ?? config?.text_color ?? '#1e293b'}
                  onChange={v => updateFormData({ colors: { ...formData.colors, text_color: v } })}
                />
              </div>
            </div>

            {/* Dark Mode Colors */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-5 h-5" />
                <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <ColorInput
                  label="Primary"
                  value={formData.dark_colors?.dark_primary_color ?? config?.dark_primary_color ?? '#818cf8'}
                  onChange={v => updateFormData({ dark_colors: { ...formData.dark_colors, dark_primary_color: v } })}
                />
                <ColorInput
                  label="Secondary"
                  value={formData.dark_colors?.dark_secondary_color ?? config?.dark_secondary_color ?? '#a78bfa'}
                  onChange={v => updateFormData({ dark_colors: { ...formData.dark_colors, dark_secondary_color: v } })}
                />
                <ColorInput
                  label="Accent"
                  value={formData.dark_colors?.dark_accent_color ?? config?.dark_accent_color ?? '#fbbf24'}
                  onChange={v => updateFormData({ dark_colors: { ...formData.dark_colors, dark_accent_color: v } })}
                />
                <ColorInput
                  label="Background"
                  value={formData.dark_colors?.dark_background_color ?? config?.dark_background_color ?? '#0f172a'}
                  onChange={v => updateFormData({ dark_colors: { ...formData.dark_colors, dark_background_color: v } })}
                />
                <ColorInput
                  label="Surface"
                  value={formData.dark_colors?.dark_surface_color ?? config?.dark_surface_color ?? '#1e293b'}
                  onChange={v => updateFormData({ dark_colors: { ...formData.dark_colors, dark_surface_color: v } })}
                />
                <ColorInput
                  label="Text"
                  value={formData.dark_colors?.dark_text_color ?? config?.dark_text_color ?? '#f1f5f9'}
                  onChange={v => updateFormData({ dark_colors: { ...formData.dark_colors, dark_text_color: v } })}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'domain' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Domain
              </label>
              <input
                type="text"
                value={formData.custom_domain ?? config?.custom_domain ?? ''}
                onChange={e => updateFormData({ custom_domain: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder="app.yourcompany.com"
              />
              <p className="text-sm text-gray-500 mt-2">
                Point your domain's CNAME record to <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">app.lumina-os.com</code>
              </p>
            </div>

            {config?.custom_domain && (
              <div className={`p-4 rounded-lg ${
                config.custom_domain_verified
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                <div className="flex items-center gap-2">
                  {config.custom_domain_verified ? (
                    <>
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        Domain verified
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium text-yellow-700 dark:text-yellow-400">
                        Pending verification
                      </span>
                    </>
                  )}
                </div>
                {config.custom_domain_verified && (
                  <a
                    href={`https://${config.custom_domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-600 mt-2 hover:underline"
                  >
                    Visit your branded site
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Setup Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Enter your custom domain above</li>
                <li>Add a CNAME record in your DNS provider pointing to <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">app.lumina-os.com</code></li>
                <li>Wait for DNS propagation (up to 48 hours)</li>
                <li>We'll automatically provision an SSL certificate</li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Name
                </label>
                <input
                  type="text"
                  value={formData.email_branding?.from_name ?? config?.email_from_name ?? ''}
                  onChange={e => updateFormData({
                    email_branding: { ...formData.email_branding, from_name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="Your Company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Address
                </label>
                <input
                  type="email"
                  value={formData.email_branding?.from_address ?? config?.email_from_address ?? ''}
                  onChange={e => updateFormData({
                    email_branding: { ...formData.email_branding, from_address: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="noreply@yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reply-To Address
                </label>
                <input
                  type="email"
                  value={formData.email_branding?.reply_to ?? config?.email_reply_to ?? ''}
                  onChange={e => updateFormData({
                    email_branding: { ...formData.email_branding, reply_to: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="support@yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Logo URL
                </label>
                <input
                  type="text"
                  value={formData.email_branding?.logo_url ?? config?.email_logo_url ?? ''}
                  onChange={e => updateFormData({
                    email_branding: { ...formData.email_branding, logo_url: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Footer Text
              </label>
              <textarea
                value={formData.email_branding?.footer_text ?? config?.email_footer_text ?? ''}
                onChange={e => updateFormData({
                  email_branding: { ...formData.email_branding, footer_text: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder="© 2024 Your Company. All rights reserved."
                rows={2}
              />
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom CSS
              </label>
              <textarea
                value={formData.custom_css ?? config?.custom_css ?? ''}
                onChange={e => updateFormData({ custom_css: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                placeholder="/* Custom CSS styles */"
                rows={8}
              />
              <p className="text-sm text-gray-500 mt-2">
                Add custom CSS to override default styles
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={formData.analytics?.google_analytics_id ?? config?.google_analytics_id ?? ''}
                  onChange={e => updateFormData({
                    analytics: { ...formData.analytics, google_analytics_id: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Support URL
                </label>
                <input
                  type="text"
                  value={formData.links?.support_url ?? config?.support_url ?? ''}
                  onChange={e => updateFormData({
                    links: { ...formData.links, support_url: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="https://support.yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Documentation URL
                </label>
                <input
                  type="text"
                  value={formData.links?.documentation_url ?? config?.documentation_url ?? ''}
                  onChange={e => updateFormData({
                    links: { ...formData.links, documentation_url: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="https://docs.yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Privacy Policy URL
                </label>
                <input
                  type="text"
                  value={formData.links?.privacy_url ?? config?.privacy_url ?? ''}
                  onChange={e => updateFormData({
                    links: { ...formData.links, privacy_url: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="https://yourcompany.com/privacy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Terms of Service URL
                </label>
                <input
                  type="text"
                  value={formData.links?.terms_url ?? config?.terms_url ?? ''}
                  onChange={e => updateFormData({
                    links: { ...formData.links, terms_url: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="https://yourcompany.com/terms"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.feature_toggles?.hide_powered_by ?? config?.hide_powered_by ?? false}
                  onChange={e => updateFormData({
                    feature_toggles: { ...formData.feature_toggles, hide_powered_by: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Hide "Powered by Lumina"
                  </p>
                  <p className="text-sm text-gray-500">
                    Remove Lumina branding from the footer
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhiteLabelPanel;
