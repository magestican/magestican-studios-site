

import { dot, sub } from './vec.js';









export function firstHit(ray, targets, volumeScale) {
  let best = null;
  let bestT = Infinity;
  for (const t of targets) {
    const oc = sub(ray.o, t.c);
    const b = dot(oc, ray.d);
    const r = t.r * volumeScale;
    const disc = b * b - (dot(oc, oc) - r * r);
    if (disc < 0) continue;
    const s = Math.sqrt(disc);
    const hit = -b - s > 0 ? -b - s : -b + s; 
    if (hit > 0 && hit < bestT) {
      bestT = hit;
      best = t;
    }
  }
  return best ? { ...best, dist: bestT } : null;
}


export function shouldFire(hit) {
  return !!hit && hit.kind !== 'hostage';
}






export function applyShots(enemies, shotsById) {
  const killed = [];
  for (const e of enemies) {
    const n = shotsById.get(e.id);
    if (!n || e.dead) continue;
    e.hp = Math.max(0, e.hp - n);
    if (e.hp === 0) {
      e.dead = true;
      killed.push(e.id);
    }
  }
  return { killed };
}
