// Jednoduchý CORS wrapper pro Pages Functions
const ALLOWED = [
  'https://strategymind.pages.dev',
  'https://strategymind.app',
  'http://localhost:8788'
];

export function withCORS(handler){
  return async (ctx) => {
    const { request } = ctx;
    const origin = request.headers.get('Origin') || '';
    const allow = ALLOWED.includes(origin) ? origin : ALLOWED[0];

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allow,
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        }
      });
    }

    const res = await handler(ctx);
    const hdrs = new Headers(res.headers || {});
    hdrs.set('Access-Control-Allow-Origin', allow);
    hdrs.set('Vary', 'Origin');
    return new Response(res.body, { status: res.status || 200, headers: hdrs });
  };
}
