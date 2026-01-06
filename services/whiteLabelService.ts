// White-Label Service - Custom branding for agencies
import { supabase } from '../lib/supabase';

export interface WhiteLabelColors {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
}

export interface WhiteLabelDarkColors {
  dark_primary_color: string;
  dark_secondary_color: string;
  dark_accent_color: string;
  dark_background_color: string;
  dark_surface_color: string;
  dark_text_color: string;
}

export interface WhiteLabelConfig {
  id: string;
  workspace_id: string;
  is_enabled: boolean;

  // Branding
  company_name?: string;
  tagline?: string;
  logo_light_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  logo_width?: number;

  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;

  // Dark mode colors
  dark_primary_color: string;
  dark_secondary_color: string;
  dark_accent_color: string;
  dark_background_color: string;
  dark_surface_color: string;
  dark_text_color: string;

  // Typography
  font_family: string;
  heading_font_family?: string;
  font_url?: string;

  // Custom domain
  custom_domain?: string;
  custom_domain_verified: boolean;
  ssl_certificate_status?: 'pending' | 'active' | 'expired';

  // Email branding
  email_from_name?: string;
  email_from_address?: string;
  email_reply_to?: string;
  email_logo_url?: string;
  email_footer_text?: string;

  // Custom pages
  login_background_url?: string;
  login_message?: string;
  custom_css?: string;
  custom_js?: string;

  // Links
  support_url?: string;
  documentation_url?: string;
  privacy_url?: string;
  terms_url?: string;

  // Feature toggles
  hide_powered_by: boolean;
  hide_help_center: boolean;
  custom_help_content?: Record<string, unknown>;

  // Analytics
  google_analytics_id?: string;
  custom_tracking_code?: string;

  created_at: Date;
  updated_at: Date;
}

export interface WhiteLabelPage {
  id: string;
  white_label_id: string;
  page_type: 'login' | 'signup' | 'forgot_password' | 'error_404' | 'error_500';
  title?: string;
  content?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WhiteLabelEmailTemplate {
  id: string;
  white_label_id: string;
  template_type: 'welcome' | 'invitation' | 'approval_request' | 'password_reset' | 'export_ready' | 'comment_mention';
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateWhiteLabelInput {
  company_name?: string;
  tagline?: string;
  logo_light_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  logo_width?: number;
  colors?: Partial<WhiteLabelColors>;
  dark_colors?: Partial<WhiteLabelDarkColors>;
  font_family?: string;
  heading_font_family?: string;
  font_url?: string;
  custom_domain?: string;
  email_branding?: {
    from_name?: string;
    from_address?: string;
    reply_to?: string;
    logo_url?: string;
    footer_text?: string;
  };
  login_customization?: {
    background_url?: string;
    message?: string;
  };
  custom_css?: string;
  custom_js?: string;
  links?: {
    support_url?: string;
    documentation_url?: string;
    privacy_url?: string;
    terms_url?: string;
  };
  feature_toggles?: {
    hide_powered_by?: boolean;
    hide_help_center?: boolean;
  };
  analytics?: {
    google_analytics_id?: string;
    custom_tracking_code?: string;
  };
}

const DEFAULT_COLORS: WhiteLabelColors = {
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  accent_color: '#f59e0b',
  background_color: '#ffffff',
  surface_color: '#f8fafc',
  text_color: '#1e293b',
};

const DEFAULT_DARK_COLORS: WhiteLabelDarkColors = {
  dark_primary_color: '#818cf8',
  dark_secondary_color: '#a78bfa',
  dark_accent_color: '#fbbf24',
  dark_background_color: '#0f172a',
  dark_surface_color: '#1e293b',
  dark_text_color: '#f1f5f9',
};

const DEFAULT_EMAIL_TEMPLATES: Omit<WhiteLabelEmailTemplate, 'id' | 'white_label_id' | 'created_at' | 'updated_at'>[] = [
  {
    template_type: 'welcome',
    subject: 'Welcome to {{company_name}}!',
    html_content: `
      <div style="font-family: {{font_family}}, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 150px; margin-bottom: 24px;">
        <h1 style="color: {{primary_color}};">Welcome, {{user_name}}!</h1>
        <p>Thank you for joining {{company_name}}. We're excited to have you on board.</p>
        <a href="{{dashboard_url}}" style="display: inline-block; background: {{primary_color}}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Get Started</a>
        <p style="margin-top: 24px; color: #666;">{{footer_text}}</p>
      </div>
    `,
    text_content: 'Welcome to {{company_name}}, {{user_name}}! Get started at {{dashboard_url}}',
    variables: ['company_name', 'user_name', 'dashboard_url', 'logo_url', 'primary_color', 'font_family', 'footer_text'],
    is_active: true,
  },
  {
    template_type: 'invitation',
    subject: 'You\'ve been invited to {{workspace_name}}',
    html_content: `
      <div style="font-family: {{font_family}}, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 150px; margin-bottom: 24px;">
        <h1 style="color: {{primary_color}};">You're Invited!</h1>
        <p>{{inviter_name}} has invited you to join <strong>{{workspace_name}}</strong> on {{company_name}}.</p>
        <p>Role: <strong>{{role}}</strong></p>
        <a href="{{invite_url}}" style="display: inline-block; background: {{primary_color}}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Accept Invitation</a>
        <p style="margin-top: 16px; font-size: 14px; color: #666;">This invitation expires in 7 days.</p>
      </div>
    `,
    variables: ['company_name', 'workspace_name', 'inviter_name', 'role', 'invite_url', 'logo_url', 'primary_color', 'font_family'],
    is_active: true,
  },
  {
    template_type: 'approval_request',
    subject: 'Approval needed: {{project_name}}',
    html_content: `
      <div style="font-family: {{font_family}}, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 150px; margin-bottom: 24px;">
        <h1 style="color: {{primary_color}};">Approval Required</h1>
        <p><strong>{{submitter_name}}</strong> has submitted <strong>{{project_name}}</strong> for your approval.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Description:</strong></p>
          <p style="margin: 8px 0 0;">{{description}}</p>
        </div>
        <a href="{{review_url}}" style="display: inline-block; background: {{primary_color}}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Review Now</a>
      </div>
    `,
    variables: ['company_name', 'project_name', 'submitter_name', 'description', 'review_url', 'logo_url', 'primary_color', 'font_family'],
    is_active: true,
  },
];

class WhiteLabelService {
  private configCache: Map<string, WhiteLabelConfig> = new Map();
  private appliedStyles: HTMLStyleElement | null = null;

  // ==========================================
  // CONFIGURATION
  // ==========================================

  async getConfig(workspaceId: string): Promise<WhiteLabelConfig | null> {
    if (this.configCache.has(workspaceId)) {
      return this.configCache.get(workspaceId)!;
    }

    const { data, error } = await supabase
      .from('white_label_configs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      // Config doesn't exist yet
      return null;
    }

    this.configCache.set(workspaceId, data);
    return data;
  }

  async getConfigByDomain(domain: string): Promise<WhiteLabelConfig | null> {
    const { data, error } = await supabase
      .from('white_label_configs')
      .select('*')
      .eq('custom_domain', domain.toLowerCase())
      .eq('custom_domain_verified', true)
      .eq('is_enabled', true)
      .single();

    if (error) return null;
    return data;
  }

  async createConfig(workspaceId: string): Promise<WhiteLabelConfig | null> {
    const { data, error } = await supabase
      .from('white_label_configs')
      .insert({
        workspace_id: workspaceId,
        is_enabled: false,
        ...DEFAULT_COLORS,
        ...DEFAULT_DARK_COLORS,
        font_family: 'Inter',
        hide_powered_by: false,
        hide_help_center: false,
        custom_domain_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating white-label config:', error);
      return null;
    }

    // Create default email templates
    await this.createDefaultEmailTemplates(data.id);

    this.configCache.set(workspaceId, data);
    return data;
  }

  async updateConfig(
    workspaceId: string,
    updates: UpdateWhiteLabelInput
  ): Promise<WhiteLabelConfig | null> {
    let config = await this.getConfig(workspaceId);

    // Create config if it doesn't exist
    if (!config) {
      config = await this.createConfig(workspaceId);
      if (!config) return null;
    }

    const updateData: Record<string, unknown> = {};

    // Direct fields
    if (updates.company_name !== undefined) updateData.company_name = updates.company_name;
    if (updates.tagline !== undefined) updateData.tagline = updates.tagline;
    if (updates.logo_light_url !== undefined) updateData.logo_light_url = updates.logo_light_url;
    if (updates.logo_dark_url !== undefined) updateData.logo_dark_url = updates.logo_dark_url;
    if (updates.favicon_url !== undefined) updateData.favicon_url = updates.favicon_url;
    if (updates.logo_width !== undefined) updateData.logo_width = updates.logo_width;
    if (updates.font_family !== undefined) updateData.font_family = updates.font_family;
    if (updates.heading_font_family !== undefined) updateData.heading_font_family = updates.heading_font_family;
    if (updates.font_url !== undefined) updateData.font_url = updates.font_url;
    if (updates.custom_domain !== undefined) {
      updateData.custom_domain = updates.custom_domain?.toLowerCase();
      updateData.custom_domain_verified = false; // Reset verification
    }
    if (updates.custom_css !== undefined) updateData.custom_css = updates.custom_css;
    if (updates.custom_js !== undefined) updateData.custom_js = updates.custom_js;

    // Colors
    if (updates.colors) {
      Object.entries(updates.colors).forEach(([key, value]) => {
        if (value) updateData[key] = value;
      });
    }

    // Dark colors
    if (updates.dark_colors) {
      Object.entries(updates.dark_colors).forEach(([key, value]) => {
        if (value) updateData[key] = value;
      });
    }

    // Email branding
    if (updates.email_branding) {
      if (updates.email_branding.from_name !== undefined) updateData.email_from_name = updates.email_branding.from_name;
      if (updates.email_branding.from_address !== undefined) updateData.email_from_address = updates.email_branding.from_address;
      if (updates.email_branding.reply_to !== undefined) updateData.email_reply_to = updates.email_branding.reply_to;
      if (updates.email_branding.logo_url !== undefined) updateData.email_logo_url = updates.email_branding.logo_url;
      if (updates.email_branding.footer_text !== undefined) updateData.email_footer_text = updates.email_branding.footer_text;
    }

    // Login customization
    if (updates.login_customization) {
      if (updates.login_customization.background_url !== undefined) updateData.login_background_url = updates.login_customization.background_url;
      if (updates.login_customization.message !== undefined) updateData.login_message = updates.login_customization.message;
    }

    // Links
    if (updates.links) {
      if (updates.links.support_url !== undefined) updateData.support_url = updates.links.support_url;
      if (updates.links.documentation_url !== undefined) updateData.documentation_url = updates.links.documentation_url;
      if (updates.links.privacy_url !== undefined) updateData.privacy_url = updates.links.privacy_url;
      if (updates.links.terms_url !== undefined) updateData.terms_url = updates.links.terms_url;
    }

    // Feature toggles
    if (updates.feature_toggles) {
      if (updates.feature_toggles.hide_powered_by !== undefined) updateData.hide_powered_by = updates.feature_toggles.hide_powered_by;
      if (updates.feature_toggles.hide_help_center !== undefined) updateData.hide_help_center = updates.feature_toggles.hide_help_center;
    }

    // Analytics
    if (updates.analytics) {
      if (updates.analytics.google_analytics_id !== undefined) updateData.google_analytics_id = updates.analytics.google_analytics_id;
      if (updates.analytics.custom_tracking_code !== undefined) updateData.custom_tracking_code = updates.analytics.custom_tracking_code;
    }

    const { data, error } = await supabase
      .from('white_label_configs')
      .update(updateData)
      .eq('id', config.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating white-label config:', error);
      return null;
    }

    this.configCache.set(workspaceId, data);
    return data;
  }

  async enableWhiteLabel(workspaceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('white_label_configs')
      .update({ is_enabled: true })
      .eq('workspace_id', workspaceId);

    if (!error) {
      const config = this.configCache.get(workspaceId);
      if (config) {
        config.is_enabled = true;
        this.configCache.set(workspaceId, config);
      }
    }

    return !error;
  }

  async disableWhiteLabel(workspaceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('white_label_configs')
      .update({ is_enabled: false })
      .eq('workspace_id', workspaceId);

    if (!error) {
      const config = this.configCache.get(workspaceId);
      if (config) {
        config.is_enabled = false;
        this.configCache.set(workspaceId, config);
      }
    }

    return !error;
  }

  // ==========================================
  // CUSTOM DOMAIN
  // ==========================================

  async verifyCustomDomain(workspaceId: string): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig(workspaceId);
    if (!config?.custom_domain) {
      return { success: false, error: 'No custom domain configured' };
    }

    // In production, verify DNS CNAME record points to our servers
    // For now, simulate verification
    const isVerified = true;

    if (isVerified) {
      await supabase
        .from('white_label_configs')
        .update({
          custom_domain_verified: true,
          ssl_certificate_status: 'active',
        })
        .eq('workspace_id', workspaceId);

      return { success: true };
    }

    return { success: false, error: 'DNS verification failed. Please ensure CNAME record is configured correctly.' };
  }

  // ==========================================
  // CUSTOM PAGES
  // ==========================================

  async getCustomPages(whiteLabelId: string): Promise<WhiteLabelPage[]> {
    const { data, error } = await supabase
      .from('white_label_pages')
      .select('*')
      .eq('white_label_id', whiteLabelId);

    if (error) return [];
    return data || [];
  }

  async updateCustomPage(
    whiteLabelId: string,
    pageType: WhiteLabelPage['page_type'],
    updates: { title?: string; content?: string; is_active?: boolean }
  ): Promise<WhiteLabelPage | null> {
    const { data, error } = await supabase
      .from('white_label_pages')
      .upsert({
        white_label_id: whiteLabelId,
        page_type: pageType,
        ...updates,
      }, {
        onConflict: 'white_label_id,page_type',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating custom page:', error);
      return null;
    }

    return data;
  }

  // ==========================================
  // EMAIL TEMPLATES
  // ==========================================

  private async createDefaultEmailTemplates(whiteLabelId: string): Promise<void> {
    const templates = DEFAULT_EMAIL_TEMPLATES.map(t => ({
      ...t,
      white_label_id: whiteLabelId,
    }));

    await supabase.from('white_label_email_templates').insert(templates);
  }

  async getEmailTemplates(whiteLabelId: string): Promise<WhiteLabelEmailTemplate[]> {
    const { data, error } = await supabase
      .from('white_label_email_templates')
      .select('*')
      .eq('white_label_id', whiteLabelId);

    if (error) return [];
    return data || [];
  }

  async updateEmailTemplate(
    templateId: string,
    updates: Partial<Omit<WhiteLabelEmailTemplate, 'id' | 'white_label_id' | 'created_at' | 'updated_at'>>
  ): Promise<WhiteLabelEmailTemplate | null> {
    const { data, error } = await supabase
      .from('white_label_email_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating email template:', error);
      return null;
    }

    return data;
  }

  async renderEmailTemplate(
    templateId: string,
    variables: Record<string, string>
  ): Promise<{ html: string; text?: string; subject: string } | null> {
    const { data: template } = await supabase
      .from('white_label_email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) return null;

    let html = template.html_content;
    let text = template.text_content;
    let subject = template.subject;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(pattern, value);
      if (text) text = text.replace(pattern, value);
      subject = subject.replace(pattern, value);
    });

    return { html, text: text || undefined, subject };
  }

  // ==========================================
  // APPLY BRANDING
  // ==========================================

  applyBranding(config: WhiteLabelConfig): void {
    if (!config.is_enabled) return;

    // Apply CSS custom properties
    const root = document.documentElement;

    // Light mode colors
    root.style.setProperty('--wl-primary', config.primary_color);
    root.style.setProperty('--wl-secondary', config.secondary_color);
    root.style.setProperty('--wl-accent', config.accent_color);
    root.style.setProperty('--wl-background', config.background_color);
    root.style.setProperty('--wl-surface', config.surface_color);
    root.style.setProperty('--wl-text', config.text_color);

    // Dark mode colors
    root.style.setProperty('--wl-dark-primary', config.dark_primary_color);
    root.style.setProperty('--wl-dark-secondary', config.dark_secondary_color);
    root.style.setProperty('--wl-dark-accent', config.dark_accent_color);
    root.style.setProperty('--wl-dark-background', config.dark_background_color);
    root.style.setProperty('--wl-dark-surface', config.dark_surface_color);
    root.style.setProperty('--wl-dark-text', config.dark_text_color);

    // Typography
    root.style.setProperty('--wl-font-family', config.font_family);
    if (config.heading_font_family) {
      root.style.setProperty('--wl-heading-font', config.heading_font_family);
    }

    // Load custom font if specified
    if (config.font_url) {
      this.loadCustomFont(config.font_url);
    }

    // Apply custom CSS
    if (config.custom_css) {
      this.applyCustomCSS(config.custom_css);
    }

    // Update favicon
    if (config.favicon_url) {
      this.updateFavicon(config.favicon_url);
    }

    // Update page title
    if (config.company_name) {
      document.title = config.company_name;
    }

    // Inject custom tracking code
    if (config.google_analytics_id) {
      this.injectGoogleAnalytics(config.google_analytics_id);
    }

    if (config.custom_tracking_code) {
      this.injectCustomTracking(config.custom_tracking_code);
    }
  }

  removeBranding(): void {
    const root = document.documentElement;

    // Remove CSS custom properties
    [
      '--wl-primary', '--wl-secondary', '--wl-accent', '--wl-background', '--wl-surface', '--wl-text',
      '--wl-dark-primary', '--wl-dark-secondary', '--wl-dark-accent', '--wl-dark-background', '--wl-dark-surface', '--wl-dark-text',
      '--wl-font-family', '--wl-heading-font',
    ].forEach(prop => root.style.removeProperty(prop));

    // Remove custom CSS
    if (this.appliedStyles) {
      this.appliedStyles.remove();
      this.appliedStyles = null;
    }
  }

  private loadCustomFont(fontUrl: string): void {
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
  }

  private applyCustomCSS(css: string): void {
    // Remove existing custom styles
    if (this.appliedStyles) {
      this.appliedStyles.remove();
    }

    // Create new style element
    this.appliedStyles = document.createElement('style');
    this.appliedStyles.id = 'white-label-custom-css';
    this.appliedStyles.textContent = css;
    document.head.appendChild(this.appliedStyles);
  }

  private updateFavicon(faviconUrl: string): void {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }

  private injectGoogleAnalytics(gaId: string): void {
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) return;

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(script2);
  }

  private injectCustomTracking(code: string): void {
    const script = document.createElement('script');
    script.textContent = code;
    document.head.appendChild(script);
  }

  // ==========================================
  // PREVIEW
  // ==========================================

  generatePreviewCSS(config: Partial<WhiteLabelConfig>): string {
    return `
      :root {
        --wl-primary: ${config.primary_color || DEFAULT_COLORS.primary_color};
        --wl-secondary: ${config.secondary_color || DEFAULT_COLORS.secondary_color};
        --wl-accent: ${config.accent_color || DEFAULT_COLORS.accent_color};
        --wl-background: ${config.background_color || DEFAULT_COLORS.background_color};
        --wl-surface: ${config.surface_color || DEFAULT_COLORS.surface_color};
        --wl-text: ${config.text_color || DEFAULT_COLORS.text_color};
        --wl-font-family: ${config.font_family || 'Inter'};
      }

      .dark {
        --wl-primary: ${config.dark_primary_color || DEFAULT_DARK_COLORS.dark_primary_color};
        --wl-secondary: ${config.dark_secondary_color || DEFAULT_DARK_COLORS.dark_secondary_color};
        --wl-accent: ${config.dark_accent_color || DEFAULT_DARK_COLORS.dark_accent_color};
        --wl-background: ${config.dark_background_color || DEFAULT_DARK_COLORS.dark_background_color};
        --wl-surface: ${config.dark_surface_color || DEFAULT_DARK_COLORS.dark_surface_color};
        --wl-text: ${config.dark_text_color || DEFAULT_DARK_COLORS.dark_text_color};
      }
    `;
  }

  // ==========================================
  // EXPORT BRANDING
  // ==========================================

  exportBrandingConfig(config: WhiteLabelConfig): string {
    return JSON.stringify({
      branding: {
        company_name: config.company_name,
        tagline: config.tagline,
        logos: {
          light: config.logo_light_url,
          dark: config.logo_dark_url,
          favicon: config.favicon_url,
        },
      },
      colors: {
        light: {
          primary: config.primary_color,
          secondary: config.secondary_color,
          accent: config.accent_color,
          background: config.background_color,
          surface: config.surface_color,
          text: config.text_color,
        },
        dark: {
          primary: config.dark_primary_color,
          secondary: config.dark_secondary_color,
          accent: config.dark_accent_color,
          background: config.dark_background_color,
          surface: config.dark_surface_color,
          text: config.dark_text_color,
        },
      },
      typography: {
        font_family: config.font_family,
        heading_font: config.heading_font_family,
        font_url: config.font_url,
      },
    }, null, 2);
  }
}

export const whiteLabelService = new WhiteLabelService();
export default whiteLabelService;
