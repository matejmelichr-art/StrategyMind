import { $, fmt } from './utils.js';
import { state } from './state.js';

export function mountAlerts() {
  const overlay = $('#alertOverlay');
  const modal = $('#alertModal');
  const closeBtn = $('#alertClose');
  const saveBtn = $('#alertSave');

  function close(){ overlay.classList.add('hidden'); modal.classList.add('hidden'); }
  function open(){ overlay.classList.remove('hidden'); modal.classList.remove('hidden');
    requestAnimationFrame(()=> modal.querySelector('.fade-enter')?.classList.add('fade-enter-active'));
  }

  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);

  saveBtn?.addEventListener('click', function(){
    const rec = {
      symbol: $('#alertSymbol').value,
      cond: $('#alertCond').value,
      target: parseFloat($('#alertTarget').value),
      note: $('#alertNote').value || '',
      created_at: Date.now()
    };
    if (!isFinite(rec.target)) { alert('Zadej platnou cílovou cenu.'); return; }
    state.addAlert(rec);
    close();
    alert('Alert uložen (demo).');
  });

  // veřejná funkce:
  return function openAlert(symbol, priceNow){
    $('#alertSymbol').value = symbol;
    $('#alertPriceNow').value = fmt.format(priceNow);
    $('#alertTarget').value = '';
    $('#alertCond').value = 'above';
    $('#alertNote').value = '';
    open();
  };
}
