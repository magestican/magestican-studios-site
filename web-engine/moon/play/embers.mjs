





































import { SeededRng } from '../../rng/seededRng.js';
import { windAt } from './leaves.mjs';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export const EMBERS = Object.freeze({
  
  
  
  perS: 1.8,
  
  
  jitter: Object.freeze([0.7, 1.3]),
  
  lifeS: 1.1,
  
  riseMps: Object.freeze([0.6, 1.1]),
  
  
  
  driftMps: 0.5,
  leanFrom: 0.2,
  
  
  wobbleMps: 0.12,
  wobbleHz: Object.freeze([0.6, 1.1]),
  
  startR: 0.028,
  endR: 0.006,
  
  jitterM: 0.09,
  
  alpha: 0.95,
  fadeInS: 0.04,
  
  
  maxDtS: 0.1,
});

export function createEmberPool({ max = 32, seed = 1 } = {}) {
  return {
    max, capacity: max, alive: 0, emitted: 0, embers: [],
    
    
    
    due: new Map(),
    clock: 0,
    rng: new SeededRng((seed * 40503 + 11) >>> 0 || 1),
  };
}


export function setEmberMax(pool, max) {
  pool.max = Math.max(0, Math.min(pool.capacity, max | 0));
  if (pool.alive > pool.max) { pool.embers.length = pool.max; pool.alive = pool.max; }
  if (pool.max === 0) pool.due.clear();
  return pool;
}










export function emitEmbers(pool, sources, dt, t) {
  const step = Math.min(Math.max(0, dt), EMBERS.maxDtS);
  pool.clock += step;
  if (!(step > 0)) return 0;
  if (pool.max <= 0) { pool.due.clear(); return 0; }
  const now = pool.clock;
  const { rng } = pool;
  const every = 1 / EMBERS.perS;
  const seen = new Set();
  let n = 0;
  for (const s of sources) {
    seen.add(s.key);
    
    const due = pool.due.get(s.key);
    if (due !== undefined && now < due) continue;
    
    
    
    
    pool.due.set(s.key, now + every * rng.rangeF(EMBERS.jitter[0], EMBERS.jitter[1]));
    if (pool.alive >= pool.max) continue;
    const a = rng.rangeF(0, TAU);
    const rr = Math.sqrt(rng.next()) * EMBERS.jitterM;
    pool.embers[pool.alive++] = {
      x: s.x + Math.cos(a) * rr,
      y: s.y,
      z: s.z + Math.sin(a) * rr,
      rise: rng.rangeF(EMBERS.riseMps[0], EMBERS.riseMps[1]),
      wobbleHz: rng.rangeF(EMBERS.wobbleHz[0], EMBERS.wobbleHz[1]),
      phase: rng.rangeF(0, TAU),
      ageS: 0,
    };
    pool.emitted++;
    n++;
  }
  for (const key of [...pool.due.keys()]) if (!seen.has(key)) pool.due.delete(key);
  return n;
}






export function stepEmbers(pool, dt, t, windScale = 1) {
  const step = Math.min(Math.max(0, dt), EMBERS.maxDtS);
  for (let i = pool.alive - 1; i >= 0; i--) {
    const p = pool.embers[i];
    p.ageS += step;
    if (p.ageS >= EMBERS.lifeS) {
      pool.alive--;
      pool.embers[i] = pool.embers[pool.alive];
      pool.embers.length = pool.alive;
      continue;
    }
    const u = p.ageS / EMBERS.lifeS;
    const [wx, wz] = windAt(p.x, p.z, t);
    const across = Math.cos(t * p.wobbleHz * TAU + p.phase) * EMBERS.wobbleMps * windScale;
    const lean = EMBERS.driftMps * (EMBERS.leanFrom + (1 - EMBERS.leanFrom) * u) * windScale;
    p.x += (wx * lean - wz * across) * step;
    p.z += (wz * lean + wx * across) * step;
    p.y += p.rise * step;
  }
  return pool.alive;
}






export function emberPose(p) {
  const u = clamp(p.ageS / EMBERS.lifeS, 0, 1);
  const r = EMBERS.startR + (EMBERS.endR - EMBERS.startR) * u;
  const out = 1 - u;
  return {
    x: p.x, y: p.y, z: p.z, r,
    alpha: EMBERS.alpha * Math.min(1, p.ageS / EMBERS.fadeInS) * out,
    heat: out,
  };
}
