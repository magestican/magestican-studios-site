





import { G, S } from '../../state.js';
import { toast } from '../../../engine/ui/dialog.js';
import { traceBeam, mirrorState, DOORWAYS } from './regionMaps/geodeGalleries.js';
import { fromUV } from './sections.js';

export const TURN_R = 1.5;
let memo = { key: '', traces: [] };

export function lightOf() {
  const W = S.W, L = W && W.light;
  if (!L || G.region !== W.region) return null;
  L.flags = G.flags.mirrors = G.flags.mirrors || {};
  L.open = G.flags.geode = G.flags.geode || {};
  return L;
}
function traces(L) {
  const key = JSON.stringify(L.flags);
  if (memo.key !== key || memo.halls !== L.halls) memo = { key, halls: L.halls, traces: L.halls.map((h) => traceBeam(h, L.flags)) };
  return memo.traces;
}
export function mirrorNear(x, y) {
  const L = lightOf(); if (!L) return null;
  let best = null, bd = TURN_R;
  for (const m of L.mirrors) { const d = Math.hypot(m.x - x, m.y - y); if (d < bd) { bd = d; best = m; } }
  return best;
}
export function turnMirror(m) {
  const L = lightOf(); if (!L) return;
  L.flags[m.id] = 1 - mirrorState(m, L.flags);
  S.sfx.play('mirrorTurn'); 
  const tr = traces(L);
  L.halls.forEach((h, k) => {
    if (L.open[h.room] || !tr[k].lit) return;
    L.open[h.room] = true;
    S.sfx.play('beam');
    const n = Object.keys(L.open).length;
    toast(n === 1 ? 'The light hits the crystal. Across the way, the wall cracks... and comes down.' : n === L.halls.length ? 'The last wall falls. The vault is open.' : 'The light reaches the crystal. Another wall falls.', 2600);
  });
}

const P = (u, v, h) => { const [x, y] = fromUV(u, v); return S.stage.toScreen(x, y, (S.W.groundAt(x, y) || 0) + h); };
export function lightPass(ctx) {
  const L = lightOf(); if (!L || G.mode === 'battle') return;
  const k = S.stage.pxPerUnit(), t = performance.now() / 1000, tr = traces(L);
  ctx.save();
  
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  tr.forEach((b) => {
    const pts = b.pts.map(([u, v]) => P(u, v, 0.7));
    for (const [w, col, a] of [[k * 0.32, '255,200,90', 0.22], [k * 0.14, '255,236,170', 0.55], [Math.max(2, k * 0.05), '255,255,255', 0.95]]) {
      ctx.strokeStyle = `rgba(${col},${a * (0.85 + Math.sin(t * 6) * 0.15)})`; ctx.lineWidth = w;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
  });
  
  for (const m of L.mirrors) {
    const s = mirrorState(m, L.flags), d = 0.42, [a, b] = s === 0 ? [[m.u - d, m.v - d], [m.u + d, m.v + d]] : [[m.u - d, m.v + d], [m.u + d, m.v - d]];
    const pa = P(a[0], a[1], 0.78), pb = P(b[0], b[1], 0.78);
    ctx.strokeStyle = '#141018'; ctx.lineWidth = k * 0.16; ctx.beginPath(); ctx.moveTo(...pa); ctx.lineTo(...pb); ctx.stroke();
    ctx.strokeStyle = '#dff4ff'; ctx.lineWidth = k * 0.09; ctx.beginPath(); ctx.moveTo(...pa); ctx.lineTo(...pb); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1, k * 0.025); ctx.beginPath(); ctx.moveTo(...pa); ctx.lineTo(pa[0] + (pb[0] - pa[0]) * 0.4, pa[1] + (pb[1] - pa[1]) * 0.4); ctx.stroke();
  }
  
  L.halls.forEach((h, i) => {
    const lit = tr[i].lit || L.open[h.room], [lx, ly] = P(h.lock.u, h.lock.v, 0.7);
    ctx.fillStyle = lit ? '#fff6c8' : '#9a86c8'; ctx.strokeStyle = '#141018'; ctx.lineWidth = Math.max(2, k * 0.05);
    ctx.beginPath(); ctx.moveTo(lx, ly - k * 0.32); ctx.lineTo(lx + k * 0.16, ly); ctx.lineTo(lx, ly + k * 0.18); ctx.lineTo(lx - k * 0.16, ly); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (L.open[h.room]) return;
    const g = DOORWAYS[i], quad = [P(g.u - 1.7, g.v, 0), P(g.u + 1.7, g.v, 0), P(g.u + 1.7, g.v, 1.5), P(g.u - 1.7, g.v, 1.5)];
    ctx.fillStyle = 'rgba(190,160,255,0.55)'; ctx.beginPath(); quad.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke();
    
    ctx.lineWidth = Math.max(1, k * 0.025);
    for (let c = 1; c < 4; c++) { const p = P(g.u - 1.7 + c * 0.85, g.v, 0), q = P(g.u - 1.7 + c * 0.85 + 0.3, g.v, 1.5); ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); }
  });
  ctx.restore();
}
