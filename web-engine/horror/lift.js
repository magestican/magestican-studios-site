

























export const LIFT = Object.freeze({
  
  
  width: 3.0,
  
  
  
  
  depth: 3.1,
  height: 2.9,
  
  
  doorTime: 1.25,
  
  
  rideTime: 7.0,
  
  
  
  settle: 0.55,
  
  callRadius: 3.2,
  
  
  
  
  
  
  
  
  
  clearRadius: 9.0,
  
  
  
  
  
  
  
  
  
  
  
  apron: 1.4,
});






















export const LEAF = Object.freeze({
  
  halfThick: 0.045,
  
  
  
  pad: 0.4,
  
  
  
  
  reopenAfter: 0.1,
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







export function easeInv(e) {
  const v = clamp01(e);
  return v < 0.5 ? Math.sqrt(v / 2) : 1 - Math.sqrt((1 - v) * 2) / 2;
}


















export function stepLift(l, dt, { near = false, inside = false, away = !near } = {}) {
  const step = Math.max(0, dt);
  const n = { ...l, t: l.t + step, event: null };

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
      
      
      
      
      
      
      
      
      
      
      
      
      n.outFor = inside ? 0 : (l.outFor || 0) + step;
      if (n.outFor > LEAF.reopenAfter) {
        n.phase = 'opening';
        
        n.t = LIFT.doorTime * easeInv(n.door);
        n.sealed = false;
        n.outFor = 0;
        n.event = 'reopen';
      } else if (n.t >= LIFT.doorTime) { n.phase = 'held'; n.t = 0; n.door = 0; n.event = 'shut'; }
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
      
      
      
      if (!inside && away) { n.phase = 'idle'; n.t = 0; n.rise = 0; }
      break;

    default:
      break;
  }

  return n;
}










export function mapRise(l, deckGap) {
  return l.rise * deckGap;
}















export function carFrame(car) {
  const f = car.face || { x: 0, z: -1 };
  return { fx: f.x, fz: f.z, rx: -f.z, rz: f.x };
}


export function carLocal(car, x, z) {
  const { fx, fz, rx, rz } = carFrame(car);
  const dx = x - car.x; const dz = z - car.z;
  return { u: dx * fx + dz * fz, v: dx * rx + dz * rz };
}


export function carWorld(car, u, v) {
  const { fx, fz, rx, rz } = carFrame(car);
  return { x: car.x + u * fx + v * rx, z: car.z + u * fz + v * rz };
}













export function insideCar(car, x, z, pad = 0, doorPad = pad) {
  const { u, v } = carLocal(car, x, z);
  return u <= LIFT.depth / 2 - doorPad
    && u >= -(LIFT.depth / 2 - pad)
    && Math.abs(v) <= LIFT.width / 2 - pad;
}



























export function leafRects(car, door, pad = LEAF.pad) {
  const { fx, fz, rx, rz } = carFrame(car);
  const half = LIFT.width / 2;
  const d = Math.max(0, Math.min(1, door));
  const out = [];
  for (const side of [-1, 1]) {
    const v0 = half * d;                       
    const halfLen = Math.max(0, (half - v0) / 2);
    const vc = side * (v0 + half) / 2;
    const w = carWorld(car, LIFT.depth / 2, vc);
    out.push({
      x: w.x, z: w.z, ax: rx, az: rz, fx, fz,
      halfLen, halfThick: LEAF.halfThick, r: halfLen > 0 ? pad : 0, side,
    });
  }
  return out;
}









export function sealedRect(car, pad = LEAF.pad) {
  if (!car) return OFF_RECT;
  const { fx, fz, rx, rz } = carFrame(car);
  const w = carWorld(car, LIFT.depth / 2 + 0.1, 0);
  return {
    x: w.x, z: w.z, ax: rx, az: rz, fx, fz,
    halfLen: LIFT.width / 2, halfThick: LEAF.halfThick, r: pad, side: 0,
  };
}


export const OFF_RECT = Object.freeze({
  x: 0, z: 0, ax: 1, az: 0, fx: 0, fz: 1, halfLen: 0, halfThick: LEAF.halfThick, r: 0, side: 0,
});








export function leafContact(rects, x, z, slack = 0.02) {
  for (const o of rects) {
    if (!(o.halfLen > 0) || !(o.r > 0)) continue;
    const dx = x - o.x; const dz = z - o.z;
    const a = dx * o.ax + dz * o.az;
    const f = dx * o.fx + dz * o.fz;
    const qa = Math.max(0, Math.abs(a) - o.halfLen);
    const qf = Math.max(0, Math.abs(f) - o.halfThick);
    if (Math.hypot(qa, qf) < o.r - slack) return true;
  }
  return false;
}








































export function carBounds(car, pad = 0) {
  
  
  
  
  const f = car.face || { x: 0, z: -1 };
  const hx = (f.x !== 0 ? LIFT.depth : LIFT.width) / 2 + pad;
  const hz = (f.x !== 0 ? LIFT.width : LIFT.depth) / 2 + pad;
  return {
    x0: car.x - hx - (f.x < 0 ? LIFT.apron : 0),
    x1: car.x + hx + (f.x > 0 ? LIFT.apron : 0),
    z0: car.z - hz - (f.z < 0 ? LIFT.apron : 0),
    z1: car.z + hz + (f.z > 0 ? LIFT.apron : 0),
  };
}


export function clearOfCar(car, x, z, pad = 0) {
  const b = carBounds(car, pad);
  return x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1;
}










export function keepOut(car, x, z, pad = 0) {
  if (clearOfCar(car, x, z, pad)) return { x, z, moved: false };
  const b = carBounds(car, pad);
  
  
  
  
  
  const f = car.face || { x: 0, z: -1 };
  if (f.x > 0) return { x: b.x1 + 0.001, z, moved: true };
  if (f.x < 0) return { x: b.x0 - 0.001, z, moved: true };
  if (f.z > 0) return { x, z: b.z1 + 0.001, moved: true };
  return { x, z: b.z0 - 0.001, moved: true };
}




















export function carIsSafe(l, car, x, z) {
  if (!car) return false;
  if (!insideCar(car, x, z, -0.15)) return false;
  return !!l.sealed || l.door <= 0.02;
}
