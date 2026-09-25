import { state } from '../state.js';
import { money, starRow } from '../ui.js';
import { dressSVG } from '../art.js';

export default {
  enter(root) {
    const items = state.gallery.slice(-24).reverse();
    root.innerHTML = `<div class="gallery"><h1>Gallery of Gowns</h1>${items.length ? `<div class="grid">${items.map((g) => `
      <div class="frame"><div class="inner">${dressSVG(g.design, { quality: g.quality })}<div class="cap"><b>${g.name}</b><br>${g.client}<br>${starRow(g.stars)} ${money(g.pay)}</div></div></div>`).join('')}</div>`
      : '<div class="empty">No dresses yet. Take a commission and your finished work will hang here.</div>'}</div>`;
  },
};
