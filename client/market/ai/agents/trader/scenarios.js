export function buildScenarios(now, span){ // span = {min,avg,max}
  return [
    { key:'optimistic', target: span.max, desc:'Momentum / příznivé makro.' },
    { key:'base',       target: span.avg, desc:'Konsensus / mean reversion.' },
    { key:'defensive',  target: span.min, desc:'Riziko / utažené podmínky.' }
  ].map(s => ({ ...s, distance: Number((s.target - now).toFixed(2)) }));
}
