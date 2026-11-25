










export const ATTITUDE = Object.freeze({
  maxPitch: 0.55,   
  follow: 12,       
  minSpeed: 0.25,   
});




export const WHEELIE = Object.freeze({
  rest: 0.15,       
  accel: 2.0,       
  from: 0.8,        
  kick: 4.5,        
  max: 0.2,         
  omega: (2 * Math.PI) / 0.5,
  zeta: 0.55,       
});

const MAX_VY = 6; 

export function createAttitude() {
  return { prevY: null, prevH: null, vy: 0, pitch: 0, wheelie: 0, wVel: 0, armed: true };
}





export function stepAttitude(a, { y, h }, dt) {
  if (!(dt > 0)) return a;
  if (a.prevY !== null) {
    
    
    const raw = Math.max(-MAX_VY, Math.min(MAX_VY, (y - a.prevY) / dt));
    a.vy += (raw - a.vy) * Math.min(1, dt * 20);
    if (h > ATTITUDE.minSpeed) {
      const want = Math.max(-ATTITUDE.maxPitch, Math.min(ATTITUDE.maxPitch, Math.atan2(a.vy, h)));
      a.pitch += (want - a.pitch) * Math.min(1, dt * ATTITUDE.follow);
    }
    const accel = (h - a.prevH) / dt;
    if (h <= WHEELIE.rest) a.armed = true;
    else if (h > WHEELIE.from) a.armed = false;
    else if (a.armed && accel >= WHEELIE.accel) { a.wVel += WHEELIE.kick; a.armed = false; }
  }
  a.prevY = y;
  a.prevH = h;
  if (a.wheelie !== 0 || a.wVel !== 0) {
    const { omega, zeta } = WHEELIE;
    a.wVel += (-omega * omega * a.wheelie - 2 * zeta * omega * a.wVel) * dt;
    a.wheelie += a.wVel * dt;
    if (a.wheelie > WHEELIE.max) { a.wheelie = WHEELIE.max; a.wVel = Math.min(0, a.wVel); }
    if (a.wheelie < 0) { a.wheelie = 0; a.wVel = Math.max(0, a.wVel) * 0.3; } 
    if (a.wheelie < 1e-4 && Math.abs(a.wVel) < 1e-3) { a.wheelie = 0; a.wVel = 0; }
  }
  return a;
}

export const noseUp = (a) => a.pitch + a.wheelie;



export const SPARKS = Object.freeze({
  pool: 64,
  minImpact: 1.6,   
  perImpact: 6,     
  maxBurst: 14,
  life: 0.35,       
  gravity: 9.81,
});

export function createSparks(n = SPARKS.pool) {
  return { n, next: 0, x: new Float32Array(n), y: new Float32Array(n), z: new Float32Array(n),
    vx: new Float32Array(n), vy: new Float32Array(n), vz: new Float32Array(n), age: new Float32Array(n).fill(Infinity) };
}


export const sparkCount = (impact) => (impact > SPARKS.minImpact
  ? Math.min(SPARKS.maxBurst, Math.ceil((impact - SPARKS.minImpact) * SPARKS.perImpact)) : 0);


export function emitSparks(p, { x, y, z, heading, impact }, rnd = Math.random) {
  const count = sparkCount(impact);
  const fx = Math.sin(heading); const fz = Math.cos(heading);
  for (let i = 0; i < count; i += 1) {
    const j = p.next; p.next = (p.next + 1) % p.n;
    const side = (rnd() - 0.5) * 2; 
    const back = 0.4 + rnd() * 0.6;
    p.x[j] = x; p.y[j] = y + 0.004; p.z[j] = z;
    p.vx[j] = -fx * back + fz * side * 0.6;
    p.vz[j] = -fz * back - fx * side * 0.6;
    p.vy[j] = 0.3 + rnd() * 0.5;
    p.age[j] = 0;
  }
  return count;
}


export function stepSparks(p, dt) {
  let alive = 0;
  for (let j = 0; j < p.n; j += 1) {
    if (!(p.age[j] < SPARKS.life)) continue;
    p.age[j] += dt;
    p.vy[j] -= SPARKS.gravity * dt;
    p.x[j] += p.vx[j] * dt; p.y[j] += p.vy[j] * dt; p.z[j] += p.vz[j] * dt;
    if (p.age[j] < SPARKS.life) alive += 1;
  }
  return alive;
}
