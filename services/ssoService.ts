// SSO/SAML Service - Enterprise authentication
import { supabase } from '../lib/supabase';

export type SSOProviderType = 'saml' | 'oidc' | 'oauth2';
export type SSOProviderName = 'okta' | 'azure_ad' | 'google' | 'onelogin' | 'auth0' | 'custom';

export interface AttributeMapping {
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  groups: string;
  department: string;
  [key: string]: string;
}

export interface SSOSettings {
  auto_provision_users: boolean;
  auto_update_user_info: boolean;
  enforce_sso: boolean;
  allow_password_login: boolean;
  default_role: string;
  session_duration_hours: number;
  require_mfa: boolean;
}

export interface SSOConfiguration {
  id: string;
  workspace_id: string;
  provider_type: SSOProviderType;
  provider_name: SSOProviderName;
  display_name?: string;
  is_enabled: boolean;
  is_primary: boolean;

  // SAML Configuration
  saml_entity_id?: string;
  saml_sso_url?: string;
  saml_slo_url?: string;
  saml_certificate?: string;
  saml_signature_algorithm?: string;
  saml_name_id_format?: string;

  // OIDC/OAuth Configuration
  oidc_issuer?: string;
  oidc_client_id?: string;
  oidc_client_secret_encrypted?: string;
  oidc_scopes?: string[];
  oidc_authorization_endpoint?: string;
  oidc_token_endpoint?: string;
  oidc_userinfo_endpoint?: string;
  oidc_jwks_uri?: string;

  // Mappings
  attribute_mapping: AttributeMapping;
  group_mapping: Record<string, string>;

  // Settings
  settings: SSOSettings;

  // Domain verification
  verified_domains?: string[];
  domain_verification_token?: string;

  created_by: string;
  created_at: Date;
  updated_at: Date;
  last_used_at?: Date;
}

export interface SSOSession {
  id: string;
  user_id: string;
  sso_config_id: string;
  session_index?: string;
  name_id?: string;
  attributes: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
  last_activity_at: Date;
}

export interface VerifiedDomain {
  id: string;
  workspace_id: string;
  domain: string;
  is_verified: boolean;
  verification_method?: 'dns_txt' | 'meta_tag' | 'file';
  verification_token?: string;
  verified_at?: Date;
  created_at: Date;
}

export interface SAMLConfig {
  entity_id: string;
  sso_url: string;
  slo_url?: string;
  certificate: string;
  signature_algorithm?: string;
  name_id_format?: string;
}

export interface OIDCConfig {
  issuer: string;
  client_id: string;
  client_secret: string;
  scopes?: string[];
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
}

export interface CreateSSOConfigInput {
  provider_type: SSOProviderType;
  provider_name: SSOProviderName;
  display_name?: string;
  saml_config?: SAMLConfig;
  oidc_config?: OIDCConfig;
  attribute_mapping?: Partial<AttributeMapping>;
  group_mapping?: Record<string, string>;
  settings?: Partial<SSOSettings>;
}

const DEFAULT_ATTRIBUTE_MAPPING: AttributeMapping = {
  email: 'email',
  first_name: 'given_name',
  last_name: 'family_name',
  display_name: 'name',
  groups: 'groups',
  department: 'department',
};

const DEFAULT_SSO_SETTINGS: SSOSettings = {
  auto_provision_users: true,
  auto_update_user_info: true,
  enforce_sso: false,
  allow_password_login: true,
  default_role: 'viewer',
  session_duration_hours: 24,
  require_mfa: false,
};

// Provider-specific metadata URLs
const PROVIDER_METADATA: Partial<Record<SSOProviderName, { metadataUrlTemplate?: string; docUrl: string }>> = {
  okta: {
    metadataUrlTemplate: 'https://{domain}.okta.com/.well-known/openid-configuration',
    docUrl: 'https://developer.okta.com/docs/guides/build-sso-integration/',
  },
  azure_ad: {
    metadataUrlTemplate: 'https://login.microsoftonline.com/{tenant_id}/v2.0/.well-known/openid-configuration',
    docUrl: 'https://docs.microsoft.com/en-us/azure/active-directory/develop/',
  },
  google: {
    metadataUrlTemplate: 'https://accounts.google.com/.well-known/openid-configuration',
    docUrl: 'https://developers.google.com/identity/protocols/oauth2/openid-connect',
  },
  onelogin: {
    metadataUrlTemplate: 'https://{subdomain}.onelogin.com/oidc/2/.well-known/openid-configuration',
    docUrl: 'https://developers.onelogin.com/',
  },
  auth0: {
    metadataUrlTemplate: 'https://{domain}/.well-known/openid-configuration',
    docUrl: 'https://auth0.com/docs/',
  },
};

class SSOService {
  // ==========================================
  // SSO CONFIGURATION
  // ==========================================

  async getConfigurations(workspaceId: string): Promise<SSOConfiguration[]> {
    const { data, error } = await supabase
      .from('sso_configurations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching SSO configurations:', error);
      return [];
    }

    return data || [];
  }

  async getConfiguration(configId: string): Promise<SSOConfiguration | null> {
    const { data, error } = await supabase
      .from('sso_configurations')
      .select('*')
      .eq('id', configId)
      .single();

    if (error) return null;
    return data;
  }

  async getPrimaryConfiguration(workspaceId: string): Promise<SSOConfiguration | null> {
    const { data, error } = await supabase
      .from('sso_configurations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_enabled', true)
      .eq('is_primary', true)
      .single();

    if (error) return null;
    return data;
  }

  async createConfiguration(
    workspaceId: string,
    input: CreateSSOConfigInput
  ): Promise<SSOConfiguration | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const configData: Record<string, unknown> = {
      workspace_id: workspaceId,
      provider_type: input.provider_type,
      provider_name: input.provider_name,
      display_name: input.display_name || this.getProviderDisplayName(input.provider_name),
      is_enabled: false,
      is_primary: false,
      attribute_mapping: { ...DEFAULT_ATTRIBUTE_MAPPING, ...input.attribute_mapping },
      group_mapping: input.group_mapping || {},
      settings: { ...DEFAULT_SSO_SETTINGS, ...input.settings },
      created_by: user.id,
    };

    // Add SAML config
    if (input.saml_config) {
      configData.saml_entity_id = input.saml_config.entity_id;
      configData.saml_sso_url = input.saml_config.sso_url;
      configData.saml_slo_url = input.saml_config.slo_url;
      configData.saml_certificate = input.saml_config.certificate;
      configData.saml_signature_algorithm = input.saml_config.signature_algorithm || 'SHA256';
      configData.saml_name_id_format = input.saml_config.name_id_format || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
    }

    // Add OIDC config
    if (input.oidc_config) {
      configData.oidc_issuer = input.oidc_config.issuer;
      configData.oidc_client_id = input.oidc_config.client_id;
      // In production, encrypt the client secret
      configData.oidc_client_secret_encrypted = btoa(input.oidc_config.client_secret);
      configData.oidc_scopes = input.oidc_config.scopes || ['openid', 'profile', 'email'];
      configData.oidc_authorization_endpoint = input.oidc_config.authorization_endpoint;
      configData.oidc_token_endpoint = input.oidc_config.token_endpoint;
      configData.oidc_userinfo_endpoint = input.oidc_config.userinfo_endpoint;
      configData.oidc_jwks_uri = input.oidc_config.jwks_uri;
    }

    const { data, error } = await supabase
      .from('sso_configurations')
      .insert(configData)
      .select()
      .single();

    if (error) {
      console.error('Error creating SSO configuration:', error);
      return null;
    }

    return data;
  }

  async updateConfiguration(
    configId: string,
    updates: Partial<CreateSSOConfigInput>
  ): Promise<SSOConfiguration | null> {
    const updateData: Record<string, unknown> = {};

    if (updates.display_name) updateData.display_name = updates.display_name;
    if (updates.attribute_mapping) updateData.attribute_mapping = updates.attribute_mapping;
    if (updates.group_mapping) updateData.group_mapping = updates.group_mapping;
    if (updates.settings) updateData.settings = updates.settings;

    if (updates.saml_config) {
      if (updates.saml_config.entity_id) updateData.saml_entity_id = updates.saml_config.entity_id;
      if (updates.saml_config.sso_url) updateData.saml_sso_url = updates.saml_config.sso_url;
      if (updates.saml_config.slo_url) updateData.saml_slo_url = updates.saml_config.slo_url;
      if (updates.saml_config.certificate) updateData.saml_certificate = updates.saml_config.certificate;
    }

    if (updates.oidc_config) {
      if (updates.oidc_config.issuer) updateData.oidc_issuer = updates.oidc_config.issuer;
      if (updates.oidc_config.client_id) updateData.oidc_client_id = updates.oidc_config.client_id;
      if (updates.oidc_config.client_secret) {
        updateData.oidc_client_secret_encrypted = btoa(updates.oidc_config.client_secret);
      }
    }

    const { data, error } = await supabase
      .from('sso_configurations')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('Error updating SSO configuration:', error);
      return null;
    }

    return data;
  }

  async enableConfiguration(configId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sso_configurations')
      .update({ is_enabled: true })
      .eq('id', configId);

    return !error;
  }

  async disableConfiguration(configId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sso_configurations')
      .update({ is_enabled: false })
      .eq('id', configId);

    return !error;
  }

  async setPrimaryConfiguration(workspaceId: string, configId: string): Promise<boolean> {
    // Unset all as primary
    await supabase
      .from('sso_configurations')
      .update({ is_primary: false })
      .eq('workspace_id', workspaceId);

    // Set the selected one as primary
    const { error } = await supabase
      .from('sso_configurations')
      .update({ is_primary: true })
      .eq('id', configId);

    return !error;
  }

  async deleteConfiguration(configId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sso_configurations')
      .delete()
      .eq('id', configId);

    return !error;
  }

  // ==========================================
  // DOMAIN VERIFICATION
  // ==========================================

  async addDomain(workspaceId: string, domain: string): Promise<VerifiedDomain | null> {
    // Generate verification token
    const token = `lumina-verify=${crypto.randomUUID()}`;

    const { data, error } = await supabase
      .from('sso_domain_allowlist')
      .insert({
        workspace_id: workspaceId,
        domain: domain.toLowerCase(),
        verification_token: token,
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding domain:', error);
      return null;
    }

    return data;
  }

  async getDomains(workspaceId: string): Promise<VerifiedDomain[]> {
    const { data, error } = await supabase
      .from('sso_domain_allowlist')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('domain', { ascending: true });

    if (error) return [];
    return data || [];
  }

  async verifyDomain(
    domainId: string,
    method: 'dns_txt' | 'meta_tag' | 'file'
  ): Promise<{ success: boolean; error?: string }> {
    const { data: domain } = await supabase
      .from('sso_domain_allowlist')
      .select('*')
      .eq('id', domainId)
      .single();

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    // In production, actually verify the domain
    // For now, we'll simulate verification
    const isVerified = true; // Would actually check DNS/meta/file

    if (isVerified) {
      await supabase
        .from('sso_domain_allowlist')
        .update({
          is_verified: true,
          verification_method: method,
          verified_at: new Date().toISOString(),
        })
        .eq('id', domainId);

      return { success: true };
    }

    return { success: false, error: 'Verification failed. Please check your configuration.' };
  }

  async removeDomain(domainId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sso_domain_allowlist')
      .delete()
      .eq('id', domainId);

    return !error;
  }

  // ==========================================
  // SSO LOGIN FLOW
  // ==========================================

  async initiateSSOLogin(
    workspaceId: string,
    configId?: string
  ): Promise<{ redirect_url: string } | null> {
    let config: SSOConfiguration | null;

    if (configId) {
      config = await this.getConfiguration(configId);
    } else {
      config = await this.getPrimaryConfiguration(workspaceId);
    }

    if (!config || !config.is_enabled) {
      return null;
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem('sso_state', state);
    sessionStorage.setItem('sso_config_id', config.id);

    if (config.provider_type === 'saml') {
      return this.initiateSAMLLogin(config, state);
    } else {
      return this.initiateOIDCLogin(config, state);
    }
  }

  private initiateSAMLLogin(
    config: SSOConfiguration,
    state: string
  ): { redirect_url: string } | null {
    if (!config.saml_sso_url) return null;

    // Build SAML AuthnRequest
    const callbackUrl = `${window.location.origin}/auth/saml/callback`;
    const requestId = `_${crypto.randomUUID()}`;

    // In production, this would be a proper SAML AuthnRequest
    const params = new URLSearchParams({
      SAMLRequest: btoa(JSON.stringify({
        id: requestId,
        issuer: window.location.origin,
        destination: config.saml_sso_url,
        assertionConsumerServiceURL: callbackUrl,
      })),
      RelayState: state,
    });

    return {
      redirect_url: `${config.saml_sso_url}?${params.toString()}`,
    };
  }

  private initiateOIDCLogin(
    config: SSOConfiguration,
    state: string
  ): { redirect_url: string } | null {
    if (!config.oidc_authorization_endpoint && !config.oidc_issuer) return null;

    const authEndpoint = config.oidc_authorization_endpoint ||
      `${config.oidc_issuer}/authorize`;

    const callbackUrl = `${window.location.origin}/auth/oidc/callback`;

    const params = new URLSearchParams({
      client_id: config.oidc_client_id || '',
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: (config.oidc_scopes || ['openid', 'profile', 'email']).join(' '),
      state,
      nonce: crypto.randomUUID(),
    });

    return {
      redirect_url: `${authEndpoint}?${params.toString()}`,
    };
  }

  async handleSSOCallback(
    type: 'saml' | 'oidc',
    params: Record<string, string>
  ): Promise<{ success: boolean; user?: unknown; error?: string }> {
    const savedState = sessionStorage.getItem('sso_state');
    const configId = sessionStorage.getItem('sso_config_id');

    if (!savedState || params.state !== savedState) {
      return { success: false, error: 'Invalid state parameter' };
    }

    if (!configId) {
      return { success: false, error: 'Missing SSO configuration' };
    }

    const config = await this.getConfiguration(configId);
    if (!config) {
      return { success: false, error: 'SSO configuration not found' };
    }

    // Clear session storage
    sessionStorage.removeItem('sso_state');
    sessionStorage.removeItem('sso_config_id');

    if (type === 'saml') {
      return this.handleSAMLCallback(config, params);
    } else {
      return this.handleOIDCCallback(config, params);
    }
  }

  private async handleSAMLCallback(
    config: SSOConfiguration,
    params: Record<string, string>
  ): Promise<{ success: boolean; user?: unknown; error?: string }> {
    // In production, validate and parse SAML Response
    const samlResponse = params.SAMLResponse;
    if (!samlResponse) {
      return { success: false, error: 'Missing SAML response' };
    }

    // Parse and validate response (simplified)
    try {
      const decoded = JSON.parse(atob(samlResponse));
      const attributes = this.mapAttributes(decoded.attributes || {}, config.attribute_mapping);

      // Create or update user
      const user = await this.provisionUser(config, attributes);

      // Create SSO session
      await this.createSSOSession(config, user.id, decoded.sessionIndex, decoded.nameId, attributes);

      // Update last used
      await supabase
        .from('sso_configurations')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', config.id);

      return { success: true, user };
    } catch {
      return { success: false, error: 'Failed to process SAML response' };
    }
  }

  private async handleOIDCCallback(
    config: SSOConfiguration,
    params: Record<string, string>
  ): Promise<{ success: boolean; user?: unknown; error?: string }> {
    const code = params.code;
    if (!code) {
      return { success: false, error: 'Missing authorization code' };
    }

    // Exchange code for tokens (simplified - in production use proper OAuth flow)
    try {
      // In production, make token exchange request
      const tokenEndpoint = config.oidc_token_endpoint || `${config.oidc_issuer}/token`;

      // Simulate token response
      const userInfo = {
        email: 'user@example.com',
        given_name: 'Example',
        family_name: 'User',
        name: 'Example User',
      };

      const attributes = this.mapAttributes(userInfo, config.attribute_mapping);
      const user = await this.provisionUser(config, attributes);

      await this.createSSOSession(config, user.id, undefined, attributes.email, attributes);

      await supabase
        .from('sso_configurations')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', config.id);

      return { success: true, user };
    } catch {
      return { success: false, error: 'Failed to process OIDC callback' };
    }
  }

  private mapAttributes(
    source: Record<string, unknown>,
    mapping: AttributeMapping
  ): Record<string, string> {
    const result: Record<string, string> = {};

    Object.entries(mapping).forEach(([target, sourceKey]) => {
      const value = source[sourceKey];
      if (value !== undefined && value !== null) {
        result[target] = String(value);
      }
    });

    return result;
  }

  private async provisionUser(
    config: SSOConfiguration,
    attributes: Record<string, string>
  ): Promise<{ id: string; email: string }> {
    // In production, check if user exists and create/update as needed
    // For now, return mock user
    return {
      id: crypto.randomUUID(),
      email: attributes.email,
    };
  }

  private async createSSOSession(
    config: SSOConfiguration,
    userId: string,
    sessionIndex: string | undefined,
    nameId: string | undefined,
    attributes: Record<string, unknown>
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (config.settings?.session_duration_hours || 24));

    await supabase.from('sso_sessions').insert({
      user_id: userId,
      sso_config_id: config.id,
      session_index: sessionIndex,
      name_id: nameId,
      attributes,
      expires_at: expiresAt.toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  async getSSOSessions(userId: string): Promise<SSOSession[]> {
    const { data, error } = await supabase
      .from('sso_sessions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sso_sessions')
      .delete()
      .eq('id', sessionId);

    return !error;
  }

  async terminateAllSessions(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sso_sessions')
      .delete()
      .eq('user_id', userId);

    return !error;
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  getProviderDisplayName(provider: SSOProviderName): string {
    const names: Record<SSOProviderName, string> = {
      okta: 'Okta',
      azure_ad: 'Microsoft Azure AD',
      google: 'Google Workspace',
      onelogin: 'OneLogin',
      auth0: 'Auth0',
      custom: 'Custom Provider',
    };
    return names[provider] || provider;
  }

  getProviderDocUrl(provider: SSOProviderName): string {
    return PROVIDER_METADATA[provider]?.docUrl || '';
  }

  generateServiceProviderMetadata(workspaceId: string): string {
    const entityId = `${window.location.origin}/saml/${workspaceId}`;
    const acsUrl = `${window.location.origin}/auth/saml/callback`;
    const sloUrl = `${window.location.origin}/auth/saml/logout`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="0"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${sloUrl}"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }
}

export const ssoService = new SSOService();
export default ssoService;
