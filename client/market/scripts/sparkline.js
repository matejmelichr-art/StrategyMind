// SVG mini-graf min/avg/max + Current (now) jako svislá linka
export function sparkSVG(r){
  let min = Number(r?.forecast?.min);
  let avg = Number(r?.forecast?.avg);
  let max = Number(r?.forecast?.max);
  let now = Number(r?.price);

  if(!isFinite(min)||!isFinite(avg)||!isFinite(max)){ min=0;avg=1;max=2; }
  if(max <= min){ max = min + 1; }
  if(avg < min) avg = min;
  if(avg > max) avg = max;

  const w=680, h=90, p=28;
  const inner = w - 2*p;
  const y = Math.round(h/2);

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const x = (val)=> p + ((val - min) / (max - min)) * inner;

  const xMin = x(min), xAvg = x(avg), xMax = x(max);
  const xNow = x(clamp(now, min, max));

  return `
<svg class="spark w-full" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-label="1Y forecast sparkline: min ${min}, avg ${avg}, max ${max}, now ${now}">
  <line class="guide" x1="${xMin}" y1="${y}" x2="${xMax}" y2="${y}" />
  <line class="avg"  x1="${xMin}" y1="${y}" x2="${xAvg}" y2="${y}" />
  <line class="max"  x1="${xAvg}" y1="${y}" x2="${xMax}" y2="${y}" />
  <circle class="marker min" cx="${xMin}" cy="${y}" r="4" />
  <circle class="marker avg" cx="${xAvg}" cy="${y}" r="4" />
  <circle class="marker max" cx="${xMax}" cy="${y}" r="4" />
  <line class="now"  x1="${xNow}" y1="${y-20}" x2="${xNow}" y2="${y+20}" />
</svg>`;
}
