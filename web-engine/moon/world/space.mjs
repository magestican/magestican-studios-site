




















import { draw } from '../economy/math.mjs';
import { seasonPalette } from '../palette/seasons.mjs';
import { ELEMENTS, planetSystem } from './planets.mjs';

const U32 = 2 ** 32;
const TAU = Math.PI * 2;
const unit = (seed, ...keys) => draw(seed, ...keys) / U32;

export const ASTEROIDS = Object.freeze({
  
  count: 6,
  
  
  maxDrawn: 4,
  
  
  speedRadPerS: Object.freeze([TAU / 540, TAU / 180]),
  
  
  sizeRad: Object.freeze([0.0022, 0.0062]),
  
  spinRadPerS: Object.freeze([0.25, 1.1]),
  seed: 8080,
});


function rotate(v, axis, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const [x, y, z] = v, [ax, ay, az] = axis;
  const dot = ax * x + ay * y + az * z;
  return [
    x * c + (ay * z - az * y) * s + ax * dot * (1 - c),
    y * c + (az * x - ax * z) * s + ay * dot * (1 - c),
    z * c + (ax * y - ay * x) * s + az * dot * (1 - c),
  ];
}

const normalize = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};




function sphereDir(seed, ...keys) {
  const u = unit(seed, ...keys, 'cos') * 2 - 1;
  const a = unit(seed, ...keys, 'az') * TAU;
  const r = Math.sqrt(Math.max(0, 1 - u * u));
  return [Math.cos(a) * r, u, Math.sin(a) * r];
}


export function asteroidTracks(seed = ASTEROIDS.seed, cfg = ASTEROIDS) {
  const out = [];
  for (let i = 0; i < cfg.count; i++) {
    const start = sphereDir(seed, 'rock', i, 'start');
    
    
    const pick = sphereDir(seed, 'rock', i, 'axis');
    const d = pick[0] * start[0] + pick[1] * start[1] + pick[2] * start[2];
    let axis = [pick[0] - start[0] * d, pick[1] - start[1] * d, pick[2] - start[2] * d];
    if (Math.hypot(...axis) < 1e-3) axis = [-start[1], start[0], 0];
    const t = unit(seed, 'rock', i, 'speed');
    out.push(Object.freeze({
      id: i,
      start: Object.freeze(start),
      axis: Object.freeze(normalize(axis)),
      speed: cfg.speedRadPerS[0] + t * (cfg.speedRadPerS[1] - cfg.speedRadPerS[0]),
      
      phase: unit(seed, 'rock', i, 'phase') * TAU,
      size: cfg.sizeRad[0] + unit(seed, 'rock', i, 'size') * (cfg.sizeRad[1] - cfg.sizeRad[0]),
      spin: cfg.spinRadPerS[0] + unit(seed, 'rock', i, 'spin') * (cfg.spinRadPerS[1] - cfg.spinRadPerS[0]),
      
      shape: draw(seed, 'rock', i, 'shape') % 3,
    }));
  }
  return Object.freeze(out);
}

const trackCache = new Map();
const tracksFor = (seed, cfg) => {
  if (cfg !== ASTEROIDS) return asteroidTracks(seed, cfg);
  if (!trackCache.has(seed)) trackCache.set(seed, asteroidTracks(seed, cfg));
  return trackCache.get(seed);
};






export function asteroidsAt(seconds, seed = ASTEROIDS.seed, cfg = ASTEROIDS) {
  return tracksFor(seed, cfg).map((r) => ({
    id: r.id,
    dir: rotate(r.start, r.axis, r.phase + r.speed * seconds),
    size: r.size,
    spin: r.spin * seconds,
    shape: r.shape,
  }));
}







export function visibleAsteroids(seconds, { horizonY = 0, max = ASTEROIDS.maxDrawn, seed = ASTEROIDS.seed, cfg = ASTEROIDS } = {}) {
  return asteroidsAt(seconds, seed, cfg)
    .filter((r) => r.dir[1] > horizonY)
    .sort((a, b) => b.dir[1] - a.dir[1])
    .slice(0, max);
}





export const SKY_PLANETS_MAX = 4;







export const SKY_FURNITURE = Object.freeze({
  ringedPlanet: Object.freeze({ azimuth: 0.03, rise: 0.075, size: 0.042, reach: 0.042 * 2.1 }),
  secondMoon: Object.freeze({ azimuth: -0.1, rise: 0.1, size: 0.012, reach: 0.012 }),
});















const DEST_RISE = Object.freeze([0.04, 0.062]);
const DEST_AZIMUTH = 0.24;      
const DEST_SPREAD = 0.05;
const HIGH_RISE = 0.14, HIGH_STEP = 0.16;
const HIGH_AZIMUTH = 1.0, HIGH_STEP_AZ = 1.7;




const SIZE_PER_M = 0.0016;















export function skyPlanetsFrom(atId, { system = planetSystem(), max = SKY_PLANETS_MAX } = {}) {
  const n = system.length;
  const out = [];
  for (let step = 1; step < n && out.length < max; step++) {
    const id = (atId + step) % n;
    const p = system[id];
    
    
    
    
    
    
    const jitter = unit(p.seed, 'sky', atId, 'az');
    const azimuth = step === 1
      ? DEST_AZIMUTH + (jitter - 0.5) * 2 * DEST_SPREAD
      : (HIGH_AZIMUTH + (step - 2) * HIGH_STEP_AZ + jitter * 0.3) % TAU;
    const rise = step === 1
      ? DEST_RISE[0] + jitter * (DEST_RISE[1] - DEST_RISE[0])
      : HIGH_RISE + (step - 2) * HIGH_STEP + unit(p.seed, 'sky', atId, 'elev') * 0.03;
    out.push(Object.freeze({
      id,
      name: p.name,
      azimuth,
      rise,
      size: p.radius * SIZE_PER_M,
      colour: colourOf(p),
      next: step === 1,
    }));
  }
  return Object.freeze(out);
}


export function colourOf(planet) {
  
  
  const pal = seasonPalette(planet.season || 'summer');
  
  const stony = !planet.home && planet.elements.every((e) => ELEMENTS[e].role === 'rock');
  return stony ? pal.soil : pal.grass[1];
}
