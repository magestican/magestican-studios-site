
































const HAY = 10;      
const GLASS = 12;    



export const VISION_STEP = 0.25;














export function hasLineOfSight(grid, from, to, opts = {}) {
  const step = opts.stepSize ?? 0.5;
  const skipHay = opts.skipHay ?? true;   
  const skipGlass = opts.skipGlass ?? true; 
  const ignore = opts.ignoreCells ?? null;  
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 1e-6) return true;
  const steps = Math.max(1, Math.ceil(dist / step));
  const sx = dx / steps, sy = dy / steps, sz = dz / steps;
  for (let i = 1; i < steps; i++) {   
    const x = from.x + sx * i;
    const y = from.y + sy * i;
    const z = from.z + sz * i;
    const cx = Math.floor(x), cy = Math.floor(y), cz = Math.floor(z);
    const cell = grid.get(cx, cy, cz);
    if (cell === 0) continue;                
    if (skipHay && cell === HAY) continue;   
    if (skipGlass && cell === GLASS) continue; 
    if (ignore !== null && inIgnored(ignore, cx, cy, cz)) continue;
    return false;
  }
  return true;
}

function inIgnored(cells, x, y, z) {
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (c[0] === x && c[1] === y && c[2] === z) return true;
  }
  return false;
}






export function canShootThrough(grid, from, to, opts = {}) {
  return hasLineOfSight(grid, from, to, { ...opts, skipHay: true, skipGlass: true });
}







































export function hasVisionLine(grid, from, to, opts = {}) {
  return hasLineOfSight(grid, from, to, {
    stepSize: opts.stepSize ?? VISION_STEP,
    skipHay: false,     
    skipGlass: true,    
    ignoreCells: opts.ignoreCells ?? [
      [Math.floor(from.x), Math.floor(from.y), Math.floor(from.z)],
      [Math.floor(to.x), Math.floor(to.y), Math.floor(to.z)],
    ],
  });
}
