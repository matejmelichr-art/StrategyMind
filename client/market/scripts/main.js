import { API_BASE, apiFetch } from './config.js';

// DEMO DATA, ať stránka žije i bez backendu
const DATA = [
  {type:'stock',symbol:'AAPL',name:'Apple Inc.',price:219.85,
    forecast:{min:165,avg:245,max:310,conf:72},
    news:[
      "CPI níž → pravděpodobnost dřívějšího uvolnění sazeb.",
      "iPhone mix lepší než oček. v USA; Čína stabilizace.",
      "Capex do AI/On-device ML – margin tailwind 2025."
    ]
  },
  {type:'stock',symbol:'NVDA',name:'NVIDIA Corporation',price:241.8,
    forecast:{min:128,avg:281,max:498,conf:72},
    news:["Datacentra backlog > 2Q","Exportní limity částečně zaceněné","Sleduj marže a supply cadence." ]
  },
  {type:'crypto',symbol:'BTCUSD',name:'Bitcoin',price:67200,
    forecast:{min:42000,avg:88000,max:120000,conf:58},
    news:["ETF inflows drží poptávku.","Víkendová volatilita.","Slabší USD bývá pro krypto podpůrné."]
  }
];

// Helpers
const $ = q => document.querySelector(q);
const fmt = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});
const i18n = new Intl.NumberFormat('cs-CZ');

let current = null;

// ===== UI =====
function renderList(filter=''){
  const box = $('#tickerList');
  box.innerHTML = '';
  DATA.filter(x => (x.symbol + x.name).toLowerCase().includes(filter.toLowerCase()))
      .forEach(r=>{
        const b = document.createElement('button');
        b.className = 'w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 border border-slate-200';
        b.innerHTML = `<div class="font-medium">${r.symbol}</div>
                       <div class="text-xs text-slate-500 truncate">${r.name}</div>`;
        b.onclick = () => pick(r.symbol);
        box.appendChild(b);
      });
}
function pick(sym){
  current = DATA.find(x=>x.symbol===sym) || DATA[0];
  $('#pick').textContent = `${current.symbol} • ${current.name}`;
  $('#priceBadge').textContent = `Cena: ${fmt.format(current.price)}`;
  $('#forecastBadge').textContent = `1Y: ${i18n.format(current.forecast.min)} / ${i18n.format(current.forecast.avg)} / ${i18n.format(current.forecast.max)}`;
  $('#confBadge').textContent = `Conf: ${current.forecast.conf}%`;
  renderNews();
  renderChart();
  renderScenarios();
}
function renderNews(){
  const html = `
    <div class="text-sm text-slate-700">Ticker: <b>${current.symbol}</b> • ${current.name}</div>
    <ul class="mt-2 list-disc pl-5 text-sm">
      ${current.news.map(n=>`<li>${n}</li>`).join('')}
    </ul>`;
  $('#newsBody').innerHTML = html;
}
function renderChart(){
  const g = document.getElementById('chart-layer');
  g.innerHTML = '';
  const pastX0=50,pastX1=500,futX0=pastX1,futX1=850;
  const yMin=40,yMax=250;
  const {min:spanMin, avg:spanAvg, max:spanMax} = current.forecast;
  const scaleY = v => {
    const lo = spanMin*0.9, hi = spanMax*1.1;
    const t = (v-lo)/(hi-lo); return yMax - t*(yMax-yMin);
  };
  // demo minulost
  const past = [0,0.15,0.05,0.3,0.2,0.45,0.35,0.55,0.5,0.6].map((t,i)=>[
    pastX0 + (pastX1-pastX0)*i/9, scaleY(spanMin + t*(spanMax-spanMin))
  ]);
  g.appendChild(path('past', past));
  // futura
  const yNow = scaleY(current.price), yAvg = scaleY(spanAvg), yBull = scaleY(spanMax), yBear = scaleY(spanMin);
  g.appendChild(line('base', futX0, yNow, futX1, yAvg));
  g.appendChild(line('bull future', futX0, yNow, futX1, yBull));
  g.appendChild(line('bear future', futX0, yNow, futX1, yBear));
  g.appendChild(text('label', futX1-40, yBull-6, 'Optimistic'));
  g.appendChild(text('label', futX1-40, yAvg-6, 'Base'));
  g.appendChild(text('label', futX1-40, yBear-6, 'Defensive'));
}
function path(cls, pts){
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('class',cls);
  p.setAttribute('d','M '+pts.map(xy=>xy.join(',')).join(' L '));
  return p;
}
function line(cls,x1,y1,x2,y2){
  const l=document.createElementNS('http://www.w3.org/2000/svg','line');
  l.setAttribute('class',cls);
  l.setAttribute('x1',x1); l.setAttribute('y1',y1);
  l.setAttribute('x2',x2); l.setAttribute('y2',y2);
  return l;
}
function text(cls,x,y,txt){
  const t=document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('class',cls); t.setAttribute('x',x); t.setAttribute('y',y); t.textContent=txt; return t;
}
function renderScenarios(){
  const box = $('#scenarios'); box.innerHTML='';
  [
    {k:'Optimistic',v:current.forecast.max,desc:'Růstový scénář (momentum / příznivé makro).'},
    {k:'Base',v:current.forecast.avg,desc:'Základ: konsensus / mean reversion.'},
    {k:'Defensive',v:current.forecast.min,desc:'Riziko: utažené podmínky / šoky.'}
  ].forEach(s=>{
    const el=document.createElement('div');
    el.className='rounded-xl border border-slate-200 p-3';
    el.innerHTML=`<div class="text-sm text-slate-500">${s.k}</div>
      <div class="text-2xl font-semibold">${i18n.format(s.v)}</div>
      <p class="text-sm text-slate-600 mt-1">${s.desc}</p>`;
    box.appendChild(el);
  });
}

// ===== API tlačítka =====
function setBusy(sel, busy){
  const el = document.querySelector(sel);
  if(!el) return;
  el.disabled = busy;
  el.style.opacity = busy ? .6 : 1;
  el.textContent = busy ? '⏳ Probíhá…' : (sel==='#btnAnalyze' ? 'AI analyzovat' : 'AI news');
}

async function runAnalyze(){
  setBusy('#btnAnalyze', true);
  try{
    const res = await apiFetch('/api/analyze', {
      method: 'POST',
      body: {
        symbol: current.symbol,
        price: current.price,
        span: current.forecast,
        context: {source:'market-console'}
      }
    });
    if (res?.span) current.forecast = res.span;
    if (typeof res?.confidence === 'number') {
      $('#confBadge').textContent = `Conf: ${res.confidence}%`;
    }
    renderChart(); renderScenarios();
    if (Array.isArray(res?.reasons) && res.reasons.length){
      $('#newsBody').innerHTML = `<ul class="list-disc pl-5 text-sm">${res.reasons.map(x=>`<li>${x}</li>`).join('')}</ul>`;
    }
  }catch(e){
    console.error(e);
    alert('API /api/analyze selhalo: ' + e.message);
  }finally{
    setBusy('#btnAnalyze', false);
  }
}

async function runNews(){
  setBusy('#btnNews', true);
  try{
    const res = await apiFetch(`/api/news?q=${encodeURIComponent(current.symbol || 'markets')}`);
    const items = Array.isArray(res?.items) ? res.items : [];
    $('#newsBody').innerHTML = items.slice(0,8).map(i=>`
      <div class="mb-2">
        <a href="${i.url}" target="_blank" class="text-brand-700 hover:underline">${i.title}</a>
        <div class="text-xs text-slate-500">${i.source || ''}${i.snippet ? ' — ' + i.snippet : ''}</div>
      </div>`).join('') || '<div class="text-sm text-slate-500">Žádné položky</div>';
  }catch(e){
    console.error(e);
    alert('API /api/news selhalo: ' + e.message);
  }finally{
    setBusy('#btnNews', false);
  }
}

// Init
document.getElementById('btnAnalyze').addEventListener('click', runAnalyze);
document.getElementById('btnNews').addEventListener('click', runNews);
document.getElementById('q').addEventListener('input', e=>renderList(e.target.value));
renderList(); pick(DATA[0].symbol);

// Pro snadnou diagnostiku v konzoli
window.__SM__ = { API_BASE };
console.log('StrategyMind Market Console ready. API_BASE =', API_BASE);
