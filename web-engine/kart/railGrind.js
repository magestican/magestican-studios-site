








































































import { chargeRate, boostForCharge } from './driftBoost.js';

const clamp = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));








export const GRIND_MIN_SPEED = 12;

























export const GRIND_MAX_ANGLE = 0.6;











export const GRIND_REACH = 2.0;








export const GRIND_MIN_TIME = 0.22;











export const GRIND_MAX_TIME = 4.0;








export const GRIND_MOUNT = 0.14;


export const GRIND_DRAG = 0.10;









export const GRIND_EXIT_STEER = 0.35;


export const GRIND_EXIT_PUSH = 6.0;


export const GRIND_TIMEOUT_PAY = 0.5;


export const GRIND_WHEELIE = 0.55;


export function grindFields() {
  return {
    
    grinding: false,
    
    grindTime: 0,
    






    grindSide: 0,
    
    grindCharge: 0,
    
    grindMount: 0,
    
    wheelie: 0,
    




    grindArmed: false,
    
    grindStarted: false,
    




    grindEnded: null,
  };
}

















export function grindStep(kart, input = {}, ctx = {}) {
  const { rail = null, dt = 0, enabled = true } = ctx;
  const idle = {
    grinding: false,
    grindTime: 0,
    side: 0,
    charge: 0,
    mount: 0,
    wheelie: 0,
    armed: false,
    started: false,
    ended: null,
    y: 0,
    heading: 0,
    speed: 0,
    boost: null,
    push: 0,
    jumpOff: false,
  };
  if (!enabled) return idle;

  const already = !!kart.grinding;
  const speed = Math.abs(kart.speed ?? 0);
  const spinning = (kart.spinTime ?? 0) > 0;

  
  if (!rail) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    return already
      ? timedOut(kart, 'ran-out', kart.grindCharge ?? 0, kart.grindSide ?? 0)
      : idle;
  }
  if (spinning || kart.gliding || kart.boating) {
    
    
    return already ? ended(kart, 'lost') : idle;
  }

  if (!already) {
    
    if (speed < GRIND_MIN_SPEED) return idle;
    if (Math.abs(rail.angle) > GRIND_MAX_ANGLE) return idle;
    
    if (Math.abs((kart.y ?? 0) - rail.y) > GRIND_REACH) return idle;
    return {
      grinding: true,
      grindTime: 0,
      side: rail.side,
      
      
      
      
      
      
      
      charge: kart.drifting ? (kart.driftCharge ?? 0) : 0,
      mount: 0,
      wheelie: 0,
      
      
      
      armed: !input.jump,
      started: true,
      ended: null,
      y: rail.y,
      heading: rail.tangent,
      speed: Math.abs(kart.speed ?? 0),
      boost: null,
      push: 0,
      jumpOff: false,
    };
  }

  
  const grindTime = (kart.grindTime ?? 0) + dt;
  const side = kart.grindSide || rail.side;
  const armed = kart.grindArmed || !input.jump;
  const mount = Math.min(1, (kart.grindMount ?? 0) + dt / Math.max(GRIND_MOUNT, 1e-6));
  const nextSpeed = Math.max(0, speed * (1 - GRIND_DRAG * dt));
  const charge = (kart.grindCharge ?? 0) + chargeRate({
    speed: nextSpeed,
    
    
    
    
    
    
    
    steerLock: 1,
    onRoad: false,
    topSpeed: kart.tuning?.topSpeed ?? 40,
  }) * dt;

  
  
  
  
  
  
  
  const steer = clamp(input.steer ?? 0, -1, 1);
  const wantsOff = armed && !!input.jump && steer * side >= GRIND_EXIT_STEER;
  if (wantsOff && grindTime >= GRIND_MIN_TIME) {
    return {
      ...ended(kart, 'jump'),
      side,
      boost: boostForCharge(charge),
      push: GRIND_EXIT_PUSH,
      jumpOff: true,
    };
  }
  
  
  if (rail.remaining <= 0) return timedOut(kart, 'ran-out', charge, side);
  if (grindTime >= GRIND_MAX_TIME) return timedOut(kart, 'timeout', charge, side);
  if (nextSpeed < GRIND_MIN_SPEED * 0.6) return timedOut(kart, 'too-slow', charge, side);

  return {
    grinding: true,
    grindTime,
    side,
    charge,
    mount,
    
    wheelie: mount,
    armed,
    started: false,
    ended: null,
    y: rail.y,
    heading: rail.tangent,
    speed: nextSpeed,
    boost: null,
    push: 0,
    jumpOff: false,
  };
}


function ended(kart, why) {
  return {
    grinding: false,
    grindTime: 0,
    side: kart.grindSide ?? 0,
    charge: 0,
    mount: 0,
    wheelie: 0,
    armed: false,
    started: false,
    ended: why,
    y: 0,
    heading: 0,
    speed: 0,
    boost: null,
    push: 0,
    jumpOff: false,
  };
}


function timedOut(kart, why, charge, side) {
  const full = boostForCharge(charge);
  return {
    ...ended(kart, why),
    side,
    
    
    
    
    boost: boostForCharge(charge * GRIND_TIMEOUT_PAY),
    
    
    fullBoost: full,
  };
}










export function grindHeight(fromY, railY, mount) {
  const u = clamp(mount, 0, 1);
  const s = u * u * (3 - 2 * u);
  return fromY + (railY - fromY) * s;
}









export function canGrind(kart) {
  return !kart.gliding && !kart.boating && !((kart.spinTime ?? 0) > 0);
}
