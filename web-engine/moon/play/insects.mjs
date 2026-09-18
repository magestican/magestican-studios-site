







































import { SeededRng } from '../../rng/seededRng.js';
import { wingColours } from '../art/insect.mjs';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrapPi = (a) => ((a + Math.PI * 3) % TAU) - Math.PI;

export const INSECT = Object.freeze({
  
  
  
  
  seasonMax: Object.freeze({ spring: 3, summer: 3, autumn: 2, winter: 0 }),
  
  
  
  nearM: 2.2,
  farM: 7.0,
  
  
  
  
  aroundM: 8.0,
  
  holdM: 5.0,
  leaveM: 11.0,
  homePerS: 1.6,
  
  
  lifeS: Object.freeze([26, 54]),
  respawnS: Object.freeze([4, 9]),
  
  repriveS: Object.freeze([6, 14]),
  
  
  speedMps: Object.freeze([0.35, 0.75]),
  surge: 0.45,
  
  
  turnRps: Object.freeze([0.10, 0.22]),
  meanderHz: Object.freeze([0.07, 0.17]),
  
  hoverM: Object.freeze([0.45, 1.55]),
  bobM: 0.14,
  bobHz: Object.freeze([0.45, 0.85]),
  
  
  
  
  wingHz: Object.freeze([5.5, 8.5]),
  wingDeg: Object.freeze([-9, 72]),
  
  fadeS: 0.7,
  
  
  maxDtS: 0.1,
});


export function insectCap(pool, season) {
  return Math.max(0, Math.min(pool.max, INSECT.seasonMax[season] ?? 0));
}


export function insectBand(cap) {
  return [Math.max(0, cap - 1), cap];
}

export function createInsectPool({ max = 3, seed = 1 } = {}) {
  return {
    max, capacity: max, alive: 0, spawned: 0, retired: 0,
    clock: 0, nextAt: 0, planet: null, season: null,
    bugs: [], seed: seed >>> 0 || 1, rng: new SeededRng((seed * 40961 + 7) >>> 0 || 1),
  };
}


export function setInsectMax(pool, max) {
  pool.max = Math.max(0, Math.min(pool.capacity, max | 0));
  return pool;
}

function freeAt(pool, i) {
  pool.alive--;
  pool.bugs[i] = pool.bugs[pool.alive];
  pool.bugs.length = pool.alive;
  pool.retired++;
}






function reprieve(pool, b) {
  const go = clamp((b.diesAt - pool.clock) / INSECT.fadeS, 0, 1);
  b.bornAt = pool.clock - INSECT.fadeS * go;
  b.diesAt = pool.clock + pool.rng.rangeF(INSECT.repriveS[0], INSECT.repriveS[1]);
}

function spawn(pool, at) {
  const { rng } = pool;
  const a = rng.rangeF(0, TAU);
  const d = INSECT.nearM + (INSECT.farM - INSECT.nearM) * Math.sqrt(rng.next());
  const x = at.x + Math.cos(a) * d, z = at.z + Math.sin(a) * d;
  const colours = wingColours(at.season);
  const bug = {
    x, z, ground: at.heightAt(x, z),
    hover: rng.rangeF(INSECT.hoverM[0], INSECT.hoverM[1]),
    y: 0,
    head: rng.rangeF(0, TAU),
    speed: rng.rangeF(INSECT.speedMps[0], INSECT.speedMps[1]),
    turn: rng.rangeF(INSECT.turnRps[0], INSECT.turnRps[1]) * TAU * (rng.chance(0.5) ? 1 : -1),
    meanderHz: rng.rangeF(INSECT.meanderHz[0], INSECT.meanderHz[1]),
    bobHz: rng.rangeF(INSECT.bobHz[0], INSECT.bobHz[1]),
    wingHz: rng.rangeF(INSECT.wingHz[0], INSECT.wingHz[1]),
    phase: rng.rangeF(0, TAU),
    wingPhase: rng.rangeF(0, TAU),
    colour: colours[rng.rangeI(0, colours.length - 1)],
    bornAt: pool.clock,
    diesAt: pool.clock + rng.rangeF(INSECT.lifeS[0], INSECT.lifeS[1]),
  };
  bug.y = bug.ground + bug.hover;
  pool.bugs[pool.alive++] = bug;
  pool.spawned++;
  return bug;
}






export function stepInsects(pool, dt, at) {
  const { x = 0, z = 0, season = 'summer', planet = 0, heightAt = () => 0 } = at || {};
  const where = { x, z, season, heightAt };
  const step = clamp(dt, 0, INSECT.maxDtS);
  
  if (planet !== pool.planet) {
    pool.planet = planet;
    pool.rng = new SeededRng((pool.seed * 40961 + (planet | 0) * 2654435761 + 7) >>> 0 || 1);
    pool.bugs.length = 0;
    pool.alive = 0;
    pool.nextAt = pool.clock;
  }
  pool.season = season;
  pool.clock += step;
  const cap = insectCap(pool, season);

  
  while (pool.alive > cap) freeAt(pool, pool.alive - 1);

  for (let i = pool.alive - 1; i >= 0; i--) {
    const b = pool.bugs[i];
    if (Math.hypot(b.x - x, b.z - z) > INSECT.leaveM) {
      
      
      
      freeAt(pool, i);
      pool.nextAt = Math.min(pool.nextAt, pool.clock);
      continue;
    }
    
    
    
    
    if (pool.clock >= b.diesAt - INSECT.fadeS && pool.alive <= cap - 1) { reprieve(pool, b); continue; }
    if (pool.clock >= b.diesAt) {
      freeAt(pool, i);
      pool.nextAt = pool.clock + pool.rng.rangeF(INSECT.respawnS[0], INSECT.respawnS[1]);
    }
  }

  while (pool.alive < cap && pool.clock >= pool.nextAt) spawn(pool, where);

  for (let i = 0; i < pool.alive; i++) moveInsect(pool, pool.bugs[i], step, where);
  return pool.alive;
}

function moveInsect(pool, b, step, at) {
  const t = pool.clock;
  b.head += b.turn * Math.sin(t * b.meanderHz * TAU + b.phase) * step;
  const dx = at.x - b.x, dz = at.z - b.z;
  const d = Math.hypot(dx, dz);
  if (d > INSECT.holdM) {
    
    
    const pull = clamp((d - INSECT.holdM) / (INSECT.leaveM - INSECT.holdM), 0, 1);
    b.head += wrapPi(Math.atan2(dx, dz) - b.head) * Math.min(1, pull * INSECT.homePerS * step * 4);
  }
  const beat = Math.sin(t * b.wingHz * TAU + b.wingPhase);
  const speed = b.speed * (1 + INSECT.surge * Math.max(0, beat) - INSECT.surge * 0.5);
  b.x += Math.sin(b.head) * speed * step;
  b.z += Math.cos(b.head) * speed * step;
  b.ground = at.heightAt(b.x, b.z);
  b.y = b.ground + b.hover + INSECT.bobM * Math.sin(t * b.bobHz * TAU + b.phase);
}


export function insectPose(b, clock) {
  const grow = clamp((clock - b.bornAt) / INSECT.fadeS, 0, 1);
  const go = clamp((b.diesAt - clock) / INSECT.fadeS, 0, 1);
  const beat = 0.5 - 0.5 * Math.cos(clock * b.wingHz * TAU + b.wingPhase);
  const deg = INSECT.wingDeg[0] + (INSECT.wingDeg[1] - INSECT.wingDeg[0]) * beat;
  return {
    x: b.x, y: b.y, z: b.z,
    ry: b.head,
    wing: (deg * Math.PI) / 180,
    scale: Math.min(grow, go),
    colour: b.colour,
  };
}
