// ===============================
// StrategyMind — Mock AI modul
// ===============================
// Tento soubor simuluje AI jádro (do doby než připojíme OpenAI API)

window.AI = {
  /**
   * Vytvoří kontext s aktuálními daty
   * @param {Object} options - vstupní parametry (např. insights, now)
   */
  buildContext(options = {}) {
    return {
      timestamp: new Date(),
      source: "StrategyMind Mock AI",
      confidenceBase: 0.72,
      ...options
    };
  },

  /**
   * Vyhodnotí symbol a vrátí predikci s confidence score
   * @param {Object} sample - např. { symbol: 'AAPL', forecast: { min, avg, max } }
   * @param {Object} context - vytvořený kontext z buildContext()
   */
  scoreSymbol(sample, context) {
    const { symbol, forecast } = sample;
    const diff = forecast.max - forecast.min;
    const trend = forecast.avg > forecast.min + diff * 0.5 ? "bullish" : "neutral";
    const confidence = (context.confidenceBase + Math.random() * 0.1).toFixed(2);

    return {
      symbol,
      forecast,
      trend,
      confidence: `${confidence * 100}%`,
      message: `Predikce pro ${symbol} má ${trend} tendenci (mock výpočet).`
    };
  }
};
