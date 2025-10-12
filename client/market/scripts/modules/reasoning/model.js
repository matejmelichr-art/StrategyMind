/*! StrategyMind – reasoning/model.js
 *  Jednoduchá online kalibrace pravděpodobnosti:
 *  - EMA pro stabilitu (krátké/rychlé okno + pomalé okno)
 *  - pseudo-Bayes pro kombinaci nezávislých (nebo málo závislých) faktorů
 *  - clamping a teplotní kalibrace
 *  Exportuje: window.AIModel
 */
(function () {
  const clamp = (x, lo = 0.0001, hi = 0.9999) => Math.max(lo, Math.min(hi, x));

  function ema(prev, x, alpha) {
    if (prev == null || isNaN(prev)) return x;
    return alpha * x + (1 - alpha) * prev;
  }

  function odds(p) { return p / (1 - p); }
  function oddsToProb(o) { return o / (1 + o); }

  /**
   * Kombinace faktorů “téměř nezávislých” pomocí násobení odds (Bayes-like)
   * factors: array of probabilities v (0,1) – už po jednotlivých váhách
   */
  function combineIndependent(factors) {
    if (!factors || !factors.length) return 0.5;
    let o = 1.0;
    for (const p of factors) o *= odds(clamp(p));
    return clamp(oddsToProb(o));
  }

  /**
   * Teplotní kalibrace – stáhne extrémy (T>1 → plošší, T<1 → ostřejší)
   */
  function temperature(p, T = 1.15) {
    // převedeme do logit prostoru, ztlumíme, zpět
    const x = Math.log(p / (1 - p));
    const y = x / T;
    const e = Math.exp(y);
    return clamp(e / (1 + e));
  }

  class OnlineCalibrator {
    constructor(opts = {}) {
      this.alphaFast = opts.alphaFast ?? 0.35;
      this.alphaSlow = opts.alphaSlow ?? 0.08;
      this.fast = null;
      this.slow = null;
    }
    update(p) {
      this.fast = ema(this.fast, p, this.alphaFast);
      this.slow = ema(this.slow, p, this.alphaSlow);
      // návrat “stabilizované” verze (kombinace)
      const blended = 0.6 * this.fast + 0.4 * this.slow;
      return clamp(blended);
    }
  }

  window.AIModel = {
    combineIndependent,
    temperature,
    OnlineCalibrator,
  };
})();
