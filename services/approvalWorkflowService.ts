// Approval Workflow Service - Review/approve designs before publishing
import { supabase } from '../lib/supabase';

export type ApprovalStatus = 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'delegated';
export type ApprovalPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface WorkflowStage {
  name: string;
  approvers: string[]; // User IDs or role names
  require_all: boolean; // All must approve vs any one
  auto_advance: boolean;
  deadline_hours?: number;
  notification_message?: string;
}

export interface WorkflowSettings {
  notify_on_submit: boolean;
  notify_on_approve: boolean;
  notify_on_reject: boolean;
  allow_comments: boolean;
  require_comment_on_reject: boolean;
  auto_publish_on_final_approval: boolean;
}

export interface ApprovalWorkflowTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  stages: WorkflowStage[];
  settings: WorkflowSettings;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ApprovalRequest {
  id: string;
  workspace_id: string;
  project_id: string;
  workflow_template_id?: string;
  title: string;
  description?: string;
  version_number: number;
  snapshot_url?: string;
  snapshot_data?: Record<string, unknown>;
  status: ApprovalStatus;
  current_stage: number;
  submitted_by: string;
  submitted_at?: Date;
  completed_at?: Date;
  due_date?: Date;
  priority: ApprovalPriority;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  // Joined data
  workflow_template?: ApprovalWorkflowTemplate;
  submitter?: { email: string; full_name?: string };
  decisions?: ApprovalDecisionRecord[];
  comments?: ApprovalComment[];
}

export interface ApprovalDecisionRecord {
  id: string;
  request_id: string;
  stage_index: number;
  approver_id: string;
  decision?: ApprovalDecision;
  comment?: string;
  delegated_to?: string;
  decided_at?: Date;
  created_at: Date;
  approver?: { email: string; full_name?: string };
}

export interface ApprovalComment {
  id: string;
  request_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  attachments: { url: string; name: string; type: string }[];
  annotation_data?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    type: 'point' | 'area' | 'arrow';
  };
  is_resolved: boolean;
  resolved_by?: string;
  created_at: Date;
  updated_at: Date;
  user?: { email: string; full_name?: string; avatar_url?: string };
  replies?: ApprovalComment[];
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  stages: WorkflowStage[];
  settings?: Partial<WorkflowSettings>;
  is_default?: boolean;
}

export interface SubmitApprovalInput {
  project_id: string;
  workflow_template_id?: string;
  title: string;
  description?: string;
  snapshot_url?: string;
  snapshot_data?: Record<string, unknown>;
  due_date?: Date;
  priority?: ApprovalPriority;
}

const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  notify_on_submit: true,
  notify_on_approve: true,
  notify_on_reject: true,
  allow_comments: true,
  require_comment_on_reject: true,
  auto_publish_on_final_approval: false,
};

class ApprovalWorkflowService {
  private listeners: Map<string, Set<(request: ApprovalRequest) => void>> = new Map();

  // ==========================================
  // WORKFLOW TEMPLATES
  // ==========================================

  async getWorkflowTemplates(workspaceId: string): Promise<ApprovalWorkflowTemplate[]> {
    const { data, error } = await supabase
      .from('approval_workflow_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching workflow templates:', error);
      return [];
    }

    return data || [];
  }

  async getWorkflowTemplate(templateId: string): Promise<ApprovalWorkflowTemplate | null> {
    const { data, error } = await supabase
      .from('approval_workflow_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) return null;
    return data;
  }

  async createWorkflowTemplate(
    workspaceId: string,
    input: CreateWorkflowInput
  ): Promise<ApprovalWorkflowTemplate | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // If setting as default, unset other defaults
    if (input.is_default) {
      await supabase
        .from('approval_workflow_templates')
        .update({ is_default: false })
        .eq('workspace_id', workspaceId);
    }

    const { data, error } = await supabase
      .from('approval_workflow_templates')
      .insert({
        workspace_id: workspaceId,
        name: input.name,
        description: input.description,
        stages: input.stages,
        settings: { ...DEFAULT_WORKFLOW_SETTINGS, ...input.settings },
        is_default: input.is_default || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow template:', error);
      return null;
    }

    return data;
  }

  async updateWorkflowTemplate(
    templateId: string,
    updates: Partial<CreateWorkflowInput>
  ): Promise<ApprovalWorkflowTemplate | null> {
    const { data, error } = await supabase
      .from('approval_workflow_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow template:', error);
      return null;
    }

    return data;
  }

  async deleteWorkflowTemplate(templateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('approval_workflow_templates')
      .delete()
      .eq('id', templateId);

    return !error;
  }

  // ==========================================
  // APPROVAL REQUESTS
  // ==========================================

  async getApprovalRequests(
    workspaceId: string,
    filters?: {
      status?: ApprovalStatus | ApprovalStatus[];
      submitted_by?: string;
      project_id?: string;
    }
  ): Promise<ApprovalRequest[]> {
    let query = supabase
      .from('approval_requests')
      .select(`
        *,
        workflow_template:workflow_template_id (
          id, name, stages, settings
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.submitted_by) {
      query = query.eq('submitted_by', filters.submitted_by);
    }

    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching approval requests:', error);
      return [];
    }

    return data || [];
  }

  async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        *,
        workflow_template:workflow_template_id (*),
        decisions:approval_decisions (*),
        comments:approval_comments (*)
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching approval request:', error);
      return null;
    }

    return data;
  }

  async getMyPendingApprovals(workspaceId: string): Promise<ApprovalRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get requests where user is a pending approver
    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        *,
        workflow_template:workflow_template_id (
          id, name, stages, settings
        ),
        decisions:approval_decisions (*)
      `)
      .eq('workspace_id', workspaceId)
      .in('status', ['pending', 'in_review']);

    if (error) return [];

    // Filter to requests where user is approver at current stage and hasn't decided
    return (data || []).filter(request => {
      const template = request.workflow_template;
      if (!template?.stages) return false;

      const currentStage = template.stages[request.current_stage];
      if (!currentStage) return false;

      const isApprover = currentStage.approvers.includes(user.id);
      const hasDecided = request.decisions?.some(
        (d: ApprovalDecisionRecord) => d.stage_index === request.current_stage && d.approver_id === user.id && d.decision
      );

      return isApprover && !hasDecided;
    });
  }

  async submitForApproval(
    workspaceId: string,
    input: SubmitApprovalInput
  ): Promise<ApprovalRequest | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get workflow template
    let templateId = input.workflow_template_id;
    if (!templateId) {
      // Use default template
      const { data: defaultTemplate } = await supabase
        .from('approval_workflow_templates')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('is_default', true)
        .single();

      templateId = defaultTemplate?.id;
    }

    const { data, error } = await supabase
      .from('approval_requests')
      .insert({
        workspace_id: workspaceId,
        project_id: input.project_id,
        workflow_template_id: templateId,
        title: input.title,
        description: input.description,
        snapshot_url: input.snapshot_url,
        snapshot_data: input.snapshot_data,
        status: 'pending',
        current_stage: 0,
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        due_date: input.due_date?.toISOString(),
        priority: input.priority || 'normal',
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting for approval:', error);
      return null;
    }

    // Create pending decisions for first stage approvers
    if (templateId) {
      const template = await this.getWorkflowTemplate(templateId);
      if (template?.stages?.[0]) {
        const firstStage = template.stages[0];
        await Promise.all(
          firstStage.approvers.map(approverId =>
            supabase.from('approval_decisions').insert({
              request_id: data.id,
              stage_index: 0,
              approver_id: approverId,
              decision: 'pending',
            })
          )
        );
      }
    }

    // Notify listeners
    this.notifyListeners(workspaceId, data);

    return data;
  }

  async makeDecision(
    requestId: string,
    decision: 'approved' | 'rejected',
    comment?: string
  ): Promise<{ success: boolean; request?: ApprovalRequest; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get current request
    const request = await this.getApprovalRequest(requestId);
    if (!request) return { success: false, error: 'Request not found' };

    if (!['pending', 'in_review'].includes(request.status)) {
      return { success: false, error: 'Request is not awaiting approval' };
    }

    // Check if user can approve at current stage
    const template = request.workflow_template;
    if (!template?.stages) {
      return { success: false, error: 'No workflow template' };
    }

    const currentStage = template.stages[request.current_stage];
    if (!currentStage?.approvers.includes(user.id)) {
      return { success: false, error: 'You are not an approver for this stage' };
    }

    // Record decision
    const { error: decisionError } = await supabase
      .from('approval_decisions')
      .upsert({
        request_id: requestId,
        stage_index: request.current_stage,
        approver_id: user.id,
        decision,
        comment,
        decided_at: new Date().toISOString(),
      }, {
        onConflict: 'request_id,stage_index,approver_id',
      });

    if (decisionError) {
      console.error('Error recording decision:', decisionError);
      return { success: false, error: 'Failed to record decision' };
    }

    // Process the decision
    if (decision === 'rejected') {
      // Rejection ends the flow
      await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      const updated = await this.getApprovalRequest(requestId);
      this.notifyListeners(request.workspace_id, updated!);
      return { success: true, request: updated! };
    }

    // Check if all required approvals for current stage are complete
    const stageDecisions = await this.getStageDecisions(requestId, request.current_stage);
    const approvedCount = stageDecisions.filter(d => d.decision === 'approved').length;

    const allApproved = currentStage.require_all
      ? approvedCount === currentStage.approvers.length
      : approvedCount >= 1;

    if (allApproved) {
      // Move to next stage or complete
      const nextStage = request.current_stage + 1;

      if (nextStage >= template.stages.length) {
        // All stages complete - approved!
        await supabase
          .from('approval_requests')
          .update({
            status: 'approved',
            completed_at: new Date().toISOString(),
          })
          .eq('id', requestId);
      } else {
        // Move to next stage
        await supabase
          .from('approval_requests')
          .update({
            status: 'in_review',
            current_stage: nextStage,
          })
          .eq('id', requestId);

        // Create pending decisions for next stage
        const nextStageConfig = template.stages[nextStage];
        await Promise.all(
          nextStageConfig.approvers.map(approverId =>
            supabase.from('approval_decisions').insert({
              request_id: requestId,
              stage_index: nextStage,
              approver_id: approverId,
              decision: 'pending',
            })
          )
        );
      }
    }

    const updated = await this.getApprovalRequest(requestId);
    this.notifyListeners(request.workspace_id, updated!);
    return { success: true, request: updated! };
  }

  async cancelRequest(requestId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('approval_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('submitted_by', user.id); // Only submitter can cancel

    return !error;
  }

  private async getStageDecisions(requestId: string, stageIndex: number): Promise<ApprovalDecisionRecord[]> {
    const { data } = await supabase
      .from('approval_decisions')
      .select('*')
      .eq('request_id', requestId)
      .eq('stage_index', stageIndex);

    return data || [];
  }

  // ==========================================
  // COMMENTS
  // ==========================================

  async addComment(
    requestId: string,
    content: string,
    options?: {
      parent_id?: string;
      attachments?: { url: string; name: string; type: string }[];
      annotation_data?: ApprovalComment['annotation_data'];
    }
  ): Promise<ApprovalComment | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('approval_comments')
      .insert({
        request_id: requestId,
        user_id: user.id,
        parent_id: options?.parent_id,
        content,
        attachments: options?.attachments || [],
        annotation_data: options?.annotation_data,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }

    return data;
  }

  async getComments(requestId: string): Promise<ApprovalComment[]> {
    const { data, error } = await supabase
      .from('approval_comments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) return [];

    // Build tree structure
    const comments = data || [];
    const commentMap = new Map<string, ApprovalComment>();
    const rootComments: ApprovalComment[] = [];

    comments.forEach(c => commentMap.set(c.id, { ...c, replies: [] }));
    comments.forEach(c => {
      const comment = commentMap.get(c.id)!;
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id)!.replies!.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  async resolveComment(commentId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('approval_comments')
      .update({
        is_resolved: true,
        resolved_by: user.id,
      })
      .eq('id', commentId);

    return !error;
  }

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  subscribe(workspaceId: string, callback: (request: ApprovalRequest) => void): () => void {
    if (!this.listeners.has(workspaceId)) {
      this.listeners.set(workspaceId, new Set());
    }
    this.listeners.get(workspaceId)!.add(callback);

    return () => {
      this.listeners.get(workspaceId)?.delete(callback);
    };
  }

  private notifyListeners(workspaceId: string, request: ApprovalRequest) {
    this.listeners.get(workspaceId)?.forEach(callback => callback(request));
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  async getApprovalStats(workspaceId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    avgApprovalTime: number;
  }> {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('status, submitted_at, completed_at')
      .eq('workspace_id', workspaceId);

    if (error || !data) {
      return { total: 0, pending: 0, approved: 0, rejected: 0, avgApprovalTime: 0 };
    }

    const total = data.length;
    const pending = data.filter(r => ['pending', 'in_review'].includes(r.status)).length;
    const approved = data.filter(r => r.status === 'approved').length;
    const rejected = data.filter(r => r.status === 'rejected').length;

    const completedRequests = data.filter(r => r.completed_at && r.submitted_at);
    const totalTime = completedRequests.reduce((sum, r) => {
      const duration = new Date(r.completed_at!).getTime() - new Date(r.submitted_at!).getTime();
      return sum + duration;
    }, 0);
    const avgApprovalTime = completedRequests.length > 0
      ? totalTime / completedRequests.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    return { total, pending, approved, rejected, avgApprovalTime };
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
export default approvalWorkflowService;
