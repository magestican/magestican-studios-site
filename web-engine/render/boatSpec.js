


























































import { VEHICLES } from '../kart/vehicles.js';
import { DRAFT } from '../kart/water.js';










export const BOAT_STYLES = Object.freeze(['pontoon', 'barrel', 'ski', 'sponson']);


















const STYLE_FOR = Object.freeze({
  woolpacker: 'pontoon',
  bulldozer: 'barrel',
  cluckcannon: 'ski',
  mudlark: 'sponson',
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  ploughman: 'pontoon',
  paddler: 'barrel',
  scrambler: 'sponson',
  gander: 'sponson',
});










const STYLE_SHAPE = Object.freeze({
  pontoon: { radius: 0.115, length: 1.62, outboard: 0.06, lift: 0.00, squash: 1.00 },
  barrel: { radius: 0.140, length: 1.20, outboard: 0.03, lift: -0.03, squash: 1.00 },
  ski: { radius: 0.100, length: 1.85, outboard: 0.04, lift: -0.02, squash: 0.78 },
  sponson: { radius: 0.145, length: 1.42, outboard: 0.02, lift: -0.08, squash: 0.62 },
});










const MIN_SLENDERNESS = 1.02;












const DRIVE = Object.freeze({
  
  pivotLift: 0.26,
  
  behindBumper: 0.30,
  legRadiusOfHalfWidth: 0.075,
  propRadiusOfHalfWidth: 0.30,
  










  propDrop: 0.46,
  blades: 4,
  
  stowTilt: -1.42,
});

const clampNum = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));







export function boatFor(spec) {
  const v = spec ?? VEHICLES[0];
  const style = STYLE_FOR[v.id] ?? 'pontoon';
  const shape = STYLE_SHAPE[style];
  const rearHalf = v.wheels.trackRear / 2;
  const rearTyre = v.wheels.rearWidth / 2;
  const radius = v.wheels.trackRear * shape.radius;

  
  
  
  
  
  
  
  const x = rearHalf + rearTyre + radius + shape.outboard;
  const beam = (x + radius) * 2;
  const length = Math.max(v.wheelbase * shape.length, beam * MIN_SLENDERNESS);

  const waterline = DRAFT;
  const pivotY = waterline + DRIVE.pivotLift;
  const hubY = waterline - DRIVE.propDrop;
  const propRadius = v.halfWidth * DRIVE.propRadiusOfHalfWidth;
  
  
  const legLength = (pivotY - hubY) + propRadius * 0.40;
  const engineTop = v.engine.y + v.engine.height / 2;

  const boat = {
    style,
    
    waterline,
    
    beam,
    length,
    floats: {
      style,
      x,
      
      
      
      y: waterline + shape.lift,
      
      
      
      
      z: -v.wheelbase * 0.14,
      radius,
      length,
      squash: shape.squash,
    },
    drive: {
      x: 0,
      
      
      y: pivotY,
      
      
      
      
      
      
      z: v.bumper.z - DRIVE.behindBumper,
      legLength,
      legRadius: v.halfWidth * DRIVE.legRadiusOfHalfWidth,
      propRadius,
      blades: DRIVE.blades,
      
      propOffset: pivotY - hubY,
      guard: true,
      stowTilt: DRIVE.stowTilt,
    },
    










    snorkel: engineTop < waterline + 0.10
      ? {
        x: v.engine.half * 0.72,
        y: engineTop,
        z: v.engine.z,
        
        
        height: clampNum(waterline + 0.55 - engineTop, 0.30, 1.20),
        radius: v.halfWidth * 0.055,
      }
      : null,
  };
  return deepFreeze(boat);
}

function deepFreeze(o) {
  for (const val of Object.values(o)) {
    if (val && typeof val === 'object') deepFreeze(val);
  }
  return Object.freeze(o);
}


export const boatBeam = (spec) => boatFor(spec).beam;


export function boatLength(spec) {
  const b = boatFor(spec);
  const nose = b.floats.z + b.floats.length / 2;
  const tail = Math.min(b.floats.z - b.floats.length / 2, b.drive.z - b.drive.propRadius);
  return nose - tail;
}

















export function boatSizeKey(spec) {
  const beam = boatBeam(spec);
  const len = boatLength(spec);
  const widthClass = beam < 2.9 ? 'narrow' : beam < 3.5 ? 'medium' : 'wide';
  const lengthClass = len < 3.5 ? 'short' : len < 3.9 ? 'mid' : 'long';
  return `${widthClass}/${lengthClass}`;
}

export function boatSilhouetteKey(spec) {
  return `${boatFor(spec).style}/${boatSizeKey(spec)}`;
}

