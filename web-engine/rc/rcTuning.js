





















import { resolveTuning } from '../kart/kartTuning.js';

export const SIM_SCALE = 12;
export const toSim = (metres) => metres * SIM_SCALE;
export const toMetres = (units) => units / SIM_SCALE;


export const METRICS = Object.freeze({
  car: Object.freeze({ length: 0.25, width: 0.14, height: 0.09 }),
  topSpeed: 4.5, 
  camera: Object.freeze({ up: 0.12, back: 0.55, lookAhead: 0.8 }),
  fov: Object.freeze({ base: 70, fast: 85 }),
  lane: Object.freeze({ floor: 1.4, counter: 0.8, connector: 0.9 }),
  connector: Object.freeze({ width: 0.9, lip: 0.02, trestleEvery: 0.6 }),
  hop: Object.freeze({ height: 0.12, clears: 0.6, atSpeed: 0.8 }),
  loop: Object.freeze({ radius: 0.6, gate: 0.6 }),
  slide: Object.freeze({ climbDeg: 30, gate: 0.5 }),
  respawn: 1.5, 
  telegraph: 1.5, 
});


export const GRIP = Object.freeze({
  tile: 1.0, deck: 0.95, floorboards: 0.9, connector: 1.0, lawn: 0.75, rug: 0.65, sand: 0.6, wet: 0.5,
  wetSand: 0.9,
});

export const gripOf = (surface) => {
  if (!(surface in GRIP)) throw new Error(`rcTuning: no grip for surface "${surface}"`);
  return GRIP[surface];
};


export function rcTuning({ character = 'sheep' } = {}) {
  const base = resolveTuning(character);
  return {
    ...base,
    id: `rc-${base.id}`,
    topSpeed: toSim(METRICS.topSpeed),
  };
}





export const GRAVITY_MS2 = 9.81;
export const gravitySim = () => toSim(GRAVITY_MS2);


export function hopSpeed(gravity) {
  return Math.sqrt(2 * gravity * toSim(METRICS.hop.height));
}
