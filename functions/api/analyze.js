// ===== Analyze (simple fusion: price + span + heuristics) =====
if (url.pathname === "/api/analyze" && request.method === "POST") {
  const body = await request.json().catch(() => ({}));
  const { symbol = "AAPL", price = null, span = {} } = body;

  const sMin = Number(span.min ?? 0);
  const sAvg = Number(span.avg ?? 0);
  const sMax = Number(span.max ?? 0);
  const p    = Number(price ?? sAvg);

  // směr podle polohy ceny v pásmu
  let direction = "flat";
  if (p < (sMin + sAvg) / 2) direction = "down";
  if (p > (sAvg + sMax) / 2) direction = "up";

  // důvěra – užší pásmo + větší odchylka od středu => vyšší
  const width = Math.max(1, sMax - sMin);
  const dist  = Math.abs(p - sAvg);
  const confidence = Math.round(
    Math.min(92, 40 + (dist / width) * 45 + (1 - Math.min(0.7, width / Math.max(1, sAvg))) * 25)
  );

  const reasons = [
    `Cena ${isFinite(p) ? p.toFixed(2) : "n/a"} vs. pásmo ${sMin}–${sMax} (střed ${sAvg}).`,
    direction === "up" ? "Nad středem pásma → mírně býčí bias."
      : direction === "down" ? "Pod středem pásma → mírně medvědí bias."
      : "U středu pásma → vyčkat na potvrzení.",
    "Heuristika: užší pásmo a větší odchylka od středu zvyšují jistotu."
  ];

  return json({
    symbol,
    direction,
    confidence,
    span: { min: sMin, avg: sAvg, max: sMax },
    reasons
  });
}
