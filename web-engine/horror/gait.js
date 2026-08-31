




































const SH = 0.82;
const HIP = 0.52;

export const GAIT = Object.freeze({
  walk: {
    
    
    
    stride: 0.21,
    lift: 0.075,          
    stance: 0.62,         
                          
                          
    bob: 0.020,
    armSwing: 0.55,       
    lean: 0.04,
    twist: 0.16,
  },
  sprint: {
    stride: 0.42,
    lift: 0.155,
    
    
    
    
    stance: 0.36,
    bob: 0.052,
    armSwing: 0.85,
    lean: 0.17,           
    twist: 0.30,
  },
});

const TAU = Math.PI * 2;
const wrap = (p) => ((p % 1) + 1) % 1;









function footAt(p, cfg) {
  const t = wrap(p);
  if (t < cfg.stance) {
    
    const u = t / cfg.stance;
    return [cfg.stride * (1 - 2 * u), 0];
  }
  const u = (t - cfg.stance) / (1 - cfg.stance);
  
  
  
  const x = -cfg.stride + 2 * cfg.stride * (u * u * (3 - 2 * u));
  const y = cfg.lift * Math.sin(u ** 0.72 * Math.PI);
  return [x, y];
}






export function gaitPose(p, mode = 'walk') {
  const cfg = GAIT[mode] || GAIT.walk;
  const t = wrap(p);

  const footL = footAt(t, cfg);
  const footR = footAt(t + 0.5, cfg);

  
  
  
  const rise = -Math.cos(t * TAU * 2) * cfg.bob;

  
  
  const handX = (foot) => foot[0] * cfg.armSwing;
  
  const handY = (foot) => SH - 0.20 + rise * 0.7 + Math.abs(foot[0]) * 0.06;

  return {
    
    hands: [
      [handX(footR) + cfg.lean * 0.5, handY(footR)],
      [handX(footL) + cfg.lean * 0.5, handY(footL)],
    ],
    feet: [footL, footR],
    
    
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












export function firePose(t, base = 0.0) {
  const kick = Math.exp(-t * 14) * Math.sin(Math.min(t, 0.5) * 46);
  const raise = Math.min(1, t / 0.09);
  return {
    hands: [
      
      [0.40 * raise - kick * 0.075, SH - 0.06 + kick * 0.05 + base],
      
      [0.27 * raise - kick * 0.055, SH - 0.10 + kick * 0.04 + base],
    ],
    feet: [[-0.24, 0], [0.20, 0]],
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
      [0.10 + w * 0.34 * a, SH - 0.34 + Math.abs(w) * 0.10 * a],
      [0.06 - w * 0.30 * a, SH - 0.30 - Math.abs(w) * 0.08 * a],
    ],
    
    feet: [[-0.30, 0], [0.28, 0]],
    twist: w * 0.55 * a,
    air: 0,
    squash: 0.94 - Math.abs(w) * 0.03,
    lean: -0.06 - drive * 0.05,
  };
}


export function deathPose(u) {
  const k = Math.min(1, Math.max(0, u));
  return {
    hands: [[0.10 - k * 0.22, (SH - 0.24) * (1 - k * 0.86)], [-0.04, (SH - 0.20) * (1 - k * 0.9)]],
    feet: [[-0.24 - k * 0.14, 0], [0.20 + k * 0.2, 0]],
    twist: 0.1 - k * 0.3,
    air: 0,
    squash: 1 - k * 0.42,
    lean: 0,
  };
}
