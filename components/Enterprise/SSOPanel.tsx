// SSO Panel - Enterprise authentication configuration
import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Globe,
  Settings,
  Plus,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from 'lucide-react';
import {
  ssoService,
  SSOConfiguration,
  SSOProviderType,
  SSOProviderName,
  VerifiedDomain,
  CreateSSOConfigInput,
} from '../../services/ssoService';

interface SSOPanelProps {
  workspaceId: string;
  onClose?: () => void;
}

export const SSOPanel: React.FC<SSOPanelProps> = ({
  workspaceId,
  onClose,
}) => {
  const [configurations, setConfigurations] = useState<SSOConfiguration[]>([]);
  const [domains, setDomains] = useState<VerifiedDomain[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<SSOConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'providers' | 'domains' | 'settings'>('providers');
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  // New provider form
  const [newProvider, setNewProvider] = useState<{
    type: SSOProviderType;
    name: SSOProviderName;
    displayName: string;
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    clientId?: string;
    clientSecret?: string;
    issuer?: string;
  }>({
    type: 'saml',
    name: 'okta',
    displayName: '',
  });

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    setIsLoading(true);
    const [configs, doms] = await Promise.all([
      ssoService.getConfigurations(workspaceId),
      ssoService.getDomains(workspaceId),
    ]);
    setConfigurations(configs);
    setDomains(doms);
    setIsLoading(false);
  };

  const handleAddProvider = async () => {
    const input: CreateSSOConfigInput = {
      provider_type: newProvider.type,
      provider_name: newProvider.name,
      display_name: newProvider.displayName || undefined,
    };

    if (newProvider.type === 'saml') {
      input.saml_config = {
        entity_id: newProvider.entityId || '',
        sso_url: newProvider.ssoUrl || '',
        certificate: newProvider.certificate || '',
      };
    } else {
      input.oidc_config = {
        issuer: newProvider.issuer || '',
        client_id: newProvider.clientId || '',
        client_secret: newProvider.clientSecret || '',
      };
    }

    const config = await ssoService.createConfiguration(workspaceId, input);
    if (config) {
      setConfigurations([...configurations, config]);
      setShowAddProvider(false);
      setNewProvider({ type: 'saml', name: 'okta', displayName: '' });
    }
  };

  const handleToggleEnabled = async (configId: string, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      await ssoService.disableConfiguration(configId);
    } else {
      await ssoService.enableConfiguration(configId);
    }
    setConfigurations(configs =>
      configs.map(c =>
        c.id === configId ? { ...c, is_enabled: !currentlyEnabled } : c
      )
    );
  };

  const handleSetPrimary = async (configId: string) => {
    await ssoService.setPrimaryConfiguration(workspaceId, configId);
    setConfigurations(configs =>
      configs.map(c => ({
        ...c,
        is_primary: c.id === configId,
      }))
    );
  };

  const handleDeleteConfig = async (configId: string) => {
    if (confirm('Are you sure you want to delete this SSO configuration?')) {
      await ssoService.deleteConfiguration(configId);
      setConfigurations(configs => configs.filter(c => c.id !== configId));
      if (selectedConfig?.id === configId) {
        setSelectedConfig(null);
      }
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    const domain = await ssoService.addDomain(workspaceId, newDomain.trim());
    if (domain) {
      setDomains([...domains, domain]);
      setNewDomain('');
      setShowAddDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    const result = await ssoService.verifyDomain(domainId, 'dns_txt');
    if (result.success) {
      setDomains(doms =>
        doms.map(d => (d.id === domainId ? { ...d, is_verified: true } : d))
      );
    } else {
      alert(result.error || 'Verification failed');
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    if (confirm('Are you sure you want to remove this domain?')) {
      await ssoService.removeDomain(domainId);
      setDomains(doms => doms.filter(d => d.id !== domainId));
    }
  };

  const getProviderIcon = (name: SSOProviderName) => {
    switch (name) {
      case 'okta':
        return '🔐';
      case 'azure_ad':
        return '🔷';
      case 'google':
        return '🔴';
      case 'onelogin':
        return '🟢';
      case 'auth0':
        return '🟠';
      default:
        return '🔑';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">SSO / SAML</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'providers'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Identity Providers
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'domains'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          Verified Domains
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'settings'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'providers' ? (
          <div className="space-y-4">
            {/* Add Provider Button */}
            <button
              onClick={() => setShowAddProvider(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Identity Provider
            </button>

            {/* Provider List */}
            {configurations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No SSO providers configured</p>
                <p className="text-sm mt-1">Add an identity provider to enable SSO</p>
              </div>
            ) : (
              configurations.map(config => (
                <div
                  key={config.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getProviderIcon(config.provider_name)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {config.display_name || ssoService.getProviderDisplayName(config.provider_name)}
                          </h3>
                          {config.is_primary && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 capitalize">
                          {config.provider_type} &middot; {config.provider_name.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(config.id, config.is_enabled)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        {config.is_enabled ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedConfig(config)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {!config.is_primary && config.is_enabled && (
                    <button
                      onClick={() => handleSetPrimary(config.id)}
                      className="mt-3 text-sm text-purple-600 hover:underline"
                    >
                      Set as primary provider
                    </button>
                  )}
                </div>
              ))
            )}

            {/* Service Provider Info */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Service Provider Details
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Entity ID / Issuer</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {window.location.origin}/saml/{workspaceId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/saml/${workspaceId}`)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">ACS URL</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {window.location.origin}/auth/saml/callback
                    </code>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/auth/saml/callback`)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'domains' ? (
          <div className="space-y-4">
            {/* Add Domain */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
              <button
                onClick={handleAddDomain}
                disabled={!newDomain.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                Add Domain
              </button>
            </div>

            {/* Domain List */}
            {domains.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No verified domains</p>
                <p className="text-sm mt-1">Add and verify your domain for SSO</p>
              </div>
            ) : (
              <div className="space-y-2">
                {domains.map(domain => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {domain.is_verified ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {domain.domain}
                        </p>
                        <p className="text-sm text-gray-500">
                          {domain.is_verified
                            ? `Verified via ${domain.verification_method}`
                            : 'Pending verification'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!domain.is_verified && (
                        <button
                          onClick={() => handleVerifyDomain(domain.id)}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg hover:bg-yellow-200"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveDomain(domain.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Verification Instructions */}
            {domains.some(d => !d.is_verified) && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Domain Verification
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Add a DNS TXT record to verify domain ownership:
                </p>
                <code className="block text-xs bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded">
                  lumina-verify={domains.find(d => !d.is_verified)?.verification_token}
                </code>
              </div>
            )}
          </div>
        ) : (
          // Settings Tab
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                SSO Settings
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Enforce SSO
                    </p>
                    <p className="text-sm text-gray-500">
                      Require all users to authenticate via SSO
                    </p>
                  </div>
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Auto-provision users
                    </p>
                    <p className="text-sm text-gray-500">
                      Automatically create accounts for new SSO users
                    </p>
                  </div>
                  <ToggleRight className="w-6 h-6 text-green-500" />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Allow password login
                    </p>
                    <p className="text-sm text-gray-500">
                      Allow users to sign in with email/password
                    </p>
                  </div>
                  <ToggleRight className="w-6 h-6 text-green-500" />
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Default Role
              </h3>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Role assigned to new users created via SSO
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Identity Provider
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Provider Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNewProvider({ ...newProvider, type: 'saml' })}
                      className={`p-3 rounded-lg border text-sm font-medium ${
                        newProvider.type === 'saml'
                          ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      SAML 2.0
                    </button>
                    <button
                      onClick={() => setNewProvider({ ...newProvider, type: 'oidc' })}
                      className={`p-3 rounded-lg border text-sm font-medium ${
                        newProvider.type === 'oidc'
                          ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      OpenID Connect
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Provider
                  </label>
                  <select
                    value={newProvider.name}
                    onChange={e => setNewProvider({ ...newProvider, name: e.target.value as SSOProviderName })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="okta">Okta</option>
                    <option value="azure_ad">Microsoft Azure AD</option>
                    <option value="google">Google Workspace</option>
                    <option value="onelogin">OneLogin</option>
                    <option value="auth0">Auth0</option>
                    <option value="custom">Custom Provider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newProvider.displayName}
                    onChange={e => setNewProvider({ ...newProvider, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Company SSO"
                  />
                </div>

                {newProvider.type === 'saml' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Identity Provider Entity ID
                      </label>
                      <input
                        type="text"
                        value={newProvider.entityId || ''}
                        onChange={e => setNewProvider({ ...newProvider, entityId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="https://your-idp.com/entity-id"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SSO URL
                      </label>
                      <input
                        type="text"
                        value={newProvider.ssoUrl || ''}
                        onChange={e => setNewProvider({ ...newProvider, ssoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="https://your-idp.com/sso"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        X.509 Certificate
                      </label>
                      <textarea
                        value={newProvider.certificate || ''}
                        onChange={e => setNewProvider({ ...newProvider, certificate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-xs"
                        placeholder="-----BEGIN CERTIFICATE-----"
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Issuer URL
                      </label>
                      <input
                        type="text"
                        value={newProvider.issuer || ''}
                        onChange={e => setNewProvider({ ...newProvider, issuer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="https://your-idp.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={newProvider.clientId || ''}
                        onChange={e => setNewProvider({ ...newProvider, clientId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={newProvider.clientSecret || ''}
                        onChange={e => setNewProvider({ ...newProvider, clientSecret: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddProvider(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProvider}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Add Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSOPanel;
