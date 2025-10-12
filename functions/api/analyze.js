import { withCORS } from "../_cors";

export const onRequest = withCORS(async ({ request }) => {
  if (request.method !== "POST") return new Response("Use POST", { status: 405 });
  const { symbol="AAPL", price=200, span={min:165,avg:245,max:310}, context={} } =
    await request.json().catch(() => ({}));

  const mid = (span.min + span.max) / 2;
  const direction = span.avg > mid ? "up" : span.avg < mid ? "down" : "flat";
  const confidence = Math.max(35, Math.min(90, Math.round(60 + (span.max - span.min) * -0.05)));
  const reasons = [
    context.macroNote || "Makro neutrální až mírně podpůrné.",
    context.newsNote || "Firemní zprávy bez zásadních negativ.",
    `Technická pásma ${span.min}-${span.max}, střed ${span.avg}.`
  ];

  return new Response(JSON.stringify({ symbol, price, direction, confidence, span, reasons, model:"demo-rule" }), {
    headers: { "content-type": "application/json" }
  });
});
