


import { G, S, objective } from '../../state.js';
import { speciesById, statsOf, TYPES, capsFor, attrOf } from '../../data/species.js';
import { xpToNext } from '../battle/rules.js';
import { dachiCanvas } from '../../art/portraitRender.js';
import { hpColor, attrBadge } from '../battle/battleHud.js';
import { T, locationName } from '../world/mapgen.js';
import { MINI, miniXY, transitPlan } from './transit.js';
import { regionById, HOME } from '../world/regions.js';

export { miniXY };
const $ = id => document.getElementById(id);
let miniBase = null, baseKey = '', miniTimer = 0, lastLoc = '', compKey = '';


let fontsIn = false;
if (typeof document !== 'undefined' && document.fonts) {
  Promise.all(['400 12px "Permanent Marker"', '800 12px "Rubik"'].map(f => document.fonts.load(f)))
    .then(() => { fontsIn = true; baseKey = ''; }).catch(() => {});
}


const here = () => regionById(G.region) || regionById(HOME);
export function updateHud(dt) {
  const R = here();
  const loc = locationName(S.W, G.player.x, G.player.y, R.name);
  if (loc !== lastLoc) { lastLoc = loc; $('locName').textContent = loc; const b = $('locBar'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  
  const sec = S.W.sectionAt(G.player.x, G.player.y);
  if (sec) { const seen = G.flags.seen || (G.flags.seen = {}); if (!seen[sec]) { seen[sec] = 1; baseKey = ''; } }
  $('objective').textContent = objective();
  const mini = $('minimap');
  if (mini.hidden === R.transit) mini.hidden = !R.transit; 
  miniTimer -= dt;
  if (R.transit && miniTimer <= 0) { miniTimer = 0.1; drawMinimap(); }
  companions();
}


const K = 0.86, OX = (MINI - MINI * K) / 2, OY = 30 - 6 * K;
const at = ([x, y]) => [OX + x * K, OY + y * K];

function drawMinimap() {
  const plan = transitPlan(G.flags);
  const key = (fontsIn ? 'f' : '') + plan.stations.map(s => +s.visited).join('') + (plan.x ? plan.x.sec : '-');
  if (!miniBase || key !== baseKey) { miniBase = paintTransit(S.W, plan, 380, false); baseKey = key; }
  const c = $('miniCanvas'), ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(miniBase, 0, 0);
  ctx.setTransform(c.width / MINI, 0, 0, c.width / MINI, 0, 0);
  youAreHere(ctx, 1);
}


function youAreHere(ctx, s) {
  const [x, y] = at(miniXY(G.player.x, G.player.y)), p = (6 + Math.sin(performance.now() / 150) * 1.5) * s;
  ctx.lineWidth = 3.2 * s; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, p, 0, 6.3); ctx.stroke();
  ctx.lineWidth = 2 * s; ctx.strokeStyle = '#ff3ea5'; ctx.beginPath(); ctx.arc(x, y, p, 0, 6.3); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x, y, 2.4 * s, 0, 6.3); ctx.fill();
}




function paintTransit(W, plan, size, big) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), s = size / MINI;
  ctx.scale(s, s);
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  rr(3, 3, MINI - 6, MINI - 6, 10); ctx.fillStyle = '#f4efe0'; ctx.fill();
  
  const land = t => t > T.SHALLOW;
  const TONE = { [T.ROCK]: '#e6c9a8', [T.LAVA]: '#ffb08a', [T.CLIFF]: '#d9b894', [T.SAND]: '#fff1b8', [T.REEF]: '#bfeee6', [T.KELP]: '#a6e3d4', [T.RUIN]: '#d4dde0', [T.JUNGLE]: '#c5e6b0', [T.WOOD]: '#c5e6b0' };
  ctx.save(); rr(3, 3, MINI - 6, MINI - 6, 10); ctx.clip();
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    const t = W.type[W.idx(i, j)]; if (!land(t)) continue;
    const [x, y] = at(miniXY(i + 0.5, j + 0.5));
    ctx.fillStyle = TONE[t] || '#dff0d2'; ctx.fillRect(x - 1.05, y - 1.05, 2.1, 2.1);
  }
  ctx.fillStyle = '#111';
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    if (!land(W.type[W.idx(i, j)]) || (i + j) % 2) continue; 
    const edge = [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([a, b]) => !W.inMap(i + a, j + b) || !land(W.type[W.idx(i + a, j + b)]));
    if (edge) { const [x, y] = at(miniXY(i + 0.5, j + 0.5)); ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); }
  }
  ctx.restore();
  
  ctx.lineCap = ctx.lineJoin = 'round';
  for (const g of plan.segs.filter(g => !g.open)) {
    ctx.setLineDash([3, 3]); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(17,17,17,.4)';
    ctx.beginPath(); g.pts.map(at).forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  }
  ctx.setLineDash([]);
  for (const g of plan.segs.filter(g => g.open)) {
    ctx.lineWidth = 6; ctx.strokeStyle = g.color;
    ctx.beginPath(); g.pts.map(at).forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
  }
  
  for (const st of plan.stations) {
    const [x, y] = at(st.px);
    ctx.beginPath(); ctx.arc(x, y, st.visited ? 4.6 : 3, 0, 6.3);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = st.visited ? 2.4 : 1.4; ctx.strokeStyle = st.visited ? '#111' : 'rgba(17,17,17,.5)'; ctx.stroke();
  }
  
  if (plan.x) {
    const [x, y] = at(plan.x.px), r = big ? 6 : 6.5;
    for (const [w, col] of [[7, '#fff'], [4.2, '#ff2a3a']]) {
      ctx.lineWidth = w; ctx.strokeStyle = col; ctx.beginPath();
      ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
    }
  }
  
  ctx.font = `400 ${big ? 7.5 : 8.5}px "Permanent Marker", cursive`; ctx.textBaseline = 'middle';
  for (const st of plan.stations) {
    if (!st.visited && !(big && plan.x && plan.x.sec === st.id)) continue;
    const [x, y] = at(st.px), right = x < MINI * 0.62;
    ctx.textAlign = right ? 'left' : 'right';
    const tx = x + (right ? 7 : -7);
    ctx.lineWidth = 2.6; ctx.strokeStyle = '#f4efe0'; ctx.strokeText(st.short, tx, y);
    ctx.fillStyle = '#111'; ctx.fillText(st.short, tx, y);
  }
  
  ctx.save(); rr(3, 3, MINI - 6, 24, [8, 8, 0, 0]); ctx.fillStyle = '#111'; ctx.fill(); ctx.restore();
  ctx.font = '800 14px Rubik, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff';
  ctx.fillText('DACHI TRANSIT', MINI / 2, 20.5);
  rr(3, 3, MINI - 6, MINI - 6, 10); ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
  if (big) {
    ctx.font = '400 6px "Permanent Marker", cursive'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    [['#ee352e', 'THE STORY ROAD'], ['#0039a6', 'THE SEA LINE'], ['#00933c', 'THE WILDS']].forEach(([col, name], k) => {
      const y = MINI - 30 + k * 8.5;
      ctx.fillStyle = col; ctx.fillRect(12, y - 2, 12, 4); ctx.fillStyle = '#111'; ctx.fillText(name, 28, y);
    });
  }
  return c;
}


export function openMap() {
  if (G.mode !== 'world' || S.dialog.active || !here().transit) return;
  G.mode = 'menu';
  $('bigMap').classList.remove('hidden');
  const c = $('bigCanvas'), ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(paintTransit(S.W, transitPlan(G.flags), c.width, true), 0, 0);
  ctx.setTransform(c.width / MINI, 0, 0, c.width / MINI, 0, 0);
  youAreHere(ctx, 0.8);
}
export function closeMap() {
  $('bigMap').classList.add('hidden');
  if (G.mode === 'menu' && $('menu').classList.contains('hidden')) G.mode = 'world';
}
export const mapOpen = () => !$('bigMap').classList.contains('hidden');

function companions() {
  const key = G.party.map(d => `${d.uid}:${d.sp}:${d.lvl}:${d.hp}:${d.xp}`).join('|');
  if (key === compKey) return; compKey = key;
  const el = $('companions'); el.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const d = G.party[i], card = document.createElement('div');
    card.className = 'comp' + (d ? '' : ' empty') + (d && d.hp <= 0 ? ' fainted' : '');
    if (d) {
      const s = speciesById(d.sp), st = statsOf(d);
      const cv = dachiCanvas(d.sp, {}, 48); 
      card.appendChild(cv);
      const info = document.createElement('div'); info.className = 'ci';
      info.innerHTML = `<div class="cn">${s.name} <span class="lv">Lv ${d.lvl}</span></div>
        <div class="types">${attrBadge(attrOf(d))}${s.types.map(t => `<i style="background:${TYPES[t]}">${t}</i>`).join('')}</div>
        <div class="bar hp"><b style="width:${100 * d.hp / st.maxHp}%;background:${hpColor(d.hp / st.maxHp)}"></b><span>${d.hp}/${st.maxHp}</span></div>
        <div class="bar xp"><b style="width:${d.lvl >= capsFor(G.cycle).maxLevel ? 100 : 100 * d.xp / xpToNext(d.lvl)}%"></b></div>`;
      card.appendChild(info);
    } else card.innerHTML = '<div class="ci"><div class="cn">empty</div></div>';
    el.appendChild(card);
  }
}
export const refreshHud = () => { compKey = ''; };
