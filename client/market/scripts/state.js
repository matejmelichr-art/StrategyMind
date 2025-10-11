import { saveLS, loadLS } from './utils.js';
import { baseRows, extraRows } from './data.js';

const LS_WL = 'sm.market.watchlist';
const LS_ALERTS = 'sm.market.alerts';

export const state = {
  showingAll: false,
  currentSetup: '',
  query: '',
  typeFilter: '',
  sortBy: 'symbol',
  wlOnly: false,

  watchlist: loadLS(LS_WL, []),
  alerts: loadLS(LS_ALERTS, []),

  get pool() { return this.showingAll ? baseRows.concat(extraRows) : baseRows.slice(); },
  get rows() {
    let list = this.pool;

    if (this.currentSetup) {
      const s = this.currentSetup;
      list = list.filter(r => {
        if (s === 'earn') return r.signals?.includes('earn');
        if (s === 'mean') return r.signals?.includes('mean');
        if (s === 'vol')  return r.signals?.includes('vol');
        return r.signals?.includes('breakout');
      });
    }

    if (this.typeFilter) list = list.filter(r => r.type === this.typeFilter);

    const term = (this.query || '').trim().toLowerCase();
    if (term) list = list.filter(r => r.symbol.toLowerCase().includes(term) || r.name.toLowerCase().includes(term));

    if (this.wlOnly) list = list.filter(r => this.watchlist.includes(r.symbol));

    switch (this.sortBy) {
      case 'price': list.sort((a,b)=>b.price-a.price); break;
      case 'w1':    list.sort((a,b)=>b.w1-a.w1); break;
      case 'conf':  list.sort((a,b)=>b.forecast.conf-a.forecast.conf); break;
      default:      list.sort((a,b)=>a.symbol.localeCompare(b.symbol));
    }
    return list;
  },

  toggleWatch(symbol){
    const i = this.watchlist.indexOf(symbol);
    if (i>=0) this.watchlist.splice(i,1); else this.watchlist.push(symbol);
    saveLS(LS_WL, this.watchlist);
  },

  addAlert(rec){
    const alerts = this.alerts.slice();
    alerts.push(rec);
    this.alerts = alerts;
    saveLS(LS_ALERTS, alerts);
  }
};
