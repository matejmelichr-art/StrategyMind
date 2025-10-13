// functions/api/analyze.js  (Pages Functions)
export async function onRequestPost({ request }) {
  const body = await request.json().catch(() => ({}));
  const { symbol = "AAPL", price = null, span = {} } = body;

  const sMin = Number(span.min ?? 0);
  const sAvg = Number(span.avg ?? 0);
  const sMax = Number(span.max ?? 0);
  const p    = Number(price ?? sAvg);

  // jednoduchá validace
  if (![sMin, sAvg, sMax, p].every(Number.isFinite) || !(sMin <= sAvg && sAvg <= sMax)) {
    return new Response(JSON.stringify({ error: "invalid span/price" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  let direction = "flat";
  if (p < (sMin + sAvg) / 2) direction = "down";
  if (p > (sAvg + sMax) / 2) direction = "up";

  const width = Math.max(1, sMax - sMin);
  const dist  = Math.abs(p - sAvg);
  const confidence = Math.round(
    Math.min(92, 40 + (dist / width) * 45 + (1 - Math.min(0.7, width / Math.max(1, sAvg))) * 25)
  );

  const reasons = [
    `Cena ${p ? p.toFixed(2) : "n/a"} vs. pásmo ${sMin}–${sMax} (střed ${sAvg}).`,
    direction === "up"
      ? "Nad středem pásma → mírně býčí bias."
      : direction === "down"
      ? "Pod středem pásma → mírně medvědí bias."
      : "U středu pásma → spíše vyčkat na potvrzení.",
    "Heuristika: užší pásmo a větší odchylka od středu zvyšují jistotu."
  ];

  return new Response(JSON.stringify({
    symbol, direction, confidence, span: { min: sMin, avg: sAvg, max: sMax }, reasons
  }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
