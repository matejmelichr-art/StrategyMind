// formátování + DOM + LS helpers
export const fmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
export const i18n = new Intl.NumberFormat('cs-CZ');

export function pct(v) {
  if (!isFinite(v)) return '—';
  const s = v >= 0 ? '+' : '';
  return s + v.toFixed(2) + '%';
}

export const $ = (q, ctx = document) => ctx.querySelector(q);
export const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

export function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
export function loadLS(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
