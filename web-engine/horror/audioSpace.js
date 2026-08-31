








































export const SPACE = Object.freeze({
  
  maxDist: 34,
  
  
  refDist: 2.2,
  
  
  
  airNear: 18000,
  airFar: 700,
  
  
  wetNear: 0.10,
  wetFar: 0.62,
  
  
  
  maxPan: 0.85,
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));











export function panOf(source, cam, fwd, opt = {}) {
  const cfg = { ...SPACE, ...opt };
  const dx = source.x - cam.x;
  const dz = source.z - cam.z;
  const d = Math.hypot(dx, dz);
  if (!(d > 1e-6)) return 0;
  const fm = Math.hypot(fwd.x, fwd.z) || 1;
  
  const rx = -fwd.z / fm;
  const rz = fwd.x / fm;
  
  
  
  
  return clamp(((dx * rx + dz * rz) / d) * cfg.maxPan, -cfg.maxPan, cfg.maxPan) || 0;
}








export function levelAt(dist, opt = {}) {
  const cfg = { ...SPACE, ...opt };
  if (!(dist < cfg.maxDist)) return null;
  const d = Math.max(0, dist);

  
  
  
  
  const gain = cfg.refDist / Math.max(cfg.refDist, d);

  
  const t = clamp(d / cfg.maxDist, 0, 1);
  const air = cfg.airFar + (cfg.airNear - cfg.airFar) * ((1 - t) ** 2.2);

  
  
  
  const wet = cfg.wetNear + (cfg.wetFar - cfg.wetNear) * t;

  return { gain, air, wet, t };
}














export function makeImpulse(rate, opt = {}) {
  const seconds = opt.seconds ?? 1.35;
  const decay = opt.decay ?? 3.4;
  const n = Math.max(1, Math.floor(rate * seconds));
  const L = new Float32Array(n);
  const R = new Float32Array(n);

  
  
  let s = 0x2f6f4a;
  const rnd = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return (s / 4294967296) * 2 - 1;
  };

  
  
  
  
  
  
  
  
  const buildSamples = Math.max(1, Math.floor(rate * 0.08));
  for (let i = 0; i < n; i += 1) {
    const t = i / n;
    const env = (1 - t) ** decay;
    const build = Math.min(1, i / buildSamples) ** 1.6;
    
    
    
    
    L[i] = rnd() * env * build * 0.5;
    R[i] = rnd() * env * build * 0.5;
  }

  
  
  
  
  const walls = [0.011, 0.019, 0.028, 0.041, 0.057, 0.078];
  for (let k = 0; k < walls.length; k += 1) {
    const i = Math.floor(walls[k] * rate);
    if (i >= n) break;
    
    
    
    const a = 0.95 * ((1 - k / walls.length) ** 1.3);
    
    L[i] += a;
    R[Math.min(n - 1, i + 3 + k)] += a * 0.92;
  }

  return { left: L, right: R, length: n };
}
