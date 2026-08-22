





export function hasLineOfSight(grid, from, to, opts = {}) {
  const step = opts.stepSize ?? 0.5;
  const skipHay = opts.skipHay ?? true;   
  const skipGlass = opts.skipGlass ?? true; 
  const HAY = 10;
  const GLASS = 12;
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 1e-6) return true;
  const steps = Math.max(1, Math.ceil(dist / step));
  const sx = dx / steps, sy = dy / steps, sz = dz / steps;
  for (let i = 1; i < steps; i++) {   
    const x = from.x + sx * i;
    const y = from.y + sy * i;
    const z = from.z + sz * i;
    const cell = grid.get(x | 0, y | 0, z | 0);
    if (cell === 0) continue;                
    if (skipHay && cell === HAY) continue;   
    if (skipGlass && cell === GLASS) continue; 
    return false;
  }
  return true;
}
