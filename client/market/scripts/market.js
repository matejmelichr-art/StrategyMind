import { $, $$ } from './utils.js';
import { state } from './state.js';
import { wireToolbar, renderWatchlist, apply as applyUI } from './ui.js';
import { mountAlerts } from './alerts.js';
import { mountInsights } from './insights.js';

// Entry – spouští se po načtení stránky
window.addEventListener('DOMContentLoaded', ()=>{
  // 1) Alerts modal
  const openAlert = mountAlerts();

  // 2) Toolbar + základní render
  wireToolbar(()=> applyUI(openAlert));
  renderWatchlist();
  applyUI(openAlert);

  // 3) Insights – napojení tlačítek s tickery na vyhledávání
  mountInsights((ticker)=>{
    const q = $('#q'); q.value = ticker; state.query = ticker;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    applyUI(openAlert);
  });

  // 4) klávesová zkratka pro search (/)
  document.addEventListener('keydown', (e)=>{
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault(); $('#q')?.focus();
    }
  });
});
