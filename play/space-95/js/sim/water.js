









import { INVULN_TIME } from './combat.js';
import { STEP } from './constants.js';
import { unsafeFooting } from './pins.js';
import { createPlayer } from './player.js';
import { raftById } from './raft.js';

const DUNK_DEPTH = 0.6; 
export const DUNK_TIME = 0.6; 
const SAFE_STAND = 0.3; 
const SAFE_MARGIN = 0.5; 
const REACH = 30; 


export function waterAt(level, x) {
  for (const w of level.water ?? []) if (x >= w.x0 && x < w.x1) return w;
  return null;
}


export function trackSafe(s) {
  const p = s.player;
  if (!p.grounded) {
    s.safeT = 0;
    return;
  }
  const r = raftById(s.rafts, p.raft);
  const key = r ? r.id : 'land';
  if (s.safeKey !== key) {
    s.safeKey = key;
    s.safeT = 0;
  }
  s.safeT += STEP;
  if (s.safeT < SAFE_STAND - 1e-9) return;
  if (r) {
    if (r.sinks || r.packet) return; 
    s.safe = { raft: r.id, lane: r.lane ?? null, dx: p.x - r.x };
  } else {
    
    const w = s.world;
    const T = w.tile;
    const row = Math.round(p.y / T) - 1;
    const under = (x) => w.solid(Math.floor(x / T), row) || w.oneWay(Math.floor(x / T), row);
    if (!under(p.x - p.w / 2 - SAFE_MARGIN) || !under(p.x + p.w / 2 + SAFE_MARGIN)) return;
    
    if ((s.level.sparks || s.level.fans || s.level.spins) && unsafeFooting(s)) return;
    s.safe = { x: p.x, y: p.y };
    s.safeLand = s.safe;
  }
}


export function checkDunk(s) {
  const p = s.player;
  const w = waterAt(s.level, p.x);
  if (!w || p.y >= w.y - DUNK_DEPTH) return false;
  s.dunk = STEP;
  s.dunks += 1;
  s.dunkX = p.x;
  if (p.ab) p.ab.glideArm = false;
  s.events.push({ type: 'dunk', x: p.x, y: w.y });
  return true;
}


export function fishOut(s) {
  const at = safeSpot(s);
  const p = createPlayer(at.x, at.y, s.player.facing);
  p.abilities = s.abilities;
  if (at.raft) {
    p.raft = at.raft;
    p.carryFrom = at.raft;
  }
  s.player = p;
  s.dunk = 0;
  s.invuln = INVULN_TIME;
  s.safeT = 0;
  s.events.push({ type: 'fishedOut', x: at.x, y: at.y, raft: at.raft ?? null });
}

function safeSpot(s) {
  const safe = s.safe ?? { x: s.level.spawn.x, y: s.level.spawn.y };
  if (safe.raft === undefined) return safe;
  let r = null;
  if (safe.lane) {
    
    const behind = s.rafts.list.filter((o) => o.lane === safe.lane && o.x <= s.dunkX && o.state !== 'sinking');
    r = behind.length ? behind.reduce((a, b) => (b.x > a.x ? b : a)) : null;
  }
  r ??= raftById(s.rafts, safe.raft);
  if (r && Math.abs(r.x - s.dunkX) <= REACH) {
    const dx = Math.max(-r.w / 2 + 0.3, Math.min(r.w / 2 - 0.3, safe.dx));
    return { x: r.x + dx, y: r.y, raft: r.id };
  }
  return s.safeLand ?? { x: s.level.spawn.x, y: s.level.spawn.y };
}
