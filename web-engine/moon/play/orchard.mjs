

















import { isRipe, stageAt } from '../economy/trees.mjs';
import { FOCUS } from '../world/moonLayout.mjs';

export const ORCHARD = Object.freeze({
  
  
  
  farLodM: 24,
  
  
  plantedSeedBase: 1000,
});



export const TOPPLE = Object.freeze({ durationS: 1.1, fallDeg: 84, fallS: 0.7, settleDeg: 5, shrinkFromS: 0.8 });


function hash32(n) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}


export function placeOf(tree, placements, cfg = ORCHARD) {
  if (Number.isInteger(tree.spot)) {
    const p = placements[tree.spot];
    if (!p || p.role !== 'tree') return null;
    return { x: p.x, z: p.z, rotY: p.rotY || 0, seed: p.seed || 1 };
  }
  const s = tree.spot;
  if (s && Number.isFinite(s.x) && Number.isFinite(s.z)) {
    return { x: s.x, z: s.z, rotY: (hash32(tree.id) % 6284) / 1000, seed: cfg.plantedSeedBase + tree.id };
  }
  return null;
}

export const viewKey = (v) => `${v.kind}|${v.seed}|${v.stage}|${v.fruit ? 1 : 0}|${v.lod}`;











export function orchardView(world, t, placements, cfg = ORCHARD, { planet = 0, focus = FOCUS } = {}) {
  const out = [];
  for (const tree of world.trees) {
    if ((Number.isInteger(tree.planet) ? tree.planet : 0) !== planet) continue;
    const place = placeOf(tree, placements, cfg);
    if (!place) continue;
    const stage = stageAt(tree, t);
    const ripe = isRipe(tree, t);
    const lod = Math.hypot(place.x - focus.x, place.z - focus.z) > cfg.farLodM ? 1 : 0;
    const v = { id: tree.id, kind: tree.kind, wild: tree.wild, ...place, stage, ripe, fruit: ripe, lod, felledAt: tree.felledAt };
    v.key = viewKey(v);
    out.push(v);
  }
  return out;
}


export function diffOrchard(prev, next) {
  const before = new Map(prev.map((v) => [v.id, v]));
  const added = [], changed = [], removed = [];
  for (const v of next) {
    const b = before.get(v.id);
    if (!b) added.push(v);
    else {
      if (b.key !== v.key || b.x !== v.x || b.z !== v.z) changed.push({ from: b, to: v });
      before.delete(v.id);
    }
  }
  for (const b of before.values()) removed.push(b);
  return { added, changed, removed, any: added.length + changed.length + removed.length > 0 };
}


export function countByStage(view) {
  const out = {};
  for (const v of view) out[v.stage] = (out[v.stage] || 0) + 1;
  return out;
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { const u = clamp01(x); return u * u * (3 - 2 * u); };





export function toppleAt(s, cfg = TOPPLE) {
  const deg = Math.PI / 180;
  let angle;
  if (s <= 0) angle = 0;
  else if (s < cfg.fallS) angle = cfg.fallDeg * (s / cfg.fallS) ** 2;
  else angle = cfg.fallDeg - cfg.settleDeg * Math.sin(Math.PI * clamp01((s - cfg.fallS) / (cfg.durationS - cfg.fallS)));
  const scale = 1 - smooth((s - cfg.shrinkFromS) / (cfg.durationS - cfg.shrinkFromS));
  return { angleRad: angle * deg, scale, done: s >= cfg.durationS };
}


export function fallYaw(tree, player) {
  const dx = tree.x - player.x, dz = tree.z - player.z;
  return dx === 0 && dz === 0 ? 0 : Math.atan2(dx, dz);
}
