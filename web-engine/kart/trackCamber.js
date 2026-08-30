





























































































import { curvatureOf } from './racingLine.js';

const clamp = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));


















export const CAMBER_SHARE = 0.075;










export const CAMBER_K_MIN = 0.004;









export const CAMBER_MAX_SLOPE = 0.16;









export const CAMBER_MAX_RISE = 1.35;














export const CAMBER_TWIST = 0.03;











export const CAMBER_SMOOTH_ARC = 26;
export const CAMBER_SMOOTH_PASSES = 2;
















export const CAMBER_START = 0.35;






























export const COLUMN_T = Object.freeze([
  -1, -0.85, -0.675, -0.5, -CAMBER_START, 0, CAMBER_START, 0.5, 0.675, 0.85, 1,
]);


export const CAMBER_COLS = COLUMN_T.length;




















export const CAMBER_GRIP = 0.6;


export const CAMBER_GRAVITY = 26;


export const CAMBER_LAT_ACCEL = 34;










export const CAMBER_VMAX = 55;
















export function camberDemand(k, {
  gravity = CAMBER_GRAVITY, latAccel = CAMBER_LAT_ACCEL, vmax = CAMBER_VMAX,
} = {}) {
  const a = Math.abs(k);
  if (!(a > 0)) return 0;
  const v2 = Math.min(vmax * vmax, latAccel / a);
  return (v2 * a) / Math.max(gravity, 1e-6);
}















export function camberProfile(t) {
  const u = clamp((t - CAMBER_START) / (1 - CAMBER_START), 0, 1);
  return u * u * (3 - 2 * u);
}









export function smoothCurvature(path, {
  arc = CAMBER_SMOOTH_ARC, passes = CAMBER_SMOOTH_PASSES,
} = {}) {
  const n = path.count;
  let cur = curvatureOf(path);
  const perM = n / Math.max(path.length, 1e-6);
  const half = Math.max(1, Math.round((arc * perM) / 2));
  for (let p = 0; p < passes; p += 1) {
    const next = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      let sum = 0;
      for (let j = -half; j <= half; j += 1) sum += cur[((i + j) % n + n) % n];
      next[i] = sum / (half * 2 + 1);
    }
    cur = next;
  }
  return cur;
}





































export function planCamber(path, {
  scale = 1, perPoint = null, gravity = CAMBER_GRAVITY,
  latAccel = CAMBER_LAT_ACCEL, vmax = CAMBER_VMAX,
} = {}) {
  const n = path.count;
  const k = smoothCurvature(path);
  const rise = new Float64Array(n);
  const opts = { gravity, latAccel, vmax };
  
  
  const floor = camberDemand(CAMBER_K_MIN, opts);

  for (let i = 0; i < n; i += 1) {
    const half = Math.max(1e-6, path.pts[i].width / 2);
    const tan = CAMBER_SHARE * Math.max(0, camberDemand(k[i], opts) - floor);
    
    
    
    
    
    
    
    
    const rollSpan = (1 - CAMBER_START) * half;
    const mag = Math.min(
      tan * half,
      (CAMBER_MAX_SLOPE * rollSpan) / 1.5,
      CAMBER_MAX_RISE,
    );
    const dial = scale * (perPoint ? perPoint[i] : 1);
    
    
    const v = -Math.sign(k[i]) * Math.max(0, mag) * Math.max(0, dial);
    
    
    
    
    
    rise[i] = v === 0 ? 0 : v;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  const ds = new Float64Array(n);
  for (let i = 0; i < n; i += 1) ds[i] = Math.max(1e-6, path.s[i + 1] - path.s[i]);
  for (let pass = 0; pass < 3; pass += 1) {
    const fwd = pass % 2 === 0;
    for (let step = 0; step < n; step += 1) {
      const i = fwd ? step : n - 1 - step;
      const j = fwd ? (i + 1) % n : ((i - 1) % n + n) % n;
      
      
      const span = CAMBER_TWIST * ds[fwd ? i : j];
      const d = rise[j] - rise[i];
      if (d > span) rise[j] = rise[i] + span;
      else if (d < -span) rise[j] = rise[i] - span;
    }
  }

  return { rise, count: n, k };
}






















export function roadCrossSection(camber, i) {
  const rise = camber && camber.rise ? (camber.rise[i % camber.count] ?? 0) : 0;
  const mag = Math.abs(rise);
  
  
  const up = Math.sign(rise);
  const out = new Array(CAMBER_COLS);
  for (let j = 0; j < CAMBER_COLS; j += 1) {
    const t = COLUMN_T[j];
    out[j] = { t, lift: mag * camberProfile(t * up) };
  }
  return out;
}

















export function camberLiftAt(camber, i, t) {
  const rise = camber && camber.rise ? (camber.rise[i % camber.count] ?? 0) : 0;
  if (!rise) return 0;
  const mag = Math.abs(rise);
  const up = Math.sign(rise);
  
  
  const q = clamp(t, -1, 1) * up;
  if (q <= CAMBER_START) return 0;
  
  
  for (let j = 0; j < CAMBER_COLS - 1; j += 1) {
    const a = COLUMN_T[j];
    const b = COLUMN_T[j + 1];
    if (q >= a && q <= b) {
      const fa = camberProfile(a);
      const fb = camberProfile(b);
      const u = (q - a) / Math.max(b - a, 1e-9);
      return mag * (fa + (fb - fa) * u);
    }
  }
  return mag;
}






















export function camberSlopeAt(camber, i, t, halfWidth) {
  const rise = camber && camber.rise ? (camber.rise[i % camber.count] ?? 0) : 0;
  if (!rise) return 0;
  const half = Math.max(1e-6, halfWidth);
  const mag = Math.abs(rise);
  const up = Math.sign(rise);
  if (t <= -1 || t >= 1) return 0;
  const q = t * up;
  if (q <= CAMBER_START) return 0;
  for (let j = 0; j < CAMBER_COLS - 1; j += 1) {
    const a = COLUMN_T[j];
    const b = COLUMN_T[j + 1];
    if (q >= a && q < b) {
      const slope = (camberProfile(b) - camberProfile(a)) / (b - a);
      
      
      return (mag * slope * up) / half;
    }
  }
  return 0;
}










export function camberEdgeY(camber, i, side) {
  return camberLiftAt(camber, i, side >= 0 ? 1 : -1);
}











export function camberStats(camber, path, min = 0.05) {
  const n = camber.count;
  let banked = 0;
  let peak = 0;
  let sum = 0;
  const all = [];
  for (let i = 0; i < n; i += 1) {
    const a = Math.abs(camber.rise[i]);
    if (a >= min) banked += 1;
    if (a > peak) peak = a;
    sum += a;
    all.push(a);
  }
  all.sort((x, y) => x - y);
  
  
  let steepest = 0;
  for (let i = 0; i < n; i += 1) {
    const half = Math.max(1e-6, path.pts[i].width / 2);
    for (const t of COLUMN_T) {
      const s = Math.abs(camberSlopeAt(camber, i, t * 0.999, half));
      if (s > steepest) steepest = s;
    }
  }
  return {
    bankedFrac: banked / n,
    peak,
    mean: sum / n,
    p50: all[Math.floor(n * 0.5)],
    steepest,
  };
}
