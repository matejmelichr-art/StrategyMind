// Entrypoint marketu – jen mountne demo tabulku
import { renderTable } from './modules/render-table.js';
import { data } from '../data/demo.js';

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('market-table');
  if (mount) renderTable(mount, data);
});
