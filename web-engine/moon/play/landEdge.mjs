






























import { PARCELS, insideOutline } from '../world/parcels.mjs';

export const LAND_EDGE = Object.freeze({
  
  
  
  insetM: 0.25,
  widthM: 1.1,
  liftM: 0.04,
  
  
  
  stepM: 1.3,
  
  
  probeM: 0.12,
  
  
  
  
  
  
  
  
  
  tintMul: Object.freeze([0.70, 0.72, 0.82]),
  
  fadeMul: Object.freeze([1, 1, 1]),
  
  
  
  
  
  uvPerM: 1 / 2.6,
});






export function notMine(owned, parcels = PARCELS) {
  const mine = owned instanceof Set ? owned : new Set(owned || []);
  return parcels.map((p) => p.id).filter((id) => !mine.has(id)).sort((a, b) => a - b);
}

const hyp = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);








export function edgeBand(outline, cfg = LAND_EDGE) {
  if (!Array.isArray(outline) || outline.length < 3) return [];
  const M = outline.length;
  let perimeter = 0;
  for (let k = 0; k < M; k++) perimeter += hyp(outline[k][0], outline[k][1], outline[(k + 1) % M][0], outline[(k + 1) % M][1]);
  if (!(perimeter > 0)) return [];
  const count = Math.max(8, Math.round(perimeter / cfg.stepM));
  const step = perimeter / count;
  
  
  
  
  
  
  
  let mx = 0, mz = 0;
  for (const [px, pz] of outline) { mx += px; mz += pz; }
  mx /= M;
  mz /= M;
  const out = [];
  let k = 0, along = 0;
  for (let i = 0; i < count; i++) {
    const target = i * step;
    while (k < M - 1) {
      const seg = hyp(outline[k][0], outline[k][1], outline[(k + 1) % M][0], outline[(k + 1) % M][1]);
      if (along + seg >= target) break;
      along += seg;
      k++;
    }
    const a = outline[k], b = outline[(k + 1) % M];
    const len = hyp(a[0], a[1], b[0], b[1]) || 1;
    const t = Math.min(1, Math.max(0, (target - along) / len));
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[1] + (b[1] - a[1]) * t;
    
    let nx = -(b[1] - a[1]) / len;
    let nz = (b[0] - a[0]) / len;
    const toMiddle = Math.hypot(mx - x, mz - z) || 1;
    if (!(Math.abs(Math.hypot(nx, nz) - 1) < 1e-9)) {
      
      
      nx = (mx - x) / toMiddle;
      nz = (mz - z) / toMiddle;
    } else if (!insideOutline(outline, x + nx * cfg.probeM, z + nz * cfg.probeM)) {
      if (insideOutline(outline, x - nx * cfg.probeM, z - nz * cfg.probeM)) { nx = -nx; nz = -nz; }
      else if ((mx - x) * nx + (mz - z) * nz < 0) { nx = -nx; nz = -nz; }
    }
    out.push({ x, z, nx, nz });
  }
  return out;
}


export function rimsAt(p, cfg = LAND_EDGE) {
  return {
    outer: { x: p.x + p.nx * cfg.insetM, z: p.z + p.nz * cfg.insetM },
    inner: { x: p.x + p.nx * (cfg.insetM + cfg.widthM), z: p.z + p.nz * (cfg.insetM + cfg.widthM) },
  };
}
