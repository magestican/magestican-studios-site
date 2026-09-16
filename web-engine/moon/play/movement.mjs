


















export const FEEL = Object.freeze({
  
  
  
  
  
  walkSpeedMps: 1.3,
  runSpeedMps: 2.9,
  
  accelFloorMps2: 10,
  accelRatePerS: 12,
  
  
  decelFloorMps2: 14,
  decelRatePerS: 6,
  
  turnFloorRadPerS: 6,
  turnRatePerS: 9,
  
  
  
  dipStartDeg: 35,
  dipFullDeg: 115,
  
  
  
  reverseTieDeg: 10,
  
  maxSubstepS: 1 / 240,
  
  
  maxFrameS: 0.1,
});

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;


export function wrapAngle(a) {
  const w = (((a + Math.PI) % TAU) + TAU) % TAU - Math.PI;
  return w === -Math.PI ? Math.PI : w;
}


function timeToClose(gap, floor, rate) {
  if (gap <= 0) return 0;
  if (rate <= 0) return gap / floor;
  return Math.log(1 + (rate * gap) / floor) / rate;
}

export function gapAfter(gap, floor, rate, t) {
  if (gap <= 0) return 0;
  if (rate <= 0) return Math.max(0, gap - floor * t);
  const c = floor / rate;
  const g = (gap + c) * Math.exp(-rate * t) - c;
  return g > 0 ? g : 0;
}

function gapIntegral(gap, floor, rate, t) {
  const tc = Math.min(t, timeToClose(gap, floor, rate));
  if (tc <= 0) return 0;
  if (rate <= 0) return gap * tc - 0.5 * floor * tc * tc;
  const c = floor / rate;
  return ((gap + c) * (1 - Math.exp(-rate * tc))) / rate - c * tc;
}

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};


export function targetSpeed(input, cfg = FEEL) {
  if (!input || !(input.amount > 0) || !(input.dirX || input.dirZ)) return 0;
  return input.run ? cfg.runSpeedMps : cfg.walkSpeedMps * Math.min(1, input.amount);
}

function substep(s, input, h, cfg) {
  const base = targetSpeed(input, cfg);
  let heading = s.heading;
  let headingMid = s.heading;
  let dip = 1;
  let turn = 0;
  if (base > 0) {
    const desired = Math.atan2(input.dirX, input.dirZ);
    let err = wrapAngle(desired - s.heading);
    if (Math.abs(err) > Math.PI - cfg.reverseTieDeg * DEG) {
      
      
      
      
      
      
      let sign = s.turn || 0;
      if (!sign) {
        const toCamera = wrapAngle((input.cameraYaw || 0) - s.heading);
        sign = Math.abs(toCamera) < 1e-9 || Math.abs(toCamera) > Math.PI - 1e-9 ? 1 : Math.sign(toCamera);
      }
      if (Math.sign(err) !== sign) err = sign * (TAU - Math.abs(err));
    }
    const sign = err < 0 ? -1 : 1;
    const mag = Math.abs(err);
    const magMid = gapAfter(mag, cfg.turnFloorRadPerS, cfg.turnRatePerS, h / 2);
    const magEnd = gapAfter(mag, cfg.turnFloorRadPerS, cfg.turnRatePerS, h);
    headingMid = wrapAngle(desired - sign * magMid);
    heading = wrapAngle(desired - sign * magEnd);
    dip = 1 - smoothstep(cfg.dipStartDeg * DEG, cfg.dipFullDeg * DEG, magMid);
    turn = magEnd > 0 ? sign : 0;
  }
  const target = base * dip;
  let speed, dist;
  if (target >= s.speed) {
    const gap = target - s.speed;
    speed = target - gapAfter(gap, cfg.accelFloorMps2, cfg.accelRatePerS, h);
    dist = target * h - gapIntegral(gap, cfg.accelFloorMps2, cfg.accelRatePerS, h);
  } else {
    const gap = s.speed - target;
    speed = target + gapAfter(gap, cfg.decelFloorMps2, cfg.decelRatePerS, h);
    dist = target * h + gapIntegral(gap, cfg.decelFloorMps2, cfg.decelRatePerS, h);
  }
  return {
    x: s.x + Math.sin(headingMid) * dist,
    z: s.z + Math.cos(headingMid) * dist,
    heading,
    speed,
    turn,
  };
}













export function step(state, input, dt, collide = null, cfg = FEEL) {
  let s = { x: state.x, z: state.z, heading: state.heading || 0, speed: state.speed || 0, turn: state.turn || 0 };
  if (!(dt > 0)) return { ...s, vx: 0, vz: 0 };
  const n = Math.max(1, Math.ceil(dt / cfg.maxSubstepS - 1e-9));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const next = substep(s, input, h, cfg);
    if (collide) {
      const c = collide(s.x, s.z, next.x, next.z);
      next.x = c.x;
      next.z = c.z;
    }
    s = next;
  }
  return { ...s, vx: (s.x - state.x) / dt, vz: (s.z - state.z) / dt };
}


export function createPlayer(x = 0, z = 0, heading = 0) {
  return { x, z, heading, speed: 0, turn: 0, vx: 0, vz: 0 };
}
