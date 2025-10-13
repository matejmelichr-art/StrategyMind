// functions/api/analyze.js
// Jednoduchá heuristická analýza: cena + pásmo (min/avg/max) -> směr + confidence
// Vrací: { direction, confidence, span:{min,avg,max}, reasons:[...], symbol }

import { withCORS } from "../_cors";

export const onRequest = withCORS(async ({ request }) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  // Bezpečné načtení těla
  let body = {};
  try { body = await request.json(); } catch (_) {}

  const {
    symbol = "AAPL",
    price  = null,
    span   = {},
  } = body || {};

  // Normalizace vstupů
  const sMin = Number(span.min ?? 0);
  const sAvg = Number(span.avg ?? 0);
  const sMax = Number(span.max ?? 0);
  const p = price != null ? Number(price)
    : (sAvg || (sMin && sMax ? (sMin + sMax) / 2 : null));

  // --- směr dle polohy ceny v pásmu
  let direction = "flat";
  if (p != null && sMin && sMax) {
    const midLower = (sMin + (sAvg || sMin)) / 2;
    const midUpper = ((sAvg || sMax) + sMax) / 2;
    if (p < midLower) direction = "down";
    else if (p > midUpper) direction = "up";
  }

  // --- confidence: užší pásmo => vyšší jistota; odchylka od středu => mírný bonus
  const width = sMax && sMin ? Math.max(1e-9, sMax - sMin) : 1;
  const denom = Math.max(1e-9, sAvg || ((sMin + sMax) / 2) || 1);
  const dist  = p != null && sAvg ? Math.abs(p - sAvg) : width / 2;

  let confidence =
    40 +                               // základ
    (1 - Math.min(0.7, width / denom)) * 45 +   // užší pásmo -> vyšší jistota
    Math.min(15, (dist / width) * 15);          // bonus za „vyhraněnost“
  confidence = Math.max(0, Math.min(98, Math.round(confidence)));

  // --- krátké důvody (CZ)
  const reasons = [];
  if (p != null && sMin && sMax && sAvg) {
    reasons.push(`Cena ${p.toFixed(2)} vs. pásmo ${sMin}–${sMax} (střed ${sAvg}).`);
  }
  reasons.push(
    direction === "up"
      ? "Nad horním středem pásma — mírně býčí bias / momentum."
      : direction === "down"
      ? "Pod dolním středem pásma — defenzivní nastavení / slabší momentum."
      : "V okolí středu pásma — spíše konsolidace / mean reversion."
  );
  if (width / denom > 0.35) {
    reasons.push("Širší pásmo ⇒ vyšší nejistota, vyčkej na potvrzení.");
  } else {
    reasons.push("Užší pásmo ⇒ vyšší jistota krátkodobé projekce.");
  }

  const result = {
    symbol,
    direction,
    confidence,
    span: { min: sMin || null, avg: sAvg || null, max: sMax || null },
    reasons,
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
