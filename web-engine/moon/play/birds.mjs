
































import { SeededRng } from '../../rng/seededRng.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const clamp01 = (x) => clamp(x, 0, 1);

export const BIRD = Object.freeze({
  
  
  
  perMoon: 5,
  
  
  perchS: Object.freeze([4, 10]),
  
  hopHz: Object.freeze([0.55, 1.0]),
  hopM: 0.16,
  hopRiseM: 0.09,
  hopS: 0.24,
  
  
  peckShare: 0.45,
  peckRad: 0.5,
  
  
  flyMps: 2.6,
  arcM: 1.1,
  
  flushMps: 4.8,
  flushRiseM: 1.8,
  
  
  
  
  
  
  flushRadiusM: 2.6,
  flushSpeedMps: 2.2,
  
  flapHz: Object.freeze([6, 9]),
  flapRad: 1.15,
  
  
  
  foldRad: 1.94,
  foldDroopRad: 0.22,
  spreadPerS: 7,
  
  
  perchR: 0.72,
  perchRise: 0.35,
  
  
  maxDtS: 0.1,
});


export function perchKey(s) {
  return `${s.x},${s.z}`;
}


export function perchPoint(s, a, rr) {
  return {
    x: s.x + Math.cos(a) * s.r * BIRD.perchR * rr,
    y: s.y + s.h * BIRD.perchRise,
    z: s.z + Math.sin(a) * s.r * BIRD.perchR * rr,
  };
}






export function shouldFlush(bird, player) {
  if (!player || bird.state !== 'perch') return false;
  if (!(player.speed >= BIRD.flushSpeedMps)) return false;
  return Math.hypot(bird.x - player.x, bird.z - player.z) <= BIRD.flushRadiusM;
}

export function createFlock({ max = BIRD.perMoon, seed = 1, capacity = BIRD.perMoon } = {}) {
  const cap = Math.max(max, capacity);
  return {
    capacity: cap,
    max: Math.max(0, Math.min(cap, max | 0)),
    alive: 0,
    birds: [],
    moves: 0,     
    flushes: 0,   
    rng: new SeededRng((seed * 40961 + 7) >>> 0 || 1),
  };
}


export function setBirdMax(flock, max) {
  flock.max = Math.max(0, Math.min(flock.capacity, max | 0));
  if (flock.alive > flock.max) { flock.birds.length = flock.max; flock.alive = flock.max; }
  return flock;
}

function newBird(flock, s, t) {
  const { rng } = flock;
  const a = rng.rangeF(0, TAU), rr = rng.rangeF(0.15, 1);
  const p = perchPoint(s, a, rr);
  return {
    ...p,
    perch: perchKey(s),
    a,
    rr,
    state: 'perch',
    stateT: 0,
    holdS: rng.rangeF(BIRD.perchS[0], BIRD.perchS[1]),
    yaw: rng.rangeF(0, TAU),
    pitch: 0,
    
    hopFrom: { ...p },
    hopTo: { ...p },
    hopT: BIRD.hopS,
    hopEvery: 1 / rng.rangeF(BIRD.hopHz[0], BIRD.hopHz[1]),
    hopWait: rng.rangeF(0, 1),
    
    from: { ...p },
    to: { ...p },
    flightS: 1,
    flightT: 0,
    flushed: false,
    
    spread: 0,
    flapHz: rng.rangeF(BIRD.flapHz[0], BIRD.flapHz[1]),
    flapPhase: rng.rangeF(0, TAU),
    
    
    tint: [rng.rangeF(0.88, 1.12), rng.rangeF(0.9, 1.1), rng.rangeF(0.88, 1.12)],
    bornS: t,
  };
}


function nextPerch(flock, sources, bird, player, flushed) {
  const others = sources.filter((s) => perchKey(s) !== bird.perch);
  const pool = others.length ? others : sources;
  if (!pool.length) return null;
  if (!flushed || !player) return pool[flock.rng.rangeI(0, pool.length - 1)];
  
  let best = null, bestD = -1;
  for (let k = 0; k < 3; k++) {
    const s = pool[flock.rng.rangeI(0, pool.length - 1)];
    const d = Math.hypot(s.x - player.x, s.z - player.z);
    if (d > bestD) { bestD = d; best = s; }
  }
  return best;
}

function launch(flock, bird, s, t, flushed) {
  const a = flock.rng.rangeF(0, TAU), rr = flock.rng.rangeF(0.15, 1);
  const to = perchPoint(s, a, rr);
  bird.from = { x: bird.x, y: bird.y, z: bird.z };
  bird.to = to;
  bird.perch = perchKey(s);
  bird.a = a;
  bird.rr = rr;
  bird.state = 'fly';
  bird.stateT = 0;
  bird.flushed = flushed;
  bird.flightT = 0;
  const span = Math.hypot(to.x - bird.x, to.z - bird.z, to.y - bird.y);
  bird.flightS = Math.max(0.35, span / (flushed ? BIRD.flushMps : BIRD.flyMps));
  bird.yaw = Math.atan2(to.x - bird.x, to.z - bird.z);
  flock.moves++;
  if (flushed) flock.flushes++;
  return bird;
}










export function stepBirds(flock, sources, dt, t, { player = null } = {}) {
  const step = clamp(dt, 0, BIRD.maxDtS);
  if (!sources.length) { flock.birds.length = 0; flock.alive = 0; return 0; }

  
  
  if (flock.alive < flock.max) {
    const s = sources[flock.rng.rangeI(0, sources.length - 1)];
    flock.birds[flock.alive++] = newBird(flock, s, t);
  }

  const byKey = new Map();
  for (const s of sources) byKey.set(perchKey(s), s);

  for (let i = flock.alive - 1; i >= 0; i--) {
    const b = flock.birds[i];
    b.stateT += step;
    const want = b.state === 'fly' ? 1 : 0;
    b.spread += clamp(want - b.spread, -BIRD.spreadPerS * step, BIRD.spreadPerS * step);
    if (b.state === 'perch') {
      const s = byKey.get(b.perch);
      
      if (!s) {
        const next = nextPerch(flock, sources, b, player, true);
        if (next) launch(flock, b, next, t, true);
        continue;
      }
      const home = perchPoint(s, b.a, b.rr);
      
      b.hopT += step;
      if (b.hopT >= BIRD.hopS) {
        b.hopWait += step;
        if (b.hopWait >= b.hopEvery) {
          b.hopWait = 0;
          b.hopT = 0;
          b.hopFrom = { x: b.x, y: b.y, z: b.z };
          const ha = flock.rng.rangeF(0, TAU);
          b.hopTo = {
            x: clamp(home.x + Math.cos(ha) * BIRD.hopM, s.x - s.r * BIRD.perchR, s.x + s.r * BIRD.perchR),
            y: home.y,
            z: clamp(home.z + Math.sin(ha) * BIRD.hopM, s.z - s.r * BIRD.perchR, s.z + s.r * BIRD.perchR),
          };
          b.yaw = Math.atan2(b.hopTo.x - b.hopFrom.x, b.hopTo.z - b.hopFrom.z);
        }
      }
      const u = clamp01(b.hopT / BIRD.hopS);
      b.x = b.hopFrom.x + (b.hopTo.x - b.hopFrom.x) * u;
      b.z = b.hopFrom.z + (b.hopTo.z - b.hopFrom.z) * u;
      b.y = b.hopFrom.y + (b.hopTo.y - b.hopFrom.y) * u + Math.sin(u * Math.PI) * BIRD.hopRiseM;
      
      const gap = b.hopEvery > 0 ? b.hopWait / b.hopEvery : 0;
      b.pitch = u < 1 ? 0 : BIRD.peckRad * clamp01((gap - (1 - BIRD.peckShare)) / (BIRD.peckShare * 0.5)) * clamp01((1 - gap) / (BIRD.peckShare * 0.5));

      if (shouldFlush(b, player)) {
        const next = nextPerch(flock, sources, b, player, true);
        if (next) launch(flock, b, next, t, true);
        continue;
      }
      if (b.stateT >= b.holdS) {
        const next = nextPerch(flock, sources, b, player, false);
        if (next) launch(flock, b, next, t, false);
        else b.stateT = 0;
      }
      continue;
    }

    
    b.flightT += step;
    const u = clamp01(b.flightT / b.flightS);
    const rise = b.flushed ? BIRD.flushRiseM : 0;
    b.x = b.from.x + (b.to.x - b.from.x) * u;
    b.z = b.from.z + (b.to.z - b.from.z) * u;
    
    
    b.y = b.from.y + (b.to.y - b.from.y) * u
      + Math.sin(u * Math.PI) * BIRD.arcM
      + rise * Math.sin(clamp01(u * 1.6) * Math.PI * 0.5) * (1 - u);
    b.yaw = Math.atan2(b.to.x - b.from.x, b.to.z - b.from.z);
    b.pitch = -0.22 * Math.cos(u * Math.PI);
    if (u >= 1) {
      const s = byKey.get(b.perch);
      const home = s ? perchPoint(s, b.a, b.rr) : { x: b.x, y: b.y, z: b.z };
      b.x = home.x; b.y = home.y; b.z = home.z;
      b.state = 'perch';
      b.stateT = 0;
      b.pitch = 0;
      b.flushed = false;
      b.holdS = flock.rng.rangeF(BIRD.perchS[0], BIRD.perchS[1]);
      b.hopFrom = { ...home };
      b.hopTo = { ...home };
      b.hopT = BIRD.hopS;
      b.hopWait = 0;
    }
  }
  return flock.alive;
}






export function birdPose(b, t) {
  const flying = b.state === 'fly';
  const flap = BIRD.flapRad * Math.sin((t - b.bornS) * b.flapHz * TAU + b.flapPhase) * b.spread;
  return {
    x: b.x, y: b.y, z: b.z,
    yaw: b.yaw,
    pitch: b.pitch,
    
    
    
    flap,
    spread: b.spread,
    flying,
    tint: b.tint,
  };
}


export function flockStats(flock) {
  let perched = 0, flying = 0;
  for (let i = 0; i < flock.alive; i++) (flock.birds[i].state === 'fly' ? flying++ : perched++);
  return { alive: flock.alive, perched, flying, moves: flock.moves, flushes: flock.flushes, max: flock.max, capacity: flock.capacity };
}
