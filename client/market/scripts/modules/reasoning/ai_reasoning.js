/*! StrategyMind – reasoning/ai_reasoning.js
 *  Převádí Insights + kontext + vlastnosti symbolu na:
 *  { dir: 'up'|'down'|'flat', prob: 0–100, reasons:[], levels:{min,avg,max} }
 *  - Mapuje makro/earnings/sentiment na vážené faktory
 *  - Používá AIModel.combineIndependent + OnlineCalibrator
 *  - Dělá sektorové biasy (tech vs. energy, USD, zlato…)
 *  Exportuje: window.AI
 */
(function () {
  const M = window.AIModel;

  // === Konfigurace a váhy (tady ladíš chování) ==============================

  // váhy pro typy faktorů
  const WEIGHTS = {
    macro: 0.35,
    earnings: 0.40,
    sentiment: 0.25,
    flow: 0.20,          // objem / momentum
    correlation: 0.15,   // vazby sektor / komodita / měna
  };

  // mapování tickeru na “sektor/rodinu”, pro biasy
  const SECTOR = {
    AAPL: 'tech', MSFT: 'tech', NVDA: 'semis', AMD: 'semis',
    META: 'tech', GOOGL: 'tech', AMZN: 'ecom',
    TSLA: 'auto_growth', SPX: 'broad', NDX: 'tech_broad',
    BTCUSD: 'crypto', ETHUSD: 'crypto',
    XAUUSD: 'gold', WTI: 'energy',
    EURUSD: 'fx', USDJPY: 'fx'
  };

  // citlivosti sektorů na typy faktorů (−1…+1)
  const SENS = {
    tech:        { rates: +0.6,  usd: -0.3,  inflation: -0.2 },
    semis:       { rates: +0.7,  usd: -0.25, inflation: -0.1 },
    ecom:        { rates: +0.5,  usd: -0.2,  inflation: -0.15 },
    auto_growth: { rates: +0.4,  usd: -0.1,  inflation: -0.2 },
    tech_broad:  { rates: +0.55, usd: -0.25, inflation: -0.2 },
    crypto:      { rates: +0.3,  usd: -0.4,  inflation: -0.15, riskon: +0.35 },
    gold:        { rates: -0.4,  usd: -0.5,  inflation: +0.4,  riskoff: +0.35 },
    energy:      { inflation: +0.25, growth: +0.2, usd: -0.15 },
    broad:       { rates: +0.35, usd: -0.15, inflation: -0.15 },
    fx:          { usd: -0.7 },
  };

  // heuristické posuny cílových úrovní (v procentech)
  const LEVEL_BUMPS = {
    strongUp: +0.07,
    mildUp:   +0.03,
    flat:     0,
    mildDown: -0.03,
    strongDown:-0.07
  };

  // === Pomocné funkce =======================================================

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const pctToProb = (x) => clamp(0.5 + x, 0.05, 0.95); // mapujeme −0.5…+0.5 -> 0.05…0.95

  function sectorOf(symbol) {
    return SECTOR[symbol] || 'broad';
  }

  function scoreFromInsights(symbol, insights) {
    // Převod listu insights na agregované “faktorové skóre”
    const sec = sectorOf(symbol);
    const sens = SENS[sec] || {};

    let macroUp = 0, macroDown = 0, earnUp = 0, earnDown = 0,
        sentUp = 0, sentDown = 0, flowUp = 0, flowDown = 0;

    const reasons = [];

    for (const n of insights) {
      // Filtr: vztahuje se ke konkrétnímu symbolu, jeho sektoru nebo broad trhu?
      const hit =
        (n.tickers && n.tickers.includes(symbol)) ||
        (n.sector && n.sector === sec) ||
        (n.type === 'macro' || n.type === 'index');

      if (!hit) continue;

      const strength = (n.prob || 55) / 100; // 0.55 default
      const dir = n.sentiment || 'flat';

      // makro
      if (n.type === 'macro') {
        // kličová klíčová slova → faktor
        const s = (n.tags || []).join(' ').toLowerCase() + ' ' + (n.title || '').toLowerCase();
        let bias = 0;
        if (s.includes('inflace') || s.includes('cpi'))       bias += (sens.inflation ?? 0);
        if (s.includes('sazby') || s.includes('rates'))       bias += (sens.rates ?? 0);
        if (s.includes('usd') || s.includes('dollar'))        bias += (sens.usd ?? 0);
        if (s.includes('risk on'))                            bias += (sens.riskon ?? 0);
        if (s.includes('risk off') || s.includes('reces'))    bias += (sens.riskoff ?? 0);
        if (s.includes('growth') || s.includes('růst'))       bias += (sens.growth ?? 0);

        const component = clamp(bias * (dir === 'up' ? +1 : dir === 'down' ? -1 : 0) * strength, -1, 1);
        if (component > 0) { macroUp += component; reasons.push(`Makro + (${n.title || n.source})`); }
        if (component < 0) { macroDown += -component; reasons.push(`Makro − (${n.title || n.source})`); }
      }

      // earnings
      if (n.type === 'stock' && (n.tags || []).includes('Earnings')) {
        const val = (dir === 'up' ? +1 : dir === 'down' ? -1 : 0) * strength;
        if (val > 0) { earnUp += val; reasons.push(`Earnings + (${n.title || ''})`); }
        if (val < 0) { earnDown += -val; reasons.push(`Earnings − (${n.title || ''})`); }
      }

      // sentiment obecně
      if (n.type !== 'macro') {
        const val = (dir === 'up' ? +1 : dir === 'down' ? -1 : 0) * strength;
        if (val > 0) { sentUp += val; reasons.push(`Sentiment + (${n.source || 'Zprávy'})`); }
        if (val < 0) { sentDown += -val; reasons.push(`Sentiment − (${n.source || 'Zprávy'})`); }
      }

      // flow (hrubě – když je “vol/objem ↑” nebo momentum)
      if ((n.tags || []).some(t => /volume|objem|momentum|breakout/i.test(t))) {
        const val = (dir === 'up' ? +0.6 : dir === 'down' ? -0.6 : 0) * strength;
        if (val > 0) { flowUp += val; reasons.push(`Flow + (${n.title || ''})`); }
        if (val < 0) { flowDown += -val; reasons.push(`Flow − (${n.title || ''})`); }
      }
    }

    // normalizace do −0.5 … +0.5
    function norm(up, down, w) {
      const raw = (up - down) * (w || 1);
      return clamp(raw, -0.5, +0.5);
    }

    const components = {
      macro:      norm(macroUp, macroDown, WEIGHTS.macro),
      earnings:   norm(earnUp, earnDown, WEIGHTS.earnings),
      sentiment:  norm(sentUp, sentDown, WEIGHTS.sentiment),
      flow:       norm(flowUp, flowDown, WEIGHTS.flow),
      // correlation by mohla využívat interní cross-assets data (ponecháno na další iteraci)
    };

    // převeď na pravděpodobnosti (pro Bayes-like skládání)
    const probs = Object.values(components).map(pctToProb);

    // výsledná pravděpodobnost UP
    const pUp = M.combineIndependent(probs);         // 0–1
    const pUpCalibrated = M.temperature(pUp, 1.15); // mírné zploštění
    const dir = pUpCalibrated > 0.55 ? 'up' : pUpCalibrated < 0.45 ? 'down' : 'flat';

    return { pUp: pUpCalibrated, dir, components, reasons };
  }

  // jemný posun 1Y úrovní podle směru
  function adjustLevels(levels, dir) {
    const bump =
      dir === 'up'   ? LEVEL_BUMPS.mildUp   :
      dir === 'down' ? LEVEL_BUMPS.mildDown :
                       LEVEL_BUMPS.flat;
    const { min, avg, max } = levels;
    return {
      min: Math.round(min * (1 + bump)),
      avg: Math.round(avg * (1 + bump)),
      max: Math.round(max * (1 + bump)),
    };
  }

  // === Veřejné API ==========================================================

  const calibrators = new Map(); // per-symbol stabilizace

  function getCalibrator(sym) {
    if (!calibrators.has(sym)) calibrators.set(sym, new M.OnlineCalibrator());
    return calibrators.get(sym);
  }

  function buildContext({ insights, now }) {
    // tady je místo pro další data (makro kalendář, sazby, DXY…)
    const normalized = (insights || []).map(n => ({
      type: n.type || n.asset_type || '',
      source: n.source || 'Zprávy',
      time: n.time || n.when || '',
      sentiment: n.sentiment || n.impact || 'flat',
      prob: n.prob || n.probability || 55,
      title: n.title || n.headline || '',
      tags: n.tags || [],
      tickers: n.tickers || [],
      sector: n.sector || '',
    }));
    return { insights: normalized, now: now || new Date() };
  }

  function scoreSymbol(row, context) {
    const { symbol, forecast } = row;
    const levels = {
      min: Number(forecast?.min ?? 0),
      avg: Number(forecast?.avg ?? 0),
      max: Number(forecast?.max ?? 0),
    };

    const { pUp, dir, components, reasons } = scoreFromInsights(symbol, context.insights);

    // stabilizace přes online kalibrátor
    const cal = getCalibrator(symbol);
    const pStable = cal.update(pUp);              // 0–1
    const probPct = Math.round(100 * Math.max(pStable, 1 - pStable)); // vzdálenost od 0.5

    // vyber vítězný směr po stabilizaci
    const finalDir = pStable >= 0.5 ? 'up' : 'down';
    const adjLevels = adjustLevels(levels, finalDir);

    // TOP důvody (max 4)
    const uniqReasons = [];
    for (const r of reasons) {
      if (!uniqReasons.includes(r)) uniqReasons.push(r);
      if (uniqReasons.length >= 4) break;
    }
    if (!uniqReasons.length) uniqReasons.push('Bez silných zpráv – držíme benchmark bias.');

    return {
      dir: finalDir,                          // 'up' | 'down'
      prob: Math.max(55, probPct),            // 55–100 (konzervativní min)
      reasons: uniqReasons,                   // text vysvětlení
      components,                             // debug/skóre faktorů
      levels: adjLevels,                      // lehce posunuté cíle
    };
  }

  window.AI = { buildContext, scoreSymbol };
})();
