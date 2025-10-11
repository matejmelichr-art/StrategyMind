import { $, $$, fmt, i18n, pct } from './utils.js';
import { state } from './state.js';
import { sparkSVG } from './sparkline.js';

function starSVG(active){return `<svg class="star ${active?'active':''}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.3l-5.6 3 1.1-6.4L3 9.8l6.4-.9L12 3l2.6 5.9 6.4.9-4.5 4.1 1.1 6.4z"/></svg>`}
function bellSVG(){return '<svg class="w-[18px] h-[18px] text-slate-600" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 17H5l2-2v-3a5 5 0 0 1 10 0v3l2 2h-4m-6 0a3 3 0 0 0 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

export function renderWatchlist() {
  const bar = $('#watchlistBar'), chips = $('#watchlistChips');
  chips.innerHTML = '';
  state.watchlist.forEach(s=>{
    const b = document.createElement('button');
    b.className='pill bg-white hover:bg-slate-50 text-sm'; b.textContent=s;
    b.addEventListener('click', ()=> { $('#q').value=s; state.query=s; apply(); });
    b.addEventListener('contextmenu', (e)=>{ e.preventDefault(); state.toggleWatch(s); renderWatchlist(); apply(); });
    chips.appendChild(b);
  });
  bar.classList.toggle('hidden', state.watchlist.length===0);
}

export function renderTable(openAlert){
  const container = $('#market-table');
  container.innerHTML = '';

  state.rows.forEach(r=>{
    const inWL = state.watchlist.includes(r.symbol);

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
        <div class="text-right tabular-nums cell-nowrap ${(r.d1>=0?'text-emerald-600':'text-rose-600')}">${pct(r.d1)}</div>
        <div class="text-right tabular-nums cell-nowrap ${(r.w1>=0?'text-emerald-600':'text-rose-600')}">${pct(r.w1)}</div>
        <div class="text-center tabular-nums cell-nowrap text-[15px]">${i18n.format(r.forecast.min)} / <span class="font-semibold">${i18n.format(r.forecast.avg)}</span> / ${i18n.format(r.forecast.max)}</div>
        <div class="text-right tabular-nums cell-nowrap">${r.forecast.conf}%</div>
        <div class="actions cell-nowrap"><button class="btn btn-primary" data-ai="${r.symbol}">AI predikce</button></div>
      </div>`;

    const det = document.createElement('div');
    det.className='details px-6 pb-5 pt-4 bg-slate-50/60 border-t';
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
          <div class="w-full max-w-[680px]">${sparkSVG(r)}</div>
        </div>
        <div class="mt-3 targets">
          <span class="tg"><span class="dot min"></span>Min ${i18n.format(r.forecast.min)}</span>
          <span class="tg"><span class="dot avg"></span>Avg ${i18n.format(r.forecast.avg)}</span>
          <span class="tg"><span class="dot max"></span>Max ${i18n.format(r.forecast.max)}</span>
          <span class="tg"><span class="dot now"></span>Now ${fmt.format(r.price)}</span>
        </div>
        <p class="mt-3 text-sm text-slate-600 text-center">Predikce (1Y): pásmo <b>${i18n.format(r.forecast.min)} – ${i18n.format(r.forecast.max)}</b>, střed <b>${i18n.format(r.forecast.avg)}</b>. Confidence <b>${r.forecast.conf}%</b>.</p>
        <div class="mt-3 flex justify-center"><button class="btn btn-primary" data-ai="${r.symbol}">AI predikce</button></div>
      </div>`;

    container.appendChild(row);
    container.appendChild(det);

    row.addEventListener('click', (e)=>{
      if (e.target.closest('.actions') || e.target.closest('button')) return;
      row.classList.toggle('open');
      if(row.classList.contains('open')) det.classList.remove('hidden'); else det.classList.add('hidden');
    });
  });

  // listeners
  $$('#market-table [data-watch]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      const sym = b.getAttribute('data-watch');
      state.toggleWatch(sym);
      b.innerHTML = starSVG(state.watchlist.includes(sym));
      renderWatchlist();
    });
  });

  $$('#market-table [data-alert]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      const s = b.getAttribute('data-alert');
      const found = state.pool.find(x=>x.symbol===s);
      if (found) openAlert(found.symbol, found.price);
    });
  });

  $$('#market-table [data-ai]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      const sym = b.getAttribute('data-ai');
      alert(`AI predikce pro ${sym}:\n• Směr: ↑ pravděpodobnost 60–70%\n• Úrovně: orientačně min/avg/max z panelu.`);
    });
  });
}

export function wireToolbar(apply){
  const q = $('#q'), type = $('#typeFilter'), sortBy = $('#sortBy'), wlOnly = $('#wlOnly');
  $$('[data-setup]').forEach(b=> b.addEventListener('click', ()=>{ state.currentSetup=b.dataset.setup||''; apply(); }));

  q.addEventListener('input', ()=>{ state.query=q.value; apply(); });
  type.addEventListener('change', ()=>{
    state.typeFilter = type.value;
    // propoj s insights selectem
    const insType = $('#insType'); if (insType && insType.value!==type.value) insType.value = type.value;
    apply();
  });
  sortBy.addEventListener('change', ()=>{ state.sortBy = sortBy.value; apply(); });
  wlOnly.addEventListener('change', ()=>{ state.wlOnly = wlOnly.checked; apply(); });

  $('#moreBtn')?.addEventListener('click', function(){
    state.showingAll = !state.showingAll;
    this.textContent = state.showingAll ? 'Zobrazit méně' : 'Zobrazit vše';
    apply();
  });
}

export function updateCountLabel(){
  const count = state.rows.length;
  const total = state.showingAll ? (state.pool.length) : null;
  $('#countLabel').textContent = 'Zobrazeno: ' + count + (total ? (' / ' + total) : '');
}

export function apply(openAlertCb){
  renderTable(openAlertCb);
  updateCountLabel();
}
