


































import { packPct, buildingSpec } from './world.js';









export const RETREAT_PCT = 30;






























export function shouldRetreat(w, i, spec) {
  if (!spec) return false;
  
  
  
  
  
  if (spec.gatherFeedPerTick > 0 || spec.gatherWaterPerTick > 0) return false;
  
  
  
  if (spec.id === 'elephant') return false;
  return packPct(w, i) < RETREAT_PCT;
}














export function retreatTarget(w, owner) {
  for (let b = 0; b < w.b.count; b += 1) {
    if (!w.b.alive[b] || w.b.owner[b] !== owner) continue;
    if (w.b.building[b] > 0) continue;
    const spec = buildingSpec(w, b);
    if (spec && spec.home) return { x: w.b.x[b], y: w.b.y[b] };
  }
  const sp = w.map.spawns.find((s) => s.seat === owner);
  return sp ? { x: sp.x, y: sp.y } : null;
}
