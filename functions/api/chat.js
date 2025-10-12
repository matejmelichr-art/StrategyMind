import { withCORS } from "../_cors";
export const onRequest = withCORS(async ({ request }) => {
  if (request.method !== "POST") return new Response("Use POST", { status: 405 });
  const { messages=[], symbol="AAPL" } = await request.json().catch(() => ({}));
  const reply = `Jarvis> doručeno ${messages.length} zpráv. K ${symbol} připravím predikci a úrovně.`;
  return new Response(JSON.stringify({ role:"assistant", content: reply }), {
    headers: { "content-type": "application/json" }
  });
});
