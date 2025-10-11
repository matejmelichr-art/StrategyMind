export function sparkline(r){
  let {min, avg, max} = r?.forecast || {};
  const now = Number(r?.price);
  min = Number(min); avg = Number(avg); max = Number(max);

  if (!isFinite(min) || !isFinite(avg) || !isFinite(max)) { min=0; avg=1; max=2; }
  if (max <= min) max = min + 1;
  if (avg <  min) avg = min;
  if (avg >  max) avg = max;

  const w=220, h=24, p=10, inner=w-2*p, y=Math.round(h/2);
  const x = v => p + ((v - min) / (max - min)) * inner;
  const xMin=x(min), xAvg=x(avg), xMax=x(max), xNow=x(Math.min(Math.max(now,min),max));

  return `
<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="1Y spark">
  <line x1="${xMin}" y1="${y}" x2="${xMax}" y2="${y}" stroke="#cbd5e1" opacity=".7"/>
  <line x1="${xMin}" y1="${y}" x2="${xAvg}" y2="${y}" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
  <line x1="${xAvg}" y1="${y}" x2="${xMax}" y2="${y}" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 6"/>
  <line x1="${xNow}" y1="${y-6}" x2="${xNow}" y2="${y+6}" stroke="#0ea5e9" stroke-width="2"/>
</svg>`;
}
