






























































































import { XANDER_RIG, FOOT_LEVER } from './xanderRig.js';









const SH = XANDER_RIG.shoulderZ;
const ARM = XANDER_RIG.upperArm + XANDER_RIG.foreArm;
const HIP = XANDER_RIG.hipZ;
const LEG = XANDER_RIG.thigh + XANDER_RIG.shin;









const MAX_DROP = 0.045;







const HEEL_OFF = 0.62;








const TOE_ARM = FOOT_LEVER.toe;
const HEEL_ARM = FOOT_LEVER.heel;

export const GAIT = Object.freeze({
  walk: {
    
    
    
    stride: 0.21,
    lift: 0.075,          
    stance: 0.62,         
                          
                          
    
    
    
    
    
    
    
    
    
    
    
    
    front: 0.224,
    back: 0.280,
    lean: 0.04,
    twist: 0.16,
    
    
    
    
    
    
    
    
    
    
    
    
    
    hand: { y: 0.548, rise: 0.038, swing: 0.138, lead: 0.015 },
    
    
    
    
    
    
    armLag: { x: 0.045, y: 0.105 },
    
    
    
    
    
    
    
    
    
    
    roll: { strike: -0.32, off: 0.80 },
    
    
    
    
    
    
    
    grip: 'fist',
  },
  sprint: {
    stride: 0.42,
    lift: 0.155,
    
    
    
    
    stance: 0.36,
    
    
    
    
    
    
    
    front: 0.18,
    back: 0.30,
    lean: 0.17,           
    twist: 0.30,
    
    
    
    
    
    hand: { y: 0.615, rise: 0.085, swing: 0.215, lead: 0.035 },
    
    
    
    
    armLag: { x: 0.028, y: 0.070 },
    
    roll: { strike: -0.18, off: 0.95 },
    grip: 'fist',
  },
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  shuffle: {
    stride: 0.07,
    lift: 0.035,          
    stance: 0.62,         
    front: 0.070,
    back: 0.085,
    lean: 0.015,
    twist: 0.10,
    
    
    hand: { y: 0.520, rise: 0.018, swing: 0.045, lead: 0.012 },
    
    
    
    
    armLag: { x: 0.050, y: 0.090 },
    roll: { strike: -0.14, off: 0.38 },
    grip: 'open',
  },
});










export const STAND_FEET = Object.freeze([[-0.035, 0], [0.052, 0]]);

const TAU = Math.PI * 2;
const wrap = (p) => ((p % 1) + 1) % 1;
const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));














export const cycleTravel = (mode) => {
  const c = GAIT[mode] || GAIT.walk;
  return (c.front + c.back) / c.stance;
};




















function hipDrop(feet, phases, cfg) {
  let need = HIP;
  for (let i = 0; i < 2; i += 1) {
    const u = wrap(phases[i]) / cfg.stance;
    
    
    
    
    
    
    
    
    
    
    if (u >= HEEL_OFF) continue;
    const [fx, fy] = feet[i];
    const h = fy + Math.sqrt(Math.max(0, LEG * LEG - fx * fx));
    if (h < need) need = h;
  }
  return clamp(HIP - need, 0, MAX_DROP);
}














function reachSafe(x, y) {
  return reachFrom(x, y, SH);
}




export function reachGuard(x, y) {
  return reachFrom(x, y, SH);
}













function reachFrom(x, y, sy) {
  const dy = y - sy;
  const d = Math.hypot(x, dy);
  const max = ARM * 0.985;
  if (d <= max || d < 1e-6) return [x, y];
  const k = max / d;
  return [x * k, sy + dy * k];
}


function ss(v) {
  const c = clamp(v, 0, 1);
  return c * c * (3 - 2 * c);
}









function footX(p, cfg) {
  const t = wrap(p);
  const E = cfg.front + cfg.back;
  if (t < cfg.stance) {
    
    return cfg.front - E * (t / cfg.stance);
  }
  const u = (t - cfg.stance) / (1 - cfg.stance);
  return -cfg.back + E * (u * u * (3 - 2 * u));
}














export function toePitch(p, cfg) {
  const t = wrap(p);
  const R = cfg.roll;
  if (t < cfg.stance) {
    const u = t / cfg.stance;
    if (u < 0.18) return R.strike * (1 - u / 0.18);
    if (u < HEEL_OFF) return 0;
    return R.off * ((u - HEEL_OFF) / (1 - HEEL_OFF)) ** 1.4;
  }
  const u = (t - cfg.stance) / (1 - cfg.stance);
  return R.off * Math.max(0, 1 - u / 0.28) + R.strike * Math.min(1, u / 0.55);
}











function footY(p, cfg) {
  const t = wrap(p);
  const pitch = toePitch(t, cfg);
  const pivot = pitch >= 0
    ? TOE_ARM * Math.sin(pitch)      
    : HEEL_ARM * Math.sin(-pitch);   
  let arc = 0;
  if (t >= cfg.stance) {
    const u = (t - cfg.stance) / (1 - cfg.stance);
    
    
    arc = cfg.lift * Math.sin(u ** 0.72 * Math.PI);
  }
  return Math.max(pivot, arc);
}







export function gaitPose(p, mode = 'walk') {
  const cfg = GAIT[mode] || GAIT.walk;
  const t = wrap(p);

  const fxL = footX(t, cfg);
  const fxR = footX(t + 0.5, cfg);
  const footL = [fxL, footY(t, cfg)];
  const footR = [fxR, footY(t + 0.5, cfg)];

  
  
  
  
  
  const drop = hipDrop([footL, footR], [t, t + 0.5], cfg);
  const rise = -drop;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const H = cfg.hand;
  const LAG = cfg.armLag || { x: 0, y: 0 };
  const half = (cfg.front + cfg.back) / 2;
  const armAt = (ph) => {
    const ux = clamp(footX(ph - LAG.x, cfg) / half, -1, 1);
    const uy = clamp(footX(ph - LAG.y, cfg) / half, -1, 1);
    return reachSafe(
      H.lead + H.swing * ux,
      
      
      H.y + H.rise * uy + rise * 0.4,
    );
  };

  return {
    
    
    
    hands: [armAt(t + 0.5), armAt(t)],
    feet: [footL, footR],
    
    toe: [toePitch(t, cfg), toePitch(t + 0.5, cfg)],
    
    
    
    
    drop,
    grip: cfg.grip,
    
    
    
    twist: Math.sin(t * TAU) * cfg.twist,
    air: 0,
    
    
    squash: 1 + rise,
    lean: cfg.lean,
  };
}







export function support(p, mode = 'walk') {
  const cfg = GAIT[mode] || GAIT.walk;
  const t = wrap(p);
  const down = (q) => wrap(q) < cfg.stance;
  return { left: down(t), right: down(t + 0.5) };
}































export function standPose(t = 0) {
  const b = Math.sin(t * 0.9);          
  const s = Math.sin(t * 0.9 - 0.5);    
  return {
    hands: [
      reachSafe(0.048, 0.505 + b * 0.004),
      reachSafe(0.036, 0.500 + b * 0.003),
    ],
    
    
    
    
    
    
    
    feet: [[...STAND_FEET[0]], [...STAND_FEET[1]]],
    toe: [0, 0],
    grip: 'open',
    
    
    twist: 0.05,
    air: 0,
    squash: 1 + b * 0.0045 + s * 0.0015,
    lean: 0.012,
  };
}









































export function aimPose(t, base = 0.0) {
  const breath = Math.sin(t * 0.9 * Math.PI * 2);
  const sway = Math.sin(t * 1.37 * Math.PI * 2);
  
  const dz = breath * 0.008 + sway * 0.004;
  const dx = sway * 0.006;
  return {
    hands: [
      
      reachSafe(0.40 + dx, SH - 0.155 + dz + base),
      
      reachSafe(0.255 + dx * 0.6, SH - 0.215 + dz * 0.8 + base),
    ],
    
    
    grip: 'fist',
    
    
    twist: 0.34 + breath * 0.02,
    lean: 0.012 + breath * 0.006,
  };
}













export function aimedGait(gait, aim) {
  return {
    ...gait,
    hands: aim.hands,
    grip: aim.grip,
    twist: aim.twist,
    lean: gait.lean * 0.35 + aim.lean,
  };
}























const FIRE_LAG = Object.freeze({ shoulder: 0.022, body: 0.048 });

export function firePose(t, base = 0.0) {
  const impulse = (lag) => {
    const s = t - lag;
    if (!(s > 0)) return 0;
    return Math.exp(-s * 14) * Math.sin(Math.min(s, 0.5) * 46);
  };
  const kick = impulse(0);                       
  const kShoulder = impulse(FIRE_LAG.shoulder);  
  const kBody = impulse(FIRE_LAG.body);          
  const raise = Math.min(1, t / 0.09);
  return {
    hands: [
      
      reachSafe(0.40 * raise - kick * 0.075, SH - 0.16 + kick * 0.05 + base),
      
      reachSafe(0.27 * raise - kick * 0.055, SH - 0.21 + kick * 0.04 + base),
    ],
    
    feet: [[-0.26, 0], [0.18, 0]],
    
    
    toe: [0.22, 0],
    grip: 'fist',
    
    
    
    
    twist: 0.42 - kShoulder * 0.30,
    air: 0,
    
    squash: 1 - Math.abs(kShoulder) * 0.012 - Math.abs(kBody) * 0.010,
    lean: -kBody * 0.07,
  };
}













































export const STRUGGLE_BEAT = (Math.PI * 2) / 13.5;


export const STRUGGLE_CYCLE = STRUGGLE_BEAT * 2;


const STRUGGLE_COUNTER = 0.55;









export function fightWave(t) {
  const c = ((t % STRUGGLE_CYCLE) + STRUGGLE_CYCLE) % STRUGGLE_CYCLE;
  const first = c < STRUGGLE_BEAT;
  const u = (first ? c : c - STRUGGLE_BEAT) / STRUGGLE_BEAT;
  
  
  
  
  
  
  
  
  
  
  const env = ss(u / 0.14) * (1 - ss((u - 0.22) / 0.78) ** 0.6);
  return (first ? 1 : -STRUGGLE_COUNTER) * env;
}

export function strugglePose(t, drive = 0.5) {
  const w = fightWave(t);
  const a = 0.35 + drive * 0.65;
  const e = Math.abs(w);
  
  
  
  const heave = Math.abs(fightWave(t - STRUGGLE_BEAT * 0.12));
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const R = ARM * 0.985;
  const polar = (ang, r) => [Math.sin(ang) * R * r, SH - Math.cos(ang) * R * r];
  return {
    hands: [
      
      
      
      
      
      
      polar(0.72 + w * 0.58 * a, 0.78 + e * 0.21 * a),
      
      
      
      polar(0.62 - w * 0.40 * a, 0.52 + e * 0.06 * a),
    ],
    
    
    feet: [
      [-0.30 - heave * 0.10 * a, 0],
      [0.28 + w * 0.07 * a, 0],
    ],
    
    
    
    toe: [0.16 + heave * 0.14, 0.14 + e * 0.12],
    grip: 'open',
    twist: w * 0.55 * a,
    air: 0,
    
    
    squash: 0.94 - heave * 0.05,
    lean: -0.06 - drive * 0.05 - heave * 0.06,
  };
}


































export const DEATH_IMPACT = 0.58;








export function deathFall(u) {
  const k = clamp(u, 0, 1);
  if (k <= DEATH_IMPACT) {
    
    
    
    return 1.15 * (k / DEATH_IMPACT) ** 1.9;
  }
  
  
  const s = (k - DEATH_IMPACT) / (1 - DEATH_IMPACT);
  return 1.15 + Math.sin(s * Math.PI * 2.1) * 0.085 * Math.exp(-s * 2.8);
}









export function deathPose(u) {
  const k = clamp(u, 0, 1);
  
  
  const g = deathFall(k) / 1.15;
  
  const s = k <= DEATH_IMPACT ? 0 : (k - DEATH_IMPACT) / (1 - DEATH_IMPACT);
  const ring = s > 0 ? Math.sin(s * Math.PI * 2.1) * Math.exp(-s * 2.8) : 0;
  return {
    hands: [
      
      
      reachSafe(0.10 - g * 0.22 - ring * 0.06, (SH - 0.30) * (1 - g * 0.86) + ring * 0.03),
      reachSafe(-0.04 + ring * 0.04, (SH - 0.26) * (1 - g * 0.9) - ring * 0.02),
    ],
    
    feet: [[-0.24 - g * 0.14 - ring * 0.05, 0], [0.20 + g * 0.2 + ring * 0.04, 0]],
    
    
    toe: [-0.10 - g * 0.30, 0.10 + g * 0.40],
    grip: 'open',
    twist: 0.1 - g * 0.3 - ring * 0.05,
    air: 0,
    
    squash: 1 - g * 0.42 - Math.max(0, ring) * 0.05,
    lean: 0,
  };
}












export const KICK_TIME = 0.45;




























export function kickPose(t) {
  const u = clamp(t / KICK_TIME, 0, 1);
  const load = ss(u / 0.22) * (1 - ss((u - 0.22) / 0.50));
  const k = ss((u - 0.20) / 0.30) * (1 - ss((u - 0.62) / 0.38));
  
  
  
  const drop = 0.030 * load + 0.055 * k;
  const shY = SH - drop;
  return {
    hands: [
      
      reachFrom(0.14 + 0.16 * k - 0.06 * load, shY - 0.30 + 0.18 * k, shY),
      
      reachFrom(0.04 - 0.24 * k - 0.10 * load, shY - 0.28 - 0.04 * k, shY),
    ],
    feet: [
      
      
      [-0.09 - 0.03 * load, 0],
      
      [0.05 - 0.19 * load + 0.33 * k, 0.05 * load + 0.26 * k],
    ],
    
    
    toe: [0.10 * k, 0.12 * load - 0.30 * k],
    grip: 'open',                     
    twist: 0.10 * load - 0.30 * k,    
    air: 0,
    drop,
    squash: 1 - drop,
    
    lean: -0.10 * load - 0.18 * k,
  };
}






export const FLINCH_TIME = 0.30;


































export function flinchAdd(t, bearing = 0) {
  if (!(t >= 0) || t >= FLINCH_TIME) {
    return { lean: 0, bob: 0, roll: 0, twist: 0 };
  }
  const k = 1 - t / FLINCH_TIME;
  const e = k * k;
  const c = Math.cos(bearing);
  const s = Math.sin(bearing);
  return {
    lean: -0.17 * e * c,
    bob: -0.048 * e,
    
    
    
    
    roll: Math.sin(Math.PI * (t / FLINCH_TIME)) * 0.055 * s,
    
    twist: 0.06 * e * s,
  };
}


































export function idleShift(t) {
  return {
    roll: Math.sin(t * 0.193) * 0.024 + Math.sin(t * 0.309 + 2.1) * 0.008,
    lean: Math.sin(t * 0.230 + 1.7) * 0.007,
    bob: Math.sin(t * 0.193 + 0.9) * 0.0045,
  };
}










export const TURN_RATE_MIN = 0.9;







export const TURN_CYCLES_PER_RAD = 0.55;








export const TURN_MAX_CYCLES_PER_S = 2.2;






export function turnStep(phase, dYaw, dt) {
  const step = Math.min(
    Math.abs(dYaw) * TURN_CYCLES_PER_RAD,
    Math.max(0, dt || 0) * TURN_MAX_CYCLES_PER_S,
  );
  return wrap(phase + step);
}











export const REACH_TIME = 0.42;


















export function reachPose(t) {
  const u = clamp(t / REACH_TIME, 0, 1);
  const w = u < 0.45 ? ss(u / 0.45) : 1 - ss((u - 0.45) / 0.55);
  const drop = 0.17 * w;
  const shY = SH - drop;
  
  
  
  const rx = 0.04 + 0.17 * w;
  const rdy = -0.97 * Math.sqrt(Math.max(1e-4, (ARM * 0.985) ** 2 - rx * rx));
  return {
    hands: [
      
      reachFrom(0.10 - 0.06 * w, shY - 0.30 - 0.02 * w, shY),
      
      reachFrom(rx, shY + rdy, shY),
    ],
    
    
    feet: [[-0.035 - 0.075 * w, 0], [0.052 + 0.078 * w, 0]],
    toe: [0.16 * w, 0],
    grip: 'open',
    twist: 0.05 + 0.14 * w,           
    air: 0,
    drop,
    squash: 1 - drop,
    lean: 0.012 + 0.13 * w,           
  };
}













export const gripOf = (pose) => ((pose && pose.grip) === 'fist'
  ? ['fist', 'fist']
  : ['open', 'open']);
















export const SETTLE_TIME = 0.65;






export const CONTACT_EPS = 0.045;
























































































export const STEP_OFF_LOAD = 0.30;



















const STEP_OFF_MODE = 'walk';








export function stepOffTravel() {
  return STAND_FEET[1][0] - footX(0.5, GAIT[STEP_OFF_MODE]);
}








export function stepOffPose(u) {
  const mode = STEP_OFF_MODE;
  const cfg = GAIT[mode];
  const k = clamp(u, 0, 1);
  const travel = stepOffTravel();

  
  
  const supX = STAND_FEET[1][0] - travel * k;
  
  
  
  const supToe = toePitch(0.5, cfg) * ss((k - 0.45) / 0.55);
  const supY = Math.max(0, TOE_ARM * Math.sin(supToe));

  
  
  const plantedX = STAND_FEET[0][0] - travel * k;
  const landX = footX(0, cfg);
  let swX = plantedX;
  let swY = 0;
  let swToe = 0;
  if (k > STEP_OFF_LOAD) {
    const s = (k - STEP_OFF_LOAD) / (1 - STEP_OFF_LOAD);
    const from = STAND_FEET[0][0] - travel * STEP_OFF_LOAD;
    swX = from + (landX - from) * ss(s);
    
    
    swToe = cfg.roll.strike * ss(s);
    
    
    
    
    
    
    swY = Math.max(
      cfg.lift * 0.85 * Math.sin(s ** 0.72 * Math.PI),
      swToe >= 0 ? TOE_ARM * Math.sin(swToe) : HEEL_ARM * Math.sin(-swToe),
    );
  }

  
  
  
  
  const anticip = Math.sin(Math.PI * clamp(k / (STEP_OFF_LOAD * 1.6), 0, 1));
  const drop = Math.min(MAX_DROP, 0.024 * anticip);
  const rise = -drop;
  
  const lean = -0.022 * anticip + cfg.lean * ss(k);

  
  
  const contact = gaitPose(0, mode);
  const stand = standPose(0);
  const armK = ss(clamp((k - 0.06) / 0.94, 0, 1));
  const blend = (a, b) => reachSafe(a[0] + (b[0] - a[0]) * armK, a[1] + (b[1] - a[1]) * armK + rise * 0.4);

  return {
    hands: [blend(stand.hands[0], contact.hands[0]), blend(stand.hands[1], contact.hands[1])],
    feet: [[swX, swY], [supX, supY]],
    toe: [swToe, supToe],
    grip: cfg.grip,
    
    twist: -0.06 * anticip + contact.twist * ss(k),
    air: 0,
    drop,
    squash: 1 + rise,
    lean,
  };
}







export const stepOffDist = (h) => stepOffTravel() * h;

export function settleStep(phase, settle, dt) {
  const p0 = wrap(phase);
  
  
  const next = p0 < 0.5 ? 0.5 : 1;
  const togo = next - p0;
  
  
  
  const rate = 1.15 * (0.30 + 0.70 * Math.min(1, togo / 0.22));
  const step = dt * rate;
  
  
  
  if (step >= togo - CONTACT_EPS) return { phase: wrap(next), settle: 0, done: true };
  const left = Math.max(0, settle - dt);
  return { phase: wrap(p0 + step), settle: left, done: left <= 0 };
}
















export function woundedGait(gait, wallward = false) {
  return {
    ...gait,
    hands: [
      
      
      wallward
        ? reachSafe(0.33, SH + 0.10)
        : reachSafe(gait.hands[0][0] * 0.35, gait.hands[0][1]),
      
      
      reachSafe(0.10, SH - 0.28),
    ],
    grip: 'open',
    
    
    lean: (gait.lean ?? 0) + 0.10,
    twist: (gait.twist ?? 0) + (wallward ? 0.14 : 0.04),
    
    squash: (gait.squash ?? 1) * 0.97,
  };
}






export function wallLeanPose(t) {
  const b = Math.sin(t * 0.9 * Math.PI * 2) * 0.008;
  const s = Math.sin(t * 1.37 * Math.PI * 2) * 0.005;
  return {
    hands: [
      reachSafe(0.30, SH + 0.14 + b),          
      reachSafe(0.09, SH - 0.29 + s),           
    ],
    feet: [[-0.02, 0], [0.14, 0]],
    toe: [0, 0.05],
    grip: 'open',
    twist: 0.22,
    air: 0,
    squash: 0.955 + b,
    lean: 0.08,
  };
}
























export function limpWarp(p, bias = 0.6) {
  const t = wrap(p);
  const b = clamp(bias, 0, 1);
  const half = t < 0.5 ? 0 : 1;
  const u = (t - half * 0.5) / 0.5;             
  
  
  const e = half === 0 ? 1 + b * 1.1 : 1 / (1 + b * 1.1);
  return half * 0.5 + (u ** e) * 0.5;
}





export function dangerGait(gait, wallward = false) {
  const w = woundedGait(gait, wallward);
  return {
    ...w,
    hands: [
      w.hands[0],
      
      
      reachSafe(0.13, SH - 0.33),
    ],
    
    lean: (gait.lean ?? 0) + 0.19,
    squash: (gait.squash ?? 1) * 0.94,
  };
}






export function forearmLeanPose(t) {
  const b = Math.sin(t * 0.83 * Math.PI * 2) * 0.010;
  const s = Math.sin(t * 1.29 * Math.PI * 2) * 0.006;
  return {
    hands: [
      reachSafe(0.20, SH + 0.04 + b),          
      reachSafe(0.12, SH - 0.34 + s),          
    ],
    feet: [[-0.06, 0], [0.17, 0]],
    toe: [0, 0.05],
    grip: 'open',
    twist: 0.30,
    air: 0,
    squash: 0.925 + b,
    
    
    lean: 0.26,
  };
}


















export function feedPose(k) {
  const u = Math.sin(Math.PI * clamp(k, 0, 1));
  return {
    hands: [
      
      
      reachSafe(0.14 + 0.24 * u, SH - 0.16 - 0.10 * u),
      
      reachSafe(0.06 + 0.03 * u, SH - 0.30 + 0.02 * u),
    ],
    feet: [[-0.05, 0], [0.11, 0]],
    toe: [0.02, 0.05],
    grip: 'open',
    
    twist: 0.05 + 0.20 * u,
    air: 0,
    
    
    drop: 0.035 * u,
    squash: 1 - 0.03 * u,
    lean: 0.05 + 0.30 * u,
  };
}
