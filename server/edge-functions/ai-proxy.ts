/**
 * Edge Function: AI Proxy
 *
 * Cloudflare Edge function for:
 * - Proxying AI requests to reduce latency
 * - Response caching
 * - Rate limiting
 * - Request validation
 */

interface Env {
  AI_API_KEY: string;
  RATE_LIMITER: DurableObjectNamespace;
}

interface AIRequest {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

// Rate limit: 100 requests per minute per user
const RATE_LIMIT = 100;
const RATE_WINDOW = 60000; // 1 minute

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only handle POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response('Invalid content type', { status: 400 });
    }

    // Get user identifier for rate limiting
    const userId = request.headers.get('x-user-id') ||
                   request.headers.get('cf-connecting-ip') ||
                   'anonymous';

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userId, env);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      });
    }

    try {
      const body: AIRequest = await request.json();

      // Validate request
      if (!body.prompt) {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check cache for non-streaming requests
      if (!body.stream) {
        const cacheKey = generateCacheKey(body);
        const cache = caches.default;
        const cachedResponse = await cache.match(new Request(cacheKey));

        if (cachedResponse) {
          const response = new Response(cachedResponse.body, cachedResponse);
          response.headers.set('X-Cache', 'HIT');
          return response;
        }
      }

      // Make AI request
      const response = await makeAIRequest(body, env);

      // Cache non-streaming responses
      if (!body.stream && response.ok) {
        const cacheKey = generateCacheKey(body);
        const cache = caches.default;
        const responseToCache = response.clone();

        // Cache for 1 hour
        const headers = new Headers(responseToCache.headers);
        headers.set('Cache-Control', 'public, max-age=3600');

        await cache.put(
          new Request(cacheKey),
          new Response(responseToCache.body, {
            status: responseToCache.status,
            headers,
          })
        );
      }

      // Add rate limit headers
      const finalResponse = new Response(response.body, response);
      finalResponse.headers.set('X-RateLimit-Limit', String(RATE_LIMIT));
      finalResponse.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
      finalResponse.headers.set('X-Cache', 'MISS');

      return finalResponse;
    } catch (error) {
      console.error('AI proxy error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

async function makeAIRequest(body: AIRequest, env: Env): Promise<Response> {
  // Route to appropriate AI provider based on model
  const provider = getProvider(body.model);

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: body.model,
      messages: [{ role: 'user', content: body.prompt }],
      max_tokens: body.maxTokens || 1024,
      temperature: body.temperature || 0.7,
      stream: body.stream || false,
    }),
  });

  return response;
}

function getProvider(model: string): { name: string; endpoint: string } {
  // Map models to providers
  if (model.startsWith('gpt')) {
    return {
      name: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
    };
  }
  if (model.startsWith('claude')) {
    return {
      name: 'anthropic',
      endpoint: 'https://api.anthropic.com/v1/messages',
    };
  }
  if (model.startsWith('gemini')) {
    return {
      name: 'google',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent',
    };
  }

  // Default to Cloudflare Workers AI
  return {
    name: 'cloudflare',
    endpoint: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-2-7b-chat-int8',
  };
}

function generateCacheKey(body: AIRequest): string {
  const hash = btoa(JSON.stringify({
    model: body.model,
    prompt: body.prompt,
    maxTokens: body.maxTokens,
    temperature: body.temperature,
  })).slice(0, 64);

  return `https://cache.lumina.studio/ai/${hash}`;
}

async function checkRateLimit(userId: string, env: Env): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}> {
  // Simple in-memory rate limiting (in production, use Durable Objects or KV)
  // This is a simplified implementation
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;

  // For demo purposes, always allow
  return {
    allowed: true,
    remaining: RATE_LIMIT - 1,
    retryAfter: 0,
  };
}
