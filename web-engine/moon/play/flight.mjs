
































const TAU = Math.PI * 2;



import { takeOffSquash } from '../rig/heftPose.mjs';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeIn = (t) => t * t;

export const JUMP = Object.freeze({
  
  
  
  doubleTapMs: 320,
  
  
  hopHeightM: 0.62,
  hopS: 0.52,
  
  
  squash: 0.16,
  squashS: 0.18,
  
  cooldownMs: 90,
});

export const FLIGHT = Object.freeze({
  
  
  riseS: 1.6,
  
  
  coastS: 1.1,
  
  fallS: 1.5,
  
  landS: 0.34,
  
  apexM: 110,
  
  
  camPull: 3.4,
  
  
  
  get swapS() { return this.riseS + this.coastS / 2; },
  get totalS() { return this.riseS + this.coastS + this.fallS + this.landS; },
});


export function createJump() {
  return { lastTapMs: -Infinity, landedMs: -Infinity };
}










export function tapJump(jump, nowMs, air = null) {
  const next = { ...jump, lastTapMs: nowMs };
  if (air && air.kind === 'flight') return { kind: 'ignored', jump };
  if (air && air.kind === 'hop') {
    
    
    
    
    
    
    
    return nowMs - jump.lastTapMs <= JUMP.doubleTapMs
      ? { kind: 'flight', jump: next }
      : { kind: 'ignored', jump };
  }
  if (nowMs - jump.landedMs < JUMP.cooldownMs) return { kind: 'ignored', jump };
  return { kind: 'hop', jump: next };
}


export function startHop(groundY = 0) {
  return { kind: 'hop', t: 0, groundY, done: false };
}







export function launch(air, { from, to, groundY = 0, landY = 0 } = {}) {
  const lift = air && air.kind === 'hop' ? hopLift(air.t) : 0;
  
  
  
  const L = clamp(lift / FLIGHT.apexM, 0, 1);
  return {
    kind: 'flight',
    t: FLIGHT.riseS * (1 - Math.sqrt(1 - L)),
    from, to,
    groundY: air && air.kind === 'hop' ? air.groundY : groundY,
    landY,
    swapped: false,
    done: false,
  };
}


export function hopLift(t) {
  const u = clamp(t / JUMP.hopS, 0, 1);
  return JUMP.hopHeightM * 4 * u * (1 - u);
}


export function airStep(air, dt) {
  if (!air || air.done || !(dt > 0)) return air;
  const t = air.t + dt;
  if (air.kind === 'hop') {
    const end = JUMP.hopS + JUMP.squashS;
    return { ...air, t: Math.min(t, end), done: t >= end };
  }
  const next = { ...air, t: Math.min(t, FLIGHT.totalS), done: t >= FLIGHT.totalS };
  next.swapped = air.swapped || next.t >= FLIGHT.swapS;
  return next;
}





export const overDestination = (air) => Boolean(air && air.kind === 'flight' && air.t >= FLIGHT.swapS);


const riseLift = (t) => FLIGHT.apexM * easeOut(clamp(t / FLIGHT.riseS, 0, 1));

const fallLift = (t) => FLIGHT.apexM * (1 - easeIn(clamp(t / FLIGHT.fallS, 0, 1)));







export function flipAt(t) {
  const end = FLIGHT.riseS + FLIGHT.coastS + FLIGHT.fallS;
  const u = clamp(t / end, 0, 1);
  
  
  return TAU * smooth(u);
}














export function poseOf(air) {
  if (!air) return Object.freeze({ phase: 'ground', lift: 0, y: 0, flip: 0, squash: 1, fade: 0, camDist: 1, control: true });
  if (air.kind === 'hop') {
    const landT = air.t - JUMP.hopS;
    
    
    
    
    
    
    const squash = landT <= 0 ? takeOffSquash(air.t) : 1 - JUMP.squash * (1 - smooth(clamp(landT / JUMP.squashS, 0, 1)));
    const lift = hopLift(air.t);
    return { phase: 'hop', lift, y: air.groundY + lift, flip: 0, squash, fade: 0, camDist: 1, control: true };
  }
  const { riseS, coastS, fallS, landS, apexM, camPull, swapS } = FLIGHT;
  const t = air.t;
  const over = t >= swapS;
  const ground = over ? air.landY : air.groundY;
  let phase, lift;
  if (t < riseS) { phase = 'rise'; lift = riseLift(t); }
  else if (t < riseS + coastS) { phase = 'coast'; lift = apexM; }
  else if (t < riseS + coastS + fallS) { phase = 'fall'; lift = fallLift(t - riseS - coastS); }
  else { phase = 'land'; lift = 0; }
  const landT = t - (riseS + coastS + fallS);
  const squash = landT <= 0 ? 1 : 1 - JUMP.squash * 1.6 * (1 - smooth(clamp(landT / landS, 0, 1)));
  
  const fade = clamp(1 - Math.abs(t - swapS) / (riseS * 0.92), 0, 1);
  const up = clamp(lift / apexM, 0, 1);
  return {
    phase,
    lift,
    y: ground + lift,
    flip: flipAt(Math.min(t, riseS + coastS + fallS)),
    squash,
    fade: smooth(fade),
    camDist: 1 + (camPull - 1) * smooth(up),
    
    
    
    control: Boolean(air.done) || (phase === 'land' && landT >= landS),
  };
}


export const onGround = (air) => !air || air.done || poseOf(air).control;






















export const HOLD = Object.freeze({
  
  
  
  homeMs: 600,
});


export function holdStart(nowMs) {
  return { downMs: nowMs, fired: false };
}


export function holdAt(hold, nowMs) {
  if (!hold) return 0;
  return clamp((nowMs - hold.downMs) / HOLD.homeMs, 0, 1);
}






export function holdDone(hold, nowMs) {
  return Boolean(hold) && !hold.fired && holdAt(hold, nowMs) >= 1;
}
