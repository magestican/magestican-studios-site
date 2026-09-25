import { state, save } from '../state.js';
import { money, starRow, toast, renderHud, checkAchievements, $ } from '../ui.js';
import { dressSVG, swatchSVG } from '../art.js';
import { makeAccessory, accessoryPrice, fabric } from '../logic.js';
import { ACCESSORIES } from '../data.js';
import { sfx } from '../audio.js';

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');



export function cardSVG(g) {
  const W = 600, H = 860;
  const dress = dressSVG(g.design, { quality: g.quality }).replace('<svg ', '<svg x="100" y="64" width="400" height="620" ');
  const line2 = g.window ? `Sold from the shop window for ${money(g.pay)}` : `for ${g.client} &#183; ${g.occasion}`;
  const st = g.window ? '' : `<text x="300" y="790" text-anchor="middle" font-size="30" fill="#c79a2e">${'&#9733;'.repeat(g.stars)}<tspan fill="#d8ccb4">${'&#9733;'.repeat(5 - g.stars)}</tspan></text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><linearGradient id="gilt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d58a"/><stop offset=".5" stop-color="#b98d3a"/><stop offset="1" stop-color="#8a6420"/></linearGradient>` +
    `<radialGradient id="glow" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fbf4e4"/><stop offset="1" stop-color="#e6d6b6"/></radialGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="#3f4d3d"/><rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="6" fill="url(#gilt)"/>` +
    `<rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="url(#glow)"/>` +
    `<ellipse cx="300" cy="676" rx="150" ry="14" fill="#000" fill-opacity=".12"/>${dress}` +
    `<text x="300" y="722" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="27" fill="#3a2618">${xml(g.name)}</text>` +
    `<text x="300" y="754" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="#6b4a2f">${line2.replace(/&(?!#\d+;|amp;)/g, '&amp;')}</text>${st}` +
    `<text x="300" y="${H - 44}" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#8a6a50">Silk &amp; Seam &#183; magesticanstudios.com/play/silk-and-seam</text></svg>`;
}

export function svgToPng(svg, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    };
    img.onerror = () => reject(new Error('the card SVG did not render'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

async function exportCard(g) {
  const blob = await svgToPng(cardSVG(g), 600, 860);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${g.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'dress'}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  window.__lastPng = { name: a.download, bytes: blob.size, type: blob.type };   
  return blob;
}


function workbench() {
  const rows = Object.entries(state.scraps || {}).filter(([id, m]) => fabric(id) && m >= 0.05).sort((a, b) => b[1] - a[1]);
  return `<div class="bench paper"><h2>Workbench</h2><p class="sub">Offcuts from your cutting table. Neat cutting leaves more to use.</p>${rows.length ? rows.map(([id, m]) => `
    <div class="scrap-row"><div class="scrap-sw">${swatchSVG(id, 'ivory', 50, 38)}</div><div class="scrap-info"><b>${fabric(id).name}</b><small>${m.toFixed(2)} m of scraps</small>
      <div class="chips">${ACCESSORIES.map((a) => `<button class="chip" data-acc="${a.id}" data-fab="${id}" ${m + 1e-9 < a.need ? 'disabled' : ''} title="${a.need} m">${a.name} &middot; ${money(accessoryPrice(a.id, id))}</button>`).join('')}</div></div></div>`).join('')
    : '<p class="empty-bench">No scraps yet. Every dress you cut leaves a few offcuts here.</p>'}
    <p class="sold-line">Accessories sold: <b>${state.stats?.accessories || 0}</b></p></div>`;
}

export default {
  enter(root) {
    const items = state.gallery.slice(-24).reverse();
    root.innerHTML = `<div class="gallery"><h1>Gallery of Gowns</h1><div class="gal-wrap"><div class="gal-main">${items.length ? `<div class="grid">${items.map((g, i) => `
      <div class="frame"><div class="inner">${dressSVG(g.design, { quality: g.quality })}<div class="cap"><b>${g.name}</b><br>${g.window ? 'sold from the window' : g.client}<br>${g.window ? '' : starRow(g.stars)} ${money(g.pay)}</div>
      <button class="btn small ghost png" data-png="${i}">Save as PNG</button></div></div>`).join('')}</div>`
      : '<div class="empty">No dresses yet. Take a commission and your finished work will hang here.</div>'}</div><div id="bench"></div></div></div>`;
    root.querySelectorAll('[data-png]').forEach((b) => {
      b.onclick = async () => {
        sfx.click(); b.disabled = true;
        try { await exportCard(items[+b.dataset.png]); toast('Dress card saved', 'good'); } catch (e) { toast('Could not save the picture', 'bad'); }
        b.disabled = false;
      };
    });
    const bench = () => {
      $('#bench', root).innerHTML = workbench();
      root.querySelectorAll('[data-acc]').forEach((b) => {
        b.onclick = () => {
          const r = makeAccessory(state.scraps, b.dataset.acc, b.dataset.fab);
          if (!r) { sfx.error(); return; }
          state.scraps = r.scraps;
          state.money += r.price;
          state.stats = { ...state.stats, accessories: (state.stats?.accessories || 0) + 1 };
          const a = ACCESSORIES.find((x) => x.id === b.dataset.acc);
          sfx.coin(); save(); renderHud();
          toast(`${fabric(b.dataset.fab).name} ${a.name.toLowerCase()} sold for ${money(r.price)}`, 'good');
          checkAchievements();
          bench();
        };
      });
    };
    bench();
  },
};
