

import { U } from '../../../engine/core/util.js';
import { G, S, objective } from '../../state.js';
import { speciesById, statsOf, TYPES, capsFor, attrOf } from '../../data/species.js';
import { xpToNext } from '../battle/rules.js';
import { dachiCanvas } from '../../art/portraitRender.js';
import { hpColor, attrBadge } from '../battle/battleHud.js';
import { T, VOLC, SHRINE, PATH_POINTS, locationName } from '../world/mapgen.js';

const $ = id => document.getElementById(id);
const MINI = 190;

export const miniXY = (x, y) => [MINI / 2 + (x - y) * 1.4, 6 + (x + y - 34) * 1.4];
let miniBase = null, miniTimer = 0, lastLoc = '', compKey = '';

export function updateHud(dt) {
  const loc = locationName(S.W, G.player.x, G.player.y);
  if (loc !== lastLoc) { lastLoc = loc; $('locName').textContent = loc; const b = $('locBar'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  $('objective').textContent = objective();
  miniTimer -= dt;
  if (miniTimer <= 0) { miniTimer = 0.1; drawMinimap(); }
  companions();
}

function drawMinimap() {
  if (!miniBase) miniBase = paintTreasureMap(S.W);
  const ctx = $('miniCanvas').getContext('2d');
  ctx.drawImage(miniBase, 0, 0);
  const [x, y] = miniXY(G.player.x, G.player.y), p = 3.5 + Math.sin(performance.now() / 150);
  ctx.fillStyle = '#b3261e'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, p, 0, 6.3); ctx.fill(); ctx.stroke();
}

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
    } else card.innerHTML = '<div class="ci"><div class="cn">— empty —</div></div>';
    el.appendChild(card);
  }
}
export const refreshHud = () => { compKey = ''; };

function paintTreasureMap(W) {
  const c = document.createElement('canvas'); c.width = c.height = MINI;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(MINI / 2, MINI / 2, 20, MINI / 2, MINI / 2, MINI * 0.7);
  g.addColorStop(0, '#f3e2b3'); g.addColorStop(1, '#c79f5e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, MINI, MINI);
  const r = U.rng(9);
  for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(120,80,30,${r() * 0.08})`; ctx.beginPath(); ctx.ellipse(r() * MINI, r() * MINI, 4 + r() * 16, 3 + r() * 10, 0, 0, 6.3); ctx.fill(); }
  ctx.strokeStyle = 'rgba(70,90,110,0.25)'; ctx.lineWidth = 1;
  for (let y = 6; y < MINI; y += 7) { ctx.beginPath(); for (let x = 0; x < MINI; x += 6) ctx.lineTo(x, y + Math.sin(x * 0.3) * 1.5); ctx.stroke(); }
  const land = t => t > T.SHALLOW;
  const INK = { [T.ROCK]: '#9c7a58', [T.LAVA]: '#9c7a58', [T.CLIFF]: '#8a6a4c', [T.SAND]: '#ead3a0', [T.TALL]: '#98a860', [T.WOOD]: '#7f9450', [T.JUNGLE]: '#6f8a48', [T.REEF]: '#d8c8b0', [T.KELP]: '#6a9a8a', [T.RUIN]: '#9aa6aa' };
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    const t = W.type[W.idx(i, j)]; if (!land(t)) continue;
    const [x, y] = miniXY(i + 0.5, j + 0.5);
    ctx.fillStyle = INK[t] || '#b7b67a';
    ctx.fillRect(x - 1.1, y - 1.1, 2.2, 2.2);
  }
  ctx.fillStyle = '#5a3c1e';
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    if (!land(W.type[W.idx(i, j)])) continue;
    const edge = [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([a, b]) => !W.inMap(i + a, j + b) || !land(W.type[W.idx(i + a, j + b)]));
    if (edge) { const [x, y] = miniXY(i + 0.5, j + 0.5); ctx.fillRect(x - 1, y - 1, 2, 2); }
  }
  const [vx, vy] = miniXY(VOLC.x, VOLC.y);
  ctx.fillStyle = '#6b3a22'; ctx.beginPath(); ctx.moveTo(vx - 12, vy + 7); ctx.lineTo(vx - 4, vy - 8); ctx.lineTo(vx + 4, vy - 8); ctx.lineTo(vx + 12, vy + 7); ctx.fill();
  ctx.fillStyle = '#d8401a'; ctx.fillRect(vx - 4, vy - 9, 8, 2);
  ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 1.8; ctx.setLineDash([3, 3]); ctx.beginPath();
  PATH_POINTS.forEach(([x, y], k) => { const p = miniXY(x, y); k ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.stroke(); ctx.setLineDash([]);
  const [sx, sy] = miniXY(SHRINE.x, SHRINE.y);
  ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - 5, sy - 5); ctx.lineTo(sx + 5, sy + 5); ctx.moveTo(sx + 5, sy - 5); ctx.lineTo(sx - 5, sy + 5); ctx.stroke();
  const cx = 26, cy = MINI - 28;
  ctx.fillStyle = '#5a3c1e';
  for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(k * Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(3, 0); ctx.lineTo(-3, 0); ctx.fill(); ctx.restore(); }
  ctx.font = 'bold 9px Georgia'; ctx.textAlign = 'center'; ctx.fillText('N', cx, cy - 16);
  return c;
}
