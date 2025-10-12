<!-- /client/market/scripts/api.js -->
<script>
/** Central API adapter for StrategyMind (browser) */
window.API_BASE = "https://tight-field-436e.matejmelichr.workers.dev";

const req = async (path, init={}) => {
  const url = `${window.API_BASE}${path}`;
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers||{}) }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

window.API = {
  // --- Chat / Jarvis
  chat: (topic, messages) =>
    req(`/api/chat?topic=${encodeURIComponent(topic||"general")}`, {
      method:"POST", body: JSON.stringify({ messages })
    }),

  // --- Finance
  quotes: (symbols=[]) =>
    req(`/api/finance/quotes?symbols=${encodeURIComponent(symbols.join(","))}`),

  candles: ({symbol, resolution="D", from, to}) => {
    const p = new URLSearchParams({ symbol, resolution });
    if (from) p.set("from", from); if (to) p.set("to", to);
    return req(`/api/finance/candles?${p}`);
  },

  indicators: ({symbol, resolution="D", sma="20,50,200", ema="12,26", rsi="14", bb="20"}) =>
    req(`/api/finance/indicators?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&sma=${sma}&ema=${ema}&rsi=${rsi}&bb=${bb}`),

  correlation: ({symbols=[], period=120}) =>
    req(`/api/finance/correlation?symbols=${encodeURIComponent(symbols.join(","))}&period=${period}`),

  screener: ({symbols=[], filter="all"}) =>
    req(`/api/finance/screener?symbols=${encodeURIComponent(symbols.join(","))}&filter=${filter}`),

  backtest: ({symbol, resolution="D", fast=20, slow=50}) =>
    req(`/api/finance/backtest?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&fast=${fast}&slow=${slow}`),

  // --- News
  news: (q="markets") => req(`/api/news?q=${encodeURIComponent(q)}`),
  newsSentiment: (q="markets") => req(`/api/news/sentiment?q=${encodeURIComponent(q)}`),

  // --- Real-estate
  cadastre: (q) => req(`/api/cadastre/search?q=${encodeURIComponent(q)}`),
  reScan: (q) => req(`/api/realestate/scan?q=${encodeURIComponent(q)}`),
  reIdeas: (prompt) => req(`/api/realestate/ideas`, { method:"POST", body: JSON.stringify({ prompt }) }),
  reComps: (q) => req(`/api/realestate/comps?q=${encodeURIComponent(q)}`),

  // --- Money
  moneyPlan: ({income=50000, risk="balanced"}) =>
    req(`/api/money/plan?income=${income}&risk=${risk}`),
  compound: ({principal=100000, monthly=2000, rate=8, years=10}) =>
    req(`/api/money/compound?principal=${principal}&monthly=${monthly}&rate=${rate}&years=${years}`),
};
</script>
