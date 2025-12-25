# Lumina Studio API Documentation

## Base URL

```
Production: https://lumina-studio-api.elsalaymeh.workers.dev
Development: http://localhost:8787
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <clerk-jwt-token>
```

---

## Endpoints

### Health & Status

#### `GET /`
Returns API status and version.

**Response:**
```json
{
  "name": "Lumina Studio API",
  "version": "1.0.0",
  "environment": "production",
  "status": "operational"
}
```

#### `GET /health`
Returns detailed health status including service connectivity.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2024-12-24T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "cache": "healthy"
  }
}
```

---

### Authentication

#### `POST /v1/auth/webhook`
Clerk webhook handler for user lifecycle events.

**Headers:**
- `svix-id` - Webhook ID
- `svix-timestamp` - Webhook timestamp
- `svix-signature` - Webhook signature

**Events Handled:**
- `user.created` - Creates user record and default workspace
- `user.updated` - Updates user profile
- `user.deleted` - Cascades deletion of all user data

#### `GET /v1/auth/me`
Returns current authenticated user.

**Response:**
```json
{
  "id": "user_xxx",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://...",
  "tier": "free",
  "subscription_status": "active",
  "theme_color": "#6366f1",
  "default_workspace_id": "ws_xxx"
}
```

#### `GET /v1/auth/quota`
Returns user's quota and usage information.

**Response:**
```json
{
  "tier": "free",
  "billing_period": "2024-12",
  "subscription_status": "active",
  "usage": {
    "ai_image_generation": {
      "used": 5,
      "limit": 10,
      "remaining": 5,
      "overage_allowed": false
    }
  }
}
```

---

### Workspaces

#### `GET /v1/workspaces`
List all workspaces the user has access to.

**Response:**
```json
{
  "data": [
    {
      "id": "ws_xxx",
      "name": "Personal Workspace",
      "slug": "personal-xxx",
      "owner_id": "user_xxx",
      "description": "Your personal workspace"
    }
  ]
}
```

#### `POST /v1/workspaces`
Create a new workspace.

**Request:**
```json
{
  "name": "My Workspace",
  "description": "Workspace description",
  "slug": "my-workspace"
}
```

---

### Projects

#### `GET /v1/workspaces/:wsId/projects`
List all projects in a workspace.

#### `POST /v1/workspaces/:wsId/projects`
Create a new project.

**Request:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "project_type": "design"
}
```

**Project Types:**
- `design` - Canvas design project
- `video` - Video studio project
- `document` - Document/PDF project
- `brand` - Brand kit project
- `campaign` - Marketing campaign

---

### AI Generation

#### `POST /v1/ai/generate/image`
Generate an AI image.

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "quality": "hd",
  "workspace_id": "ws_xxx",
  "project_id": "prj_xxx"
}
```

**Quality Options:**
- `standard` - 20 steps
- `hd` - 30 steps
- `ultra` - 50 steps

**Response:**
```json
{
  "id": "gen_xxx",
  "status": "completed",
  "asset": {
    "id": "asset_xxx",
    "cdn_url": "/assets/asset_xxx",
    "width": 1024,
    "height": 1024
  },
  "usage": {
    "type": "ai_image_generation",
    "remaining": 9,
    "limit": 10
  },
  "generation_time_ms": 5000
}
```

#### `POST /v1/ai/generate/video`
Generate an AI video (async).

**Request:**
```json
{
  "prompt": "A bird flying through clouds",
  "duration": 5,
  "workspace_id": "ws_xxx"
}
```

**Response:**
```json
{
  "id": "gen_xxx",
  "status": "processing",
  "asset": {
    "id": "asset_xxx",
    "processing_status": "processing"
  }
}
```

#### `POST /v1/ai/generate/text`
Generate AI text content.

**Request:**
```json
{
  "prompt": "Write a tagline for a coffee brand",
  "context": "brand",
  "max_tokens": 1024,
  "temperature": 0.7
}
```

**Context Options:**
- `general` - General creative assistant
- `brand` - Brand messaging specialist
- `campaign` - Marketing content creator
- `design` - Creative director

---

### Usage Tracking

#### `GET /v1/usage/current`
Get current month's usage.

**Response:**
```json
{
  "month": "2024-12",
  "tier": "free",
  "images": 5,
  "videos": 2,
  "text": 10
}
```

#### `POST /v1/usage/sync`
Sync client-side usage to server.

**Request:**
```json
{
  "month": "2024-12",
  "images": 6,
  "videos": 3,
  "text": 15
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "requestId": "uuid"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests - Quota exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| AI Generation | 10 requests/minute |
| General API | 60 requests/minute |
| Webhooks | 100 requests/minute |

---

## Quota Limits by Tier

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| Image Generation | 10/month | 100/month | 500/month | Unlimited |
| Video Generation | 3/month | 30/month | 150/month | Unlimited |
| Text Generation | 50/month | 500/month | 2000/month | Unlimited |
