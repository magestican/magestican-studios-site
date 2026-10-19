










import { boxFree } from './body.js';

const PRUNE_DUR = 0.5; 


export function attachArena(world, pieces) {
  world.arena = pieces;
  world.arenaPhase ??= null;
  world.mutable = true; 
  const clone = world.clone;
  if (clone && !clone.withArena) {
    world.clone = () => {
      const c = attachArena(clone(), pieces);
      c.arenaPhase = world.arenaPhase;
      return c;
    };
    world.clone.withArena = true;
  }
  return world;
}


const pieceY = (p, i) => p.at[i] ?? null;


function setPiece(world, pristine, p, y0, on) {
  if (y0 === null) return;
  const T = world.tile;
  const h = p.y1 - p.y0;
  for (let c = Math.round(p.x0 / T); c < Math.round(p.x1 / T); c++)
    for (let r = Math.round(y0 / T); r < Math.round((y0 + h) / T); r++) {
      if (on) world.setSolid(c, r, true);
      else world.setCode(c, r, pristine.code(c, r));
    }
}


function lift(world, b) {
  if (boxFree(world, b)) return false;
  const y = b.y;
  for (let dy = world.tile; dy <= 8; dy += world.tile / 2) {
    b.y = Math.ceil((y + dy - 1e-9) / world.tile) * world.tile;
    if (boxFree(world, b)) {
      b.vy = Math.max(0, b.vy ?? 0);
      return true;
    }
  }
  b.y = y;
  return false;
}


function applyShape(s, i) {
  const w = s.world;
  if (w.arenaPhase === i) return [];
  const prev = w.arenaPhase;
  const out = [];
  for (const p of w.arena) {
    
    const from = prev === null ? null : pieceY(p, prev);
    const to = pieceY(p, i);
    setPiece(w, s.level.world, p, from, false);
    setPiece(w, s.level.world, p, to, true);
    if (prev !== null && from !== to) out.push({ type: 'prune', id: p.id, fromY: from, toY: to, dur: PRUNE_DUR, x0: p.x0, x1: p.x1 });
  }
  w.arenaPhase = i;
  if (lift(w, s.player)) s.player.grounded = false;
  
  const f = w.floorAt?.(s.player);
  if (f && s.player.y < f.y && s.player.y + s.player.h > f.y) s.player.y = f.y;
  for (const e of s.entities) if (e.alive && e.kind === 'fruitlet') lift(w, e);
  return out;
}



function bossPhase(s) {
  const b = s.entities.find((e) => e.kind === 'boss');
  return b ? (b.shape ?? b.phase) : 0;
}


export function stepArena(s) {
  if (!s.world.arena) return;
  for (const ev of applyShape(s, bossPhase(s))) s.events.push(ev);
}


export function initArena(s) {
  if (!s.world.arena) return;
  applyShape(s, bossPhase(s));
}
