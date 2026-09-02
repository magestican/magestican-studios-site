











import { insideLevel } from './level.js';

export const INJURY = Object.freeze({
  
  
  
  enemyDamageScale: 0.5,
  
  
  
  startHealthFrac: 0.5,
  
  threshold: 0.5,
  
  
  
  dangerThreshold: 0.25,
  dangerMoveScale: 0.65,
  limpBias: 0.62,
  
  
  
  stumbleEvery: [8, 14],
  stumbleTime: 0.55,
  
  touchReach: 0.62,
  leanReach: 0.5,
  
  moveScale: 0.8,
});

export function isInjured(health, max) {
  return health <= max * INJURY.threshold;
}

export function isDanger(health, max) {
  return health <= max * INJURY.dangerThreshold;
}







export function nextStumbleAt(fromMetres) {
  const [lo, hi] = INJURY.stumbleEvery;
  
  
  const h = Math.sin(fromMetres * 12.9898) * 43758.5453;
  const r = h - Math.floor(h);
  return fromMetres + lo + r * (hi - lo);
}










export function wallSupport(level, x, z, reach = INJURY.touchReach) {
  let best = null;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    if (insideLevel(level, x + dx * reach, z + dz * reach, 0.05)) continue;
    
    let lo = 0;
    let hi = reach;
    for (let r = 0; r < 5; r += 1) {
      const mid = (lo + hi) / 2;
      if (insideLevel(level, x + dx * mid, z + dz * mid, 0.05)) lo = mid;
      else hi = mid;
    }
    const dist = (lo + hi) / 2;
    if (!best || dist < best.dist) best = { dx, dz, dist };
  }
  return best;
}
