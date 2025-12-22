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
import { Env } from './types/env';

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
  // TODO: Implement Clerk webhook verification and handling
  // See BACKEND_ARCHITECTURE.md for implementation details

  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  // Webhook signature verification would go here
  // Using svix library: npm install svix

  try {
    const payload = await c.req.json();
    const { type, data } = payload;

    console.log(`Received Clerk webhook: ${type}`);

    switch (type) {
      case 'user.created':
        // Create user and default workspace
        break;
      case 'user.updated':
        // Update user record
        break;
      case 'user.deleted':
        // Delete user and cascade
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
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

  // TODO: Implement Clerk JWT verification
  // For now, we'll extract the user ID from the token (placeholder)
  // In production, use @clerk/backend to verify the token

  try {
    // Placeholder: In production, verify with Clerk
    // const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
    // const payload = await clerk.verifyToken(token);
    // c.set('userId', payload.sub);
    // c.set('sessionId', payload.sid);

    // For development, we'll accept any token and extract user ID
    c.set('userId', 'user_development');
    c.set('sessionId', 'session_development');

    return next();
  } catch (error) {
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

// AI Generation placeholder
v1.post('/ai/generate/image', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  // TODO: Implement actual AI image generation
  // Check quota, call AI service, store in R2, create asset record

  return c.json({
    id: `gen_${crypto.randomUUID().substring(0, 16)}`,
    status: 'processing',
    message: 'Image generation queued. This endpoint needs full implementation.',
    prompt: body.prompt,
  }, 202);
});

v1.post('/ai/generate/video', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  // TODO: Implement actual AI video generation

  return c.json({
    id: `gen_${crypto.randomUUID().substring(0, 16)}`,
    status: 'processing',
    message: 'Video generation queued. This endpoint needs full implementation.',
    prompt: body.prompt,
  }, 202);
});

v1.post('/ai/generate/text', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  // TODO: Implement actual AI text generation

  return c.json({
    id: `gen_${crypto.randomUUID().substring(0, 16)}`,
    status: 'completed',
    message: 'Text generation placeholder.',
    prompt: body.prompt,
    result: 'This is a placeholder response. Implement actual AI text generation.',
  });
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
