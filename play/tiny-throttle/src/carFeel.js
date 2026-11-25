










export const SQUASH = Object.freeze({
  fall: 0.8,   
  gain: 2,     
  max: 0.22,   
  omega: (2 * Math.PI) / 0.25, 
  zeta: 0.35,  
});

export function createSuspension() {
  return { prevY: null, fallVy: 0, still: 0, squash: 0, vel: 0, landed: 0 };
}


export function stepSuspension(s, y, dt) {
  if (!(dt > 0)) return s;
  s.landed = 0; 
  if (s.prevY !== null) {
    const vy = (y - s.prevY) / dt;
    if (vy < -SQUASH.fall) { s.fallVy = Math.min(s.fallVy, vy); s.still = 0; }
    else if (s.fallVy < 0) {
      s.still += 1;
      if (s.still >= 2) { s.landed = -s.fallVy; s.vel += s.landed * SQUASH.gain; s.fallVy = 0; s.still = 0; }
    }
  }
  s.prevY = y;
  if (s.squash !== 0 || s.vel !== 0) {
    const { omega, zeta } = SQUASH;
    s.vel += (-omega * omega * s.squash - 2 * zeta * omega * s.vel) * dt;
    s.squash += s.vel * dt;
    if (s.squash > SQUASH.max) { s.squash = SQUASH.max; s.vel = Math.min(0, s.vel); }
    if (s.squash < -SQUASH.max / 2) { s.squash = -SQUASH.max / 2; s.vel = Math.max(0, s.vel); }
    if (Math.abs(s.squash) < 1e-4 && Math.abs(s.vel) < 1e-3) { s.squash = 0; s.vel = 0; }
  }
  return s;
}


export const bodyScale = (s) => ({ y: 1 - s.squash, xz: 1 + s.squash * 0.5 });




export const SHAKE = Object.freeze({
  max: 0.012,  
  decay: 1.8,  
});

export function createShake({ reduced = false } = {}) {
  return { trauma: 0, t: 0, reduced };
}

export function addShake(sh, amount) {
  if (sh.reduced || !(amount > 0)) return sh;
  sh.trauma = Math.min(1, sh.trauma + amount);
  return sh;
}


export function stepShake(sh, dt) {
  sh.t += dt;
  sh.trauma = Math.max(0, sh.trauma - SHAKE.decay * dt);
  const a = sh.trauma * sh.trauma * SHAKE.max;
  if (a === 0) return { x: 0, y: 0 };
  return { x: a * Math.sin(sh.t * 41 + 1.3), y: a * Math.cos(sh.t * 29 + 0.7) };
}
