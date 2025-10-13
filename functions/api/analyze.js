// Cloudflare Pages Function: POST /api/analyze
// body: { symbol, price, span:{min,avg,max} }
// out : { symbol, direction:'up'|'down'|'flat', confidence:Number, span, reasons: string[] }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Content-Type": "application/json; charset=utf-8",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request }) {
  let body = {};
  try { body = await request.json(); } catch {}
  const { symbol = "TICKER", price = null, span = {} } = body || {};

  const sMin = Number(span.min ?? NaN);
  const sAvg = Number(span.avg ?? NaN);
  const sMax = Number(span.max ?? NaN);
  const p    = Number(price ?? NaN);

  const validSpan =
    Number.isFinite(sMin) && Number.isFinite(sAvg) && Number.isFinite(sMax) &&
    sMin <= sAvg && sAvg <= sMax;

  if (!validSpan) {
    return new Response(
      JSON.stringify({ error: "invalid span: expected {min<=avg<=max}" }),
      { status: 400, headers: CORS }
    );
  }

  // směr podle polohy ceny v pásmu
  let direction = "flat";
  if (Number.isFinite(p)) {
    if (p < (sMin + sAvg) / 2) direction = "down";
    if (p > (sAvg + sMax) / 2) direction = "up";
  }

  // confidence: užší pásmo a blíže středu ⇒ vyšší
  const width = Math.max(1, sMax - sMin);
  const dist  = Number.isFinite(p) ? Math.abs(p - sAvg) : width / 3;
  const confidence = Math.round(
    Math.min(
      92,
      40 + (dist / width) * 45 + (1 - Math.min(0.7, width / Math.max(1, sAvg))) * 15
    )
  );

  const reasons = [
    Number.isFinite(p)
      ? `Cena ${p.toFixed(2)} vs. pásmo ${sMin}–${sMax} (střed ${sAvg}).`
      : `Pásmo ${sMin}–${sMax} (střed ${sAvg}).`,
    direction === "up"   ? "Nad středem pásma – mírně býčí bias."
  : direction === "down" ? "Pod středem pásma – mírně medvědí bias."
                          : "Kolem středu pásma – neutrální.",
    `Šířka pásma ${width.toFixed(2)} ⇒ konfid. ~${confidence}%.`
  ];

  return new Response(
    JSON.stringify({ symbol, direction, confidence, span: { min: sMin, avg: sAvg, max: sMax }, reasons }),
    { headers: CORS }
  );
}
