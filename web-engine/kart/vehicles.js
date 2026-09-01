




















































































export const LIVERY_COLOURS = Object.freeze([
  'night', 'ceiling', 'barnRed', 'gold', 'chrome', 'engine', 'tyre',
]);






















export const WIDTH_CLASSES = Object.freeze([
  ['narrow', 2.05], ['medium', 2.35], ['wide', 2.60], ['broad', Infinity],
]);
export const HEIGHT_CLASSES = Object.freeze([
  ['low', 1.40], ['mid', 1.70], ['tall', 2.00], ['towering', Infinity],
]);
export const WHEEL_CLASSES = Object.freeze([
  ['even', 1.15], ['stepped', 1.30], ['staggered', 1.60], ['dragster', Infinity],
]);








export const DRIVER_ASPECT = 0.62;





const WOOLPACKER = {
  id: 'woolpacker',
  character: 'sheep',
  name: 'Woolpacker',
  
  
  
  
  blurb: 'The reference kart. Nothing exaggerated, nothing missing.',
  wheelbase: 2.05,
  wheels: {
    frontRadius: 0.34, rearRadius: 0.46,
    frontWidth: 0.28, rearWidth: 0.42,
    trackFront: 1.66, trackRear: 1.76,
    spokes: 4,
  },
  floor: { length: 2.50, z: 0, y: 0.30, tailHalf: 0.72, noseHalf: 0.51, tailHeight: 0.20, noseHeight: 0.15, rake: 0 },
  pods: { style: 'sidepod', half: 0.17, length: 1.60, height: 0.36, x: 0.70, y: 0.44, z: -0.02, lean: 0.05, rail: true },
  nose: { style: 'cone', length: 1.00, z: 1.28, y: 0.44, rootHalf: 0.51, tipHalf: 0.23, rootHeight: 0.30, tipHeight: 0.20, lift: 0.05, roundel: 0.17 },
  engine: { half: 0.43, height: 0.50, length: 0.66, y: 0.56, z: -1.15, camCover: true },
  seat: { z: -0.10, y: 0.34, width: 0.72, backY: 0.66, backZ: -0.62, driverHeight: 0.92, tilt: 0.20 },
  
  
  
  
  rollBar: { style: 'hoop', radius: 0.38, tube: 0.055, y: 0.80, z: -0.72 },
  exhaust: {
    
    
    
    
    style: 'twinRear',
    pipes: [[0.26, 0.60, -1.10], [-0.26, 0.60, -1.10]],
    dir: [0, 0.78, -0.63], length: 0.60, radius: 0.075, tipRadius: 0.095, cap: false,
  },
  
  
  
  
  
  wing: { style: 'lowBlade', span: 1.40, chord: 0.28, thickness: 0.06, y: 1.20, z: -1.38, strut: 0.40, strutX: 0.48 },
  bumper: { width: 1.18, y: 0.30, z: -1.46, height: 0.12 },
  glider: { span: 3.60, chord: 1.55, y: 1.86, dihedral: 0.20 },
  livery: { accent: 'barnRed', trim: 'night', metal: 'chrome', pipe: 'chrome' },
  halfWidth: 1.04,
};

const CLUCKCANNON = {
  id: 'cluckcannon',
  character: 'chicken',
  name: 'Cluckcannon',
  
  
  
  
  
  
  
  blurb: 'A fuel altered on a farm. All launch, no straight.',
  wheelbase: 1.90,
  wheels: {
    frontRadius: 0.24, rearRadius: 0.50,
    frontWidth: 0.18, rearWidth: 0.50,
    trackFront: 1.10, trackRear: 1.44,
    spokes: 5,
  },
  floor: { length: 2.30, z: 0, y: 0.34, tailHalf: 0.44, noseHalf: 0.30, tailHeight: 0.24, noseHeight: 0.18, rake: -0.14 },
  
  
  pods: { style: 'rail', half: 0.07, length: 1.50, height: 0.13, x: 0.50, y: 0.42, z: -0.05, lean: 0, rail: false },
  
  
  tower: { half: 0.33, height: 0.62, length: 1.10, y: 0.74, z: -0.28 },
  nose: { style: 'wedge', length: 0.70, z: 1.22, y: 0.26, rootHalf: 0.30, tipHalf: 0.14, rootHeight: 0.22, tipHeight: 0.12, lift: 0.08, roundel: 0.11 },
  engine: { half: 0.30, height: 0.44, length: 0.56, y: 0.50, z: -0.98, camCover: false },
  seat: { z: -0.06, y: 0.44, width: 0.62, backY: 0.80, backZ: -0.56, driverHeight: 0.78, tilt: 0.14 },
  rollBar: { style: 'hoop', radius: 0.34, tube: 0.05, y: 0.94, z: -0.74 },
  exhaust: {
    style: 'stack',
    pipes: [[0, 0.88, -0.86]],
    dir: [0, 0.992, -0.125], length: 1.28, radius: 0.11, tipRadius: 0.125, cap: true,
  },
  
  
  
  
  
  wing: { style: 'winglets', span: 1.02, chord: 0.42, thickness: 0.05, y: 1.20, z: -1.16, strut: 0.34, strutX: 0.34 },
  bumper: { width: 0.92, y: 0.34, z: -1.28, height: 0.10 },
  glider: { span: 3.20, chord: 1.40, y: 2.58, dihedral: 0.28 },
  livery: { accent: 'night', trim: 'barnRed', metal: 'chrome', pipe: 'night' },
  halfWidth: 0.70,
};

const BULLDOZER = {
  id: 'bulldozer',
  character: 'cow',
  name: 'Bulldozer',
  
  
  
  
  
  
  
  
  
  
  blurb: 'A hauler with the cab cut off. Wide, heavy and coming through.',
  wheelbase: 2.40,
  wheels: {
    frontRadius: 0.46, rearRadius: 0.50,
    frontWidth: 0.42, rearWidth: 0.56,
    trackFront: 2.00, trackRear: 2.12,
    spokes: 6,
  },
  floor: { length: 2.80, z: 0, y: 0.34, tailHalf: 0.96, noseHalf: 0.80, tailHeight: 0.26, noseHeight: 0.22, rake: 0.03 },
  pods: { style: 'slab', half: 0.24, length: 1.90, height: 0.52, x: 1.06, y: 0.52, z: -0.06, lean: 0.02, rail: true },
  nose: { style: 'bullbar', length: 0.90, z: 1.50, y: 0.50, rootHalf: 0.76, tipHalf: 0.62, rootHeight: 0.38, tipHeight: 0.32, lift: 0.02, roundel: 0.20 },
  engine: { half: 0.62, height: 0.58, length: 0.80, y: 0.62, z: -1.28, camCover: true },
  seat: { z: -0.16, y: 0.40, width: 0.88, backY: 0.78, backZ: -0.70, driverHeight: 1.08, tilt: 0.22 },
  rollBar: { style: 'brace', radius: 0.50, tube: 0.07, y: 0.92, z: -0.78 },
  exhaust: {
    style: 'sideStacks',
    pipes: [[0.92, 0.62, -0.28], [-0.92, 0.62, -0.28]],
    dir: [0.04, 0.999, 0], length: 1.18, radius: 0.09, tipRadius: 0.105, cap: true,
  },
  
  
  
  wing: { style: 'none', span: 0, chord: 0, thickness: 0, y: 0, z: 0, strut: 0, strutX: 0 },
  
  
  
  
  
  
  
  
  tailPanel: { width: 1.92, height: 0.44, y: 0.72, z: -1.66, stripe: 0.10 },
  bumper: { width: 2.10, y: 0.34, z: -1.78, height: 0.18 },
  glider: { span: 4.40, chord: 1.85, y: 2.24, dihedral: 0.14 },
  livery: { accent: 'ceiling', trim: 'night', metal: 'chrome', pipe: 'engine' },
  halfWidth: 1.30,
};

const MUDLARK = {
  id: 'mudlark',
  character: 'pig',
  name: 'Mudlark',
  
  
  
  
  
  
  
  
  
  
  blurb: 'Long, low, and pointed slightly the wrong way on purpose.',
  wheelbase: 2.25,
  wheels: {
    frontRadius: 0.33, rearRadius: 0.40,
    frontWidth: 0.26, rearWidth: 0.52,
    trackFront: 1.66, trackRear: 1.98,
    spokes: 5,
  },
  floor: { length: 2.75, z: 0, y: 0.24, tailHalf: 0.86, noseHalf: 0.58, tailHeight: 0.18, noseHeight: 0.14, rake: -0.03 },
  pods: { style: 'sidepod', half: 0.20, length: 1.90, height: 0.30, x: 0.86, y: 0.34, z: -0.05, lean: 0.07, rail: true },
  nose: { style: 'shovel', length: 1.10, z: 1.42, y: 0.32, rootHalf: 0.58, tipHalf: 0.40, rootHeight: 0.22, tipHeight: 0.12, lift: -0.04, roundel: 0.15 },
  engine: { half: 0.48, height: 0.42, length: 0.70, y: 0.44, z: -1.24, camCover: true },
  seat: { z: -0.14, y: 0.28, width: 0.76, backY: 0.58, backZ: -0.60, driverHeight: 0.96, tilt: 0.26 },
  rollBar: { style: 'hoop', radius: 0.36, tube: 0.05, y: 0.72, z: -0.66 },
  exhaust: {
    style: 'quadLow',
    pipes: [[0.20, 0.36, -1.30], [-0.20, 0.36, -1.30], [0.52, 0.36, -1.28], [-0.52, 0.36, -1.28]],
    dir: [0, 0.10, -0.995], length: 0.34, radius: 0.062, tipRadius: 0.075, cap: false,
  },
  wing: { style: 'highSlab', span: 1.70, chord: 0.60, thickness: 0.07, y: 1.44, z: -1.30, strut: 0.62, strutX: 0.62 },
  bumper: { width: 1.56, y: 0.26, z: -1.62, height: 0.12 },
  glider: { span: 4.00, chord: 1.70, y: 1.98, dihedral: 0.22 },
  livery: { accent: 'gold', trim: 'night', metal: 'chrome', pipe: 'chrome' },
  halfWidth: 1.06,
};







































const GANDER = {
  id: 'gander',
  character: 'goose',
  name: 'Gander',
  
  
  
  
  
  blurb: 'All rear tyre and no sense. Gone before the lights finish.',
  wheelbase: 2.02,
  wheels: {
    frontRadius: 0.24, rearRadius: 0.42,
    frontWidth: 0.20, rearWidth: 0.44,
    trackFront: 1.18, trackRear: 1.50,
    spokes: 5,
  },
  floor: { length: 2.30, z: 0, y: 0.32, tailHalf: 0.60, noseHalf: 0.38, tailHeight: 0.22, noseHeight: 0.16, rake: -0.06 },
  pods: { style: 'rail', half: 0.09, length: 1.55, height: 0.15, x: 0.60, y: 0.44, z: -0.04, lean: 0, rail: false },
  nose: { style: 'wedge', length: 0.86, z: 1.24, y: 0.32, rootHalf: 0.30, tipHalf: 0.16, rootHeight: 0.20, tipHeight: 0.11, lift: 0.06, roundel: 0.12 },
  engine: { half: 0.34, height: 0.44, length: 0.60, y: 0.50, z: -1.04, camCover: false },
  seat: { z: -0.08, y: 0.36, width: 0.66, backY: 0.74, backZ: -0.58, driverHeight: 0.84, tilt: 0.18 },
  rollBar: { style: 'hoop', radius: 0.34, tube: 0.05, y: 0.86, z: -0.70 },
  exhaust: {
    style: 'twinRear',
    pipes: [[0.24, 0.58, -1.08], [-0.24, 0.58, -1.08]],
    dir: [0, 0.78, -0.63], length: 0.50, radius: 0.070, tipRadius: 0.088, cap: false,
  },
  
  
  
  
  wing: { style: 'lowBlade', span: 0.86, chord: 0.22, thickness: 0.06, y: 1.52, z: -1.30, strut: 0.44, strutX: 0.32 },
  bumper: { width: 1.10, y: 0.32, z: -1.40, height: 0.10 },
  glider: { span: 3.30, chord: 1.42, y: 2.20, dihedral: 0.26 },
  livery: { accent: 'gold', trim: 'night', metal: 'chrome', pipe: 'engine' },
  halfWidth: 0.99,
};

const PADDLER = {
  id: 'paddler',
  character: 'duck',
  name: 'Paddler',
  
  
  
  
  
  
  
  
  blurb: 'A flat-bottomed hull on wheels. Ignores the ford entirely.',
  wheelbase: 1.98,
  wheels: {
    frontRadius: 0.26, rearRadius: 0.40,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    frontWidth: 0.24, rearWidth: 0.62,
    trackFront: 1.40, trackRear: 1.42,
    spokes: 6,
  },
  floor: { length: 2.60, z: 0, y: 0.22, tailHalf: 0.80, noseHalf: 0.62, tailHeight: 0.18, noseHeight: 0.14, rake: -0.02 },
  pods: { style: 'sidepod', half: 0.19, length: 1.80, height: 0.28, x: 0.80, y: 0.30, z: -0.04, lean: 0.06, rail: true },
  nose: { style: 'shovel', length: 1.05, z: 1.36, y: 0.28, rootHalf: 0.46, tipHalf: 0.44, rootHeight: 0.16, tipHeight: 0.10, lift: -0.03, roundel: 0.14 },
  engine: { half: 0.42, height: 0.40, length: 0.64, y: 0.42, z: -1.18, camCover: true },
  seat: { z: -0.12, y: 0.26, width: 0.62, backY: 0.56, backZ: -0.56, driverHeight: 0.80, tilt: 0.24 },
  rollBar: { style: 'hoop', radius: 0.30, tube: 0.05, y: 0.62, z: -0.62 },
  exhaust: {
    style: 'sideStacks',
    pipes: [[0.86, 0.46, -0.24], [-0.86, 0.46, -0.24]],
    dir: [0.04, 0.999, 0], length: 0.58, radius: 0.075, tipRadius: 0.090, cap: true,
  },
  wing: { style: 'highSlab', span: 1.10, chord: 0.26, thickness: 0.06, y: 1.03, z: -1.24, strut: 0.40, strutX: 0.40 },
  bumper: { width: 1.30, y: 0.24, z: -1.48, height: 0.11 },
  glider: { span: 3.40, chord: 1.48, y: 1.80, dihedral: 0.24 },
  livery: { accent: 'ceiling', trim: 'chrome', metal: 'chrome', pipe: 'chrome' },
  halfWidth: 1.00,
};

const SCRAMBLER = {
  id: 'scrambler',
  character: 'goat',
  name: 'Scrambler',
  
  
  
  
  
  
  blurb: 'A hill-climb cage. It will not be quick, but it will not let go.',
  wheelbase: 1.94,
  wheels: {
    frontRadius: 0.28, rearRadius: 0.41,
    frontWidth: 0.24, rearWidth: 0.44,
    trackFront: 1.58, trackRear: 1.67,
    spokes: 6,
  },
  floor: { length: 2.45, z: 0, y: 0.30, tailHalf: 0.74, noseHalf: 0.52, tailHeight: 0.20, noseHeight: 0.16, rake: 0.02 },
  pods: { style: 'rail', half: 0.10, length: 1.62, height: 0.18, x: 0.72, y: 0.46, z: -0.04, lean: 0, rail: true },
  nose: { style: 'cone', length: 0.92, z: 1.26, y: 0.42, rootHalf: 0.48, tipHalf: 0.22, rootHeight: 0.26, tipHeight: 0.16, lift: 0.06, roundel: 0.15 },
  engine: { half: 0.40, height: 0.48, length: 0.64, y: 0.54, z: -1.10, camCover: true },
  seat: { z: -0.10, y: 0.36, width: 0.66, backY: 0.70, backZ: -0.60, driverHeight: 0.90, tilt: 0.20 },
  
  
  
  rollBar: { style: 'brace', radius: 0.50, tube: 0.08, y: 1.20, z: -0.72 },
  exhaust: {
    style: 'quadLow',
    pipes: [[0.18, 0.38, -1.16], [-0.18, 0.38, -1.16], [0.46, 0.38, -1.14], [-0.46, 0.38, -1.14]],
    dir: [0, 0.10, -0.995], length: 0.32, radius: 0.058, tipRadius: 0.070, cap: false,
  },
  wing: { style: 'highSlab', span: 1.30, chord: 0.40, thickness: 0.06, y: 1.30, z: -1.26, strut: 0.50, strutX: 0.50 },
  bumper: { width: 1.34, y: 0.30, z: -1.44, height: 0.12 },
  glider: { span: 3.50, chord: 1.52, y: 2.30, dihedral: 0.22 },
  livery: { accent: 'barnRed', trim: 'night', metal: 'chrome', pipe: 'engine' },
  halfWidth: 1.04,
};

const PLOUGHMAN = {
  id: 'ploughman',
  character: 'donkey',
  name: 'Ploughman',
  
  
  
  
  
  blurb: 'As much kart as the hauler, and it can actually take a corner.',
  wheelbase: 2.14,
  wheels: {
    frontRadius: 0.40, rearRadius: 0.46,
    frontWidth: 0.38, rearWidth: 0.50,
    trackFront: 1.96, trackRear: 2.08,
    spokes: 6,
  },
  floor: { length: 2.70, z: 0, y: 0.34, tailHalf: 0.90, noseHalf: 0.74, tailHeight: 0.26, noseHeight: 0.20, rake: 0.02 },
  pods: { style: 'slab', half: 0.22, length: 1.80, height: 0.46, x: 0.98, y: 0.50, z: -0.05, lean: 0.03, rail: true },
  nose: { style: 'bullbar', length: 0.86, z: 1.42, y: 0.48, rootHalf: 0.70, tipHalf: 0.56, rootHeight: 0.34, tipHeight: 0.28, lift: 0.03, roundel: 0.19 },
  engine: { half: 0.56, height: 0.54, length: 0.76, y: 0.60, z: -1.22, camCover: true },
  seat: { z: -0.14, y: 0.40, width: 0.84, backY: 0.80, backZ: -0.68, driverHeight: 1.02, tilt: 0.22 },
  rollBar: { style: 'brace', radius: 0.58, tube: 0.09, y: 1.29, z: -0.76 },
  exhaust: {
    style: 'twinRear',
    pipes: [[0.30, 0.66, -1.16], [-0.30, 0.66, -1.16]],
    dir: [0, 0.78, -0.63], length: 0.62, radius: 0.085, tipRadius: 0.105, cap: false,
  },
  wing: { style: 'winglets', span: 1.50, chord: 0.50, thickness: 0.07, y: 1.46, z: -1.34, strut: 0.52, strutX: 0.50 },
  bumper: { width: 2.00, y: 0.34, z: -1.72, height: 0.16 },
  glider: { span: 4.20, chord: 1.78, y: 2.35, dihedral: 0.16 },
  livery: { accent: 'night', trim: 'gold', metal: 'chrome', pipe: 'engine' },
  halfWidth: 1.24,
};

export const VEHICLES = Object.freeze(
  [WOOLPACKER, CLUCKCANNON, BULLDOZER, MUDLARK, GANDER, PADDLER, SCRAMBLER, PLOUGHMAN]
    .map(deepFreeze),
);

function deepFreeze(o) {
  for (const v of Object.values(o)) {
    if (v && typeof v === 'object') deepFreeze(v);
  }
  return Object.freeze(o);
}









export function vehicleFor(character) {
  const id = typeof character === 'string' ? character : character?.character ?? character?.id;
  return VEHICLES.find((v) => v.character === id) ?? WOOLPACKER;
}


export function vehicleById(id) {
  return VEHICLES.find((v) => v.id === id) ?? null;
}









const classOf = (table, v) => (table.find(([, ceiling]) => v < ceiling) ?? table[table.length - 1])[0];


export function overallWidth(spec) {
  return Math.max(
    spec.halfWidth * 2,
    spec.wheels.trackFront + spec.wheels.frontWidth,
    spec.wheels.trackRear + spec.wheels.rearWidth,
    spec.wing.span,
    spec.bumper.width,
  );
}








export function overallHeight(spec) {
  const ex = spec.exhaust;
  const exhaustTop = ex.pipes.length === 0 ? 0
    : Math.max(...ex.pipes.map((p) => p[1])) + ex.length * ex.dir[1];
  const wingTop = spec.wing.style === 'none' ? 0 : spec.wing.y + spec.wing.thickness / 2;
  const barTop = spec.rollBar.y + spec.rollBar.radius + spec.rollBar.tube;
  const towerTop = spec.tower ? spec.tower.y + spec.tower.height / 2 : 0;
  const tailTop = spec.tailPanel ? spec.tailPanel.y + spec.tailPanel.height / 2 : 0;
  const bodyTop = Math.max(
    spec.floor.y + spec.floor.tailHeight / 2,
    spec.pods.y + spec.pods.height / 2,
    spec.engine.y + spec.engine.height / 2,
    spec.seat.backY + 0.26,
  );
  return Math.max(exhaustTop, wingTop, barTop, towerTop, tailTop, bodyTop);
}


export function wheelRatio(spec) {
  return spec.wheels.rearRadius / spec.wheels.frontRadius;
}


export function wingArea(spec) {
  return spec.wing.style === 'none' ? 0 : spec.wing.span * spec.wing.chord;
}









export function silhouetteAxes(spec) {
  return {
    width: classOf(WIDTH_CLASSES, overallWidth(spec)),
    height: classOf(HEIGHT_CLASSES, overallHeight(spec)),
    wheels: classOf(WHEEL_CLASSES, wheelRatio(spec)),
    exhaust: spec.exhaust.style,
    wing: spec.wing.style,
  };
}


export function silhouetteKey(spec) {
  const a = silhouetteAxes(spec);
  return `${a.width}/${a.height}/${a.wheels}/${a.exhaust}/${a.wing}`;
}


export function silhouetteDistance(a, b) {
  const x = silhouetteAxes(a);
  const y = silhouetteAxes(b);
  return Object.keys(x).filter((k) => x[k] !== y[k]).length;
}






export function describeVehicle(spec) {
  return `${spec.name} — ${overallWidth(spec).toFixed(2)} m wide, `
    + `${overallHeight(spec).toFixed(2)} m tall, `
    + `wheelbase ${spec.wheelbase.toFixed(2)} m, `
    + `tyres ${wheelRatio(spec).toFixed(2)}:1, `
    + `wing ${wingArea(spec).toFixed(2)} m² — ${silhouetteKey(spec)}`;
}
