






import { G, S } from '../../state.js';
import { speciesById } from '../../data/species.js';
import { dachiCanvas } from '../../art/portraitRender.js';
import { shinySprite } from '../../art/shinyMark.js';
import { icon } from '../../../engine/ui/icons.js';
import { ITEMS } from '../pickups/pickups.js';
import { fillTime } from './spoils.js';

let root = null, state = null;
const STAGGER = 0.28, ITEM_GAP = 0.32, HOLD_UP = 0.75;

function build() {
  root = document.createElement('div'); root.id = 'spoilsCard'; root.className = 'hidden';
  root.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); tap(); });
  addEventListener('keydown', (e) => { if (state && !root.classList.contains('hidden')) { e.stopPropagation(); tap(); } }, true);
  document.body.appendChild(root);
}


export function showSpoils({ rows, drops, title = 'VICTORY!' }, done) {
  if (!root) build();
  const prev = G.mode; G.mode = 'spoils';
  root.innerHTML = `<div class="spBox"><div class="spTag">${title}</div><div class="spRows"></div><div class="spDrops"></div><div class="spHint">Tap to continue</div></div>`;
  const list = root.querySelector('.spRows');
  const rs = rows.map((r, i) => {
    const s = speciesById(r.d.sp), el = document.createElement('div');
    el.className = 'spRow';
    el.innerHTML = `<div class="spPic"><span class="spBurst"></span></div>
      <div class="spMid"><div class="spName">${s.name} <span class="spLv">Lv ${r.run[0].lvl}</span></div>
        <div class="spBar"><b></b></div><div class="spGrow"></div></div>
      <div class="spXp"></div><div class="spUp">LEVEL UP!</div>`;
    el.querySelector('.spPic').appendChild(shinySprite(dachiCanvas(r.d.sp, {}, 52), r.d));
    list.appendChild(el);
    return { ...r, el, bar: el.querySelector('.spBar b'), lv: el.querySelector('.spLv'), xp: el.querySelector('.spXp'), shownLv: 0, shownXp: -1, grow: el.querySelector('.spGrow'),
      seg: 0, t: -i * STAGGER, hold: 0, ups: 0, shown: 0, finished: false };
  });
  const dropsEl = root.querySelector('.spDrops');
  if (!drops.length) dropsEl.remove();
  else dropsEl.innerHTML = '<span class="spDl">Found</span>' + drops.map(({ item, n }) => '<span class="spItem">' + icon(ITEMS[item].icon) + '<span>' + ITEMS[item].name + '</span>' + (n > 1 ? '<b>x' + n + '</b>' : '') + '</span>').join('');
  root.classList.remove('hidden');
  if (rs.length) S.sfx.play('xpFill');
  state = { rs, drops: [...root.querySelectorAll('.spItem')], dropT: 0, last: performance.now(), done, prev, over: false, raf: 0 };
  rs.forEach(paint);
  state.raf = requestAnimationFrame(tick);
}

function paint(r) {
  const seg = r.run[Math.min(r.seg, r.run.length - 1)];
  const k = r.finished ? seg.to / seg.need : Math.min(1, Math.max(0, r.t) / fillTime(seg));
  const xp = r.finished ? seg.to : seg.from + (seg.to - seg.from) * k;
  r.bar.style.width = (100 * Math.min(1, xp / seg.need)).toFixed(1) + '%';
  if (r.shownLv !== seg.lvl) { r.shownLv = seg.lvl; r.lv.textContent = 'Lv ' + seg.lvl; } 
  
  const total = r.run.reduce((a, q) => a + (q.to - q.from), 0) || 1;
  const done = r.run.slice(0, r.seg).reduce((a, q) => a + (q.to - q.from), 0) + (xp - seg.from);
  const n = Math.round(r.finished ? r.gain : r.gain * Math.min(1, done / total));
  if (n !== r.shownXp) { r.shownXp = n; r.xp.textContent = '+' + n + ' XP'; }
  if (seg.max) r.el.classList.add('max');
}

function levelUp(r) {
  const g = r.gains[r.ups++] || [];
  r.el.classList.remove('up'); void r.el.offsetWidth; r.el.classList.add('up'); 
  r.grow.innerHTML = g.map((q, i) => `<i style="animation-delay:${0.08 * i}s">+${q.n} ${q.label}</i>`).join('');
  S.sfx.play('levelUp');
}

function tick(now) {
  if (!state) return;
  const dt = Math.min(0.05, (now - state.last) / 1000); state.last = now;
  let busy = false;
  for (const r of state.rs) {
    if (r.finished) continue;
    busy = true;
    if (r.hold > 0) { r.hold -= dt; if (r.hold <= 0) { r.seg++; r.t = 0; } paint(r); continue; }
    r.t += dt;
    const seg = r.run[r.seg];
    if (r.t >= fillTime(seg)) {
      if (seg.up) { r.t = fillTime(seg); paint(r); levelUp(r); r.hold = HOLD_UP; continue; }
      r.finished = true;
    }
    paint(r);
  }
  
  if (!busy && state.drops.length) {
    state.dropT -= dt;
    const next = state.drops.find((e) => !e.classList.contains('in'));
    if (next && state.dropT <= 0) { next.classList.add('in'); S.sfx.play('itemPop'); state.dropT = ITEM_GAP; }
    if (next) busy = true;
  }
  if (!busy) { state.over = true; root.classList.add('over'); return; }
  state.raf = requestAnimationFrame(tick);
}


function tap() {
  if (!state) return;
  if (!state.over) {
    cancelAnimationFrame(state.raf);
    for (const r of state.rs) {
      const ups = r.run.filter((q) => q.up).length;
      if (r.ups < ups) { r.ups = ups - 1; levelUp(r); }
      r.seg = r.run.length - 1; r.finished = true; paint(r);
    }
    for (const e of state.drops) e.classList.add('in');
    state.over = true; root.classList.add('over');
    return;
  }
  const { done, prev } = state; state = null;
  root.classList.add('hidden'); root.classList.remove('over');
  G.mode = prev === 'spoils' ? 'world' : prev;
  if (done) done();
}
export const spoilsOpen = () => !!state;
