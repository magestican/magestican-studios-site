import { state, save, level } from '../state.js';
import { go, toast, tagBars, matchLine, auntNote, tip, $ } from '../ui.js';
import { dressSVG } from '../art.js';
import { TRIMS, ZONES } from '../data.js';
import { computeTags } from '../logic.js';
import { sfx } from '../audio.js';
import { vignetteHTML, mountVignette } from '../scene.js';

let scene = null;

export default {
  enter(root) {
    const job = state.job;
    if (!job) { go('hub'); return; }
    const d = job.design;
    d.trims = d.trims || {};
    const lvl = level();
    const zones = ZONES.filter((z) => z.id !== 'sleeves' || d.sleeve !== 'none');
    root.innerHTML = `<div class="book"><div class="page left paper emb-left"><div class="emb-dress" id="dress">${vignetteHTML(dressSVG(d, { quality: job.quality ?? 1 }), { lights: true })}</div></div>
      <div class="page right paper emb-right"><h2>Embellish</h2><div class="sub">One pack of trim decorates one area. Too much and the dress becomes unwearable!</div>
      <div id="zones"></div><div id="tags" class="emb-tags"></div><div id="match"></div>
      <div class="draft-row emb-done"><button class="btn gold" id="done">Finish &amp; reveal</button></div></div></div>`;

    const used = (id, except) => Object.entries(d.trims).filter(([z, t]) => t === id && z !== except).length;

    function refresh() {
      if (scene) scene.setDress(dressSVG(d, { quality: job.quality ?? 1 }), d);
      $('#zones', root).innerHTML = zones.map((z) => {
        const opts = TRIMS.filter((t) => t.zones.includes(z.id) && t.lvl <= lvl);
        return `<div class="zone"><span class="zn">${z.name}</span><div class="chips">
          <button class="chip ${!d.trims[z.id] ? 'on' : ''}" data-z="${z.id}" data-t="">None</button>
          ${opts.map((t) => { const left = (state.trims[t.id] || 0) - used(t.id, z.id); return `<button class="chip ${d.trims[z.id] === t.id ? 'on' : ''}" data-z="${z.id}" data-t="${t.id}" ${left <= 0 && d.trims[z.id] !== t.id ? 'disabled' : ''}${tip(t.name, t.tags, `${Math.max(0, left)} pack${left === 1 ? '' : 's'} left`)}>${t.name} <small>x${Math.max(0, left)}</small></button>`; }).join('')}
        </div></div>`;
      }).join('');
      const tags = computeTags(d);
      
      const top = Object.entries(tags).filter(([t, v]) => v > 0 && t !== 'Unwearable').sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, v]) => ({ tag, min: v }));
      $('#tags', root).innerHTML = tagBars(tags, job.order.window ? { wants: top, avoid: [] } : job.order, { only: true });
      const extra = ['Elaborate', 'Unwearable'].filter((t) => !job.order.wants.some((w) => w.tag === t) && !job.order.avoid.some((a) => a.tag === t));
      if (extra.length) $('#tags', root).innerHTML += tagBars(tags, { wants: [], avoid: [{ tag: 'Unwearable', max: 0 }] }, { only: true });
      $('#match', root).innerHTML = matchLine(tags, job.order, d, job.quality ?? 0.85);
      root.querySelectorAll('.chip').forEach((c) => {
        c.onclick = () => {
          if (c.disabled) return;
          const z = c.dataset.z, t = c.dataset.t;
          if (t) d.trims[z] = t; else delete d.trims[z];
          if (t && /pearls|crystals|sequins|jet|rhinestones/.test(t)) sfx.sparkle(); else if (t) sfx.pin(); else sfx.click();
          save(); refresh();
        };
      });
    }
    $('#done', root).onclick = () => {
      for (const [z, t] of Object.entries(d.trims)) if (!t) delete d.trims[z];
      const need = {};
      for (const t of Object.values(d.trims)) need[t] = (need[t] || 0) + 1;
      for (const t in need) if ((state.trims[t] || 0) < need[t]) { toast('Not enough trim packs', 'bad'); return; }
      for (const t in need) state.trims[t] -= need[t];
      job.trimCost = Object.entries(need).reduce((a, [t, n]) => a + TRIMS.find((x) => x.id === t).price * n, 0);
      job.step = 'reveal'; save();
      go('reveal');
    };
    scene?.leave();
    scene = mountVignette($('.sc-vig', root), { design: d });
    refresh();
    auntNote('embellish');
  },
  leave() { scene?.leave(); scene = null; },
};
