import { sparkline } from './sparkline.js';

export function renderTable(root, rows) {
  if (!root) return;
  const fmt = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});
  const pct = v => (v>=0?'+':'') + v.toFixed(2) + '%';

  root.innerHTML = rows.map(r => `
    <div class="row border-t border-slate-100 px-4 py-3 grid"
         style="grid-template-columns:90px 1fr 120px 100px 100px 250px 80px 150px;align-items:center;">
      <div class="font-semibold">${r.symbol}</div>
      <div class="text-slate-700 truncate">${r.name}</div>
      <div class="text-right tabular-nums">${fmt.format(r.price)}</div>
      <div class="text-right ${r.d1>=0?'text-emerald-600':'text-rose-600'}">${pct(r.d1)}</div>
      <div class="text-right ${r.w1>=0?'text-emerald-600':'text-rose-600'}">${pct(r.w1)}</div>
      <div class="text-center"><div class="inline-block">${sparkline(r)}</div></div>
      <div class="text-right">${r.forecast.conf}%</div>
      <div class="text-right"><button class="px-3 py-1 rounded-lg bg-cyan-600 text-white">AI predikce</button></div>
    </div>
  `).join('');
}
