

















































import { SeededRng } from '../../rng/seededRng.js';
import { windAt } from './leaves.mjs';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export const SMOKE = Object.freeze({
  
  
  puffsPerS: 2.2,
  
  
  jitter: Object.freeze([0.75, 1.25]),
  
  lifeS: 3.6,
  
  riseMps: Object.freeze([0.5, 0.75]),
  
  
  driftMps: 0.8,
  leanFrom: 0.25,
  
  wobbleMps: 0.14,
  wobbleHz: Object.freeze([0.2, 0.45]),
  
  
  startR: 0.1,
  endR: 0.5,
  growPower: 0.65,
  
  jitterM: 0.05,
  
  alpha: 0.42,
  fadeInS: 0.3,
  
  
  maxDtS: 0.1,
  
  warmS: 2.5,
});







export function atHome(pose) {
  return Boolean(pose && pose.inside);
}


export function stepWarmth(warmth, wanted, dt) {
  const step = Math.min(Math.max(0, dt), SMOKE.maxDtS);
  const k = step / SMOKE.warmS;
  return clamp((Number.isFinite(warmth) ? warmth : 0) + (wanted ? k : -k), 0, 1);
}

export function createSmokePool({ max = 48, seed = 1 } = {}) {
  return {
    max, capacity: max, alive: 0, emitted: 0, puffs: [],
    
    
    due: new Map(),
    clock: 0,
    rng: new SeededRng((seed * 15485863 + 7) >>> 0 || 1),
  };
}


export function setSmokeMax(pool, max) {
  pool.max = Math.max(0, Math.min(pool.capacity, max | 0));
  if (pool.alive > pool.max) { pool.puffs.length = pool.max; pool.alive = pool.max; }
  if (pool.max === 0) pool.due.clear();
  return pool;
}










export function emitSmoke(pool, sources, dt, t) {
  const step = Math.min(Math.max(0, dt), SMOKE.maxDtS);
  pool.clock += step;
  
  
  if (!(step > 0)) return 0;
  if (pool.max <= 0) { pool.due.clear(); return 0; }
  const now = pool.clock;
  const { rng } = pool;
  const every = 1 / SMOKE.puffsPerS;
  const seen = new Set();
  let n = 0;
  for (const s of sources) {
    const warmth = clamp(Number.isFinite(s.warmth) ? s.warmth : 1, 0, 1);
    if (!(warmth > 0)) continue;
    seen.add(s.key);
    
    
    
    
    
    
    
    const due = pool.due.get(s.key);
    if (due !== undefined && now < due) continue;
    
    
    
    pool.due.set(s.key, now + (every * rng.rangeF(SMOKE.jitter[0], SMOKE.jitter[1])) / warmth);
    if (pool.alive >= pool.max) continue;
    const a = rng.rangeF(0, TAU);
    const rr = Math.sqrt(rng.next()) * SMOKE.jitterM;
    pool.puffs[pool.alive++] = {
      x: s.x + Math.cos(a) * rr,
      y: s.y,
      z: s.z + Math.sin(a) * rr,
      rise: rng.rangeF(SMOKE.riseMps[0], SMOKE.riseMps[1]),
      wobbleHz: rng.rangeF(SMOKE.wobbleHz[0], SMOKE.wobbleHz[1]),
      phase: rng.rangeF(0, TAU),
      ageS: 0,
    };
    pool.emitted++;
    n++;
  }
  for (const key of [...pool.due.keys()]) if (!seen.has(key)) pool.due.delete(key);
  return n;
}






export function stepSmoke(pool, dt, t, windScale = 1) {
  const step = Math.min(Math.max(0, dt), SMOKE.maxDtS);
  for (let i = pool.alive - 1; i >= 0; i--) {
    const p = pool.puffs[i];
    p.ageS += step;
    if (p.ageS >= SMOKE.lifeS) {
      pool.alive--;
      pool.puffs[i] = pool.puffs[pool.alive];
      pool.puffs.length = pool.alive;
      continue;
    }
    const u = p.ageS / SMOKE.lifeS;
    const [wx, wz] = windAt(p.x, p.z, t);
    const across = Math.cos(t * p.wobbleHz * TAU + p.phase) * SMOKE.wobbleMps * windScale;
    const lean = SMOKE.driftMps * (SMOKE.leanFrom + (1 - SMOKE.leanFrom) * u) * windScale;
    p.x += (wx * lean - wz * across) * step;
    p.z += (wz * lean + wx * across) * step;
    p.y += p.rise * step;
  }
  return pool.alive;
}





export function puffPose(p) {
  const u = clamp(p.ageS / SMOKE.lifeS, 0, 1);
  const r = SMOKE.startR + (SMOKE.endR - SMOKE.startR) * Math.pow(u, SMOKE.growPower);
  const out = 1 - u;
  return { x: p.x, y: p.y, z: p.z, r, alpha: SMOKE.alpha * Math.min(1, p.ageS / SMOKE.fadeInS) * out * out };
}
