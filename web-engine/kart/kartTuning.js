


















export const ENVELOPE = Object.freeze({
  topSpeed:   { min: 26.0, max: 33.5 },   
  accel:      { min: 11.0, max: 20.0 },   
  turnRate:   { min: 1.95, max: 3.05 },   
  grip:       { min: 3.6,  max: 6.4 },    
  weight:     { min: 0.72, max: 1.42 },   
});

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));



























export const CHARACTERS = Object.freeze([
  Object.freeze({
    id: 'sheep',
    name: 'Bramble',
    species: 'sheep',
    blurb: 'Even-tempered. Good at everything, spectacular at nothing.',
    tint: 0xf6f1e6,
    dials: Object.freeze({ speed: 0.52, accel: 0.55, handling: 0.55, gripDial: 0.55, weight: 0.48 }),
    driftGrip: 0.30,
  }),
  Object.freeze({
    id: 'chicken',
    name: 'Kettle',
    species: 'chicken',
    blurb: 'Furious off the line, turns inside a fence post, tops out early.',
    tint: 0xf4c95d,
    dials: Object.freeze({ speed: 0.16, accel: 1.00, handling: 1.00, gripDial: 0.86, weight: 0.00 }),
    driftGrip: 0.34,
  }),
  Object.freeze({
    id: 'cow',
    name: 'Dozer',
    species: 'cow',
    blurb: 'Fastest thing in the field and it will move you out of the way.',
    tint: 0xb73a2a,
    dials: Object.freeze({ speed: 1.00, accel: 0.14, handling: 0.10, gripDial: 0.30, weight: 1.00 }),
    driftGrip: 0.22,
  }),
  Object.freeze({
    id: 'pig',
    name: 'Truffle',
    species: 'pig',
    blurb: 'Holds a slide longer than anyone. Learn it and it is the fastest.',
    tint: 0x7cb0ff,
    dials: Object.freeze({ speed: 0.66, accel: 0.42, handling: 0.62, gripDial: 0.72, weight: 0.66 }),
    driftGrip: 0.44,
  }),
]);

export const DEFAULT_CHARACTER = 'sheep';

export function characterById(id) {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS.find((c) => c.id === DEFAULT_CHARACTER);
}














export function resolveTuning(character, { engineClass = 1 } = {}) {
  const c = typeof character === 'string' ? characterById(character) : character;
  const d = c.dials;
  const topSpeed = lerp(ENVELOPE.topSpeed.min, ENVELOPE.topSpeed.max, d.speed) * engineClass;
  const accel = lerp(ENVELOPE.accel.min, ENVELOPE.accel.max, d.accel) * engineClass;
  const grip = lerp(ENVELOPE.grip.min, ENVELOPE.grip.max, d.gripDial);
  return {
    id: c.id,
    species: c.species,
    topSpeed,
    accel,
    
    
    
    brake: 26.0,
    
    
    
    reverseSpeed: 8.5,
    turnRate: lerp(ENVELOPE.turnRate.min, ENVELOPE.turnRate.max, d.handling),
    grip,
    
    
    
    
    
    
    gripTurn: lerp(5.0, 8.5, d.gripDial),
    
    
    
    
    
    
    driftGripTurn: lerp(5.0, 8.5, d.gripDial) * c.driftGrip * 0.55,
    
    
    
    maxSlip: 0.30,
    
    
    
    
    
    
    driftMaxSlip: lerp(0.62, 0.42, (c.driftGrip - 0.22) / 0.22),
    
    
    
    
    
    scrub: lerp(0.16, 0.26, d.weight),
    weight: lerp(ENVELOPE.weight.min, ENVELOPE.weight.max, d.weight),
    
    
    
    handlingBias: lerp(0.52, 0.80, d.handling),
    
    
    drag: 0.55,
    
    
    offRoadSpeed: 0.52,
    offRoadDrag: 2.4,
  };
}


export function statBars(character) {
  const c = typeof character === 'string' ? characterById(character) : character;
  const t = resolveTuning(c);
  const norm = (v, k) => (v - ENVELOPE[k].min) / (ENVELOPE[k].max - ENVELOPE[k].min);
  return {
    speed: norm(t.topSpeed, 'topSpeed'),
    accel: norm(t.accel, 'accel'),
    handling: norm(t.turnRate, 'turnRate'),
    grip: norm(t.grip, 'grip'),
    weight: norm(t.weight, 'weight'),
  };
}
