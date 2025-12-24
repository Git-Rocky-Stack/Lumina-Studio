/**
 * Edge Function: Image Optimization
 *
 * Cloudflare Edge function for:
 * - On-the-fly image resizing
 * - Format conversion (WebP, AVIF)
 * - Quality optimization
 * - CDN caching
 */

interface Env {
  ASSETS: Fetcher;
}

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Only handle image requests
    if (!pathname.startsWith('/images/')) {
      return env.ASSETS.fetch(request);
    }

    // Parse transform options from query params
    const options = parseOptions(url.searchParams);

    // Get the original image URL
    const imageUrl = url.searchParams.get('url');
    if (!imageUrl) {
      return new Response('Missing image URL', { status: 400 });
    }

    // Check cache first
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (response) {
      return response;
    }

    try {
      // Fetch and transform the image using Cloudflare Image Resizing
      const imageRequest = new Request(imageUrl, {
        headers: request.headers,
      });

      response = await fetch(imageRequest, {
        cf: {
          image: {
            width: options.width,
            height: options.height,
            quality: options.quality || 80,
            fit: options.fit || 'cover',
            format: options.format === 'auto' ? undefined : options.format,
            blur: options.blur,
          },
        },
      });

      // Clone response for caching
      response = new Response(response.body, response);

      // Set cache headers
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Vary', 'Accept');

      // Add timing header
      response.headers.set('X-Image-Optimized', 'true');

      // Cache the response
      await cache.put(cacheKey, response.clone());

      return response;
    } catch (error) {
      console.error('Image optimization error:', error);
      return new Response('Failed to optimize image', { status: 500 });
    }
  },
};

function parseOptions(params: URLSearchParams): ImageTransformOptions {
  return {
    width: params.has('w') ? parseInt(params.get('w')!, 10) : undefined,
    height: params.has('h') ? parseInt(params.get('h')!, 10) : undefined,
    quality: params.has('q') ? parseInt(params.get('q')!, 10) : 80,
    format: (params.get('f') as ImageTransformOptions['format']) || 'auto',
    fit: (params.get('fit') as ImageTransformOptions['fit']) || 'cover',
    blur: params.has('blur') ? parseInt(params.get('blur')!, 10) : undefined,
  };
}
