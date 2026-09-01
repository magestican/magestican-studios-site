

























export const LIFT = Object.freeze({
  
  
  width: 3.0,
  
  
  
  
  depth: 3.1,
  height: 2.9,
  
  
  doorTime: 1.25,
  
  
  rideTime: 7.0,
  
  
  
  settle: 0.55,
  
  callRadius: 3.2,
  
  
  
  
  
  
  
  
  
  
  
  apron: 1.4,
});


export const PHASES = Object.freeze([
  'idle',      
  'opening',   
  'boarding',  
  'closing',   
  'held',      
  'riding',    
  'settling',  
  'arriving',  
  'clear',     
]);

export function createLift() {
  return {
    phase: 'idle',
    t: 0,
    
    door: 0,
    
    rise: 0,
    
    event: null,
    
    sealed: false,
  };
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));



const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2);















export function stepLift(l, dt, { near = false, inside = false } = {}) {
  const n = { ...l, t: l.t + Math.max(0, dt), event: null };

  switch (l.phase) {
    case 'idle':
      n.door = 0;
      n.sealed = false;
      if (near) { n.phase = 'opening'; n.t = 0; n.event = 'open'; }
      break;

    case 'opening':
      n.door = ease(clamp01(n.t / LIFT.doorTime));
      if (n.t >= LIFT.doorTime) { n.phase = 'boarding'; n.t = 0; n.door = 1; }
      break;

    case 'boarding':
      n.door = 1;
      
      
      
      
      
      
      
      
      
      if (inside) { n.phase = 'closing'; n.t = 0; n.sealed = true; }
      break;

    case 'closing':
      n.door = 1 - ease(clamp01(n.t / LIFT.doorTime));
      
      
      
      n.sealed = true;
      if (n.t >= LIFT.doorTime) { n.phase = 'held'; n.t = 0; n.door = 0; n.event = 'shut'; }
      break;

    case 'held':
      n.door = 0;
      if (n.t >= LIFT.settle) { n.phase = 'riding'; n.t = 0; n.event = 'depart'; }
      break;

    case 'riding':
      n.door = 0;
      
      
      n.rise = ease(clamp01(n.t / LIFT.rideTime));
      if (n.t >= LIFT.rideTime) { n.phase = 'settling'; n.t = 0; n.rise = 1; n.event = 'arrive'; }
      break;

    case 'settling':
      if (n.t >= LIFT.settle) { n.phase = 'arriving'; n.t = 0; }
      break;

    case 'arriving':
      n.door = ease(clamp01(n.t / LIFT.doorTime));
      if (n.t >= LIFT.doorTime) {
        n.phase = 'clear';
        n.t = 0;
        n.door = 1;
        n.sealed = false;
        n.event = 'ready';
      }
      break;

    case 'clear':
      n.door = 1;
      n.sealed = false;
      
      
      if (!inside && !near) { n.phase = 'idle'; n.t = 0; n.rise = 0; }
      break;

    default:
      break;
  }

  return n;
}










export function mapRise(l, deckGap) {
  return l.rise * deckGap;
}







export function insideCar(car, x, z, pad = 0) {
  return Math.abs(x - car.x) <= LIFT.width / 2 - pad
    && Math.abs(z - car.z) <= LIFT.depth / 2 - pad;
}








































export function carBounds(car, pad = 0) {
  return {
    x0: car.x - LIFT.width / 2 - pad,
    x1: car.x + LIFT.width / 2 + pad,
    z0: car.z - LIFT.depth / 2 - LIFT.apron - pad,
    z1: car.z + LIFT.depth / 2 + pad,
  };
}


export function clearOfCar(car, x, z, pad = 0) {
  const b = carBounds(car, pad);
  return x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1;
}










export function keepOut(car, x, z, pad = 0) {
  if (clearOfCar(car, x, z, pad)) return { x, z, moved: false };
  const b = carBounds(car, pad);
  return { x, z: b.z0 - 0.001, moved: true };
}




















export function carIsSafe(l, car, x, z) {
  if (!car) return false;
  if (!insideCar(car, x, z, -0.15)) return false;
  return !!l.sealed || l.door <= 0.02;
}
