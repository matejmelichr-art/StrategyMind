import { withCORS } from "../_cors";
export const onRequest = withCORS(async ({ request }) => {
  if (request.method !== "POST") return new Response("Use POST", { status: 405 });
  const { symbol="AAPL" } = await request.json().catch(() => ({}));
  return new Response(JSON.stringify({
    symbol,
    summary: `Kombinujeme makro + firemní zprávy pro ${symbol}.`,
    bullets: [
      "CPI mírně nižší → vyšší šance uvolnění sazeb.",
      "Produktový mix v USA lepší; Čína stabilizace.",
      "Capex do AI/On-device ML – maržový tailwind 2025."
    ]
  }), { headers: { "content-type": "application/json" } });
});
