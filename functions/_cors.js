export const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type, authorization"
};
export function withCORS(handler) {
  return async (ctx) => {
    if (ctx.request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const res = await handler(ctx);
    const headers = new Headers(res.headers || {});
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
    return new Response(res.body, { ...res, headers });
  };
}
