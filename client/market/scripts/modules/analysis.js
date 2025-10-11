// client/market/scripts/modules/analysis.js
// Modul pro výpočty/analýzy a „forecast“ logiku na 1 místě.

export function clamp(val, min, max){ return Math.min(Math.max(val, min), max); }

export function makeForecastLine({ min, avg, max, now }){
  // Sanitizace vstupu + jednoduchý „range sanity check“
  min = Number(min); avg = Number(avg); max = Number(max); now = Number(now);
  if(!isFinite(min) || !isFinite(avg) || !isFinite(max)){ min=0; avg=1; max=2; }
  if(max <= min) max = min + 1;
  if(avg < min)  avg = min;
  if(avg > max)  avg = max;
  now = clamp(now, min, max);

  return { min, avg, max, now, span:max-min };
}

export function sentimentFromMoves(d1, w1){
  // jednoduché odvození „směru“
  const score = (Number(d1)||0)*0.6 + (Number(w1)||0)*0.4;
  return score > 0.2 ? 'up' : score < -0.2 ? 'down' : 'flat';
}

export function sortRows(rows, sortBy){
  const copy = rows.slice();
  switch(sortBy){
    case 'price': return copy.sort((a,b)=>b.price-a.price);
    case 'w1':    return copy.sort((a,b)=>b.w1-a.w1);
    case 'conf':  return copy.sort((a,b)=>b.forecast.conf-a.forecast.conf);
    default:      return copy.sort((a,b)=>a.symbol.localeCompare(b.symbol));
  }
}
