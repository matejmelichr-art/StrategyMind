// Cloudflare Pages Function: GET /api/health
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Content-Type": "application/json; charset=utf-8",
};

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      routes: ["POST /api/analyze", "GET /api/health"],
    }),
    { headers: CORS }
  );
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
