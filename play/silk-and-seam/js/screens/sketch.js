import { state, save, level } from '../state.js';
import { go, toast, money, tagBars, matchLine, $ } from '../ui.js';
import { dressSVG, swatchSVG } from '../art.js';
import { PARTS, FABRICS, DYES } from '../data.js';
import { computeTags, fabricNeeds, totalMetres, materialCost, shortages, consume, fabric, part } from '../logic.js';
import { sfx } from '../audio.js';

const SLOT_LABEL = { bodice: 'Bodice', collar: 'Collar', sleeve: 'Sleeves', skirt: 'Skirt' };

const DRAFTING = `<svg class="drafting" viewBox="0 0 792 640" preserveAspectRatio="none"><g stroke="#8a6a50" stroke-width=".7" fill="none" opacity=".55">
  <path d="M40,120 H380 M40,300 H300 M60,60 V600 M340,90 V560 M120,420 L300,420 M90,200 C150,190 250,190 330,210"/>
  <path d="M60,120 l6,-4 M60,300 l6,-4 M340,300 l-6,-4" /><circle cx="60" cy="120" r="3"/><circle cx="340" cy="420" r="3"/>
  <path d="M380,40 V620" stroke-dasharray="4 6"/></g>
  <g fill="#8a6a50" font-size="11" font-style="italic" opacity=".6"><text x="66" y="114">bust 92</text><text x="66" y="294">waist 71</text><text x="302" y="414">hem</text><text x="70" y="596">front - cut on fold</text><text x="250" y="200">dart</text></g></svg>`;

export default {
  enter(root) {
    const job = state.job;
    if (!job) { go('orders'); return; }
    const d = job.design;
    const lvl = level();
    let view = 'sketch';
    root.innerHTML = `<div class="book">
      <div class="page left paper"><h2>${job.order.client}</h2><div class="sub">${job.order.occasion} &middot; fee ${money(job.order.fee)}</div>
        <div id="tags"></div><div id="match"></div></div>
      <div class="page right paper">${DRAFTING}<div class="sketch-dress" id="dress"></div><div class="pencil"></div>
        <button class="btn small ghost preview-toggle" id="view">View in fabric</button>
        <div class="controls">
          ${['bodice', 'collar', 'sleeve', 'skirt'].map((s) => `<div class="carousel" data-slot="${s}"><span class="lbl">${SLOT_LABEL[s]}</span><button class="arrow" data-d="-1">◀</button><div class="val"></div><button class="arrow" data-d="1">▶</button></div>`).join('')}
          <div class="swatches">
            <div class="swatch" data-fab="fab1"></div><div class="swatch" data-fab="fab2"></div>
            <div class="dyes">${['dye1', 'dye2', 'dye3'].map((k, i) => `<div class="dye" data-dye="${k}"><i></i><span>${['Main', 'Contrast', 'Accent'][i]}</span><br><small></small></div>`).join('')}</div>
          </div>
          <div class="req" id="req"></div>
          <div class="draft-row"><button class="btn ghost small" id="back">Back to letters</button><button class="btn gold" id="draft">Draft Pattern</button></div>
        </div></div></div>`;

    const avail = (slot) => PARTS[slot].filter((p) => p.lvl <= lvl);
    const fabs = FABRICS.filter((f) => f.lvl <= lvl);

    function refresh() {
      const tags = computeTags(d);
      $('#tags', root).innerHTML = tagBars(tags, job.order);
      $('#match', root).innerHTML = matchLine(tags, job.order);
      $('#dress', root).innerHTML = dressSVG(d, { mode: view });
      for (const el of root.querySelectorAll('.carousel')) {
        const slot = el.dataset.slot, list = avail(slot), i = list.findIndex((p) => p.id === d[slot]);
        const locked = PARTS[slot].length - list.length;
        el.querySelector('.val').innerHTML = `${part(slot, d[slot]).name}<small>${'● '.repeat(i + 1)}${'○ '.repeat(list.length - i - 1)}${locked ? ` +${locked} locked` : ''}</small>`;
      }
      const needs = fabricNeeds(d);
      for (const el of root.querySelectorAll('[data-fab]')) {
        const key = el.dataset.fab, f = fabric(d[key]);
        const used = needs[d[key]] !== undefined || (key === 'fab2' && d.fab2 === d.fab1);
        const have = state.fabrics[f.id] || 0;
        el.innerHTML = `${swatchSVG(f.id, key === 'fab1' ? d.dye1 : d.dye2)}<span class="nm"><b>${key === 'fab1' ? 'Main' : 'Contrast'}</b>: ${f.name}</span><small style="color:${have > 0 ? '#3c7a4c' : '#b1453b'}">${have.toFixed(1)} m in stock${used ? '' : ' &middot; unused'}</small>`;
        el.style.opacity = used ? 1 : 0.55;
      }
      for (const el of root.querySelectorAll('[data-dye]')) {
        const dy = DYES.find((x) => x.id === d[el.dataset.dye]);
        el.querySelector('i').style.background = dy.hex;
        el.querySelector('small').textContent = dy.name;
      }
      const short = shortages(state, d);
      const cost = materialCost(d);
      $('#req', root).innerHTML = `Approx. ${totalMetres(d).toFixed(2)}m fabric required` +
        `<small>${Object.entries(needs).map(([id, m]) => { const ok = (state.fabrics[id] || 0) >= m; return `<span class="${ok ? 'ok' : ''}">${fabric(id).name} ${m.toFixed(2)}m / ${(state.fabrics[id] || 0).toFixed(1)}m</span>`; }).join(' &middot; ')}</small>` +
        `<small>Materials worth ${money(cost)} &middot; client covers up to ${money(job.order.budget)}</small>`;
      const btn = $('#draft', root);
      btn.disabled = short.length > 0;
      btn.title = short.length ? `Not enough: ${short.map((s) => fabric(s.id)?.name || s.id).join(', ')} - visit the market` : '';
    }

    root.querySelectorAll('.carousel').forEach((el) => {
      el.querySelectorAll('.arrow').forEach((a) => {
        a.onclick = () => {
          const slot = el.dataset.slot, list = avail(slot);
          const i = list.findIndex((p) => p.id === d[slot]);
          d[slot] = list[(i + +a.dataset.d + list.length) % list.length].id;
          if (d.sleeve === 'none' && d.trims) delete d.trims.sleeves;
          sfx.click(); save(); refresh();
        };
      });
    });
    root.querySelectorAll('[data-fab]').forEach((el) => {
      el.onclick = (e) => {
        const key = el.dataset.fab;
        const i = fabs.findIndex((f) => f.id === d[key]);
        d[key] = fabs[(i + (e.shiftKey ? -1 : 1) + fabs.length) % fabs.length].id;
        sfx.click(); save(); refresh();
      };
      el.oncontextmenu = (e) => { e.preventDefault(); el.onclick({ shiftKey: true }); };
      el.title = 'Click for the next fabric (right-click for previous)';
    });
    root.querySelectorAll('[data-dye]').forEach((el) => {
      el.onclick = (ev) => {
        ev.stopPropagation();
        root.querySelector('.palette')?.remove();
        const pal = document.createElement('div');
        pal.className = 'palette';
        pal.innerHTML = DYES.map((dy) => `<button style="background:${dy.hex}" title="${dy.name}${dy.lvl > lvl ? ` (level ${dy.lvl})` : ''}" data-id="${dy.id}" class="${dy.lvl > lvl ? 'lock' : ''}"></button>`).join('');
        const r = el.getBoundingClientRect(), pr = root.getBoundingClientRect();
        const sc = pr.width / 1280;
        pal.style.left = `${Math.min(900, (r.left - pr.left) / sc - 160)}px`;
        pal.style.top = `${(r.bottom - pr.top) / sc + 6}px`;
        root.appendChild(pal);
        pal.onclick = (e2) => {
          const b = e2.target.closest('button');
          if (!b) return;
          if (b.classList.contains('lock')) { sfx.error(); toast(`${b.title}`); return; }
          d[el.dataset.dye] = b.dataset.id; sfx.click(); save(); refresh(); pal.remove();
        };
      };
    });
    root.addEventListener('click', (e) => { if (!e.target.closest('.palette')) root.querySelector('.palette')?.remove(); });
    $('#view', root).onclick = () => { view = view === 'sketch' ? 'final' : 'sketch'; $('#view', root).textContent = view === 'sketch' ? 'View in fabric' : 'View sketch'; sfx.page(); refresh(); };
    $('#back', root).onclick = () => { sfx.page(); go('orders'); };
    $('#draft', root).onclick = () => {
      if (shortages(state, d).length) { sfx.error(); toast('Not enough fabric - visit the market', 'bad'); return; }
      const trims = d.trims; d.trims = {};
      job.matCost = materialCost(d);
      consume(state, d);
      d.trims = trims || {};
      job.step = 'cut'; job.cut = []; job.sew = [];
      sfx.snip(); save(); go('cut');
    };
    refresh();
  },
};
