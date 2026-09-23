













import { SeededRng } from '../../rng/seededRng.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export const FOAM = Object.freeze({
  
  
  everyS: 0.35,
  jitter: Object.freeze([0.85, 1.15]),
  lifeS: 0.9,
  
  
  innerR: 0.05,
  outerR: 0.08,
  
  growTo: 3,
  
  alpha: 0.55,
  fadeInS: 0.05,
  
  liftM: 0.004,
  maxDtS: 0.1,
});


export const FOAM_HOLE = FOAM.innerR / FOAM.outerR;

export function createFoamPool({ max = 24, seed = 1 } = {}) {
  return {
    max, capacity: max, alive: 0, emitted: 0, rings: [],
    due: new Map(),
    clock: 0,
    rng: new SeededRng((seed * 71317 + 29) >>> 0 || 1),
  };
}


export function setFoamMax(pool, max) {
  pool.max = Math.max(0, Math.min(pool.capacity, max | 0));
  if (pool.alive > pool.max) { pool.rings.length = pool.max; pool.alive = pool.max; }
  if (pool.max === 0) pool.due.clear();
  return pool;
}


export function emitFoam(pool, sources, dt) {
  const step = Math.min(Math.max(0, dt), FOAM.maxDtS);
  pool.clock += step;
  if (!(step > 0)) return 0;
  if (pool.max <= 0) { pool.due.clear(); return 0; }
  const now = pool.clock;
  const seen = new Set();
  let n = 0;
  for (const s of sources) {
    seen.add(s.key);
    const due = pool.due.get(s.key);
    if (due !== undefined && now < due) continue;
    pool.due.set(s.key, now + FOAM.everyS * pool.rng.rangeF(FOAM.jitter[0], FOAM.jitter[1]));
    if (pool.alive >= pool.max) continue;
    pool.rings[pool.alive++] = { x: s.x, y: s.y + FOAM.liftM, z: s.z, ageS: 0 };
    pool.emitted++;
    n++;
  }
  for (const key of [...pool.due.keys()]) if (!seen.has(key)) pool.due.delete(key);
  return n;
}


export function stepFoam(pool, dt) {
  const step = Math.min(Math.max(0, dt), FOAM.maxDtS);
  for (let i = pool.alive - 1; i >= 0; i--) {
    const p = pool.rings[i];
    p.ageS += step;
    if (p.ageS >= FOAM.lifeS) {
      pool.alive--;
      pool.rings[i] = pool.rings[pool.alive];
      pool.rings.length = pool.alive;
    }
  }
  return pool.alive;
}


export function foamPose(p) {
  const u = clamp(p.ageS / FOAM.lifeS, 0, 1);
  return {
    x: p.x, y: p.y, z: p.z,
    r: FOAM.outerR * (1 + (FOAM.growTo - 1) * u),
    alpha: FOAM.alpha * Math.min(1, p.ageS / FOAM.fadeInS) * (1 - u),
  };
}
