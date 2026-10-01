



































import { SeededRng } from '../../rng/seededRng.js';
import { windAt } from './leaves.mjs';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export const SPLASH = Object.freeze({
  
  
  perS: 16,
  jitter: Object.freeze([0.8, 1.2]),
  
  lifeS: Object.freeze([0.4, 0.6]),
  
  outMps: Object.freeze([0.3, 0.9]),
  
  upMps: Object.freeze([0.4, 0.9]),
  
  gravity: 2.6,
  
  
  windShare: 0.12,
  
  startR: 0.012,
  endR: 0.004,
  
  jitterM: 0.03,
  
  alpha: 0.85,
  fadeInS: 0.02,
  
  maxDtS: 0.1,
});

export function createSplashPool({ max = 64, seed = 1 } = {}) {
  return {
    max, capacity: max, alive: 0, emitted: 0, drops: [],
    
    
    
    due: new Map(),
    clock: 0,
    rng: new SeededRng((seed * 96557 + 13) >>> 0 || 1),
  };
}


export function setSplashMax(pool, max) {
  pool.max = Math.max(0, Math.min(pool.capacity, max | 0));
  if (pool.alive > pool.max) { pool.drops.length = pool.max; pool.alive = pool.max; }
  if (pool.max === 0) pool.due.clear();
  return pool;
}







export function emitSplash(pool, sources, dt, t) {
  const step = Math.min(Math.max(0, dt), SPLASH.maxDtS);
  pool.clock += step;
  if (!(step > 0)) return 0;
  if (pool.max <= 0) { pool.due.clear(); return 0; }
  const now = pool.clock;
  const { rng } = pool;
  const every = 1 / SPLASH.perS;
  const seen = new Set();
  let n = 0;
  for (const s of sources) {
    seen.add(s.key);
    const due = pool.due.get(s.key);
    if (due !== undefined && now < due) continue;
    pool.due.set(s.key, now + every * rng.rangeF(SPLASH.jitter[0], SPLASH.jitter[1]));
    if (pool.alive >= pool.max) continue;
    const a = rng.rangeF(0, TAU);
    const rr = Math.sqrt(rng.next()) * SPLASH.jitterM;
    const out = rng.rangeF(SPLASH.outMps[0], SPLASH.outMps[1]);
    pool.drops[pool.alive++] = {
      x: s.x + Math.cos(a) * rr,
      y: s.y,
      z: s.z + Math.sin(a) * rr,
      vx: Math.cos(a) * out,
      vz: Math.sin(a) * out,
      vy: rng.rangeF(SPLASH.upMps[0], SPLASH.upMps[1]),
      lifeS: rng.rangeF(SPLASH.lifeS[0], SPLASH.lifeS[1]),
      ageS: 0,
    };
    pool.emitted++;
    n++;
  }
  for (const key of [...pool.due.keys()]) if (!seen.has(key)) pool.due.delete(key);
  return n;
}







export function stepSplash(pool, dt, t, windScale = 1) {
  const step = Math.min(Math.max(0, dt), SPLASH.maxDtS);
  for (let i = pool.alive - 1; i >= 0; i--) {
    const p = pool.drops[i];
    p.ageS += step;
    if (p.ageS >= p.lifeS) {
      pool.alive--;
      pool.drops[i] = pool.drops[pool.alive];
      pool.drops.length = pool.alive;
      continue;
    }
    p.vy -= SPLASH.gravity * step;
    const [wx, wz] = windAt(p.x, p.z, t);
    p.x += (p.vx + wx * SPLASH.windShare * windScale) * step;
    p.z += (p.vz + wz * SPLASH.windShare * windScale) * step;
    p.y += p.vy * step;
  }
  return pool.alive;
}


export function splashPose(p) {
  const u = clamp(p.ageS / p.lifeS, 0, 1);
  const r = SPLASH.startR + (SPLASH.endR - SPLASH.startR) * u;
  const out = 1 - u;
  return {
    x: p.x, y: p.y, z: p.z, r,
    alpha: SPLASH.alpha * Math.min(1, p.ageS / SPLASH.fadeInS) * out,
  };
}









export function landingsInWorld({ x, y = 0, z, rotY = 0 }, local, keyPrefix) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  return local.map((l, i) => ({
    key: `${keyPrefix}:${i}`,
    x: x + l.x * c + l.z * s,
    y: y + l.y,
    z: z + (-l.x * s + l.z * c),
  }));
}




export const POUR_S = 0.7;


export function pourSource(pour, nowS) {
  if (!pour || !(nowS >= pour.atS) || nowS >= pour.atS + POUR_S) return null;
  return { key: 'pour', x: pour.x, y: pour.y, z: pour.z };
}
