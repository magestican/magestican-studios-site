





























export const ENVELOPE = Object.freeze({
  
  
  
  
  
  
  
  
  
  
  topSpeed:   { min: 48.0, max: 62.0 },   
  accel:      { min: 22.0, max: 38.0 },   
  turnRate:   { min: 3.15, max: 4.75 },   
  grip:       { min: 6.0,  max: 10.2 },   
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
  Object.freeze({
    id: 'goat',
    name: 'Nanny',
    species: 'goat',
    blurb: 'Sticks to anything, including ice. Will lose every straight.',
    tint: 0x8f6b3d,
    dials: Object.freeze({ speed: 0.30, accel: 0.70, handling: 0.84, gripDial: 1.00, weight: 0.22 }),
    driftGrip: 0.38,
  }),
  Object.freeze({
    id: 'duck',
    name: 'Puddle',
    species: 'duck',
    blurb: 'Slow on land. The only one that does not slow down in the water.',
    tint: 0x2f7d4f,
    dials: Object.freeze({ speed: 0.34, accel: 0.78, handling: 0.80, gripDial: 0.40, weight: 0.10 }),
    driftGrip: 0.26,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    waterSpeed: 0.86,
  }),
  Object.freeze({
    id: 'donkey',
    name: 'Barrow',
    species: 'donkey',
    blurb: 'As heavy as the cow and it can actually corner. Dreadful start.',
    tint: 0x9aa0a6,
    
    
    
    
    
    
    dials: Object.freeze({ speed: 0.58, accel: 0.30, handling: 0.34, gripDial: 0.90, weight: 0.94 }),
    driftGrip: 0.40,
  }),
  Object.freeze({
    id: 'goose',
    name: 'Bluster',
    species: 'goose',
    blurb: 'Wins the run to the first corner. Then there is the corner.',
    tint: 0xe0762a,
    
    
    
    
    
    
    
    
    
    
    
    dials: Object.freeze({ speed: 0.44, accel: 0.96, handling: 1.00, gripDial: 0.12, weight: 0.06 }),
    driftGrip: 0.24,
  }),
]);

export const DEFAULT_CHARACTER = 'sheep';
















export const DRIFT_SLIP_LIMIT = 15 * (Math.PI / 180);

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
    
    
    
    brake: 45.0,
    
    
    
    reverseSpeed: 8.5,
    turnRate: lerp(ENVELOPE.turnRate.min, ENVELOPE.turnRate.max, d.handling),
    grip,
    
    
    
    
    
    
    gripTurn: lerp(8.2, 13.5, d.gripDial),
    
    
    
    
    
    
    driftGripTurn: lerp(8.2, 13.5, d.gripDial) * c.driftGrip * 0.55,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    maxSlip: 0.30,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    driftMaxSlip: lerp(DRIFT_SLIP_LIMIT, 0.13, (c.driftGrip - 0.22) / 0.22),
    
    
    
    
    
    scrub: lerp(0.16, 0.26, d.weight),
    weight: lerp(ENVELOPE.weight.min, ENVELOPE.weight.max, d.weight),
    
    
    
    handlingBias: lerp(0.52, 0.80, d.handling),
    
    
    drag: 0.55,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    waterSpeed: c.waterSpeed,
    offRoadSpeed: 0.74,
    offRoadDrag: 1.15,
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
