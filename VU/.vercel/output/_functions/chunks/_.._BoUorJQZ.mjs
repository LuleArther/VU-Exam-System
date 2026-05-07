const ALL = async ({ request, params }) => {
  const path = params.path || "";
  const url = new URL(request.url);
  const targetUrl = `http://167.99.7.208:8000/api/${path}${url.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("referer");
  headers.delete("origin");
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : void 0
    });
    const safeStatus = response.status >= 500 ? 400 : response.status;
    return new Response(response.body, {
      status: safeStatus,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  ALL
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
