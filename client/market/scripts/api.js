// =====================================
// StrategyMind – API Connector (Frontend)
// =====================================
// Připojení na Cloudflare Worker API
// Autor: Matej Melichr (v.2025-10)
// -------------------------------------

// 🔌 Backend (Cloudflare Worker)
const API_BASE = "https://tight-field-436e.matejmelichr.workers.dev";

// ==========================
// Helper funkce pro API call
// ==========================
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  return res.json();
}

// ==========================
// Hlavní API objekt
// ==========================
const API = {
  // 🧠 Health check
  async health() {
    return apiFetch(`${API_BASE}/api/health`);
  },

  // 📊 Analyze – analyzuje cenu podle pásma
  async analyze(symbol, price, span) {
    const payload = { symbol, price, span };
    return apiFetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 📰 News – získá nejnovější zprávy
  async news(symbol = "markets") {
    const q = encodeURIComponent(symbol);
    return apiFetch(`${API_BASE}/api/news?q=${q}`);
  },
};

// ==========================
// Ukázkové napojení na UI
// ==========================

// Zdraví API
async function checkHealth() {
  try {
    const data = await API.health();
    console.log("✅ API health:", data);
    const el = document.getElementById("health-status");
    if (el) el.textContent = `API: OK (${new Date(data.ts).toLocaleTimeString()})`;
  } catch (err) {
    console.error("❌ API health error:", err);
    const el = document.getElementById("health-status");
    if (el) el.textContent = "API: ERROR";
  }
}

// Získání zpráv do sekce "AI News"
async function loadNews(symbol = "markets") {
  try {
    const data = await API.news(symbol);
    const list = document.getElementById("news-list");
    if (!list) return;
    list.innerHTML = "";
    data.items.slice(0, 8).forEach((n) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${n.url}" target="_blank">${n.title}</a><br>
        <small>${n.source}</small>`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("News load error:", err);
  }
}

// Spuštění analýzy ceny (např. tlačítko "Analyze")
async function runAnalyze() {
  const symbol = document.getElementById("symbol-input").value || "AAPL";
  const price = parseFloat(document.getElementById("price-input").value) || 200;
  const min = parseFloat(document.getElementById("min-input").value) || 150;
  const avg = parseFloat(document.getElementById("avg-input").value) || 200;
  const max = parseFloat(document.getElementById("max-input").value) || 250;

  try {
    const data = await API.analyze(symbol, price, { min, avg, max });
    const out = document.getElementById("analyze-output");
    out.innerHTML = `
      <strong>${symbol}</strong> → ${data.direction.toUpperCase()} (${data.confidence}%)
      <br><em>${data.reasons.join("<br>")}</em>
    `;
  } catch (err) {
    console.error("Analyze error:", err);
  }
}

// ==========================
// Auto-run po načtení stránky
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  loadNews();
});
