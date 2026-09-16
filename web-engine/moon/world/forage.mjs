

















import { draw } from '../economy/math.mjs';
import { PATH_HALF_WIDTH, pathDistance, placements } from './moonLayout.mjs';
import { BERRY_BUSH, WALK_EDGE_M, penetration } from './collision.mjs';
import { PARCELS, layoutObstacles } from './parcels.mjs';

export const FORAGE_TYPES = Object.freeze(['mushroom', 'berries', 'dig']);

export const FORAGE_LAYOUT = Object.freeze({
  
  counts: Object.freeze({ mushroom: 8, berries: 5, dig: 6 }),
  
  radiusM: Object.freeze({ mushroom: 0.4, berries: BERRY_BUSH.radiusM, dig: 0.4 }),
  
  minFromCentreM: 3,
  maxFromCentreM: 30,
  edgeMarginM: 3,
  
  pathClearM: 0.7,
  obstacleClearM: 0.9,
  signClearM: 1.4,
  
  spacingM: 3.2,
  candidates: 600,
});

const U32 = 2 ** 32;
const cache = new Map();


export function forageSpots(seed = 1, cfg = FORAGE_LAYOUT) {
  const key = `${seed}|${cfg === FORAGE_LAYOUT ? 'default' : JSON.stringify(cfg)}`;
  if (!cache.has(key)) cache.set(key, place(seed, cfg));
  return cache.get(key);
}

function place(seed, cfg) {
  const obstacles = layoutObstacles(placements());
  const signs = PARCELS.map((p) => p.sign);
  const maxR = Math.min(cfg.maxFromCentreM, WALK_EDGE_M - cfg.edgeMarginM);
  const spots = [];
  for (const type of FORAGE_TYPES) {
    const r = cfg.radiusM[type];
    let found = 0;
    for (let k = 0; k < cfg.candidates && found < cfg.counts[type]; k++) {
      const a = (draw(seed, 'forage', type, k, 'angle') / U32) * Math.PI * 2;
      const u = draw(seed, 'forage', type, k, 'radius') / U32;
      const d = Math.sqrt(cfg.minFromCentreM ** 2 + u * (maxR ** 2 - cfg.minFromCentreM ** 2));
      const x = Math.round(Math.sin(a) * d * 100) / 100;
      const z = Math.round(Math.cos(a) * d * 100) / 100;
      if (pathDistance(x, z) < PATH_HALF_WIDTH + cfg.pathClearM + r) continue;
      if (obstacles.some((ob) => penetration(ob, x, z, r + cfg.obstacleClearM).depth > 0)) continue;
      if (signs.some((s) => Math.hypot(s.x - x, s.z - z) < r + cfg.signClearM)) continue;
      if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < cfg.spacingM)) continue;
      spots.push(Object.freeze({ id: spots.length, type, x, z, r }));
      found += 1;
    }
    if (found < cfg.counts[type]) throw new Error(`forage: only ${found} of ${cfg.counts[type]} ${type} spots fit on seed ${seed}`);
  }
  return Object.freeze(spots);
}
