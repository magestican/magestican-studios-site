





import { G, S, saveGame } from '../../state.js';
import { toast } from '../../../engine/ui/dialog.js';
import { Batch, lin } from '../../art/scenery/kit.js';
import { frozenForm, iceBlockForm } from '../../art/scenery/frost.js';
import { applyLook } from '../../../engine/iso/cozyStage.js';
import { fromUV } from './sections.js';
import { fresh, step, blocked, done, stuck, key } from './thinIceRules.js';

let st = {}, last = null, built = null; 
const thinOf = () => { const W = S.W; return W && W.thin && G.region === W.region ? W.thin : null; };
const roomDone = (rm) => !!(G.flags.thin && G.flags.thin[rm.id]) || !!G.flags.boss_glacius;
const stateOf = (rm) => (st[rm.id] || (st[rm.id] = fresh()));
const thawed = () => !!G.flags.boss_glacius;


export function thinBlocked(W, x, y) {
  const T = W.thin; if (!T) return false;
  const q = T.roomAt(x, y); if (!q) return false;
  const rm = q.room, R = rm.grid.length;
  if (q.r >= R) return q.c === rm.exit && !roomDone(rm);       
  if (q.r < 0 || roomDone(rm)) return rm.grid[q.r] && rm.grid[q.r][q.c] === '#' && !thawed();
  return blocked(rm, stateOf(rm), q.c, q.r) && !(rm.grid[q.r][q.c] === '#' && thawed());
}

function backToDoor(rm, text) {
  st[rm.id] = fresh();
  const [x, y] = fromUV(rm.u0 + (rm.entry + 0.5) * 2, rm.v0 - 1.4);
  const p = G.player; p.x = x; p.y = y; if (G.follower) { G.follower.x = x; G.follower.y = y - 0.6; }
  last = null;
  S.sfx.play('iceCrack');
  if (text) toast(text, 2600);
}

export function updateThinIce() {
  const T = thinOf();
  if (!T) { last = null; st = {}; if (built) disposeFrozen(); return; }
  updateFrozen();
  const p = G.player, q = T.roomAt(p.x, p.y);
  const here = q && q.r >= 0 && q.r < q.room.grid.length ? q : null;
  const same = here && last && last.room === here.room && last.c === here.c && last.r === here.r;
  if (same) return;
  const rm = (here || last || {}).room;
  if (rm && !roomDone(rm)) {
    const s = stateOf(rm), from = last && last.room === rm ? [last.c, last.r] : null;
    step(rm, s, from, here && here.room === rm ? [here.c, here.r] : null);
    if (from) S.sfx.play('iceCrack');
    if (done(rm, s)) {
      G.flags.thin = { ...(G.flags.thin || {}), [rm.id]: true };
      S.sfx.play('thaw');
      toast('Every step of the floor has cracked - and the sealed door runs with water. It is thawing!', 3000);
      saveGame();
    } else if (here && stuck(rm, s, here.c, here.r)) {
      backToDoor(rm, 'The ice gives way! You scramble back to the door, and the floor freezes over behind you.');
      return;
    }
  }
  
  if (q && q.r < 0 && !roomDone(q.room) && st[q.room.id] && st[q.room.id].walked.size) { st[q.room.id] = fresh(); toast('The floor freezes over again behind you.', 1600); }
  last = here;
}



const JAG = [[0.12, 0.2], [0.55, 0.08], [1.0, 0.22], [1.45, 0.06], [1.9, 0.18], [1.8, 0.7], [1.94, 1.1], [1.82, 1.6], [1.9, 1.9], [1.4, 1.8], [1.0, 1.95], [0.5, 1.82], [0.1, 1.9], [0.2, 1.4], [0.06, 0.9], [0.18, 0.5]];
export function thinPass(ctx) {
  const T = thinOf(); if (!T) return;
  for (const rm of T.rooms) {
    if (roomDone(rm)) continue;
    const s = st[rm.id] || fresh();
    ctx.save(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.75)';
    rm.grid.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch !== '.' || s.holes.has(key(c, r))) return;
      const pts = [[0.12, 0.12], [1.88, 0.12], [1.88, 1.88], [0.12, 1.88]].map(([a, b]) => S.stage.toScreen(...fromUV(rm.u0 + c * 2 + a, rm.v0 + r * 2 + b), 0.22));
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
    }));
    ctx.restore();
    for (const k of s.holes) {
      const [c, r] = k.split(',').map(Number), u0 = rm.u0 + c * 2, v0 = rm.v0 + r * 2, h = 0.22;
      const pts = JAG.map(([a, b]) => S.stage.toScreen(...fromUV(u0 + a, v0 + b), h));
      ctx.save();
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.fillStyle = '#0c2a44'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.lineJoin = 'bevel'; ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#1b1530'; ctx.stroke();
      
      const f = [[0.7, 0.8], [1.15, 0.7], [1.25, 1.05], [0.85, 1.15]].map(([a, b]) => S.stage.toScreen(...fromUV(u0 + a + ((c * 7 + r) % 3) * 0.12, v0 + b), h));
      ctx.beginPath(); f.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.fillStyle = '#d8eefa'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#1b1530'; ctx.stroke();
      ctx.restore();
    }
    for (const k of s.walked) { 
      if (s.holes.has(k)) continue;
      const [c, r] = k.split(',').map(Number), [cx, cy] = S.stage.toScreen(...fromUV(rm.u0 + c * 2 + 1, rm.v0 + r * 2 + 1), 0.22);
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
      for (let a = 0; a < 6; a++) { const t = a * 1.047 + 0.3, L = 14 + (a % 3) * 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(t) * L, cy + Math.sin(t) * L * 0.6); ctx.stroke(); }
      ctx.restore();
    }
  }
}


function disposeFrozen() {
  if (!built) return;
  for (const g of [built.frozen, ...Object.values(built.doors)]) if (g) { S.stage.scene.remove(g); g.traverse((o) => o.geometry && o.geometry.dispose()); }
  built = null;
}
function group(add) { const b = new Batch('frozen'); add(b); const g = b.toGroup(); if (S.stage.look) applyLook(g, S.stage.look); S.stage.scene.add(g); return g; }
function updateFrozen() {
  const W = S.W;
  if (!built || built.W !== W) {
    disposeFrozen();
    built = { W, frozen: null, doors: {} };
    if (W.frozen && W.frozen.length && !thawed()) built.frozen = group((b) => { for (const f of W.frozen) b.add(frozenForm(), { x: f.x, h: W.groundAt(f.x, f.y) - 0.03, y: f.y, rot: f.rot || 0, s: f.s || 1 }, { fruit: lin(f.c) }); });
    for (const rm of W.thin.rooms) if (!roomDone(rm)) {
      const [x, y] = fromUV(rm.u0 + (rm.exit + 0.5) * 2, rm.door[0] + 1);
      built.doors[rm.id] = group((b) => { b.add(iceBlockForm(), { x, h: W.groundAt(x, y) - 0.05, y, rot: 0.8, s: [2.6, 2.2, 1.6] }); });
    }
  }
  if (built.frozen && thawed()) { S.stage.scene.remove(built.frozen); built.frozen = null; }
  for (const id of Object.keys(built.doors)) {
    const rm = W.thin.rooms.find((q) => q.id === id);
    if (roomDone(rm)) { S.stage.scene.remove(built.doors[id]); delete built.doors[id]; }
  }
}
export const thinState = () => st; 
