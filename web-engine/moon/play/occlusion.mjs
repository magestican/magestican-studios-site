
















export const OCCLUDER_TOP_M = Object.freeze({
  cottage: 5.0,
  villagerHome: 4.5,
  shop: 5.0,
  processor: 5.5,
  townBuilding: 7.0,
  fence: 1.1,
  cat: 1.1,
  lamp: 2.4,
  firepit: 0.6,
  parcelSign: 1.0,
  plot: 1.0,
  berryBush: 1.0,
});



export const ROCK_HEIGHT_PER_RADIUS = 2.0;



const canopy = (r, y0, y1) => Object.freeze({ r, y0, y1 });
export const CANOPY = Object.freeze({
  tree: Object.freeze({ fruiting: canopy(1.75, 1.1, 4.2), young: canopy(1.0, 0.8, 2.8), sapling: canopy(0.55, 0.3, 1.5) }),
  peachTree: Object.freeze({ fruiting: canopy(1.75, 1.1, 4.2), young: canopy(1.0, 0.8, 2.8), sapling: canopy(0.55, 0.3, 1.5) }),
  pine: Object.freeze({ fruiting: canopy(1.45, 0.5, 5.2), young: canopy(0.85, 0.3, 3.0), sapling: canopy(0.5, 0.2, 1.6) }),
});

export const TRUNK_TOP_M = 1.2;


export const CHEST_OF_HEIGHT = 0.6;



export const NEAR_PLAYER_M = 0.35;


export function solidsOf(ob) {
  if (!ob) return [];
  const tree = CANOPY[ob.module];
  if (tree) {
    const out = [{ shape: 'circle', x: ob.x, z: ob.z, r: ob.r, y0: 0, y1: TRUNK_TOP_M }];
    const c = tree[ob.stage || 'fruiting'];
    if (c) out.push({ shape: 'circle', x: ob.x, z: ob.z, r: c.r, y0: c.y0, y1: c.y1 });
    return out;
  }
  let top = OCCLUDER_TOP_M[ob.module];
  if (ob.module === 'rock') top = ob.r * ROCK_HEIGHT_PER_RADIUS;
  if (!(top > 0)) return [];
  if (ob.shape === 'circle') return [{ shape: 'circle', x: ob.x, z: ob.z, r: ob.r, y0: 0, y1: top }];
  return [{ shape: 'box', x: ob.x, z: ob.z, cos: ob.cos, sin: ob.sin, hx: ob.hx, hz: ob.hz, y0: 0, y1: top }];
}


function slab(a, d, min, max, range) {
  if (Math.abs(d) < 1e-12) {
    if (a < min || a > max) range[0] = Infinity;
    return;
  }
  let t0 = (min - a) / d, t1 = (max - a) / d;
  if (t0 > t1) [t0, t1] = [t1, t0];
  if (t0 > range[0]) range[0] = t0;
  if (t1 < range[1]) range[1] = t1;
}


export function segmentEntry(a, b, s, tMax = 1) {
  const range = [0, tMax];
  slab(a.y, b.y - a.y, s.y0, s.y1, range);
  if (range[0] > range[1]) return -1;
  if (s.shape === 'circle') {
    const ax = a.x - s.x, az = a.z - s.z, dx = b.x - a.x, dz = b.z - a.z;
    const A = dx * dx + dz * dz, B = 2 * (ax * dx + az * dz), C = ax * ax + az * az - s.r * s.r;
    if (A < 1e-12) return C <= 0 ? range[0] : -1;
    const disc = B * B - 4 * A * C;
    if (disc < 0) return -1;
    const q = Math.sqrt(disc);
    const t0 = Math.max(range[0], (-B - q) / (2 * A)), t1 = Math.min(range[1], (-B + q) / (2 * A));
    return t0 <= t1 ? t0 : -1;
  }
  const lx = (x, z) => (x - s.x) * s.cos - (z - s.z) * s.sin;
  const lz = (x, z) => (x - s.x) * s.sin + (z - s.z) * s.cos;
  const ax = lx(a.x, a.z), az = lz(a.x, a.z);
  slab(ax, lx(b.x, b.z) - ax, -s.hx, s.hx, range);
  slab(az, lz(b.x, b.z) - az, -s.hz, s.hz, range);
  return range[0] <= range[1] ? range[0] : -1;
}


export const segmentHits = (a, b, s, tMax = 1) => segmentEntry(a, b, s, tMax) >= 0;






export function occludedBy(camera, player, obstacles) {
  const chest = { x: player.x, y: (player.y || 0) + (player.height || 1.6) * CHEST_OF_HEIGHT, z: player.z };
  const len = Math.hypot(chest.x - camera.x, chest.y - camera.y, chest.z - camera.z);
  if (!(len > NEAR_PLAYER_M)) return null;
  const tMax = 1 - NEAR_PLAYER_M / len;
  
  const minX = Math.min(camera.x, chest.x) - 2, maxX = Math.max(camera.x, chest.x) + 2;
  const minZ = Math.min(camera.z, chest.z) - 2, maxZ = Math.max(camera.z, chest.z) + 2;
  
  
  let best = null, bestT = Infinity;
  for (const ob of obstacles) {
    const reach = ob.reach ?? ob.r ?? Math.hypot(ob.hx || 0, ob.hz || 0);
    if (ob.x + reach < minX || ob.x - reach > maxX || ob.z + reach < minZ || ob.z - reach > maxZ) continue;
    for (const s of solidsOf(ob)) {
      const t = segmentEntry(camera, chest, s, tMax);
      if (t >= 0 && t < bestT) { best = ob; bestT = t; }
    }
  }
  return best;
}
