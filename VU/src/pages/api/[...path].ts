import type { APIRoute } from 'astro';

export const ALL: APIRoute = async ({ request, params }) => {
  const DROPLET_IP = 'http://167.99.7.208:8000';
  const rawPath = params.path || '';
  const url = new URL(request.url);
  
  // Clean up the path to prevent double slashes
  const cleanPath = rawPath.replace(/^\/+/, '').replace(/\/+$/, '');
  const searchParams = url.search ? url.search : '';

  // Construct the target URL to the DigitalOcean Droplet
  const targetUrl = `${DROPLET_IP}/api/${cleanPath}/${searchParams}`;
  
  // Clone headers but remove host and referer to prevent conflicts
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('referer');
  headers.delete('origin'); // Optional, to prevent CORS issues if the droplet is strict

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    });

    // Vercel's Edge CDN intercepts 500-level status codes from serverless functions
    // and overrides the body with a generic HTML error page.
    // To ensure the frontend receives the actual JSON error message from the droplet,
    // we rewrite any 500-level status down to 400.
    const safeStatus = response.status >= 500 ? 400 : response.status;

    return new Response(response.body, {
      status: safeStatus,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
