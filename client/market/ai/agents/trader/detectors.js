// Detekce jednoduchých struktur (S/R pásmo, breakout demo)
export function supportResistance(closes, lookback=50){
  const sample = closes.slice(-lookback);
  const min = Math.min(...sample);
  const max = Math.max(...sample);
  return { support: min, resistance: max };
}

export function breakout(closes){
  const last = closes[closes.length-1];
  const { resistance } = supportResistance(closes, 50);
  return { isBreakout: last > resistance, level: resistance };
}
