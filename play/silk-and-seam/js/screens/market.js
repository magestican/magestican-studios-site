import { state, save, level } from '../state.js';
import { toast, money, renderHud, tip, checkAchievements, $ } from '../ui.js';
import { swatchSVG } from '../art.js';
import { FABRICS, TRIMS, UPGRADES, SALE_EVERY } from '../data.js';
import { weeklySales, saleCost, tolerances, upgradeBlock, fabric, trim } from '../logic.js';
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
    
    fringe: '<rect x="10" y="20" width="90" height="9" rx="2" fill="#c7a04a" stroke="#8a6420"/>' + [...Array(30)].map((_, i) => { const x = 12 + i * 3; const sw = Math.sin(i * 1.7) * 2; return `<path d="M${x},29 q${(sw * 0.3).toFixed(1)},16 ${sw.toFixed(1)},${(34 + Math.sin(i * 2.3) * 4).toFixed(1)}" stroke="${['#e8c46a', '#c7a04a', '#8a6420'][i % 3]}" stroke-width="1.3" fill="none"/>`; }).join(''),
    smocking: '<rect x="10" y="16" width="90" height="52" rx="3" fill="#9fc4e2"/>' + [0, 1, 2, 3].map((r) => { const y = 26 + r * 11; let d = `M12,${y}`; for (let x = 12, k = 0; x < 98; x += 8, k++) d += ` L${x + 4},${y + (k % 2 ? -3 : 3)} L${x + 8},${y}`; return `<path d="${d}" fill="none" stroke="#d25a6e" stroke-width="1.6"/>` + [...Array(11)].map((_, k) => `<path d="M${16 + k * 8},${y + 4} q-1,3 0,5" stroke="#4a6f8e" stroke-opacity=".5" stroke-width="1.4" fill="none"/>`).join(''); }).join(''),
    feathers: [0, 1, 2].map((i) => { const x = 28 + i * 27, r = -25 + i * 25; return `<g transform="translate(${x},70) rotate(${r})"><path d="M0,0 C-2,-20 -1,-40 2,-58" stroke="#8a6f5a" stroke-width="1.4" fill="none"/>${[...Array(12)].map((_, k) => { const y = -8 - k * 4.2, w = 14 - Math.abs(k - 6) * 1.3; return `<path d="M${(k * 0.15).toFixed(1)},${y.toFixed(1)} q${-w * 0.6},-2 ${-w},6 M${(k * 0.15).toFixed(1)},${y.toFixed(1)} q${w * 0.6},-2 ${w},6" stroke="${['#f2b0a8', '#fbe4df', '#e8796d'][(i + k) % 3]}" stroke-width="1.6" fill="none"/>`; }).join('')}</g>`; }).join(''),
    rhinestones: '<path d="M8,48 C36,20 74,20 102,48" stroke="#9aa7b4" stroke-width="1.6" fill="none"/>' + [...Array(12)].map((_, i) => { const t = i / 11, x = 8 + t * 94, y = 48 - Math.sin(t * Math.PI) * 21; return `<rect x="${(x - 4).toFixed(1)}" y="${(y - 4).toFixed(1)}" width="8" height="8" rx="1.5" fill="#aeb9c4"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.1" fill="#eef6ff" stroke="#7f93a8" stroke-width=".6"/><circle cx="${(x - 1).toFixed(1)}" cy="${(y - 1).toFixed(1)}" r="1" fill="#fff"/>`; }).join(''),
  };
  return `<svg class="trim-icon" viewBox="0 0 110 84">${art[id] || ''}</svg>`;
}


const UP_ART = {
  pinking: '<g transform="translate(55,42) rotate(-20)"><path d="M-40,-3 L10,-3 L10,3 L-40,3 Z" fill="#c3c9d0" stroke="#4c525a"/>' + [...Array(10)].map((_, i) => `<path d="M${-40 + i * 5},3 l2.5,4 l2.5,-4" fill="#c3c9d0" stroke="#4c525a" stroke-width=".6"/>`).join('') + '<circle cx="14" cy="0" r="4" fill="#d6b060"/><ellipse cx="30" cy="-9" rx="11" ry="7" fill="none" stroke="#c0392b" stroke-width="4"/><ellipse cx="30" cy="9" rx="11" ry="7" fill="none" stroke="#c0392b" stroke-width="4"/></g>',
  service: '<path d="M30,62 L30,40 C30,26 50,20 62,26 L62,62 Z" fill="#8f6d27"/><path d="M26,64 H70" stroke="#5a3f18" stroke-width="4"/><path d="M62,30 C74,20 90,24 92,40" stroke="#6a655e" stroke-width="3" fill="none"/><path d="M92,40 l-4,14 l8,0 Z" fill="#e6c46a" stroke="#8a6420"/><circle cx="92" cy="60" r="2.4" fill="#e6c46a"/><circle cx="92" cy="68" r="1.8" fill="#e6c46a"/>',
  mat: '<rect x="12" y="16" width="86" height="54" rx="3" fill="#2f5a4a"/>' + [...Array(9)].map((_, i) => `<path d="M${20 + i * 10},16 V70" stroke="#dcefe6" stroke-opacity=".3"/>`).join('') + [...Array(5)].map((_, i) => `<path d="M12,${24 + i * 10} H98" stroke="#dcefe6" stroke-opacity=".3"/>`).join('') + '<path d="M12,16 H98" stroke="#f0dc78" stroke-width="2" stroke-opacity=".6"/>',
  lamp: '<path d="M55,70 H80 M67,70 V44 L40,24" stroke="#5a5a60" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M24,16 L52,16 L46,32 L30,32 Z" fill="#3f6048" stroke="#1f3024"/><path d="M30,32 L18,70 L58,70 L46,32 Z" fill="#fff6c8" fill-opacity=".45"/><circle cx="38" cy="33" r="4" fill="#fff6c8"/>',
  deluxe: '<rect x="14" y="20" width="80" height="22" rx="8" fill="#1d1a1c"/><rect x="22" y="36" width="20" height="30" rx="5" fill="#1d1a1c"/><path d="M18,66 H98" stroke="#8a5c34" stroke-width="5"/><path d="M34,28 C44,22 58,34 70,28" stroke="#d6b060" stroke-width="2" fill="none"/><circle cx="84" cy="31" r="6" fill="#c8c8cc"/><path d="M84,31 l3,-3" stroke="#333" stroke-width="1.5"/><path d="M32,66 V72" stroke="#c8c8cc" stroke-width="2"/><path d="M98,40 l-6,10 h5 l-4,10" stroke="#e6c46a" stroke-width="2" fill="none"/>',
};
const upIcon = (id) => `<svg class="trim-icon" viewBox="0 0 110 84">${UP_ART[id] || ''}</svg>`;

export default {
  enter(root) {
    let tab = 'fabrics';
    const lvl = level();
    const sales = weeklySales(state.made, lvl);
    const saleNames = [...Object.keys(sales.fabrics).map((id) => fabric(id).name), ...Object.keys(sales.trims).map((id) => trim(id).name)];
    root.innerHTML = `<div class="market"><div class="tabs"><h1>Fabric Market</h1>
      <div class="sale-banner" title="Sales change every ${SALE_EVERY} commissions">&#9733; This week: <b>${saleNames.join(', ')}</b> on sale <small>(${sales.left} commission${sales.left === 1 ? '' : 's'} left)</small></div>
      <button class="tab" data-t="fabrics">Fabrics</button><button class="tab" data-t="trims">Trims &amp; Notions</button><button class="tab" data-t="workshop">Workshop</button></div><div class="shelf" id="shelf"></div></div>`;
    function buy(kind, id, qty, cost) {
      if (state.money < cost) { sfx.error(); toast('Not enough money', 'bad'); return; }
      state.money -= cost;
      state[kind][id] = Math.round(((state[kind][id] || 0) + qty) * 100) / 100;
      sfx.coin(); save(); renderHud(); refresh();
      checkAchievements();
    }
    function buyUpgrade(id) {
      const why = upgradeBlock(state.upgrades, id, lvl, state.money);
      if (why) { sfx.error(); toast(why === 'money' ? 'Not enough money' : `Not yet: ${why}`, 'bad'); return; }
      const u = UPGRADES.find((x) => x.id === id);
      state.money -= u.price;
      state.upgrades = [...(state.upgrades || []), id];
      sfx.coin(); save(); renderHud(); refresh();
      toast(`${u.name} installed in the workshop`, 'good');
      checkAchievements();
    }
    function workshop() {
      const t = tolerances(state.upgrades);
      $('#shelf', root).innerHTML = `<div class="tol-line">Your workshop now: cutting reach <b>${t.cutTol}px</b>, cutting slack <b>${t.cutSlack}px</b>, seam slack <b>${t.sewSlack}px</b>, seam forgiveness <b>${t.sewSpan}px</b></div>` + UPGRADES.map((u) => {
        const why = upgradeBlock(state.upgrades, u.id, lvl, state.money);
        const owned = why === 'owned', locked = u.lvl > lvl;
        return `<div class="card up${owned ? ' owned' : ''}${locked ? ' locked' : ''}">${locked ? `<span class="lockbadge">Level ${u.lvl}</span>` : ''}
          ${upIcon(u.id)}<h4>${u.name}</h4><div class="price">${money(u.price)}</div>
          <div class="tagchips">${u.blurb}</div>
          <div class="buy">${owned ? '<span class="owned-tag">&#10003; In the workshop</span>' : `<button class="btn small" data-up="${u.id}"${why && why !== 'money' ? ' disabled' : ''}>${why && why !== 'money' ? why : `Buy &middot; ${money(u.price)}`}</button>`}</div></div>`;
      }).join('');
      root.querySelectorAll('[data-up]').forEach((b) => { b.onclick = () => buyUpgrade(b.dataset.up); });
    }
    function refresh() {
      root.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
      if (tab === 'workshop') { workshop(); return; }
      const list = tab === 'fabrics' ? FABRICS : TRIMS;
      const off = tab === 'fabrics' ? sales.fabrics : sales.trims;
      $('#shelf', root).innerHTML = list.map((x) => {
        const locked = x.lvl > lvl;
        const pct = off[x.id] || 0;
        const have = tab === 'fabrics' ? `${(state.fabrics[x.id] || 0).toFixed(1)} m` : `${state.trims[x.id] || 0} packs`;
        const q = tab === 'fabrics' ? [1, 5] : [1, 3];
        return `<div class="card${locked ? ' locked' : ''}${pct ? ' sale' : ''}"${tip(x.name, x.tags, x.zones ? `decorates: ${x.zones.join(', ')}` : `£${x.price} per metre`)}>${locked ? `<span class="lockbadge">Level ${x.lvl}</span>` : ''}${pct ? `<span class="salebadge">-${pct}%</span>` : ''}
          ${tab === 'fabrics' ? swatchSVG(x.id, ['blush', 'sage', 'sky', 'ivory', 'lavender', 'navy'][FABRICS.indexOf(x) % 6], 110, 80) : trimIcon(x.id)}
          <h4>${x.name}</h4><div class="price">${pct ? `<s>${money(x.price)}</s> £${(x.price * (100 - pct) / 100).toFixed(2)}` : money(x.price)} per ${tab === 'fabrics' ? 'metre' : 'pack'}</div>
          <div class="tagchips">${Object.keys(x.tags).join(' · ')}</div>
          <div class="stock">You have <b>${have}</b></div>
          <div class="buy">${q.map((n) => { const c = saleCost(x.price, n, pct); return `<button class="btn small" data-id="${x.id}" data-n="${n}" data-c="${c}">+${n}${tab === 'fabrics' ? 'm' : ''} &middot; ${money(c)}</button>`; }).join('')}</div></div>`;
      }).join('');
      root.querySelectorAll('.buy .btn').forEach((b) => { b.onclick = () => buy(tab, b.dataset.id, +b.dataset.n, +b.dataset.c); });
    }
    root.querySelectorAll('.tab').forEach((b) => { b.onclick = () => { tab = b.dataset.t; sfx.page(); refresh(); }; });
    refresh();
  },
};
