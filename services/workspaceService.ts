// Workspace Service - Team spaces with shared assets and permissions
import { supabase } from '../lib/supabase';

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type MemberStatus = 'pending' | 'active' | 'suspended';

export interface WorkspacePermissions {
  can_edit: boolean;
  can_delete: boolean;
  can_invite: boolean;
  can_approve: boolean;
  can_publish: boolean;
  can_manage_brand: boolean;
  can_view_analytics: boolean;
}

export interface WorkspaceSettings {
  default_role: WorkspaceRole;
  allow_public_sharing: boolean;
  require_approval: boolean;
  storage_limit_mb: number;
  max_members: number;
}

export interface WorkspaceFeatures {
  brand_kit: boolean;
  templates: boolean;
  comments: boolean;
  version_history: boolean;
  analytics: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  owner_id: string;
  organization_id?: string;
  logo_url?: string;
  cover_image_url?: string;
  settings: WorkspaceSettings;
  features: WorkspaceFeatures;
  billing_status: string;
  storage_used_mb: number;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  permissions: WorkspacePermissions;
  invited_by?: string;
  invited_at: Date;
  joined_at?: Date;
  status: MemberStatus;
  user?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  permissions?: Partial<WorkspacePermissions>;
  token: string;
  invited_by: string;
  expires_at: Date;
  accepted_at?: Date;
}

export interface WorkspaceFolder {
  id: string;
  workspace_id: string;
  parent_id?: string;
  name: string;
  color?: string;
  icon?: string;
  sort_order: number;
  created_by: string;
  children?: WorkspaceFolder[];
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  logo_url?: string;
  settings?: Partial<WorkspaceSettings>;
  features?: Partial<WorkspaceFeatures>;
}

export interface InviteMemberInput {
  email: string;
  role: WorkspaceRole;
  permissions?: Partial<WorkspacePermissions>;
  message?: string;
}

const DEFAULT_PERMISSIONS: Record<WorkspaceRole, WorkspacePermissions> = {
  owner: {
    can_edit: true,
    can_delete: true,
    can_invite: true,
    can_approve: true,
    can_publish: true,
    can_manage_brand: true,
    can_view_analytics: true,
  },
  admin: {
    can_edit: true,
    can_delete: true,
    can_invite: true,
    can_approve: true,
    can_publish: true,
    can_manage_brand: true,
    can_view_analytics: true,
  },
  editor: {
    can_edit: true,
    can_delete: false,
    can_invite: false,
    can_approve: false,
    can_publish: true,
    can_manage_brand: false,
    can_view_analytics: false,
  },
  viewer: {
    can_edit: false,
    can_delete: false,
    can_invite: false,
    can_approve: false,
    can_publish: false,
    can_manage_brand: false,
    can_view_analytics: false,
  },
};

class WorkspaceService {
  private currentWorkspace: Workspace | null = null;
  private workspaceCache: Map<string, Workspace> = new Map();

  // Generate URL-friendly slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
  }

  // Get current user's workspaces
  async getMyWorkspaces(): Promise<Workspace[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members!inner(user_id, role, status)
      `)
      .eq('workspace_members.user_id', user.id)
      .eq('workspace_members.status', 'active')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }

    return data || [];
  }

  // Get workspace by ID
  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    if (this.workspaceCache.has(workspaceId)) {
      return this.workspaceCache.get(workspaceId)!;
    }

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error || !data) {
      console.error('Error fetching workspace:', error);
      return null;
    }

    this.workspaceCache.set(workspaceId, data);
    return data;
  }

  // Get workspace by slug
  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return data;
  }

  // Create new workspace
  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const slug = this.generateSlug(input.name);

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        name: input.name,
        slug,
        description: input.description,
        owner_id: user.id,
        logo_url: input.logo_url,
        settings: {
          default_role: 'viewer',
          allow_public_sharing: false,
          require_approval: false,
          storage_limit_mb: 5000,
          max_members: 50,
          ...input.settings,
        },
        features: {
          brand_kit: true,
          templates: true,
          comments: true,
          version_history: true,
          analytics: false,
          ...input.features,
        },
      })
      .select()
      .single();

    if (error || !workspace) {
      console.error('Error creating workspace:', error);
      return null;
    }

    // Add creator as owner member
    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
      permissions: DEFAULT_PERMISSIONS.owner,
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    return workspace;
  }

  // Update workspace
  async updateWorkspace(
    workspaceId: string,
    updates: Partial<Omit<Workspace, 'id' | 'created_at' | 'owner_id'>>
  ): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workspace:', error);
      return null;
    }

    this.workspaceCache.set(workspaceId, data);
    return data;
  }

  // Delete workspace
  async deleteWorkspace(workspaceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) {
      console.error('Error deleting workspace:', error);
      return false;
    }

    this.workspaceCache.delete(workspaceId);
    return true;
  }

  // Get workspace members
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        *,
        user:user_id (
          email,
          raw_user_meta_data
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('role', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }

    return (data || []).map(member => ({
      ...member,
      user: member.user ? {
        email: member.user.email,
        full_name: member.user.raw_user_meta_data?.full_name,
        avatar_url: member.user.raw_user_meta_data?.avatar_url,
      } : undefined,
    }));
  }

  // Invite member
  async inviteMember(workspaceId: string, input: InviteMemberInput): Promise<WorkspaceInvitation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Generate unique token
    const token = crypto.randomUUID() + '-' + Date.now().toString(36);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const permissions = {
      ...DEFAULT_PERMISSIONS[input.role],
      ...input.permissions,
    };

    const { data, error } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id: workspaceId,
        email: input.email.toLowerCase(),
        role: input.role,
        permissions,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return null;
    }

    // TODO: Send invitation email
    console.log(`Invitation created for ${input.email} with token: ${token}`);

    return data;
  }

  // Accept invitation
  async acceptInvitation(token: string): Promise<{ success: boolean; workspace?: Workspace }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .single();

    if (invError || !invitation) {
      return { success: false };
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false };
    }

    // Check email matches
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      return { success: false };
    }

    // Add as member
    const { error: memberError } = await supabase.from('workspace_members').insert({
      workspace_id: invitation.workspace_id,
      user_id: user.id,
      role: invitation.role,
      permissions: invitation.permissions || DEFAULT_PERMISSIONS[invitation.role as WorkspaceRole],
      invited_by: invitation.invited_by,
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    if (memberError) {
      console.error('Error adding member:', memberError);
      return { success: false };
    }

    // Mark invitation as accepted
    await supabase
      .from('workspace_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    const workspace = await this.getWorkspace(invitation.workspace_id);
    return { success: true, workspace: workspace || undefined };
  }

  // Update member role
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    customPermissions?: Partial<WorkspacePermissions>
  ): Promise<boolean> {
    const permissions = {
      ...DEFAULT_PERMISSIONS[role],
      ...customPermissions,
    };

    const { error } = await supabase
      .from('workspace_members')
      .update({ role, permissions })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    return !error;
  }

  // Remove member
  async removeMember(workspaceId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    return !error;
  }

  // Check permission
  async hasPermission(workspaceId: string, permission: keyof WorkspacePermissions): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) return false;

    // Owners and admins have all permissions
    if (data.role === 'owner' || data.role === 'admin') return true;

    return data.permissions?.[permission] ?? false;
  }

  // Get my role in workspace
  async getMyRole(workspaceId: string): Promise<WorkspaceRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    return data?.role || null;
  }

  // Folder management
  async createFolder(workspaceId: string, name: string, parentId?: string): Promise<WorkspaceFolder | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('workspace_folders')
      .insert({
        workspace_id: workspaceId,
        parent_id: parentId,
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      return null;
    }

    return data;
  }

  async getFolders(workspaceId: string): Promise<WorkspaceFolder[]> {
    const { data, error } = await supabase
      .from('workspace_folders')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true });

    if (error) return [];

    // Build tree structure
    const folders = data || [];
    const folderMap = new Map<string, WorkspaceFolder>();
    const rootFolders: WorkspaceFolder[] = [];

    folders.forEach(f => folderMap.set(f.id, { ...f, children: [] }));
    folders.forEach(f => {
      const folder = folderMap.get(f.id)!;
      if (f.parent_id && folderMap.has(f.parent_id)) {
        folderMap.get(f.parent_id)!.children!.push(folder);
      } else {
        rootFolders.push(folder);
      }
    });

    return rootFolders;
  }

  // Add project to workspace
  async addProject(workspaceId: string, projectId: string, folderId?: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from('workspace_projects').insert({
      workspace_id: workspaceId,
      project_id: projectId,
      folder_id: folderId,
      added_by: user.id,
    });

    return !error;
  }

  // Get workspace projects
  async getProjects(workspaceId: string, folderId?: string): Promise<string[]> {
    let query = supabase
      .from('workspace_projects')
      .select('project_id')
      .eq('workspace_id', workspaceId);

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) return [];

    return (data || []).map(p => p.project_id);
  }

  // Set current workspace context
  setCurrentWorkspace(workspace: Workspace | null) {
    this.currentWorkspace = workspace;
  }

  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }
}

export const workspaceService = new WorkspaceService();
export default workspaceService;
