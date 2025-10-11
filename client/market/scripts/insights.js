import { $, $$ } from './utils.js';

function impactBadge(sent){
  if(sent==='up') return '<span class="badge impact-up">↑ Pozitivní</span>';
  if(sent==='down') return '<span class="badge impact-down">↓ Negativní</span>';
  return '<span class="badge impact-flat">↔ Neutrální</span>';
}

function mockInsights(){
  return [
    { type:'macro', source:'Makro kalendář', time:'dnes', sentiment:'up', prob:65,
      title:'Nižší než očekávaná inflace (CPI)…',
      explainer:'Slabší CPI zvyšuje šanci na dřívější uvolnění měnové politiky…',
      take:['Pozitivní skew pro SPX/NDX','Tech/AI outperform','USD může oslabit; zlato drží bid'],
      tags:['Inflace','Sazby','Růstové akcie'], tickers:['SPX','NDX','AAPL','NVDA']
    },
    { type:'stock', source:'Earnings • NVDA', time:'včera', sentiment:'up', prob:70,
      title:'NVDA beat + zvýšený výhled DC/AI',
      explainer:'Objednávky v datacentrech přetrvávají, backlog je robustní…',
      take:['Pozitivní přelev pro polovodiče (AMD, TSM)','NDX citlivý na mega-cap tech'],
      tags:['Earnings','AI','Semiconductors'], tickers:['NVDA','AMD','NDX']
    }
  ];
}

export function mountInsights(onJumpToTicker){
  const container = $('#insights');
  const empty = $('#insEmpty');
  const search = $('#insSearch');
  const type = $('#insType');
  const sent = $('#insSent');
  const horizon = $('#insHorizon');
  const refresh = $('#insRefresh');

  let data = mockInsights();

  function render(list){
    container.innerHTML = '';
    if(!list.length){ empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    list.forEach(n=>{
      const tickers = (n.tickers||[]).map(t=>`<button class="pill text-sm bg-white hover:bg-slate-50" data-jump="${t}">${t}</button>`).join(' ');
      const card = document.createElement('article');
      card.className='ins-card p-4';
      card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <div><div class="text-sm text-slate-500">${n.source} • ${n.time}</div><h3 class="mt-0.5 font-semibold">${n.title}</h3></div>
          <div class="text-right shrink-0">${impactBadge(n.sentiment)}<div class="text-xs text-slate-500 mt-1">Pravděpodobnost: <b>${n.prob}%</b></div></div>
        </div>
        <p class="mt-2 text-sm">${n.explainer}</p>
        ${n.take ? `<ul class="mt-2 text-sm list-disc pl-5">${n.take.map(t=>`<li>${t}</li>`).join('')}</ul>`:''}
        <div class="mt-3 flex flex-wrap gap-2">${(n.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        ${tickers? `<div class="mt-3 flex flex-wrap gap-2 items-center"><span class="text-xs text-slate-500">Vztahuje se k:</span>${tickers}</div>`:''}
      `;
      container.appendChild(card);
    });

    $$('[data-jump]', container).forEach(b=>{
      b.addEventListener('click', ()=> onJumpToTicker(b.dataset.jump));
    });
  }

  function filter(){
    const term = (search.value||'').trim().toLowerCase();
    let list = data.filter(n=>{
      const okType = !type.value || n.type===type.value;
      const okSent = !sent.value || n.sentiment===sent.value;
      const okText = !term || n.title.toLowerCase().includes(term);
      return okType && okSent && okText;
    });
    render(list);
  }

  refresh?.addEventListener('click', ()=>{
    refresh.disabled = true; refresh.textContent='Načítám…';
    // TODO: fetch('/api/trader-ai/news?horizon='+horizon.value) …
    data = mockInsights();
    filter();
    refresh.disabled = false; refresh.textContent='Aktualizovat';
  });

  search?.addEventListener('input', filter);
  type?.addEventListener('change', filter);
  sent?.addEventListener('change', filter);
  horizon?.addEventListener('change', ()=>{}); // připraveno pro backend

  // initial
  filter();
}
