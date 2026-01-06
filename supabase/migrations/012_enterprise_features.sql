-- Enterprise Features Migration
-- Workspaces, Approval Workflows, Audit Logs, SSO/SAML, White-labeling

-- =====================================================
-- WORKSPACES - Team spaces with shared assets and permissions
-- =====================================================

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  logo_url TEXT,
  cover_image_url TEXT,
  settings JSONB DEFAULT '{
    "default_role": "viewer",
    "allow_public_sharing": false,
    "require_approval": false,
    "storage_limit_mb": 5000,
    "max_members": 50
  }'::jsonb,
  features JSONB DEFAULT '{
    "brand_kit": true,
    "templates": true,
    "comments": true,
    "version_history": true,
    "analytics": false
  }'::jsonb,
  billing_status VARCHAR(50) DEFAULT 'active',
  storage_used_mb INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members with roles
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- owner, admin, editor, viewer
  permissions JSONB DEFAULT '{
    "can_edit": false,
    "can_delete": false,
    "can_invite": false,
    "can_approve": false,
    "can_publish": false,
    "can_manage_brand": false,
    "can_view_analytics": false
  }'::jsonb,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Workspace invitations
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer',
  permissions JSONB,
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace folders for organization
CREATE TABLE IF NOT EXISTS workspace_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES workspace_folders(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link projects to workspaces
CREATE TABLE IF NOT EXISTS workspace_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  folder_id UUID REFERENCES workspace_folders(id) ON DELETE SET NULL,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- APPROVAL WORKFLOWS - Review/approve designs before publishing
-- =====================================================

-- Workflow templates
CREATE TABLE IF NOT EXISTS approval_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- stages: [{ name, approvers: [], require_all: bool, auto_advance: bool, deadline_hours: int }]
  settings JSONB DEFAULT '{
    "notify_on_submit": true,
    "notify_on_approve": true,
    "notify_on_reject": true,
    "allow_comments": true,
    "require_comment_on_reject": true,
    "auto_publish_on_final_approval": false
  }'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval requests
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  workflow_template_id UUID REFERENCES approval_workflow_templates(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  version_number INTEGER DEFAULT 1,
  snapshot_url TEXT, -- Screenshot/preview of the design
  snapshot_data JSONB, -- Serialized design state
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending, in_review, approved, rejected, cancelled
  current_stage INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual approvals within a request
CREATE TABLE IF NOT EXISTS approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
  stage_index INTEGER NOT NULL,
  approver_id UUID REFERENCES auth.users(id),
  decision VARCHAR(20), -- pending, approved, rejected, delegated
  comment TEXT,
  delegated_to UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval comments/feedback
CREATE TABLE IF NOT EXISTS approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES approval_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  annotation_data JSONB, -- For pinned comments on design
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS - Track all actions for compliance
-- =====================================================

-- Main audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  action_type VARCHAR(100) NOT NULL,
  -- Actions: user.login, user.logout, project.create, project.update, project.delete,
  -- asset.upload, asset.delete, member.invite, member.remove, role.change,
  -- approval.submit, approval.approve, approval.reject, export.download,
  -- settings.update, sso.configure, etc.
  resource_type VARCHAR(100), -- user, project, asset, member, workspace, approval, etc.
  resource_id UUID,
  resource_name VARCHAR(255),
  changes JSONB, -- { before: {}, after: {} } for tracking what changed
  metadata JSONB DEFAULT '{}'::jsonb,
  -- metadata: ip_address, user_agent, geo_location, device_info
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
  status VARCHAR(20) DEFAULT 'success', -- success, failure, blocked
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log retention policies
CREATE TABLE IF NOT EXISTS audit_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  retention_days INTEGER DEFAULT 365,
  action_types TEXT[], -- Specific action types to retain longer
  extended_retention_days INTEGER DEFAULT 2555, -- ~7 years for compliance
  auto_export BOOLEAN DEFAULT false,
  export_destination JSONB, -- { type: 's3', bucket: '', prefix: '' }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log exports
CREATE TABLE IF NOT EXISTS audit_log_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id),
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,
  filters JSONB, -- { action_types: [], user_ids: [], resource_types: [] }
  format VARCHAR(20) DEFAULT 'csv', -- csv, json, pdf
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  file_url TEXT,
  file_size_bytes BIGINT,
  record_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- SSO/SAML - Enterprise authentication
-- =====================================================

-- SSO provider configurations
CREATE TABLE IF NOT EXISTS sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  provider_type VARCHAR(50) NOT NULL, -- saml, oidc, oauth2
  provider_name VARCHAR(100) NOT NULL, -- okta, azure_ad, google, onelogin, custom
  display_name VARCHAR(255),
  is_enabled BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,

  -- SAML Configuration
  saml_entity_id VARCHAR(500),
  saml_sso_url TEXT,
  saml_slo_url TEXT,
  saml_certificate TEXT,
  saml_signature_algorithm VARCHAR(50) DEFAULT 'SHA256',
  saml_name_id_format VARCHAR(100) DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

  -- OIDC/OAuth Configuration
  oidc_issuer TEXT,
  oidc_client_id VARCHAR(255),
  oidc_client_secret_encrypted TEXT,
  oidc_scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],
  oidc_authorization_endpoint TEXT,
  oidc_token_endpoint TEXT,
  oidc_userinfo_endpoint TEXT,
  oidc_jwks_uri TEXT,

  -- Attribute mapping
  attribute_mapping JSONB DEFAULT '{
    "email": "email",
    "first_name": "given_name",
    "last_name": "family_name",
    "display_name": "name",
    "groups": "groups",
    "department": "department"
  }'::jsonb,

  -- Group/Role mapping
  group_mapping JSONB DEFAULT '{}'::jsonb,
  -- { "admin_group": "admin", "editors_group": "editor" }

  -- Settings
  settings JSONB DEFAULT '{
    "auto_provision_users": true,
    "auto_update_user_info": true,
    "enforce_sso": false,
    "allow_password_login": true,
    "default_role": "viewer",
    "session_duration_hours": 24,
    "require_mfa": false
  }'::jsonb,

  -- Domain verification
  verified_domains TEXT[],
  domain_verification_token VARCHAR(255),

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- SSO sessions
CREATE TABLE IF NOT EXISTS sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sso_config_id UUID REFERENCES sso_configurations(id) ON DELETE CASCADE,
  session_index VARCHAR(255),
  name_id VARCHAR(255),
  attributes JSONB,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO domain allowlist
CREATE TABLE IF NOT EXISTS sso_domain_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(50), -- dns_txt, meta_tag, file
  verification_token VARCHAR(255),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, domain)
);

-- =====================================================
-- WHITE-LABELING - Custom branding for agencies
-- =====================================================

-- White-label configurations
CREATE TABLE IF NOT EXISTS white_label_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,

  -- Branding
  company_name VARCHAR(255),
  tagline VARCHAR(500),
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  logo_width INTEGER DEFAULT 120,

  -- Colors
  primary_color VARCHAR(7) DEFAULT '#6366f1',
  secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
  accent_color VARCHAR(7) DEFAULT '#f59e0b',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  surface_color VARCHAR(7) DEFAULT '#f8fafc',
  text_color VARCHAR(7) DEFAULT '#1e293b',

  -- Dark mode colors
  dark_primary_color VARCHAR(7) DEFAULT '#818cf8',
  dark_secondary_color VARCHAR(7) DEFAULT '#a78bfa',
  dark_accent_color VARCHAR(7) DEFAULT '#fbbf24',
  dark_background_color VARCHAR(7) DEFAULT '#0f172a',
  dark_surface_color VARCHAR(7) DEFAULT '#1e293b',
  dark_text_color VARCHAR(7) DEFAULT '#f1f5f9',

  -- Typography
  font_family VARCHAR(100) DEFAULT 'Inter',
  heading_font_family VARCHAR(100),
  font_url TEXT, -- Custom font CDN URL

  -- Custom domain
  custom_domain VARCHAR(255),
  custom_domain_verified BOOLEAN DEFAULT false,
  ssl_certificate_status VARCHAR(50), -- pending, active, expired

  -- Email branding
  email_from_name VARCHAR(255),
  email_from_address VARCHAR(255),
  email_reply_to VARCHAR(255),
  email_logo_url TEXT,
  email_footer_text TEXT,

  -- Custom pages
  login_background_url TEXT,
  login_message TEXT,
  custom_css TEXT,
  custom_js TEXT, -- For tracking/analytics

  -- Links
  support_url TEXT,
  documentation_url TEXT,
  privacy_url TEXT,
  terms_url TEXT,

  -- Feature toggles
  hide_powered_by BOOLEAN DEFAULT false,
  hide_help_center BOOLEAN DEFAULT false,
  custom_help_content JSONB,

  -- Analytics
  google_analytics_id VARCHAR(50),
  custom_tracking_code TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- White-label custom pages
CREATE TABLE IF NOT EXISTS white_label_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  white_label_id UUID REFERENCES white_label_configs(id) ON DELETE CASCADE,
  page_type VARCHAR(50) NOT NULL, -- login, signup, forgot_password, error_404, error_500
  title VARCHAR(255),
  content TEXT, -- HTML content
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(white_label_id, page_type)
);

-- White-label email templates
CREATE TABLE IF NOT EXISTS white_label_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  white_label_id UUID REFERENCES white_label_configs(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL, -- welcome, invitation, approval_request, password_reset, etc.
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(white_label_id, template_type)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Workspace indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);

-- Approval indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_workspace ON approval_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_submitted_by ON approval_requests(submitted_by);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_request ON approval_decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_approver ON approval_decisions(approver_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(workspace_id, action_type, created_at DESC);

-- SSO indexes
CREATE INDEX IF NOT EXISTS idx_sso_configs_workspace ON sso_configurations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_domains_workspace ON sso_domain_allowlist(workspace_id);

-- White-label indexes
CREATE INDEX IF NOT EXISTS idx_white_label_workspace ON white_label_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_white_label_domain ON white_label_configs(custom_domain);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_domain_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_email_templates ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY workspace_owner_all ON workspaces
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY workspace_member_select ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active')
  );

-- Workspace members policies
CREATE POLICY workspace_members_view ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY workspace_members_manage ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active' AND (role = 'owner' OR role = 'admin')
    )
  );

-- Approval requests policies
CREATE POLICY approval_requests_workspace ON approval_requests
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active')
  );

-- Audit logs policies (only admins can view)
CREATE POLICY audit_logs_admin_view ON audit_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active' AND (role = 'owner' OR role = 'admin')
    )
  );

-- SSO policies (only admins can manage)
CREATE POLICY sso_config_admin ON sso_configurations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active' AND (role = 'owner' OR role = 'admin')
    )
  );

-- White-label policies (only admins can manage)
CREATE POLICY white_label_admin ON white_label_configs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active' AND (role = 'owner' OR role = 'admin')
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_workspace_id UUID,
  p_action_type VARCHAR(100),
  p_resource_type VARCHAR(100),
  p_resource_id UUID,
  p_resource_name VARCHAR(255),
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    workspace_id, user_id, action_type, resource_type,
    resource_id, resource_name, changes, metadata
  ) VALUES (
    p_workspace_id, auth.uid(), p_action_type, p_resource_type,
    p_resource_id, p_resource_name, p_changes, p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check workspace permission
CREATE OR REPLACE FUNCTION check_workspace_permission(
  p_workspace_id UUID,
  p_permission VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_member workspace_members%ROWTYPE;
BEGIN
  SELECT * INTO v_member
  FROM workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = auth.uid()
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Owners and admins have all permissions
  IF v_member.role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;

  -- Check specific permission
  RETURN COALESCE((v_member.permissions->>p_permission)::boolean, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process approval decision
CREATE OR REPLACE FUNCTION process_approval_decision(
  p_request_id UUID,
  p_decision VARCHAR(20),
  p_comment TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_request approval_requests%ROWTYPE;
  v_template approval_workflow_templates%ROWTYPE;
  v_stage JSONB;
  v_all_approved BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get the request
  SELECT * INTO v_request FROM approval_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Record the decision
  INSERT INTO approval_decisions (request_id, stage_index, approver_id, decision, comment, decided_at)
  VALUES (p_request_id, v_request.current_stage, auth.uid(), p_decision, p_comment, NOW())
  ON CONFLICT DO NOTHING;

  -- Log audit event
  PERFORM log_audit_event(
    v_request.workspace_id,
    'approval.' || p_decision,
    'approval_request',
    p_request_id,
    v_request.title,
    jsonb_build_object('stage', v_request.current_stage, 'comment', p_comment)
  );

  IF p_decision = 'rejected' THEN
    UPDATE approval_requests SET status = 'rejected', completed_at = NOW(), updated_at = NOW()
    WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  END IF;

  -- Check if all approvers for current stage have approved
  -- (Simplified logic - in production would check require_all setting)
  UPDATE approval_requests
  SET current_stage = current_stage + 1, updated_at = NOW()
  WHERE id = p_request_id;

  -- Check if all stages complete
  SELECT * INTO v_template FROM approval_workflow_templates WHERE id = v_request.workflow_template_id;

  IF v_request.current_stage + 1 >= jsonb_array_length(v_template.stages) THEN
    UPDATE approval_requests SET status = 'approved', completed_at = NOW(), updated_at = NOW()
    WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'status', 'approved');
  END IF;

  UPDATE approval_requests SET status = 'in_review', updated_at = NOW()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'status', 'in_review', 'next_stage', v_request.current_stage + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_enterprise_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_timestamp BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

CREATE TRIGGER update_workspace_members_timestamp BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

CREATE TRIGGER update_approval_requests_timestamp BEFORE UPDATE ON approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

CREATE TRIGGER update_sso_configurations_timestamp BEFORE UPDATE ON sso_configurations
  FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();

CREATE TRIGGER update_white_label_configs_timestamp BEFORE UPDATE ON white_label_configs
  FOR EACH ROW EXECUTE FUNCTION update_enterprise_timestamp();
