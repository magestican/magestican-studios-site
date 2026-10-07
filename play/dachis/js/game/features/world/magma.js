








import { G, S, saveGame } from '../../state.js';
import { toast } from '../../../engine/ui/dialog.js';
import { Batch } from '../../art/scenery/kit.js';
import { plateForm, columnForm } from '../../art/scenery/magma.js';
import { applyLook } from '../../../engine/iso/cozyStage.js';
import { fromUV, toUV } from './sections.js';
import { T } from './mapgen.js';
import { crustAt, CELL } from './crustRules.js';
import * as B from './basaltRules.js';
import { cooled } from './ventRules.js';

let clock = 0, built = null, bst = {}, safe = null, hushT = 0;
const hz = () => { const W = S.W; return W && W.hazard && G.region === W.region ? W.hazard : null; };
const openOf = (rm) => new Set((G.flags.valves && G.flags.valves[rm.id]) || []);
const inGrid = (g, c, r) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;


function cellAt(H, u, v) {
  if (H.crust) for (const f of H.crust) {
    if (u <= f.u[0] || u >= f.u[1]) continue;
    const k = Math.floor((v - f.v0) / CELL);
    if (k >= 0 && k < f.strips.length) { const state = crustAt(f.strips[k], clock); return { kind: 'crust', f, k, state, solid: state !== 'molten' }; }
  }
  if (H.basalt) for (const f of H.basalt) {
    const c = Math.floor((u - f.u0) / CELL), r = Math.floor((v - f.v0) / CELL);
    if (inGrid(f.grid, c, r)) return { kind: 'basalt', f, c, r, solid: B.solid(f, bst[f.id] || (bst[f.id] = B.fresh()), c, r) };
  }
  if (H.vents) for (const rm of H.vents) {
    const c = Math.floor((u - rm.u0) / CELL), r = Math.floor((v - rm.v0) / CELL);
    if (!inGrid(rm.grid, c, r)) continue;
    const ch = rm.grid[r][c];
    return ch === '.' || ch === '#' ? null : { kind: 'vent', rm, c, r, ch, solid: cooled(rm, openOf(rm), ch) };
  }
  return null;
}

export function magmaWalk(W, x, y) {
  const H = W.hazard; if (!H || W.tileType(x, y) !== T.LAVA) return null;
  const q = cellAt(H, ...toUV(x, y));
  return q ? q.solid : null;
}

function dunk(text) {
  const p = G.player;
  if (safe) { p.x = safe.x; p.y = safe.y; if (G.follower) { G.follower.x = safe.x; G.follower.y = safe.y - 0.5; } }
  S.sfx.play('lavaSnap'); 
  if (hushT <= 0) { toast(text, 2200); hushT = 4; }
}

export function updateMagma(dt) {
  const H = hz();
  if (!H) { if (built) dispose(); bst = {}; safe = null; return; }
  clock += dt; hushT -= dt;
  if (!built || built.W !== S.W) build(H);
  const W = S.W, p = G.player, onLava = W.tileType(p.x, p.y) === T.LAVA, q = onLava ? cellAt(H, ...toUV(p.x, p.y)) : null;
  if (H.basalt) for (const f of H.basalt) {
    const s = bst[f.id] || (bst[f.id] = B.fresh()), was = Object.values(s.cols).filter((c) => c.phase === 'down').length;
    const out = B.tick(f, s, q && q.kind === 'basalt' && q.f === f ? [q.c, q.r] : null, dt);
    if (Object.values(s.cols).filter((c) => c.phase === 'down').length > was) S.sfx.play('basaltSink');
    if (out === 'dunk') { dunk('The column goes down under you! You scramble back to the bank.'); return; }
  }
  if (q && !q.solid) {
    dunk(q.kind === 'crust' ? 'Hot! The crust goes soft under your sneakers - you hop back onto the rock.' : 'The channel melts under you - you jump back onto the stone!');
    return;
  }
  if (!onLava && W.walkable(p.x, p.y, 0.2)) safe = { x: p.x, y: p.y };
  
  if (q) { const top = q.kind === 'crust' ? q.f.h(q.k) : q.kind === 'basalt' ? q.f.h : q.rm.h; p.lift = Math.max(0, top - W.groundAt(p.x, p.y)); }
  draw();
}


export function valveNear(x, y) {
  const H = hz(); if (!H || !H.vents) return null;
  return S.W.objects.find((o) => o.kind === 'valve' && Math.hypot(o.x - x, o.y - y) < 1.35) || null;
}
export function turnValve(o) {
  const cur = new Set((G.flags.valves && G.flags.valves[o.room]) || []);
  if (cur.has(o.valve)) cur.delete(o.valve); else cur.add(o.valve);
  G.flags.valves = { ...(G.flags.valves || {}), [o.room]: [...cur] };
  S.sfx.play('valveTurn'); 
  if (!G.flags.valveSeen) { G.flags.valveSeen = true; toast('The wheel squeals round. Cold air roars through the floor - somewhere a channel crusts over, and somewhere one glows again.', 3200); }
  saveGame();
}


function group(add) { const b = new Batch('magma'); add(b); const g = b.toGroup(); if (S.stage.look) applyLook(g, S.stage.look); S.stage.scene.add(g); return g; }
const ROT = Math.PI / 4; 
function build(H) {
  dispose();
  const W = S.W;
  built = { W, strips: [], cols: [], chans: [] };
  if (H.crust) for (const f of H.crust) f.strips.forEach((s, k) => {
    const v = f.v0 + (k + 0.5) * CELL, h = f.h(k);
    built.strips.push({ f, k, h, g: group((b) => { for (let u = f.u[0] + CELL / 2; u < f.u[1]; u += CELL) { const [x, y] = fromUV(u, v); b.add(plateForm(), { x, h, y, rot: ROT, s: 1.02 }); } }) });
  });
  if (H.basalt) for (const f of H.basalt) f.grid.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '.') return;
    const [x, y] = fromUV(f.u0 + (c + 0.5) * CELL, f.v0 + (r + 0.5) * CELL);
    built.cols.push({ f, c, r, h: f.h, g: group((b) => b.add(columnForm(), { x, h: 0, y, rot: ROT + (c * 7 + r * 3) % 5 * 0.2, s: 0.96 })) });
  }));
  if (H.vents) for (const rm of H.vents) rm.grid.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.' || ch === '#') return;
    const [x, y] = fromUV(rm.u0 + (c + 0.5) * CELL, rm.v0 + (r + 0.5) * CELL);
    built.chans.push({ rm, ch, g: group((b) => b.add(plateForm(), { x, h: rm.h, y, rot: ROT, s: 1.0 })) });
  }));
}
function dispose() {
  if (!built) return;
  for (const it of [...built.strips, ...built.cols, ...built.chans]) { S.stage.scene.remove(it.g); it.g.traverse((o) => o.geometry && o.geometry.dispose()); }
  built = null;
}
function draw() {
  for (const it of built.strips) {
    const st = crustAt(it.f.strips[it.k], clock);
    it.g.visible = st !== 'molten';
    it.g.position.y = st === 'warn' ? Math.sin(clock * 47 + it.k) * 0.02 - 0.03 : 0; 
  }
  for (const it of built.cols) {
    const d = B.depthOf(bst[it.f.id] || B.fresh(), it.c, it.r), sh = B.phaseOf(bst[it.f.id] || B.fresh(), it.c, it.r) === 'sink' ? Math.sin(clock * 53) * 0.03 : 0;
    it.g.position.y = it.h - d * 1.0 + sh;
    it.g.visible = d < 0.99;
  }
  const open = {};
  for (const it of built.chans) it.g.visible = cooled(it.rm, open[it.rm.id] || (open[it.rm.id] = openOf(it.rm)), it.ch);
}


export function magmaPass(ctx) {
  const H = hz(); if (!H || !built) return;
  ctx.save(); ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  const cracks = (u0, v0, h, seed) => {
    for (let k = 0; k < 4; k++) {
      const a = ((seed * 7 + k * 13) % 10) / 10, b = ((seed * 3 + k * 7) % 10) / 10;
      const [x1, y1] = S.stage.toScreen(...fromUV(u0 + 0.3 + a * 1.4, v0 + 0.3 + b * 1.4), h), [x2, y2] = S.stage.toScreen(...fromUV(u0 + 0.5 + b * 1.2, v0 + 0.4 + a * 1.2), h);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo((x1 + x2) / 2 + 4, (y1 + y2) / 2 - 3); ctx.lineTo(x2, y2); ctx.stroke();
    }
  };
  for (const it of built.strips) if (crustAt(it.f.strips[it.k], clock) === 'warn') for (let u = it.f.u[0]; u < it.f.u[1]; u += CELL) cracks(u, it.f.v0 + it.k * CELL, it.h, Math.round(u) + it.k * 5);
  for (const it of built.cols) if (B.phaseOf(bst[it.f.id] || B.fresh(), it.c, it.r) === 'sink') cracks(it.f.u0 + it.c * CELL, it.f.v0 + it.r * CELL, it.h, it.c * 3 + it.r);
  ctx.restore();
}
export const magmaState = () => ({ clock, bst, safe }); 
