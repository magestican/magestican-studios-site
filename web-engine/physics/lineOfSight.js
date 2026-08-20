// Voxel line-of-sight raymarch. Steps along `dir` from `from` in `stepSize`
// increments up to `maxDist`. Returns false if any solid voxel is hit
// before reaching `maxDist`; true if the ray reaches its destination free.
//
// Used by bots so they don't fire through walls.

export function hasLineOfSight(grid, from, to, opts = {}) {
  const step = opts.stepSize ?? 0.5;
  const skipHay = opts.skipHay ?? true;   // hay is see-through-shootable
  const HAY = 10;
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 1e-6) return true;
  const steps = Math.max(1, Math.ceil(dist / step));
  const sx = dx / steps, sy = dy / steps, sz = dz / steps;
  for (let i = 1; i < steps; i++) {   // skip i=0 (the shooter's own cell)
    const x = from.x + sx * i;
    const y = from.y + sy * i;
    const z = from.z + sz * i;
    const cell = grid.get(x | 0, y | 0, z | 0);
    if (cell === 0) continue;                // AIR
    if (skipHay && cell === HAY) continue;   // hay doesn't block sightlines
    return false;
  }
  return true;
}
