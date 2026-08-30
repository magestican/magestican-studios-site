










































export function surfaceY(grid, x, z) {
  for (let y = 1; y < 11; y++) {
    if (!grid.isSolid(x + 0.5, y + 0.5, z + 0.5)) {
      
      
      if (grid.isSolid(x + 0.5, y + 1.5, z + 0.5)) return null;
      return y;
    }
  }
  return null;
}








export const FLOCK_MAGNETS = Object.freeze([
  'pretzel-stand',   
  'hot-dog-cart',
  'feed-sack',       
  'trough',
  'fish-crate',      
  'bench',
  'bin',
  'cairn',           
]);







export const HUDDLE_RADIUS = 5;






export const NEAR_RING = Object.freeze({ min: 2, max: 4 });




export const KEEP_CLEAR = 1.6;








export const MIN_HUDDLE = 3;






export const MAGNET_SHARE = 0.5;






export function flockAnchors(spots, radius = HUDDLE_RADIUS) {
  const n = spots?.length ?? 0;
  if (!n) return [];
  const owner = new Array(n).fill(-1);
  const r2 = radius * radius;
  let groups = 0;
  for (let i = 0; i < n; i++) {
    if (owner[i] >= 0) continue;
    const g = groups++;
    owner[i] = g;
    
    
    
    
    const queue = [i];
    while (queue.length) {
      const a = queue.pop();
      for (let b = 0; b < n; b++) {
        if (owner[b] >= 0) continue;
        const dx = spots[a].x - spots[b].x;
        const dz = spots[a].z - spots[b].z;
        if (dx * dx + dz * dz > r2) continue;
        owner[b] = g;
        queue.push(b);
      }
    }
  }
  const acc = Array.from({ length: groups }, () => ({ x: 0, z: 0, n: 0 }));
  for (let i = 0; i < n; i++) {
    const a = acc[owner[i]];
    a.x += spots[i].x; a.z += spots[i].z; a.n++;
  }
  return acc
    .map((a) => ({ x: a.x / a.n, z: a.z / a.n, n: a.n }))
    .sort((p, q) => q.n - p.n || p.x - q.x || p.z - q.z);
}






function ringTiles(cx, cz, { min, max }) {
  const out = [];
  const r = Math.ceil(max);
  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      const d = Math.hypot(dx, dz);
      if (d < min || d > max) continue;
      out.push({ x: Math.round(cx + dx), z: Math.round(cz + dz), d,
                 a: Math.atan2(dz, dx) });
    }
  }
  
  
  return out.sort((p, q) => p.d - q.d || p.a - q.a);
}








export function planFlockFurniture({ anchors, spots = [], counts, canPlace,
                                     ring = NEAR_RING, keepClear = KEEP_CLEAR,
                                     magnets = FLOCK_MAGNETS,
                                     minHuddle = MIN_HUDDLE,
                                     share = MAGNET_SHARE }) {
  const cycle = magnets.filter((id) => (counts?.[id] ?? 0) > 0);
  if (!cycle.length || !anchors?.length) return [];
  const left = new Map(cycle.map((id) => [id, Math.max(1, Math.floor(counts[id] * share))]));
  const used = new Set();
  const clear2 = keepClear * keepClear;
  const plan = [];
  let cursor = 0;
  for (const anchor of anchors) {
    if ((anchor.n ?? 0) < minHuddle) continue;
    
    
    
    
    let chose = null;
    for (let step = 0; step < cycle.length && !chose; step++) {
      const id = cycle[(cursor + step) % cycle.length];
      if ((left.get(id) ?? 0) <= 0) continue;
      for (const t of ringTiles(anchor.x, anchor.z, ring)) {
        const key = `${t.x},${t.z}`;
        if (used.has(key)) continue;
        if (spots.some((s) => {
          const dx = s.x - (t.x + 0.5), dz = s.z - (t.z + 0.5);
          return dx * dx + dz * dz < clear2;
        })) continue;
        if (!canPlace(id, t.x, t.z)) continue;
        chose = { id, x: t.x, z: t.z };
        used.add(key);
        left.set(id, left.get(id) - 1);
        cursor = (cursor + step + 1) % cycle.length;
        break;
      }
    }
    if (chose) plan.push(chose);
  }
  return plan;
}
