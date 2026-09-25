import { state, save, level } from '../state.js';
import { toast, money, renderHud, $ } from '../ui.js';
import { swatchSVG } from '../art.js';
import { FABRICS, TRIMS } from '../data.js';
import { sfx } from '../audio.js';


function trimIcon(id) {
  const pearl = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6efdf" stroke="#a99a80"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 3}" fill="#fff"/>`;
  const art = {
    ribbon: '<path d="M10,50 C40,20 70,80 100,40" stroke="#d25a6e" stroke-width="12" fill="none"/><path d="M10,46 C40,16 70,76 100,36" stroke="#fff" stroke-opacity=".4" stroke-width="2" fill="none"/>',
    buttons: [30, 55, 80].map((x) => `${pearl(x, 42, 9)}<circle cx="${x - 2}" cy="${42}" r="1.2" fill="#8d7c62"/><circle cx="${x + 2}" cy="${42}" r="1.2" fill="#8d7c62"/>`).join(''),
    lace: `<rect x="8" y="24" width="96" height="12" fill="#fbf6ea" stroke="#cfc3ad"/>${[...Array(10)].map((_, i) => `<circle cx="${13 + i * 10}" cy="40" r="5" fill="#fbf6ea" stroke="#cfc3ad"/><circle cx="${13 + i * 10}" cy="41" r="1.4" fill="#cfc3ad"/>`).join('')}`,
    bows: '<g transform="translate(55,42) scale(1.6)"><path d="M0,0 C-6,-9 -17,-9 -17,0 C-17,9 -6,9 0,0 Z M0,0 C6,-9 17,-9 17,0 C17,9 6,9 0,0 Z" fill="#9fc4e2" stroke="#4a6f8e"/><circle r="3.2" fill="#8ab0d0"/><path d="M-1,2 L-7,15 L-1,12 Z M1,2 L7,15 L1,12 Z" fill="#9fc4e2"/></g>',
    pearls: [...Array(9)].map((_, i) => pearl(15 + i * 10, 42 + Math.sin(i) * 8, 4.5)).join(''),
    rosettes: [30, 58, 86].map((x, i) => `<circle cx="${x}" cy="42" r="12" fill="${['#d25a6e', '#f2b0a8', '#b9a4d8'][i]}"/><path d="M${x},42 c4,-3 3,5 -2,4 c-8,-1 -6,-9 1,-9 c9,1 9,11 1,13" fill="none" stroke="#6a2a3a"/>`).join(''),
    jet: [...Array(9)].map((_, i) => `<circle cx="${15 + i * 10}" cy="${42 + Math.sin(i) * 8}" r="4.5" fill="#1b181e"/><circle cx="${14 + i * 10}" cy="${40 + Math.sin(i) * 8}" r="1.3" fill="#888"/>`).join(''),
    sequins: [...Array(24)].map((_, i) => `<circle cx="${14 + (i % 8) * 12}" cy="${26 + Math.floor(i / 8) * 13}" r="5" fill="${i % 3 ? '#e8c46a' : '#fff6c8'}" stroke="#a8812f" stroke-width=".6"/>`).join(''),
    embroidery: '<g fill="none" stroke="#d9b25a" stroke-width="2"><path d="M10,42 C25,20 35,64 55,42 C75,20 85,64 100,42"/><circle cx="32" cy="42" r="4"/><circle cx="78" cy="42" r="4"/></g>',
    crystals: [...Array(7)].map((_, i) => { const x = 16 + i * 13, y = 42 + (i % 2 ? -8 : 8); return `<path d="M${x},${y - 8} L${x + 3},${y} L${x},${y + 8} L${x - 3},${y} Z M${x - 8},${y} L${x},${y + 3} L${x + 8},${y} L${x},${y - 3} Z" fill="#f4fbff" stroke="#9fc6e8"/>`; }).join(''),
  };
  return `<svg class="trim-icon" viewBox="0 0 110 84">${art[id] || ''}</svg>`;
}

export default {
  enter(root) {
    let tab = 'fabrics';
    const lvl = level();
    root.innerHTML = `<div class="market"><div class="tabs"><h1>Fabric Market</h1><button class="tab" data-t="fabrics">Fabrics</button><button class="tab" data-t="trims">Trims &amp; Notions</button></div><div class="shelf" id="shelf"></div></div>`;
    function buy(kind, id, qty, price) {
      const cost = price * qty;
      if (state.money < cost) { sfx.error(); toast('Not enough money', 'bad'); return; }
      state.money -= cost;
      state[kind][id] = Math.round(((state[kind][id] || 0) + qty) * 100) / 100;
      sfx.coin(); save(); renderHud(); refresh();
    }
    function refresh() {
      root.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
      const list = tab === 'fabrics' ? FABRICS : TRIMS;
      $('#shelf', root).innerHTML = list.map((x) => {
        const locked = x.lvl > lvl;
        const have = tab === 'fabrics' ? `${(state.fabrics[x.id] || 0).toFixed(1)} m` : `${state.trims[x.id] || 0} packs`;
        const q = tab === 'fabrics' ? [1, 5] : [1, 3];
        return `<div class="card${locked ? ' locked' : ''}">${locked ? `<span class="lockbadge">Level ${x.lvl}</span>` : ''}
          ${tab === 'fabrics' ? swatchSVG(x.id, ['blush', 'sage', 'sky', 'ivory', 'lavender', 'navy'][FABRICS.indexOf(x) % 6], 110, 80) : trimIcon(x.id)}
          <h4>${x.name}</h4><div class="price">${money(x.price)} per ${tab === 'fabrics' ? 'metre' : 'pack'}</div>
          <div class="tagchips">${Object.keys(x.tags).join(' · ')}</div>
          <div class="stock">You have <b>${have}</b></div>
          <div class="buy">${q.map((n) => `<button class="btn small" data-id="${x.id}" data-n="${n}" data-p="${x.price}">+${n}${tab === 'fabrics' ? 'm' : ''} &middot; ${money(x.price * n)}</button>`).join('')}</div></div>`;
      }).join('');
      root.querySelectorAll('.buy .btn').forEach((b) => { b.onclick = () => buy(tab, b.dataset.id, +b.dataset.n, +b.dataset.p); });
    }
    root.querySelectorAll('.tab').forEach((b) => { b.onclick = () => { tab = b.dataset.t; sfx.page(); refresh(); }; });
    refresh();
  },
};
