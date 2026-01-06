/**
 * Enterprise Components Index
 *
 * Export all enterprise-grade components for team collaboration,
 * compliance, security, and white-labeling features.
 */

// Workspace Management
export { WorkspacesPanel } from './WorkspacesPanel';

// Approval Workflows
export { ApprovalWorkflowsPanel } from './ApprovalWorkflowsPanel';

// Audit & Compliance
export { AuditLogsPanel } from './AuditLogsPanel';

// Single Sign-On
export { SSOPanel } from './SSOPanel';

// White-labeling
export { WhiteLabelPanel } from './WhiteLabelPanel';

// Re-export types from services for convenience
export type {
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceFolder,
  WorkspaceRole
} from '../../services/workspaceService';

export type {
  ApprovalWorkflowTemplate,
  ApprovalRequest,
  ApprovalDecision,
  ApprovalComment,
  ApprovalStage,
  ApprovalStatus
} from '../../services/approvalWorkflowService';

export type {
  AuditLogEntry,
  AuditActionType,
  AuditResource,
  RiskLevel,
  AuditRetentionPolicy
} from '../../services/auditLogService';

export type {
  SSOConfiguration,
  SSOProviderType,
  SSOProtocol,
  SSOSession,
  SSODomainAllowlist
} from '../../services/ssoService';

export type {
  WhiteLabelConfig,
  WhiteLabelPage,
  WhiteLabelEmailTemplate
} from '../../services/whiteLabelService';
