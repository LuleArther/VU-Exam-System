import type { APIRoute } from 'astro';

export const ALL: APIRoute = async ({ request, params }) => {
  const path = params.path || '';
  const url = new URL(request.url);
  
  // Construct the target URL to the DigitalOcean Droplet
  const targetUrl = `http://167.99.7.208:8000/api/${path}${url.search}`;
  
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

    return new Response(response.body, {
      status: response.status,
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
