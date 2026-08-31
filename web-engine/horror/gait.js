






























































































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
    
    roll: { strike: -0.18, off: 0.95 },
    grip: 'fist',
  },
});

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
  const dy = y - SH;
  const d = Math.hypot(x, dy);
  const max = ARM * 0.985;
  if (d <= max || d < 1e-6) return [x, y];
  const k = max / d;
  return [x * k, SH + dy * k];
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
  const half = (cfg.front + cfg.back) / 2;
  const armAt = (fx) => {
    const u = clamp(fx / half, -1, 1);
    return reachSafe(
      H.lead + H.swing * u,
      
      
      H.y + H.rise * u + rise * 0.4,
    );
  };

  return {
    
    hands: [armAt(fxR), armAt(fxL)],
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
    
    
    
    
    feet: [[-0.035, 0], [0.052, 0]],
    toe: [0, 0],
    grip: 'open',
    
    
    twist: 0.05,
    air: 0,
    squash: 1 + b * 0.0045 + s * 0.0015,
    lean: 0.012,
  };
}













export function firePose(t, base = 0.0) {
  const kick = Math.exp(-t * 14) * Math.sin(Math.min(t, 0.5) * 46);
  const raise = Math.min(1, t / 0.09);
  return {
    hands: [
      
      reachSafe(0.40 * raise - kick * 0.075, SH - 0.16 + kick * 0.05 + base),
      
      reachSafe(0.27 * raise - kick * 0.055, SH - 0.21 + kick * 0.04 + base),
    ],
    
    feet: [[-0.26, 0], [0.18, 0]],
    
    
    toe: [0.22, 0],
    grip: 'fist',
    twist: 0.42 - kick * 0.22,
    air: 0,
    squash: 1 - Math.abs(kick) * 0.012,
    lean: -kick * 0.05,
  };
}










export function strugglePose(t, drive = 0.5) {
  const w = Math.sin(t * 13.5);
  const a = 0.35 + drive * 0.65;
  return {
    hands: [
      reachSafe(0.10 + w * 0.34 * a, SH - 0.30 + Math.abs(w) * 0.10 * a),
      reachSafe(0.06 - w * 0.30 * a, SH - 0.26 - Math.abs(w) * 0.08 * a),
    ],
    
    feet: [[-0.30, 0], [0.28, 0]],
    
    
    
    toe: [0.16 + Math.abs(w) * 0.10, 0.14 + Math.abs(w) * 0.10],
    grip: 'open',
    twist: w * 0.55 * a,
    air: 0,
    squash: 0.94 - Math.abs(w) * 0.03,
    lean: -0.06 - drive * 0.05,
  };
}


export function deathPose(u) {
  const k = clamp(u, 0, 1);
  return {
    hands: [
      reachSafe(0.10 - k * 0.22, (SH - 0.30) * (1 - k * 0.86)),
      reachSafe(-0.04, (SH - 0.26) * (1 - k * 0.9)),
    ],
    feet: [[-0.24 - k * 0.14, 0], [0.20 + k * 0.2, 0]],
    
    
    toe: [-0.10 - k * 0.30, 0.10 + k * 0.40],
    grip: 'open',
    twist: 0.1 - k * 0.3,
    air: 0,
    squash: 1 - k * 0.42,
    lean: 0,
  };
}













export const gripOf = (pose) => ((pose && pose.grip) === 'fist'
  ? ['fist', 'fist']
  : ['open', 'open']);
















export const SETTLE_TIME = 0.65;






export const CONTACT_EPS = 0.045;






























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
