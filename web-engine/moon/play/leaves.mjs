
































import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette, linear } from '../palette/seasons.mjs';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export const LEAF = Object.freeze({
  
  
  
  
  
  lengthM: 0.22,
  widthM: 0.14,
  
  fallMps: Object.freeze([0.35, 0.6]),
  
  
  driftMps: 0.9,
  
  flutterMps: 0.25,
  flutterHz: Object.freeze([0.8, 1.4]),
  
  spinRps: Object.freeze([0.5, 1.4]),
  
  restS: 2.5,
  fadeS: 0.8,
  
  
  maxDtS: 0.1,
  
  rate: Object.freeze({ autumn: 0.5, summer: 0.06, spring: 0.04, winter: 0 }),
  
  
  
  colourWeights: Object.freeze([0.5, 0.35, 0.15]),
});



export function windAt(x, z, t) {
  const a = Math.sin(t * 1.3 + x * 0.35 + z * 0.22) + 0.5 * Math.sin(t * 2.7 - x * 0.6 + z * 0.9) + 0.25 * Math.sin(t * 5.1 + z * 1.7);
  const b = 0.6 * Math.sin(t * 1.1 + x * 0.28 - z * 0.3) + 0.3 * Math.sin(t * 3.3 + x * 1.1);
  return [0.55 + 0.45 * a, b].map((v) => v * 0.57);
}


export function gustAt(x, z, t) {
  const [wx, wz] = windAt(x, z, t);
  return Math.hypot(wx, wz) / 0.57;
}


export function sheds(kind, stage) {
  return (kind === 'apple' || kind === 'peach') && (stage === 'fruiting' || stage === 'young');
}


export function shedRate(season, gust) {
  const base = LEAF.rate[season] ?? 0;
  if (base === 0) return 0;
  const g = clamp(gust, 0, 1.75);
  return season === 'autumn' ? base * (0.5 + 0.5 * g) : base * g * g;
}


export function leafColours(season) {
  return seasonPalette(season).leaf.map(linear);
}


export function pickColour(colours, rng) {
  const w = LEAF.colourWeights;
  let u = rng.next(), i = 0;
  for (; i < colours.length - 1; i++) {
    const share = w[i] ?? 0;
    if (u < share) break;
    u -= share;
  }
  return colours[Math.min(i, colours.length - 1)];
}

export function createLeafPool({ max = 64, seed = 1 } = {}) {
  return { max, capacity: max, alive: 0, emitted: 0, leaves: [], rng: new SeededRng((seed * 104729 + 31) >>> 0 || 1) };
}


export function setLeafMax(pool, max) {
  pool.max = Math.max(0, Math.min(pool.capacity, max | 0));
  if (pool.alive > pool.max) { pool.leaves.length = pool.max; pool.alive = pool.max; }
  return pool;
}








export function emitLeaves(pool, sources, dt, t, windScale = 1) {
  const step = Math.min(dt, LEAF.maxDtS);
  if (!(step > 0) || !(windScale > 0) || pool.alive >= pool.max) return 0;
  const { rng } = pool;
  let n = 0;
  for (const s of sources) {
    if (pool.alive >= pool.max) break;
    if (!sheds(s.kind, s.stage)) continue;
    const rate = shedRate(s.season, gustAt(s.x, s.z, t)) * windScale;
    if (rate === 0 || rng.next() >= rate * step) continue;
    const a = rng.rangeF(0, TAU);
    const rr = s.r * (0.55 + 0.45 * rng.next());
    const leaf = {
      x: s.x + Math.cos(a) * rr,
      y: s.y + s.h * rng.rangeF(-0.6, 0.5),
      z: s.z + Math.sin(a) * rr,
      floor: s.floor,
      colour: pickColour(s.colours, rng),
      fall: rng.rangeF(LEAF.fallMps[0], LEAF.fallMps[1]),
      flutterHz: rng.rangeF(LEAF.flutterHz[0], LEAF.flutterHz[1]),
      phase: rng.rangeF(0, TAU),
      rx: rng.rangeF(0, TAU), ry: rng.rangeF(0, TAU), rz: rng.rangeF(0, TAU),
      sx: rng.rangeF(LEAF.spinRps[0], LEAF.spinRps[1]) * (rng.chance(0.5) ? 1 : -1),
      sz: rng.rangeF(LEAF.spinRps[0], LEAF.spinRps[1]) * (rng.chance(0.5) ? 1 : -1),
      restT: -1, 
    };
    pool.leaves[pool.alive++] = leaf;
    pool.emitted++;
    n++;
  }
  return n;
}


export function stepLeaves(pool, dt, t) {
  const step = Math.min(Math.max(0, dt), LEAF.maxDtS);
  for (let i = pool.alive - 1; i >= 0; i--) {
    const l = pool.leaves[i];
    if (l.restT < 0) {
      const [wx, wz] = windAt(l.x, l.z, t);
      const across = Math.cos(t * l.flutterHz * TAU + l.phase) * LEAF.flutterMps;
      l.x += (wx * LEAF.driftMps - wz * across) * step;
      l.z += (wz * LEAF.driftMps + wx * across) * step;
      l.y -= l.fall * step;
      l.rx += l.sx * TAU * step;
      l.rz += l.sz * TAU * step;
      if (l.y <= l.floor + 0.005) {
        l.y = l.floor + 0.005;
        l.restT = 0;
        
        l.rx = 0; l.rz = 0;
      }
    } else {
      l.restT += step;
      if (l.restT >= LEAF.restS) {
        pool.alive--;
        pool.leaves[i] = pool.leaves[pool.alive];
        pool.leaves.length = pool.alive;
      }
    }
  }
  return pool.alive;
}


export function leafPose(l) {
  const fading = l.restT >= 0 ? clamp((LEAF.restS - l.restT) / LEAF.fadeS, 0, 1) : 1;
  return { x: l.x, y: l.y, z: l.z, rx: l.rx, ry: l.ry, rz: l.rz, scale: fading, colour: l.colour };
}
