// client/market/scripts/market.js
// Hlavní vstup pro Market Scanner – upravené importy + napojení všech modulů.

import { fmt, i18n, pct, el, saveLS, loadLS } from './utils.js';
import { sparkSVG } from './sparkline.js';
import { baseRows, extraRows } from './data.js';
import { initInsights, refreshInsights } from './insights.js';
import { initAlertModal, openAlert } from './alerts.js';

// NOVÝ MODUL – analýzy a pomocné výpočty (nezapomeň mít soubor: client/market/scripts/modules/analysis.js)
import { makeForecastLine, sentimentFromMoves, sortRows } from './modules/analysis.js';

// ------- DOM refs -------
const dom = {
  rows: el('#rows'),
  count: el('#countLabel'),
  more: el('#moreBtn'),

  q: el('#q'),
  type: el('#typeFilter'),
  sort: el('#sortBy'),
  wlOnly: el('#wlOnly'),

  watchBar: el('#watchlistBar'),
  watchChips: el('#watchlistChips'),

  // Insights
  insSearch: el('#insSearch'),
  insType: el('#insType'),
  insSent: el('#insSent'),
  insHorizon: el('#insHorizon'),
  insRefresh: el('#insRefresh'),
};

const state = {
  showingAll: false,
  currentSetup: '',
  watchlist: loadLS('sm_watchlist', []),
};

// ------- Helpers -------
function allRows(){ return state.showingAll ? baseRows.concat(extraRows) : baseRows.slice(); }

function toggleWatch(symbol){
  const i = state.watchlist.indexOf(symbol);
  if(i>=0) state.watchlist.splice(i,1); else state.watchlist.push(symbol);
  saveLS('sm_watchlist', state.watchlist);
  renderWatchlist(); apply();
}

function renderWatchlist(){
  const bar = dom.watchBar, chips = dom.watchChips;
  chips.innerHTML = '';
  state.watchlist.forEach(s=>{
    const b = document.createElement('button');
    b.className = 'pill bg-white hover:bg-slate-50 text-sm';
    b.textContent = s;
    b.addEventListener('click', ()=>{ dom.q.value=s; apply(); });
    b.addEventListener('contextmenu', (e)=>{ e.preventDefault(); toggleWatch(s); });
    chips.appendChild(b);
  });
  bar.classList.toggle('hidden', state.watchlist.length===0);
}

function starSVG(active){
  return `<svg class="star ${active?'active':''}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.3l-5.6 3 1.1-6.4L3 9.8l6.4-.9L12 3l2.6 5.9 6.4.9-4.5 4.1 1.1 6.4z"/></svg>`;
}
function bellSVG(){
  return `<svg class="w-[18px] h-[18px] text-slate-600" viewBox="0 0 24 24" fill="none"><path d="M15 17H5l2-2v-3a5 5 0 0 1 10 0v3l2 2h-4m-6 0a3 3 0 0 0 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ------- Render -------
function render(list){
  dom.rows.innerHTML = '';

  list.forEach((r)=>{
    const inWL = state.watchlist.includes(r.symbol);

    // normalizace forecastu
    const f = makeForecastLine({
      min: r.forecast.min,
      avg: r.forecast.avg,
      max: r.forecast.max,
      now: r.price
    });

    // řádek
    const row = document.createElement('div');
    row.className = 'row row-head border-t border-slate-100';
    row.innerHTML = `
      <div class="table-grid px-4 py-3">
        <div class="font-semibold cell-nowrap flex items-center gap-1">
          <span>${r.symbol}</span>
          <svg class="chev w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="text-slate-700 truncate">${r.name}</div>
        <div class="text-right tabular-nums cell-nowrap">${fmt.format(r.price)}</div>
        <div class="text-right tabular-nums cell-nowrap ${r.d1>=0?'text-emerald-600':'text-rose-600'}">${pct(r.d1)}</div>
        <div class="text-right tabular-nums cell-nowrap ${r.w1>=0?'text-emerald-600':'text-rose-600'}">${pct(r.w1)}</div>
        <div class="text-center tabular-nums cell-nowrap text-[15px]">${i18n.format(f.min)} / <span class="font-semibold">${i18n.format(f.avg)}</span> / ${i18n.format(f.max)}</div>
        <div class="text-right tabular-nums cell-nowrap">${r.forecast.conf}%</div>
        <div class="actions cell-nowrap"><button class="btn btn-primary" data-ai="${r.symbol}">AI predikce</button></div>
      </div>
    `;

    // detail
    const det = document.createElement('div');
    det.className = 'details px-6 pb-5 pt-4 bg-slate-50/60 border-t';
    det.innerHTML = `
      <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="text-sm text-slate-600"><b>${r.symbol}</b> • ${r.name}</div>
          <div class="flex items-center gap-2">
            <button class="iconbtn" title="${inWL?'Odebrat z watchlistu':'Přidat do watchlistu'}" data-watch="${r.symbol}">${starSVG(inWL)}</button>
            <button class="iconbtn" title="Vytvořit alert" data-alert="${r.symbol}">${bellSVG()}</button>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-1 place-items-center">
          <div class="w-full max-w-[680px]">
            ${sparkSVG({ forecast: f, price: r.price })}
          </div>
        </div>

        <div class="mt-3 targets">
          <span class="tg"><span class="dot min"></span>Min ${i18n.format(f.min)}</span>
          <span class="tg"><span class="dot avg"></span>Avg ${i18n.format(f.avg)}</span>
          <span class="tg"><span class="dot max"></span>Max ${i18n.format(f.max)}</span>
          <span class="tg"><span class="dot now"></span>Now ${fmt.format(r.price)}</span>
        </div>

        <p class="mt-3 text-sm text-slate-600 text-center">
          Predikce (1Y): pásmo <b>${i18n.format(f.min)} – ${i18n.format(f.max)}</b>, střed <b>${i18n.format(f.avg)}</b>.
          Confidence <b>${r.forecast.conf}%</b>.
        </p>

        <div class="mt-3 flex justify-center">
          <button class="btn btn-primary" data-ai="${r.symbol}">AI predikce</button>
        </div>
      </div>
    `;

    dom.rows.appendChild(row);
    dom.rows.appendChild(det);

    // toggle detail
    row.addEventListener('click',(e)=>{
      if(e.target.closest('.actions') || e.target.closest('button')) return;
      row.classList.toggle('open');
      if(row.classList.contains('open')) det.classList.remove('hidden'); else det.classList.add('hidden');
    });
  });

  // akce
  dom.rows.querySelectorAll('[data-watch]').forEach(b=>{
    b.addEventListener('click',(e)=>{
      e.stopPropagation();
      const sym = b.getAttribute('data-watch');
      toggleWatch(sym);
      b.innerHTML = starSVG(state.watchlist.includes(sym));
    });
  });

  dom.rows.querySelectorAll('[data-alert]').forEach(b=>{
    b.addEventListener('click',(e)=>{
      e.stopPropagation();
      const s = b.getAttribute('data-alert');
      const found = allRows().find(x=>x.symbol===s);
      openAlert(found.symbol, found.price);
    });
  });

  dom.rows.querySelectorAll('[data-ai]').forEach(b=>{
    b.addEventListener('click',(e)=>{
      e.stopPropagation();
      const s = b.getAttribute('data-ai');
      alert('AI predikce pro '+s+':\n• Směr: '+ sentimentFromMoves(0.8,0.2) + '\n• Úrovně: viz min/avg/max v panelu.');
    });
  });

  dom.count.textContent = 'Zobrazeno: ' + list.length + (state.showingAll ? ' / ' + (baseRows.length+extraRows.length) : '');
}

// ------- Filtrování/řazení -------
function apply(){
  const term = (dom.q.value||'').trim().toLowerCase();
  let pool = state.showingAll ? baseRows.concat(extraRows) : baseRows.slice();

  if(state.currentSetup){
    pool = pool.filter(r=>{
      if(state.currentSetup==='earn') return r.signals?.includes('earn');
      if(state.currentSetup==='mean') return r.signals?.includes('mean');
      if(state.currentSetup==='vol')  return r.signals?.includes('vol');
      return r.signals?.includes('breakout');
    });
  }

  let out = pool.filter(r=>{
    const okType = !dom.type.value || r.type===dom.type.value;
    const okSearch = !term || r.symbol.toLowerCase().includes(term) || r.name.toLowerCase().includes(term);
    const okWL = !dom.wlOnly.checked || state.watchlist.includes(r.symbol);
    return okType && okSearch && okWL;
  });

  out = sortRows(out, dom.sort.value);
  render(out);
}

// ------- Init -------
function initControls(){
  document.querySelectorAll('[data-setup]').forEach(b=>{
    b.addEventListener('click', function(){ state.currentSetup=this.dataset.setup||''; apply(); });
  });

  dom.q.addEventListener('input', apply);

  dom.type.addEventListener('change', ()=>{
    if(dom.insType && dom.insType.value!==dom.type.value) dom.insType.value = dom.type.value;
    apply();
  });

  dom.sort.addEventListener('change', apply);
  dom.wlOnly.addEventListener('change', apply);

  dom.more.addEventListener('click', ()=>{
    state.showingAll = !state.showingAll;
    dom.more.textContent = state.showingAll ? 'Zobrazit méně' : 'Zobrazit vše';
    apply();
  });
}

function boot(){
  renderWatchlist();
  initControls();

  initAlertModal();

  initInsights({
    onJumpToTicker: (t)=>{ dom.q.value=t; apply(); scrollTo({top:0,behavior:'smooth'}); },
    linkFilters: { typeSelect: dom.insType, sentSelect: dom.insSent, searchInput: dom.insSearch }
  });

  if(dom.insRefresh){
    dom.insRefresh.addEventListener('click', ()=>{
      dom.insRefresh.disabled = true;
      dom.insRefresh.textContent = 'Načítám…';
      refreshInsights().finally(()=>{
        dom.insRefresh.disabled=false; dom.insRefresh.textContent='Aktualizovat';
      });
    });
  }

  apply(); // první vykreslení
}

window.addEventListener('DOMContentLoaded', boot);
