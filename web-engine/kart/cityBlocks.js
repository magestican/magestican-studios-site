

































export const MIN_CLEAR = 18;


export const TOP_MARGIN = 7;


export const TALL_SHARE = 0.16;















export function cityBlocks(samples, spec) {
  const { count, floorY, lipY, spread = 70, rng } = spec;
  const minClear = spec.minClear ?? MIN_CLEAR;
  if (!samples || samples.length < 2) throw new Error('a city needs at least two road samples');
  if (!(count > 0)) return [];
  
  
  const maxH = (lipY - floorY) - TOP_MARGIN;
  if (!(maxH > 2)) {
    throw new Error(`a ${(lipY - floorY).toFixed(1)} m gap leaves no room for a town`
      + ` under a ${TOP_MARGIN} m margin`);
  }

  const out = [];
  for (let i = 0; i < count; i += 1) {
    
    const t = rng.next() * (samples.length - 1);
    const i0 = Math.min(samples.length - 2, Math.floor(t));
    const f = t - i0;
    const a = samples[i0];
    const b = samples[i0 + 1];
    const cx = a.x + (b.x - a.x) * f;
    const cz = a.z + (b.z - a.z) * f;

    
    
    
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len; tz /= len;
    const nx = -tz;
    const nz = tx;

    const side = rng.next() < 0.5 ? -1 : 1;
    const tall = rng.next() < TALL_SHARE;
    const w = 5 + rng.next() * 7;
    const d = 5 + rng.next() * 7;
    const h = tall
      ? Math.min(maxH, maxH * (0.62 + rng.next() * 0.38))
      : Math.min(maxH, 5 + rng.next() * (maxH * 0.42));

    
    
    
    
    
    
    const halfDiag = Math.hypot(w, d) / 2;
    
    
    const u = rng.next();
    
    
    
    const off = minClear + halfDiag + u * u * spread + (tall ? 10 : 0);

    out.push({
      x: cx + nx * side * off,
      z: cz + nz * side * off,
      w,
      d,
      h,
      
      
      yaw: Math.atan2(tx, tz) + (rng.next() - 0.5) * 0.5,
      tall,
    });
  }
  return out;
}









export function distanceToPath(x, z, samples) {
  let best = Infinity;
  for (let i = 0; i < samples.length - 1; i += 1) {
    const a = samples[i];
    const b = samples[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - a.x) * dx + (z - a.z) * dz) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + dx * t;
    const pz = a.z + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) best = d;
  }
  return best;
}
