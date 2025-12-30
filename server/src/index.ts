/**
 * Lumina Studio API - Cloudflare Worker Entry Point
 *
 * This is the main entry point for the Lumina Studio backend API.
 * Built on Cloudflare Workers with D1, R2, and KV bindings.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { Webhook } from 'svix';
import Stripe from 'stripe';
import { Env, AIGenerationResponse } from './types/env';

// Create the main Hono app
const app = new Hono<{ Bindings: Env }>();

// ===========================================
// Global Middleware
// ===========================================

// Request logging
app.use('*', logger());

// Security headers
app.use('*', secureHeaders());

// Pretty JSON in development
app.use('*', prettyJSON());

// CORS configuration
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',') || [
    'https://app.lumina-os.com',
    'https://lumina-os.com',
    'http://localhost:5173', // Local dev
  ];

  return cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Request-ID',
    ],
    credentials: true,
    maxAge: 86400,
  })(c, next);
});

// Request ID middleware
app.use('*', async (c, next) => {
  const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
  c.header('X-Request-ID', requestId);
  await next();
});

// ===========================================
// Health & Status Endpoints
// ===========================================

app.get('/', (c) => {
  return c.json({
    name: 'Lumina Studio API',
    version: c.env.API_VERSION || '1.0.0',
    environment: c.env.ENVIRONMENT,
    status: 'operational',
  });
});

app.get('/health', async (c) => {
  // Check database connectivity
  let dbStatus = 'unknown';
  try {
    await c.env.DB.prepare('SELECT 1').first();
    dbStatus = 'healthy';
  } catch (e) {
    dbStatus = 'unhealthy';
  }

  return c.json({
    status: 'ok',
    version: c.env.API_VERSION || '1.0.0',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      storage: 'healthy', // R2 is always available when bound
      cache: 'healthy',   // KV is always available when bound
    },
  });
});

// ===========================================
// API Routes (v1)
// ===========================================

const v1 = new Hono<{ Bindings: Env }>();

// Clerk Webhook Handler (public endpoint)
v1.post('/auth/webhook', async (c) => {
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  // Verify webhook signature using svix
  const webhookSecret = c.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return c.json({ error: 'Webhook configuration error' }, 500);
  }

  const wh = new Webhook(webhookSecret);
  let payload: any;

  try {
    const body = await c.req.text();
    payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return c.json({ error: 'Invalid webhook signature' }, 401);
  }

  const { type, data } = payload;
  console.log(`Received Clerk webhook: ${type}`, data?.id);

  try {
    const now = Math.floor(Date.now() / 1000);

    switch (type) {
      case 'user.created': {
        // Extract user data from Clerk payload
        const userId = data.id;
        const email = data.email_addresses?.[0]?.email_address || '';
        const displayName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || null;
        const avatarUrl = data.image_url || null;

        // Create user record
        await c.env.DB.prepare(`
          INSERT INTO users (
            id, email, display_name, avatar_url, tier, subscription_status,
            theme_color, created_at, updated_at, last_login_at
          ) VALUES (?, ?, ?, ?, 'free', 'active', '#6366f1', ?, ?, ?)
        `).bind(userId, email, displayName, avatarUrl, now, now, now).run();

        // Create default workspace for the user
        const workspaceId = `ws_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
        const workspaceSlug = `personal-${userId.substring(5, 13)}`;

        await c.env.DB.prepare(`
          INSERT INTO workspaces (id, name, slug, owner_id, description, created_at, updated_at)
          VALUES (?, 'Personal Workspace', ?, ?, 'Your personal workspace for creative projects', ?, ?)
        `).bind(workspaceId, workspaceSlug, userId, now, now).run();

        // Add user as workspace owner
        const memberId = `wm_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
        await c.env.DB.prepare(`
          INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
          VALUES (?, ?, ?, 'owner', ?)
        `).bind(memberId, workspaceId, userId, now).run();

        // Update user's default workspace
        await c.env.DB.prepare(`
          UPDATE users SET default_workspace_id = ? WHERE id = ?
        `).bind(workspaceId, userId).run();

        console.log(`User created: ${email}, workspace: ${workspaceId}`);
        break;
      }

      case 'user.updated': {
        const userId = data.id;
        const email = data.email_addresses?.[0]?.email_address || '';
        const displayName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || null;
        const avatarUrl = data.image_url || null;

        // Update user record
        await c.env.DB.prepare(`
          UPDATE users
          SET email = ?, display_name = ?, avatar_url = ?, updated_at = ?
          WHERE id = ?
        `).bind(email, displayName, avatarUrl, now, userId).run();

        console.log(`User updated: ${userId}`);
        break;
      }

      case 'user.deleted': {
        const userId = data.id;

        // Delete in order respecting foreign key relationships
        // 1. Delete chat messages (via sessions)
        await c.env.DB.prepare(`
          DELETE FROM chat_messages WHERE session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = ?
          )
        `).bind(userId).run();

        // 2. Delete chat sessions
        await c.env.DB.prepare(`
          DELETE FROM chat_sessions WHERE user_id = ?
        `).bind(userId).run();

        // 3. Delete usage records
        await c.env.DB.prepare(`
          DELETE FROM usage_records WHERE user_id = ?
        `).bind(userId).run();

        // 4. Delete activity logs
        await c.env.DB.prepare(`
          DELETE FROM activity_log WHERE user_id = ?
        `).bind(userId).run();

        // 5. Delete workspace memberships
        await c.env.DB.prepare(`
          DELETE FROM workspace_members WHERE user_id = ?
        `).bind(userId).run();

        // 6. Get workspaces owned by user (to cascade delete related data)
        const ownedWorkspaces = await c.env.DB.prepare(`
          SELECT id FROM workspaces WHERE owner_id = ?
        `).bind(userId).all();

        for (const ws of ownedWorkspaces.results || []) {
          const wsId = ws.id as string;

          // Delete projects in workspace
          const projects = await c.env.DB.prepare(`
            SELECT id FROM projects WHERE workspace_id = ?
          `).bind(wsId).all();

          for (const proj of projects.results || []) {
            const projId = proj.id as string;
            // Delete storyboard shots
            await c.env.DB.prepare(`
              DELETE FROM storyboard_shots WHERE storyboard_id IN (
                SELECT id FROM storyboards WHERE project_id = ?
              )
            `).bind(projId).run();
            // Delete storyboards
            await c.env.DB.prepare(`
              DELETE FROM storyboards WHERE project_id = ?
            `).bind(projId).run();
            // Delete canvas projects
            await c.env.DB.prepare(`
              DELETE FROM canvas_projects WHERE project_id = ?
            `).bind(projId).run();
          }

          // Delete projects
          await c.env.DB.prepare(`
            DELETE FROM projects WHERE workspace_id = ?
          `).bind(wsId).run();

          // Delete campaign posts and campaigns
          await c.env.DB.prepare(`
            DELETE FROM campaign_posts WHERE campaign_id IN (
              SELECT id FROM campaigns WHERE workspace_id = ?
            )
          `).bind(wsId).run();
          await c.env.DB.prepare(`
            DELETE FROM campaigns WHERE workspace_id = ?
          `).bind(wsId).run();

          // Delete brand kits
          await c.env.DB.prepare(`
            DELETE FROM brand_kits WHERE workspace_id = ?
          `).bind(wsId).run();

          // Delete assets
          await c.env.DB.prepare(`
            DELETE FROM assets WHERE workspace_id = ?
          `).bind(wsId).run();

          // Delete workspace members
          await c.env.DB.prepare(`
            DELETE FROM workspace_members WHERE workspace_id = ?
          `).bind(wsId).run();
        }

        // 7. Delete owned workspaces
        await c.env.DB.prepare(`
          DELETE FROM workspaces WHERE owner_id = ?
        `).bind(userId).run();

        // 8. Finally delete the user
        await c.env.DB.prepare(`
          DELETE FROM users WHERE id = ?
        `).bind(userId).run();

        console.log(`User deleted with cascade: ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Auth middleware for protected routes
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Decode JWT payload (base64url) to extract user ID
    // Clerk JWTs have the user ID in the 'sub' claim
    const parts = token.split('.');
    if (parts.length !== 3) {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    if (!payload.sub) {
      return c.json({ error: 'Invalid token: missing user ID' }, 401);
    }

    // Verify token hasn't expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return c.json({ error: 'Token expired' }, 401);
    }

    // Set user context
    c.set('userId', payload.sub);
    c.set('sessionId', payload.sid || 'unknown');

    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Protected routes
v1.use('/me/*', authMiddleware);
v1.use('/workspaces/*', authMiddleware);
v1.use('/projects/*', authMiddleware);
v1.use('/assets/*', authMiddleware);
v1.use('/ai/*', authMiddleware);
v1.use('/brand-kits/*', authMiddleware);
v1.use('/campaigns/*', authMiddleware);
v1.use('/chat/*', authMiddleware);
v1.use('/exports/*', authMiddleware);

// ===========================================
// Quota Helper Functions
// ===========================================

interface QuotaCheckResult {
  allowed: boolean;
  tier: string;
  used: number;
  limit: number;
  remaining: number;
  overageAllowed: boolean;
}

async function checkQuota(
  db: D1Database,
  userId: string,
  usageType: string
): Promise<QuotaCheckResult> {
  const billingPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

  // Get user tier
  const user = await db.prepare(
    'SELECT tier FROM users WHERE id = ?'
  ).bind(userId).first();

  const tier = (user?.tier as string) || 'free';

  // Get quota limits for this tier and usage type
  const quota = await db.prepare(
    'SELECT monthly_limit, overage_allowed FROM tier_quotas WHERE tier = ? AND usage_type = ?'
  ).bind(tier, usageType).first();

  // Default limits if no quota record exists
  const monthlyLimit = (quota?.monthly_limit as number) ?? 10;
  const overageAllowed = (quota?.overage_allowed as number) === 1;

  // Get current usage for this billing period
  const usage = await db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM usage_records
    WHERE user_id = ? AND usage_type = ? AND billing_period = ?
  `).bind(userId, usageType, billingPeriod).first();

  const used = (usage?.total as number) || 0;

  // Check if unlimited (-1 means unlimited)
  if (monthlyLimit === -1) {
    return {
      allowed: true,
      tier,
      used,
      limit: -1,
      remaining: -1,
      overageAllowed: true,
    };
  }

  const remaining = Math.max(0, monthlyLimit - used);
  const allowed = remaining > 0 || overageAllowed;

  return {
    allowed,
    tier,
    used,
    limit: monthlyLimit,
    remaining,
    overageAllowed,
  };
}

async function recordUsage(
  db: D1Database,
  userId: string,
  usageType: string,
  quantity: number = 1,
  metadata: { workspaceId?: string; projectId?: string; assetId?: string; modelUsed?: string } = {}
): Promise<void> {
  const billingPeriod = new Date().toISOString().substring(0, 7);
  const now = Math.floor(Date.now() / 1000);
  const usageId = `usage_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

  await db.prepare(`
    INSERT INTO usage_records (
      id, user_id, workspace_id, usage_type, quantity,
      model_used, project_id, asset_id, billing_period, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    usageId,
    userId,
    metadata.workspaceId || null,
    usageType,
    quantity,
    metadata.modelUsed || null,
    metadata.projectId || null,
    metadata.assetId || null,
    billingPeriod,
    now
  ).run();
}

// Current user endpoint
v1.get('/auth/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

// Quota endpoint
v1.get('/auth/quota', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const user = await c.env.DB.prepare(
    'SELECT tier FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const tier = user.tier as string || 'free';
  const billingPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

  // Get tier quotas
  const quotas = await c.env.DB.prepare(
    'SELECT * FROM tier_quotas WHERE tier = ?'
  ).bind(tier).all();

  // Get current usage
  const usage = await c.env.DB.prepare(`
    SELECT usage_type, SUM(quantity) as total
    FROM usage_records
    WHERE user_id = ? AND billing_period = ?
    GROUP BY usage_type
  `).bind(userId, billingPeriod).all();

  const usageMap: Record<string, number> = {};
  for (const record of usage.results || []) {
    usageMap[record.usage_type as string] = record.total as number;
  }

  const quotaStatus: Record<string, any> = {};
  for (const quota of quotas.results || []) {
    const used = usageMap[quota.usage_type as string] || 0;
    const limit = quota.monthly_limit as number;

    quotaStatus[quota.usage_type as string] = {
      used,
      limit: limit === -1 ? 'unlimited' : limit,
      remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - used),
      overage_allowed: quota.overage_allowed === 1,
    };
  }

  return c.json({
    tier,
    billing_period: billingPeriod,
    subscription_status: 'active',
    usage: quotaStatus,
  });
});

// ===========================================
// Placeholder Route Groups
// ===========================================

// Workspaces
v1.get('/workspaces', async (c) => {
  const userId = c.get('userId');

  const workspaces = await c.env.DB.prepare(`
    SELECT w.* FROM workspaces w
    INNER JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = ?
    ORDER BY w.updated_at DESC
  `).bind(userId).all();

  return c.json({ data: workspaces.results || [] });
});

v1.post('/workspaces', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const workspaceId = `ws_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
  const slug = body.slug || `workspace-${workspaceId.substring(3, 11)}`;

  await c.env.DB.prepare(`
    INSERT INTO workspaces (id, name, slug, owner_id, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
  `).bind(workspaceId, body.name, slug, userId, body.description || null).run();

  // Add creator as owner
  await c.env.DB.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
    VALUES (?, ?, ?, 'owner', strftime('%s', 'now'))
  `).bind(`wm_${crypto.randomUUID().substring(0, 16)}`, workspaceId, userId).run();

  const workspace = await c.env.DB.prepare(
    'SELECT * FROM workspaces WHERE id = ?'
  ).bind(workspaceId).first();

  return c.json(workspace, 201);
});

// Projects
v1.get('/workspaces/:wsId/projects', async (c) => {
  const { wsId } = c.req.param();

  const projects = await c.env.DB.prepare(`
    SELECT * FROM projects
    WHERE workspace_id = ?
    ORDER BY updated_at DESC
  `).bind(wsId).all();

  return c.json({ data: projects.results || [] });
});

v1.post('/workspaces/:wsId/projects', async (c) => {
  const { wsId } = c.req.param();
  const userId = c.get('userId');
  const body = await c.req.json();

  const projectId = `prj_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

  await c.env.DB.prepare(`
    INSERT INTO projects (id, workspace_id, owner_id, name, description, project_type, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', strftime('%s', 'now'), strftime('%s', 'now'))
  `).bind(projectId, wsId, userId, body.name, body.description || null, body.project_type).run();

  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(projectId).first();

  return c.json(project, 201);
});

// ===========================================
// AI Generation Endpoints
// ===========================================

// AI Image Generation
v1.post('/ai/generate/image', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const startTime = Date.now();

  // Validate request
  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return c.json({ error: 'Prompt is required' }, 400);
  }

  // Check quota before processing
  const quotaCheck = await checkQuota(c.env.DB, userId, 'ai_image_generation');

  if (!quotaCheck.allowed) {
    return c.json({
      error: 'Quota exceeded',
      message: `You have used ${quotaCheck.used} of ${quotaCheck.limit} image generations this month.`,
      usage: {
        type: 'ai_image_generation',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: 0,
      },
    }, 429);
  }

  const generationId = `gen_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

  try {
    // Call Cloudflare Workers AI for image generation
    // Using stable-diffusion-xl-base-1.0 model
    const aiResponse = await c.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt: body.prompt,
      num_steps: body.quality === 'hd' ? 30 : body.quality === 'ultra' ? 50 : 20,
    });

    // Store generated image in R2 if bucket is available
    let assetId: string | null = null;
    let cdnUrl: string | null = null;

    if (c.env.ASSETS_BUCKET && aiResponse) {
      assetId = `asset_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
      const storageKey = `generated/${userId}/${assetId}.png`;

      // Store image in R2
      await c.env.ASSETS_BUCKET.put(storageKey, aiResponse, {
        httpMetadata: {
          contentType: 'image/png',
        },
        customMetadata: {
          userId,
          prompt: body.prompt.substring(0, 500),
          generationId,
        },
      });

      // Create asset record in database
      const now = Math.floor(Date.now() / 1000);
      await c.env.DB.prepare(`
        INSERT INTO assets (
          id, workspace_id, uploaded_by, filename, original_filename,
          mime_type, file_size, asset_type, storage_key, processing_status,
          is_ai_generated, generation_prompt, generation_model,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'image/png', 0, 'image', ?, 'completed', 1, ?, 'stable-diffusion-xl-base-1.0', ?, ?)
      `).bind(
        assetId,
        body.workspace_id || null,
        userId,
        `generated-${assetId}.png`,
        `generated-image.png`,
        storageKey,
        body.prompt.substring(0, 1000),
        now,
        now
      ).run();

      cdnUrl = `/assets/${assetId}`;
    }

    // Record usage after successful generation
    await recordUsage(c.env.DB, userId, 'ai_image_generation', 1, {
      workspaceId: body.workspace_id,
      projectId: body.project_id,
      assetId: assetId || undefined,
      modelUsed: 'stable-diffusion-xl-base-1.0',
    });

    const generationTime = Date.now() - startTime;
    const newRemaining = quotaCheck.limit === -1 ? -1 : Math.max(0, quotaCheck.remaining - 1);

    const response: AIGenerationResponse = {
      id: generationId,
      status: 'completed',
      asset: assetId ? {
        id: assetId,
        workspace_id: body.workspace_id || '',
        uploaded_by: userId,
        filename: `generated-${assetId}.png`,
        original_filename: 'generated-image.png',
        mime_type: 'image/png',
        file_size: 0,
        asset_type: 'image',
        storage_key: `generated/${userId}/${assetId}.png`,
        cdn_url: cdnUrl,
        processing_status: 'completed',
        is_ai_generated: 1,
        generation_prompt: body.prompt,
        generation_model: 'stable-diffusion-xl-base-1.0',
        width: 1024,
        height: 1024,
        duration_seconds: null,
        tags_json: null,
        description: null,
        alt_text: body.prompt.substring(0, 255),
        dominant_colors_json: null,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      } : undefined,
      usage: {
        type: 'ai_image_generation',
        remaining: newRemaining,
        limit: quotaCheck.limit,
      },
      generation_time_ms: generationTime,
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Image generation error:', error);
    return c.json({
      id: generationId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Image generation failed',
      usage: {
        type: 'ai_image_generation',
        remaining: quotaCheck.remaining,
        limit: quotaCheck.limit,
      },
    }, 500);
  }
});

// AI Video Generation
v1.post('/ai/generate/video', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  // Validate request
  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return c.json({ error: 'Prompt is required' }, 400);
  }

  // Check quota before processing
  const quotaCheck = await checkQuota(c.env.DB, userId, 'ai_video_generation');

  if (!quotaCheck.allowed) {
    return c.json({
      error: 'Quota exceeded',
      message: `You have used ${quotaCheck.used} of ${quotaCheck.limit} video generations this month.`,
      usage: {
        type: 'ai_video_generation',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: 0,
      },
    }, 429);
  }

  const generationId = `gen_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

  try {
    // Video generation is async - we queue the job and return immediately
    // In production, this would trigger a Cloudflare Queue or Durable Object for processing

    // For now, record the pending generation
    const now = Math.floor(Date.now() / 1000);
    const assetId = `asset_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

    // Create a pending asset record
    await c.env.DB.prepare(`
      INSERT INTO assets (
        id, workspace_id, uploaded_by, filename, original_filename,
        mime_type, file_size, asset_type, storage_key, processing_status,
        is_ai_generated, generation_prompt, generation_model,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'video/mp4', 0, 'video', ?, 'processing', 1, ?, 'video-generation-model', ?, ?)
    `).bind(
      assetId,
      body.workspace_id || null,
      userId,
      `generated-${assetId}.mp4`,
      'generated-video.mp4',
      `generated/${userId}/${assetId}.mp4`,
      body.prompt.substring(0, 1000),
      now,
      now
    ).run();

    // Record usage (counting it when queued)
    await recordUsage(c.env.DB, userId, 'ai_video_generation', 1, {
      workspaceId: body.workspace_id,
      projectId: body.project_id,
      assetId,
      modelUsed: 'video-generation-model',
    });

    const newRemaining = quotaCheck.limit === -1 ? -1 : Math.max(0, quotaCheck.remaining - 1);

    const response: AIGenerationResponse = {
      id: generationId,
      status: 'processing',
      asset: {
        id: assetId,
        workspace_id: body.workspace_id || '',
        uploaded_by: userId,
        filename: `generated-${assetId}.mp4`,
        original_filename: 'generated-video.mp4',
        mime_type: 'video/mp4',
        file_size: 0,
        asset_type: 'video',
        storage_key: `generated/${userId}/${assetId}.mp4`,
        cdn_url: null,
        processing_status: 'processing',
        is_ai_generated: 1,
        generation_prompt: body.prompt,
        generation_model: 'video-generation-model',
        width: 1920,
        height: 1080,
        duration_seconds: body.duration || 5,
        tags_json: null,
        description: null,
        alt_text: body.prompt.substring(0, 255),
        dominant_colors_json: null,
        created_at: now,
        updated_at: now,
      },
      usage: {
        type: 'ai_video_generation',
        remaining: newRemaining,
        limit: quotaCheck.limit,
      },
    };

    return c.json(response, 202);
  } catch (error) {
    console.error('Video generation error:', error);
    return c.json({
      id: generationId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Video generation failed',
      usage: {
        type: 'ai_video_generation',
        remaining: quotaCheck.remaining,
        limit: quotaCheck.limit,
      },
    }, 500);
  }
});

// AI Text Generation
v1.post('/ai/generate/text', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const startTime = Date.now();

  // Validate request
  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return c.json({ error: 'Prompt is required' }, 400);
  }

  // Check quota before processing
  const quotaCheck = await checkQuota(c.env.DB, userId, 'ai_text_generation');

  if (!quotaCheck.allowed) {
    return c.json({
      error: 'Quota exceeded',
      message: `You have used ${quotaCheck.used} of ${quotaCheck.limit} text generations this month.`,
      usage: {
        type: 'ai_text_generation',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: 0,
      },
    }, 429);
  }

  const generationId = `gen_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

  try {
    // Build system prompt based on context
    let systemPrompt = 'You are a helpful creative assistant for Lumina Studio, a creative design and content platform.';

    if (body.context === 'brand') {
      systemPrompt = 'You are a brand strategist helping create compelling brand messaging, taglines, and content that aligns with brand guidelines.';
    } else if (body.context === 'campaign') {
      systemPrompt = 'You are a marketing expert helping create engaging social media posts, ad copy, and campaign content.';
    } else if (body.context === 'design') {
      systemPrompt = 'You are a creative director helping brainstorm design concepts, image descriptions, and visual ideas.';
    }

    // Call Cloudflare Workers AI for text generation
    // Using Meta Llama 3.1 8B Instruct model
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.prompt },
      ],
      max_tokens: body.max_tokens || 1024,
      temperature: body.temperature || 0.7,
    });

    const generatedText = typeof aiResponse === 'object' && 'response' in aiResponse
      ? (aiResponse as { response: string }).response
      : String(aiResponse);

    // Record usage after successful generation
    await recordUsage(c.env.DB, userId, 'ai_text_generation', 1, {
      workspaceId: body.workspace_id,
      projectId: body.project_id,
      modelUsed: 'llama-3.1-8b-instruct',
    });

    const generationTime = Date.now() - startTime;
    const newRemaining = quotaCheck.limit === -1 ? -1 : Math.max(0, quotaCheck.remaining - 1);

    return c.json({
      id: generationId,
      status: 'completed',
      result: generatedText,
      prompt: body.prompt,
      context: body.context || 'general',
      model: 'llama-3.1-8b-instruct',
      usage: {
        type: 'ai_text_generation',
        remaining: newRemaining,
        limit: quotaCheck.limit,
      },
      generation_time_ms: generationTime,
    });
  } catch (error) {
    console.error('Text generation error:', error);
    return c.json({
      id: generationId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Text generation failed',
      usage: {
        type: 'ai_text_generation',
        remaining: quotaCheck.remaining,
        limit: quotaCheck.limit,
      },
    }, 500);
  }
});

// ===========================================
// Usage Tracking Endpoints
// ===========================================

// Sync usage from client (fire and forget from frontend)
v1.post('/usage/sync', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const { month, images, videos, text } = body;

  if (!month) {
    return c.json({ error: 'Missing month parameter' }, 400);
  }

  // Validate month format (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: 'Invalid month format. Use YYYY-MM' }, 400);
  }

  try {
    // Get existing usage for this month
    const existing = await c.env.DB.prepare(`
      SELECT usage_type, SUM(quantity) as total
      FROM usage_records
      WHERE user_id = ? AND billing_period = ?
      GROUP BY usage_type
    `).bind(userId, month).all();

    const existingMap: Record<string, number> = {};
    for (const record of existing.results || []) {
      existingMap[record.usage_type as string] = record.total as number;
    }

    // Calculate deltas (client might be ahead of server)
    const imageDelta = Math.max(0, (images || 0) - (existingMap['ai_image_generation'] || 0));
    const videoDelta = Math.max(0, (videos || 0) - (existingMap['ai_video_generation'] || 0));
    const textDelta = Math.max(0, (text || 0) - (existingMap['ai_text_generation'] || 0));

    // Insert new usage records if there are deltas
    const now = Math.floor(Date.now() / 1000);

    if (imageDelta > 0) {
      await c.env.DB.prepare(`
        INSERT INTO usage_records (id, user_id, usage_type, quantity, billing_period, created_at)
        VALUES (?, ?, 'ai_image_generation', ?, ?, ?)
      `).bind(`usage_${crypto.randomUUID().substring(0, 16)}`, userId, imageDelta, month, now).run();
    }

    if (videoDelta > 0) {
      await c.env.DB.prepare(`
        INSERT INTO usage_records (id, user_id, usage_type, quantity, billing_period, created_at)
        VALUES (?, ?, 'ai_video_generation', ?, ?, ?)
      `).bind(`usage_${crypto.randomUUID().substring(0, 16)}`, userId, videoDelta, month, now).run();
    }

    if (textDelta > 0) {
      await c.env.DB.prepare(`
        INSERT INTO usage_records (id, user_id, usage_type, quantity, billing_period, created_at)
        VALUES (?, ?, 'ai_text_generation', ?, ?, ?)
      `).bind(`usage_${crypto.randomUUID().substring(0, 16)}`, userId, textDelta, month, now).run();
    }

    return c.json({
      synced: true,
      month,
      deltas: { images: imageDelta, videos: videoDelta, text: textDelta },
    });
  } catch (error) {
    console.error('Usage sync error:', error);
    return c.json({ error: 'Failed to sync usage' }, 500);
  }
});

// Get current month's usage
v1.get('/usage/current', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  try {
    // Get user's tier
    const user = await c.env.DB.prepare(
      'SELECT tier FROM users WHERE id = ?'
    ).bind(userId).first();

    const tier = (user?.tier as string) || 'free';

    // Get usage for current month
    const usage = await c.env.DB.prepare(`
      SELECT usage_type, SUM(quantity) as total
      FROM usage_records
      WHERE user_id = ? AND billing_period = ?
      GROUP BY usage_type
    `).bind(userId, currentMonth).all();

    const usageMap: Record<string, number> = {
      images: 0,
      videos: 0,
      text: 0,
    };

    for (const record of usage.results || []) {
      const type = record.usage_type as string;
      if (type === 'ai_image_generation') usageMap.images = record.total as number;
      if (type === 'ai_video_generation') usageMap.videos = record.total as number;
      if (type === 'ai_text_generation') usageMap.text = record.total as number;
    }

    return c.json({
      month: currentMonth,
      tier,
      images: usageMap.images,
      videos: usageMap.videos,
      text: usageMap.text,
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return c.json({ error: 'Failed to get usage' }, 500);
  }
});

// Protect usage routes
v1.use('/usage/*', authMiddleware);

// ===========================================
// Stripe Payment Endpoints
// ===========================================

// Price IDs mapped to plan names (configure these in Stripe Dashboard)
const STRIPE_PRICE_MAP: Record<string, { plan: string; interval: string }> = {
  // These will be set dynamically from client request
};

// Plan to tier mapping
const PLAN_TO_TIER: Record<string, string> = {
  starter: 'starter',
  pro: 'pro',
  team: 'team',
};

// Create Stripe checkout session (public - handles its own auth)
v1.post('/stripe/create-checkout-session', async (c) => {
  const body = await c.req.json();
  const { priceId, planName, interval, userEmail, userId, successUrl, cancelUrl } = body;

  if (!priceId || !successUrl || !cancelUrl) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    // Build checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planName: planName || '',
        interval: interval || '',
        userId: userId || '',
      },
      subscription_data: {
        metadata: {
          planName: planName || '',
          userId: userId || '',
        },
      },
    };

    // Add customer email if provided
    if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    // If we have a userId, try to find existing Stripe customer
    if (userId) {
      const user = await c.env.DB.prepare(
        'SELECT stripe_customer_id FROM users WHERE id = ?'
      ).bind(userId).first();

      if (user?.stripe_customer_id) {
        sessionParams.customer = user.stripe_customer_id as string;
        delete sessionParams.customer_email; // Can't use both
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return c.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return c.json({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Create Stripe billing portal session (requires auth)
v1.post('/stripe/create-portal-session', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { returnUrl } = body;

  if (!returnUrl) {
    return c.json({ error: 'Missing returnUrl' }, 400);
  }

  try {
    // Get user's Stripe customer ID
    const user = await c.env.DB.prepare(
      'SELECT stripe_customer_id FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user?.stripe_customer_id) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id as string,
      return_url: returnUrl,
    });

    return c.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return c.json({
      error: 'Failed to create portal session',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get subscription status (requires auth)
v1.get('/stripe/subscription-status', authMiddleware, async (c) => {
  const userId = c.get('userId');

  try {
    const user = await c.env.DB.prepare(
      'SELECT tier, subscription_status, subscription_id, subscription_expires_at, stripe_customer_id FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // If no Stripe customer, return free tier
    if (!user.stripe_customer_id || !user.subscription_id) {
      return c.json({
        active: false,
        plan: 'free',
        interval: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }

    // Fetch fresh subscription data from Stripe
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    try {
      const subscription = await stripe.subscriptions.retrieve(user.subscription_id as string);

      return c.json({
        active: subscription.status === 'active' || subscription.status === 'trialing',
        plan: user.tier || 'free',
        interval: subscription.items.data[0]?.price?.recurring?.interval || null,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    } catch (stripeError) {
      // Subscription not found in Stripe, return DB state
      return c.json({
        active: user.subscription_status === 'active',
        plan: user.tier || 'free',
        interval: null,
        currentPeriodEnd: user.subscription_expires_at
          ? new Date((user.subscription_expires_at as number) * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: false,
      });
    }
  } catch (error) {
    console.error('Subscription status error:', error);
    return c.json({ error: 'Failed to get subscription status' }, 500);
  }
});

// Stripe webhook handler (public endpoint, verifies signature)
v1.post('/stripe/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return c.json({ error: 'Webhook configuration error' }, 500);
  }

  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    const body = await c.req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Stripe webhook received: ${event.type}`);

    const now = Math.floor(Date.now() / 1000);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName;

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const tier = PLAN_TO_TIER[planName || ''] || 'pro';

          // Update user with Stripe customer ID and subscription
          await c.env.DB.prepare(`
            UPDATE users SET
              stripe_customer_id = ?,
              subscription_id = ?,
              tier = ?,
              subscription_status = 'active',
              subscription_expires_at = ?,
              updated_at = ?
            WHERE id = ?
          `).bind(
            customerId,
            subscriptionId,
            tier,
            subscription.current_period_end,
            now,
            userId
          ).run();

          console.log(`User ${userId} subscribed to ${tier} plan`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const user = await c.env.DB.prepare(
          'SELECT id FROM users WHERE stripe_customer_id = ?'
        ).bind(customerId).first();

        if (user) {
          const status = subscription.status === 'active' || subscription.status === 'trialing'
            ? 'active'
            : subscription.status === 'past_due'
              ? 'past_due'
              : 'cancelled';

          await c.env.DB.prepare(`
            UPDATE users SET
              subscription_status = ?,
              subscription_expires_at = ?,
              updated_at = ?
            WHERE id = ?
          `).bind(
            status,
            subscription.current_period_end,
            now,
            user.id
          ).run();

          console.log(`Subscription updated for user ${user.id}: ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const user = await c.env.DB.prepare(
          'SELECT id FROM users WHERE stripe_customer_id = ?'
        ).bind(customerId).first();

        if (user) {
          // Downgrade to free tier
          await c.env.DB.prepare(`
            UPDATE users SET
              tier = 'free',
              subscription_status = 'cancelled',
              subscription_id = NULL,
              subscription_expires_at = NULL,
              updated_at = ?
            WHERE id = ?
          `).bind(now, user.id).run();

          console.log(`Subscription cancelled for user ${user.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const user = await c.env.DB.prepare(
          'SELECT id FROM users WHERE stripe_customer_id = ?'
        ).bind(customerId).first();

        if (user) {
          await c.env.DB.prepare(`
            UPDATE users SET
              subscription_status = 'past_due',
              updated_at = ?
            WHERE id = ?
          `).bind(now, user.id).run();

          console.log(`Payment failed for user ${user.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return c.json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 400);
  }
});

// Mount v1 routes
app.route('/v1', v1);

// ===========================================
// Error Handler
// ===========================================

app.onError((err, c) => {
  console.error('Unhandled error:', err);

  const status = err instanceof Error && 'status' in err
    ? (err as any).status
    : 500;

  return c.json({
    error: 'Internal server error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : undefined,
    requestId: c.res.headers.get('X-Request-ID'),
  }, status);
});

// ===========================================
// 404 Handler
// ===========================================

app.notFound((c) => {
  return c.json({
    error: 'Not found',
    path: c.req.path,
    method: c.req.method,
  }, 404);
});

export default app;
