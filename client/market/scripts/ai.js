// /client/market/scripts/ai.js
(function (global) {
  'use strict';

  // --- malé utility
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pct = (n) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

  // --- veřejné API
  const AI = {
    /**
     * Vyrobí kontext pro scoring (insights, čas atd.)
     */
    buildContext(opts = {}) {
      return {
        now: opts.now || new Date(),
        insights: Array.isArray(opts.insights) ? opts.insights : [],
        version: '0.1-demo',
      };
    },

    /**
     * Rychlé skóre jednoho symbolu na základě forecastu (min/avg/max) a ceny.
     * @param {Object} row - { symbol, price, forecast:{min,avg,max,conf} }
     * @param {Object} ctx  - výstup z buildContext
     * @returns {Object} {symbol, direction, confidence, span, skew, notes[]}
     */
    scoreSymbol(row, ctx) {
      const f = row.forecast || {};
      const min = Number(f.min);
      const avg = Number(f.avg);
      const max = Number(f.max);
      const price = Number(row.price);

      const span = Math.max(1e-6, max - min);
      // kde v pásmu leží "avg" a aktuální cena
      const posAvg = clamp((avg - min) / span, 0, 1);     // 0..1
      const posNow = clamp((price - min) / span, 0, 1);   // 0..1
      // skew – jak moc je průměr výše než střed pásma
      const skew = (posAvg - 0.5) * 2;                    // -1..1

      // hrubá direction & confidence
      let direction = 'flat';
      if (posNow < posAvg * 0.95) direction = 'up';
      else if (posNow > posAvg * 1.05) direction = 'down';

      const confBase = Number(f.conf || 55);
      // širší pásmo => méně jistoty, skew směrem nahoru => mírně víc
      const volatilityPenalty = clamp((span / (avg || 1)) * 20, 0, 20); // max -20 p.b.
      const skewBonus = clamp(skew * 10, -10, 10);                      // ±10 p.b.
      let confidence = clamp(confBase - volatilityPenalty + skewBonus, 5, 95);

      const notes = [];
      notes.push(`Pásmo ${min}–${max}, střed ${avg}.`);
      notes.push(`Cena nyní ~${price}. ${direction === 'up' ? 'Pod' : direction === 'down' ? 'Nad' : 'Blízko'} středem.`);
      if (Math.abs(skew) > 0.15) notes.push(`Pásmo je ${skew > 0 ? 'nahoru' : 'dolů'} vychýlené (skew ${skew.toFixed(2)}).`);
      if (span / (avg || 1) > 0.6) notes.push('Široké pásmo ➜ nižší jistota.');

      return {
        symbol: row.symbol,
        direction,                  // 'up' | 'down' | 'flat'
        confidence: Math.round(confidence),
        span: { min, avg, max, now: price },
        skew: Number(skew.toFixed(3)),
        notes,
        meta: { model: 'demo-rule', ctxVersion: ctx?.version || 'n/a' }
      };
    },

    /**
     * Krátké vysvětlení jako string
     */
    explainForecast(score) {
      const arrow = score.direction === 'up' ? '↑' : score.direction === 'down' ? '↓' : '↔';
      return `${score.symbol}: ${arrow} ${score.confidence}% (min ${score.span.min}, avg ${score.span.avg}, max ${score.span.max}, now ${score.span.now})`;
    }
  };

  // export do window
  global.AI = AI;

})(typeof window !== 'undefined' ? window : globalThis);
